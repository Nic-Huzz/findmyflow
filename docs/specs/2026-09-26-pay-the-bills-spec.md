# Pay The Bills — Bridge Job Section

**Date:** 2026-09-26
**Status:** Design complete, implementation plan at `docs/superpowers/plans/2026-09-26-pay-the-bills.md`

## Problem

Finding your flow can be slow to monetise. Yoga might be your calling, but it takes time before it pays rent. Users need a practical, non-judgmental way to identify and track what keeps the lights on while their flow paths grow.

## Core Concept

A "Pay The Bills" section on the Paths tab that sits **below** the flow paths. It tracks the user's bridge job — the thing funding their life while Vibe Rise paths develop into sustainable income.

The bridge job is temporary by design. Once flow income covers expenses (hero stage 9+), the section celebrates and fades.

## Experience Rating Filter (Key Insight)

Dome experience ratings map directly to financial suitability:

| Rating | Meaning | Financial role |
|--------|---------|---------------|
| **Vibe Rise** | This is my thing | Flow paths (main section) |
| **Fun** | I enjoy this | Good to be paid for — bridge job candidates |
| **Growth Edge** | Learning/challenge | Not surfaced for bridge |
| **Pressure** | Stressful | Avoid |
| **Bored** | Unengaged | Avoid |

---

## Changes to Current Job Flow

### New 3-Way Fork (replaces current 2-way)

**Step 3 (`fork`)** currently asks: "Do you want this to be your life path?" with YES/NO.

**New options:**

1. **"Yes, grow this"** 🔥
   - Sub: "This is my flow. I want to build my life around it"
   - Quest created as flow path (status: `active`, `is_current_job: true`, `job_relationship: 'grow_this'`)
   - If money dimension = tier 5 ($1K+/month): Pay The Bills auto-fulfilled — this job IS both flow and income. No bridge needed.
   - If money dimension < tier 5: flow path created, but Pay The Bills section still appears with adjusted messaging (see State 2b below)
   - **Step sequence after fork:** life fuels → experience selection → current dimensions → dream dimensions → save (same as current YES path)

2. **"Happy for it to pay the bills"** 💰
   - Sub: "It's not my calling, but it works for now"
   - Quest created with `is_current_job: true`, `is_bridge_job: true`, `job_relationship: 'pay_bills'`
   - Quest appears in Pay The Bills section, NOT in flow paths
   - **Step sequence after fork:** life fuels → current dimensions only (no dream dimensions, no experience selection — they don't need to map where they want this job to go, it's a bridge). Save → navigate to `/choose-quests` to find their actual flow paths.

3. **"No, keen to quit"** 🌱
   - Sub: "I want to move on from this"
   - Quest created with `is_current_job: true`, status: `reference`, `is_bridge_job: false`, `job_relationship: 'keen_to_quit'`
   - **Step sequence after fork:** no further steps. Save immediately → navigate to `/choose-quests` (same as current NO path)
   - Pay The Bills section appears on Paths tab with "find a bridge" prompt

### Data Changes

Add columns to `quests` table:
```sql
ALTER TABLE quests ADD COLUMN is_bridge_job boolean DEFAULT false;
ALTER TABLE quests ADD COLUMN job_relationship text;
-- Values: 'grow_this' | 'pay_bills' | 'keen_to_quit' | 'bridge_found'
```

---

## Pay The Bills Section (Paths Tab)

### Placement

In `LevelTab.jsx`, rendered **after** the flow paths quest-section. Below the active quest cards, "Add path" button, and recommendation text. Visually separated from flow paths.

### Section States

**State 1: Fulfilled (bridge job exists)**

User has a quest with `is_bridge_job: true` and `status: 'active'`.

Shows a compact bridge card (see UI section below).

**State 2a: Needs filling — no bridge, user quit or has nothing**

Triggered when:
- User chose "No, keen to quit" (reference quest, no bridge)
- User has completed current job flow but no active bridge quest
- User has no current job quest at all (hasn't done the flow yet)

Prompt: "What's keeping the lights on while you grow your flow?"
- **"I have a job or gig"** → `/add-current-job` flow (reuse existing, now with 3-way fork)
- **"I need to find something"** → Find a Bridge flow (new)

**State 2b: Needs filling — flow doesn't pay enough yet**

Triggered when user chose "Yes, grow this" but money dimension < $1K+/month.

Different messaging because they DO have a job — it's just their flow job that doesn't cover expenses yet.

Prompt: "Your flow doesn't cover expenses yet. What else is keeping the lights on?"
- **"I have another job or gig"** → `/add-current-job` flow (creates a second quest as bridge)
- **"I need to find something"** → Find a Bridge flow

**State 3: Auto-fulfilled (flow pays enough)**

User chose "Yes, grow this" + money dimension >= $1K+/month. Section does not appear. Their flow IS their income.

**State 4: Graduated (user-initiated)**

User taps "My flow covers my bills now" on the bridge card. This is their moment — no algorithm decides for them.
- Celebration moment: "Your flow is paying the bills now"
- Bridge quest `bridge_status` set to `'completed'`
- Section fades after acknowledgment

### Visibility Rules

| Condition | Section visible? |
|-----------|-----------------|
| Current job flow not completed | Hidden (premature) |
| Fork = "grow_this" + money >= $1K | Hidden (auto-fulfilled) |
| Fork = "grow_this" + money < $1K | State 2b |
| Fork = "pay_bills" | State 1 (fulfilled) |
| Fork = "keen_to_quit", no bridge found | State 2a |
| Fork = "keen_to_quit", bridge found | State 1 |
| User taps "My flow covers my bills now" | State 4 (celebration → fade) |

---

## Find a Bridge Flow

New mini-flow at `/find-bridge` for users who need to find a bridge job.

### Step 1: Your Options

**Header:** "These are things you enjoy that could pay the bills"

Pull from `experience_dome_ratings` where:
- `user_id` = current user
- `ns_state` = `'fun'`

Cross-reference with `EXPERIENCE_PRICING` to get financial data. Filter OUT:
- `confidencePct < 50` (unreliable data)
- `employed` value is `'N/A'`, `'Rare (independent)'`, or `'Gig-based'`

Display remaining as selectable cards (see UI section), sorted by employed hourly rate descending.

Each card shows:
- Experience name
- **Employed**: rate (e.g., "$30-60/hr")
- **Freelance**: per-session rate (e.g., "$75-200/hr")
- Monthly estimate for employed (e.g., "~$4,800-9,600/month")

### Step 2: Name Your Bridge

After tapping an experience, ask for a specific job title:
- Pre-filled with experience name (e.g., "Graphic Design")
- Free-text input: "What would you call this job?" (e.g., "Freelance graphic designer", "Design job at an agency")
- Shows the earning context below: "$30-60/hr employed, ~$4,800-9,600/month"

This matters because "Graphic Design" is a dome experience, but their bridge card should say "Design job at an agency" — something concrete and personal.

### Step 3: Bridge Status

Ask: "Do you have this already, or do you need to find it?"
- **"I have this"** → quest created as active bridge, status tracking starts
- **"I need to find this"** → quest created with `bridge_status: 'searching'`, card shows "Looking for: [job title]" with a different visual treatment

### Step 4: Save

Creates quest with:
- `label`: user-entered job title (e.g., "Freelance graphic designer")
- `is_bridge_job: true`
- `is_current_job: false` (unless they said "I have this", then `true`)
- `status: 'active'`
- `predicted_state: 'fun'`
- `job_relationship: 'bridge_found'`
- `bridge_status: 'active' | 'searching'`

Navigate back to Paths tab.

### Edge Case: Zero Viable Fun Experiences

If user has no Fun-rated experiences with employable rates:

1. Show: "None of your fun experiences have clear employed paths right now"
2. **"I know what I can do"** → free-text job title input (skip experience selection). Creates bridge quest with user-entered label.
3. **"Show me options"** → browse ALL experiences with `confidencePct >= 50` and valid employed rates (not just their rated ones), sorted by hourly rate. User picks one, then goes to Step 2 (name your bridge).

### Edge Case: Bridge Job Found Later

When a user with `bridge_status: 'searching'` gets the job, they can tap the bridge card to update status to `'active'`. Simple toggle — "Got the job?" → confirms → status updates, card treatment changes.

---

## Data Changes Summary

### New Columns on `quests`

```sql
ALTER TABLE quests ADD COLUMN is_bridge_job boolean DEFAULT false;
ALTER TABLE quests ADD COLUMN job_relationship text;
-- 'grow_this' | 'pay_bills' | 'keen_to_quit' | 'bridge_found'
ALTER TABLE quests ADD COLUMN bridge_status text;
-- 'active' | 'searching' | 'completed' | null
```

---

## UI/UX Design

> **STATUS: Needs decisions — see open questions below**

### Fork Decision Screen (CurrentJobFlow)

Three vertically stacked option cards replacing the current two buttons. Each card:
- Left icon/emoji
- Title text (bold)
- Subtitle (grey, one line)
- Full-width tap target

### Pay The Bills Section

**Section header:** TBD (see Q1 below)

**Bridge card (fulfilled state):**
- Compact single card, not a full QuestBoardCard
- Shows: job title, earning tier, status indicator
- No courage challenges, no healing flows, no task lists
- Tap to expand: shows earning context, option to update status or remove
- If `bridge_status: 'searching'`: different visual treatment (dashed border? muted?) with "Looking for: [title]"

**Empty state card (needs filling):**
- Prompt text + two action buttons
- Matches app card styling but more muted than flow path cards

### Find a Bridge Flow

**Experience cards:**
- Selectable cards in a scrollable list
- Each shows: name, employed rate, freelance rate, monthly estimate
- Selected state: highlighted border
- Layout: TBD (see Q3 below)

### Open UX/UI Questions

**Q1: Section header.** DECIDED: "Pay The Bills" — direct, no-nonsense.

**Q2: Bridge card.** DECIDED: Job title + status (active/searching). Compact, not a full quest card. Expandable tap for earning context + "My flow covers my bills now" graduation button.

**Q3: Find-a-Bridge cards.** DECIDED: Ranked list with top pick highlighted, user picks one to proceed.

**Q4: Graduation trigger.** DECIDED: User-initiated. "My flow covers my bills now" button on bridge card. Their moment, not an algorithm's.

---

## Files to Create/Modify

### New Files
- `src/flows/FindBridgeFlow.jsx` — the "find a bridge" mini-flow
- `src/flows/FindBridgeFlow.css` — flow styles
- `src/components/PayTheBillsSection.jsx` — section component for Paths tab
- `src/lib/bridgeJobUtils.js` — earning estimate parsing, filtering logic

### Modified Files
- `src/flows/CurrentJobFlow.jsx` — 3-way fork, step sequence per fork choice
- `src/components/LevelTab.jsx` — render PayTheBillsSection after flow paths
- `supabase/migrations/` — add `is_bridge_job`, `job_relationship`, `bridge_status` columns

### Data Files (no changes needed)
- `src/data/experiencePricing.js` — already has all pricing data
- `src/data/businessModelEarnings.json` — already has model earnings

---

## Not In Scope (V1)

- Geographic salary data or job-board integration
- Actual job search/listings or application tracking
- Income tracking within the bridge job (Weekly Review handles income at stage 8+)
- Courage challenges or healing flows on bridge quests
- Multiple bridge jobs (V1 = one bridge at a time)
- Bridge job tasks or projects (it's a status tracker, not a growth tool)

## Success Criteria

1. User can identify their bridge job in under 60 seconds (tag existing or pick from Fun experiences)
2. Flow paths remain the hero — Pay The Bills is clearly secondary, visually quieter
3. Transition from bridge to flow-funded feels like a milestone celebration, not a loss
4. Zero new jargon — a 12-year-old understands "what's paying the bills while you grow"
5. The 3-way fork captures the real relationship people have with their current job — no false binary
