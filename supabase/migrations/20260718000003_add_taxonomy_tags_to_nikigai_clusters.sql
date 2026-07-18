-- Sprint 4: Cluster taxonomy tagging for mirror re-generation
ALTER TABLE nikigai_clusters ADD COLUMN IF NOT EXISTS skill_tags text[];
ALTER TABLE nikigai_clusters ADD COLUMN IF NOT EXISTS problem_tags text[];
ALTER TABLE nikigai_clusters ADD COLUMN IF NOT EXISTS persona_tags text[];
