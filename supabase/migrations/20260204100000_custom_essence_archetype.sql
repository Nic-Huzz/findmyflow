-- Add custom essence archetype fields to lead_flow_profiles
-- Allows users to override their display name and avatar image
ALTER TABLE lead_flow_profiles
ADD COLUMN IF NOT EXISTS custom_essence_name TEXT,
ADD COLUMN IF NOT EXISTS custom_essence_image TEXT;
