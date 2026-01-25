-- CRM Weekly Planning System
-- Enables weekly planning flow with phases, tasks, reflections, and flow tracking

-- Weekly plans (phase selections + task lists)
CREATE TABLE IF NOT EXISTS crm_weekly_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL, -- Monday of the week
  active_phases TEXT[] NOT NULL, -- ['build', 'deliver', 'recap']
  tasks JSONB DEFAULT '[]', -- [{title, phase, count}]
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_start)
);

-- Weekly reflections (before planning)
CREATE TABLE IF NOT EXISTS crm_weekly_reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL, -- Monday of the week being reflected on (previous week)

  -- Last week's scores
  execution_score DECIMAL(5,2),
  conversion_score DECIMAL(5,2),
  improvement_score DECIMAL(5,2),

  -- Reflection response
  reflection_type TEXT NOT NULL, -- 'execution_incomplete', 'execution_perfect', 'improved', 'declined', 'steady', 'first_week'
  reflection_text TEXT,

  -- Flow check-in at time of reflection
  flow_internal TEXT, -- 'excited', 'tired'
  flow_external TEXT, -- 'great', 'resistance'
  flow_direction TEXT, -- 'north', 'east', 'south', 'west'

  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_start)
);

-- Enable RLS
ALTER TABLE crm_weekly_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_weekly_reflections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for weekly plans
DO $$ BEGIN
  CREATE POLICY "Users can view own weekly plans"
    ON crm_weekly_plans FOR SELECT
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert own weekly plans"
    ON crm_weekly_plans FOR INSERT
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own weekly plans"
    ON crm_weekly_plans FOR UPDATE
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete own weekly plans"
    ON crm_weekly_plans FOR DELETE
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- RLS Policies for reflections
DO $$ BEGIN
  CREATE POLICY "Users can view own reflections"
    ON crm_weekly_reflections FOR SELECT
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert own reflections"
    ON crm_weekly_reflections FOR INSERT
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own reflections"
    ON crm_weekly_reflections FOR UPDATE
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_crm_weekly_plans_user_week
  ON crm_weekly_plans(user_id, week_start);

CREATE INDEX IF NOT EXISTS idx_crm_weekly_reflections_user_week
  ON crm_weekly_reflections(user_id, week_start);
