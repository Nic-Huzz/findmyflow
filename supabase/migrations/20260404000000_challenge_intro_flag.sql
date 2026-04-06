ALTER TABLE user_stage_progress ADD COLUMN IF NOT EXISTS has_seen_challenge_intro BOOLEAN DEFAULT FALSE;
