# Vibe Rise Quadrant Card Spec

**Status:** Approved design, ready to build
**Replaces:** CapacityCard (pillar pills + zone bar + maintenance dots)
**Prototype:** `public/vibe-rise-quadrant-prototypes.html` (Option B)

## Overview

A collapsible card showing the user's current Safety x Expression quadrant. Collapsed state shows a mini compass thumbnail with zone name. Expanded state reveals the full quadrant field with position dot, actionable daily progress bars, and a contextual nudge.

## The Quadrant Model

Two axes, each 0-10 based on daily averages over a rolling 7-day window:

| Axis | What it measures | Data sources |
|------|-----------------|--------------|
| **Safety (Y)** | Nervous system regulation practices | Meditation, breathwork, prayer, self-compassion, savouring, connecting with a friend |
| **Expression (X)** | Putting yourself out there | Voice work, style, social media, peak state, weekly focus + completed courage challenges (wahoos) |

**Maintenance** is a third pillar (sleep, exercise, sunlight, meals) shown as a separate bar but does not affect quadrant position.

### Four Quadrants

| Quadrant | Position | Color | Description |
|----------|----------|-------|-------------|
| **Vibe Rise** | High Safety + High Expression | Gold (#E9A23B) | Safe and expressing yourself fully |
| **Grounded** | High Safety + Low Expression | Purple (#5e17eb) | Safe but not putting yourself out there |
| **Wired** | Low Safety + High Expression | Red (#e05252) | Expressing without safety practices |
| **Stuck** | Low on both | Grey (#9ca3af) | Low on both |

### Scoring Bug Fix

**Current bug:** Thresholds are per-week totals (4 safety practices per week, 3 expression per week). This is too easy to hit. A moderately active user lands in Vibe Rise by default.

**Fix:** Thresholds become per-day averages. The quadrant position is determined by the 7-day rolling average of daily completions:

```
Safety axis (0-10):
  daily_safety = safety_completions_today / SAFETY_DAILY_TARGET
  7day_avg = average of last 7 days of daily_safety (capped at 1.0 per day)
  safety_score = 7day_avg * 10

Expression axis (0-10):
  daily_expression = expression_completions_today / EXPRESSION_DAILY_TARGET
  wahoo_bonus = has_wahoo_this_week ? 1.0 : 0.0
  7day_avg = average of last 7 days of daily_expression (capped at 1.0 per day)
  expression_score = min(10, 7day_avg * 8 + wahoo_bonus * 2)

Maintenance (0-100%):
  daily_maintenance = items_logged_today / 6 (sleep, exercise, sunlight, 3 meals)
  7day_avg = average of last 7 days
  maintenance_pct = 7day_avg * 100
```

**Daily targets (proposed):**

| Pillar | Daily target | Items |
|--------|-------------|-------|
| Safety | 4 per day | meditation/breathwork, prayer, connect friend, self-compassion, savouring |
| Expression | 3 per day + 1 wahoo per week | voice work, style, social media, peak state, weekly focus |
| Maintenance | 6 per day (100%) | sleep, exercise, sunlight, breakfast, lunch, dinner |

**Quadrant thresholds:** Score >= 5.0 on an axis = "high" on that axis.

## Component Design

### Collapsed State

```
┌─────────────────────────────────────────────┐
│  [52px compass]  Vibe Rise            [v]   │
│                  Safe and expressing fully   │
└─────────────────────────────────────────────┘
```

- **Compass thumbnail** (52x52px, 14px border-radius): 2x2 grid of quadrant colors. Active quadrant at full opacity, others at 12%. Pulsing orb dot at user's position.
- **Zone name**: 16px, weight 800, colored to match zone.
- **Subtitle**: 12px, muted, describes the quadrant in plain language.
- **Chevron**: 28px circle, rotates 180deg on expand.

### Expanded State

```
┌─────────────────────────────────────────────┐
│  [compass]  Vibe Rise                 [^]   │
│             Safe and expressing fully       │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ Grounded        │    Vibe Rise      │    │
│  │ (purple grad)   │    (gold grad)    │    │
│  │                 │         ◉         │    │
│  │─────────────────┼──────────────────│    │
│  │ Stuck           │    Wired          │    │
│  │ (grey grad)     │    (red grad)     │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  ┌──────┐  ┌──────────┐  ┌──────────┐     │
│  │SAFETY│  │EXPRESSION│  │ MAINTAIN │     │
│  │━━━━░░│  │━━━━━━━━━━│  │━━━░░░░░░│     │
│  │3/4   │  │4/3 done  │  │3 left    │     │
│  │done  │  │          │  │today     │     │
│  └──────┘  └──────────┘  └──────────┘     │
└─────────────────────────────────────────────┘
```

### Quadrant Field

- Square aspect ratio, 14px border-radius.
- Four zones use radial gradients from their corner (not flat fills).
- Active zone at full opacity, inactive zones at 25% + desaturated.
- Thin axis lines (1px, rgba(0,0,0,0.04)) at 50% horizontal and vertical.
- Axis labels ("expression", "safety") at 8.5px, uppercase, 15% opacity.
- **Position orb**: 16px, zone-colored, white border, breathing glow animation (3s ease-in-out infinite).
- **Trail dots** (optional): 2-3 smaller fading dots showing recent position history.

### Actionable Progress Bars

Three bars side by side, each showing today's progress:

| State | Display | Color |
|-------|---------|-------|
| In progress | "3/4 done" | Green (#10b981) |
| Complete | "4/3 done" | Green (#10b981) |
| Needs work | "3 left today" | Purple (#5e17eb) |

Bar track: 4px height, rounded, grey background. Fill uses gradient matching the pillar color (purple for safety, gold for expression, green for maintenance).

### Contextual Nudge (Wired/Stuck states only)

When user is NOT in Vibe Rise, show a soft nudge card below the bars:

- Wired: "You're putting yourself out there. But your body needs more **safety practices** to sustain it."
- Grounded: "Your safety foundation is solid. Try a **courage challenge** to start expressing yourself."
- Stuck: "Start with one **safety practice** today. Small steps move the dot."

Nudge card: 12px border-radius, gradient background (purple to gold at 3-4% opacity), 1px border at 5% purple.

## Data Flow

```
quest_completions (today + 7 days)
groan_challenges (this week)
         │
    useCapacityScore.js
    ├── computeAxes() → daily averages → 0-10 scores
    ├── determineQuadrant() → stuck/wired/grounded/vibe-rise
    ├── todayProgress() → {safety: 3/4, expression: 4/3, maintenance: 3/6}
    └── nudgeText() → contextual string
         │
    QuadrantCard.jsx
    ├── collapsed: compass + zone name
    └── expanded: field + bars + nudge
```

## File Structure

```
src/components/level/QuadrantCard.jsx   ← new component
src/components/level/QuadrantCard.css   ← new styles
src/hooks/useCapacityScore.js           ← update thresholds to per-day
```

Replaces `CapacityCard.jsx` + `CapacityCard.css` wherever they're used.

## CSS Scoping

All classes prefixed with `qc-` (quadrant card). Parent scope: `.qc-card`.

## Open Questions

1. **Trail dots**: Show 2-3 previous day positions? Adds "progress over time" but increases complexity. Could defer to V2.
2. **Tap quadrant to explain**: Tapping a quadrant zone could show a tooltip explaining what it means. Nice-to-have.
3. **Maintenance as third axis**: Currently maintenance is a bar but doesn't affect quadrant position. Could become a "health multiplier" that dims the whole card when low.
