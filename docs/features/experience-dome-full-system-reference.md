# Experience Dome — Full System Reference

## The Game

Life is the most magical game in the world. The purpose of the game is to have experiences you love. We believe there is a life path that is uniquely yours. This app turns finding that path into a game.

## The Measurement

The nervous system is the scorecard. Not salary, title, or company logo. Four states:

| State | Label | What it means |
|---|---|---|
| ✦ | Vibe Rise | "I feel ALIVE doing this" |
| ○ | Fun | "Yeah, that was good" |
| ◇ | Stressful | "I can do it but it costs me" |
| — | Uninterested | "Not for me" |

## The Three Phases

See `docs/features/three-phase-journey.md` for the full breakdown.

| Phase | Question | Courage | Product |
|---|---|---|---|
| 1: Discovery | "What lights me up?" | Trying something new | Free (Experience Game) |
| 2: Expansion | "How far can I take it?" | Expanding dimensions (people, money, location) | Find My Flow (paid) |
| 3: Build | "How do I live from it?" | Systematizing, scaling, leading | Scale Portal ($499+$99/mo) |

---

## Phase 1: The Experience Dome

### What it is
A map of ~380 human experiences across 12 primal branches. 54 core nodes for onboarding. Users tick what they've experienced, rate each with NS state, and see their unique dome shape emerge.

### The 12 Primal Branches (alphabetical)
Bonds, Fire, Healing, Movement, Nourishment, Play, Shelter, Sleep, Status, Story, Threat, Tools

### Core Nodes: 54
See `experienceDomeConfig.js` CORE_IDS for the full list. Key changes from original 58:
- Dropped: Buying insurance, Using a smartphone, Privacy tools, Sleep tracking (utilities, not experiences)
- Dropped: Cacao + breathwork ceremony (redundant with Healing), Firelight/candlelight (ambient), Fire pit gathering (merged with campfire)
- Split: Professional sports → Playing team sport + Watching live sport. YouTube → Creating YouTube videos (watching dropped)
- Added: Live music / concerts, Journaling / writing, Cooking for others, Watching live sport
- Renamed: Video calling → Virtual hangouts, Airbnb → Unique stays, Using social media → dropped

### Data
- Table: `experience_dome_ratings` (user_id, node_id, ns_state, updated_at)
- Hook: `useDomeData.js` — `bulkSetStates({ nodeId: nsState, ... })`
- Config: `experienceDomeConfig.js` — core IDs, labels, pruning
- Descriptions: `EXPERIENCE_DESC` map in `ExperienceGameFlow.jsx`

---

## The Key Frameworks

### Fuel vs Direction
- **Dome = fuel** (what recharges you). Perpendicular to problems.
- **Problem = direction** (what drives you). Perpendicular to dome.
- They don't map to each other. They multiply.
- A person who cares about kids_deserved_better + dome lights up on Movement + Play = PE teacher, youth sports coach. Same problem + different dome = completely different career.

### The Revised Formula
```
Skill × Problem = Career direction
Dome = Sustainability check (will you burn out doing this?)
Product Type = Revenue model
```

The dome does NOT determine the career. It constrains the career to a domain where you won't hollow out. Someone who loves breathwork but whose skill is building might create a breathwork app, not facilitate sessions.

### PlaySkill Bridges Consuming and Creating
The PlaySkill IS the bridge between enjoying an experience and delivering it professionally. No separate "consuming vs creating" tag needed.
```
Dome says:    "I love breathwork" (domain interest)
Skill says:   "I'm a natural coach" (delivery capability)
Multiply:     breathwork × coaching = breathwork facilitator
Different skill: breathwork × building = breathwork app
```

### Problem ←→ Desire Poles
Each of the 12 felt problems has a positive pole. The problem is WHY someone starts seeking. The desire is WHAT they want instead. Same axis, different entry point. Show aspiration publicly, pain internally.

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

Derive the user's problem from Life Map data, don't ask cold. "Based on your life map, you've experienced voice_taken and work_hollows. Which would you want to help others with?"

### Personas = Customers, Not Identity
The 12 personas (seekers, builders, healers...) are CUSTOMER segments. "I SERVE healers" not "I AM a healer." The persona tells you who writes the cheque, the problem tells you what they're buying.

### Learning Is Play (MasterMind Council ruling)
Learning is meta to all branches, not its own primal. Philosophy nights = Story × Bonds (or Play × Bonds). The Play primal may need to expand beyond physical games to include intellectual play. See Obsidian: `Insights/Learning Is Play.md`.

---

## Phase 2 & 3 Systems (existing app)

### Self-Knowledge Layer (Phase 2)
- **PlaySkill Wheel** (10 skills): storytelling, teaching, coaching, performing, creating, building, designing, leading, connecting, speaking_up
- **Essence Archetype** (12 archetypes): who am I at my core?
- **Protective Patterns** (5 voices): Ghost, Controller, Perfectionist, Performer, People Pleaser

### Direction Layer (Phase 2→3 bridge)
- **Persona Segments** (12 types): who do I serve?
- **Problem Taxonomy** (12 problems): what are they suffering from?
- **Industry Coverage**: where do solutions live?
- **Buyer Types**: Individual (Consumer/Participant/Community/Practitioner), Venue/Platform, Business/Corporate, Government, Nonprofit, Education

### Business Layer (Phase 3)
- **Product Types** (18): Service → Productized → Product
- **Hormozi Offer Stack** (5 layers): Lead Magnet → Attraction → Core → Upsell → Continuity
- **Business Accelerator** (Stages 0-8)
- **Quest Board + Courage Challenges**

### Earnings Data
- `blsWageData.json` — 992 occupations, BLS May 2025 (95% confidence)
- `independentEarningsData.json` — 5 experiential roles (30-80% confidence)
- `businessModelEarnings.json` — 8 business models, domain-agnostic (70% confidence)
- Key insight: earnings driven by business model choice, not experience domain

---

## Connections Between Systems

### Dome ←→ Skills
- 211 dome nodes have PlaySkill inference signals (`domeSkillInference.json`)
- Strong signal: doing the experience IS practicing the skill
- Weak signal: consuming suggests interest

### Dome ←→ Roles
- 10 role fingerprints mapped via O*NET bridge (`roleExperienceFingerprints.json`)
- Matching: dome ratings × role fingerprints = % career match

### Dome ←→ Product Types
- 18 product types mapped to dome signals + skills (`productTypeMapping.json`)

### Dome ←→ Courage Challenges
- 98% of real courage challenges map to dome primal intersections (validated against 52 challenges)
- Courage challenges are NOT 1:1 with nodes. They sit at primal INTERSECTIONS (e.g. sales call = Story × Bonds × Threat)

---

## Data Files

| File | Contents | Confidence |
|------|----------|-----------|
| `experienceDomeConfig.js` | ~380 nodes, 54 core, pruning, labels | 95% |
| `domeSkillInference.json` | 211 nodes → PlaySkill signals | 85% |
| `roleExperienceFingerprints.json` | 10 roles, O*NET API-validated + BLS wages | 90% |
| `onetDomeBridge.json` | 41 activities → dome nodes by industry | 85% |
| `blsWageData.json` | 992 occupations, BLS May 2025 | 95% |
| `businessModelEarnings.json` | 8 models, domain-agnostic ranges | 70% |
| `independentEarningsData.json` | 5 experiential roles, sourced | 30-80% |
| `productTypeMapping.json` | 18 product types → skills + dome signals | 88% |
| `experienceIndustryMap.json` | 54 nodes → industries + revenue models | 80% |
| `playSkillTaxonomyV2.json` | 10 skills with placemakes | 95% |
| `problemTaxonomyV2.json` | 12 problems | 95% |

---

## What's Built vs What's Missing

| Component | Status |
|-----------|--------|
| Experience Game intro + tick + dome popup | Built (Phase 1) |
| Experience Game sort (NS rating) | Built (Phase 1) |
| Experience Game insight + CTAs | Built (Phase 1) |
| Dome viz (mini dome, full RuleBreakTree) | Built |
| Dome Supabase persistence | Built |
| PlaySkill identification | Live |
| O*NET bridge + role fingerprints + BLS wages | Built |
| Business model earnings data | Built |
| Problem ←→ Desire poles | Documented |
| Persona ←→ Problem mapping | Documented |
| Problem ←→ Industry mapping | Documented |
| Three-phase journey doc | Written |
| Quest board + courage challenges | Live (Phase 2) |
| Scale Portal | Live (Phase 3) |
| **Experience Game UX polish (dome viz sizing, labels)** | **IN PROGRESS** |
| **Multiplication screen (career reveal)** | **NOT BUILT** |
| **Role model matching (creators)** | **NOT BUILT** |
| **Growth edge → quest pipeline** | **NOT BUILT** |
| **Dome → skill inference wiring** | **NOT BUILT** |
| **Problem → Industry → Buyer recommender** | **NOT BUILT** |

---

## Honest Gaps

1. Dome coverage validated on one user (Huzz, 52 challenges, 98% coverage). Needs broader validation.
2. Earnings data: BLS employed is solid (95%). Independent/entrepreneurial is 30-80%. Retainer/hybrid model has no data.
3. Role matching only uses dome axis, not skill axis yet.
4. Feedback loops are aspirational — courage completion doesn't auto-update dome.
5. 33 creator profiles only validate wellness industry.
6. Tools (1 node) and Threat (1 node) branches are thin. May need expanding after user testing.

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

> Note: These are aspirational — not yet wired in code. Kept for design reference.

```
Courage completion → skill XP → dome lights up → new career matches emerge
Growth edge dome nodes → auto-suggested courage challenges → completion → dome expands
Customer feedback → offer refinement → business growth → new quests
```

---

## Appendix B: The Clean Map (original multiplication diagram)

> Note: The formula has been revised. Skill × Problem = Career direction, Dome = Fuel. This diagram shows the ORIGINAL framing where Experience × Skill was the primary multiplication. Kept for reference as the visual structure is still useful even though the inputs changed.

The whole system reduces to **2 user inputs → everything else derived**:

```
INPUT 1: Rate experiences (dome onboarding)
  → gives: Experience profile
  → infers: Skills (via domeSkillInference)
  → suggests: Product Types (via productTypeMapping)

INPUT 2: Derive problem from Life Map data (not asked cold)
  → gives: Problem / Desire pole
  → implies: Persona segments you'd serve
  → maps to: Industries where solutions live
```

```
WHO AM I?                    WHO DO I SERVE?              HOW DO I BUILD IT?
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
     │                             │                            │
     └─────────────┬───────────────┘                            │
                   │                                            │
                   ×────────────────────────────────────────────┘
                   │
                   = YOUR CAREER MAP
```

### The User Story (original)

A corporate worker in midlife crisis:
1. Rates experiences → discovers Movement + Healing + Bonds light them up
2. Life Map reveals work_hollows as their problem → desire pole: Meaningful Work
3. System multiplies: skill (coaching) × problem (work_hollows) = burnout coach. Dome (breathwork) = what keeps them alive doing it.
4. Earnings: employed $47K (BLS), independent $60-150K, portfolio career $100-120K
5. Growth edge nodes → first courage challenge: "Facilitate a breathwork session for 3 friends"

---

## Appendix C: Supabase Tables

> Note: These are the tables referenced throughout this doc. See CLAUDE.md Database Schema section for the full schema.

| Table | What it stores |
|-------|---------------|
| `experience_dome_ratings` | User's dome node NS ratings (node_id, ns_state) |
| `user_skill_progress` | Skill XP and levels (skill_id, xp, level) |
| `quests` | Active life paths (skill_tags, branch) |
| `quest_completions` | Courage challenge results (reflection_text) |
| `nikigai_clusters` | Life map clusters (resonance_state, behavioral_evidence) |
| `life_path_sessions` | Career NS ratings (careers JSON, stuck_points JSON) |
| `founder_dna_results` | Play Profile results |
| `groan_challenges` | Courage challenges (status, depth_level, wahoo_category) |
| `healing_intentions` | Per-task healing flow data (pattern, fear, origin, insight, rewire) |

---

## Appendix D: Detailed Persona → Problem → Industry → Buyer Chain

> Note: This was the original detailed mapping. The main doc now references this by framework name. Kept for when you need the specific pairings.

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

Problem-facing industries (people pay BECAUSE they're suffering):
- Consulting (8/12 problems), Education (6/12), Healthcare (6/12), Government (5/12), Tech (5/12), Law (4/12), Nonprofit (4/12), Arts (4/12), Media (4/12), Wellness (3/12), Finance (3/12), HR (3/12)

Infrastructure industries (people pay for utility):
- Retail, Manufacturing, Automotive, Energy — correctly sparse, not problem-facing

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

> Note: These connection mappings were in the original doc. The main doc now summarises them. Kept for reference when building the multiplication engine.

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
- **Access cluster** (Builders, Connectors, Teachers): shared pain around feeling_stupid + locked_out
- **Hollow work cluster** (Achievers, Seekers, Explorers, Challengers): shared pain around work_hollows — primary app audience
- **Expression cluster** (Creators, Healers): voice_taken + pain_not_believed
- **Justice cluster** (Protectors, Nurturers, Visionaries): systemic failures
