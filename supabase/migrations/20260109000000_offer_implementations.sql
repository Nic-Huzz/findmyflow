-- ============================================
-- Offer Implementations Table
-- Tracks user progress on implementing recommended offers
-- Part of Sales Tower Tier 2
-- ============================================

CREATE TABLE IF NOT EXISTS offer_implementations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES user_projects(id) ON DELETE CASCADE NOT NULL,

  -- Offer details
  offer_type TEXT NOT NULL,           -- e.g., 'classic_upsell', 'menu_upsell', 'payment_plan_downsell'
  category TEXT NOT NULL CHECK (category IN ('attraction', 'upsell', 'downsell', 'continuity')),

  -- Source tracking
  flow_assessment_id UUID,            -- Link to the flow result that recommended this (optional)

  -- Progress tracking
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  completed_tasks JSONB DEFAULT '[]'::jsonb,  -- Array of { phase: number, taskIndex: number }
  current_phase INTEGER DEFAULT 0,    -- Current phase index (0-based)
  total_tasks INTEGER DEFAULT 0,      -- Total task count (set on creation for progress calc)

  -- Timestamps
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One implementation per offer type per project
  CONSTRAINT unique_implementation_per_project UNIQUE (user_id, project_id, offer_type)
);

-- Index for user queries
CREATE INDEX IF NOT EXISTS idx_implementations_user ON offer_implementations(user_id);
CREATE INDEX IF NOT EXISTS idx_implementations_project ON offer_implementations(project_id);
CREATE INDEX IF NOT EXISTS idx_implementations_status ON offer_implementations(user_id, status);

-- ============================================
-- Row Level Security
-- ============================================
ALTER TABLE offer_implementations ENABLE ROW LEVEL SECURITY;

-- Users can view their own implementations
CREATE POLICY "Users can view own implementations"
  ON offer_implementations FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own implementations
CREATE POLICY "Users can insert own implementations"
  ON offer_implementations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own implementations
CREATE POLICY "Users can update own implementations"
  ON offer_implementations FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own implementations
CREATE POLICY "Users can delete own implementations"
  ON offer_implementations FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- Trigger for updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_offer_implementations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_offer_implementations_updated_at
  BEFORE UPDATE ON offer_implementations
  FOR EACH ROW
  EXECUTE FUNCTION update_offer_implementations_updated_at();

-- ============================================
-- Comments for documentation
-- ============================================
COMMENT ON TABLE offer_implementations IS 'Tracks user progress implementing recommended offers from Money Model flows';
COMMENT ON COLUMN offer_implementations.offer_type IS 'Offer type ID matching checklist JSON keys (e.g., classic_upsell, menu_upsell)';
COMMENT ON COLUMN offer_implementations.category IS 'Money Model category: attraction, upsell, downsell, continuity';
COMMENT ON COLUMN offer_implementations.completed_tasks IS 'Array of completed task references: [{phase: 0, taskIndex: 2}, ...]';
COMMENT ON COLUMN offer_implementations.total_tasks IS 'Total task count from checklist, set on creation for progress percentage';
