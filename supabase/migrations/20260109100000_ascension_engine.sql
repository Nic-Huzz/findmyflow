-- Ascension Engine & Retention Tracking
-- Tracks customer journeys through value ladder and continuity health

-- Customer ascension tracking (one record per unique customer)
CREATE TABLE IF NOT EXISTS customer_ascensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES user_projects(id) ON DELETE SET NULL,

  -- Customer identification (linked to first deal)
  first_deal_id UUID REFERENCES sales_deals(id) ON DELETE SET NULL,
  customer_email TEXT,
  customer_name TEXT NOT NULL,

  -- Current position on value ladder
  current_rung TEXT NOT NULL DEFAULT 'lead',  -- 'lead', 'attraction', 'core', 'upsell', 'downsell', 'continuity'

  -- Lifetime metrics
  lifetime_value DECIMAL(10,2) DEFAULT 0,
  total_purchases INTEGER DEFAULT 0,

  -- Ascension history (array of movements)
  -- [{rung, date, deal_id, value, offer_type}]
  ascension_history JSONB DEFAULT '[]',

  -- Timestamps
  first_purchase_at TIMESTAMPTZ,
  last_purchase_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique customer per user (by email or name if no email)
  UNIQUE(user_id, customer_email)
);

-- Ascension triggers (configurable per user)
CREATE TABLE IF NOT EXISTS ascension_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES user_projects(id) ON DELETE SET NULL,

  -- Trigger definition
  trigger_name TEXT NOT NULL,
  from_rung TEXT NOT NULL,  -- 'core', 'upsell_declined', etc.
  to_rung TEXT NOT NULL,    -- 'upsell', 'downsell', 'continuity'

  -- Timing
  trigger_timing TEXT NOT NULL DEFAULT 'immediate',  -- 'immediate', 'days_after'
  days_after INTEGER DEFAULT 0,

  -- Task template
  task_title TEXT NOT NULL,
  task_description TEXT,

  -- Status
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ascension tasks (auto-created tasks that appear in Daily Priorities)
CREATE TABLE IF NOT EXISTS ascension_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES user_projects(id) ON DELETE SET NULL,

  -- Link to customer and trigger
  customer_ascension_id UUID REFERENCES customer_ascensions(id) ON DELETE CASCADE,
  trigger_id UUID REFERENCES ascension_triggers(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES sales_deals(id) ON DELETE SET NULL,

  -- Task details
  task_type TEXT NOT NULL,  -- 'upsell', 'downsell', 'continuity', 'winback'
  title TEXT NOT NULL,
  description TEXT,
  customer_name TEXT NOT NULL,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending',  -- 'pending', 'completed', 'dismissed'
  due_date DATE,
  completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add continuity/retention fields to sales_deals
ALTER TABLE sales_deals ADD COLUMN IF NOT EXISTS is_continuity BOOLEAN DEFAULT false;
ALTER TABLE sales_deals ADD COLUMN IF NOT EXISTS continuity_status TEXT;  -- 'active', 'at_risk', 'churned', 'paused'
ALTER TABLE sales_deals ADD COLUMN IF NOT EXISTS continuity_start_date TIMESTAMPTZ;
ALTER TABLE sales_deals ADD COLUMN IF NOT EXISTS continuity_end_date TIMESTAMPTZ;
ALTER TABLE sales_deals ADD COLUMN IF NOT EXISTS monthly_value DECIMAL(10,2);
ALTER TABLE sales_deals ADD COLUMN IF NOT EXISTS churn_reason TEXT;
ALTER TABLE sales_deals ADD COLUMN IF NOT EXISTS churn_date TIMESTAMPTZ;

-- Add offer_category to link deals to Money Model types
ALTER TABLE sales_deals ADD COLUMN IF NOT EXISTS offer_category TEXT;  -- 'attraction', 'upsell', 'downsell', 'continuity'
ALTER TABLE sales_deals ADD COLUMN IF NOT EXISTS offer_type TEXT;  -- specific offer type from Money Model

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_customer_ascensions_user ON customer_ascensions(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_ascensions_rung ON customer_ascensions(user_id, current_rung);
CREATE INDEX IF NOT EXISTS idx_ascension_tasks_user_status ON ascension_tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_ascension_tasks_due ON ascension_tasks(user_id, due_date) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_deals_continuity ON sales_deals(user_id, is_continuity, continuity_status);

-- Insert default ascension triggers for new users (via function)
CREATE OR REPLACE FUNCTION create_default_ascension_triggers(p_user_id UUID, p_project_id UUID DEFAULT NULL)
RETURNS void AS $$
BEGIN
  -- Core → Upsell (immediate)
  INSERT INTO ascension_triggers (user_id, project_id, trigger_name, from_rung, to_rung, trigger_timing, days_after, task_title, task_description)
  VALUES (p_user_id, p_project_id, 'Core to Upsell', 'core', 'upsell', 'immediate', 0,
          'Offer upsell to {customer_name}', 'Customer just purchased core offer. Strike while hot with upsell.');

  -- Upsell Declined → Downsell (immediate)
  INSERT INTO ascension_triggers (user_id, project_id, trigger_name, from_rung, to_rung, trigger_timing, days_after, task_title, task_description)
  VALUES (p_user_id, p_project_id, 'Upsell Declined to Downsell', 'upsell_declined', 'downsell', 'immediate', 0,
          'Offer downsell to {customer_name}', 'Customer declined upsell. Offer payment plan or lighter option.');

  -- Core → Continuity (14 days)
  INSERT INTO ascension_triggers (user_id, project_id, trigger_name, from_rung, to_rung, trigger_timing, days_after, task_title, task_description)
  VALUES (p_user_id, p_project_id, 'Core to Continuity', 'core', 'continuity', 'days_after', 14,
          'Pitch continuity to {customer_name}', 'Customer has had 2 weeks with core offer. Time to pitch ongoing support.');

  -- Churned → Win-back (30 days)
  INSERT INTO ascension_triggers (user_id, project_id, trigger_name, from_rung, to_rung, trigger_timing, days_after, task_title, task_description)
  VALUES (p_user_id, p_project_id, 'Win-back Attempt 1', 'churned', 'winback', 'days_after', 30,
          'Win-back: {customer_name}', 'Customer churned 30 days ago. Reach out with special offer.');

  -- Churned → Win-back (60 days)
  INSERT INTO ascension_triggers (user_id, project_id, trigger_name, from_rung, to_rung, trigger_timing, days_after, task_title, task_description)
  VALUES (p_user_id, p_project_id, 'Win-back Attempt 2', 'churned', 'winback', 'days_after', 60,
          'Final win-back: {customer_name}', 'Customer churned 60 days ago. Last attempt with best offer.');
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE customer_ascensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ascension_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ascension_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own customer_ascensions"
  ON customer_ascensions FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own ascension_triggers"
  ON ascension_triggers FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own ascension_tasks"
  ON ascension_tasks FOR ALL
  USING (auth.uid() = user_id);
