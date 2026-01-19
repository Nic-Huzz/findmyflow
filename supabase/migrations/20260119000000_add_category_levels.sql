-- Add category_levels column to public_offer_audits
ALTER TABLE public_offer_audits
ADD COLUMN IF NOT EXISTS category_levels JSONB;

-- Add index for filtering by category levels
CREATE INDEX IF NOT EXISTS idx_public_offer_audits_category_levels
ON public_offer_audits USING GIN (category_levels);
