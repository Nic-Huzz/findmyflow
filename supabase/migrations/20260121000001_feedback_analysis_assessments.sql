-- =============================================
-- FEEDBACK ANALYSIS ASSESSMENTS
-- Stores user reflections from Feedback Analysis flow
-- Stage 3: Testing
-- =============================================

-- Table: feedback_analysis_assessments
-- Stores feedback analysis and user reflections
CREATE TABLE IF NOT EXISTS feedback_analysis_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Reference to the validation flow analyzed
  flow_id UUID REFERENCES validation_flows(id) ON DELETE SET NULL,

  -- AI analysis results
  ai_analysis JSONB, -- { overview, highlights, patterns, recommendations }

  -- User reflections
  key_learnings TEXT[] NOT NULL, -- Array of key learnings
  changes TEXT[] NOT NULL, -- Array of changes to make

  -- Stats
  response_count INTEGER DEFAULT 0,

  -- Metadata
  project_id UUID REFERENCES user_projects(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_feedback_analysis_user ON feedback_analysis_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_analysis_flow ON feedback_analysis_assessments(flow_id);
CREATE INDEX IF NOT EXISTS idx_feedback_analysis_project ON feedback_analysis_assessments(project_id);
CREATE INDEX IF NOT EXISTS idx_feedback_analysis_created ON feedback_analysis_assessments(created_at DESC);

-- Function: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_feedback_analysis_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update updated_at
DROP TRIGGER IF EXISTS trigger_feedback_analysis_updated_at ON feedback_analysis_assessments;
CREATE TRIGGER trigger_feedback_analysis_updated_at
  BEFORE UPDATE ON feedback_analysis_assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_feedback_analysis_updated_at();

-- RLS Policies
ALTER TABLE feedback_analysis_assessments ENABLE ROW LEVEL SECURITY;

-- Authenticated users can create assessments
DO $$ BEGIN
CREATE POLICY "Authenticated users can create feedback analysis assessments"
  ON feedback_analysis_assessments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own assessments
DO $$ BEGIN
CREATE POLICY "Users can view their own feedback analysis assessments"
  ON feedback_analysis_assessments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can update their own assessments
DO $$ BEGIN
CREATE POLICY "Users can update their own feedback analysis assessments"
  ON feedback_analysis_assessments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON feedback_analysis_assessments TO authenticated;

-- Comments
COMMENT ON TABLE feedback_analysis_assessments IS 'Stores feedback analysis and user reflections (Stage 3: Testing)';
COMMENT ON COLUMN feedback_analysis_assessments.flow_id IS 'Reference to the validation_flow that was analyzed';
COMMENT ON COLUMN feedback_analysis_assessments.ai_analysis IS 'JSONB containing AI-generated analysis results';
COMMENT ON COLUMN feedback_analysis_assessments.key_learnings IS 'Array of key learnings identified by user';
COMMENT ON COLUMN feedback_analysis_assessments.changes IS 'Array of changes user will make based on feedback';
COMMENT ON COLUMN feedback_analysis_assessments.response_count IS 'Number of feedback responses analyzed';
