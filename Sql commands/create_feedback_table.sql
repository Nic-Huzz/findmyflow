-- ========================================
-- FEEDBACK TABLE CREATION
-- ========================================
-- Stores user feedback about their experience with Find My Flow

CREATE TABLE IF NOT EXISTS user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Premise Feedback
  finding_flow_feeling TEXT CHECK (finding_flow_feeling IN ('Excited', 'Curious & open to it', 'Don''t believe in it')),

  -- Essence Archetype Feedback
  essence_initial_feeling TEXT CHECK (essence_initial_feeling IN ('Excited', 'Curious', 'Bored')),
  essence_accuracy TEXT CHECK (essence_accuracy IN ('Seen', 'Like it was half right', 'Not really right')),

  -- Protective Archetype Feedback
  protective_impact TEXT CHECK (protective_impact IN ('Struggling with it lots', 'Occasionally', 'Not at all')),

  -- 7-Day Challenge Portal Feedback
  portal_navigation TEXT CHECK (portal_navigation IN ('Super intuitive: Finding the list of challenges for the 4R''s was easy to find', 'Took me a minute but I got it', 'Super confused, needed to ask for help')),
  portal_feeling TEXT CHECK (portal_feeling IN ('Excited', 'Curious', 'Overwhelmed')),

  -- Open-ended Questions
  what_loved TEXT,
  recommendation TEXT,
  feature_idea TEXT,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure one feedback per user
  CONSTRAINT one_feedback_per_user UNIQUE(user_id)
);

-- RLS Policies for user_feedback
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;

-- Users can view their own feedback
CREATE POLICY "Users can view own feedback"
  ON user_feedback
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own feedback
CREATE POLICY "Users can insert own feedback"
  ON user_feedback
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own feedback
CREATE POLICY "Users can update own feedback"
  ON user_feedback
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own feedback
CREATE POLICY "Users can delete own feedback"
  ON user_feedback
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_user_feedback_user_id ON user_feedback(user_id);
CREATE INDEX idx_user_feedback_created_at ON user_feedback(created_at DESC);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_feedback_updated_at
  BEFORE UPDATE ON user_feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Verify table created
SELECT
  'user_feedback table created successfully' as status,
  COUNT(*) as row_count
FROM user_feedback;
