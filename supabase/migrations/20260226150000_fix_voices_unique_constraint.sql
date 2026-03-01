-- Fix: Voice quests (daily trackers) blocked by unique constraint
-- The idx_quest_completions_no_duplicates index only excluded 'Healing'
-- but Voices quests are also repeatable (daily frequency).
-- This caused a 23505 duplicate key error on every voice quest submission.

-- Step 1: Drop the existing index
DROP INDEX IF EXISTS idx_quest_completions_no_duplicates;

-- Step 2: Recreate excluding both Healing and Voices
-- Both categories have app-layer repeat logic (daily/weekly); DB-level dedup not needed
CREATE UNIQUE INDEX idx_quest_completions_no_duplicates
  ON quest_completions(user_id, quest_id, COALESCE(project_id, '00000000-0000-0000-0000-000000000000'::uuid))
  WHERE quest_category NOT IN ('Healing', 'Voices');

-- Step 3: Clean up any existing duplicate voice completions
-- (from failed partial inserts or manual fixes)
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY user_id, quest_id, DATE(completed_at)
    ORDER BY completed_at DESC
  ) as rn
  FROM quest_completions
  WHERE quest_category = 'Voices'
)
DELETE FROM quest_completions
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- Step 4: Detach existing Voices completions from challenge instances
-- Keep project_id so we know which project the voice reflection came from
UPDATE quest_completions
SET
  challenge_instance_id = NULL,
  challenge_day = 0
WHERE quest_category = 'Voices'
  AND challenge_instance_id IS NOT NULL;
