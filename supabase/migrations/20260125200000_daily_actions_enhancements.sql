-- Migration: Daily Actions & Tracking Enhancements
-- 1. Add posting day to content items
-- 2. Add time-in-stage tracking to contacts and warm leads
-- 3. Add content attribution to contacts

-- ================================
-- Add posting day to content items
-- ================================
ALTER TABLE crm_content_items
ADD COLUMN IF NOT EXISTS post_day TEXT CHECK (post_day IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'));

-- ================================
-- Add time-in-stage tracking
-- ================================

-- Contacts: track when they entered current stage
ALTER TABLE crm_contacts
ADD COLUMN IF NOT EXISTS stage_entered_at TIMESTAMPTZ DEFAULT NOW();

-- Contacts: track source content (for attribution)
ALTER TABLE crm_contacts
ADD COLUMN IF NOT EXISTS source_content_id UUID;

-- Warm leads: track when they entered current status
ALTER TABLE crm_warm_leads
ADD COLUMN IF NOT EXISTS status_entered_at TIMESTAMPTZ DEFAULT NOW();

-- Warm leads: track source content (for attribution)
ALTER TABLE crm_warm_leads
ADD COLUMN IF NOT EXISTS source_content_id UUID;

-- Warm leads: add temperature field for hot/warm/cold
ALTER TABLE crm_warm_leads
ADD COLUMN IF NOT EXISTS temperature TEXT DEFAULT 'warm' CHECK (temperature IN ('hot', 'warm', 'cold'));

-- ================================
-- Indexes for faster lookups
-- ================================

-- Index for finding content by day
CREATE INDEX IF NOT EXISTS idx_crm_content_items_post_day
  ON crm_content_items(user_id, post_day);

-- Index for finding stale contacts
CREATE INDEX IF NOT EXISTS idx_crm_contacts_stage_entered
  ON crm_contacts(user_id, lifecycle_stage, stage_entered_at);

-- Index for finding stale warm leads
CREATE INDEX IF NOT EXISTS idx_crm_warm_leads_status_entered
  ON crm_warm_leads(user_id, status, status_entered_at);

-- Index for content attribution
CREATE INDEX IF NOT EXISTS idx_crm_contacts_source_content
  ON crm_contacts(source_content_id) WHERE source_content_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_crm_warm_leads_source_content
  ON crm_warm_leads(source_content_id) WHERE source_content_id IS NOT NULL;

-- ================================
-- Trigger to update stage_entered_at when stage changes
-- ================================
CREATE OR REPLACE FUNCTION update_contact_stage_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.lifecycle_stage IS DISTINCT FROM NEW.lifecycle_stage THEN
    NEW.stage_entered_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_contact_stage_change ON crm_contacts;
CREATE TRIGGER trigger_contact_stage_change
  BEFORE UPDATE ON crm_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_contact_stage_timestamp();

-- Trigger to update status_entered_at when status changes for warm leads
CREATE OR REPLACE FUNCTION update_warm_lead_status_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.status_entered_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_warm_lead_status_change ON crm_warm_leads;
CREATE TRIGGER trigger_warm_lead_status_change
  BEFORE UPDATE ON crm_warm_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_warm_lead_status_timestamp();

-- ================================
-- Backfill existing data
-- ================================

-- Set stage_entered_at to created_at for existing contacts
UPDATE crm_contacts
SET stage_entered_at = created_at
WHERE stage_entered_at IS NULL OR stage_entered_at = NOW();

-- Set status_entered_at to created_at for existing warm leads
UPDATE crm_warm_leads
SET status_entered_at = created_at
WHERE status_entered_at IS NULL OR status_entered_at = NOW();
