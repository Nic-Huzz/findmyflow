-- Add metadata column to validation_sessions for analytics data
ALTER TABLE validation_sessions ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Add additional tracking columns used by the code
ALTER TABLE validation_sessions ADD COLUMN IF NOT EXISTS total_questions INTEGER;
ALTER TABLE validation_sessions ADD COLUMN IF NOT EXISTS last_step_index INTEGER;
ALTER TABLE validation_sessions ADD COLUMN IF NOT EXISTS resume_token TEXT;
ALTER TABLE validation_sessions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
