# CRM Weekly Planning System

> A weekly planning flow for the Execute page where users select active phases, pick tasks from a menu, and feed selections into the content generator.

---

## Overview

### Core Concept
At the start of each week (Sunday night or Monday morning), users plan their week by:
1. Selecting which **phases** are active this week (multi-select)
2. Optionally selecting active **streams** (cohorts/clients) per phase
3. Picking **tasks** from a phase-based menu
4. Adding **context notes** that feed into the content generator

### Philosophy
> "You don't rise to the level of your goals, you fall to the level of your systems."

Revenue goals are a product of executing the right system. Our job is to help users create that system, then hold them accountable to delivering on it.

---

## The Four Phases

| Phase | Icon | Color | Focus | Content Types |
|-------|------|-------|-------|---------------|
| **Build** | 🛠️ | `#3b82f6` (Blue) | Building products, features, assets, infrastructure | Behind-the-scenes, progress updates, tutorials |
| **Launch** | 🚀 | `#8b5cf6` (Purple) | Promoting, outreach, selling, visibility | Urgency posts, testimonials, CTAs, countdowns |
| **Deliver** | 📦 | `#22c55e` (Green) | Client fulfillment, results, service delivery | Case studies, client wins, process content |
| **Recap** | 📊 | `#f59e0b` (Orange) | Analysis, reflection, optimization | Learnings, metrics, retrospectives, insights |

> **Note:** All 4 phases involve creating content specific to that phase. BUILD is about building products/features, not content creation itself.

---

## Task Menus by Phase

### 🛠️ BUILD Tasks
*Building products, features, assets, infrastructure*

| Task |
|------|
| Set up new system/tool |
| Build landing page |
| Create lead magnet |
| Record training video |
| Design/wireframe |
| Write sales page copy |
| Build email sequence |
| Create checkout/payment flow |
| Set up automation |
| Create offer/package |
| Write course outline |
| Set up tracking/analytics |

### 🚀 LAUNCH Tasks
*Promoting, outreach, selling, visibility*

| Task |
|------|
| Send launch email |
| Post launch announcement |
| DM potential customers |
| Go live / webinar |
| Run ads |
| Partner outreach |
| Follow up with leads |
| Host Q&A / AMA |
| Send cart close reminder |
| Warm up audience (pre-launch) |
| Share testimonial/proof |
| Overcome objection (content/call) |

### 📦 DELIVER Tasks
*Client fulfillment, results, service delivery*

| Task |
|------|
| Client session |
| Create deliverable |
| Check-in with client |
| Onboard new client |
| Send progress update |
| Collect feedback |
| Request testimonial |
| Document results |

### 📊 RECAP Tasks
*Analysis, reflection, optimization*

| Task |
|------|
| Analyze metrics |
| Review funnel performance |
| Identify improvement opportunity |
| Write case study |
| Update testimonials page |
| Reflect & journal |
| Plan next iteration |
| Archive/close completed project |
| Calculate ROI |
| Update systems based on learnings |

### Multi-Phase Weeks
Users can have **multiple phases active simultaneously**. For example:
- Recapping one client (Recap)
- Delivering to another (Deliver)
- Building in public for a new offer (Build)

---

## Streams (Per Cohort/Client)

### What is a Stream?
A stream represents a specific cohort, client, or project that can be in a different phase than others.

### Examples
| Stream | Current Phase |
|--------|---------------|
| "January Cohort" | Deliver |
| "VIP Client: Sarah" | Recap |
| "New Course Launch" | Build |
| "Black Friday Promo" | Launch |

### Stream Granularity
- Per cohort (group programs)
- Per client (1:1 services)
- Per product/offer (launches)

---

## Weekly Planning Flow

### Trigger Points
1. **Sunday 3:00 PM+** - Auto-show planning modal when visiting Execute page
2. **Monday (any time)** - If not planned, show planning flow modal
3. **Manual** - "Plan Your Week" CTA or "Edit Plan" button always available

### Flow Screens

#### Screen 1: Weekly Reflection (Before Planning)
Shows last week's scores and asks targeted questions based on performance. Includes Flow Tracker check-in to capture energy state.

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│                  Last Week's Scorecard 📊                    │
│                                                              │
│  EXECUTION         CONVERSION        IMPROVEMENT            │
│     75%              18.2%             +2.4%                │
│  ██████░░░░        █████░░░░░        ████████░░            │
│  6 of 8 tasks      Funnel avg        vs prev week          │
│                                                              │
└─────────────────────────────────────────────────────────────┘

REFLECTION QUESTION (contextual based on scores)
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  "You hit 75% execution - what stopped 100%?"               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                                                     │    │
│  │                                                     │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘

FLOW CHECK-IN
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  How are you feeling right now?                              │
│                                                              │
│  Internally:    [😊 Excited]    [😴 Tired]                  │
│                                                              │
│  Externally:    [✨ Great]      [💪 Facing Resistance]       │
│                                                              │
│                                                              │
│  Current Flow: 🟢 NORTH (Flow)                               │
│  Excited + Great = You're in flow!                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘

[Continue →]
```

**Reflection Questions by Score:**

| Condition | Question |
|-----------|----------|
| Execution < 100% | "You hit X% execution - what stopped 100%?" |
| Execution = 100% | "Perfect execution! What made this week different?" |
| Improvement > 0 | "Your funnel improved +X% - what change made the difference?" |
| Improvement < 0 | "Your funnel dipped X% - what do you think happened?" |
| Improvement = 0 | "Steady funnel this week. What's one thing to test next?" |
| First week | "Welcome! What's your #1 focus this week?" |

**Flow Tracker Integration:**
- Two-factor questions determine direction:
  - Excited + Great = **North** (Flow) 🟢
  - Excited + Resistance = **East** (Redirect) 🔵
  - Tired + Great = **West** (Honour) 🟡
  - Tired + Resistance = **South** (Rest) 🔴
- Entry saved to `flow_entries` table
- Builds historical flow data over time
- AI can spot patterns (e.g., "You're often tired on planning days")

---

#### Screen 2: Phase Selection (Multi-Select)
```
"What's on your plate this week?"

Select all that apply:

[🛠️ Build]     Building something new
[🚀 Launch]    Launching or promoting
[📦 Deliver]   Delivering to clients
[📊 Recap]     Analyzing or reflecting

[Continue →]
```

#### Screen 3: Stream Assignment (Optional)
*Only shows if user has multiple streams/projects*

```
"Which streams are active?"

🛠️ BUILD
  ☑️ New Course Development
  ☐ Podcast Season 2

📦 DELIVER
  ☑️ January Cohort
  ☑️ VIP Client: Sarah

📊 RECAP
  ☑️ December Launch Review

[Continue →]
```

#### Screen 3: Task Selection (Menu-Based)

Shows only phases selected in Screen 1. No points per task - scoring is based on execution ratio.

```
"Pick your tasks for the week"

💡 Last week you completed 6 tasks. Nice consistency!

🛠️ BUILD TASKS
  [+] Set up new system/tool
  [+] Build landing page
  [+] Create lead magnet
  [+] Record training video
  [+] Design/wireframe
  [+] Write sales page copy
  [+] Build email sequence
  [+] Create checkout/payment flow
  [+] Set up automation
  [+] Create offer/package
  [+] Write course outline
  [+] Set up tracking/analytics

📦 DELIVER TASKS
  [+] Client session                    [3x]
  [+] Create deliverable
  [+] Check-in with client
  [+] Onboard new client
  [+] Send progress update
  [+] Collect feedback
  [+] Request testimonial
  [+] Document results

[+ Add custom task]

Selected: 5 tasks

[Continue →]
```

**Behavior:**
- Tapping adds task (can tap multiple times for repeats like "3x Client session")
- Shows recommendation based on history
- "Add custom task" option available
- No minimum/maximum - pick freely

#### Screen 4: Week Summary
```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│                    Your Week is Planned! 🎯                  │
│                                                              │
│  ACTIVE PHASES                                               │
│  🛠️ Build    📦 Deliver    📊 Recap                         │
│                                                              │
│  TASK BREAKDOWN                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 🛠️ BUILD (3 tasks)                                     │ │
│  │    • Build landing page                                │ │
│  │    • Create lead magnet                                │ │
│  │    • Write sales page copy                             │ │
│  │                                                        │ │
│  │ 📦 DELIVER (4 tasks)                                   │ │
│  │    • Client session (x3)                               │ │
│  │    • Check-in with client                              │ │
│  │                                                        │ │
│  │ 📊 RECAP (1 task)                                      │ │
│  │    • Analyze metrics                                   │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  8 tasks total                                               │
│                                                              │
│  CURRENT FLOW STATE                                          │
│  🟢 North (Excited + Great) - You're in flow!                │
│                                                              │
│                    [Start Week →]                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**After tapping "Start Week":**
- Plan saved to database
- Redirects to Execute page
- Execute shows "Your Week" banner with active phases
- Tasks appear filtered by selected phases

---

## Content Generator Integration (Phase 2)

### How It Works

1. **Weekly Planning** stores active phases
2. **Marketing page** shows content planning flow (separate from weekly planning)
3. **User selects content types** from auto-generated list based on phases
4. **User adds context** for each selected content piece
5. **Plan is saved** as a checklist
6. **Throughout the week** user can "Generate" when ready, edit draft, then mark complete

### Phase → Content Type Mapping

```javascript
const PHASE_CONTENT_TYPES = {
  build: [
    { type: 'behind_the_scenes', label: 'Behind the Scenes', icon: '📸' },
    { type: 'progress_update', label: 'Progress Update', icon: '📈' },
    { type: 'tutorial', label: 'How-To / Tutorial', icon: '🎓' }
  ],
  launch: [
    { type: 'urgency', label: 'Urgency/Scarcity', icon: '⏰' },
    { type: 'testimonial', label: 'Social Proof', icon: '⭐' },
    { type: 'cta', label: 'Call to Action', icon: '📣' },
    { type: 'countdown', label: 'Launch Countdown', icon: '🚀' }
  ],
  deliver: [
    { type: 'case_study', label: 'Case Study', icon: '📊' },
    { type: 'client_win', label: 'Client Win', icon: '🏆' },
    { type: 'process', label: 'Process/Method', icon: '⚙️' }
  ],
  recap: [
    { type: 'learnings', label: 'Lessons Learned', icon: '💡' },
    { type: 'metrics', label: 'Results & Metrics', icon: '📉' },
    { type: 'retrospective', label: 'Retrospective', icon: '🔍' }
  ]
}
```

### Content Planning Flow (Marketing Page)

#### Screen 1: Content Selection
Auto-generated list based on active phases from weekly plan. User selects which to create.

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  YOUR CONTENT PLAN                                           │
│  Based on: 🛠️ Build  📦 Deliver                             │
│                                                              │
│  🛠️ BUILD                                                    │
│    [+] Behind the Scenes                                     │
│    [+] Progress Update                         [2x]          │
│    [+] Tutorial                                              │
│                                                              │
│  📦 DELIVER                                                  │
│    [+] Case Study                                            │
│    [+] Client Win                                            │
│    [+] Process/Method                                        │
│                                                              │
│  [+ Add custom content idea]                                 │
│                                                              │
│  Selected: 4 pieces                                          │
│                                                              │
│                    [Continue →]                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Behavior:**
- Shows content types for active phases (reads from `crm_weekly_plans`)
- Tap [+] to add to plan (can tap multiple times for repeats like "2x Progress Update")
- "Add custom content idea" for user-defined types
- No minimum/maximum - pick freely

#### Screen 2: Add Context (repeats for each selected item)
```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  ADD CONTEXT                                     1 of 4      │
│                                                              │
│  📸 Behind the Scenes                                        │
│                                                              │
│  What's the context for this post?                           │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Working on the new checkout flow today, finally     │    │
│  │ cracked the payment integration after 3 days        │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  [← Back]                                      [Next →]      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Behavior:**
- Shows each selected content piece one at a time
- User adds context that will be used for AI generation
- Progress indicator shows "1 of 4"
- Can go back to edit previous contexts

#### Screen 3: Plan Summary
```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│              YOUR CONTENT PLAN IS READY! 📝                  │
│                                                              │
│  4 pieces planned:                                           │
│                                                              │
│  📸 Behind the Scenes                                        │
│     "Working on the new checkout flow..."                    │
│                                                              │
│  📈 Progress Update                                          │
│     "Finished module 3 of the course..."                     │
│                                                              │
│  📈 Progress Update                                          │
│     "Beta testing started with 5 users..."                   │
│                                                              │
│  📊 Case Study                                               │
│     "Sarah hit $10k month after 6 weeks..."                  │
│                                                              │
│                    [Save Plan →]                             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Behavior:**
- Shows all planned content with context snippets
- "Save Plan" saves to database and creates the checklist
- Redirects to Content Checklist view

### Content Checklist (Marketing Page - Throughout Week)

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  THIS WEEK'S CONTENT                         1 of 4 done    │
│                                                              │
│  ☑️ Behind the Scenes                        ✓ Published     │
│     "Working on the new checkout flow..."                    │
│                                                              │
│  ☐ Progress Update                           [Generate →]    │
│     "Finished module 3 of the course..."                     │
│                                                              │
│  ☐ Progress Update                           Draft saved     │
│     "Beta testing started with 5 users..."   [Edit Draft]    │
│                                                              │
│  ☐ Case Study                                [Generate →]    │
│     "Sarah hit $10k month after 6 weeks..."                  │
│                                                              │
│                                              [Edit Plan]     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Content Item States

| State | Display | Action |
|-------|---------|--------|
| **Planned** | `[Generate →]` | Context saved, tap to generate |
| **Draft** | `Draft saved [Edit Draft]` | Generated but not published |
| **Published** | `✓ Published` | Marked complete by user |

### Content Item Workflow

```
Planned → [Generate →] → Draft → [Edit Draft] → [Mark Complete] → Published
                ↓
         AI generates using
         saved context
                ↓
         User reviews/edits
                ↓
         User publishes externally
                ↓
         User marks complete ✓
```

### Why This Approach

- **Plan upfront, execute later** - Separates thinking (planning) from doing (creating)
- **Context captured fresh** - Context added when planning, used later for generation
- **Progress tracking** - Clear checklist shows what's done vs. pending
- **Matches task pattern** - Consistent UX with weekly tasks in Execute
- **Flexible timing** - Generate content when ready, not when planning

---

## Scoring System (Fantasy Sports Model)

> Philosophy: Like Fantasy NBA/NFL - compete across multiple categories each week. Fair for all business sizes because it's based on percentages, not quantities.

### The 3 Categories

| Category | What It Measures | Calculation |
|----------|------------------|-------------|
| **Execution** | Did you do what you said? | Tasks Completed ÷ Tasks Planned |
| **Conversion** | How efficient is your funnel? | Average % across all funnel stages |
| **Improvement** | Are you getting better? | % change in funnel avg vs last week |

### How Each Score Works

**Execution (Ratio)**
```
Tasks Planned: 8
Tasks Completed: 6
Execution Score: 75%
```

**Conversion (Average Across Funnel)**
```
Awareness → Attraction:    5%
Attraction → Lead:        22%
Lead → Nurture:           45%
Nurture → Sale:            4%
Sale → Upsell:            15%

Conversion Score = (5 + 22 + 45 + 4 + 15) ÷ 5 = 18.2%
```

**Improvement (% Change)**
```
Last week funnel avg: 15.8%
This week funnel avg: 18.2%
Improvement Score: +2.4%
```

### Why This Works
- **Fair across all sizes** - 1M followers and 1K followers compared on efficiency, not volume
- **Single numbers** - Three clear scores to track and beat
- **Gamifiable** - Compete against yourself or your group
- **No benchmarks needed** - You're competing on your own improvement

### Weekly Scoreboard Display

```
┌─────────────────────────────────────────────────────────────┐
│  THIS WEEK'S SCORE                                           │
│                                                              │
│  EXECUTION                           75%                     │
│  ████████████████░░░░                                       │
│  6 of 8 tasks                                                │
│                                                              │
│  CONVERSION                          18.2%                   │
│  █████████░░░░░░░░░░░                                       │
│  Avg across 5 funnel stages                                  │
│                                                              │
│  IMPROVEMENT                         +2.4%                   │
│  ████████░░░░░░░░░░░░                                       │
│  vs last week (15.8%)                                        │
└─────────────────────────────────────────────────────────────┘
```

### Competition Modes

**Solo Mode:**
- Beat your scores from last week
- Streak for consecutive improvement weeks

**Group Mode (future):**
- Weekly leaderboard across all 3 categories
- "Win" a category by having highest in group
- Most category wins = weekly champion

---

## Database Schema

### New Tables

```sql
-- Weekly phase selections
CREATE TABLE crm_weekly_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL, -- Monday of the week
  active_phases TEXT[] NOT NULL, -- ['build', 'deliver', 'recap']
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_start)
);

-- Stream assignments per phase
CREATE TABLE crm_weekly_streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  weekly_plan_id UUID REFERENCES crm_weekly_plans(id) ON DELETE CASCADE,
  stream_name TEXT NOT NULL,
  stream_type TEXT NOT NULL, -- 'cohort', 'client', 'product'
  phase TEXT NOT NULL, -- 'build', 'launch', 'deliver', 'recap'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User streams (reusable across weeks)
CREATE TABLE crm_streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  stream_type TEXT NOT NULL, -- 'cohort', 'client', 'product'
  status TEXT DEFAULT 'active', -- 'active', 'completed', 'archived'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Weekly reflections (before planning)
CREATE TABLE crm_weekly_reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL, -- Monday of the week being reflected on

  -- Last week's scores
  execution_score DECIMAL(5,2),
  conversion_score DECIMAL(5,2),
  improvement_score DECIMAL(5,2),

  -- Reflection response
  reflection_type TEXT NOT NULL, -- 'execution_incomplete', 'execution_perfect', 'improved', 'declined', 'steady', 'first_week'
  reflection_text TEXT,

  -- Flow check-in at time of reflection
  flow_internal TEXT, -- 'excited', 'tired'
  flow_external TEXT, -- 'great', 'resistance'
  flow_direction TEXT, -- 'north', 'east', 'south', 'west'

  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_start)
);

-- Improvements tracking
CREATE TABLE crm_improvements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  funnel_stage TEXT NOT NULL, -- 'awareness', 'attraction', etc.
  hypothesis TEXT NOT NULL, -- "Add countdown timer"
  implementation_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  outcome_logged_at TIMESTAMPTZ,
  outcome TEXT, -- 'better', 'same', 'worse'
  outcome_notes TEXT,
  improvement_points INTEGER DEFAULT 10,
  outcome_points INTEGER -- Set when outcome logged (20 if better, 5 if same, 0 if worse)
);

-- RLS Policies
ALTER TABLE crm_weekly_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_weekly_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_improvements ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_weekly_reflections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own weekly plans"
  ON crm_weekly_plans FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own streams"
  ON crm_streams FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own improvements"
  ON crm_improvements FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own reflections"
  ON crm_weekly_reflections FOR ALL USING (auth.uid() = user_id);

-- Content plans (Phase 2)
CREATE TABLE crm_content_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL, -- Monday of the week
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_start)
);

-- Content items within a plan
CREATE TABLE crm_content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES crm_content_plans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Content type info
  content_type TEXT NOT NULL, -- 'behind_the_scenes', 'case_study', etc.
  phase TEXT NOT NULL, -- 'build', 'launch', 'deliver', 'recap'

  -- User-provided context
  context TEXT NOT NULL,

  -- Generated content (after generation)
  generated_content TEXT,
  generated_at TIMESTAMPTZ,

  -- Status tracking
  status TEXT DEFAULT 'planned', -- 'planned', 'draft', 'published'
  published_at TIMESTAMPTZ,

  -- Ordering
  sort_order INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE crm_content_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_content_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own content plans"
  ON crm_content_plans FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own content items"
  ON crm_content_items FOR ALL USING (auth.uid() = user_id);
```

### Existing Table Updates

```sql
-- Add week_plan reference to execute_tasks
ALTER TABLE execute_tasks
  ADD COLUMN IF NOT EXISTS weekly_plan_id UUID REFERENCES crm_weekly_plans(id),
  ADD COLUMN IF NOT EXISTS stream_id UUID REFERENCES crm_streams(id);
```

---

## File Structure

### New Files

```
src/components/crm/
  # Phase 1: Weekly Planning
  WeeklyPlanningFlow.jsx       (~500 lines) - Multi-step planning flow (incl. reflection)
  WeeklyPlanningFlow.css       (~300 lines) - Styling
  WeeklyReflection.jsx         (~200 lines) - Reflection screen with scores + questions
  FlowCheckIn.jsx              (~100 lines) - Two-factor flow tracker component
  PhaseSelector.jsx            (~100 lines) - Multi-select phase picker
  StreamAssigner.jsx           (~150 lines) - Stream to phase assignment
  TaskMenuPicker.jsx           (~200 lines) - Task selection from menu
  WeekPlanSummary.jsx          (~100 lines) - Summary display

  # Phase 2: Content Planning
  ContentPlanningFlow.jsx      (~400 lines) - Multi-step content planning flow
  ContentPlanningFlow.css      (~250 lines) - Styling
  ContentTypeSelector.jsx      (~150 lines) - Select content types from phase list
  ContentContextInput.jsx      (~100 lines) - Add context for each content item
  ContentPlanSummary.jsx       (~100 lines) - Summary of planned content
  ContentChecklist.jsx         (~250 lines) - Checklist with generate/edit/complete actions
  ContentChecklist.css         (~200 lines) - Styling

src/lib/crm/
  weeklyPlanningService.js     (~200 lines) - CRUD for weekly plans
  reflectionService.js         (~150 lines) - CRUD for reflections + flow entries
  contentPlanningService.js    (~250 lines) - CRUD for content plans + items
  streamService.js             (~150 lines) - Stream management
  improvementService.js        (~150 lines) - Improvement tracking
```

### Modified Files

```
src/pages/crm/Execute.jsx      - Add weekly planning trigger
src/pages/crm/Marketing.jsx    - Integrate phase-based content suggestions
src/lib/crm/contentContext.js  - Add getActivePhases() to context
src/lib/executeHelpers.js      - Add stream-aware task functions
```

---

## Implementation Phases

### Phase 1: Core Weekly Planning (MVP) ✅ COMPLETE
- [x] Create `crm_weekly_plans` table + migration
- [x] Create `crm_weekly_reflections` table + migration
- [x] Build `WeeklyPlanningFlow.jsx` component
- [x] Build `WeeklyReflection.jsx` component
  - [x] Display last week's 3 scores (Execution, Conversion, Improvement)
  - [x] Show targeted reflection question based on scores
  - [x] Include Flow Tracker two-factor questions
  - [x] Save reflection + flow entry to database
- [x] Build `FlowCheckIn.jsx` component (reusable)
- [x] Add phase selection screen (multi-select)
- [x] Add task selection from existing menu
- [x] Add week summary with task breakdown by phase
- [x] Show planning flow on Sunday 3pm+ or Monday if no plan exists
- [x] Store and retrieve weekly plan

### Phase 2: Content Planning Integration ✅ COMPLETE
- [x] Create `crm_content_plans` table + migration
- [x] Create `crm_content_items` table (stores each content piece with context)
- [x] Add `getActivePhases()` function to read from weekly plan
- [x] Create phase-to-content-type mapping (`PHASE_CONTENT_TYPES`)
- [x] Build `ContentPlanningFlow.jsx` component
  - [x] Screen 1: Content Selection (auto-generated from phases)
  - [x] Screen 2: Add Context (per item, with progress indicator)
  - [x] Screen 3: Plan Summary
- [x] Build `ContentChecklist.jsx` component
  - [x] Show items with states (Planned/Draft/Published)
  - [x] Generate button → calls AI with saved context
  - [x] Edit Draft button → opens editor
  - [x] Mark Complete action
- [x] Integrate into Marketing page
- [x] Connect to existing Content Generator for AI generation

### Phase 3: Streams
- [ ] Create `crm_streams` table + migration
- [ ] Build stream management UI
- [ ] Add stream assignment to planning flow
- [ ] Show stream badges on tasks
- [ ] Filter Execute view by stream

### Phase 4: Gamification
- [ ] Create `crm_improvements` table + migration
- [ ] Build improvement creation flow
- [ ] Add outcome logging (7+ days later)
- [ ] Implement point calculations
- [ ] Show funnel health with weak stage highlights
- [ ] Add improvement suggestions

### Phase 5: Notifications & Polish
- [ ] Sunday 7PM push notification
- [ ] Monday morning in-app prompt
- [ ] Week summary email (optional)
- [ ] Edit plan functionality
- [ ] Historical plan viewing

---

## UI Mockups

### Execute Page with Weekly Plan Banner

```
┌─────────────────────────────────────────────────────────────┐
│  ← Back    EXECUTE                            Week of Jan 27 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  YOUR WEEK                                    [Edit Plan]    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 🛠️ Build  📦 Deliver  📊 Recap                       │   │
│  │ 8 tasks selected • 135 pts potential • 2/8 done      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  [🛠️ Build] [🚀 Launch] [📦 Deliver] [📊 Recap]            │
│                                                              │
│  BUILD TASKS                                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ ☑️ Create content piece                    15 pts     │   │
│  │ ☐ Design/wireframe                         20 pts     │   │
│  │ ☐ Share progress update                    10 pts     │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  [+ Add Task from Menu]                                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Content Generator with Phase Suggestions

```
┌─────────────────────────────────────────────────────────────┐
│  ← Back    CREATE CONTENT                                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  SUGGESTED FOR YOUR WEEK                                     │
│  Based on: 🛠️ Build  📦 Deliver  📊 Recap                   │
│                                                              │
│  [Behind the Scenes] [Case Study] [Client Win] [Learnings]  │
│                                                              │
│  YOUR CONTEXT                                                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ "Launching beta next Tuesday. Sarah just hit $10k    │   │
│  │  month - great case study material."                 │   │
│  │                                        [Edit]        │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  [Generate Case Study for Sarah's Win →]                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Verification Checklist

### Phase 1 Complete When:
- [ ] User can open Execute on Monday and see planning flow
- [ ] **Reflection screen shows last week's scores (Execution, Conversion, Improvement)**
- [ ] **Targeted reflection question appears based on scores**
- [ ] **Flow Tracker two-factor questions (Internal + External) appear**
- [ ] **Flow direction displayed (North/East/South/West)**
- [ ] **Reflection + flow entry saved to database**
- [ ] User can select multiple phases
- [ ] User can pick tasks from phase-filtered menu
- [ ] Week summary shows task breakdown by phase
- [ ] Plan is saved and persists
- [ ] Execute page shows "Your Week" banner with active phases
- [ ] Tasks are filtered to selected phases

### Phase 2 Complete When: ✅
- [x] Marketing page shows "Plan Your Content" CTA (if no plan exists)
- [x] Content Selection shows auto-generated list based on active phases
- [x] User can select multiple of same content type
- [x] Add Context screen loops through each selected item
- [x] Plan Summary shows all items with context snippets
- [x] Content Checklist shows all items with correct states
- [x] Tapping "Generate" creates draft using saved context
- [x] User can edit draft and mark as complete
- [x] Progress tracked (X of Y done)

### Phase 3 Complete When:
- [ ] User can create and manage streams
- [ ] Streams can be assigned to phases in planning
- [ ] Tasks show stream badges
- [ ] Execute can filter by stream

### Phase 4 Complete When:
- [ ] Funnel health shows weak stages
- [ ] User can create improvement hypothesis
- [ ] System prompts for outcome after 7 days
- [ ] Points awarded correctly

### Phase 5 Complete When:
- [ ] Sunday notification fires
- [ ] Monday prompt shows if no plan
- [ ] User can edit existing plan
- [ ] Historical plans viewable

---

## Dependencies

### Existing Features Used
- `getTaskMenuByPhase()` in executeHelpers.js ✅
- Execute.jsx with phase tabs ✅
- Content Generator with context ✅
- Push notification system ✅
- Points/gamification system ✅

### New Infrastructure Needed
- Database tables (migration)
- Sunday scheduled notification trigger
- Content context enhancement

---

## Open Questions

1. **Stream Complexity**: Start with streams in Phase 3, or simplify to just phases for MVP?
2. **Plan Editing**: Allow mid-week edits, or lock once started?
3. **Carryover**: Auto-suggest incomplete tasks for next week?
4. **Team View**: Future consideration for team-based planning?

---

## Future Review Items

After building the CRM Weekly Planning System, review these related areas:

### 7-Day Challenge Onboarding Review
- [ ] Add a **reflection section** to the 7-day challenge onboarding screens
- [ ] Review and align the **scoring system** with the CRM scoring model (Execution, Conversion, Improvement)
- [ ] Consider integrating Flow Tracker into challenge check-ins
- [ ] Ensure consistency between CRM weekly planning and challenge gamification

---

*Created: January 25, 2026*
*Phase 1 Completed: January 25, 2026*
*Phase 2 Completed: January 25, 2026*
*Based on conversation recovered from session a39171e2-aaf9-45b8-8a25-e07e4a8fcb62*
