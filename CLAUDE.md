# Find My Flow - Claude Guide

## Maintaining This File

Primary context for every conversation. Keep accurate, concise, under 400 lines.

**Belongs here:** Overview, tech stack, folder structure, routes, key features (orient-level), architecture patterns, gotchas, DB tables, env vars, links.
**Does NOT belong:** Changelogs, implementation details derivable from code, debugging notes, duplicated docs. Point to docs instead.
**When updating:** Edit in-place. Remove replaced features. Keep under 400 lines.

## Overview

Personal development app helping burnt-out professionals discover their ideal career path. Built on **Nikigai** framework (Nic + Ikigai). Users complete AI-guided "flows" to identify skills, problems, and ideal customers.

**Zone Calibration Framework:** Users arrive at The Crack (burnout). App moves them along the Sprouter diagonal toward Self-Actualisation (self-knowledge + action together). X axis = Self-Knowledge (Repair phase: flows, healing, archetypes). Y axis = Action (Build phase: business stages). See `docs/frameworks/zone-calibration-framework.md`.

**Three products:** Vibe Rise Sessions (weekly in-person events), Find My Flow App (consumer progress ledger), Creator Portal / Scale (OS for experience creators at `/create`).

## Tech Stack

React 18 + Vite + React Router v7 | Supabase (PostgreSQL, Auth, Edge Functions) | Anthropic Claude API | Vercel | Web Push API | Capacitor 8 (iOS)

**Two Products, One Repo**: `VITE_APP_MODE` env var. Consumer at `viberise.nichuzz.com`, Creator at `create.nichuzz.com`. Vite plugin swaps meta/icons/manifest per mode.

**iOS App**: Capacitor 8 (SPM). `npm run build` → `npx cap sync` → Xcode. Xcode Cloud CI.

**Brand Colors**: Purple (#5e17eb) → Gold (#E9A23B) gradient. Logo font: Inter 900.

## Folder Structure

```
src/
├── flows/          # Multi-step flows (LifeMapFlow, EssenceMirrorFlow, etc.)
├── hooks/          # State hooks (useChallengeData, useCapacityScore, useSafetyDome, etc.)
├── components/     # UI (crm/, CreatorHome/, level/, Zarlo/, PlayProfile/, DomeOfSafety, QuestBoardCard, etc.)
├── pages/          # Route pages
├── lib/            # Utilities (scoreUtilities, skillProgress, wheelTaxonomy, voicePatternDetector, zarlo/, crm/)
├── data/           # Static config (domeDimensions.js, precursorDefaults.js, experienceDomeSubNodes.js, channelMapping.js, archetypes, taxonomy JSON, founderDna)
└── styles/         # flow-base.css (shared flow styles)
supabase/functions/ # Edge functions
docs/               # Specs, handoffs, research
```

## Routes

**Core**: `/` | `/log-in` | `/me` | `/7-day-challenge` | `/library` | `/flow-compass` | `/feedback` | `/hero-profile` | `/guidebook`

**Onboarding**: `/get-started`, `/essence-mirror`, `/essence-identify`, `/protective-identify`

**Levels**: `/zone-diagnosis/:levelNumber`, `/tension-assessment`

**Create Portal**: `/create`, `/create/experience/new`, `/create/experience/:id`, `/create/remarkable`, `/create/narrative-builder`, `/create/access-architecture`, `/create/scale-diagnostic`, `/try/facilitator-score`

**Direction**: `/career-clarity`, `/people`, `/experience-creators`

**Self-Knowledge**: `/curiosity-map`, `/life-paths`, `/career-alignment`, `/life-map`, `/mirror` (hidden)

**Money Model**: `/attraction-offer`, `/upsell-offer`, `/downsell-offer`, `/continuity-offer`, `/leads-strategy`, `/offer-builder`, `/funnel-builder`, `/funnel-calculator`

**Other**: `/play-profile`, `/league/*`, `/archetypes/*`, `/community`, `/play-list-feed`, `/nervous-system`, `/healing-compass`, `/v/:shareToken`, `/add-current-job`

**CRM**: `/crm/*` (Dashboard, Attract/Nurture/Tools towers, contacts, email-sequences, content, marketing, sales)

**Redirects**: `/business` → `/create`, `/nikigai/*` → `/life-map`, `/shadow-work` → `/life-map`

## Key Features

### 1. Dome of Safety (NS Comfort Zone Visualization)

8-dimension radar chart mapping the user's nervous system comfort zone. Each courage challenge tags 1+ dimensions with quantified levels. Dome expands when the user completes a challenge AND recaptures regulation (after_state = vibe_rise or ventral). Edge ring (gold dashed) shows where user has been but hasn't integrated.

**8 Dimensions**: People (numeric), Money (numeric), Vulnerability (5 levels, shields removed), Stakes (4 levels), Rarity (5 levels), Identity (5 levels, first-time framing), Context (5 levels, includes platform/format not just geography), Business Commitment (5 levels).

**Source of truth for all dimension data**: `src/data/domeDimensions.js`. Always import from here, never redefine dimensions inline.

Key files: `DomeOfSafety.jsx` (SVG radar), `useSafetyDome.js` (dome edge computation), `domeDimensions.js` (8 dims + difficulty scale + helpers), `domeBusinessModels.js` (readiness mapping), `voicePatternDetector.js` (pattern detection).

Specs: `docs/features/dome-of-safety-spec.md`, `docs/features/prediction-error-spec.md`

### 2. Prediction Error (Gap Measurement)

Captures predicted vs experienced difficulty on courage challenges. Fear reduces through expectancy violation (Craske et al., 2014), not habituation. The gap = the learning signal.

**Three data points**: planning prediction (at creation, write-once), pre-action prediction (retroactive at completion), experienced difficulty (at completion). Body-based 1-5 scale: Relaxed → Alert → Butterflies → Racing → Frozen.

**Courage Score** (what you did) and **Gap** (what you learned) are SEPARATE metrics, never combined.

**Negative gap → voice discovery**: When experienced > predicted, asks "Which voice showed up?" Saves `gap_voice` to `groan_challenges`. After 3+ occurrences of same voice on overlapping dimensions, pattern-triggered popup: "Ghost shows up every time you push Vulnerability. Want to explore why?" → healing flow with voice pre-selected.

### 3. Quest Board + Zone Assessments

Flat quest board. Quests = life paths being pursued. Each quest has tasks, some tagged as courage challenges (synced to `groan_challenges`). Zone Assessments: 8 levels, browse-at-your-own-pace, each with 2x2 Sweet Spot graph.

Key files: `LevelTab.jsx`, `QuestBoardCard.jsx`, `SweetSpotGraph.jsx`. DB: `quests`, `quest_tasks`, `user_level_progress`.

### 4. 7-Day Challenge System (Maintenance Engine)

**Tabs**: Discover → Paths → Tune → Progress. Paths tab unlocks when current job flow OR choose-quests completed.

**Experience Dome**: ~94 core nodes across 11 primals (Movement 18, Nourishment 6, Style 3, Tools 6, Bonds 9, Shelter 6, Story 21, Play 10, Fire 3, Healing 8, Sleep 4). Each node has format sub-nodes in `experienceDomeSubNodes.js`. Node registry + branch lists + virtual nodes in `experienceDomeConfig.js`. Skill inferences in `domeSkillInference.json`. Dome tick descriptions in `ExperienceGameFlow.jsx`.

**Choose Quests Bridge** (`/choose-quests`, `ChooseQuestsFlow.jsx`): Phase 1→2 bridge. Intro → Select dome experiences → Deep Dive (Layer 1 format sub-nodes + Layer 2 career vectors per node) → AI suggests paths (`suggest-life-paths` edge function) → Pick paths → Path Definition (3 screens per path) → Save. Deep dive data: `src/data/experienceDomeSubNodes.js`, career vectors (Do/Guide/Build/Hobby). Path Definition screens: Screen 1 Setup (precursor + 3 dome dimensions + dream levels + radar gap), Screen 2a Framing (Life Fuel contrast + buts + "and" reframe), Screen 2b Commitment (smallest step + fear question + identity declaration + protective voice). All sections required. Spec: `docs/features/experience-dome-deep-dive.md`.

**Life Fuels** (`src/data/channelMapping.js`): 4 channels (Choice, Connection, Mastery, Meaning). Tracked via checkboxes after courage challenges. Shift-context labels for path definition in `SHIFT_FUELS` constant in `ChooseQuestsFlow.jsx`.

**Paths tab** (`LevelTab.jsx`): Active quests with QuestBoardCards, mini dome, zone matrix (Action x Clarity). **Tune tab**: Daily practices, drains, experience check-ins. **Courage** (`PlayListTab.jsx`): Active courage challenges, WahooCreator, identity statements. **Healing** (`HealingFlowModal.jsx`): 7-step per-task flow (Pattern → Fear → Origin → Insight → Rewire → Go Deeper → Expect the Best).

**Scoring**: RP (Rise Points). Levels: Getting Started (0) → Movement Maker (5750). **Post-courage flow**: NS classification → aftertaste ("Do you want to do that again?" yes/not_sure/no) → gap check (if predicted) → expectation → cross-pollination → 3% reflection → life fuel. **Aftertaste** is the essence alignment filter (Groan Zone thesis). "Not sure" responses get a second clock in the weekly review a week later. DB: `quest_completions.aftertaste`, `quest_completions.aftertaste_week_later`. Spec: `docs/specs/aftertaste-essence-filter-spec.md`. Framework: Obsidian `Frameworks/Aftertaste Test.md`.

**Weekly Review**: Sunday/Monday. Second Clock (aftertaste follow-up for prior week's "not sure" challenges, after Q1) → Q1 Identity Shift → Q2 Procrastination → Q3 Courage → Dome this month → Q4 Income (stage 8+).

### 5. Essence Mirror (Onboarding)

9-step essence discovery at `/essence-mirror`. Superpower cards → Vision confirmation → AI Mirror reveal → Hero avatar (Gemini 3.1 Flash) → Name hero. 12 Essence Archetypes defined in `src/data/essenceArchetypes.js`.

### 6. Interior Scoreboard (Clarity + Action Score)

**Clarity** (X axis): % of Life Map clusters rated Vibe Rise or Fun. **Action Score** (Y axis): aligned actions over rolling 7 days. **Zone Matrix**: 4 quadrants (Self-Actualisation / Head Full of Dreams / Misguided / Unfulfilment). **Skill tree**: L0-L4 via `increment_skill_xp` RPC. **Mirror page** (`/mirror`): cluster re-rating, identity statements, skill tree.

Key files: `scoreUtilities.js`, `MirrorPage.jsx`.

### 7. Business Model Readiness (Direction Pipeline)

5-card direction sequence on Discover tab (stage 8+): Life Map Review → Problem Motivation → Multiplication Reveal → Money Model → First Income. Money Model card shows dome readiness per business model (unlocked/locked based on dome edges).

Key files: `DirectionSection.jsx`, `MoneyModelCard.jsx`, `moneyModelLadder.js`, `domeBusinessModels.js`.

### 8. Creator Playbook Pipeline

Sequential: Remarkable Results → Reach → Growth → Scale Score. Creator Position Card (personal monopoly finder). Spider graph on Growth tab. Gamification via `creatorGamification.js`.

### 9. Other Features

- **Zarlo V2 AI Guide**: Floating widget. Dome insight + interior scoreboard rules injected into prompt. Never says "dome" to user. `zarloEngine.js`.
- **Figurine Mentor**: Bottom-left FAB. 3 convos/day. `useFigurine.js`.
- **Play Profile**: 33 experience creators matched via 5D Euclidean distance. `founder_dna_results`.
- **Experience Creator Matching**: 59 creators, 6 archetypes, per-layer recommendations.
- **Scope Map**: River system diagnostic (Stream/Lake/Waterfall/River) at `/create`.
- **Fantasy League**: Solo 4-week seasons. 3 scoring categories. `score-league-matchups` edge function.
- **CRM**: Three towers (Attract/Nurture/Tools). 20+ services in `src/lib/crm/`.
- **Stripe**: Consumer stages 1-7 locked. Creator: `CreateGate.jsx`. Webhook: `stripe-webhook/index.ts`.
- **PlaySkill Taxonomies**: 10 skills, 12 problems. Lookup via `wheelTaxonomy.js`.

## Architecture Patterns

### Dimension Lookups (IMPORTANT)
Always import from `src/data/domeDimensions.js`, never redefine dimensions inline:
```javascript
import { DOME_DIMENSIONS, getDimensionById, DIFFICULTY_SCALE } from '../data/domeDimensions'
```

### Taxonomy Lookups (IMPORTANT)
Always use compat-aware functions, never raw `.find()`:
```javascript
import { findSkillSegment, resolveSkillId } from '../lib/wheelTaxonomy'
```

### Cluster Archiving (IMPORTANT)
When Life Map re-runs, only archive UNRATED clusters. User-rated clusters must survive re-runs.

### Shared Score Utilities
Always use `src/lib/scoreUtilities.js` for Clarity and Action Score. Never inline the formula.

### Design Consistency (IMPORTANT)
**Light theme** throughout. Never dark backgrounds. Match `#f5f5f0` or white. Brand purple/gold for accents. Use `src/styles/flow-base.css` before inventing.

### CSS Scoping
Always scope to parent: `.see-your-flow .entry-card { }` not `.entry-card { }`

### Fixed Bottom Buttons
Constrain to app container: `left: 50%; transform: translateX(-50%); max-width: 480px;` + `env(safe-area-inset-bottom)`.

## Writing Style

- **Never use em dashes** in user-facing copy. Use commas, full stops, or rephrase.
- **Write so a 12-year-old would understand.** No jargon. Replace technical terms with plain language.

## Pixar Image Generation

Gemini 3.1 Flash. Include in ALL prompts: "Pixar 3D cinematic animation style" with subsurface scattering, expressive eyes, volumetric lighting. Must be 3D (not 2D/watercolor). End with "No text or words." See `docs/dev-guides/page-component-design-guide.md` section 7.

## Database Schema

### Core
`user_stage_progress` | `user_projects` | `flow_sessions` | `flow_entries` | `milestone_completions` | `quest_completions` (aftertaste text, aftertaste_week_later text) | `user_level_progress` | `boss_fight_sessions`

### Dome of Safety + Prediction Error
`groan_challenges` additions: `dimension_values` jsonb, `predicted_difficulty` smallint (1-5, write-once trigger), `predicted_at`, `preaction_difficulty` smallint (1-5), `experienced_difficulty` smallint (1-5), `experienced_at`, `gap_voice` text | `voice_pattern_prompts` (user_id, voice, primary_dimensions, UNIQUE user_id+voice+dims) | `pattern_healing_responses` (user_id, voice, primary_dimensions, fear/origin/insight/rewire/expectation text, UNIQUE user_id+voice)

### Quests + Courage
`quests` (skill_tags text[], branch text, is_current_job bool, current_dimensions jsonb, career_vector text, format_picks text[], precursor_level text, dream_dimensions jsonb, staying_fuels text[], path_fuels text[], buts text[], fear_outcome text, identity_declaration text, protective_voice text) | `quest_tasks` (task_signal text, node_id text) | `groan_challenges` | `healing_intentions` (quest_task_id FK, pattern, fear/origin/insight/rewire/expectation text, healing_stage)

### Clusters + Skills
`nikigai_clusters` (resonance_state, behavioral_evidence, skill_tags, problem_tags) | `user_skill_progress` (user_id, skill_id, xp, level) | `curiosity_clusters`

### Life Paths
`life_path_sessions` (careers JSON, stuck_points JSON) | `curiosity_inputs`

### Other
`nervous_system_checkins` (before_state, after_state, source_challenge_id) | `experience_checkins` | `weekly_reviews` | `founder_dna_results` | `scope_map_results` | `remarkable_angles` | `narrative_builders` | `access_architectures` | `scale_diagnostics` | `lead_captures` | `user_subscriptions` | `pending_subscriptions` | `push_subscriptions` | `zarlo_conversations`

RPCs: `increment_skill_xp`, `increment_behavioral_evidence`, `get_user_id_by_email`

## Environment Variables

**`.env.local`**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `ANTHROPIC_API_KEY`, `VITE_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_EMAIL`

## Quick Commands

```bash
npm run dev            # Dev server (consumer)
npm run dev:creator    # Dev server (creator mode)
npm run build          # Production build (consumer)
npm run build:creator  # Production build (creator)
```

## Key Documentation

- `docs/dev-guides/DEVELOPMENT_PATTERNS.md` — **Required for flow/challenge work**
- `docs/dev-guides/page-component-design-guide.md` — **Required before creating UI**
- `docs/features/dome-of-safety-spec.md` — **Dome of Safety full spec**
- `docs/features/prediction-error-spec.md` — **Prediction error + gap measurement**
- `docs/frameworks/zone-calibration-framework.md` — Zone Calibration (Original IP)
- `docs/features/experience-dome-deep-dive.md` — Deep dive Layer 1 (format sub-nodes) + Layer 2 (career vectors)
- `docs/features/try-ambition-radar-spec.md` — Ambition Radar lead magnet spec
- `docs/INDEX.md` — Thematic index of all living docs

## MCP Session Sync

MCP server tracks user's self-knowledge graph. At session end, offer to sync via `commit_progress`. Directory mapping: Findmyflow → Vibe Rise quest, TTT → Travel Experience Host, Landingpages → Buy Headsets. Full flow: `docs/features/mcp-session-sync-handoff.md`.

## Links

- **Consumer**: https://viberise.nichuzz.com | **Creator**: https://create.nichuzz.com
- **Repo**: https://github.com/Nic-Huzz/findmyflow | **Supabase**: https://supabase.com/dashboard/project/qlwfcfypnoptsocdpxuv
