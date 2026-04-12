-- Track users who express interest in business scale support
CREATE TABLE IF NOT EXISTS business_scale_interest (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expressed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE business_scale_interest ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own business scale interest"
  ON business_scale_interest FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own business scale interest"
  ON business_scale_interest FOR SELECT
  USING (auth.uid() = user_id);
