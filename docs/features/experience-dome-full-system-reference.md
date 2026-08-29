# Experience Dome — Full System Reference

> Single source of truth for the three-phase product architecture.
> Last updated: Aug 29, 2026 (Phase 2 restructure session).

## The Game

Life is the most magical game in the world. The purpose of the game is to have experiences you love. We believe there is a life path that is uniquely yours. This app turns finding that path into a game.

**Enlightenment insight**: A full Vibe Rise dome = complete nervous system mastery. Nothing triggers you, nothing bores you, everything is alive. The dome is a consciousness map.

## The Measurement

The nervous system is the scorecard. Not salary, title, or company logo. Four states:

| State | Label | What it means |
|---|---|---|
| ✦ | Vibe Rise | "I feel ALIVE doing this" |
| ○ | Fun | "Yeah, that was good" |
| ◇ | Stressful | "I can do it but it costs me" |
| — | Bored | "Not for me" |

## The Three Phases

See `docs/features/three-phase-journey.md` for the full breakdown.

| Phase | Question | Courage | Product |
|---|---|---|---|
| 1: Discovery | "What lights me up?" | Trying something new | Free (Experience Game) |
| 2: Expansion | "How far can I take it?" | Expanding dimensions (craft + scale) | Find My Flow (paid) |
| 3: Build | "What category am I creating?" | Systematizing, scaling, leading | Scale Portal ($499+$99/mo) |

---

## Phase 1: The Experience Dome

### What it is
A **decision tool for the Phase 1→2 bridge**, not an ongoing dashboard. 77 core nodes (58 from innovation tree + 19 virtual human experience nodes) across 10 primal branches (Movement, Story, Bonds, Healing, Nourishment, Play, Shelter, Style, Sleep, Fire). Threat and Tools dropped as innovation branches. See `docs/features/experience-dome-node-map.md` for the full node list.

### Flow (updated Aug 29)
Per-branch flow: tick experiences → rate with NS state → see dome update → next branch.
Branches ordered common → uncommon (Movement, Play, Bonds... → Fire, Sleep, Threat).

### The 12 Primal Branches (ordered common → uncommon)
Movement, Play, Bonds, Story, Nourishment, Status, Healing, Tools, Shelter, Fire, Sleep, Threat

### Core Nodes: 56
See `experienceDomeConfig.js` CORE_IDS for the full list.

### Dome Visualization: Safety Dome
- User's hero avatar at the center
- 12 branches arranged radially (radar chart)
- **Distance from center = NS state**: Vibe Rise = closest (safe zone), Fun = mid, Stressful = outer, Bored = edge
- Four coloured concentric bands: gold (Vibe Rise) → green (Fun) → red (Stressful) → grey (Bored)
- Nodes physically move inward as experiences become Vibe Rise
- Full dome = enlightenment

### Data
- Table: `experience_dome_ratings` (user_id, node_id, ns_state, rated_at)
- Hook: `useDomeData.js` — `bulkSetStates({ nodeId: nsState, ... })`
- Config: `experienceDomeConfig.js` — core IDs, labels, pruning
- Descriptions: `EXPERIENCE_DESC` map in `ExperienceGameFlow.jsx`

---

## Phase 1→2 Bridge

**User-declared, not app-triggered.** "Ready to go deeper on a life path?" CTA on Discover tab.

When tapped → Life Paths flow, pre-populated with Vibe Rise data from both Life Map clusters AND dome nodes. User confirms which to pursue → creates quests → activates Quests tab.

No formula needed at this bridge. Just: "which Vibe Rise experiences do you want to go deeper on?"

---

## Phase 2: Expansion

### Tab Structure
Discover | Quests | Tune | Progress

| Tab | Role | What lives here |
|-----|------|-----------------|
| Discover | Phase 1 ongoing | Experience Dome, Essence Mirror, Life Map. "Experience to try this week" + bridge CTA |
| Quests | Phase 2 action | Quest board, WeeklyFocus (one courage challenge/week), courage challenges |
| Tune | All phases | Daily practices, drains. NS maintenance is phase-agnostic |
| Progress | All phases | Hero journey (movie refs + next step), zone matrix X/Y graph, stats, expansion dimensions |

### Expansion Dimensions (replaces domain labels)
Each courage challenge tags which capacities are being stretched (multi-select):

**Craft dimensions (primary):**
1. Duration, 2. Frequency, 3. Medium, 4. People

**Scale dimensions (secondary, grow organically through craft):**
5. Money, 6. Location, 7. Independence

Phase 2 = "Can I?" (courage). Phase 3 = "How do I systematize it?" (strategy).
"I charged someone" = Phase 2 courage challenge. "I need to optimize my pricing tiers" = Phase 3.

### Zone Matrix (simplified)
Four boolean rules, not percentage-based:

| Quadrant | Rule |
|----------|------|
| Unfulfilment (bottom-left) | No Life Map AND no Dome done |
| Misguided (top-left) | Life Map + Dome done, but no Life Paths committed |
| Head Full of Dreams (bottom-right) | Life Paths done, but no courage action in last 7 days |
| Self-Actualisation (top-right) | All discovery done + courage challenge in last 7 days |

### Self-Knowledge Layer
- **PlaySkill Wheel** (10 skills): storytelling, teaching, coaching, performing, creating, building, designing, leading, connecting, speaking_up
- **Essence Archetype** (12 archetypes): who am I at my core?
- **Protective Patterns** (5 voices): Ghost, Controller, Perfectionist, Performer, People Pleaser
- **Skills**: collected in background via `increment_skill_xp` RPC. Hidden from UI to keep things simple. Available for Phase 3 when needed.

### Phase 2 outcome
"I know I want to do this, and I've shown up enough to prove it, to myself." Self-declared readiness, not a threshold the app decides.

---

## Phase 2→3 Bridge: Direction Layer

The direction layer emerges organically during Phase 2 through courage challenges. Phase 3 systematizes what Phase 2 revealed.

- **Phase 2 discovery:** "I noticed burnt-out professionals keep coming to my breathwork sessions"
- **Phase 3 systematization:** "How do I build a funnel for burnt-out professionals?"

### Multiplication Screen (NOT BUILT)
`Skill × Problem = Career direction`, `Dome = Sustainability check`.
Belongs at the Phase 2→3 bridge. By this point, the user has built skill through courage challenges and knows their craft. The multiplication reveals: "Who do you serve? What problem do you solve for them?" Problem derived from Life Map data, not asked cold.

### Career Clarity
Hidden until Phase 2→3 bridge (hero stage 10+). Redundant for new users since dome + life paths does the same job better.

### Direction components
- **Persona Segments** (12 types): who do I serve?
- **Problem Taxonomy** (12 problems): what are they suffering from?
- **Industry Coverage**: where do solutions live?
- **Buyer Types**: Individual (Consumer/Participant/Community/Practitioner), Venue/Platform, Business/Corporate, Government, Nonprofit, Education

---

## Phase 3: Build — "What category are you creating?"

### The Question
Not "how do I make a living?" but **"What category are you creating?"** This positions the user as a category creator, not just a business builder.

"I facilitate breathwork retreats" is a business. "I created a new way to process grief through movement + breathwork + music" is a category.

### Two steps
1. **"What category are you creating?"** → Rule Break Tree + Remarkable Results reveals the answer. The innovation sits at a branch intersection. Scale Score's 10 branches are category dimensions.
2. **"What's the engine to make it livable?"** → Business model selection (Product Types, Offer Stack, Pricing). The category IS the positioning. The engine IS the monetization.

> **[UNCERTAIN]:** Does the Multiplication Screen (Skill x Problem = Career direction) fire BEFORE the category question, or does the category question REPLACE it? The multiplication tells you WHAT you offer. The category tells you HOW you're different offering it. They might be sequential: multiplication first (what), category second (how different). Decision deferred.

### Business Model Engine
- **Product Types** (18): Service → Productized → Product
- **Hormozi Offer Stack** (5 layers): Lead Magnet → Attraction → Core → Upsell → Continuity
- **Business Accelerator** (Stages 0-8)
- **Scale Portal**: separate app at `create.nichuzz.com` ($499 setup + $99/mo)

### Courage at this phase
Systematizing, scaling, leading. Building the machine that lets you do what you love full-time. Showing up publicly as an authority in your domain.

### Earnings Data
- `blsWageData.json` — 992 occupations, BLS May 2025 (95% confidence)
- `independentEarningsData.json` — 5 experiential roles (30-80% confidence)
- `businessModelEarnings.json` — 8 business models, domain-agnostic (70% confidence)
- Key insight: earnings driven by business model choice, not experience domain

---

## The Key Frameworks

### Fuel vs Direction
- **Dome = fuel** (what recharges you). Perpendicular to problems.
- **Problem = direction** (what drives you). Perpendicular to dome.
- They don't map to each other. They multiply.

### The Revised Formula
```
Skill × Problem = Career direction
Dome = Sustainability check (will you burn out doing this?)
Product Type = Revenue model
```

> **[UNCERTAIN]** Does this formula still hold exactly as written, or has the emphasis shifted toward dome-first discovery with skill/problem emerging later through Phase 2 courage challenges? The formula is correct but the TIMING may have changed — it fires at Phase 2→3 bridge, not during onboarding.

### PlaySkill Bridges Consuming and Creating
```
Dome says:    "I love breathwork" (domain interest)
Skill says:   "I'm a natural coach" (delivery capability)
Multiply:     breathwork × coaching = breathwork facilitator
Different skill: breathwork × building = breathwork app
```

### Problem ←→ Desire Poles

| Problem (pain) | Desire (aspiration) |
|---|---|
| work_hollows | Meaningful work |
| feeling_stupid | Mastery |
| forgot_what_for | Aliveness |
| voice_taken | Expression |
| left_behind | Belonging |
| life_not_yours | Sovereignty |
| pain_not_believed | Validation |
| stopped_wondering | Curiosity |
| kids_deserved_better | Protection |
| work_treated_nothing | Recognition |
| world_losing | Stewardship |
| locked_out | Access |

Derive the user's problem from Life Map data, don't ask cold.

### Personas = Customers, Not Identity
The 12 personas are CUSTOMER segments. "I SERVE healers" not "I AM a healer."

### Learning Is Play (MasterMind Council ruling)
Learning is meta to all branches, not its own primal.

---

## Connections Between Systems

### Dome ←→ Skills
- 211 dome nodes have PlaySkill inference signals (`domeSkillInference.json`)
- Strong signal: doing the experience IS practicing the skill

> **[UNCERTAIN]** With skills hidden from UI, is this connection still prioritized? Data exists but may be V2/V3.

### Dome ←→ Roles
- 10 role fingerprints mapped via O*NET bridge (`roleExperienceFingerprints.json`)
- Matching: dome ratings × role fingerprints = % career match

> **[UNCERTAIN]** Role matching is Phase 2→3 bridge territory. Not needed for V1 dome.

### Dome ←→ Product Types
- 18 product types mapped to dome signals + skills (`productTypeMapping.json`)

> **[UNCERTAIN]** Product type recommendation is Phase 3. Not needed until Scale Portal.

### Dome ←→ Courage Challenges
- 98% of real courage challenges map to dome primal intersections (validated against 52 challenges)
- Courage challenges sit at primal INTERSECTIONS (e.g. sales call = Story × Bonds × Threat)

---

## Data Files

| File | Contents | Confidence | Phase |
|------|----------|-----------|-------|
| `experienceDomeConfig.js` | ~380 tree nodes + 19 virtual, 77 core, 10 branches, pruning, labels | 95% |
| `domeSkillInference.json` | 211 nodes → PlaySkill signals | 85% | 2→3 |
| `roleExperienceFingerprints.json` | 10 roles, O*NET API-validated + BLS wages | 90% | 2→3 |
| `onetDomeBridge.json` | 41 activities → dome nodes by industry | 85% | 2→3 |
| `blsWageData.json` | 992 occupations, BLS May 2025 | 95% | 3 |
| `businessModelEarnings.json` | 8 models, domain-agnostic ranges | 70% | 3 |
| `independentEarningsData.json` | 5 experiential roles, sourced | 30-80% | 3 |
| `productTypeMapping.json` | 18 product types → skills + dome signals | 88% | 3 |
| `experienceIndustryMap.json` | 54 nodes → industries + revenue models | 80% | 3 |
| `playSkillTaxonomyV2.json` | 10 skills with placemakes | 95% | 2 |
| `problemTaxonomyV2.json` | 12 problems | 95% | 2→3 |

---

## What's Built vs What's Missing

| Component | Status | Phase |
|-----------|--------|-------|
| Experience Game (tick → rate → dome per branch) | **Built** (rewritten Aug 29) | 1 |
| Dome viz (NS-state Y-axis, coloured bands) | **Built** (Aug 29) | 1 |
| Dome Supabase persistence | Built | 1 |
| Discover tab (Essence Mirror, Life Map, Dome, bridge CTA) | **Built** (Aug 29) | 1 |
| "Experience to try this week" on Discover | **Built** (Aug 29) | 1 |
| Life Paths flow ingests dome + Life Map Vibe Rise data | **Built** (Aug 29) | 1→2 |
| Tab restructure (Discover/Quests/Tune/Progress) | **Built** (Aug 29) | 1-2 |
| WeeklyFocus (courage merged into Quests) | **Built** (Aug 28) | 2 |
| Expansion dimensions on courage challenges | **Built** (Aug 29) | 2 |
| ProgressTab (hero journey, zone matrix, dimensions) | **Built** (Aug 29) | 2 |
| Zone matrix (simplified 4-rule model) | **Built** (Aug 29) | 2 |
| Game language onboarding slides | **Built** (Aug 29) | 1 |
| PlaySkill identification | Live | 2 |
| Quest board + courage challenges | Live | 2 |
| Scale Portal | Live | 3 |
| O*NET bridge + role fingerprints + BLS wages | Built (data only) | 2→3 |
| Business model earnings data | Built (data only) | 3 |
| Problem ←→ Desire poles | Documented | 2→3 |
| Persona ←→ Problem mapping | Documented | 2→3 |
| **Multiplication screen (career reveal)** | **NOT BUILT** | 2→3 |
| **Role model matching (creators)** | **NOT BUILT** | 2→3 |
| **Dome → skill inference wiring** | **NOT BUILT** | 2→3 |
| **Problem → Industry → Buyer recommender** | **NOT BUILT** | 3 |

---

## Honest Gaps

1. Dome coverage validated on one user (Huzz, 52 challenges, 98% coverage). Needs broader validation.
2. Earnings data: BLS employed is solid (95%). Independent/entrepreneurial is 30-80%. Retainer/hybrid model has no data.
3. Role matching only uses dome axis, not skill axis yet.
4. Feedback loops are aspirational — courage completion doesn't auto-update dome.
5. 33 creator profiles only validate wellness industry.
6. Tools (1 node) and Threat (1 node) branches are thin. May need expanding after user testing.
7. "Bored" label used in Experience Game, but "Uninterested" still used in Life Paths, zone assessments, and other components. Needs app-wide rename pass.

---

## V2 Ideas (not V1 scope)

- **Re-rating experiences**: how do users update NS ratings after their state changes?
- **Daily experience logging**: log what you did today + NS state, building a record over time
- **Experiences spanning branches**: e.g. "silent disco" = Movement + Play + Bonds
- **Discover tab post-bridge**: what does it look like after Phase 2 begins?
- **Dome viz polish**: ring labels, node icons vs dots, animations on state change
- **Dome as consciousness map**: track % Vibe Rise over time as a meta-score

---

## Obsidian Notes (related)
- `Frameworks/Persona Problem Buyer Map.md` — persona × problem → buyer mapping
- `Frameworks/Problem Industry Buyer Chain.md` — problem → industry → buyer chain
- `Frameworks/Problem Desire Poles.md` — 12 problem ←→ desire poles
- `Insights/Fuel vs Direction.md` — dome is fuel, problem is direction
- `Insights/PlaySkill Bridges Consuming and Creating.md` — PlaySkill as the bridge
- `Insights/Learning Is Play.md` — MasterMind Council ruling on learning

---

## Appendix A: Feedback Loops

> Note: Aspirational — not yet wired in code.

```
Courage completion → skill XP → dome lights up → new career matches emerge
Growth edge dome nodes → auto-suggested courage challenges → completion → dome expands
Customer feedback → offer refinement → business growth → new quests
```

---

## Appendix B: The Clean Map (multiplication diagram)

> Note: This fires at the Phase 2→3 bridge, not during onboarding.

```
INPUT 1: Rate experiences (dome, Phase 1)
  → gives: Experience profile
  → infers: Skills (via domeSkillInference, background)
  → suggests: Product Types (via productTypeMapping, Phase 3)

INPUT 2: Derive problem from Life Map data (Phase 2→3 bridge, not asked cold)
  → gives: Problem / Desire pole
  → implies: Persona segments you'd serve
  → maps to: Industries where solutions live
```

```
WHO AM I?                    WHO DO I SERVE?              HOW DO I BUILD IT?
(Phase 1)                    (Phase 2→3 bridge)           (Phase 3)
┌─────────┐                  ┌─────────┐                  ┌─────────┐
│Experience│                  │ Persona │                  │ Product │
│  Dome    │                  │(customer│                  │  Type   │
│  (WHAT)  │                  │ segment)│                  │  (HOW)  │
└────┬─────┘                  └────┬────┘                  └────┬────┘
     │                             │                            │
     ×                             ×                            ×
     │                             │                            │
┌────┴─────┐                  ┌────┴────┐                  ┌────┴────┐
│PlaySkill │                  │ Problem │                  │  Offer  │
│  (HOW)   │                  │ (WHY)   │                  │  Stack  │
└────┬─────┘                  └────┴────┘                  └────┬────┘
     │                             │                            │
     = WHAT YOU OFFER              = WHY THEY PAY               = HOW YOU EARN
```

---

## Appendix C: Supabase Tables

| Table | What it stores |
|-------|---------------|
| `experience_dome_ratings` | Dome node NS ratings (node_id, ns_state, rated_at) |
| `user_skill_progress` | Skill XP and levels (skill_id, xp, level) — background collection |
| `quests` | Active life paths (skill_tags, branch) |
| `quest_completions` | Courage challenge results (reflection_text) |
| `groan_challenges` | Courage challenges (status, depth_level, expansion_dimensions, wahoo_category) |
| `nikigai_clusters` | Life map clusters (resonance_state, behavioral_evidence) |
| `life_path_sessions` | Career NS ratings (careers JSON, stuck_points JSON) |
| `founder_dna_results` | Play Profile results |
| `healing_intentions` | Per-task healing flow data (pattern, fear, origin, insight, rewire) |

---

## Appendix D: Detailed Persona → Problem → Industry → Buyer Chain

> Phase 3 reference. Not needed until Scale Portal work.

### Persona → Problem Mapping

| Persona (customer) | Primary problem | What they'd pay for |
|---|---|---|
| Seekers | forgot_what_for, work_hollows | Direction, clarity, purpose |
| Builders | feeling_stupid, locked_out | Tools, access, clear paths |
| Healers | pain_not_believed, voice_taken | Being seen, pain relief, expression |
| Teachers | feeling_stupid, locked_out | Better methods, accessible learning |
| Connectors | left_behind, locked_out | Community, belonging, access |
| Achievers | work_hollows, work_treated_nothing | Meaningful work, recognition |
| Explorers | life_not_yours, work_hollows | Freedom, adventure, escape |
| Visionaries | world_losing, work_treated_nothing | Platforms, movements, being heard |
| Protectors | kids_deserved_better, life_not_yours | Safety, justice, advocacy tools |
| Creators | voice_taken, work_treated_nothing | Expression, platforms, recognition |
| Nurturers | kids_deserved_better, left_behind | Care systems, support structures |
| Challengers | life_not_yours, work_hollows | Change tools, disruption, liberation |

### Industry Coverage

Problem-facing industries: Consulting (8/12), Education (6/12), Healthcare (6/12), Government (5/12), Tech (5/12), Law (4/12), Nonprofit (4/12), Arts (4/12), Media (4/12), Wellness (3/12), Finance (3/12), HR (3/12)

### Buyer Types

| Buyer type | How they pay | Decision speed |
|---|---|---|
| Individual: Consumer | $15-97 (books, courses, apps) | Instant |
| Individual: Participant | $97-997 (retreats, workshops) | Days |
| Individual: Community | $27-297/mo (memberships) | Weeks |
| Individual: Practitioner | $2K-5K (certifications) | Months |
| Venue/Platform | $500-5K/booking | Weeks |
| Business/Corporate | $2K-50K/engagement | Months |
| Government | Variable (grants, contracts) | Months |
| Nonprofit | Variable (grants, donations) | Months |
| Education/Institutional | Institutional budget | Months |

---

## Appendix E: Detailed Connections

### Desires ←→ Dome Primals
- Belonging → Bonds, Play
- Sovereignty → Threat, Shelter, Movement
- Mastery → Tools, Story
- Expression → Story, Status, Movement
- Curiosity → Play, Story
- Validation → Healing, Bonds
- Aliveness → Movement, Play, Fire
- Protection → Threat, Bonds, Shelter
- Meaningful work → Healing, Story
- Recognition → Status, Story
- Stewardship → Nourishment, Fire
- Access → Tools, Bonds

### Persona Clusters
- **Access cluster** (Builders, Connectors, Teachers): feeling_stupid + locked_out
- **Hollow work cluster** (Achievers, Seekers, Explorers, Challengers): work_hollows — primary app audience
- **Expression cluster** (Creators, Healers): voice_taken + pain_not_believed
- **Justice cluster** (Protectors, Nurturers, Visionaries): systemic failures

---

## Hero Journey Stages (Campbell's 12 Stages)

The user's journey through the app maps to Campbell's Hero's Journey. Stages 2-8 track inner transformation (Phase 1-2). Stages 9-12 track building a life from that transformation (Phase 2-3).

### Stage Definitions + Triggers

| Stage | Campbell Name | User Meaning | Phase | Auto Trigger | DB Source |
|---|---|---|---|---|---|
| 0-1 | Call to Adventure | Showed up | — | Account created | `user_stage_progress` exists |
| 2 | Call to Adventure | First engagement | P1 | First NS check-in | `nervous_system_checkins` count > 0 |
| 3 | Refusal of the Call | Saw what lights you up | P1 | Dome completed (10+ ticks) | `experience_checkins` count ≥ 10 |
| 4 | Meeting the Mentor | Met yourself | P1 | Essence Mirror + avatar | `essence_mirror_completed` + `hero_avatar_url` |
| 5 | Crossing the Threshold | Committed to paths | Bridge | Choose Quests completed (1+ quest created) | `quests` count > 0 |
| 6 | Tests, Allies, Enemies | Training | P2 | 5+ courage challenges completed | `groan_challenges` status=completed count ≥ 5 |
| 7 | Approach to the Cave | Looked at the fear | P2 | First healing flow started | `healing_intentions` count > 0 |
| 8 | The Ordeal | Deep work, not stopping | P2 | 3+ healing outcomes + 20+ courage | `healing_intentions` with outcome ≥ 3 AND `groan_challenges` completed ≥ 20 |
| 9 | Reward | Starting to monetise | P3 | Scale Portal started | `remarkable_angles` OR `scale_diagnostics` exists |
| 10 | The Road Back | Consistent income (even small) | P3 | **Deferred**: needs income tracking | Future: self-reported monthly revenue > 0 for 3+ months |
| 11 | Resurrection | Covers living expenses | P3 | **Deferred**: needs income tracking | Future: self-reported revenue ≥ user-set "living expenses" target |
| 12 | Return with the Elixir | 100% autonomous, free | P3 | **Deferred**: needs income tracking | Future: self-reported "I'm financially free doing what I love" |

### The Financial Freedom Progression (Stages 9-12)

Stages 9-12 map the journey from inner clarity to financial autonomy:

1. **Starting to monetise** (Stage 9): You know what you offer. You're building the vehicle. First Scale Portal entry.
2. **Consistent income** (Stage 10): Money is coming in regularly, even if small. You've validated the model.
3. **Covers living expenses** (Stage 11): Your new life design sustains you. The old career is optional.
4. **100% autonomous** (Stage 12): You choose where you live, what you do, who you work with. Money comes from play, not pressure.

### Future: Income Tracking for Stages 10-12

To auto-trigger stages 10-12, we need:
- Monthly revenue self-report (simple number input, once/month prompt)
- User-set "living expenses" target (onboarding or settings)
- 3-month consistency check for Stage 10 (revenue > 0 for 3 consecutive months)
- Revenue ≥ expenses target for Stage 11
- Stage 12: self-declared milestone ("I'm free") + revenue ≥ 2x expenses for 3+ months

Until income tracking is built, stages 10-12 are defined but unreachable. Users cap at Stage 9.

### Implementation

File: `src/lib/heroStageChecker.js`
Called on: `Challenge.jsx` mount (cheap queries, ~50ms)
Advances one stage per call. Subsequent mounts catch further graduations.
Auto-posts stage graduation to community feed via `postFeedEvent`.
Mystery boxes awarded at stages 4 (gold) and 7 (legendary).

### Changes from previous triggers (Aug 30 2026)

| Old Trigger | Problem | New Trigger |
|---|---|---|
| 2→3: Life Paths exercise | Life Paths moved to Bridge, not Phase 1 | Dome completed (10+ ticks) |
| 4→5: First Vibe Rise wahoo | Skips Phase 1 flows | Choose Quests (1+ quest created) |
| 5→6: Vibe Rise + depth L3/L4 | **Uses removed L1-L5 depth system** | 5+ courage completed |
| 6→7: 5+ protective voices | Too niche | First healing flow started |
| 7→8: Session with Nic | Not scalable | 3+ healing outcomes + 20+ courage |
| 8+: Not implemented | Missing | Stages 9-12 defined above |

---

## Pending Work (Phase 3 Fixes for Future Agent)

### High Priority

**1. Income tracking for Stages 10-12**
Stages 10-12 are defined but unreachable. Need:
- Monthly revenue self-report (simple number input, prompted once/month on Tune tab or Progress tab)
- User-set "living expenses" target (settings or onboarding)
- DB table: `income_reports` (user_id, month, revenue, created_at)
- Stage 10 trigger: revenue > 0 for 3 consecutive months
- Stage 11 trigger: revenue >= user's expenses target
- Stage 12: self-declared "I'm free" + revenue >= 2x expenses for 3+ months
- See "Future: Income Tracking for Stages 10-12" section above

**2. Stage 3 trigger: Dome tick count may be too high**
Stage 3 requires 10+ rows in `experience_checkins`. The current user only has 2. The Experience Dome was rewritten this session (per-branch tick flow). Verify the new dome flow creates `experience_checkins` rows correctly. If the dome saves to a different table or format, update the Stage 3 query in `heroStageChecker.js`.

**3. Hero stage catch-up mode**
The checker advances ONE stage per `Challenge.jsx` mount. A user who qualifies for Stage 9 but is at Stage 7 needs 2 page loads to catch up. Consider changing the checker to loop until no more graduations are possible, or at minimum advance 2-3 stages per call.

**4. QuestMapPage dead depth_level fetch**
`src/pages/QuestMapPage.jsx` lines 48-57 still fetch `depth_level` from `groan_challenges` and attach it to tasks. This data is no longer used by the overview SVG (which is now chronological). The fetch runs on every QuestMap load for zero effect. Remove it.

### Medium Priority

**5. Healing flow completion rate is 1/60**
59 of 60 `healing_intentions` rows only have `pattern` filled (pre-seeded from WahooCreator protective voice selection). Only 1 has all 7 steps completed. This suggests either:
- Users don't know how to access the full healing flow after creation
- The flow is too long (7 steps)
- The entry point isn't visible enough
Consider: shorter healing flow (3 steps: Pattern + Fear + Rewire), or a nudge system that reminds users to complete started flows.

**6. Struggle pills (hidden, needs redesign)**
"I need help with..." section in `LevelTab.jsx` is commented out (`<!-- hidden for now -->`). Contains 3 pills: career path, what's keeping me stuck, scaling. Code preserved, needs a design decision on whether to bring back and where.

**7. FocusFooter quest color mismatch**
`QuestPathMap.jsx` FocusFooter (line ~710) still uses `SAFE_COLOURS[quest.predicted_state]` for action card styling instead of the quest's chosen line color. Minor visual inconsistency between the focus slide SVG line (uses quest color) and the footer cards below it (uses NS state color). May be intentional since cards are typed by courage/healing/todo.

### Low Priority

**8. Quest color picker on QuestBoardCard**
Color picker was intentionally removed from `QuestBoardCard` during the Option A redesign. Colors can now only be changed from the Quest Map focus slides. If users want to change colors without opening the Quest Map, consider adding a subtle color dot to the QuestBoardCard header (tap to pick).

**9. WeeklyFocus Monday reset verification**
The "Pick another" flow after completing a weekly courage challenge works via localStorage key rotation (`weekly_focus_challenge_{weekStart}`). Verify the Monday boundary works correctly across timezones. `getWeekStartLocal()` should handle this but hasn't been tested at the boundary.

**10. ProgressTab "Go" deep-links to tab**
The "Go ›" links on stages 5-7 navigate to `/7-day-challenge` but the user lands on whatever tab was last active (Discover by default). There's no URL param to deep-link to the Quests tab. Consider adding `?tab=Quests` support to `Challenge.jsx` so the Progress tab can link directly to the right tab.
