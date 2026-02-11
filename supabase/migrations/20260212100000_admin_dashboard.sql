-- Admin Dashboard infrastructure
-- Creates admin_users table and extends coach_nudges for admin-sent nudges

-- Dedicated admin_users table (not a flag on user_stage_progress)
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Only service_role can access (Edge Functions)
CREATE POLICY "Service role only" ON admin_users
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Seed: set Nic as admin
INSERT INTO admin_users (user_id)
SELECT id FROM auth.users WHERE email = 'nichurrell@me.com' LIMIT 1;

-- Extend coach_nudges for admin-sent nudges
ALTER TABLE coach_nudges
  ADD COLUMN IF NOT EXISTS admin_sender_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS nudge_title TEXT,
  ADD COLUMN IF NOT EXISTS nudge_url TEXT;

-- Service role access for coach_nudges (for Edge Function)
CREATE POLICY "Service role full access" ON coach_nudges
  FOR ALL TO service_role USING (true) WITH CHECK (true);
