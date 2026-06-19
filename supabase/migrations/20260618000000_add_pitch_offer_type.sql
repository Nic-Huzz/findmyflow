-- Add pitch_offer_type column to experiences
-- Values: 'core', 'continuity', or custom text (Other)
-- NULL = not pitching. Replaces boolean pitch_next_offer logic.
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS pitch_offer_type TEXT DEFAULT NULL;
