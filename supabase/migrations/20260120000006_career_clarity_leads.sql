-- Career Clarity Quiz Results Table
-- Stores quiz results and optional email captures for the Career Clarity Quiz

CREATE TABLE IF NOT EXISTS career_clarity_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL UNIQUE,
  email TEXT,

  -- Quiz answers
  need_answers JSONB NOT NULL DEFAULT '{}',
  structural_answers JSONB NOT NULL DEFAULT '{}',

  -- Results
  path_result TEXT NOT NULL CHECK (path_result IN ('own-thing', 'job')),
  orientation TEXT CHECK (orientation IN ('accomplish', 'connect', 'blend')),
  unmet_needs TEXT[] DEFAULT '{}',

  -- Scores
  accomplish_score INTEGER DEFAULT 0,
  employment_score INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_career_clarity_leads_email ON career_clarity_leads(email) WHERE email IS NOT NULL;

-- Index for path analysis
CREATE INDEX IF NOT EXISTS idx_career_clarity_leads_path ON career_clarity_leads(path_result);

-- Enable RLS
ALTER TABLE career_clarity_leads ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (public quiz)
CREATE POLICY "Allow anonymous inserts" ON career_clarity_leads
  FOR INSERT
  WITH CHECK (true);

-- Allow updates to own session (for adding email after completion)
CREATE POLICY "Allow updates by session" ON career_clarity_leads
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Allow reading own session results
CREATE POLICY "Allow reading by session" ON career_clarity_leads
  FOR SELECT
  USING (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_career_clarity_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER career_clarity_leads_updated_at
  BEFORE UPDATE ON career_clarity_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_career_clarity_leads_updated_at();

-- Comment on table
COMMENT ON TABLE career_clarity_leads IS 'Stores Career Clarity Quiz results and lead captures';
