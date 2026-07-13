-- Mystery Boxes: AI Mirror insights earned through practice
-- Users earn boxes via triggers (streaks, new categories, zone transitions)
-- Content generated on-open via edge function

CREATE TABLE IF NOT EXISTS mystery_boxes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  box_tier text NOT NULL CHECK (box_tier IN ('bronze', 'silver', 'gold', 'legendary')),
  trigger_type text NOT NULL,
  content_type text,
  content text,
  earned_at timestamptz DEFAULT now(),
  opened_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_mystery_boxes_user ON mystery_boxes(user_id);
CREATE INDEX idx_mystery_boxes_unopened ON mystery_boxes(user_id) WHERE opened_at IS NULL;

-- Prevent duplicate triggers (covers all trigger types)
CREATE UNIQUE INDEX idx_mystery_boxes_unique_trigger
  ON mystery_boxes(user_id, trigger_type);

-- RLS
ALTER TABLE mystery_boxes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can read own mystery boxes"
    ON mystery_boxes FOR SELECT
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert own mystery boxes"
    ON mystery_boxes FOR INSERT
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own mystery boxes"
    ON mystery_boxes FOR UPDATE
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
