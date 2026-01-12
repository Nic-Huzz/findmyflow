-- Add missing columns to weekly_plans table
-- group_id: links to challenge_groups for group play
-- weekly_groan_fears: array of fear types (judged, not_enough, might_fail)
-- weekly_groan_layer: visibility layer (screen, live, tribe, money, heart)

-- Add group_id column
ALTER TABLE weekly_plans
ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES challenge_groups(id) ON DELETE SET NULL;

-- Add weekly_groan_fears column (array of fear types)
ALTER TABLE weekly_plans
ADD COLUMN IF NOT EXISTS weekly_groan_fears TEXT[];

-- Add weekly_groan_layer column
ALTER TABLE weekly_plans
ADD COLUMN IF NOT EXISTS weekly_groan_layer TEXT
CHECK (weekly_groan_layer IN ('screen', 'live', 'tribe', 'money', 'heart'));

-- Add index for group lookups
CREATE INDEX IF NOT EXISTS idx_weekly_plans_group ON weekly_plans(group_id);

-- Comment
COMMENT ON COLUMN weekly_plans.group_id IS 'Reference to challenge_groups for group competition';
COMMENT ON COLUMN weekly_plans.weekly_groan_fears IS 'Array of fear types: judged, not_enough, might_fail';
COMMENT ON COLUMN weekly_plans.weekly_groan_layer IS 'Visibility layer: screen, live, tribe, money, heart';
