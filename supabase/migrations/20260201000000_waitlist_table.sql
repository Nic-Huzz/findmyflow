-- Waitlist signups table
CREATE TABLE IF NOT EXISTS waitlist_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  whatsapp TEXT,

  -- Match to flow-audit if they've done it (no FK - table may not exist)
  flow_audit_id UUID,

  -- Metadata
  source TEXT DEFAULT 'landing_page',
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate emails
  UNIQUE(email)
);

-- Index for email lookups
CREATE INDEX idx_waitlist_email ON waitlist_signups(email);

-- RLS - allow anonymous inserts, authenticated reads
ALTER TABLE waitlist_signups ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (public form)
CREATE POLICY "Anyone can join waitlist" ON waitlist_signups
  FOR INSERT WITH CHECK (true);

-- Only authenticated users can read (for admin)
CREATE POLICY "Authenticated users can read waitlist" ON waitlist_signups
  FOR SELECT USING (auth.role() = 'authenticated');
