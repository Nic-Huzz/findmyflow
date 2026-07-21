-- Sprint 15: Add quest_ids to nikigai_clusters for cluster↔quest linking
ALTER TABLE nikigai_clusters ADD COLUMN IF NOT EXISTS quest_ids uuid[];
