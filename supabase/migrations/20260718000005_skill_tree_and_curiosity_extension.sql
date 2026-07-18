-- Sprint 6: Skill tree background + curiosity extension

-- Skill progress tracking (background collection, no UI yet)
CREATE TABLE IF NOT EXISTS user_skill_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  skill_id text NOT NULL,
  xp integer DEFAULT 0,
  level text DEFAULT 'education',
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, skill_id)
);

ALTER TABLE user_skill_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Users can read own skill progress" ON user_skill_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can insert own skill progress" ON user_skill_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can update own skill progress" ON user_skill_progress FOR UPDATE USING (auth.uid() = user_id);

-- Atomic skill XP increment (avoids read-modify-write race)
CREATE OR REPLACE FUNCTION increment_skill_xp(p_user_id uuid, p_skill_id text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO user_skill_progress (user_id, skill_id, xp, level)
  VALUES (p_user_id, p_skill_id, 1, 'education')
  ON CONFLICT (user_id, skill_id)
  DO UPDATE SET xp = user_skill_progress.xp + 1,
                level = CASE WHEN user_skill_progress.xp + 1 >= 25 THEN 'teaching'
                             WHEN user_skill_progress.xp + 1 >= 15 THEN 'charging'
                             WHEN user_skill_progress.xp + 1 >= 8  THEN 'practising'
                             WHEN user_skill_progress.xp + 1 >= 3  THEN 'testing'
                             ELSE 'education' END,
                updated_at = now();
END; $$;

-- Atomic behavioral evidence increment (avoids read-modify-write race)
CREATE OR REPLACE FUNCTION increment_behavioral_evidence(p_cluster_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE nikigai_clusters
  SET behavioral_evidence = COALESCE(behavioral_evidence, 0) + 1
  WHERE id = p_cluster_id;
END; $$;

-- Curiosity clusters: add taxonomy tags
ALTER TABLE curiosity_clusters ADD COLUMN IF NOT EXISTS skills text[];
ALTER TABLE curiosity_clusters ADD COLUMN IF NOT EXISTS problems text[];
