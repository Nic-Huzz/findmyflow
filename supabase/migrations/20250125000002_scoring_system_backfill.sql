-- Scoring System Backfill Migration
-- Created: January 25, 2025
-- See: docs/scoring-system-refactor.md
--
-- This migration backfills the new scoring tables from existing quest_completions.
-- Run AFTER 20250125000001_scoring_system_refactor.sql

-- ============================================================================
-- STEP 1: Check and fix NULL quest_category values
-- ============================================================================

-- First, let's see what we're dealing with (this is just for logging)
DO $$
DECLARE
  null_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_count
  FROM quest_completions
  WHERE quest_category IS NULL;

  RAISE NOTICE 'Found % quest_completions with NULL quest_category', null_count;
END $$;

-- Fix known NULL categories based on quest_id patterns
-- Business quests
UPDATE quest_completions
SET quest_category = 'Business'
WHERE quest_category IS NULL
  AND (
    quest_id LIKE 'stage_%'
    OR quest_id LIKE 'milestone_%'
    OR quest_id LIKE 'business_%'
    OR quest_id LIKE 'validation_%'
    OR quest_id LIKE 'product_%'
    OR quest_id LIKE 'testing_%'
    OR quest_id LIKE 'money_%'
    OR quest_id LIKE 'offer_%'
    OR quest_id LIKE 'campaign_%'
    OR quest_id LIKE 'launch_%'
    OR quest_id LIKE 'tracking_%'
  );

-- Flow Finder quests
UPDATE quest_completions
SET quest_category = 'Flow Finder'
WHERE quest_category IS NULL
  AND (
    quest_id LIKE 'flow_finder_%'
    OR quest_id LIKE 'nikigai_%'
    OR quest_id LIKE 'skills_%'
    OR quest_id LIKE 'problems_%'
    OR quest_id LIKE 'persona_%'
    OR quest_id LIKE 'integration_%'
  );

-- Healing quests (Recognise, Rewire, Release, Reconnect)
UPDATE quest_completions
SET quest_category = 'Healing'
WHERE quest_category IS NULL
  AND (
    quest_id LIKE 'recognise_%'
    OR quest_id LIKE 'rewire_%'
    OR quest_id LIKE 'release_%'
    OR quest_id LIKE 'reconnect_%'
    OR quest_id LIKE 'healing_%'
  );

-- Tracker quests
UPDATE quest_completions
SET quest_category = 'Tracker'
WHERE quest_category IS NULL
  AND (
    quest_id LIKE 'tracker_%'
    OR quest_id LIKE 'flow_compass_%'
    OR quest_id LIKE 'compass_%'
  );

-- Groans quests
UPDATE quest_completions
SET quest_category = 'Groans'
WHERE quest_category IS NULL
  AND (
    quest_id LIKE 'groan_%'
    OR quest_id LIKE 'courage_%'
    OR quest_id LIKE 'visibility_%'
  );

-- Default remaining NULLs to 'Business' (safest fallback)
UPDATE quest_completions
SET quest_category = 'Business'
WHERE quest_category IS NULL;

-- Log how many remain (should be 0)
DO $$
DECLARE
  null_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_count
  FROM quest_completions
  WHERE quest_category IS NULL;

  IF null_count > 0 THEN
    RAISE WARNING 'Still have % quest_completions with NULL quest_category after fixes!', null_count;
  ELSE
    RAISE NOTICE 'All quest_category values are now populated';
  END IF;
END $$;

-- ============================================================================
-- STEP 2: Backfill challenge_weekly_scores from quest_completions
-- ============================================================================

-- Project-level scores (where project_id is NOT NULL)
INSERT INTO challenge_weekly_scores (user_id, project_id, week_start_date, business_score, healing_score, courage_score)
SELECT
  user_id,
  project_id,
  date_trunc('week', completed_at)::DATE as week_start_date,

  -- Business = Business + Flow Finder categories
  COALESCE(SUM(CASE WHEN quest_category IN ('Business', 'Flow Finder') THEN points_earned ELSE 0 END), 0) as business_score,

  -- Healing = Healing + Tracker categories
  COALESCE(SUM(CASE WHEN quest_category IN ('Healing', 'Tracker') THEN points_earned ELSE 0 END), 0) as healing_score,

  -- Courage = Groans category
  COALESCE(SUM(CASE WHEN quest_category = 'Groans' THEN points_earned ELSE 0 END), 0) as courage_score

FROM quest_completions
WHERE user_id IS NOT NULL
  AND project_id IS NOT NULL
GROUP BY user_id, project_id, date_trunc('week', completed_at)::DATE
ON CONFLICT (user_id, project_id, week_start_date) DO UPDATE SET
  business_score = EXCLUDED.business_score,
  healing_score = EXCLUDED.healing_score,
  courage_score = EXCLUDED.courage_score,
  updated_at = NOW();

-- User-level scores (where project_id IS NULL - for Groans, Flow Finder, etc.)
-- Uses partial unique index idx_weekly_scores_user_null_project_week for conflict detection
INSERT INTO challenge_weekly_scores (user_id, project_id, week_start_date, business_score, healing_score, courage_score)
SELECT
  user_id,
  NULL as project_id,
  date_trunc('week', completed_at)::DATE as week_start_date,

  COALESCE(SUM(CASE WHEN quest_category IN ('Business', 'Flow Finder') THEN points_earned ELSE 0 END), 0) as business_score,
  COALESCE(SUM(CASE WHEN quest_category IN ('Healing', 'Tracker') THEN points_earned ELSE 0 END), 0) as healing_score,
  COALESCE(SUM(CASE WHEN quest_category = 'Groans' THEN points_earned ELSE 0 END), 0) as courage_score

FROM quest_completions
WHERE user_id IS NOT NULL
  AND project_id IS NULL
GROUP BY user_id, date_trunc('week', completed_at)::DATE
ON CONFLICT (user_id, week_start_date) WHERE project_id IS NULL DO UPDATE SET
  business_score = EXCLUDED.business_score,
  healing_score = EXCLUDED.healing_score,
  courage_score = EXCLUDED.courage_score,
  updated_at = NOW();

-- Log backfill results
DO $$
DECLARE
  weekly_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO weekly_count FROM challenge_weekly_scores;
  RAISE NOTICE 'Backfilled % rows into challenge_weekly_scores', weekly_count;
END $$;

-- ============================================================================
-- STEP 3: Backfill user_lifetime_scores from weekly scores
-- ============================================================================

-- Project-level lifetime scores
INSERT INTO user_lifetime_scores (
  user_id,
  project_id,
  lifetime_business_score,
  lifetime_healing_score,
  lifetime_courage_score,
  lifetime_total_score,
  weeks_completed,
  best_week_total
)
SELECT
  user_id,
  project_id,
  SUM(business_score) as lifetime_business_score,
  SUM(healing_score) as lifetime_healing_score,
  SUM(courage_score) as lifetime_courage_score,
  SUM(business_score + healing_score + courage_score) as lifetime_total_score,
  COUNT(*) as weeks_completed,
  MAX(business_score + healing_score + courage_score) as best_week_total
FROM challenge_weekly_scores
WHERE project_id IS NOT NULL
GROUP BY user_id, project_id
ON CONFLICT (user_id, project_id) DO UPDATE SET
  lifetime_business_score = EXCLUDED.lifetime_business_score,
  lifetime_healing_score = EXCLUDED.lifetime_healing_score,
  lifetime_courage_score = EXCLUDED.lifetime_courage_score,
  lifetime_total_score = EXCLUDED.lifetime_total_score,
  weeks_completed = EXCLUDED.weeks_completed,
  best_week_total = EXCLUDED.best_week_total,
  updated_at = NOW();

-- User-level lifetime scores (project_id IS NULL)
-- Uses partial unique index idx_lifetime_scores_user_null_project for conflict detection
INSERT INTO user_lifetime_scores (
  user_id,
  project_id,
  lifetime_business_score,
  lifetime_healing_score,
  lifetime_courage_score,
  lifetime_total_score,
  weeks_completed,
  best_week_total
)
SELECT
  user_id,
  NULL as project_id,
  SUM(business_score) as lifetime_business_score,
  SUM(healing_score) as lifetime_healing_score,
  SUM(courage_score) as lifetime_courage_score,
  SUM(business_score + healing_score + courage_score) as lifetime_total_score,
  COUNT(*) as weeks_completed,
  MAX(business_score + healing_score + courage_score) as best_week_total
FROM challenge_weekly_scores
WHERE project_id IS NULL
GROUP BY user_id
ON CONFLICT (user_id) WHERE project_id IS NULL DO UPDATE SET
  lifetime_business_score = EXCLUDED.lifetime_business_score,
  lifetime_healing_score = EXCLUDED.lifetime_healing_score,
  lifetime_courage_score = EXCLUDED.lifetime_courage_score,
  lifetime_total_score = EXCLUDED.lifetime_total_score,
  weeks_completed = EXCLUDED.weeks_completed,
  best_week_total = EXCLUDED.best_week_total,
  updated_at = NOW();

-- Update best_week_date (separate query for simplicity)
UPDATE user_lifetime_scores uls
SET best_week_date = (
  SELECT week_start_date
  FROM challenge_weekly_scores cws
  WHERE cws.user_id = uls.user_id
    AND (cws.project_id = uls.project_id OR (cws.project_id IS NULL AND uls.project_id IS NULL))
  ORDER BY (cws.business_score + cws.healing_score + cws.courage_score) DESC
  LIMIT 1
);

-- Log backfill results
DO $$
DECLARE
  lifetime_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO lifetime_count FROM user_lifetime_scores;
  RAISE NOTICE 'Backfilled % rows into user_lifetime_scores', lifetime_count;
END $$;

-- ============================================================================
-- STEP 4: Verification queries (run manually to check)
-- ============================================================================

-- Uncomment these to verify backfill results:

-- Check weekly scores summary
-- SELECT
--   user_id,
--   project_id,
--   COUNT(*) as weeks,
--   SUM(business_score) as total_business,
--   SUM(healing_score) as total_healing,
--   SUM(courage_score) as total_courage,
--   SUM(business_score + healing_score + courage_score) as grand_total
-- FROM challenge_weekly_scores
-- GROUP BY user_id, project_id
-- ORDER BY grand_total DESC;

-- Compare with old totals (should roughly match)
-- SELECT
--   uls.user_id,
--   uls.project_id,
--   uls.lifetime_total_score as new_total,
--   up.total_points as old_project_total,
--   cp.total_points as old_challenge_total
-- FROM user_lifetime_scores uls
-- LEFT JOIN user_projects up ON up.id = uls.project_id
-- LEFT JOIN challenge_progress cp ON cp.user_id = uls.user_id AND cp.project_id = uls.project_id
-- ORDER BY uls.user_id;
