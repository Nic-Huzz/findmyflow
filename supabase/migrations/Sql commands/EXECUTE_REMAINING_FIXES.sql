-- ============================================================================
-- EXECUTE REMAINING FIXES (Skip what already succeeded)
-- ============================================================================
-- Run this instead of EXECUTE_ALL_FIXES.sql
-- This skips Phase 2 which already succeeded
-- ============================================================================

-- ============================================================================
-- PHASE 3: Fix healing_compass_responses (Critical)
-- ============================================================================

-- Drop old table structure (test data is disposable)
DROP TABLE IF EXISTS healing_compass_responses CASCADE;

-- Recreate with proper user_id and structure
CREATE TABLE healing_compass_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- User info (denormalized for convenience)
  user_name text,

  -- Healing compass fields
  stuck_gap_description text,
  stuck_reason text,
  stuck_emotional_response text,
  past_parallel_story text,
  past_event_emotions text,
  past_event_details text,
  splinter_interpretation text,
  connect_dots_consent text,
  connect_dots_acknowledged text,
  splinter_removal_consent text,
  challenge_enrollment_consent text,

  -- Full context
  context jsonb DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_healing_compass_user_id
  ON healing_compass_responses(user_id);
CREATE INDEX idx_healing_compass_created_at
  ON healing_compass_responses(created_at DESC);

-- Enable RLS
ALTER TABLE healing_compass_responses ENABLE ROW LEVEL SECURITY;

-- Drop any old policies
DROP POLICY IF EXISTS "Allow anonymous inserts" ON healing_compass_responses;
DROP POLICY IF EXISTS "Users can read own data" ON healing_compass_responses;

-- Create proper RLS policies (users only see their own data)
CREATE POLICY "Users can insert own responses"
  ON healing_compass_responses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own responses"
  ON healing_compass_responses
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own responses"
  ON healing_compass_responses
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own responses"
  ON healing_compass_responses
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER update_healing_compass_updated_at
  BEFORE UPDATE ON healing_compass_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON healing_compass_responses TO authenticated;

-- ============================================================================
-- PHASE 4: Archive Legacy responses Table
-- ============================================================================

-- Rename to mark as archived (keeps data just in case)
ALTER TABLE responses RENAME TO responses_archived_20251117;

-- ============================================================================
-- PHASE 5: Performance Improvements
-- ============================================================================

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_challenge_progress_status
  ON challenge_progress(user_id, status)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_quest_completions_user_challenge
  ON quest_completions(user_id, challenge_instance_id);

CREATE INDEX IF NOT EXISTS idx_lead_flow_profiles_email
  ON lead_flow_profiles(email);

-- Add data validation constraints
-- Drop first if they exist, then add
ALTER TABLE challenge_progress
DROP CONSTRAINT IF EXISTS check_current_day;

ALTER TABLE challenge_progress
ADD CONSTRAINT check_current_day
CHECK (current_day >= 0 AND current_day <= 7);

ALTER TABLE quest_completions
DROP CONSTRAINT IF EXISTS check_quest_category;

ALTER TABLE quest_completions
ADD CONSTRAINT check_quest_category
CHECK (quest_category IN ('Recognise', 'Release', 'Rewire', 'Reconnect', 'Bonus'));

ALTER TABLE quest_completions
DROP CONSTRAINT IF EXISTS check_quest_type;

ALTER TABLE quest_completions
ADD CONSTRAINT check_quest_type
CHECK (quest_type IN ('daily', 'weekly'));

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify unique constraint exists (from previous run)
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'challenge_progress'
  AND constraint_type = 'UNIQUE';

-- Verify FK constraints are correct (from previous run)
SELECT
  table_name,
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE constraint_name IN ('fk_flow_completions_challenge', 'fk_quest_completions_challenge')
ORDER BY table_name;

-- Verify healing_compass_responses structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'healing_compass_responses'
  AND column_name IN ('id', 'user_id', 'user_name')
ORDER BY ordinal_position;

-- Verify responses table was archived
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'responses%'
ORDER BY table_name;

-- Verify indexes were created
SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
  AND tablename IN ('challenge_progress', 'quest_completions', 'lead_flow_profiles', 'healing_compass_responses')
ORDER BY tablename, indexname;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ All remaining fixes completed successfully!';
  RAISE NOTICE '✅ Phase 2 (FK constraints) was already completed in first run';
  RAISE NOTICE '📝 Next steps:';
  RAISE NOTICE '   1. Update HealingCompass.jsx to add user_id';
  RAISE NOTICE '   2. Fix session IDs in code';
  RAISE NOTICE '   3. Add input sanitization';
  RAISE NOTICE '   4. Test end-to-end';
  RAISE NOTICE '🔄 If issues occur, run ROLLBACK_ALL_FIXES.sql';
END $$;
