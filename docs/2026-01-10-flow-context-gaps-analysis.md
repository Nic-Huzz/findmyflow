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
