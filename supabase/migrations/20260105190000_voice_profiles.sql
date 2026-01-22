-- Voice Profiles Table
-- Stores user voice profiles for AI content generation
-- Referenced by: voice_feedback, content_history

-- Create table if not exists
CREATE TABLE IF NOT EXISTS voice_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns if missing (handles existing table case)
ALTER TABLE voice_profiles ADD COLUMN IF NOT EXISTS voice_name TEXT NOT NULL DEFAULT 'My Voice';
ALTER TABLE voice_profiles ADD COLUMN IF NOT EXISTS voice_summary TEXT;
ALTER TABLE voice_profiles ADD COLUMN IF NOT EXISTS base_template TEXT;
ALTER TABLE voice_profiles ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT false;
ALTER TABLE voice_profiles ADD COLUMN IF NOT EXISTS sentence_length INTEGER DEFAULT 50;
ALTER TABLE voice_profiles ADD COLUMN IF NOT EXISTS emoji_usage INTEGER DEFAULT 30;
ALTER TABLE voice_profiles ADD COLUMN IF NOT EXISTS humor_level INTEGER DEFAULT 45;
ALTER TABLE voice_profiles ADD COLUMN IF NOT EXISTS formality_level INTEGER DEFAULT 50;
ALTER TABLE voice_profiles ADD COLUMN IF NOT EXISTS vulnerability_level INTEGER DEFAULT 50;
ALTER TABLE voice_profiles ADD COLUMN IF NOT EXISTS detected_patterns JSONB DEFAULT '{}';
ALTER TABLE voice_profiles ADD COLUMN IF NOT EXISTS catchphrases TEXT[] DEFAULT '{}';
ALTER TABLE voice_profiles ADD COLUMN IF NOT EXISTS content_samples TEXT[] DEFAULT '{}';
ALTER TABLE voice_profiles ADD COLUMN IF NOT EXISTS origin_story TEXT;
ALTER TABLE voice_profiles ADD COLUMN IF NOT EXISTS extraction_confidence FLOAT;

-- Add unique constraint if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_user_voice_profile'
  ) THEN
    ALTER TABLE voice_profiles ADD CONSTRAINT unique_user_voice_profile UNIQUE(user_id);
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_voice_profiles_user ON voice_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_profiles_template ON voice_profiles(base_template) WHERE base_template IS NOT NULL;

-- RLS Policies
ALTER TABLE voice_profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- Drop existing policies first to avoid conflicts
  DROP POLICY IF EXISTS "Users can view own voice profile" ON voice_profiles;
  DROP POLICY IF EXISTS "Users can insert own voice profile" ON voice_profiles;
  DROP POLICY IF EXISTS "Users can update own voice profile" ON voice_profiles;
  DROP POLICY IF EXISTS "Users can delete own voice profile" ON voice_profiles;
END $$;

DO $$ BEGIN
CREATE POLICY "Users can view own voice profile"
  ON voice_profiles FOR SELECT
  USING (auth.uid() = user_id);

DO $$ BEGIN
CREATE POLICY "Users can insert own voice profile"
  ON voice_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DO $$ BEGIN
CREATE POLICY "Users can update own voice profile"
  ON voice_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DO $$ BEGIN
CREATE POLICY "Users can delete own voice profile"
  ON voice_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- Update trigger
CREATE OR REPLACE FUNCTION update_voice_profile_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS voice_profile_updated ON voice_profiles;
CREATE TRIGGER voice_profile_updated
  BEFORE UPDATE ON voice_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_voice_profile_timestamp();

COMMENT ON TABLE voice_profiles IS 'User voice profiles for personalized AI content generation';
