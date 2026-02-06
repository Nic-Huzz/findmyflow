-- Story Bank: Library of reusable content organized by category

CREATE TABLE IF NOT EXISTS story_bank (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN (
    'transformation_story', 'client_win', 'failure_lesson', 'contrarian_take',
    'behind_scenes', 'framework', 'origin_story', 'analogy', 'data_point', 'quote'
  )),
  title TEXT,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  is_favorite BOOLEAN DEFAULT false,
  use_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_story_bank_user ON story_bank(user_id);
CREATE INDEX IF NOT EXISTS idx_story_bank_category ON story_bank(user_id, category);
CREATE INDEX IF NOT EXISTS idx_story_bank_created ON story_bank(created_at DESC);

ALTER TABLE story_bank ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
CREATE POLICY "Users can view their own stories"
  ON story_bank FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
CREATE POLICY "Users can create their own stories"
  ON story_bank FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
CREATE POLICY "Users can update their own stories"
  ON story_bank FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
CREATE POLICY "Users can delete their own stories"
  ON story_bank FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION update_story_bank_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS story_bank_updated_at ON story_bank;
CREATE TRIGGER story_bank_updated_at
  BEFORE UPDATE ON story_bank
  FOR EACH ROW
  EXECUTE FUNCTION update_story_bank_updated_at();

ALTER TABLE marketing_tasks
ADD COLUMN IF NOT EXISTS quick_context TEXT,
ADD COLUMN IF NOT EXISTS quick_context_used BOOLEAN DEFAULT false;
