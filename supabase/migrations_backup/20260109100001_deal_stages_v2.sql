-- Deal Stages V2: Hormozi-style pipeline with velocity tracking
-- Adds: qualified, booked, showed, pitched, follow_up stages
-- Adds: stage_history for velocity tracking
-- Adds: follow-up tracking fields

-- ============================================
-- DROP OLD CONSTRAINT FIRST
-- ============================================

ALTER TABLE sales_deals DROP CONSTRAINT IF EXISTS sales_deals_status_check;

-- ============================================
-- MIGRATE EXISTING DATA TO NEW STAGES
-- discovery → qualified, proposal → pitched
-- ============================================

UPDATE sales_deals SET status = 'qualified' WHERE status = 'discovery';
UPDATE sales_deals SET status = 'pitched' WHERE status = 'proposal';

-- ============================================
-- ADD NEW CONSTRAINT WITH EXPANDED STAGES
-- New stages: lead → qualified → booked → showed → pitched → follow_up → won/lost
-- ============================================

ALTER TABLE sales_deals ADD CONSTRAINT sales_deals_status_check
  CHECK (status IN ('lead', 'qualified', 'booked', 'showed', 'pitched', 'follow_up', 'won', 'lost'));

-- ============================================
-- ADD STAGE HISTORY FOR VELOCITY TRACKING
-- Records when deal entered each stage
-- Format: [{ "stage": "lead", "entered_at": "2026-01-09T10:00:00Z" }, ...]
-- ============================================

ALTER TABLE sales_deals
ADD COLUMN IF NOT EXISTS stage_history JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN sales_deals.stage_history IS 'Array of {stage, entered_at} objects for velocity tracking';

-- ============================================
-- ADD FOLLOW-UP TRACKING FIELDS
-- Enables "here''s what to do today" recommendations
-- ============================================

-- When was last outreach to this contact?
ALTER TABLE sales_deals
ADD COLUMN IF NOT EXISTS last_contact_date DATE;

COMMENT ON COLUMN sales_deals.last_contact_date IS 'Date of last outreach (call, email, text)';

-- When should we follow up?
ALTER TABLE sales_deals
ADD COLUMN IF NOT EXISTS next_follow_up_date DATE;

COMMENT ON COLUMN sales_deals.next_follow_up_date IS 'Scheduled or AI-suggested follow-up date';

-- How many times have we reached out?
ALTER TABLE sales_deals
ADD COLUMN IF NOT EXISTS contact_count INTEGER DEFAULT 0;

COMMENT ON COLUMN sales_deals.contact_count IS 'Number of contact attempts made';

-- ============================================
-- ADD MEETING TRACKING (for booked/showed stages)
-- ============================================

-- When is the meeting scheduled?
ALTER TABLE sales_deals
ADD COLUMN IF NOT EXISTS meeting_scheduled_at TIMESTAMPTZ;

COMMENT ON COLUMN sales_deals.meeting_scheduled_at IS 'Date/time of scheduled meeting (for booked stage)';

-- Did they show up?
ALTER TABLE sales_deals
ADD COLUMN IF NOT EXISTS meeting_showed BOOLEAN;

COMMENT ON COLUMN sales_deals.meeting_showed IS 'Whether contact attended scheduled meeting';

-- ============================================
-- INDEX FOR FOLLOW-UP QUERIES
-- "Show me deals with follow-ups due today"
-- ============================================

CREATE INDEX IF NOT EXISTS idx_sales_deals_next_follow_up
ON sales_deals(user_id, next_follow_up_date)
WHERE next_follow_up_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sales_deals_meeting_scheduled
ON sales_deals(user_id, meeting_scheduled_at)
WHERE meeting_scheduled_at IS NOT NULL;

-- ============================================
-- FUNCTION: Initialize stage history for new deals
-- Automatically adds initial stage entry on insert
-- ============================================

CREATE OR REPLACE FUNCTION initialize_deal_stage_history()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set if stage_history is empty/default
  IF NEW.stage_history = '[]'::jsonb OR NEW.stage_history IS NULL THEN
    NEW.stage_history = jsonb_build_array(
      jsonb_build_object(
        'stage', NEW.status,
        'entered_at', NOW()
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for new deals
DROP TRIGGER IF EXISTS deal_stage_history_init ON sales_deals;
CREATE TRIGGER deal_stage_history_init
  BEFORE INSERT ON sales_deals
  FOR EACH ROW
  EXECUTE FUNCTION initialize_deal_stage_history();

-- ============================================
-- FUNCTION: Track stage changes
-- Appends to stage_history when status changes
-- ============================================

CREATE OR REPLACE FUNCTION track_deal_stage_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only track if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.stage_history = COALESCE(OLD.stage_history, '[]'::jsonb) ||
      jsonb_build_array(
        jsonb_build_object(
          'stage', NEW.status,
          'entered_at', NOW()
        )
      );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for stage changes
DROP TRIGGER IF EXISTS deal_stage_change_tracker ON sales_deals;
CREATE TRIGGER deal_stage_change_tracker
  BEFORE UPDATE ON sales_deals
  FOR EACH ROW
  EXECUTE FUNCTION track_deal_stage_change();

-- ============================================
-- BACKFILL: Initialize stage_history for existing deals
-- Sets current stage with created_at timestamp
-- ============================================

UPDATE sales_deals
SET stage_history = jsonb_build_array(
  jsonb_build_object(
    'stage', status,
    'entered_at', created_at
  )
)
WHERE stage_history = '[]'::jsonb OR stage_history IS NULL;
