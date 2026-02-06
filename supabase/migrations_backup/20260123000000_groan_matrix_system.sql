-- Groan Matrix System Migration
-- Created: 2026-01-23
--
-- This migration creates the infrastructure for the redesigned Groans system:
-- - AI-generated challenges from Flow Finder data (Skills × Problems × Personas)
-- - 5 visibility layers: screen, live, money, vulnerable, authority
-- - Proof collection, contract evolution tracking, outcome tracking
-- - Streak tracking and courage portfolio

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Visibility layers (fear levels)
DO $$ BEGIN
  CREATE TYPE groan_visibility_layer AS ENUM (
    'screen',      -- Online/digital visibility
    'live',        -- Real-time interaction
    'money',       -- Pricing/selling/receiving
    'vulnerable',  -- Authentic sharing, rejection of real self
    'authority'    -- Claiming expertise, imposter syndrome
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Source types (from Flow Finder)
DO $$ BEGIN
  CREATE TYPE groan_source_type AS ENUM (
    'skill',
    'problem',
    'persona'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Challenge status
DO $$ BEGIN
  CREATE TYPE groan_challenge_status AS ENUM (
    'active',
    'completed',
    'skipped'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Skip reasons
DO $$ BEGIN
  CREATE TYPE groan_skip_reason AS ENUM (
    'too_scary',
    'not_relevant',
    'already_do_this',
    'dont_understand',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Proof types
DO $$ BEGIN
  CREATE TYPE groan_proof_type AS ENUM (
    'link',
    'screenshot',
    'text'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Outcome types (48hr follow-up)
DO $$ BEGIN
  CREATE TYPE groan_outcome_type AS ENUM (
    'engagement',      -- Got views/likes/engagement
    'conversations',   -- Started conversations/DMs
    'call_booked',     -- Booked a call
    'sale_made',       -- Made a sale
    'nothing_yet',     -- No visible outcome yet
    'unexpected'       -- Something unexpected happened
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Essence zone insights
DO $$ BEGIN
  CREATE TYPE essence_zone_type AS ENUM (
    'essence_zone',      -- High fear + high wahoo = this IS your flow
    'pushed_too_far',    -- High fear + low wahoo = not your path or need support
    'hidden_strength',   -- Low fear + high wahoo = easier than expected
    'neutral_zone',      -- Low fear + low wahoo = not a growth edge
    'building_capacity'  -- Mid fear + high wahoo = healthy stretch
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Main challenges table
CREATE TABLE IF NOT EXISTS groan_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Flow Finder source
  source_type groan_source_type NOT NULL,
  source_value TEXT NOT NULL,                    -- e.g., "Writing" (the cluster label)
  source_cluster_id UUID,                        -- Reference to nikigai_clusters.id

  -- Visibility layer
  visibility_layer groan_visibility_layer NOT NULL,

  -- Challenge content
  challenge_text TEXT NOT NULL,

  -- Stacking indicator (challenges can hit multiple layers)
  stacked_layers groan_visibility_layer[] DEFAULT '{}',  -- Additional layers this challenge touches

  -- Status tracking
  status groan_challenge_status DEFAULT 'active',

  -- Emotional check-in (before)
  scary_score INTEGER CHECK (scary_score >= 1 AND scary_score <= 10),

  -- Emotional check-in (after)
  wahoo_score INTEGER CHECK (wahoo_score >= 1 AND wahoo_score <= 10),
  essence_zone_insight essence_zone_type,

  -- Skip tracking
  skipped_at TIMESTAMPTZ,
  skip_reason groan_skip_reason,
  skip_feedback TEXT,

  -- Completion
  completed_at TIMESTAMPTZ,

  -- Text reflection (simplified from voice note)
  reflection_text TEXT,

  -- AI generation metadata
  ai_prompt_used TEXT,
  generation_attempt INTEGER DEFAULT 1,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for groan_challenges
CREATE INDEX IF NOT EXISTS idx_groan_challenges_user_id ON groan_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_groan_challenges_status ON groan_challenges(user_id, status);
CREATE INDEX IF NOT EXISTS idx_groan_challenges_layer ON groan_challenges(user_id, visibility_layer);
CREATE INDEX IF NOT EXISTS idx_groan_challenges_source ON groan_challenges(user_id, source_type, source_value);

-- ============================================================================
-- PROOF COLLECTION
-- ============================================================================

CREATE TABLE IF NOT EXISTS groan_proof (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES groan_challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  proof_type groan_proof_type NOT NULL,
  proof_url TEXT,                      -- For links
  screenshot_path TEXT,                -- For screenshots (Supabase storage path)
  proof_text TEXT,                     -- For text descriptions

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_groan_proof_challenge ON groan_proof(challenge_id);
CREATE INDEX IF NOT EXISTS idx_groan_proof_user ON groan_proof(user_id);

-- ============================================================================
-- CONTRACT EVOLUTION (Links to NS limiting beliefs)
-- ============================================================================

CREATE TABLE IF NOT EXISTS groan_contract_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES groan_challenges(id) ON DELETE CASCADE,

  -- The limiting contract/belief being challenged
  contract_text TEXT NOT NULL,         -- e.g., "It's not safe to be seen"

  -- Evidence that disproves it
  evidence_text TEXT NOT NULL,         -- e.g., "I posted and got supportive comments"

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_groan_contract_evidence_user ON groan_contract_evidence(user_id);
CREATE INDEX IF NOT EXISTS idx_groan_contract_evidence_contract ON groan_contract_evidence(user_id, contract_text);

-- ============================================================================
-- OUTCOME TRACKING (48hr follow-up)
-- ============================================================================

CREATE TABLE IF NOT EXISTS groan_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES groan_challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  outcome_type groan_outcome_type NOT NULL,
  outcome_details TEXT,

  -- Revenue attribution
  revenue_amount DECIMAL(10,2),
  deal_id UUID,                        -- Reference to CRM deals if sale made

  -- Tracking
  follow_up_sent_at TIMESTAMPTZ,       -- When 48hr prompt was sent
  responded_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_groan_outcomes_challenge ON groan_outcomes(challenge_id);
CREATE INDEX IF NOT EXISTS idx_groan_outcomes_user ON groan_outcomes(user_id);
CREATE INDEX IF NOT EXISTS idx_groan_outcomes_type ON groan_outcomes(user_id, outcome_type);

-- ============================================================================
-- STREAK TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS groan_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_completion_week DATE,           -- Monday of the week

  -- Stats
  total_completed INTEGER DEFAULT 0,
  total_skipped INTEGER DEFAULT 0,

  -- Badge tracking
  badges_earned TEXT[] DEFAULT '{}',   -- Array of badge IDs earned

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);

-- ============================================================================
-- USER PREFERENCES
-- ============================================================================

CREATE TABLE IF NOT EXISTS groan_user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Feature toggles
  show_archetype_context BOOLEAN DEFAULT true,
  outcome_tracking_enabled BOOLEAN DEFAULT true,

  -- Notification preferences
  weekly_reminder_enabled BOOLEAN DEFAULT true,
  follow_up_reminder_enabled BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);

-- ============================================================================
-- WEEKLY PLAN INTEGRATION
-- ============================================================================

-- Add groan_challenge_id to weekly_plans for matrix-selected challenges
ALTER TABLE weekly_plans
ADD COLUMN IF NOT EXISTS groan_challenge_id UUID REFERENCES groan_challenges(id) ON DELETE SET NULL;

-- Update the layer check constraint to use new layers
ALTER TABLE weekly_plans
DROP CONSTRAINT IF EXISTS weekly_plans_weekly_groan_layer_check;

ALTER TABLE weekly_plans
ADD CONSTRAINT weekly_plans_weekly_groan_layer_check
CHECK (weekly_groan_layer IN ('screen', 'live', 'money', 'vulnerable', 'authority'));

-- ============================================================================
-- STORAGE BUCKET FOR SCREENSHOTS
-- ============================================================================

-- Create storage bucket for groan proof screenshots
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'groan-proof',
  'groan-proof',
  false,
  5242880,  -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE groan_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE groan_proof ENABLE ROW LEVEL SECURITY;
ALTER TABLE groan_contract_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE groan_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE groan_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE groan_user_preferences ENABLE ROW LEVEL SECURITY;

-- groan_challenges policies
CREATE POLICY "Users can view own challenges" ON groan_challenges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own challenges" ON groan_challenges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own challenges" ON groan_challenges
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own challenges" ON groan_challenges
  FOR DELETE USING (auth.uid() = user_id);

-- groan_proof policies
CREATE POLICY "Users can view own proof" ON groan_proof
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own proof" ON groan_proof
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own proof" ON groan_proof
  FOR DELETE USING (auth.uid() = user_id);

-- groan_contract_evidence policies
CREATE POLICY "Users can view own contract evidence" ON groan_contract_evidence
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own contract evidence" ON groan_contract_evidence
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- groan_outcomes policies
CREATE POLICY "Users can view own outcomes" ON groan_outcomes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own outcomes" ON groan_outcomes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own outcomes" ON groan_outcomes
  FOR UPDATE USING (auth.uid() = user_id);

-- groan_streaks policies
CREATE POLICY "Users can view own streaks" ON groan_streaks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own streaks" ON groan_streaks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own streaks" ON groan_streaks
  FOR UPDATE USING (auth.uid() = user_id);

-- groan_user_preferences policies
CREATE POLICY "Users can view own preferences" ON groan_user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON groan_user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON groan_user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- Storage policies for groan-proof bucket
CREATE POLICY "Users can upload own proof" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'groan-proof' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own proof" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'groan-proof' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own proof" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'groan-proof' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to calculate essence zone from scary/wahoo scores
CREATE OR REPLACE FUNCTION calculate_essence_zone(scary INTEGER, wahoo INTEGER)
RETURNS essence_zone_type AS $$
BEGIN
  -- High fear (7-10) + High wahoo (7-10) = Essence Zone
  IF scary >= 7 AND wahoo >= 7 THEN
    RETURN 'essence_zone';
  -- High fear (7-10) + Low wahoo (1-4) = Pushed Too Far
  ELSIF scary >= 7 AND wahoo <= 4 THEN
    RETURN 'pushed_too_far';
  -- Low fear (1-4) + High wahoo (7-10) = Hidden Strength
  ELSIF scary <= 4 AND wahoo >= 7 THEN
    RETURN 'hidden_strength';
  -- Low fear (1-4) + Low wahoo (1-4) = Neutral Zone
  ELSIF scary <= 4 AND wahoo <= 4 THEN
    RETURN 'neutral_zone';
  -- Mid fear (5-6) + High wahoo (7-10) = Building Capacity
  ELSIF scary BETWEEN 5 AND 6 AND wahoo >= 7 THEN
    RETURN 'building_capacity';
  -- Default to building capacity for other combinations
  ELSE
    RETURN 'building_capacity';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get week start (Monday) for a given date
CREATE OR REPLACE FUNCTION get_week_start(d DATE)
RETURNS DATE AS $$
BEGIN
  RETURN d - (EXTRACT(ISODOW FROM d) - 1)::INTEGER;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update streak on completion
CREATE OR REPLACE FUNCTION update_groan_streak()
RETURNS TRIGGER AS $$
DECLARE
  current_week DATE;
  last_week DATE;
  streak_record RECORD;
BEGIN
  -- Only trigger on completion
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    current_week := get_week_start(CURRENT_DATE);

    -- Get or create streak record
    SELECT * INTO streak_record FROM groan_streaks WHERE user_id = NEW.user_id;

    IF NOT FOUND THEN
      -- Create new streak record
      INSERT INTO groan_streaks (user_id, current_streak, longest_streak, last_completion_week, total_completed)
      VALUES (NEW.user_id, 1, 1, current_week, 1);
    ELSE
      last_week := streak_record.last_completion_week;

      IF last_week IS NULL OR current_week > last_week + INTERVAL '7 days' THEN
        -- Streak broken, start new
        UPDATE groan_streaks
        SET current_streak = 1,
            last_completion_week = current_week,
            total_completed = total_completed + 1,
            updated_at = NOW()
        WHERE user_id = NEW.user_id;
      ELSIF current_week = last_week + INTERVAL '7 days' THEN
        -- Consecutive week, increment streak
        UPDATE groan_streaks
        SET current_streak = current_streak + 1,
            longest_streak = GREATEST(longest_streak, current_streak + 1),
            last_completion_week = current_week,
            total_completed = total_completed + 1,
            updated_at = NOW()
        WHERE user_id = NEW.user_id;
      ELSIF current_week = last_week THEN
        -- Same week, just increment total
        UPDATE groan_streaks
        SET total_completed = total_completed + 1,
            updated_at = NOW()
        WHERE user_id = NEW.user_id;
      END IF;
    END IF;
  END IF;

  -- Update skipped count
  IF NEW.status = 'skipped' AND OLD.status != 'skipped' THEN
    UPDATE groan_streaks
    SET total_skipped = total_skipped + 1,
        updated_at = NOW()
    WHERE user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for streak updates
DROP TRIGGER IF EXISTS trigger_update_groan_streak ON groan_challenges;
CREATE TRIGGER trigger_update_groan_streak
  AFTER UPDATE ON groan_challenges
  FOR EACH ROW
  EXECUTE FUNCTION update_groan_streak();

-- ============================================================================
-- VIEWS FOR ANALYTICS
-- ============================================================================

-- View: Protective patterns detection (skip patterns by layer)
CREATE OR REPLACE VIEW groan_protective_patterns AS
SELECT
  user_id,
  visibility_layer,
  COUNT(*) FILTER (WHERE status = 'skipped' AND skip_reason = 'too_scary') as scary_skips,
  COUNT(*) FILTER (WHERE status = 'completed') as completions,
  COUNT(*) as total_challenges,
  CASE
    WHEN COUNT(*) FILTER (WHERE status = 'skipped' AND skip_reason = 'too_scary') >= 3
    THEN true ELSE false
  END as has_protective_pattern
FROM groan_challenges
GROUP BY user_id, visibility_layer;

-- View: Revenue attribution by layer
CREATE OR REPLACE VIEW groan_revenue_by_layer AS
SELECT
  gc.user_id,
  gc.visibility_layer,
  COUNT(DISTINCT gc.id) as challenges_completed,
  COUNT(DISTINCT go.id) as outcomes_tracked,
  SUM(CASE WHEN go.outcome_type = 'sale_made' THEN go.revenue_amount ELSE 0 END) as total_revenue,
  COUNT(*) FILTER (WHERE go.outcome_type = 'engagement') as engagement_outcomes,
  COUNT(*) FILTER (WHERE go.outcome_type = 'conversations') as conversation_outcomes,
  COUNT(*) FILTER (WHERE go.outcome_type = 'call_booked') as calls_booked,
  COUNT(*) FILTER (WHERE go.outcome_type = 'sale_made') as sales_made
FROM groan_challenges gc
LEFT JOIN groan_outcomes go ON gc.id = go.challenge_id
WHERE gc.status = 'completed'
GROUP BY gc.user_id, gc.visibility_layer;

-- View: Contract evolution progress
CREATE OR REPLACE VIEW groan_contract_progress AS
SELECT
  user_id,
  contract_text,
  COUNT(*) as evidence_count,
  MIN(created_at) as first_evidence,
  MAX(created_at) as latest_evidence
FROM groan_contract_evidence
GROUP BY user_id, contract_text
ORDER BY evidence_count DESC;

-- View: Essence zone distribution
CREATE OR REPLACE VIEW groan_essence_zones AS
SELECT
  user_id,
  source_type,
  source_value,
  visibility_layer,
  essence_zone_insight,
  COUNT(*) as occurrences
FROM groan_challenges
WHERE essence_zone_insight IS NOT NULL
GROUP BY user_id, source_type, source_value, visibility_layer, essence_zone_insight;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE groan_challenges IS 'Main table for AI-generated groan challenges from Flow Finder matrix';
COMMENT ON TABLE groan_proof IS 'Proof collection for completed groans (links, screenshots)';
COMMENT ON TABLE groan_contract_evidence IS 'Evidence disproving limiting beliefs from NS flow';
COMMENT ON TABLE groan_outcomes IS '48-hour follow-up tracking for business outcomes';
COMMENT ON TABLE groan_streaks IS 'Weekly streak tracking with badges';
COMMENT ON TABLE groan_user_preferences IS 'User preferences for groan features';

COMMENT ON COLUMN groan_challenges.essence_zone_insight IS 'Calculated from scary_score and wahoo_score to indicate alignment with essence';
COMMENT ON COLUMN groan_challenges.stacked_layers IS 'Additional visibility layers this challenge touches beyond primary';
COMMENT ON COLUMN groan_outcomes.deal_id IS 'Reference to CRM deals table when sale is attributed to groan';
