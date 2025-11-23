-- Migration: Add safety_contracts column to nervous_system_responses table
-- Purpose: Store the YES safety contracts from belief tests for use in Healing Compass flow

-- Add the safety_contracts column (array of text strings)
ALTER TABLE nervous_system_responses
ADD COLUMN IF NOT EXISTS safety_contracts TEXT[];

-- Add a comment explaining the column
COMMENT ON COLUMN nervous_system_responses.safety_contracts IS
'Array of safety contract strings that tested YES during belief tests. These are the active fears the user identified that will be used in the Healing Compass flow.';

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'nervous_system_responses'
AND column_name = 'safety_contracts';
