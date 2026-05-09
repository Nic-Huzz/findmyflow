# 7-Day Challenge vs Vibe Rise Ecosystem: Current | Proposed

> Source of truth for the alignment between FindMyFlow's 7-Day Challenge system and the Vibe Rise framework.
> Each section maps what exists today against what's been decided for the transition.

**Required reading before working on this alignment:**
- `docs/vibe-rise-ecosystem-architecture.md` — the master product architecture doc. Contains the scientific foundation (Safety x Activation = Vibe Rise), the three-layer architecture, vehicle map, customer journey, anti-crash design, market positioning, FindMyFlow's role as the maintenance engine, and the philosophy/content strategy. All decisions in this alignment doc flow from that architecture.

---

## 1. Page Identity & Framing

| Aspect | Current | Proposed | Status |
|--------|---------|----------|--------|
| App name | FindMyFlow | Keep FindMyFlow (covers `/7-day-challenge` + `/create`) | DONE |
| ChallengeIntro slide 1 | "You know that feeling." | Same | DONE |
| ChallengeIntro slide 2 | "That feeling is trainable." | Same | DONE |
| ChallengeIntro slide 3 | "Ready to find your flow?" | Same | DONE |
| `/get-started` slide 4 | "dims the aliveness we were born with" / "find what lights you up again" | Same | DONE |
| Points currency | XP (used in `movementXP.js`, ChallengeHeader, level system) | RP (Rise Points) - rename throughout UI copy | PLANNED |
| Category tabs | Level, Play-list, Healing, Bonus | Considering restructure to Practice, Play-list, Healing, Track | PLANNED |

**Key files:**
- `src/components/ChallengeIntro.jsx` - intro slides (3 slides, already aligned)
- `src/flows/PlaySkillsIdentifier.jsx` - `/get-started` hook slides (slide 4 already aligned)
- `src/lib/movementXP.js` - XP service (rename to RP)
- `src/components/ChallengeHeader.jsx` - header with Vibe Rank display

---

## 2. The Fourth State

| Aspect | Current | Proposed | Status |
|--------|---------|----------|--------|
| NS states | 4 states: vibe_rise ("Alive, activated, safe, fully here" ⚡), ventral ("Alive, connected, present" 😊), sympathetic ("Activated, buzzing, on edge" 😬), dorsal ("Heavy, numb, shut down" 😶) | Vibe Rise added as first state in array (goal state, top of list) | DONE |
| State names | Clinical: ventral / sympathetic / dorsal | Accessible: Safe (ventral), Activated (sympathetic), Shutdown (dorsal), Vibe Rise (the goal) | PLANNED |
| Check-in trigger | Fires only after quest completion (reactive, inside `GroanCompletionModal` and `HealingCompletionModal`) | Daily check-in on page load (proactive): "How are you right now?" | PLANNED |
| State visualization | NS Map page updated: 2x2 state grid, 4-state frequency bars, "% Vibe Rise" summary, 6 shift patterns (3 Vibe Rise + 3 legacy) | Weekly/monthly state distribution chart showing % time in each of 4 states | DONE |
| Archetype prompt | Shows protective archetype selector when sympathetic or dorsal selected. Vibe Rise excluded (goal state). | No change needed, existing logic naturally excludes vibe_rise | DONE |
| Check-in styling | Purple active state for all buttons | Vibe Rise button glows gold when selected (brand gradient), others remain purple | DONE |
| NS Map colors | Vibe Rise = gold (#E9A23B gradient), ventral = green (#10b981), sympathetic = orange (#f97316), dorsal = red (#ef4444) | Sympathetic shifted from gold to orange to avoid collision with Vibe Rise gold | DONE |
| DB schema | CHECK constraints updated to include 'vibe_rise' via migration `20260509000000_add_vibe_rise_state.sql` | Migration created, needs `npm run db:push` to apply | DONE |

**Key files (changed):**
- `src/lib/nervousSystemConstants.js` - `NERVOUS_SYSTEM_STATES` array (4th state added, first in array)
- `src/components/NervousSystemCheckin.jsx` - gold `.nsci-vibe-rise` class on Vibe Rise button
- `src/components/NervousSystemCheckin.css` - gold active variant for Vibe Rise
- `src/hooks/useNervousSystemMap.js` - 4-state aggregation (`pctQuad`), 6 shift patterns, 4-state dominant logic
- `src/pages/NervousSystemMap.jsx` - 2x2 state grid, 4-state bars/legend/timeline/comparison, "% Vibe Rise" summary
- `src/pages/NervousSystemMap.css` - `.nsm-vibe-rise` gold color, `.nsm-state-quad` 2x2 grid, sympathetic recolored to orange
- `supabase/migrations/20260509000000_add_vibe_rise_state.sql` - CHECK constraint update

**Files NOT changed (verified safe):**
- `GroanCompletionModal.jsx`, `HealingCompletionModal.jsx`, `ReleaseQuestInput.jsx`, `ReconnectQuestInput.jsx` - pass state values through dynamically, no hard-coded state names
- `Challenge.jsx` - uses `needsArchetype()` which naturally excludes vibe_rise
- `JourneyOnboarding.jsx`, `journeyOnboarding.js`, `woundStages.js` - wound/archetype mapping for onboarding scenes, Vibe Rise doesn't apply here

---

## 3. Wahoo Counter (New Feature)

| Aspect | Current | Proposed | Status |
|--------|---------|----------|--------|
| Wahoo score | `wahoo_score` exists on groan challenges (1-10, AI-generated rating, hidden from user) | Wahoo Counter: daily prompt "What's a Wahoo you can do today?" + log Wahoo moments | PLANNED |
| Wahoo visibility | Score hidden from user, used only in challenge generation (`groan-challenge-generator` edge function) | Weekly Wahoo count visible in header alongside streak | PLANNED |
| Play-list naming | "Play-list challenges" / "Groan challenges" | Renamed to "Wahoos" in UI copy | PLANNED |
| Score timing | `scary_score` and `wahoo_score` are AI predictions set BEFORE the user attempts the challenge | Scary/wahoo scores become POST-EXPERIENCE: user rates after doing it, not AI prediction before | PLANNED |
| Weekly reset | N/A | Wahoo counter resets every Monday (aligned with league week) | PLANNED |

**Key files:**
- `src/lib/crm/groanChallengeService.js` - challenge completion, references `wahooScoreAfter`
- `src/components/GroanCompletionModal.jsx` - completion flow (add "Was that a Wahoo?" step)
- `src/components/GroanMatrix.jsx` - 2D challenge matrix visualization
- `supabase/functions/groan-challenge-generator/index.ts` - AI challenge generation with scary/wahoo scoring
- `src/components/ChallengeHeader.jsx` - header (add Wahoo counter)

---

## 4. Daily Practice Tab (Restructure Healing)

| Aspect | Current | Proposed | Status |
|--------|---------|----------|--------|
| Healing tab | 5 R-types: Recognise, Release, Rewire, Reconnect, Rest. Mixes capacity-building with blockage-clearing | Split into two tabs: Practice (daily capacity deposits) and Healing (clearing blockages) | PLANNED |
| Practice prompts | N/A | Morning + evening prompts: coherent breathing, cold exposure, voice work, movement, sunlight | PLANNED |
| Practice streaks | Single overall streak | Individual practice streaks per practice type | PLANNED |
| Practice sub-tabs | N/A | Morning, Evening, Anytime | PLANNED |
| Healing (post-split) | All R-types in one tab | Healing retains blockage-clearing R-types only (Recognise, Release, Rewire) | PLANNED |
| Capacity R-types | Reconnect and Rest mixed in with healing | Move to Practice tab as capacity-building exercises | PLANNED |

**Key files:**
- `src/Challenge.jsx` - main challenge page, tab rendering logic
- `src/hooks/useChallengeData.js` - challenge state management, quest loading
- `src/components/HealingCompletionModal.jsx` - healing quest completion
- Quest definitions in `public/` JSON files

---

## 5. Life Design / Drain Audit (Missing Layer)

| Aspect | Current | Proposed | Status |
|--------|---------|----------|--------|
| Life audit | Nothing exists | Monthly life audit: rate Work, Relationships, Environment, Time, Truth-telling | PLANNED |
| Drain tracking | N/A | Drain/Amplifier log throughout the week | PLANNED |
| AI insight | N/A | Zarlo surfaces patterns: "You've logged 3 drains from work this week" | PLANNED |
| Unlock level | N/A | Unlocks at Level 4-5 (maps to Vibe Rise Stage 5: Drain Audit) | PLANNED |
| Integration | N/A | Lives as new sub-section within restructured tabs | FUTURE |

**Key files (to create/modify):**
- New component: `src/components/DrainAudit.jsx` (or similar)
- `src/lib/zarlo/zarloPageContent.js` - Zarlo context for drain pattern surfacing
- New DB table: `drain_amplifier_log` or similar
- `src/components/level/LevelConfig.js` - Level 4-5 integration

---

## 6. Header & Scoring

| Aspect | Current | Proposed | Status |
|--------|---------|----------|--------|
| Score pills | Healing (green), Play-list (gold), Bonus (blue) | Practice (green), Wahoos (gold), Healing (purple) | PLANNED |
| Rank label | "Vibe Rank" with XP tiers (in `ChallengeHeader.jsx`) | "Rise Level" with capacity-themed tier names, uses RP | PLANNED |
| Streak | Streak counter in header | Streak stays, add Wahoo counter beside it (weekly count, resets Monday) | PLANNED |
| NS state dot | N/A | Current state dot in header, color-coded to last check-in result | PLANNED |
| Matchup banner | Fantasy league matchup scores | Same, no change | DONE |

**Key files:**
- `src/components/ChallengeHeader.jsx` - header rendering, score pills, streak, Vibe Rank
- `src/lib/scoringCategories.js` - scoring category definitions
- `src/hooks/useChallengeData.js` - score data loading

---

## 7. Quest Completion Flow

| Aspect | Current | Proposed | Status |
|--------|---------|----------|--------|
| Healing completion | Modal with reflection, done | All completions include 4-state check-in (with Vibe Rise as 4th state) | PLANNED |
| Play-list completion | "I Did It!" -> NS check-in (3 states) -> 3% reflection -> share | "I Did It!" -> 4-state check-in -> "Was that a Wahoo?" -> 3% -> share | PLANNED |
| Alerts | No `window.alert()` calls found (already clean) | Replace any remaining alerts with celebration toasts | DONE |
| Wahoo celebration | N/A | Gold burst for Wahoo, green pulse for practice | PLANNED |
| Post-Wahoo insight | N/A | "That's 4 Wahoos this week. Your nervous system is learning." | PLANNED |
| Celebration system | Confetti + toasts + level-up modals exist (`useCelebrations.js`) | Extend with Wahoo-specific celebration variants | PLANNED |

**Key files:**
- `src/components/GroanCompletionModal.jsx` - Play-list completion (steps: state_checkin -> three_percent -> share)
- `src/components/HealingCompletionModal.jsx` - Healing completion
- `src/hooks/useCelebrations.js` - celebration triggers
- `src/components/Celebrations/` - confetti, floating points, level-up modal

---

## 8. Onboarding Sequence

| Aspect | Current | Proposed | Status |
|--------|---------|----------|--------|
| Intro | 3-slide intro (ChallengeIntro.jsx) -> PWA prompt -> group selection -> project selection | 3-slide Vibe Rise intro (DONE) -> first 4-state check-in -> PWA prompt -> first quest | PLANNED |
| ChallengeIntro slides | Already aligned with Vibe Rise language | No change needed | DONE |
| PriorityTab | Orphaned component (`PriorityTab.jsx`, `usePriorityTab.js`) with its own CSS | Clean up or archive | PLANNED |
| Tab unlock | Progressive tab unlock based on Level 0 quest completion | Stays, reframed with Vibe Rise language | PLANNED |
| Level 0 flow | Hero avatar -> Play-skills -> Origin story -> Healing task | Same sequence, Vibe Rise copy updates | PLANNED |

**Key files:**
- `src/components/ChallengeIntro.jsx` - intro overlay (already aligned)
- `src/components/PriorityTab.jsx` - orphaned, needs cleanup
- `src/hooks/usePriorityTab.js` - orphaned hook
- `src/Challenge.jsx` - tab unlock logic (lines ~234-247)
- `src/components/level/LevelTab.jsx` - Level 0 onboarding sequence

---

## 9. Content & Copy Alignment

| Aspect | Current | Proposed | Status |
|--------|---------|----------|--------|
| Quest naming | "quest" used universally | Keep "quest" for healing/practice tasks, use "Wahoo" for Play-list courage challenges | PLANNED |
| Groan Matrix | "Groan Matrix" in code and UI | "Wahoo Map" or "Courage Map" in user-facing copy (keep `GroanMatrix` in code) | PLANNED |
| NS language | Clinical polyvagal terminology in explanations | Inject Vibe Rise language: "builds your safety capacity" / "trains your activation edge" | PLANNED |
| Groan terminology | "Groan" used throughout UI (Groan Zone, Groan challenges) | Phase out "Groan" in user-facing copy, replace with "Wahoo" / "Courage" | PLANNED |
| Code naming | `groan_*` in DB tables, services, components | Keep internal code names as-is (too much churn to rename DB/code) | DONE |

**Key files to update (copy only, not code refactor):**
- `src/components/GroanMatrix.jsx` / `.css` - title and labels
- `src/flows/PlayListExplainer.jsx` - explainer content
- `src/Challenge.jsx` - tab labels and quest descriptions
- `src/components/QuestCard.jsx` - quest card copy

---

## 10. Level Journey x Vibe Rise Synergistic Model

### Level Definitions

The 9 levels stay as Vibe Rise Capacity Levels. Each level is a specific blockage preventing the nervous system from holding more safe activation.

| Level | Theme | Question | Vibe Rise Lens |
|-------|-------|----------|----------------|
| 0 | Getting Set Up | What does your aliveness look like? | Can't access Vibe Rise if you don't know what your aliveness looks like. Discovery, not activation. |
| 1 | Identity | Who am I really? | You suppress activation to belong. Clear this = activated AND accepted. |
| 2 | Vulnerability | Can I be honest about what I need? | Can taste Vibe Rise alone but can't hold it with others. Walls block shared activation. |
| 3 | Direction | What do I build and who do I build it for? | Activation without direction = anxiety. Need somewhere to point the energy. |
| 4 | Enough | Do I have permission to move? | Permission wound. "Am I allowed to feel this good?" Ceiling on aliveness. |
| 5 | Growth | What is my real edge? | Challenge vs Ability = flow channel. The Vibe Rise training ground. NS edge. |
| 6 | Execution | Can I sustain movement? | Can you sustain activation without burning out? Vibe Rise as durable, not fleeting. |
| 7 | Passion-Risk | What do I actually care about enough to risk? | Final protective voice between you and full activation. |
| 8 | Play | Can I experience genuine play? | Freedom x Safety. Vibe Rise as baseline. The destination. |

**Key file:** `src/components/level/LevelConfig.js` - all 9 levels defined with questions, graphs, zones, boss fights, deep dives. The Vibe Rise Lens column above maps directly to the existing level structure.

### Vibe Rise Stages Mapped to Levels + Tabs

| Vibe Rise Stage | Primary Tab | Levels | Key Exercise | Status |
|-----------------|-------------|--------|--------------|--------|
| 1. Glimpse | N/A (onboarding) | Pre-Level 0 | Intro slides, `/get-started` | DONE |
| 2. First Wahoo | Play-list | 0-1 | First courage challenge (first Wahoo) | Naming only (PLANNED) |
| 3. The Crash | Healing (Integration) | After L1-2 | Integration content, crash reframe | **BIGGEST GAP** - needs new content (FUTURE) |
| 4. Capacity Build | Healing (Daily/Reconnect) | 2-4 | Breathing, cold, voice, movement | Already strong, needs reframing (PLANNED) |
| 5. Drain Audit | Healing (Life Design) | 4-5 | Life audit, drain/amplifier tracking | **NEW FEATURE** needed (PLANNED) |
| 6. Reorganization | Level (Boss Fights) | 5-7 | Boss fights, milestone commitments | Already aligned (DONE) |
| 7. Transmission | Level 8 | 8 | Teaching, facilitator path | FUTURE |

### Tab x Capacity Model

| Tab | Function | Vibe Rise Role |
|-----|----------|----------------|
| Play-list | Activation training | Trains the activation edge. "Can you feel alive AND safe?" |
| Healing | Safety building | Builds baseline safety capacity. Clears what blocks activation. |
| Practice (new) | Daily deposits | Coherent breathing, cold exposure, movement. Daily nervous system conditioning. |
| Together | Play-list + Healing | Vibe Rise capacity = safe activation. Both axes growing together. |

### Courage Counts Per Level

Original spec was L1=1, L2=2, ... L7=7 (total 28). Infrastructure is fully built and dormant:

| Component | File | Status |
|-----------|------|--------|
| `courageCount` field | `LevelConfig.js` (each level) | Set to 0 (dormant) |
| Courage progress bar | `src/components/level/ProgressBars.jsx` | Built, reads `courageCount` |
| Courage challenge IDs | `user_level_progress.courage_challenge_ids` | DB column exists |
| Level tab rendering | `src/components/level/LevelTab.jsx` | Reads config |

**Courage counts re-enabled (2026-05-09). Total: 15 Wahoos across the journey.**

| Level | Courage Count | Visibility Layer | Wahoo Quest Name |
|-------|---------------|------------------|-----------------|
| 0 | 0 | — | None (setup only) |
| 1 | 1 | screen | Your First Wahoo |
| 2 | 1 | live | Your First Wahoo |
| 3 | 2 | live | Wahoo Challenges |
| 4 | 2 | money | Wahoo Challenges |
| 5 | 3 | vulnerable | Wahoo Challenges |
| 6 | 3 | authority | Wahoo Challenges |
| 7 | 3 | all layers | Wahoo Challenges |
| 8 | ongoing | all layers | None (endgame) |

**Milestones updated to action-oriented Vibe Rise language:**
- L1: "Express who you are where someone can see it"
- L3: "Help one person with your essence this week"
- L4: "Ask for what you're worth without apologising"
- L6: "Sustain your output for 2 weeks without burning out"

**Deep dive narratives updated:**
- L2: "What does safety look like for you?"
- L4: "What permission are you missing?"
- L5: "Where does your nervous system say stop?"
- L6: "What belief makes you burn out or stall?"
- L7: "What would you risk everything for?"

### Wahoo Identification Flow

| Component | Status | Notes |
|-----------|--------|-------|
| `MobilePlaylistPicker` (Flow B: Role -> Topic -> write challenge) | ARCHIVED | Still in codebase, removed from PlayListTab |
| `PlaySkillPicker` (10 taxonomy categories + custom input) | BUILT | Wired into Level 0 + PlayListTab State 1 |
| `WahooCreator` (two-path) | BUILT | Path A: free text -> AI generates. Path B: browse categories -> AI suggests. Wired into PlayListTab State 2 |
| Groan Matrix visualization | DONE | Stays as the Wahoo Map (visualization/map view). Code stays as `GroanMatrix.jsx` |

### What's Already Well-Aligned (No Changes Needed)

| Feature | Why It's Aligned |
|---------|-----------------|
| Groan Matrix scary + wahoo scoring | IS the Wahoo generator (scary = activation edge, wahoo = aliveness signal) |
| NS check-in after challenges | Just needs 4th state added |
| Streak system | Daily consistency tracking for capacity building |
| Level progression (0-8) | Maps directly to 7-stage Vibe Rise journey |
| R-type healing quests | Blockage-clearing work (Recognise, Release, Rewire) |
| Celebration system | Confetti, toasts, level-up modal already built (`useCelebrations.js`) |
| Fantasy League | Social accountability + co-regulation (Vibe Rise is relational, not solo) |

---

## Implementation Priority

| Priority | Change | Effort | Files Affected |
|----------|--------|--------|----------------|
| 1 | Add 4th state (Vibe Rise) to `NervousSystemCheckin` | Small | `nervousSystemConstants.js`, `NervousSystemCheckin.jsx`, DB migration |
| 2 | Daily state check-in on page load | Medium | `Challenge.jsx`, new component, DB migration |
| 3 | Wahoo Counter in header | Small | `ChallengeHeader.jsx`, `useChallengeData.js` |
| 4 | Rename Play-list challenges to Wahoos in UI copy | Small | `GroanCompletionModal.jsx`, `QuestCard.jsx`, `Challenge.jsx`, `GroanMatrix.jsx` |
| 5 | Replace any alerts with celebration toasts | Small | Scan for `window.alert()` (none found currently) |
| 6 | Restructure tabs (Practice / Play-list / Healing / Track) | Large | `Challenge.jsx`, `useChallengeData.js`, quest JSONs, `scoringCategories.js` |
| 7 | State trend visualization | Medium | New component, DB query |
| 8 | Drain Audit feature | Large | New component, new DB table, Zarlo integration |

---

## Appendix: Key File Reference

| File | Purpose |
|------|---------|
| `src/lib/nervousSystemConstants.js` | NS states, archetypes, helper functions |
| `src/components/NervousSystemCheckin.jsx` | Universal check-in component |
| `src/components/GroanCompletionModal.jsx` | Play-list challenge completion flow |
| `src/components/HealingCompletionModal.jsx` | Healing quest completion flow |
| `src/components/ChallengeIntro.jsx` | First-visit intro overlay (3 slides) |
| `src/components/ChallengeHeader.jsx` | Header with scores, streak, Vibe Rank |
| `src/components/GroanMatrix.jsx` | 2D courage challenge matrix |
| `src/components/PlaySkillPicker.jsx` | Level 0 play-skill category picker |
| `src/components/WahooCreator.jsx` | Two-path Wahoo creation (replaces MobilePlaylistPicker) |
| `src/components/level/LevelConfig.js` | 9-level journey config |
| `src/components/level/LevelTab.jsx` | Level tab rendering |
| `src/Challenge.jsx` | Main challenge page (tabs, quests, scoring) |
| `src/hooks/useChallengeData.js` | Challenge state management |
| `src/hooks/useCelebrations.js` | Celebration triggers |
| `src/lib/movementXP.js` | XP/RP service |
| `src/lib/scoringCategories.js` | Scoring category definitions |
| `supabase/functions/groan-challenge-generator/index.ts` | AI challenge generation |
| `supabase/migrations/20260429200000_nervous_system_checkins.sql` | NS check-in table |
