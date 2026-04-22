-- ============================================================================
-- Experience Attendees (join table: crm_contacts x experiences)
-- Enables: per-experience attendee lists, repeat rate calculation
-- ============================================================================

CREATE TABLE IF NOT EXISTS experience_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id UUID NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT ea_unique_attendance UNIQUE (experience_id, contact_id)
);

CREATE INDEX IF NOT EXISTS idx_experience_attendees_experience
  ON experience_attendees(experience_id);
CREATE INDEX IF NOT EXISTS idx_experience_attendees_contact
  ON experience_attendees(contact_id);
CREATE INDEX IF NOT EXISTS idx_experience_attendees_user
  ON experience_attendees(user_id);

ALTER TABLE experience_attendees ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
CREATE POLICY "Users can view own attendees"
  ON experience_attendees FOR SELECT
  USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE POLICY "Users can insert own attendees"
  ON experience_attendees FOR INSERT
  WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE POLICY "Users can delete own attendees"
  ON experience_attendees FOR DELETE
  USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
-- Experience Costs (line items per experience)
-- Enables: revenue vs cost tracking, profit per experience
-- ============================================================================

CREATE TABLE IF NOT EXISTS experience_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id UUID NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'other',
  label TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT ec_category_check CHECK (category IN ('venue', 'marketing', 'materials', 'staff', 'other'))
);

CREATE INDEX IF NOT EXISTS idx_experience_costs_experience
  ON experience_costs(experience_id);

ALTER TABLE experience_costs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
CREATE POLICY "Users can view own costs"
  ON experience_costs FOR SELECT
  USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE POLICY "Users can insert own costs"
  ON experience_costs FOR INSERT
  WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE POLICY "Users can update own costs"
  ON experience_costs FOR UPDATE
  USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE POLICY "Users can delete own costs"
  ON experience_costs FOR DELETE
  USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Add ticket_price to experiences for revenue calculation
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS ticket_price NUMERIC(10,2);
