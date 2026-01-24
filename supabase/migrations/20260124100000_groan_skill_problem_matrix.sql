-- Migration: Add Skill × Problem Matrix columns to groan_challenges
-- Created: 2025-01-24
-- Purpose: Enable Skill × Problem matrix view in Groan Matrix

-- Add 'skill_x_problem' to the groan_source_type enum
ALTER TYPE groan_source_type ADD VALUE IF NOT EXISTS 'skill_x_problem';

-- Add columns for Skill × Problem matrix
ALTER TABLE groan_challenges
ADD COLUMN IF NOT EXISTS skill_cluster_id UUID REFERENCES nikigai_clusters(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS problem_cluster_id UUID REFERENCES nikigai_clusters(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS persona_cluster_id UUID REFERENCES nikigai_clusters(id) ON DELETE SET NULL;

-- Add comments for documentation
COMMENT ON COLUMN groan_challenges.skill_cluster_id IS 'Reference to skill cluster for Skill × Problem matrix challenges';
COMMENT ON COLUMN groan_challenges.problem_cluster_id IS 'Reference to problem cluster for Skill × Problem matrix challenges';
COMMENT ON COLUMN groan_challenges.persona_cluster_id IS 'Optional reference to persona cluster for filtered Skill × Problem challenges';

-- Create index for efficient lookups on Skill × Problem matrix
CREATE INDEX IF NOT EXISTS idx_groan_challenges_skill_problem
ON groan_challenges(user_id, skill_cluster_id, problem_cluster_id)
WHERE skill_cluster_id IS NOT NULL AND problem_cluster_id IS NOT NULL;

-- Create index for persona-filtered queries
CREATE INDEX IF NOT EXISTS idx_groan_challenges_skill_problem_persona
ON groan_challenges(user_id, skill_cluster_id, problem_cluster_id, persona_cluster_id)
WHERE skill_cluster_id IS NOT NULL AND problem_cluster_id IS NOT NULL AND persona_cluster_id IS NOT NULL;
