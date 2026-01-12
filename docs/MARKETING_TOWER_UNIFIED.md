# Marketing Tower - Unified Strategy & Implementation Guide

> **Last Updated:** 2026-01-08
> **Status:** Active Development
> **Owner:** Marketing Tower Agent

---

## Vision

The Marketing Tower transforms FindMyFlow from a discovery tool into an **AI-powered marketing co-pilot** that helps users execute their business strategy. Users complete flows to discover their offer, then the Marketing Tower helps them actually sell it.

**Core Promise:** "We don't just help you find your flow - we help you monetize it."

---

## Key Decisions (Clarified 2026-01-08)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Strategy Entry** | Explainer page → time check → questions OR skip | Like Money Models pattern |
| **Content Generation** | Weekly batch on Sunday | Prep week ahead, user reviews Mon-Fri |
| **Task Generation** | Auto-generated from strategy | Tasks appear in daily list with content attached |
| **Voice Profile Path** | Two options: Voice Interview OR Templates | Interview = quality, Templates = speed |
| **Voice Questions** | Origin story + Client wins + Contrarian takes | Focus on what other flows DON'T capture |
| **Data Sources** | Pull from FlowFinder + Offer Builder | Don't re-ask what we already know |
| **Engagement Data** | Screenshot upload → AI extraction | Like MetricsScreenshotUpload pattern |

---

## The Three Pillars

Every feature in the Marketing Tower must support one or more of these pillars:

| Pillar | Purpose | Success Metric |
|--------|---------|----------------|
| **1. Strategy** | Know WHAT to do | User has clear weekly action plan |
| **2. Generation** | CREATE the content/assets | Time from idea to published content |
| **3. Intelligence** | LEARN what works | Improvement in engagement over time |

```
┌─────────────────────────────────────────────────────────────────┐
│                      MARKETING TOWER                            │
├─────────────────┬─────────────────┬─────────────────────────────┤
│    STRATEGY     │   GENERATION    │        INTELLIGENCE         │
│                 │                 │                             │
│  "What to do"   │  "Create it"    │  "Learn & improve"          │
│                 │                 │                             │
│  • Goal setting │  • Content      │  • Performance tracking     │
│  • Weekly plan  │  • Voice DNA    │  • Voice feedback loop      │
│  • Task board   │  • Batch posts  │  • Content scoring          │
│  • Benchmarks   │  • Autopilot    │  • Strategy auto-adjust     │
└─────────────────┴─────────────────┴─────────────────────────────┘
```

---

## Pillar 1: Strategy

### Purpose
Help users know exactly WHAT to do each week to hit their revenue goals.

### Core Features

| Feature | Description | Status | Files |
|---------|-------------|--------|-------|
| **Content Strategy Flow** | 6-question wizard to define marketing approach | Built | `ContentStrategyFlow.jsx` |
| **Goal-Based Calculator** | Reverse-engineer posts needed from revenue goal | Built | `GoalBasedStrategy.jsx` |
| **Weekly Task Board** | Daily tasks generated from strategy | Built | `CRMMarketing.jsx`, `taskService.js` |
| **Lead Strategy Import** | Pull strategy from completed Leads flow | Built | `contentStrategy.js` |
| **Industry Benchmarks** | Default conversion rates by stage | Built | Constants in `contentStrategy.js` |

### Data Flow
```
Leads Assessment → Content Strategy Flow → Weekly Template → Daily Tasks
       ↓                    ↓                    ↓              ↓
 lead_strategy      content_strategies    weekly_template  marketing_tasks
```

### Strategy Database Schema
```sql
content_strategies (
  user_id, project_id,
  lead_strategy,           -- 'organic_content' | 'paid_ads' | 'referrals' | etc.
  platforms[],             -- ['instagram', 'linkedin', 'email']
  posting_days[],          -- ['monday', 'wednesday', 'friday']
  preferred_time,          -- 'morning' | 'afternoon' | 'evening'
  content_types[],         -- ['transformation_story', 'educational', 'offer_teaser']
  weekly_template,         -- JSONB: tasks by day
  monthly_revenue_goal,
  core_offer_price
)
```

### Success Metrics
- [ ] User completes strategy flow (has weekly_template)
- [ ] User opens task board 3+ days/week
- [ ] Tasks marked complete increase week-over-week

---

## Pillar 2: Generation

### Purpose
Create content and assets quickly using AI that sounds like the user.

### Core Features

| Feature | Description | Status | Files |
|---------|-------------|--------|-------|
| **Voice DNA Extractor** | Import existing content to learn voice | Built | `VoiceDNAExtractor.jsx`, `voiceProfile.js` |
| **Content Generator** | Single post with voice matching | Built | `ContentGenerator.jsx` |
| **Batch Generator** | Multiple posts with type rotation | Built | `BatchContentGenerator.jsx` |
| **Autopilot Mode** | Daily auto-generation + approval queue | Planned | `AUTOPILOT_SCOPE.md` |
| **Approval Queue** | Review, edit, approve generated content | Built | `ApprovalQueue.jsx` |
| **Implementation Coach** | AI generates task artifacts (headlines, emails) | Built | `ZarloImplementationCoach.jsx` |
| **Generated Assets Library** | Save and reuse AI-generated assets | Built | `GeneratedAssetsLibrary.jsx` |

### Voice Profile System

**Two Paths to Voice Profile:**

| Path | Time | Quality | Best For |
|------|------|---------|----------|
| **Voice Interview** | 10-15 min | High | Users who want authentic voice |
| **Template Selection** | 1 min | Good | Users short on time |

**Voice Interview Questions (Voice Notes):**
1. **Origin Story**: "Why did you start this business? What's your story?"
2. **Client Transformation**: "Tell me about a client win - what was their before/after?"
3. **Contrarian Take**: "What do most people in your industry get wrong?"

These capture what FlowFinder/Offer Builder DON'T:
- How the user actually speaks (cadence, vocabulary)
- Emotional stories that resonate in content
- Unique perspectives that differentiate their content

**Voice Templates (Quick Path):**
```javascript
VOICE_TEMPLATES = {
  bold_challenger,    // Direct, challenges status quo
  warm_educator,      // Supportive, teaches with care
  data_expert,        // Evidence-based, analytical
  storyteller,        // Narrative-driven, emotional
  witty_provocateur,  // Playful, uses humor
  minimalist_rebel    // Concise, anti-corporate
}
```

### Content Types (Rotation)
| Type | Purpose | Best Day |
|------|---------|----------|
| `transformation_story` | Social proof via narrative | Monday |
| `educational` | Value-first teaching | Tuesday |
| `pain_agitation` | Problem awareness | Wednesday |
| `social_proof` | Testimonials, results | Thursday |
| `offer_teaser` | Soft sell, curiosity | Friday |

### Generation Database Schema
```sql
content_history (
  user_id, project_id,
  content_type,            -- 'transformation_story' | etc.
  platform,                -- 'instagram' | 'linkedin' | etc.
  content,                 -- Generated text
  voice_profile_id,        -- Link to voice used
  status,                  -- 'draft' | 'scheduled' | 'posted' | 'archived'
  scheduled_date,
  batch_id,                -- For batch grouping
  engagement_data,         -- JSONB: {likes, comments, shares, dms}
  voice_feedback           -- JSONB: {liked, feedback_type, comment}
)

voice_profiles (
  user_id,
  voice_template,          -- Base template
  custom_traits,           -- User modifications
  sample_content[],        -- Content used to extract DNA
  voice_dna                -- JSONB: extracted characteristics
)
```

### Success Metrics
- [ ] Voice profile created (has voice_dna)
- [ ] Content generated per week
- [ ] Time from task to published < 5 minutes
- [ ] Regeneration rate < 20% (voice accuracy)

---

## Pillar 3: Intelligence

### Purpose
Learn what works and automatically improve over time.

### Core Features

| Feature | Description | Status | Files |
|---------|-------------|--------|-------|
| **Voice Feedback Loop** | Collect "sounds like me" feedback | Built | `ContentGenerator.jsx` |
| **Performance Dashboard** | Engagement analytics | Built | `PerformanceDashboard.jsx` |
| **Weekly Report Card** | Grade with 4 factors | Built | `analyticsService.js` |
| **Content Scoring** | Rank content by performance | Planned | - |
| **Smart Benchmarks** | Learn YOUR conversion rates | Planned | - |
| **Strategy Auto-Adjust** | Suggest changes based on data | Planned | - |
| **A/B Testing** | Test content variations | Planned | - |

### Report Card Grading
```javascript
GRADE_WEIGHTS = {
  task_completion: 0.40,    // Did you do the work?
  engagement_rate: 0.20,    // Did it perform?
  sales_activity: 0.20,     // Did it convert?
  consistency: 0.20         // Did you show up?
}
```

### Intelligence Feedback Loop
```
Generate Content → User Feedback → Update Voice Profile → Better Content
       ↓                ↓                   ↓                  ↓
 content_history   voice_feedback    voice_profiles      Next generation
```

### Intelligence Database Schema
```sql
voice_feedback (
  content_id,
  user_id,
  feedback_type,           -- 'perfect' | 'close' | 'off' | 'wrong_tone'
  specific_feedback[],     -- ['too_formal', 'missing_personality']
  comment                  -- Free text
)

-- Planned: Performance intelligence tables
content_performance (
  content_id,
  impressions, reach, engagement_rate,
  clicks, conversions,
  performance_score        -- Calculated 1-100
)

user_benchmarks (
  user_id,
  metric_type,             -- 'awareness_to_attraction' | etc.
  current_rate,
  industry_average,
  trend                    -- 'improving' | 'stable' | 'declining'
)
```

### Success Metrics
- [ ] Voice feedback collected on 50%+ of content
- [ ] Engagement rate improves month-over-month
- [ ] Report card grade trends upward
- [ ] Content regeneration rate decreases over time

---

## Implementation Tiers

### Tier 1: Foundation (20% Improvement) - COMPLETE
- [x] Strategy flow captures user's approach
- [x] Weekly tasks generated from strategy
- [x] Basic content generation with voice templates
- [x] Content history stored and searchable

### Tier 2: Integrated (100% Improvement) - IN PROGRESS
- [x] Voice DNA extraction from existing content
- [x] Batch generation with rotation
- [x] Approval queue workflow
- [x] Performance dashboard
- [ ] Voice feedback influencing generation
- [ ] Content scoring by engagement

### Tier 3: Intelligent (1000% Improvement) - PARTIAL
- [x] Implementation coach (ZarloImplementationCoach)
- [x] Generated assets library
- [ ] Autopilot mode with daily generation
- [ ] Strategy auto-adjustment
- [ ] Smart benchmarks (learn your rates)
- [ ] A/B testing framework

### Tier 4: Autonomous (Paradigm Shift) - PLANNED
- [ ] Multi-agent architecture
- [ ] Full business profile aggregation
- [ ] Autonomous content calendar
- [ ] Revenue-driven optimization
- [ ] Cross-channel intelligence

---

## Current File Inventory

### Documentation (Consolidating)
| Old File | Status | Merged Into |
|----------|--------|-------------|
| `AI_CONTENT_COPILOT_PLAN.md` | Archive | This doc |
| `AI_CONTENT_AUTOPILOT_FLOW.md` | Archive | This doc |
| `AUTOPILOT_SCOPE.md` | Archive | This doc |
| `CONTENT_SYSTEM_ARCHITECTURE.md` | Archive | This doc |
| `2026-01-07-marketing-pillars-implementation.md` | Archive | This doc |
| `SALES_TOWER_V2_PLAN.md` | Keep | Sales-specific |
| `TIER_3_AI_IMPLEMENTATION_COACH.md` | Archive | This doc |
| `BUSINESS_PROFILE_ARCHITECTURE.md` | Keep | Data layer doc |

### Components
| Component | Pillar | Path |
|-----------|--------|------|
| `ContentStrategyFlow.jsx` | Strategy | `src/flows/` |
| `GoalBasedStrategy.jsx` | Strategy | `src/components/crm/` |
| `ContentGenerator.jsx` | Generation | `src/components/crm/` |
| `BatchContentGenerator.jsx` | Generation | `src/components/crm/` |
| `VoiceDNAExtractor.jsx` | Generation | `src/components/crm/` |
| `ApprovalQueue.jsx` | Generation | `src/components/crm/` |
| `ZarloImplementationCoach.jsx` | Generation | `src/components/crm/` |
| `PerformanceDashboard.jsx` | Intelligence | `src/pages/crm/` |
| `ContentHistory.jsx` | Intelligence | `src/pages/crm/` |
| `ContentQueue.jsx` | Generation | `src/pages/crm/` |
| `CRMMarketing.jsx` | Strategy | `src/pages/crm/` |

### Libraries
| Library | Pillar | Path |
|---------|--------|------|
| `contentStrategy.js` | Strategy | `src/lib/` |
| `contentHistory.js` | Generation + Intelligence | `src/lib/` |
| `voiceProfile.js` | Generation + Intelligence | `src/lib/` |
| `contentContext.js` | Strategy | `src/lib/` |
| `businessProfile.js` | Strategy | `src/lib/` |
| `taskService.js` | Strategy | `src/lib/crm/` |
| `analyticsService.js` | Intelligence | `src/lib/crm/` |

### Edge Functions
| Function | Pillar | Path |
|----------|--------|------|
| `content-generator` | Generation | `supabase/functions/` |
| `extract-voice-dna` | Generation | `supabase/functions/` |
| `voice-analyzer` | Intelligence | `supabase/functions/` |
| `implementation-coach` | Generation | `supabase/functions/` |

### Migrations (Deploy in Order)
| # | Migration | Pillar | Creates/Modifies |
|---|-----------|--------|------------------|
| 1 | `20260105190000_voice_profiles.sql` | Generation | `voice_profiles` table |
| 2 | `20260106000000_voice_feedback.sql` | Intelligence | `voice_feedback` table |
| 3 | `20260106010000_content_history.sql` | Generation | `content_history` table |
| 4 | `20260106020000_content_history_queue_columns.sql` | Generation | Adds queue columns |
| 5 | `20260108000000_content_copilot.sql` | Strategy | `content_strategies` + links |

**Dependency Note:** `voice_profiles` must run first (referenced by voice_feedback and content_history).

**Deploy Command:**
```bash
npx supabase db push
```

---

## Unified System Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         USER JOURNEY                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  /marketing (first visit)                                                │
│       │                                                                  │
│       ▼                                                                  │
│  ┌─────────────────────┐                                                │
│  │  Explainer Page     │  "Set up your content strategy" (like Money    │
│  │  + Time Check       │   Models pattern)                              │
│  └──────────┬──────────┘                                                │
│             │                                                            │
│     ┌───────┴───────┐                                                   │
│     │               │                                                    │
│  [Have time]    [Skip]                                                  │
│     │               │                                                    │
│     ▼               ▼                                                    │
│  Strategy       /marketing                                               │
│  Questions      (can single-generate)                                    │
│     │                                                                    │
│     ▼                                                                    │
│  Voice Profile Setup                                                     │
│  ┌─────────────────────────────────────┐                                │
│  │  Option A: Voice Interview          │                                │
│  │  (voice notes + content upload)     │                                │
│  ├─────────────────────────────────────┤                                │
│  │  Option B: Quick Template           │                                │
│  │  (pick from 6 voice styles)         │                                │
│  └──────────────┬──────────────────────┘                                │
│                 │                                                        │
│                 ▼                                                        │
│  ┌─────────────────────────────────────┐                                │
│  │     SUNDAY: Weekly Batch Job        │                                │
│  │                                     │                                │
│  │  Inputs:                            │                                │
│  │  • Strategy (platforms, days, goal) │                                │
│  │  • Voice Profile                    │                                │
│  │  • FlowFinder data (skills, persona)│                                │
│  │  • Offer Builder data (niche, offer)│                                │
│  │  • Past performance (what worked)   │                                │
│  │                                     │                                │
│  │  Outputs:                           │                                │
│  │  • Content for each posting day     │                                │
│  │  • Tasks for each day               │                                │
│  └──────────────┬──────────────────────┘                                │
│                 │                                                        │
│                 ▼                                                        │
│  ┌─────────────────────────────────────┐                                │
│  │     DAILY: Task Board               │                                │
│  │                                     │                                │
│  │  Morning: User sees today's tasks   │                                │
│  │  • Content pre-generated            │                                │
│  │  • Edit if needed                   │                                │
│  │  • Copy & post to platform          │                                │
│  │  • Mark task complete               │                                │
│  └──────────────┬──────────────────────┘                                │
│                 │                                                        │
│                 ▼                                                        │
│  ┌─────────────────────────────────────┐                                │
│  │     INTELLIGENCE: Learning Loop     │                                │
│  │                                     │                                │
│  │  After posting:                     │                                │
│  │  • Upload engagement screenshot     │                                │
│  │  • AI extracts metrics              │                                │
│  │  • System learns what works         │                                │
│  │  • Next week's content improved     │                                │
│  └─────────────────────────────────────┘                                │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Next Actions (Priority Order)

### Phase 1: Foundation (Current)
1. ~~Run pending migrations~~ ✓ Done
2. **Build /marketing explainer + time check page** - First-visit experience
3. **Wire ContentStrategyFlow as modal** - Questions flow when user has time
4. **Build Voice Interview flow** - Voice note questions + content upload

### Phase 2: Weekly Generation
5. **Sunday batch job edge function** - Generate week's content + tasks
6. **Connect strategy → content generation** - Use user's settings
7. **Pull FlowFinder + Offer Builder data** - Enrich content context

### Phase 3: Intelligence Loop
8. **Screenshot upload → metrics** - Extend MetricsScreenshotUpload
9. **Voice feedback → generation** - Use "doesn't sound like me" to improve
10. **Performance-based weighting** - More of what works

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-01-08 | Weekly batch on Sunday (not daily cron) | User preps week ahead, reviews daily |
| 2026-01-08 | Voice Interview = voice notes + content upload | Captures HOW user speaks + stories |
| 2026-01-08 | Pull FlowFinder + Offer Builder data | Don't re-ask, use existing discoveries |
| 2026-01-08 | Screenshot upload for engagement | Lower friction than manual entry or API |
| 2026-01-08 | Explainer page before strategy (like Money Models) | Matches existing UX pattern |
| 2026-01-08 | Unified doc created | Multiple agents created fragmented docs |
| 2026-01-08 | Three pillars framework | Clear measurement for feature value |
| 2026-01-07 | Voice feedback loop priority | Improves generation quality over time |
| 2026-01-05 | CRM as home for marketing | Users already in CRM for tasks |

---

## Superseded Documents

These docs are now **archived** - this unified doc is the source of truth:
- `AI_CONTENT_COPILOT_PLAN.md` - Partial strategy, missing voice
- `AI_CONTENT_AUTOPILOT_FLOW.md` - Daily cron approach (now weekly)
- `AUTOPILOT_SCOPE.md` - Separate autopilot settings (merged into strategy)
- `CONTENT_SYSTEM_ARCHITECTURE.md` - Unified queue focus (incorporated)
- `2026-01-07-marketing-pillars-implementation.md` - Earlier pillar draft

---

## Glossary

| Term | Definition |
|------|------------|
| **Voice DNA** | Extracted writing style characteristics from user's content |
| **Weekly Template** | Pre-generated task schedule based on strategy |
| **Autopilot** | Automated daily content generation requiring approval |
| **Content Rotation** | Cycling through content types for variety |
| **Smart Benchmarks** | User-specific conversion rates learned over time |
| **Report Card** | Weekly grade based on activity and outcomes |

---

*This document supersedes: AI_CONTENT_COPILOT_PLAN.md, AI_CONTENT_AUTOPILOT_FLOW.md, AUTOPILOT_SCOPE.md, CONTENT_SYSTEM_ARCHITECTURE.md, 2026-01-07-marketing-pillars-implementation.md, TIER_3_AI_IMPLEMENTATION_COACH.md*
