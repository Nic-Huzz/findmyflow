-- Add store_as column to nikigai_responses for clustering lookups
-- This allows us to filter responses by their semantic meaning (e.g., life_map.hobbies.childhood)

ALTER TABLE nikigai_responses
ADD COLUMN IF NOT EXISTS store_as TEXT;

-- Add index for clustering queries
CREATE INDEX IF NOT EXISTS idx_responses_store_as ON nikigai_responses(store_as);

-- Add comment
COMMENT ON COLUMN nikigai_responses.store_as IS
  'Semantic identifier for the response (e.g., life_map.hobbies.childhood). Used for clustering relevant responses together.';
