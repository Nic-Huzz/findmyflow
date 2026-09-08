-- Per-path life fuel tracking via weekly review
-- Each row = one path's fuel assessment for one week
-- null booleans = user didn't work on this path that week (not counted)

CREATE TABLE path_fuel_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  quest_id uuid REFERENCES quests ON DELETE CASCADE NOT NULL,
  week_of date NOT NULL,
  choice boolean,
  connection boolean,
  mastery boolean,
  meaning boolean,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, quest_id, week_of)
);

ALTER TABLE path_fuel_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_path_fuel_reviews"
  ON path_fuel_reviews FOR ALL USING (user_id = auth.uid());
