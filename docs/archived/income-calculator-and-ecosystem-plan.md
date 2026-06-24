# Income Calculator & Business Ecosystem Plan

> **Created:** January 2026
> **Status:** Planning
> **Related:** CRM Marketing, Nervous System Flow, Groan Matrix

---

## Table of Contents

1. [Overview](#overview)
2. [Income Calculator](#income-calculator)
   - [User Journey A: Public Users](#user-journey-a-public-users)
   - [User Journey B: Logged-In Users](#user-journey-b-logged-in-users)
   - [Data Structure](#data-structure)
   - [Calculator Logic](#calculator-logic)
   - [Implementation Plan](#implementation-plan)
3. [Business Ecosystem View](#business-ecosystem-view)
   - [Core Concept](#core-concept)
   - [The 4 Components](#the-4-ecosystem-components)
   - [Wealth Ladder Progression](#wealth-ladder-progression-through-ecosystem)
   - [Deployment Locations](#deployment-locations)
4. [Nervous System Flow Updates](#nervous-system-flow-updates-note-for-later)
5. [Industry Benchmarks](#industry-benchmarks)
6. [Database Schema](#database-schema)
7. [Implementation Priority](#implementation-priority)

---

## Overview

### The Problem

Most business calculators show cold math:
- "To make $10k/month you need 20 clients at $500"

But they miss the **real blocker** — the nervous system. People don't fail because they can't do math. They fail because:
- Visibility feels unsafe
- Charging money triggers shame
- Claiming expertise feels fraudulent

### Our Unique Angle

The Income Calculator combines:
1. **Business Math** — Funnel calculations, revenue projections
2. **Visibility Assessment** — Which layers feel scary?
3. **Safety Contract Identification** — What beliefs are blocking them?
4. **Ecosystem View** — How business models feed each other
5. **Personalization** — Pull existing NS data for logged-in users

This positions FindMyFlow as the solution to the **real** problem.

---

## Income Calculator

### User Journey A: Public Users

**7-Step Flow:**

```
Step 1: Business Type Selection
────────────────────────────────
"What kind of business are you building?"

[Breathwork/Wellness] [Podcast] [Coaching] [Course Creator] [Consultant] [Other]


Step 2: Monetization Model Selection
────────────────────────────────────
"How do you want to make money?"
(Shows relevant options based on Step 1)

[1:1 Sessions] [Group Classes] [Online Course] [Retreats]


Step 2b: Visibility Assessment (NEW - Key Differentiator)
─────────────────────────────────────────────────────────
"How do these feel right now? Rate 1-10 how SCARY each feels:"

📱 Posting content publicly           [░░░░░░░░░░] 4
⚡ Going live / hosting events        [░░░░░░░░░░] 7
💰 Asking for money / pricing high    [░░░░░░░░░░] 8
💗 Sharing failures / being vulnerable [░░░░░░░░░░] 6
👑 Claiming expertise / authority      [░░░░░░░░░░] 9


Step 2c: Safety Contract Identification (Optional)
──────────────────────────────────────────────────
"Do any of these feel true for you?"

□ "If I'm fully visible, I'll be judged"
□ "If I charge what I'm worth, people will think I'm greedy"
□ "If I succeed, I'll lose connection with people I love"
□ "If I claim expertise, I'll be exposed as a fraud"

[Check all that apply]


Step 3: Income Goal
───────────────────
"What's your monthly income goal?"

[$2,000] [$5,000] [$10,000] [Custom: $____]


Step 4: Model-Specific Inputs
─────────────────────────────
For tickets: "Ticket price?" "Events per month?"
For coaching: "Session price?" "Sessions per week capacity?"
For podcast: "Episodes per month?"


Step 5: Results Preview (Blurred/Partial)
─────────────────────────────────────────
Shows funnel visualization with some numbers hidden

"To hit $5,000/month you need..."
[████████████░░░░░░░░]

📧 Enter your email to see your full breakdown


Step 6: Email Gate (PublicEmailGate component)
──────────────────────────────────────────────
"Enter your email to see your full breakdown"

[Name: ____________]
[Email: ___________]
[See My Results →]


Step 7: Full Results
────────────────────
- Complete funnel math
- Visibility Gap Score
- Ecosystem position & progression
- Identified safety contracts
- CTA to sign up for FindMyFlow
```

### Results Page Components

```
┌─────────────────────────────────────────────────────────────────────┐
│  YOUR INCOME BLUEPRINT                                              │
│                                                                     │
│  Goal: $5,000/month from Group Breathwork Classes                   │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  THE MATH                                                           │
│  ────────                                                           │
│                                                                     │
│  Revenue Target         $5,000/month                                │
│  Ticket Price           $35                                         │
│  Events/Month           4                                           │
│                                                                     │
│  ════════════════════════════════════════════════════════════════   │
│                                                                     │
│  Tickets Needed         143/month (36/event)                        │
│  Seats Required         45-50 capacity (at 75% fill)                │
│  Leads Needed           ~430/month (10% ticket conversion)          │
│  Reach Needed           ~2,150/month (20% lead conversion)          │
│  Posts Needed           ~15/week (at 500 reach/post)                │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  YOUR VISIBILITY GAP                                                │
│  ───────────────────                                                │
│                                                                     │
│  Your model requires:                                               │
│  📱 SCREEN    ✓ Required    ████████░░  8/10 Ready!                │
│  ⚡ LIVE      ✓ Required    ███░░░░░░░  3/10 Gap here              │
│  💰 MONEY    ✓ Required    ██░░░░░░░░  2/10 Gap here              │
│  💗 VULNERABLE             (not required for this model)           │
│  👑 AUTHORITY              (not required for this model)           │
│                                                                     │
│  ⚠️  The math says you need 36 people per event.                   │
│      Your nervous system says LIVE and MONEY feel unsafe.           │
│                                                                     │
│      This isn't a strategy problem. It's a safety problem.          │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  BELIEFS THAT MAY BE BLOCKING YOU                                   │
│  ────────────────────────────────                                   │
│                                                                     │
│  Based on your responses, you may hold these safety contracts:      │
│                                                                     │
│  💰 "If I charge what I'm worth, people will turn away."           │
│     └─ This blocks your MONEY visibility layer                      │
│                                                                     │
│  👁️ "If I'm visible at scale, I'll be attacked."                   │
│     └─ This blocks your LIVE visibility layer                       │
│                                                                     │
│  These aren't facts. They're protections your nervous system        │
│  created from past experiences. They can be healed.                 │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  YOUR ECOSYSTEM POSITION                                            │
│  ───────────────────────                                            │
│                                                                     │
│  Based on your visibility comfort, we recommend:                    │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ START HERE: 1:1 Sessions                                    │   │
│  │ Visibility: 📱💰 (lower exposure while building skill)      │   │
│  │ Income: $2-3k/month                                         │   │
│  │                                                             │   │
│  │ Why: Build confidence with individuals before groups.       │   │
│  │ Your 1:1 work feeds your group program:                     │   │
│  │ • Content ideas from client conversations                   │   │
│  │ • Testimonials for social proof                             │   │
│  │ • Curriculum validation                                     │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                           │                                         │
│                           ▼                                         │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ THEN: Group Classes (your goal)                             │   │
│  │ Visibility: 📱⚡💰                                          │   │
│  │ Income: $5k/month                                           │   │
│  │                                                             │   │
│  │ Graduate to this when LIVE feels 6+/10                      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  READY TO CLOSE THE GAP?                                            │
│  ────────────────────────                                           │
│                                                                     │
│  FindMyFlow helps you:                                              │
│  ✓ Identify the exact beliefs blocking your income                  │
│  ✓ Heal them through guided nervous system work                     │
│  ✓ Build visibility courage with daily challenges                   │
│  ✓ Track your progress as your comfort zone expands                 │
│                                                                     │
│              [Start Your Free Journey →]                            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

### User Journey B: Logged-In Users

For users who have completed the Nervous System Flow, pull their data for personalization:

```javascript
// Fetch user's NS data
const { data: nsData } = await supabase
  .from('nervous_system_responses')
  .select(`
    being_seen_edge,
    earning_edge,
    safety_contracts,
    core_fear,
    visibility_comfort  // After NS Flow update
  `)
  .eq('user_id', userId)
  .single()
```

**Personalized Results:**

```
┌─────────────────────────────────────────────────────────────────────┐
│  YOUR PERSONALIZED VISIBILITY MAP                                   │
│                                                                     │
│  Your Goal: $10k/month                                              │
│  Your Earning Edge: $5k/year (from your NS assessment)              │
│                                                                     │
│  ⚠️  Your nervous system currently feels safe                       │
│      earning up to $5k/year.                                        │
│                                                                     │
│      Your goal is 24x beyond your safety edge.                      │
│                                                                     │
│  Your Active Safety Contracts:                                      │
│  ─────────────────────────────                                      │
│  • "If I charge what I'm worth, people will turn away."            │
│    (Worthiness wound)                                               │
│                                                                     │
│  • "If I'm visible at scale, I'll be attacked."                    │
│    (Visibility wound)                                               │
│                                                                     │
│  These contracts are likely blocking your                           │
│  MONEY and LIVE visibility layers.                                  │
│                                                                     │
│  [Continue Healing Journey →]                                       │
│  [Generate Groan Challenges for MONEY layer →]                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

### Data Structure

**Business Types → Wealth Ladder → Product Types → Monetization Models**

```javascript
export const BUSINESS_TYPES = {
  breathwork_wellness: {
    label: 'Breathwork / Wellness',
    icon: '🧘',
    wealthLadderPositions: ['service', 'productized'],
    productTypes: ['custom_service', 'live_group', 'automated_group'],
    monetizationModels: ['one_on_one', 'group_classes', 'workshops', 'retreats', 'online_course'],
    defaultModel: 'one_on_one'
  },
  podcast: {
    label: 'Podcast / Content Creator',
    icon: '🎙️',
    wealthLadderPositions: ['productized', 'products'],
    productTypes: ['digital_product', 'automated_group'],
    monetizationModels: ['ads_cpm', 'sponsorships', 'premium_content', 'coaching', 'merchandise'],
    defaultModel: 'ads_cpm'
  },
  coaching: {
    label: 'Coach / Mentor',
    icon: '🎯',
    wealthLadderPositions: ['service', 'productized'],
    productTypes: ['custom_service', 'packaged_service', 'live_group'],
    monetizationModels: ['one_on_one', 'vip_day', 'group_program', 'mastermind', 'online_course'],
    defaultModel: 'one_on_one'
  },
  course_creator: {
    label: 'Course Creator',
    icon: '📚',
    wealthLadderPositions: ['productized', 'products'],
    productTypes: ['automated_group', 'digital_product'],
    monetizationModels: ['online_course', 'membership', 'cohort_program', 'templates'],
    defaultModel: 'online_course'
  },
  consultant: {
    label: 'Consultant / Freelancer',
    icon: '💼',
    wealthLadderPositions: ['service', 'productized'],
    productTypes: ['custom_service', 'packaged_service', 'managed_service'],
    monetizationModels: ['project_fees', 'retainer', 'vip_day', 'productized_service'],
    defaultModel: 'project_fees'
  }
}
```

**Monetization Models with Visibility Requirements:**

```javascript
export const MONETIZATION_MODELS = {
  one_on_one: {
    label: '1:1 Sessions',
    description: 'Work with clients directly, one at a time',
    visibilityRequired: ['screen', 'money'],
    visibilityLevel: 2,
    inputs: ['sessionPrice', 'sessionsPerWeek'],
    benchmarks: {
      sessionPrice: { low: 75, mid: 150, high: 300 },
      clientRetention: 0.6, // 60% rebook
      referralRate: 0.2 // 20% refer someone
    }
  },
  group_classes: {
    label: 'Group Classes / Workshops',
    description: 'Teach groups in person or online',
    visibilityRequired: ['screen', 'live', 'money'],
    visibilityLevel: 3,
    inputs: ['ticketPrice', 'eventsPerMonth', 'capacityPerEvent'],
    benchmarks: {
      fillRate: 0.75, // 75% capacity
      ticketConversion: 0.10, // 10% of leads buy
      leadConversion: 0.20 // 20% of reach become leads
    }
  },
  online_course: {
    label: 'Online Course',
    description: 'Pre-recorded content they access anytime',
    visibilityRequired: ['screen', 'live', 'money', 'vulnerable', 'authority'],
    visibilityLevel: 5,
    inputs: ['coursePrice', 'launchesPerYear'],
    benchmarks: {
      listConversion: 0.02, // 2% of list buys
      launchMultiplier: 1.5, // Launch converts 1.5x evergreen
      refundRate: 0.10
    }
  },
  ads_cpm: {
    label: 'Podcast Ads (CPM)',
    description: 'Earn per 1,000 downloads',
    visibilityRequired: ['screen', 'live', 'authority'],
    visibilityLevel: 3,
    inputs: ['episodesPerMonth'],
    benchmarks: {
      cpmRate: 20, // $20 per 1000 downloads
      minimumDownloads: 5000, // Threshold for ads
      listenRate: 0.50, // 50% of subscribers listen
      growthRate: 0.15 // 15% monthly growth typical
    }
  },
  // ... more models
}
```

**Visibility Layers with Difficulty:**

```javascript
export const VISIBILITY_LAYERS = {
  screen: {
    id: 'screen',
    label: 'Screen',
    icon: '📱',
    description: 'Being seen online (posts, content, profiles)',
    difficulty: 1,
    fearCore: 'Being seen online'
  },
  live: {
    id: 'live',
    label: 'Live',
    icon: '⚡',
    description: 'Real-time visibility (calls, workshops, live video)',
    difficulty: 2,
    fearCore: 'Real-time judgment'
  },
  money: {
    id: 'money',
    label: 'Money',
    icon: '💰',
    description: 'Asking for payment, pricing, following up',
    difficulty: 3,
    fearCore: 'Am I worth it?'
  },
  vulnerable: {
    id: 'vulnerable',
    label: 'Vulnerable',
    icon: '💗',
    description: 'Sharing struggles, asking for help, admitting gaps',
    difficulty: 4,
    fearCore: 'Rejected for real self'
  },
  authority: {
    id: 'authority',
    label: 'Authority',
    icon: '👑',
    description: 'Claiming expertise, leading, being the expert',
    difficulty: 5,
    fearCore: 'Imposter syndrome'
  }
}
```

---

### Calculator Logic

**Ticket Sales Model:**

```javascript
export function calculateTicketModel(inputs) {
  const {
    incomeGoal,
    ticketPrice,
    eventsPerMonth,
    capacityPerEvent = 50
  } = inputs

  const benchmarks = MONETIZATION_MODELS.group_classes.benchmarks

  // Revenue math
  const ticketsNeeded = Math.ceil(incomeGoal / ticketPrice)
  const ticketsPerEvent = Math.ceil(ticketsNeeded / eventsPerMonth)
  const seatsNeeded = Math.ceil(ticketsPerEvent / benchmarks.fillRate)

  // Capacity check
  const capacityOk = seatsNeeded <= capacityPerEvent
  const eventsNeededForCapacity = capacityOk
    ? eventsPerMonth
    : Math.ceil(ticketsNeeded / (capacityPerEvent * benchmarks.fillRate))

  // Funnel math
  const leadsNeeded = Math.ceil(ticketsNeeded / benchmarks.ticketConversion)
  const reachNeeded = Math.ceil(leadsNeeded / benchmarks.leadConversion)

  // Content requirements (using existing marketingBenchmarks)
  const postsPerMonth = Math.ceil(reachNeeded / 500) // Conservative 500 reach/post
  const postsPerWeek = Math.ceil(postsPerMonth / 4.33)

  return {
    revenue: {
      goal: incomeGoal,
      perTicket: ticketPrice,
      perEvent: ticketsPerEvent * ticketPrice
    },
    sales: {
      ticketsNeeded,
      ticketsPerEvent,
      seatsNeeded,
      capacityOk,
      eventsNeededForCapacity
    },
    funnel: {
      leadsNeeded,
      reachNeeded,
      conversionRate: benchmarks.ticketConversion
    },
    content: {
      postsPerMonth,
      postsPerWeek,
      reachPerPost: 500
    },
    warnings: capacityOk ? [] : [
      `You need ${seatsNeeded} seats but capacity is ${capacityPerEvent}. Consider ${eventsNeededForCapacity} events instead.`
    ]
  }
}
```

**Podcast Ads Model:**

```javascript
export function calculatePodcastModel(inputs) {
  const { incomeGoal, episodesPerMonth } = inputs

  const benchmarks = MONETIZATION_MODELS.ads_cpm.benchmarks

  // Revenue math
  const downloadsNeeded = (incomeGoal / benchmarks.cpmRate) * 1000
  const downloadsPerEpisode = Math.ceil(downloadsNeeded / episodesPerMonth)

  // Audience math
  const subscribersNeeded = Math.ceil(downloadsPerEpisode / benchmarks.listenRate)

  // Growth timeline (starting from 0)
  const monthsToMinimum = calculateGrowthTimeline(0, benchmarks.minimumDownloads, benchmarks.growthRate)
  const monthsToGoal = calculateGrowthTimeline(0, downloadsNeeded, benchmarks.growthRate)

  // Reality check
  const isRealistic = downloadsPerEpisode <= 50000 // Very few podcasts exceed this

  return {
    revenue: {
      goal: incomeGoal,
      cpmRate: benchmarks.cpmRate,
      perEpisode: (downloadsPerEpisode / 1000) * benchmarks.cpmRate
    },
    audience: {
      downloadsNeeded,
      downloadsPerEpisode,
      subscribersNeeded
    },
    timeline: {
      monthsToMinimum,
      monthsToGoal,
      growthRate: benchmarks.growthRate
    },
    warnings: isRealistic ? [] : [
      `${downloadsPerEpisode.toLocaleString()} downloads/episode is very ambitious. Top 1% of podcasts.`
    ]
  }
}

function calculateGrowthTimeline(start, target, monthlyGrowthRate) {
  if (start >= target) return 0
  let current = start || 100 // Start with at least 100
  let months = 0
  while (current < target && months < 60) {
    current = current * (1 + monthlyGrowthRate)
    months++
  }
  return months
}
```

---

### Implementation Plan

**File Structure:**

```
src/
├── flows/
│   ├── PublicIncomeCalculator.jsx    # Main public flow
│   └── PublicIncomeCalculator.css
├── lib/
│   ├── incomeCalculatorData.js       # Business types, models, benchmarks
│   ├── incomeCalculatorLogic.js      # Calculator functions
│   └── visibilityAssessment.js       # Visibility gap calculations
└── components/
    └── calculator/
        ├── BusinessTypeSelector.jsx
        ├── ModelSelector.jsx
        ├── VisibilityAssessment.jsx
        ├── IncomeGoalInput.jsx
        ├── ModelInputs.jsx
        ├── ResultsPreview.jsx
        ├── FullResults.jsx
        └── EcosystemView.jsx
```

**Routes:**

```javascript
// AppRouter.jsx
<Route path="/income-calculator" element={<PublicIncomeCalculator />} />
```

---

## Business Ecosystem View

### Core Concept

Most business education treats revenue streams as **separate choices**:

```
Traditional View:           Ecosystem View:
─────────────────           ────────────────
Pick ONE:                   Build a SYSTEM:
□ Coaching                  Everything connects.
□ Course                    Each piece feeds the next.
□ Membership                Start where you're comfortable.
□ Podcast                   Expand as you grow.
```

### The 4 Ecosystem Components

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│                         🎯 AUDIENCE                                 │
│                    (People who know you)                            │
│                            │                                        │
│              ┌─────────────┼─────────────┐                          │
│              │             │             │                          │
│              ▼             ▼             ▼                          │
│      ┌───────────┐  ┌───────────┐  ┌───────────┐                   │
│      │  ATTRACT  │  │  NURTURE  │  │  DELIVER  │                   │
│      │           │  │           │  │           │                   │
│      │ Content   │  │ Offers    │  │ Products  │                   │
│      │ Marketing │  │ Sales     │  │ Services  │                   │
│      │ Outreach  │  │ Funnels   │  │ Programs  │                   │
│      └─────┬─────┘  └─────┬─────┘  └─────┬─────┘                   │
│            │              │              │                          │
│            └──────────────┼──────────────┘                          │
│                           │                                         │
│                           ▼                                         │
│                    ┌───────────┐                                    │
│                    │  RETAIN   │                                    │
│                    │           │                                    │
│                    │ Community │                                    │
│                    │ Continuity│                                    │
│                    │ Referrals │                                    │
│                    └───────────┘                                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### The Ecosystem Flywheel

```
┌─────────────────────────────────────────────────────────────────────┐
│  THE ECOSYSTEM FLYWHEEL                                             │
│                                                                     │
│                        ATTRACT                                      │
│                     (Build Audience)                                │
│                          │                                          │
│     ┌────────────────────┼────────────────────┐                     │
│     │                    │                    │                     │
│     │    ┌───────────────┴───────────────┐    │                     │
│     │    │                               │    │                     │
│     │    ▼                               ▼    │                     │
│     │  Podcast ──────────────────────► Email  │                     │
│     │    │    (drives subscribers)     List   │                     │
│     │    │                               │    │                     │
│     │    │    Content from               │    │                     │
│     │    │    client sessions            │    │                     │
│     │    │         ▲                     │    │                     │
│     │    │         │                     ▼    │                     │
│     │    │    DELIVER ◄──────────── NURTURE   │                     │
│     │    │   (Fulfill)    (purchases)  (Sell) │                     │
│     │    │         │                     ▲    │                     │
│     │    │         │                     │    │                     │
│     │    │         ▼                     │    │                     │
│     │    │   Testimonials ───────────────┘    │                     │
│     │    │   Case Studies                     │                     │
│     │    │         │                          │                     │
│     │    │         ▼                          │                     │
│     │    └──► RETAIN ◄────────────────────────┘                     │
│     │        (Keep & Grow)                                          │
│     │              │                                                │
│     │              │  Referrals                                     │
│     │              │  Word of mouth                                 │
│     │              │                                                │
│     └──────────────┴────────────────────────────────────────────────┤
│                                                                     │
│  Every component FEEDS the others.                                  │
│  The question isn't "which one" - it's "where do I start?"         │
└─────────────────────────────────────────────────────────────────────┘
```

### Wealth Ladder Progression Through Ecosystem

```
┌─────────────────────────────────────────────────────────────────────┐
│  YOUR ECOSYSTEM JOURNEY                                             │
│                                                                     │
│  PHASE 1: FOUNDATION (Service - Trading Time)                       │
│  Visibility: 📱💰                                                   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ DELIVER: 1:1 Coaching/Sessions                              │   │
│  │          Learn what clients actually need                   │   │
│  │          Build confidence in your expertise                 │   │
│  │                                                             │   │
│  │ ATTRACT: Simple content from client insights                │   │
│  │          "I helped a client with X today..."                │   │
│  │                                                             │   │
│  │ NURTURE: Direct outreach, referrals                         │   │
│  │          No fancy funnels needed yet                        │   │
│  │                                                             │   │
│  │ 💰 Target: $2-5k/month                                      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                           │                                         │
│                           ▼ Graduate when: 10+ clients served       │
│                                                                     │
│  PHASE 2: LEVERAGE (Productized - Packaged Offerings)               │
│  Visibility: 📱⚡💰                                                 │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ DELIVER: Group Program or Workshop                          │   │
│  │          Curriculum built from 1:1 patterns                 │   │
│  │          Serve 10 people in time of 1                       │   │
│  │                                                             │   │
│  │ ATTRACT: Consistent content, maybe podcast/video            │   │
│  │          Build email list from lead magnet                  │   │
│  │                                                             │   │
│  │ NURTURE: Webinar or challenge launch                        │   │
│  │          Sales page, basic funnel                           │   │
│  │                                                             │   │
│  │ RETAIN:  Community space, alumni network                    │   │
│  │                                                             │   │
│  │ 💰 Target: $5-15k/month                                     │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                           │                                         │
│                           ▼ Graduate when: 2+ cohorts completed     │
│                                                                     │
│  PHASE 3: SCALE (Products - Passive Income)                         │
│  Visibility: 📱⚡💰💗👑                                             │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ DELIVER: Course, Templates, Digital Products                │   │
│  │          Built from proven group curriculum                 │   │
│  │          Sells while you sleep                              │   │
│  │                                                             │   │
│  │ ATTRACT: Authority content, thought leadership              │   │
│  │          Podcast, speaking, collaborations                  │   │
│  │                                                             │   │
│  │ NURTURE: Evergreen funnels, affiliate partners              │   │
│  │          Premium high-ticket for qualified leads            │   │
│  │                                                             │   │
│  │ RETAIN:  Membership, continuity, certification              │   │
│  │                                                             │   │
│  │ 💰 Target: $15k+/month with less time                       │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Deployment Locations

#### Priority 1: Build with Income Calculator

- **Income Calculator results page** — Show where chosen model fits
- **"Where you fit" recommendation** — Based on visibility comfort
- **"What's next" progression** — Natural next step in ecosystem

#### Priority 2: Quick Wins After Income Calculator

**CRM Dashboard - Ecosystem Status Widget:**

```
┌─────────────────────────────────────────────────────────────────┐
│  YOUR ECOSYSTEM STATUS                                          │
│                                                                 │
│  ATTRACT        NURTURE        DELIVER         RETAIN           │
│  ────────       ───────        ───────         ──────           │
│  ▓▓▓▓░░░░       ▓▓░░░░░░       ▓▓▓▓▓▓▓░       ░░░░░░░░         │
│  Content        Funnel         1:1 Sessions    Not started      │
│  active         basic          thriving                         │
│                                                                 │
│  💡 Suggestion: Your DELIVER is strong. Time to build RETAIN    │
│     to get referrals and reduce marketing effort.               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Weekly Planning - Component Focus:**

```
This week's focus: ATTRACT
┌─────────────────────────────────────────────────────────────────┐
│ □ Record 1 podcast episode                                      │
│ □ Post 3x on LinkedIn                                           │
│ □ Engage with 10 ideal clients' posts                           │
└─────────────────────────────────────────────────────────────────┘
```

**Project Creation - "Where This Fits":**

```
New Project: "Breathwork Mastermind"

This fits in your ecosystem as:
┌─────────────────────────────────────────────────────────────────┐
│  Component: DELIVER                                             │
│  Type: Group Program (Productized)                              │
│  Phase: 2 - Leverage                                            │
│                                                                 │
│  This project will be fed by:                                   │
│  ← Your 1:1 clients (testimonials, case studies)                │
│  ← Your content (lead generation)                               │
│                                                                 │
│  This project will feed:                                        │
│  → Course creation (curriculum validated)                       │
│  → Authority content (teaching insights)                        │
│  → Referrals (happy group members)                              │
└─────────────────────────────────────────────────────────────────┘
```

#### Priority 3: Deeper Integration

**Challenge/Quest System - Organized by Component:**

```
PHASE 1 QUESTS (Foundation)
├── DELIVER Quests
│   ├── Complete 5 discovery calls
│   ├── Deliver 10 paid sessions
│   └── Collect 3 testimonials
├── ATTRACT Quests
│   ├── Post 3x this week
│   ├── Share 1 client insight (anonymized)
│   └── Engage with 20 ideal client posts
└── NURTURE Quests
    ├── Ask 1 happy client for referral
    └── Follow up with 3 warm leads
```

**Stage Graduation - Ecosystem Progress:**

```
🎉 STAGE 2 COMPLETE!

Your Ecosystem Progress:
                    Before          After
ATTRACT             ▓▓░░░░░░       ▓▓▓▓▓░░░
NURTURE             ▓░░░░░░░       ▓▓▓░░░░░
DELIVER             ▓▓▓▓░░░░       ▓▓▓▓▓▓▓░
RETAIN              ░░░░░░░░       ▓▓░░░░░░

Ready for Phase 2: LEVERAGE
Your 1:1 foundation is solid. Time to build a group program.

[Plan My Group Program →]
```

**Zarlo AI Coaching - Ecosystem-Aware:**

> "I notice you're spending a lot of energy on ATTRACT (content) but your DELIVER (actual paid work) is quiet. The ecosystem works best when DELIVER feeds ATTRACT. Have you considered posting about a recent client win?"

**Library of Answers - Organized by Component:**

```
YOUR DISCOVERIES

ATTRACT (How you build audience)
├── Skills: Teaching, Explaining Complex Ideas, Storytelling
├── Content themes: Burnout recovery, Nervous system, Boundaries
└── Platforms: LinkedIn (primary), Podcast (secondary)

NURTURE (How you sell)
├── Offer: 6-week Breathwork Journey
├── Price point: $500 comfort, $800 edge
└── Sales style: Conversation-based, low-pressure

DELIVER (What you provide)
├── Core skill: Holding space, Guiding breathwork
├── Transformation: Stressed → Regulated → Creative
└── Delivery style: 1:1 video calls, intimate groups

RETAIN (How you keep clients)
├── Community vibe: Supportive, non-judgmental
├── Follow-up: Monthly check-ins
└── Referral program: Not yet created
```

---

## Nervous System Flow Updates (Note for Later)

> **Return to this:** After Income Calculator MVP is complete

### 1. Add Visibility Layer Comfort Ratings

After the existing `being_seen_edge` / `earning_edge` questions, add:

```
"Different types of visibility feel different.
Rate how SAFE each feels right now (1-10):"

📱 SCREEN     - Posting content, being seen online      [____]
⚡ LIVE       - Real-time events, calls, workshops      [____]
💰 MONEY      - Asking for payment, pricing high        [____]
💗 VULNERABLE - Sharing struggles, asking for help      [____]
👑 AUTHORITY  - Claiming expertise, leading             [____]
```

**Store as:**

```javascript
visibility_comfort: {
  screen: 7,
  live: 3,
  money: 4,
  vulnerable: 5,
  authority: 2
}
```

### 2. Tag by Project Type + Delivery Type

Make `earning_edge` question **specific** to their offering:

**Current (generic):**
> "I feel safe earning $X per year"
> → Results in inflated numbers (500k+) because it's abstract

**Updated (specific):**
> "I feel safe earning $X per year from [1:1 breathwork coaching]"

Pull from user's project data:
- `project_type` (from user_projects)
- `delivery_type` (custom_service, live_group, etc.)
- `product_name` (if they've named it)

**Store as:**

```javascript
earning_edge: 50000,
earning_edge_context: {
  project_id: 'uuid',
  project_name: 'Breathwork Sessions',
  delivery_type: 'custom_service',
  wealth_ladder: 'service'
}
```

**Benefits:**
- Multiple earning edges per user (one per project/offering)
- More accurate (specific) numbers
- Direct connection to Income Calculator
- Track how comfort changes as they progress wealth ladder

### 3. Optional: Being_Seen_Edge Specificity

Same principle:

**Current:**
> "I feel safe being seen by X people"

**Updated:**
> "I feel safe being seen by X people as a [breathwork facilitator / coach / expert]"

People might feel safe being seen by 100k as "themselves" but only 100 as "an authority in breathwork"

---

## Industry Benchmarks

### Confidence Levels

| Category | Confidence | Source |
|----------|------------|--------|
| Platform engagement rates | HIGH | Hootsuite, Planable 2025-2026 |
| Lead magnet conversion rates | HIGH | Interact Quiz Report, Focus Digital |
| Sales funnel rates | MEDIUM | First Page Sage |
| Podcast CPM rates | LOW | Varies wildly ($15-50) |
| Event ticket conversion | LOW | Highly local/niche dependent |
| Coaching pricing benchmarks | LOW | Varies by market |

### Platform Engagement (from marketingBenchmarks.js)

| Platform | Engagement Rate | Top Tier |
|----------|----------------|----------|
| TikTok | 4.1% | 8% |
| LinkedIn | 3.5% | 6.6% (carousels) |
| Instagram | 0.45% | 2% |
| Twitter/X | 0.5% | 2% |
| Facebook | 0.5% | 1.5% |

### Lead Magnet Conversion (from marketingBenchmarks.js)

| Type | Conversion Rate | Top Tier |
|------|----------------|----------|
| Quiz/Assessment | 40.1% | 60% |
| Calculator/Tool | 35% | 50% |
| Cheat Sheet | 34% | 45% |
| Webinar | 30% | 50% |
| Checklist | 25% | 35% |
| Video Series | 22% | 35% |
| Guide/Report | 18% | 28% |
| Ebook | <1% | 5% |

### Sales Funnel (from marketingBenchmarks.js)

| Stage | Rate |
|-------|------|
| Nurtured → Customer | 5% |
| Customer → Upsell | 20% |
| Customer → Downsell | 30% |
| Customer → Continuity | 15% |

### Model-Specific (Estimates - Use with Disclaimer)

| Model | Key Metric | Estimate | Confidence |
|-------|-----------|----------|------------|
| Podcast Ads | CPM | $18-25 | LOW |
| Event Tickets | Fill Rate | 70-80% | MEDIUM |
| 1:1 Coaching | Session Price | $100-300 | LOW |
| Group Program | List Conversion | 2-5% | MEDIUM |
| Online Course | Launch Conversion | 1-3% | MEDIUM |

---

## Database Schema

```sql
-- Store calculator submissions
CREATE TABLE public_income_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token TEXT NOT NULL,

  -- User info (captured at email gate)
  respondent_name TEXT,
  respondent_email TEXT,

  -- Selections
  business_type TEXT NOT NULL,
  monetization_model TEXT NOT NULL,
  wealth_ladder_level TEXT,
  product_type TEXT,

  -- Inputs
  income_goal NUMERIC NOT NULL,
  model_inputs JSONB NOT NULL, -- { ticketPrice, eventsPerMonth, etc. }

  -- Visibility assessment
  visibility_ratings JSONB, -- { screen: 7, live: 3, money: 4, ... }
  identified_contracts TEXT[], -- Array of contract IDs they selected

  -- Calculated results
  calculated_results JSONB NOT NULL, -- Full calculator output
  visibility_gap_score NUMERIC, -- 0-10 scale
  recommended_start_model TEXT,
  ecosystem_phase TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- For logged-in users
  user_id UUID REFERENCES auth.users(id)
);

-- Index for lookups
CREATE INDEX idx_income_calc_email ON public_income_calculations(respondent_email);
CREATE INDEX idx_income_calc_user ON public_income_calculations(user_id);

-- Update public_leads to track this source
-- source_flow: 'income_calculator'
-- personalization_tokens will include:
-- {
--   name,
--   business_type,
--   income_goal,
--   visibility_gap_score,
--   blocking_layers: ['live', 'money'],
--   identified_contracts: [...],
--   recommended_model,
--   ecosystem_phase
-- }
```

---

## Implementation Priority

### Phase 1: MVP (Income Calculator)

1. **Create data files**
   - `incomeCalculatorData.js` - Business types, models, visibility mapping
   - `incomeCalculatorLogic.js` - Calculator functions

2. **Create components**
   - `PublicIncomeCalculator.jsx` - Main flow (follows PublicOfferAuditFlow pattern)
   - Basic step components

3. **Add route**
   - `/income-calculator` publicly accessible

4. **Add database table**
   - `public_income_calculations`

5. **Test & refine**

### Phase 2: Ecosystem Integration

1. CRM Dashboard widget
2. Weekly Planning component selector
3. Project creation context

### Phase 3: Deeper Integration

1. Challenge system organization
2. Stage graduation visualization
3. Zarlo ecosystem awareness
4. Library of Answers organization

### Phase 4: Nervous System Updates

1. Add visibility layer ratings to NS Flow
2. Add project-specific earning edge
3. Connect to Income Calculator personalization

---

## Open Questions

1. **Benchmark validation** - Should we add a "these are estimates" disclaimer, or research more accurate numbers first?

2. **Shareable results card** - Build a visual card users can share on socials? (Increases virality)

3. **Multiple calculations** - Allow users to compare different models side-by-side?

4. **Progress tracking** - For logged-in users, track visibility comfort over time?

---

## Ecosystem Integration Analysis

> **Added:** January 2026
> **Status:** Planning

### Current State vs Ecosystem

The existing **CRM towers** partially align but don't fully map to the ecosystem model:

| Ecosystem | Current CRM | Gap |
|-----------|-------------|-----|
| ATTRACT | Attract tower ✓ | Good alignment |
| NURTURE | Nurture tower (partial) | Sales is buried in Nurture |
| DELIVER | ❌ Missing | No dedicated space for fulfillment/delivery |
| RETAIN | ❌ Missing | Scattered across features |

### Integration Options

#### Option A: Overlay (Light Touch)

- Add ecosystem labels to existing features
- Dashboard widget showing component health
- Don't restructure, just add visibility

**Pros:** Low risk, fast to implement, no breaking changes
**Cons:** Mental model mismatch remains, users see two frameworks

#### Option B: Restructure CRM Towers

- Rename/reorganize towers to match ecosystem
- Attract → Attract, Nurture → Convert + Retain, Add Deliver tower
- Bigger change, cleaner mental model

**Pros:** Clean alignment, single framework
**Cons:** Breaking change, migration effort, retraining users

#### Option C: Ecosystem as Progress Layer

- Keep current structure intact
- Add ecosystem progress tracking that spans stages + CRM
- Shows how user activities feed the flywheel

**Pros:** Best of both worlds, progressive enhancement
**Cons:** Two systems to maintain, potential confusion

### Recommended Approach: Option A + C Hybrid

Start with a hybrid approach that adds the ecosystem mental model without breaking existing flows:

#### Phase 1: Dashboard Widget

```
┌─────────────────────────────────────────────────────────────────┐
│  YOUR ECOSYSTEM STATUS                                          │
│                                                                 │
│  ATTRACT        NURTURE        DELIVER         RETAIN           │
│  ────────       ───────        ───────         ──────           │
│  ▓▓▓▓░░░░       ▓▓░░░░░░       ▓▓▓▓▓▓▓░       ░░░░░░░░         │
│  Content        Funnel         1:1 Sessions    Not started      │
│  active         basic          thriving                         │
│                                                                 │
│  💡 Suggestion: Your DELIVER is strong. Time to build RETAIN    │
│     to get referrals and reduce marketing effort.               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Implementation:**
- New component: `src/components/crm/EcosystemStatusWidget.jsx`
- Add to CRM Dashboard
- Calculate health from existing data (content posts, leads, projects, etc.)

#### Phase 2: Library of Answers Reorganization

Organize discoveries by ecosystem component:

```
YOUR DISCOVERIES

ATTRACT (How you build audience)
├── Skills: Teaching, Explaining Complex Ideas, Storytelling
├── Content themes: Burnout recovery, Nervous system, Boundaries
└── Platforms: LinkedIn (primary), Podcast (secondary)

NURTURE (How you sell)
├── Offer: 6-week Breathwork Journey
├── Price point: $500 comfort, $800 edge
└── Sales style: Conversation-based, low-pressure

DELIVER (What you provide)
├── Core skill: Holding space, Guiding breathwork
├── Transformation: Stressed → Regulated → Creative
└── Delivery style: 1:1 video calls, intimate groups

RETAIN (How you keep clients)
├── Community vibe: Supportive, non-judgmental
├── Follow-up: Monthly check-ins
└── Referral program: Not yet created
```

**Implementation:**
- Update `src/pages/LibraryOfAnswers.jsx`
- Add ecosystem category mapping to existing data
- New view toggle: "By Stage" vs "By Ecosystem"

#### Phase 3: Weekly Planning Component Focus

Add ecosystem focus selector to weekly planning:

```
This week's focus: ATTRACT
┌─────────────────────────────────────────────────────────────────┐
│ □ Record 1 podcast episode                                      │
│ □ Post 3x on LinkedIn                                           │
│ □ Engage with 10 ideal clients' posts                           │
└─────────────────────────────────────────────────────────────────┘
```

**Implementation:**
- Update `src/components/crm/WeeklyPlanningSession.jsx`
- Add ecosystem focus field to weekly plans table
- Filter/suggest tasks based on selected focus

#### Phase 4: Project Tagging

Tag projects by which ecosystem component they serve:

```
New Project: "Breathwork Mastermind"

Ecosystem Component: [DELIVER ▼]

This project will be fed by:
← Your 1:1 clients (testimonials, case studies)
← Your content (lead generation)

This project will feed:
→ Course creation (curriculum validated)
→ Authority content (teaching insights)
→ Referrals (happy group members)
```

**Implementation:**
- Add `ecosystem_component` field to `user_projects` table
- Update project creation flow
- Show ecosystem connections on project detail page

### Data Model Updates

```sql
-- Add ecosystem tracking to projects
ALTER TABLE user_projects
ADD COLUMN ecosystem_component TEXT CHECK (
  ecosystem_component IN ('attract', 'nurture', 'deliver', 'retain')
);

-- Add ecosystem focus to weekly plans
ALTER TABLE weekly_plans
ADD COLUMN ecosystem_focus TEXT CHECK (
  ecosystem_focus IN ('attract', 'nurture', 'deliver', 'retain')
);

-- Track ecosystem health metrics over time
CREATE TABLE ecosystem_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  snapshot_date DATE NOT NULL,
  attract_score NUMERIC(3,2), -- 0.00 to 1.00
  nurture_score NUMERIC(3,2),
  deliver_score NUMERIC(3,2),
  retain_score NUMERIC(3,2),
  calculated_from JSONB, -- { content_posts: 5, leads: 12, ... }
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, snapshot_date)
);
```

### Ecosystem Health Calculation

```javascript
// src/lib/crm/ecosystemHealth.js

export async function calculateEcosystemHealth(userId) {
  // ATTRACT: Content output, audience growth
  const attractScore = await calculateAttractScore(userId)
  // - Posts this week
  // - Email list growth
  // - Social engagement

  // NURTURE: Sales activity, funnel health
  const nurtureScore = await calculateNurtureScore(userId)
  // - Leads in pipeline
  // - Conversion rates
  // - Sales calls booked

  // DELIVER: Active fulfillment
  const deliverScore = await calculateDeliverScore(userId)
  // - Active projects
  // - Client sessions completed
  // - Products delivered

  // RETAIN: Community, continuity
  const retainScore = await calculateRetainScore(userId)
  // - Testimonials collected
  // - Referrals received
  // - Repeat clients

  return {
    attract: attractScore,
    nurture: nurtureScore,
    deliver: deliverScore,
    retain: retainScore,
    weakest: findWeakest([attractScore, nurtureScore, deliverScore, retainScore]),
    suggestion: generateSuggestion(...)
  }
}
```

### Implementation Priority

1. **Dashboard Widget** - Highest impact, shows ecosystem at a glance
2. **Weekly Planning Focus** - Actionable, guides weekly behavior
3. **Library of Answers View** - Reorganizes existing data meaningfully
4. **Project Tagging** - Adds context to new projects

### Open Questions for Ecosystem Integration

1. **Health calculation weights** - How do we score each component fairly?
2. **Flywheel visualization** - Should we show the actual flywheel diagram somewhere?
3. **Zarlo awareness** - Should Zarlo coach based on ecosystem imbalance?
4. **Stage mapping** - How do stages 1-7 map to ecosystem phases?

---

## Flywheel as Simultaneous Systems (Jan 2026 Update)

> **Key Insight:** The flywheel phases are NOT sequential. They happen simultaneously across different customer lifecycles.

### The Reality of a Running Business

At any given moment, you have people at EVERY stage:

```
┌─────────────────────────────────────────────────────────────┐
│  ATTRACT        NURTURE        DELIVER         RETAIN       │
│  ────────       ───────        ───────         ──────       │
│  Stranger A     Lead B         Client C        Alumni D     │
│  Stranger E     Lead F         Client G        Alumni H     │
│  ...            ...            ...             ...          │
│                                                             │
│  All happening NOW, in parallel                             │
└─────────────────────────────────────────────────────────────┘
```

### FindMyFlow's Two Jobs

**Job 1: BUILD THE SYSTEMS** (one-time setup per phase)
- What infrastructure/assets do you need so this phase can run?
- Checklist of "things to create"
- Hold users accountable to CREATE the things needed

**Job 2: EXECUTE THE SYSTEMS** (recurring cadence)
- Now that the system exists, are you running it?
- Accountability to do the things at the right rhythm
- Hold users accountable to DELIVER each phase at relevant cadence

### Phase Independence Matrix

**Critical distinction:** Some phases run regardless of customers, others only activate when you have customers.

| Phase | Type | Cadence | Triggers |
|-------|------|---------|----------|
| **ATTRACT** | User-Independent | Weekly rhythm | Always running - you always need new eyeballs |
| **NURTURE** | User-Independent | Weekly rhythm | Always running - you always need to move leads forward |
| **DELIVER** | User-Dependent | Per-client | Only when you have active clients (activated when contact status → 'active' or deal → 'won') |
| **RETAIN** | User-Dependent | Per-client lifecycle | Only when clients complete/graduate (activated when contact status → 'completed' or 'alumni') |

```
User-Independent Phases (Always Running)
─────────────────────────────────────────
ATTRACT: Post content, engage, build list → Every week, no matter what
NURTURE: Follow up leads, sales calls, proposals → Every week, no matter what

User-Dependent Phases (Activated by Customers)
──────────────────────────────────────────────
DELIVER: Onboarding, sessions, check-ins → Only when Client C exists
RETAIN: Testimonials, referrals, alumni care → Only when Client C completes
```

### BUILD vs EXECUTE by Phase

| Phase | BUILD (Create Once) | EXECUTE (Recurring) | Cadence |
|-------|--------------------|--------------------|---------|
| **ATTRACT** | Content pillars, lead magnet, posting schedule, platform profiles, email welcome sequence | Post 3x/week, engage daily, nurture list weekly | Weekly regardless |
| **NURTURE** | Sales page, pricing, scripts, proposal template, funnel, objection handling | Follow up leads <24h, sales calls, send proposals | Weekly regardless |
| **DELIVER** | Onboarding flow, curriculum/program, client portal, session structure, feedback form | Deliver sessions, weekly check-ins, collect feedback | Per active client |
| **RETAIN** | Testimonial request template, referral program, alumni community, re-engagement sequence | Ask for testimonials, referral prompt after wins, quarterly alumni touch | Per completed client |

### Dashboard Concept

```
┌─────────────────────────────────────────────────────────────────────┐
│  YOUR BUSINESS FLYWHEEL                                              │
│                                                                      │
│  ═══════════════════════════════════════════════════════════════════│
│  ALWAYS RUNNING (Weekly Rhythm)                                      │
│  ═══════════════════════════════════════════════════════════════════│
│                                                                      │
│  ATTRACT                              NURTURE                        │
│  ────────                             ───────                        │
│  Systems Built: 4/5 ████░            Systems Built: 3/6 ███░░░      │
│  [View in Tools →]                    [View in Tools →]              │
│                                                                      │
│  This Week's Execution:               This Week's Execution:         │
│  Posts: 2/3 ██░                       Follow-ups: 4/5 ████░          │
│  Engagements: 12/15                   Sales calls: 1/2               │
│  List growth: +23                     Proposals: 0/1 ⚠️              │
│                                                                      │
│  ═══════════════════════════════════════════════════════════════════│
│  ACTIVATED BY CUSTOMERS                                              │
│  ═══════════════════════════════════════════════════════════════════│
│                                                                      │
│  DELIVER (3 active clients)           RETAIN (2 completed clients)   │
│  ───────                              ──────                         │
│  Systems Built: 2/4 ██░░              Systems Built: 1/4 █░░░        │
│  ✓ Onboarding flow                    ✓ Testimonial template         │
│  ✓ Session structure                  ○ Referral program             │
│  ○ Client portal                      ○ Alumni community             │
│  ○ Feedback form                      ○ Re-engagement sequence       │
│                                                                      │
│  Active Client Tasks:                 Alumni Tasks:                  │
│  ☐ Session with Client A (Tue)        ☐ Request testimonial - Sam    │
│  ☐ Check-in with Client B             ☐ Referral ask - completed     │
│  ☐ Onboard Client C (new!)            ✓ Quarterly touch - Alex       │
│                                                                      │
│  ═══════════════════════════════════════════════════════════════════│
│  💡 SUGGESTION                                                       │
│  Your RETAIN systems are only 25% built. You have 2 completed        │
│  clients but no referral program. You're leaving money on the table. │
│  [Build Referral Program →]                                          │
│  ═══════════════════════════════════════════════════════════════════│
└─────────────────────────────────────────────────────────────────────┘
```

### Implementation Approach

**Phase 1: Define the BUILD Checklists**
Each phase needs a defined checklist of "systems to build":

```javascript
const PHASE_SYSTEMS = {
  attract: {
    name: 'ATTRACT',
    type: 'user-independent',
    cadence: 'weekly',
    systems: [
      { id: 'lead_magnet', label: 'Lead magnet created', linkedFlow: '/lead-magnet-selection' },
      { id: 'content_pillars', label: 'Content pillars defined', linkedFlow: '/content-planning' },
      { id: 'posting_schedule', label: 'Posting schedule set', linkedFlow: '/weekly-planning' },
      { id: 'platform_profiles', label: 'Platform profiles optimized', linkedFlow: null },
      { id: 'welcome_sequence', label: 'Email welcome sequence', linkedFlow: '/email-sequences' }
    ]
  },
  nurture: {
    name: 'NURTURE',
    type: 'user-independent',
    cadence: 'weekly',
    systems: [
      { id: 'sales_page', label: 'Sales/landing page', linkedFlow: '/crm/pages' },
      { id: 'pricing', label: 'Pricing defined', linkedFlow: '/offer-builder' },
      { id: 'scripts', label: 'Sales scripts written', linkedFlow: '/crm/sales/scripts' },
      { id: 'proposal_template', label: 'Proposal template', linkedFlow: null },
      { id: 'funnel', label: 'Funnel built', linkedFlow: '/funnel-builder' },
      { id: 'objection_responses', label: 'Objection responses ready', linkedFlow: '/crm/objections' }
    ]
  },
  deliver: {
    name: 'DELIVER',
    type: 'user-dependent',
    cadence: 'per-client',
    systems: [
      { id: 'onboarding_flow', label: 'Client onboarding flow', linkedFlow: null },
      { id: 'program_curriculum', label: 'Program/curriculum defined', linkedFlow: '/offer-builder' },
      { id: 'client_portal', label: 'Client portal/access', linkedFlow: null },
      { id: 'feedback_form', label: 'Feedback collection form', linkedFlow: null }
    ]
  },
  retain: {
    name: 'RETAIN',
    type: 'user-dependent',
    cadence: 'per-client-lifecycle',
    systems: [
      { id: 'testimonial_template', label: 'Testimonial request template', linkedFlow: null },
      { id: 'referral_program', label: 'Referral program defined', linkedFlow: null },
      { id: 'alumni_community', label: 'Alumni community/touchpoint', linkedFlow: null },
      { id: 'reengagement_sequence', label: 'Re-engagement sequence', linkedFlow: null }
    ]
  }
}
```

**Phase 2: Track System Completion**
New table to track which systems are built:

```sql
CREATE TABLE ecosystem_system_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  phase TEXT NOT NULL CHECK (phase IN ('attract', 'nurture', 'deliver', 'retain')),
  system_id TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  linked_resource_id UUID, -- Optional link to the actual asset created
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, phase, system_id)
);
```

**Phase 3: Execution Tracking**
- User-independent phases: Track against weekly targets (posts, follow-ups, etc.)
- User-dependent phases: Track against active clients (sessions delivered, testimonials collected)

```sql
-- Weekly execution for user-independent phases
CREATE TABLE ecosystem_weekly_execution (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  week_start DATE NOT NULL,
  phase TEXT NOT NULL CHECK (phase IN ('attract', 'nurture')),
  metric_type TEXT NOT NULL, -- 'posts', 'engagements', 'follow_ups', 'sales_calls', etc.
  target INTEGER,
  actual INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_start, phase, metric_type)
);

-- Per-client execution for user-dependent phases
-- (May leverage existing crm_contacts + activity tracking)
```

**Phase 4: Dashboard Widget**
- Show all 4 phases
- Visual split between "Always Running" and "Activated by Customers"
- System completion progress bars
- Execution metrics for current week/period
- Smart suggestions based on gaps

### Decisions Made

1. **Where do BUILD checklists live?**
   - ✅ **Tools tab** - Full checklist pages for each phase
   - ✅ **Dashboard widget** - Summary showing completion status + alert when systems incomplete
   - Pattern: "Your RETAIN systems are 25% complete. [Set up in Tools →]"

2. **What activates DELIVER/RETAIN?**
   - ✅ **Automatic on status change**
   - DELIVER activates when: contact status → 'active' OR deal status → 'won'
   - RETAIN activates when: contact status → 'completed' OR 'alumni'

### Open Questions

1. **How to track execution automatically?**
   - ATTRACT: Could count content_history posts
   - NURTURE: Could count lead status changes, logged calls
   - DELIVER: Need client session tracking
   - RETAIN: Need testimonial/referral tracking

2. **Cadence customization?**
   - Default: 3 posts/week for ATTRACT
   - Should users set their own targets?
   - Should it adapt based on their capacity (Push/Flow/Rest/Launch weeks)?

3. **Tools tab structure?**
   - ✅ One combined page with tabs for each phase (ATTRACT, NURTURE, DELIVER, RETAIN)
   - Each tab shows the checklist for that phase
   - Links to existing flows where relevant (e.g., "Create lead magnet" → /lead-magnet-selection)

---

## Phase Checklist Items - Review Needed

> **Status:** DRAFT - Needs review before implementation
> **Action:** Review each phase and confirm/edit items

### ATTRACT - Build Audience & Generate Awareness

**Current Draft (5 items):**

| # | Item | Description | Links To |
|---|------|-------------|----------|
| 1 | Lead magnet created | Free resource that captures emails | /lead-magnet-selection |
| 2 | Content pillars defined | 3-5 core topics you create content about | /crm/content/create |
| 3 | Posting schedule set | When and where you post content | /crm/marketing |
| 4 | Platform profiles optimized | Bio, links, and branding consistent | - |
| 5 | Email welcome sequence | Automated emails for new subscribers | /crm/email-sequences |

**Questions to resolve:**

- [ ] Should "Platform profiles" be split by platform (LinkedIn, IG, etc.) or one checkbox?
- [ ] Add "Ideal client/audience defined" as prerequisite item?
- [ ] Add "Podcast/video setup" for content creators?
- [ ] Any items to remove?

**Notes/Decisions:**
_[Add your notes here]_

---

### NURTURE - Move Leads Toward Purchase

**Current Draft (6 items):**

| # | Item | Description | Links To |
|---|------|-------------|----------|
| 1 | Sales/landing page | Page that explains your offer | /crm/pages |
| 2 | Pricing defined | Clear pricing for your offers | /offer-builder |
| 3 | Sales scripts written | What to say in sales conversations | /crm/sales/scripts |
| 4 | Proposal template | Template for sending quotes/proposals | - |
| 5 | Funnel built | Journey from lead to customer | /funnel-builder |
| 6 | Objection responses ready | Answers to common hesitations | /crm/objections |

**Questions to resolve:**

- [ ] Add "CRM/contact tracking set up"? (Or assumed?)
- [ ] Add "Discovery call structure" as separate from scripts?
- [ ] Add "Follow-up process" (manual follow-up cadence, not automation)?
- [ ] Any items to remove?

**Notes/Decisions:**
_[Add your notes here]_

---

### DELIVER - Fulfill Promises to Clients

**Current Draft (4 items):**

| # | Item | Description | Links To |
|---|------|-------------|----------|
| 1 | Client onboarding flow | How you welcome and set up new clients | - |
| 2 | Program/curriculum defined | What you deliver and in what order | /offer-builder |
| 3 | Client portal/access | Where clients access materials | - |
| 4 | Feedback collection form | How you gather client feedback | - |

**Questions to resolve:**

- [ ] Add "Session structure/template" as separate from curriculum?
- [ ] Add "Boundaries/policies documented" (cancellation, communication, etc.)?
- [ ] Add "Client check-in cadence" defined?
- [ ] Add "Scheduling/booking system" for service businesses?
- [ ] Any items to remove?

**Notes/Decisions:**
_[Add your notes here]_

---

### RETAIN - Keep Clients & Generate Referrals

**Current Draft (4 items):**

| # | Item | Description | Links To |
|---|------|-------------|----------|
| 1 | Testimonial request template | How you ask for testimonials | - |
| 2 | Referral program defined | How you incentivize referrals | - |
| 3 | Alumni community/touchpoint | How you stay connected with past clients | - |
| 4 | Re-engagement sequence | How you bring back past clients | - |

**Questions to resolve:**

- [ ] Add "Case study process" as separate from testimonial template?
- [ ] Add "Upsell/next offer pathway"? (Or does this belong in NURTURE?)
- [ ] Add "Client celebration/graduation ritual"?
- [ ] Any items to remove?

**Notes/Decisions:**
_[Add your notes here]_

---

### Broader Design Questions

1. **Generic vs Specific:** Should items be generic (works for any business) or have variants for different business types (coaching, courses, services, etc.)?

2. **Minimum Viable:** What's the MINIMUM number of items per phase to be "functional"? Should we mark some as "required" vs "optional"?

3. **Existing Data:** Some of these might already be captured in existing flows (Offer Builder, Lead Magnet Selection). Should completing those flows auto-check these items?

4. **Proof of Completion:** How do we verify an item is "done"? Self-reported checkbox? Link to the created asset? Both?

**Notes/Decisions:**
_[Add your notes here]_

---

## Build Plan - All Tasks Required

> **Status:** Planning
> **Purpose:** Complete task list for flywheel system implementation

### Phase 1: Database & Backend

| Task | Description | Dependency | Priority |
|------|-------------|------------|----------|
| Create `ecosystem_system_progress` table | Tracks which BUILD items are complete per user | None | HIGH |
| Create `ecosystem_weekly_execution` table | Tracks EXECUTE metrics for ATTRACT/NURTURE | Table above | MEDIUM |
| Add `ecosystem_component` to `user_projects` | Tag projects by phase | None | LOW |
| Add `ecosystem_focus` to `weekly_plans` | Track weekly focus area | None | LOW |
| Add status triggers for DELIVER/RETAIN | Auto-activate when contact status changes | Contact system | MEDIUM |

**Migration SQL:**
```sql
-- ecosystem_system_progress
CREATE TABLE ecosystem_system_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  phase TEXT NOT NULL CHECK (phase IN ('attract', 'nurture', 'deliver', 'retain')),
  system_id TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  linked_resource_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, phase, system_id)
);

-- ecosystem_weekly_execution
CREATE TABLE ecosystem_weekly_execution (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  week_start DATE NOT NULL,
  phase TEXT NOT NULL CHECK (phase IN ('attract', 'nurture')),
  metric_type TEXT NOT NULL,
  target INTEGER,
  actual INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_start, phase, metric_type)
);

-- RLS policies
ALTER TABLE ecosystem_system_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecosystem_weekly_execution ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own progress" ON ecosystem_system_progress
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own execution" ON ecosystem_weekly_execution
  FOR ALL USING (auth.uid() = user_id);
```

---

### Phase 2: Config & Data Files

| Task | Description | Dependency | Priority |
|------|-------------|------------|----------|
| Create `ecosystemConfig.js` | Define PHASES, systems, cadences | Checklist finalized | HIGH |
| Create `ecosystemService.js` | CRUD operations for progress tracking | Database tables | HIGH |
| Create `ecosystemHealth.js` | Calculate health scores per phase | Service above | MEDIUM |

**File locations:**
```
src/lib/crm/
├── ecosystemConfig.js    # Phase definitions, system items
├── ecosystemService.js   # Database operations
└── ecosystemHealth.js    # Health calculation logic
```

---

### Phase 3: Components

| Task | Description | Dependency | Priority |
|------|-------------|------------|----------|
| `BusinessSystemsPage.jsx` | Main page with phase tabs | Config + Service | HIGH |
| `PhaseChecklist.jsx` | Checklist component for each phase | Config | HIGH |
| `EcosystemStatusWidget.jsx` | Dashboard summary widget | Health calculations | HIGH |
| `PhaseProgressBar.jsx` | Visual progress bar component | None | LOW |

**File locations:**
```
src/pages/crm/
└── BusinessSystems.jsx       # Main page (Tools tab)

src/components/crm/
├── EcosystemStatusWidget.jsx # Dashboard widget
├── PhaseChecklist.jsx        # Reusable checklist
└── PhaseProgressBar.jsx      # Progress visualization
```

---

### Phase 4: Routes & Navigation

| Task | Description | Dependency | Priority |
|------|-------------|------------|----------|
| Add `/crm/tools/systems` route | Route to BusinessSystems page | Page created | HIGH |
| Add to Tools tower navigation | Link in Tools sidebar/menu | Route added | HIGH |
| Add widget to CRM Dashboard | Embed EcosystemStatusWidget | Widget created | HIGH |

---

### Phase 5: Integrations (Optional Enhancements)

| Task | Description | Dependency | Priority |
|------|-------------|------------|----------|
| Auto-check from existing flows | Completing Offer Builder → marks "Pricing defined" | Service layer | LOW |
| Weekly Planning ecosystem focus | Add focus selector to WeeklyPlanningFlow | Config | LOW |
| Zarlo ecosystem awareness | Coach based on imbalanced phases | Health calculations | LOW |
| Execution tracking | Count posts, follow-ups automatically | Content/lead systems | LOW |

---

### Build Order Recommendation

```
┌─────────────────────────────────────────────────────────────────┐
│  RECOMMENDED BUILD SEQUENCE                                      │
│                                                                  │
│  1. FINALIZE CHECKLIST ITEMS ← You are here                     │
│     └─ Review & confirm items for each phase                    │
│                                                                  │
│  2. DATABASE                                                     │
│     └─ Create ecosystem_system_progress table                   │
│     └─ (Skip execution table for MVP)                           │
│                                                                  │
│  3. CONFIG & SERVICE                                             │
│     └─ ecosystemConfig.js (phase definitions)                   │
│     └─ ecosystemService.js (CRUD operations)                    │
│                                                                  │
│  4. MAIN PAGE                                                    │
│     └─ BusinessSystems.jsx with phase tabs                      │
│     └─ Add route + navigation                                   │
│                                                                  │
│  5. DASHBOARD WIDGET                                             │
│     └─ EcosystemStatusWidget.jsx                                │
│     └─ Add to CRM Dashboard                                     │
│                                                                  │
│  6. POLISH & INTEGRATIONS (Post-MVP)                            │
│     └─ Auto-check from existing flows                           │
│     └─ Execution tracking                                       │
│     └─ Weekly planning integration                              │
└─────────────────────────────────────────────────────────────────┘
```

---

### Effort Estimates

| Phase | Tasks | Effort |
|-------|-------|--------|
| 1. Database | 2 tables, RLS | Small |
| 2. Config/Service | 3 files | Small |
| 3. Components | 3-4 components | Medium |
| 4. Routes/Nav | 3 integration points | Small |
| 5. Integrations | Optional enhancements | Variable |

**MVP (Phases 1-4):** Functional checklist tracking + dashboard widget

**Full Version (Phase 5):** Adds automatic tracking and deeper integrations

---

### Dependencies on Decisions

Before building, need answers to:

1. **Checklist items** - What exactly goes in each phase? (See section above)
2. **Minimum viable** - Required vs optional items?
3. **Auto-detection** - Should completing existing flows auto-check items?
4. **Execution tracking** - Include in MVP or defer?
