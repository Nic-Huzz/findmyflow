-- Add milestone commitment and reflection columns to user_level_progress
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_level_progress' AND column_name = 'milestone_commitment'
  ) THEN
    ALTER TABLE user_level_progress ADD COLUMN milestone_commitment TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_level_progress' AND column_name = 'milestone_reflection'
  ) THEN
    ALTER TABLE user_level_progress ADD COLUMN milestone_reflection TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_level_progress' AND column_name = 'milestone_diagonal_score'
  ) THEN
    ALTER TABLE user_level_progress ADD COLUMN milestone_diagonal_score INTEGER CHECK (milestone_diagonal_score BETWEEN 1 AND 10);
  END IF;
END $$;
