-- Add placeholders column to validation_flows table
-- This stores custom context that gets injected into flow questions

ALTER TABLE validation_flows
ADD COLUMN IF NOT EXISTS placeholders JSONB DEFAULT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN validation_flows.placeholders IS 'Custom placeholders for flow questions (problemArea, solutionConcept, audienceDescription)';

-- Create index for querying flows with placeholders
CREATE INDEX IF NOT EXISTS idx_validation_flows_placeholders ON validation_flows USING GIN (placeholders);
