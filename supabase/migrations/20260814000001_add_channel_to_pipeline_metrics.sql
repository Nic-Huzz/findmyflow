-- Add channel column to pipeline_metrics for sub-tagging attraction methods
-- e.g. cold → posters/flyers/dms, content → instagram/tiktok, etc.
ALTER TABLE pipeline_metrics ADD COLUMN IF NOT EXISTS channel text;
