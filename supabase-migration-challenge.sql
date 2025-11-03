-- 7-Day Challenge Database Tables Migration
-- Run this in your Supabase SQL editor

-- Create challenge_progress table
CREATE TABLE IF NOT EXISTS challenge_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,
  current_day INTEGER DEFAULT 1,
  challenge_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_points INTEGER DEFAULT 0,

  -- Points by category
  recognise_daily_points INTEGER DEFAULT 0,
  recognise_weekly_points INTEGER DEFAULT 0,
  release_daily_points INTEGER DEFAULT 0,
  release_weekly_points INTEGER DEFAULT 0,
  rewire_daily_points INTEGER DEFAULT 0,
  rewire_weekly_points INTEGER DEFAULT 0,
  reconnect_daily_points INTEGER DEFAULT 0,
  reconnect_weekly_points INTEGER DEFAULT 0,

  -- Artifact tracking
  essence_boat_unlocked BOOLEAN DEFAULT FALSE,
  captains_hat_unlocked BOOLEAN DEFAULT FALSE,
  treasure_map_unlocked BOOLEAN DEFAULT FALSE,
  sailing_sails_unlocked BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id)
);

-- Create quest_completions table
CREATE TABLE IF NOT EXISTS quest_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  quest_id TEXT NOT NULL,
  quest_category TEXT NOT NULL,
  quest_type TEXT NOT NULL,
  points_earned INTEGER NOT NULL,
  reflection_text TEXT,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  challenge_day INTEGER NOT NULL,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_challenge_progress_user_id ON challenge_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_quest_completions_user_id ON quest_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_quest_completions_quest_id ON quest_completions(quest_id);
CREATE INDEX IF NOT EXISTS idx_quest_completions_completed_at ON quest_completions(completed_at);

-- Enable Row Level Security
ALTER TABLE challenge_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE quest_completions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for challenge_progress
CREATE POLICY "Users can view their own challenge progress"
  ON challenge_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own challenge progress"
  ON challenge_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own challenge progress"
  ON challenge_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- Create RLS policies for quest_completions
CREATE POLICY "Users can view their own quest completions"
  ON quest_completions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quest completions"
  ON quest_completions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_challenge_progress_updated_at
  BEFORE UPDATE ON challenge_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions (adjust as needed for your Supabase setup)
GRANT ALL ON challenge_progress TO authenticated;
GRANT ALL ON quest_completions TO authenticated;
GRANT ALL ON challenge_progress TO anon;
GRANT ALL ON quest_completions TO anon;
