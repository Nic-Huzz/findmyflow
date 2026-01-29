-- ============================================================================
-- Fix Schema Mismatches Migration
-- Date: 2026-01-27
-- Description: Fixes field name mismatches between code and database schema
-- Issues fixed:
--   1. competence_wheels wheel_type constraint - add 'personas' option
--   2. conversation_logs - add missing project_id column
--   3. milestone_completions - add missing project_id column
-- ============================================================================

-- ============================================================================
-- 1. FIX COMPETENCE_WHEELS WHEEL_TYPE CONSTRAINT
-- Code uses 'personas' (plural) but constraint only allows 'persona' (singular)
-- ============================================================================

-- Drop the existing constraint
ALTER TABLE competence_wheels
DROP CONSTRAINT IF EXISTS competence_wheels_wheel_type_check;

-- Recreate with both 'persona' and 'personas' for backwards compatibility
ALTER TABLE competence_wheels
ADD CONSTRAINT competence_wheels_wheel_type_check
CHECK (wheel_type IN ('problems', 'skills', 'persona', 'personas'));

COMMENT ON COLUMN competence_wheels.wheel_type IS 'Type of wheel: problems, skills, persona, or personas (plural accepted for QuickCapture compatibility)';

-- ============================================================================
-- 2. ADD PROJECT_ID TO CONVERSATION_LOGS
-- Code in questCompletionHelpers.js inserts project_id but column doesn't exist
-- ============================================================================

ALTER TABLE conversation_logs
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES user_projects(id) ON DELETE SET NULL;

COMMENT ON COLUMN conversation_logs.project_id IS 'The project this conversation is associated with';

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_conversation_logs_project
ON conversation_logs(project_id);

-- ============================================================================
-- 3. ADD PROJECT_ID TO MILESTONE_COMPLETIONS
-- Code in questCompletionHelpers.js inserts project_id but column doesn't exist
-- ============================================================================

ALTER TABLE milestone_completions
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES user_projects(id) ON DELETE SET NULL;

COMMENT ON COLUMN milestone_completions.project_id IS 'The project this milestone is associated with';

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_milestone_completions_project
ON milestone_completions(project_id);

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$ BEGIN RAISE NOTICE 'Schema mismatch fixes applied successfully'; END $$;
