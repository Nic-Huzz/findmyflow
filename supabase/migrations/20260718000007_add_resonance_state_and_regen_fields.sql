-- Sprint 7: NS state swap + Sprint 8 prep
ALTER TABLE nikigai_clusters ADD COLUMN IF NOT EXISTS resonance_state text;
ALTER TABLE nikigai_clusters ADD COLUMN IF NOT EXISTS regen_attempted_at timestamptz;
ALTER TABLE nikigai_clusters ADD COLUMN IF NOT EXISTS regen_notified boolean DEFAULT false;

-- Backfill existing ratings to states
UPDATE nikigai_clusters SET resonance_state = CASE
  WHEN resonance_rating = 4 THEN 'vibe_rise'
  WHEN resonance_rating = 3 THEN 'fun'
  WHEN resonance_rating <= 2 AND is_removed = true THEN 'bored'
  ELSE NULL
END WHERE resonance_rating IS NOT NULL AND resonance_state IS NULL;
