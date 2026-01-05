-- =============================================
-- FLOW ACADEMY V1 - DATABASE FOUNDATION
-- Unified CRM + $100M Offer Builder Integration
-- Created: January 5, 2026
-- =============================================

-- ============================================
-- TABLE 1: offer_creations
-- Enhanced 8-step $100M Offer Builder
-- ============================================
CREATE TABLE IF NOT EXISTS offer_creations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES user_projects(id) ON DELETE SET NULL,

  -- Step 1A: Bucket Selection
  dream_outcome_bucket VARCHAR(20) CHECK (dream_outcome_bucket IN ('wealth', 'health', 'relationships')),
  bucket_confidence DECIMAL(3,2),
  bucket_reasoning TEXT,

  -- Step 1B: Dream Outcome
  dream_outcome TEXT,
  dream_outcome_score INTEGER CHECK (dream_outcome_score BETWEEN 1 AND 50),
  validation_uses_customer_language BOOLEAN DEFAULT false,
  validation_addresses_pain BOOLEAN DEFAULT false,
  validation_matches_desired_outcome BOOLEAN DEFAULT false,

  -- Step 2: All 3 Versions Generated
  version_product JSONB,  -- { deliverables, investment, pros_cons, price, revenue_projections }
  version_service JSONB,
  version_hybrid JSONB,

  -- Steps 3-5: Proof, Speed, Ease (for ALL 3 versions)
  -- Proof elements (shared across versions)
  proof_personal_transformation TEXT,
  proof_case_studies TEXT,
  proof_credentials TEXT,
  proof_methodology TEXT,
  proof_testimonials TEXT,
  proof_data_results TEXT,

  -- Proof analysis per version
  proof_analysis_product JSONB,
  proof_analysis_service JSONB,
  proof_analysis_hybrid JSONB,
  proof_score_product INTEGER CHECK (proof_score_product BETWEEN 1 AND 10),
  proof_score_service INTEGER CHECK (proof_score_service BETWEEN 1 AND 10),
  proof_score_hybrid INTEGER CHECK (proof_score_hybrid BETWEEN 1 AND 10),

  -- Speed (time delay)
  traditional_time TEXT,  -- "6 months", "1 year", etc.
  your_time TEXT,         -- "6 weeks", "30 days", etc.
  speed_analysis_product JSONB,
  speed_analysis_service JSONB,
  speed_analysis_hybrid JSONB,
  time_delay_score_product INTEGER CHECK (time_delay_score_product BETWEEN 1 AND 10),
  time_delay_score_service INTEGER CHECK (time_delay_score_service BETWEEN 1 AND 10),
  time_delay_score_hybrid INTEGER CHECK (time_delay_score_hybrid BETWEEN 1 AND 10),

  -- Ease (effort required)
  eliminated_requirements TEXT[],  -- What they DON'T need to do
  ease_analysis_product JSONB,
  ease_analysis_service JSONB,
  ease_analysis_hybrid JSONB,
  effort_score_product INTEGER CHECK (effort_score_product BETWEEN 1 AND 10),
  effort_score_service INTEGER CHECK (effort_score_service BETWEEN 1 AND 10),
  effort_score_hybrid INTEGER CHECK (effort_score_hybrid BETWEEN 1 AND 10),

  -- Step 6: Obstacles & Bonuses
  obstacles TEXT[],
  bonuses_product JSONB,  -- [{ name, description, perceived_value }]
  bonuses_service JSONB,
  bonuses_hybrid JSONB,
  total_value_product DECIMAL(10,2),
  total_value_service DECIMAL(10,2),
  total_value_hybrid DECIMAL(10,2),

  -- Step 7: Final Selection
  selected_version VARCHAR(20) CHECK (selected_version IN ('product', 'service', 'hybrid')),
  ai_recommendation VARCHAR(20),
  ai_recommendation_reasoning TEXT,

  -- Chosen version (copied from selected)
  delivery_type VARCHAR(20),
  price DECIMAL(10,2),
  core_deliverable JSONB,
  bonuses JSONB,
  total_value DECIMAL(10,2),

  -- Step 8: Grand Slam Score
  grand_slam_dream_score INTEGER CHECK (grand_slam_dream_score BETWEEN 1 AND 10),
  grand_slam_likelihood_score INTEGER CHECK (grand_slam_likelihood_score BETWEEN 1 AND 10),
  grand_slam_time_score INTEGER CHECK (grand_slam_time_score BETWEEN 1 AND 10),
  grand_slam_effort_score INTEGER CHECK (grand_slam_effort_score BETWEEN 1 AND 10),
  total_grand_slam_score INTEGER GENERATED ALWAYS AS (
    COALESCE(grand_slam_dream_score, 0) +
    COALESCE(grand_slam_likelihood_score, 0) +
    COALESCE(grand_slam_time_score, 0) +
    COALESCE(grand_slam_effort_score, 0)
  ) STORED,
  ready_to_launch BOOLEAN DEFAULT false,
  stack_slide_data JSONB,

  -- Metadata
  current_step INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ============================================
-- TABLE 2: products
-- Links Money Models to CRM deals
-- ============================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES user_projects(id) ON DELETE SET NULL,
  name VARCHAR(200) NOT NULL,
  type VARCHAR(50) CHECK (type IN ('core', 'upsell', 'downsell', 'continuity', 'lead_magnet')),
  price DECIMAL(10,2) NOT NULL,
  description TEXT,
  source_flow VARCHAR(100),  -- Which flow created this (e.g., 'offer_builder', 'upsell_flow')
  source_flow_session_id UUID,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE 3: deals
-- CRM deals with PTUF lead scoring
-- ============================================
CREATE TABLE IF NOT EXISTS deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES user_projects(id) ON DELETE SET NULL,

  -- Contact Info
  contact_name VARCHAR(200) NOT NULL,
  contact_email VARCHAR(200),
  contact_phone VARCHAR(50),
  source VARCHAR(50) CHECK (source IN ('linkedin', 'twitter', 'instagram', 'referral', 'website', 'email', 'paid_ads', 'other')),

  -- Deal Info
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name VARCHAR(200),
  value DECIMAL(10,2) DEFAULT 0,
  stage VARCHAR(20) DEFAULT 'lead' CHECK (stage IN ('lead', 'discovery', 'proposal', 'negotiation', 'won', 'lost')),
  probability INTEGER DEFAULT 10 CHECK (probability >= 0 AND probability <= 100),

  -- Lead Scoring (PTUF - Hormozi Framework)
  pain_score INTEGER CHECK (pain_score BETWEEN 1 AND 10),
  pain_notes TEXT,
  trust_score INTEGER CHECK (trust_score BETWEEN 1 AND 10),
  trust_notes TEXT,
  urgency_score INTEGER CHECK (urgency_score BETWEEN 1 AND 10),
  urgency_notes TEXT,
  fit_score INTEGER CHECK (fit_score BETWEEN 1 AND 10),
  fit_notes TEXT,

  -- Computed columns for lead scoring
  total_score INTEGER GENERATED ALWAYS AS (
    COALESCE(pain_score, 0) + COALESCE(trust_score, 0) +
    COALESCE(urgency_score, 0) + COALESCE(fit_score, 0)
  ) STORED,
  lead_temperature VARCHAR(10) GENERATED ALWAYS AS (
    CASE
      WHEN (COALESCE(pain_score,0) + COALESCE(trust_score,0) +
            COALESCE(urgency_score,0) + COALESCE(fit_score,0)) >= 32 THEN 'hot'
      WHEN (COALESCE(pain_score,0) + COALESCE(trust_score,0) +
            COALESCE(urgency_score,0) + COALESCE(fit_score,0)) >= 24 THEN 'warm'
      ELSE 'cold'
    END
  ) STORED,

  -- Dates
  expected_close_date DATE,
  actual_close_date DATE,
  last_contacted_at TIMESTAMPTZ,

  -- Notes & Screenshots
  notes TEXT,
  conversation_screenshot_url TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE 4: marketing_tasks
-- Weekly marketing task calendar
-- ============================================
CREATE TABLE IF NOT EXISTS marketing_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES user_projects(id) ON DELETE SET NULL,

  -- Task Info
  date DATE NOT NULL,
  day_of_week VARCHAR(10),
  task_type VARCHAR(50) CHECK (task_type IN ('content', 'engagement', 'outreach', 'newsletter', 'testimonial')),
  platform VARCHAR(50) CHECK (platform IN ('linkedin', 'twitter', 'instagram', 'youtube', 'tiktok', 'email', 'other')),
  content_type VARCHAR(50),  -- 'transformation', 'educational', 'bts', 'community', 'build'
  description TEXT,

  -- Completion
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  points_value INTEGER DEFAULT 10,

  -- Engagement Metrics (from screenshot analysis)
  engagement_likes INTEGER DEFAULT 0,
  engagement_comments INTEGER DEFAULT 0,
  engagement_shares INTEGER DEFAULT 0,
  engagement_dms INTEGER DEFAULT 0,
  post_screenshot_url TEXT,
  content_url TEXT,

  -- Generated content
  ai_generated_content TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE 5: sales_scripts
-- Pre-loaded Hormozi 15 Closing Scripts
-- ============================================
CREATE TABLE IF NOT EXISTS sales_scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(50) NOT NULL CHECK (category IN ('TIME', 'PRICE', 'AUTHORITY', 'SELF_DOUBT', 'TIMING', 'COMPARISON', 'COMMITMENT', 'FINAL')),
  subcategory VARCHAR(100),
  script_name TEXT NOT NULL,
  script_text TEXT NOT NULL,
  when_to_use TEXT,
  follow_up_if_a TEXT,
  follow_up_if_b TEXT,
  success_rate_benchmark DECIMAL(5,2),  -- Hormozi's data (e.g., 68.00)
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE 6: script_usage_log
-- Track which scripts were used and outcomes
-- ============================================
CREATE TABLE IF NOT EXISTS script_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  script_id UUID REFERENCES sales_scripts(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ DEFAULT NOW(),
  objection_heard TEXT,  -- What prospect actually said
  outcome VARCHAR(20) CHECK (outcome IN ('worked', 'didnt_work', 'in_progress')),
  deal_closed BOOLEAN,
  notes TEXT
);

-- ============================================
-- TABLE 7: follow_up_reminders
-- Automated alerts for stale deals
-- ============================================
CREATE TABLE IF NOT EXISTS follow_up_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  reminder_type VARCHAR(50) CHECK (reminder_type IN ('stale', 'stuck', 'hot_cooling', 'very_stale')),
  triggered_at TIMESTAMPTZ NOT NULL,
  dismissed BOOLEAN DEFAULT false,
  dismissed_at TIMESTAMPTZ,
  action_taken VARCHAR(50),  -- 'emailed', 'called', 'archived'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE 8: ltv_models
-- Lifetime Value Calculator
-- ============================================
CREATE TABLE IF NOT EXISTS ltv_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES user_projects(id) ON DELETE SET NULL,
  product_name VARCHAR(200) NOT NULL,
  core_price DECIMAL(10,2) NOT NULL,
  upsell_product VARCHAR(200),
  upsell_price DECIMAL(10,2),
  upsell_rate DECIMAL(5,2),  -- Percentage (e.g., 30.00)
  monthly_subscription DECIMAL(10,2),
  avg_months_subscribed INTEGER,
  subscription_rate DECIMAL(5,2),  -- Percentage

  -- Computed LTV
  total_ltv DECIMAL(10,2) GENERATED ALWAYS AS (
    core_price +
    COALESCE(upsell_price * upsell_rate / 100, 0) +
    COALESCE(monthly_subscription * avg_months_subscribed * subscription_rate / 100, 0)
  ) STORED,

  -- Computed target CAC
  target_cac_3_1 DECIMAL(10,2) GENERATED ALWAYS AS (
    (core_price +
     COALESCE(upsell_price * upsell_rate / 100, 0) +
     COALESCE(monthly_subscription * avg_months_subscribed * subscription_rate / 100, 0)) / 3
  ) STORED,
  target_cac_5_1 DECIMAL(10,2) GENERATED ALWAYS AS (
    (core_price +
     COALESCE(upsell_price * upsell_rate / 100, 0) +
     COALESCE(monthly_subscription * avg_months_subscribed * subscription_rate / 100, 0)) / 5
  ) STORED,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE 9: marketing_spend
-- CAC tracking by source
-- ============================================
CREATE TABLE IF NOT EXISTS marketing_spend (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES user_projects(id) ON DELETE SET NULL,
  month DATE NOT NULL,  -- First day of month
  source VARCHAR(50) NOT NULL CHECK (source IN ('linkedin', 'twitter', 'instagram', 'referral', 'website', 'email', 'paid_ads', 'other')),
  amount DECIMAL(10,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, month, source)
);

-- ============================================
-- TABLE 10: crm_stats
-- CRM gamification (separate from challenge)
-- ============================================
CREATE TABLE IF NOT EXISTS crm_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  total_points INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  deals_created INTEGER DEFAULT 0,
  deals_won INTEGER DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  monthly_revenue_goal INTEGER DEFAULT 5000,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE 11: generated_content
-- AI-generated marketing content
-- ============================================
CREATE TABLE IF NOT EXISTS generated_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES marketing_tasks(id) ON DELETE CASCADE,
  content_type VARCHAR(50),  -- 'transformation', 'educational', 'bts', etc.
  generated_text TEXT NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FUNCTION: detect_stale_deals
-- Finds deals that need follow-up
-- ============================================
CREATE OR REPLACE FUNCTION detect_stale_deals(p_user_id UUID)
RETURNS TABLE (
  deal_id UUID,
  contact_name VARCHAR(200),
  deal_value DECIMAL(10,2),
  days_stale INTEGER,
  reminder_type VARCHAR(50)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id as deal_id,
    d.contact_name,
    d.value as deal_value,
    EXTRACT(days FROM (NOW() - d.updated_at))::INTEGER as days_stale,
    CASE
      WHEN d.lead_temperature = 'hot' AND d.updated_at < NOW() - INTERVAL '5 days' THEN 'hot_cooling'
      WHEN d.lead_temperature = 'warm' AND d.updated_at < NOW() - INTERVAL '7 days' THEN 'stale'
      WHEN d.lead_temperature = 'cold' AND d.updated_at < NOW() - INTERVAL '14 days' THEN 'very_stale'
      WHEN d.stage = 'discovery' AND d.updated_at < NOW() - INTERVAL '14 days' THEN 'stuck'
      WHEN d.stage = 'proposal' AND d.updated_at < NOW() - INTERVAL '7 days' THEN 'stuck'
    END::VARCHAR(50) as reminder_type
  FROM deals d
  WHERE d.user_id = p_user_id
    AND d.stage NOT IN ('won', 'lost')
    AND (
      (d.lead_temperature = 'hot' AND d.updated_at < NOW() - INTERVAL '5 days') OR
      (d.lead_temperature = 'warm' AND d.updated_at < NOW() - INTERVAL '7 days') OR
      (d.lead_temperature = 'cold' AND d.updated_at < NOW() - INTERVAL '14 days') OR
      (d.stage = 'discovery' AND d.updated_at < NOW() - INTERVAL '14 days') OR
      (d.stage = 'proposal' AND d.updated_at < NOW() - INTERVAL '7 days')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: update_updated_at
-- Generic trigger function for updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS: Auto-update updated_at
-- ============================================
CREATE TRIGGER trigger_offer_creations_updated_at
  BEFORE UPDATE ON offer_creations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_deals_updated_at
  BEFORE UPDATE ON deals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_ltv_models_updated_at
  BEFORE UPDATE ON ltv_models
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_crm_stats_updated_at
  BEFORE UPDATE ON crm_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VIEW: script_effectiveness
-- Analytics for script performance
-- ============================================
CREATE OR REPLACE VIEW script_effectiveness AS
SELECT
  s.id as script_id,
  s.script_name,
  s.category,
  s.success_rate_benchmark,
  COUNT(sul.id) as times_used,
  CASE
    WHEN COUNT(sul.id) > 0
    THEN ROUND((COUNT(sul.id) FILTER (WHERE sul.outcome = 'worked')::DECIMAL / COUNT(sul.id)) * 100, 2)
    ELSE 0
  END as your_success_rate,
  CASE
    WHEN COUNT(sul.id) > 0
    THEN ROUND((COUNT(sul.id) FILTER (WHERE sul.deal_closed = true)::DECIMAL / COUNT(sul.id)) * 100, 2)
    ELSE 0
  END as close_rate
FROM sales_scripts s
LEFT JOIN script_usage_log sul ON s.id = sul.script_id
GROUP BY s.id, s.script_name, s.category, s.success_rate_benchmark;

-- ============================================
-- INDEXES: Performance optimization
-- ============================================
-- offer_creations
CREATE INDEX idx_offer_creations_user ON offer_creations(user_id);
CREATE INDEX idx_offer_creations_project ON offer_creations(project_id);
CREATE INDEX idx_offer_creations_created ON offer_creations(created_at DESC);

-- products
CREATE INDEX idx_products_user ON products(user_id);
CREATE INDEX idx_products_project ON products(project_id);
CREATE INDEX idx_products_type ON products(type);

-- deals
CREATE INDEX idx_deals_user ON deals(user_id);
CREATE INDEX idx_deals_project ON deals(project_id);
CREATE INDEX idx_deals_stage ON deals(stage);
CREATE INDEX idx_deals_score ON deals(total_score DESC);
CREATE INDEX idx_deals_temperature ON deals(lead_temperature);
CREATE INDEX idx_deals_updated_at ON deals(updated_at);
CREATE INDEX idx_deals_source ON deals(source);

-- marketing_tasks
CREATE INDEX idx_marketing_tasks_user_date ON marketing_tasks(user_id, date);
CREATE INDEX idx_marketing_tasks_completed ON marketing_tasks(user_id, completed);

-- sales_scripts
CREATE INDEX idx_scripts_category ON sales_scripts(category);

-- script_usage_log
CREATE INDEX idx_script_usage_user ON script_usage_log(user_id);
CREATE INDEX idx_script_usage_deal ON script_usage_log(deal_id);
CREATE INDEX idx_script_usage_script ON script_usage_log(script_id);

-- follow_up_reminders
CREATE INDEX idx_reminders_user_active ON follow_up_reminders(user_id) WHERE dismissed = false;

-- ltv_models
CREATE INDEX idx_ltv_user ON ltv_models(user_id);

-- marketing_spend
CREATE INDEX idx_marketing_spend_user_month ON marketing_spend(user_id, month);

-- generated_content
CREATE INDEX idx_generated_content_task ON generated_content(task_id);

-- ============================================
-- RLS POLICIES: Row Level Security
-- ============================================
ALTER TABLE offer_creations ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE script_usage_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_up_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE ltv_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_spend ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_content ENABLE ROW LEVEL SECURITY;

-- offer_creations
CREATE POLICY "Users can CRUD own offer_creations" ON offer_creations
  FOR ALL USING (auth.uid() = user_id);

-- products
CREATE POLICY "Users can CRUD own products" ON products
  FOR ALL USING (auth.uid() = user_id);

-- deals
CREATE POLICY "Users can CRUD own deals" ON deals
  FOR ALL USING (auth.uid() = user_id);

-- marketing_tasks
CREATE POLICY "Users can CRUD own marketing_tasks" ON marketing_tasks
  FOR ALL USING (auth.uid() = user_id);

-- script_usage_log
CREATE POLICY "Users can CRUD own script_usage" ON script_usage_log
  FOR ALL USING (auth.uid() = user_id);

-- follow_up_reminders
CREATE POLICY "Users can CRUD own reminders" ON follow_up_reminders
  FOR ALL USING (auth.uid() = user_id);

-- ltv_models
CREATE POLICY "Users can CRUD own ltv_models" ON ltv_models
  FOR ALL USING (auth.uid() = user_id);

-- marketing_spend
CREATE POLICY "Users can CRUD own marketing_spend" ON marketing_spend
  FOR ALL USING (auth.uid() = user_id);

-- crm_stats
CREATE POLICY "Users can CRUD own crm_stats" ON crm_stats
  FOR ALL USING (auth.uid() = user_id);

-- generated_content
CREATE POLICY "Users can CRUD own generated_content" ON generated_content
  FOR ALL USING (auth.uid() = user_id);

-- sales_scripts is public (read-only for all authenticated users)
CREATE POLICY "Authenticated users can read scripts" ON sales_scripts
  FOR SELECT TO authenticated USING (true);

-- ============================================
-- GRANT PERMISSIONS
-- ============================================
GRANT ALL ON offer_creations TO authenticated;
GRANT ALL ON products TO authenticated;
GRANT ALL ON deals TO authenticated;
GRANT ALL ON marketing_tasks TO authenticated;
GRANT SELECT ON sales_scripts TO authenticated;
GRANT ALL ON script_usage_log TO authenticated;
GRANT ALL ON follow_up_reminders TO authenticated;
GRANT ALL ON ltv_models TO authenticated;
GRANT ALL ON marketing_spend TO authenticated;
GRANT ALL ON crm_stats TO authenticated;
GRANT ALL ON generated_content TO authenticated;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE offer_creations IS 'Enhanced 8-step $100M Offer Builder with 3 version system';
COMMENT ON TABLE products IS 'User products from Money Model flows, links to CRM deals';
COMMENT ON TABLE deals IS 'CRM sales pipeline with PTUF lead scoring';
COMMENT ON TABLE marketing_tasks IS 'Weekly marketing task calendar';
COMMENT ON TABLE sales_scripts IS 'Pre-loaded Hormozi 15 closing scripts';
COMMENT ON TABLE script_usage_log IS 'Track script usage and effectiveness';
COMMENT ON TABLE follow_up_reminders IS 'Automated alerts for stale deals';
COMMENT ON TABLE ltv_models IS 'Customer lifetime value calculator';
COMMENT ON TABLE marketing_spend IS 'Marketing spend by source for CAC calculation';
COMMENT ON TABLE crm_stats IS 'CRM-specific gamification stats';

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$ BEGIN RAISE NOTICE 'Flow Academy V1 database foundation created successfully!'; END $$;
