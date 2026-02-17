-- Earthquake Quiz lead magnet — stores quiz responses and computed results
CREATE TABLE earthquake_quiz_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  name TEXT,

  -- Raw answers
  q1_stage TEXT NOT NULL,
  q2_first_reaction JSONB NOT NULL DEFAULT '[]',   -- array, multi-select
  q3_behavioral JSONB NOT NULL DEFAULT '[]',   -- array, multi-select
  q4_real_reason JSONB NOT NULL DEFAULT '[]',  -- array, multi-select
  q5_chest_tightens JSONB NOT NULL DEFAULT '[]', -- array, multi-select
  q6_tried_so_far JSONB NOT NULL DEFAULT '[]',   -- array, multi-select
  q7_resonates JSONB NOT NULL DEFAULT '[]',  -- array, multi-select
  q8_course_count TEXT NOT NULL,
  q9_emotional_state TEXT,                          -- emotional frequency: acceptance/courage/fear/anger/shame/apathy

  -- Computed results
  primary_voice TEXT NOT NULL,
  voice_scores JSONB NOT NULL,
  awakening_stage TEXT NOT NULL,
  primary_block TEXT NOT NULL,
  language_level JSONB DEFAULT '[]',

  -- Tracking
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  referrer TEXT,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  converted_to_signup BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for email lookups and dedup
CREATE INDEX idx_earthquake_email ON earthquake_quiz_leads(email);

-- RLS: anyone can insert (public quiz), no read/update/delete for anon
ALTER TABLE earthquake_quiz_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone_can_insert" ON earthquake_quiz_leads
  FOR INSERT TO public WITH CHECK (true);
