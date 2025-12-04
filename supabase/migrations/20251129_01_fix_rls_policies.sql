-- Fix RLS Policies for Phase 3 Tables
-- Addresses 406 Not Acceptable errors

-- Drop and recreate user_stage_progress policies with proper INSERT support
DROP POLICY IF EXISTS "Users can view own stage progress" ON public.user_stage_progress;
DROP POLICY IF EXISTS "Users can insert own stage progress" ON public.user_stage_progress;
DROP POLICY IF EXISTS "Users can update own stage progress" ON public.user_stage_progress;
DROP POLICY IF EXISTS "Users can delete own stage progress" ON public.user_stage_progress;

CREATE POLICY "Users can view own stage progress" ON public.user_stage_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stage progress" ON public.user_stage_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stage progress" ON public.user_stage_progress
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own stage progress" ON public.user_stage_progress
  FOR DELETE USING (auth.uid() = user_id);

-- Ensure conversation_logs has proper policies
DROP POLICY IF EXISTS "Users can manage own conversation logs" ON public.conversation_logs;
DROP POLICY IF EXISTS "Users can view own conversation logs" ON public.conversation_logs;
DROP POLICY IF EXISTS "Users can insert own conversation logs" ON public.conversation_logs;
DROP POLICY IF EXISTS "Users can update own conversation logs" ON public.conversation_logs;
DROP POLICY IF EXISTS "Users can delete own conversation logs" ON public.conversation_logs;

CREATE POLICY "Users can view own conversation logs" ON public.conversation_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversation logs" ON public.conversation_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversation logs" ON public.conversation_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversation logs" ON public.conversation_logs
  FOR DELETE USING (auth.uid() = user_id);

-- Ensure milestone_completions has proper policies
DROP POLICY IF EXISTS "Users can manage own milestones" ON public.milestone_completions;
DROP POLICY IF EXISTS "Users can view own milestones" ON public.milestone_completions;
DROP POLICY IF EXISTS "Users can insert own milestones" ON public.milestone_completions;
DROP POLICY IF EXISTS "Users can update own milestones" ON public.milestone_completions;
DROP POLICY IF EXISTS "Users can delete own milestones" ON public.milestone_completions;

CREATE POLICY "Users can view own milestones" ON public.milestone_completions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own milestones" ON public.milestone_completions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own milestones" ON public.milestone_completions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own milestones" ON public.milestone_completions
  FOR DELETE USING (auth.uid() = user_id);
