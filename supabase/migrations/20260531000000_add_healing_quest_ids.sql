-- Add healing_quest_ids to user_level_progress
-- Tracks weekly healing quest completions per level (mirrors courage_challenge_ids)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_level_progress' AND column_name = 'healing_quest_ids'
  ) THEN
    ALTER TABLE user_level_progress ADD COLUMN healing_quest_ids JSONB DEFAULT '[]';
  END IF;
END $$;
