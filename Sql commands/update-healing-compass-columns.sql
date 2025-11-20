-- Migration: Update healing_compass_responses table for new flow structure
-- Purpose: Repurpose existing columns for new safety contract flow
-- Date: 2025-11-20

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

-- Add comments to historical columns that are no longer populated in new flow
COMMENT ON COLUMN healing_compass_responses.stuck_emotional_response IS
'[DEPRECATED - Old Flow Only] Emotional response selected (Shame/Guilt/Apathy/Grief/Fear/Anger) - kept for historical data';

COMMENT ON COLUMN healing_compass_responses.splinter_interpretation IS
'[DEPRECATED - Old Flow Only] User belief about what the incident made them believe - kept for historical data';

COMMENT ON COLUMN healing_compass_responses.connect_dots_consent IS
'[DEPRECATED - Old Flow Only] Ready to connect the dots consent (merged into connect_dots_acknowledged in new flow) - kept for historical data';

-- Summary of new flow columns:
-- ✅ selected_safety_contract - Selected from nervous system flow
-- ✅ limiting_impact - How safety contract limits their vision
-- ✅ past_parallel_story - Another time they struggled
-- ✅ past_event_details - What happened back then
-- ✅ past_event_emotions - How they felt afterwards
-- ✅ connect_dots_acknowledged - Understanding the connection
-- ✅ splinter_removal_consent - Consent to remove splinter
-- ✅ challenge_enrollment_consent - Continue challenge or book session

-- Verify the migration
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'healing_compass_responses'
ORDER BY ordinal_position;
