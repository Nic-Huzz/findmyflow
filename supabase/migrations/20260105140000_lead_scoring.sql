-- Lead Scoring (Pain/Trust/Urgency/Fit) for sales_deals
-- Adds PTUF scoring columns to track lead quality

-- Add scoring columns
ALTER TABLE sales_deals ADD COLUMN IF NOT EXISTS pain_score INTEGER CHECK (pain_score BETWEEN 1 AND 10);
ALTER TABLE sales_deals ADD COLUMN IF NOT EXISTS pain_notes TEXT;
ALTER TABLE sales_deals ADD COLUMN IF NOT EXISTS trust_score INTEGER CHECK (trust_score BETWEEN 1 AND 10);
ALTER TABLE sales_deals ADD COLUMN IF NOT EXISTS trust_notes TEXT;
ALTER TABLE sales_deals ADD COLUMN IF NOT EXISTS urgency_score INTEGER CHECK (urgency_score BETWEEN 1 AND 10);
ALTER TABLE sales_deals ADD COLUMN IF NOT EXISTS urgency_notes TEXT;
ALTER TABLE sales_deals ADD COLUMN IF NOT EXISTS fit_score INTEGER CHECK (fit_score BETWEEN 1 AND 10);
ALTER TABLE sales_deals ADD COLUMN IF NOT EXISTS fit_notes TEXT;

-- Add total score (computed manually on insert/update since Supabase doesn't support generated columns well)
ALTER TABLE sales_deals ADD COLUMN IF NOT EXISTS lead_total_score INTEGER DEFAULT 0;

-- Add temperature (hot/warm/cold)
ALTER TABLE sales_deals ADD COLUMN IF NOT EXISTS lead_temperature VARCHAR(10) DEFAULT 'cold';

-- Create function to update lead score and temperature
CREATE OR REPLACE FUNCTION update_lead_score()
RETURNS TRIGGER AS $$
BEGIN
  NEW.lead_total_score := COALESCE(NEW.pain_score, 0) + COALESCE(NEW.trust_score, 0) +
                          COALESCE(NEW.urgency_score, 0) + COALESCE(NEW.fit_score, 0);

  NEW.lead_temperature := CASE
    WHEN NEW.lead_total_score >= 32 THEN 'hot'
    WHEN NEW.lead_total_score >= 24 THEN 'warm'
    ELSE 'cold'
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update scores
DROP TRIGGER IF EXISTS trigger_update_lead_score ON sales_deals;
CREATE TRIGGER trigger_update_lead_score
  BEFORE INSERT OR UPDATE ON sales_deals
  FOR EACH ROW
  EXECUTE FUNCTION update_lead_score();

-- Update existing deals to have default scores calculated
UPDATE sales_deals SET lead_total_score = 0, lead_temperature = 'cold'
WHERE lead_total_score IS NULL;
