-- Add unified queue columns to content_history
-- These enable the unified approval queue for batch + autopilot content

-- Source column - where the content came from
ALTER TABLE content_history
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'single';

COMMENT ON COLUMN content_history.source IS 'Content source: single, batch, autopilot, imported';

-- Review status column - for approval workflow
ALTER TABLE content_history
  ADD COLUMN IF NOT EXISTS review_status TEXT DEFAULT 'approved';

COMMENT ON COLUMN content_history.review_status IS 'Review status: pending, approved, rejected, needs_edit';

-- Reviewer notes - feedback on content
ALTER TABLE content_history
  ADD COLUMN IF NOT EXISTS reviewer_notes TEXT;

-- Regeneration count - track how many times content was regenerated
ALTER TABLE content_history
  ADD COLUMN IF NOT EXISTS regeneration_count INTEGER DEFAULT 0;

-- Index for queue queries (fetch pending content efficiently)
CREATE INDEX IF NOT EXISTS idx_content_history_review_queue
  ON content_history(user_id, review_status, created_at DESC)
  WHERE review_status IN ('pending', 'needs_edit');

-- Index for source filtering
CREATE INDEX IF NOT EXISTS idx_content_history_source
  ON content_history(user_id, source);
