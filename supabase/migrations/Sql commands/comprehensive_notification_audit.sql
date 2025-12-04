-- ============================================
-- COMPREHENSIVE NOTIFICATION SYSTEM AUDIT
-- ============================================

-- 1. Verify notification_preferences table schema
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'notification_preferences'
ORDER BY ordinal_position;

-- 2. Check YOUR notification preferences specifically
SELECT *
FROM notification_preferences
WHERE user_id = 'e1e50c38-94d4-4ce7-b763-b439e49f48f3';

-- 3. Verify push_subscriptions table schema
SELECT
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'push_subscriptions'
ORDER BY ordinal_position;

-- 4. Check YOUR push subscriptions
SELECT
  user_id,
  endpoint,
  keys,
  created_at
FROM push_subscriptions
WHERE user_id = 'e1e50c38-94d4-4ce7-b763-b439e49f48f3';

-- 5. Verify challenge_progress table exists and check YOUR challenge
SELECT
  user_id,
  challenge_start_date,
  created_at,
  current_day,
  EXTRACT(DAY FROM (NOW() - challenge_start_date)) as days_since_start,
  persona,
  current_stage,
  streak_days,
  longest_streak,
  last_active_date,
  total_points
FROM challenge_progress
WHERE user_id = 'e1e50c38-94d4-4ce7-b763-b439e49f48f3'
ORDER BY challenge_start_date DESC
LIMIT 1;

-- 6. Check current cron job configuration
SELECT
  jobid,
  jobname,
  schedule,
  active,
  command
FROM cron.job
WHERE jobname = 'timezone-based-notifications-hourly';

-- 7. Check recent cron job execution history
SELECT
  jobid,
  runid,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'timezone-based-notifications-hourly')
ORDER BY start_time DESC
LIMIT 5;

-- 8. Verify vault secrets exist
SELECT name, description
FROM vault.decrypted_secrets
WHERE name IN ('SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_URL');

-- 9. Check RLS policies on push_subscriptions
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'push_subscriptions';

-- 10. Check RLS policies on notification_preferences
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'notification_preferences';
