-- Add Movement category and action types to quest_completions constraints
ALTER TABLE quest_completions DROP CONSTRAINT IF EXISTS check_quest_category;
ALTER TABLE quest_completions ADD CONSTRAINT check_quest_category CHECK (quest_category = ANY (ARRAY['Recognise','Release','Rewire','Reconnect','Groans','Healing','Business','Voices','Bonus','Daily','Weekly','Tracker','Flow Finder','Tune','Movement']));

ALTER TABLE quest_completions DROP CONSTRAINT IF EXISTS check_quest_type;
ALTER TABLE quest_completions ADD CONSTRAINT check_quest_type CHECK (quest_type = ANY (ARRAY['daily','weekly','anytime','challenge','Daily','Weekly','flow','Movement Maker','Vibe Riser','Vibe Riser, Movement Maker','Recognise','Release','Rewire','Reconnect','recognise','release','rewire','reconnect','Tracker','Tracking','groan','Validation','Product','Testing','Money Models','Campaign','Launch','Flow Finder','Offer Creation','Rest','Practice','checklist_item','details_field','value_stack','checklist_to_challenge','strike_complete','experience_complete','three_percent','attendee_upload','run_again']));
