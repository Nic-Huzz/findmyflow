-- Shift Scorecard lead capture
-- Public lead magnet at /shift-scorecard — no auth required
CREATE TABLE IF NOT EXISTS shift_scorecard_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  score INTEGER,
  answers JSONB DEFAULT '{}'::jsonb,
  gaps TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Allow anonymous inserts (public lead magnet, no auth)
ALTER TABLE shift_scorecard_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert scorecard leads"
  ON shift_scorecard_leads FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can read scorecard leads"
  ON shift_scorecard_leads FOR SELECT
  USING (auth.role() = 'service_role');
