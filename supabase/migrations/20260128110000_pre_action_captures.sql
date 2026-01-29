-- PRE-ACTION Captures Table
-- Stores resistance patterns captured before users begin tasks
-- Part of the Action Loop methodology (PRE-ACTION → Action → POST-ACTION)

CREATE TABLE IF NOT EXISTS pre_action_captures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  flow_type TEXT,
  feeling TEXT NOT NULL CHECK (feeling IN ('excited', 'neutral', 'hesitant', 'resistant')),
  visibility_layer TEXT CHECK (visibility_layer IN ('screen', 'live', 'vulnerable', 'money', 'authority')),
  protective_voice TEXT CHECK (protective_voice IN ('perfectionist', 'people_pleaser', 'controller', 'performer', 'ghost')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for user queries
CREATE INDEX idx_pre_action_captures_user_id ON pre_action_captures(user_id);
CREATE INDEX idx_pre_action_captures_action_type ON pre_action_captures(action_type);
CREATE INDEX idx_pre_action_captures_created_at ON pre_action_captures(created_at);

-- RLS policies
ALTER TABLE pre_action_captures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own pre-action captures"
  ON pre_action_captures FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pre-action captures"
  ON pre_action_captures FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT ON pre_action_captures TO authenticated;
