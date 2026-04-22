CREATE TABLE IF NOT EXISTS experience_creator_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  selected_creators TEXT[],
  dominant_archetype TEXT,
  product_suite JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ecl_email ON experience_creator_leads(email);

-- No RLS needed - anonymous inserts, admin reads
ALTER TABLE experience_creator_leads ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
CREATE POLICY "Anyone can insert leads"
  ON experience_creator_leads FOR INSERT
  WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
