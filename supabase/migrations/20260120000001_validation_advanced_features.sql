-- =============================================
-- VALIDATION ANALYSIS - ADVANCED FEATURES
-- Adds segmentation, actionable todos, competitor analysis,
-- validation score, and voice of customer database
-- =============================================

-- =============================================
-- 1. RESPONSE SEGMENTATION
-- Segment insights by budget, pain intensity, solution preference
-- =============================================

ALTER TABLE validation_analysis
ADD COLUMN IF NOT EXISTS segmentation JSONB;
-- Structure:
-- {
--   "high_intent": { "pain_points": [...], "dream_outcomes": [...], "count": 3 },
--   "budget_conscious": { "pain_points": [...], "objections": [...], "count": 2 },
--   "solution_seekers": { "pain_points": [...], "dream_outcomes": [...], "count": 4 }
-- }

COMMENT ON COLUMN validation_analysis.segmentation IS 'Response segmentation by audience type (high_intent, budget_conscious, solution_seekers)';

-- =============================================
-- 2. ACTIONABLE TO-DOS
-- AI-generated tasks from insights
-- =============================================

ALTER TABLE validation_analysis
ADD COLUMN IF NOT EXISTS suggested_actions JSONB;
-- Structure:
-- [
--   { "action": "Update headline to include clarity", "source": "Language mentioned 8x", "priority": "high", "category": "messaging" },
--   { "action": "Add payment plan option", "source": "3 cited budget as blocker", "priority": "medium", "category": "pricing" }
-- ]

COMMENT ON COLUMN validation_analysis.suggested_actions IS 'AI-generated actionable tasks derived from validation insights';

-- =============================================
-- 3. COMPETITOR/ALTERNATIVE ANALYSIS
-- What respondents have tried before and why it failed
-- =============================================

ALTER TABLE validation_analysis
ADD COLUMN IF NOT EXISTS competitor_analysis JSONB;
-- Structure:
-- {
--   "alternatives_mentioned": ["DIY courses", "Generic coaching", "Free YouTube content"],
--   "why_they_failed": ["Too broad", "No accountability", "Overwhelming"],
--   "gaps_to_fill": ["Personalized approach", "Step-by-step guidance", "Community support"],
--   "positioning_opportunity": "Focused, personalized, with built-in accountability"
-- }

COMMENT ON COLUMN validation_analysis.competitor_analysis IS 'Analysis of alternatives respondents have tried and gaps to fill';

-- =============================================
-- 4. VALIDATION SCORE
-- Aggregate metric combining multiple factors
-- =============================================

ALTER TABLE validation_analysis
ADD COLUMN IF NOT EXISTS validation_score JSONB;
-- Structure:
-- {
--   "overall": 73,
--   "components": {
--     "interest": { "score": 82, "reason": "High response rate, engaged answers" },
--     "urgency": { "score": 64, "reason": "Moderate pain intensity language" },
--     "budget": { "score": 71, "reason": "Willing to pay $200-500 range" },
--     "fit": { "score": 78, "reason": "Strong alignment with your offer" }
--   },
--   "recommendation": "Strong signal. Ready to move to Stage 2.",
--   "confidence": "medium"
-- }

COMMENT ON COLUMN validation_analysis.validation_score IS 'Aggregate validation strength score (0-100) with component breakdown';

-- =============================================
-- 5. VOICE OF CUSTOMER DATABASE
-- Searchable database of customer quotes and language
-- =============================================

CREATE TABLE IF NOT EXISTS voice_of_customer (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_id UUID REFERENCES validation_analysis(id) ON DELETE SET NULL,
  flow_id UUID,

  -- The quote/phrase
  quote TEXT NOT NULL,

  -- Categorization
  category TEXT NOT NULL, -- 'pain_point', 'dream_outcome', 'objection', 'language', 'competitor', 'pricing'
  subcategory TEXT, -- More specific categorization

  -- Metadata
  emotion TEXT, -- 'frustrated', 'hopeful', 'confused', 'excited', etc.
  intensity INTEGER CHECK (intensity >= 1 AND intensity <= 10), -- 1-10 scale

  -- Context
  question_asked TEXT,
  respondent_segment TEXT, -- 'high_intent', 'budget_conscious', etc.

  -- Search optimization
  keywords TEXT[], -- Extracted keywords for search

  -- Usage tracking
  times_used INTEGER DEFAULT 0, -- How many times copied/used
  last_used_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for search performance
CREATE INDEX IF NOT EXISTS idx_voc_user ON voice_of_customer(user_id);
CREATE INDEX IF NOT EXISTS idx_voc_category ON voice_of_customer(category);
CREATE INDEX IF NOT EXISTS idx_voc_keywords ON voice_of_customer USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_voc_quote_search ON voice_of_customer USING GIN(to_tsvector('english', quote));
CREATE INDEX IF NOT EXISTS idx_voc_emotion ON voice_of_customer(emotion);
CREATE INDEX IF NOT EXISTS idx_voc_intensity ON voice_of_customer(intensity DESC);

-- RLS Policies
ALTER TABLE voice_of_customer ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
CREATE POLICY "Users can view their own VoC entries"
  ON voice_of_customer
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DO $$ BEGIN
CREATE POLICY "Users can insert their own VoC entries"
  ON voice_of_customer
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DO $$ BEGIN
CREATE POLICY "Users can update their own VoC entries"
  ON voice_of_customer
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

DO $$ BEGIN
CREATE POLICY "Service role has full access to VoC"
  ON voice_of_customer
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON voice_of_customer TO authenticated;

-- Function to search Voice of Customer
CREATE OR REPLACE FUNCTION search_voice_of_customer(
  p_user_id UUID,
  p_query TEXT,
  p_category TEXT DEFAULT NULL,
  p_emotion TEXT DEFAULT NULL,
  p_min_intensity INTEGER DEFAULT NULL,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  quote TEXT,
  category TEXT,
  emotion TEXT,
  intensity INTEGER,
  keywords TEXT[],
  relevance REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    voc.id,
    voc.quote,
    voc.category,
    voc.emotion,
    voc.intensity,
    voc.keywords,
    ts_rank(to_tsvector('english', voc.quote), plainto_tsquery('english', p_query)) as relevance
  FROM voice_of_customer voc
  WHERE voc.user_id = p_user_id
    AND (p_category IS NULL OR voc.category = p_category)
    AND (p_emotion IS NULL OR voc.emotion = p_emotion)
    AND (p_min_intensity IS NULL OR voc.intensity >= p_min_intensity)
    AND (p_query = '' OR to_tsvector('english', voc.quote) @@ plainto_tsquery('english', p_query))
  ORDER BY
    CASE WHEN p_query != '' THEN ts_rank(to_tsvector('english', voc.quote), plainto_tsquery('english', p_query)) ELSE 0 END DESC,
    voc.intensity DESC NULLS LAST,
    voc.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON TABLE voice_of_customer IS 'Searchable database of customer quotes and language patterns extracted from validation responses';
COMMENT ON FUNCTION search_voice_of_customer IS 'Full-text search across Voice of Customer database with filtering';
