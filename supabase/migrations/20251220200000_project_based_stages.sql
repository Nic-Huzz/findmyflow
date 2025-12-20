-- Migration: Project-Based Stage System
-- Date: 2024-12-20
-- Description: Transforms FindMyFlow from persona-centric to project-centric stages
-- Part of major refactor: https://github.com/Nic-Huzz/findmyflow (see docs/2024-12-20-major-refactor-plan.md)

-- =============================================================================
-- 1. ADD ONBOARDING TRACKING TO USER_STAGE_PROGRESS
-- =============================================================================

ALTER TABLE user_stage_progress
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN user_stage_progress.onboarding_completed IS 'Whether user has completed the new onboarding flow (Huzz intro + persona assessment + first project creation)';

-- =============================================================================
-- 2. EXTEND USER_PROJECTS FOR PROJECT-BASED STAGES
-- =============================================================================

-- Add current_stage (1-6 universal stages)
ALTER TABLE user_projects
ADD COLUMN IF NOT EXISTS current_stage INTEGER DEFAULT 1;

COMMENT ON COLUMN user_projects.current_stage IS 'Universal 6-stage progression: 1=Validation, 2=Product Creation, 3=Testing, 4=Money Models, 5=Campaign Creation, 6=Launch';

-- Add total_points for per-project point tracking
ALTER TABLE user_projects
ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0;

COMMENT ON COLUMN user_projects.total_points IS 'Total points earned for this project across all challenges';

-- Add is_primary to mark user''s primary/featured project
ALTER TABLE user_projects
ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN user_projects.is_primary IS 'Whether this is the user''s primary/featured project on dashboard';

-- Add fields for existing project capture flow
ALTER TABLE user_projects
ADD COLUMN IF NOT EXISTS duration TEXT;

COMMENT ON COLUMN user_projects.duration IS 'How long user has been working on this project';

ALTER TABLE user_projects
ADD COLUMN IF NOT EXISTS milestone_moments JSONB;

COMMENT ON COLUMN user_projects.milestone_moments IS 'Array of major milestone moments for the project';

ALTER TABLE user_projects
ADD COLUMN IF NOT EXISTS resistant_moments JSONB;

COMMENT ON COLUMN user_projects.resistant_moments IS 'Array of major resistant/challenging moments for the project';

ALTER TABLE user_projects
ADD COLUMN IF NOT EXISTS current_feeling TEXT;

COMMENT ON COLUMN user_projects.current_feeling IS 'How user currently feels about the project';

-- Add skill, problem, persona links for project context
ALTER TABLE user_projects
ADD COLUMN IF NOT EXISTS linked_skill_cluster_id UUID REFERENCES nikigai_clusters(id);

ALTER TABLE user_projects
ADD COLUMN IF NOT EXISTS linked_problem_cluster_id UUID REFERENCES nikigai_clusters(id);

ALTER TABLE user_projects
ADD COLUMN IF NOT EXISTS linked_persona_cluster_id UUID REFERENCES nikigai_clusters(id);

COMMENT ON COLUMN user_projects.linked_skill_cluster_id IS 'Reference to the skill cluster this project is based on';
COMMENT ON COLUMN user_projects.linked_problem_cluster_id IS 'Reference to the problem cluster this project addresses';
COMMENT ON COLUMN user_projects.linked_persona_cluster_id IS 'Reference to the persona cluster this project serves';

-- =============================================================================
-- 3. LINK CHALLENGES TO PROJECTS
-- =============================================================================

ALTER TABLE challenge_progress
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES user_projects(id);

COMMENT ON COLUMN challenge_progress.project_id IS 'The project this challenge is focused on (locked for duration of challenge)';

-- =============================================================================
-- 4. LINK QUEST COMPLETIONS TO PROJECTS
-- =============================================================================

ALTER TABLE quest_completions
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES user_projects(id);

ALTER TABLE quest_completions
ADD COLUMN IF NOT EXISTS stage TEXT;

COMMENT ON COLUMN quest_completions.project_id IS 'The project this quest completion is associated with';
COMMENT ON COLUMN quest_completions.stage IS 'The stage (1-6) when this quest was completed';

-- =============================================================================
-- 5. LINK FLOW SESSIONS TO PROJECTS
-- =============================================================================

ALTER TABLE flow_sessions
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES user_projects(id);

COMMENT ON COLUMN flow_sessions.project_id IS 'The project this flow session is associated with';

-- =============================================================================
-- 6. CREATE INDEX FOR PERFORMANCE
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_user_projects_primary ON user_projects(user_id, is_primary) WHERE is_primary = true;
CREATE INDEX IF NOT EXISTS idx_user_projects_stage ON user_projects(user_id, current_stage);
CREATE INDEX IF NOT EXISTS idx_challenge_progress_project ON challenge_progress(project_id);
CREATE INDEX IF NOT EXISTS idx_quest_completions_project ON quest_completions(project_id);
CREATE INDEX IF NOT EXISTS idx_flow_sessions_project ON flow_sessions(project_id);

-- =============================================================================
-- 7. HELPER FUNCTION: ENSURE ONLY ONE PRIMARY PROJECT PER USER
-- =============================================================================

CREATE OR REPLACE FUNCTION ensure_single_primary_project()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting a project as primary, unset all others for this user
  IF NEW.is_primary = true THEN
    UPDATE user_projects
    SET is_primary = false
    WHERE user_id = NEW.user_id
      AND id != NEW.id
      AND is_primary = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (drop first if exists)
DROP TRIGGER IF EXISTS trigger_ensure_single_primary_project ON user_projects;
CREATE TRIGGER trigger_ensure_single_primary_project
  BEFORE INSERT OR UPDATE ON user_projects
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_primary_project();

-- =============================================================================
-- 8. STAGE DISPLAY NAMES REFERENCE (for documentation)
-- =============================================================================
-- Stage 1: Validation
-- Stage 2: Product Creation
-- Stage 3: Testing
-- Stage 4: Money Models
-- Stage 5: Campaign Creation
-- Stage 6: Launch

COMMENT ON TABLE user_projects IS 'User projects with universal 6-stage progression. Stages: 1=Validation, 2=Product Creation, 3=Testing, 4=Money Models, 5=Campaign Creation, 6=Launch';
