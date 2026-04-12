-- Play-List Feed: public newsfeed for groan challenge wins with photos
-- Powers the 100-day Play-List Challenge virality loop.
--
-- Tables:
--   playlist_100_enrollments  one row per enrolled user, anchors day_number
--   playlist_feed_posts       one row per shared groan completion (photo + caption)
--   playlist_feed_reactions   cheer/fire/clap/heart on posts
--
-- Storage:
--   playlist-feed bucket, public read, owner write, 5MB image limit

-- ============================================
-- 1. playlist_100_enrollments
-- ============================================
CREATE TABLE IF NOT EXISTS playlist_100_enrollments (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  goal_days INT NOT NULL DEFAULT 100,
  timezone TEXT
);

ALTER TABLE playlist_100_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "playlist_enrollments_select_public" ON playlist_100_enrollments
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "playlist_enrollments_insert_own" ON playlist_100_enrollments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "playlist_enrollments_update_own" ON playlist_100_enrollments
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- ============================================
-- 2. playlist_feed_posts
-- ============================================
CREATE TABLE IF NOT EXISTS playlist_feed_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  groan_challenge_id UUID,
  challenge_title TEXT,
  visibility_layer TEXT,
  scary_score INT,
  wahoo_score INT,
  media_url TEXT NOT NULL,
  media_width INT,
  media_height INT,
  caption TEXT CHECK (caption IS NULL OR char_length(caption) <= 280),
  day_number INT,
  display_name TEXT,
  essence_archetype TEXT,
  hero_avatar_url TEXT,
  visibility TEXT NOT NULL DEFAULT 'public'
    CHECK (visibility IN ('public', 'enrolled_only', 'private')),
  moderation_status TEXT NOT NULL DEFAULT 'approved'
    CHECK (moderation_status IN ('approved', 'pending', 'flagged', 'removed')),
  reaction_counts JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_playlist_feed_public_recent
  ON playlist_feed_posts (created_at DESC)
  WHERE visibility = 'public' AND moderation_status = 'approved';

CREATE INDEX idx_playlist_feed_user
  ON playlist_feed_posts (user_id, created_at DESC);

ALTER TABLE playlist_feed_posts ENABLE ROW LEVEL SECURITY;

-- Public read for approved public posts (anon allowed for virality)
CREATE POLICY "playlist_posts_select_public" ON playlist_feed_posts
  FOR SELECT TO anon, authenticated
  USING (visibility = 'public' AND moderation_status = 'approved');

-- Owner can always read their own posts regardless of status
CREATE POLICY "playlist_posts_select_own" ON playlist_feed_posts
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "playlist_posts_insert_own" ON playlist_feed_posts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "playlist_posts_update_own" ON playlist_feed_posts
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "playlist_posts_delete_own" ON playlist_feed_posts
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Admin moderation: admins can read all and update moderation_status
CREATE POLICY "playlist_posts_select_admin" ON playlist_feed_posts
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

CREATE POLICY "playlist_posts_update_admin" ON playlist_feed_posts
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

-- ============================================
-- 3. playlist_feed_reactions
-- ============================================
CREATE TABLE IF NOT EXISTS playlist_feed_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES playlist_feed_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL
    CHECK (reaction_type IN ('cheer', 'fire', 'clap', 'heart')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id, reaction_type)
);

CREATE INDEX idx_playlist_reactions_post ON playlist_feed_reactions(post_id);
CREATE INDEX idx_playlist_reactions_user ON playlist_feed_reactions(user_id);

ALTER TABLE playlist_feed_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "playlist_reactions_select_public" ON playlist_feed_reactions
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "playlist_reactions_insert_own" ON playlist_feed_reactions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "playlist_reactions_delete_own" ON playlist_feed_reactions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================
-- 4. Reaction count trigger
-- ============================================
-- Keeps playlist_feed_posts.reaction_counts in sync so the feed query stays cheap.
CREATE OR REPLACE FUNCTION update_playlist_feed_reaction_counts()
RETURNS TRIGGER AS $$
DECLARE
  v_post_id UUID;
  v_counts JSONB;
BEGIN
  v_post_id := COALESCE(NEW.post_id, OLD.post_id);

  SELECT COALESCE(jsonb_object_agg(reaction_type, cnt), '{}'::jsonb)
  INTO v_counts
  FROM (
    SELECT reaction_type, COUNT(*)::INT AS cnt
    FROM playlist_feed_reactions
    WHERE post_id = v_post_id
    GROUP BY reaction_type
  ) sub;

  UPDATE playlist_feed_posts
  SET reaction_counts = v_counts
  WHERE id = v_post_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_playlist_feed_reaction_counts
  AFTER INSERT OR DELETE ON playlist_feed_reactions
  FOR EACH ROW EXECUTE FUNCTION update_playlist_feed_reaction_counts();

-- ============================================
-- 5. Public feed RPC (replaces direct table query for anon users)
-- ============================================
-- Centralizes the feed query so we can layer ranking/filters later.
CREATE OR REPLACE FUNCTION get_playlist_feed(
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  challenge_title TEXT,
  visibility_layer TEXT,
  scary_score INT,
  wahoo_score INT,
  media_url TEXT,
  media_width INT,
  media_height INT,
  caption TEXT,
  day_number INT,
  display_name TEXT,
  essence_archetype TEXT,
  hero_avatar_url TEXT,
  reaction_counts JSONB,
  created_at TIMESTAMPTZ
) AS $$
  SELECT
    p.id, p.user_id, p.challenge_title, p.visibility_layer,
    p.scary_score, p.wahoo_score, p.media_url, p.media_width, p.media_height,
    p.caption, p.day_number, p.display_name, p.essence_archetype, p.hero_avatar_url,
    p.reaction_counts, p.created_at
  FROM playlist_feed_posts p
  WHERE p.visibility = 'public'
    AND p.moderation_status = 'approved'
  ORDER BY p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_playlist_feed(INT, INT) TO anon, authenticated;

-- ============================================
-- 6. Storage bucket
-- ============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'playlist-feed',
  'playlist-feed',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Authenticated users upload to their own folder: <user_id>/<filename>
CREATE POLICY "playlist_feed_upload_own"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'playlist-feed'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Public read (anon viewers should see images)
CREATE POLICY "playlist_feed_read_public"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'playlist-feed');

-- Owners can delete their own uploads
CREATE POLICY "playlist_feed_delete_own"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'playlist-feed'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
