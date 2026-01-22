-- ============================================================================
-- Onboarding V2 Schema Migration
-- Version: 1.1 (Fixed)
-- Date: 2026-01-14
-- Description: Adds wealth ladder, guidance emphasis, and products table
--              for improved onboarding paths and product suite management
-- ============================================================================

-- ============================================================================
-- 1. EXTEND USER_STAGE_PROGRESS FOR ONBOARDING V2
-- ============================================================================

-- Employment status from Q1
ALTER TABLE user_stage_progress
ADD COLUMN IF NOT EXISTS employment_status TEXT;

COMMENT ON COLUMN user_stage_progress.employment_status IS 'Q1: Journey stage - employed_exploring, employed_building, self_employed_early, self_employed_established';

-- Has side project (derived from Q1)
ALTER TABLE user_stage_progress
ADD COLUMN IF NOT EXISTS has_side_project BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN user_stage_progress.has_side_project IS 'Derived from Q1: true if employed_building, self_employed_early, or self_employed_established';

-- Wealth ladder rung from Q2
ALTER TABLE user_stage_progress
ADD COLUMN IF NOT EXISTS wealth_ladder_rung TEXT;

COMMENT ON COLUMN user_stage_progress.wealth_ladder_rung IS 'Q2: What have you created - pre_ladder, service, productized, products';

-- Primary goal from Q3
ALTER TABLE user_stage_progress
ADD COLUMN IF NOT EXISTS primary_goal TEXT;

COMMENT ON COLUMN user_stage_progress.primary_goal IS 'Q3: What would help most - discovery, creation, monetization, growth';

-- Guidance emphasis (determines dashboard focus and quest priority)
ALTER TABLE user_stage_progress
ADD COLUMN IF NOT EXISTS guidance_emphasis TEXT;

COMMENT ON COLUMN user_stage_progress.guidance_emphasis IS 'Determines UI focus: deep_discovery, fast_track_creation, offer_refinement, client_acquisition, suite_building, launch_sales, pipeline_optimization, scale_systems';

-- Onboarding V2 completed flag
ALTER TABLE user_stage_progress
ADD COLUMN IF NOT EXISTS onboarding_v2_completed BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN user_stage_progress.onboarding_v2_completed IS 'Whether user completed the V2 onboarding flow (Q1-Q3 + Quick Capture)';

-- ============================================================================
-- 2. CONSTRAINTS FOR USER_STAGE_PROGRESS VALIDATION
-- ============================================================================

DO $$
BEGIN
  -- Employment status constraint
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'valid_employment_status'
  ) THEN
    ALTER TABLE user_stage_progress
    ADD CONSTRAINT valid_employment_status
    CHECK (employment_status IS NULL OR employment_status IN (
      'employed_exploring',
      'employed_building',
      'self_employed_early',
      'self_employed_established'
    ));
  END IF;

  -- Wealth ladder constraint
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'valid_wealth_ladder_rung'
  ) THEN
    ALTER TABLE user_stage_progress
    ADD CONSTRAINT valid_wealth_ladder_rung
    CHECK (wealth_ladder_rung IS NULL OR wealth_ladder_rung IN (
      'pre_ladder',
      'service',
      'productized',
      'products'
    ));
  END IF;

  -- Primary goal constraint
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'valid_primary_goal'
  ) THEN
    ALTER TABLE user_stage_progress
    ADD CONSTRAINT valid_primary_goal
    CHECK (primary_goal IS NULL OR primary_goal IN (
      'discovery',
      'creation',
      'monetization',
      'growth'
    ));
  END IF;

  -- Guidance emphasis constraint
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'valid_guidance_emphasis'
  ) THEN
    ALTER TABLE user_stage_progress
    ADD CONSTRAINT valid_guidance_emphasis
    CHECK (guidance_emphasis IS NULL OR guidance_emphasis IN (
      'deep_discovery',
      'fast_track_creation',
      'offer_refinement',
      'client_acquisition',
      'suite_building',
      'launch_sales',
      'pipeline_optimization',
      'scale_systems'
    ));
  END IF;
END $$;

-- ============================================================================
-- 3. PRODUCTS TABLE - Drop and recreate if malformed
-- ============================================================================

-- Check if products table exists but is missing required columns
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'products' AND column_name = 'product_type'
    ) THEN
      DROP TABLE IF EXISTS products CASCADE;
      RAISE NOTICE 'Dropped malformed products table';
    END IF;
  END IF;
END $$;

-- Create the products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES user_projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Product identity
  name TEXT NOT NULL,
  description TEXT,

  -- Classification (The 7 Product Types from PRODUCT_SUITE_ARCHITECTURE)
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

  -- Source tracking (where was this created)
  source TEXT DEFAULT 'manual',

  -- Cross-product links for upsell/downsell paths
  upsell_to_product_id UUID REFERENCES products(id),
  downsell_to_product_id UUID REFERENCES products(id),

  -- Metadata for additional data
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. PRODUCTS TABLE CONSTRAINTS
-- ============================================================================

DO $$
BEGIN
  -- Product type constraint
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'valid_product_type'
  ) THEN
    ALTER TABLE products
    ADD CONSTRAINT valid_product_type
    CHECK (product_type IN (
      'custom_service',
      'packaged_service',
      'live_group',
      'automated_group',
      'custom_agency',
      'managed_service',
      'digital_product'
    ));
  END IF;

  -- Product subtype constraint
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'valid_product_subtype'
  ) THEN
    ALTER TABLE products
    ADD CONSTRAINT valid_product_subtype
    CHECK (product_subtype IS NULL OR product_subtype IN (
      'digital',
      'software',
      'physical'
    ));
  END IF;

  -- Money model tier constraint
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'valid_money_model_tier'
  ) THEN
    ALTER TABLE products
    ADD CONSTRAINT valid_money_model_tier
    CHECK (money_model_tier IS NULL OR money_model_tier IN (
      'attraction',
      'core',
      'upsell',
      'downsell',
      'continuity'
    ));
  END IF;

  -- Price type constraint
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'valid_price_type'
  ) THEN
    ALTER TABLE products
    ADD CONSTRAINT valid_price_type
    CHECK (price_type IS NULL OR price_type IN (
      'one_time',
      'per_session',
      'subscription',
      'tiered'
    ));
  END IF;

  -- Status constraint
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'valid_product_status'
  ) THEN
    ALTER TABLE products
    ADD CONSTRAINT valid_product_status
    CHECK (status IN ('draft', 'active', 'archived'));
  END IF;

  -- Subscription interval constraint
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'valid_subscription_interval'
  ) THEN
    ALTER TABLE products
    ADD CONSTRAINT valid_subscription_interval
    CHECK (subscription_interval IS NULL OR subscription_interval IN (
      'week',
      'month',
      'quarter',
      'year'
    ));
  END IF;
END $$;

-- ============================================================================
-- 5. INDEXES FOR PERFORMANCE
-- ============================================================================

-- User stage progress indexes
CREATE INDEX IF NOT EXISTS idx_user_stage_wealth_ladder
ON user_stage_progress(wealth_ladder_rung);

CREATE INDEX IF NOT EXISTS idx_user_stage_emphasis
ON user_stage_progress(guidance_emphasis);

-- Products indexes
CREATE INDEX IF NOT EXISTS idx_products_project ON products(project_id);
CREATE INDEX IF NOT EXISTS idx_products_user ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_type ON products(product_type);
CREATE INDEX IF NOT EXISTS idx_products_tier ON products(money_model_tier);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_user_tier ON products(user_id, money_model_tier);

-- ============================================================================
-- 6. ROW LEVEL SECURITY FOR PRODUCTS
-- ============================================================================

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then recreate
DROP POLICY IF EXISTS "Users can view own products" ON products;
DROP POLICY IF EXISTS "Users can insert own products" ON products;
DROP POLICY IF EXISTS "Users can update own products" ON products;
DROP POLICY IF EXISTS "Users can delete own products" ON products;

DO $$ BEGIN
CREATE POLICY "Users can view own products" ON products
FOR SELECT USING (auth.uid() = user_id);

DO $$ BEGIN
CREATE POLICY "Users can insert own products" ON products
FOR INSERT WITH CHECK (auth.uid() = user_id);

DO $$ BEGIN
CREATE POLICY "Users can update own products" ON products
FOR UPDATE USING (auth.uid() = user_id);

DO $$ BEGIN
CREATE POLICY "Users can delete own products" ON products
FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 7. AUTO-UPDATE TIMESTAMP TRIGGER FOR PRODUCTS
-- ============================================================================

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

-- ============================================================================
-- 8. MIGRATE EXISTING USERS (Set defaults based on existing persona)
-- ============================================================================

UPDATE user_stage_progress
SET
  wealth_ladder_rung = CASE
    WHEN persona = 'vibe_seeker' THEN 'pre_ladder'
    WHEN persona = 'vibe_riser' THEN 'service'
    WHEN persona = 'movement_maker' THEN 'products'
    ELSE NULL
  END,
  primary_goal = CASE
    WHEN persona = 'vibe_seeker' THEN 'discovery'
    WHEN persona = 'vibe_riser' THEN 'creation'
    WHEN persona = 'movement_maker' THEN 'growth'
    ELSE NULL
  END,
  guidance_emphasis = CASE
    WHEN persona = 'vibe_seeker' THEN 'deep_discovery'
    WHEN persona = 'vibe_riser' THEN 'client_acquisition'
    WHEN persona = 'movement_maker' THEN 'scale_systems'
    ELSE NULL
  END
WHERE wealth_ladder_rung IS NULL
  AND persona IS NOT NULL;

-- ============================================================================
-- 9. HELPER FUNCTION: DETERMINE EMPHASIS FROM WEALTH LADDER + GOAL
-- ============================================================================

CREATE OR REPLACE FUNCTION determine_guidance_emphasis(
  p_wealth_ladder TEXT,
  p_goal TEXT
)
RETURNS TEXT AS $$
BEGIN
  -- Path 1: Pre-ladder
  IF p_wealth_ladder = 'pre_ladder' THEN
    IF p_goal = 'creation' THEN
      RETURN 'fast_track_creation';
    ELSE
      RETURN 'deep_discovery';
    END IF;
  END IF;

  -- Path 2: Service
  IF p_wealth_ladder = 'service' THEN
    IF p_goal = 'monetization' THEN
      RETURN 'client_acquisition';
    ELSE
      RETURN 'offer_refinement';
    END IF;
  END IF;

  -- Path 3: Productized
  IF p_wealth_ladder = 'productized' THEN
    IF p_goal = 'monetization' THEN
      RETURN 'launch_sales';
    ELSE
      RETURN 'suite_building';
    END IF;
  END IF;

  -- Path 4: Products
  IF p_wealth_ladder = 'products' THEN
    IF p_goal = 'growth' THEN
      RETURN 'scale_systems';
    ELSE
      RETURN 'pipeline_optimization';
    END IF;
  END IF;

  -- Default fallback
  RETURN 'deep_discovery';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION determine_guidance_emphasis IS 'Determines guidance_emphasis from wealth_ladder_rung and primary_goal based on Onboarding V2 path logic';

-- ============================================================================
-- 10. HELPER FUNCTION: DERIVE PERSONA FROM WEALTH LADDER
-- ============================================================================

CREATE OR REPLACE FUNCTION derive_persona_from_wealth_ladder(
  p_wealth_ladder TEXT
)
RETURNS TEXT AS $$
BEGIN
  RETURN CASE
    WHEN p_wealth_ladder = 'pre_ladder' THEN 'vibe_seeker'
    WHEN p_wealth_ladder = 'service' THEN 'vibe_riser'
    WHEN p_wealth_ladder = 'productized' THEN 'vibe_riser'
    WHEN p_wealth_ladder = 'products' THEN 'movement_maker'
    ELSE 'vibe_seeker'
  END;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION derive_persona_from_wealth_ladder IS 'Derives persona (vibe_seeker/vibe_riser/movement_maker) from wealth_ladder_rung';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$ BEGIN RAISE NOTICE 'Onboarding V2 schema migration completed successfully'; END $$;

-- ============================================================================
-- DOCUMENTATION: Schema Reference
-- ============================================================================

/*
USER_STAGE_PROGRESS NEW FIELDS:
- employment_status: Q1 answer (employed_exploring, employed_building, self_employed_early, self_employed_established)
- has_side_project: Derived boolean from Q1
- wealth_ladder_rung: Q2 answer (pre_ladder, service, productized, products)
- primary_goal: Q3 answer (discovery, creation, monetization, growth)
- guidance_emphasis: Determines UI focus (deep_discovery, fast_track_creation, etc.)
- onboarding_v2_completed: Flag for V2 onboarding completion

PRODUCTS TABLE:
- Living catalog of user offerings
- Each product has a type (7 types from P3 + Wealth Ladder matrix)
- Products can be linked in upsell/downsell chains
- Status lifecycle: draft → active → archived
- Source tracking for analytics

EMPHASIS VALUES:
1. deep_discovery - Focus on Flow Finder, exploration
2. fast_track_creation - Quick to Offer Builder
3. offer_refinement - Improve existing offer
4. client_acquisition - CRM, lead capture, sales
5. suite_building - Add upsells, downsells, continuity
6. launch_sales - Campaign execution
7. pipeline_optimization - Funnel metrics, CRM optimization
8. scale_systems - Full access, optimization focus

PRODUCT TYPES:
1. custom_service - 1:1 tailored work
2. packaged_service - Standardized service package
3. live_group - Live cohorts, workshops
4. automated_group - Self-paced courses
5. custom_agency - Bespoke agency work
6. managed_service - Done-for-you retainers
7. digital_product - Templates, software, physical goods (use subtype)
*/
