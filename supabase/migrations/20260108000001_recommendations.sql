-- Recommendations Table for AI-Generated Suggestions
-- Part of Phase 2: Recommendations Engine

CREATE TABLE IF NOT EXISTS recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Categorization
  category TEXT NOT NULL, -- 'sales', 'marketing', 'pricing', 'capacity', 'funnel'
  priority TEXT NOT NULL DEFAULT 'medium', -- 'high', 'medium', 'low'

  -- Content
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  action_text TEXT, -- CTA button text
  action_url TEXT, -- Deep link to relevant feature

  -- Context
  trigger_type TEXT NOT NULL, -- 'funnel_health', 'win_loss_pattern', 'competitor', 'capacity', 'scheduled'
  trigger_data JSONB, -- Data that triggered this recommendation

  -- Status tracking
  status TEXT DEFAULT 'pending', -- 'pending', 'viewed', 'acted', 'dismissed', 'expired'
  viewed_at TIMESTAMPTZ,
  acted_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ, -- Auto-expire old recommendations

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_recommendations_user ON recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_status ON recommendations(status);
CREATE INDEX IF NOT EXISTS idx_recommendations_category ON recommendations(category);
CREATE INDEX IF NOT EXISTS idx_recommendations_priority ON recommendations(priority, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recommendations_pending ON recommendations(user_id, status)
  WHERE status = 'pending';

-- RLS
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own recommendations"
  ON recommendations FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own recommendations"
  ON recommendations FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role can insert (for Edge Function)
CREATE POLICY "Service can insert recommendations"
  ON recommendations FOR INSERT TO service_role
  WITH CHECK (true);

-- Also allow authenticated users to have recommendations inserted for them
CREATE POLICY "Users can have recommendations created"
  ON recommendations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON recommendations TO authenticated;
GRANT ALL ON recommendations TO service_role;

-- Function to auto-expire old recommendations
CREATE OR REPLACE FUNCTION expire_old_recommendations()
RETURNS void AS $$
BEGIN
  UPDATE recommendations
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'pending'
    AND expires_at IS NOT NULL
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment
COMMENT ON TABLE recommendations IS 'AI-generated recommendations based on user data analysis';
