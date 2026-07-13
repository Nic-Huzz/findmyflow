-- Add depth_level to quests table
-- Auto-bumped from wahoo depth (high watermark pattern)
-- Used by heroStageChecker for 5→6 graduation: predicted_state = 'vibe' + depth IN ('charging', 'teaching')

ALTER TABLE quests
  ADD COLUMN IF NOT EXISTS depth_level text
    CHECK (depth_level IS NULL OR depth_level IN ('education', 'testing', 'practising', 'charging', 'teaching'));
