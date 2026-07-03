# Healing Map Framework

> **Created:** January 27, 2026
> **Status:** Planning / Iteration
> **Related:** 7-Day Challenge, Nervous System Flow, Healing Compass

---

## Table of Contents

1. [Product Structure](#product-structure)
2. [Testing Strategy](#testing-strategy)
3. [The Healing Map Framework](#the-healing-map-framework)
4. [How Flows Feed Back](#how-each-flow-feeds-back)
5. [Unified Dashboard Design](#the-unified-dashboard)
6. [Implementation Priority](#implementation-priority)
7. [Feature Voting System](#feature-voting-system)
8. [Open Questions](#open-questions)

---

## Product Structure

```
                    SILENT DISCO HEALING ECOSYSTEM
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
   ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
   │   HEALING   │      │  BUSINESS   │      │     CRM     │
   │     TAB     │  →   │     TAB     │  →   │             │
   │    FREE     │      │   UPSELL    │      │   UPSELL    │
   └─────────────┘      └─────────────┘      └─────────────┘
         │                    │                    │
    Workshop              Want to              Already
    Attendees             monetize             selling
         │                    │                    │
    "I'm healing"        "I want to          "I need to
                          help others"         scale"
```

### Target Users by Product

| Product | User State | Entry Point | Goal |
|---------|------------|-------------|------|
| Healing Tab | In pain, seeking relief | Workshop attendees, headset buyers | Understand + track healing journey |
| Business Tab | Ready to monetize healing skills | Healing Tab graduates | Build offer, validate, launch |
| CRM | Already selling, need systems | Business Tab graduates | Scale, automate, optimize |

### Silent Disco Headsets Connection

- Headsets are becoming synonymous with "healing" experiences
- Position as leader/source for healing journey support
- Healing Tab = free value for all headset/workshop customers
- Creates ecosystem lock-in through genuine value

---

## Testing Strategy

### Decided Approach

- **Tester count:** 3-5 (intimate)
- **Method:** Hybrid (guided + self-directed)
- **Voting:** In-app tab

### Testing Schedule

```
DAY 1-2: Guided onboarding call (15 min)
         - Watch them go through onboarding
         - Note friction points
         - Ensure they understand the framework

DAY 3-7: Self-guided with daily check-in
         - Simple message: "How was today's challenge?"
         - Capture blockers in real-time
         - Observe natural usage patterns

DAY 7:   Debrief call (15 min)
         - What worked? What confused you?
         - Feature voting session
         - Testimonial capture if positive
```

### What to Test

| Area | Questions to Answer |
|------|---------------------|
| Onboarding | Is the framework clear? Do they understand the "why"? |
| Daily Usage | Do they come back? What brings them back? |
| Healing Compass | Does the N/E/S/W model resonate? |
| Quantification | Does seeing numbers help or overwhelm? |
| Direction | Do they know what to do next? |

---

## The Healing Map Framework

### Core Philosophy

> "Every reaction is information. Track it. Understand it. Transform it."

### The Problem with Current Healing Approaches

Most healing work is:
- **Unquantified** — "I think I'm doing better?"
- **Directionless** — "What should I work on next?"
- **Disconnected** — Different modalities don't talk to each other
- **Unmeasurable** — No way to see progress over time

### Our Solution: The Response Map

Unify all healing work under one measurable framework:

```
                              EVENT
                          (something happens)
                                │
                                ▼
                    ┌───────────────────────┐
                    │   TRIGGER ACTIVATED   │
                    │                       │
                    │  Which PART responds? │
                    │  What WOUND is touched?│
                    │  What PATTERN fires?  │
                    └───────────┬───────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │   RESPONSE GENERATED  │
                    │                       │
                    │  Body sensation?      │
                    │  Emotion felt?        │
                    │  Action taken?        │
                    └───────────┬───────────┘
                                │
                                ▼
         ┌──────────────────────┴──────────────────────┐
         │                                             │
         ▼                                             ▼
┌─────────────────┐                         ┌─────────────────┐
│  FEAR RESPONSE  │                         │  LOVE RESPONSE  │
│  (Below 200)    │                         │  (Above 200)    │
│                 │                         │                 │
│  Shame (20)     │                         │  Courage (200)  │
│  Guilt (30)     │                         │  Neutrality(250)│
│  Apathy (50)    │                         │  Willingness(310)│
│  Grief (75)     │                         │  Acceptance(350)│
│  Fear (100)     │                         │  Reason (400)   │
│  Desire (125)   │                         │  Love (500)     │
│  Anger (150)    │                         │  Joy (540)      │
│  Pride (175)    │                         │  Peace (600)    │
│                 │                         │                 │
│  SIGNAL:        │                         │  SIGNAL:        │
│  Something needs│                         │  Healing has    │
│  attention      │                         │  occurred here  │
└────────┬────────┘                         └─────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                    HEALING WORK (4R's)                       │
├──────────────┬──────────────┬──────────────┬────────────────┤
│  RECOGNISE   │   REWIRE     │  RECONNECT   │    RELEASE     │
│              │              │              │                │
│ • Trigger    │ • Shadow     │ • Inner      │ • Somatic      │
│   Journal    │   Work       │   Child      │   Release      │
│ • Parts      │ • Memory     │ • Parts      │ • Breathwork   │
│   Mapping    │   Reconsol.  │   Dialogue   │ • Movement     │
│ • Pattern    │ • Belief     │ • Attachment │ • Sound        │
│   Tracking   │   Reframe    │   Repair     │   Healing      │
│              │              │              │                │
│ "What is     │ "What's the  │ "What needs  │ "Let the body  │
│  here?"      │  new story?" │  love?"      │  process"      │
└──────────────┴──────────────┴──────────────┴────────────────┘
```

### David Hawkins Frequency Scale

The measurement backbone of the framework:

| Level | Emotion | Energy | Signal |
|-------|---------|--------|--------|
| 700+ | Enlightenment | Pure consciousness | — |
| 600 | Peace | Bliss | Fully healed |
| 540 | Joy | Serenity | Thriving |
| 500 | Love | Reverence | Healthy relating |
| 400 | Reason | Understanding | Clear thinking |
| 350 | Acceptance | Forgiveness | Integration |
| 310 | Willingness | Optimism | Ready to grow |
| 250 | Neutrality | Trust | Safe baseline |
| **200** | **COURAGE** | **Affirmation** | **THRESHOLD** |
| 175 | Pride | Scorn | Defensive |
| 150 | Anger | Hate | Reactive |
| 125 | Desire | Craving | Grasping |
| 100 | Fear | Anxiety | Contracted |
| 75 | Grief | Regret | Loss |
| 50 | Apathy | Despair | Shutdown |
| 30 | Guilt | Blame | Self-attack |
| 20 | Shame | Humiliation | Hiding |

**Key Insight:** Everything above Courage (200) is a LOVE response = healed. Everything below is a FEAR response = signal something needs healing.

**Goal:** Move all responses up the spectrum over time.

---

## How Each Flow Feeds Back

| Flow | 4R Category | What It Measures | Feeds Into |
|------|-------------|------------------|------------|
| **Nervous System Flow** | Recognise | Safety edges (money, visibility, being seen) | Baseline frequency for specific domains |
| **Trigger Journal** | Recognise | Event → Response patterns | Pattern identification + frequency tracking |
| **Parts Work / IFS** | Recognise + Reconnect | Which parts activate, their frequency | Parts map + individual part frequencies |
| **Shadow Work** | Rewire | Rejected aspects, integration level | Shadow integration score |
| **Memory Reconsolidation** | Rewire | Specific memory charge level | Before/after frequency of memory |
| **Healing Compass** | All | Daily state check (N/E/S/W) | Daily baseline frequency |
| **Somatic Tracking** | Release | Body sensations, regulation capacity | Nervous system regulation score |
| **Inner Child Work** | Reconnect | Connection to younger self | Ages healed, letters written |
| **Attachment Work** | Reconnect + Rewire | Relationship patterns | Attachment style progression |
| **Belief Archaeology** | Rewire | Core beliefs traced to origin | Beliefs identified + rewritten |

### The Unifying Question

Every flow answers the same question:

> **"What frequency am I responding from, and how do I move it up?"**

---

## The Unified Dashboard

```
┌─────────────────────────────────────────────────────────────────────────┐
│  YOUR HEALING MAP                                            Week 12    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  OVERALL FREQUENCY                                                       │
│  ─────────────────                                                       │
│                                                                          │
│  Baseline: 285 (Neutrality → Willingness)                               │
│            ↑35 from start                                                │
│                                                                          │
│  ═══════════════════════════════════════════════════════════            │
│  Shame ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░█████░░░░░░░░░░░ Peace            │
│        20                           ▲ 285               600              │
│                                  You are here                            │
│  ═══════════════════════════════════════════════════════════            │
│                                     │                                    │
│                              COURAGE LINE (200)                          │
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  TRIGGER RESPONSES THIS WEEK                                             │
│  ───────────────────────────                                             │
│                                                                          │
│  "Pricing conversation"           Fear (100) → Neutrality (250)    ↑    │
│  "Criticism from partner"         Anger (150) → Anger (150)        →    │
│  "Seeing competitor success"      Desire (125) → Acceptance (350)  ↑    │
│  "Being asked to go live"         Shame (20) → Fear (100)          ↑    │
│                                                                          │
│  3 of 4 responses moved up this week                                     │
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  PARTS ACTIVE                         PATTERNS IDENTIFIED                │
│  ────────────                         ────────────────────               │
│                                                                          │
│  🛡️ Protector (Pride, 175)            "When visible → withdraw"         │
│  👶 Wounded Child (Shame, 20)         "When judged → defend"            │
│  🎭 Performer (Desire, 125)           "When alone → busy"               │
│                                                                          │
│  [Explore Parts →]                    [View All Patterns →]              │
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  THIS WEEK'S HEALING WORK                                                │
│  ─────────────────────────                                               │
│                                                                          │
│  Based on your responses, focus on:                                      │
│                                                                          │
│  RECOGNISE  ████████░░  80%    "Criticism → Anger" needs more mapping   │
│  REWIRE     ██████░░░░  60%    Ready for belief work on visibility      │
│  RECONNECT  ████░░░░░░  40%    Inner child session recommended          │
│  RELEASE    ██░░░░░░░░  20%    Body holding tension - try breathwork    │
│                                                                          │
│  [Today's Suggested Practice →]                                          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Dashboard Components

1. **Frequency Spectrum** — Visual position on Hawkins scale
2. **Trigger Log** — Recent events + responses + movement
3. **Parts Map** — Active parts and their frequencies
4. **Pattern Library** — Identified patterns (triggers → responses)
5. **4R Progress** — Balance across healing modalities
6. **Suggested Practice** — AI-recommended next action

---

## Implementation Priority

### 24-Hour Sprint (Current)

Focus on testing infrastructure, not all flows:

| Task | Priority | Notes |
|------|----------|-------|
| Onboarding flow finalized | HIGH | Entry point for testers |
| /me page components | HIGH | Profile + progress view |
| Healing Compass daily check-in | HIGH | Primary data collection |
| Basic frequency display | MEDIUM | Show them the number |
| Feature voting tab | MEDIUM | Capture feedback |

### v1.0 - Healing Tab MVP

| Component | Status | Priority |
|-----------|--------|----------|
| Healing Compass (daily check-in) | ✅ Done | — |
| Nervous System Flow | ✅ Done | — |
| Frequency Dashboard (basic) | ⏳ Build | HIGH |
| Trigger Journal | ⏳ Build | HIGH |
| 4R Progress Display | ⏳ Build | MEDIUM |
| Feature Voting Tab | ⏳ Build | MEDIUM |

### v1.1 - Healing Tab Expansion

| Component | Priority |
|-----------|----------|
| Parts Work / IFS Flow | HIGH |
| Shadow Work Flow | HIGH |
| Memory Reconsolidation Flow | MEDIUM |
| Pattern Detection (AI) | MEDIUM |
| Somatic Tracking | MEDIUM |

### v2.0 - Business Tab

(Existing Flow Finder + Money Model flows)

### v3.0 - CRM

(Existing CRM system)

---

## Feature Voting System

### Implementation: In-App Tab

**Route:** `/vote` or within `/me` page

**Features to Include:**

| Feature | Category | Description |
|---------|----------|-------------|
| Facilitator Marketplace | Community | Find/book healing facilitators |
| Parts Work Flow | Healing | IFS-style parts mapping |
| Shadow Work Flow | Healing | Shadow integration exercises |
| Somatic Tracking | Healing | Body sensation logging |
| Memory Reconsolidation | Healing | Specific memory healing |
| Attachment Style Work | Healing | Relationship pattern healing |
| Pattern Detection AI | Healing | AI identifies your patterns |
| Group Challenges | Community | Heal together with others |
| Practitioner Dashboard | Business | For facilitators to track clients |
| Workshop Integration | Business | Connect to live events |

**Voting Mechanism:**
- Each user gets 5 votes to distribute
- Can put multiple votes on one feature
- Results visible to all (transparency)
- Comments/suggestions field

**Database Table:**

```sql
CREATE TABLE feature_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  feature_key TEXT NOT NULL,
  vote_count INTEGER DEFAULT 1,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, feature_key)
);

CREATE TABLE feature_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  suggestion TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Open Questions

### Framework Questions

1. **Frequency Measurement** — How do users determine their frequency for a response? Self-report slider? Guided questions? Sway testing?

2. **Baseline Calculation** — Is overall baseline an average of all logged responses? Weighted by recency? Most common?

3. **Parts Naming** — Do we use IFS terminology (Protector, Exile, Firefighter) or simpler language?

4. **Pattern Detection** — Manual entry or AI-detected from journal entries?

### Product Questions

1. **Free vs Paid Boundary** — What's the limit of free Healing Tab before upsell prompt?

2. **Workshop Integration** — How do live workshop attendees get onboarded? QR code? Special link?

3. **Headset Connection** — Any in-app features specific to headset owners?

### Testing Questions

1. **Tester Selection** — Workshop attendees? Friends? Cold outreach?

2. **Incentive** — Free access forever? Early adopter pricing? Nothing (just goodwill)?

3. **Feedback Capture** — In-app only? WhatsApp group? Calls?

---

## Session Notes

### January 27, 2026

**Key Decisions:**
- 3-5 intimate testers with hybrid approach
- In-app feature voting
- Healing Map Framework as unifying concept
- David Hawkins scale as measurement backbone

**Next Actions:**
- [ ] Finalize onboarding for testing
- [ ] Finalize /me page components
- [ ] Finalize 7-day challenge structure
- [ ] Build feature voting tab
- [ ] Create tester invite/onboarding flow

**Future Exploration:**
- Parts Work / IFS integration
- Somatic tracking
- Trigger journaling with pattern detection
- AI-powered healing recommendations

---

*Last Updated: January 27, 2026*
