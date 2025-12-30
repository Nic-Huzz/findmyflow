-- Add missing reflection fields to nervous_system_responses table
-- These fields store the complete AI-generated reflection so users see the same results when revisiting

ALTER TABLE nervous_system_responses
ADD COLUMN IF NOT EXISTS archetype_description TEXT,
ADD COLUMN IF NOT EXISTS safety_edges_summary TEXT,
ADD COLUMN IF NOT EXISTS core_fear TEXT,
ADD COLUMN IF NOT EXISTS fear_interpretation TEXT;

-- Add comments for documentation
COMMENT ON COLUMN nervous_system_responses.archetype_description IS 'One sentence description of the user archetype pattern';
COMMENT ON COLUMN nervous_system_responses.safety_edges_summary IS 'Narrative about safety zones vs contraction zones';
COMMENT ON COLUMN nervous_system_responses.core_fear IS 'The primary limiting belief identified';
COMMENT ON COLUMN nervous_system_responses.fear_interpretation IS 'Explanation of what the core fear suggests about their nervous system';
