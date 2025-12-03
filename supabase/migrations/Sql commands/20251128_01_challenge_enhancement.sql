-- Phase 3: Challenge System Enhancement Migration
-- Adds persona stage system, graduation tracking, and milestone completion

-- Table: user_stage_progress
-- Tracks user's current stage within their persona journey
CREATE TABLE IF NOT EXISTS public.user_stage_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  persona text NOT NULL CHECK (persona IN ('vibe_seeker', 'vibe_riser', 'movement_maker')),
  current_stage text NOT NULL DEFAULT 'validation',
  stage_started_at timestamp with time zone DEFAULT now(),
  conversations_logged integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_stage_progress_pkey PRIMARY KEY (id),
  CONSTRAINT user_stage_progress_user_unique UNIQUE (user_id)
);

-- Table: stage_graduations
-- Records when a user graduates from one stage to the next
CREATE TABLE IF NOT EXISTS public.stage_graduations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  persona text NOT NULL,
  from_stage text NOT NULL,
  to_stage text NOT NULL,
  graduation_reason jsonb DEFAULT '{}', -- stores which requirements were met
  graduated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT stage_graduations_pkey PRIMARY KEY (id)
);

-- Table: conversation_logs
-- Tracks when users log conversations (for graduation requirements)
CREATE TABLE IF NOT EXISTS public.conversation_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stage text NOT NULL,
  conversation_summary text,
  key_insights text,
  person_type text, -- 'potential_customer', 'mentor', 'peer', etc.
  logged_at timestamp with time zone DEFAULT now(),
  challenge_instance_id uuid REFERENCES public.challenge_progress(id),
  CONSTRAINT conversation_logs_pkey PRIMARY KEY (id)
);

-- Table: milestone_completions
-- Tracks arbitrary milestones (product created, tested, etc.)
CREATE TABLE IF NOT EXISTS public.milestone_completions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  milestone_id text NOT NULL, -- 'product_created', 'offer_tested_with_3', etc.
  stage text NOT NULL,
  persona text NOT NULL,
  evidence_text text, -- user's description of what they did
  completed_at timestamp with time zone DEFAULT now(),
  CONSTRAINT milestone_completions_pkey PRIMARY KEY (id),
  CONSTRAINT milestone_completions_unique UNIQUE (user_id, milestone_id)
);

-- Add columns to challenge_progress for enhanced tracking
ALTER TABLE public.challenge_progress
ADD COLUMN IF NOT EXISTS persona text,
ADD COLUMN IF NOT EXISTS current_stage text DEFAULT 'validation',
ADD COLUMN IF NOT EXISTS streak_days integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS longest_streak integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_active_date timestamp with time zone;

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_user_stage_progress_user ON public.user_stage_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_logs_user_stage ON public.conversation_logs(user_id, stage);
CREATE INDEX IF NOT EXISTS idx_milestone_completions_user ON public.milestone_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_stage_graduations_user ON public.stage_graduations(user_id);

-- RLS Policies
ALTER TABLE public.user_stage_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stage_graduations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestone_completions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own stage progress" ON public.user_stage_progress;
DROP POLICY IF EXISTS "Users can update own stage progress" ON public.user_stage_progress;
DROP POLICY IF EXISTS "Users can view own graduations" ON public.stage_graduations;
DROP POLICY IF EXISTS "Users can insert own graduations" ON public.stage_graduations;
DROP POLICY IF EXISTS "Users can manage own conversation logs" ON public.conversation_logs;
DROP POLICY IF EXISTS "Users can manage own milestones" ON public.milestone_completions;

-- Create RLS policies
CREATE POLICY "Users can view own stage progress" ON public.user_stage_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own stage progress" ON public.user_stage_progress
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own graduations" ON public.stage_graduations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own graduations" ON public.stage_graduations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own conversation logs" ON public.conversation_logs
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own milestones" ON public.milestone_completions
  FOR ALL USING (auth.uid() = user_id);
