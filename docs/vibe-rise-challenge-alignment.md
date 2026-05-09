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
| Points currency | RP (Rise Points) across all user-facing UI | Renamed from XP in 17 files | DONE |
| Category tabs | Level, Tune, Play-list, Healing | Restructured from Level/Play-list/Healing/Bonus. Tune = daily maintenance | DONE |

**Key files:**
- `src/components/ChallengeIntro.jsx` - intro slides (3 slides, already aligned)
- `src/flows/PlaySkillsIdentifier.jsx` - `/get-started` hook slides (slide 4 already aligned)
- `src/lib/movementXP.js` - XP service (rename to RP)
- `src/components/ChallengeHeader.jsx` - header with Vibe Rank display

---

## 2. The Fourth State

| Aspect | Current | Proposed | Status |
|--------|---------|----------|--------|
| NS states | 4 states: vibe_rise ("Alive, activated, safe, fully here" ⚡), ventral ("Calm, connected, present" 😊), sympathetic ("Activated, buzzing, on edge" 😬), dorsal ("Heavy, numb, shut down" 😶) | Vibe Rise added as first state in array (goal state, top of list) | DONE |
| State names | Each state has `name` (short accessible) + `label` (descriptive). Vibe Rise / Safe / Activated / Shutdown. Shown as bold name + gray subtitle in check-in buttons. | NS Map uses `name` from constants via shared `STATE_MAP` | DONE |
| Check-in trigger | Daily check-in overlay on challenge page load: "How are you right now?" One-tap save, skip-able. Checks `nervous_system_checkins` for today's `checkin_type='daily'`. | Reactive check-ins (post-quest) still fire separately via GroanCompletionModal / HealingCompletionModal | DONE |
| State visualization | NS Map page updated: 2x2 state grid, 4-state frequency bars, "% Vibe Rise" summary, 6 shift patterns (3 Vibe Rise + 3 legacy) | Weekly/monthly state distribution chart showing % time in each of 4 states | DONE |
| Archetype prompt | Shows protective archetype selector when sympathetic or dorsal selected. Vibe Rise excluded (goal state). | No change needed, existing logic naturally excludes vibe_rise | DONE |
| Check-in styling | Purple active state for all buttons | Vibe Rise button glows gold when selected (brand gradient), others remain purple | DONE |
| NS Map colors | Vibe Rise = gold (#E9A23B gradient), ventral = green (#10b981), sympathetic = orange (#f97316), dorsal = red (#ef4444) | Sympathetic shifted from gold to orange to avoid collision with Vibe Rise gold | DONE |
| DB schema | CHECK constraints updated: `before_state`/`after_state` include `'vibe_rise'`, `checkin_type` includes `'daily'` | Migrations applied: `20260509000000_add_vibe_rise_state.sql`, `20260509000001_add_daily_checkin_type.sql` | DONE |

**Key files (changed):**
- `src/lib/nervousSystemConstants.js` - `NERVOUS_SYSTEM_STATES` array with `name` + `label` fields, 4 states
- `src/components/NervousSystemCheckin.jsx` - two-line buttons (name bold + label gray), gold `.nsci-vibe-rise` class
- `src/components/NervousSystemCheckin.css` - `.nsci-name` / `.nsci-label` / `.nsci-text` styles, gold active variant
- `src/components/DailyCheckin.jsx` - daily check-in overlay component (one-tap save, skip-able)
- `src/components/DailyCheckin.css` - overlay + card + button styles with gold Vibe Rise variant
- `src/Challenge.jsx` - DailyCheckin import, `showDailyCheckin` state, useEffect to check today's check-in, overlay in main view
- `src/hooks/useNervousSystemMap.js` - 4-state aggregation (`pctQuad`), 6 shift patterns, 4-state dominant logic
- `src/pages/NervousSystemMap.jsx` - 2x2 state grid, `STATE_MAP` from constants, 4-state bars/legend/timeline/comparison, "% Vibe Rise" summary
- `src/pages/NervousSystemMap.css` - `.nsm-vibe-rise` gold color, `.nsm-state-quad` 2x2 grid, sympathetic recolored to orange
- `supabase/migrations/20260509000000_add_vibe_rise_state.sql` - `before_state`/`after_state` CHECK constraint
- `supabase/migrations/20260509000001_add_daily_checkin_type.sql` - `checkin_type` CHECK constraint

**Files NOT changed (verified safe):**
- `GroanCompletionModal.jsx`, `HealingCompletionModal.jsx`, `ReleaseQuestInput.jsx`, `ReconnectQuestInput.jsx` - pass state values through dynamically
- `JourneyOnboarding.jsx`, `journeyOnboarding.js`, `woundStages.js` - wound/archetype mapping, Vibe Rise doesn't apply here

---

## 3. Wahoo Counter (New Feature)

| Aspect | Current | Proposed | Status |
|--------|---------|----------|--------|
| Wahoo Counter | ⚡ badge in header showing weekly count of "Hell yes" completions | Queries `groan_challenges` where `scary_score >= 7 AND wahoo_score >= 7 AND completed_at >= week_start` | DONE |
| "Was that a Wahoo?" | 3-option post-completion classification in GroanCompletionModal | 🔥 Hell yes (+2 vibe_rise), ⚡ Felt alive (+2), 😐 Just did it (+1). User self-report replaces AI scores | DONE |
| Wahoo Map | "Play-list Matrix" renamed to "Wahoo Map" in GroanMatrix header | Internal code stays `GroanMatrix.jsx` | DONE |
| Play-list naming | Auto-inject quest shows "Your First Wahoo" (count=1) or "Wahoo Challenges" (count>1) | LevelConfig `getLevelConfig()` auto-inject updated | DONE |
| Gold confetti | "Hell yes" Wahoos get gold confetti burst, others get standard | Colors: #E9A23B, #f5c55a, #fbbf24 | DONE |

**Key files (changed):**
- `src/components/GroanCompletionModal.jsx` - wahoo_check step added, WAHOO_SCORES mapping, gold confetti
- `src/components/ChallengeHeader.jsx` - wahooCount prop, wahoo-badge CSS
- `src/Challenge.jsx` - wahooCountThisWeek state, DB query, passed as prop
- `src/components/GroanMatrix.jsx` - title renamed to "Wahoo Map"

---

## 4. Tune Tab (Replaced Bonus, Absorbed Reconnect + Rest)

| Aspect | Current | Proposed | Status |
|--------|---------|----------|--------|
| Tab name | Tune (replaced Bonus) | Daily maintenance deposits. "Tuning your nervous system" | DONE |
| Daily practices | 6 practices: breathwork, cold, movement, voice, sleep, sunlight | Inline completion with 2-option state check (Safe / Vibe Rise) | DONE |
| Reconnect quests | Moved from Healing to Tune | Opens HealingCompletionModal (ReconnectQuestInput multi-step) | DONE |
| Rest quests | Moved from Healing to Tune | Inline completion with 2-option state check | DONE |
| Healing tab | Slimmed to Recognise, Release, Rewire only | Blockage-clearing deep work, not daily tasks | DONE |
| HealingCompletionModal | After-only 4-state check-in (before step removed) | before_state = null, saves to nervous_system_checkins | DONE |
| Scoring | Tune maps to 'healing' RPC bucket | Client-side separates display via quest_category | DONE |
| Bonus tab | Archived. Exercises move to Fantasy League when reactivated | Quests stay in JSON as category "Bonus" (invisible) | DONE |

**Maintenance Equation (now trackable):**
```
Play-list (Wahoos) = EXPANDS activation capacity
Healing (clearing) = EXPANDS safety capacity  
Tune (daily)       = MAINTAINS the container so both can happen
```

**Key files (changed):**
- `src/components/TuneTab.jsx` + `.css` (NEW) - 3-section component, prefix tt-
- `src/components/HealingCompletionModal.jsx` - after-only, before_state removed
- `src/hooks/useChallengeData.js` - categories reordered, bonusSubTab removed
- `src/Challenge.jsx` - Tune rendering, Bonus blocks removed, R-types slimmed
- `src/lib/scoringCategories.js` - 'Tune' → 'healing' mapping
- `src/lib/league/leagueConfig.js` - bonus → tune in FANTASY_CATEGORIES
- `public/challengeQuestsUpdate.json` - 4 new practices, 11 quests recategorized
- `supabase/migrations/20260510000000_tune_tab_schema.sql` - tune checkin_type, nullable before_state, Tune quest_category

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
| Score pills | ☀️ Tune (green), 🔥 Wahoos (gold), 💜 Healing (purple) | DISPLAY_KEYS updated, colors updated | DONE |
| Rank label | Shows RP in Vibe Rank bar (`${lifetimeXP} / ${vibeMax} RP`) | Renamed from XP | DONE |
| Streak + Wahoo | 🔥 streak + ⚡ Wahoo Counter side by side in header | Wahoo counts "Hell yes" completions this week | DONE |
| NS state dot | N/A | Current state dot in header, color-coded to last check-in result | FUTURE |
| Matchup banner | Fantasy league matchup scores | Same, no change | DONE |

**Key files:**
- `src/components/ChallengeHeader.jsx` - header rendering, score pills, streak, Vibe Rank
- `src/lib/scoringCategories.js` - scoring category definitions
- `src/hooks/useChallengeData.js` - score data loading

---

## 7. Quest Completion Flow

| Aspect | Current | Proposed | Status |
|--------|---------|----------|--------|
| Healing completion | After-only 4-state check-in → quest input | before_state removed, starts at after_checkin | DONE |
| Play-list completion | "I Did It!" → 4-state check-in → "Was that a Wahoo?" (3 options) → 3% → share | Gold confetti for "Hell yes", standard for others | DONE |
| Tune completion | Inline 2-option state check (Safe / Vibe Rise) | No modal for Practice + Rest. Reconnect uses HealingCompletionModal | DONE |
| Alerts | `window.alert()` used in quest completion and tab bonus | Changed to RP in messages, toasts still pending | PLANNED |
| Post-Wahoo insight | N/A | "That's 4 Wahoos this week. Your nervous system is learning." | FUTURE |

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
| Quest naming | "quest" for healing/practice, "Wahoo" for Play-list | Auto-inject shows "Your First Wahoo" / "Wahoo Challenges" | DONE |
| Groan Matrix | Renamed to "Wahoo Map" in UI header | Internal code stays `GroanMatrix.jsx` | DONE |
| NS language | Accessible names: Vibe Rise, Safe, Activated, Shutdown | `name` field on NERVOUS_SYSTEM_STATES | DONE |
| RP rename | "XP" → "RP" across 17+ user-facing files | Internal variables unchanged | DONE |
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
| 2. First Wahoo | Play-list | 0-1 | First Wahoo challenge (L1 courageCount=1) | DONE |
| 3. The Crash | Healing (Integration) | After L1-2 | Integration content, crash reframe | **BIGGEST GAP** - FUTURE |
| 4. Capacity Build | Tune (daily practices) | 2-4 | Breathing, cold, voice, movement, sleep, sunlight | DONE |
| 5. Drain Audit | Tune (future section) | 4-5 | Life audit, drain/amplifier tracking | PLANNED |
| 6. Reorganization | Level (Boss Fights) | 5-7 | Boss fights, milestone commitments | Already aligned (DONE) |
| 7. Transmission | Level 8 | 8 | Teaching, facilitator path | FUTURE |

### Tab x Capacity Model (Vibe Rise = Activation × Safety)

| Tab | Function | Vibe Rise Role |
|-----|----------|----------------|
| **Tune** | Maintains the container | Daily deposits: breathwork, cold, voice, movement, sleep, sunlight. "Without this, Wahoos produce peaks followed by crashes" |
| **Play-list** | Expands activation capacity | Wahoo challenges at escalating visibility layers. Edge-crossing reps |
| **Healing** | Expands safety capacity | Clears blockages: Recognise, Release, Rewire. Deep work, not daily |
| **Level** | Identity & meaning | Journey progression, zone diagnosis, boss fights. Category 4 of maintenance equation |

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

## Implementation Progress (2026-05-09)

| # | Change | Status |
|---|--------|--------|
| 1 | Add 4th state (Vibe Rise) to NervousSystemCheckin | ✅ DONE |
| 2 | Daily state check-in on page load | ✅ DONE |
| 3 | Wahoo Counter in header | ✅ DONE |
| 4 | Rename copy to Wahoos + RP | ✅ DONE |
| 5 | "Was that a Wahoo?" post-completion classification | ✅ DONE |
| 6 | Tab restructure (Level / Tune / Play-list / Healing) | ✅ DONE |
| 7 | All 9 levels aligned (courage counts, milestones, narratives) | ✅ DONE |
| 8 | PlaySkillPicker + WahooCreator + PlayListTab rewire | ✅ DONE |

### Remaining

| # | Change | Effort | Notes |
|---|--------|--------|-------|
| 1 | Capacity Score calculation + display | ✅ DONE | `useCapacityScore` hook + `CapacityCard` on Level tab. Score 0-100, trend vs last week, state distribution |
| 2 | Forgiving streak | ✅ DONE | 1 day grace period. `getConsecutiveStreakDays` + `checkStreakBreak` updated |
| 3 | Apply DB migrations | ✅ DONE | 3 migrations applied to production via MCP |
| 4 | State trend visualization | ✅ COVERED | Two layers already built: (a) CapacityCard on Level tab shows weekly score + trend + state %, (b) NS Map page (`/nervous-system-map`) shows full 4-state weekly timeline, frequency bars, shift patterns, and "% Vibe Rise" summary. No additional visualization needed. |
| 5 | Drain Audit feature | PLANNED | Denominator of the Maintenance Equation. Periodic logging in Tune tab. 2-option state check (Activated/Shutdown). Each drain saved to `nervous_system_checkins` with `checkin_type: 'drain'`, automatically pulls Capacity Score down |
| 6 | Connection layer (community) | FUTURE | Fantasy League reactivation, friend connections, event integration. Biggest remaining gap |

---

## Appendix: Key File Reference

| File | Purpose |
|------|---------|
| `src/lib/nervousSystemConstants.js` | NS states (4) with name + label + emoji, archetypes |
| `src/components/NervousSystemCheckin.jsx` | Universal 4-state check-in component |
| `src/components/DailyCheckin.jsx` | Daily state check-in overlay on page load |
| `src/components/GroanCompletionModal.jsx` | Wahoo completion: NS check-in → "Was that a Wahoo?" → 3% → share |
| `src/components/HealingCompletionModal.jsx` | Healing completion: after-only 4-state check-in → quest input |
| `src/components/TuneTab.jsx` | Tune tab: daily practices + Reconnect + Rest |
| `src/components/PlayListTab.jsx` | Play-list tab: WahooCreator + Active Wahoos |
| `src/components/WahooCreator.jsx` | Two-path Wahoo creation (free text or browse categories) |
| `src/components/PlaySkillPicker.jsx` | Level 0 play-skill category picker (10 + custom) |
| `src/components/ChallengeIntro.jsx` | First-visit Vibe Rise intro (3 slides) |
| `src/components/ChallengeHeader.jsx` | Header: streak + Wahoo Counter + score pills + Rise bar |
| `src/components/GroanMatrix.jsx` | Wahoo Map (2D challenge matrix visualization) |
| `src/components/level/LevelConfig.js` | 9-level journey config with courage counts + milestones |
| `src/components/level/LevelTab.jsx` | Level tab with PlaySkillPicker wiring |
| `src/Challenge.jsx` | Main challenge page (4 tabs, quest routing, scoring) |
| `src/hooks/useChallengeData.js` | Challenge state: categories, quests, completions, scoring |
| `src/lib/scoringCategories.js` | Scoring: Tune→healing, Groans→courage mappings |
| `src/lib/league/leagueConfig.js` | Fantasy categories: tune, play_list, healing |
| `supabase/functions/groan-challenge-generator/index.ts` | AI Wahoo challenge generation |
| `supabase/migrations/20260509000000_add_vibe_rise_state.sql` | 4th state CHECK constraints |
| `supabase/migrations/20260509000001_add_daily_checkin_type.sql` | Daily checkin_type |
| `supabase/migrations/20260510000000_tune_tab_schema.sql` | Tune checkin_type, nullable before_state, Tune quest_category |
