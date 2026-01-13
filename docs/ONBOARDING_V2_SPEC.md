# Onboarding V2 Specification

## Overview

This document specifies the revamped onboarding flow that integrates Wealth Ladder identification with the existing "Finding Your Flow" narrative.

---

## Part 1: Persona Questions (Revised)

### Question 1: "Where are you in your flow journey?"
*Captures: Employment status + stage*

| Option | Label | Description | Data |
|--------|-------|-------------|------|
| A | Exploring from my day job | I'm employed, searching for what lights me up | `employment: employed`, `has_side_project: false` |
| B | Building on the side | I'm employed, growing something alongside my job | `employment: employed`, `has_side_project: true` |
| C | Gone solo, finding my footing | I've left employment, still building momentum | `employment: self_employed`, `stage: early` |
| D | Making it work | I'm self-employed with paying clients | `employment: self_employed`, `stage: established` |

### Question 2: "What have you created so far?"
*Captures: Wealth Ladder position*

| Option | Label | Description | Data |
|--------|-------|-------------|------|
| A | Still discovering | Nothing concrete yet, exploring possibilities | `wealth_ladder: pre_ladder` |
| B | Trading my time | A service where I work with clients directly | `wealth_ladder: service` |
| C | Packaged offerings | Courses, programs, or fixed-scope packages | `wealth_ladder: productized` |
| D | Products people buy | Digital products, software, or physical goods | `wealth_ladder: products` |

### Question 3: "What would help you find your flow?"
*Captures: Ambition + goal*

| Option | Label | Description | Data |
|--------|-------|-------------|------|
| A | Clarity on my path | Finally knowing what I'm meant to build | `goal: discovery` |
| B | An offer that resonates | Creating something people actually want | `goal: creation` |
| C | Consistent clients | Landing paying customers regularly | `goal: monetization` |
| D | Scale and systems | Growing what's already working | `goal: growth` |

---

## Part 2: Path Definitions

### Path 1: Vibe Seeker (Discovery Mode)
**Trigger:** `wealth_ladder: pre_ladder`

```
Persona Questions
      ↓
Flow Finder (Skills → Problems → Persona)
      ↓
Solution Type Guidance ← GUIDED CHOICE
      ↓
First Offer Builder
      ↓
Project Created → Stage 1
```

#### Solution Type Guidance (New Screen)

**Design: Guide toward Services with escape hatch**

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  "Based on your skills, here's the fastest path to         │
│   your first paying client:"                                │
│                                                             │
│  ┌─────────────────────────────────────────┐                │
│  │  ✨ Start with a Service                │                │
│  │                                         │                │
│  │  Work directly with clients, learn what │                │
│  │  works, then turn it into a product.    │                │
│  │                                         │                │
│  │  This is how most successful            │                │
│  │  entrepreneurs begin.                   │                │
│  │                                         │                │
│  │  [ Start Here ] ← PRIMARY CTA           │                │
│  └─────────────────────────────────────────┘                │
│                                                             │
│  ───────────────────────────────────────────                │
│                                                             │
│  "Already know you want to build something else?"           │
│                                                             │
│  ○ I want to create a course or program                     │
│  ○ I want to build a digital product                        │
│  ○ I want to sell physical products                         │
│                                                             │
│  [ Continue with this instead ]                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Rationale shown:** "Why services first? You'll learn what clients actually need, get paid while learning, and have proven material to turn into products later."

---

### Path 2: Vibe Riser - Service Level
**Trigger:** `wealth_ladder: service`

```
Persona Questions
      ↓
Quick Capture (name, one-liner, who you help)
      ↓
Delivery Model Question ← NEW
      ↓
Multiple Offers Question ← NEW
      ↓
Route based on answer:
  - Single offer → Offer Builder
  - Multiple offers → Product Suite Builder (lite)
      ↓
Project Created → Stage 2-3
```

#### Delivery Model Question (New Screen)

```
┌─────────────────────────────────────────────────────────────┐
│  "How do you deliver your service?"                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ○ Custom for each client                                   │
│    Every engagement is different based on their needs       │
│    → product_type: custom_service                           │
│                                                             │
│  ○ Same package every time                                  │
│    Standardized deliverables and process                    │
│    → product_type: packaged_service                         │
│                                                             │
│  ○ Mix of both                                              │
│    Some custom, some packaged                               │
│    → product_type: hybrid_service                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Multiple Offers Question (New Screen)

```
┌─────────────────────────────────────────────────────────────┐
│  "How many offers do you currently sell?"                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ○ Just one main thing                                      │
│    I focus on a single offer                                │
│    → route: offer_builder                                   │
│                                                             │
│  ○ A few different offers                                   │
│    I have multiple things I sell                            │
│    → route: product_suite_builder                           │
│                                                             │
│  ○ One now, planning to add more                            │
│    Starting with one, building toward a suite               │
│    → route: offer_builder (with suite builder teaser)       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### Path 3: Vibe Riser - Productized Level
**Trigger:** `wealth_ladder: productized`

```
Persona Questions
      ↓
Quick Capture (name, main offer)
      ↓
Offering Type Question ← NEW
      ↓
Product Suite Builder
      ↓
Project Created → Stage 4-5
```

#### Offering Type Question

```
┌─────────────────────────────────────────────────────────────┐
│  "What type of offering do you have?"                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ○ Self-paced course                                        │
│    People go through on their own time                      │
│    → product_type: automated_group                          │
│                                                             │
│  ○ Live cohort or coaching program                          │
│    You facilitate live sessions                             │
│    → product_type: live_group                               │
│                                                             │
│  ○ Done-for-you packages                                    │
│    Team delivers standardized work                          │
│    → product_type: managed_service                          │
│                                                             │
│  ○ Membership or community                                  │
│    Ongoing access to content/community                      │
│    → product_type: membership                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Note:** Path 3 already routes to Product Suite Builder, so the "multiple offers" question is handled there (users map all their products).

---

### Path 4: Movement Maker - Products Level
**Trigger:** `wealth_ladder: products`

```
Persona Questions
      ↓
Quick Capture (name, primary product)
      ↓
Product Type Question ← NEW
      ↓
Product Suite Import
      ↓
CRM Setup
      ↓
Project Created → Stage 6-7
```

#### Product Type Question

```
┌─────────────────────────────────────────────────────────────┐
│  "What type of products do you sell?"                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ○ Digital products                                         │
│    Templates, ebooks, downloads                             │
│    → product_subtype: digital                               │
│                                                             │
│  ○ Software / SaaS                                          │
│    Apps, platforms, tools                                   │
│    → product_subtype: software                              │
│                                                             │
│  ○ Physical products                                        │
│    Merchandise, equipment, goods                            │
│    → product_subtype: physical                              │
│                                                             │
│  ○ Mix of different types                                   │
│    Multiple product types                                   │
│    → product_subtype: mixed                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Note:** Path 4 already routes to Product Suite Import, so multiple products are captured there.

---

## Part 3: UX Improvements

### 20% Improvements (Include All)

| Improvement | Implementation |
|-------------|----------------|
| **Time estimates** | Show "~2 minutes" on first screen, update per section |
| **Progress bar with labels** | "Step 2 of 3: Your Creations" - named stages not just dots |
| **Micro-illustrations** | Simple icons/illustrations for each option (compass, rocket, chart) |
| **"Why we ask" tooltips** | (i) icon on each question with explanation |
| **Warm transitions** | "Great! Now let's see what you've built..." between questions |
| **Mobile-optimized touch targets** | Minimum 48px tap targets, full-width options on mobile |

### 100% Improvements (Include These)

#### Smart Pre-fills

| Answer Given | Pre-fills Later |
|--------------|-----------------|
| Q1: "Building on the side" | ExistingProjectFlow.hasExistingBusiness = true |
| Q2: "Trading my time" | OfferBuilder.solutionType = "one_to_one" or "one_to_many" |
| Q2: "Packaged offerings" | ProductSuite.hasCore = true |
| Q2: "Products" | CRM.pipelineType = "e-commerce" |
| Q3: "Consistent clients" | Dashboard.primaryMetric = "leads" |
| Q3: "Scale and systems" | Dashboard.primaryMetric = "revenue" |

#### Show Your Reasoning

After persona calculation, show:

```
┌─────────────────────────────────────────────────────────────┐
│  You're a Vibe Riser                                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Here's what we learned:                                    │
│                                                             │
│  ✓ You're building alongside your job                       │
│  ✓ You're trading your time for money (services)            │
│  ✓ Your goal is landing consistent clients                  │
│                                                             │
│  Based on this, we recommend:                               │
│                                                             │
│  → Start with the Offer Builder to create an                │
│    irresistible offer people can't say no to                │
│                                                             │
│  [ Let's do it ]                                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Part 4: Zarlo "I'm Unsure" Mode

### Trigger
When user clicks "I'm not sure" on any question, or hovers/pauses for extended time.

### Behavior
Zarlo widget pulses gently, then opens with contextual guidance:

```
┌─────────────────────────────────────────────────────────────┐
│  🤖 Zarlo                                           [close] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  "No worries! Let me help you figure this out."             │
│                                                             │
│  [Contextual question based on current screen]              │
│                                                             │
│  For Q1 (Journey):                                          │
│  "Are you currently getting a paycheck from an employer?"   │
│  → Yes → "Do you have anything going on the side?"          │
│  → No → "Are you making money from your own thing?"         │
│                                                             │
│  For Q2 (Created):                                          │
│  "Have you ever been paid for your skills or knowledge?"    │
│  → Yes → "Was it custom work or a set package?"             │
│  → No → "That's okay! 'Still discovering' is your answer"   │
│                                                             │
│  For Q3 (Goal):                                             │
│  "What keeps you up at night about your business?"          │
│  → "I don't know what to do" → Clarity                      │
│  → "I can't get clients" → Consistent clients               │
│  → "I'm maxed out" → Scale and systems                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Implementation Notes
- Add `onUnsure` callback to each question component
- Track "unsure" clicks for analytics (shows where people struggle)
- Zarlo responses stored in `zarloPageContent.js` keyed by question ID
- Conversation can result in auto-selecting an answer or manual confirmation

---

## Part 5: Flow Report Card

### Concept
A living document that shows everything we know about the user, with filled and empty states. Visible from Profile page, updated after each flow completion.

### Design

```
┌─────────────────────────────────────────────────────────────┐
│  YOUR FLOW REPORT CARD                          [Share PDF] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─── IDENTITY ─────────────────────────────────────────┐   │
│  │                                                      │   │
│  │  Essence: The Visionary          ✓ Complete          │   │
│  │  Protective: The Perfectionist   ✓ Complete          │   │
│  │  Persona: Vibe Riser             ✓ Complete          │   │
│  │                                                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─── WEALTH LADDER POSITION ───────────────────────────┐   │
│  │                                                      │   │
│  │  ○ ─── ○ ─── ● ─── ○                                │   │
│  │  Job   Service  Productized  Products               │   │
│  │                    ↑                                 │   │
│  │              You are here                            │   │
│  │                                                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─── YOUR FLOW ────────────────────────────────────────┐   │
│  │                                                      │   │
│  │  Skills (3 discovered)           ✓ Complete          │   │
│  │  • Strategic thinking                                │   │
│  │  • Simplifying complexity                            │   │
│  │  • Building systems                                  │   │
│  │                                                      │   │
│  │  Problems You Solve              ✓ Complete          │   │
│  │  • Overwhelmed entrepreneurs need clarity            │   │
│  │                                                      │   │
│  │  Ideal Customer                  ✓ Complete          │   │
│  │  • Solo consultants, 2-5 years in                    │   │
│  │                                                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─── PRODUCT SUITE ────────────────────────────────────┐   │
│  │                                                      │   │
│  │  Attraction Offer                ○ Not yet           │   │
│  │  [ + Add attraction offer ]                          │   │
│  │                                                      │   │
│  │  Core Offer                      ✓ Complete          │   │
│  │  • "90-Day Clarity Sprint" - $2,500                  │   │
│  │  • Type: Packaged Service                            │   │
│  │                                                      │   │
│  │  Upsell                          ○ Not yet           │   │
│  │  [ + Add upsell ]                                    │   │
│  │                                                      │   │
│  │  Continuity                      ○ Not yet           │   │
│  │  [ + Add continuity offer ]                          │   │
│  │                                                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─── BUSINESS METRICS ─────────────────────────────────┐   │
│  │                                                      │   │
│  │  Revenue Goal                    ○ Not set           │   │
│  │  [ Set your goal ]                                   │   │
│  │                                                      │   │
│  │  Funnel Metrics                  ○ Not tracking      │   │
│  │  [ Start tracking ]                                  │   │
│  │                                                      │   │
│  │  Active Leads                    ○ No CRM data       │   │
│  │  [ Set up CRM ]                                      │   │
│  │                                                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ────────────────────────────────────────────────────────   │
│                                                             │
│  Profile Completeness: 47%                                  │
│  [████████░░░░░░░░░░░░] 8 of 17 items                       │
│                                                             │
│  🎯 Next recommended: Add an Attraction Offer               │
│     "This is how people discover your core offer"           │
│     [ Do this now → ]                                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Sections

| Section | Data Source | Empty State CTA |
|---------|-------------|-----------------|
| **Identity** | PersonaAssessment, HomeFirstTime | "Complete your profile" |
| **Wealth Ladder** | Onboarding Q2 | Visual always shown |
| **Your Flow** | Flow Finder (nikigai_clusters) | "Discover your skills" |
| **Product Suite** | products table | "Add [tier] offer" |
| **Business Metrics** | funnel_metrics, deals, user_stats | "Set goal" / "Start tracking" |

### Gamification Elements

1. **Completeness percentage** - Progress bar showing profile completion
2. **Next recommended action** - AI-powered suggestion based on gaps
3. **Milestone badges** - Unlocked when sections complete
4. **Share capability** - Export as PDF or shareable link

### Database Fields to Track

```javascript
const REPORT_CARD_ITEMS = {
  identity: {
    essence_archetype: { source: 'lead_flow_profiles', required: true },
    protective_archetype: { source: 'lead_flow_profiles', required: true },
    persona: { source: 'user_stage_progress', required: true },
  },
  wealth_ladder: {
    current_rung: { source: 'user_stage_progress', required: true },
    employment_status: { source: 'user_stage_progress', required: true },
  },
  flow: {
    skills: { source: 'nikigai_clusters', type: 'skills', required: false },
    problems: { source: 'nikigai_clusters', type: 'problems', required: false },
    persona: { source: 'nikigai_clusters', type: 'persona', required: false },
  },
  product_suite: {
    attraction: { source: 'products', tier: 'attraction', required: false },
    core: { source: 'products', tier: 'core', required: false },
    upsell: { source: 'products', tier: 'upsell', required: false },
    downsell: { source: 'products', tier: 'downsell', required: false },
    continuity: { source: 'products', tier: 'continuity', required: false },
  },
  metrics: {
    revenue_goal: { source: 'user_stats', required: false },
    funnel_baseline: { source: 'funnel_metrics', required: false },
    crm_setup: { source: 'deals', minCount: 1, required: false },
  }
};
```

---

## Part 6: Implementation Priority

### Phase 1: Core Onboarding (High Priority)
1. Update persona-assessment.json with new questions
2. Update HomeFirstTime.jsx with new Q1-Q3
3. Add Path 1 Solution Type Guidance screen
4. Add Path 2 Delivery Model + Multiple Offers questions
5. Add Path 3 Offering Type question
6. Add Path 4 Product Type question
7. Store all new data fields in user_stage_progress

### Phase 2: UX Polish (Medium Priority)
1. Add time estimates to all screens
2. Add progress bar with labels
3. Add micro-illustrations
4. Add "Why we ask" tooltips
5. Add warm transitions
6. Implement smart pre-fills
7. Add "Show your reasoning" screen

### Phase 3: Zarlo Integration (Medium Priority)
1. Add "I'm not sure" option to each question
2. Create Zarlo conversation flows for each question
3. Add hesitation detection (time on screen)
4. Store unsure interactions for analytics

### Phase 4: Flow Report Card (Lower Priority)
1. Create FlowReportCard component
2. Add to Profile page
3. Implement completeness calculation
4. Add "Next recommended" logic
5. Add PDF export
6. Add shareable link generation

---

## Appendix: Data Schema Updates

```sql
-- Add new fields to user_stage_progress
ALTER TABLE user_stage_progress ADD COLUMN employment_status TEXT;
ALTER TABLE user_stage_progress ADD COLUMN has_side_project BOOLEAN DEFAULT false;
ALTER TABLE user_stage_progress ADD COLUMN wealth_ladder_rung TEXT;
ALTER TABLE user_stage_progress ADD COLUMN primary_goal TEXT;
ALTER TABLE user_stage_progress ADD COLUMN delivery_model TEXT;
ALTER TABLE user_stage_progress ADD COLUMN num_offers TEXT; -- 'single', 'multiple', 'planning_more'
ALTER TABLE user_stage_progress ADD COLUMN product_type TEXT;
ALTER TABLE user_stage_progress ADD COLUMN product_subtype TEXT;

-- Add constraints
ALTER TABLE user_stage_progress
ADD CONSTRAINT valid_employment CHECK (employment_status IN ('employed', 'self_employed', 'between'));

ALTER TABLE user_stage_progress
ADD CONSTRAINT valid_wealth_ladder CHECK (wealth_ladder_rung IN ('pre_ladder', 'service', 'productized', 'products'));

ALTER TABLE user_stage_progress
ADD CONSTRAINT valid_goal CHECK (primary_goal IN ('discovery', 'creation', 'monetization', 'growth'));
```

---

*Document created: January 2026*
*Status: Ready for implementation review*
