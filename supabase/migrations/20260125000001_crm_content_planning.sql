-- CRM Content Planning System (Phase 2)
-- Enables weekly content planning with context and checklist tracking

-- Content plans (one per user per week)
CREATE TABLE IF NOT EXISTS crm_content_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL, -- Monday of the week
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_start)
);

-- Content items within a plan
CREATE TABLE IF NOT EXISTS crm_content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES crm_content_plans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Content type info
  content_type TEXT NOT NULL, -- 'behind_the_scenes', 'case_study', etc.
  phase TEXT NOT NULL, -- 'build', 'launch', 'deliver', 'recap'
  label TEXT NOT NULL, -- Display label e.g. "Behind the Scenes"
  icon TEXT, -- Emoji icon

  -- User-provided context
  context TEXT NOT NULL,

  -- Generated content (after generation)
  generated_content TEXT,
  generated_at TIMESTAMPTZ,

  -- Status tracking
  status TEXT DEFAULT 'planned', -- 'planned', 'draft', 'published'
  published_at TIMESTAMPTZ,

  -- Ordering
  sort_order INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE crm_content_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_content_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for content plans
DO $$ BEGIN
  CREATE POLICY "Users can view own content plans"
    ON crm_content_plans FOR SELECT
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert own content plans"
    ON crm_content_plans FOR INSERT
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own content plans"
    ON crm_content_plans FOR UPDATE
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete own content plans"
    ON crm_content_plans FOR DELETE
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- RLS Policies for content items
DO $$ BEGIN
  CREATE POLICY "Users can view own content items"
    ON crm_content_items FOR SELECT
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert own content items"
    ON crm_content_items FOR INSERT
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own content items"
    ON crm_content_items FOR UPDATE
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete own content items"
    ON crm_content_items FOR DELETE
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_crm_content_plans_user_week
  ON crm_content_plans(user_id, week_start);

CREATE INDEX IF NOT EXISTS idx_crm_content_items_plan
  ON crm_content_items(plan_id);

CREATE INDEX IF NOT EXISTS idx_crm_content_items_user_status
  ON crm_content_items(user_id, status);
