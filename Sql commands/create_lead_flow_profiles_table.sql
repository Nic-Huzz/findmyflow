-- Migration: Create lead_flow_profiles table
-- Description: Stores user data from the lead magnet flow (essence & protective archetypes)
-- Date: 2025-01-12

-- Create the lead_flow_profiles table
CREATE TABLE IF NOT EXISTS public.lead_flow_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Session and identity
  session_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  user_name TEXT,

  -- Essence archetype (now collected FIRST in reordered flow)
  essence_archetype TEXT,           -- The selected essence archetype
  essence_confirm TEXT,              -- "yes" or "no" - confirmation response

  -- Protective archetype (now collected SECOND in reordered flow)
  protective_archetype TEXT,         -- The selected protective archetype
  protective_confirm TEXT,           -- "yes" or "no" - confirmation response

  -- Persona (collected last)
  persona TEXT,                      -- "Vibe Seeker", "Vibe Riser", or "Movement Maker"

  -- Full context (stores entire flow state)
  context JSONB,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_lead_flow_profiles_user_id ON public.lead_flow_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_lead_flow_profiles_email ON public.lead_flow_profiles(email);
CREATE INDEX IF NOT EXISTS idx_lead_flow_profiles_session_id ON public.lead_flow_profiles(session_id);
CREATE INDEX IF NOT EXISTS idx_lead_flow_profiles_created_at ON public.lead_flow_profiles(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.lead_flow_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Policy: Users can view their own profiles
CREATE POLICY "Users can view own lead flow profiles"
  ON public.lead_flow_profiles
  FOR SELECT
  USING (auth.uid() = user_id OR email = auth.jwt()->>'email');

-- Policy: Anyone can insert (for anonymous lead magnet submissions)
CREATE POLICY "Anyone can insert lead flow profiles"
  ON public.lead_flow_profiles
  FOR INSERT
  WITH CHECK (true);

-- Policy: Users can update their own profiles
CREATE POLICY "Users can update own lead flow profiles"
  ON public.lead_flow_profiles
  FOR UPDATE
  USING (auth.uid() = user_id OR email = auth.jwt()->>'email')
  WITH CHECK (auth.uid() = user_id OR email = auth.jwt()->>'email');

-- Policy: Users can delete their own profiles
CREATE POLICY "Users can delete own lead flow profiles"
  ON public.lead_flow_profiles
  FOR DELETE
  USING (auth.uid() = user_id OR email = auth.jwt()->>'email');

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_lead_flow_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to call the function before updates
CREATE TRIGGER set_lead_flow_profiles_updated_at
  BEFORE UPDATE ON public.lead_flow_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_lead_flow_profiles_updated_at();

-- Grant permissions
GRANT ALL ON public.lead_flow_profiles TO authenticated;
GRANT ALL ON public.lead_flow_profiles TO anon;
GRANT ALL ON public.lead_flow_profiles TO service_role;

COMMENT ON TABLE public.lead_flow_profiles IS 'Stores user data from the lead magnet flow including essence archetype, protective archetype, and persona selection';
