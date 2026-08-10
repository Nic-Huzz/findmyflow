# Experience Dome — Systems Map

## North Star

People arrive with no idea or a rough idea. They leave with a map to get clear, then the tools and processes to live it.

## The Three-Axis Formula

```
Experience (WHAT lights you up) × Skill (HOW you express it) × Product Type (HOW you deliver it) = Your Career Map
```

## How Every System Feeds Every Other System

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│   EXPERIENCE DOME                    PLAYSKILL WHEEL                         │
│   (~380 nodes, 12 primals)           (10 skills)                             │
│   "What do I love?"                  "How do I express?"                     │
│                                                                              │
│   ┌─ Dome onboarding (58 core)       ┌─ Onboarding quiz (/get-started)      │
│   ├─ Map tap-to-rate (330 all)       ├─ Dome inference (domeSkillInference)  │
│   ├─ Quest activity auto-fill        ├─ Courage challenge completion         │
│   └─ Life path NS ratings            └─ Skill XP (user_skill_progress)      │
│                                                                              │
│          ↓ dome shape                       ↓ skill profile                  │
│          ↓                                  ↓                                │
│   ┌──────┴──────────────────────────────────┴──────────┐                     │
│   │                                                     │                    │
│   │            ROLE MATCHING ENGINE                     │                    │
│   │                                                     │                    │
│   │  Dome ratings × Role fingerprints = % match         │                    │
│   │  (roleExperienceFingerprints.json, O*NET-driven)    │                    │
│   │                                                     │                    │
│   │  10 roles now, scalable to 1000+ via O*NET bridge   │                    │
│   │  (onetDomeBridge.json — 41 activities → dome nodes) │                    │
│   │                                                     │                    │
│   │  Role models: 33 Experience Creator DNA profiles    │                    │
│   │  (experienceCreatorDNA.json + offerMap.json)         │                    │
│   │                                                     │                    │
│   └──────────────────────────┬──────────────────────────┘                     │
│                              │                                               │
│                              ↓ matched roles                                 │
│                                                                              │
│   ┌──────────────────────────────────────────────────────┐                    │
│   │                                                      │                   │
│   │         PRODUCT TYPE RECOMMENDER                     │                   │
│   │                                                      │                   │
│   │  Skill profile × Dome signals → product type fit     │                   │
│   │  (productTypeMapping.json — 18 types)                │                   │
│   │                                                      │                   │
│   │  Tiers: Service → Productized → Product              │                   │
│   │  Scalability: time_bound → semi_scalable → scalable  │                   │
│   │                                                      │                   │
│   │  Career progression: start as service, evolve to     │                   │
│   │  product, then community (same experience domain)    │                   │
│   │                                                      │                   │
│   └──────────────────────────┬───────────────────────────┘                    │
│                              │                                               │
│                              ↓ recommended product types                     │
│                                                                              │
│   ┌──────────────────────────────────────────────────────┐                    │
│   │                                                      │                   │
│   │         HORMOZI OFFER STACK                          │                   │
│   │                                                      │                   │
│   │  Each product type plugs into a Hormozi layer:       │                   │
│   │  Attraction → Core → Upsell → Downsell → Continuity │                   │
│   │                                                      │                   │
│   │  6 Money Model flows already built:                  │                   │
│   │  AttractionOffer, Upsell, Downsell, Continuity,      │                   │
│   │  LeadsStrategy, LeadMagnet                           │                   │
│   │                                                      │                   │
│   │  ProductSuiteMap: drag product types into the chain  │                   │
│   │                                                      │                   │
│   └──────────────────────────┬───────────────────────────┘                    │
│                              │                                               │
│                              ↓ offer stack defined                           │
│                                                                              │
│   ┌──────────────────────────────────────────────────────┐                    │
│   │                                                      │                   │
│   │         BUSINESS ACCELERATOR (Stages 1-7)            │                   │
│   │                                                      │                   │
│   │  Stage 1: Validation (test if people want it)        │                   │
│   │  Stage 2: Offer Design (build the offer stack)       │                   │
│   │  Stage 3: Attraction (get attention)                 │                   │
│   │  Stage 4: Nurture (build trust)                      │                   │
│   │  Stage 5: Sales (close)                              │                   │
│   │  Stage 6: Delivery (fulfil + improve)                │                   │
│   │  Stage 7: Scale (certify, systemise, multiply)       │                   │
│   │                                                      │                   │
│   └──────────────────────────┬───────────────────────────┘                    │
│                              │                                               │
│                              ↓ running a business                            │
│                                                                              │
│   ┌──────────────────────────────────────────────────────┐                    │
│   │                                                      │                   │
│   │         QUEST BOARD + COURAGE CHALLENGES             │                   │
│   │                                                      │                   │
│   │  Quests = life paths being pursued                   │                   │
│   │  Tasks = concrete actions within each quest          │                   │
│   │  Courage challenges = growth edge experiences        │                   │
│   │                                                      │                   │
│   │  Growth edge dome nodes → auto-suggested challenges  │                   │
│   │  Challenge completion → skill XP + dome data         │                   │
│   │  → feeds back into dome + skill profile              │                   │
│   │                                                      │                   │
│   └──────────────────────────┘                                               │
│                                                                              │
│   FEEDBACK LOOPS:                                                            │
│   • Dome rating → skill inference → product type fit → offer stack           │
│   • Courage completion → skill XP → updated skill profile → new matches      │
│   • Quest progress → dome auto-fill → dome shape evolves → new matches       │
│   • Growth edge nodes → courage challenges → completion → dome lights up     │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Data Files — What Feeds What

| File | What it contains | Feeds into |
|------|-----------------|-----------|
| `experienceDomeConfig.js` | ~380 experiential nodes, core set (58), NS colors | Dome viz, onboarding, matching |
| `onetWorkActivities.json` | O*NET importance scores for 10 roles | Fingerprint generation |
| `onetDomeBridge.json` | 41 O*NET activities → dome node clusters by industry | Fingerprint generation |
| `roleExperienceFingerprints.json` | 10 role fingerprints (v2, O*NET-driven) | Role matching engine |
| `experienceIndustryMap.json` | 58 core nodes → industries + revenue models | Product type recommender |
| `productTypeMapping.json` | 18 product types → skills + dome signals | Product type recommender |
| `domeSkillInference.json` | 213 dome nodes → PlaySkill signals (166 omitted: no skill signal) | Skill triangulation |
| `experienceCreatorDNA.json` | 33 creator profiles (DNA, sliders) | Role model matching |
| `experienceCreatorOfferMap.json` | 33 creators × offer layers (real products) | Offer stack examples |
| `playSkillTaxonomyV2.json` | 10 skills with placemakes | Skill identification |

## Supabase Tables

| Table | What it stores | Read by |
|-------|---------------|--------|
| `experience_dome_ratings` | User's dome node ratings (node_id, ns_state) | Dome viz, matching engine |
| `user_skill_progress` | Skill XP and levels | Skill profile, matching |
| `quests` | Active life paths (branch, skill_tags) | Dome auto-fill, quest board |
| `quest_completions` | Courage challenge results (NS state) | Dome data, skill XP |
| `nikigai_clusters` | Life map clusters (resonance_state) | Clarity score, dome feed |
| `life_path_sessions` | Career NS ratings | Dome feed, career matching |
| `founder_dna_results` | Play Profile results | Creator DNA matching |

## User Journey (Clarity → Action Pipeline)

### Phase 1: Discovery ("What do I love?")
- **Dome onboarding** → rate 58 core experiences
- **PlaySkill quiz** → identify top skills (already in onboarding)
- **Dome inference** → triangulate skills from dome data
- **Output**: lit dome + skill profile

### Phase 2: Direction ("What could I do?")
- **Role matching** → dome × role fingerprints = % matches
- **Role model reveal** → "Here's someone living this path" (creator DNA)
- **Product type fit** → skills × dome signals = recommended delivery mechanisms
- **Output**: top 3 career matches + product type recommendations

### Phase 3: Design ("How do I build it?")
- **Offer stack** → Hormozi money model flows (attraction → continuity)
- **Product suite map** → drag product types into offer chain
- **Creator Portal** → Remarkable Results → Reach → Growth → Scale Score
- **Output**: defined offer stack + business plan

### Phase 4: Action ("Go do it")
- **Quest creation** → career match becomes a quest
- **Growth edge challenges** → dark dome nodes become courage challenges
- **Business accelerator** → Stages 1-7 (validate → scale)
- **Feedback loop**: completion → dome lights up → new matches emerge

## What's Built vs What's Missing

| Component | Status | Files |
|-----------|--------|-------|
| Dome viz (primal colors, rate picker, hover) | Built | `RuleBreakTree.jsx` |
| Dome onboarding (58 nodes, 5 states) | Built | `ExperienceDomeOnboarding.jsx` |
| Dome persistence (Supabase) | Built | `useDomeData.js`, migration |
| PlaySkill identification | Live | `/get-started` onboarding |
| Dome → skill inference | Built | `domeSkillInference.json` |
| O*NET bridging table | Built | `onetDomeBridge.json` |
| Role fingerprints (v2) | Built | `roleExperienceFingerprints.json` |
| Role matching engine | Prototype (script) | Needs component |
| Product type mapping | Built | `productTypeMapping.json` |
| **Multiplication screen (reveal)** | **NOT BUILT** | **The gap** |
| **Role model matching** | **NOT BUILT** | Needs dome fingerprints on 33 creators |
| **Growth edge → quest pipeline** | **NOT BUILT** | Needs dome-to-quest wiring |
| Money model flows | Live | 6 flows in `src/flows/` |
| Product suite map | Live | `ProductSuiteMapFlow.jsx` |
| Business accelerator (Stages 1-7) | Live | Stage config in `LevelConfig.js` |
| Quest board + courage challenges | Live | `LevelTab.jsx`, `QuestBoardCard.jsx` |
| Creator DNA profiles | Live | `experienceCreatorDNA.json` (33 profiles) |

## Honest Gaps (Things the Diagram Shows But Aren't Real Yet)

1. **"Quest activity auto-fill"** — listed as a dome data source but NOT BUILT. No mechanism currently auto-fills dome ratings from quest completions. Needs: edge function or hook that maps quest branch/skill_tags to dome node IDs on completion.

2. **Role matching currently ignores the skill axis.** The matching script only does dome ratings × role fingerprints. It should also weight by skill profile match but doesn't yet.

3. **Product type recommender doesn't exist as code.** The `productTypeMapping.json` has the data but nothing reads it. No component, no hook, no scoring logic.

4. **O*NET API credentials failed.** The data was scraped from the public site instead. Importance scores may not match the API format exactly. The O*NET bridge references 80 dome nodes across 41 activities, which is reasonable but needs spot-checking.

5. **The "feedback loop" arrows are aspirational.** Challenge completion currently awards skill XP and increments behavioral_evidence on clusters, but does NOT write dome ratings. The loop only closes manually (user re-rates on dome).

## Next Build Priorities

1. **Multiplication screen** — the reveal moment where dome × skills = "this is what you could do"
2. **Dome fingerprints for 33 creators** — so role model matching works
3. **Growth edge → quest pipeline** — dome "growth edge" nodes auto-create courage challenges
4. **Dome → skill inference wiring** — triangulate skills from dome data (enriches PlaySkill profile)
5. **Scale role fingerprints** — O*NET bridge can generate fingerprints for 1000+ roles
