-- Warm Leads Form Expansion
-- Add contact-matching fields + source channel + expanded engagement types

-- Add contact-matching fields to crm_warm_leads
ALTER TABLE crm_warm_leads ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE crm_warm_leads ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE crm_warm_leads ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE crm_warm_leads ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'Content';

-- Drop old CHECK constraint on engagement_type (if exists) and add expanded one
ALTER TABLE crm_warm_leads DROP CONSTRAINT IF EXISTS crm_warm_leads_engagement_type_check;
ALTER TABLE crm_warm_leads ADD CONSTRAINT crm_warm_leads_engagement_type_check
  CHECK (engagement_type IN (
    'liked_post', 'commented', 'dm', 'email_reply', 'webinar', 'lead_magnet', 'referral',
    'cold_dm', 'cold_email', 'cold_call',
    'clicked_ad', 'lead_form', 'landing_page'
  ));
