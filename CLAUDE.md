# Vibe Rise - Claude Guide

## Maintaining This File

This file is the primary context Claude reads before every conversation. Keep it accurate and concise.

**What belongs here:**
- Project overview and conceptual model (the "why" behind the product)
- Tech stack, folder structure, routes (current state only)
- Key features described at the level needed to orient, not exhaustive implementation detail
- Architecture patterns and conventions you'd get wrong without being told (taxonomy lookups, CSS scoping, brand colors)
- Gotchas, traps, and "always do X" rules
- Database table names with key columns
- Environment variables, quick commands, links

**What does NOT belong here:**
- Changelogs or "Recent Updates" sections. That's git history. When a feature ships, update its entry in Key Features in-place rather than appending a dated bullet.
- Implementation details derivable from reading the code (component props, hook internals, exact line counts)
- Debugging notes or fix recipes. The fix is in the code; the commit message has the context.
- Anything that duplicates a referenced doc. Point to the doc instead.
- Session-specific context or in-progress work (use tasks or plans for that)

**When updating:**
- Edit existing sections in-place. Never append a new "Updates" section.
- If a feature is replaced, remove the old description entirely.
- If a route is removed or redirected, update the Routes section.
- Keep the file under ~400 lines. If it's growing, something should be extracted to `docs/`.

## Overview

Personal development web app helping burnt-out professionals discover their ideal career path. Built on **Nikigai** framework (Nic + Ikigai). Users complete AI-guided "flows" to identify skills, problems they solve, and ideal customers.

**The Journey Story (Zone Calibration Framework):**

Users arrive at Vibe Rise at **The Crack** or after sitting in **Head Full of Dreams** too long. The app's job is to move them along the Sprouter diagonal toward **Self-Actualisation** (self-knowledge + action moving together).

- **0,0 → Unfulfilment → The Crack**: This happened before the app. The user's constructed life stopped working. Burnout, breakdown, or a moment of honest self-confrontation brought them here.
- **Head Full of Dreams (Paralysis Zone)**: Where most users ARE when they sign up. Self-knowledge is emerging but action hasn't caught up. They can see what they want but can't move toward it.
- **Self-Actualisation (The Diagonal)**: Where the app takes them. Action proportional to self-knowledge. Moving in alignment.

**The two axes of the Sprouter Sweet Spot map to app features:**
- **X axis (Self-Knowledge)** = Repair phase: Flow Finder, Play-List, Healing, Archetypes. Building self-knowledge, removing what was installed that wasn't yours.
- **Y axis (Action)** = Build phase: Business stages 1-7. Taking aligned action from that self-knowledge. The business IS the action that turns Head Full of Dreams into Self-Actualisation.

**Onboarding must deliver three things:**
1. "I feel so seen" — the diagnostic mirrors them so accurately they screenshot it
2. "Now I have words for it" — the framework language is a gift, not a lecture. Users leave with vocabulary they've never had for their experience
3. "This is the coolest thing I've ever seen" — the visual experience is so premium they're genuinely excited

**Vibe Rise's value proposition**: We build your X axis so your Y axis stops wasting your life.

**Core Offer (Hormozi Grand Slam)**: "I'll teach you to design experiences that create lasting shifts, fill the room every time, and make a living doing what you love. You get the method (Shift Architecture), the tools (Vibe Rise), the community (weekly group), and the equipment (headsets). No one else offers all four."

**App segmentation**: `/7-day-challenge` is for everyone. `/create` is specifically for experience creators. Vibe Seekers still use the app; if their flow turns out to be experience creation, they naturally enter the creator track.

See `docs/zone-calibration-framework.md` for the full theoretical framework (Original IP: Huzz Hurrell).

## Tech Stack

React 18 + Vite + React Router v7 | Supabase (PostgreSQL, Auth, Edge Functions) | Anthropic Claude API | Vercel | Web Push API

**Brand Colors**: Purple (#5e17eb) → Gold (#E9A23B) ombre gradient. Based on Alex Hormozi's $100M Offers framework.

## Folder Structure

```
src/
├── flows/                    # Flow components
│   ├── MoneyModelFlowBase.jsx      # Shared base (6 flows use this)
│   ├── moneyModelConfigs.js        # Money Model configurations
│   ├── ScopeMapFlow.jsx            # Vibe Rise river diagnostic
│   ├── EssenceMirrorFlow.jsx       # Essence archetype discovery
│   ├── ExperienceCreatorFlow.jsx   # Experience creator matching
│   ├── ZoneDiagnosisFlow.jsx       # Level zone diagnosis
│   ├── *OfferFlow.jsx              # Attraction, Upsell, Downsell, GrandSlam
│   ├── FunnelCalculator.jsx        # Stage 8 metrics tracker
│   └── NervousSystemFlow.jsx, HealingCompass.jsx, etc.
│
├── hooks/
│   ├── useChallengeData.js   # Challenge state management
│   ├── useCapacityScore.js   # Weekly Capacity Score (0-100, state-based)
│   ├── useLeagueData.js      # Fantasy league state management
│   ├── useMatchupData.js     # Live matchup scoring + opponent fetch
│   ├── useNewsfeed.js        # League activity feed + reactions
│   ├── useCelebrations.js    # Confetti, toasts, level-up animations
│   ├── useExecute.js         # Execute page operations
│   └── useAutoSave.js, useSteppedForm.js
│
├── components/
│   ├── crm/                  # CRM components
│   │   ├── CRMLayout.jsx           # Wrapper with nudge engine
│   │   ├── Content*.jsx            # Generator, Planning, Checklist, etc.
│   │   ├── Weekly*.jsx             # Planning, Reflection, etc.
│   │   ├── Lead*.jsx               # Capture, Score, Sliders
│   │   ├── Story*.jsx              # Miner, Bank
│   │   ├── CSVImport/              # 6-step import wizard
│   │   ├── EcosystemStatusWidget   # Business flywheel progress
│   │   └── *Widget.jsx, *Modal.jsx # Intelligence, Activity, etc.
│   │
│   ├── CreatorHome/                # Creator portal home
│   ├── onboarding/QuickCapture/    # 5-step business capture
│   ├── Zarlo/                      # AI Co-Founder widget
│   ├── Celebrations/               # Confetti, FloatingPoints, etc.
│   ├── level/                      # LevelConfig, LevelTab, SweetSpotGraph, CapacityCard
│   │
│   ├── league/               # LeagueLeaderboard.jsx
│   ├── PlayProfile/          # Quiz, Dashboard, DNA, AI Diagnostic, Challenge
│   ├── BusinessSetup.jsx     # Stage 0.9 setup wizard
│   ├── Challenge*.jsx        # Header, Filters, etc.
│   ├── *QuestInput.jsx       # Groan, Recognise, Rewire, Release, etc.
│   ├── GroanMatrix.jsx       # Wahoo Map (2D courage challenge matrix)
│   ├── WahooCreator.jsx      # Two-path Wahoo creation (free text or browse)
│   ├── PlaySkillPicker.jsx   # Level 0 play-skill category picker
│   ├── TuneTab.jsx           # Tune tab (daily practices + drains)
│   ├── DailyCheckin.jsx      # Daily 4-state check-in overlay
│   ├── QuestCard.jsx         # Unified quest rendering
│   ├── FlowMapRiver.jsx      # River visualization
│   └── SeeYourFlow.jsx       # Journey mapping
│
├── pages/crm/                # CRM pages
│   ├── Dashboard.jsx         # Command center with DailyActions, EcosystemWidget
│   ├── Attract.jsx, Nurture.jsx, Tools.jsx  # Tower hubs
│   ├── Content*.jsx          # Create, Queue, History
│   ├── Sales*.jsx, Contacts.jsx, EmailSequences.jsx, WarmOutreach.jsx
│   ├── DataImport.jsx        # CSV import wizard
│   ├── BusinessSystems.jsx   # Flywheel checklist (4 phases)
│   └── *Calculator.jsx, Analytics.jsx, etc.
│
├── lib/
│   ├── supabaseClient.js     # Database connection
│   ├── stageConfig.js        # 10-stage system with ombre colors
│   ├── graduationChecker.js  # Project graduation logic
│   ├── haptics.js            # Mobile vibration feedback
│   ├── aiHelper.js           # Claude AI integration
│   ├── league/               # leagueConfig.js, leagueService.js, leagueScoring.js
│   ├── founderDnaAI.js       # Play Profile AI challenge generation
│   ├── dnaMatching.js        # Founder DNA matching algorithm
│   ├── zarlo/                # zarloEngine.js, zarloPageContent.js
│   ├── crm/                  # 20+ services (contentContext, promptTemplates, towerStats, csvImportService, ecosystemService)
│   └── templates/            # AI prompt templates
│
├── data/                     # Static config (personas, archetypes, beliefs, essenceArchetypes, founderDnaGames, founderDnaStuckPoints)
├── pages/league/             # LeagueOverview, WeekMatchups, MatchupDetails, ContentSubmit, NewsfeedPage, LeagueAdmin
├── styles/flow-base.css      # Shared flow styles
├── App.jsx, AppRouter.jsx, Challenge.jsx, Profile.jsx
└── AuthGate.jsx              # Protected route wrapper

supabase/
├── functions/                # Edge Functions (classify-scope-map, essence-mirror-blend, generate-avatar-gemini, score-league-matchups, etc.)
└── migrations/               # Database migrations

public/                       # Static assets, flow JSON definitions, data JSON files
scripts/                      # db-query.sh, deploy-functions.sh
docs/                         # Documentation files
```

## Routes

**Core**: `/` (Landing) | `/log-in` (Auth) | `/me` (Profile) | `/7-day-challenge` | `/library` | `/flow-compass` | `/feedback` | `/hero-profile` | `/guidebook`

**Onboarding**: `/get-started` (PlaySkills onboarding), `/essence-mirror` (essence archetype discovery), `/essence-identify`, `/protective-identify`

**Journey Levels**: `/zone-diagnosis/:levelNumber` (zone diagnosis flow), `/tension-assessment` (tension diagnostic)

**Create Portal**: `/create` (Creator Portal home), `/create/experience/new`, `/create/experience/:id`

**Direction**: `/career-clarity` (Career Clarity Quiz, public), `/people` (People Matching, AuthGate), `/experience-creators` (Experience Creator Matching)

**Archetypes**: `/archetypes`, `/archetypes/essence`, `/archetypes/protective`

**Life Map**: `/life-map` (replaces old `/nikigai/*` routes, which redirect here)

**Money Model**: `/attraction-offer`, `/upsell-offer`, `/downsell-offer`, `/continuity-offer`, `/leads-strategy`, `/offer-builder`, `/lead-magnet-selection`, `/product-selection`, `/funnel-builder`, `/funnel-calculator`

**Play Profile**: `/play-profile` (quiz + dashboard), `?mode=retake`, `?mode=unstuck`, `?mode=rate`

**Fantasy League**: `/league`, `/league/week`, `/league/matchup`, `/league/submit`, `/league/guide`, `/league/admin`, `/fantasy` (landing)

**Public Trials**: `/try/offer/:flowType`, `/try/nervous-system`, `/try/flow-audit`, `/try/earthquake`, `/try/play-profile`, `/try/career-clarity`, `/try/experience-creators`

**Social**: `/play-list-feed`, `/play-list-feed/:postId`, `/newsfeed`

**Other Flows**: `/nervous-system`, `/healing-compass`, `/curiosity-compass`, `/identify-topics`, `/mind-space`, `/persona-selection`, `/validation-flows`, `/v/:shareToken` (public share)

**CRM** (`/crm/*`): Dashboard | Attract, Nurture, Tools (tower hubs) | content-create, content-queue, content-history | marketing, pages, sales, scripts, contacts, email-sequences, warm-outreach | execute, reports, performance | ptuf, ltv, cac | import, tools/systems, tools/expenses | setup, setup/business-baseline, setup/customer-segments, setup/competitor-snapshot | ascension, objections, implementations, assets, alerts, sales-playbook

**Redirects**: `/business` → `/create`, `/nikigai/*` → `/life-map`, `/shadow-work` → `/life-map`

## Key Features

### 1. Universal 10-Stage System

| Stage | Name | Color | Focus |
|-------|------|-------|-------|
| 0 | Flow Finder | #5e17eb | Discover skills/problems/personas (always accessible) |
| 0.5 | Play-List | #6d26d7 | Courage challenges via Groan Matrix (always accessible, user-level) |
| 0.9 | Setup | — | Business setup, project creation + product identification (unlocks stages 1-7) |
| 1-7 | Validation → Launch | gradient | Progressive project stages (paid, except "Understand X" explainers) |
| 8 | Tracking | #E9A23B | Funnel metrics (always accessible) |

Stage flags: `alwaysAccessible`, `isUserLevel`, `isGroansStage`

### 2. Journey Progression System (9 Levels)

Getting Set Up (0) → Identity (1) → Vulnerability (2) → Direction (3) → Enough (4) → Growth (5) → Execution (6) → Passion-Risk (7) → Play (8). Each level has: Sweet Spot graph, Zone Diagnosis flow, Deep Dive, Boss Fight, Milestone, 3 progress bars (quests/healing/courage).

**Zone Diagnosis** (`/zone-diagnosis/:levelNumber`): Graph → Zone Explainer → Zone Pick → Protective Voices (conditional) → Boss Reveal. Protective voices: topLeft = Performer/Controller/People Pleaser, bottomRight = Perfectionist/Ghost.

Key files: `src/components/level/LevelConfig.js`, `LevelTab.jsx`, `SweetSpotGraph.jsx`, `src/flows/ZoneDiagnosisFlow.jsx`

### 3. Essence Mirror (First-Time Onboarding)

9-step essence discovery at `/essence-mirror`. Hook slides → 12 swipeable superpower cards (That's me / Not me) → Vision confirmation with Pixar scene cards → Pixar essence pick → AI Mirror reveal (Haiku blends primary + secondary archetype) → Hero avatar generation (Gemini 3.1 Flash + GPT-4o fallback) → Name hero → Save.

**12 Essence Archetypes**: Radiant Rebel, Playful Creator, Sacred Jester (Activator), Mystic Messenger, Truth-Teller, Heart Alchemist (Transmuter), Grounded Guardian, Heart Holder, Rhythm Architect (Stabilizer), Wise Sage, Cosmic Connector, Compassionate Leader (Bridger).

Key files: `src/flows/EssenceMirrorFlow.jsx`, `src/data/essenceArchetypes.js`, edge functions `essence-mirror-blend/`, `generate-avatar-gemini/`

### 4. Scope Map Diagnostic (Vibe Rise / River System)

3-question diagnostic at `/create` classifying users into: The Stream (specific + low self-knowledge), The Lake (broad + low), The Waterfall (specific + high), The River (broad + high). AI classification via Haiku edge function `classify-scope-map`. Stage-specific prescriptions route differently (Stream → Flow Finder, Lake/Waterfall/River → ExperienceCreate).

Key files: `src/flows/ScopeMapFlow.jsx`, `src/components/ScopeMap.jsx` (2x2 SVG). DB: `scope_map_results`. Framework: `docs/root-and-reach-framework.md`. Original IP: Huzz Hurrell.

### 5. Experience Creator Matching

Users browse 59 experience creators organized by 6 business model archetypes, select who they resonate with, and receive a per-layer product suite recommendation (attraction/core/scale/continuity) with "hell yes or not quite" validation. 318-person corpus (75 founders + 243 non-founders). Pixar-style portraits via Gemini 3.1 Flash.

Key data: `public/data/experienceCreatorDNA.json` (247 DNA profiles), `public/data/experienceCreatorOfferMap.json`, `public/images/creators/`. Brief: `docs/feature-brief-experience-creator-matching.md`.

### 6. 7-Day Challenge System (Vibe Rise Maintenance Engine)

**Tabs**: Level → Tune → Play-list → Healing. Layout: Header (streak + Wahoo Counter ⚡ + score pills + Rise bar) → Category tabs → Tab content.

**Vibe Rise Equation**: `Sustained Vibe Rise = (Practices + Wahoos + Healing) ÷ (Drains)`. All state data flows through `nervous_system_checkins` table. Capacity Score (0-100) displayed on Level tab.

**Level tab**: Journey progression (9 levels), zone diagnosis, boss fights, milestones, CapacityCard. Courage counts re-enabled (L1=1...L7=3, total 15 Wahoos). PlaySkillPicker at Level 0.

**Tune tab** (`TuneTab.jsx`): Daily maintenance deposits. 4 sections: Daily Practices (6 items, inline 2-option state check: Safe/Vibe Rise), Reconnect (opens HealingCompletionModal), Rest (inline), Drains (5 categories + note + 2-option: Activated/Shutdown).

**Play-list tab** (`PlayListTab.jsx`): WahooCreator (two-path: "I know" free text or "Help me find one" browse categories) + Active Wahoos + Wahoo Map link.

**Healing tab**: Recognise, Release, Rewire only (blockage clearing). After-only 4-state check-in (before step removed).

**Scoring**: Points are RP (Rise Points). Header pills: ☀️ Tune (green) | 🔥 Wahoos (gold) | 💜 Healing (purple). State values: dorsal=-2, sympathetic=-1, ventral=+1, vibe_rise=+2.

**Daily check-in**: 4-state overlay on page load (Vibe Rise/Safe/Activated/Shutdown). Once per day, skippable.

**"Was that a Wahoo?"**: Post-Wahoo classification: Hell yes (vibe_rise, gold confetti) / Felt alive (vibe_rise) / Just did it (ventral). User self-report replaces AI scores.

**Forgiving streak**: 1 day miss allowed without breaking streak.

Key files: `Challenge.jsx`, `useChallengeData.js`, `TuneTab.jsx`, `PlayListTab.jsx`, `WahooCreator.jsx`, `ChallengeHeader.jsx`, `GroanCompletionModal.jsx`, `HealingCompletionModal.jsx`, `DailyCheckin.jsx`, `useCapacityScore.js`

Key docs: `docs/vibe-rise-ecosystem-architecture.md`, `docs/vibe-rise-challenge-alignment.md`

### 7. Wahoo Map (formerly Groan Matrix)

2D matrix: User skills × 5 visibility layers (Screen→Live→Money→Vulnerable→Authority). User-facing name: "Wahoo Map". Internal code: `GroanMatrix.jsx`.

Workflow: generated → accepted → completed. Post-completion: "I Did It!" → 4-state NS check-in → "Was that a Wahoo?" (3 options) → 3% reflection → Share. Completed cells show "Done ×N" badge.

### 8. Play Profile (Founder DNA)

AI-powered assessment: quiz → DNA match → stuck point → AI diagnostic → custom challenge. Modes: default (dashboard), `?mode=retake`, `?mode=unstuck`, `?mode=rate`.

**33 experience creators** matched via 5D Euclidean distance. Sliders: `workRhythm` (Marathon↔Sprints), `fuelType` (Fire↔Purpose), `orientation` (Solo/Deep↔Social/Enterprising, inferred from games), `knowledgeStyle` (Analytical↔Intuitive, inferred from games), `scaleApproach` (Craft↔Empire). DNAReveal shows Pixar creator portraits.

Key data: `public/data/experienceCreatorDNA.json` (33 profiles, v2.0). Old 75-founder dataset at `public/data/founderDnaFounders.json` (unused). Old 221-profile dataset at `public/data/archived/experienceCreatorDNA-221-full.json`.

DB: `founder_dna_results`, `founder_dna_sessions`. Scoring: +10 RP to Play-List on completion.

### 9. PlaySkill & Problem Taxonomies (V2)

**Skills**: 10 plain-English role-skills (storytelling, teaching, coaching, performing, creating, building, designing, leading, connecting, speaking_up). Each has 3-5 "placemakes" (felt examples anchored in famous people).

**Problems**: 12 felt categories (kids_deserved_better, voice_taken, pain_not_believed, world_losing, life_not_yours, feeling_stupid, locked_out, work_treated_nothing, left_behind, forgot_what_for, stopped_wondering, work_hollows). Each has 3-5 placemakes.

Legacy compat: `resolveSkillId`, `findSkillSegment`, `resolveProblemId`, `findProblemSegment`. Key files: `src/lib/wheelTaxonomy.js`, `public/data/playSkillTaxonomyV2.json`, `public/data/problemTaxonomyV2.json`.

### 10. Fantasy League

Solo-player competitive league with 4-week seasons. 3 scoring categories: Play-List (Wahoos/Courage), Healing (Healing/Daily/Weekly), Tune (daily practices). WIN = 3pts, DRAW = 1pt, LOSS = 0pts. Bonus tab archived, exercises move to Fantasy League when reactivated.

Content Submissions: 10 types (2-10pts each), admin-approved. Edge function `score-league-matchups` auto-scores every 15 min.

### 11. CRM Command Center

Three towers:
- **Attract**: Content Generator, Queue/History, Pages, Marketing Hub (PromptGenerator integrated)
- **Nurture**: Contacts (CRUD, lifecycle, tagging), Email Sequences, Warm Outreach (filtered contacts view), Sales Pipeline
- **Tools**: Analytics, Calculators (PTUF/LTV/CAC), Sales Scripts, Execute, Business Systems (4-phase flywheel), CSV Import

Key services: `src/lib/crm/` (contentContext, promptTemplates, towerStats, csvImportService, ecosystemService)

### 12. Other Features

- **Money Model Flows**: 6 flows in `MoneyModelFlowBase.jsx` + `moneyModelConfigs.js`. Each wrapper ~35 lines.
- **Zarlo AI Co-Founder**: Floating widget on all pages. Streams responses, context-aware. Engine: `zarloEngine.js`, `zarloPageContent.js`.
- **Stripe Payment Gating**: Stages 1-7 locked. Free: Flow Finder, Play-List, Healing, Setup, explainers, Stage 4 Attraction Offer, CRM. Key: `useSubscription.js`, `UpgradePrompt.jsx`.
- **Flow Compass** (`/flow-compass`): Energy tracking (N=Flow, E=Redirect, S=Rest, W=Honour). Purple gradient design.
- **Funnel Calculator** (`/funnel-calculator`): Actual + Planner modes. 8-stage pipeline tracking.
- **Library of Answers** (`/library`): Three GradientWheel visualizations from Flow Finder completions.
- **/me Page**: Hero Profile (archetype, level, RP), Flow Journey (HorizontalFlowRiver), Dynamic Quest Section.
- **Hero Profile** (`/hero-profile`): Project-specific hero profile with identity triad.
- **Archetypes** (`/archetypes/essence`): Essence archetype profile, strengths, shadow aspects.
- **Weekly Planning**: 4-phase cycle (Push, Flow, Rest, Launch). Purple gradient; gold selection.

## Architecture Patterns

### Taxonomy Lookups (IMPORTANT)
Always use the compat-aware lookup functions, never raw `.find()`:
```javascript
import { findSkillSegment, resolveSkillId, findProblemSegment, resolveProblemId } from '../lib/wheelTaxonomy'
const seg = findSkillSegment(savedCategoryId) // handles legacy ids
```
Skills field is `placemakes` (not `playSkills`). Use `seg.placemakes || seg.playSkills || []` for backwards compat.
Skills hue: `i * 36` (10 segments). Problems hue: `i * 30` (12 segments). Personas: `i * 30` (12 segments).

### Common Patterns
```javascript
// Hook extraction
const { loading, progress, handleQuestComplete } = useChallengeData()

// Configurable base
function UpsellFlow() { return <MoneyModelFlowBase config={MONEY_MODEL_CONFIGS.upsell} /> }

// Data fetching
const { data, error } = await supabase.from('table').select('*').eq('user_id', userId)

// Auth gating
<Route path="/protected" element={<AuthGate><Component /></AuthGate>} />

// Content context
const context = await getContentContext(userId)

// Haptics
import { hapticLight, hapticMedium, hapticSuccess, hapticError } from './lib/haptics'

// Celebrations
const { celebrateTaskComplete, celebrateLevelUp } = useCelebrations()
```

### CSS Scoping
Always scope to parent: `.see-your-flow .entry-card { }` not `.entry-card { }`

### Shared Flow CSS
Import `src/styles/flow-base.css`. Classes: `.primary-button`, `.secondary-button`, `.welcome-container`, `.resume-prompt`, `.nav-buttons`, `.option-btn`, `.input-group`, `.loading-state`, `.spinner`, `.progress-dots`, `.error-message`

## Writing Style

- **Never use em dashes** (`—` or `--`) in user-facing copy. Use commas, full stops, or rephrase instead. Em dashes are a tell-tale sign of AI-generated text.

## Pixar Image Generation Style

All AI-generated images use Pixar 3D cinematic animation style via Gemini 3.1 Flash. Include this in ALL image prompts:

```
Pixar 3D cinematic animation style — the EXACT rendering quality of Pixar's Inside Out 2, Soul, and Coco.
Smooth subsurface-scattering skin, large expressive eyes with visible iris detail and specular highlights,
slightly exaggerated proportions, volumetric atmospheric lighting with visible light rays, depth of field with subtle bokeh.
```

Must be 3D rendered (NOT 2D/watercolor/flat). End with `"No text or words anywhere in the image."` Use purple→gold brand gradients. See `docs/page-component-design-guide.md` section 7.

## Database Schema

### Core Tables
`user_stage_progress` (persona, onboarding, current_journey_level) | `user_projects` (stage, points) | `flow_sessions` | `flow_entries` (compass) | `milestone_completions` | `quest_completions` | `challenge_instances` | `groan_reflections` | `user_level_progress` | `boss_fight_sessions`

### Flow & Assessment Data
`nikigai_clusters` | `nikigai_responses` | `nikigai_key_outcomes` | `persona_profiles` | `nervous_system_responses` | `healing_compass_responses` | `lead_flow_profiles` | `scope_map_results` | `quiz_results` | `attraction_offer_assessments` | `upsell_assessments` | `downsell_assessments` | `continuity_assessments` | `leads_assessments` | `lead_magnet_assessments` | `offer_builder_assessments` | `funnel_metrics` | `zarlo_conversations`

### CRM Tables
`crm_pages` | `crm_contacts` (includes outreach columns: outreach_status, platform, engagement_type, priority, temperature) | `crm_email_sequences` | `crm_email_steps` | `sales_deals` | `sales_scripts` | `script_usage_log` | `content_history` | `ecosystem_system_progress` | `offer_implementations`

### Fantasy League
`fantasy_leagues` | `fantasy_teams` | `fantasy_team_members` | `fantasy_matchups` | `league_content_submissions` | `league_content_reactions` | `league_signups`

### Play Profile
`founder_dna_results` | `founder_dna_sessions`

### Other
`user_subscriptions` (Stripe) | `push_subscriptions` | `notification_preferences` | `groan_challenges` | `groan_proof` | `groan_contract_evidence` | `groan_outcomes` | `groan_streaks` | `groan_user_preferences`

ENUMs: `groan_visibility_layer` (screen/live/money/vulnerable/authority), `groan_source_type` (skill/problem/persona), `groan_challenge_status` (active/completed/skipped), `groan_outcome_type`

## Environment Variables

**`.env.local`**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `ANTHROPIC_API_KEY`, `VITE_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_EMAIL`

**GitHub Actions**: `SUPABASE_PROJECT_REF` (qlwfcfypnoptsocdpxuv), `SUPABASE_ACCESS_TOKEN`

## Quick Commands

```bash
npm run dev       # Dev server
npm run build     # Production build
npm run db:push   # Apply migrations
```

## Obsidian Brain (Quick Reference)

When working on features, strategy, or content, read the relevant section of the Obsidian vault MOC:
`/Users/nichuzz/Library/Mobile Documents/iCloud~md~obsidian/Documents/Obsidian/Huzz/MOC.md`

| Task | MOC Section to Read |
|------|-------------------|
| New feature design | "Designing a New Feature" |
| Content/marketing | "Writing Content or Marketing" |
| Strategic decision | "Making a Strategic Decision" |
| Workshop/experience | "Designing Experiences / Workshops" |

## Key Documentation

- `docs/DEVELOPMENT_PATTERNS.md` - **Required reading for flow/challenge work**
- `docs/page-component-design-guide.md` - **Required before creating/modifying UI**
- `docs/root-and-reach-framework.md` - **Vibe Rise / River System** (Original IP)
- `docs/root-and-reach-overview-prompt.md` - Shareable framework overview
- `docs/feature-brief-experience-creator-matching.md` - Experience Creator Matching brief
- `docs/crm-status.md` - CRM feature status and audit
- `docs/crm-testing-checklist.md` - 120+ CRM test checkpoints
- `docs/scoring-system-refactor.md` - Points/scoring architecture
- `docs/PUSH_NOTIFICATIONS.md` - Push notification setup
- `docs/2026-01-29-priority-hierarchy.md` - Priority hierarchy and test milestones

## Links

- **Live**: https://viberise.nichuzz.com
- **Repo**: https://github.com/Nic-Huzz/findmyflow
- **Supabase**: https://supabase.com/dashboard/project/qlwfcfypnoptsocdpxuv
