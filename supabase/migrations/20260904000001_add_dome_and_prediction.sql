-- Dome of Safety + Prediction Error columns on groan_challenges
-- Sprint A1: data foundation for 8-dimension courage tracking + body-based prediction

ALTER TABLE groan_challenges
  ADD COLUMN IF NOT EXISTS dimension_values jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS predicted_difficulty smallint CHECK (predicted_difficulty BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS predicted_at timestamptz,
  ADD COLUMN IF NOT EXISTS preaction_difficulty smallint CHECK (preaction_difficulty BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS experienced_difficulty smallint CHECK (experienced_difficulty BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS experienced_at timestamptz;

-- Write-once on predicted_difficulty (DB-level integrity)
CREATE OR REPLACE FUNCTION prevent_prediction_update()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.predicted_difficulty IS NOT NULL
     AND NEW.predicted_difficulty IS DISTINCT FROM OLD.predicted_difficulty THEN
    RAISE EXCEPTION 'predicted_difficulty is write-once';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_prediction_writeonce ON groan_challenges;
CREATE TRIGGER enforce_prediction_writeonce
  BEFORE UPDATE ON groan_challenges
  FOR EACH ROW EXECUTE FUNCTION prevent_prediction_update();
