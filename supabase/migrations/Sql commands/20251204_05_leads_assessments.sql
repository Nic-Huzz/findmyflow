-- =============================================
-- LEADS STRATEGY ASSESSMENTS SYSTEM
-- Stores user responses and recommendations for leads strategy flow
-- =============================================

-- Table: leads_assessments
-- Stores complete assessment results with recommended lead generation strategies
CREATE TABLE IF NOT EXISTS leads_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Linked after authentication
  session_id UUID NOT NULL, -- Anonymous session tracking before auth
  user_name TEXT,
  email TEXT NOT NULL,

  -- User responses to all 10 questions
  responses JSONB NOT NULL, -- { q1_network_size: { value: 'large_network_500_plus', label: 'Large Network (500+)' }, ... }

  -- Recommended strategy details
  recommended_strategy_id TEXT NOT NULL, -- e.g., 'warm_outreach', 'cold_outreach', 'post_free_content', 'run_paid_ads'
  recommended_strategy_name TEXT NOT NULL, -- e.g., 'Warm Outreach'
  confidence_score DECIMAL(3,2), -- 0.00 to 1.00
  total_score INTEGER, -- Raw weighted score

  -- All strategy scores for comparison
  all_strategy_scores JSONB, -- [{ id, name, score, confidence, disqualified }, ...]

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Unique constraint on session_id to prevent duplicates
  CONSTRAINT unique_leads_session_id UNIQUE (session_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_assessments_user ON leads_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_assessments_email ON leads_assessments(email);
CREATE INDEX IF NOT EXISTS idx_leads_assessments_session ON leads_assessments(session_id);
CREATE INDEX IF NOT EXISTS idx_leads_assessments_strategy ON leads_assessments(recommended_strategy_id);
CREATE INDEX IF NOT EXISTS idx_leads_assessments_created ON leads_assessments(created_at DESC);

-- Function: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_leads_assessments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update updated_at
DROP TRIGGER IF EXISTS trigger_leads_assessments_updated_at ON leads_assessments;
CREATE TRIGGER trigger_leads_assessments_updated_at
  BEFORE UPDATE ON leads_assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_leads_assessments_updated_at();

-- RLS Policies
ALTER TABLE leads_assessments ENABLE ROW LEVEL SECURITY;

-- Anyone (anon or authenticated) can create an assessment
CREATE POLICY "Anyone can create leads strategy assessments"
  ON leads_assessments
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Users can view their own assessments (by user_id after auth, or by email)
CREATE POLICY "Users can view their own leads assessments by user_id"
  ON leads_assessments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own leads assessments by email"
  ON leads_assessments
  FOR SELECT
  TO authenticated
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Anyone can view assessment by session_id (for immediate access after completion)
CREATE POLICY "Anyone can view leads assessments by session"
  ON leads_assessments
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Users can update their own assessments
CREATE POLICY "Users can update their own leads assessments"
  ON leads_assessments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  WITH CHECK (auth.uid() = user_id OR email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON leads_assessments TO anon, authenticated;

-- Comments
COMMENT ON TABLE leads_assessments IS 'Stores user responses and recommendations from leads strategy assessment flow';
COMMENT ON COLUMN leads_assessments.session_id IS 'Anonymous session UUID before authentication';
COMMENT ON COLUMN leads_assessments.responses IS 'JSONB object containing all 10 question responses';
COMMENT ON COLUMN leads_assessments.recommended_strategy_id IS 'ID of top-scoring lead generation strategy (warm_outreach, cold_outreach, post_free_content, run_paid_ads)';
COMMENT ON COLUMN leads_assessments.confidence_score IS 'Normalized score (0.00-1.00) for recommended strategy';
COMMENT ON COLUMN leads_assessments.all_strategy_scores IS 'Array of all strategies with scores for comparison';
