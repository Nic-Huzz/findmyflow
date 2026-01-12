-- Competence Wheels Database Schema
-- Stores wheel state, segment data, and product blueprints for the
-- Circle of Competence visualization system

-- ============================================================================
-- COMPETENCE WHEELS - Main table storing wheel state per user per project
-- ============================================================================

CREATE TABLE IF NOT EXISTS competence_wheels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES user_projects(id) ON DELETE CASCADE,
  wheel_type TEXT NOT NULL CHECK (wheel_type IN ('problems', 'skills', 'persona')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, project_id, wheel_type)
);

-- Enable RLS
ALTER TABLE competence_wheels ENABLE ROW LEVEL SECURITY;

-- Users can only see their own wheels
CREATE POLICY "Users can view own wheels"
  ON competence_wheels FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wheels"
  ON competence_wheels FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wheels"
  ON competence_wheels FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own wheels"
  ON competence_wheels FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- WHEEL SEGMENTS - Individual segment states within each wheel
-- ============================================================================

CREATE TABLE IF NOT EXISTS wheel_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wheel_id UUID REFERENCES competence_wheels(id) ON DELETE CASCADE,
  segment_id TEXT NOT NULL, -- e.g., 'analyzing', 'economic_freedom', 'seekers'
  is_lit BOOLEAN DEFAULT FALSE,

  -- For 2D wheels (rings)
  ring TEXT, -- 'inner', 'middle', 'outer' (maturity for skills, journey for persona)
  problem_type TEXT, -- For problem wheel: 'access', 'knowledge', 'capability', 'motivation', 'connection', 'system'

  -- Bonus dimensions
  energy_source TEXT, -- For skills: 'intrinsic', 'developed', 'compensated'
  engagement_depth TEXT, -- For persona: 'diy', 'guided', 'done_with'

  -- Metadata
  response_count INTEGER DEFAULT 0,
  confidence DECIMAL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(wheel_id, segment_id)
);

-- Enable RLS
ALTER TABLE wheel_segments ENABLE ROW LEVEL SECURITY;

-- Users can manage segments through wheel ownership
CREATE POLICY "Users can view segments of own wheels"
  ON wheel_segments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM competence_wheels cw
      WHERE cw.id = wheel_segments.wheel_id
      AND cw.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert segments to own wheels"
  ON wheel_segments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM competence_wheels cw
      WHERE cw.id = wheel_segments.wheel_id
      AND cw.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update segments of own wheels"
  ON wheel_segments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM competence_wheels cw
      WHERE cw.id = wheel_segments.wheel_id
      AND cw.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete segments from own wheels"
  ON wheel_segments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM competence_wheels cw
      WHERE cw.id = wheel_segments.wheel_id
      AND cw.user_id = auth.uid()
    )
  );

-- ============================================================================
-- SEGMENT RESPONSES - Links Flow Finder responses to wheel segments
-- ============================================================================

CREATE TABLE IF NOT EXISTS segment_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_id UUID REFERENCES wheel_segments(id) ON DELETE CASCADE,
  response_id UUID REFERENCES nikigai_responses(id) ON DELETE CASCADE,
  confidence DECIMAL DEFAULT 0.8, -- AI classification confidence
  classified_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(segment_id, response_id)
);

-- Enable RLS
ALTER TABLE segment_responses ENABLE ROW LEVEL SECURITY;

-- Users can manage segment responses through segment ownership
CREATE POLICY "Users can view segment responses through wheel ownership"
  ON segment_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM wheel_segments ws
      JOIN competence_wheels cw ON cw.id = ws.wheel_id
      WHERE ws.id = segment_responses.segment_id
      AND cw.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert segment responses"
  ON segment_responses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM wheel_segments ws
      JOIN competence_wheels cw ON cw.id = ws.wheel_id
      WHERE ws.id = segment_responses.segment_id
      AND cw.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete segment responses"
  ON segment_responses FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM wheel_segments ws
      JOIN competence_wheels cw ON cw.id = ws.wheel_id
      WHERE ws.id = segment_responses.segment_id
      AND cw.user_id = auth.uid()
    )
  );

-- ============================================================================
-- WHEEL SNAPSHOTS - Track wheel changes over time for temporal visualization
-- ============================================================================

CREATE TABLE IF NOT EXISTS wheel_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wheel_id UUID REFERENCES competence_wheels(id) ON DELETE CASCADE,
  snapshot JSONB NOT NULL, -- Full state of all segments at this point
  snapshot_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE wheel_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view snapshots of own wheels"
  ON wheel_snapshots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM competence_wheels cw
      WHERE cw.id = wheel_snapshots.wheel_id
      AND cw.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert snapshots to own wheels"
  ON wheel_snapshots FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM competence_wheels cw
      WHERE cw.id = wheel_snapshots.wheel_id
      AND cw.user_id = auth.uid()
    )
  );

-- ============================================================================
-- PRODUCT BLUEPRINTS - Generated product specs from wheels
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_blueprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES user_projects(id) ON DELETE CASCADE,

  -- From wheels
  problem_domain TEXT NOT NULL,        -- Primary problem segment from Problem Wheel
  problem_type TEXT NOT NULL,          -- Access/Knowledge/Capability/Motivation/Connection/System
  persona_psychographic TEXT NOT NULL, -- Primary persona segment from Persona Wheel
  persona_journey TEXT NOT NULL,       -- Awakening/Struggling/Ready

  -- User selections
  delivery_method TEXT NOT NULL,       -- Content/Group/1:1/Done-for/Software
  mvp_features JSONB NOT NULL,         -- Array of selected MVP features
  phase2_features JSONB,               -- Array of Phase 2 features
  phase3_features JSONB,               -- Array of Phase 3 features
  custom_features JSONB,               -- User-added custom features

  -- Tech stack
  tech_stack JSONB NOT NULL,           -- Recommended platforms/tools
  estimated_monthly_cost DECIMAL,      -- Calculated monthly cost

  -- Metadata
  blueprint_name TEXT,                 -- User-defined name
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE product_blueprints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own blueprints"
  ON product_blueprints FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own blueprints"
  ON product_blueprints FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own blueprints"
  ON product_blueprints FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own blueprints"
  ON product_blueprints FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- INDEXES for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_wheels_user_project ON competence_wheels(user_id, project_id);
CREATE INDEX IF NOT EXISTS idx_wheels_user ON competence_wheels(user_id);
CREATE INDEX IF NOT EXISTS idx_segments_wheel ON wheel_segments(wheel_id);
CREATE INDEX IF NOT EXISTS idx_segments_segment_id ON wheel_segments(segment_id);
CREATE INDEX IF NOT EXISTS idx_segment_responses_segment ON segment_responses(segment_id);
CREATE INDEX IF NOT EXISTS idx_segment_responses_response ON segment_responses(response_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_wheel ON wheel_snapshots(wheel_id);
CREATE INDEX IF NOT EXISTS idx_blueprints_user ON product_blueprints(user_id);
CREATE INDEX IF NOT EXISTS idx_blueprints_user_project ON product_blueprints(user_id, project_id);

-- ============================================================================
-- FUNCTIONS for wheel management
-- ============================================================================

-- Function to update wheel_segments.updated_at on change
CREATE OR REPLACE FUNCTION update_wheel_segment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_wheel_segments_timestamp
  BEFORE UPDATE ON wheel_segments
  FOR EACH ROW
  EXECUTE FUNCTION update_wheel_segment_timestamp();

-- Function to update competence_wheels.updated_at on change
CREATE OR REPLACE FUNCTION update_competence_wheel_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_competence_wheels_timestamp
  BEFORE UPDATE ON competence_wheels
  FOR EACH ROW
  EXECUTE FUNCTION update_competence_wheel_timestamp();

-- Function to update product_blueprints.updated_at on change
CREATE OR REPLACE FUNCTION update_blueprint_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_product_blueprints_timestamp
  BEFORE UPDATE ON product_blueprints
  FOR EACH ROW
  EXECUTE FUNCTION update_blueprint_timestamp();

-- ============================================================================
-- HELPER FUNCTION: Get or create wheel for user/project
-- ============================================================================

CREATE OR REPLACE FUNCTION get_or_create_wheel(
  p_user_id UUID,
  p_project_id UUID,
  p_wheel_type TEXT
)
RETURNS UUID AS $$
DECLARE
  v_wheel_id UUID;
BEGIN
  -- Try to get existing wheel
  SELECT id INTO v_wheel_id
  FROM competence_wheels
  WHERE user_id = p_user_id
    AND project_id = p_project_id
    AND wheel_type = p_wheel_type;

  -- Create if doesn't exist
  IF v_wheel_id IS NULL THEN
    INSERT INTO competence_wheels (user_id, project_id, wheel_type)
    VALUES (p_user_id, p_project_id, p_wheel_type)
    RETURNING id INTO v_wheel_id;
  END IF;

  RETURN v_wheel_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- HELPER FUNCTION: Light up a segment
-- ============================================================================

CREATE OR REPLACE FUNCTION light_segment(
  p_wheel_id UUID,
  p_segment_id TEXT,
  p_ring TEXT DEFAULT NULL,
  p_problem_type TEXT DEFAULT NULL,
  p_confidence DECIMAL DEFAULT 0.8
)
RETURNS UUID AS $$
DECLARE
  v_segment_id UUID;
BEGIN
  -- Upsert the segment
  INSERT INTO wheel_segments (wheel_id, segment_id, is_lit, ring, problem_type, confidence, response_count)
  VALUES (p_wheel_id, p_segment_id, TRUE, p_ring, p_problem_type, p_confidence, 1)
  ON CONFLICT (wheel_id, segment_id)
  DO UPDATE SET
    is_lit = TRUE,
    ring = COALESCE(EXCLUDED.ring, wheel_segments.ring),
    problem_type = COALESCE(EXCLUDED.problem_type, wheel_segments.problem_type),
    confidence = GREATEST(wheel_segments.confidence, EXCLUDED.confidence),
    response_count = wheel_segments.response_count + 1,
    updated_at = NOW()
  RETURNING id INTO v_segment_id;

  RETURN v_segment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
