-- Allow league members to read each other's quest_completions
-- Needed for live score calculation in the leaderboard UI.
-- Supabase ORs multiple SELECT policies, so this adds to the existing
-- "Users can view their own quest completions" policy.
-- Uses league_id (not team_id) so users can see all teams' contributions.

CREATE POLICY "League members can view quest completions"
  ON quest_completions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM fantasy_team_members ftm_viewer
      JOIN fantasy_team_members ftm_target
        ON ftm_viewer.league_id = ftm_target.league_id
      WHERE ftm_viewer.user_id = auth.uid()
        AND ftm_target.user_id = quest_completions.user_id
    )
  );
