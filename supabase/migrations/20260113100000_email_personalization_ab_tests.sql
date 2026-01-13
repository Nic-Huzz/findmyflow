-- Migration: Email Personalization, A/B Tests, Email Sequences
-- Created: 2026-01-13

-- ============================================
-- 1. Add personalization tokens to public_leads
-- ============================================

ALTER TABLE public_leads
ADD COLUMN IF NOT EXISTS personalization_tokens JSONB DEFAULT '{}';

-- Add index for querying by tokens
CREATE INDEX IF NOT EXISTS idx_public_leads_tokens
ON public_leads USING GIN (personalization_tokens);

-- ============================================
-- 2. Email Sequences Tables
-- ============================================

-- Track which sequences a lead is enrolled in
CREATE TABLE IF NOT EXISTS email_sequence_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public_leads(id) ON DELETE CASCADE,
  sequence_type TEXT NOT NULL, -- 'money_model' or 'nervous_system'
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active', -- 'active', 'completed', 'unsubscribed'
  UNIQUE(lead_id, sequence_type)
);

-- Track individual emails in sequences
CREATE TABLE IF NOT EXISTS email_sequence_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID REFERENCES email_sequence_enrollments(id) ON DELETE CASCADE,
  email_key TEXT NOT NULL, -- 'day_0', 'day_1', 'day_3', 'day_5', 'day_7'
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'sent', 'failed', 'cancelled'
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for finding due emails
CREATE INDEX IF NOT EXISTS idx_email_sequence_due
ON email_sequence_emails (scheduled_for, status)
WHERE status = 'scheduled';

-- ============================================
-- 3. A/B Test Tables
-- ============================================

-- Track A/B test assignments
CREATE TABLE IF NOT EXISTS ab_test_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token TEXT NOT NULL,
  test_name TEXT NOT NULL,
  variant TEXT NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_token, test_name)
);

-- Track A/B test conversions
CREATE TABLE IF NOT EXISTS ab_test_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES ab_test_assignments(id) ON DELETE CASCADE,
  conversion_type TEXT NOT NULL, -- 'cta_click', 'signup', 'email_capture'
  converted_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Index for A/B test analysis
CREATE INDEX IF NOT EXISTS idx_ab_test_analysis
ON ab_test_assignments (test_name, variant, assigned_at);

-- ============================================
-- 4. RLS Policies
-- ============================================

-- Email sequences - public insert, no select for anonymous
ALTER TABLE email_sequence_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sequence_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert on email_sequence_enrollments"
  ON email_sequence_enrollments FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow public insert on email_sequence_emails"
  ON email_sequence_emails FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Service role can do everything (for edge functions)
CREATE POLICY "Service role full access enrollments"
  ON email_sequence_enrollments FOR ALL
  TO service_role
  USING (true);

CREATE POLICY "Service role full access emails"
  ON email_sequence_emails FOR ALL
  TO service_role
  USING (true);

-- A/B tests - public insert and select own assignments
ALTER TABLE ab_test_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_conversions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert on ab_test_assignments"
  ON ab_test_assignments FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow public select own ab_test_assignments"
  ON ab_test_assignments FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public insert on ab_test_conversions"
  ON ab_test_conversions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Service role full access
CREATE POLICY "Service role full access ab_assignments"
  ON ab_test_assignments FOR ALL
  TO service_role
  USING (true);

CREATE POLICY "Service role full access ab_conversions"
  ON ab_test_conversions FOR ALL
  TO service_role
  USING (true);
