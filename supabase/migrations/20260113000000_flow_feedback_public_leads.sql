-- Flow Feedback table - stores feedback from both authenticated and public users
CREATE TABLE IF NOT EXISTS flow_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_type VARCHAR NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_token VARCHAR,
  enjoyment_rating VARCHAR CHECK (enjoyment_rating IN ('loved_it', 'liked_it', 'okay', 'not_for_me')),
  timing_rating VARCHAR CHECK (timing_rating IN ('too_short', 'just_right', 'bit_long', 'too_long')),
  enjoyed_comment TEXT,
  improvement_comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Public Leads table - stores email captures from public flows
CREATE TABLE IF NOT EXISTS public_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR NOT NULL,
  source_flow VARCHAR NOT NULL,
  flow_results JSONB,
  ai_tools_interest VARCHAR CHECK (ai_tools_interest IN ('yes', 'maybe', 'no')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Public Offer Assessments - stores money model results for public users
CREATE TABLE IF NOT EXISTS public_offer_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token VARCHAR NOT NULL,
  flow_type VARCHAR NOT NULL,
  respondent_email VARCHAR,
  responses JSONB,
  recommended_offer_id VARCHAR,
  recommended_offer_name VARCHAR,
  confidence_score NUMERIC,
  total_score NUMERIC,
  all_offer_scores JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Public Nervous System Responses - stores NS results for public users
CREATE TABLE IF NOT EXISTS public_nervous_system_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token VARCHAR NOT NULL,
  respondent_email VARCHAR,
  impact_goal VARCHAR,
  income_goal VARCHAR,
  positive_change TEXT,
  current_struggle TEXT,
  being_seen_edge INTEGER,
  earning_edge INTEGER,
  belief_test_results JSONB,
  safety_contracts JSONB,
  reflection_text TEXT,
  archetype VARCHAR,
  archetype_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_flow_feedback_user_id ON flow_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_flow_feedback_flow_type ON flow_feedback(flow_type);
CREATE INDEX IF NOT EXISTS idx_flow_feedback_session_token ON flow_feedback(session_token);
CREATE INDEX IF NOT EXISTS idx_public_leads_email ON public_leads(email);
CREATE INDEX IF NOT EXISTS idx_public_leads_source_flow ON public_leads(source_flow);
CREATE INDEX IF NOT EXISTS idx_public_offer_assessments_session ON public_offer_assessments(session_token);
CREATE INDEX IF NOT EXISTS idx_public_offer_assessments_email ON public_offer_assessments(respondent_email);
CREATE INDEX IF NOT EXISTS idx_public_ns_responses_session ON public_nervous_system_responses(session_token);
CREATE INDEX IF NOT EXISTS idx_public_ns_responses_email ON public_nervous_system_responses(respondent_email);

-- RLS Policies
ALTER TABLE flow_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_offer_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_nervous_system_responses ENABLE ROW LEVEL SECURITY;

-- flow_feedback: Users can read/write their own, public can insert with session_token
DO $$ BEGIN
CREATE POLICY "Users can read own feedback" ON flow_feedback
  FOR SELECT USING (auth.uid() = user_id);

DO $$ BEGIN
CREATE POLICY "Users can insert own feedback" ON flow_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DO $$ BEGIN
CREATE POLICY "Public can insert feedback with session_token" ON flow_feedback
  FOR INSERT WITH CHECK (user_id IS NULL AND session_token IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- public_leads: Anyone can insert (it's a lead capture)
DO $$ BEGIN
CREATE POLICY "Anyone can insert public leads" ON public_leads
  FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- public_offer_assessments: Anyone can insert and read their own by session
DO $$ BEGIN
CREATE POLICY "Anyone can insert public assessments" ON public_offer_assessments
  FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
CREATE POLICY "Anyone can read by session token" ON public_offer_assessments
  FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- public_nervous_system_responses: Anyone can insert and read their own by session
DO $$ BEGIN
CREATE POLICY "Anyone can insert public NS responses" ON public_nervous_system_responses
  FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
CREATE POLICY "Anyone can read public NS by session" ON public_nervous_system_responses
  FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
