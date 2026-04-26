-- Add pay_rent_model column to user_stage_progress
alter table user_stage_progress add column if not exists pay_rent_model text;
alter table user_stage_progress add column if not exists pay_rent_completed_at timestamptz;
