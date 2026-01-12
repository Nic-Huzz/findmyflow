-- =============================================
-- TIER 4: AUTONOMOUS SYSTEM DATA TABLES
-- Captures the missing 18% data for full AI autonomy
-- =============================================

-- Business Context Profile
CREATE TABLE IF NOT EXISTS business_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,

  -- Revenue
  current_monthly_revenue DECIMAL(10,2),
  target_monthly_revenue DECIMAL(10,2),
  revenue_model TEXT, -- 'one_time', 'subscription', 'hybrid'

  -- Capacity
  hours_per_week INTEGER,
  team_size INTEGER DEFAULT 1,
  max_clients INTEGER,
  current_clients INTEGER DEFAULT 0,

  -- Financials
  marketing_budget_monthly DECIMAL(10,2),
  gross_margin_percent INTEGER, -- 0-100
  cost_to_deliver DECIMAL(10,2), -- Cost to deliver core offer

  -- Market
  industry TEXT,
  years_in_business INTEGER,

  -- Completion tracking
  setup_completed BOOLEAN DEFAULT false,
  setup_completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Competitor Analysis
CREATE TABLE IF NOT EXISTS competitor_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  competitor_name TEXT NOT NULL,
  competitor_url TEXT,
  their_pricing JSONB, -- {low: X, mid: Y, high: Z}
  their_positioning TEXT,
  their_strengths TEXT[],
  their_weaknesses TEXT[],
  your_advantage TEXT,
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customer Segments
CREATE TABLE IF NOT EXISTS customer_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  segment_name TEXT NOT NULL,
  segment_type TEXT NOT NULL, -- 'best', 'average', 'worst'
  description TEXT,

  -- Economics
  revenue_percent INTEGER, -- % of revenue from this segment
  profitability_rating INTEGER CHECK (profitability_rating >= 1 AND profitability_rating <= 10),
  ease_of_work_rating INTEGER CHECK (ease_of_work_rating >= 1 AND ease_of_work_rating <= 10),

  -- Behavior
  buying_trigger TEXT,
  common_objections TEXT[],
  avg_ltv DECIMAL(10,2),
  churn_rate DECIMAL(5,2),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Funnel Metrics (Actual, not benchmarks)
CREATE TABLE IF NOT EXISTS funnel_actuals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES user_projects(id) ON DELETE CASCADE,

  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Funnel stages
  reach INTEGER DEFAULT 0,
  engagements INTEGER DEFAULT 0,
  leads INTEGER DEFAULT 0,
  qualified_leads INTEGER DEFAULT 0,
  proposals INTEGER DEFAULT 0,
  sales INTEGER DEFAULT 0,

  -- Revenue
  total_revenue DECIMAL(10,2),
  avg_sale_value DECIMAL(10,2),

  -- Source (optional)
  source TEXT, -- 'organic', 'paid', 'referral', 'all'

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Win/Loss Analysis
CREATE TABLE IF NOT EXISTS deal_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,

  outcome TEXT NOT NULL, -- 'won', 'lost'
  primary_reason TEXT,
  secondary_reasons TEXT[],
  competitor_mentioned TEXT,
  price_factor BOOLEAN DEFAULT false,
  timing_factor BOOLEAN DEFAULT false,
  fit_factor BOOLEAN DEFAULT false,
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- A/B Test Results
CREATE TABLE IF NOT EXISTS ab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES user_projects(id) ON DELETE CASCADE,

  test_name TEXT NOT NULL,
  test_type TEXT, -- 'headline', 'price', 'offer', 'email', 'ad', 'page'

  variant_a JSONB,
  variant_b JSONB,
  winner TEXT, -- 'a', 'b', 'inconclusive', null (still running)

  metric_tracked TEXT,
  variant_a_result DECIMAL(10,4),
  variant_b_result DECIMAL(10,4),
  sample_size INTEGER,
  confidence_level DECIMAL(5,2),

  learnings TEXT,
  status TEXT DEFAULT 'running', -- 'running', 'completed', 'cancelled'

  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Track autonomous setup progress
CREATE TABLE IF NOT EXISTS autonomous_setup_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,

  -- Flow completion status
  business_baseline_completed BOOLEAN DEFAULT false,
  business_baseline_completed_at TIMESTAMPTZ,

  customer_segments_completed BOOLEAN DEFAULT false,
  customer_segments_completed_at TIMESTAMPTZ,

  competitor_snapshot_completed BOOLEAN DEFAULT false,
  competitor_snapshot_completed_at TIMESTAMPTZ,

  -- Overall progress
  data_readiness_percent INTEGER DEFAULT 70, -- Starts at 70%
  all_flows_completed BOOLEAN DEFAULT false,
  all_flows_completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_business_profiles_user ON business_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_competitor_analysis_user ON competitor_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_segments_user ON customer_segments(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_segments_type ON customer_segments(segment_type);
CREATE INDEX IF NOT EXISTS idx_funnel_actuals_user ON funnel_actuals(user_id);
CREATE INDEX IF NOT EXISTS idx_funnel_actuals_period ON funnel_actuals(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_deal_outcomes_user ON deal_outcomes(user_id);
CREATE INDEX IF NOT EXISTS idx_deal_outcomes_outcome ON deal_outcomes(outcome);
CREATE INDEX IF NOT EXISTS idx_ab_tests_user ON ab_tests(user_id);
CREATE INDEX IF NOT EXISTS idx_ab_tests_status ON ab_tests(status);
CREATE INDEX IF NOT EXISTS idx_autonomous_setup_user ON autonomous_setup_progress(user_id);

-- RLS Policies
ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE funnel_actuals ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE autonomous_setup_progress ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can manage their own business profile"
  ON business_profiles FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own competitor analysis"
  ON competitor_analysis FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own customer segments"
  ON customer_segments FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own funnel actuals"
  ON funnel_actuals FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own deal outcomes"
  ON deal_outcomes FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own ab tests"
  ON ab_tests FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own setup progress"
  ON autonomous_setup_progress FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON business_profiles TO authenticated;
GRANT ALL ON competitor_analysis TO authenticated;
GRANT ALL ON customer_segments TO authenticated;
GRANT ALL ON funnel_actuals TO authenticated;
GRANT ALL ON deal_outcomes TO authenticated;
GRANT ALL ON ab_tests TO authenticated;
GRANT ALL ON autonomous_setup_progress TO authenticated;

-- Comments
COMMENT ON TABLE business_profiles IS 'Core business context for AI autonomy - revenue, capacity, margins';
COMMENT ON TABLE competitor_analysis IS 'Competitor intelligence for positioning and pricing';
COMMENT ON TABLE customer_segments IS 'Customer segment definitions for targeted messaging';
COMMENT ON TABLE funnel_actuals IS 'Real funnel conversion rates (replaces benchmarks)';
COMMENT ON TABLE deal_outcomes IS 'Win/loss analysis for sales coaching';
COMMENT ON TABLE ab_tests IS 'A/B test results for optimization learning';
COMMENT ON TABLE autonomous_setup_progress IS 'Tracks completion of autonomy setup flows';
