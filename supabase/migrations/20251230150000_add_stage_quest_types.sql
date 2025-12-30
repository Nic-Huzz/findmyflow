-- Add new stage-based quest types to the check constraint
-- These replace persona-based types (Vibe Riser, Movement Maker) with stage-based types

ALTER TABLE quest_completions
DROP CONSTRAINT IF EXISTS check_quest_type;

ALTER TABLE quest_completions
ADD CONSTRAINT check_quest_type
CHECK (quest_type IN (
  -- Frequency types
  'daily', 'weekly', 'anytime', 'challenge', 'Daily', 'Weekly',
  -- Flow type
  'flow',
  -- Legacy persona types (keep for backwards compatibility with existing data)
  'Movement Maker', 'Vibe Riser', 'Vibe Riser, Movement Maker',
  -- R-types for Groans/Healing
  'Recognise', 'Release', 'Rewire', 'Reconnect',
  -- Tracker
  'Tracker',
  -- Groan challenges
  'groan',
  -- NEW: Stage-based types
  'Validation',    -- Stage 1
  'Product',       -- Stage 2
  'Testing',       -- Stage 3
  'Money Models',  -- Stage 4
  'Campaign',      -- Stage 5
  'Launch',        -- Stage 6
  -- Flow Finder type
  'Flow Finder'
));
