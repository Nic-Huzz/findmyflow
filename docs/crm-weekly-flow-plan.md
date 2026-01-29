# CRM Weekly Flow & Integration Plan

## Overview

This document captures the planned weekly user flow through the CRM, what's been built, what's needed, and the integration opportunities between towers.

---

## User's Weekly Flow (5 Actions)

```
   MON          TUE-THU           FRI            ONGOING         END OF WEEK
    │              │               │                │                │
    ▼              ▼               ▼                ▼                ▼
┌──────┐     ┌──────┐       ┌──────┐         ┌──────┐         ┌──────┐
│ACTION│     │ACTION│       │ACTION│         │ACTION│         │ACTION│
│  1   │ ──► │  2   │ ──►   │  3   │ ──►     │  4   │ ──►     │  5   │
│      │     │      │       │      │         │      │         │      │
│Week  │     │Content│      │Post  │         │Track │         │Nurture│
│Plan  │     │Plan  │       │Content│        │Stats │         │Check │
└──────┘     └──────┘       └──────┘         └──────┘         └──────┘
```

---

## Action 1: Week Review + Week Plan (Monday)

### What User Does
- Review last week's performance
- Set phases for this week (Build/Launch/Deliver/Recap)
- Choose focus tasks

### Status: ✅ COMPLETE

| Component | Status |
|-----------|--------|
| WeeklyPlanningFlow | ✅ Done |
| WeeklyReflection (last week review) | ✅ Done |
| PhaseSelector | ✅ Done |
| TaskMenuPicker | ✅ Done |
| WeekPlanSummary | ✅ Done |
| FlowCheckIn | ✅ Done |

### Gaps
None - This action is complete.

---

## Action 2: Create Content Plan (Monday/Tuesday)

### What User Does
- Select content types for the week
- Add context/topics for each piece
- Review and confirm plan

### Status: ✅ COMPLETE

| Component | Status |
|-----------|--------|
| ContentPlanningFlow | ✅ Done |
| ContentTypeSelector | ✅ Done |
| ContentContextInput | ✅ Done |
| ContentPlanSummary | ✅ Done |
| ContentChecklist | ✅ Done |

### Gaps
None - This action is complete.

---

## Action 3: Post Content (Throughout Week)

### What User Does
- Check ContentChecklist for today's content
- Generate content with AI
- Post to platform
- Mark as published

### Status: ⚠️ 90% Complete

| Component | Status |
|-----------|--------|
| ContentChecklist (shows what to post) | ✅ Done |
| ContentGenerator (AI writes content) | ✅ Done |
| Mark as Published | ✅ Done |
| StoryBank (for story ideas) | ✅ Done |

### Gaps
| Gap | Priority | Notes |
|-----|----------|-------|
| **Posting day assignment in content plan** | 🔴 HIGH | Need to add post_day to content items |
| **Today's content reminder/notification** | 🟡 MEDIUM | Push notification source |

### Implementation Plan
1. Add `post_day` field to `crm_content_items` table ✅ (migration created)
2. Update `ContentContextInput` to include day selector
3. Update `ContentChecklist` to show items grouped by day
4. Create `DailyActions` component for Dashboard showing today's content

---

## Action 4: Track Engagement + Leads (24-48h After Posting)

### What User Does
- Upload screenshot of post analytics
- AI extracts engagement metrics
- Upload screenshot of DMs/comments
- AI extracts leads
- Confirm and add lead details

### Status: ⚠️ 80% Complete

| Component | Status |
|-----------|--------|
| MetricsScreenshotUpload | ✅ Done |
| LeadsCapture | ✅ Done |
| AI extraction (Claude Vision) | ✅ Done |
| Save to crm_contacts | ✅ Done |
| Save to crm_warm_leads | ✅ Done |
| CTA flow (metrics → leads) | ✅ Done |

### Gaps
| Gap | Priority | Notes |
|-----|----------|-------|
| **Content attribution dashboard** | 🟡 MEDIUM | Show which posts generated which leads |
| **Leads per post view** | 🟡 MEDIUM | Track ROI of content |

### Implementation Plan
1. Add `source_content_id` to contacts/warm_leads ✅ (migration created)
2. Update LeadsCapture to save content attribution
3. Create attribution view in Performance/Analytics page

---

## Action 5: Nurture Check (End of Week / Daily)

### What User Does
a) Check each lead at each stage received what's required
b) Check how long they've been in stage, need follow-up?
c) Update lead status if needed

### Status: ❌ 40% Complete

| Component | Status |
|-----------|--------|
| WarmOutreach page (list of warm leads) | ✅ Done |
| Contacts page (all contacts) | ✅ Done |
| Basic status update | ✅ Done |
| Lead lifecycle stages | ✅ Done |

### Gaps
| Gap | Priority | Notes |
|-----|----------|-------|
| **Stage requirements tracking** | 🔴 HIGH | What actions required at each stage? |
| **Time-in-stage tracking** | 🔴 HIGH | How long has lead been at current stage? |
| **Stale lead alerts** | 🟡 MEDIUM | Alert when lead is 7+ days without action |
| **Quick interaction logging** | 🟡 MEDIUM | Log calls, DMs, emails quickly |
| **Follow-up scheduling** | 🟡 MEDIUM | Schedule next action |

### Implementation Plan
1. Add `stage_entered_at` to contacts ✅ (migration created)
2. Add `status_entered_at` to warm_leads ✅ (migration created)
3. Create time-in-stage display in Contacts/WarmOutreach
4. Add stale lead indicators (7+ days badge)
5. **Future:** Stage requirements tracking (needs deeper discussion)

---

## 5 Integration Opportunities

### Integration 1: Nurture Tower Enhancement

**Purpose:** Show captured leads with full context in Warm Outreach page

```
┌─────────────────────────────────────────────────────────────────────┐
│ Warm Outreach Page (Enhanced)                                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  🔥 @sarah_fitness                              3 days in stage     │
│  "Asked about coaching program"                                      │
│  Source: "5 mistakes coaches make" post                              │
│  [View DM] [Create Deal] [Log Interaction]                          │
│                                                                      │
│  ☀️ @mike_entrepreneur                          1 day in stage      │
│  "Commented 3x this week"                                            │
│  Source: Behind the scenes reel                                      │
│  [Send DM] [Add to Sequence]                                        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

**New Features:**
- Message preview from capture
- Temperature filter (hot/warm/cold)
- Quick action buttons
- Time-in-stage indicator
- Source content attribution

**Fits Into:** Action 5 (a, b, c)

**Priority:** 🔴 HIGH - Core gap

---

### Integration 2: Hot Lead → Deal Conversion

**Purpose:** One-click conversion of hot leads to sales deals

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  🔥 HOT LEAD CAPTURED                                               │
│                                                                      │
│  ┌─────────────┐      ┌─────────────────────────────────┐          │
│  │ @sarah      │ ──►  │ sales_deals                     │          │
│  │ "Asked      │      │                                 │          │
│  │  about      │      │  contact_name: "@sarah_fitness" │          │
│  │  coaching"  │      │  status: "lead"                 │          │
│  └─────────────┘      │  source: "Instagram DM"         │          │
│        │              │  notes: "Asked about coaching"  │          │
│        ▼              │  value: $497 (default)          │          │
│  ┌─────────────┐      │                                 │          │
│  │ Create deal?│      └─────────────────────────────────┘          │
│  │ [Yes] [No]  │                                                    │
│  └─────────────┘                                                    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

**Trigger:** When hot lead captured, prompt "Create deal?"
**OR:** "Create Deal" button on Warm Outreach page

**Fits Into:** Action 5 (moving leads forward)

**Priority:** 🔴 HIGH - Direct revenue impact

---

### Integration 3: Execute Tower - Auto Follow-up Tasks

**Purpose:** Automatically generate follow-up tasks based on lead temperature

```
┌─────────────────────────────────────────────────────────────────────┐
│ Daily Priorities (Execute Tower)                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  TODAY'S NURTURE TASKS (auto-generated)                             │
│                                                                      │
│  ☐ Follow up with @sarah_fitness                                    │
│    🔥 Hot lead - DM today                                           │
│    "Asked about coaching program"                                    │
│    [Open DM]                                                        │
│                                                                      │
│  ☐ Reply to @mike_entrepreneur                                      │
│    ☀️ Warm lead - engaged 3x this week                              │
│    [Send DM]                                                        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

**Temperature-based scheduling:**
- 🔥 Hot → Today
- ☀️ Warm → 2-3 days
- ❄️ Cold → This week

**Fits Into:** Action 5 (b - follow-up alerts)

**Priority:** 🟡 MEDIUM - Drives action

---

### Integration 4: Content Attribution Dashboard

**Purpose:** Show which content pieces generate the most leads and revenue

```
┌─────────────────────────────────────────────────────────────────────┐
│ CONTENT PERFORMANCE (with lead attribution)                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Post                      Reach    Engage   LEADS   Revenue        │
│  ───────────────────────────────────────────────────────────        │
│  "5 mistakes coaches..."   12.4K    834      🎯 7    $1,491         │
│  "Client transformation"    8.2K    612      🎯 3    $497           │
│  "Behind the scenes..."     5.1K    445      🎯 1    -              │
│  "Offer teaser"             3.8K    289      🎯 0    -              │
│                                                                      │
│  💡 INSIGHT: Educational posts generate 3x more leads               │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

**New Data Points:**
- Leads per post (from engagement_data.leads)
- Lead-to-deal conversion tracking
- Revenue attribution (which content → which deals)

**Fits Into:** Action 4 (tracking)

**Priority:** 🟡 MEDIUM - Closes the feedback loop, informs AI recommendations

---

### Integration 5: Dashboard - Real-time Lead Activity Feed

**Purpose:** Show lead activity on the main dashboard for quick visibility

```
┌─────────────────────────────────────────────────────────────────────┐
│ CRM DASHBOARD                                                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  🎯 LEAD ACTIVITY                                                   │
│  ├─────────────────────────────────────────┤                        │
│  │                                         │                        │
│  │  🔥 NEW HOT LEAD                        │                        │
│  │  @sarah_fitness asked about coaching    │                        │
│  │  from "5 mistakes coaches make" post    │                        │
│  │  2 min ago  [Follow Up] [Create Deal]   │                        │
│  │  ─────────────────────────────────────  │                        │
│  │  ☀️ 3 warm leads captured               │                        │
│  │  from yesterday's reel                  │                        │
│  │  [View All]                             │                        │
│  │                                         │                        │
│  └─────────────────────────────────────────┘                        │
│                                                                      │
│  Weekly Stats:                                                       │
│  ┌────────┬────────┬────────┬────────┐                              │
│  │ Leads  │ DMs    │ Deals  │ Revenue│                              │
│  │  12    │  8     │  3     │ $1,491 │                              │
│  │ +40%   │ +25%   │ +50%   │ +200%  │                              │
│  └────────┴────────┴────────┴────────┘                              │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

**Fits Into:** Daily check (not specifically in weekly flow)

**Priority:** 🟢 LOW - Nice to have

---

## User's Desired Implementation (Jan 25, 2025)

### Immediate Priorities

1. **Dashboard DailyActions Component**
   - Show Attract tasks (content to post today)
   - Show Nurture tasks (leads to follow up today)
   - "Next Day" toggle to preview tomorrow
   - This component can feed push notifications

2. **Action 3: Add Posting Day Assignment**
   - Add day selector to ContentContextInput
   - Feed into DailyActions component
   - Enable push notification content

3. **Action 4: Content Attribution**
   - Track which posts generated which leads
   - Show leads per post view
   - Inform AI recommendations on best-performing content

4. **Action 5: Time-in-Stage Tracking**
   - Track how long leads have been in current stage
   - Show stale lead indicators
   - **Stage requirements tracking deferred** - needs deeper conversation on UI/UX

---

## Data Flow Summary

```
                                    ATTRACT
                                       │
                              Content Posted
                                       │
                                       ▼
                            ┌─────────────────┐
                            │ 📸 Leads Capture │
                            │    System       │
                            └────────┬────────┘
                                     │
           ┌─────────────────────────┼─────────────────────────┐
           │                         │                         │
           ▼                         ▼                         ▼
   ┌───────────────┐        ┌───────────────┐        ┌───────────────┐
   │ 1️⃣ NURTURE     │        │ 2️⃣ SALES      │        │ 5️⃣ DASHBOARD  │
   │ Warm Outreach │        │ Pipeline      │        │ Activity Feed │
   │ (enhanced)    │        │ (auto-deal)   │        │ (real-time)   │
   └───────┬───────┘        └───────┬───────┘        └───────────────┘
           │                         │
           │                         │
           ▼                         ▼
   ┌───────────────┐        ┌───────────────┐
   │ 3️⃣ EXECUTE     │        │ Deal Closed   │
   │ Follow-up     │◄───────│ Won!          │
   │ Tasks         │        └───────┬───────┘
   └───────────────┘                │
                                    ▼
                           ┌───────────────┐
                           │ 4️⃣ ATTRACT     │
                           │ Attribution   │
                           │ Dashboard     │
                           │ (ROI tracking)│
                           └───────────────┘
```

---

## Database Changes (Migration Created)

File: `supabase/migrations/20260125200000_daily_actions_enhancements.sql`

### New Columns

| Table | Column | Type | Purpose |
|-------|--------|------|---------|
| `crm_content_items` | `post_day` | TEXT | Which day to post (Mon-Sun) |
| `crm_contacts` | `stage_entered_at` | TIMESTAMPTZ | When they entered current stage |
| `crm_contacts` | `source_content_id` | UUID | Which content generated this lead |
| `crm_warm_leads` | `status_entered_at` | TIMESTAMPTZ | When they entered current status |
| `crm_warm_leads` | `source_content_id` | UUID | Which content generated this lead |
| `crm_warm_leads` | `temperature` | TEXT | hot/warm/cold |

### Triggers Created

- `trigger_contact_stage_change` - Auto-updates `stage_entered_at` when stage changes
- `trigger_warm_lead_status_change` - Auto-updates `status_entered_at` when status changes

---

## Build Order

| # | Task | Priority | Status |
|---|------|----------|--------|
| 1 | Database migration | 🔴 HIGH | ✅ Created (pending manual apply) |
| 2 | DailyActions component for Dashboard | 🔴 HIGH | 🔄 In Progress |
| 3 | Add posting day to ContentContextInput | 🔴 HIGH | ⏳ Pending |
| 4 | Content attribution view | 🟡 MEDIUM | ⏳ Pending |
| 5 | Time-in-stage display in Nurture | 🟡 MEDIUM | ⏳ Pending |

---

## Future Considerations (Deferred)

### Stage Requirements Tracking

**Complexity:** High - needs custom UI for defining stage requirements per user/project

**Questions to resolve:**
1. Are requirements the same for all users or customizable?
2. How granular? (checklist items vs. simple "contacted Y/N")
3. How do we track completion? (manual vs. auto-detection)
4. Different requirements for different lead sources?

**Recommendation:** Schedule dedicated session to design this feature properly.

---

## Files Reference

### Components Built (Leads Capture)
- `/src/components/crm/LeadsCapture.jsx`
- `/src/components/crm/LeadsCapture.css`
- `/supabase/functions/analyze-leads-screenshot/index.ts`

### Components To Build
- `/src/components/crm/DailyActions.jsx` (Dashboard widget)
- `/src/components/crm/DailyActions.css`

### Files To Modify
- `/src/components/crm/ContentContextInput.jsx` (add posting day)
- `/src/lib/crm/contentPlanningService.js` (save posting day)
- `/src/pages/crm/Dashboard.jsx` (add DailyActions)
- `/src/pages/crm/WarmOutreach.jsx` (add time-in-stage)
- `/src/pages/crm/Contacts.jsx` (add time-in-stage)

---

*Last Updated: January 25, 2025*
