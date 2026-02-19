-- Fix: validation_flows.response_count trigger only fires on UPDATE, not INSERT.
-- Sessions inserted directly as completed never incremented the count.

-- 1. Update trigger function to handle both INSERT and UPDATE
CREATE OR REPLACE FUNCTION update_validation_flow_response_count()
RETURNS TRIGGER AS $$
BEGIN
  -- On INSERT: increment if the new row is already completed
  IF TG_OP = 'INSERT' AND NEW.is_completed = true THEN
    UPDATE validation_flows
    SET response_count = response_count + 1,
        updated_at = NOW()
    WHERE id = NEW.flow_id;
  -- On UPDATE: increment only when is_completed changes from false/null to true
  ELSIF TG_OP = 'UPDATE' AND NEW.is_completed = true AND (OLD.is_completed IS NULL OR OLD.is_completed = false) THEN
    UPDATE validation_flows
    SET response_count = response_count + 1,
        updated_at = NOW()
    WHERE id = NEW.flow_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = 'public';

-- 2. Recreate trigger to fire on both INSERT and UPDATE
DROP TRIGGER IF EXISTS trigger_update_response_count ON validation_sessions;
CREATE TRIGGER trigger_update_response_count
  AFTER INSERT OR UPDATE ON validation_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_validation_flow_response_count();

-- 3. Recalculate all response_counts from actual data
UPDATE validation_flows vf
SET response_count = (
  SELECT COUNT(*)
  FROM validation_sessions vs
  WHERE vs.flow_id = vf.id
    AND vs.is_completed = true
);
