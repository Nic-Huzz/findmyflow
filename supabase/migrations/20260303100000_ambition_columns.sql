-- Add ambition + business columns to user_stage_progress
-- Captures what the user wants to do with their Mind Space discoveries

ALTER TABLE user_stage_progress ADD COLUMN IF NOT EXISTS ambition TEXT;
ALTER TABLE user_stage_progress ADD COLUMN IF NOT EXISTS has_existing_business BOOLEAN;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'valid_ambition') THEN
    ALTER TABLE user_stage_progress
    ADD CONSTRAINT valid_ambition
    CHECK (ambition IS NULL OR ambition IN ('find_job', 'build_own', 'exploring'));
  END IF;
END $$;
