-- Add voice + compass rating columns to founder_dna_sessions
-- Replaces the old numeric resistance/engagement/shift ratings

ALTER TABLE founder_dna_sessions
  ADD COLUMN IF NOT EXISTS voice_type text,
  ADD COLUMN IF NOT EXISTS voice_reflection text,
  ADD COLUMN IF NOT EXISTS compass_internal text,
  ADD COLUMN IF NOT EXISTS compass_external text,
  ADD COLUMN IF NOT EXISTS compass_direction text;

-- Old columns (resistance_rating, engagement_rating, shift_rating) kept for
-- backward compatibility with already-completed sessions.
