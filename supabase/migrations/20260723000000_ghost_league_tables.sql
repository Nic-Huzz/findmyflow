-- Ghost Self League: 3 new tables replacing PvP fantasy league infrastructure
-- See docs/features/ghost-league-spec.md for full spec

-- 1. One row per user per week (created lazily on first visit)
CREATE TABLE IF NOT EXISTS ghost_weekly_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  week_start DATE NOT NULL,

  ghost_daily_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  user_daily_scores JSONB DEFAULT '{}'::jsonb,

  current_tune INT DEFAULT 0,
  current_courage INT DEFAULT 0,
  current_community INT DEFAULT 0,
  ghost_tune INT DEFAULT 0,
  ghost_courage INT DEFAULT 0,
  ghost_community INT DEFAULT 0,

  categories_won INT DEFAULT 0,
  categories_lost INT DEFAULT 0,
  result TEXT NOT NULL DEFAULT 'pending'
    CHECK (result IN ('pending', 'win', 'loss', 'draw')),

  finalized_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start)
);

ALTER TABLE ghost_weekly_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ghost_results_select" ON ghost_weekly_results
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "ghost_results_insert" ON ghost_weekly_results
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ghost_results_update" ON ghost_weekly_results
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- 2. Streak + personal bests (one row per user, upserted)
CREATE TABLE IF NOT EXISTS ghost_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  current_streak INT NOT NULL DEFAULT 0,
  longest_streak INT NOT NULL DEFAULT 0,
  consecutive_losses INT NOT NULL DEFAULT 0,
  total_wins INT NOT NULL DEFAULT 0,
  total_losses INT NOT NULL DEFAULT 0,
  total_draws INT NOT NULL DEFAULT 0,
  last_result TEXT,
  last_result_at DATE,
  pb_tune INT DEFAULT 0,
  pb_courage INT DEFAULT 0,
  pb_community INT DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE ghost_streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ghost_streaks_select" ON ghost_streaks
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "ghost_streaks_insert" ON ghost_streaks
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ghost_streaks_update" ON ghost_streaks
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- 3. Community content submissions (decoupled from league infrastructure)
-- Old league_content_submissions has NOT NULL FKs to fantasy_leagues/fantasy_teams.
-- This table stores the same data without league dependencies.
-- If reverting to PvP, keep this table and union with league_content_submissions.
CREATE TABLE IF NOT EXISTS ghost_content_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  week_start DATE NOT NULL,
  content_type TEXT NOT NULL,
  points_value INT NOT NULL DEFAULT 0,
  link_url TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE ghost_content_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ghost_content_select" ON ghost_content_submissions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "ghost_content_insert" ON ghost_content_submissions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
