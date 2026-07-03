# Autonomous Marketing & Sales System Architecture

This document outlines the architecture for the fully autonomous system, building on the Tier 4 data foundation.

## System Overview

The autonomous system consists of three interconnected layers:

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER INTERACTION LAYER                        │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐       │
│  │ Approval Queue│  │ Smart Alerts  │  │ AI Coach      │       │
│  └───────────────┘  └───────────────┘  └───────────────┘       │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │
┌─────────────────────────────────────────────────────────────────┐
│                    AUTONOMOUS ENGINE LAYER                       │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐       │
│  │ Content       │  │ Recommendation│  │ Performance   │       │
│  │ Autopilot     │  │ Engine        │  │ Monitor       │       │
│  └───────────────┘  └───────────────┘  └───────────────┘       │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │
┌─────────────────────────────────────────────────────────────────┐
│                    DATA FOUNDATION LAYER                         │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐       │
│  │ Business      │  │ CRM Data      │  │ Historical    │       │
│  │ Profile       │  │ (Funnel/Deals)│  │ Content       │       │
│  └───────────────┘  └───────────────┘  └───────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Foundation Layer (Tier 4) ✅ BUILT

### Data Sources

| Source | Table | Data |
|--------|-------|------|
| Business Baseline | `business_profiles` | Revenue, margins, capacity, team size |
| Customer Segments | `customer_segments` | Best/worst customers, objections, buying triggers |
| Competitor Analysis | `competitor_analysis` | Positioning, pricing, strengths/weaknesses |
| Funnel Actuals | `funnel_actuals` | Real conversion rates from CRM |
| Deal Outcomes | `deal_outcomes` | Win/loss reasons, competitor mentions |

### Data Access Pattern

```javascript
// Unified context for AI prompts
const context = await getAutonomousContext(userId)

// Returns:
{
  revenue: { current, target, model },
  margins: { grossPercent, deliveryCost, marketingBudget },
  capacity: { hoursPerWeek, teamSize, maxClients, currentClients },
  customers: {
    best: { description, buyingTrigger, revenuePercent },
    worst: { description, objections: [] }
  },
  competitors: [{ name, pricing, positioning, strength, weakness }],
  funnel: {
    leads, sales, conversionRate, avgDealSize,
    weakPoint, recommendation
  }
}
```

---

## Autonomous Engine Layer

### 1. Recommendation Engine

**Purpose**: Analyze data and generate proactive suggestions.

**Trigger Points**:
- Weekly scheduled analysis (Supabase cron)
- Real-time triggers (deal won/lost, funnel threshold crossed)
- User request ("What should I do next?")

**Recommendation Types**:

| Category | Trigger | Example Recommendation |
|----------|---------|------------------------|
| Sales | Win rate drops below 20% | "Your proposal-to-close rate dropped. Consider: [objection handling tips]" |
| Sales | Competitor mentioned 3+ times | "Clients are comparing you to X. Create a comparison asset." |
| Marketing | Engagement down 20% | "Try these content angles based on your best customers" |
| Pricing | Avg deal size declining | "Consider bundling or value-add to increase AOV" |
| Capacity | Near max clients | "Time to raise prices or add team capacity" |

**Database Schema**:

```sql
CREATE TABLE recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),

  category TEXT NOT NULL, -- 'sales', 'marketing', 'pricing', 'capacity'
  priority TEXT NOT NULL, -- 'high', 'medium', 'low'

  title TEXT NOT NULL,
  description TEXT NOT NULL,
  action_url TEXT, -- Deep link to relevant feature

  trigger_reason TEXT, -- Why this was generated
  data_snapshot JSONB, -- Data that triggered this

  status TEXT DEFAULT 'pending', -- 'pending', 'viewed', 'acted', 'dismissed'
  viewed_at TIMESTAMPTZ,
  acted_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Implementation Flow**:

```
1. Scheduled Job (daily/weekly)
   │
   ├─> Fetch user data (business profile, funnel actuals, deal outcomes)
   │
   ├─> Run analysis rules
   │   ├─> Funnel health check
   │   ├─> Win/loss pattern detection
   │   ├─> Revenue trend analysis
   │   └─> Capacity check
   │
   ├─> Generate recommendations (with AI for personalization)
   │
   └─> Store in recommendations table
       │
       └─> Trigger Smart Alert notification
```

---

### 2. Content Autopilot

**Purpose**: Automatically generate content based on context and queue for approval.

**Content Types Generated**:

| Type | Trigger | Approval Required |
|------|---------|-------------------|
| Social Posts | Weekly schedule | Yes (queue) |
| Email Sequences | Campaign creation | Yes (review) |
| Headlines | Implementation task | Yes (choose) |
| Sales Scripts | New objection detected | Yes (review) |
| Comparison Assets | Competitor mentioned | Yes (edit) |

**Autopilot Modes**:

1. **Copilot Mode** (Default)
   - Generates drafts
   - User reviews and approves
   - Edits before posting

2. **Autopilot Mode** (Opt-in per content type)
   - Generates content
   - Auto-queues for posting
   - User can veto within window

**Database Schema**:

```sql
CREATE TABLE content_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),

  content_type TEXT NOT NULL, -- 'social', 'email', 'headline', 'script'
  platform TEXT, -- 'instagram', 'linkedin', 'twitter', 'email'

  title TEXT,
  content TEXT NOT NULL,
  media_urls TEXT[],

  generation_context JSONB, -- What data was used to generate

  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'posted'
  scheduled_for TIMESTAMPTZ,
  posted_at TIMESTAMPTZ,

  auto_mode BOOLEAN DEFAULT false, -- If true, auto-posts after review window
  review_window_ends TIMESTAMPTZ, -- When auto-posting happens

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE autopilot_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) UNIQUE,

  -- Per-type autopilot settings
  social_autopilot BOOLEAN DEFAULT false,
  social_review_hours INTEGER DEFAULT 24, -- Hours before auto-post

  email_autopilot BOOLEAN DEFAULT false,
  email_review_hours INTEGER DEFAULT 48,

  -- Generation preferences
  posts_per_week INTEGER DEFAULT 3,
  preferred_days TEXT[] DEFAULT '{"monday","wednesday","friday"}',
  preferred_time TIME DEFAULT '09:00',

  -- Voice adherence
  strict_voice_match BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Generation Flow**:

```
Weekly Content Generation (Scheduled)
│
├─> Check autopilot_settings for user
│
├─> Fetch user context
│   ├─> Voice profile
│   ├─> Best customer description
│   ├─> Recent wins (for case studies)
│   ├─> Content strategy pillars
│   └─> Performance data (what worked)
│
├─> Generate content batch
│   ├─> Apply voice profile
│   ├─> Use winning content patterns
│   └─> Personalize with business context
│
├─> Queue content
│   ├─> Set scheduled_for based on settings
│   └─> Set review_window_ends if autopilot on
│
└─> Notify user (Smart Alert)
    └─> "3 posts queued for this week - review?"
```

---

### 3. Performance Monitor

**Purpose**: Track content and sales performance to improve future generations.

**Metrics Tracked**:

| Category | Metrics |
|----------|---------|
| Content | Engagement rate, reach, saves, shares, comments |
| Sales | Win rate by source, objection frequency, competitor mentions |
| Funnel | Stage conversion rates, time in stage, velocity |
| Revenue | MRR trend, average deal size, LTV |

**Feedback Loop**:

```
Content Posted
│
├─> Track performance (via screenshot upload or API)
│
├─> Store in content_history
│
├─> Analyze patterns
│   ├─> What topics perform best?
│   ├─> What formats work?
│   ├─> What times get engagement?
│   └─> What CTAs convert?
│
└─> Feed back to Content Autopilot
    └─> "Posts about X get 2x engagement - generating more"
```

---

## User Interaction Layer

### 1. Approval Queue ✅ PARTIALLY BUILT

**Location**: `/crm/content-queue`

**Features**:
- [ ] View pending content
- [ ] Approve/reject with one click
- [ ] Edit before approving
- [ ] Bulk approve
- [ ] Reschedule

### 2. Smart Alerts ✅ PARTIALLY BUILT

**Location**: `/crm/alerts`

**Alert Types**:
- Recommendations ready
- Content needs approval
- Funnel issue detected
- Revenue milestone reached
- Deal outcome to capture

### 3. AI Coach ✅ BUILT

**Location**: Zarlo widget (all pages)

**Enhanced with Tier 4 data**:
- Knows your business context
- References your actual numbers
- Suggests based on funnel health
- Uses win/loss patterns

---

## Implementation Roadmap

### Phase 1: Foundation ✅ COMPLETE
- [x] Business baseline flow
- [x] Customer segments flow
- [x] Competitor snapshot flow
- [x] Funnel actuals calculation
- [x] Deal outcome capture
- [x] Context integration in AI Coach

### Phase 2: Recommendations Engine
- [ ] Create `recommendations` table
- [ ] Build analysis rules
- [ ] Create recommendation generator (Edge Function)
- [ ] Add to Smart Alerts UI
- [ ] Schedule weekly analysis job

### Phase 3: Content Autopilot
- [ ] Create `content_queue` and `autopilot_settings` tables
- [ ] Build generation engine (Edge Function)
- [ ] Create approval queue UI
- [ ] Add autopilot mode settings
- [ ] Schedule weekly generation job

### Phase 4: Performance Monitor
- [ ] Enhanced content_history tracking
- [ ] Performance pattern analysis
- [ ] Feedback loop to generation

### Phase 5: Full Automation
- [ ] Auto-posting integration (optional)
- [ ] Multi-platform support
- [ ] Advanced scheduling
- [ ] A/B testing automation

---

## API Endpoints (Planned Edge Functions)

| Function | Purpose | Trigger |
|----------|---------|---------|
| `generate-recommendations` | Analyze data, create recommendations | Scheduled (weekly) |
| `generate-content-batch` | Create weekly content queue | Scheduled (weekly) |
| `analyze-performance` | Process content performance | After engagement data |
| `process-autopilot-queue` | Auto-post approved content | Scheduled (hourly) |

---

## Security & Privacy

- All data is user-scoped (RLS policies)
- No cross-user data sharing
- Content generation uses user's voice profile
- Autopilot requires explicit opt-in per content type
- Review window before any auto-posting

---

## Summary

The autonomous system transforms FindMyFlow from a tool users actively use into a system that actively works for them:

**Before**: User opens app → decides what to do → does it
**After**: AI analyzes → suggests actions → generates content → user approves

The key insight: **Humans approve, AI executes**.
