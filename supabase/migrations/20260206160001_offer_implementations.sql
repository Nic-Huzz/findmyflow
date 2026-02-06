-- Offer Implementations Table
-- Tracks user progress on implementing recommended offers

CREATE TABLE IF NOT EXISTS offer_implementations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES user_projects(id) ON DELETE CASCADE NOT NULL,
  offer_type TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('attraction', 'upsell', 'downsell', 'continuity')),
  flow_assessment_id UUID,
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  completed_tasks JSONB DEFAULT '[]'::jsonb,
  current_phase INTEGER DEFAULT 0,
  total_tasks INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_implementation_per_project UNIQUE (user_id, project_id, offer_type)
);

CREATE INDEX IF NOT EXISTS idx_implementations_user ON offer_implementations(user_id);
CREATE INDEX IF NOT EXISTS idx_implementations_project ON offer_implementations(project_id);
CREATE INDEX IF NOT EXISTS idx_implementations_status ON offer_implementations(user_id, status);

ALTER TABLE offer_implementations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can view own implementations"
    ON offer_implementations FOR SELECT
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert own implementations"
    ON offer_implementations FOR INSERT
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own implementations"
    ON offer_implementations FOR UPDATE
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete own implementations"
    ON offer_implementations FOR DELETE
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION update_offer_implementations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_offer_implementations_updated_at ON offer_implementations;
CREATE TRIGGER trigger_offer_implementations_updated_at
  BEFORE UPDATE ON offer_implementations
  FOR EACH ROW
  EXECUTE FUNCTION update_offer_implementations_updated_at();
