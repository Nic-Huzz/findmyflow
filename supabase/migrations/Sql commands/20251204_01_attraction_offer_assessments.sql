-- =============================================
-- ATTRACTION OFFER ASSESSMENTS SYSTEM
-- Stores user responses and recommendations for attraction offer flow
-- =============================================

-- Table: attraction_offer_assessments
-- Stores complete assessment results with recommended offers
CREATE TABLE IF NOT EXISTS attraction_offer_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Linked after authentication
  session_id UUID NOT NULL, -- Anonymous session tracking before auth
  user_name TEXT,
  email TEXT NOT NULL,

  -- User responses to all 10 questions
  responses JSONB NOT NULL, -- { q1_business_model: { value: 'digital_product', label: 'Digital Product' }, ... }

  -- Recommended offer details
  recommended_offer_id TEXT NOT NULL, -- e.g., 'win_your_money_back'
  recommended_offer_name TEXT NOT NULL, -- e.g., 'Win Your Money Back'
  confidence_score DECIMAL(3,2), -- 0.00 to 1.00
  total_score INTEGER, -- Raw weighted score

  -- All offer scores for comparison
  all_offer_scores JSONB, -- [{ id, name, score, confidence, disqualified }, ...]

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Unique constraint on session_id to prevent duplicates
  CONSTRAINT unique_session_id UNIQUE (session_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_attraction_assessments_user ON attraction_offer_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_attraction_assessments_email ON attraction_offer_assessments(email);
CREATE INDEX IF NOT EXISTS idx_attraction_assessments_session ON attraction_offer_assessments(session_id);
CREATE INDEX IF NOT EXISTS idx_attraction_assessments_offer ON attraction_offer_assessments(recommended_offer_id);
CREATE INDEX IF NOT EXISTS idx_attraction_assessments_created ON attraction_offer_assessments(created_at DESC);

-- Function: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_attraction_assessments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update updated_at
CREATE TRIGGER trigger_attraction_assessments_updated_at
  BEFORE UPDATE ON attraction_offer_assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_attraction_assessments_updated_at();

-- RLS Policies
ALTER TABLE attraction_offer_assessments ENABLE ROW LEVEL SECURITY;

-- Anyone (anon or authenticated) can create an assessment
CREATE POLICY "Anyone can create attraction offer assessments"
  ON attraction_offer_assessments
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Users can view their own assessments (by user_id after auth, or by email)
CREATE POLICY "Users can view their own assessments by user_id"
  ON attraction_offer_assessments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own assessments by email"
  ON attraction_offer_assessments
  FOR SELECT
  TO authenticated
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Anyone can view assessment by session_id (for immediate access after completion)
CREATE POLICY "Anyone can view assessments by session"
  ON attraction_offer_assessments
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Users can update their own assessments
CREATE POLICY "Users can update their own assessments"
  ON attraction_offer_assessments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  WITH CHECK (auth.uid() = user_id OR email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON attraction_offer_assessments TO anon, authenticated;

-- Comments
COMMENT ON TABLE attraction_offer_assessments IS 'Stores user responses and recommendations from attraction offer assessment flow';
COMMENT ON COLUMN attraction_offer_assessments.session_id IS 'Anonymous session UUID before authentication';
COMMENT ON COLUMN attraction_offer_assessments.responses IS 'JSONB object containing all 10 question responses';
COMMENT ON COLUMN attraction_offer_assessments.recommended_offer_id IS 'ID of top-scoring attraction offer (e.g., win_your_money_back)';
COMMENT ON COLUMN attraction_offer_assessments.confidence_score IS 'Normalized score (0.00-1.00) for recommended offer';
COMMENT ON COLUMN attraction_offer_assessments.all_offer_scores IS 'Array of all offers with scores for comparison';
