-- Fix existing validation quest completions that were saved with project_id = NULL
-- Target quests: self_test, lets_play, self_test_review, lets_play_review

-- 1. For users with exactly ONE project: assign that project's ID
UPDATE quest_completions qc
SET project_id = single_project.project_id
FROM (
  SELECT up.user_id, up.id AS project_id
  FROM user_projects up
  WHERE up.user_id IN (
    SELECT user_id FROM user_projects GROUP BY user_id HAVING COUNT(*) = 1
  )
) single_project
WHERE qc.user_id = single_project.user_id
  AND qc.quest_id IN ('self_test', 'lets_play', 'self_test_review', 'lets_play_review')
  AND qc.project_id IS NULL;

-- 2. For huzz@nichuzz.com specifically: assign remaining to their FindMyFlow project
UPDATE quest_completions qc
SET project_id = (
  SELECT up.id FROM user_projects up
  JOIN auth.users u ON u.id = up.user_id
  WHERE u.email = 'huzz@nichuzz.com'
    AND LOWER(up.name) LIKE '%findmyflow%'
  LIMIT 1
)
WHERE qc.user_id = (
  SELECT id FROM auth.users WHERE email = 'huzz@nichuzz.com'
)
  AND qc.quest_id IN ('self_test', 'lets_play', 'self_test_review', 'lets_play_review')
  AND qc.project_id IS NULL;
