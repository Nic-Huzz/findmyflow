-- Add response_data JSONB column to quest_completions
-- Purpose: Store structured response data from flow-based quests
-- (Shadow Work, future healing quests)
ALTER TABLE quest_completions
ADD COLUMN IF NOT EXISTS response_data JSONB;

-- Add comment for documentation
COMMENT ON COLUMN quest_completions.response_data IS
  'JSONB storage for structured response data from flow-based quests (e.g., shadow work shadows, origin stories)';
