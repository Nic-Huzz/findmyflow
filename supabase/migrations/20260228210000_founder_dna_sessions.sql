-- Repeatable "Get Unstuck" sessions for Founder DNA
-- Each session = stuck point selection → AI diagnostic → challenge delivery → rating
-- Multiple sessions per user (founder match is done once, getting unstuck is repeatable)

CREATE TABLE IF NOT EXISTS founder_dna_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,

  -- Context (from founder_dna_results)
  matched_founder TEXT NOT NULL,
  dna_code TEXT NOT NULL,

  -- Session-specific (user picks each time)
  stuck_point_id INTEGER NOT NULL,
  stuck_point_name TEXT NOT NULL,
  follow_up_qa JSONB,                -- [{question, answer}] full text
  open_text TEXT,

  -- AI Diagnostic
  ai_exchanges JSONB,                -- [{role, content, options?}]
  ai_diagnosis TEXT,

  -- Challenge Delivery
  challenge_type TEXT,                -- DO_IT | CUT_IT | THINK_IT | MAKE_IT
  challenge_mirror TEXT,              -- founder story ("feel seen")
  challenge_bridge TEXT,              -- principle/philosophy ("feel inspired")
  challenge_action TEXT,              -- the ONE thing to try ("feel activated")

  -- Rating (filled when user returns to rate)
  resistance_rating SMALLINT CHECK (resistance_rating BETWEEN 1 AND 5),
  engagement_rating SMALLINT CHECK (engagement_rating BETWEEN 1 AND 5),
  shift_rating SMALLINT CHECK (shift_rating BETWEEN 1 AND 5),
  rated_at TIMESTAMPTZ,

  -- Status tracking
  status TEXT DEFAULT 'diagnostic'
    CHECK (status IN ('diagnostic', 'active', 'completed', 'abandoned')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fast lookup for user's sessions
CREATE INDEX IF NOT EXISTS idx_dna_sessions_user ON founder_dna_sessions(user_id);

-- Fast lookup for active challenge (dashboard needs this)
CREATE INDEX IF NOT EXISTS idx_dna_sessions_active ON founder_dna_sessions(user_id, status)
  WHERE status = 'active';

-- RLS
ALTER TABLE founder_dna_sessions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'founder_dna_sessions' AND policyname = 'Users can view own sessions') THEN
    CREATE POLICY "Users can view own sessions" ON founder_dna_sessions FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'founder_dna_sessions' AND policyname = 'Users can insert own sessions') THEN
    CREATE POLICY "Users can insert own sessions" ON founder_dna_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'founder_dna_sessions' AND policyname = 'Users can update own sessions') THEN
    CREATE POLICY "Users can update own sessions" ON founder_dna_sessions FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;
