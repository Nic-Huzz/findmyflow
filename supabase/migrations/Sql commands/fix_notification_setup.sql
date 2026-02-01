-- ============================================
-- FIX NOTIFICATION SETUP (Simplified)
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Create push_subscriptions table if not exists
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  keys JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

-- 2. Create notification_preferences table with simplified columns
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  quest_reminders BOOLEAN DEFAULT TRUE,
  achievement_celebrations BOOLEAN DEFAULT TRUE,
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Add new columns if table exists with old schema (migration)
DO $$
BEGIN
  -- Add new columns if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notification_preferences' AND column_name = 'quest_reminders') THEN
    ALTER TABLE notification_preferences ADD COLUMN quest_reminders BOOLEAN DEFAULT TRUE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notification_preferences' AND column_name = 'achievement_celebrations') THEN
    ALTER TABLE notification_preferences ADD COLUMN achievement_celebrations BOOLEAN DEFAULT TRUE;
  END IF;

  -- Migrate old preferences to new: if daily_quests was true, set quest_reminders true
  UPDATE notification_preferences
  SET quest_reminders = COALESCE(daily_quests, TRUE),
      achievement_celebrations = COALESCE(artifact_unlocks, TRUE)
  WHERE quest_reminders IS NULL OR achievement_celebrations IS NULL;
END $$;

-- 4. Enable RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own push subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can insert their own push subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can update their own push subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can delete their own push subscriptions" ON push_subscriptions;

DROP POLICY IF EXISTS "Users can view their own notification preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Users can insert their own notification preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Users can update their own notification preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Users can delete their own notification preferences" ON notification_preferences;

-- 6. Create RLS policies for push_subscriptions
CREATE POLICY "Users can view their own push subscriptions"
  ON push_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own push subscriptions"
  ON push_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own push subscriptions"
  ON push_subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own push subscriptions"
  ON push_subscriptions FOR DELETE
  USING (auth.uid() = user_id);

-- 7. Create RLS policies for notification_preferences
CREATE POLICY "Users can view their own notification preferences"
  ON notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification preferences"
  ON notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification preferences"
  ON notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notification preferences"
  ON notification_preferences FOR DELETE
  USING (auth.uid() = user_id);

-- 8. Create indexes
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);

-- 9. Verify tables exist
SELECT 'push_subscriptions' as table_name, COUNT(*) as row_count FROM push_subscriptions
UNION ALL
SELECT 'notification_preferences' as table_name, COUNT(*) as row_count FROM notification_preferences;

-- 10. Check current columns
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'notification_preferences'
ORDER BY ordinal_position;
