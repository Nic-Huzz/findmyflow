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

**Three products, three categories:**
- **Vibe Rise Sessions** (the CrossFit) — weekly in-person events: Connect → Heal → Wahoo → Close. Brand = category. See `docs/vibe-rise-sessions.md`.
- **Vibe Rise App** (the Nike Run Club / Strava) — consumer progress ledger between sessions. `/7-day-challenge` is for everyone. Digital bridge to physical community, not replacement.
- **Creator Portal / Scale** (the CRM for experience creators) — `/create` tools for hosts to design, validate, and scale experiences. Remarkable Results → Reach → Growth → Scale Score pipeline.

See `docs/frameworks/zone-calibration-framework.md` for the full theoretical framework (Original IP: Huzz Hurrell). See `docs/frameworks/find-my-flow-x-category-pirates.md` for Category Pirates integration and category definitions.

## Tech Stack

React 18 + Vite + React Router v7 | Supabase (PostgreSQL, Auth, Edge Functions) | Anthropic Claude API | Vercel | Web Push API | Capacitor 8 (iOS)

**Two Products, One Repo**: Single codebase produces two branded apps via `VITE_APP_MODE` env var. Vite plugin (`creatorBrandPlugin` in `vite.config.js`) swaps index.html meta, icons, manifest, splash screen, and JSON-LD at build time.

| | Vibe Rise (Consumer) | Scale (Creator) |
|---|---|---|
| Domain | `viberise.nichuzz.com` | `create.nichuzz.com` |
| Vercel project | `findmyflow` | `viberise-creator` |
| Build command | `npm run build` | `npm run build:creator` |
| Output dir | `dist/` | `dist-creator/` |
| Manifest | `manifest.json` | `manifest-creator.json` |
| Icons | `icon-192.png`, `icon-512.png` | `icon-creator-192.png`, `icon-creator-512.png` |
| App ID (iOS) | `com.nichuzz.viberise` | `com.nichuzz.viberise.creator` |
| Capacitor config | `capacitor.config.json` | `capacitor.config.creator.json` |
| Start URL | `/7-day-challenge` | `/create` |
| Routing | Consumer routes; `/create/*` redirects to `/league` | Creator routes; `/` and `/league/*` redirect to `/create` |

**iOS App**: Native iOS wrapper via Capacitor 8 (SPM). Xcode project: `ios/App/App.xcodeproj`. Build: `npm run build` → `npx cap sync` → open in Xcode. Xcode Cloud watches the repo for CI builds.

**Brand Colors**: Purple (#5e17eb) → Gold (#E9A23B) ombre gradient. Both products share the same gradient. Logo font: Inter 900.

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
│   ├── WahooCreator.jsx      # Wahoo creation (free text + bucket list)
│   ├── WahooDiscoveryFlow.jsx # First-visit Wahoo tab flow (3 category pages)
│   ├── WahooInspiration.jsx  # "Need inspiration?" (play-skills + Ikigai Mix)
│   ├── PlaySkillPicker.jsx   # Play-skill category picker (inspiration engine)
│   ├── TuneTab.jsx           # Tune tab (daily practices + drains)
│   ├── DailyCheckin.jsx      # Daily 4-state check-in overlay
│   ├── WeeklyReview.jsx      # Weekly multiplier review wizard
│   ├── WeeklyReviewCard.jsx  # Shareable weekly review card
│   ├── QuestBoardCard.jsx    # Collapsible quest card (life path + tasks + healing prompt)
│   ├── QuestSelector.jsx     # Reusable quest picker dropdown (used by Healing + Courage)
│   ├── HealingFlowModal.jsx  # 7-step per-task healing flow
│   ├── HealingIntentionsList.jsx # Healing tab content (intentions + standalone input)
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

**Create Portal**: `/create` (Creator Portal home), `/create/experience/new`, `/create/experience/:id`, `/create/remarkable` (Remarkable Results), `/create/narrative-builder` (Remarkable Reach), `/create/access-architecture` (Remarkable Growth), `/create/scale-diagnostic` (Scale Score, old `/scale-diagnostic` redirects), `/try/facilitator-score` (Scale Score public lead magnet)

**Direction**: `/career-clarity` (Career Clarity Quiz, public), `/people` (People Matching, AuthGate), `/experience-creators` (Experience Creator Matching)

**Archetypes**: `/archetypes`, `/archetypes/essence`, `/archetypes/protective`

**Life Map**: `/life-map` (replaces old `/nikigai/*` routes, which redirect here)

**Money Model**: `/attraction-offer`, `/upsell-offer`, `/downsell-offer`, `/continuity-offer`, `/leads-strategy`, `/offer-builder`, `/lead-magnet-selection`, `/product-selection`, `/funnel-builder`, `/funnel-calculator`

**Play Profile**: `/play-profile` (quiz + dashboard), `?mode=retake`, `?mode=unstuck`, `?mode=rate`

**Fantasy League**: `/league`, `/league/week`, `/league/matchup`, `/league/submit`, `/league/guide`, `/league/admin`, `/fantasy` (landing)

**Public Trials**: `/try/offer/:flowType`, `/try/nervous-system`, `/try/flow-audit`, `/try/earthquake`, `/try/play-profile`, `/try/career-clarity`, `/try/experience-creators`

**Social**: `/play-list-feed`, `/play-list-feed/:postId`, `/newsfeed`, `/community` (Feed + Tasks tabs, `?tab=tasks` deep link)

**Self-Knowledge Flows**: `/curiosity-map` (curiosity mapping → clusters), `/life-paths` (career tagging → quest + courage challenge creation), `/career-alignment` (career alignment check), `/life-map` (life story chapters)

**Other Flows**: `/nervous-system`, `/healing-compass`, `/curiosity-compass`, `/identify-topics`, `/mind-space`, `/persona-selection`, `/validation-flows`, `/v/:shareToken` (public share)

**CRM** (`/crm/*`): Dashboard | Attract, Nurture, Tools (tower hubs) | content-create, content-queue, content-history | marketing, pages, sales, scripts, contacts, email-sequences, warm-outreach | execute, reports, performance | ptuf, ltv, cac | import, tools/systems, tools/expenses | setup, setup/business-baseline, setup/customer-segments, setup/competitor-snapshot | ascension, objections, implementations, assets, alerts, sales-playbook

**Redirects**: `/business` → `/create`, `/nikigai/*` → `/life-map`, `/shadow-work` → `/life-map`, `/scale-diagnostic` → `/create/scale-diagnostic`

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

### 2. Quest Board + Zone Assessments

The old 9-level sequential system is flattened into a quest board. Quests = life paths being actively pursued (from Life Paths exercise or manually added). Each quest has tasks, some tagged as courage challenges (synced to `groan_challenges`).

**Zone Assessments** (8 levels, browse-at-your-own-pace): Identity (1) → Vulnerability (2) → Direction (3) → Enough (4) → Growth (5) → Execution (6) → Passion-Risk (7) → Play (8). Each has a 2x2 Sweet Spot graph with 3 zones (topLeft/diagonal/bottomRight). Horizontal scroll strip on Quests tab, tap to open modal with graph + diagnosis CTA.

**Zone Diagnosis** (`/zone-diagnosis/:levelNumber`): Graph → Zone Explainer → Zone Pick → Protective Voices (conditional) → Boss Reveal. Protective voices: topLeft = Performer/Controller/People Pleaser, bottomRight = Perfectionist/Ghost.

Key files: `src/components/level/LevelConfig.js`, `LevelTab.jsx`, `QuestBoardCard.jsx`, `SweetSpotGraph.jsx`, `src/flows/ZoneDiagnosisFlow.jsx`. DB: `quests`, `quest_tasks`, `user_level_progress`.

### 3. Essence Mirror (First-Time Onboarding)

9-step essence discovery at `/essence-mirror`. Hook slides → 12 swipeable superpower cards (That's me / Not me) → Vision confirmation with Pixar scene cards → Pixar essence pick → AI Mirror reveal (Haiku blends primary + secondary archetype) → Hero avatar generation (Gemini 3.1 Flash + GPT-4o fallback) → Name hero → Save.

**12 Essence Archetypes**: Radiant Rebel, Playful Creator, Sacred Jester (Activator), Mystic Messenger, Truth-Teller, Heart Alchemist (Transmuter), Grounded Guardian, Heart Holder, Rhythm Architect (Stabilizer), Wise Sage, Cosmic Connector, Compassionate Leader (Bridger).

Key files: `src/flows/EssenceMirrorFlow.jsx`, `src/data/essenceArchetypes.js`, edge functions `essence-mirror-blend/`, `generate-avatar-gemini/`

### 4. Scope Map Diagnostic (Vibe Rise / River System)

3-question diagnostic at `/create` classifying users into: The Stream (specific + low self-knowledge), The Lake (broad + low), The Waterfall (specific + high), The River (broad + high). AI classification via Haiku edge function `classify-scope-map`. Stage-specific prescriptions route differently (Stream → Flow Finder, Lake/Waterfall/River → ExperienceCreate).

Key files: `src/flows/ScopeMapFlow.jsx`, `src/components/ScopeMap.jsx` (2x2 SVG). DB: `scope_map_results`. Framework: `docs/frameworks/root-and-reach-framework.md`. Original IP: Huzz Hurrell.

### 5. Experience Creator Matching

Users browse 59 experience creators organized by 6 business model archetypes, select who they resonate with, and receive a per-layer product suite recommendation (attraction/core/scale/continuity) with "hell yes or not quite" validation. 318-person corpus (75 founders + 243 non-founders). Pixar-style portraits via Gemini 3.1 Flash.

Key data: `public/data/experienceCreatorDNA.json` (247 DNA profiles), `public/data/experienceCreatorOfferMap.json`, `public/images/creators/`. Brief: `docs/features/matching-dna/feature-brief-experience-creator-matching.md`.

### 6. 7-Day Challenge System (Vibe Rise Maintenance Engine)

**Tabs**: Journey → Quests → Tune → Courage. Layout: Header (streak + score pills + Rise bar) → Category tabs → Tab content. Tab unlock: Journey + Tune always open. Quests unlocks when life paths completed. Courage unlocks via "Unlock →" button in Getting Started (Journey tab).

**Vibe Rise Equation**: `Sustained Vibe Rise = (Practices + Wahoos + Healing) ÷ (Drains)`. All state data flows through `nervous_system_checkins` table. Capacity Score (0-100) displayed on Level tab.

**Quests tab** (`LevelTab.jsx`): Flat quest board replacing the old 9-level system. Sections: Your Journey (onboarding items, hidden once all complete) → Active Quests (life paths being pursued, with task checklists via `QuestBoardCard`) → I need help with... (struggle pills revealing deep dive flows) → Zone Assessments (horizontal scroll strip of 8 level cards with tap-to-open modals) → Completed (closed quests + finished journey items). Add Quest form: dropdown of life paths from `life_path_sessions` (auto-fills state) or manual entry with 4-state picker. Old level system hidden in `display: none` wrapper for backwards compat. DB: `quests`, `quest_tasks`.

**Tune tab** (`TuneTab.jsx`): Daily maintenance deposits. 5 sections: Daily Practices (6 items, inline 2-option state check: Safe/Vibe Rise), Reconnect (opens HealingCompletionModal), Rest (inline), Drains (5 categories + note + 2-option: Activated/Shutdown), Experience Check-in (predict activity outcomes, "How did it go?" closure, wahoo conversion). Weekly Focus "Value" category (renamed from "Boundary").

**Courage tab** (`PlayListTab.jsx`): "Actions that expand what feels possible for your path." Shows Active Courage Challenges (grouped by quest name) + WahooCreator (free text + depth level + boundary type + protective voice + quest link) + Community Tasks CTA (links to `/community?tab=tasks`). Challenges come from `/life-paths` stuck points (auto-created) or manual WahooCreator entries. Each challenge shows inline healing card if a `healing_intention` exists. WahooInspiration archived.

**Healing tab** (`HealingIntentionsList.jsx`): Per-task healing intentions anchored to quests. Shows active intentions (collapsible cards with pattern/fear/rewire/expectation), in-progress items (tap to resume), resolved items (with outcome). "What's blocking you?" input opens `QuestSelector` to pick a life path, then `HealingFlowModal` (7-step flow: Pattern → Fear → Origin → Insight → Rewire → Go Deeper → Expect the Best). Old Recognise/Release/Rewire exercises removed. DB: `healing_intentions` table linked to `quest_tasks`.

**Per-task healing flow** (`HealingFlowModal.jsx`): Triggered from QuestBoardCard when user tags courage challenge (two-step prompt: "Want to explore?" → "Now or Later?"). 7 steps with auto-save on each advance + save-on-unmount. Step 6 offers Book session with Huzz (Calendly) / Self-guided release (coming soon). Step 7 "Expect the best" with anxiety→excitement trick. Post-task-completion asks "Did the positive outcome happen?" (Yes/No/Something better). Completion stages: in_progress → recognised → released.

**QuestSelector** (`QuestSelector.jsx`): Reusable dropdown for picking or creating a quest. Used by HealingIntentionsList standalone input and WahooCreator. Ensures all courage challenges and healing intentions link back to a life path.

**Scoring**: Points are RP (Rise Points). Header pills: ☀️ Tune (green) | 🔥 Wahoos (gold) | 💜 Healing (purple). State values: dorsal=-2, sympathetic=-1, ventral=+1, vibe_rise=+2. Quest RP: add task=2, complete task=3, achieve quest=10, healing flow=5, outcome check=2. Levels: Getting Started (0) → Habit Builder (100) → Strong Foundation (500) → Vibe Rise (1250) → Vibe Master (2750) → Movement Maker (5750).

**Daily check-in**: 4-state overlay on page load (Vibe Rise/Safe/Activated/Shutdown). Once per day, skippable.

**"How did that feel?"**: Post-courage completion 4-state classification: Vibe Rise (🔥, gold confetti) / Fun (😌) / Pressure (😰) / Uninterested (😶). Followed by identity statement prompt: "Now that I [wahoo], I've proven I'm someone who..." Saves `wahoo_classification` + `identity_statement` to `quest_completions.reflection_text` JSON.

**Forgiving streak**: 1 day miss allowed without breaking streak.

**Weekly Review**: Triggers Sunday/Monday, 7 multiplier questions (Environment, Network, Bet-Sizing, Identity, Compounding, Learning, Attention), 15 RP + 5 for sharing. Produces a shareable canvas card.

Key files: `Challenge.jsx`, `useChallengeData.js`, `LevelTab.jsx`, `QuestBoardCard.jsx`, `HealingFlowModal.jsx`, `HealingIntentionsList.jsx`, `QuestSelector.jsx`, `TuneTab.jsx`, `PlayListTab.jsx`, `WahooCreator.jsx`, `WahooDiscoveryFlow.jsx`, `ChallengeHeader.jsx`, `GroanCompletionModal.jsx`, `DailyCheckin.jsx`, `useCapacityScore.js`, `WeeklyReview.jsx`, `WeeklyReviewCard.jsx`

Key docs: `docs/frameworks/vibe-rise-ecosystem-architecture.md`, `docs/features/challenge/vibe-rise-challenge-alignment.md`

### 7. Wahoo Map (formerly Groan Matrix)

2D matrix: User skills × 5 visibility layers (Screen→Live→Money→Vulnerable→Authority). User-facing name: "Wahoo Map". Internal code: `GroanMatrix.jsx`.

Workflow: generated → accepted → completed. Post-completion: "I Did It!" → 4-state NS check-in → "How did that feel?" (4-state: Vibe Rise/Fun/Pressure/Uninterested) → Identity statement → 3% reflection → Share. Completed cells show "Done ×N" badge.

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

### 12. Creator Playbook Pipeline (Creator Portal)

Sequential flow: each unlocks after the previous is completed. Three card states in `CreatorHomeV2.jsx`: completed (compact row with tick), unlocked (gold CTA card), locked (dimmed with lock icon).

1. **Remarkable Results** (`/create/remarkable`, `RemarkableFlow.jsx`): Find your rule break. Problem → Assumption → Two Worlds → Different → Experience → Compression. Saves to `remarkable_angles`. Produces: rule break statement, remarkability score (U×S×S). Readiness card embeds as collapsible row inside this section.

2. **Remarkable Reach** (`/create/narrative-builder`, `NarrativeBuilderFlow.jsx`): How does your story spread? 8 screens: Intro → Vehicle Deep-Dive (3 screens: Results/New Medium/New Action, each with education, reference creators, anchored diagnostic 1-5, durability badge) → Vehicle Summary ("what would make this a 5?" for each type, pick primary) → Tribal Language (5 questions extracting language from behavior) → Cosign (venue/person/co-facilitator) → Output. All fields mandatory. Saves to `narrative_builders` (includes `vehicle_type`, `vehicle_desc`).

3. **Remarkable Growth** (`/create/access-architecture`, `AccessArchitectureFlow.jsx`): Remove barriers. 5-barrier audit (Price, Time, Friction, Decisions, Identity) with inline recommendations under each score bar → On-Ramp Design with 5-point criteria checklist from audit scores (pass/fail per barrier). Saves to `access_architectures`.

4. **Scale Score** (`/create/scale-diagnostic` + `/try/facilitator-score`, `FacilitatorScore.jsx`): 3-pillar Phase 3 diagnostic (RETURN · BREAK · TRIBAL). Branch selection (10 branches) → 6 questions with branch-specific examples (Ancestral, Body, Identity, Shareability, Format, Rule Break result). Pulls rule break data for logged-in users. Score /15, Phase classification (12+ Phase 3, 9-11 Strong, 6-8 Phase 2.5, <6 Phase 2). Public mode works as standalone lead magnet with email capture. Old `/scale-diagnostic` redirects. Saves to `scale_diagnostics`.

**Positioning Summary** (`PositioningSummary.jsx`): Lives at bottom of Playbook tab (after Your Model, before Actions). Two inputs (life quake + transformation) → AI-generated positioning statement. Collapsed state when statement exists (shows output only with "Edit ↓" toggle). Saves to `lead_flow_profiles`.

Sequential locking: Reach locked until `remarkable_angles` exists, Growth locked until `narrative_builders` exists, Scale Score locked until `access_architectures` exists.

### 13. Other Features

- **Money Model Flows**: 6 flows in `MoneyModelFlowBase.jsx` + `moneyModelConfigs.js`. Each wrapper ~35 lines.
- **Zarlo V2 AI Game Guide**: Floating widget (bottom-right). Phase 1: AI personality + free-text input (5 msgs/session) + streaming greeting. Phase 2: Voiced achievement toasts (MicroToast). Phase 3: Proactive observations after wahoo/checkin/healing (2/day max, ZarloProactiveBubble above FAB). Phase 4: Open loop hooks + weekly countdown. Confidence floor: no Brief + no actions = scripted fallback. Edge function: `agent-chat` (Haiku). Engine: `zarloEngine.js`, `zarloPageContent.js`. Subtitle: "Your game guide".
- **Figurine Essence Voice Mentor**: Bottom-left FAB. AI mentor speaking from the book's worldview (nervous system as bottleneck, curiosities as essence signalling, protective voices as software). 3 conversations/day, 10 messages each. Confidence floor: no Brief + phase < 2 = refuses to improvise. Confidence % on every response. Proactive: FigurineOverlay for stage graduations + monthly cryptic hooks. Edge function: `agent-chat` (Haiku). Key file: `useFigurine.js`.
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

### Design Consistency (IMPORTANT)
The app uses a **light theme** throughout. Never create new components or pages with dark backgrounds (#0a0a14, #1a1a2e, etc.). Match the existing app's light background (`#f5f5f0` or white) and use the brand colours (purple #5e17eb, gold #E9A23B) for accents. Use existing component styles and patterns from `src/styles/flow-base.css` before inventing new ones. The only dark UI is the old standalone HTML mockups in `/public/` which are not part of the app.

### CSS Scoping
Always scope to parent: `.see-your-flow .entry-card { }` not `.entry-card { }`

### Fixed Bottom Buttons
When pinning a CTA button to the bottom of a screen, **always constrain to the app container width** — never span full viewport. Use `left: 50%; transform: translateX(-50%); max-width: 480px;` so the button stays centered within the app column on desktop. Add `padding-bottom` with `env(safe-area-inset-bottom)` for mobile. Match the background gradient to the screen's background color (e.g. `rgba(94, 23, 235, 1)` for purple screens). See `.lm-fixed-bottom` in `LifeMapFlow.css` for reference.

### Shared Flow CSS
Import `src/styles/flow-base.css`. Classes: `.primary-button`, `.secondary-button`, `.welcome-container`, `.resume-prompt`, `.nav-buttons`, `.option-btn`, `.input-group`, `.loading-state`, `.spinner`, `.progress-dots`, `.error-message`

## Writing Style

- **Never use em dashes** (`—` or `--`) in user-facing copy. Use commas, full stops, or rephrase instead. Em dashes are a tell-tale sign of AI-generated text.
- **Write so a 12-year-old would understand.** No jargon in user-facing copy. Replace technical terms with plain language (e.g., "Cognitive Load" → "Decisions", "dorsal vagal" → "at their lowest", "growth lever" → "means more people try it"). Use concrete examples instead of abstract descriptions.

## Pixar Image Generation Style

All AI-generated images use Pixar 3D cinematic animation style via Gemini 3.1 Flash. Include this in ALL image prompts:

```
Pixar 3D cinematic animation style — the EXACT rendering quality of Pixar's Inside Out 2, Soul, and Coco.
Smooth subsurface-scattering skin, large expressive eyes with visible iris detail and specular highlights,
slightly exaggerated proportions, volumetric atmospheric lighting with visible light rays, depth of field with subtle bokeh.
```

Must be 3D rendered (NOT 2D/watercolor/flat). End with `"No text or words anywhere in the image."` Use purple→gold brand gradients. See `docs/dev-guides/page-component-design-guide.md` section 7.

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

### Challenge & Review
`experience_checkins` | `weekly_reviews` | `healing_intentions` (quest_task_id FK, pattern, protective_voice, fear_text, origin_text, insight_text, rewire_text, expectation_text, healing_stage, outcome)

### Life Paths → Quests → Courage Pipeline
`life_path_sessions` (careers JSON, stuck_points JSON, step, safety) | `curiosity_clusters` | `curiosity_inputs`. On `/life-paths` completion: selected careers → `quests` (upsert on user_id+career_id), stuck points → `groan_challenges` (status: active, with depth_level + wahoo_category) + `quest_tasks` (is_courage_challenge: true) + `priority_weekly_picks`. If protective voice selected → `healing_intentions` pre-created. Architecture doc: `docs/architecture/life-paths-quests-courage-pipeline.md`.

### Blow Up Brand Pipeline
`remarkable_angles` | `narrative_builders` (vehicle_type, vehicle_desc) | `access_architectures` | `scale_diagnostics` (score_body, score_culture, score_identity, score_ancestral, score_format, score_irreplaceable, score_rulebreak, branch, total_score, phase_classification) | `lead_captures` (email, source, scores)

### Other
`user_subscriptions` (Stripe) | `push_subscriptions` | `notification_preferences` | `groan_challenges` | `groan_proof` | `groan_contract_evidence` | `groan_outcomes` | `groan_streaks` | `groan_user_preferences`

ENUMs: `groan_visibility_layer` (screen/live/money/vulnerable/authority), `groan_source_type` (skill/problem/persona), `groan_challenge_status` (active/completed/skipped), `groan_outcome_type`

## Environment Variables

**`.env.local`**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `ANTHROPIC_API_KEY`, `VITE_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_EMAIL`

**GitHub Actions**: `SUPABASE_PROJECT_REF` (qlwfcfypnoptsocdpxuv), `SUPABASE_ACCESS_TOKEN`

## Quick Commands

```bash
npm run dev            # Dev server (consumer)
npm run dev:creator    # Dev server (creator mode)
npm run build          # Production build (consumer → dist/)
npm run build:creator  # Production build (creator → dist-creator/)
npm run db:push        # Apply migrations
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

- `docs/dev-guides/DEVELOPMENT_PATTERNS.md` - **Required reading for flow/challenge work**
- `docs/dev-guides/page-component-design-guide.md` - **Required before creating/modifying UI**
- `docs/frameworks/root-and-reach-framework.md` - **Vibe Rise / River System** (Original IP)
- `docs/frameworks/root-and-reach-overview-prompt.md` - Shareable framework overview
- `docs/features/matching-dna/feature-brief-experience-creator-matching.md` - Experience Creator Matching brief
- `docs/INDEX.md` - **Thematic index of all living docs**
- `docs/architecture/scoring-system-refactor.md` - Points/scoring architecture
- `docs/architecture/PUSH_NOTIFICATIONS.md` - Push notification setup
- `docs/strategy/2026-01-29-priority-hierarchy.md` - Priority hierarchy and test milestones

## Links

- **Vibe Rise (Consumer)**: https://viberise.nichuzz.com
- **Scale (Creator)**: https://create.nichuzz.com
- **Repo**: https://github.com/Nic-Huzz/findmyflow
- **Supabase**: https://supabase.com/dashboard/project/qlwfcfypnoptsocdpxuv
