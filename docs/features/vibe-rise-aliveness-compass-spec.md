---
title: Vibe Rise Aliveness Compass - Full Feature Spec
tags: [vibe-rise-radar, path-definition, courage-challenges, game-design, aliveness]
created: 2026-09-12
status: ready-for-agent
replaces:
  - docs/features/vibe-rise-radar-in-path-definition-spec.md
  - docs/features/paths-support-vibe-rise-growth-spec.md
---

# Vibe Rise Aliveness Compass

> **One feature, three parts:** Baseline capture at path start, bi-weekly check-ins that track the shift, and deficiency-driven challenge suggestions when dimensions go flat.
>
> **The product loop:** Baseline → courage challenges → bi-weekly re-check → shape changes → deficient dimensions surface → targeted challenges → shape changes again. The aliveness shape changing over time IS the product. Like Nike Run Club showing your pace improving.

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
- Sub: "How alive are you right now? 6 questions. 60 seconds."
- 6 dimensions, one at a time, same 1-5 button UX as /try/vibe-rise-radar
- Progress dots (6) separate from the main Path Definition progress
- On completion: brief GenericRadar reveal (2 seconds), then auto-advance to Screen 1

**The 6 dimensions (post-Engagement rename):**

| # | Dimension | Emoji | Question |
|---|-----------|-------|----------|
| 1 | Permission | 🚪 | How free do you feel to express yourself right now? |
| 2 | Safety | 🛡️ | How safe do you feel to let go right now? |
| 3 | Freedom | 🦅 | Are you being fully yourself right now, or holding back? |
| 4 | Connection | 🤝 | How connected do you feel to the people around you? |
| 5 | Engagement | 🔥 | How excited are you by the activities in your life, not just the outcomes? |
| 6 | Joy | ✨ | How alive do you feel right now? |

**Anchors (1-5 per dimension):** Use existing anchors from `src/flows/VibeRiseRadar.jsx` DIMENSIONS array.

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

---

## Part 2: Bi-Weekly Aliveness Check-In

### When it appears

- **Frequency:** Every 14 days from the baseline date (not calendar-fixed)
- **Where:** Progress tab, as a card at the top: "It's been 2 weeks. How alive are you? 60 seconds."
- **Dismissible:** "Not now" hides it for that session. Reappears next session.
- **NOT mandatory.** A prompt, not a gate.

### Check-in UX

Same 6 questions as baseline. Same button UI. On completion:

**Results view: dual radar comparison**
- GenericRadar with `scores` = current check-in (purple solid) and `scores2` = baseline (amber dashed)
- Below the radar: shift breakdown per dimension, sorted by magnitude
- For each dimension showing delta: "+2" (green) or "-1" (red) or "=" (grey)
- The headline adapts:
  - Overall up: "You're more alive than when you started."
  - Overall flat: "Holding steady. Pick one dimension and push it."
  - Overall down: "Something shifted. Let's look at what."

### If a dimension is deficient

**Trigger:** A dimension dropped 2+ points from baseline, OR has been <= 2 for 2+ consecutive check-ins.

**Surface (below the shift breakdown):**
```
"Your [dimension] has been flat."
→ Show which active path is MOST connected to that dimension
→ Show a suggested courage challenge type
→ User taps to accept, modify, or dismiss
```

---

## Part 3: How Paths Feed Aliveness Dimensions

### The bridge: Dome dimensions → Vibe Rise dimensions

Each path has dome dimensions set during Path Definition. Each dome dimension naturally feeds specific Vibe Rise dimensions:

| Dome Dimension | Vibe Rise Dimension it feeds | Why |
|---|---|---|
| People | Connection | More social exposure = more bonding opportunities |
| Money | Engagement | Getting paid for what you love = process feels worthwhile |
| Vulnerability | Freedom + Safety | Being seen as yourself + proof it's survivable |
| Stakes | Permission | Taking bigger risks = giving yourself permission |
| Rarity | Engagement | Doing something unique = intrinsically motivated |
| Identity | Freedom | Becoming someone new = showing up as yourself |
| Context | Permission | Unfamiliar contexts force authentic response |
| Business Commitment | Engagement | Deeper commitment = more process investment |

### The life fuels bridge

Each path has life fuels selected during The Shift:

| Life Fuel | Vibe Rise Dimension it feeds |
|---|---|
| Choice | Permission + Engagement |
| Connection | Connection |
| Mastery | Engagement |
| Meaning | Joy (serves something bigger = aliveness output) |

### Challenge suggestions by deficient dimension

| Flat Dimension | Suggestion | Example |
|---|---|---|
| **Permission** | Do something you've been holding back on | "Post something you've been sitting on for weeks" |
| **Safety** | Go somewhere you feel safe to let go | "Attend a Vibe Rise event or ecstatic dance" |
| **Freedom** | Show up as yourself somewhere you usually perform | "Say the thing you'd normally filter" |
| **Connection** | Do something with another person, not a screen | "Invite someone you haven't seen in a month" |
| **Engagement** | Check: still excited by the process, or just grinding? | "Spend 30 min on your path doing ONLY the parts that light you up" |
| **Joy** | Not directly targetable. Surface which other dimension is suppressing it. | "Your Connection dropped. Joy often follows Connection." |

### Two game design phases

**Phase 1: Deficiency-driven** (when Zone Cal has flat spokes)
- "Your Permission is flat. Here's a challenge to open it."
- Reactive. The aliveness check-in reveals the problem. The challenge targets it.

**Phase 2: Path-driven** (when Zone Cal is balanced, no spoke below 3)
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
VIBE RISE RADAR (6 dims)    → "How alive do I feel?"
  Aliveness is the COMPASS. Is the work making you more alive?
```

**The game loop:**
1. Zone Cal shows a flat spoke (e.g., Worth)
2. Dome shows capacity on related dimensions (e.g., Money = level 3)
3. Courage challenge generated: stretches Money at level 3 difficulty, targeting Worth
4. After challenge: Dome Money potentially grows
5. Bi-weekly Vibe Rise check-in: did aliveness increase?
6. If yes: the challenge worked. Continue.
7. If no: the dimension being targeted might be wrong. Or: Armour.

**The Armour detector:** If the dome is growing (courage challenges completing, dimensions expanding) but the Vibe Rise Radar is flat or dropping, the user is building Armour — capacity without surrender. The app should flag: "Your dome is growing but your aliveness isn't. You might be pushing through instead of opening up. Consider a different kind of challenge — or the same challenge, done with less grip."

This connects directly to the Growth vs Enlightenment framework: the app handles the x-axis (capacity). The y-axis (non-resistance) can't be gamified. The Armour detector is the warning that someone is maxing x without moving y.

---

## Implementation Checklist

### Phase 1: Baseline (build now)
- [ ] Create `quest_aliveness_snapshots` Supabase migration
- [ ] Add Screen 0 to PathDefinitionFlow.jsx
- [ ] Import dimension data from VibeRiseRadar.jsx (extract DIMENSIONS to shared data file, or import directly)
- [ ] Use GenericRadar component for the reveal
- [ ] Save baseline snapshot on completion
- [ ] Update screen numbering (0→1, 1→2, 2→3)

### Phase 2: Check-in (build next)
- [ ] Bi-weekly prompt logic: 14 days from last snapshot, show card in Progress tab
- [ ] Check-in flow: same 6 questions, same UI
- [ ] Dual radar comparison: GenericRadar with scores + scores2
- [ ] Shift breakdown with deltas per dimension
- [ ] Dismissible but reappears next session

### Phase 3: Intelligence (build later)
- [ ] Deficiency detector: flag dimensions that dropped 2+ or stayed <= 2 for 2+ check-ins
- [ ] Dome → Vibe Rise dimension mapping function
- [ ] Challenge suggestion engine: given deficient Vibe Rise dimension, suggest challenge type
- [ ] Path recommendation: which active path most feeds the deficient dimension
- [ ] Armour detector: dome growing + Vibe Rise flat = warning

### What NOT to build
- Don't auto-generate challenges. Surface suggestions, let the user choose.
- Don't gamify Vibe Rise scores (leaderboards, streaks). Aliveness resists gamification. Surface it, don't rank it.
- Don't make the bi-weekly check-in mandatory. Prompt, not gate.
- Don't replace self-report with data-derived scores (see zone-cal-data-derived-scoring.md).

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
