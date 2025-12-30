-- Create funnel_plans table for storing user funnel designs
-- This integrates Core Four strategy + Lead Magnet selection into a complete funnel

CREATE TABLE IF NOT EXISTS funnel_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES user_projects(id) ON DELETE SET NULL,

  -- Strategy selections
  core_strategy TEXT NOT NULL,
  lead_magnet_type TEXT,

  -- Funnel steps
  delivery_method TEXT,
  delivery_details TEXT,
  nurture_method TEXT,
  nurture_details TEXT,
  conversion_method TEXT,
  conversion_details TEXT,
  follow_up_plan TEXT,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- One funnel plan per user (can be updated)
  CONSTRAINT unique_user_funnel_plan UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE funnel_plans ENABLE ROW LEVEL SECURITY;

-- Users can only access their own funnel plans
CREATE POLICY "Users can view own funnel plans"
  ON funnel_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own funnel plans"
  ON funnel_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own funnel plans"
  ON funnel_plans FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own funnel plans"
  ON funnel_plans FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_funnel_plans_user_id ON funnel_plans(user_id);
