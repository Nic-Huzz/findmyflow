-- Fix cluster_type constraint to allow 'persona' and 'roles'
-- The code uses 'persona' but the constraint only allowed 'people'

ALTER TABLE nikigai_clusters
DROP CONSTRAINT IF EXISTS valid_cluster_type;

ALTER TABLE nikigai_clusters
ADD CONSTRAINT valid_cluster_type CHECK (
  cluster_type IN ('skills', 'problems', 'people', 'persona', 'market', 'roles')
);
