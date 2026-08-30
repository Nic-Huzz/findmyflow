# Capacity Score v4 — Simplified Zone Model

**Status: SHIPPED** (2026-08-30)
Files: `src/hooks/useCapacityScore.js`, `src/components/level/CapacityCard.jsx`, `src/components/level/CapacityCard.css`

## Problem

The current capacity score (Safety × Expression × Maintenance multiplier) produces unintuitive results. A user doing courage challenges, logging practices, and maintaining daily habits can still show as "Wired" or "Stuck" because one axis (usually Safety) is low. The multiplication means one weak axis drags everything down.

## Current Model (v3)

```
Safety score = min(10, BASELINE + safety_net / DIVISOR)
Expression score = min(10, BASELINE + expression_net / DIVISOR)
Raw = Safety × Expression (0-100)
Capacity = Raw × maintenance_multiplier (0.5 + maintenance% × 0.5)
Zones: 0-25 Stuck, 25-50 Wired, 50-75 Grounded, 75-100 Vibe Rise
```

**What feeds each axis:**
- Safety: meditation, prayer, self-compassion, savouring, daily/weekly healing - stalls
- Expression: voice work, style, social media, peak state, weekly focus + wahoos (completed courage challenges) - drains
- Maintenance: sleep, exercise, sunlight, meals (rolling 7-day %)

**The bug:** A user doing 13 style practices, 12 social media posts, 5 courage challenges, and 95% maintenance still shows Wired because they haven't logged meditation.

## Proposed Model (v4)

**Core idea:** Zone is determined by how many of the 3 pillars you're consistently doing, not by multiplying scores.

### The 3 Pillars

1. **Safety** — nervous system regulation practices (meditation, breathwork, prayer, healing, self-compassion, savouring, connect with friend)
2. **Expression** — showing up visibly (voice work, style, social media, peak state, courage challenges/wahoos)
3. **Maintenance** — daily basics (sleep, exercise, sunlight, meals)

### Zone Logic

```
Active pillar = pillar score >= threshold (e.g., 3+ practices in the 7-day window)

0 pillars active → Stuck (0-25)
1 pillar active  → Wired (25-50)
2 pillars active → Grounded (50-75)
3 pillars active → Vibe Rise (75-100)
```

### Score Within Zone

Each zone has a range (e.g., Grounded = 50-75). Position within the range is determined by the STRENGTH of the active pillars — more practices = higher within the zone.

```
zone_base = { stuck: 0, wired: 25, grounded: 50, vibe_rise: 75 }
zone_range = 25

// Average strength of active pillars (0-1 scale)
pillar_strength = average(active_pillar_scores) / max_pillar_score

capacity = zone_base + pillar_strength × zone_range
```

### Threshold for "Active"

A pillar is "active" if it has enough inputs in the 7-day window:

| Pillar | Active threshold | Why |
|---|---|---|
| Safety | 3+ safety practices in 7 days | ~every other day |
| Expression | 3+ expression practices OR 1+ wahoo | courage challenges count |
| Maintenance | 50%+ of daily items logged | at least half the basics |

### What Changes

| What | Before | After |
|---|---|---|
| Zone calculation | Safety × Expression × Maintenance | Count of active pillars |
| Score within zone | Continuous 0-100 | Zone base + strength bonus |
| Missing one pillar | Tanks the whole score | Drops one zone (Vibe Rise → Grounded) |
| Courage challenges | Only feed Expression | Still only feed Expression (but that's enough for 1 pillar) |
| Someone doing 2/3 well | Could show Stuck/Wired | Shows Grounded (correct) |

### Labels

Current: Stuck → Wired → Grounded → Vibe Rise

Also rename in the UI:
- "Anxious" → **"Stressed"** (wherever NS state labels appear)
- "Bored" stays as is (or could become "Flat"?)

## File to Modify

`src/hooks/useCapacityScore.js` — rewrite `computeAxes` function. Keep the same data queries (quest_completions, nervous_system_checkins, groan_challenges). Change the zone calculation logic.

## Inputs (unchanged)

Same Supabase queries, same quest_ids. The data collection doesn't change — only the math that turns inputs into a zone.

## Verification

1. Huzz's data: doing Expression + Maintenance but not Safety → should show **Grounded** (currently shows Wired/Stuck)
2. User doing only morning meditation daily → should show **Wired** (1 pillar)
3. User doing meditation + courage challenges + sleep/exercise → should show **Vibe Rise** (3 pillars)
4. User doing nothing → should show **Stuck**
5. Zone transitions should still trigger mystery boxes

## Open Questions

1. Should dome courage challenges (challenge_source='dome') count toward Expression axis? Currently only completed groan_challenges are counted as wahoos.
2. Should the pillar thresholds be configurable or hardcoded? → **Hardcoded for now.**

## Next: Pillar Nudges (approved, not yet built)

Show a hint below inactive pillar pills recommending what to focus on to grow the score. The `pillars` object already returns active/inactive state per pillar. Example: "Maintenance is inactive — try logging sleep and exercise to reach Vibe Rise."
