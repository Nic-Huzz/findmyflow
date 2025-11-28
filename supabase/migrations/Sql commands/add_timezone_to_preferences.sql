-- Add timezone column to notification_preferences table
ALTER TABLE notification_preferences
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';

-- Add comment
COMMENT ON COLUMN notification_preferences.timezone IS 'User timezone in IANA format (e.g., America/New_York, Europe/London, Australia/Sydney)';

-- Update existing users to auto-detect timezone (will be updated by frontend)
-- For now, default to UTC
UPDATE notification_preferences
SET timezone = 'UTC'
WHERE timezone IS NULL;
