-- Scoring System Refactor Migration
-- Created: January 25, 2025
-- See: docs/scoring-system-refactor.md
--
-- This migration creates the new category-based scoring system:
-- - challenge_weekly_scores: Weekly scores per category (resets each Monday)
-- - user_lifetime_scores: Cumulative all-time scores
-- - increment_scores RPC: Atomic function to update both tables

-- ============================================================================
-- STEP 1: Create challenge_weekly_scores table
-- ============================================================================

CREATE TABLE IF NOT EXISTS challenge_weekly_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES user_projects(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,  -- Monday of the week

  -- Category Scores (reset weekly)
  business_score INTEGER DEFAULT 0,
  healing_score INTEGER DEFAULT 0,
  courage_score INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: one row per user/project/week
  UNIQUE(user_id, project_id, week_start_date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_weekly_scores_week
  ON challenge_weekly_scores(week_start_date);
CREATE INDEX IF NOT EXISTS idx_weekly_scores_user
  ON challenge_weekly_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_scores_user_week
  ON challenge_weekly_scores(user_id, week_start_date);

-- RLS Policies
ALTER TABLE challenge_weekly_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all weekly scores"
  ON challenge_weekly_scores FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own weekly scores"
  ON challenge_weekly_scores FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own weekly scores"
  ON challenge_weekly_scores FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- STEP 2: Create user_lifetime_scores table
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_lifetime_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES user_projects(id) ON DELETE CASCADE,

  -- Lifetime Category Totals (never reset)
  lifetime_business_score INTEGER DEFAULT 0,
  lifetime_healing_score INTEGER DEFAULT 0,
  lifetime_courage_score INTEGER DEFAULT 0,
  lifetime_total_score INTEGER DEFAULT 0,

  -- Achievement Tracking
  weeks_completed INTEGER DEFAULT 0,
  best_week_total INTEGER DEFAULT 0,
  best_week_date DATE,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: one row per user/project
  UNIQUE(user_id, project_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lifetime_scores_user
  ON user_lifetime_scores(user_id);

-- RLS Policies
ALTER TABLE user_lifetime_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all lifetime scores"
  ON user_lifetime_scores FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own lifetime scores"
  ON user_lifetime_scores FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own lifetime scores"
  ON user_lifetime_scores FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- STEP 3: Create increment_scores RPC function
-- ============================================================================

CREATE OR REPLACE FUNCTION increment_scores(
  p_user_id UUID,
  p_project_id UUID,
  p_category TEXT,  -- 'business', 'healing', or 'courage'
  p_points INTEGER
)
RETURNS JSON AS $$
DECLARE
  v_week_start DATE;
  v_weekly_record challenge_weekly_scores%ROWTYPE;
  v_lifetime_record user_lifetime_scores%ROWTYPE;
BEGIN
  -- Calculate Monday of current week (ISO week starts on Monday)
  v_week_start := date_trunc('week', CURRENT_DATE)::DATE;

  -- ========================================
  -- Update Weekly Scores
  -- ========================================

  -- Upsert weekly score record
  INSERT INTO challenge_weekly_scores (user_id, project_id, week_start_date, business_score, healing_score, courage_score)
  VALUES (p_user_id, p_project_id, v_week_start, 0, 0, 0)
  ON CONFLICT (user_id, project_id, week_start_date) DO NOTHING;

  -- Update the appropriate category
  IF p_category = 'business' THEN
    UPDATE challenge_weekly_scores
    SET business_score = business_score + p_points, updated_at = NOW()
    WHERE user_id = p_user_id
      AND (project_id = p_project_id OR (project_id IS NULL AND p_project_id IS NULL))
      AND week_start_date = v_week_start
    RETURNING * INTO v_weekly_record;
  ELSIF p_category = 'healing' THEN
    UPDATE challenge_weekly_scores
    SET healing_score = healing_score + p_points, updated_at = NOW()
    WHERE user_id = p_user_id
      AND (project_id = p_project_id OR (project_id IS NULL AND p_project_id IS NULL))
      AND week_start_date = v_week_start
    RETURNING * INTO v_weekly_record;
  ELSIF p_category = 'courage' THEN
    UPDATE challenge_weekly_scores
    SET courage_score = courage_score + p_points, updated_at = NOW()
    WHERE user_id = p_user_id
      AND (project_id = p_project_id OR (project_id IS NULL AND p_project_id IS NULL))
      AND week_start_date = v_week_start
    RETURNING * INTO v_weekly_record;
  ELSE
    RAISE EXCEPTION 'Invalid category: %. Must be business, healing, or courage', p_category;
  END IF;

  -- ========================================
  -- Update Lifetime Scores
  -- ========================================

  -- Upsert lifetime score record
  INSERT INTO user_lifetime_scores (user_id, project_id)
  VALUES (p_user_id, p_project_id)
  ON CONFLICT (user_id, project_id) DO NOTHING;

  -- Update lifetime totals
  IF p_category = 'business' THEN
    UPDATE user_lifetime_scores
    SET lifetime_business_score = lifetime_business_score + p_points,
        lifetime_total_score = lifetime_total_score + p_points,
        updated_at = NOW()
    WHERE user_id = p_user_id
      AND (project_id = p_project_id OR (project_id IS NULL AND p_project_id IS NULL))
    RETURNING * INTO v_lifetime_record;
  ELSIF p_category = 'healing' THEN
    UPDATE user_lifetime_scores
    SET lifetime_healing_score = lifetime_healing_score + p_points,
        lifetime_total_score = lifetime_total_score + p_points,
        updated_at = NOW()
    WHERE user_id = p_user_id
      AND (project_id = p_project_id OR (project_id IS NULL AND p_project_id IS NULL))
    RETURNING * INTO v_lifetime_record;
  ELSIF p_category = 'courage' THEN
    UPDATE user_lifetime_scores
    SET lifetime_courage_score = lifetime_courage_score + p_points,
        lifetime_total_score = lifetime_total_score + p_points,
        updated_at = NOW()
    WHERE user_id = p_user_id
      AND (project_id = p_project_id OR (project_id IS NULL AND p_project_id IS NULL))
    RETURNING * INTO v_lifetime_record;
  END IF;

  -- Return the updated scores
  RETURN json_build_object(
    'weekly', json_build_object(
      'business_score', v_weekly_record.business_score,
      'healing_score', v_weekly_record.healing_score,
      'courage_score', v_weekly_record.courage_score,
      'total', v_weekly_record.business_score + v_weekly_record.healing_score + v_weekly_record.courage_score
    ),
    'lifetime', json_build_object(
      'business_score', v_lifetime_record.lifetime_business_score,
      'healing_score', v_lifetime_record.lifetime_healing_score,
      'courage_score', v_lifetime_record.lifetime_courage_score,
      'total', v_lifetime_record.lifetime_total_score
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 4: Create helper function to get current week start
-- ============================================================================

CREATE OR REPLACE FUNCTION get_current_week_start()
RETURNS DATE AS $$
BEGIN
  RETURN date_trunc('week', CURRENT_DATE)::DATE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- STEP 5: Create view for leaderboard (total score ranking)
-- ============================================================================

CREATE OR REPLACE VIEW weekly_leaderboard AS
SELECT
  cws.user_id,
  cws.project_id,
  cws.week_start_date,
  cws.business_score,
  cws.healing_score,
  cws.courage_score,
  (cws.business_score + cws.healing_score + cws.courage_score) as total_score,
  lfp.user_name as display_name
FROM challenge_weekly_scores cws
LEFT JOIN lead_flow_profiles lfp ON lfp.user_id = cws.user_id
ORDER BY (cws.business_score + cws.healing_score + cws.courage_score) DESC;

-- Grant access to the view
GRANT SELECT ON weekly_leaderboard TO authenticated;

-- ============================================================================
-- STEP 6: Add comments for documentation
-- ============================================================================

COMMENT ON TABLE challenge_weekly_scores IS 'Weekly challenge scores per category. Resets each Monday. See docs/scoring-system-refactor.md';
COMMENT ON TABLE user_lifetime_scores IS 'Cumulative lifetime scores per category. Never resets. See docs/scoring-system-refactor.md';
COMMENT ON FUNCTION increment_scores IS 'Atomically increments both weekly and lifetime scores for a category. Returns updated scores as JSON.';

COMMENT ON COLUMN challenge_weekly_scores.business_score IS 'Points from Business and Flow Finder quests this week';
COMMENT ON COLUMN challenge_weekly_scores.healing_score IS 'Points from Healing and Tracker quests this week';
COMMENT ON COLUMN challenge_weekly_scores.courage_score IS 'Points from Groans quests this week';
