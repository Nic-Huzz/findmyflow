-- Add experience_id to flow_sessions for per-event module tracking
-- Allows the same flow (e.g. attraction_offer) to be completed once per experience
ALTER TABLE flow_sessions
ADD COLUMN IF NOT EXISTS experience_id UUID REFERENCES experiences(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_flow_sessions_experience_id ON flow_sessions(experience_id) WHERE experience_id IS NOT NULL;
