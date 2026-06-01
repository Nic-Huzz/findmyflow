-- Add wahoo_category to groan_challenges
-- Categories: appearance, creation, connection
ALTER TABLE groan_challenges ADD COLUMN IF NOT EXISTS wahoo_category TEXT;
