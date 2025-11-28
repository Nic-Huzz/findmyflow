-- ============================================================================
-- ROLLBACK ALL FIXES - Emergency Revert
-- ============================================================================
-- Date: 2025-11-17
-- Purpose: Revert all changes from EXECUTE_ALL_FIXES.sql
-- Use: Only if something breaks after running fixes
-- ============================================================================

-- ============================================================================
-- ROLLBACK PHASE 5: Remove Performance Improvements
-- ============================================================================

-- Drop indexes
DROP INDEX IF EXISTS idx_challenge_progress_status;
DROP INDEX IF EXISTS idx_quest_completions_user_challenge;
DROP INDEX IF EXISTS idx_lead_flow_profiles_email;

-- Drop constraints
ALTER TABLE challenge_progress
DROP CONSTRAINT IF EXISTS check_current_day;

ALTER TABLE quest_completions
DROP CONSTRAINT IF EXISTS check_quest_category;

ALTER TABLE quest_completions
DROP CONSTRAINT IF EXISTS check_quest_type;

-- ============================================================================
-- ROLLBACK PHASE 4: Restore responses Table
-- ============================================================================

-- Restore original table name
ALTER TABLE responses_archived_20251117 RENAME TO responses;

-- ============================================================================
-- ROLLBACK PHASE 3: Restore Old healing_compass_responses
-- ============================================================================

-- Drop new table structure
DROP TABLE IF EXISTS healing_compass_responses CASCADE;

-- Recreate old structure (without user_id)
CREATE TABLE healing_compass_responses (
  id integer PRIMARY KEY DEFAULT nextval('healing_compass_responses_id_seq'::regclass),
  user_name text,
  stuck_gap_description text,
  stuck_reason text,
  stuck_emotional_response text,
  past_parallel_story text,
  past_event_emotions text,
  splinter_interpretation text,
  connect_dots_consent text,
  connect_dots_acknowledged text,
  splinter_removal_consent text,
  context jsonb,
  created_at timestamp with time zone DEFAULT now(),
  past_event_details text,
  challenge_enrollment_consent text
);

-- Restore old RLS
ALTER TABLE healing_compass_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous inserts" ON healing_compass_responses
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can read own data" ON healing_compass_responses
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- ROLLBACK PHASE 2: Restore Original FK Constraints
-- ============================================================================

-- Drop new correct FK constraints
ALTER TABLE flow_completions
DROP CONSTRAINT IF EXISTS fk_flow_completions_challenge;

ALTER TABLE quest_completions
DROP CONSTRAINT IF EXISTS fk_quest_completions_challenge;

-- Remove the unique constraint
ALTER TABLE challenge_progress
DROP CONSTRAINT IF EXISTS challenge_progress_user_instance_unique;

-- Note: The old broken constraints can't be re-created
-- They were invalid anyway

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify challenge_progress unique constraint removed
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'challenge_progress'
  AND constraint_name = 'challenge_progress_user_instance_unique';
-- Should return 0 rows

-- Verify responses table restored
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'responses';
-- Should return 1 row

-- Verify healing_compass_responses rolled back
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'healing_compass_responses'
  AND column_name IN ('id', 'user_id')
ORDER BY column_name;
-- Should show id as integer, no user_id

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '🔄 All changes have been rolled back';
  RAISE NOTICE '⚠️  Database is back to original state';
  RAISE NOTICE '📝 Remember to also revert code changes:';
  RAISE NOTICE '   git checkout src/HealingCompass.jsx';
  RAISE NOTICE '   git checkout src/App.jsx';
  RAISE NOTICE '   git checkout src/lib/analytics.js';
END $$;
