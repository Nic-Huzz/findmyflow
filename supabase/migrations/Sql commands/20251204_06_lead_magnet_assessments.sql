-- =============================================
-- LEAD MAGNET ASSESSMENTS SYSTEM
-- Stores user responses and recommendations for lead magnet flow
-- =============================================

-- Table: lead_magnet_assessments
-- Stores complete assessment results with recommended lead generation strategies
CREATE TABLE IF NOT EXISTS lead_magnet_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Linked after authentication
  session_id UUID NOT NULL, -- Anonymous session tracking before auth
  user_name TEXT,
  email TEXT NOT NULL,

  -- User responses to all 10 questions
  responses JSONB NOT NULL, -- { q1_network_size: { value: 'large_network_500_plus', label: 'Large Network (500+)' }, ... }

  -- Recommended strategy details
  recommended_type_id TEXT NOT NULL, -- e.g., 'warm_outreach', 'cold_outreach', 'post_free_content', 'run_paid_ads'
  recommended_type_name TEXT NOT NULL, -- e.g., 'Warm Outreach'
  confidence_score DECIMAL(3,2), -- 0.00 to 1.00
  total_score INTEGER, -- Raw weighted score

  -- All strategy scores for comparison
  all_type_scores JSONB, -- [{ id, name, score, confidence, disqualified }, ...]

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Unique constraint on session_id to prevent duplicates
  CONSTRAINT unique_lead_magnet_session_id UNIQUE (session_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_lead_magnet_assessments_user ON lead_magnet_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_lead_magnet_assessments_email ON lead_magnet_assessments(email);
CREATE INDEX IF NOT EXISTS idx_lead_magnet_assessments_session ON lead_magnet_assessments(session_id);
CREATE INDEX IF NOT EXISTS idx_lead_magnet_assessments_strategy ON lead_magnet_assessments(recommended_type_id);
CREATE INDEX IF NOT EXISTS idx_lead_magnet_assessments_created ON lead_magnet_assessments(created_at DESC);

-- Function: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_lead_magnet_assessments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update updated_at
DROP TRIGGER IF EXISTS trigger_lead_magnet_assessments_updated_at ON lead_magnet_assessments;
CREATE TRIGGER trigger_lead_magnet_assessments_updated_at
  BEFORE UPDATE ON lead_magnet_assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_lead_magnet_assessments_updated_at();

-- RLS Policies
ALTER TABLE lead_magnet_assessments ENABLE ROW LEVEL SECURITY;

-- Anyone (anon or authenticated) can create an assessment
CREATE POLICY "Anyone can create lead magnet assessments"
  ON lead_magnet_assessments
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Users can view their own assessments (by user_id after auth, or by email)
CREATE POLICY "Users can view their own leads assessments by user_id"
  ON lead_magnet_assessments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own leads assessments by email"
  ON lead_magnet_assessments
  FOR SELECT
  TO authenticated
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Anyone can view assessment by session_id (for immediate access after completion)
CREATE POLICY "Anyone can view leads assessments by session"
  ON lead_magnet_assessments
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Users can update their own assessments
CREATE POLICY "Users can update their own leads assessments"
  ON lead_magnet_assessments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  WITH CHECK (auth.uid() = user_id OR email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON lead_magnet_assessments TO anon, authenticated;

-- Comments
COMMENT ON TABLE lead_magnet_assessments IS 'Stores user responses and recommendations from lead magnet assessment flow';
COMMENT ON COLUMN lead_magnet_assessments.session_id IS 'Anonymous session UUID before authentication';
COMMENT ON COLUMN lead_magnet_assessments.responses IS 'JSONB object containing all 10 question responses';
COMMENT ON COLUMN lead_magnet_assessments.recommended_type_id IS 'ID of top-scoring lead magnet type (warm_outreach, cold_outreach, post_free_content, run_paid_ads)';
COMMENT ON COLUMN lead_magnet_assessments.confidence_score IS 'Normalized score (0.00-1.00) for recommended strategy';
COMMENT ON COLUMN lead_magnet_assessments.all_type_scores IS 'Array of all strategies with scores for comparison';
