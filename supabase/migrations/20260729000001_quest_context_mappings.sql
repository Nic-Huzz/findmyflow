-- Quest context mappings: maps Claude Code directories and Claude Desktop
-- project folders to quests for automatic session sync.
CREATE TABLE IF NOT EXISTS quest_context_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  quest_id uuid REFERENCES quests(id) ON DELETE CASCADE NOT NULL,
  context_type text NOT NULL,
  context_identifier text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, context_type, context_identifier)
);

ALTER TABLE quest_context_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own context mappings"
  ON quest_context_mappings FOR ALL
  USING (auth.uid() = user_id);
