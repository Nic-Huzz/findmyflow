-- Story Bank: Library of reusable content organized by category
-- Users pre-capture stories, contrarian takes, client wins, etc.
-- AI pulls from this when generating content

CREATE TABLE IF NOT EXISTS story_bank (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Category determines what type of content this story is good for
  category TEXT NOT NULL CHECK (category IN (
    'transformation_story',    -- Your own transformation or client transformations
    'client_win',              -- Specific client success stories with details
    'failure_lesson',          -- Mistakes you made and what you learned
    'contrarian_take',         -- Unpopular opinions you hold strongly
    'behind_scenes',           -- Daily routine, how you work, tools, process
    'framework',               -- Methods/systems you've developed
    'origin_story',            -- How you got started (may overlap with voice profile)
    'analogy',                 -- Useful analogies/metaphors you use
    'data_point',              -- Statistics, research, proof points
    'quote'                    -- Memorable quotes you like to use
  )),

  -- Content
  title TEXT,                   -- Optional short title/label
  content TEXT NOT NULL,        -- The actual story/content

  -- Optional metadata
  tags TEXT[] DEFAULT '{}',     -- Additional tags for filtering
  is_favorite BOOLEAN DEFAULT false,  -- Mark important stories
  use_count INTEGER DEFAULT 0,  -- Track how often AI has used this

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX idx_story_bank_user ON story_bank(user_id);
CREATE INDEX idx_story_bank_category ON story_bank(user_id, category);
CREATE INDEX idx_story_bank_created ON story_bank(created_at DESC);

-- RLS Policies
ALTER TABLE story_bank ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own stories"
  ON story_bank FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own stories"
  ON story_bank FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stories"
  ON story_bank FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stories"
  ON story_bank FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_story_bank_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER story_bank_updated_at
  BEFORE UPDATE ON story_bank
  FOR EACH ROW
  EXECUTE FUNCTION update_story_bank_updated_at();

-- Also add a quick_context column to marketing_tasks for per-post context
ALTER TABLE marketing_tasks
ADD COLUMN IF NOT EXISTS quick_context TEXT,
ADD COLUMN IF NOT EXISTS quick_context_used BOOLEAN DEFAULT false;

COMMENT ON TABLE story_bank IS 'Library of reusable content (stories, takes, wins) for AI content generation';
COMMENT ON COLUMN story_bank.category IS 'Content type this story is suited for';
COMMENT ON COLUMN story_bank.use_count IS 'Tracks how often AI has pulled from this story';
COMMENT ON COLUMN marketing_tasks.quick_context IS 'User-provided context/brain dump for this specific post';
