-- Add dismiss reason to recommendations table

ALTER TABLE recommendations
ADD COLUMN IF NOT EXISTS dismissed_reason TEXT;

DO $$
BEGIN
  ALTER TABLE recommendations
  ADD CONSTRAINT valid_dismiss_reason CHECK (
    dismissed_reason IS NULL OR
    dismissed_reason IN ('not_relevant', 'already_doing', 'will_do_later', 'disagree', 'other')
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
