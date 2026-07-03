# Experience Pricing Flow

## The Problem

Experience creators don't know what to charge. They either:
- Undercharge (give it away, build resentment, attract uncommitted attendees)
- Overcharge (empty rooms, imposter syndrome, second-guess everything)
- Copy what others charge (no relationship to their actual value)

This is the **Enough corridor** in Zone Calibration. Perfectionist wall: "what if I charge too much?" Procrastinator wall: "I'll figure out pricing later." Sweet spot: price anchored to evidence, not feelings.

## The Hormozi Pricing Logic

From $100M Offers: the price should be a fraction of the perceived value, creating a gap so wide the prospect feels stupid saying no.

**Value = everything included, enumerated and valued separately.**

The same offer presented as one thing ("1-day retreat: 700K") is worth less than the same offer broken into components with individual values ("11 experiences worth 6.35M total, yours for 700K").

### The Percentage Guide

| % of Value | When to Use | Effect |
|---|---|---|
| 8-10% | First time running it. Building proof. Filling rooms fast. | Almost too cheap. Creates word of mouth. |
| 12-15% | You have some proof. Repeat attendees exist. | No brainer sweet spot. Most revenue with easiest sales. |
| 18-20% | Strong proof. Testimonials. Return attendees. Waitlists. | Premium positioning. Needs social proof to justify. |
| 22-25% | You're the best in your market. Scarcity is real. | Top end. Needs guarantee and/or bonuses to close. |

### The Early Bird / Standard Structure

Set early bird at 10-12% of value. Standard at 15-20%. The gap creates urgency:
- "Early bird saves you X"
- "Price rises on [date]"
- Rewards people who commit early (your best customers)

## Worked Example: Healing But Fun 1-Day Retreat

### Step 1: Stack the Value

| # | Item | Individual Value |
|---|---|---|
| 1 | Healing Compass (deep inner mapping session) | 2,000,000 IDR |
| 2 | Shaking Breathwork (somatic release) | 500,000 |
| 3 | Shadow Work Integration | 750,000 |
| 4 | Alchemove Movement Medicine | 500,000 |
| 5 | Subconscious Toolkit Workshop | 500,000 |
| 6 | Yoga | 200,000 |
| 7 | Reclaim Your Voice (singing ceremony) | 500,000 |
| 8 | Guided Recovery Spa Sessions | 500,000 |
| 9 | Vibe Rise Dance Journey | 500,000 |
| 10 | Access to Istana spa facilities all day | 400,000 |
| 11 | Sunset views from a cliffside venue | priceless |
| **Total** | | **6,350,000 IDR** |

### Step 2: Apply the Percentage Guide

| Tier | % | Price | Feel |
|---|---|---|---|
| Early bird low | 8% | 500,000 | Filling first cohort fast |
| Early bird high | 11% | 700,000 | No brainer |
| Standard low | 12% | 750,000 | Still no brainer |
| Standard high | 15% | 950,000 | Perfect sweet spot |

### Step 3: The ROI Check

Venue cost: ~2,000,000 IDR (estimated)
At 700K/person: break even at 3 attendees. Everything after = profit.
At 950K/person: break even at 3 attendees. Everything after = profit.
At 15 attendees x 950K = 14.25M revenue. Minus 2M venue = 12.25M profit.

### Step 4: What the Buyer Sees

"11 experiences. 6.35 million IDR of value. Early bird: 700K. That's 11% of what you'd pay separately."

The math does the selling. Not the pitch.

---

## The In-App Pricing Flow

### Where It Lives

Post-event tab or Create experience flow. After the user has designed their experience and before they set a date/start marketing.

### Step 1: Stack Your Value
"List everything included in your experience. What would each be worth if someone bought it separately?"

**UI:**
- Pre-seeded suggestions based on experience type (workshop, retreat, circle, etc.)
- Each line: description + value input
- "+ Add item" button
- Running total at bottom

**Pre-seeded suggestions by type:**

| Type | Suggested Items |
|---|---|
| Workshop | Main session, materials/handouts, integration exercise, community access |
| Retreat | Each session/activity, meals, accommodation, venue access, transport |
| Circle | Facilitation, held space, community, follow-up resources |
| 1:1 Session | Session time, prep/review, follow-up messages, resources |
| Online | Live session, recording access, workbook, community group |

### Step 2: See Your Total
App sums the stack. Shows it prominently: "Your total value: [X]"

### Step 3: Pick Your Price Point
Interactive slider or tap selector showing the percentage guide:

```
Your value: 6,350,000

    |----[====|====|====|====]----|
    8%   10%  12%  15%  20%  25%
    
    EARLY BIRD          STANDARD
    500K-700K           750K-950K
    
    ◆ Recommended: 15% = 950,000
```

The app recommends 15% as default but lets them adjust. Shows the tier name for each range:
- 8-10%: "Room Filler" (building proof)
- 12-15%: "Sweet Spot" (recommended)
- 18-20%: "Premium" (needs proof)
- 22-25%: "Top Tier" (needs guarantee)

### Step 4: Set Early Bird & Standard
Auto-calculated from their chosen percentages:
- Early bird: [lower %] = [price]
- Standard: [higher %] = [price]
- "Early bird ends [date]" (creates urgency)

### Step 5: ROI Check
"At [standard price], you need [X] attendees to cover your costs."

Pulls from their cost logger if they've entered costs for this experience.

Shows:
- Break-even point: [X] attendees
- At 10 attendees: [revenue] - [costs] = [profit]
- At 20 attendees: [revenue] - [costs] = [profit]

### Step 6: Generate the Value Stack for Marketing
The app takes their stack from Step 1 and generates a formatted value breakdown they can copy/paste to their sales page, Instagram caption, or event listing. Same format as the retreat screenshot.

---

## The Pricing Corridor

This feature IS a Zone Calibration corridor applied to pricing:

| | Description |
|---|---|
| **Left Wall: Undercharging** | Giving it away. Resentment builds. Attracts uncommitted attendees. "I should just be grateful anyone comes." The People Pleaser wall. |
| **Sweet Spot** | Price anchored to evidence (value stack). Fair to you AND accessible to your audience. Rooms fill because the value gap is obvious. |
| **Right Wall: Overcharging** | Imposter syndrome pricing. Empty rooms. "Who am I to charge that?" The Performer wall (proving worth through high prices without the proof to back it). |

The pricing flow moves them from whichever wall they're pinned to toward the sweet spot by replacing feelings with math.

---

## Connection to Existing Features

| Feature | How It Connects |
|---|---|
| Cost Logger | Break-even calculation pulls from logged costs |
| Experience Checklist | "Set pricing" becomes a checklist item |
| Groan Matrix | "Announce your price publicly" is a courage challenge at the Money visibility layer |
| 4-Layer Assessment | Pricing is a Core layer task |
| Group Calls | "What did you price it at? How did it feel?" is a natural check-in question |
| Content Generator | AI generates the value stack as marketing copy |

---

## Database

Add to existing `experiences` table:

```sql
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS value_stack JSONB;
-- [{label: "Healing Compass", value: 2000000}, ...]

ALTER TABLE experiences ADD COLUMN IF NOT EXISTS early_bird_price NUMERIC(10,2);
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS standard_price NUMERIC(10,2);
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'IDR';
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS pricing_percentage NUMERIC(4,1);
-- The % of value they chose (e.g. 15.0)
```

No new table needed. Pricing is a property of each experience.

---

*Pricing framework adapted from Alex Hormozi, $100M Offers.*
*Original IP: Huzz Hurrell / FindMyFlow.*
