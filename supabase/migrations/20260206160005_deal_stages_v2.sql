-- Deal Stages V2: Hormozi-style pipeline with velocity tracking
-- Adds: qualified, booked, showed, pitched, follow_up, delivering, completed stages
-- Adds: stage_history for velocity tracking
-- Adds: follow-up tracking fields

-- Drop old constraint
ALTER TABLE sales_deals DROP CONSTRAINT IF EXISTS sales_deals_status_check;

-- Migrate existing data to new stages
UPDATE sales_deals SET status = 'qualified' WHERE status = 'discovery';
UPDATE sales_deals SET status = 'pitched' WHERE status = 'proposal';

-- Add new constraint with ALL stages (including delivering + completed)
ALTER TABLE sales_deals ADD CONSTRAINT sales_deals_status_check
  CHECK (status IN ('lead', 'qualified', 'booked', 'showed', 'pitched', 'follow_up', 'won', 'delivering', 'completed', 'lost'));

-- Stage history for velocity tracking
ALTER TABLE sales_deals
ADD COLUMN IF NOT EXISTS stage_history JSONB DEFAULT '[]'::jsonb;

-- Follow-up tracking fields
ALTER TABLE sales_deals
ADD COLUMN IF NOT EXISTS last_contact_date DATE;

ALTER TABLE sales_deals
ADD COLUMN IF NOT EXISTS next_follow_up_date DATE;

ALTER TABLE sales_deals
ADD COLUMN IF NOT EXISTS contact_count INTEGER DEFAULT 0;

-- Meeting tracking (for booked/showed stages)
ALTER TABLE sales_deals
ADD COLUMN IF NOT EXISTS meeting_scheduled_at TIMESTAMPTZ;

ALTER TABLE sales_deals
ADD COLUMN IF NOT EXISTS meeting_showed BOOLEAN;

-- Indexes for follow-up queries
CREATE INDEX IF NOT EXISTS idx_sales_deals_next_follow_up
ON sales_deals(user_id, next_follow_up_date)
WHERE next_follow_up_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sales_deals_meeting_scheduled
ON sales_deals(user_id, meeting_scheduled_at)
WHERE meeting_scheduled_at IS NOT NULL;

-- Function: Initialize stage history for new deals
CREATE OR REPLACE FUNCTION initialize_deal_stage_history()
RETURNS TRIGGER AS $$
BEGIN
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

DROP TRIGGER IF EXISTS deal_stage_history_init ON sales_deals;
CREATE TRIGGER deal_stage_history_init
  BEFORE INSERT ON sales_deals
  FOR EACH ROW
  EXECUTE FUNCTION initialize_deal_stage_history();

-- Function: Track stage changes
CREATE OR REPLACE FUNCTION track_deal_stage_change()
RETURNS TRIGGER AS $$
BEGIN
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

DROP TRIGGER IF EXISTS deal_stage_change_tracker ON sales_deals;
CREATE TRIGGER deal_stage_change_tracker
  BEFORE UPDATE ON sales_deals
  FOR EACH ROW
  EXECUTE FUNCTION track_deal_stage_change();

-- Backfill: Initialize stage_history for existing deals
UPDATE sales_deals
SET stage_history = jsonb_build_array(
  jsonb_build_object(
    'stage', status,
    'entered_at', created_at
  )
)
WHERE stage_history = '[]'::jsonb OR stage_history IS NULL;
