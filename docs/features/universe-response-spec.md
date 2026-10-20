# Universe Response — Feature Spec

**Status:** Ready to build
**Date:** 2026-09-26
**Framework:** Expression-Flow Duality (Obsidian: `Frameworks/Expression-Flow Duality.md`)

## What

A single new step in the post-courage completion flow that captures whether the external world responded to the user's expression. Two signals: compliment (recognition) and opportunity (momentum).

Plus a retroactive check in the Weekly Review for delayed universe responses.

## Why

The app is 100% internal — it measures what you expressed and what blocked you, but never whether the world spoke back. This is the missing Layer 3 of the Expression-Flow Duality: **did the universe carry your expression or ignore it?**

Over time, this data reveals which life paths have external flow (the world wants more) vs paths where you're capable but the world isn't responding (alignment problem, not a capacity problem).

Connects to EAR Framework: compliments and opportunities are "ease" signals — external confirmation you're on the right path.

---

## Part 1: Post-Courage Step

### Position in flow

**After `life_fuel`, before `share`.** This is the meaning-making crescendo:

```
... three_percent → life_fuel → universe_response → share
```

Why here, not after gap_check:
- Gap check is the analytical/shadow section (what blocked you, which voice, prediction error). Asking "did the universe speak back?" right after voice identification is tonal whiplash.
- Life fuel asks "what fed YOU" (internal channels). Universe response asks "what fed BACK" (external). Internal → external → celebrate. Natural crescendo.
- It's the last substantive question before the share/celebration screen, which gives it weight without friction.

### Interaction Design

**Screen layout — single screen, two states:**

**State 1 (default):**
```
┌─────────────────────────────────┐
│                                 │
│     ✨                          │
│                                 │
│  Did the universe speak back    │
│  to you via a compliment or     │
│  new opportunity?               │
│                                 │
│  ┌─────────┐                    │
│  │   Yes   │                    │
│  └─────────┘                    │
│  ┌──────────────┐               │
│  │ Not sure yet │               │
│  └──────────────┘               │
│  ┌──────────────┐               │
│  │ Not this time│               │
│  └──────────────┘               │
│                                 │
│       [ Complete Challenge ]    │
│                                 │
└─────────────────────────────────┘
```

Three options (mirrors aftertaste pattern: yes / not_sure / no):
- **Yes** → gold border + tint (#E9A23B). Expands to type selector (State 2).
- **Not sure yet** → purple border + tint (#5e17eb). Saved as `'not_sure'`. Triggers weekly review follow-up.
- **Not this time** → grey border + tint. Saved as `'none'`. No follow-up.

Only "Not sure yet" responses appear in the weekly review — same pattern as the Second Clock (aftertaste "not_sure" gets follow-up, "yes" and "no" don't).

**State 2 (after tapping "Yes"):**
```
┌─────────────────────────────────┐
│                                 │
│     ✨                          │
│                                 │
│  How did it speak back?         │
│                                 │
│  ┌────────────┐                 │
│  │ 💬 Compliment │              │
│  └────────────┘                 │
│  ┌──────────────┐              │
│  │ 🚪 Opportunity │             │
│  └──────────────┘              │
│  ┌────────┐                    │
│  │ ✨ Both │                    │
│  └────────┘                    │
│                                 │
│  What happened? (optional)      │
│  ┌─────────────────────────┐   │
│  │                         │   │
│  └─────────────────────────┘   │
│                                 │
│       [ Complete Challenge ]    │
│                                 │
└─────────────────────────────────┘
```

- Type options use `gcm-wahoo-btn` pattern (same as aftertaste buttons): vertical stack, emoji + label, coloured border on select
- Compliment: purple accent (#5e17eb) when selected
- Opportunity: gold accent (#E9A23B) when selected
- Both: gradient or gold accent
- Note input: single-line text input, always visible when "Yes" selected (not collapsed/expandable — just there, clearly optional via placeholder). Placeholder: "What happened?"
- "Complete Challenge" button only active after selecting a type

### Button Styling

Matches existing `gcm-wahoo-btn` class used in aftertaste step:
- Unselected: `border: 2px solid #e0e0e0`, white background
- Selected: coloured border, light tinted background (`rgba(color, 0.06)`)
- Emoji left, label right
- `hapticLight()` on tap

### Conditional Logic

- **Always show** (unlike pattern_discovered which is conditional)
- **Skip condition**: `wahooClassification === 'shutdown'` — if they shut down, don't ask about universe response. (Changed from "uninterested" — the wahoo states are vibe/peace/anxious/shutdown, not "uninterested")
- "Not this time" requires no follow-up, just enables the Complete button
- Note field is always visible when "Yes" is selected, but never required

### Flow Change: Complete Challenge Button Moves

Currently `life_fuel` has the "Complete Challenge" button that calls `handleCompleteReflection()`. With this change:
- `life_fuel` button text changes to "Continue" and advances to `universe_response`
- `universe_response` gets the "Complete Challenge" button that calls `handleCompleteReflection()`

---

## Part 2: Weekly Review Retroactive Check

### The Pattern

Mirrors the existing **Second Clock** (aftertaste follow-up). The Second Clock loads prior week's "not_sure" aftertaste challenges and asks "a week on, has that changed?" The universe check does the same for "none" universe responses.

### Position in Weekly Review

Right after the Second Clock section (if present), before the Protective Voice question:

```
[Second Clock — aftertaste follow-up]  ← existing
[Universe Check — delayed responses]   ← new
[Q2: Protective Voice]                 ← existing
```

### Interaction

```
┌─────────────────────────────────┐
│  ✨ Universe check              │
│                                 │
│  You did [challenge title] last │
│  week. Did the universe speak   │
│  back since then?               │
│                                 │
│  ┌─────────────┐ ┌──────┐      │
│  │💬 Compliment │ │🚪 Opp│      │
│  └─────────────┘ └──────┘      │
│  ┌────────┐ ┌──────────┐       │
│  │✨ Both  │ │ 😶 Nope  │       │
│  └────────┘ └──────────┘       │
│                                 │
│  What happened? (if not Nope)   │
│  ┌─────────────────────────┐   │
│  │                         │   │
│  └─────────────────────────┘   │
└─────────────────────────────────┘
```

- Shows per-challenge, same as Second Clock shows per-challenge
- Uses `wr-option-btn` class (existing weekly review button style)
- Only loads challenges from prior week where `universe_response = 'not_sure'`
- On tap: immediately saves to `groan_challenges` (same pattern as Second Clock's immediate save)
- "Nope" = no update, just marks as reviewed

### Data Query

```javascript
// Load 'none' universe response challenges from previous week
supabase
  .from('groan_challenges')
  .select('id, title, source_label, quest_id')
  .eq('user_id', userId)
  .eq('status', 'completed')
  .eq('universe_response', 'not_sure')
  .gte('completed_at', priorWeekStart.toISOString())
  .lt('completed_at', weekStart + 'T00:00:00')
```

### Save Logic

On tap, update the groan_challenge directly:

```javascript
await supabase.from('groan_challenges').update({
  universe_response: selectedValue, // 'compliment' | 'opportunity' | 'both'
  universe_response_note: noteText || null,
  universe_response_updated_at: new Date().toISOString() // marks it as retroactive
}).eq('id', challengeId)
```

Adding `universe_response_updated_at` distinguishes retroactive responses from at-completion ones (useful for future analysis — was flow immediate or delayed?).

---

## Data Model

### Migration

```sql
ALTER TABLE groan_challenges
ADD COLUMN universe_response text CHECK (universe_response IN ('none', 'not_sure', 'compliment', 'opportunity', 'both')),
ADD COLUMN universe_response_note text,
ADD COLUMN universe_response_updated_at timestamptz;
```

- `universe_response`: 'none' | 'not_sure' | 'compliment' | 'opportunity' | 'both' | null
  - null = pre-feature (never asked)
  - 'none' = "not this time" — definitive no, no follow-up
  - 'not_sure' = "not sure yet" — shows in weekly review for follow-up
  - 'compliment' / 'opportunity' / 'both' = universe spoke back
- `universe_response_note`: optional free text
- `universe_response_updated_at`: set only when retroactively updated in weekly review (null = answered at completion time)

### Save in handleCompleteReflection

Alongside existing gap data save (~line 178 in GroanCompletionModal.jsx):

```javascript
// Save universe response
if (universeResponse) {
  await supabase.from('groan_challenges').update({
    universe_response: universeResponse,
    universe_response_note: universeResponseNote || null,
  }).eq('id', challenge.id)
}
```

### Also save to reflection_text JSON

Add to the quest_completions insert (~line 208):

```javascript
reflection_text: JSON.stringify({
  // ... existing fields ...
  universe_response: universeResponse,
  universe_response_note: universeResponseNote || null,
})
```

---

## State Variables (GroanCompletionModal)

```javascript
const [universeResponse, setUniverseResponse] = useState(null) // null | 'none' | 'not_sure' | 'compliment' | 'opportunity' | 'both'
const [universeResponseNote, setUniverseResponseNote] = useState('')
```

## State Variables (WeeklyReview)

```javascript
const [universeReviews, setUniverseReviews] = useState([]) // [{ id, title, answer, note }]
```

---

## Copy

### Post-Courage Step
- **Question:** "Did the universe speak back to you via a compliment or new opportunity?"
- **Yes button:** "Yes"
- **Not sure button:** "Not sure yet"
- **No button:** "Not this time"
- **Type prompt:** "How did it speak back?"
- **Type options:** "Compliment" / "Opportunity" / "Both"
- **Note placeholder:** "What happened?"

### Weekly Review
- **Section icon:** ✨
- **Section label:** "Universe check"
- **Per-challenge:** "You did **[title]** last week. Did the universe speak back since then?"
- **Options:** "Compliment" / "Opportunity" / "Both" / "Nope"

Keep it light. This should feel like noticing magic, not filling out a form.

---

## Implementation Checklist

- [ ] Migration: add 3 columns to `groan_challenges` (universe_response, universe_response_note, universe_response_updated_at)
- [ ] GroanCompletionModal: change life_fuel "Complete Challenge" → "Continue", advance to universe_response
- [ ] GroanCompletionModal: add universe_response step (after life_fuel, before share)
- [ ] GroanCompletionModal: add state variables
- [ ] GroanCompletionModal: wire save into handleCompleteReflection (groan_challenges update + reflection_text JSON)
- [ ] GroanCompletionModal: skip for shutdown classification
- [ ] WeeklyReview: load prior-week 'none' challenges (same pattern as Second Clock query)
- [ ] WeeklyReview: render universe check section after Second Clock, before Protective Voice
- [ ] WeeklyReview: save retroactive responses with universe_response_updated_at
- [ ] CSS: universe_response step styling (reuse gcm-wahoo-btn, gold/purple accents)
- [ ] Test post-courage flow end-to-end
- [ ] Test weekly review with retroactive capture

---

## What This Unlocks (Future, Not Now)

1. **Flow Radar** — per-quest universe response rate. Quests with high compliment/opportunity = flow paths. Zero responses = capability without alignment.
2. **Zarlo insight** — "You've completed 8 challenges on [quest] but the universe hasn't spoken back yet. Is this the right environment for this path?"
3. **Weekly review summary** — "This week the universe spoke back 3 times, all on [quest]."
4. **Immediate vs delayed flow** — `universe_response_updated_at` reveals whether flow on a path is immediate (at completion) or delayed (weekly review). Delayed flow paths may need more patience, not a pivot.
5. **Shadow + Flow overlay** — dome shows capacity, shadow shows blocks, flow shows universe response. Three layers on one radar.
6. **EAR validation** — empirical data on which paths have ease vs resistance.
