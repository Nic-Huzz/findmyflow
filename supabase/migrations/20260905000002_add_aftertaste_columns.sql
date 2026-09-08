-- Add aftertaste essence alignment columns to quest_completions
-- Part of the Aftertaste Essence Filter feature (groan-zone-thesis.md)

ALTER TABLE quest_completions ADD COLUMN IF NOT EXISTS aftertaste text;
ALTER TABLE quest_completions ADD COLUMN IF NOT EXISTS aftertaste_week_later text;

COMMENT ON COLUMN quest_completions.aftertaste IS 'Immediate post-completion essence signal: yes | not_sure | no';
COMMENT ON COLUMN quest_completions.aftertaste_week_later IS 'Second clock (weekly review): yes | no | still_not_sure';

-- RLS: allow users to update their own quest_completions (needed for aftertaste_week_later)
CREATE POLICY "Users can update own quest completions"
  ON quest_completions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
