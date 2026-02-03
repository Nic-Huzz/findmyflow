-- ============================================================================
-- Make nikigai_responses flexible for quick flows
-- Purpose: Allow PersonaIdentifierFlow, PlayListFinderFlow, MindSpace to save raw data
-- ============================================================================

-- Add new columns for quick flows
ALTER TABLE nikigai_responses
ADD COLUMN IF NOT EXISTS flow_type TEXT,
ADD COLUMN IF NOT EXISTS response_type TEXT,
ADD COLUMN IF NOT EXISTS response_data JSONB;

-- Make rigid columns nullable for quick flows
-- These are required for traditional multi-step flows but not for quick flows
ALTER TABLE nikigai_responses
ALTER COLUMN step_id DROP NOT NULL,
ALTER COLUMN question_text DROP NOT NULL,
ALTER COLUMN response_raw DROP NOT NULL;

-- Add index for quick flow queries
CREATE INDEX IF NOT EXISTS idx_responses_flow_type
ON nikigai_responses(flow_type);

CREATE INDEX IF NOT EXISTS idx_responses_response_type
ON nikigai_responses(response_type);

-- Add comments for documentation
COMMENT ON COLUMN nikigai_responses.flow_type IS
  'Flow identifier for quick flows: persona_identifier, play_list_finder, mind_space';

COMMENT ON COLUMN nikigai_responses.response_type IS
  'Type of response data: personas, skills, problems, north_star, raw_input';

COMMENT ON COLUMN nikigai_responses.response_data IS
  'JSONB storage for flexible response data from quick flows';

-- Verify migration
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'nikigai_responses'
    AND column_name = 'flow_type'
  ) THEN
    RAISE NOTICE '✅ flow_type column added to nikigai_responses';
  ELSE
    RAISE WARNING '⚠️ Failed to add flow_type column';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'nikigai_responses'
    AND column_name = 'response_data'
  ) THEN
    RAISE NOTICE '✅ response_data column added to nikigai_responses';
  ELSE
    RAISE WARNING '⚠️ Failed to add response_data column';
  END IF;
END $$;
