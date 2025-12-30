-- Weekly Plans table for the auto-rolling weekly challenge system
-- Stores user's weekly intentions, routines, and planned activities

CREATE TABLE IF NOT EXISTS weekly_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL, -- Monday of the week
  week_type TEXT CHECK (week_type IN ('push', 'flow', 'rest', 'launch')),
  morning_routine TEXT[], -- Array of quest IDs
  weekly_groan_description TEXT,
  weekly_groan_day TEXT CHECK (weekly_groan_day IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')),
  weekly_groan_completed BOOLEAN DEFAULT FALSE,
  big_release_practice TEXT,
  big_release_day TEXT CHECK (big_release_day IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')),
  three_percent_improvement TEXT,
  foundation_reminder BOOLEAN DEFAULT FALSE, -- If they said "I'll do it this week" for NS/Healing Compass
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, week_start)
);

-- Enable RLS
ALTER TABLE weekly_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own weekly plans"
  ON weekly_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own weekly plans"
  ON weekly_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own weekly plans"
  ON weekly_plans FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own weekly plans"
  ON weekly_plans FOR DELETE
  USING (auth.uid() = user_id);

-- Index for efficient lookups
CREATE INDEX idx_weekly_plans_user_week ON weekly_plans(user_id, week_start);

-- Add comment
COMMENT ON TABLE weekly_plans IS 'Stores weekly intentions and planned activities for the auto-rolling challenge system';
