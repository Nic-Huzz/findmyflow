# Creator Portal Gamification Spec

## Core Equation

**Creator Momentum = Root × Reach**

Mirrors the consumer app's `Vibe Rise = Safety × Expression`. Uses the existing Root and Reach framework (Scope Map diagnostic).

- **Root** (0-10) = "Have you built the machine?" Infrastructure completeness.
- **Reach** (0-10) = "Are you running the machine?" Weekly action and output.

If either is zero, momentum is zero. The sweet spot is the diagonal (both high).

```
         10 ┌─────────────────────┐
            │ Burnout         🎯  │
   Reach    │ Zone        Sweet   │
            │            Spot     │
            │                     │
          0 │ Stalled    Dreaming │
            └─────────────────────┘
            0        Root        10
```

Inspired by: "We don't rise to the level of our goals, we fall to the level of our systems." Build a funnel from the bottom-up that leverages YOUR superpowers.

## Root Score (0-10)

Two layers:

### Foundation (0-10 in v1, becomes 0-5 in v2)
Binary existence checks. Ratchets up, never drops. "Have you built the thing?"

| Component | Check | Source | Pipeline Node |
|-----------|-------|--------|---------------|
| Blow Up Brand | Has remarkable angle | `remarkable_angles` exists | Attract |
| Leads Strategy | Knows where audience is | `flow_sessions` type='leads_strategy' | Attract |
| Lead Magnet / Attraction Offer | Has capture mechanism | `flow_sessions` type='attraction_offer' OR `products` tier='attraction' | Capture |
| Offer Built | Has packaged product | `products` with `money_model_tier` | Convert |
| Contacts System | Has contacts in CRM | `crm_contacts` count > 10 | Grow |

Each item = 1 point. Foundation score = 0-5 in v1. Becomes 0-5 component of 0-10 Root when Maintenance unlocks in v2.

### Maintenance (unlocks when Foundation ≥ 6, v2+)
Per-item freshness checks with contextual decay schedules. "Are you keeping the machine tuned?"

| Component | Check | Decay Schedule |
|-----------|-------|----------------|
| Lead magnet updated with proof | `updated_at` within 30 days | Monthly |
| Email sequence active | `crm_email_sequences` status='active' | Monthly |
| New contacts from last experience | `crm_contacts` added since last experience | Per experience |
| Pipeline readiness > 50% | `experience_checklist_items` completion | Per experience |
| Remarkable angle reviewed | `remarkable_angles.updated_at` within 90 days | Quarterly |

Each item = 1 point. Maintenance score = 0-5. Root total = Foundation (0-5) + Maintenance (0-5) in v2.

## Reach Score (0-10)

Rolling 7-day window (from `useCapacityScore.js` pattern). Binary thresholds. Resets continuously, no Monday cliff.

| Component | Check | Threshold for 1 point |
|-----------|-------|-----------------------|
| Content posted | `content_history` status='posted' last 7 days | ≥ 1 post |
| Checklist items completed | `experience_checklist_items` completed last 7 days | ≥ 1 item |
| Outreach done | `crm_contacts` outreach changes last 7 days | ≥ 1 contact |
| Wahoo completed | `groan_challenges` status='completed' last 7 days | ≥ 1 challenge |
| Experience delivered | `experiences` completed last 7 days | ≥ 1 experience |
| Tasks completed | `execute_tasks` completed last 7 days | ≥ 1 task |
| Contacts added | `contact_experiences` created last 7 days | ≥ 1 contact |
| 3% reflection logged | `experiences.three_percent_note` set last 7 days | ≥ 1 reflection |
| Pipeline metric updated | `pipeline_metrics` logged last 7 days | ≥ 1 metric |
| App engagement | Any creator portal action last 7 days | ≥ 1 action |

10 items, each = 1 point. Reach = 0-10. No scaling needed.

## Root → Pipeline Node Mapping

Each Root component powers a specific pipeline node. When Root is low, the system traces to the weakest node and prescribes one action.

```
ROOT COMPONENT              →  PIPELINE NODE
─────────────────────────────────────────────
Blow Up Brand               →  Attract
Leads Strategy              →  Attract
Lead Magnet / Attraction    →  Capture
Offer Built                 →  Convert
Contacts System             →  Grow
```

## The Diagnostic Loop

```
Root score is low (or specific gap identified)
        │
        ▼
System identifies lowest Root component
        │
        ▼
Prescribes one action in plain language
  "People watch your stuff but you're not collecting
   their emails. Build a lead magnet."
        │
        ▼
Creator completes it → Root visibly moves (4 → 6)
        │
        ▼
Next experience → measure if that node improved
        │
        ▼
3% Chain records the improvement
```

### Diagnostic maturity by creator stage

| Stage | Data Available | Diagnostic Type | Example |
|-------|---------------|-----------------|---------|
| **New** (0-2 experiences) | Almost none | Existence-based | "You don't have a lead magnet. Build one." |
| **Early** (3-5 experiences) | Absolute numbers | Directional | "Last workshop: 6 signups. This one: 12." |
| **Established** (6+ experiences) | Enough for patterns | Conversion-based | "Capture rate 3.2%, below average for retreat creators." |

## Design Principles

- **No leaderboards.** Creators aren't competing with each other.
- **No Instagram in core score.** Brand Pulse is separate (already built as optional overlay).
- **No named quadrant states in v1.** The quadrant is an optional visualization, not routing logic. (State names like "Hustle" can make creators defensive.)
- **Plain language only.** "Attract→Capture conversion is low" → "People watch your stuff but you're not collecting their emails."
- **The number must move when you complete the action.** If building a lead magnet doesn't visibly change Root from 4 to 6, the system fails.
- **Safety framing.** Low scores are not failures. "You're early. Here's your next step." Not red warnings.
- **Progressive disclosure.** Hide Maintenance until Foundation ≥ 6. Hide conversion diagnostics until enough data.

## 3% Chain Integration

The existing 3% Improvement Chain (`experiences.three_percent_note`) is the actual momentum signal. The scoring system surfaces it, not replaces it.

Each chain link = a micro-case-study:
- What Root upgrade was made
- What changed in the pipeline
- What the result was

Over time, aggregate chain data reveals which 3% moves actually work for which creator archetypes.

## What's NOT in the Scoring

| Feature | Why Not |
|---------|---------|
| Instagram/Brand Pulse in core score | Outside creator control (algorithm). Separate optional metric. |
| Fantasy league / competition | Creators aren't competing. Progress bars > leaderboards. |
| 6-level point system from CRM | Points without meaning. Root × Reach is the game. |
| 4 CRM phases (Build/Launch/Deliver/Recap) | Pipeline nodes replace these. |
| Conversion percentages for new creators | Noise at low volume. Graduate to conversion-based when 200+ data points. |
| Nervous system state mapping | Creator audience wants business clarity, not somatic framing. |

## Phasing

### V1 — Validate the bet (1-2 days)
- Root Foundation score (5 existence checks, 0-10)
- Reach score (rolling 7-day binary checks, 0-10)
- RootReachCard on Creator Home (two scores + one prescribed action)
- Prescribed action is existence-based, plain language
- Completing the action visibly moves the number

**Validates:** Do creators complete the prescribed action? Does the number moving feel rewarding?

### V2 — The diagnostic engine
- Root Maintenance layer (unlocks at Foundation ≥ 6, per-item decay)
- Root→Node mapping with plain-language diagnostics
- Directional diagnostics for creators with 3+ experiences
- 3% Chain records which Root upgrades were made and what changed
- Quadrant visualization as optional "see where you stand" view

**Validates:** Does the diagnostic change behavior? Does the 3% Chain fill?

### V3 — The intelligence layer
- Conversion-based diagnostics (enough volume for meaningful rates)
- Archetype-specific prescriptions from aggregate chain data
- Shareable 3% Chains as social proof
- Brand Pulse as optional Reach overlay
- Benchmarking against similar creators

**Validates:** Does the system get smarter with more users? Is the chain the product?

## LLM Council Review Summary

Three council rounds refined this system:

**Round 1:** Proposed 3 separate scores (Execution/Conversion/Brand Pulse). Council killed it — Conversion pauses too often, Brand Pulse amplifies social media anxiety, scores without actions are report cards. Recommended single momentum score with trend arrow.

**Round 2:** Proposed Root × Reach as multiplication. Council validated the two axes but said: don't multiply (punishes rest), keep as two independent scores, use quadrant as optional view, exclude Instagram from core. Rolling 7-day window from useCapacityScore.js, not Monday resets.

**Round 3:** Proposed Foundation + Maintenance split, 4 named states, Root→Node→3% loop. Council validated the loop but flagged: (1) conversion data is noise at low volume — use existence-based diagnostics first, (2) hide Maintenance until Foundation ≥ 6, (3) drop named states in v1, (4) plain language only, (5) the number moving is the entire bet.
