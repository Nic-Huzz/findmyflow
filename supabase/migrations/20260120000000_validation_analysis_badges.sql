-- =============================================
-- VALIDATION ANALYSIS - BADGES & MULTIPLE ANALYSES SUPPORT
-- Adds sentiment badges and analysis versioning
-- =============================================

-- Add analysis_number to track version (1st analysis, 2nd, etc.)
ALTER TABLE validation_analysis
ADD COLUMN IF NOT EXISTS analysis_number INTEGER DEFAULT 1;

-- Add response_snapshot to know how many responses existed at time of analysis
ALTER TABLE validation_analysis
ADD COLUMN IF NOT EXISTS response_snapshot JSONB;
-- Format: { flow_id: count, flow_id: count, ... }

-- Note: The existing JSONB columns (key_insights, pain_points, etc.) will now store
-- objects with badges instead of plain strings:
-- OLD: ["insight 1", "insight 2"]
-- NEW: [{ "text": "insight 1", "badge": "opportunity" }, { "text": "insight 2", "badge": "pattern" }]
--
-- Badge types:
-- - "opportunity" (🎯): High-value action item - take action on this
-- - "gold" (✨): Steal this language/insight for copy
-- - "pattern" (📊): Validated by multiple respondents
-- - null: No special badge

-- Update comments
COMMENT ON COLUMN validation_analysis.analysis_number IS 'Version number of analysis (1 = first, 2 = re-analysis after more responses, etc.)';
COMMENT ON COLUMN validation_analysis.response_snapshot IS 'Snapshot of response counts per flow at time of analysis';
COMMENT ON COLUMN validation_analysis.key_insights IS 'Top insights with badges: [{ text, badge, frequency? }]';
COMMENT ON COLUMN validation_analysis.pain_points IS 'Pain points with badges: [{ text, badge, frequency?, intensity? }]';
COMMENT ON COLUMN validation_analysis.dream_outcomes IS 'Dream outcomes with badges: [{ text, badge, frequency? }]';
COMMENT ON COLUMN validation_analysis.objections IS 'Objections with badges: [{ text, badge, frequency? }]';
COMMENT ON COLUMN validation_analysis.language_patterns IS 'Language patterns with badges: [{ text, badge }]';
