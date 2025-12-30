-- Zarlo Conversations Table
-- Tracks user's Zarlo state, primary struggle, and accountability commitments

CREATE TABLE IF NOT EXISTS zarlo_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Current conversation state
  current_flow TEXT,                    -- 'intake', 'accountability', 'progress', 'routing'
  current_step TEXT,                    -- Step within the flow

  -- User context (gathered from intake)
  primary_struggle TEXT,                -- 'visibility', 'starting_stopping', 'unclear', 'burnout', 'existing_project'
  secondary_context TEXT,               -- Follow-up answer for more detail

  -- Accountability tracking
  last_commitment TEXT,                 -- What they said they'd do
  last_commitment_date TIMESTAMP WITH TIME ZONE,
  commitment_completed BOOLEAN DEFAULT FALSE,
  commitment_outcome TEXT,              -- 'completed', 'partial', 'skipped', 'resistance'

  -- Interaction tracking
  last_interaction_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_interactions INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_zarlo_user ON zarlo_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_zarlo_last_interaction ON zarlo_conversations(last_interaction_at);

-- RLS Policy
ALTER TABLE zarlo_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own Zarlo data"
  ON zarlo_conversations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own Zarlo data"
  ON zarlo_conversations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own Zarlo data"
  ON zarlo_conversations
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_zarlo_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER zarlo_conversations_updated_at
  BEFORE UPDATE ON zarlo_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_zarlo_updated_at();
