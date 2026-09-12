---
title: Paths Supporting Vibe Rise Radar Growth
tags: [vibe-rise-radar, paths, courage-challenges, game-design, spec]
created: 2026-09-12
status: spec-for-agent
---

# How Paths Support Vibe Rise Radar Growth

> **The insight:** Each life path naturally stretches specific Vibe Rise Radar dimensions and starves others. The bi-weekly aliveness check-in REVEALS which dimensions are moving and which aren't. The app surfaces this, the user decides what to do.

## The Connection: Paths → Dimensions

### What we know about each Vibe Rise dimension

| Dimension | What grows it | What starves it |
|---|---|---|
| **Permission** | Environments where expression is rewarded. Creating spaces for others to express. Being in rooms where you're encouraged to be yourself. | Environments that punish deviation. Working for people who suppress your expression. Hiding parts of yourself. |
| **Safety** | Repeated proof that expression doesn't destroy you. Each courage challenge that goes well = safety evidence accumulating. Co-regulation (being around regulated people). | Betrayal, public failure without support, isolation after vulnerability. |
| **Freedom** | Actions where you show up as yourself, not a role. Dropping the performance. Any path aligned with your essence archetype. | Paths that require you to perform a version of yourself. Clients who want the mask. Jobs that need the role, not you. |
| **Connection** | Activities involving real people. Events, workshops, 1:1 sessions, community building. Shared vulnerability. | Solo work without social contact. Screen-only communication. Building in isolation. |
| **Engagement** | Working on things you'd do for free. Paths chosen from intrinsic motivation (Experience Game results). Process excitement, not just outcome chasing. | Grinding toward outcomes without caring about the process. "I hate this but it pays well." Obligation without choice. |
| **Joy** | The OUTPUT of the other 5 flowing. Not directly targetable. Joy rises when Permission + Safety + Freedom + Connection + Engagement are open. | All other dimensions being suppressed. Joy doesn't have its own lever — it's the compound signal. |

### How to map a user's specific paths to dimensions

Each path in the app has:
- A **quest name** (e.g., "Run dance events," "Build coaching business")
- **Dome dimensions** stretched by courage challenges on this path (from Path Definition)
- **Life fuels** selected during The Shift (Choice, Connection, Mastery, Meaning)
- **Protective voice** identified during The Shift

The bridge from Dome dimensions to Vibe Rise dimensions:

| Dome Dimension | Most likely Vibe Rise Dimension it feeds |
|---|---|
| People | Connection (more people = more social exposure = more bonding opportunities) |
| Money | Worth (via Zone Cal), which supports Engagement (doing what you love AND getting paid) |
| Vulnerability | Freedom (being seen as yourself) + Safety (proof it's survivable) |
| Stakes | Permission (taking bigger risks = giving yourself permission) |
| Rarity | Engagement (doing something unique = intrinsically motivated) |
| Identity | Freedom (becoming someone new = showing up as yourself) |
| Context | Permission (unfamiliar contexts force authentic response, no script to follow) |
| Business Commitment | Engagement (deeper commitment = more process investment) |

**The life fuels bridge:**

| Life Fuel | Most likely Vibe Rise Dimension it feeds |
|---|---|
| Choice | Permission + Engagement (choosing = giving yourself permission + process excitement) |
| Connection | Connection (direct mapping) |
| Mastery | Engagement (growth in skill = process excitement) |
| Meaning | Joy (serving something bigger = aliveness output) |

## Game Design: Two Phases

### Phase 1: Deficiency-Driven (Zone Cal has flat spokes)

When a bi-weekly Vibe Rise check-in reveals a flat or dropping dimension:

**The surface flow:**
```
User opens Progress tab
  → "Your aliveness check-in is ready" (bi-weekly prompt)
  → 6 questions (same as baseline, 60 seconds)
  → Results: dual radar (baseline vs now) + shift breakdown
  → IF a dimension dropped 2+ points OR has been <= 2 for 2+ check-ins:
      → "Your [dimension] has been flat. Here's what might help."
      → Show which active path is MOST connected to that dimension
      → Suggest a specific courage challenge type that stretches it
```

**Challenge suggestions by deficient dimension:**

| Flat Dimension | Challenge suggestion | Example |
|---|---|---|
| **Permission** | "Do something you've been holding back on. Express an opinion, wear something bold, say no to something." | "Post something on social media you've been sitting on for weeks." |
| **Safety** | "Go somewhere you feel safe to let go. Attend an event, join a group, or call someone who makes you feel held." | "Go to a Vibe Rise event or an ecstatic dance this week." |
| **Freedom** | "Show up as yourself somewhere you usually perform. Drop one layer of the mask." | "In your next meeting/date/event, say the thing you'd normally filter." |
| **Connection** | "Do something with another person. Not a screen. A human." | "Invite someone you haven't seen in a month to do something together." |
| **Engagement** | "Check: are you still excited by the PROCESS of your path, or just grinding toward the result?" | "Spend 30 minutes on your path doing only the parts that light you up. Skip everything else." |
| **Joy** | No direct challenge. Joy is the output. Instead: surface which OTHER dimension is likely suppressing it. "Your Joy is flat. Looking at your other dimensions, [lowest other dim] might be the cause." | "Your Connection dropped last check-in. Joy often follows Connection. Try reconnecting first." |

### Phase 2: Path-Driven (Zone Cal is more balanced)

When the user's Zone Cal shape is relatively balanced (no spoke below 3), challenges shift from fixing deficiencies to supporting path growth:

**The surface flow:**
```
User is on their active path (e.g., "Run dance events")
  → Path has tagged Dome dimensions (People, Vulnerability, Context)
  → These map to Vibe Rise dimensions (Connection, Freedom + Safety, Permission)
  → Weekly courage challenge is generated to serve the PATH
  → After challenge: "This challenge stretched your Connection and Permission"
  → Bi-weekly check-in shows those dimensions growing
```

**The key difference:**
- Phase 1: "Your Permission is flat. Here's a challenge to fix it." (reactive, deficiency-driven)
- Phase 2: "Your dance events path needs Connection + Permission. Here's a challenge that grows both." (proactive, path-driven)

## How the Three Radars Connect

```
ZONE CAL RADAR (8 dims)          → "Where am I on the journey?"
  ↕ Journey dimensions tell you WHAT to work on
DOME OF SAFETY (8 dims)          → "What can my NS handle?"
  ↕ Capacity determines how BIG your challenges can be
VIBE RISE RADAR (6 dims)         → "How alive do I feel?"
  ↕ Aliveness is the COMPASS — is the work actually making you more alive?
```

**The game loop:**
1. Zone Cal shows a flat spoke (e.g., Worth)
2. Dome shows your capacity on related dimensions (e.g., Money dimension is level 3)
3. A courage challenge is generated: stretches Money dimension at level 3 difficulty, targeting Worth
4. After the challenge: Dome Money dimension potentially grows
5. Bi-weekly Vibe Rise check-in: did your aliveness increase? If yes, the challenge worked. If not, the dimension being targeted might be wrong.

**The aliveness compass rule:** If courage challenges are expanding the dome but the Vibe Rise Radar isn't improving, the user is building **Armour** (capacity without surrender). The app should flag this: "Your dome is growing but your aliveness isn't. You might be pushing through instead of opening up. Consider a different kind of challenge."

## Implementation Notes for Build Agent

### Data requirements
- `quest_aliveness_snapshots` table (from vibe-rise-radar-in-path-definition-spec.md)
- Existing `quests` table (has dome dimension data per path)
- Existing `courage_challenges` table (has dimension tags)
- Mapping: dome dimensions → vibe rise dimensions (the bridge table above)

### New logic needed
1. **Dimension mapping function:** Given a quest's dome dimensions, return which Vibe Rise dimensions it feeds
2. **Deficiency detector:** Compare current Vibe Rise snapshot to baseline. Flag any dimension that dropped 2+ or has been <= 2 for 2+ consecutive check-ins
3. **Challenge suggestion engine:** Given a deficient Vibe Rise dimension, suggest courage challenge types that target it (via the dome dimension bridge)
4. **Armour detector:** If dome is growing (courage challenge completion rate high) but Vibe Rise is flat or dropping, surface the "building armour" warning
5. **Bi-weekly prompt logic:** 14 days from last snapshot, show prompt in Progress tab. Dismissible but reappears next session.

### Key files to read
- `src/flows/PathDefinitionFlow.jsx` — where dome dimensions are set per path
- `src/components/ProgressTab.jsx` — where the check-in prompt would appear
- `src/components/WeeklyReview.jsx` — pattern for periodic check-in UX
- `src/data/zoneCalDimensions.js` — Zone Cal dimension definitions
- `src/data/eventDimensions.js` — Event Radar dimensions (separate from this spec)
- `src/flows/VibeRiseRadar.jsx` — the 6 Vibe Rise dimensions with the Engagement rename
- `docs/features/vibe-rise-radar-in-path-definition-spec.md` — the baseline capture spec
- `docs/features/zone-cal-data-derived-scoring.md` — data-derived scoring notes (future)

### What to build (ordered)
1. Baseline capture in Path Definition (spec exists, ready to build)
2. Bi-weekly check-in prompt in Progress tab
3. Dual radar comparison view (baseline vs current)
4. Deficiency detection + challenge suggestion
5. Path → Vibe Rise dimension mapping
6. Armour detection warning

### What NOT to build
- Don't auto-generate challenges. Surface suggestions, let the user choose.
- Don't gamify Vibe Rise scores (leaderboards, streaks). Aliveness resists gamification — score it and you convert it back to Armour. Surface it, don't rank it.
- Don't make the bi-weekly check-in mandatory. It's a prompt, not a gate.
