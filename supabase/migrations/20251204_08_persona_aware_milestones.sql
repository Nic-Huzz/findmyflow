-- ============================================================================
-- Migration: Make milestone system persona-aware
-- Purpose: Prevent cross-persona milestone contamination
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Step 1: Drop old unique constraint (user_id, milestone_id)
-- ----------------------------------------------------------------------------
ALTER TABLE public.milestone_completions
DROP CONSTRAINT IF EXISTS milestone_completions_unique;

-- ----------------------------------------------------------------------------
-- Step 2: Add new persona-aware unique constraint
-- ----------------------------------------------------------------------------
-- This allows the same milestone_id to be completed once per persona
-- Example: 'strategy_identified' can be completed for both vibe_riser AND movement_maker
ALTER TABLE public.milestone_completions
ADD CONSTRAINT milestone_completions_unique
UNIQUE (user_id, milestone_id, persona);

-- ----------------------------------------------------------------------------
-- Step 3: Update table comment for documentation
-- ----------------------------------------------------------------------------
COMMENT ON TABLE public.milestone_completions IS
'Tracks milestone completions per user per persona.
Milestones are persona-specific - completing a milestone as Vibe Riser
does not mark it complete for Movement Maker.';

COMMENT ON CONSTRAINT milestone_completions_unique ON public.milestone_completions IS
'Ensures each milestone can only be completed once per user per persona.
Users can complete the same milestone_id in different personas.';

-- ----------------------------------------------------------------------------
-- Verification query
-- ----------------------------------------------------------------------------
-- Check that constraint was created correctly
SELECT
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conname = 'milestone_completions_unique'
  AND conrelid = 'public.milestone_completions'::regclass;
