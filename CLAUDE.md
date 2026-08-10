# Find My Flow - Claude Guide

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

Users arrive at Find My Flow at **The Crack** or after sitting in **Head Full of Dreams** too long. The app's job is to move them along the Sprouter diagonal toward **Self-Actualisation** (self-knowledge + action moving together).

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

**Find My Flow's value proposition**: We build your X axis so your Y axis stops wasting your life.

**Core Offer (Hormozi Grand Slam)**: "I'll teach you to design experiences that create lasting shifts, fill the room every time, and make a living doing what you love. You get the method (Shift Architecture), the tools (Find My Flow), the community (weekly group), and the equipment (headsets). No one else offers all four."

**Three products, three categories:**
- **Vibe Rise Sessions** (the CrossFit) — weekly in-person events: Connect → Heal → Wahoo → Close. Brand = category. See `docs/vibe-rise-sessions.md`.
- **Find My Flow App** (the Nike Run Club / Strava) — consumer progress ledger between sessions. `/7-day-challenge` is for everyone. Digital bridge to physical community, not replacement.
- **Creator Portal / Scale** (the CRM for experience creators) — `/create` tools for hosts to design, validate, and scale experiences. Remarkable Results → Reach → Growth → Scale Score pipeline.

See `docs/frameworks/zone-calibration-framework.md` for the full theoretical framework (Original IP: Huzz Hurrell). See `docs/frameworks/find-my-flow-x-category-pirates.md` for Category Pirates integration and category definitions.

## Tech Stack

React 18 + Vite + React Router v7 | Supabase (PostgreSQL, Auth, Edge Functions) | Anthropic Claude API | Vercel | Web Push API | Capacitor 8 (iOS)

**Two Products, One Repo**: Single codebase produces two branded apps via `VITE_APP_MODE` env var. Vite plugin (`creatorBrandPlugin` in `vite.config.js`) swaps index.html meta, icons, manifest, splash screen, and JSON-LD at build time.

| | Find My Flow (Consumer) | Scale (Creator) |
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
├── flows/          # Multi-step flow components (LifeMapFlow, EssenceMirrorFlow, MoneyModelFlowBase, etc.)
├── hooks/          # State hooks (useChallengeData, useCapacityScore, useLeagueData, useCelebrations, etc.)
├── components/     # UI components
│   ├── crm/        # CRM (Content*, Lead*, Story*, CSVImport/, EcosystemStatusWidget)
│   ├── CreatorHome/ # Creator portal (CreatorHomeV2, BlowUpBrandCard, CreatorPositionCard)
│   ├── level/      # Quest system (LevelTab, LevelConfig, SweetSpotGraph, QuestPathMap)
│   ├── Zarlo/      # AI companion widget
│   ├── PlayProfile/ # Founder DNA quiz + dashboard
│   └── [key files] # QuestBoardCard, GroanCompletionModal, WahooCreator, TuneTab, PlayListTab,
│                     HealingFlowModal, WeeklyReview, DailyCheckin, QuestSelector
├── pages/          # Route pages (MirrorPage, CommunityFeed, FacilitatorScore, crm/*)
├── lib/            # Utilities
│   ├── scoreUtilities.js    # Shared Clarity + Action Score + Zone detection
│   ├── skillProgress.js     # Skill XP (atomic RPC)
│   ├── questSkillTagger.js  # Quest → skill_tags (edge function)
│   ├── clusterQuestLinker.js # Cluster ↔ quest linking (Sprint 15, not yet built)
│   ├── zarlo/               # zarloEngine.js, zarloPageContent.js
│   ├── crm/                 # 20+ CRM services
│   └── wheelTaxonomy.js     # Skill/problem/persona taxonomy lookups
├── data/           # Static config (archetypes, taxonomy JSON, founderDna)
└── styles/         # flow-base.css (shared flow styles)

supabase/functions/ # Edge functions (classify-quest-skills, regenerate-cluster, suggest-life-paths, etc.)
supabase/migrations/ # DB migrations
docs/               # Specs, handoffs, research
```

## Routes

**Core**: `/` (Landing) | `/log-in` (Auth) | `/me` (Profile) | `/7-day-challenge` | `/library` | `/flow-compass` | `/feedback` | `/hero-profile` | `/guidebook`

**Onboarding**: `/get-started` (PlaySkills onboarding), `/essence-mirror` (essence archetype discovery), `/essence-identify`, `/protective-identify`

**Journey Levels**: `/zone-diagnosis/:levelNumber` (zone diagnosis flow)

**Create Portal**: `/create` (Creator Portal home), `/create/experience/new`, `/create/experience/:id`, `/create/experience/:id/:nodeKey`, `/create/remarkable` (Remarkable Results), `/create/narrative-builder` (Remarkable Reach), `/create/access-architecture` (Remarkable Growth), `/create/scale-diagnostic` (Scale Score, old `/scale-diagnostic` redirects), `/try/facilitator-score` (Scale Score public lead magnet), `/create/plays` (experience plays library), `/create/growth`, `/create/experiences`, `/create/terminal`, `/create/profile`, `/create/bridge`, `/create/inspiration`, `/create/attraction-stack`, `/create/marketing-campaign`, `/create/scale-income`, `/create/pay-rent`, `/create/build-app` (app builder challenge, subroutes: `/interest`, `/prework`, `/challenge/:number`)

**Direction**: `/career-clarity` (Career Clarity Quiz, public), `/people` (People Matching, AuthGate), `/experience-creators` (Experience Creator Matching)

**Archetypes**: `/archetypes`, `/archetypes/essence`, `/archetypes/protective`

**Life Map**: `/life-map` (replaces old `/nikigai/*` routes, which redirect here). Includes `rate_mirror` screen after nikigai for cluster NS state rating.

**Mirror**: `/mirror` (hidden, no nav links, accessible directly). Clarity home: cluster re-rating, identity statements, skill tree, re-gen flow.

**Money Model**: `/attraction-offer`, `/upsell-offer`, `/downsell-offer`, `/continuity-offer`, `/leads-strategy`, `/offer-builder`, `/lead-magnet-selection`, `/product-selection`, `/funnel-builder`, `/funnel-calculator`

**Play Profile**: `/play-profile` (quiz + dashboard), `?mode=retake`, `?mode=unstuck`, `?mode=rate`

**Fantasy League**: `/league`, `/league/week`, `/league/submit`, `/league/guide`, `/league/admin`, `/fantasy` (landing)

**Public Trials**: `/try/offer/:flowType`, `/try/nervous-system`, `/try/flow-audit`, `/try/earthquake`, `/try/play-profile`, `/try/career-clarity`, `/try/experience-creators`, `/try/essence-mirror`, `/try/ai-diagnostic`, `/try/life-paths`

**Social**: `/play-list-feed`, `/play-list-feed/:postId`, `/newsfeed`, `/community` (Feed + Tasks tabs, `?tab=tasks` deep link)

**Self-Knowledge Flows**: `/curiosity-map` (curiosity mapping → clusters), `/life-paths` (career tagging → quest + courage challenge creation), `/career-alignment` (career alignment check), `/life-map` (life story chapters)

**Other Flows**: `/nervous-system`, `/healing-compass`, `/curiosity-compass`, `/identify-topics`, `/mind-space`, `/persona-selection`, `/validation-flows`, `/v/:shareToken` (public share), `/facilitate/life-paths` (facilitator-run life paths), `/shift-scorecard`, `/quest-map`

**OAuth/MCP**: `/authorize`, `/token`, `/oauth/consent` (OAuth flow for MCP Connectors)

**CRM** (`/crm/*`): Dashboard | Attract, Nurture, Tools (tower hubs) | content-create, content-queue, content-history | marketing, pages, sales, scripts, contacts, email-sequences, warm-outreach | execute, reports, performance | ptuf, ltv, cac | import, tools/systems, tools/expenses | setup, setup/business-baseline, setup/customer-segments, setup/competitor-snapshot | ascension, objections, implementations, assets, alerts, sales-playbook

**Redirects**: `/business` → `/create`, `/nikigai/*` → `/life-map`, `/shadow-work` → `/life-map`, `/scale-diagnostic` → `/create/scale-diagnostic`, `/league/matchup` → `/league`, `/create/strike` → `/create/plays`

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

Key data: `public/data/experienceCreatorDNA.json` (33 DNA profiles, each with `primaryBranch` + `secondaryBranch`), `public/data/experienceCreatorOfferMap.json`, `public/images/creators/`. Brief: `docs/features/matching-dna/feature-brief-experience-creator-matching.md`.

### 6. 7-Day Challenge System (Find My Flow Maintenance Engine)

**Tabs**: Journey → Quests → Tune → Courage. Layout: Header (streak + score pills + Rise bar) → Category tabs → Tab content. Tab unlock: Journey + Tune always open. Quests unlocks when life paths completed. Courage unlocks via "Unlock →" button in Getting Started (Journey tab).

**Vibe Rise Equation**: `Sustained Vibe Rise = (Practices + Wahoos + Healing) ÷ (Drains)`. All state data flows through `nervous_system_checkins` table. Capacity Score (0-100) displayed on Level tab.

**Quests tab** (`LevelTab.jsx`): Flat quest board. Sections: Your Journey (onboarding) → Active Quests (`QuestBoardCard` with progress bar, courage trend emoji row, zone of excellence warning, "lit me up" signal on task completion) → Zone Matrix (Action Score x Clarity, 4 quadrants: Self-Actualisation / Head Full of Dreams / Misguided / Unfulfilment) → I need help with... (struggle pills) → Zone Assessments (8 level cards) → Completed. Add Quest: dropdown from life paths or manual + 4-state picker. Quest creation auto-tags skills via `classify-quest-skills` edge function + shows skill level picker (L0-L4). DB: `quests` (skill_tags text[]), `quest_tasks` (task_signal text).

**Tune tab** (`TuneTab.jsx`): Daily maintenance deposits. 5 sections: Daily Practices (6 items, inline 2-option state check: Safe/Vibe Rise), Reconnect (opens HealingCompletionModal), Rest (inline), Drains (5 categories + note + 2-option: Activated/Shutdown), Experience Check-in (predict activity outcomes, "How did it go?" closure, wahoo conversion). Weekly Focus "Value" category (renamed from "Boundary").

**Courage tab** (`PlayListTab.jsx`): Shows courage counter + identity statement dropdown (expandable, shows "I am someone who..." with reinforcement counts) → Active Courage Challenges (grouped by quest) → WahooCreator → Community Tasks CTA. Challenges from `/life-paths` stuck points or manual WahooCreator. Post-completion: 4-state NS classification → identity statement → behavioral_evidence increment on matching clusters → skill XP award via `increment_skill_xp` RPC.

**Healing tab** (`HealingIntentionsList.jsx`): Per-task healing intentions. "What's blocking you?" → QuestSelector → HealingFlowModal (7-step: Pattern → Fear → Origin → Insight → Rewire → Go Deeper → Expect the Best). DB: `healing_intentions` linked to `quest_tasks`.

**Scoring**: RP (Rise Points). State values: dorsal=-2, sympathetic=-1, ventral=+1, vibe_rise=+2. Levels: Getting Started (0) → Habit Builder (100) → Strong Foundation (500) → Vibe Rise (1250) → Flow Finder (2750) → Movement Maker (5750). Forgiving streak (1 day miss allowed).

**Post-courage flow**: 4-state NS classification (Vibe Rise/Fun/Pressure/Uninterested) → identity statement ("I am someone who...") → 3% reflection. Saves to `quest_completions.reflection_text` JSON. Also increments `behavioral_evidence` on matching clusters + awards skill XP.

**Weekly Review**: Triggers Sunday/Monday, 3 questions: (1) "Old me would have ___. Instead I ___." (2) "Did procrastination stop you?" (yes/no + what) (3) "What brave thing are you most proud of?" 15 RP + 5 for sharing. Shareable canvas card.

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

Sequential flow (each unlocks after previous): Remarkable Results → Remarkable Reach → Remarkable Growth → Scale Score. Three card states: completed/unlocked/locked.

1. **Remarkable Results** (`/create/remarkable`): Rule break discovery. Saves to `remarkable_angles`.
2. **Remarkable Reach** (`/create/narrative-builder`): Vehicle deep-dive + tribal language. Saves to `narrative_builders`.
3. **Remarkable Growth** (`/create/access-architecture`): 5-barrier audit. Saves to `access_architectures`.
4. **Scale Score** (`/create/scale-diagnostic`): Phase 3 diagnostic, 10 branches. Saves to `scale_diagnostics`. Public lead magnet at `/try/facilitator-score`.

**Creator Position Card** (`CreatorPositionCard.jsx`): Personal monopoly (skills x problems x personas vs 299 profiles), branch intersection, frontier research cards, AI positioning statement, competitive density map. Uses `useBranchScoring` hook + `spiralDynamicsMatrix.json`. Spec: `docs/features/personal-monopoly-finder.md`.

### 13. Interior Scoreboard (Clarity + Action Score)

Two consumer metrics measuring self-actualisation progress:
- **Clarity** (X axis): % of Life Map clusters rated Vibe Rise or Fun (NS state system). Displayed on Journey tab. Rated via `/mirror` page or `rate_mirror` screen after Life Map.
- **Action Score** (Y axis): aligned_actions / total_actions over rolling 7 days. Minimum 5 actions before showing zone. Displayed as zone matrix on Quests tab.

**NS state rating system**: Clusters rated with same 4 states as life paths: Vibe Rise ("I would absolutely love this"), Fun ("Yeah, sounds fun"), Stressed ("I could do it but feels stressful"), Bored ("I could but it doesn't excite me", auto-removes). Auto-saves on tap.

**Mirror page** (`/mirror`, hidden): Cluster re-rating, identity statement collection, skill tree (L0-L4 lit segments), re-generation flow (when behavioral_evidence >= 5, AI evolves cluster label), add custom clusters.

**Zone Matrix** (Quests tab): 2x2 graph plotting Action x Clarity. Quadrants: Self-Actualisation, Head Full of Dreams, Misguided Zone, Unfulfilment. Dot shows user position.

**Behavioral evidence**: On courage completion, clusters sharing skill_tags with the quest get `behavioral_evidence` incremented (atomic RPC). At 5+, re-gen banner shows on Mirror. Push notification via `send-push-notification`.

**Skill tree**: Background XP collection via `increment_skill_xp` RPC. L0→L1 at 3 XP, L1→L2 at 8, L2→L3 at 15, L3→L4 at 25. Starting level picker on quest creation. Visual: 5 lit-up segments per skill on Mirror page.

Key files: `scoreUtilities.js` (shared Action/Clarity/Zone calc), `skillProgress.js`, `questSkillTagger.js`, `MirrorPage.jsx`, `GroanCompletionModal.jsx` (behavioral evidence + skill XP at step 7).

Key docs: `docs/features/interior-scoreboard-spec.md`, `docs/features/interior-scoreboard-implementation-plan.md`, `docs/features/interior-scoreboard-next-sprint-spec.md`

### 14. Other Features

- **Zarlo V2 AI Game Guide**: Floating widget (bottom-right). Streaming chat via `agent-chat` (Haiku). Interior scoreboard rules injected into prompt (Clarity, Action Score, identity repeats, zone warnings). Engine: `zarloEngine.js`.
- **Figurine Essence Voice Mentor**: Bottom-left FAB. AI mentor, 3 convos/day. Edge function: `agent-chat`. Key: `useFigurine.js`.
- **Stripe Payment Gating**: Consumer stages 1-7 locked. Creator Portal: `CreateGate.jsx` + `subscriptionService.js`. Webhook: `stripe-webhook/index.ts` (deployed with `--no-verify-jwt`). Pre-signup payments: `pending_subscriptions` → `claim-subscription` edge function.
- **Scale Landing Page** (`/movement-makers`): $499 setup + $99/mo. Promo: `FOUNDING`.
- **Creator Gamification**: Spider graph (CreatorRadarChart on Growth tab, 5-6 axes), CreatorXP + levels (Dreamer→Movement Maker, hero section), celebrations (14 milestones, confetti + toasts via CreatorCelebrations), origin story overlay (first visit), per-section launch pads (SectionLaunchPad on each tab), founding member badge, event countdown urgency (amber/red/pulse), pipeline staleness nudge, value-framed locked playbook copy. Foundation: `src/lib/creatorGamification.js` (single localStorage JSON, celebration queue with 3s cooldown). Full spec: `docs/superpowers/plans/2026-07-18-scale-gamification-implementation-plan.md`. Octalysis analysis: `docs/research/octalysis-scale-gamification-recommendations.md`.
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

### Cluster Archiving (IMPORTANT)
When Life Map re-runs, only archive UNRATED clusters (`resonance_state IS NULL AND resonance_rating IS NULL`). User-rated clusters are curated and must survive re-runs. The `cluster_stage` constraint allows: `preview`, `intermediate`, `final`, `selected`, `archived`.

### Shared Score Utilities
Always use `src/lib/scoreUtilities.js` for Clarity and Action Score calculations. Never inline the formula. Three consumers: JourneyTab, MirrorPage, LevelTab matrix.

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
`experience_checkins` | `weekly_reviews` (3 questions: narrative_revision, identity_did, compounding_text) | `healing_intentions` (quest_task_id FK, pattern, protective_voice, fear_text, origin_text, insight_text, rewire_text, expectation_text, healing_stage, outcome)

### Interior Scoreboard
`user_skill_progress` (user_id, skill_id, xp, level, UNIQUE user_id+skill_id) | `nikigai_clusters` additions: `resonance_state` text, `resonance_rating` int, `resonance_updated_at`, `behavioral_evidence` int, `is_removed` bool, `skill_tags` text[], `problem_tags` text[], `persona_tags` text[], `regen_attempted_at`, `regen_notified` bool | `quests.skill_tags` text[], `quests.branch` text (AI-classified industry branch: healing/movement/bonds/story/tools/status/nourishment/shelter/fire/threat) | `quest_tasks.task_signal` text | `curiosity_clusters.skills` text[], `.problems` text[]

RPCs: `increment_skill_xp(p_user_id, p_skill_id)`, `increment_behavioral_evidence(p_cluster_id)`

### Life Paths → Quests → Courage Pipeline
`life_path_sessions` (careers JSON, stuck_points JSON, step, safety) | `curiosity_clusters` | `curiosity_inputs`. On `/life-paths` completion: selected careers → `quests` (upsert on user_id+career_id), stuck points → `groan_challenges` (status: active, with depth_level + wahoo_category) + `quest_tasks` (is_courage_challenge: true) + `priority_weekly_picks`. If protective voice selected → `healing_intentions` pre-created. Architecture doc: `docs/architecture/life-paths-quests-courage-pipeline.md`.

### Blow Up Brand Pipeline
`remarkable_angles` | `narrative_builders` (vehicle_type, vehicle_desc) | `access_architectures` | `scale_diagnostics` (score_body, score_culture, score_identity, score_ancestral, score_format, score_irreplaceable, score_rulebreak, branch, total_score, phase_classification) | `lead_captures` (email, source, scores)

### Stripe & Subscriptions
`user_subscriptions` (user_id, stripe_customer_id, stripe_subscription_id, status, plan_type, current_period_start/end, UNIQUE user_id+plan_type) | `pending_subscriptions` (email UNIQUE, stripe_customer_id, plan_type, status, claimed_by, claimed_at) | `user_integrations` (user_id, platform, status, access_token)

RPCs: `get_user_id_by_email(lookup_email)` (SECURITY DEFINER, used by webhook for email-based user matching)

### Other
`push_subscriptions` | `notification_preferences` | `groan_challenges` | `groan_proof` | `groan_contract_evidence` | `groan_outcomes` | `groan_streaks` | `groan_user_preferences`

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

## Archived Features (Paused, Not Deleted)

These components are built and working but temporarily removed from the UI. Code is intact, ready to re-enable.

| Feature | Component | Location | Why archived | Resume notes |
|---------|-----------|----------|-------------|-------------|
| Play Profile Event Recs | `PlayProfileEventRec` | `src/components/CreatorHome/PlayProfileRecs.jsx` | Needs design alignment with portal brand before shipping | Shows DNA-matched event format + size + cadence rec on Experiences tab. Re-add to Experiences tab when card design is finalised. |
| Play Profile Content Recs | `PlayProfileContentRec` | `src/components/CreatorHome/PlayProfileRecs.jsx` | Active on Growth tab, event rec archived separately | Currently live on Growth tab. |
| Quarterly Planner | `QuarterlyPlanner` | `src/components/CreatorHome/QuarterlyPlanner.jsx` | Entry flow felt clunky, needs UX rethink | Was a one-time-per-quarter modal with experience library dropdown. Intent: nudge users to plan quarterly experiences. Revisit as a lighter prompt or integrate into Upcoming section header. |

## MCP Session Sync

This project has an MCP server that tracks the user's self-knowledge graph. **At the end of every non-trivial session, offer to sync progress** by calling the MCP tools below.

**MCP tools available** (via `.mcp.json`):
- `get_interior_scoreboard` — load user's scores, skills, quests, patterns at session start
- `commit_progress` — sync completed tasks with state responses at session end

**Directory → Quest mapping** (which project feeds which quest):

| Directories | Quest |
|------------|-------|
| `/creations/Findmyflow`, `/creations/scale-portal`, `/creations/Events` | Vibe Rise (`8b07e527-3881-40df-b618-a4e6edd65849`) |
| `/creations/TTT`, `/creations/ttt-day-edition` | Travel Experience Host (`a9598f1f-111a-4827-8a42-1c4547780f9b`) |
| `/creations/Landingpages/headset-sales`, `/creations/Landingpages/headset-rental-bali` | Buy Headsets Ecommerce Site (`87e0f331-6d0b-4299-b5a9-08f4dc921d97`) |

**The sync flow** (see `findmyflow-plugin/skills/sync/SKILL.md` for full prompt):
1. Identify accomplishments from the session (code shipped, content created, decisions made)
2. Match to the quest for this directory (see table above)
3. Tag 1-3 skills from: storytelling, teaching, coaching, performing, creating, building, designing, leading, connecting, speaking_up
4. Ask: "How did each feel while doing it? (Vibe Rise / Fun / Stress / Boring)"
5. Call `commit_progress` with entries
6. Report results (RP, XP, clusters, patterns)

Full handoff doc: `docs/features/mcp-session-sync-handoff.md`

## Links

- **Find My Flow (Consumer)**: https://viberise.nichuzz.com
- **Scale (Creator)**: https://create.nichuzz.com
- **Repo**: https://github.com/Nic-Huzz/findmyflow
- **Supabase**: https://supabase.com/dashboard/project/qlwfcfypnoptsocdpxuv
