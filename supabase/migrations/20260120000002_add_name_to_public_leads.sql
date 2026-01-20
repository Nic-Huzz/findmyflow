-- Add name columns + create public_offer_audits table

-- ============================================
-- 1. Create public_offer_audits table (if not exists)
-- ============================================
CREATE TABLE IF NOT EXISTS public_offer_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token VARCHAR NOT NULL,
  respondent_name VARCHAR,
  respondent_email VARCHAR,
  responses JSONB,
  score INTEGER,
  gaps TEXT[],
  strengths TEXT[],
  category_levels JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for public_offer_audits
ALTER TABLE public_offer_audits ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'public_offer_audits' AND policyname = 'Anyone can insert public offer audits'
  ) THEN
    CREATE POLICY "Anyone can insert public offer audits" ON public_offer_audits FOR INSERT WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'public_offer_audits' AND policyname = 'Anyone can read public offer audits'
  ) THEN
    CREATE POLICY "Anyone can read public offer audits" ON public_offer_audits FOR SELECT USING (true);
  END IF;
END $$;

-- Indexes for public_offer_audits
CREATE INDEX IF NOT EXISTS idx_public_offer_audits_session ON public_offer_audits(session_token);
CREATE INDEX IF NOT EXISTS idx_public_offer_audits_email ON public_offer_audits(respondent_email);

-- ============================================
-- 2. Add name columns to existing tables
-- ============================================

-- Add name to public_leads
ALTER TABLE public_leads ADD COLUMN IF NOT EXISTS name VARCHAR;

-- Add respondent_name to public_offer_assessments
ALTER TABLE public_offer_assessments ADD COLUMN IF NOT EXISTS respondent_name VARCHAR;

-- Add respondent_name to public_nervous_system_responses
ALTER TABLE public_nervous_system_responses ADD COLUMN IF NOT EXISTS respondent_name VARCHAR;

-- Index on public_leads name
CREATE INDEX IF NOT EXISTS idx_public_leads_name ON public_leads(name);
