---
title: Vibe Rise Aliveness Compass - Full Feature Spec
tags: [vibe-rise-radar, path-definition, courage-challenges, game-design, aliveness]
created: 2026-09-12
updated: 2026-09-26
status: ready-for-agent
replaces:
  - docs/features/vibe-rise-radar-in-path-definition-spec.md
  - docs/features/paths-support-vibe-rise-growth-spec.md
---

# Vibe Rise Aliveness Compass

> **One feature, three parts:** Baseline capture at path start, bi-weekly check-ins that track the shift, and deficiency-driven challenge suggestions when dimensions go flat.
>
> **The product loop:** Baseline → courage challenges → bi-weekly re-check → shape changes → deficient dimensions surface → targeted challenges → shape changes again. The aliveness shape changing over time IS the product. Like Nike Run Club showing your pace improving.
>
> **Scope:** Per-path (each quest gets its own radar shape). This is how you know a path is aligned — the shape tells you.

---

## Part 1: Baseline Capture in Path Definition

### Where it goes

**Path Definition Flow** (`/path-definition/:questId`) currently has 3 screens:
```
Screen 0: Setup (precursor + dome dimensions)
Screen 1: The Shift (life fuels + buts + voice + reframe)
Screen 2: The Commitment (fear + identity + smallest step)
```

Add the Vibe Rise Radar as **Screen 0** (new), shifting existing screens to 1-3:
```
Screen 0: HOW ALIVE ARE YOU? (NEW)
Screen 1: Setup (precursor + dome dimensions)
Screen 2: The Shift (life fuels + buts + voice + reframe)
Screen 3: The Commitment (fear + identity + smallest step)
```

**Why before Setup:** The dome dimensions measure what your NS CAN handle. The Vibe Rise Radar measures how alive you FEEL. Taking the aliveness snapshot before dome setup creates a cleaner baseline (not primed by thinking about comfort zones). It also serves as a warm-up — "how alive are you?" is easier than "how many people will be involved?"

### Screen 0 UX

- Headline: "Before we define your path, let's take a snapshot."
- Sub: "How alive are you on this path? 5 questions. 60 seconds."
- 5 dimensions, one at a time, same 1-5 button UX as /try/vibe-rise-radar
- Progress dots (5) separate from the main Path Definition progress
- On completion: brief GenericRadar reveal (2 seconds), then auto-advance to Screen 1

**The 5 dimensions:**

| # | Dimension | Emoji | Question | What it measures |
|---|-----------|-------|----------|-----------------|
| 1 | Permission | 🚪 | How accepted do you feel doing this? | External — does your world approve? |
| 2 | Safety | 🛡️ | How comfortable do you feel being seen doing this? | Vulnerability — can you be visible? |
| 3 | Connection | 🤝 | How connected do you feel to people who do this? | Community — do you have your people? |
| 4 | Engagement | 🔥 | How energised are you by the activities of this path, not just the outcome? | Process — do you love the doing? |
| 5 | Alignment | ✨ | How much does this path feel like the real you? | Identity — is this your thing? |

**Anchors (1-5 per dimension):** Update from `src/flows/VibeRiseRadar.jsx` DIMENSIONS array to match new 5-dimension model.

### Retroactive baseline for existing users

Users who already completed Path Definition have no baseline. On the Progress tab, show a one-time card: "Take a 60-second snapshot of how alive you feel on [path name]." Same 5 questions, stored as `snapshot_type = 'baseline'`. Card dismisses permanently once completed or explicitly dismissed.

**Multiple paths:** Show one retroactive baseline card at a time, prioritised by most recent quest activity (most recently completed challenge or task). After one is completed, the next path's card appears on the next page load. Don't stack multiple baseline cards.

### Data storage

```sql
create table quest_aliveness_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  quest_id uuid references quests(id) not null,
  snapshot_type text not null check (snapshot_type in ('baseline', 'checkin')),
  scores jsonb not null,
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

Baseline: `snapshot_type = 'baseline'`, created once during Path Definition.
Check-ins: `snapshot_type = 'checkin'`, created during bi-weekly check-ins.

**scores jsonb format:**
```json
{
  "permission": 3,
  "safety": 4,
  "connection": 2,
  "engagement": 5,
  "alignment": 4
}
```
Keys match dimension IDs. Values are integers 1-5.

---

## Part 2: Bi-Weekly Aliveness Check-In

### When it appears

- **Frequency:** Every 14 days from the baseline date (not calendar-fixed)
- **Where:** Progress tab, as a card at the top: "It's been 2 weeks. How alive are you? 60 seconds."
- **Dismissible:** "Not now" hides it for that session. Reappears next session.
- **NOT mandatory.** A prompt, not a gate.
- **Multi-path:** Show one check-in card at a time, oldest-due first. After completing one, the next path's card appears on the next page load.

### Check-in UX

Same 5 questions as baseline. Same button UI. On completion:

**Results view: triple-layer radar comparison**
- GenericRadar with three layers:
  - **Purple solid** = current check-in (now)
  - **Grey dotted** = previous check-in (last time)
  - **Amber dashed** = baseline (day 1)
- First check-in: only two layers (purple + amber). Grey layer appears from second check-in onward.
- Below the radar: shift breakdown per dimension, sorted by magnitude
- For each dimension showing two deltas: vs previous ("↑1 since last") and vs baseline ("↑3 since start")
- The headline adapts:
  - Growing vs both: "You're more alive than when you started, and still climbing."
  - Up vs baseline but flat vs previous: "You've come a long way. Time to push a new edge."
  - Flat vs both: "Holding steady. Pick one dimension and push it."
  - Down vs previous: "Something shifted recently. Let's look at what."

### If a dimension is deficient

**Trigger:** A dimension dropped 2+ points from baseline, OR has been <= 2 for 2+ consecutive check-ins.

**Surface (below the shift breakdown):**
```
"Your [dimension] has been flat."
→ Show a suggested courage challenge type
→ User taps to accept, modify, or dismiss
```

**On accept:** Opens WahooCreator pre-filled with the suggestion text as the challenge title, the quest pre-selected, and the deficient Vibe Rise dimension's corresponding dome dimension(s) pre-tagged. User can edit before saving. This closes the loop — the suggestion becomes a real courage challenge tracked in the system.

---

## Part 3: How Paths Feed Aliveness Dimensions

### The bridge: Dome dimensions → Vibe Rise dimensions (v1/testable)

> **Note:** This mapping is hypothesis, not proven architecture. Ship it as v1, validate with real user data before treating it as load-bearing.

Each path has dome dimensions set during Path Definition. Each dome dimension naturally feeds specific Vibe Rise dimensions:

| Dome Dimension | Vibe Rise Dimension it feeds | Why |
|---|---|---|
| People | Connection | More social exposure = more bonding opportunities |
| Money | Engagement | Getting paid for what you love = process feels energising |
| Vulnerability | Safety | Being seen and surviving it = comfort with visibility |
| Stakes | Permission | Taking bigger risks = proof your world accepts this |
| Rarity | Engagement | Doing something unique = intrinsically energising |
| Identity | Alignment | Becoming someone new = path feels more like the real you |
| Context | Permission | Unfamiliar contexts = testing whether you feel accepted |
| Business Commitment | Engagement | Deeper commitment = more process investment |

### The life fuels bridge (v1/testable)

Each path has life fuels selected during The Shift:

| Life Fuel | Vibe Rise Dimension it feeds |
|---|---|
| Choice | Permission + Engagement |
| Connection | Connection |
| Mastery | Engagement |
| Meaning | Alignment (serves something bigger = feels like the real you) |

### Challenge suggestions by deficient dimension

| Flat Dimension | Suggestion | Example |
|---|---|---|
| **Permission** | Do something where acceptance is the edge | "Tell someone new what you're working on" |
| **Safety** | Do something where being seen is the stretch | "Share something you've made with someone whose opinion matters" |
| **Connection** | Do something with another person in this domain | "Invite someone who does this to collaborate or just talk" |
| **Engagement** | Check: still energised by the process, or just grinding? | "Spend 30 min on your path doing ONLY the parts that light you up" |
| **Alignment** | Check: does this still feel like you? | "Describe your path to a stranger. Does the description excite you?" |

### Two game design phases

**Phase 1: Deficiency-driven** (when a dimension is flat)
- "Your Permission is flat. Here's a challenge to open it."
- Reactive. The aliveness check-in reveals the problem. The challenge targets it.

**Phase 2: Path-driven** (when all dimensions are above 3)
- "Your dance events path needs Connection + Permission. Here's a challenge that grows both."
- Proactive. The path determines the challenge. The check-in confirms it's working.

**The transition:** Phase 1 handles early journey users who have clear deficiencies. Phase 2 kicks in when the shape is more balanced and the work shifts from fixing to building.

---

## Part 4: The Three-Radar Connection

```
ZONE CAL RADAR (8 dims)     → "Where am I on the journey?"
  Journey dimensions tell you WHAT to work on
       ↕
DOME OF SAFETY (8 dims)     → "What can my NS handle?"
  Capacity determines how BIG challenges can be
       ↕
VIBE RISE RADAR (5 dims)    → "How alive do I feel on this path?"
  Aliveness is the COMPASS. Is the work making you more alive?
```

**The game loop:**
1. Zone Cal shows a flat spoke (e.g., Worth)
2. Dome shows capacity on related dimensions (e.g., Money = level 3)
3. Courage challenge generated: stretches Money at level 3 difficulty, targeting Worth
4. After challenge: Dome Money potentially grows
5. Bi-weekly Vibe Rise check-in: did aliveness increase on this path?
6. If yes: the challenge worked. Continue.
7. If no: the dimension being targeted might be wrong.

### Armour detector (v2 — parked)

> **Not building in v1.** The concept: if the dome is growing but aliveness is flat, the user is building capacity without surrender. But confidence is low — dome-up-aliveness-flat could also mean bad timing, life circumstances, or normal early-path discomfort. Ship the radar first, let real data accumulate (20+ users, 3+ check-ins each), then investigate whether this pattern is real and what intervention helps.
>
> Connects to the Growth vs Enlightenment framework: the app handles the x-axis (capacity). The y-axis (non-resistance) can't be gamified. If the armour pattern proves real, the detector is the warning that someone is maxing x without moving y.

---

## Implementation Checklist

### Phase 1: Baseline (build now)
- [ ] Create `quest_aliveness_snapshots` Supabase migration
- [ ] Create shared 5-dimension data file (or update existing VibeRiseRadar DIMENSIONS)
- [ ] Add Screen 0 to PathDefinitionFlow.jsx (5 questions, 1-5 buttons, pentagon radar reveal)
- [ ] Use GenericRadar component for the reveal (pentagon, not hexagon)
- [ ] Save baseline snapshot on completion (`snapshot_type = 'baseline'`)
- [ ] Update screen numbering (0→1, 1→2, 2→3)
- [ ] Add retroactive baseline card on Progress tab for existing users without a baseline

### Phase 2: Check-in (build next)
- [ ] Bi-weekly prompt logic: 14 days from last snapshot, show card in Progress tab
- [ ] Check-in flow: same 5 questions, same UI
- [ ] Dual radar comparison: GenericRadar with scores + scores2
- [ ] Shift breakdown with deltas per dimension
- [ ] Dismissible but reappears next session

### Phase 3: Intelligence (build later)
- [ ] Deficiency detector: flag dimensions that dropped 2+ or stayed <= 2 for 2+ check-ins
- [ ] Dome → Vibe Rise dimension mapping function (v1/testable)
- [ ] Challenge suggestion engine: given deficient Vibe Rise dimension, suggest challenge type
- [ ] Path recommendation: which active path most feeds the deficient dimension

### Parked for v2 (needs real data first)
- Armour detector: dome growing + Vibe Rise flat = warning. Investigate after 20+ users have 3+ check-ins.

### What NOT to build
- Don't auto-generate challenges. Surface suggestions, let the user choose.
- Don't gamify Vibe Rise scores (leaderboards, streaks). Aliveness resists gamification. Surface it, don't rank it.
- Don't make the bi-weekly check-in mandatory. Prompt, not gate.
- Don't replace self-report with data-derived scores (see zone-cal-data-derived-scoring.md).
- Don't suggest events as a dimension intervention (users are global, events are local).

---

## Key Files for Build Agent

| File | Why |
|---|---|
| `src/flows/PathDefinitionFlow.jsx` | Where Screen 0 gets added |
| `src/flows/VibeRiseRadar.jsx` | Dimension definitions + question UX pattern to replicate |
| `src/components/GenericRadar.jsx` | Radar renderer (supports dual overlay via scores2) |
| `src/components/ProgressTab.jsx` | Where bi-weekly check-in prompt appears |
| `src/components/WeeklyReview.jsx` | Pattern for periodic check-in UX |
| `src/data/zoneCalDimensions.js` | Zone Cal dimensions (for three-radar connection) |
| `src/data/domeDimensions.js` | Dome dimensions (for the bridge mapping) |
| `docs/features/zone-cal-data-derived-scoring.md` | Future scoring notes |

### Lead magnet connection

The lead magnet at `/try/vibe-rise-radar` (`VibeRiseRadar.jsx`) uses the same 5 dimensions but serves a different purpose (acquisition, one-time snapshot for strangers). Questions are reframed for general life context rather than path-specific. Data is stored in `public_leads` (not `quest_aliveness_snapshots`) and does not flow into the in-app path radar.
