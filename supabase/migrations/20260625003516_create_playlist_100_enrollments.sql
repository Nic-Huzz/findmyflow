CREATE TABLE IF NOT EXISTS playlist_100_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  timezone TEXT DEFAULT 'UTC',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE playlist_100_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own enrollment"
  ON playlist_100_enrollments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own enrollment"
  ON playlist_100_enrollments FOR INSERT
  WITH CHECK (auth.uid() = user_id);
