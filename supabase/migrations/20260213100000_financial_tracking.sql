-- Financial Tracking: Expenses, P&L View, Contact Journeys, Hours Tracking
-- Shipped Feb 13 2026

-- ============================================
-- ESTIMATED HOURS ON EXECUTE TASKS
-- ============================================
ALTER TABLE execute_tasks ADD COLUMN IF NOT EXISTS estimated_hours NUMERIC DEFAULT 0;

-- ============================================
-- PROJECT EXPENSES TABLE
-- Track costs by project with monthly views
-- ============================================
CREATE TABLE IF NOT EXISTS project_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES user_projects(id) ON DELETE CASCADE NOT NULL,
  expense_type TEXT NOT NULL,
  category TEXT,
  description TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  month DATE NOT NULL,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns if table already exists without them
ALTER TABLE project_expenses ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE project_expenses ADD COLUMN IF NOT EXISTS description TEXT;

CREATE INDEX IF NOT EXISTS idx_project_expenses_user ON project_expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_project_expenses_project_month ON project_expenses(project_id, month);

ALTER TABLE project_expenses ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can manage own expenses" ON project_expenses
    FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- CONTACT JOURNEYS TABLE
-- Track cross-project contact movement
-- ============================================
CREATE TABLE IF NOT EXISTS contact_journeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID NOT NULL,
  from_project_id UUID REFERENCES user_projects(id) ON DELETE SET NULL,
  to_project_id UUID REFERENCES user_projects(id) ON DELETE CASCADE NOT NULL,
  journey_type TEXT NOT NULL,
  converted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_journeys_user ON contact_journeys(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_journeys_contact ON contact_journeys(contact_id);

ALTER TABLE contact_journeys ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can manage own journeys" ON contact_journeys
    FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- PROJECT MONTHLY P&L VIEW
-- Aggregates revenue (won deals), expenses, and hours per project per month
-- ============================================
CREATE OR REPLACE VIEW project_monthly_pnl AS
SELECT
  p.user_id,
  p.id AS project_id,
  p.name AS project_name,
  months.month,
  COALESCE(rev.revenue, 0) AS revenue,
  COALESCE(rev.deals_won, 0) AS deals_won,
  COALESCE(exp.total_expenses, 0) AS total_expenses,
  COALESCE(exp.cogs, 0) AS cogs,
  COALESCE(exp.marketing, 0) AS marketing,
  COALESCE(exp.hosting, 0) AS hosting,
  COALESCE(exp.other_expenses, 0) AS other_expenses,
  COALESCE(rev.revenue, 0)::numeric - COALESCE(exp.total_expenses, 0) AS profit,
  CASE
    WHEN COALESCE(rev.revenue, 0) > 0
    THEN round((COALESCE(rev.revenue, 0)::numeric - COALESCE(exp.total_expenses, 0)) / COALESCE(rev.revenue, 0)::numeric * 100, 1)
    ELSE 0
  END AS margin_pct,
  COALESCE(hrs.total_hours, 0) AS total_hours,
  CASE
    WHEN COALESCE(hrs.total_hours, 0) > 0
    THEN round((COALESCE(rev.revenue, 0)::numeric - COALESCE(exp.total_expenses, 0)) / hrs.total_hours, 2)
    ELSE 0
  END AS profit_per_hour
FROM user_projects p
CROSS JOIN (
  SELECT DISTINCT date_trunc('month', scheduled_date::timestamptz)::date AS month
  FROM execute_tasks WHERE scheduled_date IS NOT NULL
  UNION
  SELECT DISTINCT month FROM project_expenses
  UNION
  SELECT date_trunc('month', CURRENT_DATE)::date
) months
LEFT JOIN (
  SELECT project_id, date_trunc('month', created_at)::date AS month,
    sum(value) AS revenue, count(*) AS deals_won
  FROM sales_deals
  WHERE status = 'won' AND value > 0
  GROUP BY project_id, date_trunc('month', created_at)::date
) rev ON rev.project_id = p.id AND rev.month = months.month
LEFT JOIN (
  SELECT project_id, month,
    sum(amount) AS total_expenses,
    sum(amount) FILTER (WHERE expense_type = 'cogs') AS cogs,
    sum(amount) FILTER (WHERE expense_type = 'marketing') AS marketing,
    sum(amount) FILTER (WHERE expense_type = 'hosting') AS hosting,
    sum(amount) FILTER (WHERE expense_type NOT IN ('cogs', 'marketing', 'hosting')) AS other_expenses
  FROM project_expenses
  GROUP BY project_id, month
) exp ON exp.project_id = p.id AND exp.month = months.month
LEFT JOIN (
  SELECT project_id, date_trunc('month', scheduled_date::timestamptz)::date AS month,
    sum(estimated_hours) AS total_hours
  FROM execute_tasks
  WHERE completed = true AND estimated_hours > 0
  GROUP BY project_id, date_trunc('month', scheduled_date::timestamptz)::date
) hrs ON hrs.project_id = p.id AND hrs.month = months.month;
