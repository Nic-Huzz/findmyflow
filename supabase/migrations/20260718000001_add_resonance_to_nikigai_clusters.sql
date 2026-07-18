-- Sprint 2: Cluster resonance rating + Clarity score
-- Adds fields for users to rate how well each cluster describes them (1-5)
ALTER TABLE nikigai_clusters ADD COLUMN IF NOT EXISTS resonance_rating integer;
ALTER TABLE nikigai_clusters ADD COLUMN IF NOT EXISTS resonance_updated_at timestamptz;
ALTER TABLE nikigai_clusters ADD COLUMN IF NOT EXISTS behavioral_evidence integer DEFAULT 0;
ALTER TABLE nikigai_clusters ADD COLUMN IF NOT EXISTS is_removed boolean DEFAULT false;
