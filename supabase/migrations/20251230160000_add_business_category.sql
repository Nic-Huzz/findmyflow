-- Add Business category to quest_category constraint
-- This is needed for stage-based quests like Core Four Strategy, Funnel Builder, etc.

-- Fix quest_category constraint to include Business
ALTER TABLE quest_completions
DROP CONSTRAINT IF EXISTS check_quest_category;

ALTER TABLE quest_completions
ADD CONSTRAINT check_quest_category
CHECK (quest_category IN (
  -- R-types (Groans tab)
  'Recognise', 'Release', 'Rewire', 'Reconnect',
  -- Healing tab
  'Groans', 'Healing',
  -- Business tab (NEW - for stage-based quests)
  'Business',
  -- Other existing categories
  'Bonus', 'Daily', 'Weekly', 'Tracker', 'Flow Finder'
));

-- Also ensure quest_type constraint is up to date with all stage-based types
ALTER TABLE quest_completions
DROP CONSTRAINT IF EXISTS check_quest_type;

ALTER TABLE quest_completions
ADD CONSTRAINT check_quest_type
CHECK (quest_type IN (
  -- Frequency types
  'daily', 'weekly', 'anytime', 'challenge', 'Daily', 'Weekly',
  -- Flow type
  'flow',
  -- Legacy persona types (keep for backwards compatibility)
  'Movement Maker', 'Vibe Riser', 'Vibe Riser, Movement Maker',
  -- R-types for Groans/Healing
  'Recognise', 'Release', 'Rewire', 'Reconnect',
  -- Tracker
  'Tracker',
  -- Groan challenges
  'groan',
  -- Stage-based types
  'Validation',    -- Stage 1
  'Product',       -- Stage 2
  'Testing',       -- Stage 3
  'Money Models',  -- Stage 4
  'Campaign',      -- Stage 5
  'Launch',        -- Stage 6
  -- Flow Finder type
  'Flow Finder'
));
