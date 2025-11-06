-- Migration: Add Challenge Instances Support
-- Description: Allow users to play multiple challenges and track their history

-- Add status and instance tracking to challenge_progress
ALTER TABLE challenge_progress
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
ADD COLUMN IF NOT EXISTS challenge_instance_id UUID DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Remove any unique constraint on user_id (if it exists)
-- This allows multiple challenge records per user
ALTER TABLE challenge_progress
DROP CONSTRAINT IF EXISTS challenge_progress_user_id_key;

-- Add unique constraint on (user_id, challenge_instance_id)
-- This ensures each user can only have one record per challenge instance
ALTER TABLE challenge_progress
ADD CONSTRAINT challenge_progress_user_instance_unique
UNIQUE (user_id, challenge_instance_id);

-- Add challenge_instance_id to quest_completions to link completions to specific challenges
ALTER TABLE quest_completions
ADD COLUMN IF NOT EXISTS challenge_instance_id UUID;

-- Add foreign key to link quest completions to challenge instances
ALTER TABLE quest_completions
ADD CONSTRAINT quest_completions_instance_fk
FOREIGN KEY (user_id, challenge_instance_id)
REFERENCES challenge_progress(user_id, challenge_instance_id)
ON DELETE CASCADE;

-- Create index for faster queries on active challenges
CREATE INDEX IF NOT EXISTS idx_challenge_progress_user_status
ON challenge_progress(user_id, status)
WHERE status = 'active';

-- Create index for challenge instances
CREATE INDEX IF NOT EXISTS idx_challenge_progress_instance
ON challenge_progress(challenge_instance_id);

-- Create index for quest completions by instance
CREATE INDEX IF NOT EXISTS idx_quest_completions_instance
ON quest_completions(challenge_instance_id);

-- Function to get user's active challenge
CREATE OR REPLACE FUNCTION get_active_challenge(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  session_id TEXT,
  group_id UUID,
  challenge_instance_id UUID,
  current_day INTEGER,
  total_points INTEGER,
  challenge_start_date TIMESTAMP WITH TIME ZONE,
  last_active_date TIMESTAMP WITH TIME ZONE,
  status TEXT,
  recognise_daily_points INTEGER,
  recognise_weekly_points INTEGER,
  release_daily_points INTEGER,
  release_weekly_points INTEGER,
  rewire_daily_points INTEGER,
  rewire_weekly_points INTEGER,
  reconnect_daily_points INTEGER,
  reconnect_weekly_points INTEGER,
  essence_boat_unlocked BOOLEAN,
  captains_hat_unlocked BOOLEAN,
  treasure_map_unlocked BOOLEAN,
  sailing_sails_unlocked BOOLEAN,
  completed_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT cp.*
  FROM challenge_progress cp
  WHERE cp.user_id = p_user_id
    AND cp.status = 'active'
  ORDER BY cp.challenge_start_date DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to complete a challenge (when reaching day 7 or user wants to start fresh)
CREATE OR REPLACE FUNCTION complete_challenge(p_user_id UUID, p_instance_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE challenge_progress
  SET status = 'completed',
      completed_at = NOW()
  WHERE user_id = p_user_id
    AND challenge_instance_id = p_instance_id
    AND status = 'active';
END;
$$ LANGUAGE plpgsql;

-- Function to abandon a challenge (when user starts a new one before finishing)
CREATE OR REPLACE FUNCTION abandon_active_challenges(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE challenge_progress
  SET status = 'abandoned',
      completed_at = NOW()
  WHERE user_id = p_user_id
    AND status = 'active';
END;
$$ LANGUAGE plpgsql;

-- Update RLS policies to work with multiple challenge instances
DROP POLICY IF EXISTS "Users can view their own and group progress" ON challenge_progress;

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

-- Comments for documentation
COMMENT ON COLUMN challenge_progress.status IS 'Challenge status: active, completed, or abandoned';
COMMENT ON COLUMN challenge_progress.challenge_instance_id IS 'Unique identifier for this challenge instance, allows users to play multiple times';
COMMENT ON COLUMN challenge_progress.completed_at IS 'Timestamp when the challenge was completed or abandoned';
COMMENT ON COLUMN quest_completions.challenge_instance_id IS 'Links this completion to a specific challenge instance';
