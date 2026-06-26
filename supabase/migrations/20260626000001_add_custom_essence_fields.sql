-- Add custom_essence_fields JSONB column to lead_flow_profiles
-- Stores per-field customizations (mode, value, sources) for essence profile editing
ALTER TABLE public.lead_flow_profiles
ADD COLUMN IF NOT EXISTS custom_essence_fields JSONB DEFAULT '{}'::jsonb;
