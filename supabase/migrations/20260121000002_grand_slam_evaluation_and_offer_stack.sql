-- Grand Slam Offers table (if not exists)
-- Stores user's solution-to-tier assignments and evaluation data

CREATE TABLE IF NOT EXISTS grand_slam_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Solution assignments by tier (JSON object: { tierId: [solutionIds] })
  assignments JSONB DEFAULT '{}',

  -- Money Model strategies snapshot (for reference)
  money_model_strategies JSONB DEFAULT '{}',

  -- AI recommendations that were shown
  recommendations JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One matrix per user (can upsert)
  UNIQUE(user_id)
);

-- Add evaluation columns to grand_slam_offers
ALTER TABLE grand_slam_offers
ADD COLUMN IF NOT EXISTS offer_builder_id UUID,
ADD COLUMN IF NOT EXISTS selected_product_id TEXT,
ADD COLUMN IF NOT EXISTS selected_product_name TEXT,
ADD COLUMN IF NOT EXISTS selected_product_data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS evaluated_product_ids JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS proof_data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS speed_data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS ease_data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS obstacles JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS grand_slam_score INTEGER,
ADD COLUMN IF NOT EXISTS score_breakdown JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS chosen_product_id TEXT,
ADD COLUMN IF NOT EXISTS chosen_product_name TEXT,
ADD COLUMN IF NOT EXISTS chosen_product_data JSONB DEFAULT '{}';

-- Enable RLS on grand_slam_offers
ALTER TABLE grand_slam_offers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for grand_slam_offers (idempotent)
DO $$ BEGIN
  CREATE POLICY "Users can read own grand slam offers"
    ON grand_slam_offers FOR SELECT
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert own grand slam offers"
    ON grand_slam_offers FOR INSERT
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own grand slam offers"
    ON grand_slam_offers FOR UPDATE
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Index for grand_slam_offers
CREATE INDEX IF NOT EXISTS idx_grand_slam_offers_user_id ON grand_slam_offers(user_id);

-- Offer Stack Builds table
-- Stores user's offer packaging (Lead Magnet, Bonuses, Guarantee, Scarcity, Naming)

CREATE TABLE IF NOT EXISTS offer_stack_builds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- References
  grand_slam_offer_id UUID,
  offer_builder_id UUID,

  -- Lead Magnet selection
  lead_magnet_type TEXT,
  lead_magnet_idea TEXT,

  -- Bonuses (array of objects: { id, name, value })
  bonuses JSONB DEFAULT '[]',

  -- Guarantee
  guarantee_type TEXT,
  guarantee_details TEXT,

  -- Scarcity/Urgency (array of type IDs)
  scarcity_types JSONB DEFAULT '[]',
  scarcity_details JSONB DEFAULT '{}',

  -- Naming
  offer_name TEXT,
  tagline TEXT,

  -- Full stack snapshot for display
  full_stack JSONB DEFAULT '{}',

  -- Status
  status TEXT DEFAULT 'draft',
  completed_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One stack per user (can upsert)
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE offer_stack_builds ENABLE ROW LEVEL SECURITY;

-- RLS Policies for offer_stack_builds (idempotent)
DO $$ BEGIN
  CREATE POLICY "Users can read own offer stack builds"
    ON offer_stack_builds FOR SELECT
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert own offer stack builds"
    ON offer_stack_builds FOR INSERT
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own offer stack builds"
    ON offer_stack_builds FOR UPDATE
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_offer_stack_builds_user_id ON offer_stack_builds(user_id);

-- Comments for documentation
COMMENT ON TABLE grand_slam_offers IS 'Stores solution-to-tier assignments and Grand Slam Evaluation data';
COMMENT ON TABLE offer_stack_builds IS 'Stores offer packaging from the Offer Stack Builder flow (Lead Magnet, Bonuses, Guarantee, Scarcity, Naming)';
