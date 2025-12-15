-- ============================================================================
-- Add calibration score fields to nervous_system_responses
-- Description: Adds fields to store the 0-100K calibrated safety edges
-- ============================================================================

ALTER TABLE nervous_system_responses
ADD COLUMN IF NOT EXISTS being_seen_edge INTEGER,  -- calibrated 0-100K score for visibility
ADD COLUMN IF NOT EXISTS earning_edge INTEGER;      -- calibrated 0-500K score for earning

-- Add comments for documentation
COMMENT ON COLUMN nervous_system_responses.being_seen_edge IS 'Calibrated safety edge for being seen (0-100,000 people)';
COMMENT ON COLUMN nervous_system_responses.earning_edge IS 'Calibrated safety edge for earning (0-$500,000 per year)';
