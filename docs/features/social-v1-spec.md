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

Tapping opens the community feed (full page or modal).

### Entry Point 2: Inside Courage Tab

At the bottom of the Courage tab (after the user's wahoo list), a "Community Courage" section showing the 3 most recent shared wahoos from other users. Acts as inspiration + social proof.

```
── Community Courage ──
[Avatar] Sarah: "Spoke up in a meeting" 🔥 3
[Avatar] Alex: "First cold plunge" 🎉 5
[Avatar] You: "Cold water swim at 6am" 💜 2
                           See all →
```

"See all →" opens the full community feed (same destination as header button).

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

### New: Community Feed Events Table

Auto-posted events need a table (separate from `playlist_feed_posts` which is opt-in shared content):

```sql
CREATE TABLE community_feed_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL, -- 'stage_graduation' | 'streak_milestone' | 'level_up' | 'first_wahoo' | 'first_vibe_rise' | 'insight_unlocked' | 'league_win'
  title TEXT NOT NULL,       -- Display text
  subtitle TEXT,             -- Optional second line (e.g. feeling target for graduations)
  metadata JSONB,            -- Event-specific data (stage number, streak days, level name, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE community_feed_events ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read all events (it's a public community feed)
CREATE POLICY "Authenticated users read all events" ON community_feed_events
  FOR SELECT USING (auth.role() = 'authenticated');

-- Users can insert their own events
CREATE POLICY "Users insert own events" ON community_feed_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_community_feed_user ON community_feed_events(user_id);
CREATE INDEX idx_community_feed_time ON community_feed_events(created_at DESC);
```

### Extend Reactions to Community Events

The existing `league_content_reactions` table uses `submission_id`. For community events, either:
- **Option A:** Rename to `content_reactions` and use for both (generic)
- **Option B:** Create `community_feed_reactions` (separate)

**Recommendation:** Option A — one reaction table, works for any content type. The `submission_id` just references different tables depending on context.

### Where Auto-Posts Get Created

Add `createFeedEvent()` calls to existing code:

| Event | Where to Add the Call |
|---|---|
| Stage graduation | `heroStageChecker.js` — after successful stage update |
| Streak milestone | Wherever streak milestones are detected (existing celebration code) |
| RP level up | `useCelebrations.js` — `celebrateLevelUp` function |
| First wahoo | `GroanCompletionModal.jsx` — after first quest_completion insert |
| First Vibe Rise | `heroStageChecker.js` — Stage 4→5 transition IS the first Vibe Rise |
| Insight unlocked | `useInsightDrops.js` — when Uncommon+ insight fires |
| League win | League scoring Edge Function |

### Feed Query (Combined)

The feed page queries BOTH tables and merges:

```javascript
// Community events (auto-posted)
const { data: events } = await supabase
  .from('community_feed_events')
  .select('*, user:user_id(id, email)')
  .order('created_at', { ascending: false })
  .limit(20)

// Shared wahoos (opt-in)
const { data: posts } = await supabase
  .from('playlist_feed_posts')
  .select('*, user:user_id(id, email)')
  .order('created_at', { ascending: false })
  .limit(20)

// Merge + sort by created_at
const feed = [...events, ...posts].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
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
