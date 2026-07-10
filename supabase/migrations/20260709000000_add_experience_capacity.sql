-- Add capacity (total spots) to experiences.
-- Nullable: null means "not set" and the UI hides the spots bar.
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS capacity integer;
