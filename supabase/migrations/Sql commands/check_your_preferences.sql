-- Check your notification preferences and challenge details
SELECT
  daily_quests,
  leaderboard_updates,
  group_activity,
  artifact_unlocks,
  created_at,
  updated_at
FROM notification_preferences
WHERE user_id = 'e1e50c38-94d4-4ce7-b763-b439e49f48f3';

-- Check your challenge status
SELECT
  challenge_start_date,
  current_day,
  EXTRACT(DAY FROM (NOW() - challenge_start_date)) as days_since_start,
  total_points,
  last_active_date,
  persona,
  current_stage
FROM challenge_progress
WHERE user_id = 'e1e50c38-94d4-4ce7-b763-b439e49f48f3';
