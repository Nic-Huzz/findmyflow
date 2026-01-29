-- Update week_type constraint to match new week type options
-- Changes from: push, flow, rest, launch
-- Changes to: business, healing, rest, flow

ALTER TABLE weekly_plans
DROP CONSTRAINT weekly_plans_week_type_check;

ALTER TABLE weekly_plans
ADD CONSTRAINT weekly_plans_week_type_check
CHECK (week_type IN ('business', 'healing', 'rest', 'flow'));
