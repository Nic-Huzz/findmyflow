-- Pain Point Tools Integration (2026-09-26)
-- Pattern Interrupt: rescript text after negative gap voice identification
ALTER TABLE groan_challenges ADD COLUMN IF NOT EXISTS gap_rescript text;

-- Weekly Review: New You Protocol + Identity Reframe
ALTER TABLE weekly_reviews ADD COLUMN IF NOT EXISTS new_you_vision text;
ALTER TABLE weekly_reviews ADD COLUMN IF NOT EXISTS identity_declaration text;
