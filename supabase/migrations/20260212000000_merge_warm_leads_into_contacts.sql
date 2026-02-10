-- Merge crm_warm_leads into crm_contacts
-- Warm leads become a filtered view: contacts WHERE outreach_status IS NOT NULL
-- Supersedes: 20260211000001_warm_leads_form_expansion.sql

-- ============================================================================
-- 1a. Add outreach columns to crm_contacts
-- ============================================================================

ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS platform TEXT;
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS engagement_type TEXT;
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS outreach_status TEXT;
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS priority INTEGER;
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS temperature TEXT;
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS last_message TEXT;
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS outreach_status_entered_at TIMESTAMPTZ;

-- CHECK constraints
ALTER TABLE crm_contacts ADD CONSTRAINT crm_contacts_outreach_status_check
  CHECK (outreach_status IS NULL OR outreach_status IN (
    'to_contact', 'reached_out', 'in_conversation', 'meeting_booked', 'not_interested'
  ));

ALTER TABLE crm_contacts ADD CONSTRAINT crm_contacts_priority_check
  CHECK (priority IS NULL OR (priority >= 1 AND priority <= 10));

ALTER TABLE crm_contacts ADD CONSTRAINT crm_contacts_temperature_check
  CHECK (temperature IS NULL OR temperature IN ('hot', 'warm', 'cold'));

ALTER TABLE crm_contacts ADD CONSTRAINT crm_contacts_engagement_type_check
  CHECK (engagement_type IS NULL OR engagement_type IN (
    'liked_post', 'commented', 'dm', 'email_reply', 'webinar', 'lead_magnet', 'referral',
    'cold_dm', 'cold_email', 'cold_call',
    'clicked_ad', 'lead_form', 'landing_page'
  ));

-- Indexes for warm outreach queries
CREATE INDEX IF NOT EXISTS idx_crm_contacts_outreach_status
  ON crm_contacts (user_id, outreach_status)
  WHERE outreach_status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_crm_contacts_priority
  ON crm_contacts (user_id, priority)
  WHERE priority IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_crm_contacts_outreach_entered
  ON crm_contacts (user_id, outreach_status, outreach_status_entered_at)
  WHERE outreach_status IS NOT NULL;

-- Trigger: auto-update outreach_status_entered_at when outreach_status changes
CREATE OR REPLACE FUNCTION update_outreach_status_entered_at()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.outreach_status IS DISTINCT FROM NEW.outreach_status THEN
    NEW.outreach_status_entered_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_outreach_status_entered ON crm_contacts;
CREATE TRIGGER trg_outreach_status_entered
  BEFORE UPDATE ON crm_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_outreach_status_entered_at();

-- ============================================================================
-- 1b. Migrate data from crm_warm_leads into crm_contacts
-- ============================================================================

-- UPDATE existing contacts that match a warm lead by user_id + LOWER(TRIM(name))
UPDATE crm_contacts c
SET
  platform        = COALESCE(c.platform, wl.platform),
  engagement_type = COALESCE(c.engagement_type, wl.engagement_type),
  outreach_status = COALESCE(c.outreach_status, wl.status),
  priority        = COALESCE(c.priority, wl.priority),
  temperature     = COALESCE(c.temperature, wl.temperature),
  last_message    = COALESCE(c.last_message, wl.last_message),
  social_handle   = COALESCE(c.social_handle, wl.handle),
  email           = COALESCE(c.email, wl.email),
  phone           = COALESCE(c.phone, wl.phone),
  company         = COALESCE(c.company, wl.company),
  notes           = COALESCE(c.notes, wl.notes),
  outreach_status_entered_at = COALESCE(c.outreach_status_entered_at, wl.status_entered_at, wl.updated_at)
FROM crm_warm_leads wl
WHERE c.user_id = wl.user_id
  AND LOWER(TRIM(c.name)) = LOWER(TRIM(wl.name));

-- INSERT warm leads that have no matching contact
INSERT INTO crm_contacts (
  user_id, name, email, phone, company, social_handle,
  source, lifecycle_stage, notes,
  platform, engagement_type, outreach_status, priority, temperature,
  last_message, outreach_status_entered_at,
  created_at, updated_at
)
SELECT
  wl.user_id,
  wl.name,
  wl.email,
  wl.phone,
  wl.company,
  wl.handle,
  COALESCE(wl.source, 'Content'),
  'lead',
  wl.notes,
  wl.platform,
  wl.engagement_type,
  wl.status,
  wl.priority,
  wl.temperature,
  wl.last_message,
  COALESCE(wl.status_entered_at, wl.updated_at),
  wl.created_at,
  wl.updated_at
FROM crm_warm_leads wl
WHERE NOT EXISTS (
  SELECT 1 FROM crm_contacts c
  WHERE c.user_id = wl.user_id
    AND LOWER(TRIM(c.name)) = LOWER(TRIM(wl.name))
);

-- ============================================================================
-- 1c. Deprecate old table (rename, don't drop — safe rollback)
-- ============================================================================

ALTER TABLE crm_warm_leads RENAME TO crm_warm_leads_deprecated;
