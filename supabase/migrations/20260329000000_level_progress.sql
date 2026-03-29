-- Level Progress System
-- Tracks user progress through the 8-level journey

-- Enable moddatetime if not already enabled
CREATE EXTENSION IF NOT EXISTS moddatetime SCHEMA extensions;

-- User Level Progress
CREATE TABLE IF NOT EXISTS user_level_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_level INTEGER NOT NULL DEFAULT 1,

  -- Zone diagnosis
  zone_diagnosis_zone TEXT, -- top_left, diagonal, bottom_right
  zone_diagnosis_boss TEXT, -- the protective voice identified

  -- Completion flags
  deep_dive_completed BOOLEAN DEFAULT FALSE,
  boss_fight_completed BOOLEAN DEFAULT FALSE,
  milestone_completed BOOLEAN DEFAULT FALSE,

  -- Progress tracking (JSONB arrays for deduplication)
  healing_day_dates JSONB DEFAULT '[]', -- array of ISO date strings, prevents double-counting
  courage_challenge_ids JSONB DEFAULT '[]', -- array of challenge UUIDs that counted

  -- Boss fight challenge reference (self-set challenge from post-session Q8)
  boss_fight_challenge_id UUID,

  -- Graduation
  graduated_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, current_level) -- one row per user per level = history preserved
);

-- Boss Fight Sessions
CREATE TABLE IF NOT EXISTS boss_fight_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  level_number INTEGER NOT NULL,

  -- Pre-session questions
  pre_action_scene TEXT,
  pre_tension_score INTEGER CHECK (pre_tension_score BETWEEN 1 AND 10),
  pre_boss_prediction TEXT,

  -- Post-session questions
  post_wound_age TEXT,
  post_body_location TEXT,
  post_tension_score INTEGER CHECK (post_tension_score BETWEEN 1 AND 10),
  post_child_need TEXT,
  post_challenge_text TEXT,

  -- Session metadata
  session_transcript_url TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add current_journey_level to user_stage_progress if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_stage_progress' AND column_name = 'current_journey_level'
  ) THEN
    ALTER TABLE user_stage_progress ADD COLUMN current_journey_level INTEGER DEFAULT 1;
  END IF;
END $$;

-- RLS Policies for user_level_progress
ALTER TABLE user_level_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own level progress"
  ON user_level_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own level progress"
  ON user_level_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own level progress"
  ON user_level_progress FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for boss_fight_sessions
ALTER TABLE boss_fight_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own boss fight sessions"
  ON boss_fight_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own boss fight sessions"
  ON boss_fight_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own boss fight sessions"
  ON boss_fight_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Auto-update triggers
CREATE TRIGGER set_user_level_progress_updated_at
  BEFORE UPDATE ON user_level_progress
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER set_boss_fight_sessions_updated_at
  BEFORE UPDATE ON boss_fight_sessions
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
