-- Add step_id field to nikigai_clusters table to track which step created the clusters
ALTER TABLE nikigai_clusters
ADD COLUMN IF NOT EXISTS step_id TEXT;

-- Add index for querying by step_id
CREATE INDEX IF NOT EXISTS idx_nikigai_clusters_step_id ON nikigai_clusters(step_id);

-- Add comment
COMMENT ON COLUMN nikigai_clusters.step_id IS 'The step ID that triggered this cluster creation (e.g., 2.3, 2.4)';
