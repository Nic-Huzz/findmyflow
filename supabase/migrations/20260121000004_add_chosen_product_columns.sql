-- Add chosen product columns to grand_slam_offers
ALTER TABLE grand_slam_offers
ADD COLUMN IF NOT EXISTS chosen_product_id TEXT,
ADD COLUMN IF NOT EXISTS chosen_product_name TEXT,
ADD COLUMN IF NOT EXISTS chosen_product_data JSONB DEFAULT '{}';

-- Comment for documentation
COMMENT ON COLUMN grand_slam_offers.chosen_product_id IS 'The product ID the user chose to proceed with as their main offer';
COMMENT ON COLUMN grand_slam_offers.chosen_product_name IS 'Name of the chosen main product';
COMMENT ON COLUMN grand_slam_offers.chosen_product_data IS 'Full data for the chosen main product';
