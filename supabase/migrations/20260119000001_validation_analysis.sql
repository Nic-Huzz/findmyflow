-- =============================================
-- VALIDATION ANALYSIS TABLE
-- Stores AI-generated analysis of validation responses
-- =============================================

-- Table: validation_analysis
CREATE TABLE IF NOT EXISTS validation_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_responses INTEGER NOT NULL DEFAULT 0,
  flows_analyzed INTEGER NOT NULL DEFAULT 1,

  -- AI Analysis Results
  key_insights JSONB, -- Array of top insights
  pain_points JSONB, -- Array of pain points identified
  dream_outcomes JSONB, -- Array of dream outcomes
  objections JSONB, -- Array of objections
  pricing_signals TEXT, -- Summary of pricing insights
  language_patterns JSONB, -- Array of key phrases to use
  question_analysis JSONB, -- Per-question analysis with summaries and quotes
  summary TEXT, -- Overall summary and recommendations

  -- Context from flow placeholders
  context_problem TEXT,
  context_solution TEXT,
  context_audience TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_validation_analysis_user ON validation_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_validation_analysis_created ON validation_analysis(created_at DESC);

-- RLS Policies
ALTER TABLE validation_analysis ENABLE ROW LEVEL SECURITY;

-- Users can view their own analyses
DO $$ BEGIN
CREATE POLICY "Users can view their own validation analyses"
  ON validation_analysis
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own analyses (via Edge Function with service role)
DO $$ BEGIN
CREATE POLICY "Users can insert their own validation analyses"
  ON validation_analysis
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Service role can do everything (for Edge Functions)
DO $$ BEGIN
CREATE POLICY "Service role has full access to validation_analysis"
  ON validation_analysis
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Grant permissions
GRANT SELECT, INSERT ON validation_analysis TO authenticated;

-- Comments
COMMENT ON TABLE validation_analysis IS 'AI-generated analysis of validation survey responses';
COMMENT ON COLUMN validation_analysis.key_insights IS 'Top 3-5 key insights from the data';
COMMENT ON COLUMN validation_analysis.pain_points IS 'Main pain points identified from responses';
COMMENT ON COLUMN validation_analysis.dream_outcomes IS 'What customers want to achieve';
COMMENT ON COLUMN validation_analysis.objections IS 'Common objections or hesitations';
COMMENT ON COLUMN validation_analysis.pricing_signals IS 'Summary of pricing-related insights';
COMMENT ON COLUMN validation_analysis.language_patterns IS 'Key phrases and words to use in messaging';
COMMENT ON COLUMN validation_analysis.question_analysis IS 'Per-question summaries and notable quotes';
