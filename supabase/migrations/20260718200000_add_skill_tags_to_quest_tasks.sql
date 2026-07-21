-- Add skill_tags to quest_tasks for task-level skill tracking
ALTER TABLE quest_tasks ADD COLUMN IF NOT EXISTS skill_tags text[];
