-- =============================================
-- FORCE V2 ONBOARDING FOR ALL USERS
-- Re-triggers the new Q1→Q2→Q3 onboarding flow
-- =============================================

-- Step 1: Preview - See who will be affected
SELECT
  u.email,
  usp.onboarding_completed,
  usp.onboarding_v2_completed,
  usp.employment_status,
  usp.wealth_ladder_rung,
  usp.primary_goal,
  usp.persona,
  usp.created_at as progress_created,
  u.last_sign_in_at
FROM auth.users u
LEFT JOIN user_stage_progress usp ON usp.user_id = u.id
WHERE usp.onboarding_v2_completed IS NOT TRUE
   OR usp.onboarding_v2_completed = false
   OR usp.user_id IS NULL
ORDER BY u.last_sign_in_at DESC;


-- Step 2: UPDATE - Set onboarding_v2_completed = false for users who haven't done it
-- This will make them see HomeFirstTime on next visit
-- UNCOMMENT TO RUN:

/*
UPDATE user_stage_progress
SET onboarding_v2_completed = false
WHERE onboarding_v2_completed IS NOT TRUE
   OR onboarding_v2_completed = false;
*/


-- Step 3: For users with NO user_stage_progress row at all,
-- they'll automatically see HomeFirstTime (no action needed)


-- Step 4: Verify the update
/*
SELECT
  u.email,
  usp.onboarding_v2_completed,
  'Will see V2 onboarding' as status
FROM auth.users u
LEFT JOIN user_stage_progress usp ON usp.user_id = u.id
WHERE usp.onboarding_v2_completed IS NOT TRUE
ORDER BY u.email;
*/


-- =============================================
-- OPTIONAL: Clear localStorage flags remotely
-- (Users can also clear manually in browser)
-- =============================================
-- localStorage keys that may cache old state:
-- - profile_onboarding_seen_{userId}
-- - onboarding_v2_progress_{userId}
-- - SeeYourFlow state
--
-- These are client-side only. To clear them:
-- 1. User clears browser data, OR
-- 2. Add a version check in the app (see recommendation below)
