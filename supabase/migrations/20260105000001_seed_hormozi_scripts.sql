-- =============================================
-- SEED DATA: Hormozi 15 Closing Scripts
-- Pre-loaded scripts for sales objection handling
-- =============================================

-- Clear existing scripts (for idempotency)
DELETE FROM sales_scripts;

-- ============================================
-- CATEGORY: TIME OBJECTIONS
-- ============================================

INSERT INTO sales_scripts (category, subcategory, script_name, script_text, when_to_use, follow_up_if_a, follow_up_if_b, success_rate_benchmark, sort_order)
VALUES (
  'TIME',
  'Stalling',
  'I need to think about it',
  E'I totally get that. Let me ask you something - is it the WHAT or the HOW that you need to think about?\n\nMeaning, is it:\n(A) You don''t think this will work for you? (the what)\n(B) You''re not sure how you''ll make it work? (the how)\n\nWhich one is it?',
  'When prospect stalls with "I need to think"',
  'Re-establish belief in solution. Show proof (case studies).',
  'Address logistics. Remove obstacles. Then close.',
  68.00,
  1
);

INSERT INTO sales_scripts (category, subcategory, script_name, script_text, when_to_use, follow_up_if_a, follow_up_if_b, success_rate_benchmark, sort_order)
VALUES (
  'TIME',
  'Decision Maker',
  'I need to talk to my spouse',
  E'That makes sense. Quick question - when you say ''talk to your spouse'', is this something you''re genuinely excited about and you want their blessing?\n\nOr is this something where if they said yes, you''d still not be sure?',
  'When they defer to someone else',
  'Great! Let me give you exactly what to say to get their buy-in...',
  'Sounds like the real issue is something else. What''s really holding you back?',
  71.00,
  2
);

-- ============================================
-- CATEGORY: PRICE OBJECTIONS
-- ============================================

INSERT INTO sales_scripts (category, subcategory, script_name, script_text, when_to_use, follow_up_if_a, follow_up_if_b, success_rate_benchmark, sort_order)
VALUES (
  'PRICE',
  'Too Expensive',
  'It''s too expensive',
  E'I hear you. Let me ask - do you not have the money, or do you not think it''s worth the money?\n\nBecause those are two different things.',
  'Price resistance',
  'Offer payment plan options.',
  'Re-establish value. Show ROI and transformation.',
  64.00,
  3
);

INSERT INTO sales_scripts (category, subcategory, script_name, script_text, when_to_use, follow_up_if_a, follow_up_if_b, success_rate_benchmark, sort_order)
VALUES (
  'PRICE',
  'Affordability',
  'I can''t afford it',
  E'I get it. Here''s the thing though - poor people make decisions based on what they can afford today. Rich people make decisions based on where they want to be.\n\nIf you want [dream outcome], this is the investment. The question isn''t ''can I afford it?'' The question is ''can I afford NOT to?''\n\nHow many more months of [pain] is acceptable?',
  'When budget is the stated objection',
  NULL,
  NULL,
  58.00,
  4
);

INSERT INTO sales_scripts (category, subcategory, script_name, script_text, when_to_use, follow_up_if_a, follow_up_if_b, success_rate_benchmark, sort_order)
VALUES (
  'PRICE',
  'Delayed Purchase',
  'I need to save up first',
  E'Totally get it. Quick question - when you save up the money and join in 3 months, will you be better prepared to succeed than you are today?\n\nOr will you be in the same situation, just 3 months later and 3 months more frustrated?\n\n[They usually realize: same situation]\n\nSo if you''re going to do it anyway, wouldn''t it make sense to start now and be 3 months AHEAD instead of 3 months BEHIND?',
  'Delayed financial commitment',
  NULL,
  NULL,
  73.00,
  5
);

-- ============================================
-- CATEGORY: AUTHORITY / TRUST OBJECTIONS
-- ============================================

INSERT INTO sales_scripts (category, subcategory, script_name, script_text, when_to_use, follow_up_if_a, follow_up_if_b, success_rate_benchmark, sort_order)
VALUES (
  'AUTHORITY',
  'Research',
  'I need to do more research',
  E'Makes sense. What are you comparing this to?\n\nBecause if you''re comparing to [alternative], here''s what you''ll find: [breakdown of differences]\n\nBut the real question is: have you ever [achieved dream outcome] before?\n\n[Usually: No]\n\nThen with all respect, what are you researching? You don''t know what you don''t know. That''s why you need someone who''s been there.',
  'Research stalling',
  NULL,
  NULL,
  66.00,
  6
);

INSERT INTO sales_scripts (category, subcategory, script_name, script_text, when_to_use, follow_up_if_a, follow_up_if_b, success_rate_benchmark, sort_order)
VALUES (
  'AUTHORITY',
  'Past Failure',
  'I''ve tried something like this before',
  E'I appreciate you sharing that. What do you think went wrong last time?\n\n[Listen to their answer]\n\nGot it. And do you think that was because:\n(A) The method itself was flawed, or\n(B) You didn''t have the right support/accountability?\n\n[Usually: B]\n\nThat''s exactly why this is different. Here''s how we''ve solved that problem: [explain your unique support]',
  'Burned in the past',
  'If method was flawed, explain your different approach.',
  'Highlight your accountability and support systems.',
  69.00,
  7
);

-- ============================================
-- CATEGORY: SELF-DOUBT OBJECTIONS
-- ============================================

INSERT INTO sales_scripts (category, subcategory, script_name, script_text, when_to_use, follow_up_if_a, follow_up_if_b, success_rate_benchmark, sort_order)
VALUES (
  'SELF_DOUBT',
  'Capability',
  'I don''t think I can do this',
  E'Can I be honest with you? I think you CAN do this. The question is: are you TIRED of almost succeeding?\n\nBecause here''s what I''ve seen: People who ''almost'' succeed do it alone. People who ACTUALLY succeed do it with help.\n\nThe only difference between you succeeding and you ''almost'' succeeding is this decision right now.\n\nAre you tired of almost?',
  'Self-doubt, imposter syndrome',
  NULL,
  NULL,
  72.00,
  8
);

INSERT INTO sales_scripts (category, subcategory, script_name, script_text, when_to_use, follow_up_if_a, follow_up_if_b, success_rate_benchmark, sort_order)
VALUES (
  'SELF_DOUBT',
  'Special Case',
  'What if it doesn''t work for me?',
  E'Fair question. Let me ask you something: Do you think you''re so uniquely broken that you''re the ONE person this won''t work for?\n\n[They laugh/realize how silly that sounds]\n\nLook, I''ve worked with [X people]. Every single one thought they were different. And every single one succeeded.\n\nThe only people it doesn''t work for are people who don''t DO the work.\n\nWill you do the work?',
  'Fear of being different',
  NULL,
  NULL,
  67.00,
  9
);

-- ============================================
-- CATEGORY: TIMING OBJECTIONS
-- ============================================

INSERT INTO sales_scripts (category, subcategory, script_name, script_text, when_to_use, follow_up_if_a, follow_up_if_b, success_rate_benchmark, sort_order)
VALUES (
  'TIMING',
  'Wrong Time',
  'This isn''t the right time',
  E'I hear you. When WILL be the right time?\n\n[They give a date: ''In 3 months'' or ''Next year'']\n\nOkay, so in [timeframe], what will be different?\n\n[They realize: nothing]\n\nSo if nothing will be different, then ''not the right time'' isn''t the real issue.\n\nWhat''s the REAL concern?',
  'Timing delays',
  NULL,
  NULL,
  71.00,
  10
);

INSERT INTO sales_scripts (category, subcategory, script_name, script_text, when_to_use, follow_up_if_a, follow_up_if_b, success_rate_benchmark, sort_order)
VALUES (
  'TIMING',
  'Too Busy',
  'I''m too busy right now',
  E'I totally get being busy. We''re all busy.\n\nBut here''s the thing: Being busy is why you''re in this situation. And if you wait until you''re NOT busy, you''ll be in this same situation forever.\n\nThe people who succeed aren''t less busy. They just prioritize differently.\n\nIs [dream outcome] a priority, or not?',
  'Time scarcity claims',
  NULL,
  NULL,
  63.00,
  11
);

-- ============================================
-- CATEGORY: COMPARISON OBJECTIONS
-- ============================================

INSERT INTO sales_scripts (category, subcategory, script_name, script_text, when_to_use, follow_up_if_a, follow_up_if_b, success_rate_benchmark, sort_order)
VALUES (
  'COMPARISON',
  'Price Shopping',
  'I found something cheaper',
  E'Awesome! I''m glad you found options.\n\nQuick question: why are you still on this call?\n\n[They realize: cheaper option isn''t as good]\n\nHere''s the thing - you can find something cheaper. You can also find something more expensive.\n\nBut the question isn''t what''s cheapest. The question is what gets you [dream outcome] fastest.\n\nAnd based on what you told me, that''s THIS.\n\nSo the real question is: Do you want to buy something? Or do you want to achieve [dream outcome]?',
  'Shopping around',
  NULL,
  NULL,
  68.00,
  12
);

-- ============================================
-- CATEGORY: COMMITMENT OBJECTIONS
-- ============================================

INSERT INTO sales_scripts (category, subcategory, script_name, script_text, when_to_use, follow_up_if_a, follow_up_if_b, success_rate_benchmark, sort_order)
VALUES (
  'COMMITMENT',
  'Cancellation',
  'What if I want to cancel?',
  E'Great question. Here''s our policy: [state guarantee]\n\nBut let me flip this: You''re asking ''what if I want to quit?''\n\nInstead, ask ''what if this works?''\n\nBecause quitting is easy. You can quit anytime. You''ve been quitting your whole life.\n\nThe hard thing is committing.\n\nSo the question isn''t ''what if I quit?'' The question is ''what if I don''t?'' What does your life look like in 6 months if you don''t commit today?',
  'Refund/cancellation questions',
  NULL,
  NULL,
  65.00,
  13
);

INSERT INTO sales_scripts (category, subcategory, script_name, script_text, when_to_use, follow_up_if_a, follow_up_if_b, success_rate_benchmark, sort_order)
VALUES (
  'COMMITMENT',
  'Trial Period',
  'I need to see results first',
  E'I get wanting proof. Here''s the thing though:\n\nYou can''t TRY to [achieve dream outcome]. You either COMMIT to [achieve dream outcome] or you don''t.\n\nTrying is what got you here. Committing is what gets you there.\n\nThat''s why we have [proof elements]: to show you it works for others.\n\nBut YOUR results come from YOUR commitment.\n\nAre you ready to commit?',
  '"Trial period" requests',
  NULL,
  NULL,
  61.00,
  14
);

-- ============================================
-- CATEGORY: FINAL PUSH
-- ============================================

INSERT INTO sales_scripts (category, subcategory, script_name, script_text, when_to_use, follow_up_if_a, follow_up_if_b, success_rate_benchmark, sort_order)
VALUES (
  'FINAL',
  'Sleep On It',
  'Let me sleep on it',
  E'Absolutely, sleep on it.\n\nBut can I ask - when you wake up tomorrow, what will be different?\n\n[They realize: nothing]\n\nHere''s what I''ve seen: When people ''sleep on it'', they wake up with the same doubts, just a day later.\n\nSo let me make this easy:\n\nEither way, you''re going to make a decision. Either you decide YES and we start tomorrow. Or you decide NO and we part as friends.\n\nBut don''t decide ''maybe'' - because ''maybe'' is just ''no'' with guilt.\n\nSo which is it: YES or NO?',
  'Final stall tactic',
  NULL,
  NULL,
  74.00,
  15
);

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$ BEGIN RAISE NOTICE 'Hormozi 15 closing scripts seeded successfully!'; END $$;
