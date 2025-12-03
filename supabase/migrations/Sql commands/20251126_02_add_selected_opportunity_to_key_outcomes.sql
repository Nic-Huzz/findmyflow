-- Add selected_opportunity field to nikigai_key_outcomes for Library of Answers
-- This stores the specific combination the user selected from the sliders

ALTER TABLE nikigai_key_outcomes
ADD COLUMN IF NOT EXISTS selected_opportunity JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN nikigai_key_outcomes.selected_opportunity IS 'The specific skill, problem, and persona combination the user selected from the integration sliders';
