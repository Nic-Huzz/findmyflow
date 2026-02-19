-- Add optional project_id to validation_flows
ALTER TABLE validation_flows
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES user_projects(id) ON DELETE SET NULL DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_validation_flows_project ON validation_flows(project_id);
