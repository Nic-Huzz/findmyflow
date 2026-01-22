-- =============================================
-- IMPLEMENTATION COACH ANALYTICS
-- Tracks usage of the AI Implementation Coach (Tier 3)
-- =============================================

CREATE TABLE IF NOT EXISTS coach_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES user_projects(id) ON DELETE CASCADE,

  -- Event details
  event_type TEXT NOT NULL, -- 'coach_opened', 'generation_started', 'generation_completed', 'content_copied', 'content_saved', 'content_regenerated', 'task_completed'

  -- Context
  category TEXT, -- 'attraction', 'upsell', 'downsell', 'continuity'
  task_title TEXT,
  template_id TEXT, -- Which template was used
  template_type TEXT, -- 'headline', 'email', 'script', 'pitch', 'strategy'

  -- Generation metrics (for generation events)
  model_used TEXT, -- 'haiku', 'sonnet'
  generation_time_ms INTEGER,

  -- Outcome (for completed events)
  was_saved BOOLEAN,
  was_copied BOOLEAN,
  regeneration_count INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_coach_analytics_user ON coach_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_coach_analytics_event ON coach_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_coach_analytics_category ON coach_analytics(category);
CREATE INDEX IF NOT EXISTS idx_coach_analytics_template ON coach_analytics(template_id);
CREATE INDEX IF NOT EXISTS idx_coach_analytics_created ON coach_analytics(created_at DESC);

-- RLS Policies
ALTER TABLE coach_analytics ENABLE ROW LEVEL SECURITY;

-- Users can view their own analytics
DO $$ BEGIN
CREATE POLICY "Users can view their own coach analytics"
  ON coach_analytics
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can create their own analytics events
DO $$ BEGIN
CREATE POLICY "Users can create their own coach analytics"
  ON coach_analytics
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON coach_analytics TO authenticated;

-- Comments
COMMENT ON TABLE coach_analytics IS 'Tracks Implementation Coach usage for optimization and insights';
COMMENT ON COLUMN coach_analytics.event_type IS 'Type of event: coach_opened, generation_started, generation_completed, content_copied, content_saved, content_regenerated, task_completed';
COMMENT ON COLUMN coach_analytics.template_id IS 'ID of the template used for generation';
COMMENT ON COLUMN coach_analytics.regeneration_count IS 'Number of times user regenerated content in this session';
