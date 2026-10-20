# Zone Cal Radar — Progress Tab Spec (V1)

*Self-report every 21 days. See your shape. Get one recommendation.*

---

## What This Is

An 8-spoke self-report radar on the Progress Tab that shows the user where they are on the aliveness journey. Every 21 days they answer 8 questions (one tap each, 30 seconds). The shape reveals a diagnosis and points to the one spoke to work on next.

**V1 scope:** Self-report scoring only. No behavioural inference. No dome ceiling overlay. No observation card integration.

## What Already Exists

| File | What | Reuse |
|------|------|-------|
| `src/data/zoneCalDimensions.js` | 8 dimensions, 5-level rubrics, 9 diagnoses, `getDiagnosis()`, `getNextSpoke()` | Direct — no changes needed |
| `src/flows/ZoneCalRadar.jsx` | Lead magnet flow: hook → 8 questions → email → results | UX pattern for the 8-question check-in |
| `src/components/GenericRadar.jsx` | N-spoke SVG radar with 3 overlay layers (current, baseline, previous) | Direct — renders the Zone Cal shape |

## The 8 Spokes

Arranged clockwise as a journey. Inner work first, then outer work.

**REPAIR Phase (inner work):**

| # | Spoke | Question | When lowest → CTA |
|---|-------|----------|-------------------|
| 1 | Identity 🪞 | "Who am I underneath the roles?" | "What's a courage challenge that helps express your essence character?" → WahooCreator |
| 2 | Vulnerability 💜 | "Can I let myself be seen?" | "Create a courage challenge that pushes Vulnerability" → WahooCreator (Vulnerability pre-tagged) |
| 3 | Direction 🧭 | "What's mine to create?" | "Complete courage challenges on your life paths" → Paths tab |
| 4 | Worth 👑 | "Do I believe I deserve this?" | "A voice is blocking this. Let's find it" → Voice selector → Healing flow (voice pre-selected) |

**BUILD Phase (outer work):**

| # | Spoke | Question | When lowest → CTA |
|---|-------|----------|-------------------|
| 5 | Growth 🌱 | "Am I stretching at the right level?" | "Create a courage challenge" → WahooCreator |
| 6 | Output 🔨 | "Am I building without burning out?" | "Set up a weekly practice" → Tune tab |
| 7 | Risk 🎲 | "Am I betting on things that light me up?" | "Create a courage challenge that pushes Money or Stakes" → WahooCreator (Money/Stakes pre-tagged) |
| 8 | Play 🎪 | "Does this feel like play or obligation?" | "Check your aftertaste. Are you doing things you'd do again?" → Weekly Review |

**Worth is THE HINGE.** Without clearing the inner critic, Growth and Output collapse. If every spoke is 4-5 except Worth — that's "The Hinge Block."

## Diagnoses (from shape)

Already implemented in `zoneCalDimensions.js`. Matched in priority order:

| Pattern | Name | One-liner |
|---------|------|-----------|
| All ≤ 2 | **The Crack** | "Everything is about to change." |
| Inner avg > outer avg by 1.5+ | **Head Full of Dreams** | "You know everything. You do nothing about it." |
| Outer avg > inner avg by 1.5+ | **Misguided Hustle** | "You're building fast. On someone else's foundation." |
| Worth ≤ 2 AND Play ≤ 2, others ≥ 3 | **The Hinge Block + Grinding** | "Two flat spokes. Worth and Play are both stuck." |
| Worth ≤ 2, others ≥ Worth+2 | **The Hinge Block** | "Everything else is growing. This is the ceiling." |
| Play ≤ 2, others ≥ Play+2 | **Grinding** | "You're doing everything right. It just doesn't feel alive." |
| Identity ≥ 4, Direction ≥ 4, Worth ≤ 2, Risk ≤ 2 | **Knows But Won't Charge** | "You see the path. You don't believe you deserve to walk it." |
| All ≥ 4 | **Your Flow** | "You're on the diagonal. Keep going." |
| Avg 2.5–3.5, all 2–4 | **The Middle** | "You're in motion. No single thing is broken." |
| No match | **Focus: [lowest spoke]** | "[Spoke] is where the growth edge is." |

Diagnosis name + headline shown directly to the user on the Progress Tab. No hiding.

---

## Database

### New table: `zone_cal_snapshots`

```sql
create table zone_cal_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  scores jsonb not null,          -- { identity: 3, vulnerability: 2, ... }
  diagnosis text not null,        -- diagnosis id, e.g. 'hinge_block'
  source text not null default 'in_app',  -- 'in_app' | 'lead_magnet'
  created_at timestamptz default now()
);

-- RLS
alter table zone_cal_snapshots enable row level security;
create policy "Users read own snapshots"
  on zone_cal_snapshots for select using (auth.uid() = user_id);
create policy "Users insert own snapshots"
  on zone_cal_snapshots for insert with check (auth.uid() = user_id);

-- Index for fetching latest + history
create index idx_zonecal_user_date on zone_cal_snapshots(user_id, created_at desc);
```

No update/delete policies — snapshots are immutable records.

### Lead magnet bridge

When a lead magnet user (`lead_captures` with `source = 'zone-cal-radar'`) signs up, their first in-app snapshot is pre-populated from `lead_captures.scores.dimensions`. Source = `'lead_magnet'`. This avoids cold start — they already have a shape.

---

## Progress Tab Integration

### Position

```
Hero Card (stage X of 12)
  ↓
Zone Cal Section  ← NEW
  ↓
Observations Section
  ↓
Essence Card
  ↓
Voice Section
  ↓
Evidence Section
  ↓
Paths Section
  ↓
Income Card
```

### Three states

**State 1: No snapshot exists**
- Compact card: "See your shape" + "8 questions, 30 seconds" + CTA button
- CTA opens inline check-in flow (same tier-card UX as lead magnet, no email gate)
- Available after Essence Mirror completed (user has at least basic identity data)

**State 2: Snapshot exists, not stale (< 21 days old)**
- GenericRadar showing current scores (purple fill)
- If previous snapshot exists: shown as grey dotted layer (scores3 prop)
- Diagnosis name + headline below radar
- Lowest spoke highlighted with CTA button
- Small "X days until next check-in" text
- Tap radar to expand dimension breakdown (accordion)

**State 3: Snapshot exists, stale (≥ 21 days old)**
- Same radar display as State 2
- CTA changes to "Your shape is 21+ days old. Retake?" with purple button
- Tapping opens inline check-in flow
- Previous scores shown as context (see check-in flow below), not pre-selected

### Inline check-in flow

Reuses the tier-card UX from `ZoneCalRadar.jsx` but:
- No hook screen (they're already in the app)
- No email gate (they're authenticated)
- No calculating animation (instant)
- **Previous answer as context, not pre-selected.** On retake, each question shows a small label above the tier cards: "Last time: Level 3 — Glimpses" (grey text). No tier is pre-selected. The user must tap fresh. The friction IS the value — the pause to reflect on "has this actually changed?" is the whole point of the 21-day ritual.
- Auto-advances on tap (300ms delay, same as lead magnet)
- Progress dots (8 dots, fill as you go)
- Phase label ("Inner work · 3 of 8")
- Back button to revisit previous question
- On completion: saves to `zone_cal_snapshots`, shows results inline with diagnosis change narrative (see below), radar animates to new shape

### Radar display

Uses `GenericRadar.jsx` with:
- `dimensions` = `ZONE_CAL_DIMENSIONS`
- `scores` = latest snapshot scores (purple fill)
- `scores3` = previous snapshot scores (grey dotted) — if exists
- `maxLevel` = 5
- `size` = 280 (matches Dome radar)
- `showLabels` = true
- `animate` = true

### Lowest spoke CTA

`getNextSpoke(scores)` returns the lowest dimension. The CTA maps to:

```javascript
const SPOKE_CTAS = {
  identity: {
    text: "What's a courage challenge that helps express your essence character?",
    route: '/7-day-challenge',  // Courage tab
    tab: 'courage',
  },
  vulnerability: {
    text: 'Create a courage challenge that pushes Vulnerability',
    route: '/7-day-challenge',
    tab: 'courage',
    prefill: { dimension: 'vulnerability' },
  },
  direction: {
    text: 'Complete courage challenges on your life paths',
    route: '/7-day-challenge',
    tab: 'paths',
  },
  worth: {
    text: "A voice is blocking this. Let's find it",
    action: 'healing_voice_select',
    // Opens voice selector first ("Which voice shows up when you think about
    // charging what you're worth?"). User picks from their known voices
    // (voice_pattern_prompts) or enters a new one. Then opens HealingFlowModal
    // with that voice pre-selected. If no voices detected yet, opens a
    // simplified voice discovery prompt instead.
  },
  growth: {
    text: 'Create a courage challenge',
    route: '/7-day-challenge',
    tab: 'courage',
  },
  output: {
    text: 'Set up a weekly practice',
    route: '/7-day-challenge',
    tab: 'tune',
  },
  risk: {
    text: 'Create a courage challenge that pushes Money or Stakes',
    route: '/7-day-challenge',
    tab: 'courage',
    prefill: { dimensions: ['money', 'stakes'] },
  },
  play: {
    text: "Check your aftertaste. Are you doing things you'd do again?",
    route: '/7-day-challenge',
    tab: 'discover',
  },
}
```

If `getNextSpoke()` returns null (all ≥ 4 = "Your Flow"), no CTA. Diagnosis handles it: "You're on the diagonal. Keep going."

### Diagnosis change narrative

When the user completes a retake (not their first check-in), the results screen shows a **transition narrative** before the new diagnosis:

1. **Previous diagnosis** (grey, smaller): "You were in **Head Full of Dreams**"
2. **Arrow or transition indicator**
3. **New diagnosis** (purple, larger): "Now you're in **The Hinge Block**"
4. **Change summary** (one sentence): Generated from comparing old vs new scores. Logic:

```javascript
function getChangeNarrative(oldScores, newScores, oldDiagnosis, newDiagnosis) {
  // Find spokes that moved the most
  const changes = ZONE_CAL_DIMENSIONS.map(d => ({
    id: d.id,
    name: d.name,
    delta: (newScores[d.id] || 0) - (oldScores[d.id] || 0),
  })).filter(c => c.delta !== 0).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))

  const grew = changes.filter(c => c.delta > 0)
  const dropped = changes.filter(c => c.delta < 0)

  if (oldDiagnosis.id === newDiagnosis.id) {
    // Same diagnosis — highlight what moved
    if (grew.length) return `${grew[0].name} grew. You're still in the same shape, but it's shifting.`
    return "Same shape. The 21-day check-in is about noticing, not forcing change."
  }

  // Different diagnosis — narrate the transition
  if (grew.length && !dropped.length) return `${grew.map(c => c.name).join(' and ')} moved. Your shape changed.`
  if (grew.length && dropped.length) return `${grew[0].name} grew while ${dropped[0].name} softened. Different shape, different focus.`
  return "Your shape shifted. New spoke to focus on."
}
```

If it's the user's first check-in (no previous snapshot), skip the transition — just show the diagnosis and radar directly.

---

## Lead Magnet Bridge

When a user signs up who previously completed the Zone Cal lead magnet:

**Trigger:** On first `ZoneCalSection` render when no `zone_cal_snapshots` exist for the user. The component checks `lead_captures` for a row where `email` matches the user's auth email AND `source = 'zone-cal-radar'` AND `scores.dimensions` is not null.

**Action:** Auto-insert a `zone_cal_snapshots` row with:
- `scores` = `lead_captures.scores.dimensions`
- `diagnosis` = computed via `getDiagnosis(scores)`
- `source` = `'lead_magnet'`
- `created_at` = `lead_captures.created_at` (original capture date, not now — so the 21-day staleness check uses the real date)

**UX:** User sees their lead magnet shape already on the Progress Tab. If the lead magnet was > 21 days ago, they immediately see "Your shape is 21+ days old. Retake?" No cold start either way.

**Edge case:** If `lead_captures` email doesn't match auth email (user signed up with a different email), no bridge. They start fresh.

---

## Components

### New: `ZoneCalSection.jsx`

Container component for the Progress Tab section. Handles:
- Loading snapshots from Supabase
- Determining state (no snapshot / fresh / stale)
- Rendering radar + diagnosis + CTA (states 2 & 3)
- Rendering "See your shape" card (state 1)
- Managing inline check-in flow open/close

### New: `ZoneCalCheckin.jsx`

Inline 8-question check-in flow. Extracted from `ZoneCalRadar.jsx` lead magnet but without:
- Hook screen
- Email gate
- Calculating animation
- Share button

Additions:
- Previous answer shown as context label per question (not pre-selected)
- `onComplete(scores)` callback → parent saves to DB
- Cancel/close button

### Existing (no changes): 
- `GenericRadar.jsx` — renders the radar
- `zoneCalDimensions.js` — dimensions, diagnoses, helpers

---

## Data Flow

```
ProgressTab loads
  → query zone_cal_snapshots (latest 2, ordered by created_at desc)
  → pass to ZoneCalSection
    → [latest, previous] = snapshots
    → if none:
        → check lead_captures for matching email + zone-cal-radar source
        → if found: auto-insert snapshot from lead magnet data, refetch
        → if not found: show "See your shape" card
    → if latest.created_at > 21 days ago: show "Retake?" CTA
    → else: show radar + diagnosis + lowest spoke CTA
    → on check-in complete:
        → insert new snapshot
        → if previous exists: show diagnosis change narrative
        → refetch, animate radar to new shape
```

---

## What's NOT in V1

- **Behavioural evidence layer** — no "your data suggests..." per spoke
- **Dome ceiling overlay** — no visual showing where Dome caps Zone Cal
- **Observation card integration** — Zone Cal doesn't feed the intelligence observation engine
- **Hero Card diagnosis** — Hero Card keeps showing hero stage, doesn't reference Zone Cal diagnosis
- **Shape change notifications** — no push/prompt when shape changes significantly
- **Share from Progress Tab** — no html2canvas share of in-app radar (lead magnet has this)

---

## File Summary

| File | Action | Purpose |
|------|--------|---------|
| `src/components/ZoneCalSection.jsx` | Create | Progress Tab section container |
| `src/components/ZoneCalSection.css` | Create | Scoped styles |
| `src/components/ZoneCalCheckin.jsx` | Create | Inline 8-question check-in |
| `src/components/ZoneCalCheckin.css` | Create | Check-in styles (reuse `.zcr-` patterns) |
| `src/components/ProgressTab.jsx` | Edit | Add ZoneCalSection between Hero Card and Observations |
| `supabase/migrations/YYYYMMDD_zone_cal_snapshots.sql` | Create | DB table + RLS + index |
| `src/data/zoneCalDimensions.js` | No change | Already has everything needed |
| `src/components/GenericRadar.jsx` | No change | Already supports 3-layer rendering |

---

## Source Documents

- `docs/frameworks/zone-cal-dome-product-architecture.md` — architecture overview
- Obsidian: `Frameworks/Zone Cal Radar (Proposed).md` — full dimension specs + scoring rubrics
- Obsidian: `Frameworks/Dome of Safety.md` — dome measurement system
- Obsidian: `Frameworks/Growth vs Enlightenment.md` — the foundational 2x2
