-- Add matchup_alerts preference for game day notifications
ALTER TABLE notification_preferences
ADD COLUMN IF NOT EXISTS matchup_alerts boolean DEFAULT true;
