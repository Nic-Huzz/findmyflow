-- Instagram Integration: user_integrations, instagram_metrics, instagram_posts

-- 1. User integrations (Composio entity mapping, extensible to other platforms)
CREATE TABLE IF NOT EXISTS user_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  platform TEXT NOT NULL,
  platform_user_id TEXT,
  platform_username TEXT,
  composio_entity_id TEXT,
  composio_connection_id TEXT,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  last_synced_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'disconnected', 'error')),
  UNIQUE(user_id, platform)
);

-- 2. Daily account-level Instagram metrics
CREATE TABLE IF NOT EXISTS instagram_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  followers INT,
  following INT,
  reach INT,
  views INT,
  accounts_engaged INT,
  total_interactions INT,
  likes INT,
  comments INT,
  shares INT,
  saves INT,
  profile_link_taps INT,
  follows_net INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- 3. Per-post data with experience tagging
CREATE TABLE IF NOT EXISTS instagram_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  ig_media_id TEXT NOT NULL,
  caption TEXT,
  media_type TEXT,
  media_product_type TEXT,
  permalink TEXT,
  thumbnail_url TEXT,
  posted_at TIMESTAMPTZ,
  like_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  shares INT DEFAULT 0,
  saves INT DEFAULT 0,
  reach INT DEFAULT 0,
  views INT DEFAULT 0,
  experience_id UUID REFERENCES experiences(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, ig_media_id)
);

-- RLS
ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own integrations"
  ON user_integrations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own instagram metrics"
  ON instagram_metrics FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own instagram posts"
  ON instagram_posts FOR ALL USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_ig_posts_experience ON instagram_posts(experience_id) WHERE experience_id IS NOT NULL;
CREATE INDEX idx_ig_posts_user_posted ON instagram_posts(user_id, posted_at DESC);
CREATE INDEX idx_ig_metrics_user_date ON instagram_metrics(user_id, date DESC);
CREATE INDEX idx_user_integrations_platform ON user_integrations(user_id, platform);
