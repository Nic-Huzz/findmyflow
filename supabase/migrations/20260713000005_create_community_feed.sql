-- Community Feed tables for Social V1
-- Single table for all feed content (auto + opt-in)

CREATE TABLE community_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL,
    -- Auto: 'stage_graduation' | 'streak_milestone' | 'level_up' | 'first_wahoo' | 'first_vibe_rise' | 'insight_unlocked' | 'league_win'
    -- Opt-in: 'shared_wahoo' | 'shared_healing' | 'shared_weekly_review'
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT,              -- Photo from ShareWinStep (opt-in only)
  metadata JSONB,              -- Event-specific data (stage number, streak days, wahoo classification, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Deduplication: prevent double-posting AUTO events only.
-- Opt-in shares (shared_wahoo, shared_healing, shared_weekly_review) are NOT deduped
-- because users should be able to share multiple wahoos with the same title on different days.
CREATE UNIQUE INDEX unique_auto_event
  ON community_feed(user_id, event_type, title)
  WHERE event_type NOT IN ('shared_wahoo', 'shared_healing', 'shared_weekly_review');

ALTER TABLE community_feed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users read all" ON community_feed
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users insert own" ON community_feed
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_community_feed_time ON community_feed(created_at DESC);
CREATE INDEX idx_community_feed_user ON community_feed(user_id);

-- Reactions table for community feed items
CREATE TABLE community_feed_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_item_id UUID REFERENCES community_feed(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reaction_type TEXT NOT NULL, -- 'cheer' | 'fire' | 'clap' | 'heart'
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_reaction UNIQUE (feed_item_id, user_id, reaction_type)
);

ALTER TABLE community_feed_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read all" ON community_feed_reactions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users manage own" ON community_feed_reactions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_feed_reactions_item ON community_feed_reactions(feed_item_id);
