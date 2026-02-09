-- Allow NULL week_type for simplified weekly planning flow
-- (Week type selection archived until Healing tab is live)

ALTER TABLE weekly_plans
DROP CONSTRAINT weekly_plans_week_type_check;

ALTER TABLE weekly_plans
ADD CONSTRAINT weekly_plans_week_type_check
CHECK (week_type IS NULL OR week_type IN ('business', 'healing', 'rest', 'flow'));
