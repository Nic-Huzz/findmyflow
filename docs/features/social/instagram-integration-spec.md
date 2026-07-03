# Instagram Integration Spec (Creator Portal)

## Overview

Two focused integrations that answer two questions:
1. **"Is my promotion working?"** — Attract node post-tagging (actionable)
2. **"Is my brand growing?"** — Brand Pulse metric (directional)

No vanity dashboards. No Instagram Insights clone. Just the two things creators actually need.

## API Verification (Confirmed Jun 16, 2026)

All endpoints tested against @_huzz (2,806 followers). Per-post insights return reach, views, likes, comments, shares, saves for both carousels and reels.

| Data Point | API Tool | Status |
|------------|----------|--------|
| Account-level reach, views, engagement | `INSTAGRAM_GET_USER_INSIGHTS` | Confirmed |
| Follower count | `INSTAGRAM_GET_USER_INFO` | Confirmed |
| Per-post reach, likes, comments, shares, saves, views | `INSTAGRAM_GET_IG_MEDIA_INSIGHTS` | Confirmed |
| Post inventory (captions, types, timestamps) | `INSTAGRAM_GET_IG_USER_MEDIA` | Confirmed |

**Limitations:**
- Requires Business or Creator Instagram account (not personal)
- Post insights only available for posts < 2 years old
- Account needs 1,000+ followers for per-post insights
- `follower_count` not available via insights API (use `GET_USER_INFO` instead)

## Integration 1: Attract Node Post-Tagging

### What It Does

When a creator is promoting an experience (workshop, retreat, cohort), they post about it on Instagram. In the Experience Pipeline's Attract node, they see their recent Instagram posts and tag the ones promoting that experience. The Attract node auto-fills with real reach data.

### User Flow

```
Creator creates experience "Breathwork Retreat Jun 28"
         │
Creator posts 3 Instagram posts promoting it
         │
Opens Experience Pipeline → Attract node
         │
         ▼
┌─────────────────────────────────────┐
│  Attract Node                        │
│                                      │
│  📊 Reach: 22,928 (from 3 posts)    │
│  👁️ Views: 33,105                    │
│  💬 Engagement: 97 interactions      │
│                                      │
│  Tagged Posts:                        │
│  ┌──────┐ ┌──────┐ ┌──────┐        │
│  │ 📷   │ │ 🎬   │ │ 📷   │        │
│  │21K   │ │1K    │ │ 287  │        │
│  │reach │ │reach │ │reach │        │
│  └──────┘ └──────┘ └──────┘        │
│                                      │
│  [+ Tag Post]                        │
└─────────────────────────────────────┘
         │
         ▼  conversion tracking
┌─────────────────────────────────────┐
│  Capture: 89 (DMs / link clicks)    │
│  Convert: 12 tickets sold           │
│  Deliver: ...                        │
│  Grow: ...                           │
└─────────────────────────────────────┘
```

### Tag Post UI

Tapping [+ Tag Post] opens a bottom sheet showing recent Instagram posts (pulled from `instagram_posts` table). Each shows thumbnail, caption preview, and reach. Creator taps to tag/untag. Auto-suggest: posts whose caption contains the experience name are pre-highlighted.

### Why This Is Unique

No other tool connects social media promotion directly to experience attendance pipeline for small creators. HubSpot does this for enterprise. Vibe Rise does it for the breathwork facilitator with 3,000 followers.

## Integration 2: Brand Pulse

### What It Does

One composite metric on the Growth tab that answers: "Is my brand growing, flat, or shrinking?"

```
┌─────────────────────────────────────┐
│  Brand Pulse                         │
│                                      │
│  ↑ Growing                           │
│  +12% reach · +1.2% engagement ·     │
│  +34 followers this month            │
│                                      │
│  ●●●●●●●○○○  7/10                    │
└─────────────────────────────────────┘
```

### Calculation

Three signals, weighted, compared to previous period (7-day rolling average to smooth spikes):

| Signal | Weight | Source | What It Measures |
|--------|--------|--------|-----------------|
| Reach trend | 50% | `instagram_metrics.reach` week-over-week | Are more people seeing you? (leading indicator) |
| Engagement rate trend | 30% | `interactions / reach` week-over-week | Is your content landing? (quality signal) |
| Follower growth rate | 20% | `instagram_metrics.followers` week-over-week | Is your audience compounding? (lagging outcome) |

### Scoring

Each signal scores -1 to +1 based on % change:
- **> +10%**: +1.0 (strong growth)
- **+5% to +10%**: +0.7
- **+1% to +5%**: +0.4
- **-1% to +1%**: 0 (steady)
- **-5% to -1%**: -0.4
- **-10% to -5%**: -0.7
- **< -10%**: -1.0 (declining)

Weighted composite → Brand Pulse score (-1 to +1) → mapped to 0-10 scale.

### Display States

| Score | Label | Color |
|-------|-------|-------|
| 7-10 | Growing | Green |
| 4-6 | Steady | Amber/Gold |
| 0-3 | Declining | Red |

### Edge Cases

- **No posts this week**: Show "No data" state, not red. "You haven't posted this week" with last known pulse.
- **Viral spike**: 7-day rolling average smooths one-off spikes so the metric reflects trend, not noise.
- **New account (< 2 weeks of data)**: Show "Building baseline..." instead of a score.
- **Holiday/break**: If no posts for 7+ days, pause the metric and show last known state with "Paused — no recent activity".

### Confidence: 8/10

The data is confirmed available. The weighting is defensible (reach leads, engagement confirms, followers lag). The 2/10 uncertainty is around tuning the thresholds — we'll likely adjust the % bands after seeing real data across multiple creators.

## Architecture

```
User connects Instagram (one-time)
         │
         ▼
┌─────────────────────┐
│  Composio OAuth      │  ← User authorizes in-app
│  (stores token)      │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  Supabase Edge Fn    │  ← Runs daily via cron OR on-demand
│  fetch-instagram     │
│  - pulls metrics     │
│  - syncs posts       │
│  - updates insights  │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  instagram_metrics   │  ← Daily account snapshots
│  instagram_posts     │  ← Post inventory + per-post metrics
└────────┬────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Creator Portal UI               │
│  - Attract node (post tagging)   │
│  - Growth tab (Brand Pulse)      │
└─────────────────────────────────┘
```

## Database Tables

### `instagram_metrics` (account-level, one row per day)
```sql
create table instagram_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  date date not null,
  followers int,
  following int,
  reach int,
  views int,
  accounts_engaged int,
  total_interactions int,
  likes int,
  comments int,
  shares int,
  saves int,
  profile_link_taps int,
  follows_net int,
  created_at timestamptz default now(),
  unique(user_id, date)
);
```

### `instagram_posts` (per-post, synced from API)
```sql
create table instagram_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  ig_media_id text not null,
  caption text,
  media_type text,        -- IMAGE, VIDEO, CAROUSEL_ALBUM
  media_product_type text, -- FEED, REELS, STORY
  permalink text,
  posted_at timestamptz,
  like_count int,
  comments_count int,
  shares int,
  saves int,
  reach int,
  views int,
  experience_id uuid references experiences(id),  -- tag post to experience
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, ig_media_id)
);
```

### `user_integrations` (OAuth connections)
```sql
create table user_integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  platform text not null,          -- 'instagram', future: 'tiktok', 'youtube'
  platform_user_id text,           -- e.g. '34856592823989391'
  platform_username text,          -- e.g. '_huzz'
  composio_connection_id text,     -- Composio's internal reference
  connected_at timestamptz default now(),
  last_synced_at timestamptz,
  status text default 'active',    -- active, disconnected, error
  unique(user_id, platform)
);
```

## Connection Flow (User Experience)

1. Growth tab shows "Connect Instagram" card (purple gradient, Instagram icon)
2. Tap → Composio OAuth redirect → Instagram authorization
3. Return to app → initial sync runs (last 30 days of posts + metrics)
4. Brand Pulse appears after 7 days of data
5. Daily cron keeps data fresh (edge function)

## Implementation Phases

### Phase 1: Data Pipeline
1. Create 3 tables (migration)
2. Build `fetch-instagram` edge function (Composio API calls → Supabase writes)
3. Set up daily cron trigger via Vercel or Supabase
4. OAuth connection flow (Composio redirect + callback)

### Phase 2: Attract Node Post-Tagging
1. Post selector bottom sheet component (recent posts from `instagram_posts`)
2. Tag/untag posts to experiences (`instagram_posts.experience_id`)
3. Auto-suggest based on caption keyword match
4. Attract node auto-fill (sum reach/views/engagement from tagged posts)
5. Refresh per-post metrics on demand

### Phase 3: Brand Pulse
1. `useBrandPulse` hook (queries `instagram_metrics`, calculates composite score)
2. Brand Pulse card on Growth tab
3. Edge case handling (no data, viral spike smoothing, new account baseline)
4. Trend arrows and period comparison

### Phase 4: Future Platforms
- TikTok (Composio supports it)
- YouTube (for video creators)
- Brand Pulse becomes multi-platform composite

## Composio Connection Details

- Toolkit: `instagram`
- Account type: Business/Creator only
- Test account: `@_huzz` (ID: `34856592823989391`)
- Connection status: ACTIVE (since 2026-04-09)

## Verified Data Sample (Jun 16, 2026)

### Account Level (Jun 9-16)
```
Followers: 2,806 | Following: 1,309 | Posts: 158
Weekly Reach: 2,068 | Weekly Views: 6,485
Engagement Rate: 3.9% (109 engaged / 2,806 followers)
```

### Per-Post Insights (confirmed working)
| Post | Type | Reach | Views | Likes | Comments | Shares | Saves |
|------|------|-------|-------|-------|----------|--------|-------|
| "Think about you as a kid" (May 21) | Carousel | 20,977 | 31,337 | 87 | 7 | 11 | 2 |
| Tuk tuk driving (Jun 12) | Reel | 664 | 1,057 | 38 | 5 | 0 | 0 |
| Shirt rip + speech (Jun 15) | Carousel | 287 | 711 | 17 | 3 | 1 | 1 |

### Key Insight
Carousels dramatically outperform Reels on reach (20,977 vs 664). The May 21 carousel reached 7.5x the follower count. If tagged to an experience, this single post would show 21K reach in the Attract node.
