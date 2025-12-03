-- ============================================================================
-- Persona System Schema
-- Version: 1.0
-- Description: Schema for persona assessment, stage tracking, and user journey
-- ============================================================================

-- ============================================================================
-- 1. PERSONA ASSESSMENTS TABLE
-- Stores responses from the 3-question persona assessment
-- ============================================================================

CREATE TABLE IF NOT EXISTS persona_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID,  -- For anonymous users before signup
  email TEXT,  -- Captured during assessment

  -- Assessment responses
  responses JSONB NOT NULL DEFAULT '{}',
  -- Example: { "q1_journey": { "value": "seeker", "persona": "vibe_seeker", "label": "Searching..." } }

  -- Result
  assigned_persona TEXT NOT NULL,
  confidence_score DECIMAL(3,2),  -- 1.0 = all 3 match, 0.67 = 2 match, 0.33 = split

  -- Metadata
  source TEXT DEFAULT 'homepage',  -- Where they took the assessment
  ip_address TEXT,
  user_agent TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_persona CHECK (assigned_persona IN ('vibe_seeker', 'vibe_riser', 'movement_maker')),
  CONSTRAINT valid_confidence CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1))
);

-- ============================================================================
-- 2. USER PROFILES TABLE (extends auth.users)
-- Main table for tracking user persona and stage
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Persona & Stage
  persona TEXT,
  stage TEXT DEFAULT 'validation',
  persona_assigned_at TIMESTAMPTZ,
  stage_promoted_at TIMESTAMPTZ,

  -- Profile info
  display_name TEXT,
  avatar_url TEXT,

  -- Flow completions
  nikigai_completed BOOLEAN DEFAULT FALSE,
  offer_completed BOOLEAN DEFAULT FALSE,
  money_model_completed BOOLEAN DEFAULT FALSE,
  leads_completed BOOLEAN DEFAULT FALSE,

  -- Challenge stats
  challenges_completed INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,

  -- Settings
  notifications_enabled BOOLEAN DEFAULT TRUE,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_user_persona CHECK (persona IS NULL OR persona IN ('vibe_seeker', 'vibe_riser', 'movement_maker')),
  CONSTRAINT valid_stage CHECK (stage IS NULL OR stage IN ('validation', 'creation', 'testing', 'scaling'))
);

-- ============================================================================
-- 3. STAGE GRADUATIONS TABLE
-- Track when users graduate from one stage to the next
-- ============================================================================

CREATE TABLE IF NOT EXISTS stage_graduations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Transition info
  from_persona TEXT,
  to_persona TEXT,
  from_stage TEXT,
  to_stage TEXT,

  -- What triggered the graduation
  trigger_type TEXT NOT NULL,  -- 'challenge_completion', 'flow_completion', 'manual'
  trigger_id UUID,  -- Reference to the challenge or flow that triggered it

  -- Evidence/submission
  submission JSONB,  -- What they submitted for graduation

  -- Timestamps
  graduated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_trigger CHECK (trigger_type IN ('challenge_completion', 'flow_completion', 'manual', 'assessment'))
);

-- ============================================================================
-- 4. INDEXES
-- ============================================================================

-- Persona assessments
CREATE INDEX IF NOT EXISTS idx_persona_assessments_email ON persona_assessments(email);
CREATE INDEX IF NOT EXISTS idx_persona_assessments_session ON persona_assessments(session_id);
CREATE INDEX IF NOT EXISTS idx_persona_assessments_user ON persona_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_persona_assessments_created ON persona_assessments(created_at DESC);

-- User profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_persona ON user_profiles(persona);
CREATE INDEX IF NOT EXISTS idx_user_profiles_stage ON user_profiles(stage);

-- Stage graduations
CREATE INDEX IF NOT EXISTS idx_stage_graduations_user ON stage_graduations(user_id);
CREATE INDEX IF NOT EXISTS idx_stage_graduations_date ON stage_graduations(graduated_at DESC);

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE persona_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stage_graduations ENABLE ROW LEVEL SECURITY;

-- Persona assessments policies
CREATE POLICY "Users can view own assessments" ON persona_assessments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can insert assessments" ON persona_assessments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own assessments" ON persona_assessments
  FOR UPDATE USING (auth.uid() = user_id);

-- User profiles policies
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Stage graduations policies
CREATE POLICY "Users can view own graduations" ON stage_graduations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own graduations" ON stage_graduations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 6. TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 7. HELPER FUNCTIONS
-- ============================================================================

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, created_at)
  VALUES (NEW.id, NOW())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Function to link persona assessment to user after signup
CREATE OR REPLACE FUNCTION link_assessment_to_user(
  p_user_id UUID,
  p_email TEXT
)
RETURNS VOID AS $$
DECLARE
  v_assessment RECORD;
BEGIN
  -- Find the most recent assessment for this email
  SELECT * INTO v_assessment
  FROM persona_assessments
  WHERE email = LOWER(p_email)
    AND user_id IS NULL
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_assessment.id IS NOT NULL THEN
    -- Link assessment to user
    UPDATE persona_assessments
    SET user_id = p_user_id
    WHERE id = v_assessment.id;

    -- Update user profile with persona
    UPDATE user_profiles
    SET
      persona = v_assessment.assigned_persona,
      persona_assigned_at = NOW(),
      stage = 'validation'
    WHERE id = p_user_id;

    -- Record the graduation
    INSERT INTO stage_graduations (user_id, to_persona, to_stage, trigger_type)
    VALUES (p_user_id, v_assessment.assigned_persona, 'validation', 'assessment');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 8. UPDATE EXISTING LEAD_FLOW_PROFILES (optional migration)
-- Add persona field mapping to new system
-- ============================================================================

-- Add column to map old personas to new system if needed
-- ALTER TABLE lead_flow_profiles ADD COLUMN IF NOT EXISTS persona_v2 TEXT;

-- Migration query (run manually if needed):
-- UPDATE lead_flow_profiles
-- SET persona_v2 = CASE
--   WHEN persona = 'Vibe Seeker' THEN 'vibe_seeker'
--   WHEN persona = 'Vibe Riser' THEN 'vibe_riser'
--   WHEN persona = 'Movement Maker' THEN 'movement_maker'
--   ELSE NULL
-- END;
