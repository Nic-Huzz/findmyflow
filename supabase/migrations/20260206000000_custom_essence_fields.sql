-- Add custom_essence_fields JSONB column to lead_flow_profiles
-- Allows users to customize their essence profile fields (essence, superpower, vision, north_star)

ALTER TABLE lead_flow_profiles
ADD COLUMN IF NOT EXISTS custom_essence_fields JSONB DEFAULT '{}';

-- Add comment explaining the structure
COMMENT ON COLUMN lead_flow_profiles.custom_essence_fields IS
'Stores custom essence field preferences. Structure:
{
  "essence": { "mode": "browse|hybrid|custom", "value": "...", "sources": ["Radiant Rebel", "Playful Creator"] },
  "superpower": { ... },
  "vision": { ... },
  "north_star": { ... }
}
Mode: browse = selected from another archetype, hybrid = AI-generated from multiple, custom = user-written';
