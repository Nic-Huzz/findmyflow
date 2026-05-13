-- Tune practices are daily-repeatable, so exclude them from the dedup index
DROP INDEX IF EXISTS idx_quest_completions_no_duplicates;
CREATE UNIQUE INDEX idx_quest_completions_no_duplicates ON quest_completions
  USING btree (user_id, quest_id, COALESCE(project_id, '00000000-0000-0000-0000-000000000000'::uuid))
  WHERE (quest_category <> ALL (ARRAY['Healing'::text, 'Voices'::text, 'Tune'::text]));
