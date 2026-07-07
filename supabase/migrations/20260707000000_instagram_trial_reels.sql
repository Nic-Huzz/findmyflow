-- Extend instagram_posts with reel-specific metrics and trial reel detection

ALTER TABLE instagram_posts ADD COLUMN IF NOT EXISTS is_trial_reel BOOLEAN DEFAULT FALSE;
ALTER TABLE instagram_posts ADD COLUMN IF NOT EXISTS skip_rate NUMERIC;
ALTER TABLE instagram_posts ADD COLUMN IF NOT EXISTS avg_watch_time NUMERIC;
ALTER TABLE instagram_posts ADD COLUMN IF NOT EXISTS total_watch_time NUMERIC;
ALTER TABLE instagram_posts ADD COLUMN IF NOT EXISTS reposts INT DEFAULT 0;
ALTER TABLE instagram_posts ADD COLUMN IF NOT EXISTS plays INT DEFAULT 0;
ALTER TABLE instagram_posts ADD COLUMN IF NOT EXISTS total_watch_time NUMERIC;
ALTER TABLE instagram_posts ADD COLUMN IF NOT EXISTS ai_analysis JSONB;

-- Index for quick trial reel filtering
CREATE INDEX IF NOT EXISTS idx_ig_posts_trial_reels
  ON instagram_posts(user_id, is_trial_reel, posted_at DESC)
  WHERE is_trial_reel = TRUE;
