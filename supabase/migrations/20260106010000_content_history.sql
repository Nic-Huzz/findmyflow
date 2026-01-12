-- Content History Table
-- Stores generated content for calendar planning and history tracking

CREATE TABLE IF NOT EXISTS content_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES user_projects(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  content_type TEXT NOT NULL,
  platform TEXT NOT NULL,
  scheduled_day TEXT, -- 'mon', 'tue', etc.
  scheduled_date DATE,
  status TEXT DEFAULT 'draft', -- 'draft', 'scheduled', 'posted', 'archived'
  posted_at TIMESTAMPTZ,
  engagement_data JSONB DEFAULT '{}', -- likes, comments, shares, etc.
  voice_profile_id UUID REFERENCES voice_profiles(id) ON DELETE SET NULL,
  batch_id UUID, -- for grouping batch-generated content
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_content_history_user ON content_history(user_id);
CREATE INDEX IF NOT EXISTS idx_content_history_project ON content_history(project_id);
CREATE INDEX IF NOT EXISTS idx_content_history_status ON content_history(status);
CREATE INDEX IF NOT EXISTS idx_content_history_platform ON content_history(platform);
CREATE INDEX IF NOT EXISTS idx_content_history_scheduled ON content_history(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_content_history_batch ON content_history(batch_id);

-- RLS Policies
ALTER TABLE content_history ENABLE ROW LEVEL SECURITY;

-- Users can only see their own content
CREATE POLICY "Users can view own content history"
  ON content_history FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own content
CREATE POLICY "Users can insert own content"
  ON content_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own content
CREATE POLICY "Users can update own content"
  ON content_history FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own content
CREATE POLICY "Users can delete own content"
  ON content_history FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_content_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER content_history_updated_at
  BEFORE UPDATE ON content_history
  FOR EACH ROW
  EXECUTE FUNCTION update_content_history_updated_at();

COMMENT ON TABLE content_history IS 'Stores generated content for calendar planning and tracking posted content';
COMMENT ON COLUMN content_history.status IS 'Content status: draft, scheduled, posted, archived';
COMMENT ON COLUMN content_history.engagement_data IS 'JSON object with engagement metrics after posting';
