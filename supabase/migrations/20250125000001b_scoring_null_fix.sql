-- Fix for NULL project_id handling in scoring tables
-- PostgreSQL UNIQUE constraints don't work with NULL values (NULL != NULL)
-- This adds partial unique indexes to handle the NULL case

-- ============================================================================
-- STEP 1: Add partial unique indexes for NULL project_id cases
-- ============================================================================

-- Weekly scores: unique index for NULL project_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_weekly_scores_user_null_project_week
  ON challenge_weekly_scores(user_id, week_start_date)
  WHERE project_id IS NULL;

-- Lifetime scores: unique index for NULL project_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_lifetime_scores_user_null_project
  ON user_lifetime_scores(user_id)
  WHERE project_id IS NULL;

-- ============================================================================
-- STEP 2: Verify indexes were created
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Partial unique indexes for NULL project_id created successfully';
END $$;
