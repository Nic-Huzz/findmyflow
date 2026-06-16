# Instagram Integration — Implementation Plan

## Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| Multi-tenant OAuth | Composio SDK (entity management) | Reusable for TikTok, YouTube, etc. later |
| Sync timing | Cron (daily) + on-demand refresh | Cron for Brand Pulse freshness, on-demand for Attract node accuracy |
| Attract data source | Query `instagram_posts` directly | Clean separation from manual `pipeline_metrics`, shows "3 tagged posts, 22K reach" |

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│ CREATOR PORTAL (Frontend)                            │
│                                                      │
│  Growth Tab              Attract Node                │
│  ┌──────────┐           ┌───────────────┐           │
│  │Brand     │           │ [+ Tag Post]  │           │
│  │Pulse: ↑  │           │ Shows reach   │           │
│  │7/10      │           │ from tagged   │           │
│  └────┬─────┘           │ IG posts      │           │
│       │                 └──────┬────────┘           │
│       │                        │                     │
│  useBrandPulse()      useExperiencePipeline()       │
│       │                        │                     │
└───────┼────────────────────────┼─────────────────────┘
        │                        │
        ▼                        ▼
┌─────────────────────────────────────────────────────┐
│ SUPABASE                                             │
│  instagram_metrics (daily snapshots)                 │
│  instagram_posts (per-post + experience_id tag)      │
│  user_integrations (Composio entity mapping)         │
└───────┬─────────────────────────┬────────────────────┘
        │                         │
        ▼                         ▼
┌─────────────────────────────────────────────────────┐
│ EDGE FUNCTIONS                                       │
│  connect-instagram    → Composio OAuth redirect      │
│  fetch-instagram      → Daily cron + on-demand       │
│  instagram-callback   → OAuth return handler         │
└───────┬─────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────┐
│ COMPOSIO SDK                                         │
│  Entity per user → Instagram connection              │
│  Execute: GET_USER_INFO, GET_USER_INSIGHTS,          │
│           GET_IG_USER_MEDIA, GET_IG_MEDIA_INSIGHTS   │
└─────────────────────────────────────────────────────┘
```

---

## Build Sequence (7 Steps)

### Step 1: Database Migration

**Create 3 tables. No dependencies.**

```sql
-- 1. User integrations (Composio entity mapping)
CREATE TABLE user_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  platform TEXT NOT NULL,                    -- 'instagram'
  platform_user_id TEXT,                     -- IG numeric ID
  platform_username TEXT,                    -- '@_huzz'
  composio_entity_id TEXT,                   -- Composio entity reference
  composio_connection_id TEXT,               -- Composio connection reference
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  last_synced_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active',              -- active | disconnected | error
  UNIQUE(user_id, platform)
);

-- 2. Daily account-level metrics
CREATE TABLE instagram_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
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
CREATE TABLE instagram_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  ig_media_id TEXT NOT NULL,
  caption TEXT,
  media_type TEXT,                           -- IMAGE, VIDEO, CAROUSEL_ALBUM
  media_product_type TEXT,                   -- FEED, REELS, STORY
  permalink TEXT,
  thumbnail_url TEXT,
  posted_at TIMESTAMPTZ,
  like_count INT,
  comments_count INT,
  shares INT,
  saves INT,
  reach INT,
  views INT,
  experience_id UUID REFERENCES experiences(id), -- tagged to experience
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, ig_media_id)
);

-- RLS policies
ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own integrations"
  ON user_integrations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users read own metrics"
  ON instagram_metrics FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own posts"
  ON instagram_posts FOR ALL USING (auth.uid() = user_id);

-- Index for pipeline queries
CREATE INDEX idx_ig_posts_experience ON instagram_posts(experience_id) WHERE experience_id IS NOT NULL;
CREATE INDEX idx_ig_metrics_user_date ON instagram_metrics(user_id, date DESC);
```

**Files:** `supabase/migrations/YYYYMMDD_instagram_integration.sql`
**Estimated effort:** 30 min

---

### Step 2: Composio OAuth Flow (3 Edge Functions)

**Dependencies:** Step 1 (tables exist)

#### 2a. `connect-instagram/index.ts`
Generates Composio OAuth redirect URL for the user.

```
POST /connect-instagram
Body: { user_id }
Returns: { redirect_url }
```

Logic:
1. Create or fetch Composio entity for this user (entity_id = user's UUID)
2. Generate Instagram OAuth URL via Composio SDK
3. Set callback URL to our `instagram-callback` function
4. Return redirect URL to frontend

#### 2b. `instagram-callback/index.ts`
Handles OAuth return from Instagram via Composio.

```
GET /instagram-callback?entity_id=...&status=...
```

Logic:
1. Verify the connection succeeded
2. Call `INSTAGRAM_GET_USER_INFO` to get username + IG user ID
3. Upsert `user_integrations` row
4. Trigger initial sync (call `fetch-instagram` internally)
5. Redirect user back to creator portal Growth tab

#### 2c. `fetch-instagram/index.ts`
Pulls data from Instagram via Composio. Called by cron (daily) or on-demand.

```
POST /fetch-instagram
Body: { user_id } (on-demand) or no body (cron = all connected users)
```

Logic:
1. Query `user_integrations` for connected Instagram accounts
2. For each user:
   a. `GET_USER_INFO` → followers, following
   b. `GET_USER_INSIGHTS` (last 1 day) → reach, views, engagement
   c. `GET_IG_USER_MEDIA` (last 30 days, paginated) → post inventory
   d. For each post: `GET_IG_MEDIA_INSIGHTS` → reach, views, likes, comments, shares, saves
3. Upsert into `instagram_metrics` (today's row)
4. Upsert into `instagram_posts` (update metrics, preserve experience_id tags)
5. Update `user_integrations.last_synced_at`

**Composio SDK setup:**
```typescript
import { Composio } from 'composio-core'
const composio = new Composio({ apiKey: Deno.env.get('COMPOSIO_API_KEY') })

// Create entity per user
const entity = await composio.getEntity(userId)

// Execute Instagram tool
const result = await entity.execute('INSTAGRAM_GET_USER_INFO', {})
```

**Cron config** (vercel.json or Supabase pg_cron):
```json
{ "crons": [{ "path": "/api/fetch-instagram", "schedule": "0 4 * * *" }] }
```

**Env vars needed:** `COMPOSIO_API_KEY`
**Files:** `supabase/functions/connect-instagram/index.ts`, `instagram-callback/index.ts`, `fetch-instagram/index.ts`
**Estimated effort:** 3-4 hours

---

### Step 3: Frontend Connection Flow

**Dependencies:** Step 2 (edge functions deployed)

Add "Connect Instagram" card to Growth tab in `CreatorHomeV2.jsx`.

**States:**
- **Not connected**: Purple card with Instagram icon, "Connect Instagram to track your brand growth automatically". Tap → calls `connect-instagram` edge function → redirects to Composio OAuth
- **Connected**: Shows @username, last synced time, "Refresh" button (calls `fetch-instagram` on-demand)
- **Error**: "Connection lost. Reconnect" with retry

**Component:** `src/components/pipeline/InstagramConnect.jsx`
**Estimated effort:** 1 hour

---

### Step 4: Attract Node Post-Tagging

**Dependencies:** Step 1 (tables), Step 2 (posts synced)

#### 4a. Post Selector Bottom Sheet

Reuse `MetricInputSheet` pattern (slide-up overlay, `.mis-` CSS prefix pattern).

**Component:** `src/components/pipeline/InstagramPostSelector.jsx`

**UI:**
```
┌─────────────────────────────────────┐
│  Tag Posts to "Breathwork Retreat"   │  ← experience name
│                                  ✕  │
│─────────────────────────────────────│
│  Recent Posts                        │
│                                      │
│  ┌──────┐ "40/100 Vibe Rise..."     │
│  │ 📷   │  Carousel · Jun 15        │
│  │      │  287 reach · 17 likes     │
│  └──────┘  [Tag ✓]                  │  ← toggle
│                                      │
│  ┌──────┐ "39/100 Vibe Rise..."     │
│  │ 🎬   │  Reel · Jun 14            │
│  │      │  664 reach · 38 likes     │
│  └──────┘  [Tag]                    │
│                                      │
│  ┌──────┐ "Day 37/100..."           │
│  │ 📷   │  Carousel · Jun 13        │
│  │      │  20,977 reach · 87 likes  │
│  └──────┘  [Tag]                    │  ← auto-suggested if caption matches
│                                      │
│  [Done]                              │
└─────────────────────────────────────┘
```

**Logic:**
- Queries `instagram_posts WHERE user_id = X ORDER BY posted_at DESC LIMIT 20`
- Shows thumbnail (from `thumbnail_url` or placeholder by type), caption snippet, reach, likes
- Toggle sets/clears `experience_id` on the `instagram_posts` row
- Auto-suggest: posts whose caption contains the experience name are pre-highlighted with a subtle glow
- "Done" closes sheet and triggers pipeline refresh

**Tagging is just a Supabase update:**
```javascript
await supabase
  .from('instagram_posts')
  .update({ experience_id: experienceId })
  .eq('id', postId)
```

**Estimated effort:** 2-3 hours

#### 4b. Pipeline Hook Changes

**File:** `src/hooks/useExperiencePipeline.js`

Add Instagram query to `fetchPipeline()`:

```javascript
// Add to Promise.all:
supabase.from('instagram_posts')
  .select('reach, views, like_count, comments_count, shares, saves, ig_media_id')
  .eq('experience_id', experienceId)
  .eq('user_id', userId),
```

Update Attract node calculation:

```javascript
// Instagram-tagged posts for this experience
const igPosts = igPostsRes.data || []
const igReach = igPosts.reduce((sum, p) => sum + (p.reach || 0), 0)
const igPostCount = igPosts.length

// Priority: Instagram data > manual metrics > content history fallback
const hasInstagram = igPostCount > 0
const attractValue = hasInstagram
  ? igReach
  : (nodeHasMetrics('attract') ? attractTotal : contentCount)
const attractSublabel = hasInstagram
  ? `reach (${igPostCount} post${igPostCount > 1 ? 's' : ''})`
  : (nodeHasMetrics('attract') ? (attractReach ? 'reach' : 'posts') : 'posts')
```

This means: if Instagram posts are tagged to this experience, their reach is the Attract value. Otherwise falls back to manual entry. Both can coexist — manual metrics for non-Instagram promotion (flyers, word of mouth).

**Estimated effort:** 1 hour

#### 4c. Attract Node UI Update

**File:** `src/components/pipeline/PipelineNodeDetail.jsx`

Add [+ Tag Post] button to the Attract node detail panel. Only shows when user has Instagram connected (`user_integrations` row exists).

Below existing "Log Metrics" button, add:
```jsx
{hasInstagramConnected && node.key === 'attract' && (
  <button className="pnd-action-btn" onClick={() => setShowPostSelector(true)}>
    📸 Tag Instagram Posts
  </button>
)}
```

Show tagged posts as small cards below the metrics:
```jsx
{taggedPosts.length > 0 && (
  <div className="pnd-tagged-posts">
    <h4>Tagged Posts ({taggedPosts.length})</h4>
    {taggedPosts.map(post => (
      <div key={post.id} className="pnd-ig-post">
        <span>{post.media_type === 'VIDEO' ? '🎬' : '📷'}</span>
        <span>{post.reach?.toLocaleString()} reach</span>
        <a href={post.permalink} target="_blank">↗</a>
      </div>
    ))}
  </div>
)}
```

**Estimated effort:** 1 hour

---

### Step 5: Brand Pulse

**Dependencies:** Step 1 (tables), Step 2 (daily metrics syncing)

#### 5a. `useBrandPulse` Hook

**File:** `src/hooks/useBrandPulse.js`

```javascript
export default function useBrandPulse() {
  // Queries instagram_metrics for last 14 days
  // Splits into this_week (days 0-6) and last_week (days 7-13)
  // Calculates:
  //   reachTrend = (thisWeekReach - lastWeekReach) / lastWeekReach
  //   engagementTrend = (thisWeekEngRate - lastWeekEngRate) / lastWeekEngRate
  //   followerGrowth = (latestFollowers - earliestFollowers) / earliestFollowers
  // Applies scoring bands (-1 to +1 per signal)
  // Returns weighted composite (50/30/20)
  // Maps to 0-10 score

  return {
    score,              // 0-10
    label,              // 'Growing' | 'Steady' | 'Declining'
    color,              // green | gold | red
    signals: {
      reach: { value, trend, direction },
      engagement: { value, trend, direction },
      followers: { value, trend, direction },
    },
    hasEnoughData,      // false if < 7 days of data
    lastSynced,         // timestamp
    loading,
  }
}
```

**Edge cases handled:**
- `< 7 days data` → "Building baseline..." state
- `No posts this week` → "Paused" state, show last known score
- `Viral spike` → 7-day rolling average smooths it
- `Division by zero` → If previous period is 0, treat as "new" not "infinite growth"

**Estimated effort:** 2 hours

#### 5b. Brand Pulse Card

**File:** `src/components/pipeline/BrandPulseCard.jsx`

```
┌─────────────────────────────────────┐
│  Brand Pulse            ↻ Refresh   │
│                                      │
│  ↑ Growing              7/10        │
│  ●●●●●●●○○○                         │
│                                      │
│  📊 Reach    +12%  ↑                │
│  💬 Engage   +1.2% ↑                │
│  👥 Follow   +34   ↑                │
│                                      │
│  Last updated: 2h ago               │
└─────────────────────────────────────┘
```

- Tap "Refresh" → calls `fetch-instagram` on-demand → re-queries
- Dot bar uses brand colors (purple filled, dark empty)
- Trend arrows colored: green ↑, gold →, red ↓
- Whole card is one component, rendered in Growth tab

**Estimated effort:** 2 hours

---

### Step 6: Wire Into CreatorHomeV2

**Dependencies:** Steps 3-5

**File:** `src/components/CreatorHome/CreatorHomeV2.jsx`

**Growth tab changes:**
1. Replace or augment existing KPIs section with `<BrandPulseCard />`
2. Add `<InstagramConnect />` card (if not connected)
3. Brand Pulse appears below the connect card once data is flowing

**Experiences tab changes:**
1. Attract node in pipeline shows Instagram reach when posts are tagged
2. [+ Tag Post] button appears in Attract node detail

**No changes to Identity tab.**

**Estimated effort:** 1 hour

---

### Step 7: Testing & Polish

**Dependencies:** All above

**Test checklist:**
- [ ] Connect Instagram flow (OAuth redirect → callback → data sync)
- [ ] Daily cron syncs metrics and posts
- [ ] On-demand refresh updates data within 5 seconds
- [ ] Post tagging updates `experience_id` on instagram_posts
- [ ] Attract node shows summed reach from tagged posts
- [ ] Attract node falls back to manual metrics when no posts tagged
- [ ] Brand Pulse calculates correct score with 14 days of data
- [ ] Brand Pulse shows "Building baseline..." with < 7 days
- [ ] Brand Pulse shows "Paused" when no recent posts
- [ ] Disconnect flow clears integration and stops syncing
- [ ] RLS policies prevent cross-user data access

**Estimated effort:** 2 hours

---

## Summary

| Step | What | Files | Effort |
|------|------|-------|--------|
| 1 | Database migration | 1 migration file | 30 min |
| 2 | Composio OAuth + sync edge functions | 3 edge functions | 3-4 hrs |
| 3 | "Connect Instagram" UI | 1 component | 1 hr |
| 4 | Attract node post-tagging | 1 component + hook changes + node UI | 4-5 hrs |
| 5 | Brand Pulse | 1 hook + 1 component | 4 hrs |
| 6 | Wire into CreatorHomeV2 | 1 file changes | 1 hr |
| 7 | Testing | — | 2 hrs |
| **Total** | | **~8 new files, ~3 modified** | **~16 hrs** |

## Build Order (What Blocks What)

```
Step 1 (tables) ──────┬──→ Step 2 (edge functions) ──→ Step 3 (connect UI)
                      │                                       │
                      │         ┌─────────────────────────────┘
                      │         │
                      ├──→ Step 4 (post-tagging) ──→ Step 6 (wire up)
                      │                                       │
                      └──→ Step 5 (brand pulse) ──────────────┘
                                                              │
                                                        Step 7 (test)
```

Steps 4 and 5 are independent of each other and can be built in parallel once Step 2 is done and data is flowing.

## Env Vars Needed

| Var | Where | Value |
|-----|-------|-------|
| `COMPOSIO_API_KEY` | Supabase Edge Functions secrets | From composio.dev dashboard |

## Risk Register

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Composio SDK doesn't support Deno (edge functions) | Medium | Use REST API directly instead of SDK. All Composio tools are HTTP endpoints. |
| Instagram API rate limits on daily cron | Low (< 50 users) | Batch requests, add exponential backoff. Revisit at 100+ users. |
| Post thumbnails not available for all media types | Low | Verified `media_url` and `thumbnail_url` return. Fall back to type icon (📷/🎬). |
| Composio token refresh failures | Medium | `fetch-instagram` catches auth errors, marks integration as `status='error'`, shows reconnect CTA in UI. |
| Brand Pulse score feels wrong to users | Medium | Start with "beta" label. Log raw signals so we can tune thresholds based on real data. |
