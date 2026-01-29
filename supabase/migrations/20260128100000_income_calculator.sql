-- ============================================================================
-- Income Calculator Tables
-- Version: 1.0
-- Date: 2026-01-28
-- Description: Tables for the Income Calculator feature
-- ============================================================================

-- Store calculator submissions (both public and logged-in users)
CREATE TABLE IF NOT EXISTS public_income_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token TEXT NOT NULL,

  -- User info (captured at email gate for public, or from auth for logged-in)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  respondent_name TEXT,
  respondent_email TEXT,

  -- Selections
  business_type TEXT,
  monetization_model TEXT,
  wealth_ladder_level TEXT,
  product_type TEXT,

  -- Inputs
  income_goal NUMERIC NOT NULL,
  model_inputs JSONB NOT NULL DEFAULT '{}',

  -- Visibility assessment
  visibility_ratings JSONB DEFAULT '{}',
  identified_contracts TEXT[] DEFAULT '{}',

  -- Calculated results
  calculated_results JSONB,
  visibility_gap_score NUMERIC,
  recommended_start_model TEXT,
  ecosystem_phase TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_income_calc_email ON public_income_calculations(respondent_email);
CREATE INDEX IF NOT EXISTS idx_income_calc_user ON public_income_calculations(user_id);
CREATE INDEX IF NOT EXISTS idx_income_calc_created ON public_income_calculations(created_at);

-- Enable RLS
ALTER TABLE public_income_calculations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own calculations
CREATE POLICY "Users can view own income calculations"
  ON public_income_calculations
  FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Anyone can insert (for public form submissions)
CREATE POLICY "Anyone can insert income calculations"
  ON public_income_calculations
  FOR INSERT
  WITH CHECK (true);

-- Users can update their own calculations
CREATE POLICY "Users can update own income calculations"
  ON public_income_calculations
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Success message
DO $$ BEGIN RAISE NOTICE 'Income Calculator tables created successfully'; END $$;
