# Flow Context Sharing Gaps Analysis

> Analysis of where flows COULD share context but currently DON'T
> Date: 2026-01-10

---

## Executive Summary

All gaps share the same anti-pattern:

```
Data collected → Stored in table → NEVER retrieved by downstream flows
```

**Best example of doing it right:** `RecogniseQuestInput.jsx:230-254` fetches `lead_flow_profiles` and pre-selects the user's protective voice.

**Worst example:** `OfferBuilder100M/index.jsx:130-202` fetches context, stores in state, passes to children... which ignore it completely.

---

## Gap Summary Table

| # | Gap | Priority | Status |
|---|-----|----------|--------|
| 1 | Discovery → Offer Builder | HIGH | Data fetched but unused |
| 2 | Nervous System → Voice Training | MEDIUM | No connection |
| 3 | Offer Builder → CRM Sales | MEDIUM | Partial (category only) |
| 4 | Discovery → Content Generator | HIGH | Data fetched but unused |
| 5 | Healing Compass → Quest Inputs | MEDIUM | Inconsistent |
| 6 | Persona → Lead Scoring | MEDIUM | No connection |
| 7 | Funnel Builder → Calculator | LOW | Complete disconnect |

---

## Detailed Gap Analysis

### Gap 1: Discovery → Offer Builder (HIGH PRIORITY)

**Status:** Data fetched but never used

**Files:**
- `src/flows/OfferBuilder100M/index.jsx` (lines 130-202)
- `src/flows/OfferBuilder100M/components/Step1B_DreamOutcome.jsx`

**Current State:**
- OfferBuilder100M DOES fetch context in useEffect (lines 130-202):
  - Fetches `nikigai_clusters` (skills, problems)
  - Fetches `persona_profiles`
  - Fetches `validation_flows`
  - Fetches `offer_builder_assessments` (V1)
- Data stored in `contextData` state (lines 116-123)
- `contextData` passed to Step components but **those components never reference it**

**The Problem:**
- Skills/problems could suggest dream outcomes or obstacles, but don't
- No AI-assisted pre-population of dream outcome based on discovered skills
- Line 429: `contextData` passed to Step1B_DreamOutcome but component accepts empty initial value

**What SHOULD be shared:**
| Source Data | Target Field | Benefit |
|-------------|--------------|---------|
| Top 3 skills | Dream Outcome bucket suggestions | Faster flow completion |
| Top problems | Obstacle pre-fill | More relevant obstacles |
| Persona profile | Target customer segment (Step 6B) | Consistent positioning |

**Tables:** `nikigai_clusters`, `nikigai_responses`, `persona_profiles`

**Fix Complexity:** LOW - infrastructure exists, just need to use the data

---

### Gap 2: Nervous System → Voice Training (MEDIUM PRIORITY)

**Status:** No connection at all

**Files:**
- `src/flows/VoiceTraining/index.jsx` (entire file)
- `src/components/RecogniseQuestInput.jsx` (lines 230-254 - example of how to do it)

**Current State:**
- RecogniseQuestInput successfully fetches protective archetype from `lead_flow_profiles`
- Voice Training flow has NO logic to fetch protective/essence archetypes
- Voice Training doesn't reference `nervous_system_responses` or `healing_compass_responses`

**The Problem:**
- User's protective voice archetype is known (from nervous system flow)
- Voice Training could show: "Your protective voice is [People Pleaser], which affects your writing style"
- This insight could personalize voice training questions
- No pre-population of voice data based on protective pattern history

**What SHOULD be shared:**
| Source Data | Target Field | Benefit |
|-------------|--------------|---------|
| Protective archetype | Voice profile intro | Personalized context |
| NS responses | Vulnerability patterns | Tailored training |
| Healing progress | Which vulnerabilities addressed | Skip redundant questions |

**Tables:** `nervous_system_responses`, `healing_compass_responses`, `lead_flow_profiles`

**Fix Complexity:** MEDIUM - need to add fetching logic and UI integration

---

### Gap 3: Offer Builder → CRM Sales (MEDIUM PRIORITY)

**Status:** Partial connection (category only, not pricing/details)

**Files:**
- `src/pages/crm/Sales.jsx` (lines 29-100, 170)
- `src/lib/crm/dealService.js` (lines 45-71)

**Current State:**
- Sales page loads user products via `fetchUserProducts()` (line 86)
- `fetchUserProducts()` queries `offer_creations` table for custom products
- Products populate dropdown when creating deals
- When deals won, `offer_category` captured but not linked to `offer_builder_assessments`

**The Problem:**
- Deal outcome captures offer_category/offer_type (Sales.jsx, line 170)
- Doesn't pull in offer-specific metrics (price, positioning, proof stack)
- Can't see: "This deal won with Giveaway offer pattern" → learn what converts
- No visibility into which offer structure led to wins vs losses

**What SHOULD be shared:**
| Source Data | Target Field | Benefit |
|-------------|--------------|---------|
| Offer assessments | Deal outcome modal | Context on what was sold |
| Offer pricing | Deal value auto-fill | Faster deal creation |
| Win rates by offer type | Recommendations | Learn what converts |

**Tables:** `offer_builder_assessments`, `offer_creations`, `sales_deals`, `deal_outcomes`

**Fix Complexity:** MEDIUM - need to join tables and add UI

---

### Gap 4: Discovery → Content Generator (HIGH PRIORITY)

**Status:** Data fetched but not surfaced

**Files:**
- `src/components/crm/ContentGenerator.jsx` (lines 139-168, 931)
- `src/pages/crm/ContentCreate.jsx` (lines 252-275)

**Current State:**
- ContentGenerator calls `gatherContentContext()` which loads `nikigai_clusters` (line 144)
- Context completeness shows "FlowFinder" as one of the context sources (line 931)
- ContentGenerator never explicitly suggests content topics based on clusters

**The Problem:**
- Skills are loaded but not surfaced as "Content topics you could explore"
- Problems identified in FlowFinder could drive "Pain Agitation" post suggestions
- Persona could suggest target audience framing
- No "Generate content about: [Top 3 Skills]" quick preset

**What SHOULD be shared:**
| Source Data | Target Field | Benefit |
|-------------|--------------|---------|
| Top 3 skills | Topic suggestion chips | One-click topic selection |
| Top 3 problems | Pain agitation presets | Faster content ideation |
| Persona profile | Audience framing | Consistent targeting |
| Unique angle (integration) | Hook suggestions | Differentiated content |

**Tables:** `nikigai_clusters`, `nikigai_responses`

**Fix Complexity:** LOW - data already loaded, just need UI to surface it

---

### Gap 5: Healing Compass → Quest Inputs (MEDIUM PRIORITY)

**Status:** Inconsistent implementation

**Files:**
- `src/components/RecogniseQuestInput.jsx` (lines 230-254) - DOES fetch
- `src/components/RewireQuestInput.jsx` - Does NOT fetch
- `src/components/ReleaseQuestInput.jsx` - Does NOT fetch
- `src/components/ReconnectQuestInput.jsx` - Does NOT fetch

**Current State:**
- RecogniseQuestInput DOES fetch protective archetype (line 235-254)
- It pre-selects user's protective voice and hides others initially (lines 299-334)
- Other quest inputs don't load archetypes or healing progress

**The Problem:**
- Only RecogniseQuestInput loads archetypes from `lead_flow_profiles`
- ReleaseQuestInput doesn't reference protective archetypes (should it?)
- ReconnectQuestInput doesn't reference essence archetypes
- No context about which vulnerabilities worked on via healing compass
- Quest inputs could show: "You've worked on [layer], now focus on [different layer]"

**What SHOULD be shared:**
| Source Data | Target Quest | Benefit |
|-------------|--------------|---------|
| Protective archetype | RewireQuestInput | Consistent pattern work |
| NS fears | ReleaseQuestInput | Pre-populate fear options |
| Practice history | ReconnectQuestInput | Track which practices tried |
| Healing progress | All quests | Show layer completion |

**Tables:** `lead_flow_profiles`, `nervous_system_responses`, `healing_compass_responses`

**Fix Complexity:** LOW - copy pattern from RecogniseQuestInput

---

### Gap 6: Persona → Lead Scoring (MEDIUM PRIORITY)

**Status:** No connection

**Files:**
- `src/lib/crm/dealService.js` (entire file)
- `src/pages/crm/Sales.jsx` (lines 29-100)

**Current State:**
- Sales page has lead scoring (LeadScoreSliders) with generic Pain/Trust/Urgency/Fit scores
- dealService has no logic to reference `persona_profiles`
- Deals capture "fit_score" but it's manual input, not automated

**The Problem:**
- User has defined ideal customer persona in FlowFinder
- Sales reps manually score "fit" for each deal
- Could auto-calculate fit based on persona matching
- No scoring rules like: "If fit high AND persona matches → bump probability"
- No recommendation: "This person matches your ideal persona - prioritize"

**What SHOULD be shared:**
| Source Data | Target Field | Benefit |
|-------------|--------------|---------|
| Persona profile | Fit score calculation | Auto-qualification |
| Persona traits | Deal detail modal | Show persona match % |
| Ideal avatar | Probability boost | Smarter prioritization |

**Tables:** `persona_profiles`, `sales_deals`

**Fix Complexity:** MEDIUM - need matching algorithm and UI

---

### Gap 7: Funnel Builder → Calculator (LOW PRIORITY)

**Status:** Complete disconnect

**Files:**
- `src/flows/FunnelBuilderFlow.jsx` (lines 1-150)
- `src/flows/FunnelCalculator.jsx` (lines 1-150)

**Current State:**
- FunnelBuilderFlow captures:
  - Strategy selection (Warm/Cold/Content/Ads)
  - Lead magnet choice
  - Conversion mechanism
- FunnelCalculator loads `funnel_metrics` from database
- **No bridge between them** - Calculator doesn't know what funnel was designed

**The Problem:**
- User designs funnel with specific strategy choices
- Then enters metrics in calculator with no context
- Could pre-populate planner mode with funnel_builder selections
- Could suggest baseline conversion rates based on chosen strategy
- No tracking: "Cold outreach converts at 2%, yours only 1%"

**What SHOULD be shared:**
| Source Data | Target Field | Benefit |
|-------------|--------------|---------|
| Funnel strategy | Planner baseline | Context-aware benchmarks |
| Lead magnet type | Planner calculations | Accurate projections |
| Strategy benchmarks | Performance comparison | Track vs. designed intent |

**Tables:** `funnel_builder_assessments` (NEW TABLE NEEDED), `funnel_metrics`

**Fix Complexity:** HIGH - need new table and data bridge

---

## Implementation Recommendations

### Quick Wins (1-2 hours each)

1. **Gap 1 - Use contextData in OfferBuilder steps**
   - File: `Step1B_DreamOutcome.jsx`
   - Change: Use `contextData.skills` to suggest bucket options

2. **Gap 4 - Add topic chips to ContentGenerator**
   - File: `ContentGenerator.jsx`
   - Change: Surface `nikigai_clusters` as clickable topic suggestions

3. **Gap 5 - Copy RecogniseQuestInput pattern to other quests**
   - Files: `RewireQuestInput.jsx`, `ReleaseQuestInput.jsx`
   - Change: Add same `lead_flow_profiles` fetch logic

### Medium Effort (4-8 hours each)

4. **Gap 2 - Voice Training archetype integration**
   - File: `VoiceTraining/index.jsx`
   - Change: Fetch archetypes, show personalized intro

5. **Gap 3 - Link offer details to deal outcomes**
   - Files: `dealService.js`, `DealOutcomeModal.jsx`
   - Change: Join `offer_builder_assessments` on deal resolution

6. **Gap 6 - Auto-calculate fit score**
   - Files: `dealService.js`, `Sales.jsx`
   - Change: Compare deal contact to `persona_profiles`

### Larger Effort (1-2 days)

7. **Gap 7 - Bridge Funnel Builder to Calculator**
   - New table: `funnel_builder_assessments`
   - New migration file
   - Update both flow components

---

## Related Documentation

- See `SYSTEM_ARCHITECTURE_MAP.md` > "Flow Dependencies & Context Cascade" for ideal state
- See `CLAUDE.md` > Database Schema for table structures

---

## Next Steps

- [ ] Prioritize which gaps to fix first based on user impact
- [ ] Create GitHub issues for each gap
- [ ] Start with Gap 1 & Gap 4 (quick wins, high impact)

---

# Vision: Making Context Sharing 20%, 100%, and 1000000% Better

## 20% Better (Quick Wins)

Incremental fixes that could ship this week:

| Improvement | What | Where | Effort |
|-------------|------|-------|--------|
| **Context completeness badge** | Show "Your profile is 65% complete" on dashboard | `App.jsx` | 2 hrs |
| **"Based on your answers" labels** | When pre-populating fields, show where data came from | All flows | 3 hrs |
| **Missing context prompts** | "Complete FlowFinder to unlock smart suggestions" | `ContentGenerator.jsx` | 1 hr |
| **Unified fetch hook** | `useUserContext()` hook that all flows import | New `src/hooks/useUserContext.js` | 4 hrs |
| **Fallback defaults** | When context missing, use smart defaults not empty | All Step components | 2 hrs |

### useUserContext Hook (Proposed)

```javascript
// src/hooks/useUserContext.js
export function useUserContext() {
  const [context, setContext] = useState({
    // Discovery
    skills: [],
    problems: [],
    persona: null,
    uniqueAngle: null,

    // Healing
    protectiveArchetype: null,
    essenceArchetype: null,
    nsResponses: [],
    healingProgress: {},

    // Business
    offers: {},
    voiceProfile: null,
    funnelStrategy: null,

    // Meta
    completeness: 0,
    gaps: [],
    lastUpdated: {}
  })

  // Single fetch on mount, cached
  useEffect(() => {
    fetchAllUserContext(userId).then(setContext)
  }, [userId])

  return context
}
```

**Benefits:**
- Single source of truth for all flows
- No duplicate fetching
- Consistent data shape
- Easy to add completeness tracking

---

## 100% Better (Meaningful Upgrade)

These require architectural thinking but transform the experience:

### 1. Centralized Context Service

Instead of each flow fetching its own data:

```javascript
// ❌ Current: Each flow fetches independently (scattered across 15+ files)
useEffect(() => {
  fetchNikigaiClusters()
  fetchPersonaProfiles()
  fetchOfferAssessments()
  // ...
}, [])

// ✅ Better: Single source of truth
const {
  skills, problems, persona, offers,
  archetypes, voiceProfile, funnelStrategy,
  completeness, gaps
} = useBusinessContext()
```

**Implementation:**
- Create `src/lib/businessContext.js` service
- Create `src/hooks/useBusinessContext.js` hook
- Refactor all flows to use the hook
- Add caching layer (localStorage + memory)

### 2. Smart Onboarding Router

AI that looks at context gaps and recommends next flow:

```
┌────────────────────────────────────────────────────────────────┐
│ 🎯 Recommended Next Step                                       │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│ You've completed FlowFinder but haven't defined your offer.    │
│                                                                │
│ → Start Offer Builder                                          │
│   Uses: Your skills + problems + persona                       │
│   Unlocks: CRM deal values, Content topics, Funnel planning    │
│                                                                │
│ [Start Offer Builder] [Maybe Later]                            │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

**Logic:**
```javascript
function getNextRecommendedFlow(context) {
  const recommendations = [
    {
      condition: !context.skills.length,
      flow: '/nikigai/skills',
      reason: 'Start by discovering your skills',
      unlocks: ['Problems Flow', 'Offer Builder', 'Content Topics']
    },
    {
      condition: context.skills.length && !context.offers.core,
      flow: '/offer-builder',
      reason: "You've completed FlowFinder but haven't defined your offer",
      unlocks: ['CRM deal values', 'Funnel planning', 'Pricing']
    },
    {
      condition: context.protectiveArchetype && !context.voiceProfile,
      flow: '/voice-training',
      reason: `Your protective voice is ${context.protectiveArchetype}. Let's train your authentic voice.`,
      unlocks: ['Content Generator', 'Authentic messaging']
    }
    // ...
  ]

  return recommendations.find(r => r.condition)
}
```

### 3. Context Preview Panel

Collapsible sidebar showing what data will be used in current flow:

```
┌─────────────────────────────────┐
│ 📊 Using Your Data              │
├─────────────────────────────────┤
│                                 │
│ ✅ Skills                       │
│    • Communication              │
│    • Strategy                   │
│    • Problem-solving            │
│                                 │
│ ✅ Problems                     │
│    • Burnout                    │
│    • Career stagnation          │
│                                 │
│ ✅ Persona                      │
│    • Corporate Manager, 35-45   │
│                                 │
│ ✅ Protective Voice             │
│    • People Pleaser             │
│                                 │
│ ⚠️ Missing: Voice Profile       │
│    [Complete Voice Training →]  │
│                                 │
│ ───────────────────────────     │
│ Context: 75% complete           │
│ ███████████░░░░                 │
│                                 │
└─────────────────────────────────┘
```

**Implementation:**
- Create `src/components/ContextPanel.jsx`
- Add to flow layouts as optional sidebar
- Show what data is being used + what's missing

### 4. Bidirectional Updates

When user updates one flow, propagate changes to dependent flows:

```
┌─────────────────────────────────────────────────────────────────┐
│                      UPDATE PROPAGATION                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User updates Offer Builder price from $997 → $1,497            │
│                                                                  │
│  Auto-updates:                                                   │
│  ├── CRM: Default deal value updated                            │
│  ├── Funnel Calculator: Revenue projections recalculated        │
│  ├── Upsell Flow: Price anchoring reference updated             │
│  └── Content Generator: CTA pricing refreshed                   │
│                                                                  │
│  [View Changes] [Undo]                                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Implementation:**
- Create `src/lib/contextPropagation.js`
- Define dependency graph (which flows depend on which data)
- On save, trigger updates to dependent tables
- Show user what changed

### 5. Context Changelog

Track when data was captured and show freshness:

```
┌─────────────────────────────────────────────────────────────────┐
│ 📅 Data Freshness                                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ⚠️ Your persona was defined 3 months ago.                       │
│    Has your ideal customer changed?                              │
│                                                                  │
│    [Update Persona] [Keep Current]                              │
│                                                                  │
│ ───────────────────────────────────────────────                 │
│                                                                  │
│ Recently Updated:                                                │
│ • Voice Profile - 2 days ago                                    │
│ • Core Offer - 1 week ago                                       │
│                                                                  │
│ Stale (>30 days):                                               │
│ • Persona Profile - 3 months ago                                │
│ • Nervous System - 2 months ago                                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Implementation:**
- Add `updated_at` tracking to all assessment tables
- Create freshness calculation logic
- Show prompts when data is stale
- Allow "snooze" for reminders

---

## 1000000% Better (Transformational)

This reimagines the entire system around context as the core primitive:

### 1. The Business DNA Profile

One synthesized document that represents EVERYTHING known about the user's business:

```javascript
// src/lib/businessDNA.js

const businessDNA = {
  // === IDENTITY: Who you are ===
  identity: {
    skills: [
      { name: "Communication", confidence: 0.9, source: "FlowFinder" },
      { name: "Strategy", confidence: 0.85, source: "FlowFinder" },
      { name: "Problem-solving", confidence: 0.8, source: "FlowFinder" }
    ],
    problems: [
      { name: "Burnout recovery", confidence: 0.95, source: "FlowFinder" },
      { name: "Career transition", confidence: 0.8, source: "FlowFinder" }
    ],
    uniqueAngle: "Helping corporate professionals escape burnout through strategic career pivots",
    voice: {
      tone: "Warm, direct, encouraging",
      vocabulary: "Professional but accessible",
      hooks: "Story-led, vulnerability-forward",
      avoids: "Hype, false urgency, corporate jargon"
    },
    essence: {
      archetype: "The Guide",
      gifts: ["Seeing potential", "Creating clarity", "Holding space"]
    },
    protective: {
      archetype: "People Pleaser",
      triggers: ["Visibility", "Pricing conversations", "Saying no"],
      safetyContracts: ["Stay small", "Don't charge too much", "Keep everyone happy"]
    }
  },

  // === STRATEGY: What you offer ===
  strategy: {
    persona: {
      avatar: "Corporate Manager, 35-45",
      painPoints: ["Feeling stuck", "Sunday scaries", "Lost sense of purpose"],
      desires: ["Freedom", "Meaningful work", "Financial security"],
      triggers: ["Passed over for promotion", "Health scare", "Milestone birthday"]
    },
    offers: {
      attraction: {
        type: "Free Workshop",
        name: "Escape the Corporate Trap",
        value: "Free",
        conversionTarget: "Lead Magnet"
      },
      leadMagnet: {
        type: "Assessment",
        name: "Career Clarity Scorecard",
        value: "Free",
        conversionTarget: "Core Offer"
      },
      core: {
        name: "Career Pivot Accelerator",
        price: 1497,
        duration: "8 weeks",
        dreamOutcome: "Land your dream role in 90 days",
        grandSlamScore: 8.2
      },
      upsell: {
        name: "VIP Intensive",
        price: 3997,
        trigger: "Core offer purchase"
      },
      downsell: {
        name: "Self-Paced Course",
        price: 497,
        trigger: "Core offer rejection"
      },
      continuity: {
        name: "Career Momentum Club",
        price: 97,
        frequency: "monthly",
        trigger: "Any purchase"
      }
    },
    funnel: {
      strategy: "Content-led",
      stages: ["Awareness", "Attraction", "Lead Magnet", "Nurture", "Core", "Ascension"],
      benchmarks: {
        awarenessToAttraction: 0.05,
        attractionToLead: 0.25,
        leadToCore: 0.05,
        coreToUpsell: 0.20
      }
    }
  },

  // === PERFORMANCE: What's working ===
  performance: {
    deals: {
      total: 47,
      won: 12,
      lost: 8,
      active: 27,
      winRate: 0.60,
      avgDealValue: 1247,
      totalRevenue: 14964
    },
    content: {
      totalPosts: 156,
      avgEngagement: 4.2,
      topPerforming: [
        { title: "Why I quit my $200k job", engagement: 12.5 },
        { title: "The Sunday scaries are a signal", engagement: 9.8 }
      ],
      bestTopics: ["Corporate escape", "Career pivot stories", "Burnout recovery"]
    },
    funnel: {
      current: {
        awareness: 5000,
        leads: 250,
        customers: 12
      },
      conversionRates: {
        awarenessToLead: 0.05,
        leadToCustomer: 0.048
      }
    }
  },

  // === HEALING: Inner work progress ===
  healing: {
    fears: [
      { name: "Being seen as a fraud", intensity: 7, workedOn: true },
      { name: "Charging what I'm worth", intensity: 8, workedOn: false },
      { name: "Rejection", intensity: 6, workedOn: true }
    ],
    safetyContracts: [
      { contract: "Stay small to stay safe", status: "recognized" },
      { contract: "Don't outshine others", status: "releasing" },
      { contract: "Money is dangerous", status: "active" }
    ],
    progress: {
      recogniseQuests: 24,
      rewireQuests: 18,
      releaseQuests: 12,
      reconnectQuests: 15,
      healingCompassSessions: 3,
      currentStreak: 7
    }
  },

  // === META: About the data itself ===
  meta: {
    completeness: 0.78,
    gaps: ["Voice Training incomplete", "Funnel Calculator not started"],
    lastUpdated: {
      identity: "2026-01-08",
      strategy: "2026-01-10",
      performance: "2026-01-13",
      healing: "2026-01-13"
    },
    dataQuality: {
      highConfidence: ["skills", "persona", "core offer"],
      mediumConfidence: ["voice", "funnel benchmarks"],
      lowConfidence: ["upsell pricing", "continuity model"]
    }
  }
}
```

**Every flow reads from AND writes to this single profile.**

### 2. AI Business Partner (Zarlo 2.0)

Zarlo evolves from helpful assistant to true co-founder that sees everything:

#### Sees Everything
```
Zarlo: "I notice your content is about burnout recovery but your core offer
targets 'career changers'. These aren't quite the same audience.

Your top-performing posts are about escaping corporate life, but your
Dream Outcome is 'Land your dream role' - which sounds like staying in
corporate.

Should we align these? Options:
1. Update your Dream Outcome to 'Build a business you love'
2. Shift content toward career advancement (not escape)
3. Create two personas - escapers and advancers"
```

#### Predicts Blockers
```
Zarlo: "You're about to launch your first paid offer.

Based on your protective voice (People Pleaser) and your safety contracts
('Don't charge too much'), I predict you'll feel resistance around:
- The sales page pricing section
- Follow-up emails to interested leads
- Handling objections about price

Here's how other users with your pattern have navigated this:
[Show strategies]

Want to do a pre-launch Healing Compass session focused on pricing fears?"
```

#### Connects Dots
```
Zarlo: "Interesting pattern in your data:

Your 3 won deals this month all mentioned 'feeling stuck' in the discovery call.
But 'feeling stuck' isn't in your current persona pain points - you have
'Sunday scaries' and 'lost purpose' instead.

Your content that mentions 'stuck' gets 3x more engagement than average.

Recommendation: Add 'feeling stuck' as primary pain point in persona.
This will auto-update your:
- Content Generator prompts
- Sales page copy suggestions
- Lead scoring criteria

[Apply Change] [Ignore]"
```

#### Coaches Proactively
```
Zarlo: "Hey, noticed you haven't logged a deal in 2 weeks. Your last
activity was moving 3 deals to 'Proposal Sent' on Jan 1st.

Looking at your patterns:
- Your protective voice is Perfectionist
- You have a safety contract around 'rejection means I'm not good enough'
- Last time you had proposals pending, you avoided follow-up for 10 days

This looks like avoidance. The fear of rejection is keeping you from
following up, which ironically increases the chance of losing these deals.

Quick reframe: Following up isn't pushy - it's serving people who raised
their hand. They WANT to hear from you.

Want to:
1. Schedule follow-ups right now? I'll draft the emails.
2. Do a quick Release quest around rejection fear?
3. Talk through what's coming up for you?"
```

### 3. Context Graph Visualization

Interactive map showing how all data connects:

```
                              ┌─────────────────┐
                              │   BUSINESS DNA   │
                              └────────┬────────┘
                                       │
           ┌───────────────────────────┼───────────────────────────┐
           │                           │                           │
           ▼                           ▼                           ▼
    ┌─────────────┐            ┌─────────────┐            ┌─────────────┐
    │  IDENTITY   │            │  STRATEGY   │            │ PERFORMANCE │
    └──────┬──────┘            └──────┬──────┘            └──────┬──────┘
           │                          │                          │
     ┌─────┴─────┐              ┌─────┴─────┐              ┌─────┴─────┐
     │           │              │           │              │           │
     ▼           ▼              ▼           ▼              ▼           ▼
 ┌───────┐  ┌───────┐      ┌───────┐  ┌───────┐      ┌───────┐  ┌───────┐
 │Skills │  │Voice  │      │Persona│  │Offers │      │ Deals │  │Content│
 └───┬───┘  └───┬───┘      └───┬───┘  └───┬───┘      └───┬───┘  └───┬───┘
     │          │              │          │              │          │
     │          │              │          │              │          │
     └──────────┴──────────────┴──────────┴──────────────┴──────────┘
                                    │
                         ┌─────────────────────┐
                         │ Click any node to:  │
                         │ • See current data  │
                         │ • View connections  │
                         │ • Update values     │
                         │ • See impact        │
                         └─────────────────────┘
```

**Interaction:**
- Click "Skills" → See your skills, what flows use them, when last updated
- Click connection line → See how data flows between nodes
- Hover any node → See completeness % and freshness
- Click "Offers" → See all offer types, prices, which use persona data

### 4. Predictive Pre-Population

ML model trained on successful FindMyFlow users:

```
┌─────────────────────────────────────────────────────────────────┐
│ 🔮 Smart Suggestions (Based on Similar Users)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ Pricing Suggestion:                                              │
│ Users with similar skills and persona typically price at         │
│ $1,500 - $3,000 for their core offer.                           │
│                                                                  │
│ You entered: $997                                                │
│ This is below the successful range.                              │
│                                                                  │
│ [Adjust to $1,497] [Keep $997] [See pricing data]               │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ Funnel Suggestion:                                               │
│ Your persona (Corporate Manager) matches 34 other users who      │
│ succeeded with Webinar funnels (68% chose this).                │
│                                                                  │
│ You selected: Content-led funnel                                 │
│ This works but has 23% lower conversion for your persona.       │
│                                                                  │
│ [Switch to Webinar] [Keep Content-led] [Compare options]        │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ Voice Suggestion:                                                │
│ Based on your protective voice (People Pleaser), you'll write   │
│ better with a casual, conversational tone rather than formal.   │
│                                                                  │
│ People Pleasers often over-formalize to seem "professional"     │
│ but your audience responds better to warmth.                    │
│                                                                  │
│ [Apply casual tone] [Keep formal] [See examples]                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5. Self-Healing Data

AI fills gaps by inference from behavior:

```
┌─────────────────────────────────────────────────────────────────┐
│ 🔧 Auto-Generated Profile                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ You haven't completed Voice Training, but based on your          │
│ content history (47 posts analyzed), I've inferred:              │
│                                                                  │
│ Tone:        Warm and direct                                     │
│ Vocabulary:  Professional but accessible                         │
│ Hooks:       Story-led openings (78% of top posts)              │
│ Avoids:      Hype language, false urgency                       │
│ Signature:   Questions that provoke reflection                   │
│                                                                  │
│ Confidence: 82%                                                  │
│                                                                  │
│ [Accept Profile] [Adjust] [Complete Full Training Instead]      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────────┐
│ 🔧 Inferred Persona Update                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ Your last 5 won deals share characteristics not in your          │
│ current persona:                                                 │
│                                                                  │
│ Current Persona:        Inferred from Deals:                     │
│ ─────────────────       ──────────────────────                   │
│ Age: 35-45              Age: 40-50 (older!)                      │
│ Role: Manager           Role: Director+ (more senior!)           │
│ Pain: Sunday scaries    Pain: "Is this all there is?"           │
│                                                                  │
│ Your ideal customer may have evolved.                            │
│                                                                  │
│ [Update Persona] [Keep Current] [See Deal Data]                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 6. Outcome-Linked Context

Track which context combinations produce actual results:

```
┌─────────────────────────────────────────────────────────────────┐
│ 📊 What's Actually Working (Data from Your Business)            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ CONTENT PATTERNS                                                 │
│ ───────────────                                                  │
│ Posts mentioning "corporate escape":     12.5% engagement       │
│ Posts mentioning "career growth":         4.2% engagement       │
│ Posts with personal stories:              9.8% engagement       │
│ Posts with tips/tactics:                  3.1% engagement       │
│                                                                  │
│ → Recommendation: Lead with escape narratives + stories         │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ SALES PATTERNS                                                   │
│ ──────────────                                                   │
│ Deals with high "Pain" score:             73% win rate          │
│ Deals with high "Trust" score:            81% win rate          │
│ Deals with high "Fit" score:              67% win rate          │
│ Deals with high "Urgency" score:          89% win rate ⭐       │
│                                                                  │
│ → Recommendation: Prioritize urgency qualification              │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ OFFER PATTERNS                                                   │
│ ──────────────                                                   │
│ Deals closed with Core Offer only:        $1,497 avg           │
│ Deals closed with Core + Upsell:          $4,247 avg           │
│ Deals closed with Core + Continuity:      $1,497 + $97/mo      │
│                                                                  │
│ Users who complete Downsell flow:         +34% total revenue    │
│ Users who skip Downsell flow:             -15% total revenue    │
│                                                                  │
│ → Recommendation: You haven't built Downsell. Add it.          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 7. Natural Language Query

Ask questions across all flow data:

```
┌─────────────────────────────────────────────────────────────────┐
│ 💬 Ask Anything About Your Business                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ You: "What do my best customers have in common?"                │
│                                                                  │
│ Zarlo: Looking at your 12 won deals...                          │
│                                                                  │
│ DEMOGRAPHICS                                                     │
│ • Age: 42-48 (slightly older than your persona)                 │
│ • Role: Director or VP level (more senior than persona)         │
│ • Industry: Tech, Finance, Consulting                           │
│                                                                  │
│ PAIN PATTERNS                                                    │
│ • 10/12 mentioned "feeling stuck" (not in your persona!)        │
│ • 8/12 had recent trigger event (promotion passed, health)      │
│ • 7/12 found you through LinkedIn content                       │
│                                                                  │
│ BEHAVIOR                                                         │
│ • Avg 3.2 touchpoints before booking call                       │
│ • 9/12 consumed your "corporate escape" content                 │
│ • 11/12 responded to story-based posts (not tips)               │
│                                                                  │
│ RECOMMENDATIONS                                                  │
│ 1. Update persona age range to 40-50                            │
│ 2. Add "feeling stuck" as primary pain point                    │
│ 3. Double down on story-based content                           │
│ 4. Create Director/VP specific messaging                        │
│                                                                  │
│ [Apply All] [Review Each] [Export Report]                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

More example queries:
- "Why did I lose my last 3 deals?"
- "What content should I create this week?"
- "Am I charging enough?"
- "What's blocking my growth right now?"
- "Show me patterns between my healing work and business results"

### 8. Context-Aware UI Morphing

The entire UI transforms based on what's known and what stage the user is at:

```
┌─────────────────────────────────────────────────────────────────┐
│ UI MORPHING BASED ON BUSINESS DNA COMPLETENESS                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ NEW USER (0-20% complete)                                        │
│ ─────────────────────────                                        │
│ • Linear guided flow, heavy hand-holding                        │
│ • "Start here" prompts everywhere                               │
│ • Simplified navigation (hide advanced features)                │
│ • Focus: Discovery flows prominent                              │
│ • Zarlo: Onboarding coach mode                                  │
│                                                                  │
│ DISCOVERY COMPLETE (20-40%)                                      │
│ ──────────────────────────                                       │
│ • Offer-focused dashboard                                        │
│ • Show how skills → offers connection                           │
│ • Unlock Money Model section                                    │
│ • Focus: Offer Builder prominent                                │
│ • Zarlo: Strategy advisor mode                                  │
│                                                                  │
│ OFFER COMPLETE (40-60%)                                          │
│ ────────────────────────                                         │
│ • Sales-focused dashboard                                        │
│ • CRM becomes primary view                                       │
│ • Content Generator unlocked with context                       │
│ • Focus: CRM + Content prominent                                │
│ • Zarlo: Sales coach mode                                       │
│                                                                  │
│ LAUNCHING (60-80%)                                               │
│ ──────────────────                                               │
│ • Metrics-focused dashboard                                      │
│ • Funnel Calculator front and center                            │
│ • Daily priorities prominent                                    │
│ • Focus: Tracking + Optimization                                │
│ • Zarlo: Accountability partner mode                            │
│                                                                  │
│ SCALING (80-100%)                                                │
│ ─────────────────                                                │
│ • Analytics-focused dashboard                                    │
│ • Patterns and optimization prominent                           │
│ • Team/delegation features unlocked                             │
│ • Focus: Growth + Systemization                                 │
│ • Zarlo: Strategic advisor mode                                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Summary: The Three Levels

| Level | Theme | Core Addition | User Experience |
|-------|-------|---------------|-----------------|
| **20%** | Fix what's broken | Unified fetch hook, completeness badges, "based on" labels | "Oh nice, it remembers what I said" |
| **100%** | Connect intelligently | Centralized context service, smart routing, bidirectional updates, context panel | "Wow, everything talks to everything" |
| **1000000%** | Business DNA | Single synthesized profile, AI that sees all, predictive guidance, self-healing data, outcome tracking | "This app knows my business better than I do" |

---

## Implementation Roadmap

### Phase 1: Foundation (20% better)
- [ ] Create `useUserContext` hook
- [ ] Add completeness calculation
- [ ] Add "based on your answers" labels
- [ ] Fix the 7 identified gaps

### Phase 2: Intelligence (100% better)
- [ ] Build centralized context service
- [ ] Create smart onboarding router
- [ ] Add context preview panel
- [ ] Implement bidirectional updates
- [ ] Add freshness tracking

### Phase 3: Transformation (1000000% better)
- [ ] Design Business DNA schema
- [ ] Upgrade Zarlo to full context awareness
- [ ] Build context graph visualization
- [ ] Implement predictive suggestions
- [ ] Add natural language queries
- [ ] Create adaptive UI system
