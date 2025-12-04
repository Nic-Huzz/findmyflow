-- Add nervous_system_income_limit and archetype columns to nervous_system_responses

ALTER TABLE nervous_system_responses
ADD COLUMN IF NOT EXISTS nervous_system_income_limit TEXT,
ADD COLUMN IF NOT EXISTS archetype TEXT;

-- Add comments for documentation
COMMENT ON COLUMN nervous_system_responses.nervous_system_income_limit
IS 'Discovered income safety limit from binary search sway test (e.g., "$125,000")';

COMMENT ON COLUMN nervous_system_responses.archetype
IS 'AI-generated protective pattern/archetype from reflection (e.g., "The Good Soldier", "The Hustling Healer")';
