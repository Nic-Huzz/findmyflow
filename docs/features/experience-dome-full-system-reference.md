# Experience Dome — Full System Reference

## North Star

People arrive with no idea or a rough idea. They leave with a map to get clear, then the tools and processes to live it.

## The Three Questions

Everything in the system answers one of three questions:

1. **Who am I?** (self-knowledge)
2. **Who do I serve?** (direction)
3. **How do I build it?** (action)

---

## 1. WHO AM I? (Self-Knowledge)

### Experience Dome (12 primals, ~380 nodes)
- "What experiences light me up?"
- Rated: Love it / It's fun / Growth edge / Stresses me / Bored
- 58 core nodes for onboarding, ~380 total for deep exploration
- Data: `experience_dome_ratings` table
- Files: `experienceDomeConfig.js`, `experienceIndustryMap.json`

### PlaySkill Wheel (10 skills)
- "How do I naturally express myself?"
- Skills: storytelling, teaching, coaching, performing, creating, building, designing, leading, connecting, speaking_up
- Three data sources (triangulation): onboarding quiz, dome node inference, courage challenge completion
- Data: `user_skill_progress` table
- Files: `playSkillTaxonomyV2.json`, `domeSkillInference.json`

### Essence Archetype (12 archetypes)
- "Who am I at my core?"
- 12 essence archetypes (Radiant Rebel, Playful Creator, etc.)
- Data: essence mirror flow results

### Protective Patterns (5 voices)
- "What defenses do I carry?"
- Ghost, Controller, Perfectionist, Performer, People Pleaser
- Data: `healing_intentions` table

---

## 2. WHO DO I SERVE? (Direction)

### Persona Segments (12 types)
- "Who is my customer?"
- Seekers, Builders, Healers, Teachers, Connectors, Achievers, Explorers, Visionaries, Protectors, Creators, Nurturers, Challengers
- These are CUSTOMER segments, not identity types
- File: `PERSONA_SEGMENTS` in `wheelTaxonomy.js`

### Problem Taxonomy (12 felt problems, each with a desire pole)

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

- The problem is WHY someone starts seeking. The desire is WHAT they want instead. Same axis, different entry point.
- File: `problemTaxonomyV2.json`, `PROBLEM_SEGMENTS` in `wheelTaxonomy.js`

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

### Industry Coverage (where solutions live)

Problem-facing industries (people pay BECAUSE they're suffering):
- Consulting (8/12 problems), Education (6/12), Healthcare (6/12), Government (5/12), Tech (5/12), Law (4/12), Nonprofit (4/12), Arts (4/12), Media (4/12), Wellness (3/12), Finance (3/12), HR (3/12)

Infrastructure industries (people pay for utility):
- Retail, Manufacturing, Automotive, Energy — correctly sparse, not problem-facing

### Buyer Types (who writes the cheque)

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

## 3. HOW DO I BUILD IT? (Action)

### Product Types (18 types)
- "How do I deliver the solution?"
- Tiers: Service (time-bound) → Productized (semi-scalable) → Product (scalable)
- Services: 1:1, 1:Many, Custom, Packaged, Hybrid
- Productized: Group Program, Self-Paced Course, Live Cohort, Done-For-You, Membership
- Products: Digital, Tech/Digital, SaaS, Physical, Podcast, Newsletter, YouTube, Mixed
- File: `productTypeMapping.json`, `SOLUTION_LABELS` in `ProductSelectionFlow.jsx`

### Hormozi Offer Stack (5 layers)
- "How do I monetise?"
- Lead Magnet → Attraction → Core → Upsell → Downsell → Continuity
- 6 Money Model flows already built
- Files: `moneyModelConfigs.js`, offer JSON files

### Business Accelerator (Stages 0-8)
- "What do I build next?"
- 0: Flow Finder → 0.5: Courage → 1: Validate → 2: Design → 3: Attract → 4: Nurture → 5: Sell → 6: Deliver → 7: Scale → 8: Track

### Quest Board + Courage Challenges
- "What do I DO today?"
- Quests = life paths being pursued
- Tasks = concrete actions within each quest
- Courage challenges = growth edge experiences from the dome
- Completion feeds back: skill XP, dome data, behavioral evidence

---

## THE MULTIPLICATIONS

```
Experience × Skill = what you could offer
Persona × Problem = who would pay and why
Product Type × Offer Stack = how you'd earn

All three together = your career map
```

---

## THE FEEDBACK LOOPS

```
Courage completion → skill XP → dome lights up → new career matches emerge
Growth edge dome nodes → auto-suggested courage challenges → completion → dome expands
Customer feedback → offer refinement → business growth → new quests
```

---

## CONNECTIONS BETWEEN SYSTEMS

### Dome ←→ Skills
- 211 dome nodes have PlaySkill inference signals (`domeSkillInference.json`)
- Strong signal: doing the experience IS practicing the skill (stand-up = performing)
- Weak signal: consuming suggests interest (podcasts = storytelling interest)

### Dome ←→ Problems (via Fuel vs Direction)
- Dome experiences don't SOLVE problems. They solve the PERSON so the person can solve the problem.
- Dome = fuel (what recharges you). Problem = direction (what drives you). Perpendicular axes.

### Dome ←→ Roles
- Role fingerprints: 10 roles mapped to dome nodes via O*NET bridge (`roleExperienceFingerprints.json`)
- Matching: dome ratings × role fingerprints = % career match

### Dome ←→ Product Types
- 18 product types mapped to dome signals + skills (`productTypeMapping.json`)
- Dome nodes suggest which product types fit (coaching nodes → 1:1 service, community nodes → membership)

### Skills ←→ Product Types
- Each product type has primary and secondary skill requirements
- Coaching skill → 1:1 Service, Packaged Service
- Building skill → SaaS, Digital Product
- Connecting skill → Membership, Community

### Problems ←→ Industries
- Each problem maps to 3-8 industries where solutions exist
- Industries are problem-facing (healthcare, education) or infrastructure (retail, manufacturing)

### Problems ←→ Desires
- Each problem has a positive pole (desire)
- Convenience, efficiency, entertainment are commercial MECHANISMS, not desires
- The 12 desire poles cover the full economy: meaningful work, mastery, aliveness, expression, belonging, sovereignty, validation, curiosity, protection, recognition, stewardship, access

### Desires ←→ Dome Primals
- Each desire maps to 2-3 dome primals
- Belonging → Bonds, Play
- Mastery → Tools, Story
- Aliveness → Movement, Play, Fire
- Expression → Story, Status, Movement

### Personas ←→ Problems
- Many-to-many (not 1:1)
- Each persona has 2 primary problems
- Each problem is served by 3-5 personas
- Natural clusters: Access (Builders/Connectors/Teachers), Hollow Work (Achievers/Seekers/Explorers/Challengers), Expression (Creators/Healers), Justice (Protectors/Nurturers/Visionaries)

---

## DATA FILES

| File | Contents | Confidence |
|------|----------|-----------|
| `experienceDomeConfig.js` | ~380 nodes, 58 core, pruning, labels | 95% |
| `domeSkillInference.json` | 211 nodes → PlaySkill signals | 85% |
| `roleExperienceFingerprints.json` | 10 roles, O*NET API-validated | 90% |
| `onetDomeBridge.json` | 41 activities → dome nodes by industry | 85% |
| `onetWorkActivities.json` | Raw O*NET API scores, 10 occupations | 95% |
| `productTypeMapping.json` | 18 product types → skills + dome signals | 88% |
| `experienceIndustryMap.json` | 58 nodes → industries + revenue models | 80% |
| `experienceCreatorDNA.json` | 33 creator profiles | 95% (existing data) |
| `experienceCreatorOfferMap.json` | 33 creators × real products | 95% (existing data) |
| `playSkillTaxonomyV2.json` | 10 skills with placemakes | 95% (existing data) |
| `problemTaxonomyV2.json` | 12 problems | 95% (existing data) |

## SUPABASE TABLES

| Table | What it stores |
|-------|---------------|
| `experience_dome_ratings` | User's dome node ratings |
| `user_skill_progress` | Skill XP and levels |
| `quests` | Active life paths (branch, skill_tags) |
| `quest_completions` | Courage challenge results |
| `nikigai_clusters` | Life map clusters (resonance_state) |
| `life_path_sessions` | Career NS ratings |
| `founder_dna_results` | Play Profile results |

---

## WHAT'S BUILT vs WHAT'S MISSING

| Component | Status |
|-----------|--------|
| Dome viz + rate picker | Built |
| Dome onboarding (58 nodes) | Built |
| Dome Supabase persistence | Built |
| PlaySkill identification | Live |
| Dome → skill inference data | Built |
| O*NET bridge + role fingerprints | Built |
| Product type mapping | Built |
| Money model flows | Live |
| Business accelerator (Stages 1-7) | Live |
| Quest board + courage challenges | Live |
| Creator DNA profiles (33) | Live |
| Problem ←→ Desire poles | Documented |
| Persona ←→ Problem mapping | Documented |
| Problem ←→ Industry mapping | Documented |
| **Multiplication screen (the reveal)** | **NOT BUILT** |
| **Role model matching (creators)** | **NOT BUILT** |
| **Growth edge → quest pipeline** | **NOT BUILT** |
| **Dome → skill inference wiring** | **NOT BUILT** |
| **Problem → Industry → Buyer recommender** | **NOT BUILT** |

---

## THE CLEAN MAP

The whole system reduces to **2 user inputs → everything else derived**:

```
INPUT 1: Rate experiences (dome onboarding)
  → gives: Experience profile
  → infers: Skills (via domeSkillInference)
  → suggests: Product Types (via productTypeMapping)

INPUT 2: Pick your problem ("which keeps you up at night?")
  → gives: Problem / Desire pole
  → implies: Persona segments you'd serve
  → maps to: Industries where solutions live
```

Two inputs. Everything else is multiplication:

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

### The User Story

A corporate worker in midlife crisis:
1. Rates 58 experiences → discovers Movement + Healing + Bonds light them up
2. Picks "work_hollows" as their problem → desire pole: Meaningful Work
3. System multiplies: their dome × skills × problem → career matches with earnings
4. "You love breathwork (dome) + you're a natural coach (skill) + you care about hollow work (problem) = burnout recovery coach. Average: $85-150/hr. Top earners: $250K/yr."
5. Growth edge nodes → first courage challenge: "Facilitate a breathwork session for 3 friends"

---

## HONEST GAPS

1. Quest activity does NOT auto-fill dome ratings (listed in diagram but not built)
2. Role matching only uses dome axis, not skill axis yet
3. Product type recommender exists as data but no component reads it
4. Feedback loops are aspirational — completion doesn't auto-update dome
5. Problem taxonomy designed for self-knowledge, not market segmentation — works for purpose-driven careers but misses purely commercial motivations (covered by desire poles)
6. 33 creator profiles only validate wellness industry — other industries validated by general knowledge + NAICS cross-reference + company spot-checks
