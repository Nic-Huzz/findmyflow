-- Journey Onboarding: Store wound stage selections from the 4-beat story onboarding
--
-- Stores the user's scene selections from the wound stage walk-through.
-- Each row represents one wound stage selection (4 per user, one per stage).

CREATE TABLE IF NOT EXISTS journey_onboarding_selections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stage_id TEXT NOT NULL,          -- 'stage1', 'stage2', 'stage3', 'stage3_5'
  scene_id TEXT NOT NULL,          -- e.g. 'overwhelmed_child', 'adapted_self'
  zone TEXT NOT NULL,              -- 'top_left', 'diagonal', 'bottom_right'
  archetype TEXT,                  -- 'sympathetic', 'ventral', 'dorsal'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, stage_id)
);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_journey_onboarding_user
  ON journey_onboarding_selections(user_id);

-- Add avatar_url column to user_stage_progress for the hero avatar
ALTER TABLE user_stage_progress
  ADD COLUMN IF NOT EXISTS hero_avatar_url TEXT;

-- Add journey_onboarding_completed flag
ALTER TABLE user_stage_progress
  ADD COLUMN IF NOT EXISTS journey_onboarding_completed BOOLEAN DEFAULT FALSE;

-- Auto-update updated_at on row changes
CREATE EXTENSION IF NOT EXISTS moddatetime SCHEMA extensions;

CREATE TRIGGER set_journey_onboarding_updated_at
  BEFORE UPDATE ON journey_onboarding_selections
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- RLS policies
ALTER TABLE journey_onboarding_selections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own journey selections"
  ON journey_onboarding_selections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own journey selections"
  ON journey_onboarding_selections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journey selections"
  ON journey_onboarding_selections FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
