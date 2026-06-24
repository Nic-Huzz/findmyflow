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
| **8** | **Quick Capture → Offer Builder** | **HIGH** | **NEW: Products not pre-populating** |
| **9** | **Wealth Ladder → Product Defaults** | **MEDIUM** | **NEW: Category defaults not enforced** |
| **10** | **Offer Builder V1 → Grand Slam V2** | **HIGH** | **NEW: Check prerequisite exists** |
| **11** | **Grand Slam V2 → CRM/Content** | **MEDIUM** | **NEW: Bonuses/guarantee not used** |
| **12** | **Guidance Emphasis → Quest System** | **HIGH** | **NEW: Emphasis not filtering quests** |
| **13** | **Quick Capture ↔ Flow Finder Merge** | **MEDIUM** | **NEW: Two sources, no reconciliation** |

---

## Detailed Gap Analysis

### NEW GAPS (Onboarding V2 - Jan 2026)

---

### Gap 8: Quick Capture → Offer Builder (HIGH PRIORITY)

**Status:** Products captured but not used downstream

**Files:**
- `src/components/QuickCapture.jsx` (saves to `products` table)
- `src/flows/OfferBuilder100M/index.jsx` (doesn't fetch `products`)
- `src/flows/GrandSlamOfferFlow.jsx` (doesn't fetch `products`)

**Current State:**
- Quick Capture saves products with `money_model_tier` (attraction/core/upsell/downsell/continuity)
- Products include `product_type`, `price_amount`, `status`
- Offer Builder V1 does NOT fetch from `products` table
- Grand Slam V2 does NOT show existing products

**The Problem:**
- User captures "Coaching Program - $2,000 - Core" in Quick Capture
- Goes to Offer Builder → starts from scratch
- No "You already have products defined, let's enhance them" prompt
- Duplication of effort, inconsistent data

**What SHOULD be shared:**
| Source Data | Target Field | Benefit |
|-------------|--------------|---------|
| products.name | Offer Builder pre-fill | Skip naming step |
| products.price_amount | Price suggestions | Consistent pricing |
| products.money_model_tier | Tier selection | Auto-categorize |
| products.product_type | Service vs Product version | Right flow path |

**Tables:** `products` → `offer_builder_assessments`

**Fix Complexity:** MEDIUM - need to add fetch + pre-population logic

---

### Gap 9: Wealth Ladder → Product Category Defaults (MEDIUM PRIORITY)

**Status:** Wealth ladder sets default but not enforced/used

**Files:**
- `src/lib/onboardingV2.js` (determines default category)
- `src/components/MultiProductCapture.jsx` (receives wealthLadder prop)
- `src/components/DeliverySelector.jsx` (product type selection)

**Current State:**
- `onboardingV2.js` calculates default product category from wealth_ladder_rung:
  - `pre_ladder` → no default
  - `service` → custom_service
  - `productized` → packaged_service / live_group
  - `products` → digital_product
- This is passed to MultiProductCapture but unclear if used

**The Problem:**
- User at "service" rung should default to service products
- User at "products" rung should default to digital products
- May not be enforcing these defaults consistently
- No validation that products match wealth ladder position

**What SHOULD be shared:**
| Source Data | Target Field | Benefit |
|-------------|--------------|---------|
| wealth_ladder_rung | Default product_type | Contextual defaults |
| wealth_ladder_rung | Available product types | Hide irrelevant options |
| wealth_ladder_rung | Pricing suggestions | Stage-appropriate pricing |

**Tables:** `user_stage_progress.wealth_ladder_rung` → `products.product_type`

**Fix Complexity:** LOW - verify implementation, add validation

---

### Gap 10: Offer Builder V1 → Grand Slam V2 (HIGH PRIORITY)

**Status:** Prerequisite check exists but data transfer unclear

**Files:**
- `src/flows/GrandSlamOfferFlow.jsx` (checks for V1 completion)
- `src/flows/OfferBuilder100M/index.jsx` (V1 source)

**Current State:**
- Grand Slam V2 requires V1 `offer_builder_assessments` to exist
- Fetches V1 data to show core products in review step
- Has `useAutoSave` with 24hr localStorage expiration

**The Problem:**
- Does V1 Dream Outcome inform V2 Offer Naming suggestions?
- Does V1 Proof Stack inform V2 Guarantee recommendations?
- Does V1 price inform V2 Bonus value calculations?
- V2 should build ON V1, not just require it

**What SHOULD be shared:**
| Source Data | Target Field | Benefit |
|-------------|--------------|---------|
| V1 dream_outcome | V2 offer_name suggestions | Consistent naming |
| V1 proof_stack | V2 guarantee type | Aligned proof |
| V1 price | V2 bonus value ranges | Proportional bonuses |
| V1 obstacles | V2 bonus problem_solved | Target bonuses at obstacles |

**Tables:** `offer_builder_assessments` → `grand_slam_offers`

**Fix Complexity:** MEDIUM - add context-aware suggestions

---

### Gap 11: Grand Slam V2 → CRM/Content (MEDIUM PRIORITY)

**Status:** Grand Slam outputs not used downstream

**Files:**
- `src/flows/GrandSlamOfferFlow.jsx` (outputs to `grand_slam_offers`)
- `src/pages/crm/Sales.jsx` (doesn't fetch `grand_slam_offers`)
- `src/components/crm/ContentGenerator.jsx` (doesn't fetch `grand_slam_offers`)

**Current State:**
- Grand Slam V2 captures: bonuses[], guarantee, scarcity, offer_name
- These are rich marketing assets
- CRM doesn't show "This deal includes these bonuses"
- Content Generator doesn't suggest "Create content about your guarantee"

**The Problem:**
- User crafts compelling bonuses: "Quick-Start Guide ($497 value)"
- Goes to create content → no suggestion to promote bonuses
- Goes to close deal → can't reference specific bonuses
- Grand Slam work is siloed, not leveraged

**What SHOULD be shared:**
| Source Data | Target Field | Benefit |
|-------------|--------------|---------|
| bonuses[] | Content Generator presets | "Promote your bonus" content |
| guarantee | Content Generator topics | Trust-building content |
| scarcity | CRM deal urgency | Reference scarcity in follow-up |
| offer_name | CRM deal name | Consistent offer naming |
| total_bonus_value | Sales pitch | "Total value: $X" |

**Tables:** `grand_slam_offers` → `content_history`, `sales_deals`

**Fix Complexity:** MEDIUM - add fetching and UI surfacing

---

### Gap 12: Guidance Emphasis → Quest System (HIGH PRIORITY)

**Status:** Emphasis calculated but may not filter quests

**Files:**
- `src/lib/onboardingV2.js` (defines 8 emphasis types with quest priorities)
- `src/hooks/useChallengeData.js` (quest loading logic)
- `src/Challenge.jsx` (quest display)

**Current State:**
- `EMPHASIS_CONFIG` defines for each emphasis:
  - `primaryQuests`: Array of quest IDs to prioritize
  - `heroTitle`: Dashboard hero messaging
  - `zarloPersonality`: AI coaching style
  - `stageRange`: Which stages are relevant
- Unclear if Challenge.jsx actually filters/prioritizes by emphasis

**The Problem:**
- User with `client_acquisition` emphasis should see CRM quests first
- User with `deep_discovery` should see FlowFinder quests first
- If emphasis isn't connected, users get generic quest order
- Zarlo personality may not be adapting

**What SHOULD be shared:**
| Source Data | Target Field | Benefit |
|-------------|--------------|---------|
| guidance_emphasis | Quest sort order | Relevant quests first |
| guidance_emphasis | Dashboard hero | Personalized messaging |
| guidance_emphasis | Zarlo prompts | Contextual coaching |
| guidance_emphasis | Available stages | Hide irrelevant stages |

**Tables:** `user_stage_progress.guidance_emphasis` → Quest UI

**Fix Complexity:** MEDIUM - verify implementation, add missing connections

---

### Gap 13: Quick Capture ↔ Flow Finder Merge (MEDIUM PRIORITY)

**Status:** Two data sources, no reconciliation

**Files:**
- `src/components/QuickCapture.jsx` (source: 'quick_capture')
- `src/flows/FlowFinderSkills.jsx` (source: 'flow_finder')
- Both write to `nikigai_responses`

**Current State:**
- Quick Capture users (Paths 2-4) capture skills/problems/personas quickly
- Flow Finder users (Path 1) do deep AI-guided discovery
- Both write to `nikigai_responses` with different `source` values
- Quick Capture users can LATER do Flow Finder

**The Problem:**
- User does Quick Capture: selects 3 skills from wheel
- Later does Flow Finder: discovers 5 more skills via AI
- Are these merged? Deduplicated?
- Does Flow Finder show "You previously selected X, let's explore deeper"?
- Library of Answers: shows both sources? Merged view?

**What SHOULD be shared:**
| Source Data | Target Field | Benefit |
|-------------|--------------|---------|
| Quick Capture skills | Flow Finder starting point | Build on existing |
| Flow Finder skills | Quick Capture refinement | Update selections |
| Both sources | Library of Answers | Unified view |
| Both sources | Offer Builder | Complete skill set |

**Tables:** `nikigai_responses` (source: 'quick_capture' vs 'flow_finder')

**Fix Complexity:** MEDIUM - add merge/dedup logic, show provenance

---

## ORIGINAL GAPS (Still Valid)

---

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

4. **Gap 9 - Verify wealth ladder defaults**
   - Files: `MultiProductCapture.jsx`, `DeliverySelector.jsx`
   - Change: Ensure wealthLadder prop is used to set default product_type

### Medium Effort (4-8 hours each)

5. **Gap 2 - Voice Training archetype integration**
   - File: `VoiceTraining/index.jsx`
   - Change: Fetch archetypes, show personalized intro

6. **Gap 3 - Link offer details to deal outcomes**
   - Files: `dealService.js`, `DealOutcomeModal.jsx`
   - Change: Join `offer_builder_assessments` on deal resolution

7. **Gap 6 - Auto-calculate fit score**
   - Files: `dealService.js`, `Sales.jsx`
   - Change: Compare deal contact to `persona_profiles`

8. **Gap 8 - Products → Offer Builder pre-population** ⭐ NEW
   - Files: `OfferBuilder100M/index.jsx`, `GrandSlamOfferFlow.jsx`
   - Change: Fetch `products` table, pre-populate with existing products
   - Show: "You have 3 products defined. Let's enhance them."

9. **Gap 10 - V1 → Grand Slam V2 context** ⭐ NEW
   - File: `GrandSlamOfferFlow.jsx`
   - Change: Use V1 dream_outcome for naming suggestions
   - Use V1 obstacles to suggest bonus problem_solved fields

10. **Gap 12 - Guidance Emphasis → Quests** ⭐ NEW
    - Files: `useChallengeData.js`, `Challenge.jsx`
    - Change: Sort quests by `EMPHASIS_CONFIG[emphasis].primaryQuests`
    - Verify Zarlo personality adapts to emphasis

### Larger Effort (1-2 days)

11. **Gap 7 - Bridge Funnel Builder to Calculator**
    - New table: `funnel_builder_assessments`
    - New migration file
    - Update both flow components

12. **Gap 11 - Grand Slam V2 → CRM/Content** ⭐ NEW
    - Files: `Sales.jsx`, `ContentGenerator.jsx`, `gatherContentContext()`
    - Change: Fetch `grand_slam_offers`, add bonuses/guarantee to context
    - Add "Promote your bonus" content presets

13. **Gap 13 - Quick Capture ↔ Flow Finder merge** ⭐ NEW
    - Files: `FlowFinderSkills.jsx`, `LibraryOfAnswers.jsx`
    - Change: Show Quick Capture selections as starting point
    - Merge/dedup responses in Library view

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
