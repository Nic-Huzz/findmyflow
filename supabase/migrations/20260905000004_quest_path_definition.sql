-- Path definition: precursor level, dream dimensions, protective voice, buts
-- Enables the 2-screen path definition flow in /choose-quests
-- current_dimensions already exists on quests

ALTER TABLE quests
  ADD COLUMN IF NOT EXISTS precursor_level text,
  ADD COLUMN IF NOT EXISTS dream_dimensions jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS protective_voice text,
  ADD COLUMN IF NOT EXISTS buts text[];
