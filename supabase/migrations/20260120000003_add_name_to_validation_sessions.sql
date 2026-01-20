-- Add respondent_name to validation_sessions table

ALTER TABLE validation_sessions ADD COLUMN IF NOT EXISTS respondent_name VARCHAR;

-- Index for name lookups
CREATE INDEX IF NOT EXISTS idx_validation_sessions_name ON validation_sessions(respondent_name);
