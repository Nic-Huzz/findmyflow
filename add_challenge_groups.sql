-- Migration: Add Challenge Groups Feature
-- Description: Allows users to create and join challenge groups for competitive 7-day challenges

-- Create challenge_groups table
CREATE TABLE IF NOT EXISTS challenge_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL, -- 6-character group code (e.g., FLW7D9)
  name TEXT, -- Optional group name
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  start_date DATE DEFAULT CURRENT_DATE -- When challenge officially starts
);

-- Create challenge_participants table
CREATE TABLE IF NOT EXISTS challenge_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES challenge_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, user_id) -- A user can only join a group once
);

-- Add group_id to challenge_progress table
ALTER TABLE challenge_progress
ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES challenge_groups(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_challenge_groups_code ON challenge_groups(code);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_group ON challenge_participants(group_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_user ON challenge_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_progress_group ON challenge_progress(group_id);

-- Enable Row Level Security
ALTER TABLE challenge_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for challenge_groups
-- Anyone can read groups (to join by code)
CREATE POLICY "Anyone can read challenge groups"
  ON challenge_groups
  FOR SELECT
  USING (true);

-- Authenticated users can create groups
CREATE POLICY "Authenticated users can create groups"
  ON challenge_groups
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Creators can update their groups
CREATE POLICY "Creators can update their groups"
  ON challenge_groups
  FOR UPDATE
  USING (auth.uid() = created_by);

-- RLS Policies for challenge_participants
-- Users can read participants in groups they're part of
CREATE POLICY "Users can read participants in their groups"
  ON challenge_participants
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM challenge_participants cp
      WHERE cp.group_id = challenge_participants.group_id
      AND cp.user_id = auth.uid()
    )
  );

-- Users can join groups
CREATE POLICY "Users can join groups"
  ON challenge_participants
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can leave groups
CREATE POLICY "Users can leave groups"
  ON challenge_participants
  FOR DELETE
  USING (auth.uid() = user_id);

-- Update RLS policy for challenge_progress to include group visibility
-- Users can see progress of people in their group
DROP POLICY IF EXISTS "Users can view their own progress" ON challenge_progress;
CREATE POLICY "Users can view their own and group progress"
  ON challenge_progress
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM challenge_participants cp1
      JOIN challenge_participants cp2 ON cp1.group_id = cp2.group_id
      WHERE cp1.user_id = auth.uid()
      AND cp2.user_id = challenge_progress.user_id
      AND cp1.group_id = challenge_progress.group_id
    )
  );

-- Function to generate unique group code
CREATE OR REPLACE FUNCTION generate_group_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate 6-character code (uppercase letters and numbers)
    new_code := UPPER(
      SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 3) ||
      LPAD(FLOOR(RANDOM() * 1000)::TEXT, 3, '0')
    );

    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM challenge_groups WHERE code = new_code) INTO code_exists;

    -- Exit loop if code is unique
    EXIT WHEN NOT code_exists;
  END LOOP;

  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE challenge_groups IS 'Groups for users to compete together in 7-day challenges';
COMMENT ON TABLE challenge_participants IS 'Junction table linking users to their challenge groups';
COMMENT ON COLUMN challenge_groups.code IS 'Unique 6-character code for joining the group';
COMMENT ON COLUMN challenge_groups.start_date IS 'Date when the challenge officially starts for this group';
