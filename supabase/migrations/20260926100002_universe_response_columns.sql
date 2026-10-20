-- Universe Response + Coping Pattern columns on groan_challenges
-- Used by ProgressTab reflection cards and WeeklyReview follow-up

ALTER TABLE groan_challenges
  ADD COLUMN IF NOT EXISTS universe_response text
    CHECK (universe_response IN ('none', 'not_sure', 'compliment', 'opportunity', 'both')),
  ADD COLUMN IF NOT EXISTS universe_response_note text,
  ADD COLUMN IF NOT EXISTS universe_response_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS coping_mechanism text;
