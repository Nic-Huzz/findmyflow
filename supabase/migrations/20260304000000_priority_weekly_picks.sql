-- Priority Weekly Picks
-- Stores user's weekly quest/challenge selections for the Priority tab.
-- Each row = one picked item for one week.

CREATE TABLE IF NOT EXISTS priority_weekly_picks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  pick_type TEXT NOT NULL CHECK (pick_type IN ('groan', 'play_profile', 'daily_healing', 'weekly_healing')),
  reference_id TEXT NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, week_start_date, pick_type, reference_id)
);

CREATE INDEX idx_priority_weekly_picks_user_week
  ON priority_weekly_picks(user_id, week_start_date);

ALTER TABLE priority_weekly_picks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own picks" ON priority_weekly_picks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own picks" ON priority_weekly_picks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own picks" ON priority_weekly_picks
  FOR DELETE USING (auth.uid() = user_id);
