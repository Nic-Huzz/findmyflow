-- ============================================================================
-- Add easy_to_target column to persona_profiles
-- Description: Adds the "Are they easy to target?" question field
-- ============================================================================

ALTER TABLE persona_profiles
ADD COLUMN IF NOT EXISTS easy_to_target TEXT;
