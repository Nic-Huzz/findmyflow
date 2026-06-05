# Pipeline Guided Experience — Design Brief

## Problem

When users click a pipeline node (Attract, Capture, Convert, Deliver, Grow), they see a flat list of Modules, Wahoos, Tools, and Checklists. There's no guidance on what to do first, what matters most right now, or why. Users need to already know the system to use it effectively.

Additionally, the pipeline metrics only track in-app actions. Most creator activity (Instagram posts, DMs, ticket sales) happens outside the app. The numbers stay at 0 despite real progress.

## Insight

Users don't think in modules. They think in pain points:
- "Nobody's signing up"
- "I don't know what to post"
- "My event is next week and I'm not ready"
- "It's over, now what?"

## Part 1: Manual Metrics (Hormozi Framework)

### Node Definitions (Revised)

| Node | What it measures | Definition |
|------|-----------------|------------|
| **Attract** | Eyeballs | People who saw/heard about your event |
| **Capture** | Clicked the link | People who took action (clicked, signed up, expressed interest) |
| **Convert** | Bought a ticket | People who paid / committed |
| **Deliver** | Showed up | Actual attendance on the day |
| **Grow** | What happened after | Follow-up, repeat rate, upsell, testimonials |

### Attract: Multi-Method Input

Most events use multiple attraction methods simultaneously. When tapping "Update" on the Attract node, the user picks which method they want to log:

| Method | Icon | Metrics | Input Type |
|--------|------|---------|------------|
| **Content** | 📱 | Posts made, reach/impressions, engagement | Screenshot upload (Instagram insights) OR manual |
| **Warm Outreach** | ☀️ | DMs sent, replies received, conversations started | Manual count |
| **Cold Outreach** | ❄️ | Messages sent, replies received, meetings booked | Manual count |
| **Paid Ads** | 💰 | Spend, impressions, clicks, CPC | Screenshot upload (ad manager) OR manual |
| **Affiliates** | 🤝 | Partners activated, referral signups, commission paid | Manual count |

**UX Flow:**
```
[Attract Node] → tap "Update"
    ↓
┌─────────────────────────────────┐
│  How are you attracting people? │
│                                 │
│  📱 Content          ☀️ Warm    │
│  ❄️ Cold Outreach    💰 Paid    │
│  🤝 Affiliates                  │
└─────────────────────────────────┘
    ↓ (tap one)
┌─────────────────────────────────┐
│  📱 Content Update              │
│                                 │
│  Posts this week: [___]         │
│  Reach: [___]                   │
│                                 │
│  — or —                         │
│                                 │
│  [📸 Upload Screenshot]         │
│                                 │
│  [Save]                         │
└─────────────────────────────────┘
```

Users can log multiple methods. Each entry is timestamped. The Attract node total = sum of all method entries.

### Capture, Convert, Deliver: Simple Manual Input

```
[Capture Node] → tap "Update"
┌─────────────────────────────────┐
│  Link clicks / signups: [___]   │
│  Source: [dropdown or text]     │
│  [Save]                         │
└─────────────────────────────────┘

[Convert Node] → tap "Update"
┌─────────────────────────────────┐
│  Tickets sold: [___]            │
│  Revenue: [___] [currency]      │
│  [Save]                         │
└─────────────────────────────────┘

[Deliver Node] → tap "Update" (post-event)
┌─────────────────────────────────┐
│  People who showed up: [___]    │
│  [Upload attendance CSV]        │
│  [Save]                         │
└─────────────────────────────────┘
```

### Data Model

New table: `pipeline_metrics`

```sql
CREATE TABLE pipeline_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id UUID REFERENCES experiences(id) NOT NULL,
  user_id UUID NOT NULL,
  node TEXT NOT NULL,           -- 'attract', 'capture', 'convert', 'deliver', 'grow'
  method TEXT,                  -- 'content', 'warm', 'cold', 'paid', 'affiliates' (Attract only)
  metric_key TEXT NOT NULL,     -- 'posts', 'reach', 'dms_sent', 'replies', 'clicks', 'tickets', 'revenue', 'showed_up'
  metric_value NUMERIC NOT NULL,
  screenshot_url TEXT,          -- optional screenshot for content/ads
  notes TEXT,
  logged_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Node Display Values

Each node's headline number becomes:

| Node | Display Value | Source |
|------|--------------|--------|
| **Attract** | Total reach OR total posts (user picks primary metric) | Sum from `pipeline_metrics` where node='attract' |
| **Capture** | Total clicks/signups | Sum from `pipeline_metrics` where node='capture', metric_key='clicks' |
| **Convert** | Tickets sold | Sum from `pipeline_metrics` where node='convert', metric_key='tickets' |
| **Deliver** | Showed up count | `pipeline_metrics` where node='deliver', metric_key='showed_up', OR `contact_experiences` count with attended=true |
| **Grow** | Follow-up checklist % (keep existing) | `experience_checklist_items` |

Fallback: if no manual metrics exist, fall back to the current in-app data sources (content_history, contact_experiences, etc.).

---

## Part 2: Contextual Guidance (Nudges)

When a user expands a node, show a **contextual nudge** at the top that:
1. Detects their situation from data (manual metrics + days until event + completion states)
2. Maps it to a pain point
3. Recommends the specific next action with a direct CTA

### Detection Logic Per Node

#### Attract
| Signal | Pain Point | Recommendation |
|--------|-----------|----------------|
| 0 metrics logged, event > 14 days | "Nobody knows about your event yet" | "Pick your attraction method and start logging" |
| 0 metrics, event < 14 days | "Your event is soon and nobody knows" | "Start with Warm Outreach — DM 10 people today" |
| Metrics logged but 0 capture | "People are seeing you but not acting" | "Check your call to action — is the link clear?" |
| Blow Up Brand not done | "Find your angle first" | "Complete Blow Up Your Brand to know what to say" |

#### Capture
| Signal | Pain Point | Recommendation |
|--------|-----------|----------------|
| 0 signups | "No one's clicked yet" | "Share your link — start with warm outreach" |
| Has signups, no email sequence | "Signups go cold without follow-up" | "Set up a Welcome Email Sequence" |
| Signups > 20, convert = 0 | "Interest but no commitment" | "Time to convert — check your offer" |

#### Convert
| Signal | Pain Point | Recommendation |
|--------|-----------|----------------|
| Capture > 0, convert = 0 | "Interest but no tickets sold" | "Review your Grand Slam Offer or send a direct pitch" |
| Event < 7 days, tickets < 5 | "Event is soon, seats empty" | "Send a last-call message to your warmest leads" |
| Good conversion rate | "Momentum is building" | "Keep going — consider Paid Ads to scale" |

#### Deliver
| Signal | Pain Point | Recommendation |
|--------|-----------|----------------|
| Event > 7 days, checklist < 50% | "Plenty of time" | "Work through your Organisation Checklist" |
| Event < 3 days, no runsheet | "Event is days away, no journey" | "Open Journey Designer now" |
| Event past, no attendance logged | "Log who showed up" | "Update your Deliver numbers" |

#### Grow (post-event only)
| Signal | Pain Point | Recommendation |
|--------|-----------|----------------|
| No 3% note | "Capture what you learned" | "Write your 3% note while it's fresh" |
| No follow-up started | "Don't lose the connection" | "Start your Follow-Up Checklist" |
| Follow-up done | "Ready to grow" | "Design your Scale Income offer stack" |

### Nudge UI

```
┌─────────────────────────────────────┐
│ 💡 Your event is in 12 days and     │
│    nobody knows about it yet.       │
│                                     │
│  [☀️ Start Warm Outreach →]         │
│                                     │
│  Then: Content → Wahoo              │
└─────────────────────────────────────┘
```

- Gold-bordered card at the top of each node detail, above Modules
- One primary CTA button
- One "Then:" line showing next 1-2 steps
- Adapts dynamically as metrics are logged and modules complete

---

## Implementation Plan

### Phase 1: Manual Metrics (build first)
1. Create `pipeline_metrics` table
2. Add "Update" button to each pipeline node
3. Attract: method picker → metric input form (with screenshot option)
4. Capture/Convert/Deliver: simple metric input forms
5. Update `useExperiencePipeline` to read from `pipeline_metrics` first, fall back to existing sources
6. ~200 lines new component + ~50 lines hook changes + table migration

### Phase 2: Contextual Nudges (build second)
1. Add `getNodeGuidance()` function using manual metrics + existing signals
2. Render nudge card above Modules in PipelineNodeDetail
3. ~100 lines logic + ~30 lines JSX + ~40 lines CSS

### Phase 3: Screenshot AI Extraction (future)
1. Reuse existing screenshot extraction from AttendeeUpload
2. For Content: extract reach, impressions, engagement from Instagram insights screenshot
3. For Paid Ads: extract spend, clicks, CPC from ad manager screenshot

---

## Open Questions

1. Should the "Update" button replace the current node values, or show alongside them?
2. For Attract, should users set a "primary display metric" (reach vs posts vs DMs sent)?
3. Should we show a mini conversion funnel: Attract → Capture → Convert as percentages?
4. Affiliates: do we need to track individual affiliate partners, or just totals?
