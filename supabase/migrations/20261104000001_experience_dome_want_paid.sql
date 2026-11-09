-- Add want_paid column to experience_dome_ratings
-- Only meaningful for fun/vibe_rise ratings; null for pressure/bored
ALTER TABLE experience_dome_ratings
  ADD COLUMN IF NOT EXISTS want_paid boolean DEFAULT null;
