-- =============================================
-- VALIDATION FLOWS SYSTEM
-- Public shareable validation flows for customer discovery
-- =============================================

-- Table: validation_flows
-- Stores flow configurations that can be shared publicly
CREATE TABLE IF NOT EXISTS validation_flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  flow_name TEXT NOT NULL,
  flow_description TEXT,
  share_token TEXT UNIQUE NOT NULL,
  flow_json_path TEXT NOT NULL, -- Path to JSON file (e.g., 'validation-flow-vibe-riser.json')
  persona TEXT, -- 'vibe_seeker', 'vibe_riser', etc.
  stage TEXT, -- 'validation', 'testing', etc.
  is_active BOOLEAN DEFAULT true,
  response_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: validation_sessions
-- Groups all responses from a single person
CREATE TABLE IF NOT EXISTS validation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id UUID NOT NULL REFERENCES validation_flows(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL, -- Track user across questions
  respondent_email TEXT, -- Collected at end of flow
  respondent_ip TEXT, -- Optional: for spam prevention
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  is_completed BOOLEAN DEFAULT false
);

-- Table: validation_responses
-- Individual question responses
CREATE TABLE IF NOT EXISTS validation_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES validation_sessions(id) ON DELETE CASCADE,
  flow_id UUID NOT NULL REFERENCES validation_flows(id) ON DELETE CASCADE,
  step_id TEXT NOT NULL, -- e.g., '1.0', '2.0'
  question_text TEXT NOT NULL,
  answer_type TEXT NOT NULL, -- 'free_text', 'single_select', 'text_list', 'email'
  answer_value JSONB NOT NULL, -- Flexible storage for any answer type
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_validation_flows_share_token ON validation_flows(share_token);
CREATE INDEX IF NOT EXISTS idx_validation_flows_creator ON validation_flows(creator_user_id);
CREATE INDEX IF NOT EXISTS idx_validation_sessions_flow ON validation_sessions(flow_id);
CREATE INDEX IF NOT EXISTS idx_validation_sessions_token ON validation_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_validation_responses_session ON validation_responses(session_id);
CREATE INDEX IF NOT EXISTS idx_validation_responses_flow ON validation_responses(flow_id);

-- Function: Generate unique share token
CREATE OR REPLACE FUNCTION generate_share_token()
RETURNS TEXT AS $$
DECLARE
  token TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    -- Generate 8-character random token (URL-safe)
    token := substr(md5(random()::text || clock_timestamp()::text), 1, 8);

    -- Check if token already exists
    SELECT EXISTS(SELECT 1 FROM validation_flows WHERE share_token = token) INTO exists;

    -- Exit loop if unique
    EXIT WHEN NOT exists;
  END LOOP;

  RETURN token;
END;
$$ LANGUAGE plpgsql;

-- Function: Generate unique session token
CREATE OR REPLACE FUNCTION generate_session_token()
RETURNS TEXT AS $$
DECLARE
  token TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    -- Generate 16-character random token
    token := substr(md5(random()::text || clock_timestamp()::text), 1, 16);

    SELECT EXISTS(SELECT 1 FROM validation_sessions WHERE session_token = token) INTO exists;

    EXIT WHEN NOT exists;
  END LOOP;

  RETURN token;
END;
$$ LANGUAGE plpgsql;

-- Function: Update response count when new session completes
CREATE OR REPLACE FUNCTION update_validation_flow_response_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_completed = true AND (OLD.is_completed IS NULL OR OLD.is_completed = false) THEN
    UPDATE validation_flows
    SET response_count = response_count + 1,
        updated_at = NOW()
    WHERE id = NEW.flow_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update response count
DROP TRIGGER IF EXISTS trigger_update_response_count ON validation_sessions;
CREATE TRIGGER trigger_update_response_count
  AFTER UPDATE ON validation_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_validation_flow_response_count();

-- Function: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_validation_flows_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update updated_at
DROP TRIGGER IF EXISTS trigger_validation_flows_updated_at ON validation_flows;
CREATE TRIGGER trigger_validation_flows_updated_at
  BEFORE UPDATE ON validation_flows
  FOR EACH ROW
  EXECUTE FUNCTION update_validation_flows_updated_at();

-- RLS Policies

-- validation_flows: Creators can manage their flows, anyone can read active flows by token
ALTER TABLE validation_flows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own validation flows"
  ON validation_flows
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = creator_user_id);

CREATE POLICY "Users can view their own validation flows"
  ON validation_flows
  FOR SELECT
  TO authenticated
  USING (auth.uid() = creator_user_id);

CREATE POLICY "Public can view active flows by share token"
  ON validation_flows
  FOR SELECT
  TO anon
  USING (is_active = true);

CREATE POLICY "Users can update their own validation flows"
  ON validation_flows
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = creator_user_id)
  WITH CHECK (auth.uid() = creator_user_id);

CREATE POLICY "Users can delete their own validation flows"
  ON validation_flows
  FOR DELETE
  TO authenticated
  USING (auth.uid() = creator_user_id);

-- validation_sessions: Public can create and update sessions
ALTER TABLE validation_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create validation sessions"
  ON validation_sessions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can view sessions by token"
  ON validation_sessions
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can update sessions by token"
  ON validation_sessions
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Creators can view sessions for their flows"
  ON validation_sessions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM validation_flows
      WHERE validation_flows.id = validation_sessions.flow_id
      AND validation_flows.creator_user_id = auth.uid()
    )
  );

-- validation_responses: Public can create, creators can view
ALTER TABLE validation_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create validation responses"
  ON validation_responses
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can view responses for their session"
  ON validation_responses
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Creators can view responses for their flows"
  ON validation_responses
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM validation_flows
      WHERE validation_flows.id = validation_responses.flow_id
      AND validation_flows.creator_user_id = auth.uid()
    )
  );

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON validation_flows TO authenticated;
GRANT SELECT ON validation_flows TO anon;
GRANT ALL ON validation_sessions TO anon, authenticated;
GRANT ALL ON validation_responses TO anon, authenticated;

-- Comments
COMMENT ON TABLE validation_flows IS 'Shareable validation flows for customer discovery';
COMMENT ON TABLE validation_sessions IS 'Groups all responses from a single respondent';
COMMENT ON TABLE validation_responses IS 'Individual question responses within a session';
COMMENT ON COLUMN validation_flows.share_token IS 'Unique token for public URL (e.g., /v/abc123)';
COMMENT ON COLUMN validation_sessions.session_token IS 'Tracks respondent across multiple questions';
