-- Migration: Add 'roles' to cluster_type constraint
-- Date: 2025-11-24
-- Purpose: Support role clustering in addition to skills, problems, people, market

-- Drop the old constraint
ALTER TABLE nikigai_clusters
DROP CONSTRAINT IF EXISTS valid_cluster_type;

-- Add the new constraint with 'roles' included
ALTER TABLE nikigai_clusters
ADD CONSTRAINT valid_cluster_type
CHECK (cluster_type IN ('skills', 'problems', 'people', 'market', 'roles'));
