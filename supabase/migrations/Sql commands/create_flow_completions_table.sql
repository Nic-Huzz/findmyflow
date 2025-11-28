-- Create flow_completions table
-- Tracks which flows (Healing Compass, Nikigai, etc.) users have completed

CREATE TABLE IF NOT EXISTS flow_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  flow_id TEXT NOT NULL,  -- 'healing_compass', 'nikigai', 'spiral_dynamics', etc.
  challenge_instance_id UUID,  -- NULL if completed outside of a challenge
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Foreign key to link to challenge if part of one
  CONSTRAINT fk_flow_challenge
    FOREIGN KEY (user_id, challenge_instance_id)
    REFERENCES challenge_progress(user_id, challenge_instance_id)
    ON DELETE SET NULL,

  -- Unique constraint: one completion per flow per challenge instance
  -- Allows completing same flow in different challenge instances
  CONSTRAINT unique_flow_per_instance
    UNIQUE(user_id, flow_id, challenge_instance_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_flow_completions_user_flow
  ON flow_completions(user_id, flow_id);

-- Enable Row Level Security
ALTER TABLE flow_completions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own flow completions
CREATE POLICY "Users can view their own flow completions"
  ON flow_completions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own flow completions
CREATE POLICY "Users can insert their own flow completions"
  ON flow_completions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Comments for documentation
COMMENT ON TABLE flow_completions IS 'Tracks completion of interactive flows (Healing Compass, Nikigai, etc.) and links them to challenge quests';
COMMENT ON COLUMN flow_completions.flow_id IS 'Identifier for the flow: healing_compass, nikigai, spiral_dynamics, etc.';
COMMENT ON COLUMN flow_completions.challenge_instance_id IS 'Links to a specific challenge instance if completed as part of a challenge (NULL if completed independently)';
