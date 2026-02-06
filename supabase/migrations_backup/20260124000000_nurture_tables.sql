-- Migration: Create Nurture CRM tables
-- Tables: crm_contacts, crm_email_sequences, crm_email_steps, crm_warm_leads

-- ================================
-- CRM Contacts Table
-- ================================
CREATE TABLE IF NOT EXISTS crm_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  lifecycle_stage TEXT DEFAULT 'lead' CHECK (lifecycle_stage IN ('lead', 'qualified', 'opportunity', 'customer', 'evangelist')),
  source TEXT DEFAULT 'Other',
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for crm_contacts
CREATE INDEX IF NOT EXISTS idx_crm_contacts_user_id ON crm_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_lifecycle_stage ON crm_contacts(lifecycle_stage);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_email ON crm_contacts(email);

-- RLS for crm_contacts
ALTER TABLE crm_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own contacts"
  ON crm_contacts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own contacts"
  ON crm_contacts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contacts"
  ON crm_contacts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own contacts"
  ON crm_contacts FOR DELETE
  USING (auth.uid() = user_id);

-- ================================
-- CRM Email Sequences Table
-- ================================
CREATE TABLE IF NOT EXISTS crm_email_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sequence_type TEXT DEFAULT 'nurture' CHECK (sequence_type IN ('welcome', 'nurture', 'launch', 'reengagement', 'post_purchase')),
  description TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  steps_count INTEGER DEFAULT 0,
  subscribers_count INTEGER DEFAULT 0,
  open_rate NUMERIC(5,2) DEFAULT 0,
  click_rate NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for crm_email_sequences
CREATE INDEX IF NOT EXISTS idx_crm_email_sequences_user_id ON crm_email_sequences(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_email_sequences_status ON crm_email_sequences(status);

-- RLS for crm_email_sequences
ALTER TABLE crm_email_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sequences"
  ON crm_email_sequences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sequences"
  ON crm_email_sequences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sequences"
  ON crm_email_sequences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sequences"
  ON crm_email_sequences FOR DELETE
  USING (auth.uid() = user_id);

-- ================================
-- CRM Email Steps Table
-- ================================
CREATE TABLE IF NOT EXISTS crm_email_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES crm_email_sequences(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  subject TEXT NOT NULL,
  body TEXT,
  delay_days INTEGER DEFAULT 1,
  sent_count INTEGER DEFAULT 0,
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for crm_email_steps
CREATE INDEX IF NOT EXISTS idx_crm_email_steps_sequence_id ON crm_email_steps(sequence_id);
CREATE INDEX IF NOT EXISTS idx_crm_email_steps_user_id ON crm_email_steps(user_id);

-- RLS for crm_email_steps
ALTER TABLE crm_email_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own steps"
  ON crm_email_steps FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own steps"
  ON crm_email_steps FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own steps"
  ON crm_email_steps FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own steps"
  ON crm_email_steps FOR DELETE
  USING (auth.uid() = user_id);

-- ================================
-- CRM Warm Leads Table
-- ================================
CREATE TABLE IF NOT EXISTS crm_warm_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  platform TEXT DEFAULT 'Instagram',
  handle TEXT,
  engagement_type TEXT DEFAULT 'liked_post' CHECK (engagement_type IN ('liked_post', 'commented', 'dm', 'email_reply', 'webinar', 'lead_magnet', 'referral')),
  status TEXT DEFAULT 'to_contact' CHECK (status IN ('to_contact', 'reached_out', 'in_conversation', 'meeting_booked', 'not_interested')),
  priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  last_message TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for crm_warm_leads
CREATE INDEX IF NOT EXISTS idx_crm_warm_leads_user_id ON crm_warm_leads(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_warm_leads_status ON crm_warm_leads(status);
CREATE INDEX IF NOT EXISTS idx_crm_warm_leads_priority ON crm_warm_leads(priority DESC);

-- RLS for crm_warm_leads
ALTER TABLE crm_warm_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own warm leads"
  ON crm_warm_leads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own warm leads"
  ON crm_warm_leads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own warm leads"
  ON crm_warm_leads FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own warm leads"
  ON crm_warm_leads FOR DELETE
  USING (auth.uid() = user_id);

-- ================================
-- Trigger for updated_at
-- ================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all new tables
DROP TRIGGER IF EXISTS update_crm_contacts_updated_at ON crm_contacts;
CREATE TRIGGER update_crm_contacts_updated_at
  BEFORE UPDATE ON crm_contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_crm_email_sequences_updated_at ON crm_email_sequences;
CREATE TRIGGER update_crm_email_sequences_updated_at
  BEFORE UPDATE ON crm_email_sequences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_crm_email_steps_updated_at ON crm_email_steps;
CREATE TRIGGER update_crm_email_steps_updated_at
  BEFORE UPDATE ON crm_email_steps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_crm_warm_leads_updated_at ON crm_warm_leads;
CREATE TRIGGER update_crm_warm_leads_updated_at
  BEFORE UPDATE ON crm_warm_leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
