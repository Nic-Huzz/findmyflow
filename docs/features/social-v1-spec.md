# Social V1 — Community Feed Spec

**Created:** 2026-07-13
**Status:** Aligned — ready for implementation planning
**Impact:** CD5 Social 5 → 8 (+39 Octalysis points, biggest remaining gap)

---

## The Problem

Social infrastructure EXISTS but has no visible surface:
- `playlist_feed_posts` table stores shared wahoos (created by ShareWinStep in GroanCompletionModal)
- `league_content_reactions` table has 4 reaction types (🎉 🔥 👏 💜)
- `NewsfeedPage.jsx` exists at `/newsfeed` but has ZERO links from anywhere in the app
- `PlaylistFeed.jsx` exists at `/play-list-feed` but is inaccessible
- ShareWinStep creates content that nobody can see
- Group codes with WhatsApp are inaccessible

**Solution:** Make the feed visible from TWO entry points, and auto-populate it with achievement events.

---

## Where the Feed Lives

### Entry Point 1: Challenge Header

In the purple header section (next to the existing 🔥 streak counter and 🏆 Leaderboard button), add a Community/Feed button. Same row, same visual weight.

```
🔥 61    🏆 Leaderboard    📣 Community    ⚙️
```

Tapping navigates to `/community` (new route).

### Entry Point 2: Inside Courage Tab

At the bottom of the Courage tab (after the user's wahoo list), a "Community Courage" section showing the 3 most recent shared wahoos from other users. Acts as inspiration + social proof.

```
── Community Courage ──
[Avatar] Sarah: "Spoke up in a meeting" 🔥 3
[Avatar] Alex: "First cold plunge" 🎉 5
[Avatar] You: "Cold water swim at 6am" 💜 2
                           See all →
```

"See all →" navigates to `/community` (same destination as header button).

---

## Content: Auto vs Opt-In

### The Line

Auto-post things that are ACHIEVEMENTS (milestones, graduations, streaks). Never auto-post things that are VULNERABLE (healing, NS state, fears, protective voices).

### Auto-Post Events (no user action needed)

| Event | Template | Data Source |
|---|---|---|
| Stage graduation | "[Name] reached Stage [N]: [Stage Name]" | `user_stage_progress` changes (heroStageChecker) |
| Streak milestone (7/14/21/30/60/100) | "[Name] hit a [N]-day streak" | `groan_streaks` |
| RP level up | "[Name] reached [Level Name]" | RP level calculation |
| First wahoo ever | "[Name] completed their first wahoo" | First `quest_completions` WHERE `quest_category = 'Groans'` |
| First Vibe Rise wahoo | "[Name] just hit Vibe Rise for the first time" | First wahoo with classification = 'vibe' |
| Insight Drop (Uncommon+) | "[Name] unlocked: [Insight Title]" | InsightDrop system |
| Fantasy League win | "[Name] won their matchup this week" | League scoring |

### Opt-In Events (user chooses to share)

| Event | Mechanism | What Gets Shared | What Stays Private |
|---|---|---|---|
| Wahoo completion | ShareWinStep (already exists in GroanCompletionModal) | Photo + caption + wahoo title | Classification (Pressure/Uninterested), voice objection text |
| Healing flow completed | Post-completion prompt: "Share that you did the work?" | "[Name] completed a healing flow" (no details) | Pattern, fear, origin, rewire, protective voice |
| Unstick Flow completed | Post-completion prompt: "Share the wahoo you created?" | The wahoo title only | Avoidance text, worst-case fear |
| Weekly Review | Existing shareable card (WeeklyReviewCard) | Canvas card image | Multiplier scores optional |

### Never Shared

| Data | Why |
|---|---|
| Daily check-in NS state | Too personal. NS state is private. |
| Protective voice name/count | Vulnerable self-knowledge. |
| Healing flow content (pattern/fear/origin) | Core therapeutic data. |
| Unstick Flow avoidance/fear text | Personal fears are not community content. |
| Zarlo Brief patterns | AI observations are private. |

---

## Feed Design

### Feed Item Structure

Each feed item follows the existing `ContentCard` pattern from `NewsfeedPage.jsx`:

```
┌─────────────────────────────────────┐
│ [Avatar] Sarah              2h ago  │
│                                     │
│ Reached Stage 5: First Vibe Rise    │
│ "I didn't know I could feel this    │
│  alive."                            │
│                                     │
│ 📸 [photo if shared wahoo]          │
│                                     │
│ 🎉 3  🔥 1  👏 2  💜 4              │
└─────────────────────────────────────┘
```

### Auto-Post Visual Variants

| Event Type | Accent | Icon |
|---|---|---|
| Stage graduation | Gold border left | 🏔️ |
| Streak milestone | Fire gradient border | 🔥 |
| RP level up | Purple border | ⚡ |
| First wahoo / first Vibe Rise | Gold background tint | ✨ |
| Insight unlocked | Purple glow | 🔮 |
| League win | Trophy accent | 🏆 |
| Shared wahoo (opt-in) | Standard (white) | 💪 |

### Cumulative Counter (top of feed)

```
═══════════════════════════════════════
  142 wahoos completed this month
  You contributed 12 of them
═══════════════════════════════════════
```

Query: `SELECT COUNT(*) FROM quest_completions WHERE quest_category = 'Groans' AND created_at >= date_trunc('month', now())`

---

## Data Architecture

### ONE Table: `community_feed`

All feed content (auto-posted AND opt-in) lives in a single table. No client-side merging. One query, one reaction system, one card component.

```sql
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
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Deduplication: prevent double-posting the same event
  -- e.g. (user_id, 'stage_graduation', '{"stage": 5}') can only exist once
  CONSTRAINT unique_event UNIQUE (user_id, event_type, title)
);

ALTER TABLE community_feed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users read all" ON community_feed
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users insert own" ON community_feed
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_community_feed_time ON community_feed(created_at DESC);
CREATE INDEX idx_community_feed_user ON community_feed(user_id);
```

**Deduplication:** The `UNIQUE (user_id, event_type, title)` constraint prevents double-posting. If `heroStageChecker` fires twice for the same graduation, the second INSERT fails silently (use `.insert(...).catch(() => {})` or `ON CONFLICT DO NOTHING`).

### ONE Reaction Table: `community_feed_reactions`

New table specifically for the community feed (don't reuse `league_content_reactions` which has a foreign key to `league_content_submissions`):

```sql
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
```

### Feed Utility: `src/lib/communityFeed.js`

```javascript
import { supabase } from './supabaseClient'

/**
 * Post an auto event to the community feed.
 * Uses ON CONFLICT DO NOTHING for deduplication — safe to call multiple times.
 */
export async function postFeedEvent(userId, eventType, title, subtitle = null, metadata = null) {
  await supabase
    .from('community_feed')
    .insert({
      user_id: userId,
      event_type: eventType,
      title,
      subtitle,
      metadata,
    })
    .then(() => {}) // Silent success
    .catch(() => {}) // Silent fail (dedup constraint or any error — feed events are best-effort)
}

/**
 * Post a shared wahoo (opt-in, from ShareWinStep).
 */
export async function postSharedWahoo(userId, title, caption, imageUrl = null) {
  return supabase
    .from('community_feed')
    .insert({
      user_id: userId,
      event_type: 'shared_wahoo',
      title,
      subtitle: caption,
      image_url: imageUrl,
    })
}

/**
 * Fetch the community feed (paginated).
 */
export async function fetchFeed(offset = 0, limit = 20) {
  return supabase
    .from('community_feed')
    .select('*, reactions:community_feed_reactions(reaction_type, user_id)')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)
}

/**
 * Toggle a reaction on a feed item.
 */
export async function toggleFeedReaction(feedItemId, userId, reactionType) {
  // Check if exists
  const { data: existing } = await supabase
    .from('community_feed_reactions')
    .select('id')
    .eq('feed_item_id', feedItemId)
    .eq('user_id', userId)
    .eq('reaction_type', reactionType)
    .maybeSingle()

  if (existing) {
    await supabase.from('community_feed_reactions').delete().eq('id', existing.id)
    return false // removed
  } else {
    await supabase.from('community_feed_reactions').insert({
      feed_item_id: feedItemId,
      user_id: userId,
      reaction_type: reactionType,
    })
    return true // added
  }
}
```

### Where Auto-Posts Get Created

| Event | Where to Call `postFeedEvent()` | Dedup Safe? |
|---|---|---|
| Stage graduation | `heroStageChecker.js` — after successful stage update | ✅ Title includes stage number, unique constraint handles dupes |
| Streak milestone | `useCelebrations.js` — `celebrateStreakMilestone` | ✅ Title includes day count |
| RP level up | `useCelebrations.js` — `celebrateLevelUp` | ✅ Title includes level name |
| First wahoo | `GroanCompletionModal.jsx` — check if count = 1 after insert | ✅ "completed their first wahoo" is unique per user |
| First Vibe Rise | `heroStageChecker.js` — Stage 4→5 IS first Vibe Rise | ✅ Same as stage graduation dedup |
| Insight unlocked (Uncommon+) | `useInsightDrops.js` — when insight fires | ✅ Title includes insight key |
| League win | League scoring Edge Function | ✅ Title includes week/matchup |

### Migrate Existing Shared Wahoos

One-time migration to copy `playlist_feed_posts` into `community_feed`:

```sql
INSERT INTO community_feed (user_id, event_type, title, subtitle, image_url, created_at)
SELECT user_id, 'shared_wahoo', 
  COALESCE(challenge_title, 'Shared a wahoo'),
  caption,
  image_url,
  created_at
FROM playlist_feed_posts
ON CONFLICT DO NOTHING;
```

### Feed Query (Single Table)

```javascript
const { data: feed } = await supabase
  .from('community_feed')
  .select('*, reactions:community_feed_reactions(reaction_type, user_id)')
  .order('created_at', { ascending: false })
  .range(offset, offset + limit - 1)
```

One query. No client-side merge. Paginated via `.range()`.

---

## Route + Page Component

### Route: `/community`

**File:** `src/AppRouter.jsx`

Add inside the AuthGate-wrapped routes:
```jsx
<Route path="/community" element={<AuthGate><CommunityFeed /></AuthGate>} />
```

### Page: `src/pages/CommunityFeed.jsx`

Full feed page with:
- Cumulative counter at top
- Scrollable feed of all community_feed items (paginated, 20 per load)
- Each item: avatar + name + title + subtitle + image (if shared wahoo) + reaction buttons
- Pull-to-refresh (reuse existing `PullToRefresh` component from NewsfeedPage)
- "Load more" at bottom (reuse existing infinite scroll pattern)
- Back button to return to `/7-day-challenge`

### Header Button

**File:** `src/components/ChallengeHeader.jsx` (or wherever the purple header renders)

Add a Community button in the button row (next to Leaderboard):

```jsx
<button onClick={() => navigate('/community')} className="ch-header-btn">
  📣 Community
</button>
```

---

## Courage Tab Integration

### "Community Courage" Section

At the bottom of `PlayListTab.jsx` (Courage tab), show the 3 most recent shared wahoos:

```jsx
<div className="plt-community-section">
  <h3 className="plt-community-title">Community Courage</h3>
  {recentSharedWahoos.slice(0, 3).map(post => (
    <div key={post.id} className="plt-community-card">
      <span className="plt-community-name">{post.user_name}</span>
      <span className="plt-community-caption">{post.caption}</span>
      <div className="plt-community-reactions">
        {/* reaction buttons */}
      </div>
    </div>
  ))}
  <button onClick={() => navigate('/community')}>See all →</button>
</div>
```

---

## ShareWinStep Migration

`src/components/playlist/ShareWinStep.jsx` currently posts to `playlist_feed_posts` via `playlistFeedService.js`. Change it to post to `community_feed` via the new `communityFeed.js` utility:

```javascript
// Replace: createFeedPost() from playlistFeedService
// With: postSharedWahoo() from communityFeed
import { postSharedWahoo } from '../../lib/communityFeed'

// In the share handler:
await postSharedWahoo(userId, challenge.title, caption, imageUrl)
```

The old `playlist_feed_posts` table can remain (existing data stays). New shares go to `community_feed`. The one-time migration SQL (above) copies old posts over.

---

## User Display Names

Feed items show user names. Currently the app uses `user.email` in most places. For the feed:
- If the user has a `custom_essence_name` (from Essence Mirror): show that
- Else if they have an essence archetype: show "[Archetype Name]"
- Else: show first part of email (before @)
- Future: proper display name field

---

## Privacy Controls (V2)

V1: all auto-posts are public to authenticated users. No opt-out.

V2 additions:
- Toggle: "Share my milestones with the community" (on by default, user can turn off)
- Choose which event types to auto-post
- Anonymous mode: events show "Someone" instead of name

---

## Build Estimate

| Item | Effort |
|---|---|
| Migration: `community_feed_events` table | 30 min |
| `createFeedEvent()` utility + wire into 6 trigger points | 1 day |
| Community Feed page/component | 2 days |
| Challenge header button (entry point 1) | 30 min |
| Courage tab "Community Courage" section (entry point 2) | 1 day |
| Reactions on community events (extend existing system) | 1 day |
| Cumulative counter | 30 min |

**Total: ~5-6 days**

---

## Success Metrics

| Metric | How to Measure |
|---|---|
| Feed has content | `community_feed_events` count > 0 after deployment |
| Users visit the feed | Page view analytics on community feed page |
| Reactions happen | `content_reactions` count on community events > 0 |
| ShareWinStep usage increases | `playlist_feed_posts` creation rate before vs after |
| Cumulative counter feels alive | Monthly wahoo count > 0 |

**Octalysis impact:** CD5 Social 5 → 7 (community feed + reactions + auto-posts). The remaining point to 8 needs session-linked social (V2).

---

*Aligned: 2026-07-13. Ready for implementation planning.*
*Depends on: nothing — can build immediately.*
