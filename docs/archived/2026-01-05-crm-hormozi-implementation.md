# CRM Tower & Hormozi Features Implementation

**Date:** January 5, 2026
**Session:** Flow Academy Unification - Stages 5-7

---

## Overview

This session ported the CRM system from MonetiseYourMission and added 5 new Hormozi-inspired business tools. The goal was to give users a complete command center for managing their marketing, sales, and business metrics.

---

## Stage 5: CRM Tower

### Database Schema

Created migration: `supabase/migrations/20260105120000_crm_tables.sql`

#### Tables Created

**1. marketing_tasks**
```sql
- id: UUID (primary key)
- user_id: UUID (references auth.users)
- project_id: UUID (references user_projects)
- date: DATE
- day_of_week: TEXT
- task_type: TEXT
- platform: TEXT (LinkedIn, Twitter, Instagram, Email, Other)
- content_type: TEXT (transformation, educational, build, bts, community, engagement, outreach, planning)
- points_value: INTEGER
- completed: BOOLEAN
- completed_at: TIMESTAMP
- engagement_likes: INTEGER
- engagement_comments: INTEGER
- engagement_shares: INTEGER
- engagement_dms: INTEGER
```

**2. sales_deals**
```sql
- id: UUID (primary key)
- user_id: UUID (references auth.users)
- project_id: UUID (references user_projects)
- contact_name: TEXT
- contact_email: TEXT
- source: TEXT (Manual, LinkedIn, Instagram, Referral, Website, Other)
- product_type: TEXT
- value: INTEGER
- status: TEXT (lead, discovery, proposal, won, lost)
- probability: INTEGER (30, 50, 70, 100, 0)
- expected_close_date: DATE
- actual_close_date: DATE
- notes: TEXT
- conversation_screenshot_url: TEXT
```

**3. user_crm_stats**
```sql
- id: UUID (primary key)
- user_id: UUID (unique, references auth.users)
- total_points: INTEGER (default 0)
- current_streak: INTEGER (default 0)
- longest_streak: INTEGER (default 0)
- last_activity_date: DATE
- monthly_revenue_goal: INTEGER (default 5000)
```

All tables have Row Level Security (RLS) policies restricting access to the owning user.

---

### Services Layer

Location: `/src/lib/crm/`

#### taskService.js
Marketing task management with weekly templates.

**Weekly Task Templates:**
| Day | Tasks |
|-----|-------|
| Monday | LinkedIn Transformation Story, Comment on 10 posts, Respond to comments, DM 5 warm leads |
| Tuesday | LinkedIn Educational Framework, Twitter Thread, Comments, Respond |
| Wednesday | Pre-session hype, Results post, Collect testimonials, Announce next cohort |
| Thursday | Behind-the-scenes, Instagram Carousel, Comments |
| Friday | Highlight participant win, Newsletter, Respond to DMs, Plan next week |

**Exports:**
- `generateWeeklyTasks(userId, projectId, weekStartDate)`
- `checkWeeklyTasksExist(userId, weekStartDate)`
- `fetchWeeklyTasks(userId, weekStartDate)`
- `toggleTaskCompletion(taskId, completed)`
- `updateTaskEngagement(taskId, engagement)`
- `getTopPerformers(userId, limit)`
- `getWeekInfo(date)` / `getTodayInfo()`
- `taskHasContentGeneration(contentType)`
- `taskHasEngagementTracking(contentType)`

#### dealService.js
Sales pipeline management with Kanban stages.

**Deal Stages:**
| Stage | Probability | Points on Entry |
|-------|-------------|-----------------|
| Lead | 30% | 0 |
| Discovery | 50% | +25 |
| Proposal | 70% | +25 |
| Won | 100% | +100 |
| Lost | 0% | 0 |

**Product Types:**
| Product | Default Price |
|---------|---------------|
| Attraction Offer | $47 |
| Core Offer | $497 |
| Premium 1:1 | $997 |
| VIP Package | $1,997 |
| Continuity | $97/mo |

**Exports:**
- `DEAL_STAGES`, `STAGE_INFO`, `PRODUCTS`
- `fetchDeals(userId)` / `fetchDealsByStage(userId)`
- `createDeal(userId, dealData)`
- `updateDealStage(dealId, userId, newStatus)`
- `updateDeal(dealId, userId, updates)`
- `deleteDeal(dealId, userId)`
- `calculateRevenueStats(deals, monthlyGoal)`
- `getTransitionPoints(fromStage, toStage)`

#### analyticsService.js
Weekly report card generation with grading.

**Grade Scale:**
| Score | Grade | Emoji |
|-------|-------|-------|
| 90%+ | A | 🌟 |
| 80-89% | B | 👍 |
| 70-79% | C | 📈 |
| 60-69% | D | 💪 |
| <60% | F | 🔥 |

**Grade Weights:**
- Task Completion: 40%
- Engagement: 20%
- Sales Activity: 20%
- Consistency: 20%

**Exports:**
- `getWeekRange(weekOffset)`
- `fetchWeeklyMarketingStats(userId, weekOffset)`
- `fetchWeeklySalesStats(userId, weekOffset)`
- `calculateGrade(percentage)`
- `calculateWeeklyGrade(marketingStats, salesStats, userStats)`
- `fetchTopContent(userId, limit)`
- `compareWeeks(thisWeek, lastWeek)`

#### statsService.js
Gamification: points, levels, and streaks.

**Level System:**
| Min Points | Level Name | Emoji |
|------------|------------|-------|
| 0 | Vibe Apprentice | 🏰 |
| 501 | Vibe Builder | 🔨 |
| 1,001 | Vibe Master | ⚔️ |
| 2,001 | Vibe Legend | 👑 |

**Exports:**
- `LEVELS`
- `getLevel(points)` / `getLevelProgress(points)` / `getPointsToNextLevel(points)`
- `calculateStreak(lastActivityDate, currentStreak)`
- `fetchUserStats(userId)`
- `addPoints(userId, points)`
- `updateStreak(userId)`
- `updateRevenueGoal(userId, goal)`

---

### CRM Pages

Location: `/src/pages/crm/`

#### CRMDashboard.jsx (`/crm`)
Command center overview showing:
- Points & level progress
- Current streak
- Monthly revenue vs goal
- Pipeline value
- This week's progress (tasks, points, engagement, days active)
- Quick action buttons (Marketing, Sales, Analytics, Alerts)
- Hormozi Tools grid (PTUF, LTV, CAC, Scripts)
- Pipeline summary funnel

#### CRMMarketing.jsx (`/crm/marketing`)
Weekly quest board with:
- Week progress bar
- Day tabs (Mon-Fri) with today indicator
- Task cards with checkbox, type, platform, points
- Engagement tracking modal (likes, comments, shares, DMs)
- Auto-generates weekly tasks if none exist

#### CRMSales.jsx (`/crm/sales`)
Kanban-style pipeline with:
- 4 active columns (Lead, Discovery, Proposal, Won)
- Deal cards showing contact, product, value, probability
- Add Deal modal with form
- Deal detail modal with stage transition buttons
- Lost deals collapsed section
- Header stats (revenue this month, pipeline value)

#### CRMAnalytics.jsx (`/crm/analytics`)
Weekly report card with:
- Week navigation (previous/next)
- Overall grade display (letter + emoji + percentage)
- Score breakdown bars (Task Completion, Engagement, Sales, Consistency)
- Week-over-week comparison (+/-%)
- Marketing performance stats
- Engagement breakdown (likes, comments, shares, DMs)
- Sales performance stats
- Top performing content list

---

## Stage 6: Hormozi Features

### 1. PTUF Calculator (`/crm/ptuf`)

**Purpose:** Price To Unit Formula - helps calculate required pricing and activity based on income goals.

**Inputs:**
- Income Goals: Annual revenue goal, monthly expenses
- Capacity: Hours/week, weeks/year, hours per client per month
- Pricing: Core offer price, continuity price, avg months retained
- Conversion: Lead-to-sale rate, show-to-lead rate

**Calculations:**
- Monthly goal & profit margin
- Customer LTV
- Max clients/year based on capacity
- Clients needed/year and per month
- Leads needed/month
- Shows needed/month
- Capacity utilization (warning if over 100%)
- Minimum viable price
- Hourly equivalent
- Daily action requirements

**Visual Features:**
- Capacity utilization bar (green under, red over)
- Action items grid (shows/day, leads/day, sales/week)

---

### 2. LTV Calculator (`/crm/ltv`)

**Purpose:** Calculate customer lifetime value across entire offer stack.

**Inputs:**
- Front-End: Attraction offer price/conversion, core offer price/conversion
- Upsells: Upsell price/rate, downsell price/rate
- Continuity: Monthly price, take rate, avg months, churn rate
- Referrals: Referral rate, referrals per referrer

**Calculations (per 100 leads):**
- Front-end revenue (attraction + core)
- Upsell/downsell revenue
- Continuity revenue
- Referral multiplier
- Total revenue with referrals
- LTV per lead
- LTV per core buyer
- Average lifetime months
- Annual retention rate

**Visual Features:**
- Summary cards (LTV per lead, per core buyer, core buyers, avg lifetime)
- Revenue breakdown bars with color coding:
  - Attraction: Purple
  - Core: Violet
  - Upsells: Green
  - Downsells: Amber
  - Continuity: Cyan

---

### 3. CAC Tracker (`/crm/cac`)

**Purpose:** Track customer acquisition cost by marketing channel.

**Channels:**
| Channel | Icon | Color |
|---------|------|-------|
| Organic (Social) | 📱 | Green |
| Paid Social | 💰 | Purple |
| Paid Search | 🔍 | Amber |
| Email Marketing | 📧 | Cyan |
| Referrals | 🗣️ | Pink |
| Content/SEO | 📝 | Indigo |
| Partnerships | 🤝 | Teal |
| Other | 📊 | Gray |

**Inputs per channel:**
- Spend ($)
- Leads generated
- Customers acquired

**Calculations:**
- CPL (Cost Per Lead) per channel
- CAC (Customer Acquisition Cost) per channel
- Conversion rate per channel
- LTV:CAC ratio per channel
- Blended CPL, CAC, conversion across all channels
- Payback period in months

**LTV:CAC Status:**
| Ratio | Status | Color |
|-------|--------|-------|
| 5:1+ | Excellent | Green |
| 3:1-5:1 | Healthy | Cyan |
| 1:1-3:1 | Break-even | Amber |
| <1:1 | Losing Money | Red |

**Visual Features:**
- Summary cards with status indicators
- Channel input cards with live CPL/CAC display
- Results table sortable by LTV:CAC
- Recommendations section (contextual advice)

---

### 4. Sales Scripts (`/crm/scripts`)

**Purpose:** Proven sales frameworks with copy-to-clipboard functionality.

**Script Types:**
| Type | Icon | Use Case |
|------|------|----------|
| Discovery Call | 🔍 | Qualify leads, understand pain |
| Closing Script | 🎯 | Present offer, handle objections |
| Follow-Up | 📞 | Re-engage non-buyers |
| Objection Handling | 🛡️ | Overcome common objections |
| Referral Ask | 🗣️ | Get referrals from happy customers |
| DM Outreach | 💬 | Cold/warm DM starters |

**Frameworks Included:**

**Discovery (SPIN):**
- Situation Questions
- Problem Questions
- Implication Questions
- Need-Payoff Questions

**Closing (Hormozi):**
- Recap & Confirm
- Present the Offer
- The Close
- Handle Objections

**Follow-Up Sequence:**
- Day 1: Value Add
- Day 3: Case Study
- Day 7: Direct Check-in
- Day 14: Break-Up

**Objection Playbook:**
- "It's too expensive"
- "I need to think about it"
- "I need to talk to [spouse/partner]"
- "Now isn't the right time"

**Features:**
- Personalization mode (replace placeholders with your offer details)
- Copy-to-clipboard on each prompt
- Quick tips section

---

### 5. Smart Alerts (`/crm/alerts`)

**Purpose:** Intelligent notifications based on user data patterns.

**Alert Types:**
| Type | Icon | Color | Category |
|------|------|-------|----------|
| streak | 🔥 | Amber | Engagement |
| revenue | 💰 | Green | Revenue |
| pipeline | 📊 | Purple | Sales |
| marketing | 📝 | Cyan | Marketing |
| celebration | 🎉 | Pink | Win |
| warning | ⚠️ | Red | Warning |

**Alert Triggers:**

*Streak Alerts:*
- Streak broken (0 days) → "Start Your Streak Today!"
- 7+ day streak → Celebration

*Revenue Alerts:*
- Goal achieved (100%+) → Celebration
- Close to goal (75%+) → Encouragement
- Behind on goal (day 20+, <50%) → Warning

*Pipeline Alerts:*
- Stale deals (7+ days no update) → High priority
- Proposals pending → Medium priority

*Marketing Alerts:*
- Tasks behind (<50% by Thursday) → High priority
- Low consistency (<3 days active) → Medium priority

*Scheduled Alerts:*
- Weekly planning reminder (Sun/Mon)
- Month-end review (day 28+)

**Features:**
- Priority grouping (Action Required, Recommended, Updates & Wins)
- Dismissible alerts (persisted to localStorage)
- Action buttons linking to relevant pages
- Current status summary (streak, points, revenue, pipeline)

---

## Routes Added

```jsx
// CRM Core
/crm                → CRMDashboard
/crm/marketing      → CRMMarketing
/crm/sales          → CRMSales
/crm/analytics      → CRMAnalytics

// Hormozi Features
/crm/ptuf           → PTUFCalculator
/crm/ltv            → LTVCalculator
/crm/cac            → CACTracker
/crm/scripts        → SalesScripts
/crm/alerts         → SmartAlerts
```

---

## File Structure

```
src/
├── lib/crm/
│   ├── index.js              # Barrel export
│   ├── taskService.js        # Marketing tasks
│   ├── dealService.js        # Sales pipeline
│   ├── analyticsService.js   # Report cards
│   └── statsService.js       # Points & streaks
│
├── pages/crm/
│   ├── index.js              # Barrel export
│   ├── CRMDashboard.jsx      # Command center
│   ├── CRMDashboard.css
│   ├── CRMMarketing.jsx      # Quest board
│   ├── CRMMarketing.css
│   ├── CRMSales.jsx          # Pipeline
│   ├── CRMSales.css
│   ├── CRMAnalytics.jsx      # Report card
│   ├── CRMAnalytics.css
│   ├── PTUFCalculator.jsx    # Pricing calculator
│   ├── PTUFCalculator.css
│   ├── LTVCalculator.jsx     # Lifetime value
│   ├── LTVCalculator.css
│   ├── CACTracker.jsx        # Acquisition cost
│   ├── CACTracker.css
│   ├── SalesScripts.jsx      # Script library
│   ├── SalesScripts.css
│   ├── SmartAlerts.jsx       # Notifications
│   └── SmartAlerts.css
│
supabase/migrations/
└── 20260105120000_crm_tables.sql
```

---

## Design Patterns

### CSS Theming
All CRM pages use consistent dark theme:
- Background: `linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)`
- Cards: `rgba(255, 255, 255, 0.03-0.05)` with `rgba(255, 255, 255, 0.08)` border
- Accent colors per section:
  - Dashboard: Purple gradient
  - Marketing: Purple
  - Sales: Green
  - Analytics: Cyan
  - PTUF: Amber
  - LTV: Green
  - CAC: Pink
  - Scripts: Indigo
  - Alerts: Amber

### Component Patterns
- All pages have back button → `/crm`
- Loading states with spinner
- Modals with overlay click-to-close
- Responsive grid layouts
- Form inputs with prefix/suffix support ($, %)

---

## Future Enhancements

1. ~~**LTV Calculator** - Add visual waterfall chart~~ ✅ DONE
2. **CAC Tracker** - Persist data to database
3. **Smart Alerts** - Add email/push notification triggers
4. **Sales Scripts** - AI-powered script generation
5. **CRM Dashboard** - Add sparkline trend charts
6. **Cross-tool navigation** - Shared nav bar between Hormozi tools

---

## Post-Implementation Update: LTV Waterfall Chart

Added visual waterfall chart to LTV Calculator showing cumulative revenue build-up.

**Location:** `/src/pages/crm/LTVCalculator.jsx` lines 318-376

**Features:**
- 6 columns: Attraction, Core, Upsells, Downsells, Continuity, Total
- Stacked bars showing how each revenue stream builds on previous
- Running total displayed below each bar
- Color-coded to match existing breakdown bars
- Responsive design for mobile

**CSS Additions:** `/src/pages/crm/LTVCalculator.css` lines 200-300
- `.waterfall-chart` container
- `.waterfall-container` flex layout
- `.waterfall-column` individual bars
- `.waterfall-bar` animated fill with box shadow
- `.waterfall-connector` linking bars
- Mobile responsive breakpoints
