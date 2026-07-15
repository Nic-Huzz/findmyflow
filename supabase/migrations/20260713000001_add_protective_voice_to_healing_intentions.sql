-- Add protective_voice column to healing_intentions
-- Enables structured voice counting for Stage 6→7 graduation trigger
-- (5 occurrences of same voice = pattern revealed)

ALTER TABLE healing_intentions
  ADD COLUMN IF NOT EXISTS protective_voice text;

-- Backfill from pattern field where it matches known voice names
UPDATE healing_intentions
SET protective_voice = pattern
WHERE pattern IN ('ghost', 'controller', 'perfectionist', 'auto_pilot', 'people_pleaser')
  AND protective_voice IS NULL;

-- Index for voice counting queries (used by heroStageChecker + Zarlo Brief)
CREATE INDEX IF NOT EXISTS idx_healing_intentions_voice
  ON healing_intentions (user_id, protective_voice)
  WHERE protective_voice IS NOT NULL;
