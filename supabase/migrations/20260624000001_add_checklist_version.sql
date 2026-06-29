-- Add checklist_version to experiences for node workspace vs legacy tab support
-- 'legacy' = old 3-tab ExperienceDetail (Pre/Post/Details)
-- 'nodes' = new full-page node workspaces
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS checklist_version TEXT DEFAULT 'legacy';
