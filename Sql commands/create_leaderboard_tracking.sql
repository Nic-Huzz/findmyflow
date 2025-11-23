-- Create table to track user rankings over time
CREATE TABLE IF NOT EXISTS public.leaderboard_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rank INTEGER NOT NULL,
  total_points INTEGER NOT NULL,
  leaderboard_type TEXT NOT NULL DEFAULT 'weekly', -- 'weekly' or 'alltime'
  group_id TEXT, -- null for global leaderboard
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Index for efficient querying
  CONSTRAINT unique_user_snapshot UNIQUE (user_id, leaderboard_type, group_id, created_at)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_leaderboard_snapshots_user
  ON public.leaderboard_snapshots(user_id, leaderboard_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_leaderboard_snapshots_group
  ON public.leaderboard_snapshots(group_id, created_at DESC)
  WHERE group_id IS NOT NULL;

-- Enable RLS
ALTER TABLE public.leaderboard_snapshots ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own snapshots
CREATE POLICY "Users can view own snapshots"
  ON public.leaderboard_snapshots
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Service role can insert/update snapshots
CREATE POLICY "Service role can manage snapshots"
  ON public.leaderboard_snapshots
  FOR ALL
  USING (auth.role() = 'service_role');

COMMENT ON TABLE public.leaderboard_snapshots IS 'Tracks historical leaderboard rankings to detect overtakes';
