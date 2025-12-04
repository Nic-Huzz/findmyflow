-- Add nervous_system_impact_limit column to nervous_system_responses

ALTER TABLE nervous_system_responses
ADD COLUMN IF NOT EXISTS nervous_system_impact_limit TEXT;

-- Add comment for documentation
COMMENT ON COLUMN nervous_system_responses.nervous_system_impact_limit
IS 'Discovered visibility/impact safety limit from binary search sway test (e.g., "25,000 people")';
