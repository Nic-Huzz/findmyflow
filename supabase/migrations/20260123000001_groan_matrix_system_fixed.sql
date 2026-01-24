-- =====================================================================
-- GROAN MATRIX SYSTEM MIGRATION (FIXED v2)
-- =====================================================================

-- Step 1: Clear old weekly_groan_layer values
UPDATE weekly_plans SET weekly_groan_layer = NULL WHERE weekly_groan_layer IS NOT NULL;

-- Step 2: Drop old constraint and functions
ALTER TABLE weekly_plans DROP CONSTRAINT IF EXISTS weekly_plans_weekly_groan_layer_check;
DROP FUNCTION IF EXISTS get_week_start(date);
DROP FUNCTION IF EXISTS calculate_essence_zone(integer, integer);
DROP FUNCTION IF EXISTS update_groan_streak();

-- ============================================================================
-- ENUMS
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE groan_visibility_layer AS ENUM ('screen', 'live', 'money', 'vulnerable', 'authority');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE groan_source_type AS ENUM ('skill', 'problem', 'persona');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE groan_challenge_status AS ENUM ('active', 'completed', 'skipped');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE groan_skip_reason AS ENUM ('too_scary', 'not_relevant', 'already_do_this', 'dont_understand', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE groan_proof_type AS ENUM ('link', 'screenshot', 'text');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE groan_outcome_type AS ENUM ('engagement', 'conversations', 'call_booked', 'sale_made', 'nothing_yet', 'unexpected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE essence_zone_type AS ENUM ('essence_zone', 'pushed_too_far', 'hidden_strength', 'neutral_zone', 'building_capacity');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS groan_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_type groan_source_type NOT NULL,
  source_value TEXT NOT NULL,
  source_cluster_id UUID,
  visibility_layer groan_visibility_layer NOT NULL,
  challenge_text TEXT NOT NULL,
  stacked_layers groan_visibility_layer[] DEFAULT '{}',
  status groan_challenge_status DEFAULT 'active',
  scary_score INTEGER CHECK (scary_score >= 1 AND scary_score <= 10),
  wahoo_score INTEGER CHECK (wahoo_score >= 1 AND wahoo_score <= 10),
  essence_zone_insight essence_zone_type,
  skipped_at TIMESTAMPTZ,
  skip_reason groan_skip_reason,
  skip_feedback TEXT,
  completed_at TIMESTAMPTZ,
  reflection_text TEXT,
  ai_prompt_used TEXT,
  generation_attempt INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS groan_proof (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES groan_challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  proof_type groan_proof_type NOT NULL,
  proof_url TEXT,
  screenshot_path TEXT,
  proof_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS groan_contract_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES groan_challenges(id) ON DELETE CASCADE,
  contract_text TEXT NOT NULL,
  evidence_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS groan_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES groan_challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  outcome_type groan_outcome_type NOT NULL,
  outcome_details TEXT,
  revenue_amount DECIMAL(10,2),
  deal_id UUID,
  follow_up_sent_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS groan_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_completion_week DATE,
  total_completed INTEGER DEFAULT 0,
  total_skipped INTEGER DEFAULT 0,
  badges_earned TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS groan_user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  show_archetype_context BOOLEAN DEFAULT true,
  outcome_tracking_enabled BOOLEAN DEFAULT true,
  weekly_reminder_enabled BOOLEAN DEFAULT true,
  follow_up_reminder_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_groan_challenges_user_id ON groan_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_groan_challenges_status ON groan_challenges(user_id, status);
CREATE INDEX IF NOT EXISTS idx_groan_challenges_layer ON groan_challenges(user_id, visibility_layer);
CREATE INDEX IF NOT EXISTS idx_groan_proof_challenge ON groan_proof(challenge_id);
CREATE INDEX IF NOT EXISTS idx_groan_outcomes_challenge ON groan_outcomes(challenge_id);

-- ============================================================================
-- WEEKLY PLAN INTEGRATION
-- ============================================================================

ALTER TABLE weekly_plans ADD COLUMN IF NOT EXISTS groan_challenge_id UUID REFERENCES groan_challenges(id) ON DELETE SET NULL;

ALTER TABLE weekly_plans ADD CONSTRAINT weekly_plans_weekly_groan_layer_check
CHECK (weekly_groan_layer IS NULL OR weekly_groan_layer IN ('screen', 'live', 'money', 'vulnerable', 'authority'));

-- ============================================================================
-- STORAGE BUCKET
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('groan-proof', 'groan-proof', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE groan_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE groan_proof ENABLE ROW LEVEL SECURITY;
ALTER TABLE groan_contract_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE groan_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE groan_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE groan_user_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own challenges" ON groan_challenges;
CREATE POLICY "Users can view own challenges" ON groan_challenges FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own challenges" ON groan_challenges;
CREATE POLICY "Users can insert own challenges" ON groan_challenges FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own challenges" ON groan_challenges;
CREATE POLICY "Users can update own challenges" ON groan_challenges FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own challenges" ON groan_challenges;
CREATE POLICY "Users can delete own challenges" ON groan_challenges FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own proof" ON groan_proof;
CREATE POLICY "Users can view own proof" ON groan_proof FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own proof" ON groan_proof;
CREATE POLICY "Users can insert own proof" ON groan_proof FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own proof" ON groan_proof;
CREATE POLICY "Users can delete own proof" ON groan_proof FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own contract evidence" ON groan_contract_evidence;
CREATE POLICY "Users can view own contract evidence" ON groan_contract_evidence FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own contract evidence" ON groan_contract_evidence;
CREATE POLICY "Users can insert own contract evidence" ON groan_contract_evidence FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own outcomes" ON groan_outcomes;
CREATE POLICY "Users can view own outcomes" ON groan_outcomes FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own outcomes" ON groan_outcomes;
CREATE POLICY "Users can insert own outcomes" ON groan_outcomes FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own outcomes" ON groan_outcomes;
CREATE POLICY "Users can update own outcomes" ON groan_outcomes FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own streaks" ON groan_streaks;
CREATE POLICY "Users can view own streaks" ON groan_streaks FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own streaks" ON groan_streaks;
CREATE POLICY "Users can insert own streaks" ON groan_streaks FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own streaks" ON groan_streaks;
CREATE POLICY "Users can update own streaks" ON groan_streaks FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own preferences" ON groan_user_preferences;
CREATE POLICY "Users can view own preferences" ON groan_user_preferences FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own preferences" ON groan_user_preferences;
CREATE POLICY "Users can insert own preferences" ON groan_user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own preferences" ON groan_user_preferences;
CREATE POLICY "Users can update own preferences" ON groan_user_preferences FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- HELPER FUNCTIONS (with explicit DROP first)
-- ============================================================================

CREATE FUNCTION get_week_start(d DATE)
RETURNS DATE AS $$
BEGIN
  RETURN d - (EXTRACT(ISODOW FROM d) - 1)::INTEGER;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE FUNCTION calculate_essence_zone(scary INTEGER, wahoo INTEGER)
RETURNS essence_zone_type AS $$
BEGIN
  IF scary >= 7 AND wahoo >= 7 THEN RETURN 'essence_zone';
  ELSIF scary >= 7 AND wahoo <= 4 THEN RETURN 'pushed_too_far';
  ELSIF scary <= 4 AND wahoo >= 7 THEN RETURN 'hidden_strength';
  ELSIF scary <= 4 AND wahoo <= 4 THEN RETURN 'neutral_zone';
  ELSE RETURN 'building_capacity';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE FUNCTION update_groan_streak()
RETURNS TRIGGER AS $$
DECLARE
  current_week DATE;
  last_week DATE;
  streak_record RECORD;
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    current_week := get_week_start(CURRENT_DATE);
    SELECT * INTO streak_record FROM groan_streaks WHERE user_id = NEW.user_id;
    IF NOT FOUND THEN
      INSERT INTO groan_streaks (user_id, current_streak, longest_streak, last_completion_week, total_completed)
      VALUES (NEW.user_id, 1, 1, current_week, 1);
    ELSE
      last_week := streak_record.last_completion_week;
      IF last_week IS NULL OR current_week > last_week + INTERVAL '7 days' THEN
        UPDATE groan_streaks SET current_streak = 1, last_completion_week = current_week, total_completed = total_completed + 1, updated_at = NOW() WHERE user_id = NEW.user_id;
      ELSIF current_week = last_week + INTERVAL '7 days' THEN
        UPDATE groan_streaks SET current_streak = current_streak + 1, longest_streak = GREATEST(longest_streak, current_streak + 1), last_completion_week = current_week, total_completed = total_completed + 1, updated_at = NOW() WHERE user_id = NEW.user_id;
      ELSIF current_week = last_week THEN
        UPDATE groan_streaks SET total_completed = total_completed + 1, updated_at = NOW() WHERE user_id = NEW.user_id;
      END IF;
    END IF;
  END IF;
  IF NEW.status = 'skipped' AND OLD.status != 'skipped' THEN
    UPDATE groan_streaks SET total_skipped = total_skipped + 1, updated_at = NOW() WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_groan_streak ON groan_challenges;
CREATE TRIGGER trigger_update_groan_streak AFTER UPDATE ON groan_challenges FOR EACH ROW EXECUTE FUNCTION update_groan_streak();

-- ============================================================================
-- VIEWS
-- ============================================================================

CREATE OR REPLACE VIEW groan_protective_patterns AS
SELECT user_id, visibility_layer,
  COUNT(*) FILTER (WHERE status = 'skipped' AND skip_reason = 'too_scary') as scary_skips,
  COUNT(*) FILTER (WHERE status = 'completed') as completions,
  COUNT(*) as total_challenges
FROM groan_challenges GROUP BY user_id, visibility_layer;

CREATE OR REPLACE VIEW groan_revenue_by_layer AS
SELECT gc.user_id, gc.visibility_layer,
  COUNT(DISTINCT gc.id) as challenges_completed,
  SUM(CASE WHEN go.outcome_type = 'sale_made' THEN go.revenue_amount ELSE 0 END) as total_revenue
FROM groan_challenges gc
LEFT JOIN groan_outcomes go ON gc.id = go.challenge_id
WHERE gc.status = 'completed'
GROUP BY gc.user_id, gc.visibility_layer;

-- =====================================================================
-- MIGRATION COMPLETE
-- =====================================================================
