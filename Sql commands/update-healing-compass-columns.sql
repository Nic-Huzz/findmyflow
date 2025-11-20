-- Migration: Update healing_compass_responses table for new flow structure
-- Purpose: Repurpose existing columns for new safety contract flow

-- Rename stuck_gap_description to limiting_impact (repurpose for new flow)
ALTER TABLE healing_compass_responses
RENAME COLUMN stuck_gap_description TO limiting_impact;

-- Rename stuck_reason to selected_safety_contract (repurpose for new flow)
ALTER TABLE healing_compass_responses
RENAME COLUMN stuck_reason TO selected_safety_contract;

-- Update column comments
COMMENT ON COLUMN healing_compass_responses.selected_safety_contract IS
'The safety contract the user selected to focus on healing from their nervous system flow results';

COMMENT ON COLUMN healing_compass_responses.limiting_impact IS
'User description of how the selected safety contract is limiting their pursuit of their vision';

-- Note: The following columns from the old flow are no longer used but kept for historical data:
-- stuck_emotional_response, splinter_interpretation, connect_dots_consent
-- New flow uses: selected_safety_contract, limiting_impact, past_parallel_story,
-- past_event_details, past_event_emotions, connect_dots_acknowledged,
-- splinter_removal_consent, challenge_enrollment_consent

-- Verify the columns were renamed
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'healing_compass_responses'
ORDER BY ordinal_position;
