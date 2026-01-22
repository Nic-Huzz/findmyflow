-- Migration: Marketing Goals and Benchmark Tracking
-- Part of Marketing Tower Tier 1+2: Goal-Based Strategy System

-- ============================================
-- ADD GOAL FIELDS TO CONTENT_STRATEGIES
-- ============================================

ALTER TABLE content_strategies ADD COLUMN IF NOT EXISTS
  revenue_goal INTEGER,                    -- Monthly revenue target
  core_offer_price INTEGER,                -- Main offer price
  upsell_price INTEGER DEFAULT 0,          -- Upsell price
  downsell_price INTEGER DEFAULT 0,        -- Downsell price
  continuity_price INTEGER DEFAULT 0,      -- Monthly continuity price
  lead_magnet_type TEXT DEFAULT 'guide',   -- Type of lead magnet
  follower_level TEXT DEFAULT 'average',   -- beginner, growing, established, large (fallback)
  follower_count INTEGER,                  -- Actual follower count on primary platform
  avg_views_per_post INTEGER;              -- Average views from last 3 posts

-- ============================================
-- CUSTOM CONVERSION RATES (USER OVERRIDES)
-- ============================================

ALTER TABLE content_strategies ADD COLUMN IF NOT EXISTS
  custom_rates JSONB DEFAULT '{}'::jsonb;  -- User's actual conversion rates

-- Example custom_rates structure:
-- {
--   "reachToEngagement": 0.05,
--   "engagementToLead": 0.25,
--   "leadToNurtured": 0.45,
--   "nurturedToCustomer": 0.08,
--   "averageReachPerPost": 1500
-- }

-- ============================================
-- CALCULATED TARGETS (CACHED)
-- ============================================

ALTER TABLE content_strategies ADD COLUMN IF NOT EXISTS
  calculated_targets JSONB DEFAULT '{}'::jsonb;

-- Example calculated_targets structure:
-- {
--   "customersNeeded": 20,
--   "leadsNeeded": 1000,
--   "reachNeeded": 80000,
--   "postsPerWeek": 20,
--   "calculatedAt": "2026-01-08T10:00:00Z"
-- }

-- ============================================
-- MARKETING METRICS TABLE
-- ============================================

-- Stores aggregated metrics for progress tracking
CREATE TABLE IF NOT EXISTS marketing_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  period_type TEXT NOT NULL,               -- 'daily', 'weekly', 'monthly'
  period_start DATE NOT NULL,              -- Start of period
  period_end DATE NOT NULL,                -- End of period

  -- Content metrics
  posts_count INTEGER DEFAULT 0,
  total_reach INTEGER DEFAULT 0,
  total_impressions INTEGER DEFAULT 0,
  total_engagements INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,4),            -- Calculated avg engagement rate

  -- Lead metrics
  leads_generated INTEGER DEFAULT 0,
  lead_magnet_views INTEGER DEFAULT 0,
  opt_in_rate DECIMAL(5,4),

  -- Sales metrics (from CRM data)
  customers_converted INTEGER DEFAULT 0,
  revenue_generated DECIMAL(10,2) DEFAULT 0,

  -- Platform breakdown
  platform_breakdown JSONB DEFAULT '{}'::jsonb,
  -- Example: { "linkedin": { "posts": 5, "reach": 5000, "engagements": 200 } }

  -- Content type breakdown
  content_type_breakdown JSONB DEFAULT '{}'::jsonb,
  -- Example: { "carousel": { "posts": 3, "avgEngagement": 0.05 }, "text_post": { ... } }

  -- Progress against goals
  goal_progress JSONB DEFAULT '{}'::jsonb,
  -- Example: { "reachProgress": 0.65, "postProgress": 0.80, "onTrack": true }

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, period_type, period_start)
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_marketing_metrics_user_period
ON marketing_metrics(user_id, period_type, period_start DESC);

-- RLS policies
ALTER TABLE marketing_metrics ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
CREATE POLICY "Users can view own marketing metrics"
  ON marketing_metrics FOR SELECT
  USING (auth.uid() = user_id);

DO $$ BEGIN
CREATE POLICY "Users can insert own marketing metrics"
  ON marketing_metrics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DO $$ BEGIN
CREATE POLICY "Users can update own marketing metrics"
  ON marketing_metrics FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- BENCHMARK COMPARISONS TABLE
-- ============================================

-- Stores user's calculated rates for comparison with benchmarks
CREATE TABLE IF NOT EXISTS user_benchmark_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Data volume (for confidence calculation)
  post_count INTEGER DEFAULT 0,
  weeks_of_data INTEGER DEFAULT 0,
  confidence_level TEXT DEFAULT 'insufficient', -- insufficient, low, medium, high

  -- Calculated rates from user's actual data
  calculated_rates JSONB DEFAULT '{}'::jsonb,
  -- Example: {
  --   "reachToEngagement": 0.042,
  --   "engagementToLead": 0.28,
  --   "averageReachPerPost": 1800
  -- }

  -- Industry benchmarks at time of snapshot (for historical comparison)
  benchmark_rates JSONB DEFAULT '{}'::jsonb,

  -- Performance vs benchmarks
  performance_vs_benchmark JSONB DEFAULT '{}'::jsonb,
  -- Example: {
  --   "reachToEngagement": { "user": 0.042, "benchmark": 0.03, "diff": "+40%" },
  --   "engagementToLead": { "user": 0.28, "benchmark": 0.20, "diff": "+40%" }
  -- }

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, snapshot_date)
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_benchmark_snapshots_user
ON user_benchmark_snapshots(user_id, snapshot_date DESC);

-- RLS policies
ALTER TABLE user_benchmark_snapshots ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
CREATE POLICY "Users can view own benchmark snapshots"
  ON user_benchmark_snapshots FOR SELECT
  USING (auth.uid() = user_id);

DO $$ BEGIN
CREATE POLICY "Users can insert own benchmark snapshots"
  ON user_benchmark_snapshots FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON COLUMN content_strategies.revenue_goal IS 'Monthly revenue target in dollars';
COMMENT ON COLUMN content_strategies.custom_rates IS 'User-provided or calculated conversion rates that override benchmarks';
COMMENT ON COLUMN content_strategies.calculated_targets IS 'Cached calculation results from strategy calculator';
COMMENT ON TABLE marketing_metrics IS 'Aggregated marketing metrics for progress tracking';
COMMENT ON TABLE user_benchmark_snapshots IS 'Point-in-time snapshots of user rates vs industry benchmarks';
