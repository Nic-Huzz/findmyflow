# Business Profile Architecture

## Overview

The Business Profile is a **unified data layer** that aggregates user business information from multiple flows and tables to power intelligent features across both Marketing Tower and Sales Tower.

**Status:** Service layer designed, not yet implemented as a single table.

**Decision:** We chose a **service aggregation pattern** over a single table because:
1. Data is captured contextually in different flows (better UX)
2. Avoids data duplication and sync issues
3. Each flow can evolve independently
4. Real-time aggregation ensures latest data

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    getUserBusinessProfile()                      │
│                    (Service Aggregation Layer)                   │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ OFFER DATA    │   │ AUDIENCE DATA │   │ STRATEGY DATA │
│               │   │               │   │               │
│ offer_creations│   │ nikigai_*     │   │ content_      │
│ products      │   │ persona_      │   │ strategies    │
│ ltv_models    │   │ profiles      │   │ leads_        │
│ *_assessments │   │               │   │ assessments   │
└───────────────┘   └───────────────┘   └───────────────┘
```

---

## Data Sources

### 1. Offer & Pricing Data

| Table | Key Fields | Source Flow |
|-------|-----------|-------------|
| `offer_creations` | `dream_outcome_bucket`, `price`, `selected_version`, `bonuses`, `total_value`, `grand_slam_score` | OfferBuilder100M |
| `products` | `name`, `type` (core/upsell/downsell/continuity/lead_magnet), `price` | Money Model flows |
| `ltv_models` | `core_price`, `upsell_price`, `upsell_rate`, `monthly_subscription`, `total_ltv`, `target_cac` | Manual entry |
| `attraction_offer_assessments` | `recommended_offer_id`, `confidence_score` | AttractionOfferFlow |
| `upsell_assessments` | `recommended_offer_id`, `all_offer_scores` | UpsellFlow |
| `downsell_assessments` | `recommended_offer_id` | DownsellFlow |
| `continuity_assessments` | `recommended_offer_id` | ContinuityFlow |
| `offer_builder_assessments` | `pain_level`, `problem_area`, `niche_definition`, `mvp_description` | OfferBuilderFlow |

### 2. Audience & Persona Data

| Table | Key Fields | Source Flow |
|-------|-----------|-------------|
| `nikigai_key_outcomes` | `top_skill_clusters`, `top_problem_clusters`, `target_personas`, `opportunity_statements` | FlowFinderIntegration |
| `nikigai_clusters` | `cluster_type`, `cluster_label`, `items`, `score` | FlowFinder flows |
| `persona_profiles` | Customer persona details | PersonaSelectionFlow |

### 3. Marketing Strategy Data

| Table | Key Fields | Source Flow |
|-------|-----------|-------------|
| `content_strategies` | `lead_strategy`, `primary_platform`, `revenue_goal`, `core_offer_price`, `lead_magnet_type`, `follower_count`, `avg_views_per_post`, `calculated_targets` | ContentStrategyFlow |
| `leads_assessments` | `recommended_strategy_id` (warm_outreach/cold_outreach/post_free_content/run_paid_ads) | LeadsStrategyFlow |
| `marketing_metrics` | `posts_count`, `total_reach`, `engagement_rate`, `leads_generated`, `revenue_generated` | Aggregated tracking |

### 4. Sales Pipeline Data

| Table | Key Fields | Source Flow |
|-------|-----------|-------------|
| `deals` | `value`, `stage`, `pain_score`, `trust_score`, `urgency_score`, `fit_score` (PTUF), `lead_temperature` | CRM manual entry |
| `sales_scripts` | Script templates with usage tracking | ScriptsModal |

---

## Fields NOT Yet Captured (Needed)

### Business Type (P3 Framework - Seth Godin)

**Where to add:** `offer_creations` or new step in OfferBuilder100M

| Field | Type | Values |
|-------|------|--------|
| `business_type` | TEXT | 'jobber', 'coordinator', 'labor_organizer', 'asset_owner' |

**Definitions:**
- **Jobber**: Take something, make it special for a specific audience (premium products/services)
- **Coordinator**: Connect people who want to be connected (directories, events, marketplaces)
- **Labor Organizer**: Connect labor with those who need it (agencies, staffing, freelancer networks)
- **Asset Owner**: Own something that makes life easier (tools, platforms, rentals)

### Revenue Model

**Where to add:** `offer_creations` or `content_strategies`

| Field | Type | Values |
|-------|------|--------|
| `revenue_model` | TEXT | 'one_time', 'subscription', 'commission', 'hybrid' |
| `commission_rate` | DECIMAL | For commission-based (e.g., 0.15 for 15%) |
| `subscription_interval` | TEXT | 'monthly', 'annual', 'weekly' |
| `current_mrr` | INTEGER | Existing monthly recurring revenue |

---

## Proposed Service Implementation

```javascript
// src/lib/businessProfile.js

export async function getUserBusinessProfile(userId) {
  // Fetch all relevant data in parallel
  const [
    offerData,
    products,
    ltvModel,
    strategy,
    leadsAssessment,
    personaData,
    nikigaiOutcomes,
  ] = await Promise.all([
    fetchLatestOffer(userId),
    fetchProducts(userId),
    fetchLTVModel(userId),
    fetchContentStrategy(userId),
    fetchLeadsAssessment(userId),
    fetchPersonaProfile(userId),
    fetchNikigaiOutcomes(userId),
  ])

  return {
    // Business Type & Model
    businessType: offerData?.business_type || null,
    revenueModel: offerData?.revenue_model || 'one_time',

    // Offer Stack
    offers: {
      core: {
        name: offerData?.dream_outcome || products?.find(p => p.type === 'core')?.name,
        price: strategy?.core_offer_price || offerData?.price || products?.find(p => p.type === 'core')?.price,
        version: offerData?.selected_version,
      },
      upsell: products?.find(p => p.type === 'upsell'),
      downsell: products?.find(p => p.type === 'downsell'),
      continuity: products?.find(p => p.type === 'continuity'),
      leadMagnet: {
        type: strategy?.lead_magnet_type,
        product: products?.find(p => p.type === 'lead_magnet'),
      },
    },

    // LTV & Revenue
    ltv: ltvModel?.total_ltv,
    targetCac: ltvModel?.target_cac_3_1,
    currentMrr: offerData?.current_mrr || 0,
    revenueGoal: strategy?.revenue_goal,

    // Audience
    audience: {
      followerCount: strategy?.follower_count,
      avgReachPerPost: strategy?.avg_views_per_post,
      platform: strategy?.primary_platform,
      personas: nikigaiOutcomes?.target_personas,
      problems: nikigaiOutcomes?.top_problem_clusters,
      skills: nikigaiOutcomes?.top_skill_clusters,
    },

    // Strategy
    strategy: {
      leadStrategy: strategy?.lead_strategy || leadsAssessment?.recommended_strategy_id,
      calculatedTargets: strategy?.calculated_targets,
    },

    // Confidence
    dataCompleteness: calculateCompleteness({
      hasOffer: !!offerData,
      hasPrice: !!(strategy?.core_offer_price || offerData?.price),
      hasAudience: !!(strategy?.follower_count && strategy?.avg_views_per_post),
      hasPersona: !!nikigaiOutcomes?.target_personas,
      hasStrategy: !!strategy?.lead_strategy,
    }),
  }
}
```

---

## Screenshot Integration for Auto-Updating Metrics

### Current Flow
The `analyzeMetricsScreenshot()` function (via Claude Vision) extracts from post screenshots:
- `reach` - unique accounts reached
- `impressions` - total views
- `likes`, `comments`, `shares`, `saves`
- `engagement_rate`
- `platform`

### Proposed Enhancement
When users upload screenshots in Marketing Tower, auto-update `content_strategies`:

```javascript
// After successful screenshot analysis:
async function updateStrategyFromScreenshot(userId, metrics) {
  // Get existing strategy
  const strategy = await fetchContentStrategy(userId)

  // Calculate rolling average (last 3 posts)
  const existingViews = strategy?.avg_views_per_post || 0
  const newViews = metrics.reach || metrics.impressions

  // If this is a new data point, blend with existing
  const updatedAvg = existingViews > 0
    ? Math.round((existingViews * 2 + newViews) / 3) // Weighted toward recent
    : newViews

  // Update strategy
  await supabase
    .from('content_strategies')
    .update({
      avg_views_per_post: updatedAvg,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)

  // Also store in marketing_metrics for historical tracking
  await supabase
    .from('marketing_metrics')
    .upsert({
      user_id: userId,
      period_type: 'post',
      period_start: metrics.post_date || new Date().toISOString().split('T')[0],
      period_end: metrics.post_date || new Date().toISOString().split('T')[0],
      total_reach: metrics.reach,
      total_impressions: metrics.impressions,
      total_engagements: (metrics.likes || 0) + (metrics.comments || 0) + (metrics.shares || 0),
      posts_count: 1,
      platform_breakdown: { [metrics.platform]: { reach: metrics.reach, engagements: metrics.likes + metrics.comments } },
    })
}
```

### Locations That Should Trigger Updates
1. `MetricsScreenshotUpload.jsx` - after successful analysis
2. `CRMDashboard` - when viewing/logging task completion
3. Future: Automatic fetch from platform APIs

---

## For Sales Tower Agent

### Fields You May Want to Add

Consider adding to capture sales-specific business context:

| Field | Table | Purpose |
|-------|-------|---------|
| `sales_cycle_length` | `offer_creations` | Avg days from lead to close |
| `close_rate` | `ltv_models` or `deals` aggregate | % of proposals that close |
| `avg_deal_size` | `deals` aggregate | For commission models |
| `objection_patterns` | `deals` or new table | Common objections encountered |
| `decision_maker_type` | `persona_profiles` | B2B: C-suite, Manager, Individual |
| `buying_trigger` | `offer_creations` | What causes urgency to buy |

### Integration Points

Your Sales Tower can pull from:
1. `getUserBusinessProfile()` for context
2. `deals` table for pipeline data
3. `sales_scripts` for script templates
4. `offer_creations` for offer details to reference in sales

### Recommended Actions
1. Add `business_type` field to `offer_creations` (P3 framework)
2. Add `revenue_model` field to `offer_creations`
3. Create `getUserBusinessProfile()` service
4. Connect screenshot uploads to auto-update metrics

---

## File Locations

| Purpose | Path |
|---------|------|
| **Business Profile Service** | `src/lib/businessProfile.js` |
| Strategy Calculator | `src/lib/strategyCalculator.js` |
| Marketing Benchmarks | `src/lib/marketingBenchmarks.js` |
| Content Strategy | `src/lib/contentStrategy.js` |
| Screenshot Analysis | `src/lib/screenshotAnalysis.js` |
| Voice Profile | `src/lib/voiceProfile.js` |
| Metrics Screenshot Edge Function | `supabase/functions/analyze-metrics-screenshot/` |
| Content Strategy Flow | `src/flows/ContentStrategyFlow.jsx` |
| Goal-Based Strategy Component | `src/components/crm/GoalBasedStrategy.jsx` |
| Implementation Tracker | `src/pages/crm/ImplementationTracker.jsx` |
| Tier 3 Specification | `docs/TIER_3_AI_IMPLEMENTATION_COACH.md` |

---

## Next Steps

1. [x] Create `getUserBusinessProfile()` service in `src/lib/businessProfile.js` - **COMPLETED Jan 2026**
2. [ ] Add `business_type` and `revenue_model` to OfferBuilder100M
3. [ ] Connect screenshot analysis to auto-update `avg_views_per_post`
4. [x] Sales Tower agent to add sales-specific fields - **COMPLETED Jan 2026** (integrated into businessProfile.js)
5. [ ] Create unified Business Profile dashboard view

---

## Implementation Notes (Jan 2026)

### Service Implementation Complete

The `getUserBusinessProfile()` service has been implemented in `src/lib/businessProfile.js` with:

- Parallel fetching from all data sources for performance
- Voice profile integration for AI generation
- Assessment data extraction (upsell, downsell, continuity responses)
- Convenience functions: `getOfferStack()`, `getVoiceForGeneration()`, `getOfferContext()`
- Data completeness calculation for UI guidance

### Sales Tower Integration

The service now supports both Marketing Tower and Sales Tower with:

- Extracted response values from Money Model assessments
- Raw assessment access for advanced AI context
- Voice profile with enhanced instructions builder
- Offer context helper for implementation tasks

See `docs/TIER_3_AI_IMPLEMENTATION_COACH.md` for how Sales Tower uses this service.
