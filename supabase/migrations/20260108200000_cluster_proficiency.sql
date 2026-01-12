-- Add proficiency column to nikigai_clusters for Option B cluster-level ratings
-- Stores: 'exploring', 'pursuing', or 'proven'

ALTER TABLE nikigai_clusters
ADD COLUMN IF NOT EXISTS proficiency TEXT;

-- Add comment for documentation
COMMENT ON COLUMN nikigai_clusters.proficiency IS 'Cluster-level proficiency rating: exploring, pursuing, or proven';
