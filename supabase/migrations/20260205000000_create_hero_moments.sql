-- Migration: Create hero_moments table for Journey Map
-- Created: 2026-02-05
-- Purpose: Store user-logged significant journey moments

CREATE TABLE IF NOT EXISTS hero_moments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  moment_text TEXT NOT NULL,
  moment_date DATE NOT NULL,
  act TEXT CHECK (act IN ('matrix', 'awakening', 'training', 'becoming')),
  is_system_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_hero_moments_user_id ON hero_moments(user_id);

-- Index for filtering by act
CREATE INDEX IF NOT EXISTS idx_hero_moments_act ON hero_moments(act);

-- Enable RLS
ALTER TABLE hero_moments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own moments
CREATE POLICY "Users can view own moments"
  ON hero_moments FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own moments
CREATE POLICY "Users can insert own moments"
  ON hero_moments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own moments
CREATE POLICY "Users can update own moments"
  ON hero_moments FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own non-system moments
CREATE POLICY "Users can delete own non-system moments"
  ON hero_moments FOR DELETE
  USING (auth.uid() = user_id AND is_system_generated = false);

-- Comment on table
COMMENT ON TABLE hero_moments IS 'User-logged significant journey moments for the Journey Map visualization';
