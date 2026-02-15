-- Add 'Voices' to quest_category constraint
-- Voice quests (Essence Voice, Protective Voice, Stage Groan) use category 'Voices'
-- but the CHECK constraint was missing this value, causing insert failures.

ALTER TABLE quest_completions
DROP CONSTRAINT IF EXISTS check_quest_category;

ALTER TABLE quest_completions
ADD CONSTRAINT check_quest_category
CHECK (quest_category IN (
  -- R-types (Groans tab)
  'Recognise', 'Release', 'Rewire', 'Reconnect',
  -- Healing tab
  'Groans', 'Healing',
  -- Business tab
  'Business',
  -- Voices sub-tab (Essence Voice, Protective Voice, Stage Groan)
  'Voices',
  -- Other existing categories
  'Bonus', 'Daily', 'Weekly', 'Tracker', 'Flow Finder'
));
