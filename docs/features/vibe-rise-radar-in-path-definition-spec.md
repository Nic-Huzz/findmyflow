---
title: Vibe Rise Radar in Path Definition Flow
tags: [vibe-rise-radar, path-definition, spec, aliveness]
created: 2026-09-12
status: ready-to-build
---

# Vibe Rise Radar in Path Definition

> **Purpose:** Capture a baseline aliveness measurement BEFORE the user's first courage challenge on a path. This becomes the "before" shape that all future progress is measured against.
>
> **The product loop:** Baseline radar at path start -> courage challenges -> bi-weekly re-check -> radar shape changes over time. The aliveness shape changing IS the product. Like Nike Run Club showing your pace improving.

## Where It Goes

**Path Definition Flow** (`/path-definition/:questId`) currently has 3 screens:
```
Screen 0: Setup (precursor + dome dimensions)
Screen 1: The Shift (life fuels + buts + voice + reframe)
Screen 2: The Commitment (fear + identity + smallest step)
```

Add the Vibe Rise Radar as **Screen 0** (new), shifting existing screens to 1-3:

```
Screen 0: HOW ALIVE ARE YOU? (NEW - Vibe Rise Radar baseline)
Screen 1: Setup (precursor + dome dimensions) [was Screen 0]
Screen 2: The Shift (life fuels + buts + voice + reframe) [was Screen 1]
Screen 3: The Commitment (fear + identity + smallest step) [was Screen 2]
```

### Why Before Screen 1 (Setup), Not After

The dome dimensions (Screen 1) measure what your NS CAN handle. The Vibe Rise Radar measures how alive you FEEL. Taking the aliveness snapshot BEFORE you set your dome dimensions creates a cleaner baseline - you haven't been primed by thinking about your comfort zone yet.

It also serves as a warm-up question. "How alive are you right now?" is easier to answer than "How many people will be involved in your path?" - it eases the user into the flow.

## UX Design

### Screen 0: "How alive are you right now?"

**Layout:** Same as the /try/vibe-rise-radar question screens, but embedded in PathDefinitionFlow (not the full standalone flow).

**Content:**
- Headline: "Before we define your path, let's take a snapshot."
- Sub: "How alive are you right now? 6 questions. 60 seconds."
- 6 dimensions, one at a time, same 1-5 button UX as existing VibeRiseRadar
- Progress dots (6) separate from the main screen progress

**Dimensions (post-Engagement rename):**
1. Permission - How free do you feel to express yourself right now?
2. Safety - How safe do you feel to let go right now?
3. Freedom - Are you being fully yourself right now?
4. Connection - How connected do you feel to the people around you?
5. Engagement - How excited are you by the activities in your life, not just the outcomes?
6. Joy - How alive do you feel right now?

**On completion:** Brief radar reveal (GenericRadar component, 2 seconds), then auto-advance to Screen 1 (Setup). No email gate (they're already logged in).

### Data Storage

Save to a new `quest_aliveness_snapshots` table:

```sql
create table quest_aliveness_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  quest_id uuid references quests(id) not null,
  snapshot_type text not null check (snapshot_type in ('baseline', 'checkin')),
  scores jsonb not null,
  -- scores: { permission: 3, safety: 4, freedom: 2, connection: 3, engagement: 2, joy: 3 }
  total_pct integer generated always as (
    ((scores->>'permission')::int + (scores->>'safety')::int + (scores->>'freedom')::int +
     (scores->>'connection')::int + (scores->>'engagement')::int + (scores->>'joy')::int) * 100 / 30
  ) stored,
  created_at timestamptz default now()
);

alter table quest_aliveness_snapshots enable row level security;
create policy "Users can insert own snapshots"
  on quest_aliveness_snapshots for insert with check (auth.uid() = user_id);
create policy "Users can read own snapshots"
  on quest_aliveness_snapshots for select using (auth.uid() = user_id);

create index idx_aliveness_snapshots_user_quest
  on quest_aliveness_snapshots(user_id, quest_id, created_at desc);
```

**Baseline snapshot:** `snapshot_type = 'baseline'`, created once during Path Definition.
**Check-in snapshots:** `snapshot_type = 'checkin'`, created during bi-weekly check-ins.

### Bi-Weekly Check-In (Future, Not This Spec)

After the baseline is captured, the user gets a bi-weekly prompt:
- Appears in Progress tab as a card: "It's been 2 weeks. How alive are you? 60 seconds."
- Same 6 questions, same UI
- Results show dual radar: baseline (amber dashed) vs current (purple solid), using GenericRadar with scores2 prop
- The delta IS the product loop: "Your Freedom went from 2 to 4 since you started this path"
- Frequency: every 14 days from baseline date, not calendar-fixed
- Can be dismissed ("not now") but reappears next session

## How Paths Support Vibe Rise Radar Growth

Each path naturally stretches specific aliveness dimensions. The connection:

| Vibe Rise Dimension | What grows it | Example path activities |
|---|---|---|
| **Permission** | Environments where expression is rewarded, not punished | Running events (you create the permission space), content creation (expressing publicly) |
| **Safety** | Repeated proof that expression doesn't destroy you | Each courage challenge that goes well builds safety evidence |
| **Freedom** | Actions where you show up as yourself, not a role | Any path aligned with essence archetype stretches this |
| **Connection** | Activities involving real people, not screens | Events, workshops, 1:1 sessions, community building |
| **Engagement** | Working on things you'd do for free | Paths chosen from Experience Game results (intrinsic motivation) |
| **Joy** | The output of the other 5 flowing | Joy isn't directly targetable. It rises when the other channels open. |

### Deficiency-Driven Path Recommendations (Future)

When a check-in shows a flat dimension:
- "Your Connection dropped from 4 to 2. Your dance events path is the one that grows Connection. Consider: run a small event this week."
- "Your Engagement is flat at 2. Are you still excited by this path's activities, or is it time to revisit what lights you up?"
- "Your Permission has been 1 for 3 check-ins. The thing you're avoiding expressing - that's the courage challenge."

This is the bridge between the Zone Cal Radar (which shows the journey shape) and the Vibe Rise Radar (which shows how alive you feel). The Zone Cal says WHERE you are. The Vibe Rise says HOW you are. The path challenges are the vehicle that moves both.

## Implementation Checklist

- [ ] Create `quest_aliveness_snapshots` migration
- [ ] Add Screen 0 to PathDefinitionFlow.jsx (before existing Screen 0)
- [ ] Import GenericRadar + VibeRiseRadar dimension data
- [ ] Save baseline snapshot on completion of 6 questions
- [ ] Show brief radar reveal before auto-advancing to Setup
- [ ] Update screen numbering in PathDefinitionFlow (0->1, 1->2, 2->3)
- [ ] Bi-weekly check-in prompt in Progress tab (separate ticket)
- [ ] Dual radar comparison view for check-in results (separate ticket)

## Not In This Spec

- Bi-weekly check-in UI (separate spec)
- Data-derived aliveness scoring (see zone-cal-data-derived-scoring.md)
- Deficiency-driven path recommendations (needs Zone Cal + Vibe Rise integration)
- Event Radar integration (events are public, not path-specific)
