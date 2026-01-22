-- Funnel Metrics table for Stage 7 Tracking
-- Stores user funnel tracking data from the Funnel Calculator

CREATE TABLE IF NOT EXISTS funnel_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  project_id UUID, -- Optional reference to user_projects (FK added below if table exists)

  -- Mode: 'actual' for real tracking, 'planner' for projections
  mode TEXT NOT NULL DEFAULT 'actual' CHECK (mode IN ('actual', 'planner')),

  -- Funnel stage values (number of people at each stage)
  awareness INTEGER DEFAULT 0,
  attraction INTEGER DEFAULT 0,
  leadmagnet INTEGER DEFAULT 0,
  nurture INTEGER DEFAULT 0,
  core INTEGER DEFAULT 0,
  upsell INTEGER DEFAULT 0,
  downsell INTEGER DEFAULT 0,
  continuity INTEGER DEFAULT 0,

  -- Pricing data for revenue calculations
  core_price DECIMAL(10,2) DEFAULT 0,
  upsell_price DECIMAL(10,2) DEFAULT 0,
  downsell_price DECIMAL(10,2) DEFAULT 0,
  continuity_price DECIMAL(10,2) DEFAULT 0,

  -- Custom conversion rates (for planner mode)
  -- Stored as decimals (e.g., 0.05 for 5%)
  custom_rates JSONB DEFAULT NULL,

  -- Calculated fields (stored for quick access)
  total_revenue DECIMAL(12,2) DEFAULT 0,
  monthly_recurring DECIMAL(12,2) DEFAULT 0,

  -- Metadata
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for quick user lookups
CREATE INDEX IF NOT EXISTS idx_funnel_metrics_user_id ON funnel_metrics(user_id);

-- Index for project-based queries
CREATE INDEX IF NOT EXISTS idx_funnel_metrics_project_id ON funnel_metrics(project_id);

-- Index for mode filtering
CREATE INDEX IF NOT EXISTS idx_funnel_metrics_mode ON funnel_metrics(mode);

-- Enable RLS
ALTER TABLE funnel_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own funnel metrics
DO $$ BEGIN
CREATE POLICY "Users can view own funnel metrics"
  ON funnel_metrics FOR SELECT
  USING (auth.uid() = user_id);

DO $$ BEGIN
CREATE POLICY "Users can insert own funnel metrics"
  ON funnel_metrics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DO $$ BEGIN
CREATE POLICY "Users can update own funnel metrics"
  ON funnel_metrics FOR UPDATE
  USING (auth.uid() = user_id);

DO $$ BEGIN
CREATE POLICY "Users can delete own funnel metrics"
  ON funnel_metrics FOR DELETE
  USING (auth.uid() = user_id);

-- Try to add FK to user_projects if that table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'user_projects'
  ) THEN
    -- Only add FK if it doesn't already exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'funnel_metrics_project_id_fkey'
    ) THEN
      ALTER TABLE funnel_metrics
      ADD CONSTRAINT funnel_metrics_project_id_fkey
      FOREIGN KEY (project_id) REFERENCES user_projects(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- Add 'Tracking' to quest_type constraint if not already present
DO $$
BEGIN
  -- Check if 'Tracking' is already in the constraint
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'check_quest_type'
    AND pg_get_constraintdef(oid) LIKE '%Tracking%'
  ) THEN
    -- Drop existing constraint and recreate with Tracking
    ALTER TABLE quest_completions
    DROP CONSTRAINT IF EXISTS check_quest_type;

    ALTER TABLE quest_completions
    ADD CONSTRAINT check_quest_type
    CHECK (quest_type IN (
      'daily', 'weekly', 'anytime', 'challenge', 'Daily', 'Weekly',
      'flow',
      'Movement Maker', 'Vibe Riser', 'Vibe Riser, Movement Maker',
      'Recognise', 'Release', 'Rewire', 'Reconnect',
      'Tracker', 'Tracking',
      'groan',
      'Validation',
      'Product',
      'Testing',
      'Money Models',
      'Campaign',
      'Launch',
      'Flow Finder'
    ));
  END IF;
END $$;
