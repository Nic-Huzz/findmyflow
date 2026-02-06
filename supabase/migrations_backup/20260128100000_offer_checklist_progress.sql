-- Offer Checklist Progress Table
-- Stores user progress through implementation checklists for each offer type

CREATE TABLE IF NOT EXISTS offer_checklist_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- attraction, upsell, downsell, continuity
  offer_type TEXT, -- specific offer type within category (e.g., 'win_your_money_back')
  checked_items JSONB DEFAULT '{}', -- { item_id: true/false }
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, category)
);

-- Enable RLS
ALTER TABLE offer_checklist_progress ENABLE ROW LEVEL SECURITY;

-- Users can only access their own progress
CREATE POLICY "Users can view own checklist progress"
  ON offer_checklist_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own checklist progress"
  ON offer_checklist_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own checklist progress"
  ON offer_checklist_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX idx_offer_checklist_user_category ON offer_checklist_progress(user_id, category);
