-- Add lead_magnet_product column to store selected product from Product Builder
ALTER TABLE offer_stack_builds
ADD COLUMN IF NOT EXISTS lead_magnet_product JSONB;

COMMENT ON COLUMN offer_stack_builds.lead_magnet_product IS 'Selected product from Product Builder as lead magnet';
