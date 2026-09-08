-- Direction Bridge: tables for Phase 2→3 career direction reveals + income tracking

-- Tracks which bridge cards a user has completed
CREATE TABLE IF NOT EXISTS direction_reveals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reveal_type TEXT NOT NULL,  -- 'life_map_review' | 'problem_motivation' | 'multiplication'
  reveal_data JSONB NOT NULL DEFAULT '{}',
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, reveal_type)
);

ALTER TABLE direction_reveals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own reveals" ON direction_reveals
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Income self-reports (feeds hero stages 9-12, also written by Scale Portal with source='scale_auto')
CREATE TABLE IF NOT EXISTS income_self_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL,       -- 'YYYY-MM' format
  amount_cents INTEGER NOT NULL,  -- stored in smallest currency unit
  currency TEXT DEFAULT 'USD',    -- USD, AUD, GBP, EUR, IDR
  source TEXT DEFAULT 'self_report',  -- 'self_report' | 'scale_auto'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, month_year)
);

ALTER TABLE income_self_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own income" ON income_self_reports
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Add category statement + expenses target to user_stage_progress
ALTER TABLE user_stage_progress
  ADD COLUMN IF NOT EXISTS category_statement TEXT,
  ADD COLUMN IF NOT EXISTS expenses_target_cents INTEGER;
