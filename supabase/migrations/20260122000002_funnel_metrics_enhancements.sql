-- Funnel Metrics Enhancements for Weekly Tracking & CRM Sync
-- Adds source tracking, week tracking, and baseline flag
-- Also creates the base table if it doesn't exist (repair for failed 20251230170000)

-- First, create the table if it doesn't exist (repair step)
CREATE TABLE IF NOT EXISTS funnel_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  project_id UUID,
  mode TEXT NOT NULL DEFAULT 'actual' CHECK (mode IN ('actual', 'planner')),
  awareness INTEGER DEFAULT 0,
  attraction INTEGER DEFAULT 0,
  leadmagnet INTEGER DEFAULT 0,
  nurture INTEGER DEFAULT 0,
  core INTEGER DEFAULT 0,
  upsell INTEGER DEFAULT 0,
  downsell INTEGER DEFAULT 0,
  continuity INTEGER DEFAULT 0,
  core_price DECIMAL(10,2) DEFAULT 0,
  upsell_price DECIMAL(10,2) DEFAULT 0,
  downsell_price DECIMAL(10,2) DEFAULT 0,
  continuity_price DECIMAL(10,2) DEFAULT 0,
  custom_rates JSONB DEFAULT NULL,
  total_revenue DECIMAL(12,2) DEFAULT 0,
  monthly_recurring DECIMAL(12,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create base indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_funnel_metrics_user_id ON funnel_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_funnel_metrics_project_id ON funnel_metrics(project_id);
CREATE INDEX IF NOT EXISTS idx_funnel_metrics_mode ON funnel_metrics(mode);

-- Enable RLS
ALTER TABLE funnel_metrics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (with duplicate handling)
DO $$ BEGIN
  CREATE POLICY "Users can view own funnel metrics"
    ON funnel_metrics FOR SELECT
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert own funnel metrics"
    ON funnel_metrics FOR INSERT
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own funnel metrics"
    ON funnel_metrics FOR UPDATE
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete own funnel metrics"
    ON funnel_metrics FOR DELETE
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add FK to user_projects if that table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'user_projects'
  ) THEN
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

-- Now add enhancement columns

-- Add source column to track where the data came from
ALTER TABLE funnel_metrics
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual'
CHECK (source IN ('manual', 'crm_sync', 'quest', 'api'));

-- Add week_start for weekly tracking comparison
ALTER TABLE funnel_metrics
ADD COLUMN IF NOT EXISTS week_start DATE;

-- Add baseline flag to identify the first entry
ALTER TABLE funnel_metrics
ADD COLUMN IF NOT EXISTS is_baseline BOOLEAN DEFAULT false;

-- Create index for week-based queries
CREATE INDEX IF NOT EXISTS idx_funnel_metrics_week_start
ON funnel_metrics(user_id, week_start);

-- Create index for source-based queries
CREATE INDEX IF NOT EXISTS idx_funnel_metrics_source
ON funnel_metrics(user_id, source);

-- Function to get latest funnel metrics for a user
CREATE OR REPLACE FUNCTION get_latest_funnel_metrics(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  awareness INTEGER,
  attraction INTEGER,
  leadmagnet INTEGER,
  nurture INTEGER,
  core INTEGER,
  upsell INTEGER,
  downsell INTEGER,
  continuity INTEGER,
  total_revenue DECIMAL,
  week_start DATE,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    fm.id,
    fm.awareness,
    fm.attraction,
    fm.leadmagnet,
    fm.nurture,
    fm.core,
    fm.upsell,
    fm.downsell,
    fm.continuity,
    fm.total_revenue,
    fm.week_start,
    fm.created_at
  FROM funnel_metrics fm
  WHERE fm.user_id = p_user_id
    AND fm.mode = 'actual'
  ORDER BY fm.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get week-over-week comparison
CREATE OR REPLACE FUNCTION get_funnel_comparison(p_user_id UUID, p_weeks_back INTEGER DEFAULT 1)
RETURNS TABLE (
  current_awareness INTEGER,
  previous_awareness INTEGER,
  awareness_change DECIMAL,
  current_attraction INTEGER,
  previous_attraction INTEGER,
  attraction_change DECIMAL,
  current_leadmagnet INTEGER,
  previous_leadmagnet INTEGER,
  leadmagnet_change DECIMAL,
  current_core INTEGER,
  previous_core INTEGER,
  core_change DECIMAL
) AS $$
DECLARE
  current_record RECORD;
  previous_record RECORD;
BEGIN
  -- Get current week's data
  SELECT * INTO current_record
  FROM funnel_metrics
  WHERE user_id = p_user_id AND mode = 'actual'
  ORDER BY created_at DESC
  LIMIT 1;

  -- Get previous week's data
  SELECT * INTO previous_record
  FROM funnel_metrics
  WHERE user_id = p_user_id
    AND mode = 'actual'
    AND created_at < current_record.created_at
  ORDER BY created_at DESC
  LIMIT 1;

  RETURN QUERY SELECT
    COALESCE(current_record.awareness, 0),
    COALESCE(previous_record.awareness, 0),
    CASE WHEN COALESCE(previous_record.awareness, 0) > 0
      THEN ((current_record.awareness::DECIMAL - previous_record.awareness) / previous_record.awareness * 100)
      ELSE 0 END,
    COALESCE(current_record.attraction, 0),
    COALESCE(previous_record.attraction, 0),
    CASE WHEN COALESCE(previous_record.attraction, 0) > 0
      THEN ((current_record.attraction::DECIMAL - previous_record.attraction) / previous_record.attraction * 100)
      ELSE 0 END,
    COALESCE(current_record.leadmagnet, 0),
    COALESCE(previous_record.leadmagnet, 0),
    CASE WHEN COALESCE(previous_record.leadmagnet, 0) > 0
      THEN ((current_record.leadmagnet::DECIMAL - previous_record.leadmagnet) / previous_record.leadmagnet * 100)
      ELSE 0 END,
    COALESCE(current_record.core, 0),
    COALESCE(previous_record.core, 0),
    CASE WHEN COALESCE(previous_record.core, 0) > 0
      THEN ((current_record.core::DECIMAL - previous_record.core) / previous_record.core * 100)
      ELSE 0 END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_latest_funnel_metrics(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_funnel_comparison(UUID, INTEGER) TO authenticated;
