-- Nervous System Safety Boundaries Flow - Database Table
-- Run this in Supabase SQL Editor before testing the flow

CREATE TABLE nervous_system_responses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT,
  user_name TEXT,
  impact_goal TEXT,
  income_goal TEXT,
  positive_change TEXT,
  current_struggle TEXT,
  belief_test_results TEXT,
  reflection_text TEXT,
  context JSONB
);

-- Enable RLS
ALTER TABLE nervous_system_responses ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own data
CREATE POLICY "Users can read own responses"
  ON nervous_system_responses
  FOR SELECT
  USING (auth.uid() = user_id OR auth.jwt()->>'email' = user_email);

-- Policy: Users can insert their own data
CREATE POLICY "Users can insert own responses"
  ON nervous_system_responses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR auth.jwt()->>'email' = user_email);

-- Policy: Users can update their own data
CREATE POLICY "Users can update own responses"
  ON nervous_system_responses
  FOR UPDATE
  USING (auth.uid() = user_id OR auth.jwt()->>'email' = user_email);
