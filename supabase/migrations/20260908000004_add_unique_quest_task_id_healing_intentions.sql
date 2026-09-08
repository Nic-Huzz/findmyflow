-- Ensure healing_intentions.quest_task_id has a unique constraint
-- Required for the onConflict upsert used in WahooCreator and HealingFlowModal
ALTER TABLE healing_intentions
  ADD CONSTRAINT healing_intentions_quest_task_id_key UNIQUE (quest_task_id);
