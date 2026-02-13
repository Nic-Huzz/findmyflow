-- League Activity Feed: OG metadata, reactions, and feed RPC

-- ============================================
-- 1. Add OG metadata columns to content submissions
-- ============================================
ALTER TABLE league_content_submissions
  ADD COLUMN IF NOT EXISTS og_title TEXT,
  ADD COLUMN IF NOT EXISTS og_image TEXT,
  ADD COLUMN IF NOT EXISTS og_description TEXT;

-- ============================================
-- 2. league_content_reactions — cheers on content
-- ============================================
CREATE TABLE IF NOT EXISTS league_content_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES league_content_submissions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  reaction_type TEXT NOT NULL DEFAULT 'cheer'
    CHECK (reaction_type IN ('cheer', 'fire', 'clap', 'heart')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(submission_id, user_id, reaction_type)
);

CREATE INDEX idx_league_reactions_submission ON league_content_reactions(submission_id);
CREATE INDEX idx_league_reactions_user ON league_content_reactions(user_id);

ALTER TABLE league_content_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "league_reactions_select" ON league_content_reactions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "league_reactions_insert" ON league_content_reactions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "league_reactions_delete" ON league_content_reactions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================
-- 3. Activity feed RPC — returns mixed feed of
--    quest completions + approved content submissions
-- ============================================
CREATE OR REPLACE FUNCTION get_league_activity_feed(
  p_league_id UUID,
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  item_id UUID,
  item_type TEXT,           -- 'quest' or 'content'
  user_id UUID,
  user_name TEXT,
  team_name TEXT,
  created_at TIMESTAMPTZ,
  -- quest fields
  quest_id TEXT,
  quest_category TEXT,
  quest_points INT,
  -- content fields
  content_type TEXT,
  link_url TEXT,
  points_value INT,
  og_title TEXT,
  og_image TEXT,
  og_description TEXT,
  status TEXT,
  -- reactions summary
  reaction_counts JSONB
) AS $$
BEGIN
  -- Verify calling user is a member of this league
  IF NOT EXISTS (
    SELECT 1 FROM fantasy_team_members ftm_check
    WHERE ftm_check.league_id = p_league_id AND ftm_check.user_id = auth.uid()
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY

  -- Content submissions (approved only)
  SELECT
    cs.id AS item_id,
    'content'::TEXT AS item_type,
    cs.user_id,
    COALESCE(p.user_name, 'Player') AS user_name,
    ft.name AS team_name,
    cs.created_at,
    -- quest fields
    NULL::TEXT AS quest_id,
    NULL::TEXT AS quest_category,
    NULL::INT AS quest_points,
    -- content fields
    cs.content_type,
    cs.link_url,
    cs.points_value,
    cs.og_title,
    cs.og_image,
    cs.og_description,
    cs.status,
    -- reaction counts
    COALESCE(
      (SELECT jsonb_object_agg(r.reaction_type, r.cnt)
       FROM (
         SELECT reaction_type, COUNT(*)::INT AS cnt
         FROM league_content_reactions
         WHERE submission_id = cs.id
         GROUP BY reaction_type
       ) r),
      '{}'::JSONB
    ) AS reaction_counts
  FROM league_content_submissions cs
  JOIN fantasy_team_members ftm ON ftm.user_id = cs.user_id AND ftm.league_id = cs.league_id
  JOIN fantasy_teams ft ON ft.id = ftm.team_id
  LEFT JOIN LATERAL (
    SELECT lfp.user_name
    FROM lead_flow_profiles lfp
    WHERE lfp.user_id = cs.user_id
    ORDER BY lfp.updated_at DESC NULLS LAST
    LIMIT 1
  ) p ON true
  WHERE cs.league_id = p_league_id
    AND cs.status = 'approved'

  UNION ALL

  -- Quest completions from league members
  SELECT
    qc.id AS item_id,
    'quest'::TEXT AS item_type,
    qc.user_id,
    COALESCE(p2.user_name, 'Player') AS user_name,
    ft2.name AS team_name,
    qc.completed_at AS created_at,
    -- quest fields
    qc.quest_id,
    qc.quest_category,
    qc.points_earned AS quest_points,
    -- content fields
    NULL::TEXT AS content_type,
    NULL::TEXT AS link_url,
    NULL::INT AS points_value,
    NULL::TEXT AS og_title,
    NULL::TEXT AS og_image,
    NULL::TEXT AS og_description,
    NULL::TEXT AS status,
    -- no reactions on quests
    '{}'::JSONB AS reaction_counts
  FROM quest_completions qc
  JOIN fantasy_team_members ftm2 ON ftm2.user_id = qc.user_id AND ftm2.league_id = p_league_id
  JOIN fantasy_teams ft2 ON ft2.id = ftm2.team_id
  LEFT JOIN LATERAL (
    SELECT lfp2.user_name
    FROM lead_flow_profiles lfp2
    WHERE lfp2.user_id = qc.user_id
    ORDER BY lfp2.updated_at DESC NULLS LAST
    LIMIT 1
  ) p2 ON true
  -- Only include completions during the league window
  WHERE qc.completed_at >= (
    SELECT fl.start_date::TIMESTAMPTZ FROM fantasy_leagues fl WHERE fl.id = p_league_id
  )
  AND qc.completed_at <= COALESCE(
    (SELECT fl.end_date::TIMESTAMPTZ + INTERVAL '1 day' FROM fantasy_leagues fl WHERE fl.id = p_league_id),
    now()
  )

  ORDER BY created_at DESC
  LIMIT p_limit
  OFFSET p_offset;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
