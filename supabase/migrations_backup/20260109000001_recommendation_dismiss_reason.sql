-- Add dismiss reason to recommendations table
-- Allows users to provide feedback when dismissing recommendations

ALTER TABLE recommendations
ADD COLUMN IF NOT EXISTS dismissed_reason TEXT;

-- Add check constraint for valid reasons
ALTER TABLE recommendations
ADD CONSTRAINT valid_dismiss_reason CHECK (
  dismissed_reason IS NULL OR
  dismissed_reason IN ('not_relevant', 'already_doing', 'will_do_later', 'disagree', 'other')
);

COMMENT ON COLUMN recommendations.dismissed_reason IS 'Reason user dismissed: not_relevant, already_doing, will_do_later, disagree, other';
