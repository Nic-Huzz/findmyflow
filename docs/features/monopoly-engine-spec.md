# Monopoly Engine: Collect → Connect → Your Flow

*Spec: July 2026. Status: Design exploration, not yet built.*

## The Big Idea

Your monopoly isn't one skill. It's the collision of multiple curiosities into an intersection nobody else occupies. The Monopoly Engine helps users discover that intersection by tracking what lights them up, connecting the patterns, and revealing the path only they can walk.

Naval: "Specific knowledge is found by pursuing genuine curiosity, not by grinding."

Polymath University thesis (Original IP: Huzz Hurrell): Most Phase 3 creators had 2-4 genuine curiosities that merged. The monopoly emerges at the merge point.

---

## The Pipeline

### COLLECT — Feed your branches. Watch what lights you up.

**What the user does**: Enters books, podcasts, courses, videos in the Curiosity Map. Completes L0 education tasks on quests.

**What the system captures**:
- Content items → AI classifies into clusters → each cluster maps to 1 of 10 branches
- L0 curiosity signal: "Lit me up / Was okay / Bored" per content item
- Branch profile builds over time (which branches keep lighting up)

**10 Branches** (from Rule Break Tree):
movement, nourishment, tools, status, bonds, shelter, story, fire, healing, threat

**Upgrade from current**: After classification, show the user which branches lit up: "That book lit up your Story and Healing branches." Over time: "You keep coming back to Story, Healing, and Movement. That's your pattern."

### CONNECT — See how your curiosities intersect. Notice the pattern.

**What the user does**: Career Alignment check, courage challenges, cross-pollination tagging.

**What the system captures**:
- Career Alignment: "Does your job feed these clusters?" (Y/N per cluster)
- Cross-pollination: courage challenges that feed multiple quests
- L2 identity fit sliders: "I'm getting good at this" + "This feels like me"

**The gap chart**:
```
YOUR BRANCHES          YOUR JOB FEEDS
Story    █████████     ░░░░░░░░░   0%
Healing  ████████░     ███░░░░░░   30%
Movement ███████░░     ░░░░░░░░░   0%
Tools    ██░░░░░░░     █████████   100%
```
"Your curiosities live in Story, Healing, and Movement. Your income comes from Tools. That's the gap."

### MONOPOLY — Name the path only you can walk.

**What the system does**: Once 3+ clusters across 2+ branches exist, runs monopoly analysis.

**Three layers**:

1. **Branch combination lookup**: Check 91-creator dataset. How many creators share this exact branch intersection?

2. **Uniqueness statement** (not a percentage):
   - 50+ creators share your combo = "Crowded intersection. You'll need a strong rule break."
   - 10-50 = "Emerging space. A few pioneers, room for you."
   - 3-10 = "Rare intersection. Very few people are doing this."
   - 0-2 = "Monopoly territory. Almost nobody on earth has this combination."

3. **AI monopoly statement**: "Due to your clusters in [X], [Y], and [Z], we think your monopoly is: [synthesis]. We found [N] creators in this space. [Context about those creators]. [What makes user's version unique]."

**Life path recommendations based on monopolies**:
> "Due to your clusters in Movement, Story, and Healing, we think these paths play to your monopoly:
> 1. Movement storyteller — Intersection rarity: 3 creators worldwide.
> 2. Embodied narrative facilitator — Intersection rarity: 1 creator worldwide.
> 3. Courage experience designer — Intersection rarity: 0 creators found. This could be yours.
>
> These aren't job titles. They're descriptions of paths only you can walk."

Recommendations consider:
- Branch intersection rarity (which combos are rare in the dataset)
- User's depth levels (L0-L4 per cluster: where they're already advanced)
- Creator dataset viability proof (similar intersections that worked)
- Gate factors per branch (e.g., Movement needs Body Involvement 4+)

---

## Content Uniqueness Analysis

When users enter books/podcasts/courses, the classify-curiosities edge function already researches each item. Add a monopoly layer:

1. Which branches did this content touch? (already happens)
2. Does this content connect two branches that rarely connect? (new)
3. How does this shift the user's branch profile? (new)

User sees: "This book lit up your Story branch. Combined with your existing Healing and Movement clusters, your intersection just got rarer. Only 4 creators in our dataset share this combination."

---

## Branch Concentration Data (91-Creator Dataset)

| Branch | Creators | Saturation |
|--------|:--------:|------------|
| Healing | 30 (33%) | Crowded |
| Movement | 21 (23%) | Crowded |
| Bonds | 10 (11%) | Underserved |
| Story | 8 (9%) | Underserved |
| Status | 3 (3%) | Wide open |
| Tools | 3 (3%) | Wide open |
| Nourishment | 1 (1%) | Empty |
| Shelter | 1 (1%) | Empty |
| Fire | 1 (1%) | Empty |
| Threat | 0 (0%) | Nobody |

User with Healing + Movement = crowded. User with Movement + Tools + Threat = virtually no competition.

---

## How This Feeds the Interior Scoreboard (Process / Play / Purpose)

| Metric | What the Monopoly Engine feeds |
|---|---|
| **Purpose** | The monopoly IS Purpose found. Convergence (paths merging) → Monopoly (unique combination) → Alignment (life matches it). The monopoly statement = Purpose crystallized. |
| **Play** | "0 creators found in this intersection" = permission to play. Rare combos require more courage (less social proof) but the monopoly score validates the leap. Also: the Zone of Excellence trap (high skill + low identity fit) is detectable per quest. |
| **Process** | Indirectly — knowing your monopoly reduces drain from misaligned work, improving the Vibe Rise equation. |

The Monopoly Engine is the DESTINATION the Purpose metric tracks toward.

---

## Monopoly Detection: The Combination IS the Genius

No single wheel detects a monopoly alone. "Storytelling" is generic. "Voice_taken" is generic. "Burnt-out professionals" is generic. But "storytelling x voice_taken x burnt-out professionals" = 1 of 1,440 possible positions. With 292 reference profiles, most positions are empty. That IS monopoly detection.

**The four detection dimensions:**

| Dimension | What it measures | Where it lives | Combinatorial space | Status |
|---|---|---|---|---|
| Skills | What you CAN DO (10 role-skills) | Life Map → `nikigai_clusters` (cluster_type: 'skills') | 10 | ✅ Built |
| Problems | The WOUND that drives you (12 felt categories) | Life Map → `nikigai_clusters` (cluster_type: 'problems') | 12 | ✅ Built |
| Personas | WHO you SERVE (12 types) | Life Map → `nikigai_clusters` (cluster_type: 'persona') | 12 | ✅ Built |
| Branches | What TERRITORY you're in (10 primal) | Curiosity Map → `curiosity_clusters` | 10 | ✅ Built |

**Combinatorial space: 10 x 12 x 12 = 1,440 positions.** With 292 reference profiles, most intersections are empty.

**Why each wheel matters in the combination:**
- **Skills** (the vehicle): How you operate in the world. Broad alone, specific when multiplied.
- **Problems** (the fuel): The wound that drives you. Strongest self-identification wheel — wounds are not ambiguous. You KNOW when your voice was taken. (MasterMind assessment: strongest taxonomy)
- **Personas** (the destination): Who you SERVE, not who you are. Derived from behavioral evidence — who do they consistently help, create for, and light up around?
- **Branches** (the territory): Market landscape. Where white space exists. Useful for strategic orientation, not individual detection.

**Note on data source:** Life Map (`/life-map`) is the primary flow capturing skills, problems, and personas. It saves AI-generated freeform cluster names to `nikigai_clusters` (e.g., "Creative Experience Designer" not "storytelling"). For monopoly comparison, a taxonomy-mapping step is needed to translate freeform clusters back to the wheel segments. This can run as a post-processing step after Life Map completion.

**Branch classification improvements needed:**
- Add confidence scores to branch assignment (currently forced single-choice)
- Return top 3 alternative branches with scores per cluster
- Sub-branch taxonomy (Movement has 6 sub-branches documented; generalize to all 10)

---

## The Monopoly Spectrum (Zone of Excellence → Zone of Genius → Monopoly)

Monopoly = What you love + You identify with + Rare combination. This maps directly to the existing L2 Belief sliders ("I'm getting good at this" x "This feels like me") plus rarity from the comparison dataset.

```
ZONE OF             ZONE OF              ZONE OF           MONOPOLY
COMPETENCE          EXCELLENCE           GENIUS
────●───────────────────────────────────────────────────────────────

"I can do this"     "I'm great at this   "I'm great AND     "I'm great AND
                     but it doesn't       it lights me up"    it lights me up
                     feel like me"                            AND almost nobody
                                                              else has this
                                                              combination"
```

| Zone | Skill slider | Identity fit slider | Curiosity signal | Rarity |
|---|---|---|---|---|
| Competence | 2-3 | 1-2 | "Was okay" | Irrelevant |
| **Excellence (trap)** | **4-5** | **1-2** | **"Was okay" / "Bored"** | **Irrelevant** |
| Genius | 4-5 | 4-5 | "Lit me up" | Common or rare |
| Monopoly | 4-5 | 4-5 | "Lit me up" | Rare |

### Zone of Excellence Trap Detection

Most people's current income comes from their Zone of Excellence. Their monopoly lives in their Zone of Genius. The Alignment spectrum IS the gap between these two zones closing.

Detectable with existing L2 data: High skill confidence + low identity fit = Zone of Excellence.

**Per-quest diagnosis example:**

```
Quest: "Marketing Consultant"
  Skill confidence:    ████████░░  4/5
  Identity fit:        ██░░░░░░░░  1/5
  Curiosity signal:    3 items, 0 "lit me up"
  ⚠️ Zone of Excellence — You're skilled here but it doesn't
     light you up. This might be your cage, not your calling.

Quest: "Dance Facilitator"
  Skill confidence:    ████░░░░░░  2/5
  Identity fit:        █████████░  5/5
  Curiosity signal:    8 items, 7 "lit me up"
  ✦ Zone of Genius — This lights you up. Skill will follow.
```

**Alignment spectrum reframed:**

```
Zone of Excellence income ████████████░░░░░░░ Zone of Genius income
(skilled but hollow)                          (skilled and alive)
                              ●
              "34% of your income comes from your genius"
```

---

## Behavioral Scoring (MasterMind Council Synthesis)

Detection should be based on BEHAVIORAL EVIDENCE, not self-report or AI classification alone. The body's response to curiosity is the truest signal. (Source: Gay Hendricks Zone of Genius methodology + MasterMind Council assessment, July 2026)

### Per-Dimension Behavioral Indicators

**Skills — Indicator: Recurrence across contexts**

How many life periods does this skill appear in? If storytelling shows up in 1 of 5 Life Map periods = 20%. If it shows up in 4 of 5 = 80%. A skill that recurs across contexts despite different jobs, different cities, different life stages is likely a genuine gift, not a trained competence.

```
SKILL SCORE (e.g., Storytelling: 78%)
  Life period recurrence:       4/5 periods = 80%
  Curiosity "lit me up" signal: 6/8 items = 75%
  Courage challenges using it:  3/5 = 60%
  Identity fit slider (L2):     4/5 = 80%
  Weighted average:             78%
```

**Problems — Indicator: Emotional charge + return rate**

Wounds carry charge. A high-scoring problem is one the user selected, wrote deeply about, returned to in healing flows, and showed NS state shifts around.

```
PROBLEM SCORE (e.g., Voice Taken: 85%)
  Self-selected in Life Map:    Yes = 100%
  Word count depth:             Top quartile = 90%
  Returned in healing flow:     Yes = 100%
  NS state shift:               Activated = 70%
  Weighted average:             85%
```

**Personas — Indicator: Who they actually help**

Derived from behavior, not self-description. Who appears in their Life Map as people they helped? What types show up in courage challenges? Who do they create content for?

```
PERSONA SCORE (e.g., Burnt-out Professionals: 62%)
  Mentioned in Life Map:        2/5 periods = 40%
  Courage challenges serve them: 2/5 = 40%
  Content/career aligned:       Yes = 100%
  Weighted average:             62%
```

### The Monopoly Fingerprint

Top scores across all three dimensions = the monopoly fingerprint:

```
YOUR MONOPOLY FINGERPRINT

  Top skill:   Storytelling        78%  ████████░░
  Top problem: Voice Taken         85%  █████████░
  Top persona: Burnt-out Profs     62%  ██████░░░░

  Combination rarity: 4 of 292 share storytelling + voice_taken.
  None also target burnt-out professionals.
  That gap is yours.
```

AI synthesis: "You use storytelling (78% behavioral evidence) to help people whose voice was taken (85%) — specifically burnt-out professionals (62%, growing). This combination exists nowhere in our dataset. That's your monopoly."

### Cold Start Handling

Behavioral scoring needs data volume. Minimum viable dataset before showing any monopoly score:
- At least 5 curiosity items entered
- Life Map completed (skills + problems + personas across 5 periods)
- At least 3 courage challenges completed

Before minimum: "Your monopoly fingerprint is forming. Keep exploring." Show partial data (which dimensions are filling in) without scoring.

### Zone of Excellence Warning

When the system detects high skill score + low identity fit on any quest, flag it:

"You're skilled at [X] but it doesn't light you up. This is your Zone of Excellence, not your Zone of Genius. Most people's income comes from here. Your monopoly lives somewhere else."

This warning may be MORE valuable than the monopoly score itself, because it names the trap most users are stuck in.

---

## The Spine: Collect → Connect → Your Flow

This isn't just a feature pipeline. It's the **narrative spine of the entire app**. Every feature, every tab, every exercise maps to one of three phases. The hero's journey IS the Collect → Connect → Your Flow pipeline.

### Hero Journey Mapping

```
COLLECT (Stages 2-4) — "The Crack / The Flood begins"
├─ Stage 2: The Earthquake — The old life breaks. You arrive.
├─ Stage 3: Head Full of Dreams — Life paths emerge. Curiosities flood in.
│           You know yourself better than ever. And you still can't move.
└─ Stage 4: Essence Avatar — Mirror names your essence. Mentor appears.

CONNECT (Stages 5-8) — "The Flood / Testing"
├─ Stage 5: First Vibe Rise — First courage challenge that feels ALIVE.
├─ Stage 6: The Daily Loop — Training montage. Repetition makes
│           patterns visible.
├─ Stage 7: Protective Voice Found — "These surface patterns all trace
│           to ONE root belief."
└─ Stage 8: Deep Reconsolidation — Body metabolizes the wound.

YOUR FLOW (Stages 9-12) — "The Diagonal"
├─ Stage 9: Flow Statement — Curiosities merge. User names their
│           unique combination. FIRST TIME ON THE DIAGONAL.
├─ Stage 10: Aligned Action — Flow applied to career. Path chosen.
├─ Stage 11: Structural Commitment — Life restructures. Bridge burned.
└─ Stage 12: Your First Graduate — Someone transforms because of you.
```

### Book Mapping

| Book Part | Pipeline Phase | What happens |
|---|---|---|
| The Crack (Part 1) | Early COLLECT | The constructed life breaks |
| The Flood (Part 2) | Late COLLECT → CONNECT | Self-knowledge pours in. Still can't move. Then testing begins. |
| The Diagonal (Part 3) | YOUR FLOW | Action catches up. Proportional movement from what you now know. |

### Zone Calibration Mapping

| Zone | Pipeline Phase |
|---|---|
| Misguided Zone (high action, low self-knowledge) | Pre-app: The Matrix |
| The Crack (falling off the graph) | Stage 2: entering COLLECT |
| Paralysis Zone (high knowledge, low action) | Stages 3-4: COLLECT |
| Repair Phase (building both axes) | Stages 5-8: CONNECT |
| **First time ON the diagonal** | **Stage 9: YOUR FLOW begins** |
| Sustaining the diagonal | Stages 10-12: living the monopoly |

---

## Unified Metric Hierarchy

Three layers. Phase KPIs → Sub-components → Interior Metrics. Each feeds up.

```
INTERIOR SCOREBOARD (what users see)
│
├── PROCESS (Depleting → Sustaining)
│   └── Capacity Score = (Practices + Wahoos + Healing) ÷ Drains
│       Phase KPIs:
│         CONNECT:  Practice consistency, daily NS state
│         ALL:      Streak, deposits vs drains ratio
│
├── PLAY (Performing → Playing)
│   ├── Courage = expansion ratio
│   │   Phase KPIs:
│   │     CONNECT:  after_state/wahoo_classification from wahoos
│   │
│   └── Belief = skill confidence × identity fit gap
│       Phase KPIs:
│         CONNECT:  L2 sliders (NOT BUILT), healing depth,
│                   protective voices, weekly review Q4+Q8
│
└── PURPOSE (Lost → Found)
    ├── Convergence = paths merging
    │   Phase KPIs:
    │     COLLECT:  Branch diversity, curiosity volume, "lit me up" ratio,
    │               skills/problems/personas identified, self-knowledge completeness
    │     CONNECT:  Cross-pollination density
    │     YOUR FLOW: Flow Statement completeness
    │
    ├── Monopoly = combination rarity (skills × problems × personas vs 299 dataset)
    │   Phase KPIs:
    │     COLLECT:  Taxonomy dimensions mapped (from Life Map)
    │     YOUR FLOW: Remarkability Score (U×S×S), Scale Score
    │
    └── Alignment = life matches path
        Phase KPIs:
          COLLECT:  Career Alignment score (first signal)
          YOUR FLOW: L3 income %, impact (L4), CRM activity
```

### Phase KPIs by Phase

#### COLLECT KPIs → feed PURPOSE (convergence + monopoly forming)

| KPI | What it measures | Fed by | Feeds |
|---|---|---|---|
| Self-knowledge completeness | Discovery exercises completed | Completion flags per flow | Purpose → Convergence |
| Branch diversity | How many of 10 branches lit up | `curiosity_clusters` branch count | Purpose → Convergence |
| Curiosity volume + signal | Items entered + "lit me up" ratio | `curiosity_inputs` + L0 prompt | Purpose → Convergence |
| Skills/Problems/Personas identified | Monopoly dimensions named | `nikigai_clusters` from Life Map | Purpose → Monopoly |
| Career Alignment score | % of current job feeding curiosities | `career_alignments` | Purpose → Alignment (first signal) |

#### CONNECT KPIs → feed PLAY (primary) + PROCESS (critical) + PURPOSE (growing)

| KPI | What it measures | Fed by | Feeds |
|---|---|---|---|
| Courage ratio | % expansive vs contracting outcomes | `quest_completions.reflection_text` → after_state | Play → Courage |
| Belief gap | Distance between "getting good" and "feels like me" | L2 sliders (NOT BUILT) | Play → Belief |
| Healing depth | Intentions resolved / created | `healing_intentions` completion rate | Play → Belief |
| Protective voices surfaced | Unique voices identified 3+ times | `healing_intentions.protective_voice` | Play → Belief |
| Practice consistency | Streak + deposits vs drains | `nervous_system_checkins` + Tune tab | Process → Capacity |
| Cross-pollination density | Quests feeding each other | `quest_cross_pollination` links | Purpose → Convergence |

#### YOUR FLOW KPIs → feed PURPOSE (primary — alignment + convergence crystallizing)

| KPI | What it measures | Fed by | Feeds |
|---|---|---|---|
| Flow Statement completeness | Slots filled (Gift + Cause + Tribe + Vehicle) | Not yet built | Purpose → Convergence |
| Alignment % | Income from aligned path / total | L3 submissions (NOT BUILT) | Purpose → Alignment |
| Monopoly Score | Combination rarity vs 299 dataset | Taxonomy comparison | Purpose → Monopoly |
| Scale Score | Phase classification (RETURN/BREAK/TRIBAL) | `scale_diagnostics` | Purpose → Convergence |
| Remarkability Score | Uniqueness × Shareability × Simplicity | `remarkable_angles` | Purpose → Monopoly |
| Impact | People reached/helped at L4 | L4 submissions | Purpose → Alignment |

---

## Feature-to-Phase Mapping

### COLLECT Features (Self-knowledge building, Stages 2-4)

| Feature | Route | Primary Metric |
|---|---|---|
| Essence Mirror | `/essence-mirror` | Purpose (convergence) |
| Curiosity Map | `/curiosity-map` | Purpose (convergence) |
| Career Alignment | `/career-alignment` | Purpose (alignment) |
| Life Map | `/life-map` | Purpose (convergence) |
| Play Skills Identifier | `/play-skills-identifier` (Creator portal only) | Purpose (convergence) |
| Zone Assessments L1-4 | `/zone-diagnosis/1-4` | Purpose (convergence) |
| Play Profile (quiz) | `/play-profile` | Purpose (convergence) |
| Life Paths (initial) | `/life-paths` | Purpose (convergence + alignment) |
| Experience Creator Matching | `/experience-creators` | Purpose (convergence) |
| Career Clarity Quiz | `/career-clarity` | Purpose (convergence) |
| Library of Answers | `/library` | Purpose (convergence) |
| Archetypes (Essence) | `/archetypes/essence` | Purpose (convergence) |
| /me Page | `/me` | Purpose (convergence) |

### CONNECT Features (Testing, practising, pattern-finding, Stages 5-8)

| Feature | Route | Primary Metric |
|---|---|---|
| Quest Board + Tasks | Quests tab | Purpose (alignment) |
| Courage Challenges | Courage tab | Play (courage) |
| Wahoo Creator | Courage tab | Play (courage) |
| Wahoo Map (Groan Matrix) | Stage 0.5 | Play (courage) |
| Healing Flows (per-task) | HealingFlowModal | Play (belief) |
| Healing Intentions | Healing tab | Play (belief) |
| Healing Compass | `/healing-compass` | Play (belief) |
| Nervous System Flow | `/nervous-system` | Play (courage) |
| Tune Tab | Tune tab | Process |
| Daily Check-in | Page load overlay | Process |
| Weekly Review | Sunday/Monday | Play (belief) + Purpose (convergence) |
| Flow Compass | `/flow-compass` | Process |
| Zone Assessments L5-8 | `/zone-diagnosis/5-8` | Play (courage + belief) |
| Fantasy League | `/league` | Play (courage) + Process |
| Zarlo | Floating widget | Play (belief) |
| Figurine | Bottom-left FAB | Play (belief) |
| Play Profile (unstuck/rate) | `/play-profile?mode=*` | Play (courage) |
| Community Feed + Tasks | `/community` | Play (courage) |
| Archetypes (Protective) | `/archetypes/protective` | Play (belief) |
| People Matching | `/people` | Purpose (convergence) |

### YOUR FLOW Features (Purpose primary, Stages 9-12)

| Feature | Route | Primary Metric |
|---|---|---|
| Remarkable Results | `/create/remarkable` | Purpose (convergence) |
| Remarkable Reach | `/create/narrative-builder` | Purpose (convergence) |
| Remarkable Growth | `/create/access-architecture` | Purpose (alignment) |
| Scale Score | `/create/scale-diagnostic` | Purpose (convergence) |
| Positioning Summary | Creator home | Purpose (convergence) |
| Scope Map Diagnostic | `/create` | Purpose (convergence) |
| CRM: Attract | `/crm/attract` | Purpose (alignment) |
| CRM: Nurture | `/crm/nurture` | Purpose (alignment) |
| CRM: Tools | `/crm/tools` | Purpose (alignment) |
| Money Model Flows (6) | Various | Purpose (alignment) |
| Funnel Calculator | `/funnel-calculator` | Purpose (alignment) |
| Experience Design Tools | `/create/experience/*` | Purpose (alignment) |
| Facilitate Life Paths | `/facilitate/life-paths` | Purpose (alignment) |
| Shift Scorecard | `/shift-scorecard` | Purpose (alignment) |
| Flow Statement (not built) | TBD | Purpose (convergence complete) |
| Monopoly Statement (not built) | TBD | Purpose (monopoly + convergence) |

---

## What's Already Built

- ✅ Curiosity Map (enter content, AI classifies into clusters + branches)
- ✅ Career Alignment (per-cluster job-feed check)
- ✅ Life Paths (AI suggests careers from curiosity + skills data)
- ✅ Cross-pollination (courage challenges linking quests)
- ✅ Quest depth tracking (L0-L4)
- ✅ 91-creator dataset with branch mapping
- ✅ 292-person careerModels dataset (71 founders + 221 non-founders)
- ✅ Wheel taxonomy (10 skills, 12 problems, 12 personas) in wheelTaxonomy.js
- ✅ Life Map captures skills/problems/personas (freeform AI clusters → nikigai_clusters)
- ⚠️ Life Map freeform clusters don't map to wheel taxonomy IDs (needs post-processing step)
- ⚠️ capacity_level on curiosity_clusters (field exists, hardcoded to 0)
- ⚠️ Branch classification forced single-choice (needs confidence + alternatives)
- ❌ Multi-dimensional monopoly detection (branch + skill + problem + persona)
- ❌ Monopoly statement generation
- ❌ Life path recommendations from monopoly analysis
- ❌ Content uniqueness feedback ("this book made your combo rarer")
- ❌ "Your Flow" naming ceremony (Flow Statement)
- ❌ Branch gap chart (curiosities vs income)
- ❌ Method/modality dimension
- ❌ L0-L4 per-task data-rich submissions
- ❌ Interior scoreboard UI

---

## Related Docs

- `docs/features/interior-scoreboard-spec.md` — Interior metrics that feed from this engine
- `docs/features/measurement-framework-exploration.md` — L0-L4 depth scale, hero stages
- `docs/frameworks/find-my-flow-x-category-pirates.md` — Category design methodology
- Obsidian: `Frameworks/Polymath University.md` — Core thesis
- Obsidian: `Frameworks/Rule Break Tree.md` — 10 branches, evolutionary tree
- Obsidian: `Frameworks/Collect Connect Your Flow.md` — Spine framework (this doc's vault counterpart)
- `public/data/experienceCreatorDNA.json` — 91-creator dataset
