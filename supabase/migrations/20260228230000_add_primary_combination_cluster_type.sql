-- Allow 'primary_combination' cluster_type for Mind Space combination selection
-- Allow 'selected' cluster_stage for chosen combinations

BEGIN;

ALTER TABLE nikigai_clusters
DROP CONSTRAINT IF EXISTS valid_cluster_type;

ALTER TABLE nikigai_clusters
ADD CONSTRAINT valid_cluster_type CHECK (
  cluster_type IN ('skills', 'problems', 'people', 'persona', 'market', 'roles', 'primary_combination')
);

ALTER TABLE nikigai_clusters
DROP CONSTRAINT IF EXISTS valid_cluster_stage;

ALTER TABLE nikigai_clusters
ADD CONSTRAINT valid_cluster_stage CHECK (
  cluster_stage IN ('preview', 'intermediate', 'final', 'selected')
);

COMMIT;
