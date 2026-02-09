-- Track stage graduation events for timeline visualization
-- A trigger logs each stage change on user_projects

-- 1. History table
CREATE TABLE IF NOT EXISTS stage_graduation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES user_projects(id) ON DELETE CASCADE,
  from_stage INTEGER,
  to_stage INTEGER NOT NULL,
  graduated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_stage_grad_user ON stage_graduation_history(user_id);
CREATE INDEX idx_stage_grad_project ON stage_graduation_history(project_id);
CREATE INDEX idx_stage_grad_date ON stage_graduation_history(graduated_at);

-- 2. RLS
ALTER TABLE stage_graduation_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own stage graduations"
  ON stage_graduation_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stage graduations"
  ON stage_graduation_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3. Trigger function: log when current_stage changes
CREATE OR REPLACE FUNCTION log_stage_graduation()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.current_stage IS DISTINCT FROM NEW.current_stage THEN
    INSERT INTO stage_graduation_history (user_id, project_id, from_stage, to_stage, graduated_at)
    VALUES (NEW.user_id, NEW.id, OLD.current_stage, NEW.current_stage, now());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_stage_graduation
  AFTER UPDATE ON user_projects
  FOR EACH ROW
  EXECUTE FUNCTION log_stage_graduation();

-- 4. Backfill: create an initial record for each existing project's current stage
-- We don't know the exact graduation dates, so use the project's created_at
INSERT INTO stage_graduation_history (user_id, project_id, from_stage, to_stage, graduated_at)
SELECT user_id, id, NULL, current_stage, created_at
FROM user_projects
WHERE current_stage IS NOT NULL;
