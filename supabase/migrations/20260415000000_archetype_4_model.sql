-- ============================================================
-- Archetype Migration: 5 → 4+1 model
--
-- Changes:
--   1. Add 'auto_pilot' to protective_archetype enum
--   2. Remap 'performer' → 'controller' in groan_reflections
--   3. Remap 'performer' → 'controller' in healing_compass_responses
--   4. Update CHECK constraint on healing_compass_responses
--   5. Keep 'performer' in enum for legacy compat (can't easily remove enum values in Postgres)
-- ============================================================

-- 1. Add auto_pilot to the protective_archetype enum
ALTER TYPE protective_archetype ADD VALUE IF NOT EXISTS 'auto_pilot';

-- 2. Remap performer → controller in groan_reflections
UPDATE groan_reflections
SET protective_archetype = 'controller'
WHERE protective_archetype = 'performer';

-- 3. Remap performer → controller in healing_compass_responses
UPDATE healing_compass_responses
SET protective_pattern = 'controller'
WHERE protective_pattern = 'performer';

-- 4. Drop and recreate CHECK constraint on healing_compass_responses
--    to include auto_pilot (and keep performer for any edge cases)
ALTER TABLE healing_compass_responses DROP CONSTRAINT IF EXISTS chk_protective_pattern;
ALTER TABLE healing_compass_responses ADD CONSTRAINT chk_protective_pattern
  CHECK (protective_pattern IS NULL OR protective_pattern IN (
    'ghost', 'controller', 'perfectionist', 'people_pleaser', 'auto_pilot', 'performer'
  ));
