-- Check JUST your notification preferences
SELECT
  daily_quests,
  leaderboard_updates,
  group_activity,
  artifact_unlocks,
  created_at,
  updated_at
FROM notification_preferences
WHERE user_id = 'e1e50c38-94d4-4ce7-b763-b439e49f48f3';
