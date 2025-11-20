-- Fix existing challenge data to work with new instance system
-- Run this AFTER running the previous migrations

-- Step 1: Add status='active' to all existing challenge_progress records that don't have it
UPDATE challenge_progress
SET status = 'active'
WHERE status IS NULL;

-- Step 2: Generate challenge_instance_id for old records that don't have one
UPDATE challenge_progress
SET challenge_instance_id = gen_random_uuid()
WHERE challenge_instance_id IS NULL;

-- Step 3: Link old quest_completions to their challenge instances
-- This matches completions to the challenge based on user_id and approximate timing
UPDATE quest_completions qc
SET challenge_instance_id = cp.challenge_instance_id
FROM challenge_progress cp
WHERE qc.user_id = cp.user_id
  AND qc.challenge_instance_id IS NULL
  AND qc.completed_at >= cp.challenge_start_date
  AND qc.completed_at <= COALESCE(cp.completed_at, NOW());

-- Step 4: For any remaining unlinked completions, link them to the user's oldest challenge
UPDATE quest_completions qc
SET challenge_instance_id = (
  SELECT cp.challenge_instance_id
  FROM challenge_progress cp
  WHERE cp.user_id = qc.user_id
  ORDER BY cp.challenge_start_date ASC
  LIMIT 1
)
WHERE qc.challenge_instance_id IS NULL;

-- Verify the fix
SELECT
  'challenge_progress' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN status IS NULL THEN 1 END) as missing_status,
  COUNT(CASE WHEN challenge_instance_id IS NULL THEN 1 END) as missing_instance_id
FROM challenge_progress
UNION ALL
SELECT
  'quest_completions' as table_name,
  COUNT(*) as total_records,
  0 as missing_status,
  COUNT(CASE WHEN challenge_instance_id IS NULL THEN 1 END) as missing_instance_id
FROM quest_completions;
