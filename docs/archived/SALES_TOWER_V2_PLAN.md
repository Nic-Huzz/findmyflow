# Sales Tower V2: Hormozi CRM Implementation Plan

**Created:** January 7, 2026
**Last Updated:** January 9, 2026 (Session 4)
**Status:** Tier 1 & 2 Complete, Daily Priorities System Complete, Tier 3 Planning
**Goal:** Transform CRM Sales from deal tracking → revenue maximization system

---

## Execution Status

### Tier 1: Checklist Display (COMPLETE)
**Implemented:** January 8, 2026

| Component | Status | Location |
|-----------|--------|----------|
| Implementation checklist loader | ✅ Complete | `src/lib/implementationChecklists.js` |
| Checklist JSON files (all 4 categories) | ✅ Complete | `public/Money Model/*/implementation_checklists.json` |
| ChecklistDisplay component | ✅ Complete | `src/components/MoneyModelShared/ChecklistDisplay.jsx` |
| ChecklistDisplay styles | ✅ Complete | `src/components/MoneyModelShared/ChecklistDisplay.css` |
| Integration with MoneyModelFlowBase | ✅ Complete | Line 650-654 of MoneyModelFlowBase.jsx |

**Features Delivered:**
- Shows implementation checklist after Money Model flow completion
- Expandable/collapsible phases with task counts
- Target metrics display (take rate, AOV increase, etc.)
- Hormozi principle quotes
- Quick wins section
- Common mistakes to avoid
- Print to browser
- Download as Markdown

**User Impact:**
- Users now leave Money Model flows with actionable next steps
- Reduces "now what?" drop-off after flow completion
- Expected: 20%+ more users take first implementation action

---

### Tier 2: Interactive Progress Tracking (COMPLETE)
**Implemented:** January 9, 2026

| Component | Status | Location |
|-----------|--------|----------|
| Database migration | ✅ Complete | `supabase/migrations/20260109000000_offer_implementations.sql` |
| Implementation service | ✅ Complete | `src/lib/crm/implementationService.js` |
| Implementation tracker page | ✅ Complete | `src/pages/crm/ImplementationTracker.jsx` |
| Tracker styles | ✅ Complete | `src/pages/crm/ImplementationTracker.css` |
| ChecklistDisplay tracking integration | ✅ Complete | "Start Tracking" button in ChecklistDisplay |
| CRM Dashboard card | ✅ Complete | Implementations section in CRMDashboard.jsx |
| Quick Actions navigation | ✅ Complete | "Implementations" button in CRM Dashboard |
| Route configuration | ✅ Complete | `/crm/implementations` in AppRouter.jsx |

**Features Delivered:**
- Persistent task completion tracking (database-backed)
- Implementation dashboard at `/crm/implementations`
- Filter by category (Attraction, Upsell, Downsell, Continuity)
- Expandable implementation cards with per-phase progress
- Checkable tasks with real-time progress updates
- Phase completion celebrations (overlay animation)
- Full implementation completion celebrations
- CRM Dashboard integration (current focus card + stats)
- "Start Tracking" button on flow summary pages
- "Continue" button for existing implementations
- Project-level implementation tracking

**Database Schema:**
```sql
offer_implementations (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  project_id UUID REFERENCES user_projects(id),
  offer_type TEXT NOT NULL,
  category TEXT CHECK (category IN ('attraction', 'upsell', 'downsell', 'continuity')),
  flow_assessment_id UUID,
  status TEXT CHECK (status IN ('not_started', 'in_progress', 'completed')),
  completed_tasks JSONB DEFAULT '[]',
  current_phase INTEGER DEFAULT 0,
  total_tasks INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, project_id, offer_type)
)
```

**User Flow:**
1. Complete Money Model flow → see recommended offer + checklist
2. Click "Start Tracking This Implementation"
3. Implementation created → navigate to `/crm/implementations`
4. Check off tasks as completed → progress persists
5. Phase complete → celebration animation
6. All phases complete → full completion celebration

**User Impact:**
- Users can now track implementation progress over time
- Accountability through visible progress metrics
- Gamification through celebrations drives completion
- Expected: 100% improvement in implementation completion rates

---

### Daily Priorities System (COMPLETE)
**Implemented:** January 9, 2026 (Session 3-4)

| Component | Status | Location |
|-----------|--------|----------|
| DailyPriorities component | ✅ Complete | `src/components/crm/DailyPriorities.jsx` |
| DailyPriorities styles | ✅ Complete | `src/components/crm/DailyPriorities.css` |
| Activity Logging Modal | ✅ Complete | `src/components/crm/ActivityLogModal.jsx` |
| AI Activity Analysis | ✅ Complete | `supabase/functions/analyze-activity/` |
| Deal Outcome Modal | ✅ Complete | `src/components/crm/DealOutcomeModal.jsx` |
| Push Notifications | ✅ Complete | `supabase/functions/scheduled-notifications/` |
| CRM Dashboard Integration | ✅ Complete | Mounted in CRMDashboard.jsx |

**Features Delivered:**

**1. Smart Priority Engine:**
- Auto-surfaces urgent deals: very stale (14+ days), stale (7-14 days)
- Follow-up due/overdue detection with date math
- Upcoming meetings (next 3 days)
- High-value opportunity highlighting ($1000+)
- Collapsible sections with item counts

**2. Smarter "Why" Context:**
- Dynamic context per priority type (e.g., "Last contact 5d ago • No activity for 12d")
- Overdue days calculation
- Stage + contact count for high-value deals
- Action hints per type (e.g., "Re-engage now or mark as lost")

**3. AI Talking Points:**
- Pattern matching on deal notes (budget, timeline, competition, concerns, interest, pain points)
- Extracts key bullet points from notes
- Shows contextual hints like "Budget was mentioned - address value first"

**4. One-Click Actions:**
- 📝 Log Activity → Opens ActivityLogModal
- 📜 Script → Opens ScriptsModal with stage-appropriate scripts
- 📅 +3d → Quick schedule follow-up in 3 days
- 👁️ View → Navigate to pipeline

**5. Activity Logging with AI:**
- Voice recording with transcription
- Screenshot upload for DM/call screenshots
- AI analysis extracts: key points, recommended next steps, talking points
- Persists to deal contact log

**6. Push Notifications:**
- 8am: Morning Priority Check (overdue follow-ups + very stale deals)
- 2pm: Afternoon Follow-up Reminder
- Timezone-aware delivery
- Deep links to CRM dashboard

**7. Win/Loss Capture (DealOutcomeModal):**
- Required primary reason when marking won/lost
- 6 win reasons (timing, value, trust, offer, urgency, referral)
- 6 loss reasons (price, timing, competitor, no decision, fit, trust)
- Competitor name capture
- Notes for learning capture

**Bucket Coverage:**
| Bucket | Features |
|--------|----------|
| 🎯 Execution | Daily priorities, follow-up reminders, action buttons |
| 📊 Tracking | Win/loss reasons, activity logging, stage history |
| 🤖 Automation | AI talking points, AI activity analysis, push notifications |

**User Impact:**
- Users start each day with clear priorities
- AI tells them what to say and why
- One-click actions reduce friction
- Push notifications ensure no deal falls through cracks
- Win/loss data feeds future intelligence
- Expected: 50% increase in daily sales activity completion

---

## Tiered Implementation Roadmap

### Tier 3: AI Implementation Coach (NEXT)
**Effort:** 2-3 weeks | **Impact:** 1000% improvement (10x results)

AI-powered implementation assistance:

| Feature | Description |
|---------|-------------|
| Zarlo Implementation Mode | Context-aware coaching through checklist |
| Artifact generation | AI generates headlines, emails, scripts |
| Smart sequencing | Optimal implementation order |
| Progress triggers | Auto-create marketing tasks on phase complete |

**Edge Functions Required:**
- `implementation-coach/` - Zarlo implementation mode
- `generate-implementation/` - Auto-generate artifacts

**Key Components:**
- `ImplementationCoach.jsx` - Full-screen implementation mode
- `ArtifactGenerator.jsx` - AI-generated deliverables

---

### Tier 4: Autonomous Sales System (VISION)
**Effort:** Ongoing | **Impact:** Paradigm shift

Full autopilot implementation:

| Feature | Description |
|---------|-------------|
| Multi-agent orchestration | Strategist, Copywriter, Builder, Optimizer agents |
| Self-implementing offers | AI creates checkout flows, emails, tracking |
| Continuous optimization | A/B testing and auto-improvement |
| Weekly reporting | AI reports wins and insights |

**Architecture:** Claude Agent SDK with specialized agents

---

## Executive Summary

Current state: Smart pipeline with lead scoring, implementation checklists, and **Daily Priorities System**
Target state: Full Hormozi-style revenue optimization system

**Coverage Before Tier 1:** 25% of Hormozi framework
**Coverage After Tier 1 (Checklists):** 30% of Hormozi framework
**Coverage After Tier 2 (Tracking):** 40% of Hormozi framework
**Coverage After Daily Priorities:** 55% of Hormozi framework ⬅️ Current
**Coverage Target (Tier 4):** 85% of Hormozi framework

---

## Sales Tower Purpose & Pillars

### Core Purpose

The Sales Tower exists to support three key functions:

| Function | Purpose | Key Question |
|----------|---------|--------------|
| **EXECUTION** | Provide templates, scripts, and guided workflows | "What should I do/say?" |
| **REMINDERS** | Tasks, follow-ups, cadences, alerts | "What needs attention today?" |
| **MEASUREMENT** | Stats, insights, and effectiveness analysis | "How well is this working?" |

---

### The Three Functional Buckets

Every feature in the Sales Tower falls into one of three buckets:

#### 🎯 Bucket 1: Supports Execution (To-Do / Reminders)
Features that tell you WHAT to do and WHEN to do it.

- Daily/weekly task lists
- Follow-up reminders and cadences
- Deal stage checklists
- Activity prompts
- Alerts when action is needed
- Calendar/deadline management

#### 📊 Bucket 2: Supports Tracking / Analysis
Features that help you MEASURE and UNDERSTAND performance.

- Pipeline metrics (value, velocity, health)
- Win/loss rates and reasons
- Revenue and LTV tracking
- Conversion funnel analysis
- Source/channel effectiveness
- Trend comparisons over time

#### 🤖 Bucket 3: Supports Automation / AI / Templates
Features that provide GUIDANCE and REDUCE manual work.

- Sales scripts and objection rebuttals
- AI-generated insights and recommendations
- Automated triggers (upsell, follow-up, alerts)
- Content templates
- Smart suggestions based on data patterns
- Predictive analytics

---

### Complete Pillar Framework (10 Pillars)

| # | Pillar | Purpose | Primary Bucket |
|---|--------|---------|----------------|
| 1 | **Pipeline Management** | Track deals through stages | 📊 Tracking |
| 2 | **Activity Management** | Tasks, reminders, cadences | 🎯 Execution |
| 3 | **Sales Enablement** | Scripts, templates, proof | 🤖 Automation |
| 4 | **Pipeline Health** | Coverage, distribution, aging | 📊 Tracking |
| 5 | **Lead Quality Analysis** | Source effectiveness, close rates | 📊 Tracking |
| 6 | **Activity Tracking** | Outreach volume, response rates | 📊 Tracking |
| 7 | **Deal Momentum** | Progression, risk signals, staleness | 🎯 Execution + 📊 Tracking |
| 8 | **Competitive Intelligence** | Win/loss vs competitors | 📊 Tracking |
| 9 | **Performance Analytics** | Win rate, velocity, conversion | 📊 Tracking |
| 10 | **Forecast Accuracy** | Predicted vs actual outcomes | 📊 Tracking |

---

### New KPIs to Track (Beyond Current Implementation)

#### Pipeline Health KPIs (Pillar 4)
| KPI | Formula | Target | Bucket |
|-----|---------|--------|--------|
| Pipeline Coverage Ratio | Pipeline $ ÷ Goal $ | 3x minimum | 📊 |
| Stage Distribution | % of deals per stage | Balanced funnel | 📊 |
| Deal Aging | Avg days in current stage | < stage average | 📊 |
| Pipeline Velocity | $ moving through per week | Trending up | 📊 |

#### Lead Quality KPIs (Pillar 5)
| KPI | Formula | Why It Matters | Bucket |
|-----|---------|----------------|--------|
| Close Rate by Source | Wins ÷ Leads per channel | Know best lead sources | 📊 |
| Avg Deal Size by Source | Revenue ÷ Wins per channel | Identify high-value channels | 📊 |
| Time to Close by Source | Avg days per channel | Faster = better leads | 📊 |
| LTV by Source | Customer LTV per channel | Long-term channel value | 📊 |

#### Activity Tracking KPIs (Pillar 6)
| KPI | What It Measures | Target | Bucket |
|-----|------------------|--------|--------|
| Daily Outreach Volume | DMs, calls, emails sent | Activity → Results | 🎯 + 📊 |
| Response Rate | Replies ÷ Outreach | Messaging effectiveness | 📊 |
| Conversations Started | Meaningful exchanges | Engagement quality | 📊 |
| Calls Booked | Discovery calls scheduled | Pipeline creation | 📊 |
| Show Rate | Showed ÷ Booked | Follow-up effectiveness | 📊 |

#### Deal Momentum KPIs (Pillar 7)
| Signal | Definition | Action | Bucket |
|--------|------------|--------|--------|
| 🟢 Progressing | Moved stages in 7 days | Keep pushing | 📊 |
| 🟡 Stalling | No activity 7-14 days | Re-engage alert | 🎯 |
| 🔴 At Risk | No activity 14+ days | Rescue or qualify out | 🎯 |
| ⚫ Dead | 3+ no-response attempts | Mark lost, capture reason | 🎯 |

#### Competitive Intelligence KPIs (Pillar 8)
| KPI | What It Measures | Use Case | Bucket |
|-----|------------------|----------|--------|
| Win Rate vs Competitor X | When mentioned, do we win? | Competitive positioning | 📊 |
| Top Competitor Mentions | Which competitors appear most | Focus areas | 📊 |
| Reasons Lost to Competitors | Price? Features? Trust? | Offer improvement | 📊 + 🤖 |

#### Forecast Accuracy KPIs (Pillar 10)
| KPI | Formula | Target | Bucket |
|-----|---------|--------|--------|
| Predicted vs Actual | Forecast $ ÷ Actual $ | 90-110% accuracy | 📊 |
| Optimism Bias | Avg over-forecast % | Minimize | 📊 |
| Stage Probability Accuracy | Actual close % per stage | Match stated probability | 📊 |

---

## Hormozi CRM Audit: Current State Analysis

### Modules Organized by Functional Bucket

#### 🎯 Bucket 1: Execution (To-Do / Reminders)

| Module | % Built | Key Features | Status |
|--------|---------|--------------|--------|
| **Activity Management** | **70%** | Daily priorities, activity logging, quick actions | ✅ Daily Priorities System |
| **Deal Momentum Alerts** | **80%** | Stale deal warnings, re-engage prompts, push notifications | ✅ Built |
| **Ascension Triggers** | 0% | Upsell reminders, win-back prompts | Roadmapped |
| **Follow-up Cadences** | **50%** | Follow-up tracking + reminders | ✅ Partial (no Day 1/3/7 sequences) |

**What's Built (Execution):**
- ✅ Daily Priorities widget with "do this now" tasks
- ✅ Follow-up reminders with overdue alerts
- ✅ Stale deal detection (7+ and 14+ days)
- ✅ Push notifications at 8am and 2pm
- ✅ One-click actions (Log, Script, Schedule, View)

**What's Missing (Execution):**
- No cadence system (Day 1, Day 3, Day 7 sequences)
- No ascension triggers yet

---

#### 📊 Bucket 2: Tracking / Analysis

| Module | % Built | Key Features | Status |
|--------|---------|--------------|--------|
| **LTV Dashboard** | 40% | LTV calc, cohorts, per-customer view | Partial |
| **CAC Dashboard** | 80% | Cost per channel, LTV:CAC ratio | Strong |
| **Lead Scoring (PTUF)** | 60% | Pain/Trust/Urgency/Fit sliders | Partial |
| **Pipeline Management** | 70% | Kanban, stages, deal tracking | Good |
| **Velocity Tracker** | 0% | Time per stage, cycle time | Gap |
| **Win/Loss Analysis** | 0% | Why we win, why we lose | Gap |
| **Objection Patterns** | 10% | Lost deal reasons, trends | Gap (no data capture) |
| **Retention/Churn** | 0% | Subscription health, churn reasons | Gap |
| **Cash Flow Projector** | 10% | 90-day forecast, scenarios | Gap |
| **Guarantee Compliance** | 0% | Refund rates, reasons | Gap |
| **Pipeline Health** | 20% | Coverage, aging, distribution | Partial |
| **Lead Quality by Source** | 30% | CAC per channel (no close rate) | Partial |
| **Competitive Intel** | 0% | Win/loss vs competitors | Gap |
| **Forecast Accuracy** | 0% | Predicted vs actual | Gap |

**What's Missing (Tracking):**
- No cohort-based LTV analysis
- No per-customer journey visualization
- No stage timestamp tracking for velocity
- No lost deal reason capture
- No won deal insight capture
- No competitor tracking

---

#### 🤖 Bucket 3: Automation / AI / Templates

| Module | % Built | Key Features | Status |
|--------|---------|--------------|--------|
| **Sales Scripts** | 90% | 15+ Hormozi scripts, copy to clipboard | Strong |
| **Smart Script Suggestions** | **90%** | Suggest scripts based on lead score + Quick access from priorities | ✅ Enhanced |
| **Grand Slam Scorecard** | 85% | Offer Builder value equation | Strong |
| **AI Screenshot Analysis** | 100% | Extract deal from DM screenshot | Complete |
| **AI Activity Analysis** | **100%** | Analyze voice/screenshot → key points + next steps | ✅ NEW |
| **AI Talking Points** | **100%** | Pattern match notes → contextual hints | ✅ NEW |
| **Objection Intelligence AI** | **30%** | Win/loss reason capture (feeds future patterns) | ✅ Data capture built |
| **AI Content Generation** | 80% | Marketing content from context | Strong (Marketing Tower) |
| **Automated Ascension** | 0% | Trigger upsell sequences | Gap |
| **Referral Automation** | 0% | Milestone-triggered asks | Gap |
| **Onboarding Predictor** | 0% | Risk signals, auto-intervention | Gap |
| **A/B Testing** | 0% | Offer variant tracking | Gap |

**What's Built (Automation):**
- ✅ AI Activity Analysis (voice/screenshot → insights)
- ✅ AI Talking Points on priority deals
- ✅ Win/Loss reason capture for future pattern analysis
- ✅ Quick script access from Daily Priorities

**What's Missing (Automation):**
- No automated trigger system for upsells
- No referral request automation
- No A/B testing infrastructure
- No objection pattern analysis (have data capture, need analysis)

---

### Summary: Coverage by Bucket

| Bucket | Previous | Current | Target | Gap |
|--------|----------|---------|--------|-----|
| 🎯 Execution | 15% | **55%** | 80% | 25% |
| 📊 Tracking | 35% | **50%** | 90% | 40% |
| 🤖 Automation | 55% | **70%** | 85% | 15% |

**Key Insight (Updated Jan 9):** Execution gap significantly reduced with Daily Priorities System. The "what should I do today?" question is now answered. Remaining gaps are in velocity tracking and retention/churn.

**Recent Gains:**
- 🎯 Execution: +40% (Daily Priorities, Follow-up Reminders, Push Notifications)
- 📊 Tracking: +15% (Win/Loss Reasons, Activity Logging, Stage History)
- 🤖 Automation: +15% (AI Talking Points, AI Activity Analysis)

---

### Hormozi Modules Mapped to Buckets

| # | Hormozi Module | 🎯 Execution | 📊 Tracking | 🤖 Automation | % Built |
|---|----------------|--------------|-------------|---------------|---------|
| 1 | LTV Dashboard | | ✅ Primary | | 40% |
| 2 | Grand Slam Scorecard | | ✅ | ✅ Templates | 85% |
| 3 | Lead Scoring (Fit) | | ✅ Primary | | 60% |
| 4 | Closers Module | ✅ Tasks | ✅ Metrics | | 15% |
| 5 | Objection Intelligence | | ✅ Patterns | ✅ AI Rebuttals | 10% |
| 6 | Ascension Engine | ✅ Triggers | ✅ Journey | ✅ Automation | 0% |
| 7 | Velocity Tracker | ✅ Alerts | ✅ Primary | | 0% |
| 8 | Offer Testing Lab | | ✅ Primary | | 0% |
| 9 | Referral Maximizer | ✅ Asks | ✅ Tracking | ✅ Automation | 5% |
| 10 | CAC Dashboard | | ✅ Primary | | 80% |
| 11 | Guarantee Compliance | ✅ Alerts | ✅ Primary | | 0% |
| 12 | Why We Win/Lose | | ✅ Primary | ✅ AI Insights | 0% |
| 13 | Retention/Churn | ✅ Alerts | ✅ Primary | ✅ Win-back | 0% |
| 14 | Cash Flow Projector | ✅ Warnings | ✅ Primary | | 10% |
| 15 | Onboarding Predictor | ✅ Alerts | ✅ Signals | ✅ Auto-intervene | 0% |

---

### Build Priority by Bucket

**Phase 1 Focus: 📊 Tracking Foundation (Data Capture)**
Before we can execute or automate, we need data:
- Lost deal reasons (feeds objection intelligence)
- Won deal insights (feeds win analysis)
- Stage timestamps (feeds velocity tracking)
- Qualification fields (feeds lead scoring)

**Phase 2 Focus: 🎯 Execution (What To Do)**
With data flowing, add action prompts:
- Stale deal alerts
- Follow-up reminders
- Ascension trigger tasks
- Daily priority lists

**Phase 3 Focus: 🤖 Automation (Scale & Intelligence)**
Once patterns emerge, add AI:
- Objection pattern analysis
- Smart recommendations
- Automated sequences
- Predictive alerts

---

## Detailed Module-by-Module Assessment

This section documents what percentage of Hormozi's "Value Maximizer" CRM framework is currently built, on the roadmap, or missing. Use this as reference for understanding gaps.

### Module-by-Module Assessment

#### 1. LTV Dashboard (Front and Center)
**Status: 40% Built**

| Element | Status | Location |
|---------|--------|----------|
| LTV per lead calculation | ✅ Built | `/crm/ltv` - LTVCalculator.jsx |
| LTV per core buyer | ✅ Built | Shows in calculator |
| LTV:CAC ratio | ✅ Built | `/crm/cac` - CACTracker.jsx |
| Expected LTV by cohort | ❌ Gap | Not tracking cohorts |
| Time to breakeven | ⚠️ Partial | CAC Tracker shows payback period |
| Ascension path per customer | ❌ Gap | No customer journey view |
| **Front and center** | ❌ Gap | CRM Dashboard leads with points/streak, not LTV |

**Gap:** The calculators exist but aren't the main screen, and missing cohort/per-customer views.

---

#### 2. Grand Slam Offer Scorecard
**Status: 85% Built**

| Element | Status | Location |
|---------|--------|----------|
| Dream outcome score | ✅ Built | OfferBuilder100M Step 1B |
| Perceived likelihood | ✅ Built | Step 3 (Proof Stack) |
| Time delay | ✅ Built | Step 4 (Speed Enhancements) |
| Effort & sacrifice | ✅ Built | Step 5 (Ease) |
| Auto-calculates value equation | ✅ Built | Final step shows Grand Slam score |
| Score threshold warning | ⚠️ Partial | Shows score but no "don't launch" warning |

**Gap:** The Offer Builder 100M IS the Grand Slam Scorecard. Missing the hard "don't launch if <8" warning.

---

#### 3. Lead Scoring: "Fit Score" (Not Activity Score)
**Status: 60% Built**

| Element | Status | Location |
|---------|--------|----------|
| Pain level (1-10) | ✅ Built | LeadScoreSliders.jsx |
| Trust score (1-10) | ✅ Built | LeadScoreSliders.jsx |
| Urgency score (1-10) | ✅ Built | LeadScoreSliders.jsx |
| Fit score (1-10) | ✅ Built | LeadScoreSliders.jsx |
| Auto temperature (Hot/Warm/Cold) | ✅ Built | LeadScoreBadge.jsx |
| What they've tried | ❌ Gap | No field for this |
| Budget available NOW | ❌ Gap | Deal has value but not "budget" |
| Decision maker flag | ❌ Gap | Not tracked |
| Success probability | ❌ Gap | We have "fit" but not outcome prediction |

**Gap:** Core PTUF sliders exist, but missing deeper qualification fields.

---

#### 4. The "Closers" Module
**Status: 15% Built**

| Element | Status | Location |
|---------|--------|----------|
| Dials made | ❌ Gap | |
| Conversations had | ❌ Gap | |
| Show rate | ❌ Gap | |
| Close rate | ⚠️ Partial | dealService.js calculates winRate |
| Revenue generated | ✅ Built | currentRevenue in stats |
| Average deal size | ❌ Gap | Could calculate but not displayed |
| Objections by type | ❌ Gap | |
| Real-time leaderboard | ❌ Gap | Challenge has leaderboard but not sales |
| Compensation calculator | ❌ Gap | |
| Script compliance tracker | ❌ Gap | |

**Gap:** Major gap. CRM is designed for solo entrepreneurs, not sales teams. Lower priority unless user has a team.

---

#### 5. Objection Intelligence
**Status: 40% Built** ⬆️ (was 10%)

| Element | Status | Location |
|---------|--------|----------|
| Tag lost deals with WHY | ✅ Built | DealOutcomeModal - 6 loss reasons |
| Tag won deals with WHY | ✅ Built | DealOutcomeModal - 6 win reasons |
| Competitor tracking | ✅ Built | competitor_mentioned field in modal |
| AI analyzes patterns | ❌ Gap | Data collected, analysis not built |
| Top objection report | ❌ Gap | |
| Auto-write rebuttals | ⚠️ Partial | Scripts exist but not dynamic |
| Suggests offer fixes | ❌ Gap | |

**What's Built:** DealOutcomeModal captures primary/secondary reasons, competitor info, and notes when deals close. Data now flowing for future pattern analysis.

---

#### 6. Ascension Engine
**Status: 0% Built, 30% Roadmapped**

| Element | Status | Location |
|---------|--------|----------|
| Value ladder visualization | ❌ Gap | |
| Customer journey per person | ❌ Gap | |
| Drop-off points | ❌ Gap | |
| Ascension rate tracking | ❌ Gap | |
| Revenue per rung | ❌ Gap | |
| Automated ascension triggers | 📋 Roadmap | `FEATURES_ROADMAP.md:385-397` |
| Upsell/downsell triggers | 📋 Roadmap | Listed as P2 priority |

**Gap:** Significant gap. The triggers are planned but no visualization exists.

---

#### 7. Velocity Tracker
**Status: 0% Built**

| Element | Status | Location |
|---------|--------|----------|
| Time: lead → qualified | ❌ Gap | No timestamp tracking per stage |
| Time: qualified → booked | ❌ Gap | |
| Time: call → close | ❌ Gap | |
| Time: close → onboarding | ❌ Gap | |
| Red flags when slow | ❌ Gap | |
| Speed alerts | ❌ Gap | |

**Gap:** Major gap. We track deal creation date and close date, but not intermediate timestamps.

---

#### 8. Offer Testing Lab
**Status: 0% Built**

| Element | Status | Location |
|---------|--------|----------|
| A/B test price points | ❌ Gap | |
| A/B test guarantees | ❌ Gap | |
| A/B test bonuses | ❌ Gap | |
| A/B test scripts | ❌ Gap | |
| Conversion rate by variant | ❌ Gap | |
| Statistical significance | ❌ Gap | |
| Auto-declare winner | ❌ Gap | |

**Gap:** No A/B testing infrastructure exists.

---

#### 9. Referral Maximizer
**Status: 5% Built**

| Element | Status | Location |
|---------|--------|----------|
| Milestone-triggered referral ask | ❌ Gap | |
| Who referred who | ⚠️ Partial | Deal has `source: 'Referral'` but no referrer name |
| Referral LTV tracking | ❌ Gap | |
| Top referrer list | ❌ Gap | |
| Referral incentive calculator | ❌ Gap | |
| Automated referral sequences | ❌ Gap | |

**Gap:** We can tag a deal as "Referral" but no referral system exists.

---

#### 10. CAC Dashboard
**Status: 80% Built**

| Element | Status | Location |
|---------|--------|----------|
| CAC by channel | ✅ Built | `/crm/cac` - CACTracker.jsx |
| Paid ads CAC | ✅ Built | Paid Social channel |
| Organic CAC | ✅ Built | Organic Social channel |
| Referral CAC | ✅ Built | Referrals channel |
| Partnership CAC | ✅ Built | Partnerships channel |
| LTV:CAC ratio per channel | ✅ Built | Calculated per channel |
| Ratio status (Excellent/Healthy/Danger) | ✅ Built | Color-coded status |
| Profitability forecaster | ❌ Gap | No "if you spend X more..." |

**Gap:** Strong CAC tracking exists. Missing forecasting/projection.

---

#### 11. Guarantee Compliance Tracker
**Status: 0% Built**

| Element | Status | Location |
|---------|--------|----------|
| Refund rate by offer | ❌ Gap | |
| Reason for refund | ❌ Gap | |
| Time to refund request | ❌ Gap | |
| Guarantee milestone tracking | ❌ Gap | |
| Refund rate alerts | ❌ Gap | |

**Gap:** No refund/guarantee tracking exists.

---

#### 12. "Why We Win/Lose" Module
**Status: 60% Built** ⬆️ (was 0%)

| Element | Status | Location |
|---------|--------|----------|
| Required fields on won deal | ✅ Built | DealOutcomeModal - 6 win reasons + notes |
| Required fields on lost deal | ✅ Built | DealOutcomeModal - 6 loss reasons + notes |
| Competitor mentioned | ✅ Built | competitor_mentioned field |
| Secondary reasons | ✅ Built | Multi-select secondary reasons |
| AI generates insights | ❌ Gap | Data collected, analysis not built |
| Training recommendations | ❌ Gap | |

**What's Built:** DealOutcomeModal is triggered when deals move to Won/Lost. Captures primary reason, secondary reasons, competitor info, and "what sold them" or learning notes.

---

#### 13. Retention & Churn Dashboard
**Status: 0% Built, 10% Roadmapped**

| Element | Status | Location |
|---------|--------|----------|
| Customer retention rate | ❌ Gap | |
| Revenue retention rate | ❌ Gap | |
| Churn rate by cohort | ❌ Gap | |
| Reason for churn | ❌ Gap | |
| Early warning (engagement drop) | ❌ Gap | |
| Win-back sequences | 📋 Roadmap | Continuity triggers in roadmap |
| Reactivation tracking | ❌ Gap | |

**Gap:** No retention tracking at all.

---

#### 14. Cash Flow Projector
**Status: 10% Built**

| Element | Status | Location |
|---------|--------|----------|
| 90-day forecast | ❌ Gap | |
| Expected cash in (pipeline + close rate) | ⚠️ Partial | `weightedPipeline` calculation exists |
| Expected cash out | ❌ Gap | |
| Runway remaining | ❌ Gap | |
| Scenario modeling | ❌ Gap | |

**Gap:** We calculate weighted pipeline value but no full cash flow projection.

---

#### 15. Onboarding Success Predictor
**Status: 0% Built**

| Element | Status | Location |
|---------|--------|----------|
| Track early customer behavior | ❌ Gap | |
| Red flags (no engagement, support tickets) | ❌ Gap | |
| Green flags (fast completion) | ❌ Gap | |
| Auto-intervention triggers | ❌ Gap | |
| First 48-hour tracking | ❌ Gap | |

**Gap:** No customer success/onboarding tracking. Would require product usage data.

---

### Summary Scorecard (Updated Jan 9, 2026)

| Module | Previous | Current | Priority |
|--------|----------|---------|----------|
| 1. LTV Dashboard | 40% | 40% | P2 - Make LTV the main view |
| 2. Grand Slam Offer Scorecard | 85% | 85% | P3 - Add launch warning |
| 3. Lead Scoring (Fit) | 60% | 60% | P2 - Add qualification fields |
| 4. Closers Module | 15% | 15% | P4 - Solo focus, not needed now |
| 5. Objection Intelligence | 10% | **40%** ⬆️ | P2 - Add pattern analysis |
| 6. Ascension Engine | 0% | 0% | **P1** - High revenue impact |
| 7. Velocity Tracker | 0% | **10%** ⬆️ | P2 - Stage history exists, need dashboard |
| 8. Offer Testing Lab | 0% | 0% | P3 - Nice to have |
| 9. Referral Maximizer | 5% | 5% | P2 - Systematize referrals |
| 10. CAC Dashboard | 80% | 80% | P4 - Already strong |
| 11. Guarantee Compliance | 0% | 0% | P3 - Need refund tracking |
| 12. Why We Win/Lose | 0% | **60%** ⬆️ | P3 - Data capture built! |
| 13. Retention/Churn | 0% | 0% | **P1** - For continuity offers |
| 14. Cash Flow Projector | 10% | 10% | P2 - Extend pipeline calcs |
| 15. Onboarding Predictor | 0% | 0% | P4 - Requires product usage data |
| **NEW: Daily Priorities** | - | **100%** | ✅ Complete |
| **NEW: Activity Logging** | - | **100%** | ✅ Complete |
| **NEW: AI Talking Points** | - | **100%** | ✅ Complete |
| **NEW: Push Notifications** | - | **100%** | ✅ Complete |

### Recommended Build Order

**Phase 1: Data Capture (Foundation)**
1. Add "Lost Reason" field when moving deal to Lost (#5, #12)
2. Add "Why They Bought" field when moving to Won (#12)
3. Add timestamps per stage transition for velocity tracking (#7)

**Phase 2: Customer Journey**
4. Ascension Engine - visualize value ladder per customer (#6)
5. Upsell/downsell/continuity triggers (#6)
6. Win-back sequences for churned (#13)

**Phase 3: Insights & Alerts**
7. LTV Dashboard as main view (#1)
8. Objection pattern analysis (#5)
9. Velocity red flags (#7)

**Phase 4: Advanced**
10. Referral system (#9)
11. Cash flow projector (#14)
12. A/B testing lab (#8)

---

## Phase 1: Data Capture Foundation

**Timeline estimate:** Foundation for everything else
**Impact:** Enables all future analytics and automation

### 1.1 Lost Deal Reasons

**What it does:**
When a deal moves to "Lost", user MUST capture why. This data feeds objection intelligence and offer improvements.

**User Flow:**
```
User clicks "Lost" on deal
    ↓
Modal appears: "Why did this deal not close?"
    ↓
Required: Select primary reason (dropdown)
    - Price too high
    - Bad timing
    - Chose competitor
    - Spouse/partner objection
    - No budget
    - No authority (not decision maker)
    - Lost interest
    - Couldn't deliver what they needed
    - Other (requires text)
    ↓
Optional: Secondary reason (dropdown)
    ↓
Optional: Notes (textarea)
    "What could we have done differently?"
    ↓
Optional: Competitor name (if "Chose competitor")
    ↓
[Save & Close Deal]
```

**UI Design:**
```
┌─────────────────────────────────────────────────┐
│  ❌ Deal Lost                                    │
│                                                 │
│  Why didn't Sarah close?                        │
│                                                 │
│  Primary Reason *                               │
│  ┌─────────────────────────────────────────┐   │
│  │ Price too high                      ▼   │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  Secondary Reason (optional)                    │
│  ┌─────────────────────────────────────────┐   │
│  │ Select...                           ▼   │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  What could we have done differently?           │
│  ┌─────────────────────────────────────────┐   │
│  │                                         │   │
│  │                                         │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ┌─────────┐  ┌─────────────────────────────┐  │
│  │ Cancel  │  │ Save & Mark Lost            │  │
│  └─────────┘  └─────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

**Database Changes:**
```sql
-- Add columns to sales_deals table
ALTER TABLE sales_deals ADD COLUMN IF NOT EXISTS
  lost_reason_primary TEXT,
  lost_reason_secondary TEXT,
  lost_reason_notes TEXT,
  lost_competitor_name TEXT,
  lost_at TIMESTAMP WITH TIME ZONE;

-- Create enum for lost reasons (for validation)
-- Store as TEXT for flexibility, validate in app
```

**Files to Modify:**
- `src/pages/crm/CRMSales.jsx` - Add LostReasonModal trigger
- `src/pages/crm/CRMSales.css` - Modal styles
- `src/lib/crm/dealService.js` - Add `markDealLost()` function

**Files to Create:**
- `src/components/crm/LostReasonModal.jsx` - The modal component
- `src/components/crm/LostReasonModal.css` - Modal styles

**Implementation Steps:**
1. Create migration for new columns
2. Create LostReasonModal component
3. Modify `handleMoveStage()` to intercept "lost" transitions
4. Show modal, require primary reason
5. Save reason data with deal update
6. Update lost deals display to show reason

---

### 1.2 Won Deal Insights

**What it does:**
When a deal moves to "Won", capture what made them buy. This feeds sales training and marketing messaging.

**User Flow:**
```
User clicks "Won" on deal
    ↓
Celebration modal: "🎉 Deal Won!"
    ↓
Required: What made them buy? (multi-select chips)
    - Speed to results
    - Price/value
    - Your expertise/credibility
    - Testimonials/proof
    - Guarantee
    - Referral/trust transfer
    - Urgency/timing
    - Bonuses
    - Other
    ↓
Optional: What almost killed the deal? (multi-select)
    - Price objection
    - Timing concerns
    - Spouse/partner
    - Competitor comparison
    - Trust concerns
    - Nothing - smooth sale
    ↓
Optional: Testimonial capture
    "Would they give a testimonial? Capture a quick quote:"
    ↓
Optional: Referral potential (1-5 stars)
    "How likely to refer others?"
    ↓
[Celebrate & Close]
```

**UI Design:**
```
┌─────────────────────────────────────────────────┐
│  🎉 Deal Won! $4,997                            │
│                                                 │
│  What made Sarah buy? (select all that apply)   │
│                                                 │
│  ┌──────────────┐ ┌──────────────┐ ┌─────────┐ │
│  │ ✓ Speed     │ │   Price      │ │ Proof   │ │
│  └──────────────┘ └──────────────┘ └─────────┘ │
│  ┌──────────────┐ ┌──────────────┐ ┌─────────┐ │
│  │   Guarantee  │ │ ✓ Referral  │ │ Bonuses │ │
│  └──────────────┘ └──────────────┘ └─────────┘ │
│                                                 │
│  What almost killed the deal?                   │
│  ┌──────────────┐ ┌──────────────┐             │
│  │ ✓ Price     │ │   Timing     │             │
│  └──────────────┘ └──────────────┘             │
│                                                 │
│  Quick testimonial? (optional)                  │
│  ┌─────────────────────────────────────────┐   │
│  │ "I loved how fast I got results..."     │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  Referral potential: ⭐⭐⭐⭐☆                    │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │        🎊 Celebrate & Close              │   │
│  └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

**Database Changes:**
```sql
ALTER TABLE sales_deals ADD COLUMN IF NOT EXISTS
  won_reasons TEXT[], -- Array of reasons
  won_obstacles TEXT[], -- What almost killed it
  won_testimonial TEXT,
  won_referral_potential INTEGER, -- 1-5
  won_at TIMESTAMP WITH TIME ZONE;
```

**Files to Modify:**
- `src/pages/crm/CRMSales.jsx` - Add WonInsightsModal trigger
- `src/lib/crm/dealService.js` - Add `markDealWon()` function

**Files to Create:**
- `src/components/crm/WonInsightsModal.jsx`
- `src/components/crm/WonInsightsModal.css`

**Implementation Steps:**
1. Create migration for new columns
2. Create WonInsightsModal component with multi-select chips
3. Modify `handleMoveStage()` to intercept "won" transitions
4. Save insights with deal update
5. Add confetti animation for celebration

---

### 1.3 Stage Transition Timestamps

**What it does:**
Track exactly WHEN each deal moved through stages. Enables velocity tracking, bottleneck identification, and speed alerts.

**Data Captured:**
```javascript
// New field on sales_deals
stage_history: [
  { stage: 'lead', entered_at: '2026-01-01T10:00:00Z', exited_at: '2026-01-02T14:30:00Z' },
  { stage: 'discovery', entered_at: '2026-01-02T14:30:00Z', exited_at: '2026-01-05T09:00:00Z' },
  { stage: 'proposal', entered_at: '2026-01-05T09:00:00Z', exited_at: null },
]
```

**Calculated Metrics:**
- Time in each stage (hours/days)
- Total cycle time (lead → won)
- Average time per stage (across all deals)
- Bottleneck identification (which stage takes longest)

**UI Enhancement (Deal Card):**
```
┌─────────────────────────────────────┐
│  Sarah Johnson           🔥 Hot     │
│  Core Offer - $4,997               │
│  ─────────────────────────────────  │
│  ⏱️ 3 days in Discovery            │
│  📊 Avg: 2 days (1 day slower)     │
└─────────────────────────────────────┘
```

**Database Changes:**
```sql
ALTER TABLE sales_deals ADD COLUMN IF NOT EXISTS
  stage_history JSONB DEFAULT '[]'::jsonb,
  current_stage_entered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- For quick queries on current stage duration
CREATE INDEX idx_deals_stage_duration
ON sales_deals (user_id, status, current_stage_entered_at);
```

**Files to Modify:**
- `src/lib/crm/dealService.js`:
  - Modify `createDeal()` to initialize stage_history
  - Modify `updateDealStage()` to append to stage_history
  - Add `calculateStageDuration()` helper
  - Add `getAverageStageDuration()` for benchmarking
- `src/pages/crm/CRMSales.jsx` - Display time in stage on cards

**Implementation Steps:**
1. Create migration for new columns
2. Update `createDeal()` to set initial stage_history entry
3. Update `updateDealStage()` to:
   - Close current stage (set exited_at)
   - Open new stage (add new entry)
   - Update current_stage_entered_at
4. Add duration display to deal cards
5. Add "slower than average" warning indicator

---

### 1.4 Enhanced Deal Qualification Fields

**What it does:**
Extend lead scoring with deeper qualification data that Hormozi emphasizes.

**New Fields:**
```javascript
// Additional qualification beyond PTUF scores
{
  // Budget & Authority
  budget_confirmed: boolean,      // Have they confirmed budget?
  budget_amount: number,          // What's their stated budget?
  is_decision_maker: boolean,     // Can they say yes alone?
  decision_maker_name: string,    // If not, who is?

  // Problem Depth
  solutions_tried: string[],      // What have they already tried?
  money_spent_on_problem: number, // How much spent trying to solve?
  problem_duration: string,       // How long have they had this problem?

  // Timeline
  desired_start_date: date,       // When do they want to begin?
  deadline_reason: string,        // Why that timeline?

  // Fit Assessment
  success_probability: number,    // 1-10: Can we actually help them?
  red_flags: string[],            // Any concerns about this deal?
}
```

**UI Enhancement (Deal Detail Modal):**
Add collapsible "Qualification" section below lead scores:

```
┌─────────────────────────────────────────────────┐
│  📋 Qualification Details                    ▼  │
├─────────────────────────────────────────────────┤
│                                                 │
│  Budget & Authority                             │
│  ┌─────────────────┐  ┌─────────────────────┐  │
│  │ Budget: $5,000  │  │ ✓ Decision Maker    │  │
│  └─────────────────┘  └─────────────────────┘  │
│                                                 │
│  Problem History                                │
│  What have they tried?                          │
│  ┌─────────────────────────────────────────┐   │
│  │ ☑ DIY courses  ☑ Coaching  ☐ Agency    │   │
│  └─────────────────────────────────────────┘   │
│  Money spent on problem: $______               │
│                                                 │
│  Timeline                                       │
│  Want to start: [Date Picker]                  │
│  Why this timeline? _______________            │
│                                                 │
│  Fit Assessment                                 │
│  Can we help them succeed? ████████░░ 8/10    │
│  Red flags: [+ Add flag]                       │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Database Changes:**
```sql
ALTER TABLE sales_deals ADD COLUMN IF NOT EXISTS
  -- Budget & Authority
  budget_confirmed BOOLEAN DEFAULT false,
  budget_amount INTEGER,
  is_decision_maker BOOLEAN DEFAULT true,
  decision_maker_name TEXT,

  -- Problem Depth
  solutions_tried TEXT[],
  money_spent_on_problem INTEGER,
  problem_duration TEXT,

  -- Timeline
  desired_start_date DATE,
  deadline_reason TEXT,

  -- Fit Assessment
  success_probability INTEGER,
  red_flags TEXT[];
```

**Files to Modify:**
- `src/components/crm/LeadScoreSliders.jsx` - Add qualification section
- `src/pages/crm/CRMSales.jsx` - Handle new fields in deal modal
- `src/lib/crm/dealService.js` - Update deal CRUD for new fields

**Implementation Steps:**
1. Create migration for new columns
2. Add collapsible "Qualification" section to deal detail modal
3. Create input components for each field type
4. Update `updateDeal()` to save qualification data
5. Add visual indicators for qualification completeness

---

## Phase 2: Customer Journey & Ascension

**Timeline estimate:** After Phase 1 foundation
**Impact:** Unlocks systematic revenue maximization per customer

### 2.1 Ascension Engine: Value Ladder Visualization

**What it does:**
Shows each customer's journey through your offer stack. Identifies where people get stuck and automates ascension triggers.

**Concept:**
```
VALUE LADDER VIEW

                    ┌─────────────────┐
                    │  Continuity     │  $97/mo
                    │  2 customers    │
                    └────────┬────────┘
                             │ 15% ascend
              ┌──────────────┴──────────────┐
              │                             │
    ┌─────────┴─────────┐       ┌──────────┴──────────┐
    │  VIP Package      │       │  Core Offer         │
    │  $1,997           │       │  $497               │
    │  3 customers      │       │  12 customers       │
    └─────────┬─────────┘       └──────────┬──────────┘
              │                             │
              └──────────────┬──────────────┘
                             │ 25% ascend from below
              ┌──────────────┴──────────────┐
              │      Attraction Offer       │
              │      $47                    │
              │      45 customers           │
              └──────────────┬──────────────┘
                             │ 8% convert
              ┌──────────────┴──────────────┐
              │        Lead Magnet          │
              │        Free                 │
              │        520 leads            │
              └─────────────────────────────┘
```

**Customer Journey View (per person):**
```
SARAH JOHNSON - Customer Journey

┌─────────────────────────────────────────────────────────────┐
│  Lead Magnet    →    Attraction    →    Core Offer          │
│  Jan 1, 2026         Jan 5, 2026        Jan 12, 2026        │
│  ✓ Downloaded        ✓ Purchased        ✓ Purchased         │
│                      $47                $497                 │
├─────────────────────────────────────────────────────────────┤
│  📊 LTV: $544    ⏱️ Time to core: 12 days    🎯 Next: VIP   │
├─────────────────────────────────────────────────────────────┤
│  SUGGESTED ACTION:                                          │
│  Sarah bought Core Offer 45 days ago. Trigger VIP upsell?   │
│  [Send Upsell Sequence]  [Not Yet]  [Mark Not Interested]   │
└─────────────────────────────────────────────────────────────┘
```

**Database Changes:**
```sql
-- Customer purchases table (separate from deals - tracks actual purchases)
CREATE TABLE IF NOT EXISTS customer_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  product_type TEXT NOT NULL, -- 'lead_magnet', 'attraction', 'core', 'upsell', 'continuity'
  product_name TEXT,
  amount INTEGER DEFAULT 0,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  source_deal_id UUID REFERENCES sales_deals(id),

  -- For continuity tracking
  is_subscription BOOLEAN DEFAULT false,
  subscription_status TEXT, -- 'active', 'paused', 'cancelled'
  next_billing_date DATE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for customer journey queries
CREATE INDEX idx_purchases_customer ON customer_purchases(user_id, customer_email, purchased_at);

-- Ascension triggers table
CREATE TABLE IF NOT EXISTS ascension_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  from_product TEXT NOT NULL,
  to_product TEXT NOT NULL,
  trigger_days INTEGER NOT NULL, -- Days after purchase to trigger
  trigger_type TEXT DEFAULT 'email', -- 'email', 'task', 'notification'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Track which triggers have fired
CREATE TABLE IF NOT EXISTS ascension_trigger_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_id UUID REFERENCES ascension_triggers(id),
  customer_email TEXT NOT NULL,
  triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'converted', 'declined'
  converted_at TIMESTAMP WITH TIME ZONE
);
```

**Files to Create:**
- `src/pages/crm/AscensionEngine.jsx` - Main value ladder page
- `src/pages/crm/AscensionEngine.css`
- `src/components/crm/ValueLadderChart.jsx` - Visualization component
- `src/components/crm/CustomerJourneyCard.jsx` - Per-customer view
- `src/components/crm/AscensionTriggerSetup.jsx` - Configure triggers
- `src/lib/crm/ascensionService.js` - Data fetching & trigger logic

**Route:**
`/crm/ascension` → AscensionEngine

**Implementation Steps:**
1. Create database tables and migrations
2. Build ValueLadderChart visualization
3. Build CustomerJourneyCard component
4. Create ascension trigger configuration UI
5. Build trigger checking logic (runs on deal close)
6. Add "Ascension" link to CRM navigation

---

### 2.2 Automatic Ascension Triggers

**What it does:**
When configured conditions are met, automatically creates tasks or sends notifications to upsell customers.

**Trigger Configuration UI:**
```
┌─────────────────────────────────────────────────────────────┐
│  ⚙️ Ascension Triggers                                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  TRIGGER 1: Core → VIP Upsell                    [Active]   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ When: Customer buys "Core Offer"                    │   │
│  │ Wait: 30 days                                       │   │
│  │ Action: Create marketing task "Send VIP upsell"     │   │
│  │ Script: Use "Upsell - VIP Package" script           │   │
│  └─────────────────────────────────────────────────────┘   │
│  [Edit] [Disable] [Delete]                                  │
│                                                             │
│  TRIGGER 2: Attraction → Core Follow-up          [Active]   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ When: Customer buys "Attraction Offer"              │   │
│  │ Wait: 7 days                                        │   │
│  │ Action: Create marketing task "Core offer pitch"    │   │
│  │ Script: Use "Upsell - Core Offer" script            │   │
│  └─────────────────────────────────────────────────────┘   │
│  [Edit] [Disable] [Delete]                                  │
│                                                             │
│  [+ Add New Trigger]                                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**When Trigger Fires:**
- Creates a marketing task with suggested script
- Shows in Smart Alerts: "Sarah is ready for VIP upsell"
- Optionally sends push notification

**Files to Modify:**
- `src/pages/crm/SmartAlerts.jsx` - Add ascension alerts
- `src/lib/crm/taskService.js` - Add `createAscensionTask()`

**Files to Create:**
- `src/components/crm/AscensionTriggerSetup.jsx`
- `src/lib/crm/ascensionService.js`

---

### 2.3 Continuity & Churn Tracking

**What it does:**
For subscription/continuity offers, track retention and predict churn.

**Continuity Dashboard:**
```
┌─────────────────────────────────────────────────────────────┐
│  📊 Continuity Health                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ACTIVE SUBSCRIBERS: 23        MRR: $2,231                  │
│                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ Retention   │ │ Avg Months  │ │ Churn Rate  │           │
│  │    87%      │ │    4.2      │ │   13%/mo    │           │
│  │  ↑ 3%       │ │  ↑ 0.5      │ │  ↓ 2%       │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
│                                                             │
│  AT RISK (no engagement 14+ days):                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🔴 Mike T. - 21 days inactive - $97/mo              │   │
│  │    [Send Check-in]  [View History]                  │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ 🟡 Sarah J. - 16 days inactive - $97/mo             │   │
│  │    [Send Check-in]  [View History]                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  RECENT CHURN:                                              │
│  • John D. cancelled Jan 3 - Reason: "Too busy"            │
│  • Lisa M. cancelled Dec 28 - Reason: "Got what I needed"  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Churn Reason Capture (when customer cancels):**
- Too expensive
- Not using it enough
- Got what I needed
- Found alternative
- Bad experience
- Other

**Database Changes:**
```sql
-- Add to customer_purchases for subscriptions
ALTER TABLE customer_purchases ADD COLUMN IF NOT EXISTS
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancel_reason TEXT,
  cancel_feedback TEXT,
  months_subscribed INTEGER;

-- Churn tracking table
CREATE TABLE IF NOT EXISTS churn_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  customer_email TEXT NOT NULL,
  product_name TEXT,
  mrr_lost INTEGER,
  reason TEXT,
  feedback TEXT,
  months_before_churn INTEGER,
  churned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Files to Create:**
- `src/pages/crm/ContinuityDashboard.jsx`
- `src/pages/crm/ContinuityDashboard.css`
- `src/components/crm/ChurnReasonModal.jsx`
- `src/lib/crm/continuityService.js`

**Route:**
`/crm/continuity` → ContinuityDashboard

---

### 2.4 Referral System

**What it does:**
Systematically capture and track referrals. Know who your best referrers are and their referred customer LTV.

**Referral Tracking UI:**
```
┌─────────────────────────────────────────────────────────────┐
│  🗣️ Referral Center                                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  REFERRAL STATS                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ Total       │ │ Referred    │ │ Avg LTV     │           │
│  │ Referrals   │ │ Revenue     │ │ (Referred)  │           │
│  │    34       │ │  $12,450    │ │   $892      │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
│                                                             │
│  TOP REFERRERS                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🥇 Sarah J.     8 referrals    $3,200 revenue       │   │
│  │ 🥈 Mike T.      5 referrals    $1,850 revenue       │   │
│  │ 🥉 John D.      4 referrals    $1,400 revenue       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  PENDING REFERRAL ASKS                                      │
│  These customers are due for a referral request:            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Lisa M. - Won 30 days ago - Referral potential: ⭐⭐⭐⭐⭐│   │
│  │ [Send Referral Request]  [Skip]  [Already Asked]    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Database Changes:**
```sql
-- Referral tracking
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  referrer_email TEXT NOT NULL,
  referrer_name TEXT,
  referred_email TEXT NOT NULL,
  referred_name TEXT,
  referred_deal_id UUID REFERENCES sales_deals(id),
  status TEXT DEFAULT 'pending', -- 'pending', 'converted', 'lost'
  referred_revenue INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  converted_at TIMESTAMP WITH TIME ZONE
);

-- Track referral asks
CREATE TABLE IF NOT EXISTS referral_asks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  customer_email TEXT NOT NULL,
  asked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  response TEXT, -- 'provided', 'declined', 'no_response'
  referrals_given INTEGER DEFAULT 0
);
```

**Enhancement to Deal Creation:**
When source = "Referral", show additional field:
- "Who referred them?" (searchable dropdown of existing customers)

**Files to Create:**
- `src/pages/crm/ReferralCenter.jsx`
- `src/pages/crm/ReferralCenter.css`
- `src/lib/crm/referralService.js`

**Route:**
`/crm/referrals` → ReferralCenter

---

## Phase 3: Insights & Intelligence

**Timeline estimate:** After Phase 2 data is flowing
**Impact:** Turn data into actionable decisions

### 3.1 LTV Dashboard (Main View)

**What it does:**
Makes LTV the FIRST thing you see. Shows LTV by customer segment, cohort, and product.

**Dashboard Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  💎 LIFETIME VALUE COMMAND CENTER                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  YOUR NUMBERS                                               │
│  ┌─────────────────┐ ┌─────────────────┐ ┌───────────────┐ │
│  │ Avg LTV         │ │ LTV:CAC Ratio   │ │ Breakeven     │ │
│  │ $892            │ │ 4.2:1 ✅        │ │ 45 days       │ │
│  │ ↑ 12% vs last mo│ │ Target: 3:1     │ │ ↓ 8 days      │ │
│  └─────────────────┘ └─────────────────┘ └───────────────┘ │
│                                                             │
│  LTV BY PRODUCT                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Core Offer        ████████████████████  $1,240      │   │
│  │ VIP Package       ██████████████████████████ $2,890 │   │
│  │ Attraction Only   ████  $47                         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  LTV BY SOURCE                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Referral          ██████████████████████████ $1,450 │   │
│  │ Organic           ████████████████  $890            │   │
│  │ Paid Ads          ██████████  $520                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  💡 INSIGHT: Referral customers have 2.8x higher LTV than  │
│     paid ads. Consider increasing referral incentives.      │
│                                                             │
│  COHORT ANALYSIS (Monthly)                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Cohort    │ Customers │ Mo 1  │ Mo 3  │ Mo 6  │ LTV │   │
│  ├───────────┼───────────┼───────┼───────┼───────┼─────┤   │
│  │ Jan 2026  │    45     │ $450  │ $620  │  -    │ $620│   │
│  │ Dec 2025  │    38     │ $480  │ $710  │ $890  │ $890│   │
│  │ Nov 2025  │    42     │ $420  │ $680  │ $820  │ $950│   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Files to Create:**
- `src/pages/crm/LTVDashboard.jsx` - New main LTV view
- `src/pages/crm/LTVDashboard.css`
- `src/lib/crm/ltvAnalytics.js` - LTV calculation functions

**Make it the Default:**
Option to set `/crm/ltv-dashboard` as default CRM landing page instead of `/crm`

---

### 3.2 Objection Intelligence

**What it does:**
Analyzes lost deal reasons to find patterns and suggest improvements.

**Intelligence Dashboard:**
```
┌─────────────────────────────────────────────────────────────┐
│  🧠 OBJECTION INTELLIGENCE                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  LOST DEAL ANALYSIS (Last 90 days)                          │
│  Total Lost: 23 deals ($45,200 potential revenue)           │
│                                                             │
│  TOP OBJECTIONS                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🔴 Price too high          43%  ██████████████████  │   │
│  │ 🟡 Bad timing              22%  █████████           │   │
│  │ 🟡 Chose competitor        17%  ███████             │   │
│  │ 🟢 Spouse objection         9%  ████                │   │
│  │ ⚪ Other                    9%  ████                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  💡 AI INSIGHTS                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ • Price objections highest in $2K-$5K range         │   │
│  │   → Consider payment plan or lower entry offer      │   │
│  │                                                     │   │
│  │ • "Competitor" losses mention [Competitor X] 70%    │   │
│  │   → Create comparison page addressing differences   │   │
│  │                                                     │   │
│  │ • Timing objections peak in Q1 (budget cycles)      │   │
│  │   → Offer Q1 early-bird pricing in December         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  REBUTTAL SCRIPTS                                           │
│  Based on your top objections, use these scripts:           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ "Price too high" → [View Script] [Copy]             │   │
│  │ "Bad timing" → [View Script] [Copy]                 │   │
│  │ "Competitor" → [View Script] [Copy]                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**AI Analysis (Edge Function):**
```javascript
// Prompt for objection analysis
const prompt = `
Analyze these lost deal reasons and provide insights:

Lost deals data:
${JSON.stringify(lostDeals)}

Provide:
1. Pattern identification (what's most common and when)
2. Root cause hypothesis (why these objections occur)
3. Specific, actionable recommendations
4. Script suggestions for top 3 objections

Format as JSON with keys: patterns, root_causes, recommendations, scripts
`
```

**Files to Create:**
- `src/pages/crm/ObjectionIntelligence.jsx`
- `src/pages/crm/ObjectionIntelligence.css`
- `src/lib/crm/objectionAnalytics.js`
- `supabase/functions/analyze-objections/index.ts` - AI analysis

**Route:**
`/crm/objections` → ObjectionIntelligence

---

### 3.3 Velocity Tracker & Alerts

**What it does:**
Shows deal speed through pipeline and alerts when things slow down.

**Velocity Dashboard:**
```
┌─────────────────────────────────────────────────────────────┐
│  ⚡ DEAL VELOCITY                                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  AVERAGE TIME PER STAGE                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Lead → Discovery      2.3 days   ████████           │   │
│  │ Discovery → Proposal  4.1 days   █████████████      │   │
│  │ Proposal → Close      3.2 days   ██████████         │   │
│  │ ─────────────────────────────────────────────────   │   │
│  │ Total Cycle Time      9.6 days                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  TREND (vs last month)                                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Lead → Discovery      ↓ 0.5 days faster  ✅         │   │
│  │ Discovery → Proposal  ↑ 1.2 days slower  ⚠️         │   │
│  │ Proposal → Close      ↔ No change                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  🚨 STALE DEALS (exceeding average)                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🔴 Sarah J. - Discovery - 8 days (avg: 4.1)         │   │
│  │    [Move to Proposal]  [Add Note]  [Mark Lost]      │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ 🟡 Mike T. - Proposal - 5 days (avg: 3.2)           │   │
│  │    [Close Deal]  [Add Note]  [Follow Up]            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  💡 INSIGHT: Discovery stage is your bottleneck.            │
│     Consider: More discovery call slots? Better scripts?    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Smart Alerts Integration:**
Add to existing SmartAlerts.jsx:
- "Deal X is 2x slower than average in Discovery"
- "Your overall cycle time increased 15% this month"
- "3 deals stale in Proposal stage"

**Files to Create:**
- `src/pages/crm/VelocityTracker.jsx`
- `src/pages/crm/VelocityTracker.css`
- `src/lib/crm/velocityService.js`

**Files to Modify:**
- `src/pages/crm/SmartAlerts.jsx` - Add velocity alerts

**Route:**
`/crm/velocity` → VelocityTracker

---

### 3.4 Win/Loss Analysis

**What it does:**
Aggregates won deal insights to identify what's working. Shows patterns in successful sales.

**Analysis Dashboard:**
```
┌─────────────────────────────────────────────────────────────┐
│  🏆 WHY WE WIN                                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  TOP BUYING TRIGGERS (from won deals)                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Speed to results      67%  ████████████████████████ │   │
│  │ Your expertise        52%  ██████████████████       │   │
│  │ Testimonials/proof    48%  ████████████████         │   │
│  │ Referral trust        35%  ████████████             │   │
│  │ Guarantee             28%  █████████                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  💡 INSIGHT: Lead with SPEED in your sales conversations.   │
│     67% of buyers cited it as a reason for purchasing.      │
│                                                             │
│  WHAT ALMOST KILLED DEALS (but we recovered)                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Price objection       45%  - We overcame this       │   │
│  │ Timing concerns       23%  - Created urgency        │   │
│  │ Spouse discussion     18%  - Brought them on call   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  RECENT TESTIMONIALS CAPTURED                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ "I loved how fast I got results..." - Sarah J.      │   │
│  │ "The support was incredible..." - Mike T.           │   │
│  │ [View All Testimonials]  [Export for Marketing]     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Files to Create:**
- `src/pages/crm/WinLossAnalysis.jsx`
- `src/pages/crm/WinLossAnalysis.css`
- `src/lib/crm/winLossService.js`

**Route:**
`/crm/win-loss` → WinLossAnalysis

---

## Phase 4: Advanced Features

**Timeline estimate:** After core system is stable
**Impact:** Power user features and automation

### 4.1 Cash Flow Projector

**What it does:**
90-day cash flow forecast based on pipeline, close rates, and payment terms.

**Projection View:**
```
┌─────────────────────────────────────────────────────────────┐
│  💵 CASH FLOW PROJECTION                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  90-DAY FORECAST                                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │  $40K ┤                              ╭────          │   │
│  │       │                         ╭────╯              │   │
│  │  $30K ┤                    ╭────╯                   │   │
│  │       │               ╭────╯                        │   │
│  │  $20K ┤          ╭────╯                             │   │
│  │       │     ╭────╯                                  │   │
│  │  $10K ┤╭────╯                                       │   │
│  │       └────┬────┬────┬────┬────┬────┬────┬────┬──  │   │
│  │           Jan   Feb   Mar                           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  PROJECTIONS                                                │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ Best Case   │ │ Expected    │ │ Worst Case  │           │
│  │ $45,200     │ │ $32,800     │ │ $18,400     │           │
│  │ (80% close) │ │ (55% close) │ │ (30% close) │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
│                                                             │
│  BASED ON:                                                  │
│  • Current pipeline: $58,000 (12 deals)                    │
│  • Historical close rate: 55%                              │
│  • Average time to close: 14 days                          │
│  • MRR from continuity: $2,100/mo                          │
│                                                             │
│  ⚠️ WARNING: At worst case, you need 2 more closes to      │
│     cover projected expenses of $22,000/month.              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Files to Create:**
- `src/pages/crm/CashFlowProjector.jsx`
- `src/pages/crm/CashFlowProjector.css`
- `src/lib/crm/cashFlowService.js`

**Route:**
`/crm/cashflow` → CashFlowProjector

---

### 4.2 Offer Testing Lab

**What it does:**
A/B test different offer elements and track which performs better.

**Test Configuration:**
```
┌─────────────────────────────────────────────────────────────┐
│  🧪 OFFER TESTING LAB                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ACTIVE TEST: Core Offer Pricing                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Variant A: $497 (current)    Variant B: $397        │   │
│  │ ─────────────────────────────────────────────────   │   │
│  │ Leads:      45                Leads:      48        │   │
│  │ Closes:     12 (27%)          Closes:     18 (38%)  │   │
│  │ Revenue:    $5,964            Revenue:    $7,146    │   │
│  │ ─────────────────────────────────────────────────   │   │
│  │ Winner: Variant B (+$1,182 revenue, +11% close rate)│   │
│  │ Confidence: 87% (need 95% to declare)               │   │
│  └─────────────────────────────────────────────────────┘   │
│  [End Test & Use Winner]  [Continue Testing]               │
│                                                             │
│  PAST TESTS                                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ✅ Guarantee Test - 60-day beat 30-day by 23%       │   │
│  │ ✅ Bonus Test - PDF + Video beat PDF-only by 15%    │   │
│  │ ❌ Price Test - $997 lost to $497 by 40%            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [+ Start New Test]                                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Database Changes:**
```sql
CREATE TABLE IF NOT EXISTS offer_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  test_name TEXT NOT NULL,
  test_type TEXT, -- 'price', 'guarantee', 'bonus', 'script', 'other'
  variant_a_name TEXT,
  variant_a_value TEXT,
  variant_b_name TEXT,
  variant_b_value TEXT,
  status TEXT DEFAULT 'active', -- 'active', 'completed', 'cancelled'
  winner TEXT, -- 'a', 'b', 'tie'
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS offer_test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID REFERENCES offer_tests(id),
  variant TEXT NOT NULL, -- 'a' or 'b'
  deal_id UUID REFERENCES sales_deals(id),
  outcome TEXT, -- 'won', 'lost'
  revenue INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Files to Create:**
- `src/pages/crm/OfferTestingLab.jsx`
- `src/pages/crm/OfferTestingLab.css`
- `src/lib/crm/testingService.js`

**Route:**
`/crm/testing` → OfferTestingLab

---

### 4.3 Guarantee Compliance Tracker

**What it does:**
Tracks refund rates and guarantee compliance by offer.

**Dashboard:**
```
┌─────────────────────────────────────────────────────────────┐
│  🛡️ GUARANTEE COMPLIANCE                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  REFUND RATES BY OFFER                                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Core Offer ($497)     3.2%  ████  ✅ Healthy        │   │
│  │ VIP Package ($1,997)  8.1%  ████████  ⚠️ Monitor    │   │
│  │ Continuity ($97/mo)   12%   ████████████  🔴 High   │   │
│  └─────────────────────────────────────────────────────┘   │
│  Industry average: 5-8%                                     │
│                                                             │
│  REFUND REASONS (Last 90 days)                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Didn't use it         45%  - Onboarding issue?      │   │
│  │ Didn't get results    30%  - Product issue?         │   │
│  │ Changed mind          15%  - Sales issue?           │   │
│  │ Financial hardship    10%  - Screening issue?       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  💡 INSIGHT: "Didn't use it" is #1 reason. Consider:        │
│     - Stronger onboarding sequence                          │
│     - Check-in call at day 3                                │
│     - Usage-based guarantee triggers                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Database Changes:**
```sql
CREATE TABLE IF NOT EXISTS refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  customer_email TEXT NOT NULL,
  product_name TEXT,
  amount INTEGER,
  original_purchase_date DATE,
  refund_date DATE DEFAULT CURRENT_DATE,
  days_before_refund INTEGER,
  reason TEXT,
  feedback TEXT,
  deal_id UUID REFERENCES sales_deals(id)
);
```

**Files to Create:**
- `src/pages/crm/GuaranteeTracker.jsx`
- `src/pages/crm/GuaranteeTracker.css`
- `src/lib/crm/guaranteeService.js`

**Route:**
`/crm/guarantees` → GuaranteeTracker

---

## Navigation Update

After all phases, the CRM navigation would be:

**Main CRM Toolbar:**
```
Sales | Marketing | Analytics | LTV
```

**CRM Dashboard Quick Access Grid:**
```
┌─────────────────────────────────────────────────────────────┐
│  COMMAND CENTER                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  CORE                          INTELLIGENCE                 │
│  ┌─────────┐ ┌─────────┐      ┌─────────┐ ┌─────────┐      │
│  │ 💰      │ │ 📣      │      │ 💎      │ │ 🧠      │      │
│  │ Sales   │ │Marketing│      │ LTV     │ │Objections│     │
│  └─────────┘ └─────────┘      └─────────┘ └─────────┘      │
│  ┌─────────┐ ┌─────────┐      ┌─────────┐ ┌─────────┐      │
│  │ 📊      │ │ 🔔      │      │ ⚡      │ │ 🏆      │      │
│  │Analytics│ │ Alerts  │      │Velocity │ │Win/Loss │      │
│  └─────────┘ └─────────┘      └─────────┘ └─────────┘      │
│                                                             │
│  GROWTH                        TOOLS                        │
│  ┌─────────┐ ┌─────────┐      ┌─────────┐ ┌─────────┐      │
│  │ 🎯      │ │ 🔄      │      │ 🧮      │ │ 📈      │      │
│  │Ascension│ │Continuity│     │ PTUF    │ │ CAC     │      │
│  └─────────┘ └─────────┘      └─────────┘ └─────────┘      │
│  ┌─────────┐ ┌─────────┐      ┌─────────┐ ┌─────────┐      │
│  │ 🗣️      │ │ 💵      │      │ 📜      │ │ 🧪      │      │
│  │Referrals│ │CashFlow │      │ Scripts │ │ Testing │      │
│  └─────────┘ └─────────┘      └─────────┘ └─────────┘      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Checklist

### Phase 1: Data Capture Foundation
- [ ] 1.1 Lost Deal Reasons modal
- [ ] 1.2 Won Deal Insights modal
- [ ] 1.3 Stage transition timestamps
- [ ] 1.4 Enhanced qualification fields
- [ ] Database migrations for all new fields
- [ ] Update CRMSales.jsx to use new modals

### Phase 2: Customer Journey
- [ ] 2.1 Ascension Engine page
- [ ] 2.2 Automatic ascension triggers
- [ ] 2.3 Continuity & churn tracking
- [ ] 2.4 Referral system
- [ ] Database tables for purchases, triggers, referrals

### Phase 3: Insights & Intelligence
- [ ] 3.1 LTV Dashboard (main view)
- [ ] 3.2 Objection Intelligence with AI
- [ ] 3.3 Velocity Tracker & alerts
- [ ] 3.4 Win/Loss Analysis
- [ ] Edge function for objection analysis

### Phase 4: Advanced
- [ ] 4.1 Cash Flow Projector
- [ ] 4.2 Offer Testing Lab
- [ ] 4.3 Guarantee Compliance Tracker

---

## Quick Reference: All Features by Bucket

### 🎯 Execution (To-Do / Reminders)

| Feature | Phase | Effort | Impact |
|---------|-------|--------|--------|
| Follow-up reminders (deal-based) | 2 | Medium | High |
| Stale deal alerts | 2 | Low | High |
| Daily priority list | 2 | Medium | High |
| Ascension trigger tasks | 2 | Medium | High |
| Referral ask reminders | 2 | Low | Medium |
| At-risk customer alerts | 2 | Low | High |
| Stage checklist prompts | 3 | Medium | Medium |
| Cash flow warnings | 4 | Low | Medium |
| Guarantee milestone alerts | 4 | Low | Medium |

### 📊 Tracking / Analysis

| Feature | Phase | Effort | Impact |
|---------|-------|--------|--------|
| Lost deal reasons capture | 1 | Low | **Critical** |
| Won deal insights capture | 1 | Low | **Critical** |
| Stage timestamps | 1 | Low | **Critical** |
| Enhanced qualification fields | 1 | Medium | High |
| Velocity dashboard | 3 | Medium | High |
| Win/Loss analysis | 3 | Medium | High |
| LTV dashboard (main view) | 3 | Medium | High |
| Pipeline health metrics | 3 | Medium | Medium |
| Close rate by source | 3 | Low | High |
| Competitive intelligence | 3 | Medium | Medium |
| Cohort analysis | 3 | High | Medium |
| Forecast accuracy tracking | 4 | Medium | Medium |
| Refund rate tracking | 4 | Medium | Medium |
| Activity volume tracking | 4 | Medium | Medium |

### 🤖 Automation / AI / Templates

| Feature | Phase | Effort | Impact |
|---------|-------|--------|--------|
| Sales scripts | ✅ Done | - | High |
| Smart script suggestions | ✅ Done | - | High |
| AI screenshot analysis | ✅ Done | - | Medium |
| Offer Builder scorecard | ✅ Done | - | High |
| Objection pattern AI analysis | 3 | Medium | High |
| AI-generated rebuttals | 3 | Medium | Medium |
| Automated ascension sequences | 2 | High | High |
| Referral automation | 2 | Medium | Medium |
| Win-back automation | 2 | Medium | Medium |
| A/B test infrastructure | 4 | High | Medium |
| Onboarding predictor | 4 | High | Low |

---

## Questions for Review

Before building, please confirm:

1. **Phase 1 Priority:** Start with Lost Reason modal first, or all Phase 1 together?

2. **Customer Purchases:** Do you already track purchases somewhere, or is `customer_purchases` table new?

3. **Continuity Tracking:** Do you have subscription billing data to pull from, or manual entry only?

4. **AI Analysis:** Use existing Claude integration or create new edge function for objection analysis?

5. **Navigation:** Replace current CRM dashboard with LTV-first view, or add as separate page?

6. **Testing Lab:** Is A/B testing a priority, or can it wait for Phase 4?

7. **Execution Priority:** Given that Execution (to-do/reminders) is the biggest gap (15% vs 55% tracking), should we prioritize this bucket after Phase 1 data capture?

---

---

## NORTH STAR: Tier 4 Autonomous Revenue System

### Vision: AI That Runs Your Sales

The ultimate goal of the Sales Tower is not just tracking and reminders—it's a **fully autonomous system** that implements offers, optimizes conversion, and maximizes revenue with minimal user input.

```
User Experience at Tier 4:

"I gave FindMyFlow access to my business 6 months ago.

Since then, it has:
- Built my entire offer stack (attraction → upsell → downsell → continuity)
- Wrote all my sales scripts and email sequences
- Created and optimized my checkout flows
- Managed my content calendar
- Tracked my funnel and optimized weak points
- Increased my revenue from $5k/mo to $47k/mo

I spend 2 hours/week approving what it suggests.
It runs my business better than I could."
```

### The Four Tiers of Implementation

| Tier | Improvement | What It Does | Status |
|------|-------------|--------------|--------|
| **1** | 20% | Show implementation checklists after flows | Ready to build |
| **2** | 100% | Interactive tracker with progress saving | Ready to build |
| **3** | 1000% | AI coach that generates actual deliverables | Needs data |
| **4** | 1000000% | Fully autonomous revenue system | North Star |

---

### Tier 1: Display Checklists (20% Improvement)

**Implementation:** 1-2 days

When user completes a Money Model flow:
1. Display the implementation checklist for their recommended offer
2. Allow PDF/print export
3. Save recommendation to database

**Files to Modify:**
- `src/flows/MoneyModelFlowBase.jsx` - Add checklist display in results
- Create `src/lib/implementationChecklists.js` - Load checklist JSON data

**Already Built:**
- Implementation checklists for all 19 offer types in `/public/Money Model/*/implementation_checklists.json`

---

### Tier 2: Progress Tracking (100% Improvement)

**Implementation:** 3-5 days

Create dedicated implementation tracker:
- Shows user's recommended offers across all flows
- Tracks checklist completion with checkboxes
- Celebrates milestones
- Integrates with CRM (creates tasks/deals as they progress)

**New Component:** `OfferImplementationTracker.jsx`

**New Route:** `/crm/implementation`

**Database Table:**
```sql
CREATE TABLE offer_implementations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  offer_type TEXT NOT NULL,
  category TEXT NOT NULL,
  flow_assessment_id UUID,
  status TEXT DEFAULT 'not_started',
  completed_tasks JSONB DEFAULT '[]',
  current_phase TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

### Tier 3: AI Implementation Coach (1000% Improvement)

**Implementation:** 2-3 weeks

Transform static checklists into dynamic, AI-assisted implementation:

**Feature 1: Zarlo Implementation Mode**
```
User: "I'm ready to implement the Classic Upsell"

Zarlo: "Let's do this! Phase 1 is 'Offer Selection'.

Based on your Nikigai data, your core offer is [X].
Here are 3 complementary products that could work as upsells:
1. [Generated suggestion based on their data]
2. [Generated suggestion]
3. [Generated suggestion]

Which resonates most?"
```

**Feature 2: Auto-Generate Artifacts**

| Task | AI Generates |
|------|--------------|
| "Write headline that creates FOMO" | 5 headline options |
| "Create payment schedule templates" | Actual templates for their prices |
| "Write Day 0 Welcome Email" | Full email in their voice |
| "Script the conversation flow" | Complete sales script |

**Feature 3: Progress-Triggered Automations**
```javascript
// When user completes "Email Sequence" phase
if (completedPhase === 'Email Sequence') {
  await createMarketingTasks(user.id, generatedEmails)
  showNotification("Your email sequence is in Marketing Queue!")
}
```

---

### Tier 4: Autonomous Revenue Engine (1000000% Improvement)

**Implementation:** Ongoing evolution

Multi-agent system that fully orchestrates revenue optimization:

```
┌─────────────────────────────────────────────────────────┐
│                 ORCHESTRATOR AGENT                       │
│  Understands user's business, coordinates all actions   │
└─────────────────────────────────────────────────────────┘
                           │
      ┌────────────────────┼────────────────────┐
      ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  STRATEGIST  │    │  COPYWRITER  │    │  BUILDER     │
│  Agent       │    │  Agent       │    │  Agent       │
│              │    │              │    │              │
│ - Analyzes   │    │ - Headlines  │    │ - Creates    │
│   context    │    │ - Emails     │    │   checkout   │
│ - Recommends │    │ - Scripts    │    │ - Sets up    │
│   offers     │    │ - Landing    │    │   tracking   │
│ - Sequences  │    │   pages      │    │ - Integrates │
│   rollout    │    │ - Ads        │    │   payments   │
└──────────────┘    └──────────────┘    └──────────────┘
                           │
      ┌────────────────────┼────────────────────┐
      ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  OPTIMIZER   │    │  ANALYST     │    │  EXECUTOR    │
│  Agent       │    │  Agent       │    │  Agent       │
│              │    │              │    │              │
│ - A/B tests  │    │ - Tracks     │    │ - Sends      │
│ - Improves   │    │   metrics    │    │   emails     │
│   conversion │    │ - Reports    │    │ - Posts      │
│ - Adjusts    │    │   insights   │    │   content    │
│   pricing    │    │ - Forecasts  │    │ - Manages    │
└──────────────┘    └──────────────┘    └──────────────┘
```

**User Experience:**
```
┌─────────────────────────────────────────────────────────┐
│ 🤖 AUTOPILOT STATUS: ACTIVE                             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Current Implementation: Menu Upsell                     │
│ Status: Phase 3 of 4 - A/B Offer Setup                 │
│ Progress: ████████████░░░░ 75%                         │
│                                                         │
│ ⚡ ACTIONS TAKEN TODAY:                                 │
│ • Generated 3 A/B offer pairs for your coaching        │
│ • Created card-on-file checkout flow                   │
│ • Wrote prescription scripts for 4 customer segments   │
│                                                         │
│ 📊 RESULTS SO FAR:                                      │
│ • Upsell take rate: 34% → 67% (+97%)                   │
│ • Average order value: $497 → $847 (+70%)              │
│ • Customer LTV: $1,200 → $2,400 (+100%)                │
│                                                         │
│ [View Details] [Pause Autopilot] [Approve Next Phase]  │
└─────────────────────────────────────────────────────────┘
```

---

## Data Requirements for Tier 4 Autonomy

### Current Data Capture Status: 70%

| Category | Current | Needed | Confidence |
|----------|---------|--------|------------|
| Identity & Expertise (Nikigai) | 90% | 95% | HIGH |
| Offer Stack | 85% | 90% | HIGH |
| Voice & Brand | 95% | 95% | HIGH |
| Customer Intelligence | 75% | 95% | MEDIUM |
| Sales Pipeline | 80% | 95% | MEDIUM |
| Marketing Metrics | 60% | 90% | LOW |
| Financial Context | 20% | 80% | LOW |
| Market Context | 20% | 60% | LOW |

### What We Already Capture

#### 1. Identity & Expertise (✅ 90%)
```
nikigai_clusters:
├── Skills (labeled, scored, with examples)
├── Problems (labeled, scored, with examples)
├── Persona (labeled, scored, with examples)
└── Integration (opportunity statements)

nikigai_key_outcomes:
├── Mission statement
├── Change statement
└── Life story summary
```

#### 2. Offer Stack (✅ 85%)
```
offer_creations:
├── Dream outcome
├── 4-layer niche definition
├── Problem → Solution mappings
├── Solution types (1:1, 1:Many, Digital, Physical)
├── Proof elements
├── Speed/ease factors
├── Grand Slam scores
├── Price & perceived value
└── Core deliverables
```

#### 3. Voice & Brand (✅ 95%)
```
voice_profiles:
├── Formality, humor, vulnerability levels
├── Sentence length preferences
├── Catchphrases and patterns
├── Content samples
├── Do's and Don'ts
└── Voice feedback for refinement
```

#### 4. Customer Intelligence (⚠️ 75%)
```
persona_profiles:
├── Pain level (1-10)
├── Problem area
├── Earning capacity
└── Emotional states

validation_responses:
├── Direct customer quotes
├── Pain points (their words)
├── Objections
└── Language patterns

MISSING:
❌ Customer segments (best/worst)
❌ Buying triggers
❌ Churn reasons by segment
❌ Journey stages
```

#### 5. Sales Pipeline (⚠️ 80%)
```
deals:
├── Contact info, stage, value
├── PTUF scores (Pain/Trust/Urgency/Fit)
├── Lead temperature
├── Source and probability

MISSING:
❌ Conversation transcripts
❌ Win/loss reasons (being added in Phase 1)
❌ Objection → Response mapping
❌ Sales cycle length by segment
```

#### 6. Marketing Metrics (⚠️ 60%)
```
content_history:
├── Content text, platform, type
├── Engagement (likes, comments, shares)
└── Performance averages

MISSING:
❌ Actual funnel conversion rates
❌ Content → Lead → Sale attribution
❌ A/B test results
❌ Email performance (opens, clicks)
```

#### 7. Financial Context (❌ 20%)
```
NEED TO CAPTURE:
├── Current monthly revenue
├── Target monthly revenue
├── Gross margins by offer
├── Marketing budget
├── Cash flow constraints
└── Break-even analysis
```

#### 8. Market Context (❌ 20%)
```
NEED TO CAPTURE:
├── Competitor names and pricing
├── Competitor positioning
├── Market size estimate
├── Differentiation factors
└── Seasonal patterns
```

---

## Data Collection Implementation Plan

### Phase A: Quick Capture (Add to Existing Flows)

| Data Point | Where to Capture | Effort |
|------------|------------------|--------|
| Revenue goal | CRM onboarding | 1 question |
| Current revenue | CRM onboarding | 1 question |
| Hours/week available | Profile setup | 1 question |
| Team size | Profile setup | 1 question |
| Max clients capacity | Offer Builder | 1 question |
| Gross margin | Offer Builder pricing | 1 question |

**Implementation:** Add 6 questions to existing flows. ~1 day.

### Phase B: New Micro-Flows (5 minutes each)

#### Flow 1: Business Baseline (2 min)
```
Q1: "What's your current monthly revenue?"
Q2: "What's your target monthly revenue?"
Q3: "What's your marketing budget per month?"
Q4: "What's your cost to deliver your core offer?"
```

#### Flow 2: Customer Segments (3 min)
```
Q1: "Describe your BEST customer (most profitable, easiest)"
Q2: "Describe your WORST customer (draining, low profit)"
Q3: "What % of revenue comes from your best segment?"
Q4: "What made your best customers finally buy?"
```

#### Flow 3: Competitor Snapshot (3 min)
```
Q1: "Who are 3 competitors your customers consider?"
Q2: "What do they charge for similar solutions?"
Q3: "What's your key advantage over them?"
Q4: "What do they do better than you?"
```

**Implementation:** 3 new micro-flows. ~3 days.

### Phase C: Auto-Capture (No User Effort)

| Data Point | Auto-Captured From |
|------------|-------------------|
| Funnel conversion rates | CRM stage progression |
| Content performance | Content history engagement |
| Win/loss reasons | Deal close modals (Phase 1) |
| Email metrics | Integrated email platform |
| Churn reasons | Cancellation survey |

**Implementation:** Calculate from existing data + Phase 1 modals. Ongoing.

---

## New Database Tables for Tier 4

```sql
-- Business Context
CREATE TABLE business_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) UNIQUE,

  -- Revenue
  current_monthly_revenue DECIMAL(10,2),
  target_monthly_revenue DECIMAL(10,2),
  revenue_model TEXT, -- 'one_time', 'subscription', 'hybrid'

  -- Capacity
  hours_per_week INTEGER,
  team_size INTEGER,
  max_clients INTEGER,
  current_clients INTEGER,

  -- Financials
  marketing_budget_monthly DECIMAL(10,2),
  gross_margin_percent INTEGER,

  -- Market
  industry TEXT,
  years_in_business INTEGER,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Competitor Analysis
CREATE TABLE competitor_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  competitor_name TEXT NOT NULL,
  competitor_url TEXT,
  their_pricing JSONB,
  their_positioning TEXT,
  their_strengths TEXT[],
  their_weaknesses TEXT[],
  your_advantage TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer Segments
CREATE TABLE customer_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  segment_name TEXT NOT NULL,
  segment_type TEXT, -- 'best', 'average', 'worst'
  description TEXT,
  revenue_percent INTEGER,
  profitability_rating INTEGER,
  ease_of_work_rating INTEGER,
  buying_trigger TEXT,
  common_objections TEXT[],
  avg_ltv DECIMAL(10,2),
  churn_rate DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Funnel Actuals (not industry benchmarks)
CREATE TABLE funnel_actuals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  reach INTEGER,
  engagements INTEGER,
  leads INTEGER,
  qualified_leads INTEGER,
  proposals INTEGER,
  sales INTEGER,

  reach_to_engagement_rate DECIMAL(5,2),
  engagement_to_lead_rate DECIMAL(5,2),
  lead_to_qualified_rate DECIMAL(5,2),
  qualified_to_proposal_rate DECIMAL(5,2),
  proposal_to_sale_rate DECIMAL(5,2),

  total_revenue DECIMAL(10,2),
  avg_sale_value DECIMAL(10,2),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- A/B Test Results
CREATE TABLE ab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  test_name TEXT NOT NULL,
  test_type TEXT, -- 'headline', 'price', 'offer', 'email', 'ad'
  variant_a JSONB,
  variant_b JSONB,
  winner TEXT,
  metric_tracked TEXT,
  variant_a_result DECIMAL(10,4),
  variant_b_result DECIMAL(10,4),
  sample_size INTEGER,
  confidence_level DECIMAL(5,2),
  learnings TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## Tier 4 Confidence Levels

### Level 1: Content Autopilot (READY NOW - 95%)
**Data Required:** Voice profile, Nikigai, Content history
**What AI Can Do:** Generate and schedule all content automatically

### Level 2: Lead Nurture Autopilot (READY NOW - 85%)
**Data Required:** PTUF scores, Sales scripts, Deal stages
**What AI Can Do:** Auto-assign follow-ups, recommend scripts, alert stale deals

### Level 3: Offer Optimization (NEEDS MORE DATA - 60%)
**Data Required:** Conversion rates, A/B tests, Pricing elasticity
**What AI Can Do:** Recommend offer tweaks, test variants, optimize pricing

### Level 4: Full Revenue Autopilot (NEEDS SIGNIFICANT DATA - 40%)
**Data Required:** All above + Financials + Market + Capacity
**What AI Can Do:** Fully orchestrate offer creation, deployment, optimization

---

## Combined Implementation Roadmap

### Sprint 1: Foundation (This Week)
**From Phase 1 + Tier 1**
- [ ] Lost Deal Reasons modal
- [ ] Won Deal Insights modal
- [ ] Stage transition timestamps
- [ ] Display implementation checklists in flow results
- [ ] Database migrations

### Sprint 2: Data Collection (Week 2)
**From Data Collection Plan**
- [ ] Add revenue/capacity questions to CRM onboarding
- [ ] Create Business Baseline micro-flow
- [ ] Create Customer Segments micro-flow
- [ ] Create Competitor Snapshot micro-flow
- [ ] New database tables

### Sprint 3: Progress Tracking (Week 3)
**From Tier 2 + Phase 2**
- [ ] OfferImplementationTracker component
- [ ] Ascension Engine value ladder
- [ ] Automatic ascension triggers
- [ ] Integration with CRM pipeline

### Sprint 4: Intelligence (Week 4)
**From Phase 3**
- [ ] LTV Dashboard as main view
- [ ] Objection Intelligence with AI analysis
- [ ] Velocity Tracker & alerts
- [ ] Win/Loss Analysis dashboard

### Sprint 5: AI Coach (Weeks 5-6)
**From Tier 3**
- [ ] Zarlo Implementation Mode
- [ ] Artifact generation (headlines, emails, scripts)
- [ ] Progress-triggered automations
- [ ] Edge functions for AI generation

### Ongoing: Autonomous System (Q1-Q2 2026)
**From Tier 4**
- [ ] Multi-agent orchestration design
- [ ] Prototype Strategist Agent
- [ ] Build Copywriter Agent
- [ ] Build Optimizer Agent
- [ ] Full autopilot dashboard

---

## Success Metrics by Tier

| Tier | Metric | Target | How to Measure |
|------|--------|--------|----------------|
| 1 | Users who view checklist | 80%+ | Track checklist display |
| 1 | Users who save/export | 40%+ | Track save/PDF actions |
| 2 | Implementations started | 60%+ of flow completers | Track `offer_implementations` |
| 2 | Implementations completed | 40%+ of starters | Track completion status |
| 3 | Artifacts used | 70%+ acceptance rate | Track artifact adoption |
| 3 | Time to first implementation | <7 days | Track started_at timing |
| 4 | Revenue increase | 3x+ | Compare before/after LTV |
| 4 | User time spent | <2 hrs/week | Track session duration |

---

## Document Changelog

| Date | Changes |
|------|---------|
| 2026-01-07 | Initial creation with Hormozi CRM audit |
| 2026-01-07 | Added 10-pillar framework and 3 functional buckets |
| 2026-01-07 | Added new KPIs: Pipeline Health, Lead Quality, Activity, Momentum, Competitive, Forecast |
| 2026-01-07 | Organized all modules by Execution / Tracking / Automation buckets |
| 2026-01-08 | Added Tier 4 North Star vision and autonomous system architecture |
| 2026-01-08 | Added complete data requirements audit (70% ready, 30% gaps) |
| 2026-01-08 | Added data collection implementation plan (Phase A, B, C) |
| 2026-01-08 | Added new database tables for Tier 4 (business_profiles, competitor_analysis, customer_segments, funnel_actuals, ab_tests) |
| 2026-01-08 | Added combined implementation roadmap (5 sprints + ongoing) |
| 2026-01-08 | Added success metrics by tier |
| 2026-01-09 | Added Phase 2 Recommendations Engine (complete) |
| 2026-01-09 | Added Content Triggers integration (complete) |
| 2026-01-09 | Added Future Improvement Roadmap (20% → 10M% better) |
| 2026-01-09 | Completed Level 1 polish: Dashboard banner, dismiss with reason, notification nudge |

---

## Phase 2: Recommendations Engine (COMPLETE)
**Implemented:** January 9, 2026

| Component | Status | Location |
|-----------|--------|----------|
| Recommendations table migration | ✅ Complete | `supabase/migrations/20260108000001_recommendations.sql` |
| Recommendation service | ✅ Complete | `src/lib/crm/recommendationService.js` |
| Content triggers service | ✅ Complete | `src/lib/crm/contentTriggers.js` |
| Generate recommendations Edge Function | ✅ Complete | `supabase/functions/generate-recommendations/index.ts` |
| Smart Alerts UI integration | ✅ Complete | `src/pages/crm/SmartAlerts.jsx` |
| Content Create page | ✅ Complete | `src/pages/crm/ContentCreate.jsx` |

**Triggers Implemented:**

| Trigger | Category | Activation | Content Generated |
|---------|----------|------------|-------------------|
| low_lead_to_discovery | Funnel | Rate < 30% | Pre-qualification content |
| low_discovery_to_proposal | Funnel | Rate < 40% | Trust/credibility posts |
| low_proposal_to_close | Funnel | Low close rate | Objection-handling content |
| price_objections | Pricing | 3+ deals lost | ROI/value justification |
| timing_objections | Sales | 3+ deals lost | Nurture sequence content |
| competitor_loss | Marketing | 2+ losses to same | Differentiation posts |
| win_streak | Marketing | 3+ wins | Case study content |
| near_capacity | Capacity | 80%+ full | Scarcity positioning |
| over_capacity | Capacity | At/over max | Waitlist content |

---

## Future Improvement Roadmap

### Level 1: 20% Better (Polish & Quick Wins)

| Improvement | Impact | Priority | Status |
|-------------|--------|----------|--------|
| Recommendation timing | Show in CRM Dashboard banner, not just /alerts | HIGH | ✅ DONE |
| Dismiss with reason | "Not relevant" / "Already doing" / "Later" - learn from dismissals | HIGH | ✅ DONE |
| Notification nudge | Push notification when new recommendations generated | HIGH | ✅ DONE |
| In-app badge | Pulsing badge on Smart Alerts button showing count | HIGH | ✅ DONE |
| Success tracking | Track if user actually posted content from trigger | MEDIUM | Pending |
| Preview in Smart Alerts | Show first 2 lines of AI instructions before clicking | MEDIUM | Pending |
| Mobile swipe actions | Swipe to dismiss, tap to act | LOW | Pending |

**Level 1 Components Delivered (Jan 9, 2026):**
- `recommendations-banner` in CRMDashboard.jsx - Top 2 recommendations on main dashboard
- `dismissed_reason` column in recommendations table - Tracks why users dismiss
- `DISMISS_REASONS` dropdown in SmartAlerts.jsx - 4 reason options + skip
- Notification nudge at 9am local time in scheduled-notifications Edge Function
- `.action-badge` pulsing indicator on Smart Alerts quick action button

---

## Recommended Next Steps (Based on Three Pillars)

### Current State Analysis

| Pillar | Current Coverage | What We Just Built |
|--------|------------------|-------------------|
| 🎯 **Execution** (To-Do/Reminders) | 15% → **25%** | Recommendations = action prompts, notification nudges |
| 📊 **Tracking** (Analysis) | 35% → **40%** | Dismiss reasons = learning data, trigger data capture |
| 🤖 **Automation** (AI/Templates) | 55% → **60%** | AI recommendations engine, content triggers |

**Key Insight:** Execution remains the biggest gap. We now have AI *telling* users what to do, but we're missing the core "daily actions based on your pipeline" functionality.

### Priority Options (Choose One Track)

#### Track A: Double Down on Execution Gap (🎯 Priority)
Fill the biggest gap in the system - daily action prompts from pipeline data.

| Feature | Pillar | Impact | Effort |
|---------|--------|--------|--------|
| **Deal Momentum Alerts** | 🎯 Execution | Stale deal warnings (7+ days, 14+ days) | 1-2 days |
| **Follow-up Cadence System** | 🎯 Execution | Day 1, 3, 7 touchpoint reminders | 2-3 days |
| **Daily Priority List** | 🎯 Execution | "3 things to do today" based on pipeline | 1-2 days |
| **Stage Action Prompts** | 🎯 Execution | "Deal moved to Proposal → send contract" | 1 day |

**Why:** Users can see recommendations but lack "here's your task list for today" functionality.

#### Track B: Complete the Data Foundation (📊 Priority)
Better data enables smarter recommendations and future automation.

| Feature | Pillar | Impact | Effort |
|---------|--------|--------|--------|
| **Win/Loss Capture Modal** | 📊 Tracking | Required fields when deal closes (feeds AI) | 1-2 days |
| **Stage Timestamps** | 📊 Tracking | Track time per stage (enables velocity) | 1 day |
| **Lead Source Attribution** | 📊 Tracking | Close rate & LTV per source | 1-2 days |
| **Competitor Tracking** | 📊 Tracking | Which competitors mentioned, win/loss vs each | 1 day |

**Why:** AI recommendations are only as good as the data. Win/loss reasons would 10x recommendation quality.

#### Track C: Level Up AI Intelligence (🤖 Priority)
Make the recommendation system smarter based on data we're now collecting.

| Feature | Pillar | Impact | Effort |
|---------|--------|--------|--------|
| **Recommendation Learning** | 🤖 Automation | Track acted-on recs, boost similar ones | 2-3 days |
| **Deal-Specific Triggers** | 🤖 Automation | "Proposal sent → suggest case study" | 1-2 days |
| **Auto-Draft Content** | 🤖 Automation | Generate drafts to approval queue | 2-3 days |
| **Win Reason Amplification** | 🤖 Automation | Top win reason → suggest 5 related posts | 1-2 days |

**Why:** We're collecting dismiss reasons now - we can use them to improve recommendations.

### Recommended Path: Track A → Track B → Track C

**Rationale:**
1. **Execution first** - Users need daily action lists from their pipeline (biggest gap)
2. **Data second** - Win/loss capture enables all future intelligence
3. **AI third** - Once we have data flowing, make the AI smarter

**Immediate Next Sprint (Track A):**
1. Deal Momentum Alerts (stale deal warnings in Smart Alerts)
2. Daily Priority List widget on CRM Dashboard
3. Stage-based action prompts

This fills the execution gap while the recommendation system collects dismiss data for future learning.

---

### Level 2: 100% Better (Deeper Intelligence)

| Improvement | Impact | Priority |
|-------------|--------|----------|
| Recommendation learning | Track which get acted on → prioritize similar | HIGH |
| Content performance loop | If triggered content performs well → weight trigger higher | HIGH |
| Multi-step recommendations | "Step 1: ROI post → Step 2: Update pricing → Step 3: Comparison" | MEDIUM |
| Seasonal patterns | "You close more in Q1 - prepare content now" | MEDIUM |
| Deal-specific triggers | Deal moves to proposal → suggest relevant case study | HIGH |
| Competitor intelligence | Scrape competitor content, suggest angles | MEDIUM |
| Win reason amplification | Top win reason = "speed" → create 5 speed posts | MEDIUM |

### Level 3: 1000% Better (Autonomous System)

| Improvement | Impact | Priority |
|-------------|--------|----------|
| Auto-draft content | Generate drafts automatically, queue for approval | HIGH |
| Scheduled content calendar | AI plans week: Monday ROI, Wed Case Study, Fri Objection | HIGH |
| Multi-channel orchestration | Same insight → LinkedIn + Email + Instagram | MEDIUM |
| Predictive recommendations | "You'll hit capacity in 6 weeks - start waitlist now" | HIGH |
| Conversation intelligence | Integrate call recordings → extract objections | MEDIUM |
| Price optimization | "Win rate drops 40% above $5k - test $4,500" | MEDIUM |
| Lead scoring from content | "ROI post engagers close 2x faster" | MEDIUM |
| A/B testing pipeline | Auto-test 2 versions, measure, learn preferences | MEDIUM |

### Level 4: 10,000,000% Better (Category-Defining)

| Improvement | Impact | Priority |
|-------------|--------|----------|
| AI Sales Agent | Autonomous outreach, qualification, booking - you just close | FUTURE |
| Market Intelligence Network | Anonymized cross-user data: "Coaches seeing 23% higher close with video" | FUTURE |
| Real-time deal coaching | During call: "They mentioned budget - pivot to ROI story" | FUTURE |
| Predictive revenue modeling | "Post 3x/week + 2hr follow-up = $50k/month by March" | FUTURE |
| Autonomous optimization | AI tests pricing, messaging, timing - you approve changes | FUTURE |
| Network effects | "5 ideal customers followed [Competitor] - win them content" | FUTURE |
| Full-cycle attribution | Content → Lead → Deal → Win → Testimonial → Content | FUTURE |

---

## Integration with Marketing Tower

The Sales Tower provides data context for the Marketing Tower's Content Autopilot:

**Data We Provide:**
- `getAutonomousContext(userId)` - Full business context
- `getDealOutcomeStats(userId)` - Win/loss patterns
- `getFunnelContext(userId)` - Conversion rates and weak points
- `buildContentTriggerUrl()` - Pre-filled content generation links

**Content Autopilot Integration Points:**
1. Trigger detection happens in Sales Tower
2. Content generation happens via Marketing Tower's generator
3. Content queued in `content_history` with `source: 'autopilot'`
4. Performance tracking flows back to Sales Tower

See `docs/CONTENT_AUTOPILOT_SALES_INTEGRATION.md` for full contract.

---

*End of Sales Tower V2 Implementation Plan*
