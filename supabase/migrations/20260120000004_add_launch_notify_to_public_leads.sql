-- Add launch notification tracking to public_leads

-- Add launch_notify boolean column
ALTER TABLE public_leads ADD COLUMN IF NOT EXISTS launch_notify BOOLEAN DEFAULT FALSE;

-- Add launch_notify_at timestamp column
ALTER TABLE public_leads ADD COLUMN IF NOT EXISTS launch_notify_at TIMESTAMPTZ;

-- Add unique constraint on email for upsert support (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'public_leads_email_unique'
  ) THEN
    ALTER TABLE public_leads ADD CONSTRAINT public_leads_email_unique UNIQUE (email);
  END IF;
END $$;

-- Add update policy for public_leads (to support upsert)
DROP POLICY IF EXISTS "Anyone can update public leads" ON public_leads;
CREATE POLICY "Anyone can update public leads" ON public_leads FOR UPDATE USING (true);

-- Index on launch_notify for filtering interested leads
CREATE INDEX IF NOT EXISTS idx_public_leads_launch_notify ON public_leads(launch_notify) WHERE launch_notify = true;
