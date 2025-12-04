-- =============================================
-- DOWNSELL ASSESSMENTS SYSTEM
-- Stores user responses and recommendations for downsell offer flow
-- =============================================

-- Table: downsell_assessments
CREATE TABLE IF NOT EXISTS downsell_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id UUID NOT NULL,
  user_name TEXT,
  email TEXT NOT NULL,

  -- User responses to all 10 questions
  responses JSONB NOT NULL,

  -- Recommended offer details
  recommended_offer_id TEXT NOT NULL,
  recommended_offer_name TEXT NOT NULL,
  confidence_score DECIMAL(3,2),
  total_score INTEGER,

  -- All offer scores for comparison
  all_offer_scores JSONB,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT downsell_unique_session_id UNIQUE (session_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_downsell_assessments_user ON downsell_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_downsell_assessments_email ON downsell_assessments(email);
CREATE INDEX IF NOT EXISTS idx_downsell_assessments_session ON downsell_assessments(session_id);
CREATE INDEX IF NOT EXISTS idx_downsell_assessments_offer ON downsell_assessments(recommended_offer_id);
CREATE INDEX IF NOT EXISTS idx_downsell_assessments_created ON downsell_assessments(created_at DESC);

-- Function: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_downsell_assessments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update updated_at
DROP TRIGGER IF EXISTS trigger_downsell_assessments_updated_at ON downsell_assessments;
CREATE TRIGGER trigger_downsell_assessments_updated_at
  BEFORE UPDATE ON downsell_assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_downsell_assessments_updated_at();

-- RLS Policies
ALTER TABLE downsell_assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can create downsell assessments" ON downsell_assessments;
CREATE POLICY "Anyone can create downsell assessments"
  ON downsell_assessments
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view their own assessments by user_id" ON downsell_assessments;
CREATE POLICY "Users can view their own assessments by user_id"
  ON downsell_assessments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own assessments by email" ON downsell_assessments;
CREATE POLICY "Users can view their own assessments by email"
  ON downsell_assessments
  FOR SELECT
  TO authenticated
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Anyone can view assessments by session" ON downsell_assessments;
CREATE POLICY "Anyone can view assessments by session"
  ON downsell_assessments
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can update their own assessments" ON downsell_assessments;
CREATE POLICY "Users can update their own assessments"
  ON downsell_assessments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  WITH CHECK (auth.uid() = user_id OR email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON downsell_assessments TO anon, authenticated;

-- Comments
COMMENT ON TABLE downsell_assessments IS 'Stores user responses and recommendations from downsell offer assessment flow';
COMMENT ON COLUMN downsell_assessments.session_id IS 'Anonymous session UUID before authentication';
COMMENT ON COLUMN downsell_assessments.responses IS 'JSONB object containing all 10 question responses';
COMMENT ON COLUMN downsell_assessments.recommended_offer_id IS 'ID of top-scoring downsell offer';
COMMENT ON COLUMN downsell_assessments.confidence_score IS 'Normalized score (0.00-1.00) for recommended offer';
COMMENT ON COLUMN downsell_assessments.all_offer_scores IS 'Array of all offers with scores for comparison';
