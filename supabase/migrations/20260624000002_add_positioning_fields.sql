-- Life Quake + Transformation fields for positioning synthesis
ALTER TABLE lead_flow_profiles
ADD COLUMN IF NOT EXISTS life_quake TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS transformation TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS positioning_statement TEXT DEFAULT NULL;
