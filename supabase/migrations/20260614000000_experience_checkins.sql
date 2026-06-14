-- Experience Check-in (T1a Self-Knowledge)
-- Users predict nervous system outcomes for planned activities,
-- then report actuals. Calibration = self-knowledge metric.

CREATE TABLE experience_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  activity_description text NOT NULL,
  predicted_outcome text NOT NULL CHECK (predicted_outcome IN ('bored', 'stressful', 'fun', 'wahoo')),
  actual_outcome text CHECK (actual_outcome IN ('bored', 'stressful', 'fun', 'wahoo')),
  calibration_hit boolean,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_experience_checkins_user_date
  ON experience_checkins (user_id, date DESC);

ALTER TABLE experience_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own experience checkins"
  ON experience_checkins FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own experience checkins"
  ON experience_checkins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own experience checkins"
  ON experience_checkins FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
