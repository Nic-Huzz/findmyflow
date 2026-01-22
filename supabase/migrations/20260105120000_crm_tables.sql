-- CRM Tower Tables: Marketing Tasks, Sales Deals, User Stats
-- Ported from MonetiseYourMission Command Center

-- ============================================
-- MARKETING TASKS TABLE
-- Weekly marketing quests with engagement tracking
-- ============================================
CREATE TABLE IF NOT EXISTS marketing_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES user_projects(id) ON DELETE SET NULL,

  -- Task details
  date DATE NOT NULL,
  day_of_week TEXT NOT NULL,
  task_type TEXT NOT NULL,
  platform TEXT NOT NULL,
  content_type TEXT NOT NULL,
  points_value INTEGER DEFAULT 0,

  -- Status
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Engagement metrics (captured from screenshots)
  engagement_likes INTEGER DEFAULT 0,
  engagement_comments INTEGER DEFAULT 0,
  engagement_shares INTEGER DEFAULT 0,
  engagement_dms INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for marketing_tasks
CREATE INDEX IF NOT EXISTS idx_marketing_tasks_user_id ON marketing_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_marketing_tasks_date ON marketing_tasks(date);
CREATE INDEX IF NOT EXISTS idx_marketing_tasks_user_date ON marketing_tasks(user_id, date);

-- RLS for marketing_tasks
ALTER TABLE marketing_tasks ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
CREATE POLICY "Users can view own marketing tasks"
  ON marketing_tasks FOR SELECT
  USING (auth.uid() = user_id);

DO $$ BEGIN
CREATE POLICY "Users can insert own marketing tasks"
  ON marketing_tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DO $$ BEGIN
CREATE POLICY "Users can update own marketing tasks"
  ON marketing_tasks FOR UPDATE
  USING (auth.uid() = user_id);

DO $$ BEGIN
CREATE POLICY "Users can delete own marketing tasks"
  ON marketing_tasks FOR DELETE
  USING (auth.uid() = user_id);


-- ============================================
-- SALES DEALS TABLE
-- CRM pipeline with Kanban stages
-- ============================================
CREATE TABLE IF NOT EXISTS sales_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES user_projects(id) ON DELETE SET NULL,

  -- Contact info
  contact_name TEXT NOT NULL,
  contact_email TEXT,

  -- Deal details
  source TEXT DEFAULT 'Manual',
  product_type TEXT NOT NULL,
  value INTEGER NOT NULL DEFAULT 0,

  -- Pipeline status
  status TEXT DEFAULT 'lead' CHECK (status IN ('lead', 'discovery', 'proposal', 'won', 'lost')),
  probability INTEGER DEFAULT 30,

  -- Dates
  expected_close_date DATE,
  actual_close_date DATE,

  -- Notes and context
  notes TEXT,
  conversation_screenshot_url TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for sales_deals
CREATE INDEX IF NOT EXISTS idx_sales_deals_user_id ON sales_deals(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_deals_status ON sales_deals(status);
CREATE INDEX IF NOT EXISTS idx_sales_deals_user_status ON sales_deals(user_id, status);

-- RLS for sales_deals
ALTER TABLE sales_deals ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
CREATE POLICY "Users can view own sales deals"
  ON sales_deals FOR SELECT
  USING (auth.uid() = user_id);

DO $$ BEGIN
CREATE POLICY "Users can insert own sales deals"
  ON sales_deals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DO $$ BEGIN
CREATE POLICY "Users can update own sales deals"
  ON sales_deals FOR UPDATE
  USING (auth.uid() = user_id);

DO $$ BEGIN
CREATE POLICY "Users can delete own sales deals"
  ON sales_deals FOR DELETE
  USING (auth.uid() = user_id);


-- ============================================
-- USER CRM STATS TABLE
-- Points, streaks, and gamification data
-- ============================================
CREATE TABLE IF NOT EXISTS user_crm_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,

  -- Points
  total_points INTEGER DEFAULT 0,

  -- Streaks
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,

  -- Revenue goals
  monthly_revenue_goal INTEGER DEFAULT 5000,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for user_crm_stats
ALTER TABLE user_crm_stats ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
CREATE POLICY "Users can view own CRM stats"
  ON user_crm_stats FOR SELECT
  USING (auth.uid() = user_id);

DO $$ BEGIN
CREATE POLICY "Users can insert own CRM stats"
  ON user_crm_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DO $$ BEGIN
CREATE POLICY "Users can update own CRM stats"
  ON user_crm_stats FOR UPDATE
  USING (auth.uid() = user_id);


-- ============================================
-- HELPER FUNCTION: Ensure user stats exist
-- ============================================
CREATE OR REPLACE FUNCTION ensure_user_crm_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_crm_stats (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create stats when user is created
DROP TRIGGER IF EXISTS create_user_crm_stats_trigger ON auth.users;
CREATE TRIGGER create_user_crm_stats_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION ensure_user_crm_stats();
