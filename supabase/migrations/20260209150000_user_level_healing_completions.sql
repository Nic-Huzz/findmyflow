-- Make Healing quest completions user-level (like Flow Finder)
-- Healing quests are repeatable (daily/weekly/deepdive), so unique indexes
-- must be scoped to exclude Healing.

-- Step 1: Drop both unique indexes that would block repeatable user-level Healing completions
DROP INDEX IF EXISTS idx_quest_completions_user_level_unique;
DROP INDEX IF EXISTS idx_quest_completions_no_duplicates;

-- Step 2: Recreate user-level unique index scoped to Flow Finder (Business) quests only
CREATE UNIQUE INDEX idx_quest_completions_user_level_unique
  ON quest_completions(user_id, quest_id)
  WHERE challenge_instance_id IS NULL AND quest_category = 'Business';

-- Step 3: Recreate no-duplicates index excluding Healing
-- Healing has app-layer repeat logic (daily/weekly); other categories need DB-level dedup
CREATE UNIQUE INDEX idx_quest_completions_no_duplicates
  ON quest_completions(user_id, quest_id, COALESCE(project_id, '00000000-0000-0000-0000-000000000000'::uuid))
  WHERE quest_category != 'Healing';

-- Step 4: Deduplicate Healing completions before converting
-- If same user completed same quest on same day from different challenge instances,
-- keep only the newest to avoid conflicts
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY user_id, quest_id, DATE(completed_at)
    ORDER BY completed_at DESC
  ) as rn
  FROM quest_completions
  WHERE quest_category = 'Healing'
)
DELETE FROM quest_completions
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- Step 5: Convert all Healing completions to user-level
UPDATE quest_completions
SET
  challenge_instance_id = NULL,
  project_id = NULL,
  challenge_day = 0
WHERE quest_category = 'Healing'
  AND challenge_instance_id IS NOT NULL;
