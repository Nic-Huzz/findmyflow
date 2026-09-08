-- Backfill problem_tags from items JSONB categoryId for clusters created via IdentifyTopicsFlow.
-- These 39 clusters already have categoryId in items but problem_tags column is empty.

UPDATE nikigai_clusters
SET problem_tags = ARRAY(
  SELECT DISTINCT item->>'categoryId'
  FROM jsonb_array_elements(items) AS item
  WHERE item->>'categoryId' IS NOT NULL
)
WHERE cluster_type = 'problems'
  AND (problem_tags IS NULL OR problem_tags = '{}')
  AND items IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM jsonb_array_elements(items) AS item
    WHERE item->>'categoryId' IS NOT NULL
  );
