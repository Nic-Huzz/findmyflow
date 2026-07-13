-- Recovery skill: count drain→bounce pairs within 3 days
CREATE OR REPLACE FUNCTION compute_recovery_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
SECURITY INVOKER
STABLE
AS $$
  WITH drain_events AS (
    SELECT created_at AS drain_at
    FROM nervous_system_checkins
    WHERE user_id = p_user_id
      AND checkin_type = 'drain'
      AND after_state IN ('sympathetic', 'dorsal')
  ),
  recovery_events AS (
    SELECT d.drain_at, MIN(r.created_at) AS recovery_at
    FROM drain_events d
    JOIN nervous_system_checkins r
      ON r.user_id = p_user_id
      AND r.created_at > d.drain_at
      AND r.created_at <= d.drain_at + interval '3 days'
      AND r.before_state IN ('ventral', 'vibe_rise')
      AND r.checkin_type = 'daily'
    GROUP BY d.drain_at
  )
  SELECT COALESCE(COUNT(*)::integer, 0) FROM recovery_events;
$$;

-- Curiosity skill: count distinct quests with at least 1 completed wahoo linked
CREATE OR REPLACE FUNCTION compute_curiosity_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
SECURITY INVOKER
STABLE
AS $$
  SELECT COALESCE(COUNT(DISTINCT qt.quest_id)::integer, 0)
  FROM quest_tasks qt
  JOIN groan_challenges gc ON gc.id = qt.groan_challenge_id
  WHERE qt.user_id = p_user_id
    AND gc.status = 'completed'
    AND qt.groan_challenge_id IS NOT NULL;
$$;

-- Performance index for recovery self-join
CREATE INDEX IF NOT EXISTS idx_nsc_drain_recovery
  ON nervous_system_checkins(user_id, checkin_type, after_state, created_at);
