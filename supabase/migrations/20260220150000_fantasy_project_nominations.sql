-- Fantasy Project Nominations
-- Tracks which project each user nominates for Business scoring per league week.
-- Nominations persist: if no nomination for week N, falls back to most recent week < N.

CREATE TABLE IF NOT EXISTS fantasy_project_nominations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  league_id UUID NOT NULL REFERENCES fantasy_leagues(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  project_id UUID NOT NULL REFERENCES user_projects(id),
  nominated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, league_id, week_number)
);

CREATE INDEX IF NOT EXISTS idx_fantasy_nominations_user_league
  ON fantasy_project_nominations(user_id, league_id, week_number);

ALTER TABLE fantasy_project_nominations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users manage own nominations' AND tablename = 'fantasy_project_nominations'
  ) THEN
    CREATE POLICY "Users manage own nominations"
      ON fantasy_project_nominations FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'League members can read nominations' AND tablename = 'fantasy_project_nominations'
  ) THEN
    CREATE POLICY "League members can read nominations"
      ON fantasy_project_nominations FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM fantasy_team_members ftm
          WHERE ftm.user_id = auth.uid()
          AND ftm.league_id = fantasy_project_nominations.league_id
        )
      );
  END IF;
END $$;
