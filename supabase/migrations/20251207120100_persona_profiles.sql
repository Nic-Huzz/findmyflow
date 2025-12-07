-- ============================================================================
-- Persona Profiles Table for Persona Selection Flow
-- Description: Stores customer persona profiles built from the flow
-- ============================================================================

CREATE TABLE IF NOT EXISTS persona_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Selected profile details
  persona TEXT NOT NULL,
  problem TEXT NOT NULL,

  -- Question answers
  pain_level INTEGER NOT NULL CHECK (pain_level >= 1 AND pain_level <= 10),
  problem_area TEXT NOT NULL CHECK (problem_area IN ('improving_health', 'increasing_wealth', 'loving_life')),
  income_level TEXT NOT NULL CHECK (income_level IN ('$0–$25k', '$25k–$50k', '$50k–$100k', '$100k–$250k', '$250k+')),
  financial_sunk_cost TEXT NOT NULL,
  time_sunk_cost TEXT NOT NULL,
  emotion TEXT NOT NULL,

  -- All profiles created (JSONB array of profile objects)
  all_profiles JSONB NOT NULL DEFAULT '[]',
  selected_profile_id INTEGER NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_persona_profiles_user ON persona_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_persona_profiles_created ON persona_profiles(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE persona_profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profiles
CREATE POLICY "Users can view own persona profiles" ON persona_profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own profiles
CREATE POLICY "Users can insert own persona profiles" ON persona_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own profiles
CREATE POLICY "Users can update own persona profiles" ON persona_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own profiles
CREATE POLICY "Users can delete own persona profiles" ON persona_profiles
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE TRIGGER update_persona_profiles_updated_at
  BEFORE UPDATE ON persona_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
