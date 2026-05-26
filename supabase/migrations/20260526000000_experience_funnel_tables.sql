-- Experience funnel tables — applied via MCP on 2026-05-26
-- Adding experience_id to funnel tables + contact_experiences junction

-- 1. Add experience_id to content_history (one content piece → one event)
ALTER TABLE public.content_history
  ADD COLUMN IF NOT EXISTS experience_id UUID REFERENCES public.experiences(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS content_history_experience_idx
  ON public.content_history(experience_id) WHERE experience_id IS NOT NULL;

-- 2. Add experience_id to sales_deals (one deal → one event)
ALTER TABLE public.sales_deals
  ADD COLUMN IF NOT EXISTS experience_id UUID REFERENCES public.experiences(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS sales_deals_experience_idx
  ON public.sales_deals(experience_id) WHERE experience_id IS NOT NULL;

-- 3. Junction table: contacts can be tagged to multiple experiences
CREATE TABLE IF NOT EXISTS public.contact_experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  experience_id UUID NOT NULL REFERENCES public.experiences(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'lead',  -- lead | attendee | interested | vip
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(contact_id, experience_id)
);

CREATE INDEX IF NOT EXISTS contact_experiences_contact_idx ON public.contact_experiences(contact_id);
CREATE INDEX IF NOT EXISTS contact_experiences_experience_idx ON public.contact_experiences(experience_id);
CREATE INDEX IF NOT EXISTS contact_experiences_user_idx ON public.contact_experiences(user_id);

ALTER TABLE public.contact_experiences ENABLE ROW LEVEL SECURITY;

-- RLS policy (idempotent — drop if exists, recreate)
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can manage own contact_experiences" ON public.contact_experiences;
  CREATE POLICY "Users can manage own contact_experiences"
    ON public.contact_experiences FOR ALL
    USING (auth.uid() = user_id);
END $$;
