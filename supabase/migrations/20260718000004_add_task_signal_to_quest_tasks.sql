-- Sprint 5: "Lit me up" signal on to-do completion
ALTER TABLE quest_tasks ADD COLUMN IF NOT EXISTS task_signal text;
