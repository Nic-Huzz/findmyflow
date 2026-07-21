-- Fix: allow 'archived' in cluster_stage (the code already uses it but the constraint blocked it)
ALTER TABLE nikigai_clusters DROP CONSTRAINT IF EXISTS valid_cluster_stage;
ALTER TABLE nikigai_clusters ADD CONSTRAINT valid_cluster_stage
  CHECK (cluster_stage = ANY (ARRAY['preview', 'intermediate', 'final', 'selected', 'archived']));
