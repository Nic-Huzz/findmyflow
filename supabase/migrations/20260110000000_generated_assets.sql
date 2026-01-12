-- =============================================
-- GENERATED ASSETS TABLE
-- Stores AI-generated content from Implementation Coach
-- Part of Sales Tower Tier 3
-- =============================================

CREATE TABLE IF NOT EXISTS generated_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES user_projects(id) ON DELETE CASCADE,

  -- Asset details
  asset_type TEXT NOT NULL, -- 'headline', 'email', 'script', 'pricing', 'pitch'
  category TEXT NOT NULL CHECK (category IN ('attraction', 'upsell', 'downsell', 'continuity')),
  task_title TEXT NOT NULL, -- The task this was generated for

  -- Content
  content TEXT NOT NULL,
  context_snapshot JSONB, -- Snapshot of business profile at generation time
  answers_used JSONB, -- User answers to clarifying questions

  -- User feedback
  is_favorite BOOLEAN DEFAULT false,
  rating INTEGER CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
  feedback_notes TEXT,

  -- Usage tracking
  times_copied INTEGER DEFAULT 0,
  last_copied_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_generated_assets_user ON generated_assets(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_assets_project ON generated_assets(project_id);
CREATE INDEX IF NOT EXISTS idx_generated_assets_category ON generated_assets(category);
CREATE INDEX IF NOT EXISTS idx_generated_assets_type ON generated_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_generated_assets_favorite ON generated_assets(user_id, is_favorite) WHERE is_favorite = true;
CREATE INDEX IF NOT EXISTS idx_generated_assets_created ON generated_assets(created_at DESC);

-- Function: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_generated_assets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update updated_at
DROP TRIGGER IF EXISTS trigger_generated_assets_updated_at ON generated_assets;
CREATE TRIGGER trigger_generated_assets_updated_at
  BEFORE UPDATE ON generated_assets
  FOR EACH ROW
  EXECUTE FUNCTION update_generated_assets_updated_at();

-- RLS Policies
ALTER TABLE generated_assets ENABLE ROW LEVEL SECURITY;

-- Users can only see their own assets
CREATE POLICY "Users can view their own generated assets"
  ON generated_assets
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can create their own assets
CREATE POLICY "Users can create their own generated assets"
  ON generated_assets
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own assets
CREATE POLICY "Users can update their own generated assets"
  ON generated_assets
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own assets
CREATE POLICY "Users can delete their own generated assets"
  ON generated_assets
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON generated_assets TO authenticated;

-- Comments
COMMENT ON TABLE generated_assets IS 'Stores AI-generated content (headlines, emails, scripts) from the Implementation Coach';
COMMENT ON COLUMN generated_assets.asset_type IS 'Type of content: headline, email, script, pricing, pitch';
COMMENT ON COLUMN generated_assets.category IS 'Money Model category: attraction, upsell, downsell, continuity';
COMMENT ON COLUMN generated_assets.context_snapshot IS 'Business profile data at time of generation for reference';
COMMENT ON COLUMN generated_assets.answers_used IS 'User answers to clarifying questions used in generation';
COMMENT ON COLUMN generated_assets.is_favorite IS 'User marked as favorite for quick access';
COMMENT ON COLUMN generated_assets.times_copied IS 'Track how often content is copied (usage indicator)';
