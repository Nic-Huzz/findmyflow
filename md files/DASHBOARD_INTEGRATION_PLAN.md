# Money Model Dashboard Integration Plan

**Created:** 2025-12-04
**Status:** Planning - Awaiting Approval

---

## Overview

Integrate the 4 Money Model assessment flows into the user dashboard to track progress, display results, and provide actionable recommendations.

---

## Goals

1. **Progress Tracking** - Show which flows users have completed (0/4, 1/4, etc.)
2. **Results Display** - Show recommended strategies for each completed flow
3. **Easy Access** - Quick navigation to incomplete flows
4. **Implementation Guidance** - Display key metrics, funnel templates, and success factors
5. **Historical Reference** - Allow users to review past assessments

---

## The 4 Money Model Flows

1. **Attraction Offer** - Front-end lead generation strategies
2. **Upsell Offer** - Revenue maximization strategies
3. **Downsell Offer** - Retention and recovery strategies
4. **Continuity Offer** - Recurring revenue models

---

## Proposed Dashboard Sections

### Section 1: Money Model Progress Card

**Location:** `/me` page (Profile dashboard)

**Visual Design:**
```
┌─────────────────────────────────────────────────┐
│  💰 Money Model Challenge                       │
│                                                 │
│  Progress: 2/4 Completed                        │
│  ▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░ 50%                       │
│                                                 │
│  ✅ Attraction Offer  → View Results            │
│  ✅ Upsell Offer      → View Results            │
│  ⏳ Downsell Offer    → Start Now               │
│  ⏳ Continuity Offer  → Start Now               │
│                                                 │
│  [Complete Your Money Model] Button             │
└─────────────────────────────────────────────────┘
```

**Data Required:**
- Query all 4 assessment tables for user's completed flows
- Calculate completion percentage
- Get latest assessment for each flow

**Component:** `<MoneyModelProgressCard />`

---

### Section 2: Your Recommended Strategies Page

**Location:** New page at `/money-model-results` or tab on `/me`

**Content Structure:**

```
┌─────────────────────────────────────────────────┐
│  Your Money Model Blueprint                     │
│  Last Updated: Dec 4, 2025                      │
├─────────────────────────────────────────────────┤
│                                                 │
│  🎯 ATTRACTION STRATEGY                          │
│  Recommended: Win Your Money Back                │
│  Confidence: 85% Match                          │
│                                                 │
│  Key Metrics to Track:                          │
│  • 70% completion rate                          │
│  • Customer testimonials generated              │
│  • Backend conversion rate                      │
│                                                 │
│  Funnel Structure:                              │
│  1. Free challenge or goal-based offer          │
│  2. Track customer progress automatically       │
│  3. Award refund/credit at completion           │
│  4. Upsell to premium program                   │
│                                                 │
│  [Retake Assessment] [Download PDF]             │
│                                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  💸 UPSELL STRATEGY                              │
│  Recommended: Menu Upsell (Prescribe)           │
│  Confidence: 78% Match                          │
│                                                 │
│  Key Success Factors:                           │
│  • Tell customers what they DON'T need          │
│  • Prescribe the right solution                 │
│  • Use A/B offer approach                       │
│  • Implement card on file                       │
│                                                 │
│  [Retake Assessment] [Download PDF]             │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Data Required:**
- Latest assessment from each table
- Recommended offer details from offers.json
- Confidence scores and alternative recommendations

**Component:** `<MoneyModelResults />`

---

### Section 3: Individual Flow Result Cards

**Location:** Expandable sections on results page

**Each Card Contains:**
- Offer/Strategy name
- Confidence score (visual progress bar)
- Description
- Key success factors (bullet points)
- Implementation steps (numbered list)
- Metrics to track
- When this strategy fails (warnings)
- Alternative strategies scored
- Date completed
- Actions: Retake, Download, Share

---

## Database Queries Needed

### 1. Get User's Money Model Progress

```javascript
// Check completion status for all 4 flows
const { data: progress } = await supabase.rpc('get_money_model_progress', {
  p_user_id: user.id
})

// Returns:
// {
//   attraction_completed: true,
//   attraction_date: '2025-12-04',
//   upsell_completed: true,
//   upsell_date: '2025-12-04',
//   downsell_completed: false,
//   continuity_completed: false,
//   total_completed: 2,
//   completion_percentage: 50
// }
```

### 2. Get Latest Assessment Results

```javascript
// Attraction
const { data: attractionResult } = await supabase
  .from('attraction_offer_assessments')
  .select('*')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false })
  .limit(1)
  .single()

// Same pattern for upsell, downsell, continuity
```

### 3. Get Historical Assessments

```javascript
// Get all past assessments for review
const { data: history } = await supabase
  .from('attraction_offer_assessments')
  .select('id, created_at, recommended_offer_name, confidence_score')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false })
```

---

## Database Schema Additions

### Option A: Create View (Recommended)

```sql
-- Create a view that aggregates all Money Model progress
CREATE OR REPLACE VIEW money_model_progress AS
SELECT
  u.id as user_id,
  u.email,

  -- Attraction Offer
  (SELECT COUNT(*) > 0 FROM attraction_offer_assessments WHERE user_id = u.id) as attraction_completed,
  (SELECT MAX(created_at) FROM attraction_offer_assessments WHERE user_id = u.id) as attraction_date,
  (SELECT recommended_offer_name FROM attraction_offer_assessments WHERE user_id = u.id ORDER BY created_at DESC LIMIT 1) as attraction_recommendation,

  -- Upsell Offer
  (SELECT COUNT(*) > 0 FROM upsell_assessments WHERE user_id = u.id) as upsell_completed,
  (SELECT MAX(created_at) FROM upsell_assessments WHERE user_id = u.id) as upsell_date,
  (SELECT recommended_offer_name FROM upsell_assessments WHERE user_id = u.id ORDER BY created_at DESC LIMIT 1) as upsell_recommendation,

  -- Downsell Offer
  (SELECT COUNT(*) > 0 FROM downsell_assessments WHERE user_id = u.id) as downsell_completed,
  (SELECT MAX(created_at) FROM downsell_assessments WHERE user_id = u.id) as downsell_date,
  (SELECT recommended_offer_name FROM downsell_assessments WHERE user_id = u.id ORDER BY created_at DESC LIMIT 1) as downsell_recommendation,

  -- Continuity Offer
  (SELECT COUNT(*) > 0 FROM continuity_assessments WHERE user_id = u.id) as continuity_completed,
  (SELECT MAX(created_at) FROM continuity_assessments WHERE user_id = u.id) as continuity_date,
  (SELECT recommended_offer_name FROM continuity_assessments WHERE user_id = u.id ORDER BY created_at DESC LIMIT 1) as continuity_recommendation,

  -- Overall Progress
  (
    (SELECT COUNT(*) > 0 FROM attraction_offer_assessments WHERE user_id = u.id)::int +
    (SELECT COUNT(*) > 0 FROM upsell_assessments WHERE user_id = u.id)::int +
    (SELECT COUNT(*) > 0 FROM downsell_assessments WHERE user_id = u.id)::int +
    (SELECT COUNT(*) > 0 FROM continuity_assessments WHERE user_id = u.id)::int
  ) as total_completed,

  (
    (
      (SELECT COUNT(*) > 0 FROM attraction_offer_assessments WHERE user_id = u.id)::int +
      (SELECT COUNT(*) > 0 FROM upsell_assessments WHERE user_id = u.id)::int +
      (SELECT COUNT(*) > 0 FROM downsell_assessments WHERE user_id = u.id)::int +
      (SELECT COUNT(*) > 0 FROM continuity_assessments WHERE user_id = u.id)::int
    ) * 100.0 / 4
  ) as completion_percentage

FROM auth.users u;

-- Enable RLS
ALTER VIEW money_model_progress SET (security_invoker = on);
```

### Option B: Create Function (Alternative)

```sql
CREATE OR REPLACE FUNCTION get_money_model_progress(p_user_id UUID)
RETURNS TABLE (
  flow_name TEXT,
  completed BOOLEAN,
  completed_date TIMESTAMPTZ,
  recommendation TEXT,
  confidence_score DECIMAL
) AS $$
BEGIN
  -- Return progress for all 4 flows
  RETURN QUERY
  SELECT 'Attraction Offer'::TEXT, ...
  UNION ALL
  SELECT 'Upsell Offer'::TEXT, ...
  UNION ALL
  SELECT 'Downsell Offer'::TEXT, ...
  UNION ALL
  SELECT 'Continuity Offer'::TEXT, ...;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Components to Create

### 1. `MoneyModelProgressCard.jsx`
- Displays completion status on `/me` page
- Shows 4 flow tiles with status icons
- Progress bar
- CTA button

### 2. `MoneyModelResults.jsx`
- Full page or tab showing all recommendations
- Fetches latest assessments
- Loads offer details from JSON files
- Displays implementation guidance

### 3. `FlowResultCard.jsx`
- Reusable card for each flow's results
- Shows recommendation, confidence, metrics, steps
- Expandable/collapsible sections
- Actions: Retake, Download, Share

### 4. `MoneyModelBadge.jsx`
- Completion badge (0/4, 1/4, 2/4, 3/4, 4/4 Complete!)
- Different visual states based on progress
- Optional celebration animation at 4/4

---

## File Structure

```
/src/
  ├── components/
  │   └── MoneyModel/
  │       ├── MoneyModelProgressCard.jsx
  │       ├── MoneyModelResults.jsx
  │       ├── FlowResultCard.jsx
  │       └── MoneyModelBadge.jsx
  │
  ├── pages/
  │   └── MoneyModelResults.jsx  (full page view)
  │
  └── lib/
      └── moneyModelHelpers.js  (utility functions)

/src/components/MoneyModel/
  └── MoneyModel.css  (shared styles)

/supabase/migrations/
  └── 20251204_03_money_model_progress_view.sql
```

---

## Implementation Phases

### Phase 1: Data Layer ✅
- ✅ Database tables created (attraction, upsell, downsell migrations)
- ⏳ Create continuity_assessments table
- ⏳ Create money_model_progress view
- ⏳ Test queries

### Phase 2: Progress Card
- Create MoneyModelProgressCard component
- Add to Profile.jsx
- Display completion status
- Link to flows

### Phase 3: Results Page
- Create MoneyModelResults page
- Fetch assessment data
- Load offer details from JSON
- Display recommendations with implementation guidance

### Phase 4: Enhanced Features
- Download PDF functionality
- Share results
- Retake assessment flow
- Progress badges/gamification
- Celebration on 4/4 completion

---

## Open Questions for Discussion

1. **Results Page Location:**
   - Option A: Separate page at `/money-model-results`
   - Option B: Tab on `/me` page
   - Option C: Modal/overlay from progress card
   - **Your preference?**

2. **Progress Card Placement on `/me`:**
   - Top of page (high priority)
   - After Flow Tracker
   - Separate "Money Model" section
   - **Where should it go?**

3. **Retake Assessment:**
   - Allow retaking? (creates new record)
   - Show history of all attempts?
   - Or just show latest result only?
   - **How should we handle this?**

4. **PDF Download:**
   - Generate PDF server-side?
   - Client-side PDF generation?
   - Just show printable view?
   - **Implementation approach?**

5. **Completion Rewards:**
   - Badge/trophy for 4/4 completion?
   - Unlock something special?
   - Email notification?
   - **Any gamification?**

---

## Estimated Complexity

- **Phase 1 (Data):** Easy - 1-2 hours
- **Phase 2 (Progress Card):** Medium - 2-3 hours
- **Phase 3 (Results Page):** Medium - 3-4 hours
- **Phase 4 (Enhanced Features):** Medium-Hard - 4-6 hours

**Total:** ~10-15 hours of development

---

## Next Steps

1. **Review this plan** - Discuss open questions
2. **Agree on approach** - Decide on architecture choices
3. **Build Phase 1** - Database view/function
4. **Build Phase 2** - Progress card
5. **Build Phase 3** - Results page
6. **Build Phase 4** - Enhanced features (optional)

---

**Ready to discuss and refine this plan?**
