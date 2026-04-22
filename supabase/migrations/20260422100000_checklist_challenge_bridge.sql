-- ============================================================================
-- Checklist → Play-List Challenge Bridge
-- Links groan_challenges to experience_checklist_items so completing
-- a courage challenge auto-ticks the checklist item.
-- ============================================================================

-- Source of the challenge (where it came from)
ALTER TABLE groan_challenges ADD COLUMN IF NOT EXISTS
  challenge_source TEXT DEFAULT 'matrix';
  -- 'matrix' = traditional Groan Matrix (default for existing rows)
  -- 'checklist' = converted from experience checklist item
  -- 'intention' = custom intention from group call

-- Link back to the specific checklist item (nullable)
ALTER TABLE groan_challenges ADD COLUMN IF NOT EXISTS
  checklist_item_id UUID REFERENCES experience_checklist_items(id) ON DELETE SET NULL;

-- Link to the experience (for context in CreatorHome)
ALTER TABLE groan_challenges ADD COLUMN IF NOT EXISTS
  experience_id UUID REFERENCES experiences(id) ON DELETE SET NULL;

-- Deadline for the challenge (nullable, used by checklist/intention challenges)
ALTER TABLE groan_challenges ADD COLUMN IF NOT EXISTS
  deadline TIMESTAMPTZ;

-- DNA personalization type used when generating the challenge
ALTER TABLE groan_challenges ADD COLUMN IF NOT EXISTS
  dna_challenge_type TEXT;
  -- 'DO_IT' | 'THINK_IT' | 'MAKE_IT' | null (generic)

-- Index for querying active checklist/intention challenges per user
CREATE INDEX IF NOT EXISTS idx_groan_challenges_source
  ON groan_challenges(user_id, challenge_source)
  WHERE challenge_source IN ('checklist', 'intention');

-- Index for looking up challenges by checklist item
CREATE INDEX IF NOT EXISTS idx_groan_challenges_checklist_item
  ON groan_challenges(checklist_item_id)
  WHERE checklist_item_id IS NOT NULL;

-- Index for querying challenges by experience
CREATE INDEX IF NOT EXISTS idx_groan_challenges_experience
  ON groan_challenges(experience_id)
  WHERE experience_id IS NOT NULL;
