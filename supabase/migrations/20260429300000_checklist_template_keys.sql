-- Add template_item_key for cross-experience matching on "Run Again"
ALTER TABLE experience_checklist_items
  ADD COLUMN IF NOT EXISTS template_item_key TEXT;

CREATE INDEX IF NOT EXISTS idx_eci_template_key
  ON experience_checklist_items(experience_id, template_item_key)
  WHERE template_item_key IS NOT NULL;
