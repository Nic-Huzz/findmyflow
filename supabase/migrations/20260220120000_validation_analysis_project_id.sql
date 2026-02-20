-- Add project_id to validation_analysis for project-scoped analysis history
ALTER TABLE validation_analysis
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES user_projects(id) ON DELETE SET NULL DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_validation_analysis_project ON validation_analysis(project_id);
