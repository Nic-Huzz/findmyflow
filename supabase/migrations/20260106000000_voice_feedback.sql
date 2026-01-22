-- Voice Feedback Table
-- Stores user feedback when generated content doesn't match their voice
-- Used to improve voice profiles over time

CREATE TABLE IF NOT EXISTS voice_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  voice_profile_id UUID REFERENCES voice_profiles(id) ON DELETE SET NULL,
  content_type TEXT NOT NULL,
  platform TEXT NOT NULL,
  generated_content TEXT NOT NULL,
  feedback_options TEXT[] NOT NULL DEFAULT '{}',
  feedback_comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_voice_feedback_user ON voice_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_feedback_profile ON voice_feedback(voice_profile_id);
CREATE INDEX IF NOT EXISTS idx_voice_feedback_created ON voice_feedback(created_at DESC);

-- RLS Policies
ALTER TABLE voice_feedback ENABLE ROW LEVEL SECURITY;

-- Users can only see their own feedback
DO $$ BEGIN
CREATE POLICY "Users can view own voice feedback"
  ON voice_feedback FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own feedback
DO $$ BEGIN
CREATE POLICY "Users can insert own voice feedback"
  ON voice_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own feedback
DO $$ BEGIN
CREATE POLICY "Users can delete own voice feedback"
  ON voice_feedback FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON TABLE voice_feedback IS 'Stores user feedback on generated content to improve voice matching';
COMMENT ON COLUMN voice_feedback.feedback_options IS 'Array of feedback option IDs: too_formal, too_casual, wrong_tone, not_my_words, too_generic, missing_personality, wrong_structure, other';
