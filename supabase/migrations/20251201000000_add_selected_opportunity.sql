-- ============================================================================
-- Add selected_opportunity column to nikigai_key_outcomes
-- Stores the user's final selection from integration flow sliders
-- ============================================================================

-- Add selected_opportunity column
ALTER TABLE public.nikigai_key_outcomes
ADD COLUMN IF NOT EXISTS selected_opportunity JSONB DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN public.nikigai_key_outcomes.selected_opportunity IS
'User final selection from integration flow: { skill: {...}, problem: {...}, persona: {...} }';
