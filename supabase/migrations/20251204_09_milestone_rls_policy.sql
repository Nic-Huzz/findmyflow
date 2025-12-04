-- Migration: Add RLS policy to milestone_completions for persona isolation
-- This provides defense-in-depth protection against cross-persona contamination
-- Even if application code fails to filter by persona, database will enforce it

-- Enable Row Level Security
ALTER TABLE public.milestone_completions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see and modify milestones for their current persona
CREATE POLICY milestone_persona_isolation ON public.milestone_completions
  FOR ALL
  USING (
    persona = (
      SELECT persona
      FROM public.user_stage_progress
      WHERE user_id = milestone_completions.user_id
    )
  )
  WITH CHECK (
    persona = (
      SELECT persona
      FROM public.user_stage_progress
      WHERE user_id = milestone_completions.user_id
    )
  );

-- Add index to optimize RLS policy lookups
CREATE INDEX IF NOT EXISTS idx_user_stage_progress_user_persona
ON public.user_stage_progress(user_id, persona);

COMMENT ON POLICY milestone_persona_isolation ON public.milestone_completions IS
'Enforces persona isolation at database level. Users can only access milestones
matching their current persona in user_stage_progress. This prevents cross-persona
contamination even if application code has bugs.';
