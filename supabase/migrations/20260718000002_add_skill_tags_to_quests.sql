-- Sprint 3: Quest skill tagging
-- AI auto-tags quests with skills from the 10-segment taxonomy
ALTER TABLE quests ADD COLUMN IF NOT EXISTS skill_tags text[];
