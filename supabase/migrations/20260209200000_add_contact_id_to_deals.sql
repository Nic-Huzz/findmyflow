-- Add contact_id FK to sales_deals for reliable contact-project cross-referencing
-- Previously relied on email matching which breaks for phone-only or social-only contacts

ALTER TABLE sales_deals
  ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES crm_contacts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_deals_contact_id ON sales_deals(contact_id);

-- Backfill: match existing deals to contacts by email (case-insensitive)
UPDATE sales_deals d
SET contact_id = c.id
FROM crm_contacts c
WHERE d.contact_id IS NULL
  AND d.user_id = c.user_id
  AND d.contact_email IS NOT NULL
  AND LOWER(d.contact_email) = LOWER(c.email);
