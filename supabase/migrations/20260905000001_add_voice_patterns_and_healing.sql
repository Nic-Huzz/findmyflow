-- Voice pattern detection + pattern-level healing responses
-- Applied directly to production on 2026-09-05, this migration file ensures reproducibility

ALTER TABLE groan_challenges
  ADD COLUMN IF NOT EXISTS gap_voice text;

CREATE TABLE IF NOT EXISTS voice_pattern_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  voice text NOT NULL,
  primary_dimensions text[] NOT NULL,
  challenge_count int NOT NULL DEFAULT 3,
  shown_at timestamptz DEFAULT now(),
  healing_started boolean DEFAULT false,
  UNIQUE(user_id, voice, primary_dimensions)
);

CREATE TABLE IF NOT EXISTS pattern_healing_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  voice text NOT NULL,
  primary_dimensions text[] NOT NULL,
  fear_text text,
  origin_text text,
  insight_text text,
  rewire_text text,
  expectation_text text,
  healing_stage text DEFAULT 'recognised',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, voice)
);
