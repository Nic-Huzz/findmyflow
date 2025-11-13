-- Migration: Create nervous_system_profiles table
-- Description: Stores responses from the Nervous System Safety Boundaries flow
-- Date: 2025-01-12

-- Create the nervous_system_profiles table
CREATE TABLE IF NOT EXISTS public.nervous_system_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,

  -- Vision questions (stage 3)
  impact_goal TEXT,                    -- e.g., "100000+", "10000+", "1000+", "100+"
  income_goal TEXT,                    -- e.g., "1000000+", "500000+", "100000+"
  positive_change TEXT,                -- User's description of positive change they want to create
  struggle_area TEXT,                  -- Where they're struggling most

  -- Triage results (stage 4)
  triage_safe_being_seen TEXT,        -- "yes" or "no"
  triage_safe_earning TEXT,            -- "yes" or "no"
  triage_safe_pursuing TEXT,           -- "yes" or "no"
  triage_self_sabotage TEXT,           -- "yes" or "no"
  triage_feels_unsafe TEXT,            -- "yes" or "no"

  -- Belief test results (stage 5)
  belief_test_results JSONB,           -- Array/object of belief test results

  -- Pattern reflection (stage 6)
  pattern_mirrored TEXT,               -- The pattern/archetype identified
  shift_consent TEXT,                  -- "yes" or "no" - whether they want to shift

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_nervous_system_profiles_user_id ON public.nervous_system_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_nervous_system_profiles_email ON public.nervous_system_profiles(email);
CREATE INDEX IF NOT EXISTS idx_nervous_system_profiles_created_at ON public.nervous_system_profiles(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.nervous_system_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Policy: Users can view their own nervous system profiles
CREATE POLICY "Users can view own nervous system profiles"
  ON public.nervous_system_profiles
  FOR SELECT
  USING (auth.uid() = user_id OR email = auth.jwt()->>'email');

-- Policy: Users can insert their own nervous system profiles
CREATE POLICY "Users can insert own nervous system profiles"
  ON public.nervous_system_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR email = auth.jwt()->>'email');

-- Policy: Users can update their own nervous system profiles
CREATE POLICY "Users can update own nervous system profiles"
  ON public.nervous_system_profiles
  FOR UPDATE
  USING (auth.uid() = user_id OR email = auth.jwt()->>'email')
  WITH CHECK (auth.uid() = user_id OR email = auth.jwt()->>'email');

-- Policy: Users can delete their own nervous system profiles
CREATE POLICY "Users can delete own nervous system profiles"
  ON public.nervous_system_profiles
  FOR DELETE
  USING (auth.uid() = user_id OR email = auth.jwt()->>'email');

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_nervous_system_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to call the function before updates
CREATE TRIGGER set_nervous_system_profiles_updated_at
  BEFORE UPDATE ON public.nervous_system_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_nervous_system_profiles_updated_at();

-- Grant permissions
GRANT ALL ON public.nervous_system_profiles TO authenticated;
GRANT ALL ON public.nervous_system_profiles TO service_role;

COMMENT ON TABLE public.nervous_system_profiles IS 'Stores user responses from the Nervous System Safety Boundaries flow, including vision goals, triage results, and belief test outcomes';
