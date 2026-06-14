-- Weekly Review (T4 Multipliers)
-- 7-question weekly self-audit of meta-game multipliers.
-- 15 RP on completion, +5 RP for sharing.

CREATE TABLE weekly_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  environment text CHECK (environment IN ('yes', 'mostly', 'no')),
  network_text text,
  bet_sizing_text text,
  identity_did boolean,
  identity_text text,
  compounding_did boolean,
  compounding_text text,
  learning_text text,
  attention_hours numeric,
  points_earned integer DEFAULT 15,
  shared boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, week_start)
);

CREATE INDEX idx_weekly_reviews_user_week
  ON weekly_reviews (user_id, week_start DESC);

ALTER TABLE weekly_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own weekly reviews"
  ON weekly_reviews FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weekly reviews"
  ON weekly_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own weekly reviews"
  ON weekly_reviews FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
