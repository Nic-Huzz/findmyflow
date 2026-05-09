-- Add inspiration JSONB column to experiences table
-- Stores: { selectedCreators, blend, chosenConcept } from the inspiration flow
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS inspiration JSONB;
