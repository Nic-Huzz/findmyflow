-- =====================================================================
-- GROAN MATRIX COLUMNS FIX
-- Adds missing columns expected by groanChallengeService.js
-- =====================================================================

-- Add title column (service expects separate title from description)
ALTER TABLE groan_challenges ADD COLUMN IF NOT EXISTS title TEXT;

-- Add description column
ALTER TABLE groan_challenges ADD COLUMN IF NOT EXISTS description TEXT;

-- Add source_id column (alias for source_cluster_id, used by service)
ALTER TABLE groan_challenges ADD COLUMN IF NOT EXISTS source_id UUID;

-- Add source_label column (human-readable label)
ALTER TABLE groan_challenges ADD COLUMN IF NOT EXISTS source_label TEXT;

-- Add accepted_at timestamp
ALTER TABLE groan_challenges ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;

-- Add scary/wahoo scores AFTER completion
ALTER TABLE groan_challenges ADD COLUMN IF NOT EXISTS scary_score_after INTEGER CHECK (scary_score_after IS NULL OR (scary_score_after >= 1 AND scary_score_after <= 10));
ALTER TABLE groan_challenges ADD COLUMN IF NOT EXISTS wahoo_score_after INTEGER CHECK (wahoo_score_after IS NULL OR (wahoo_score_after >= 1 AND wahoo_score_after <= 10));

-- Add essence insight (calculated from zone)
ALTER TABLE groan_challenges ADD COLUMN IF NOT EXISTS essence_insight TEXT;

-- Add essence_zone as text column (service uses string enum)
ALTER TABLE groan_challenges ADD COLUMN IF NOT EXISTS essence_zone TEXT;

-- Add generation_prompt for tracking what prompt was used
ALTER TABLE groan_challenges ADD COLUMN IF NOT EXISTS generation_prompt TEXT;

-- Add linked_contract_id for NS integration
ALTER TABLE groan_challenges ADD COLUMN IF NOT EXISTS linked_contract_id UUID;

-- Update status column to use text instead of enum for flexibility
-- First check if status column exists and is not text
DO $$
BEGIN
  -- Add status as text if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'groan_challenges' AND column_name = 'status') THEN
    ALTER TABLE groan_challenges ADD COLUMN status TEXT DEFAULT 'generated';
  END IF;
END $$;

-- Migrate data from challenge_text to title if needed
UPDATE groan_challenges
SET title = challenge_text
WHERE title IS NULL AND challenge_text IS NOT NULL;

-- Migrate data from source_cluster_id to source_id if needed
UPDATE groan_challenges
SET source_id = source_cluster_id
WHERE source_id IS NULL AND source_cluster_id IS NOT NULL;

-- Migrate data from source_value to source_label if needed
UPDATE groan_challenges
SET source_label = source_value
WHERE source_label IS NULL AND source_value IS NOT NULL;

-- Add columns to groan_proof that service expects
ALTER TABLE groan_proof ADD COLUMN IF NOT EXISTS revenue_amount DECIMAL(10,2);
ALTER TABLE groan_proof ADD COLUMN IF NOT EXISTS revenue_currency TEXT DEFAULT 'USD';

-- Add columns to groan_contract_evidence that service expects
ALTER TABLE groan_contract_evidence ADD COLUMN IF NOT EXISTS contract_id UUID;
ALTER TABLE groan_contract_evidence ADD COLUMN IF NOT EXISTS belief_text TEXT;
ALTER TABLE groan_contract_evidence ADD COLUMN IF NOT EXISTS disproves BOOLEAN DEFAULT true;

-- Add columns to groan_outcomes that service expects
ALTER TABLE groan_outcomes ADD COLUMN IF NOT EXISTS outcome_description TEXT;
ALTER TABLE groan_outcomes ADD COLUMN IF NOT EXISTS revenue_currency TEXT DEFAULT 'USD';

-- Add columns to groan_user_preferences that service expects
ALTER TABLE groan_user_preferences ADD COLUMN IF NOT EXISTS show_archetype_language BOOLEAN DEFAULT false;
ALTER TABLE groan_user_preferences ADD COLUMN IF NOT EXISTS preferred_difficulty INTEGER DEFAULT 3;
ALTER TABLE groan_user_preferences ADD COLUMN IF NOT EXISTS zarlo_before_enabled BOOLEAN DEFAULT true;
ALTER TABLE groan_user_preferences ADD COLUMN IF NOT EXISTS zarlo_after_enabled BOOLEAN DEFAULT true;
ALTER TABLE groan_user_preferences ADD COLUMN IF NOT EXISTS confetti_enabled BOOLEAN DEFAULT true;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_groan_challenges_source_id ON groan_challenges(source_id);
CREATE INDEX IF NOT EXISTS idx_groan_challenges_essence_zone ON groan_challenges(essence_zone);

-- =====================================================================
-- MIGRATION COMPLETE
-- =====================================================================
