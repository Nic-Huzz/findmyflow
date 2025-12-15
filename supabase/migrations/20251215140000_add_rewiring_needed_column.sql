-- Add rewiring_needed column to nervous_system_responses table
ALTER TABLE nervous_system_responses
ADD COLUMN IF NOT EXISTS rewiring_needed TEXT;

-- Add comment for documentation
COMMENT ON COLUMN nervous_system_responses.rewiring_needed IS 'AI-generated text describing what beliefs/patterns need rewiring based on nervous system assessment';
