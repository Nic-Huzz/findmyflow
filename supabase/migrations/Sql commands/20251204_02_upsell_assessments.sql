-- =============================================
-- UPSELL ASSESSMENTS SYSTEM
-- Stores user responses and recommendations for upsell offer flow
-- =============================================

-- Table: upsell_assessments
-- Stores complete assessment results with recommended upsell strategies
CREATE TABLE IF NOT EXISTS upsell_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Linked after authentication
  session_id UUID NOT NULL, -- Anonymous session tracking before auth
  user_name TEXT,
  email TEXT NOT NULL,

  -- User responses to all 10 questions
  responses JSONB NOT NULL, -- { q1_customer_base_size: { value: 'established_customer_base', label: 'Established Customer Base' }, ... }

  -- Recommended upsell strategy details
  recommended_offer_id TEXT NOT NULL, -- e.g., 'classic_upsell', 'menu_upsell', 'anchor_upsell', 'rollover_upsell'
  recommended_offer_name TEXT NOT NULL, -- e.g., 'Classic Upsell', 'Menu Upsell'
  confidence_score DECIMAL(3,2), -- 0.00 to 1.00
  total_score INTEGER, -- Raw weighted score

  -- All offer scores for comparison
  all_offer_scores JSONB, -- [{ id, name, score, confidence, disqualified }, ...]

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Unique constraint on session_id to prevent duplicates
  CONSTRAINT unique_upsell_session_id UNIQUE (session_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_upsell_assessments_user ON upsell_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_upsell_assessments_email ON upsell_assessments(email);
CREATE INDEX IF NOT EXISTS idx_upsell_assessments_session ON upsell_assessments(session_id);
CREATE INDEX IF NOT EXISTS idx_upsell_assessments_offer ON upsell_assessments(recommended_offer_id);
CREATE INDEX IF NOT EXISTS idx_upsell_assessments_created ON upsell_assessments(created_at DESC);

-- Function: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_upsell_assessments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update updated_at
DROP TRIGGER IF EXISTS trigger_upsell_assessments_updated_at ON upsell_assessments;
CREATE TRIGGER trigger_upsell_assessments_updated_at
  BEFORE UPDATE ON upsell_assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_upsell_assessments_updated_at();

-- RLS Policies
ALTER TABLE upsell_assessments ENABLE ROW LEVEL SECURITY;

-- Anyone (anon or authenticated) can create an assessment
CREATE POLICY "Anyone can create upsell assessments"
  ON upsell_assessments
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Users can view their own assessments (by user_id after auth, or by email)
CREATE POLICY "Users can view their own upsell assessments by user_id"
  ON upsell_assessments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own upsell assessments by email"
  ON upsell_assessments
  FOR SELECT
  TO authenticated
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Anyone can view assessment by session_id (for immediate access after completion)
CREATE POLICY "Anyone can view upsell assessments by session"
  ON upsell_assessments
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Users can update their own assessments
CREATE POLICY "Users can update their own upsell assessments"
  ON upsell_assessments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  WITH CHECK (auth.uid() = user_id OR email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON upsell_assessments TO anon, authenticated;

-- Comments
COMMENT ON TABLE upsell_assessments IS 'Stores user responses and recommendations from upsell assessment flow';
COMMENT ON COLUMN upsell_assessments.session_id IS 'Anonymous session UUID before authentication';
COMMENT ON COLUMN upsell_assessments.responses IS 'JSONB object containing all 10 question responses';
COMMENT ON COLUMN upsell_assessments.recommended_offer_id IS 'ID of top-scoring upsell strategy (e.g., classic_upsell, menu_upsell, anchor_upsell, rollover_upsell)';
COMMENT ON COLUMN upsell_assessments.confidence_score IS 'Normalized score (0.00-1.00) for recommended upsell strategy';
COMMENT ON COLUMN upsell_assessments.all_offer_scores IS 'Array of all 4 upsell strategies with scores for comparison';
