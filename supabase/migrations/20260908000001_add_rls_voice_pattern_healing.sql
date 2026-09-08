-- Fix: enable RLS on voice_pattern_prompts and pattern_healing_responses
-- These tables were created without RLS in 20260905000001

ALTER TABLE voice_pattern_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pattern_healing_responses ENABLE ROW LEVEL SECURITY;

-- voice_pattern_prompts: users can only see/modify their own
CREATE POLICY "Users can view own voice patterns"
  ON voice_pattern_prompts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own voice patterns"
  ON voice_pattern_prompts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own voice patterns"
  ON voice_pattern_prompts FOR UPDATE
  USING (auth.uid() = user_id);

-- pattern_healing_responses: users can only see/modify their own
CREATE POLICY "Users can view own healing responses"
  ON pattern_healing_responses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own healing responses"
  ON pattern_healing_responses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own healing responses"
  ON pattern_healing_responses FOR UPDATE
  USING (auth.uid() = user_id);
