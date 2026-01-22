-- Grand Slam Offers Matrix table
-- Stores user's solution-to-tier assignments

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

-- Enable RLS
ALTER TABLE grand_slam_offers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DO $$ BEGIN
CREATE POLICY "Users can read own grand slam offers"
  ON grand_slam_offers FOR SELECT
  USING (auth.uid() = user_id);

DO $$ BEGIN
CREATE POLICY "Users can insert own grand slam offers"
  ON grand_slam_offers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DO $$ BEGIN
CREATE POLICY "Users can update own grand slam offers"
  ON grand_slam_offers FOR UPDATE
  USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX idx_grand_slam_offers_user_id ON grand_slam_offers(user_id);

-- Comment for documentation
COMMENT ON TABLE grand_slam_offers IS 'Stores solution-to-tier assignments from the Grand Slam Matrix flow';
