-- Add weekly review and task tracking columns to weekly_plans
-- These support the enhanced weekly planning flow with review and recommended tasks

-- Add focus project reference
ALTER TABLE weekly_plans
ADD COLUMN IF NOT EXISTS focus_project_id UUID REFERENCES user_projects(id) ON DELETE SET NULL;

-- Add selected priorities (array of priority IDs from QUEST_PRIORITIES)
ALTER TABLE weekly_plans
ADD COLUMN IF NOT EXISTS selected_priorities TEXT[] DEFAULT '{}';

-- Add flow check-in state from weekly review
ALTER TABLE weekly_plans
ADD COLUMN IF NOT EXISTS flow_internal TEXT CHECK (flow_internal IN ('excited', 'tired'));

ALTER TABLE weekly_plans
ADD COLUMN IF NOT EXISTS flow_external TEXT CHECK (flow_external IN ('great', 'resistance'));

ALTER TABLE weekly_plans
ADD COLUMN IF NOT EXISTS flow_direction TEXT CHECK (flow_direction IN ('north', 'east', 'south', 'west'));

-- Add groan-related columns if they don't exist
ALTER TABLE weekly_plans
ADD COLUMN IF NOT EXISTS groan_challenge_id UUID REFERENCES groan_challenges(id) ON DELETE SET NULL;

ALTER TABLE weekly_plans
ADD COLUMN IF NOT EXISTS weekly_groan_fears TEXT[] DEFAULT '{}';

ALTER TABLE weekly_plans
ADD COLUMN IF NOT EXISTS weekly_groan_layer TEXT;

-- Add group_id if it doesn't exist (may have been added in previous migration)
ALTER TABLE weekly_plans
ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES challenge_groups(id) ON DELETE SET NULL;

-- Create index for project lookups
CREATE INDEX IF NOT EXISTS idx_weekly_plans_focus_project
  ON weekly_plans(focus_project_id);

-- Add comment
COMMENT ON COLUMN weekly_plans.focus_project_id IS 'Project to focus on for the week';
COMMENT ON COLUMN weekly_plans.selected_tasks IS 'Array of task IDs from RECOMMENDED_TASKS config';
COMMENT ON COLUMN weekly_plans.flow_internal IS 'Internal state from weekly review (excited/tired)';
COMMENT ON COLUMN weekly_plans.flow_external IS 'External state from weekly review (great/resistance)';
COMMENT ON COLUMN weekly_plans.flow_direction IS 'Derived flow direction (north/east/south/west)';
