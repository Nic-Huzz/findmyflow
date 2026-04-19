-- Add response_data column to flow_sessions for Life Map living document
-- Stores raw user responses so they can be reloaded on return visits
ALTER TABLE flow_sessions ADD COLUMN IF NOT EXISTS response_data JSONB;
