# Content Autopilot: Sales Tower Integration Requirements

This document outlines what the **Sales Tower** needs from the **Content Autopilot** system being built in the Marketing Tower.

## Context

The Sales Tower has built a data foundation (Tier 4) that provides rich context for content generation:

- **Business Profile**: Revenue, margins, capacity, team size
- **Customer Segments**: Best/worst customers, buying triggers, objections
- **Competitor Analysis**: Positioning, pricing, strengths/weaknesses
- **Funnel Actuals**: Real conversion rates from CRM deals
- **Deal Outcomes**: Win/loss reasons, competitor mentions

This data should inform and personalize all auto-generated content.

---

## What Sales Tower Needs from Content Autopilot

### 1. Context-Aware Generation

When generating content, pull from `getAutonomousContext(userId)`:

```javascript
import { getAutonomousContext } from '../lib/businessProfile'

const context = await getAutonomousContext(userId)

// Available data:
context.revenue          // { current, target, model }
context.customers.best   // { description, buyingTrigger, revenuePercent }
context.customers.worst  // { description, objections: [] }
context.competitors      // [{ name, pricing, positioning, strength, weakness }]
context.funnel           // { leads, sales, conversionRate, avgDealSize, weakPoint }
```

### 2. Sales-Focused Content Types

The autopilot should be able to generate:

| Type | Use Case | Key Context |
|------|----------|-------------|
| Objection-Handling Posts | Address common objections | `context.customers.worst.objections` |
| Case Study Outlines | Highlight wins | Deal outcomes where `outcome='won'` |
| Comparison Content | Differentiate from competitors | `context.competitors` + `yourAdvantage` |
| Pricing Justification | Defend value | `context.funnel.avgDealSize` + margins |
| Testimonial Prompts | Request reviews | Recent won deals |

### 3. Trigger-Based Content Suggestions

When certain events happen in Sales Tower, suggest content:

| Event | Suggested Content |
|-------|-------------------|
| Deal lost to competitor | "Create comparison post vs [competitor]" |
| 3+ price objections this month | "Create ROI/value post" |
| Win streak (3+ wins) | "Create case study from recent wins" |
| Funnel weak point detected | "Create content addressing [weak stage]" |

### 4. Queue Integration

Generated content should flow to the existing approval queue:

```javascript
// Insert to content_history with pending status
await supabase.from('content_history').insert({
  user_id,
  content_type: 'social',
  platform: 'linkedin',
  content: generatedContent,
  source: 'autopilot',  // Important: marks as auto-generated
  review_status: 'pending',
  generation_context: {
    trigger: 'competitor_mentioned',
    data: { competitor: 'Competitor X', mentions: 3 }
  }
})
```

### 5. Sales Metrics in Content

Include real numbers when appropriate:

- "We've helped X clients achieve Y results" (from won deals)
- "Our average client sees Z% improvement" (from customer segments)
- "Unlike [competitor], we focus on..." (from competitor analysis)

---

## Data Contracts

### Tables Sales Tower Owns (Read from these)

| Table | Key Fields for Content |
|-------|------------------------|
| `business_profiles` | revenue, margins, capacity |
| `customer_segments` | description, buying_trigger, objections |
| `competitor_analysis` | name, positioning, pricing, your_advantage |
| `deal_outcomes` | outcome, primary_reason, competitor_mentioned |
| `funnel_actuals` | leads, sales, conversion rates |

### Tables Marketing Tower Owns (Write to these)

| Table | Key Fields |
|-------|------------|
| `content_history` | content, source='autopilot', review_status='pending' |
| `content_queue` | (if separate from content_history) |
| `autopilot_settings` | preferences for auto-generation |

---

## API Functions to Expose

For the Marketing Tower to call:

```javascript
// Already exists - gets full sales context
import { getAutonomousContext } from '../lib/businessProfile'

// Already exists - gets recent deal outcomes
import { fetchDealOutcomes, getDealOutcomeStats } from '../lib/crm'

// Example usage in content generation:
const ctx = await getAutonomousContext(userId)
const outcomes = await getDealOutcomeStats(userId)

// Use in prompt:
const prompt = `
Generate a LinkedIn post about overcoming objections.

Context:
- Top objection: "${ctx.customers.worst.objections[0]}"
- Win rate: ${outcomes.winRate}%
- Top win reason: ${outcomes.topWinReason.reason}
`
```

---

## Notification Integration

When autopilot generates content, notify via Smart Alerts:

```javascript
// Insert alert for user
await supabase.from('smart_alerts').insert({
  user_id,
  type: 'content_ready',
  title: '3 posts ready for review',
  message: 'Autopilot generated content based on your recent wins',
  action_url: '/crm/content-queue',
  priority: 'medium'
})
```

---

## Questions for Marketing Tower Agent

1. **Scheduling**: How will the autopilot schedule work? Daily? Weekly? On-demand?

2. **Voice Profile**: Are you using the existing `voice_profiles` table for tone matching?

3. **Approval Flow**: Should all autopilot content go through `/crm/content-queue` or a separate queue?

4. **Metrics Feedback**: How will content performance data flow back to improve generation?

5. **Platform Priority**: Which platforms are supported first? (Instagram, LinkedIn, Twitter, Email)

---

## Implementation Suggestion

The autopilot could work as a scheduled Edge Function:

```
Weekly Cron Job (Sunday night)
│
├─> For each active user with autopilot enabled:
│   │
│   ├─> Fetch autonomous context
│   │
│   ├─> Check for triggers (new wins, objection patterns, etc.)
│   │
│   ├─> Generate content batch based on:
│   │   ├─> User's content pillars
│   │   ├─> Sales context (objections, wins, competitors)
│   │   ├─> Voice profile
│   │   └─> What's performed well before
│   │
│   ├─> Insert to content_queue with review_status='pending'
│   │
│   └─> Send notification
│
└─> Done
```

---

## Summary

**Sales Tower provides**: Rich business context, customer intelligence, competitive data, funnel metrics

**Marketing Tower provides**: Content generation, scheduling, approval queue, performance tracking

**Integration point**: `getAutonomousContext(userId)` returns everything needed for personalized content generation.

Let me know if you need any additional data exposed or have questions about the Sales Tower data structures.
