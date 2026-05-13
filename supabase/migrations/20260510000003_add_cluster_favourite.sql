-- Add is_favourite flag to nikigai_clusters for skills/problems curation
ALTER TABLE nikigai_clusters ADD COLUMN IF NOT EXISTS is_favourite BOOLEAN DEFAULT FALSE;
