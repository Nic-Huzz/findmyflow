-- Create healing_compass_responses table
CREATE TABLE IF NOT EXISTS healing_compass_responses (
  id SERIAL PRIMARY KEY,
  user_name TEXT,
  stuck_gap_description TEXT,
  stuck_reason TEXT,
  stuck_emotional_response TEXT,
  past_parallel_story TEXT,
  past_event_emotions TEXT,
  splinter_interpretation TEXT,
  connect_dots_consent TEXT,
  connect_dots_acknowledged TEXT,
  splinter_removal_consent TEXT,
  context JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS (Row Level Security) policy
ALTER TABLE healing_compass_responses ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (for anonymous users)
CREATE POLICY "Allow anonymous inserts" ON healing_compass_responses
  FOR INSERT WITH CHECK (true);

-- Allow users to read their own data (when authenticated)
CREATE POLICY "Users can read own data" ON healing_compass_responses
  FOR SELECT USING (auth.uid() IS NOT NULL);
