-- Migration: Update healing_compass_responses table for new flow structure
-- Purpose: Clean up schema and align with new safety contract flow
-- Date: 2025-11-20
-- Note: Table is currently empty, safe to drop unused columns

-- Rename stuck_gap_description to limiting_impact (repurpose for new flow)
ALTER TABLE healing_compass_responses
RENAME COLUMN stuck_gap_description TO limiting_impact;

-- Rename stuck_reason to selected_safety_contract (repurpose for new flow)
ALTER TABLE healing_compass_responses
RENAME COLUMN stuck_reason TO selected_safety_contract;

-- Update column comments for clarity
COMMENT ON COLUMN healing_compass_responses.selected_safety_contract IS
'The safety contract the user selected to focus on healing from their nervous system flow results';

COMMENT ON COLUMN healing_compass_responses.limiting_impact IS
'User description of how the selected safety contract is limiting their pursuit of their vision';

-- Drop columns that are no longer used in new flow (table is empty, no data loss)
ALTER TABLE healing_compass_responses
DROP COLUMN IF EXISTS stuck_emotional_response,
DROP COLUMN IF EXISTS splinter_interpretation,
DROP COLUMN IF EXISTS connect_dots_consent;

-- Final schema columns for new flow:
-- ✅ id (primary key)
-- ✅ user_id
-- ✅ user_name
-- ✅ selected_safety_contract - Selected from nervous system flow
-- ✅ limiting_impact - How safety contract limits their vision
-- ✅ past_parallel_story - Another time they struggled
-- ✅ past_event_details - What happened back then
-- ✅ past_event_emotions - How they felt afterwards
-- ✅ connect_dots_acknowledged - Understanding the connection
-- ✅ splinter_removal_consent - Consent to remove splinter
-- ✅ challenge_enrollment_consent - Continue challenge or book session
-- ✅ context (JSONB - full conversation context)
-- ✅ created_at
-- ✅ updated_at

-- Verify the migration
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'healing_compass_responses'
ORDER BY ordinal_position;
