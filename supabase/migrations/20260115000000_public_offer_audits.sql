-- Public Offer Audits table - stores offer audit results for public users
CREATE TABLE IF NOT EXISTS public_offer_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token VARCHAR NOT NULL,
  respondent_email VARCHAR,
  responses JSONB,
  score INTEGER,
  gaps TEXT[],
  strengths TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add personalization_tokens column to public_leads if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'public_leads'
    AND column_name = 'personalization_tokens'
  ) THEN
    ALTER TABLE public_leads ADD COLUMN personalization_tokens JSONB;
  END IF;
END $$;

-- Add unique constraint on email for upsert
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'public_leads_email_unique'
  ) THEN
    ALTER TABLE public_leads ADD CONSTRAINT public_leads_email_unique UNIQUE (email);
  END IF;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_public_offer_audits_session ON public_offer_audits(session_token);
CREATE INDEX IF NOT EXISTS idx_public_offer_audits_email ON public_offer_audits(respondent_email);
CREATE INDEX IF NOT EXISTS idx_public_offer_audits_score ON public_offer_audits(score);

-- RLS Policies
ALTER TABLE public_offer_audits ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (it's a lead capture)
CREATE POLICY "Anyone can insert public offer audits" ON public_offer_audits
  FOR INSERT WITH CHECK (true);

-- Anyone can read (for session-based retrieval)
CREATE POLICY "Anyone can read public offer audits" ON public_offer_audits
  FOR SELECT USING (true);
