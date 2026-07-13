-- Add depth level and visibility layers to groan_challenges
-- depth_level: L0-L4 scale (education/testing/practising/charging/teaching)
-- visibility_layers: multi-select array of visibility types

ALTER TABLE groan_challenges
  ADD COLUMN IF NOT EXISTS depth_level text
    CHECK (depth_level IS NULL OR depth_level IN ('education', 'testing', 'practising', 'charging', 'teaching')),
  ADD COLUMN IF NOT EXISTS visibility_layers text[] DEFAULT '{}';

-- Index for depth queries (used by Zarlo Brief + Insight Drops)
CREATE INDEX IF NOT EXISTS idx_groan_challenges_depth
  ON groan_challenges (user_id, depth_level)
  WHERE depth_level IS NOT NULL;

-- Note: scary_score, wahoo_score, and visibility_layer (singular) columns are
-- kept for backwards compatibility. They are referenced by FeedCard, GroanMatrix,
-- GroanCompletionModal, LibraryOfAnswers, checklistChallengeService,
-- playlistFeedService, and StrikeDesignFlow. Do not drop.
