-- Weekly Healing Intentions
-- Tracks weekly intention + felt body state (start and end of week)

CREATE TABLE IF NOT EXISTS weekly_healing_intentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  intention_text TEXT NOT NULL,

  -- Start-of-week splinter state
  start_location TEXT,
  start_shape TEXT,
  start_color TEXT,
  start_intensity INTEGER CHECK (start_intensity >= 1 AND start_intensity <= 10),

  -- End-of-week check-in
  end_location TEXT,
  end_shape TEXT,
  end_color TEXT,
  end_intensity INTEGER CHECK (end_intensity >= 1 AND end_intensity <= 10),
  end_reflection TEXT,
  checked_in_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, week_start_date)
);

-- RLS
ALTER TABLE weekly_healing_intentions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own healing intentions"
  ON weekly_healing_intentions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own healing intentions"
  ON weekly_healing_intentions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own healing intentions"
  ON weekly_healing_intentions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX idx_healing_intentions_user_week
  ON weekly_healing_intentions(user_id, week_start_date);
