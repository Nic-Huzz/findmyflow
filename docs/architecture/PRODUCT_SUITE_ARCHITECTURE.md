# FindMyFlow Product Suite Architecture

## Executive Summary

This document captures the unified architecture for FindMyFlow's product creation and CRM system. The key insight is that **business type and delivery model should be tagged at the PRODUCT level**, not the user or project level, enabling users to build diverse product suites with different delivery mechanisms.

---

## Part 1: Foundational Frameworks

### 1.1 P3 Business Types (Seth Godin)

| Type | Definition | Delivery Model | Example |
|------|------------|----------------|---------|
| **Jobber** | You do the work yourself, 1:1 | High-touch, time-for-money | Coach, Consultant, Freelancer |
| **Coordinator** | You facilitate, clients do work | 1:many facilitation | Course Creator, Workshop Host |
| **Labor Organizer** | Team delivers on your behalf | Managed delivery | Agency, Firm, Practice |
| **Asset Owner** | Create once, sell many times | Scalable products | SaaS, Digital Products, Physical Products |

### 1.2 Wealth Ladder (Nathan Barry)

| Level | Characteristics | Income Ceiling | Scaling Path |
|-------|-----------------|----------------|--------------|
| **Service Business** | Trading time for money | Limited by hours | Raise rates, add team |
| **Productized Services** | Standardized deliverables | Higher margins | Templates, processes |
| **Selling Products** | Create once, sell infinitely | Unlimited | Digital, software, physical |

### 1.3 Money Model Stack (Hormozi)

Each product in a suite can have its own money model:

```
┌─────────────────────────────────────────────────────┐
│                    PRODUCT                           │
├─────────────────────────────────────────────────────┤
│  Attraction Offer  → Entry point, low/no cost       │
│  Core Offer        → Main revenue driver            │
│  Upsell            → Premium tier or add-on         │
│  Downsell          → Reduced tier for objectors     │
│  Continuity        → Recurring revenue model        │
└─────────────────────────────────────────────────────┘
```

---

## Part 2: Merged Product Taxonomy

### 2.1 The 7 Product Types

Combining P3 + Wealth Ladder creates 7 valid product types:

| # | Type | P3 | Wealth Ladder | Example |
|---|------|-----|---------------|---------|
| 1 | **Custom Service** | Jobber | Service | 1:1 Coaching, Consulting |
| 2 | **Packaged Service** | Jobber | Productized | Fixed-scope packages |
| 3 | **Live Group** | Coordinator | Service | Live workshops, cohorts |
| 4 | **Automated Group** | Coordinator | Productized | Self-paced courses |
| 5 | **Custom Agency** | Labor Organizer | Service | Bespoke agency work |
| 6 | **Managed Service** | Labor Organizer | Productized | Retainer packages |
| 7 | **Digital Product** | Asset Owner | Products | Templates, SaaS, physical |

### 2.2 Product Sub-Types (for Digital Products)

```
Digital Product
├── Digital Assets (templates, ebooks, courses)
├── Software/SaaS (apps, platforms, tools)
└── Physical Products (merchandise, equipment)
```

### 2.3 Valid Combinations Matrix

```
                        │ Service │ Productized │ Products │
────────────────────────┼─────────┼─────────────┼──────────┤
Jobber (1:1)            │    ✓    │      ✓      │    ✗     │
Coordinator (1:many)    │    ✓    │      ✓      │    ✗     │
Labor Organizer (team)  │    ✓    │      ✓      │    ✗     │
Asset Owner (scalable)  │    ✗    │      ✗      │    ✓     │
```

---

## Part 3: Data Model

### 3.1 Core Schema

```sql
-- Projects contain multiple products
CREATE TABLE user_projects (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  name TEXT,
  description TEXT,
  current_stage INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products are the core unit - each has its own type and money model
CREATE TABLE products (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES user_projects,
  user_id UUID REFERENCES auth.users,

  -- Product identity
  name TEXT NOT NULL,
  description TEXT,

  -- Classification (the key insight!)
  product_type TEXT NOT NULL, -- One of 7 types
  product_subtype TEXT,       -- For Digital Products: digital/software/physical

  -- Money Model position
  money_model_tier TEXT,      -- attraction/core/upsell/downsell/continuity

  -- Pricing
  price_type TEXT,            -- one_time/subscription/tiered
  price_amount DECIMAL,
  subscription_interval TEXT, -- month/year (if subscription)

  -- Status
  status TEXT DEFAULT 'draft', -- draft/active/archived
  launch_date DATE,

  -- Cross-product links
  upsell_to_product_id UUID REFERENCES products,
  downsell_to_product_id UUID REFERENCES products,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customers journey across products
CREATE TABLE customers (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,

  -- Customer info
  name TEXT,
  email TEXT,

  -- Journey tracking
  entry_product_id UUID REFERENCES products, -- First product they engaged with
  entry_tier TEXT,                           -- Which tier they entered at

  -- Lifetime value
  total_revenue DECIMAL DEFAULT 0,
  products_purchased INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customer-Product relationships
CREATE TABLE customer_products (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES customers,
  product_id UUID REFERENCES products,

  -- Purchase details
  tier_purchased TEXT,        -- attraction/core/upsell/downsell/continuity
  purchase_date DATE,
  amount_paid DECIMAL,

  -- Status for subscriptions
  status TEXT DEFAULT 'active', -- active/churned/paused
  renewal_date DATE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pipeline stages adapt based on product type
CREATE TABLE deals (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES customers,
  product_id UUID REFERENCES products,

  -- Deal tracking
  stage TEXT NOT NULL,
  value DECIMAL,

  -- Product-type-specific fields (populated based on product_type)
  meeting_scheduled TIMESTAMPTZ,  -- For service types
  discovery_completed BOOLEAN,    -- For service types
  proposal_sent BOOLEAN,          -- For agency types
  trial_started DATE,             -- For SaaS types

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.2 Pipeline Stages by Product Type

```javascript
const PIPELINE_STAGES = {
  custom_service: [
    'lead', 'discovery_call', 'proposal', 'negotiation', 'won', 'lost'
  ],
  packaged_service: [
    'lead', 'call_booked', 'call_completed', 'proposal', 'won', 'lost'
  ],
  live_group: [
    'interested', 'registered', 'attended', 'enrolled', 'completed'
  ],
  automated_group: [
    'lead', 'trial', 'purchased', 'completed', 'certified'
  ],
  custom_agency: [
    'lead', 'discovery', 'proposal', 'scope_review', 'contract', 'active', 'completed'
  ],
  managed_service: [
    'lead', 'consultation', 'proposal', 'onboarding', 'active', 'churned'
  ],
  digital_product: {
    digital: ['visited', 'cart', 'purchased', 'refunded'],
    software: ['visited', 'trial', 'converted', 'churned', 'upgraded'],
    physical: ['visited', 'cart', 'ordered', 'shipped', 'delivered', 'returned']
  }
};
```

---

## Part 4: User Journey & Flow Mapping

### 4.1 Three Personas

| Persona | Stage | Starting Point | Primary Need |
|---------|-------|----------------|--------------|
| **Vibe Seeker** | Corporate, exploring | No clear business idea | Discover their flow |
| **Vibe Riser** | Self-employed, struggling | Existing but inconsistent | Systematize & scale |
| **Movement Maker** | Successful, scaling | Proven model | Optimize & expand |

### 4.2 Current Flows vs Ideal Flows

#### Current State (Gaps Identified)

| Flow | Purpose | Gap |
|------|---------|-----|
| Offer Builder V1 | Single offer creation | No product suite context |
| Grand Slam V2 | Refine single offer | Disconnected from V1 |
| Flow Finder | Skills/problems/persona | Doesn't lead to product creation |
| CRM | Track deals | Doesn't know about products |

#### Ideal State (Proposed)

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER JOURNEY BY PERSONA                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  VIBE SEEKER (Discovery-First)                                  │
│  ─────────────────────────────                                  │
│  1. Flow Finder (Skills → Problems → Persona)                   │
│  2. Business Type Identification (guided questions)             │
│  3. First Offer Creation (V1 → V2)                              │
│  4. Product Suite Builder (full money model)                    │
│  5. CRM Setup (auto-configured by products)                     │
│                                                                  │
│  VIBE RISER (Systematize Existing)                              │
│  ────────────────────────────────                               │
│  1. Existing Project Capture (quick import)                     │
│  2. Business Type Identification (from what they do)            │
│  3. Product Suite Builder (map existing offers)                 │
│  4. Gap Analysis (what's missing in money model)                │
│  5. CRM Setup (import existing customers)                       │
│                                                                  │
│  MOVEMENT MAKER (Optimize & Expand)                             │
│  ──────────────────────────────────                             │
│  1. Product Suite Import (bulk entry)                           │
│  2. Performance Dashboard (what's working)                      │
│  3. Expansion Planning (new products/tiers)                     │
│  4. CRM Integration (advanced analytics)                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 The Product Suite Builder Flow (NEW)

This is the missing piece that connects offer creation to CRM:

```
┌─────────────────────────────────────────────────────────────────┐
│                   PRODUCT SUITE BUILDER                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Step 1: Suite Overview                                         │
│  ───────────────────────                                        │
│  "Let's map out your complete product ecosystem"                │
│  [Visual: Empty suite grid]                                     │
│                                                                  │
│  Step 2: Core Offer Identification                              │
│  ─────────────────────────────────                              │
│  "What's your main thing? The offer that generates most         │
│   revenue or that you're most known for?"                       │
│  → Import from Offer Builder OR create new                      │
│  → Auto-classify product type based on delivery                 │
│                                                                  │
│  Step 3: Attraction Strategy                                    │
│  ──────────────────────────                                     │
│  "How do people discover your core offer?"                      │
│  Options:                                                       │
│  - Free lead magnet (content upgrade)                           │
│  - Low-ticket offer (tripwire)                                  │
│  - Free call/consultation                                       │
│  - Community/group access                                       │
│  → Create attraction offer with its own type                    │
│                                                                  │
│  Step 4: Ascension Path                                         │
│  ───────────────────────                                        │
│  "For clients who want MORE after your core offer..."           │
│  → Define upsell offer (higher tier/access)                     │
│  → Define downsell (for price objectors)                        │
│                                                                  │
│  Step 5: Continuity Model                                       │
│  ───────────────────────                                        │
│  "How do you keep clients long-term?"                           │
│  Options:                                                       │
│  - Membership community                                         │
│  - SaaS subscription                                            │
│  - Retainer arrangement                                         │
│  - Consumable products                                          │
│                                                                  │
│  Step 6: Suite Visualization                                    │
│  ──────────────────────────                                     │
│  [Visual: Complete money model with all products]               │
│  Shows: Product types, pricing, cross-sell links                │
│                                                                  │
│  Step 7: CRM Configuration                                      │
│  ─────────────────────────                                      │
│  "Your CRM is now configured for each product type"             │
│  [Preview: Different pipeline views for each product]           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Part 5: Business Type Identification

### 5.1 Recommended Approach: Emergent + Examples

Rather than asking users to self-classify, we INFER their type from offer creation:

```javascript
const TYPE_INFERENCE_RULES = {
  // From Offer Builder V1 solution type
  'one_to_one': {
    p3_type: 'jobber',
    wealth_ladder: 'service',
    product_type: 'custom_service'
  },
  'one_to_many': {
    // Further questions needed
    questions: [
      {
        q: "Do participants join live or self-paced?",
        answers: {
          'live': { product_type: 'live_group', p3_type: 'coordinator', wealth_ladder: 'service' },
          'self_paced': { product_type: 'automated_group', p3_type: 'coordinator', wealth_ladder: 'productized' }
        }
      }
    ]
  },
  'tech_digital': {
    p3_type: 'asset_owner',
    wealth_ladder: 'products',
    product_type: 'digital_product',
    // Sub-type question
    questions: [
      {
        q: "What type of product?",
        answers: {
          'digital_assets': { subtype: 'digital' },
          'software_app': { subtype: 'software' },
          'physical_goods': { subtype: 'physical' }
        }
      }
    ]
  },
  'physical_product': {
    p3_type: 'asset_owner',
    wealth_ladder: 'products',
    product_type: 'digital_product',
    subtype: 'physical'
  }
};
```

### 5.2 Examples-Based Confirmation

After inference, show examples to confirm:

```
Based on what you described, your offer looks like a **Packaged Service**

Examples of Packaged Services:
- "VIP Day" intensive ($2-5K)
- "Website in a Week" package
- "90-Day Transformation" program

Does this match what you're creating?
[ Yes, exactly ] [ Not quite... ]
```

### 5.3 Edge Cases Handling

| Edge Case | Resolution |
|-----------|------------|
| Course + Coaching bundle | Create as 2 products, link as upsell |
| Done-With-You | Classify as Managed Service |
| "I'm not sure" | Default to service, allow reclassification |
| Retainer with flexible scope | Custom Agency type |
| Membership with live + async | Live Group (primary), with bonus content |

---

## Part 6: CRM Adaptation by Product Type

### 6.1 Feature Availability Matrix

| Feature | Custom Service | Packaged | Live Group | Auto Group | Agency | Managed | Digital |
|---------|---------------|----------|------------|------------|--------|---------|---------|
| Discovery Calls | ✓ | ✓ | ○ | ✗ | ✓ | ✓ | ✗ |
| Proposals | ✓ | ○ | ✗ | ✗ | ✓ | ✓ | ✗ |
| Cohort Tracking | ✗ | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Cart Abandonment | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ | ✓ |
| Trial Management | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ | ✓ |
| Show Rate | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ | ✗ |
| Churn Tracking | ✗ | ✗ | ✓ | ✓ | ✗ | ✓ | ✓ |
| Inventory | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ○ |

Legend: ✓ = Core feature, ○ = Optional, ✗ = Not applicable

### 6.2 Metrics by Product Type

```javascript
const KEY_METRICS = {
  custom_service: [
    'avg_deal_value', 'close_rate', 'show_rate',
    'time_to_close', 'client_lifetime_value'
  ],
  packaged_service: [
    'packages_sold', 'avg_package_value', 'show_rate',
    'upsell_rate', 'completion_rate'
  ],
  live_group: [
    'registrations', 'show_rate', 'enrollment_rate',
    'completion_rate', 'nps_score'
  ],
  automated_group: [
    'leads', 'conversion_rate', 'avg_order_value',
    'completion_rate', 'refund_rate'
  ],
  custom_agency: [
    'pipeline_value', 'win_rate', 'avg_project_value',
    'utilization', 'client_retention'
  ],
  managed_service: [
    'mrr', 'churn_rate', 'ltv',
    'expansion_revenue', 'nps_score'
  ],
  digital_product: {
    digital: ['units_sold', 'avg_order_value', 'refund_rate'],
    software: ['mrr', 'churn_rate', 'trial_conversion', 'dau_mau'],
    physical: ['units_sold', 'avg_order_value', 'return_rate', 'cogs']
  }
};
```

---

## Part 7: Implementation Roadmap

### Phase 1: Business Type Identification (Priority: HIGH)
**Goal**: Infer product type from offer creation

1. Modify Offer Builder V1 to capture type signals
2. Add clarifying questions for ambiguous cases
3. Store product_type and wealth_ladder on product record
4. Show examples-based confirmation

### Phase 2: Product Suite Builder (Priority: HIGH)
**Goal**: Connect individual offers into a cohesive money model

1. Create new flow: `/product-suite-builder`
2. Import existing offers OR create new
3. Visual money model builder (drag-drop)
4. Cross-product linking (upsell_to, downsell_to)
5. Suite summary with pricing totals

### Phase 3: CRM Product Awareness (Priority: MEDIUM)
**Goal**: CRM knows about products and adapts accordingly

1. Add product selector to deal creation
2. Dynamic pipeline stages based on product type
3. Product-specific metric dashboards
4. Cross-sell tracking between products

### Phase 4: Journey Analytics (Priority: MEDIUM)
**Goal**: Track customer journey across product suite

1. Entry point tracking (which product first)
2. Tier progression tracking
3. Cross-product conversion paths
4. Lifetime value by entry point

### Phase 5: Persona-Adaptive Onboarding (Priority: LOW)
**Goal**: Different paths for Seeker/Riser/Maker

1. Persona detection refinement
2. Custom flow sequences per persona
3. Skip logic for experienced users
4. Bulk import for Movement Makers

---

## Part 8: Real-World Examples

### Example 1: Nic's FindMyFlow (SaaS + Services)

```
PROJECT: FindMyFlow
├── PRODUCT: FindMyFlow App
│   ├── Type: Digital Product (Software)
│   ├── Money Model: Continuity
│   ├── Price: $29/month
│   └── Upsell to: 1:1 Coaching
│
├── PRODUCT: Flow Finder Course
│   ├── Type: Automated Group
│   ├── Money Model: Attraction
│   ├── Price: Free (in-app)
│   └── Leads to: App Subscription
│
├── PRODUCT: 1:1 Flow Coaching
│   ├── Type: Custom Service
│   ├── Money Model: Upsell
│   ├── Price: $500/session
│   └── Cross-sells from: App power users
│
└── PRODUCT: Group Coaching Cohort
    ├── Type: Live Group
    ├── Money Model: Core
    ├── Price: $2,000
    └── Upsell to: 1:1 Coaching
```

### Example 2: Nic's Headset Business (E-commerce)

```
PROJECT: Headset Sales
├── PRODUCT: Premium Headsets
│   ├── Type: Digital Product (Physical)
│   ├── Money Model: Core
│   ├── Price: $299
│   └── Upsell to: Extended Warranty
│
├── PRODUCT: Budget Headsets
│   ├── Type: Digital Product (Physical)
│   ├── Money Model: Attraction
│   ├── Price: $79
│   └── Upsell to: Premium Headsets
│
├── PRODUCT: Extended Warranty
│   ├── Type: Digital Product (Digital)
│   ├── Money Model: Upsell
│   ├── Price: $49/year
│   └── Continuity model
│
└── PRODUCT: Accessories Bundle
    ├── Type: Digital Product (Physical)
    ├── Money Model: Upsell
    ├── Price: $49
    └── Cross-sell on checkout
```

### Example 3: Sarah (Vibe Riser - E-commerce)

```
PROJECT: Artisan Candles
├── PRODUCT: Signature Candle Collection
│   ├── Type: Digital Product (Physical)
│   ├── Money Model: Core
│   ├── Price: $45 each
│
├── PRODUCT: Candle Subscription Box
│   ├── Type: Digital Product (Physical)
│   ├── Money Model: Continuity
│   ├── Price: $39/month
│
├── PRODUCT: DIY Candle Kit
│   ├── Type: Digital Product (Physical)
│   ├── Money Model: Attraction
│   ├── Price: $25
│   └── Leads to: Signature Collection
│
└── PRODUCT: Candle Making Masterclass
    ├── Type: Automated Group
    ├── Money Model: Upsell
    ├── Price: $149
    └── Different business type within same project!
```

---

## Appendix A: Database Migration

```sql
-- Migration: Add product suite support

-- 1. Products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES user_projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  product_type TEXT NOT NULL CHECK (product_type IN (
    'custom_service', 'packaged_service', 'live_group',
    'automated_group', 'custom_agency', 'managed_service', 'digital_product'
  )),
  product_subtype TEXT CHECK (product_subtype IN ('digital', 'software', 'physical') OR product_subtype IS NULL),
  money_model_tier TEXT CHECK (money_model_tier IN (
    'attraction', 'core', 'upsell', 'downsell', 'continuity'
  )),
  price_type TEXT CHECK (price_type IN ('one_time', 'subscription', 'tiered')),
  price_amount DECIMAL(10,2),
  subscription_interval TEXT CHECK (subscription_interval IN ('week', 'month', 'quarter', 'year') OR subscription_interval IS NULL),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  launch_date DATE,
  upsell_to_product_id UUID REFERENCES products(id),
  downsell_to_product_id UUID REFERENCES products(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add product_id to deals
ALTER TABLE deals ADD COLUMN product_id UUID REFERENCES products(id);

-- 3. Add entry tracking to customers (if customers table exists)
ALTER TABLE customers ADD COLUMN entry_product_id UUID REFERENCES products(id);
ALTER TABLE customers ADD COLUMN entry_tier TEXT;

-- 4. Customer-Product junction
CREATE TABLE customer_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  tier_purchased TEXT,
  purchase_date DATE,
  amount_paid DECIMAL(10,2),
  status TEXT DEFAULT 'active',
  renewal_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_id, product_id)
);

-- 5. Indexes
CREATE INDEX idx_products_project ON products(project_id);
CREATE INDEX idx_products_user ON products(user_id);
CREATE INDEX idx_products_type ON products(product_type);
CREATE INDEX idx_deals_product ON deals(product_id);
CREATE INDEX idx_customer_products_customer ON customer_products(customer_id);
CREATE INDEX idx_customer_products_product ON customer_products(product_id);

-- 6. RLS Policies
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own products" ON products FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own products" ON products FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own products" ON products FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own products" ON products FOR DELETE USING (auth.uid() = user_id);
```

---

## Appendix B: Flow Transition Points

### V1 → Products Transition

When completing Offer Builder V1, automatically:

1. Create product record with inferred type
2. Set money_model_tier based on categorization (Core/Lead Magnet/Bonus)
3. Link to existing products if upsell/downsell selected
4. Prompt for Product Suite Builder if multiple products detected

### CRM → Products Integration

When creating deals:

1. Product selector shows all active products
2. Pipeline stages adjust based on selected product's type
3. Metrics dashboard filters by product

---

*Document created: January 2026*
*Last updated: January 12, 2026*
