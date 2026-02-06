-- Events Table
-- Stores analytics events from analytics.js
-- Fixes mismatch where code references 'events' but table didn't exist

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Event identification
  name TEXT NOT NULL,
  session_id TEXT NOT NULL,

  -- Event data (flexible JSONB for any payload)
  payload JSONB DEFAULT '{}',

  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_events_name ON events(name);
CREATE INDEX IF NOT EXISTS idx_events_session_id ON events(session_id);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_name_created ON events(name, created_at DESC);

-- RLS - Allow anonymous inserts (for pre-signup tracking)
-- but restrict reads to authenticated service role
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Anyone can insert events (including anonymous users before signup)
DO $$ BEGIN
  CREATE POLICY "Anyone can insert events"
    ON events FOR INSERT
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Only service role can read events (for analytics dashboards)
DO $$ BEGIN
  CREATE POLICY "Service role can read events"
    ON events FOR SELECT
    USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Comments for documentation
COMMENT ON TABLE events IS 'Analytics events for funnel tracking and engagement metrics';
COMMENT ON COLUMN events.name IS 'Event type: leadmagnet_start, leadmagnet_complete, email_submitted, account_created, profile_view, weekly_plan_started, weekly_plan_completed, groan_completed, morning_routine_completed';
COMMENT ON COLUMN events.session_id IS 'Browser session ID from localStorage (persists across page loads)';
COMMENT ON COLUMN events.payload IS 'Event-specific data (variantId, emailHash, userId, weekType, etc.)';
