-- Track users who express interest in the CRM feature
CREATE TABLE IF NOT EXISTS crm_interest (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expressed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE crm_interest ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own interest"
  ON crm_interest FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own interest"
  ON crm_interest FOR SELECT
  USING (auth.uid() = user_id);
