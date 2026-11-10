ALTER TABLE quests ADD COLUMN IF NOT EXISTS skill_node_id text;
COMMENT ON COLUMN quests.skill_node_id IS 'Tier 1 dome node ID (e.g. exp-coding). Used by courage ladder to resolve per-skill templates.';
