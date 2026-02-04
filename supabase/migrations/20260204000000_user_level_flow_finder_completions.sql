-- User-Level Flow Finder Quest Completions
-- Makes Flow Finder (Stage 0) quest completions universal across all challenges
-- by allowing challenge_instance_id to be NULL

-- Drop the composite FK constraint that prevents NULL challenge_instance_id
-- This constraint requires challenge_instance_id to match an existing challenge_progress record
ALTER TABLE quest_completions
DROP CONSTRAINT IF EXISTS quest_completions_instance_fk;

-- Create unique index for user-level completions (prevent duplicates)
-- Users can only have one completion per quest when challenge_instance_id is NULL
CREATE UNIQUE INDEX IF NOT EXISTS idx_quest_completions_user_level_unique
  ON quest_completions(user_id, quest_id)
  WHERE challenge_instance_id IS NULL;

-- Create index for efficient user-level queries
-- Speeds up queries that fetch all user-level completions for a user
CREATE INDEX IF NOT EXISTS idx_quest_completions_user_null_instance
  ON quest_completions(user_id)
  WHERE challenge_instance_id IS NULL;
