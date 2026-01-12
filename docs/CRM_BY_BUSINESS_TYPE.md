# CRM Features by P3 Business Type

> Complete scope for how CRM features adapt based on the user's business type (Jobber, Coordinator, Labor Organizer, Asset Owner).

## Overview

FindMyFlow's CRM should adapt its interface, terminology, and features based on the user's P3 business type. This creates a more relevant experience and reduces cognitive load - users only see what matters for their business model.

### P3 Business Types Recap

| Type | Description | Typical Users | Revenue Model |
|------|-------------|---------------|---------------|
| **Jobber** | Trades time for money, 1:1 service delivery | Coaches, consultants, freelancers, therapists | Hourly/session/package fees |
| **Coordinator** | Connects people/resources, facilitates transformation | Course creators, community builders, event hosts, group program leaders | Cohort/enrollment fees, memberships |
| **Labor Organizer** | Manages others who deliver the work | Agency owners, managed service providers, team leads | Retainers, project fees, margins on labor |
| **Asset Owner** | Creates once, sells many times | Digital product sellers, template creators, SaaS builders, licensors | Per-unit sales, subscriptions, royalties |

---

## Feature Comparison Matrix

### Core CRM Terminology

| Feature | Jobber | Coordinator | Labor Organizer | Asset Owner |
|---------|--------|-------------|-----------------|-------------|
| Primary entity | **Clients** | **Students/Members** | **Accounts** | **Customers** |
| Pipeline name | Client Pipeline | Enrollment Funnel | Account Pipeline | Sales Funnel |
| Deal/Opportunity | Engagement | Enrollment | Contract/Retainer | Purchase |
| Value metric | Package Value | Cohort Revenue | Contract Value | Order Value |
| Success metric | Client Retained | Student Completed | Account Retained | Customer LTV |

### Pipeline Stages

#### Jobber (Client Pipeline)
```
Lead → Discovery Call → Proposal Sent → Negotiating → Won/Lost
         ↓                    ↓              ↓
    [Book call]         [Send proposal]  [Follow up]
```

**Stages:**
1. **Lead** - Expressed interest
2. **Discovery Booked** - Call scheduled
3. **Discovery Complete** - Had conversation, assessing fit
4. **Proposal Sent** - Waiting for decision
5. **Negotiating** - Discussing terms
6. **Won** - Signed client
7. **Lost** - Did not proceed

**Key Actions:**
- Book discovery call
- Send proposal
- Log call notes
- Schedule follow-up
- Send contract

---

#### Coordinator (Enrollment Funnel)
```
Interested → Waitlist → Cart Open → Enrolled → Active → Graduated
                            ↓           ↓          ↓
                      [Purchase]   [Onboard]  [Complete]
```

**Stages:**
1. **Interested** - On email list, engaged with content
2. **Waitlist** - Signed up for next cohort
3. **Cart Open** - Enrollment period active, considering
4. **Enrolled** - Purchased, not yet started
5. **Active** - Currently in program
6. **Graduated** - Completed program
7. **Churned** - Dropped out / refunded

**Key Actions:**
- Add to waitlist
- Send enrollment reminder
- Process enrollment
- Track progress (% complete)
- Request testimonial
- Offer next program

---

#### Labor Organizer (Account Pipeline)
```
Prospect → Qualified → Proposal → Negotiating → Active Account → Renewal
              ↓            ↓            ↓              ↓
         [Scope call]  [Send SOW]  [Contract]    [Manage team]
```

**Stages:**
1. **Prospect** - Potential fit
2. **Qualified** - Confirmed budget, need, timeline
3. **Scoping** - Defining deliverables
4. **Proposal Sent** - SOW/contract out
5. **Negotiating** - Terms discussion
6. **Active Account** - Work in progress
7. **Renewal** - Contract ending, renewal discussion
8. **Churned** - Account lost

**Key Actions:**
- Log qualification call
- Create scope document
- Send proposal/SOW
- Assign team members
- Track deliverables
- Schedule renewal conversation

---

#### Asset Owner (Sales Funnel)
```
Visitor → Lead → Prospect → Customer → Repeat Customer → Advocate
            ↓        ↓           ↓             ↓
       [Opt-in]  [Nurture]  [Purchase]   [Upsell]
```

**Stages:**
1. **Visitor** - Anonymous traffic (tracked via analytics)
2. **Lead** - Opted in (email captured)
3. **Prospect** - Engaged (opened emails, clicked links)
4. **Customer** - Made first purchase
5. **Repeat Customer** - Multiple purchases
6. **Advocate** - Refers others, leaves reviews

**Key Actions:**
- Track opt-in source
- Monitor email engagement
- Track purchase history
- Trigger upsell sequences
- Request reviews/referrals
- Calculate LTV

---

## Feature Availability by Type

### Dashboard Widgets

| Widget | Jobber | Coordinator | Labor Organizer | Asset Owner |
|--------|:------:|:-----------:|:---------------:|:-----------:|
| Pipeline Board | ✅ | ❌ | ✅ | ❌ |
| Cohort Overview | ❌ | ✅ | ❌ | ❌ |
| Funnel Metrics | ❌ | ✅ | ❌ | ✅ |
| Revenue by Client | ✅ | ❌ | ✅ | ❌ |
| Revenue by Product | ❌ | ✅ | ❌ | ✅ |
| Follow-ups Due | ✅ | ❌ | ✅ | ❌ |
| Student Progress | ❌ | ✅ | ❌ | ❌ |
| Team Utilization | ❌ | ❌ | ✅ | ❌ |
| Cart Abandonment | ❌ | ✅ | ❌ | ✅ |
| Conversion Rates | ❌ | ✅ | ❌ | ✅ |
| Session Tracking | ✅ | ❌ | ❌ | ❌ |
| Renewal Calendar | ✅ | ❌ | ✅ | ❌ |

### Daily Priorities

| Priority Type | Jobber | Coordinator | Labor Organizer | Asset Owner |
|---------------|:------:|:-----------:|:---------------:|:-----------:|
| Follow-ups due | ✅ | ❌ | ✅ | ❌ |
| Discovery calls today | ✅ | ❌ | ✅ | ❌ |
| Proposals expiring | ✅ | ❌ | ✅ | ❌ |
| Students at risk | ❌ | ✅ | ❌ | ❌ |
| Enrollment closing soon | ❌ | ✅ | ❌ | ❌ |
| Testimonials to collect | ✅ | ✅ | ✅ | ✅ |
| Renewals approaching | ✅ | ❌ | ✅ | ❌ |
| Cart abandonment | ❌ | ✅ | ❌ | ✅ |
| Low engagement leads | ❌ | ✅ | ❌ | ✅ |
| Deliverables due | ❌ | ❌ | ✅ | ❌ |
| Team capacity alerts | ❌ | ❌ | ✅ | ❌ |

### Ascension Engine (Upsell/Downsell/Continuity)

| Trigger | Jobber | Coordinator | Labor Organizer | Asset Owner |
|---------|:------:|:-----------:|:---------------:|:-----------:|
| Package complete → Upsell | ✅ | ❌ | ❌ | ❌ |
| Program complete → Next program | ❌ | ✅ | ❌ | ❌ |
| Contract ending → Renewal | ✅ | ❌ | ✅ | ❌ |
| First purchase → Bundle offer | ❌ | ❌ | ❌ | ✅ |
| Inactive → Win-back | ✅ | ✅ | ✅ | ✅ |
| High engagement → Premium tier | ❌ | ✅ | ❌ | ✅ |
| Struggling → Downsell | ✅ | ✅ | ✅ | ✅ |
| Success → Referral request | ✅ | ✅ | ✅ | ✅ |
| Membership → Annual conversion | ❌ | ✅ | ❌ | ✅ |

### Content Generation Focus

| Content Type | Jobber | Coordinator | Labor Organizer | Asset Owner |
|--------------|:------:|:-----------:|:---------------:|:-----------:|
| Authority/expertise posts | ✅ Primary | ✅ | ✅ | ❌ |
| Case studies | ✅ Primary | ✅ | ✅ Primary | ✅ |
| Student/client wins | ✅ | ✅ Primary | ✅ | ✅ |
| Behind-the-scenes | ✅ | ✅ Primary | ✅ | ❌ |
| Product demos | ❌ | ❌ | ❌ | ✅ Primary |
| Launch content | ❌ | ✅ Primary | ❌ | ✅ Primary |
| Nurture sequences | ✅ | ✅ | ✅ | ✅ Primary |
| Testimonial requests | ✅ | ✅ | ✅ | ✅ |
| Community content | ❌ | ✅ Primary | ❌ | ❌ |
| Process/methodology | ✅ Primary | ✅ | ✅ Primary | ❌ |

---

## Detailed Feature Specifications

### 1. Client/Contact Management

#### Jobber: Clients
```
Client Record:
├── Contact Info (name, email, phone)
├── Source (referral, content, ads)
├── Package History
│   ├── Package name
│   ├── Sessions used / total
│   ├── Start date / End date
│   └── Value
├── Session Log
│   ├── Date, duration, notes
│   └── Next session scheduled
├── Communication History
├── Testimonial (collected Y/N, content)
├── Referrals Made
└── Lifetime Value
```

**Unique Fields:**
- `sessions_remaining` - Track package usage
- `next_session_date` - Calendar integration
- `renewal_date` - When current package ends
- `preferred_contact_method` - Phone/email/text
- `timezone` - For scheduling

#### Coordinator: Students/Members
```
Student Record:
├── Contact Info
├── Enrollment History
│   ├── Program name
│   ├── Cohort (e.g., "March 2024")
│   ├── Status (active, completed, dropped)
│   ├── Progress (% complete)
│   └── Enrollment value
├── Engagement Score
│   ├── Login frequency
│   ├── Content consumed
│   ├── Community participation
│   └── Assignment completion
├── Testimonial Status
├── Next Program Eligible
└── Lifetime Value
```

**Unique Fields:**
- `cohort_id` - Which group they belong to
- `progress_percentage` - How far through program
- `last_active_date` - Engagement tracking
- `risk_score` - Likelihood to drop out
- `graduation_date` - When they completed

#### Labor Organizer: Accounts
```
Account Record:
├── Company Info (name, industry, size)
├── Contacts (multiple per account)
│   ├── Primary contact
│   ├── Decision maker
│   └── Day-to-day contact
├── Contract History
│   ├── Contract name
│   ├── Value (monthly/total)
│   ├── Start/End dates
│   ├── Deliverables
│   └── Team assigned
├── Project Status
│   ├── Current deliverables
│   ├── Hours used / allocated
│   └── Milestones
├── Communication Log
├── Satisfaction Score
└── Account Value (LTV)
```

**Unique Fields:**
- `team_members_assigned` - Who's working on account
- `hours_used` / `hours_allocated` - Budget tracking
- `contract_renewal_date` - Critical for retention
- `nps_score` - Satisfaction tracking
- `industry` - For case study categorization

#### Asset Owner: Customers
```
Customer Record:
├── Contact Info
├── Acquisition Source
│   ├── First touch (ad, content, referral)
│   ├── Opt-in date
│   └── First purchase date
├── Purchase History
│   ├── Products bought
│   ├── Order values
│   ├── Purchase dates
│   └── Refunds
├── Email Engagement
│   ├── Open rate
│   ├── Click rate
│   └── Last engaged
├── Customer Segment
│   ├── One-time buyer
│   ├── Repeat customer
│   └── VIP/Advocate
└── Lifetime Value
```

**Unique Fields:**
- `email_engagement_score` - Based on opens/clicks
- `purchase_count` - Number of orders
- `avg_order_value` - Revenue per transaction
- `days_since_last_purchase` - Recency
- `referral_code` - For affiliate/referral tracking

---

### 2. Pipeline/Funnel Views

#### Jobber: Kanban Pipeline
Traditional kanban board with drag-and-drop:
```
┌─────────────┬─────────────┬─────────────┬─────────────┬─────────────┐
│    Lead     │  Discovery  │  Proposal   │ Negotiating │    Won      │
│     (5)     │    (3)      │    (2)      │     (1)     │    (12)     │
├─────────────┼─────────────┼─────────────┼─────────────┼─────────────┤
│ ┌─────────┐ │ ┌─────────┐ │ ┌─────────┐ │ ┌─────────┐ │ ┌─────────┐ │
│ │ Sarah   │ │ │ Mike    │ │ │ Alex    │ │ │ Jordan  │ │ │ Client1 │ │
│ │ $2,500  │ │ │ $5,000  │ │ │ $3,000  │ │ │ $8,000  │ │ │ Active  │ │
│ │ 3d ago  │ │ │ Tomorrow│ │ │ Sent 2d │ │ │ Counter │ │ │ 6 sess  │ │
│ └─────────┘ │ └─────────┘ │ └─────────┘ │ └─────────┘ │ └─────────┘ │
```

**Features:**
- Drag to advance stages
- Click to open client detail
- Color coding by days in stage (going stale)
- Quick actions on hover (call, email, schedule)

#### Coordinator: Cohort Funnel
Horizontal funnel visualization:
```
┌──────────────────────────────────────────────────────────────────────┐
│  MARCH 2024 COHORT                                    Revenue: $45K  │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Waitlist    Cart Open    Enrolled    Active    Graduated           │
│    250    →    180     →    45     →    42    →    38               │
│            (72%)       (25%)       (93%)      (90%)                 │
│                                                                      │
│  ████████████████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░          │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│  Students At Risk (3)                                                │
├──────────────────────────────────────────────────────────────────────┤
│  ⚠️ Jamie - 20% complete, inactive 14 days                          │
│  ⚠️ Chris - 45% complete, inactive 7 days                           │
│  ⚠️ Pat - 10% complete, never logged in after purchase              │
└──────────────────────────────────────────────────────────────────────┘
```

**Features:**
- Cohort selector dropdown
- Conversion rates between stages
- At-risk student alerts
- Progress leaderboard
- Testimonial collection queue

#### Labor Organizer: Account Board + Timeline
```
┌─────────────────────────────────────────────────────────────────────┐
│  ACTIVE ACCOUNTS                              MRR: $32,000          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │ Acme Corp       │  │ Beta Inc        │  │ Gamma LLC       │     │
│  │ $5,000/mo       │  │ $8,000/mo       │  │ $3,500/mo       │     │
│  │ ████████░░ 80%  │  │ ██████████ 100% │  │ ██████░░░░ 60%  │     │
│  │ Renews: 45 days │  │ Renews: 12 days │  │ Renews: 90 days │     │
│  │ Team: JM, SK    │  │ Team: AB        │  │ Team: JM        │     │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  PIPELINE                                    Value: $24,000         │
├─────────────────────────────────────────────────────────────────────┤
│  Prospect (2) → Qualified (1) → Proposal (1) → Negotiating (1)     │
└─────────────────────────────────────────────────────────────────────┘
```

**Features:**
- Account health scores
- Team assignment view
- Hours/budget burn rate
- Renewal calendar
- Deliverable tracking

#### Asset Owner: Funnel Analytics
```
┌──────────────────────────────────────────────────────────────────────┐
│  SALES FUNNEL (Last 30 Days)                    Revenue: $12,450    │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Visitors    Leads    Prospects    Customers    Repeat              │
│   5,200   →  520   →    156     →     42     →    12               │
│           (10%)     (30%)        (27%)        (29%)                 │
│                                                                      │
│  ████████████████████████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░│
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│  TOP PRODUCTS                    │  CART ABANDONMENT                 │
│  ─────────────────────────────── │  ──────────────────────────────── │
│  Template Pack A      $4,200     │  23 carts abandoned ($2,100)      │
│  Course Bundle        $5,800     │  → 8 recovered via email ($890)   │
│  Mini Guide           $2,450     │  → 15 still pending               │
└──────────────────────────────────────────────────────────────────────┘
```

**Features:**
- Traffic source breakdown
- Product performance
- Cart abandonment recovery
- Email sequence performance
- Customer segment analysis

---

### 3. Ascension Engine Adaptations

#### Jobber Triggers
| Trigger Event | Suggested Action | Offer Type |
|---------------|------------------|------------|
| Package 75% complete | Propose renewal/extension | Continuity |
| 3 months since last session | Win-back outreach | Re-engagement |
| Client achieves goal | Upsell to next level | Upsell |
| Client struggling | Offer additional support session | Support |
| High satisfaction score | Request referral | Referral |
| Anniversary date | Check-in + renewal offer | Continuity |

#### Coordinator Triggers
| Trigger Event | Suggested Action | Offer Type |
|---------------|------------------|------------|
| Program 80% complete | Offer advanced program | Upsell |
| Student graduates | Collect testimonial + offer alumni community | Continuity |
| Student at risk (low engagement) | Personal outreach | Retention |
| Cohort ending | Promote next cohort to engaged leads | Launch |
| High engagement | Offer certification/premium tier | Upsell |
| Student refers someone | Reward + promote ambassador program | Referral |

#### Labor Organizer Triggers
| Trigger Event | Suggested Action | Offer Type |
|---------------|------------------|------------|
| Contract 80% through | Renewal conversation | Continuity |
| Deliverable exceeded | Propose scope expansion | Upsell |
| Client requests more | Present additional services | Upsell |
| Team capacity available | Reach out to dormant accounts | Win-back |
| Contract ending, no renewal | Exit interview + downsell | Downsell |
| Project success | Request case study | Social proof |

#### Asset Owner Triggers
| Trigger Event | Suggested Action | Offer Type |
|---------------|------------------|------------|
| First purchase | Welcome sequence + related product | Cross-sell |
| Cart abandoned | Recovery email sequence | Recovery |
| 30 days since purchase | Related product offer | Cross-sell |
| 3+ purchases | VIP/loyalty offer | Upsell |
| High email engagement | Premium product pitch | Upsell |
| No purchase 60 days | Win-back discount | Win-back |
| Product refunded | Feedback request + alternative | Downsell |

---

### 4. Scripts & Templates

#### Jobber Scripts
- Discovery call script
- Proposal follow-up
- Objection handling (price, timing, fit)
- Renewal conversation
- Referral request
- Win-back outreach

#### Coordinator Scripts
- Enrollment Q&A responses
- Student check-in templates
- At-risk student outreach
- Testimonial request
- Graduation congratulations
- Next program pitch
- Refund/cancellation handling

#### Labor Organizer Scripts
- Qualification questions
- Scope definition template
- Proposal/SOW template
- Status update template
- Renewal proposal
- Expansion pitch
- Exit interview questions

#### Asset Owner Scripts
- Welcome email sequence
- Cart abandonment sequence
- Post-purchase follow-up
- Review request
- Upsell sequence
- Win-back sequence
- Refund response

---

### 5. Metrics & Reporting

#### Jobber Metrics
| Metric | Description |
|--------|-------------|
| Pipeline Value | Total value of active opportunities |
| Win Rate | % of proposals that convert |
| Avg Deal Size | Average package value |
| Sales Cycle | Days from lead to won |
| Client Retention | % of clients who renew |
| Session Utilization | Sessions delivered vs. available |
| Revenue per Client | LTV calculation |
| Referral Rate | % of clients who refer |

#### Coordinator Metrics
| Metric | Description |
|--------|-------------|
| Cohort Revenue | Total enrollment value per cohort |
| Enrollment Rate | % of waitlist that enrolls |
| Completion Rate | % of students who graduate |
| Engagement Score | Avg engagement across students |
| NPS / Satisfaction | Student satisfaction |
| Testimonial Collection | % of graduates who give testimonials |
| Ascension Rate | % who enroll in next program |
| Cost per Enrollment | Ad spend / enrollments |

#### Labor Organizer Metrics
| Metric | Description |
|--------|-------------|
| Monthly Recurring Revenue | Total active contract value |
| Account Retention | % of accounts that renew |
| Avg Contract Value | Average deal size |
| Utilization Rate | Hours worked / hours available |
| Profit Margin | Revenue - labor costs |
| Expansion Revenue | Upsells to existing accounts |
| Account Health | Composite satisfaction score |
| Pipeline Coverage | Pipeline value / target |

#### Asset Owner Metrics
| Metric | Description |
|--------|-------------|
| Revenue | Total sales |
| Orders | Number of transactions |
| Avg Order Value | Revenue / Orders |
| Conversion Rate | Visitors → Customers |
| Customer Acquisition Cost | Ad spend / new customers |
| Customer Lifetime Value | Total revenue per customer |
| Repeat Purchase Rate | % who buy again |
| Cart Abandonment Rate | Carts abandoned / carts created |
| Email Revenue | Revenue attributed to email |
| Refund Rate | Refunds / orders |

---

## Implementation Plan

### Phase 1: Foundation
1. Add `business_type` field to `user_projects` table
2. Create business type selection in Offer Builder flow (or standalone)
3. Store business type on project creation/update

### Phase 2: Adaptive Terminology
1. Create terminology mapping config
2. Update CRM components to use dynamic labels
3. Test all views with each business type

### Phase 3: Pipeline Views
1. Build Cohort Funnel view (Coordinator)
2. Build Sales Funnel view (Asset Owner)
3. Adapt existing pipeline for Jobber/Labor Organizer
4. Add view switcher based on business type

### Phase 4: Adapted Features
1. Customize Daily Priorities per type
2. Customize Ascension triggers per type
3. Customize content generation per type
4. Customize scripts/templates per type

### Phase 5: Type-Specific Features
1. Session tracking (Jobber)
2. Student progress tracking (Coordinator)
3. Team/hours tracking (Labor Organizer)
4. Product analytics (Asset Owner)

---

## Database Schema Additions

```sql
-- Add business type to projects
ALTER TABLE user_projects
ADD COLUMN business_type TEXT CHECK (business_type IN ('jobber', 'coordinator', 'labor_organizer', 'asset_owner'));

-- Coordinator-specific: Cohorts
CREATE TABLE cohorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  project_id UUID REFERENCES user_projects(id),
  name TEXT NOT NULL,
  program_name TEXT,
  start_date DATE,
  end_date DATE,
  enrollment_open_date DATE,
  enrollment_close_date DATE,
  capacity INTEGER,
  price DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Coordinator-specific: Student Progress
CREATE TABLE student_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES crm_contacts(id),
  cohort_id UUID REFERENCES cohorts(id),
  progress_percentage INTEGER DEFAULT 0,
  modules_completed JSONB DEFAULT '[]',
  last_active_at TIMESTAMPTZ,
  engagement_score INTEGER,
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high')),
  graduated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Jobber-specific: Sessions
CREATE TABLE client_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES crm_contacts(id),
  package_id UUID, -- Reference to deal/package
  session_date TIMESTAMPTZ,
  duration_minutes INTEGER,
  session_type TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Labor Organizer-specific: Team Assignments
CREATE TABLE account_team_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES deals(id),
  team_member_name TEXT,
  role TEXT,
  hours_allocated DECIMAL(10,2),
  hours_used DECIMAL(10,2) DEFAULT 0,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Asset Owner-specific: Products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  project_id UUID REFERENCES user_projects(id),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  product_type TEXT CHECK (product_type IN ('digital', 'physical', 'subscription', 'service')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Asset Owner-specific: Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES crm_contacts(id),
  product_id UUID REFERENCES products(id),
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10,2),
  total_price DECIMAL(10,2),
  status TEXT CHECK (status IN ('pending', 'completed', 'refunded', 'cancelled')),
  order_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Asset Owner-specific: Cart Abandonment
CREATE TABLE abandoned_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES crm_contacts(id),
  products JSONB, -- Array of product IDs and quantities
  cart_value DECIMAL(10,2),
  abandoned_at TIMESTAMPTZ DEFAULT NOW(),
  recovered BOOLEAN DEFAULT false,
  recovered_at TIMESTAMPTZ,
  recovery_method TEXT
);
```

---

## UI/UX Considerations

### Business Type Indicator
Show current business type in CRM header:
```
┌─────────────────────────────────────────────────────────────┐
│  🎯 My Coaching Business          [Jobber Mode] ▼          │
│                                                             │
│  Pipeline | Clients | Sessions | Ascension | Analytics      │
└─────────────────────────────────────────────────────────────┘
```

### Mode Switcher
Allow users to switch views if they have multiple business types:
```
┌─────────────────────────────┐
│  View Mode                  │
│  ─────────────────────────  │
│  ○ Jobber (Coaching)        │
│  ● Coordinator (Course)     │
│  ○ Asset Owner (Templates)  │
└─────────────────────────────┘
```

### Onboarding
When setting up CRM, ask:
```
"How do you primarily make money in this project?"

┌─────────────────┐  ┌─────────────────┐
│ 1:1 Services    │  │ Courses/Groups  │
│ (Jobber)        │  │ (Coordinator)   │
└─────────────────┘  └─────────────────┘

┌─────────────────┐  ┌─────────────────┐
│ Agency/Team     │  │ Digital Products│
│ (Labor Org)     │  │ (Asset Owner)   │
└─────────────────┘  └─────────────────┘
```

---

## Future Considerations

### Hybrid Business Types
Many users have multiple revenue streams:
- Coach who also sells courses (Jobber + Coordinator)
- Course creator who sells templates (Coordinator + Asset Owner)

**Solution:** Allow multiple business types per project, or create separate projects for each revenue stream.

### Business Type Evolution
Users often evolve:
- Jobber → Coordinator (coach creates group program)
- Coordinator → Asset Owner (course becomes self-paced)
- Jobber → Labor Organizer (consultant hires team)

**Solution:** Make business type editable, with migration prompts when patterns suggest evolution.

### P3 Framework Integration
Business type should flow from Offer Builder:
1. User completes Offer Builder V1 (problem/solution capture)
2. System analyzes problem gaps and solution types
3. Suggests business type based on patterns
4. User confirms or adjusts
5. CRM adapts accordingly

---

*Document created: January 2026*
*For implementation guidance, see: `docs/P3_BUSINESS_TYPES_FRAMEWORK.md`*
