-- Add new columns to healing_compass_responses table for updated flow

ALTER TABLE healing_compass_responses
ADD COLUMN IF NOT EXISTS past_event_details TEXT,
ADD COLUMN IF NOT EXISTS challenge_enrollment_consent TEXT;

-- Verify the columns were added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'healing_compass_responses'
ORDER BY ordinal_position;
