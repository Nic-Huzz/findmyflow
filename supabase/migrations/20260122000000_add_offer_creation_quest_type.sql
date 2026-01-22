-- Add 'Offer Creation' to quest_type constraint
-- This type is used by Grand Slam Offer, Offer Stack Builder, and related quests

ALTER TABLE quest_completions
DROP CONSTRAINT IF EXISTS check_quest_type;

ALTER TABLE quest_completions
ADD CONSTRAINT check_quest_type
CHECK (quest_type IN (
  'daily', 'weekly', 'anytime', 'challenge', 'Daily', 'Weekly',
  'flow',
  'Movement Maker', 'Vibe Riser', 'Vibe Riser, Movement Maker',
  'Recognise', 'Release', 'Rewire', 'Reconnect',
  'Tracker', 'Tracking',
  'groan',
  'Validation',
  'Product',
  'Testing',
  'Money Models',
  'Campaign',
  'Launch',
  'Flow Finder',
  'Offer Creation'
));
