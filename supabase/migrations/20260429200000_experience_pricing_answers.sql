-- Pricing reflection answers stored as JSONB on the experience.
-- Keys: similar_cost, magic_price, protective_voice
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS pricing_answers JSONB;
