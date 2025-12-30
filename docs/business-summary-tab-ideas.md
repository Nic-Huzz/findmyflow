# Business Summary Tab Ideas

*Created: Dec 30, 2024*
*Status: Draft for future implementation*

---

## Overview

Ideas for a Business Summary tab/page that consolidates business progress across all stages and provides actionable insights.

---

## 1. Stage Progress Overview

Visual representation of the user's journey through the 6 stages:

```
📊 Your Business Journey
─────────────────────────
Stage 1: Validation     ✅ Complete
Stage 2: Product        ✅ Complete
Stage 3: Testing        🔄 In Progress (2/4 milestones)
Stage 4: Money Models   🔒 Locked
Stage 5: Campaign       🔒 Locked
Stage 6: Launch         🔒 Locked
Stage 7: Tracking       📊 Always Available
```

**Data sources:**
- `user_projects.current_stage`
- `milestone_completions` table
- `flow_sessions` table

---

## 2. Funnel Health Dashboard

Pull from the Funnel Calculator (`funnel_metrics` table) data:

- **Current Conversion Rates** - Visual bars comparing user's rates to industry averages
- **Revenue This Period** - One-time + recurring breakdown
- **Funnel Bottleneck Indicator** - Which stage has the biggest drop-off vs industry average

**Visual concept:**
```
Awareness    ████████████████████ 1,000
     ↓ 5.2% (avg: 5%)
Attraction   █████████████        520
     ↓ 28% (avg: 25%) ⬆️
Lead Magnet  ████████             145
     ↓ 35% (avg: 40%) ⬇️ BOTTLENECK
Nurture      █████                51
     ↓ 6% (avg: 5%)
Core Sale    ███                  3
```

---

## 3. Offer Stack Summary

Visual card layout showing the complete offer ecosystem:

| Offer Type | Price | Name | Status |
|------------|-------|------|--------|
| 🧲 Lead Magnet | Free | [Name] | ✅ Created |
| 🎯 Core Offer | $X | [Name] | ✅ Created |
| ⬆️ Upsell | $X | [Name] | 🔄 In Progress |
| ⬇️ Downsell | $X | [Name] | ⏳ Not Started |
| 🔄 Continuity | $X/mo | [Name] | ⏳ Not Started |

**Data sources:**
- `offer_builder_assessments`
- `attraction_offer_assessments`
- `upsell_assessments`
- `downsell_assessments`
- `continuity_assessments`

---

## 4. Key Metrics at a Glance

Dashboard cards showing:

- **Total Revenue Generated** - Sum from funnel_metrics
- **Number of Leads Captured** - Lead magnet opt-ins
- **Customer Count** - Core offer sales
- **Estimated LTV** - Calculated as:
  ```
  LTV = Core Price
      + (Upsell Rate × Upsell Price)
      + (Downsell Rate × Downsell Price)
      + (Continuity Rate × Continuity Price × Avg Months)
  ```

---

## 5. Next Actions Section

Dynamic section showing the next incomplete milestone for their current stage:

```
┌─────────────────────────────────────┐
│ 🎯 Your Next Step                   │
│                                     │
│ Stage 3: Testing                    │
│ "Get feedback from 3 testers"       │
│                                     │
│ Progress: 1/3 conversations logged  │
│                                     │
│ [Log Conversation] [Skip for Now]   │
└─────────────────────────────────────┘
```

---

## 6. Weekly Trends (Future Enhancement)

If we have enough historical data:

- Conversion rate trends over time
- Revenue growth chart
- Lead generation velocity

---

## Implementation Notes

### Potential Location
- New tab in LibraryOfAnswers (alongside Flow Finder, Money Model, etc.)
- Or standalone `/business-summary` route
- Or section on Profile/Home page

### Dependencies
- `funnel_metrics` table (Stage 7 Tracking)
- All assessment tables
- `milestone_completions`
- `user_projects`

### Priority
Medium - Good to have after core Stage 7 Tracking is tested and stable.

---

## Questions to Resolve

1. Should this be project-specific or show all projects?
2. Real-time calculations vs. cached/computed values?
3. How to handle users who haven't completed funnel tracking yet?
