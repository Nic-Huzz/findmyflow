-- Scale Income card: pitch toggle
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS pitch_next_offer BOOLEAN DEFAULT false;

-- Upsell/Downsell strategy results
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS upsell_strategy TEXT;
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS upsell_answers JSONB;
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS downsell_strategy TEXT;
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS downsell_answers JSONB;
