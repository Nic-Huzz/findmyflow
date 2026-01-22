-- =============================================
-- MVP READINESS ASSESSMENTS
-- Stores user responses from MVP Readiness flow
-- Stage 3: Testing
-- =============================================

-- Table: mvp_readiness_assessments
-- Stores MVP readiness assessment responses
CREATE TABLE IF NOT EXISTS mvp_readiness_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Core assessment fields
  is_ready_to_test BOOLEAN NOT NULL, -- True = ready, False = needs to build MVP first
  selected_product JSONB NOT NULL, -- { id, label, description, solutionType }
  mvp_definition TEXT, -- Only filled if is_ready_to_test = false
  has_testers BOOLEAN NOT NULL, -- True = knows testers, False = needs access plan
  testers TEXT[], -- Array of tester names (3-5)
  access_plan TEXT, -- Only filled if has_testers = false

  -- Metadata
  project_id UUID REFERENCES user_projects(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_mvp_readiness_user ON mvp_readiness_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_mvp_readiness_project ON mvp_readiness_assessments(project_id);
CREATE INDEX IF NOT EXISTS idx_mvp_readiness_created ON mvp_readiness_assessments(created_at DESC);

-- Function: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_mvp_readiness_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update updated_at
DROP TRIGGER IF EXISTS trigger_mvp_readiness_updated_at ON mvp_readiness_assessments;
CREATE TRIGGER trigger_mvp_readiness_updated_at
  BEFORE UPDATE ON mvp_readiness_assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_mvp_readiness_updated_at();

-- RLS Policies
ALTER TABLE mvp_readiness_assessments ENABLE ROW LEVEL SECURITY;

-- Authenticated users can create assessments
DO $$ BEGIN
CREATE POLICY "Authenticated users can create mvp readiness assessments"
  ON mvp_readiness_assessments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own assessments
DO $$ BEGIN
CREATE POLICY "Users can view their own mvp readiness assessments"
  ON mvp_readiness_assessments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can update their own assessments
DO $$ BEGIN
CREATE POLICY "Users can update their own mvp readiness assessments"
  ON mvp_readiness_assessments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON mvp_readiness_assessments TO authenticated;

-- Comments
COMMENT ON TABLE mvp_readiness_assessments IS 'Stores MVP readiness assessment responses (Stage 3: Testing)';
COMMENT ON COLUMN mvp_readiness_assessments.is_ready_to_test IS 'True if user has something ready to test, False if needs to build MVP';
COMMENT ON COLUMN mvp_readiness_assessments.selected_product IS 'JSONB object with selected product details from Offer Builder';
COMMENT ON COLUMN mvp_readiness_assessments.mvp_definition IS 'User-defined MVP version (only if is_ready_to_test = false)';
COMMENT ON COLUMN mvp_readiness_assessments.has_testers IS 'True if user knows 3-5 testers, False if needs access plan';
COMMENT ON COLUMN mvp_readiness_assessments.testers IS 'Array of 3-5 tester names';
COMMENT ON COLUMN mvp_readiness_assessments.access_plan IS 'Plan for accessing target audience (only if has_testers = false)';
