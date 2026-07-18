# Personal Monopoly Finder — Implementation Doc

*Branch + frontier layer on top of the Monopoly Engine (`docs/features/monopoly-engine-spec.md`). Adds branch identification, market frontier positioning, and gap insight to the existing rarity-based monopoly detection.*

**Foundation:** The Monopoly Engine handles skills × problems × personas = 1,440-position rarity detection vs 299 reference profiles. This doc adds the BRANCH dimension: which of the 10 primal industries you're in, what the frontier looks like, and where the gap is.

**Relationship to Interior Scoreboard** (`docs/features/interior-scoreboard-spec.md`):
- Clarity (X-axis) feeds monopoly confidence via resonance ratings
- Monopoly Score lives under PURPOSE in the metric hierarchy
- Branches = strategic orientation (market landscape), not individual detection

---

## Core Insight From Test Run

Tested with huzz@nichuzz.com. Key learnings:

1. **Branch mapping works best from MULTIPLE data sources converging**, not a single self-report question. Huzz self-tagged as "movement" in remarkable_angles but the data overwhelmingly says "healing" (12+ signals vs 4).

2. **The monopoly is the INTERSECTION of branches, not a single cell.** Huzz sits at Healing × Bonds. That intersection has almost nobody. The tool should show intersections, not just positions.

3. **The gap insight (vehicle vs territory) is the most valuable finding.** Curiosity says Story, quests say Healing. Story is the vehicle, Healing is the territory. Most users can't see this about themselves without the cross-reference.

---

## Data Sources (What Already Exists)

### 1. Curiosity Map → Branch Identification (strongest signal)

**Table:** `curiosity_clusters`
**Key columns:** `branch` (direct 10-branch mapping), `cluster_name`, `why`, `titles`, `input_count`

This is the PRIMARY branch signal. The curiosity map already classifies clusters into the 10 primal branches. A user with 3 clusters in "healing" and 1 in "story" is primarily Healing with Story secondary.

**Mapping logic:**
```
primary_branch = branch with highest cluster count
secondary_branch = branch with second-highest cluster count
branch_spread = number of unique branches with clusters
```

`branch_spread` is itself a signal: a user with clusters in 5+ branches is naturally a polymath/Yellow thinker (cross-domain pattern recognition).

**Confidence level:** HIGH. The branch field is already mapped by AI during cluster generation.

### 2. Life Paths → Branch (action signal)

**Table:** `life_path_sessions` (keyed by `client_email`, not `user_id`; linked to quests via `quests.career_id`)
**Key columns:** `careers` (JSONB array with labels and predicted states), `current_career`, `stuck_points`

Life paths show what the user is DOING, not just what they're curious about. Career labels can be mapped to branches:

| Career label pattern | Branch |
|---------------------|--------|
| Coach, therapist, healer, breathwork | Healing |
| Teacher, speaker, writer, content | Story |
| Developer, engineer, builder, coder | Tools |
| Event host, facilitator, community | Bonds |
| Athlete, fitness, movement, dance | Movement |
| Designer, brand, stylist, creative | Status |
| Chef, nutrition, farming, food | Nourishment |
| Architect, property, interior | Shelter |
| Energy, sustainability, climate | Fire |
| Security, police, military, safety | Threat |

The `predicted_state` on each career is also useful: careers predicted at "vibe" suggest the user feels most alive there (primary branch signal).

**Stuck points** reveal which branches are BLOCKED — these map to the matrix frontier (the assumption they haven't broken yet).

**Confidence level:** MEDIUM-HIGH. Career labels need keyword matching which is fuzzy. But vibe-state careers are strong signals.

### 3. Courage Challenges → Branch reinforcement (expression signal)

**Table:** `groan_challenges` + `quest_tasks` + `healing_intentions`
**Key columns:** `source_label` (quest), `status`, `protective_voice`

Courage challenges reinforce branch identification. Each challenge is linked to a quest (life path). The quest label maps to branches via keyword matching. More challenges on Healing-tagged quests = stronger Healing signal.

**Depth level** (`quests.depth_level`) tracks skill progression (education → testing → practising → charging → teaching). Useful for understanding how far along someone is in a branch, but not for developmental level assessment (see Appendix).

**Protective voices** reveal which patterns block progress:
- Controller = trying to optimise/control everything
- Perfectionist = rigid standards, fear of failure
- People Pleaser = seeking approval, avoiding conflict
- Ghost = shutdown, withdrawal, avoid all risk
- Auto-pilot = following the script, not questioning

**Confidence level:** MEDIUM for branch mapping (depends on quest labels). HIGH for protective voice patterns.

### 4. Nikigai Clusters → Life Story Signal

**Table:** `nikigai_clusters` (from Life Map flow)
**Key columns:** `cluster_type` (skills/problems/persona), `cluster_label`, `items`, `is_favourite`, `insight`

The Life Map clusters tell the full story: what someone was good at (skills), what hurt them (problems), and who inspired them (personas). These converge on branches.

**Problem categories already map to branches:**
| Problem categoryId | Primary Branch |
|-------------------|---------------|
| voice_taken | Healing + Bonds |
| pain_not_believed | Healing |
| kids_deserved_better | Healing + Bonds |
| work_hollows | Movement + Healing |
| forgot_what_for | Story + Healing |
| life_not_yours | Status + Movement |
| feeling_stupid | Tools + Status |
| locked_out | Bonds + Shelter |
| stopped_wondering | Tools + Story |
| work_treated_nothing | Status |
| left_behind | Bonds |
| world_losing | Fire + Threat |

**`is_favourite` clusters are the strongest signal.** When a user marks a problem as their favourite, that's their primary wound and likely their primary branch.

**Confidence level:** HIGH for favourited items, MEDIUM for non-favourited.

### 5. Essence Chamber → Branch + Lifecycle (deepest signal)

**Stored in:** `flow_sessions.response_data.essence_chamber` (Life Map completion)
**Key structure:** `pillars[]` with name, status (ACTIVE/FLICKERING/EMPTY), orbs (per life period), wounds

Essence chamber pillars CORRESPOND to branches but use freeform AI-generated names (e.g., "Expression," "Connection"). A mapping step is needed to translate pillar names to the 10 matrix branches. Each pillar's status tells you:
- ACTIVE = this branch is alive and expressing
- FLICKERING = this branch wants to emerge but is blocked
- EMPTY = this branch hasn't been activated yet

The `gap` field identifies the branch that's underdeveloped — this is where the person's growth edge is, and potentially where their monopoly lies (filling your OWN gap often means filling a market gap).

**Confidence level:** HIGH. This is the deepest, most processed data the app produces.

### 6. Remarkable Angles → Rule Break + Branch (if completed)

**Table:** `remarkable_angles`
**Key columns:** `wound_problem`, `assumption`, `different`, `experience`, `branch`, `score_ancestral`, `score_body`

Direct branch assignment and rule break description. BUT the test run showed the self-tagged branch can be wrong (Huzz tagged "movement" when data says "healing"). Use as a supporting signal, not primary.

**Confidence level:** MEDIUM for branch (self-reported). HIGH for the rule break content itself.

### 7. Scale Score → Phase 3 Readiness (if completed)

**Table:** `scale_diagnostics`
**Key columns:** `total_score`, `phase_classification`, `branch`, scores per factor

Direct Phase 3 readiness assessment. If the user has completed this, it's a strong signal for their branch and maturity level.

**Confidence level:** HIGH (the diagnostic is well-calibrated).

---

## The Algorithm

### Phase 1: Branch Identification

**Weighted branch scoring:**

```
branch_score[branch] = 
  (curiosity_cluster_count × 3)           // strongest: what you're drawn to
  + (life_path_vibe_careers × 2.5)         // strong: what makes you feel alive
  + (essence_pillar_active × 2)            // strong: what's already expressing
  + (favourite_problem_clusters × 2)       // strong: what you care most about
  + (courage_challenge_count × 1.5)        // moderate: what you're acting on
  + (essence_pillar_flickering × 1)        // moderate: what wants to emerge
  + (remarkable_angles_branch × 1)         // supporting: self-reported
  + (non_favourite_problem_clusters × 0.5) // weak: what you noticed but didn't prioritise
```

**Output:**
- `primary_branch` = highest score
- `secondary_branch` = second highest
- `tertiary_branch` = third highest (if score > 30% of primary)
- `branch_spread` = count of branches with any score > 0

### Phase 2: Frontier Lookup

Look up the frontier card for the user's primary branch from the matrix data:
- What's dominant in this branch? (the assumption everyone accepts)
- What's crowded? (where the reaction is happening)
- What's the gap? (what's missing)

**Note:** Frontier card content pending market research validation. See `docs/research/frontier-market-research-spec.md`. Until validated, the frontier card shows the hypothesis, not verified claims.

### Phase 3: Rarity Check

```
rarity = findCareerMatches(userSkillIds, userProblemIds, 299)
// From wheelAlignment.js — already built
// Returns how many of 299 profiles share the user's skill × problem combination
```

### Phase 4: Personal Monopoly Statement Generation

**Template (rules-based Sprint 1):**

> Your branches: **[Primary]** and **[Secondary]**.
>
> Gap: [curiosity branch] is your vehicle, [quest branch] is your territory.
>
> Rarity: [N] of 299 share your skill × problem combination.
>
> [Frontier card if validated by research]

**AI-enhanced (Sprint 4):**

Feed all the data to Claude/Zarlo and let it generate a personalised monopoly statement that weaves the user's specific life story, curiosities, and courage challenges into the positioning. Much richer output.

---

## Where It Plugs Into Existing Flows

### Data Collection Sequence (user journey)

```
1. /curiosity-map           → curiosity_clusters (branch field)
2. /life-paths              → life_path_sessions (careers, stuck_points)
3. /7-day-challenge          → quests, courage challenges, healing intentions
4. /create/remarkable        → remarkable_angles (rule break)
5. /create/scale-diagnostic  → scale_diagnostics (Phase 3 score)
```

Each step adds MORE data to the monopoly calculation. The finder gets more accurate as the user progresses.

---

## How Existing Flows Feed the Monopoly (Collect → Connect → Your Flow)

### COLLECT Phase: Curiosity Map + Life Map

**Curiosity Map** (`/curiosity-map`) produces `curiosity_clusters` with:
- `branch` field (direct 10-branch mapping, already classified by AI)
- `cluster_name` (thematic label)
- `why` (narrative connecting inputs to theme)
- `titles` (which content items contributed)
- PLANNED: `curiosity_signal` on inputs (lit_me_up / was_okay / bored)

**This feeds:**
- Primary/secondary branch identification (weighted by cluster count)
- "Lit me up" ratio per branch (when curiosity_signal ships) = strongest resonance signal
- Branch spread (polymath indicator, Yellow signal if 4+ branches)

**Life Map** (`/life-map`) produces `nikigai_clusters` + essence chamber:
- Skills clusters (what you love doing)
- Problem clusters (what hurt you) — `is_favourite` = strongest signal
- Persona clusters (who inspires you)
- Essence chamber pillars with ACTIVE/FLICKERING/EMPTY status per branch
- Pillar orbs showing which LIFE PERIODS each branch appeared in

**This feeds:**
- Monopoly Engine's 1,440-position rarity (skills × problems × personas)
- Essence pillar status feeds branch confidence (ACTIVE = high, FLICKERING = emerging)
- Recurrence across life periods = behavioral evidence (Gay Hendricks: "the body's response to curiosity is the truest signal")

**Clarity metric** (Interior Scoreboard): resonance ratings (1-5 per cluster) update as new data arrives. High resonance on a cluster = genuine branch, not just intellectual interest.

### CONNECT Phase: Courage Challenges + Healing

**Courage challenges** (`WahooCreator.jsx`) produce `groan_challenges` + `quest_tasks`:
- Linked to a quest (life path) via `quest_id`
- `depth_level`: education → testing → practising → charging → teaching
- `stacked_layers`: screen, live, money, vulnerable, authority
- `protective_voice` on healing_intentions: controller, perfectionist, people_pleaser, ghost, auto_pilot

**This feeds branch scoring + Zone of Excellence detection:**
- Quest labels map to branches (each challenge reinforces the branch signal)
- Protective voice patterns reveal what's blocking progress
- Courage classification (Vibe Rise / Fun / Pressure / Uninterested) feeds Zone of Excellence detection:
  - Consistent "Vibe Rise" on a quest = Zone of Genius (high skill + high identity fit)
  - Consistent "Pressure" on a quest = Zone of Excellence trap (high skill + low identity fit)

**Quest taxonomy tags** (Interior Scoreboard spec, planned): `skill_tags[]`, `problem_tags[]`, `persona_tags[]` on quests table. When these ship, every courage challenge completion on a tagged quest automatically reinforces the taxonomy dimensions that feed the Monopoly Engine's rarity calculation.

**This is the living signal.** Unlike curiosity map (done once) and life map (done once), courage challenges accumulate continuously. Each challenge = new behavioral data point. The monopoly sharpens with every action taken.

### YOUR FLOW Phase: Remarkable + Scale Score

**Remarkable Flow** produces `remarkable_angles` with rule break statement, branch, remarkability score.
**Scale Score** produces `scale_diagnostics` with Phase 3 classification.

**This feeds:**
- Frontier card validation (is the monopoly at a Phase 3 frontier?)
- Branch confirmation or correction (remarkable_angles has a branch field)
- Rule break content enriches the monopoly statement

### The Progressive Reveal Across Phases

| Phase | Data available | What monopoly shows | Confidence |
|-------|---------------|--------------------| -----------|
| COLLECT start | Curiosity Map clusters | "Your curiosities cluster in [branches]." + branch chart | 60% |
| COLLECT end | + Life Map + resonance | "Skills × Problems × Personas = [rarity]. Gap: [vehicle vs territory]." | 75% |
| CONNECT early | + 5 courage challenges | "You're acting on [branch]. Zone of Genius vs Excellence detectable." | 80% |
| CONNECT deep | + 15 challenges + healing | "Protective patterns visible. Branch scoring sharpened by behavioral data." | 85% |
| YOUR FLOW | + Remarkable + Scale Score | "Full monopoly: [branches] + [rarity] + [frontier if validated]." | 92% |

**Key UX decision:** Show the monopoly at EVERY tier. Label the confidence. Incentivise progression: "Complete the Life Map to sharpen your monopoly from 60% to 75% confidence."

---

## User-Facing Surfaces (What The User Actually Sees)

### Surface 1: Branch Chart (after Curiosity Map)

Shows immediately after curiosity clustering completes. The first time the user sees their data reflected back through the matrix lens.

**Visual:** Horizontal bar chart of branches, sized by cluster count. Primary branch highlighted. One-line insight connecting their top clusters to a pattern.

```
YOUR BRANCHES

██████████  Story (3 clusters)
███░░░░░░░  Healing (1 cluster)

Your curiosities keep landing in Story
and Healing. That's not random.

"The architecture of becoming" +
"The liberation of presence"
= designing transformation experiences
  through narrative and embodiment.
```

**Data needed:** `curiosity_clusters` grouped by `branch`. Already exists. Zero new infrastructure.

### Surface 2: Gap Insight (after Life Paths / active quests exist)

Reveals the vehicle-vs-territory distinction. The algorithm cross-references what lights you up (curiosity branches) with what you're actually pursuing (life path/quest branches).

```
YOUR GAP

Curiosity says:  Story (3 clusters)
Life paths say:  Healing + Bonds (4 active quests)

Story is your vehicle, not your territory.
You USE narrative to deliver healing in community.
That distinction matters for positioning.
```

**Data needed:** `curiosity_clusters.branch` + active `quests` labels mapped to branches via keyword matching. Keyword matching is ~80% reliable; AI classification fallback for ambiguous labels.

**Why this matters:** Huzz's test data showed this exact gap. Curiosity clusters point to Story (3 clusters). But all 4 active quests are Healing + Bonds (Workshop Facilitator, Retreat Designer, Experience Designer). Story is how he delivers, not what he delivers. Most users can't see this about themselves without the cross-reference.

### Surface 3: Frontier Card (after branch identification)

Connects the user's personal branch to the innovation map. Shows what's happening at THEIR frontier.

```
┌─ YOUR FRONTIER ────────────────────────────┐
│                                             │
│ HEALING at Orange → Yellow transition       │
│                                             │
│ Orange (dominant): drugs, data, measurable  │
│ outcomes. One pill fits the diagnosis.      │
│                                             │
│ Green (crowded): "holistic" became a        │
│ marketing word. Integrative but vague.      │
│                                             │
│ Yellow (emerging): contextual routing.      │
│ Match the right modality to the right       │
│ wound depth. Almost nobody here.            │
│                                             │
│ Does this resonate as the assumption        │
│ you want to break?                          │
│                                             │
│ [Yes, that's it]     [I see it differently] │
└─────────────────────────────────────────────┘
```

**Data needed:** Matrix cell data extracted to `public/data/spiralDynamicsMatrix.json` from the current HTML page. One-time extraction, then the React app imports it.

### Surface 4: Rule Break Primer (BEFORE Remarkable Flow)

**This is the key insight from the test run: the matrix should PRIME the rule break, not just validate it after.**

Current Remarkable Flow asks users to identify their assumption and rule break from a blank page. Most struggle. The matrix gives them vocabulary and a framework to react against.

**Flow:**

```
Curiosity Map completed
    ↓
Branch Chart: "Your curiosities cluster in Healing and Story"
    ↓
Frontier Card: "The Healing industry is stuck at Orange.
               The frontier is Yellow: contextual routing."
    ↓
"Does this resonate as the assumption you want to break?"
    ↓
YES → Remarkable Flow opens with Two Worlds PRE-FILLED:
      Old World = Orange assumption text from matrix cell
      New World = Yellow frontier prediction from matrix cell
      User edits/personalises from a foundation, not a blank page

NO →  "What assumption do you see instead?"
      User describes their own rule break
      Positioned AGAINST the matrix as contrast
      (still valuable: tells us they see something the matrix doesn't)
    ↓
Remarkable Flow completes with rule break data
    ↓
Rule break data enriches matrix position
(branch confirmed or corrected, rule break content enriches monopoly statement)
    ↓
Courage challenges sharpen both over time
```

**Why "before" not "after":**
- The user who sees "The Healing industry is stuck at Orange: drugs, data, measurable outcomes" and feels "YES, that's exactly what I'm fighting" has a dramatically easier time in Remarkable Flow
- "Describe what's different about your approach" (current prompt) is hard from scratch. "Here's the dominant assumption. How are you breaking it?" is a reaction, not a creation
- The "No, I see it differently" path is also valuable: it captures rule breaks the matrix doesn't predict, which enriches the framework

**This creates a flywheel, not a sequence:**
- Matrix position primes the rule break discovery
- Rule break data enriches the matrix position
- Courage challenges sharpen both
- Each loop raises confidence and sharpens the monopoly

### Surface 5: Full Monopoly Output (after Remarkable + Scale Score)

The complete picture, shown in Creator Portal.

```
YOUR MONOPOLY

Branches: Healing (primary), Bonds (secondary)
Vehicle:  Story

Rarity: 12 of 299 share your skill × problem combo

Gap: Your curiosities live in Story.
     Your quests live in Healing.
     Story is your vehicle, Healing your territory.

Frontier (if validated by research):
  Dominant: drugs, data, one pill fits all
  Crowded:  "holistic" (marketing word now)
  The gap:  match modality to wound depth

"You use narrative and play to deliver
 healing in physical community.
 12 of 299 reference profiles share your
 combination. Your branch intersection
 (Healing × Bonds) is underserved."

Confidence: 85% ████████░░
Complete Scale Score to reach 92%
```

---

## Test Run Results (huzz@nichuzz.com + hurrellnic@gmail.com merged)

**Data used:** 7 curiosity clusters (Story=3, Healing=2, Status=1, Tools=1), 4 active quests (all Healing+Bonds at vibe state), 3 favourited problem clusters (voice_taken, life_not_yours, "Making Transformation Joyful"), 4 favourited skill clusters, 25 courage challenges (strongest quest at "teaching" depth), 192 NS check-ins across 69 days.

**Branch scores (weighted algorithm):**
| Branch | Score | Rank |
|--------|-------|------|
| Healing | 37.5 | Primary |
| Bonds | 24 | Secondary |
| Movement | 14 | Tertiary |
| Story | 13 | Vehicle (curiosity signal strong, but life paths don't confirm as territory) |
| Tools | 12 | Supporting |
| Status | 9 | Minor |

**Key finding:** Curiosity says Story (3 clusters). Life paths say Healing + Bonds (all 4 active quests). Algorithm correctly identifies the gap: Story is the vehicle, Healing is the territory.

**Rarity:** 12 of 299 profiles share the skill × problem combination (via existing `findCareerMatches()`).

**Confidence:** 78% (would reach 88% with more curiosity inputs + resonance ratings + quest taxonomy tags).

---

## Build Plan (Creator Portal — v3, July 18 2026)

All features target the Creator Portal at `/create` (CreatorHomeV2.jsx). Not the consumer app.

### Sprint 1: CreatorPositionCard (the main build)

**What:** New component `CreatorPositionCard.jsx` that merges BranchInsightCard + PositioningSummary into one unified card. Replaces both on CreatorHomeV2. Leads with the frontier, not the branch chart.

**Two states based on whether `remarkable_angles` exists:**

Pre-Remarkable Flow:
```
┌─────────────────────────────────────────────┐
│  YOUR INDUSTRY FRONTIER              78%    │
│                                             │
│  Dominant: Pharma + clinical therapy        │
│  ($450B+). Diagnosis first, protocol second.│
│  BetterHelp, Calm, Eli Lilly.               │
│                                             │
│  Crowded: "Holistic" has become meaningless.│
│  $222B CAM market. 140K+ coaches. Five      │
│  subgroups, all claiming whole-person.       │
│                                             │
│  The gap: NS-state-informed modality        │
│  sequencing at a consumer price point.      │
│  Nobody bridges state assessment + full      │
│  modality spectrum + sequencing + affordable.│
│                                             │
│  Rarity: 12 of 299 share your combination   │
│                                             │
│  ↔ Curiosity says Story. Quests say Healing.│
│    Story is your vehicle, Healing your      │
│    territory.                               │
│                                             │
│  Is this the assumption you're breaking?    │
└─────────────────────────────────────────────┘
      ↓ BlowUpBrandCard "Find your rule break →"
```

Post-Remarkable Flow:
```
┌─────────────────────────────────────────────┐
│  YOUR POSITION                              │
│                                             │
│  [Frontier: dominant / crowded / gap]       │
│                                             │
│  Your rule break: [from remarkable_angles]  │
│                                             │
│  Rarity: 12 of 299 share your combination   │
│                                             │
│  Positioning: [from lead_flow_profiles or   │
│  AI-generated in Sprint 3]                  │
└─────────────────────────────────────────────┘
```

**Where:** CreatorHomeV2 Identity tab, Playbook sub-tab, ABOVE BlowUpBrandCard. Replaces the current PositioningSummary mount (line 627).

**Data sources:**
- `useBranchScoring` hook (branches, gap, rarity)
- `spiralDynamicsMatrix.json` (frontier card text)
- `remarkableAngle` prop from CreatorHomeV2 (rule break, if exists)
- `lead_flow_profiles` (positioning statement, if exists — currently read by PositioningSummary)

**What to build:**
1. New `CreatorPositionCard.jsx` (NOT modifying BranchInsightCard — keep that for potential consumer use)
2. Frontier-first layout: dominant → crowded → gap → rarity → gap insight
3. Branch chart secondary, collapsible (creators know their industry, chart is supporting evidence)
4. Accept `remarkableAngle` and positioning props from CreatorHomeV2
5. No-data state: "Complete the Curiosity Map to see your industry position"
6. Light theme

**What to remove:** PositioningSummary import + mount in CreatorHomeV2 (replaced by this)

**Effort:** One session. Medium.

### Sprint 2: RemarkableFlow Assumption Pre-fill

**What:** When user enters RemarkableFlow, the assumption textarea is pre-populated with the frontier's dominant assumption text (from spiralDynamicsMatrix.json based on primary branch). User can edit or replace.
**Changes:** RemarkableFlow.jsx reads primary branch from useBranchScoring, looks up frontier cell, pre-fills `assumption` state if empty.
**Effort:** Low (30 min).

### Sprint 3: AI Monopoly Statement (the 100% upgrade)

**What:** Replace the template "Your opportunity" with an AI-generated positioning insight via agent-chat edge function. Feed it EVERYTHING the system knows about the user and generate a mentor-quality insight.

**Prompt inputs:**
- Branches (primary + secondary + vehicle/territory insight)
- Monopoly (top skill + problem + persona + rarity count + closest matches)
- Frontier data (what's crowded, what's missing, the gap — from verified research)
- Rule break (if exists, from remarkable_angles)
- Life quake + transformation (if exists, from lead_flow_profiles)
- Essence archetype
- Life paths / active quests

**Example output (what the AI would generate for Huzz):**
> "You help people who lost their voice to teenage social pressure find it again through facilitated group experiences. In a market where therapy costs $200/session and community platforms are just group chats, you sit at the one intersection nobody occupies: healing communities where belonging IS the medicine, at a price anyone can afford. The model is proven (YPO, CrossFit). The affordable version doesn't exist yet. You're building it."

**Where:** Inside CreatorPositionCard "Your opportunity" section. Replaces the template text. Shows a "Generate" button (like the positioning statement generator already does). Saves to DB for persistence.

**Why this is the 100% upgrade:** Everything we built — research, branches, rarity, frontier data — becomes the PROMPT for an AI that sounds like a mentor who looked at your data and told you exactly what they see. The template version is information. The AI version is insight.

**Effort:** Medium. Prompt engineering + "Generate" button + save to DB. Uses existing agent-chat infrastructure.

### Sprint 4: Branch Feedback + Weight Calibration

**What:** "Is this your primary branch?" link on CreatorPositionCard. User confirms or changes. Saves to DB. Over time, compare algorithm predictions vs user confirmations to calibrate weights.

**UI:** Small link below the branch header: "Bonds × Healing — is this right? Change"
- Click "Change" → dropdown of 10 branches for primary, then secondary
- User override saved to `lead_flow_profiles.branch_override` (new column)
- When override exists, use it instead of algorithmic branch. Show "(confirmed by you)" label.

**Calibration pipeline:**
1. Collect branch confirmations/overrides from users
2. For each user where override differs from algorithm: the weights were wrong for that user's data profile
3. After 20+ data points: adjust weights to minimize override rate
4. Target: <10% of users need to override

**Current weight confidence: 90%.** Principle: action + wounds > curiosity > skills > history. Tested on 1 user (correct output). Feedback mechanism raises to 95%+.

**Effort:** Low. One link + dropdown + one DB column + save logic. Any agent can build.

### Sprint 5: Quest Taxonomy Tagging

**What:** AI maps quest labels to taxonomy segments. Retroactive tag existing quests.
**DB migration:** `skill_tags[]`, `problem_tags[]`, `persona_tags[]` on `quests` table.
**Effect:** Consumer app courage challenges feed Creator Portal branch scoring over time.
**Effort:** Medium.

### Sprint 5: 91-Creator Competitive Map + Scale to 1,000

**What:** Tag creator profiles with branches. Show competitive density. Scale comparison dataset.
**Output:** "3 creators are near your intersection. Here's what makes you different."
**Effort:** Medium-High.

---

## Decisions (July 18 2026)

- Frontier card lives on CreatorHomeV2, above BlowUpBrandCard. Always visible, persistent context.
- Creator Portal is light theme.
- Card adapts after Remarkable Flow: before = priming, after = validation.
- Branch profile MERGES with PositioningSummary into `CreatorPositionCard`. Frontier-first layout.

---

## Confidence Check (< 90%)

**85%: The no-data state.** If a creator signs up for the Portal without completing Curiosity Map, the card shows nothing. But `useBranchScoring` can still compute from nikigai_clusters (Life Map skills/problems) and quest labels. The question is: should we require Curiosity Map or fall back to whatever data exists? My instinct: fall back, show whatever we have, label the confidence. But the frontier card lookup needs a branch, and without curiosity data the branch might be wrong.

**80%: Removing PositioningSummary.** PositioningSummary currently handles its own data fetching (reads `lead_flow_profiles` for the positioning statement, has its own edit/collapse UI, and handles the AI generation call). CreatorPositionCard needs to absorb all of this. I need to read PositioningSummary fully to understand what I'm replacing. Risk: missing edge cases in the positioning statement logic.

**80%: The frontier text length.** The verified frontier cards from research are LONG (dominant + crowded + gap, each with named players and market data). On mobile, this card could dominate the screen. Needs a collapsed/expanded pattern: show the gap as headline, expand for the full frontier with players and numbers.

**90%+: Everything else.** Sprint ordering, data pipeline, hook logic, build approach are all solid.

---

## Unified Pipeline (Current)

```
MONOPOLY ENGINE (existing)               BRANCH LAYER (new)
══════════════════════════                ══════════════════════

┌─────────────┐                          ┌──────────────┐
│ Curiosity   │──branch──────────────────▶│ Branch       │
│ Clusters    │──lit_me_up───────────────▶│ Scoring      │
├─────────────┤                          │ (weighted)   │
│ Life Map    │──skills/problems/pers───▶│              │
│ (nikigai)   │──essence pillars────────▶│ primary_br   │
│             │──resonance (Clarity)────▶│ secondary_br │
├─────────────┤                          └──────┬───────┘
│ Life Paths  │──careers (vibe state)───▶       │
│ (careers)   │──stuck_points───────────▶       │
├─────────────┤                                 │
│ Courage     │──wahoo_classification───▶       │
│ Challenges  │──protective_voice───────▶       │
├─────────────┤                                 ▼
│ Remarkable  │──branch (override)──────▶┌──────────────┐
│ Angles      │                          │ Frontier     │
├─────────────┤                          │ Card Lookup  │
│ Scale Score │──phase_classification───▶│ (pending     │
└─────────────┘                          │  market      │
                                         │  research)   │
RARITY CHECK                             └──────┬───────┘
(10×12×12 = 1,440 positions                     │
 vs 299 reference profiles)                     │
         │                                      │
         ▼                                      ▼
    ┌────────────────────────────────────────────────┐
    │           PERSONAL MONOPOLY OUTPUT             │
    │                                                │
    │  Branches: Healing (primary), Bonds (secondary)│
    │  Gap: "Curiosity says Story, quests say Healing.│
    │        Story is vehicle, Healing is territory." │
    │  Rarity: "12 of 299 share your combination"    │
    │  Frontier: pending market research validation   │
    │  Confidence: 78%                               │
    └────────────────────────────────────────────────┘
```

---

## Vibe Rise App Integration: Courage as Ongoing Signal

Courage challenges are the LIVING data source. Unlike curiosity map (done once) or life paths (done once), courage challenges accumulate over time. Each new challenge is a new data point.

**How courage feeds the monopoly:**

1. **Branch signal**: Each challenge is linked to a quest (life path). Quest labels map to branches. As the user takes more courage challenges in a specific branch, the signal strengthens.

2. **Depth signal**: The depth_level on each quest (education→teaching) shows how far along someone is in a branch. Deeper = stronger branch signal.

3. **Shadow signal**: Protective voices on healing intentions show what's blocking progress. The pattern across multiple challenges reveals the growth edge.

**Monopoly update trigger**: After every 5th courage challenge completion, recalculate branch scores and check if the monopoly position has shifted. Surface a notification: "Your courage data has updated your position. You've moved from [X] to [Y]."

This turns the Personal Monopoly from a one-time diagnostic into a LIVING dashboard that evolves as the user takes action. The monopoly sharpens with every courage challenge.

---

## Confidence Assessment

| Component | Confidence | Risk | Mitigation |
|-----------|-----------|------|-----------|
| Branch mapping from curiosity_clusters | 90% | Branch field already exists | None needed |
| Branch mapping from life paths | 75% | Keyword matching on career labels is fuzzy | Use AI classification if keyword match < 80% confidence |
| Rarity check (skills × problems vs 299) | 90% | Existing code, validated | None needed |
| Gap insight (curiosity vs quest branches) | 85% | Validated against Huzz data | Keyword matching edge cases |
| Frontier card content | 50% | Hypothesis, not researched | Pending market research (see `docs/research/frontier-market-research-spec.md`) |
| Monopoly statement (AI-enhanced) | 88% | Depends on Claude prompt quality | Test with 5+ real users before shipping |
| Progressive confidence display | 90% | UX pattern is straightforward | Show % clearly, incentivise more data |

**Overall build confidence: 80%.** Branch chart + gap + rarity are solid (85-90%). Frontier card deferred until market research validates the claims. Ship what's validated, research what isn't.

---

## Appendix: SD Level Exploration (Parked)

*Explored July 2026. Removed from the build. Preserved here in case we revisit.*

### What was explored

Adding Spiral Dynamics level (Purple/Red/Blue/Orange/Green/Yellow) as a dimension on top of branches. The idea: not just WHICH branch you're in, but at which DEVELOPMENTAL LEVEL you're operating within that branch.

### Why it was removed

1. **Depth levels measure skill progression, not value systems.** The mapping (education=Blue, testing=Orange, teaching=Yellow) conflated two orthogonal dimensions. A Blue-level teacher teaches by authority. A Yellow-level teacher adapts contextually. "Teaching" doesn't mean Yellow.

2. **Self-report SD level has the Costume Test problem.** Everyone claims Green or Yellow. Behavioral detection is possible but needs more signals than we currently capture.

3. **The user-facing utility was unclear.** "You're at Yellow" doesn't tell the user what to DO. The frontier card (dominant/crowded/gap) is more actionable and doesn't need SD labels.

### What would make it worth revisiting

- Remarkable Flow `different` field analyzed by AI for SD classification (describes their actual approach, not self-reported level)
- Enough courage challenge data to detect patterns: "consistent Vibe Rise on challenges = Zone of Genius" vs "consistent Pressure = Zone of Excellence trap"
- Market research validates the frontier card content, at which point SD labels become useful shorthand for the layers (dominant=Orange, crowded=Green, gap=Yellow)
- The Costume Test: if we can reliably distinguish genuine Yellow behavior from Green-wearing-Yellow's-costume, that's a valuable diagnostic

### Signals that were identified (for future use)

| Signal | What it might indicate | Confidence |
|--------|----------------------|-----------|
| Branch spread >= 4 branches | Polymath / integrative thinking | 85% |
| Protective voice: controller | Stuck at achievement/optimisation level | 80% |
| Protective voice: people_pleaser | Stuck at community/approval level | 80% |
| Protective voice: ghost | Pre-achievement shutdown | 80% |
| remarkable_angles.different text | AI could classify approach level | 85% (needs AI call) |
| Courage classification patterns | Zone of Genius vs Excellence detection | 75% (needs volume) |

### Related files

- `public/rule-break-matrix.html` — 60-cell matrix uses SD levels as columns
- `public/rule-break-radar.html` — Merge Radar, Empty Cell Map use SD framework
- `Obsidian/Frameworks/Phase 3 × Spiral Dynamics Matrix.md` — Full IP framework
- `public/rule-break-tree.html` — SD tags on all 92 historical nodes (SD_TAGS lookup)

---

## Key References

**Foundation specs (read these first):**
- `docs/features/monopoly-engine-spec.md` — Monopoly Engine: Collect → Connect → Your Flow, 1,440-position rarity, behavioral scoring
- `docs/features/interior-scoreboard-spec.md` — Capacity × Clarity, resonance ratings, quest taxonomy tagging spec

**Phase 3 × SD Matrix (this session):**
- `public/rule-break-matrix.html` — Interactive 10×6 matrix with 60 cells
- `public/rule-break-radar.html` — Merge Radar, Empty Cell Map, Civilisation Timeline, Pricing, Predictions
- `public/rule-break-tree.html` — Rule Break Tree with SD tags on all 92 nodes
- `Obsidian/Frameworks/Phase 3 × Spiral Dynamics Matrix.md` — Framework IP
- `docs/features/phase3-spiral-dynamics-utilities.md` — 11 utility specs

**Data sources:**
- `src/flows/CuriosityMapFlow.jsx` — Curiosity Map (branch classification)
- `src/components/WahooCreator.jsx` — Courage challenges
- `src/lib/wheelTaxonomy.js` — 10 skills, 12 problems, 12 personas
- `public/data/experienceCreatorDNA.json` — 91 creator profiles (need matrix branch + SD tagging)
- 292-person careerModels dataset (rarity comparison, referenced in monopoly-engine-spec)
