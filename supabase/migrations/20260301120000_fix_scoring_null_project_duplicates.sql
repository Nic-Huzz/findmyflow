-- Fix duplicate scoring rows caused by NULL project_id
-- PostgreSQL UNIQUE constraints don't treat NULL = NULL,
-- so UNIQUE(user_id, project_id, week_start_date) allows duplicates
-- when project_id IS NULL. Same issue for user_lifetime_scores.
--
-- Fix: merge duplicates, drop old constraint, add COALESCE-based unique index.
-- Created: 2026-03-01

-- ============================================================================
-- STEP 1: Fix challenge_weekly_scores duplicates
-- ============================================================================

-- Merge duplicate NULL-project rows: keep the oldest, sum scores into it
WITH dupes AS (
  SELECT user_id, week_start_date,
         array_agg(id ORDER BY created_at ASC) AS ids,
         sum(business_score) AS total_biz,
         sum(healing_score) AS total_heal,
         sum(courage_score) AS total_courage
  FROM challenge_weekly_scores
  WHERE project_id IS NULL
  GROUP BY user_id, week_start_date
  HAVING count(*) > 1
),
keeper AS (
  UPDATE challenge_weekly_scores cws
  SET business_score = d.total_biz,
      healing_score  = d.total_heal,
      courage_score  = d.total_courage,
      updated_at     = NOW()
  FROM dupes d
  WHERE cws.id = d.ids[1]  -- keep the oldest row
  RETURNING cws.id, d.ids
)
DELETE FROM challenge_weekly_scores
WHERE id IN (
  SELECT unnest(ids[2:]) FROM keeper
);

-- Drop the old constraint that doesn't handle NULLs
ALTER TABLE challenge_weekly_scores
  DROP CONSTRAINT IF EXISTS challenge_weekly_scores_user_id_project_id_week_start_date_key;

-- Add a proper unique index using COALESCE for NULL project_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_weekly_scores_unique_user_project_week
  ON challenge_weekly_scores (
    user_id,
    COALESCE(project_id, '00000000-0000-0000-0000-000000000000'::uuid),
    week_start_date
  );

-- ============================================================================
-- STEP 2: Fix user_lifetime_scores duplicates
-- ============================================================================

-- Merge duplicate NULL-project rows
WITH dupes AS (
  SELECT user_id,
         array_agg(id ORDER BY created_at ASC) AS ids,
         sum(lifetime_business_score) AS total_biz,
         sum(lifetime_healing_score) AS total_heal,
         sum(lifetime_courage_score) AS total_courage,
         sum(lifetime_total_score) AS total_all,
         max(weeks_completed) AS max_weeks,
         max(best_week_total) AS max_best_week,
         max(best_week_date) AS max_best_date
  FROM user_lifetime_scores
  WHERE project_id IS NULL
  GROUP BY user_id
  HAVING count(*) > 1
),
keeper AS (
  UPDATE user_lifetime_scores uls
  SET lifetime_business_score = d.total_biz,
      lifetime_healing_score  = d.total_heal,
      lifetime_courage_score  = d.total_courage,
      lifetime_total_score    = d.total_all,
      weeks_completed         = d.max_weeks,
      best_week_total         = d.max_best_week,
      best_week_date          = d.max_best_date,
      updated_at              = NOW()
  FROM dupes d
  WHERE uls.id = d.ids[1]
  RETURNING uls.id, d.ids
)
DELETE FROM user_lifetime_scores
WHERE id IN (
  SELECT unnest(ids[2:]) FROM keeper
);

-- Drop the old constraint
ALTER TABLE user_lifetime_scores
  DROP CONSTRAINT IF EXISTS user_lifetime_scores_user_id_project_id_key;

-- Add proper unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_lifetime_scores_unique_user_project
  ON user_lifetime_scores (
    user_id,
    COALESCE(project_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );

-- ============================================================================
-- STEP 3: Update increment_scores RPC to use proper upsert
-- ============================================================================

-- The fixed RPC uses INSERT ... ON CONFLICT with the new index expressions
-- and eliminates the race condition from check-then-insert

DROP FUNCTION IF EXISTS increment_scores(UUID, UUID, TEXT, INTEGER, DATE);

CREATE OR REPLACE FUNCTION increment_scores(
  p_user_id UUID,
  p_project_id UUID,
  p_category TEXT,
  p_points INTEGER,
  p_week_start DATE DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_week_start DATE;
  v_weekly_record challenge_weekly_scores%ROWTYPE;
  v_lifetime_record user_lifetime_scores%ROWTYPE;
  v_safe_project UUID;
BEGIN
  IF p_week_start IS NOT NULL THEN
    v_week_start := p_week_start;
  ELSE
    v_week_start := date_trunc('week', CURRENT_DATE)::DATE;
  END IF;

  -- Coalesce for unique index matching
  v_safe_project := COALESCE(p_project_id, '00000000-0000-0000-0000-000000000000'::uuid);

  -- Validate category
  IF p_category NOT IN ('business', 'healing', 'courage') THEN
    RAISE EXCEPTION 'Invalid category: %. Must be business, healing, or courage', p_category;
  END IF;

  -- ========================================
  -- Upsert Weekly Scores (race-condition-free)
  -- ========================================
  INSERT INTO challenge_weekly_scores (user_id, project_id, week_start_date, business_score, healing_score, courage_score)
  VALUES (p_user_id, p_project_id, v_week_start, 0, 0, 0)
  ON CONFLICT (user_id, COALESCE(project_id, '00000000-0000-0000-0000-000000000000'::uuid), week_start_date)
  DO NOTHING;

  -- Update the appropriate category
  IF p_category = 'business' THEN
    UPDATE challenge_weekly_scores
    SET business_score = business_score + p_points, updated_at = NOW()
    WHERE user_id = p_user_id
      AND COALESCE(project_id, '00000000-0000-0000-0000-000000000000'::uuid) = v_safe_project
      AND week_start_date = v_week_start
    RETURNING * INTO v_weekly_record;
  ELSIF p_category = 'healing' THEN
    UPDATE challenge_weekly_scores
    SET healing_score = healing_score + p_points, updated_at = NOW()
    WHERE user_id = p_user_id
      AND COALESCE(project_id, '00000000-0000-0000-0000-000000000000'::uuid) = v_safe_project
      AND week_start_date = v_week_start
    RETURNING * INTO v_weekly_record;
  ELSIF p_category = 'courage' THEN
    UPDATE challenge_weekly_scores
    SET courage_score = courage_score + p_points, updated_at = NOW()
    WHERE user_id = p_user_id
      AND COALESCE(project_id, '00000000-0000-0000-0000-000000000000'::uuid) = v_safe_project
      AND week_start_date = v_week_start
    RETURNING * INTO v_weekly_record;
  END IF;

  -- ========================================
  -- Upsert Lifetime Scores (race-condition-free)
  -- ========================================
  INSERT INTO user_lifetime_scores (user_id, project_id)
  VALUES (p_user_id, p_project_id)
  ON CONFLICT (user_id, COALESCE(project_id, '00000000-0000-0000-0000-000000000000'::uuid))
  DO NOTHING;

  -- Update lifetime totals
  IF p_category = 'business' THEN
    UPDATE user_lifetime_scores
    SET lifetime_business_score = lifetime_business_score + p_points,
        lifetime_total_score = lifetime_total_score + p_points,
        updated_at = NOW()
    WHERE user_id = p_user_id
      AND COALESCE(project_id, '00000000-0000-0000-0000-000000000000'::uuid) = v_safe_project
    RETURNING * INTO v_lifetime_record;
  ELSIF p_category = 'healing' THEN
    UPDATE user_lifetime_scores
    SET lifetime_healing_score = lifetime_healing_score + p_points,
        lifetime_total_score = lifetime_total_score + p_points,
        updated_at = NOW()
    WHERE user_id = p_user_id
      AND COALESCE(project_id, '00000000-0000-0000-0000-000000000000'::uuid) = v_safe_project
    RETURNING * INTO v_lifetime_record;
  ELSIF p_category = 'courage' THEN
    UPDATE user_lifetime_scores
    SET lifetime_courage_score = lifetime_courage_score + p_points,
        lifetime_total_score = lifetime_total_score + p_points,
        updated_at = NOW()
    WHERE user_id = p_user_id
      AND COALESCE(project_id, '00000000-0000-0000-0000-000000000000'::uuid) = v_safe_project
    RETURNING * INTO v_lifetime_record;
  END IF;

  RETURN json_build_object(
    'weekly', json_build_object(
      'business_score', COALESCE(v_weekly_record.business_score, 0),
      'healing_score', COALESCE(v_weekly_record.healing_score, 0),
      'courage_score', COALESCE(v_weekly_record.courage_score, 0),
      'total', COALESCE(v_weekly_record.business_score, 0) + COALESCE(v_weekly_record.healing_score, 0) + COALESCE(v_weekly_record.courage_score, 0)
    ),
    'lifetime', json_build_object(
      'business_score', COALESCE(v_lifetime_record.lifetime_business_score, 0),
      'healing_score', COALESCE(v_lifetime_record.lifetime_healing_score, 0),
      'courage_score', COALESCE(v_lifetime_record.lifetime_courage_score, 0),
      'total', COALESCE(v_lifetime_record.lifetime_total_score, 0)
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION increment_scores IS 'Atomically increments weekly and lifetime scores. Uses COALESCE unique indexes to handle NULL project_id correctly. Race-condition-free.';
