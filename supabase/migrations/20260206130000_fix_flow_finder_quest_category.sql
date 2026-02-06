-- Fix quest_category mismatch and pre-universalization records for Flow Finder quests
--
-- Before Feb 4 2026, Flow Finder completions were saved with:
--   quest_category = 'Flow Finder' (should be 'Business')
--   challenge_instance_id = non-null (should be NULL for user-level)
--   project_id = non-null (should be NULL for user-level)
--
-- This caused getCategoryPoints('Business') to miss these completions.
-- Code fix was applied in questCompletionHelpers.js; this migration fixes existing data.

-- Step 1: Delete old project-bound records where a user-level record already exists
-- (prevents unique index violation on idx_quest_completions_user_level_unique)
DELETE FROM quest_completions old_rec
WHERE old_rec.quest_id IN (
  'flow_finder_skills', 'flow_finder_problems', 'flow_finder_persona',
  'flow_finder_integration', 'play_list_finder', 'persona_identifier',
  'flow_finder_explainer', 'mind_space_extraction', 'milestone_read_money_model'
)
AND old_rec.challenge_instance_id IS NOT NULL
AND EXISTS (
  SELECT 1 FROM quest_completions new_rec
  WHERE new_rec.user_id = old_rec.user_id
  AND new_rec.quest_id = old_rec.quest_id
  AND new_rec.challenge_instance_id IS NULL
);

-- Step 2: Convert remaining old records to user-level with correct category
UPDATE quest_completions
SET
  challenge_instance_id = NULL,
  project_id = NULL,
  quest_category = 'Business'
WHERE quest_id IN (
  'flow_finder_skills', 'flow_finder_problems', 'flow_finder_persona',
  'flow_finder_integration', 'play_list_finder', 'persona_identifier',
  'flow_finder_explainer', 'mind_space_extraction', 'milestone_read_money_model'
)
AND (
  challenge_instance_id IS NOT NULL
  OR quest_category != 'Business'
);
