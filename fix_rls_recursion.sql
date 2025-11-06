-- Fix RLS infinite recursion issue
-- This replaces the problematic policies with non-recursive ones

-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can read participants in their groups" ON challenge_participants;
DROP POLICY IF EXISTS "Users can view their own and group progress" ON challenge_progress;

-- Fix 1: Simple policy for challenge_participants
-- Allow users to read participants in ANY group (needed for joining)
-- This is safe because group codes are the security mechanism
CREATE POLICY "Anyone can read challenge participants"
  ON challenge_participants
  FOR SELECT
  USING (true);

-- Fix 2: Simpler policy for challenge_progress that doesn't cause recursion
-- Users can see their own progress OR progress of users in their groups
CREATE POLICY "Users can view their own and group progress"
  ON challenge_progress
  FOR SELECT
  USING (
    -- Can see your own progress
    auth.uid() = user_id
    OR
    -- Can see progress of people in your groups
    -- This checks if current user and target user share ANY group
    (
      group_id IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM challenge_participants
        WHERE user_id = auth.uid()
        AND group_id = challenge_progress.group_id
      )
    )
  );

-- Verify policies are working
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN ('challenge_participants', 'challenge_progress')
ORDER BY tablename, policyname;
