-- ============================================================================
-- Add taxonomy_keys column to nikigai_clusters
-- Purpose: Persist wheel segment mappings for consistent visualization
-- ============================================================================

-- Add taxonomy_keys column (array of segment IDs like ['seekers', 'achievers'])
ALTER TABLE nikigai_clusters
ADD COLUMN IF NOT EXISTS taxonomy_keys TEXT[] DEFAULT '{}';

-- Add comment explaining the column
COMMENT ON COLUMN nikigai_clusters.taxonomy_keys IS
  'Array of wheel segment IDs (e.g., seekers, builders, healers) mapped to this cluster. Used for consistent wheel visualization. If empty, regenerate from cluster_label.';

-- Create index for querying by taxonomy
CREATE INDEX IF NOT EXISTS idx_clusters_taxonomy_keys
ON nikigai_clusters USING GIN(taxonomy_keys);

-- Verify migration
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'nikigai_clusters'
    AND column_name = 'taxonomy_keys'
  ) THEN
    RAISE NOTICE '✅ taxonomy_keys column added to nikigai_clusters';
  ELSE
    RAISE WARNING '⚠️ Failed to add taxonomy_keys column';
  END IF;
END $$;
