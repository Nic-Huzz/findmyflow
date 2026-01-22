-- Launch Readiness Assessments table
-- Stores results from the Launch Readiness Check flow

CREATE TABLE IF NOT EXISTS launch_readiness_assessments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Sales Infrastructure
  sales_data JSONB DEFAULT '{}'::jsonb,

  -- Pricing
  pricing_data JSONB DEFAULT '{}'::jsonb,

  -- Social Proof
  proof_data JSONB DEFAULT '{}'::jsonb,

  -- Audience
  audience_data JSONB DEFAULT '{}'::jsonb,

  -- Launch Approach
  launch_approach TEXT,
  launch_notes TEXT,

  -- Results
  readiness_score INTEGER DEFAULT 0,
  readiness_grade TEXT,
  gaps JSONB DEFAULT '[]'::jsonb,
  strengths JSONB DEFAULT '[]'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_launch_readiness_user_id ON launch_readiness_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_launch_readiness_created_at ON launch_readiness_assessments(created_at DESC);

-- RLS policies
ALTER TABLE launch_readiness_assessments ENABLE ROW LEVEL SECURITY;

-- Users can view their own assessments
DO $$ BEGIN
  CREATE POLICY "Users can view own launch readiness assessments"
    ON launch_readiness_assessments
    FOR SELECT
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Users can insert their own assessments
DO $$ BEGIN
  CREATE POLICY "Users can insert own launch readiness assessments"
    ON launch_readiness_assessments
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Users can update their own assessments
DO $$ BEGIN
  CREATE POLICY "Users can update own launch readiness assessments"
    ON launch_readiness_assessments
    FOR UPDATE
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
