-- Add revenue tracking to experiences
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS total_revenue NUMERIC;
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS revenue_notes TEXT;

-- Add attended boolean to experience_attendees (distinguish invited vs showed up)
ALTER TABLE experience_attendees ADD COLUMN IF NOT EXISTS attended BOOLEAN DEFAULT false;
