-- Create post_action_reflections table
-- Fixes silent failures in PostActionModal saves
CREATE TABLE IF NOT EXISTS public.post_action_reflections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quest_id text NOT NULL,
  quest_name text,
  went_well text,
  do_differently text,
  key_insight text,
  compass_direction text CHECK (compass_direction IN ('north','east','south','west')),
  internal_state text CHECK (internal_state IN ('excited','tired')),
  external_state text CHECK (external_state IN ('ease','resistance')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.post_action_reflections ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own reflections' AND tablename = 'post_action_reflections'
  ) THEN
    CREATE POLICY "Users can manage own reflections"
      ON public.post_action_reflections
      FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create pre_action_captures table
-- Same pattern, fixes silent failures in PreActionModal saves
CREATE TABLE IF NOT EXISTS public.pre_action_captures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quest_id text NOT NULL,
  quest_name text,
  intention text,
  predicted_feeling text,
  predicted_challenge text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.pre_action_captures ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own captures' AND tablename = 'pre_action_captures'
  ) THEN
    CREATE POLICY "Users can manage own captures"
      ON public.pre_action_captures
      FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;
