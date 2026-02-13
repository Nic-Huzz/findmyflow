-- Fantasy League System
-- 5 tables: leagues, teams, team_members, matchups, content_submissions

-- ============================================
-- 1. fantasy_leagues
-- ============================================
CREATE TABLE IF NOT EXISTS fantasy_leagues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'upcoming'
    CHECK (status IN ('upcoming', 'active', 'completed', 'cancelled')),
  start_date DATE,
  end_date DATE,
  num_weeks INT NOT NULL DEFAULT 4,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  settings JSONB DEFAULT '{}'::jsonb
);

-- ============================================
-- 2. fantasy_teams
-- ============================================
CREATE TABLE IF NOT EXISTS fantasy_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID NOT NULL REFERENCES fantasy_leagues(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  invite_code TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(league_id, name)
);

CREATE INDEX idx_fantasy_teams_league ON fantasy_teams(league_id);
CREATE INDEX idx_fantasy_teams_invite ON fantasy_teams(invite_code);

-- ============================================
-- 3. fantasy_team_members
-- ============================================
CREATE TABLE IF NOT EXISTS fantasy_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES fantasy_teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  league_id UUID NOT NULL REFERENCES fantasy_leagues(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id),
  UNIQUE(league_id, user_id)  -- one team per league
);

CREATE INDEX idx_fantasy_members_team ON fantasy_team_members(team_id);
CREATE INDEX idx_fantasy_members_user ON fantasy_team_members(user_id);
CREATE INDEX idx_fantasy_members_league ON fantasy_team_members(league_id);

-- Trigger: auto-populate league_id from fantasy_teams.league_id on INSERT
CREATE OR REPLACE FUNCTION set_fantasy_member_league_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.league_id IS NULL THEN
    SELECT league_id INTO NEW.league_id
    FROM fantasy_teams
    WHERE id = NEW.team_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_fantasy_member_league_id
  BEFORE INSERT ON fantasy_team_members
  FOR EACH ROW
  EXECUTE FUNCTION set_fantasy_member_league_id();

-- ============================================
-- 4. fantasy_matchups
-- ============================================
CREATE TABLE IF NOT EXISTS fantasy_matchups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID NOT NULL REFERENCES fantasy_leagues(id) ON DELETE CASCADE,
  week_number INT NOT NULL,
  week_start DATE,
  team_a_id UUID NOT NULL REFERENCES fantasy_teams(id) ON DELETE CASCADE,
  team_b_id UUID NOT NULL REFERENCES fantasy_teams(id) ON DELETE CASCADE,
  team_a_categories_won INT DEFAULT 0,
  team_b_categories_won INT DEFAULT 0,
  team_a_match_points INT DEFAULT 0,
  team_b_match_points INT DEFAULT 0,
  category_results JSONB DEFAULT '[]'::jsonb,
  calculated_at TIMESTAMPTZ,
  UNIQUE(league_id, week_number, team_a_id)
);

CREATE INDEX idx_fantasy_matchups_league_week ON fantasy_matchups(league_id, week_number);

-- ============================================
-- 5. league_content_submissions
-- ============================================
CREATE TABLE IF NOT EXISTS league_content_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID NOT NULL REFERENCES fantasy_leagues(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  team_id UUID NOT NULL REFERENCES fantasy_teams(id) ON DELETE CASCADE,
  week_number INT NOT NULL,
  content_type TEXT NOT NULL,
  link_url TEXT,
  description TEXT,
  points_value INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  review_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_league_content_league ON league_content_submissions(league_id, week_number);
CREATE INDEX idx_league_content_user ON league_content_submissions(user_id);
CREATE INDEX idx_league_content_status ON league_content_submissions(status);

-- ============================================
-- RLS Policies
-- ============================================

ALTER TABLE fantasy_leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE fantasy_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE fantasy_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE fantasy_matchups ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_content_submissions ENABLE ROW LEVEL SECURITY;

-- fantasy_leagues: all authenticated can SELECT, admin creates
CREATE POLICY "fantasy_leagues_select" ON fantasy_leagues
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "fantasy_leagues_insert" ON fantasy_leagues
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "fantasy_leagues_update" ON fantasy_leagues
  FOR UPDATE TO authenticated USING (auth.uid() = created_by);

-- fantasy_teams: all authenticated can SELECT, authenticated can INSERT
CREATE POLICY "fantasy_teams_select" ON fantasy_teams
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "fantasy_teams_insert" ON fantasy_teams
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

-- fantasy_team_members: all authenticated can SELECT, authenticated can INSERT own
CREATE POLICY "fantasy_team_members_select" ON fantasy_team_members
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "fantasy_team_members_insert" ON fantasy_team_members
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- fantasy_matchups: all authenticated can SELECT, league creator can INSERT/UPDATE
CREATE POLICY "fantasy_matchups_select" ON fantasy_matchups
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "fantasy_matchups_insert" ON fantasy_matchups
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM fantasy_leagues
      WHERE id = league_id AND created_by = auth.uid()
    )
  );

CREATE POLICY "fantasy_matchups_update" ON fantasy_matchups
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM fantasy_leagues
      WHERE id = league_id AND created_by = auth.uid()
    )
  );

-- league_content_submissions: all authenticated can SELECT
CREATE POLICY "league_content_select" ON league_content_submissions
  FOR SELECT TO authenticated USING (true);

-- INSERT own submissions only
CREATE POLICY "league_content_insert" ON league_content_submissions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- UPDATE status: league creator only (admin approval)
CREATE POLICY "league_content_update" ON league_content_submissions
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM fantasy_leagues
      WHERE id = league_id AND created_by = auth.uid()
    )
  );
