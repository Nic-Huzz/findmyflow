-- =============================================
-- OFFER BUILDER ASSESSMENTS SYSTEM
-- Stores user responses from $100M Offer Builder flow
-- Stage 2: Product Creation
-- =============================================

-- Table: offer_builder_assessments
-- Stores complete offer builder responses
CREATE TABLE IF NOT EXISTS offer_builder_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id UUID NOT NULL,
  user_name TEXT,
  email TEXT,

  -- User responses to all 10 questions
  responses JSONB NOT NULL, -- { q1_pain_level: { value: '8', label: '8' }, q6_niche_layers: { value: '...', type: 'text' }, ... }

  -- Key extracted fields for easy querying
  pain_level TEXT, -- 1-10
  problem_area TEXT, -- health, wealth, relationships
  niche_definition TEXT, -- 4-layer niche text
  chosen_solution TEXT, -- Chosen solution description
  mvp_description TEXT, -- MVP description

  -- Metadata
  project_id UUID REFERENCES user_projects(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Unique constraint on session_id to prevent duplicates
  CONSTRAINT unique_offer_builder_session_id UNIQUE (session_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_offer_builder_user ON offer_builder_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_offer_builder_session ON offer_builder_assessments(session_id);
CREATE INDEX IF NOT EXISTS idx_offer_builder_project ON offer_builder_assessments(project_id);
CREATE INDEX IF NOT EXISTS idx_offer_builder_created ON offer_builder_assessments(created_at DESC);

-- Function: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_offer_builder_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update updated_at
DROP TRIGGER IF EXISTS trigger_offer_builder_updated_at ON offer_builder_assessments;
CREATE TRIGGER trigger_offer_builder_updated_at
  BEFORE UPDATE ON offer_builder_assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_offer_builder_updated_at();

-- RLS Policies
ALTER TABLE offer_builder_assessments ENABLE ROW LEVEL SECURITY;

-- Authenticated users can create assessments
CREATE POLICY "Authenticated users can create offer builder assessments"
  ON offer_builder_assessments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own assessments
CREATE POLICY "Users can view their own offer builder assessments"
  ON offer_builder_assessments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can update their own assessments
CREATE POLICY "Users can update their own offer builder assessments"
  ON offer_builder_assessments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON offer_builder_assessments TO authenticated;

-- Comments
COMMENT ON TABLE offer_builder_assessments IS 'Stores user responses from $100M Offer Builder flow (Stage 2: Product Creation)';
COMMENT ON COLUMN offer_builder_assessments.session_id IS 'Unique session UUID for this assessment';
COMMENT ON COLUMN offer_builder_assessments.responses IS 'JSONB object containing all 10 question responses';
COMMENT ON COLUMN offer_builder_assessments.niche_definition IS 'User''s 4-layer niche definition text';
COMMENT ON COLUMN offer_builder_assessments.chosen_solution IS 'Description of the solution user chose to build';
COMMENT ON COLUMN offer_builder_assessments.mvp_description IS 'Description of minimum viable version';
