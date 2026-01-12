-- Give/Ask Content Tagging with CTA Tracking
-- Hormozi-style content classification: Give (brand building) vs Ask (sales)

-- Add content intent and CTA tracking columns to content_history
ALTER TABLE content_history
ADD COLUMN IF NOT EXISTS content_intent TEXT DEFAULT 'give' CHECK (content_intent IN ('give', 'ask')),
ADD COLUMN IF NOT EXISTS cta_type TEXT CHECK (cta_type IN ('dm', 'link', 'comment', 'signup', 'call', 'none')),
ADD COLUMN IF NOT EXISTS cta_text TEXT,
ADD COLUMN IF NOT EXISTS cta_engagements INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS cta_conversions INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS funnel_stage_target TEXT CHECK (funnel_stage_target IN ('awareness', 'attraction', 'lead', 'nurture', 'customer', 'upsell'));

-- Add column to track which funnel entries came from which content
ALTER TABLE funnel_metrics
ADD COLUMN IF NOT EXISTS source_content_ids JSONB DEFAULT '[]'::jsonb;

-- Create table to track individual CTA conversions
CREATE TABLE IF NOT EXISTS cta_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content_id UUID REFERENCES content_history(id) ON DELETE CASCADE NOT NULL,

  -- What happened
  conversion_type TEXT NOT NULL CHECK (conversion_type IN ('dm_received', 'link_click', 'comment', 'signup', 'call_booked', 'lead', 'customer')),

  -- Value tracking
  revenue_attributed DECIMAL(10,2) DEFAULT 0,
  lead_id UUID, -- Optional: link to CRM lead if applicable

  -- Metadata
  notes TEXT,
  converted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_cta_conversions_content ON cta_conversions(content_id);
CREATE INDEX IF NOT EXISTS idx_cta_conversions_user ON cta_conversions(user_id);
CREATE INDEX IF NOT EXISTS idx_content_history_intent ON content_history(content_intent) WHERE content_intent IS NOT NULL;

-- Enable RLS
ALTER TABLE cta_conversions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own CTA conversions" ON cta_conversions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own CTA conversions" ON cta_conversions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own CTA conversions" ON cta_conversions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own CTA conversions" ON cta_conversions
  FOR DELETE USING (auth.uid() = user_id);

-- Comments for documentation
COMMENT ON COLUMN content_history.content_intent IS 'Give = brand building (value, education). Ask = sales (offers, CTAs)';
COMMENT ON COLUMN content_history.cta_type IS 'Type of call-to-action: dm, link, comment keyword, signup form, call booking';
COMMENT ON COLUMN content_history.cta_engagements IS 'Number of people who engaged with the CTA (clicked, DMed, commented)';
COMMENT ON COLUMN content_history.cta_conversions IS 'Number of conversions from this CTA (leads, sales)';
COMMENT ON COLUMN content_history.funnel_stage_target IS 'Which funnel stage this content is designed to feed into';
