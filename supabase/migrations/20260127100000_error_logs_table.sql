-- ============================================================================
-- Error Logs Table
-- Date: 2026-01-27
-- Description: Captures client-side errors for support and debugging
-- ============================================================================

CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User context (nullable for unauthenticated users)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,

  -- Error details
  error_type TEXT NOT NULL,           -- 'save_failed', 'network_error', 'validation_error', etc.
  error_code TEXT,                    -- Supabase/Postgres error code like '23505'
  error_message TEXT NOT NULL,

  -- Context
  component TEXT NOT NULL,            -- 'MoneyModelFlow', 'QuickCapture', 'ChallengeGroup', etc.
  action TEXT,                        -- 'insert_assessment', 'join_group', etc.
  page_url TEXT,

  -- Additional data
  metadata JSONB DEFAULT '{}',        -- Any extra context (product name, flow type, etc.)

  -- Support tracking
  support_requested BOOLEAN DEFAULT FALSE,
  support_resolved BOOLEAN DEFAULT FALSE,
  support_notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying recent errors
CREATE INDEX IF NOT EXISTS idx_error_logs_created ON error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_user ON error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_type ON error_logs(error_type);
CREATE INDEX IF NOT EXISTS idx_error_logs_unresolved ON error_logs(support_requested, support_resolved)
  WHERE support_requested = true AND support_resolved = false;

-- RLS - Users can insert their own errors, only admin can read all
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Anyone can insert errors (including unauthenticated for public flows)
CREATE POLICY "Anyone can log errors"
  ON error_logs FOR INSERT
  WITH CHECK (true);

-- Users can view their own errors
CREATE POLICY "Users can view own errors"
  ON error_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Grant access
GRANT INSERT ON error_logs TO anon;
GRANT INSERT ON error_logs TO authenticated;
GRANT SELECT ON error_logs TO authenticated;

COMMENT ON TABLE error_logs IS 'Client-side error logging for support and debugging. Includes WhatsApp support request tracking.';
