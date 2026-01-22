-- Hormozi Sales Scripts Database
-- 15 proven scripts based on Alex Hormozi's $100M Offers framework

-- Create sales_scripts table
CREATE TABLE IF NOT EXISTS sales_scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  stage VARCHAR(20) NOT NULL, -- opener, discovery, trust, urgency, offer, objection, close, follow-up
  script_text TEXT NOT NULL,
  when_to_use TEXT NOT NULL,
  tips TEXT,
  example_response TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create script_usage_log for analytics
CREATE TABLE IF NOT EXISTS script_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  script_id UUID REFERENCES sales_scripts(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES sales_deals(id) ON DELETE SET NULL,
  outcome VARCHAR(20), -- 'successful', 'unsuccessful', 'no_response', 'pending'
  notes TEXT,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE sales_scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE script_usage_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Scripts are public read, usage logs are user-specific
DO $$ BEGIN
CREATE POLICY "Scripts are viewable by all authenticated users"
  ON sales_scripts FOR SELECT
  TO authenticated
  USING (is_active = true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
CREATE POLICY "Users can view own script usage"
  ON script_usage_log FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DO $$ BEGIN
CREATE POLICY "Users can insert own script usage"
  ON script_usage_log FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DO $$ BEGIN
CREATE POLICY "Users can update own script usage"
  ON script_usage_log FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Insert 15 Hormozi-style sales scripts
INSERT INTO sales_scripts (name, category, stage, script_text, when_to_use, tips, example_response, sort_order) VALUES

-- OPENERS (1-2)
(
  'The Dream Outcome Opener',
  'Opener',
  'opener',
  E'Hey [Name], I noticed you''re [observation about their business/situation]. I help [target audience] achieve [dream outcome] without [biggest pain they want to avoid]. Would it be crazy if I showed you exactly how we do that?',
  'First message to a cold lead or when reaching out to someone who showed interest',
  'Personalize the observation. Make it specific to their situation. The "would it be crazy" phrasing reduces resistance.',
  'Lead says: "Sure, I''d love to hear more about that."',
  1
),
(
  'The Problem Agitation Opener',
  'Opener',
  'opener',
  E'Quick question [Name] - are you still dealing with [specific problem]? I ask because I just helped [similar person/company] solve that exact issue and they went from [before state] to [after state] in [timeframe].',
  'When you know their specific pain point from research or previous interaction',
  'Use real results from past clients. Specific numbers and timeframes build credibility.',
  'Lead says: "Yes, that''s exactly what I''m struggling with right now."',
  2
),

-- PAIN DISCOVERY (3-4)
(
  'The Cost of Inaction',
  'Discovery',
  'discovery',
  E'Let me ask you something - if you don''t solve [problem] in the next [timeframe], what does that cost you? Not just in money, but in time, stress, missed opportunities?',
  'After initial rapport, when exploring their pain points',
  'Let them do the math themselves. Their own calculations are more convincing than yours.',
  'Lead calculates: "Probably $50K in lost revenue and countless sleepless nights."',
  3
),
(
  'The Dream vs Reality Gap',
  'Discovery',
  'discovery',
  E'On a scale of 1-10, where would you say you are right now with [area]? And where do you want to be? What''s stopping you from getting there?',
  'To understand the gap between their current state and desired state',
  'The gap reveals their motivation level. Bigger gap = more motivated to buy.',
  'Lead says: "I''m at a 4, want to be at a 9. Time and know-how are holding me back."',
  4
),

-- TRUST BUILDERS (5-6)
(
  'The Social Proof Stack',
  'Trust',
  'trust',
  E'You know what''s interesting? I just spoke with [similar client] who had the exact same concern. After working together, they [specific result]. And [another client] said the same thing - now they''re [outcome]. Would it help if I connected you with them?',
  'When they express doubt or want to hear about others'' experiences',
  'Name-drop real clients if possible. Offer to connect them builds massive trust.',
  'Lead says: "Wow, yes I''d actually love to talk to them."',
  5
),
(
  'The Transparent Expert',
  'Trust',
  'trust',
  E'I''m going to be completely honest with you - this isn''t for everyone. If you''re not [requirement 1] or if you''re not willing to [requirement 2], we''re probably not a good fit. I''d rather tell you now than waste your time.',
  'When building trust by showing you''re not just trying to make a sale',
  'Disqualifying them slightly actually makes them want to qualify themselves.',
  'Lead says: "No, I''m definitely committed. Tell me more."',
  6
),

-- URGENCY CREATION (7-8)
(
  'The Opportunity Cost Clock',
  'Urgency',
  'urgency',
  E'Here''s what I''m seeing - every [time period] you wait, you''re leaving [specific amount/result] on the table. By the time most people "feel ready," their competitors have already moved. When do you want to stop losing [benefit]?',
  'When they''re hesitating to make a decision',
  'Make the cost of waiting tangible and specific. Don''t be pushy - be factual.',
  'Lead says: "You''re right. I''ve been putting this off too long."',
  7
),
(
  'The Limited Capacity',
  'Urgency',
  'urgency',
  E'I want to be upfront - we only take on [X] new clients per [time period] because of the hands-on nature of what we do. I have [Y] spots left this [month/quarter]. I''m not saying this to pressure you, but I don''t want you to come back ready and I have to say no.',
  'When they''re interested but not committing',
  'Only use if true - fake scarcity destroys trust. Real limitations are powerful.',
  'Lead says: "I don''t want to miss out. Can we move forward?"',
  8
),

-- OFFER STACK (9-10)
(
  'The Value Stack Reveal',
  'Offer',
  'offer',
  E'So here''s everything you get: [Core offer worth $X] + [Bonus 1 worth $Y] + [Bonus 2 worth $Z] + [Guarantee]. If you bought all this separately, you''d pay over [$total]. But because I want to make this a no-brainer, the investment is just [$price]. What questions do you have?',
  'When presenting your offer after building desire',
  'Stack value before revealing price. Make the ROI obvious.',
  'Lead says: "That seems like a lot of value. How does payment work?"',
  9
),
(
  'The Risk Reversal',
  'Offer',
  'offer',
  E'I''m so confident this will work for you that here''s my promise: If you don''t see [specific result] within [timeframe], I''ll [guarantee action]. You keep everything, and I eat the risk. Does that seem fair?',
  'To eliminate remaining objections about risk',
  'Be specific about what success looks like. Vague guarantees don''t convert.',
  'Lead says: "That''s really generous. What do I need to do to get started?"',
  10
),

-- OBJECTION HANDLING (11-12)
(
  'The "I Need to Think About It" Handler',
  'Objection',
  'objection',
  E'I totally get that. Can I ask what specifically you need to think about? Is it the investment, the timing, or are you not sure if it''s right for you? I just want to make sure I''ve given you everything you need to make the best decision for you.',
  'When they say they need time to think',
  'Isolate the real objection. "Think about it" is rarely the real reason.',
  'Lead says: "It''s really about whether I can afford it right now."',
  11
),
(
  'The Price Objection Reframe',
  'Objection',
  'objection',
  E'I hear you on the investment. Let me ask - is it that the price is too high, or that the value isn''t clear yet? Because if it''s value, let me show you the math: [ROI calculation]. If this helps you get [result], how many months would it take to pay for itself?',
  'When they object to the price',
  'Don''t discount. Increase value or show ROI instead.',
  'Lead says: "When you put it that way, it would pay for itself in 2 months."',
  12
),

-- CLOSE ATTEMPTS (13-14)
(
  'The Assumptive Close',
  'Close',
  'close',
  E'Awesome, so to get you started: would you prefer to pay in full and save [amount], or would the [payment plan] work better for your cash flow? Either way, we can get you onboarded by [date].',
  'When they''ve shown buying signals and you''re ready to close',
  'Give them a choice between two yeses. Don''t ask if they want to buy.',
  'Lead says: "The payment plan works better for me right now."',
  13
),
(
  'The Future Pace Close',
  'Close',
  'close',
  E'Imagine it''s [3 months from now]. You''ve achieved [dream outcome]. Your [area] has transformed. Looking back, are you glad you made this decision today? What''s stopping you from feeling that way [time period] from now?',
  'When they''re emotionally engaged but need final push',
  'Help them visualize success. Then bring them back to the present decision.',
  'Lead says: "Nothing, really. Let''s do this."',
  14
),

-- FOLLOW-UP (15)
(
  'The Value-First Follow-Up',
  'Follow-Up',
  'follow-up',
  E'Hey [Name], I was thinking about our conversation and wanted to share something that might help regardless of whether we work together: [valuable insight or resource]. Also, I wanted to check - did you have any more questions come up since we last talked?',
  'When following up with someone who hasn''t responded or committed',
  'Lead with value, not "just checking in." Give them a reason to respond.',
  'Lead says: "Thanks for this! Actually yes, I did have a question..."',
  15
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_scripts_category ON sales_scripts(category);
CREATE INDEX IF NOT EXISTS idx_scripts_stage ON sales_scripts(stage);
CREATE INDEX IF NOT EXISTS idx_script_usage_user ON script_usage_log(user_id);
CREATE INDEX IF NOT EXISTS idx_script_usage_deal ON script_usage_log(deal_id);
