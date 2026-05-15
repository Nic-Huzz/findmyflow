-- Fest participant flag for Vibe Rise Fest leaderboard
ALTER TABLE user_stage_progress ADD COLUMN IF NOT EXISTS fest_participant BOOLEAN DEFAULT FALSE;
