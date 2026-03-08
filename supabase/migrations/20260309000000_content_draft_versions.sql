-- Content Draft Versions - version history for content review editing
CREATE TABLE IF NOT EXISTS content_draft_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  draft_id UUID NOT NULL REFERENCES content_drafts(id) ON DELETE CASCADE,
  title TEXT,
  body_markdown TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookups by draft
CREATE INDEX idx_content_draft_versions_draft_id ON content_draft_versions(draft_id);

-- RLS
ALTER TABLE content_draft_versions ENABLE ROW LEVEL SECURITY;

-- Match content_drafts RLS policy pattern
CREATE POLICY "content_draft_versions_select"
  ON content_draft_versions FOR SELECT
  USING (true);

CREATE POLICY "content_draft_versions_insert"
  ON content_draft_versions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "content_draft_versions_delete"
  ON content_draft_versions FOR DELETE
  USING (true);
