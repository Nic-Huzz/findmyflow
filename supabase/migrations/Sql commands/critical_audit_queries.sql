-- ============================================
-- CRITICAL AUDIT QUERIES
-- Run these one by one and share ALL results
-- ============================================

-- Query 1: YOUR notification preferences
SELECT * FROM notification_preferences
WHERE user_id = 'e1e50c38-94d4-4ce7-b763-b439e49f48f3';

-- Query 2: YOUR push subscriptions (excluding the actual keys for privacy)
SELECT
  user_id,
  endpoint,
  created_at,
  CASE WHEN keys IS NOT NULL THEN 'HAS_KEYS' ELSE 'NO_KEYS' END as key_status
FROM push_subscriptions
WHERE user_id = 'e1e50c38-94d4-4ce7-b763-b439e49f48f3';

-- Query 3: YOUR challenge progress
SELECT
  user_id,
  challenge_start_date,
  current_day,
  EXTRACT(DAY FROM (NOW() - challenge_start_date)) as days_since_start,
  persona,
  current_stage,
  streak_days,
  total_points,
  last_active_date
FROM challenge_progress
WHERE user_id = 'e1e50c38-94d4-4ce7-b763-b439e49f48f3';

-- Query 4: Cron job configuration
SELECT
  jobid,
  jobname,
  schedule,
  active,
  command
FROM cron.job
WHERE jobname = 'timezone-based-notifications-hourly';
