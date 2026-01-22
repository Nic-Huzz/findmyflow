-- ============================================================================
-- Fix Products Table Migration
-- Version: 1.1
-- Date: 2026-01-14
-- Description: Fixes products table if it exists with wrong schema
-- ============================================================================

-- First, check if products table exists but is missing columns
-- If so, we need to drop and recreate it

DO $$
BEGIN
  -- Check if table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN
    -- Check if product_type column exists
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'products' AND column_name = 'product_type'
    ) THEN
      -- Table exists but is missing required columns - drop it
      DROP TABLE IF EXISTS products CASCADE;
      RAISE NOTICE 'Dropped malformed products table';
    END IF;
  END IF;
END $$;

-- Now create the products table properly
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES user_projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Product identity
  name TEXT NOT NULL,
  description TEXT,

  -- Classification (The 7 Product Types)
  product_type TEXT NOT NULL,
  product_subtype TEXT,

  -- Money Model position in suite
  money_model_tier TEXT,

  -- Pricing
  price_type TEXT,
  price_amount DECIMAL(10,2),
  subscription_interval TEXT,

  -- Status for lifecycle management
  status TEXT DEFAULT 'draft',

  -- Source tracking
  source TEXT DEFAULT 'manual',

  -- Cross-product links
  upsell_to_product_id UUID REFERENCES products(id),
  downsell_to_product_id UUID REFERENCES products(id),

  -- Metadata for additional data
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add constraints (with IF NOT EXISTS pattern)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'valid_product_type') THEN
    ALTER TABLE products ADD CONSTRAINT valid_product_type
    CHECK (product_type IN (
      'custom_service', 'packaged_service', 'live_group', 'automated_group',
      'custom_agency', 'managed_service', 'digital_product'
    ));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'valid_product_subtype') THEN
    ALTER TABLE products ADD CONSTRAINT valid_product_subtype
    CHECK (product_subtype IS NULL OR product_subtype IN ('digital', 'software', 'physical'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'valid_money_model_tier') THEN
    ALTER TABLE products ADD CONSTRAINT valid_money_model_tier
    CHECK (money_model_tier IS NULL OR money_model_tier IN (
      'attraction', 'core', 'upsell', 'downsell', 'continuity'
    ));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'valid_price_type') THEN
    ALTER TABLE products ADD CONSTRAINT valid_price_type
    CHECK (price_type IS NULL OR price_type IN ('one_time', 'per_session', 'subscription', 'tiered'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'valid_product_status') THEN
    ALTER TABLE products ADD CONSTRAINT valid_product_status
    CHECK (status IN ('draft', 'active', 'archived'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'valid_subscription_interval') THEN
    ALTER TABLE products ADD CONSTRAINT valid_subscription_interval
    CHECK (subscription_interval IS NULL OR subscription_interval IN ('week', 'month', 'quarter', 'year'));
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_products_project ON products(project_id);
CREATE INDEX IF NOT EXISTS idx_products_user ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_type ON products(product_type);
CREATE INDEX IF NOT EXISTS idx_products_tier ON products(money_model_tier);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_user_tier ON products(user_id, money_model_tier);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then recreate
DROP POLICY IF EXISTS "Users can view own products" ON products;
DROP POLICY IF EXISTS "Users can insert own products" ON products;
DROP POLICY IF EXISTS "Users can update own products" ON products;
DROP POLICY IF EXISTS "Users can delete own products" ON products;

DO $$ BEGIN
CREATE POLICY "Users can view own products" ON products FOR SELECT USING (auth.uid() = user_id);
DO $$ BEGIN
CREATE POLICY "Users can insert own products" ON products FOR INSERT WITH CHECK (auth.uid() = user_id);
DO $$ BEGIN
CREATE POLICY "Users can update own products" ON products FOR UPDATE USING (auth.uid() = user_id);
DO $$ BEGIN
CREATE POLICY "Users can delete own products" ON products FOR DELETE USING (auth.uid() = user_id);

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_products_updated_at ON products;
CREATE TRIGGER trigger_update_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_products_updated_at();

-- Success message
DO $$ BEGIN RAISE NOTICE 'Products table created/fixed successfully'; END $$;
