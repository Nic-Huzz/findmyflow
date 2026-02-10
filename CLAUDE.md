# FindMyFlow - Claude Guide

## Overview

Personal development web app helping burnt-out professionals discover their ideal career path. Built on **Nikigai** framework (Nic + Ikigai). Users complete AI-guided "flows" to identify skills, problems they solve, and ideal customers.

**Core Architecture:**
- **Project-Centric**: Multiple projects per user, each with stage progression
- **10-Stage System**: Flow Finder (0), Groans (0.5), Stages 1-7, Tracking (8)
- **CRM Command Center**: Tower-based marketing/sales hub (Attract, Nurture, Tools)
- **Groan Matrix**: AI-generated courage challenges across skills × visibility layers
- **7-Day Challenges**: Gamified stage-specific quests
- **Weekly Planning**: 4-phase cycle (Push, Flow, Rest, Launch)
- **Zarlo AI**: Context-aware assistant on every page
- **Brand Colors**: Purple (#5e17eb) → Gold (#E9A23B) ombre gradient
- Based on Alex Hormozi's $100M Offers framework

## Tech Stack

React 18 + Vite + React Router v7 | Supabase (PostgreSQL, Auth, Edge Functions) | Anthropic Claude API | Vercel | Web Push API

## Folder Structure

```
src/
├── flows/                    # 34 flow components
│   ├── MoneyModelFlowBase.jsx      # Shared base (6 flows use this)
│   ├── moneyModelConfigs.js        # Money Model configurations
│   ├── FlowFinder*.jsx             # Skills, Problems, Persona, Integration
│   ├── *OfferFlow.jsx              # Attraction, Upsell, Downsell, GrandSlam
│   ├── FunnelCalculator.jsx        # Stage 8 metrics tracker
│   └── NervousSystemFlow.jsx, HealingCompass.jsx, etc.
│
├── hooks/
│   ├── useChallengeData.js   # Challenge state management
│   ├── useCelebrations.js    # Confetti, toasts, level-up animations
│   ├── useExecute.js         # Execute page operations
│   └── useAutoSave.js, useSteppedForm.js
│
├── components/
│   ├── crm/                  # 42 CRM components
│   │   ├── CRMLayout.jsx           # Wrapper with nudge engine
│   │   ├── Content*.jsx            # Generator, Planning, Checklist, etc.
│   │   ├── Weekly*.jsx             # Planning, Reflection, etc.
│   │   ├── Lead*.jsx               # Capture, Score, Sliders
│   │   ├── Story*.jsx              # Miner, Bank
│   │   ├── CSVImport/              # 6-step import wizard
│   │   ├── EcosystemStatusWidget   # Business flywheel progress
│   │   └── *Widget.jsx, *Modal.jsx # Intelligence, Activity, etc.
│   │
│   ├── onboarding/QuickCapture/    # 5-step business capture
│   ├── Zarlo/                      # AI Co-Founder widget
│   ├── Celebrations/               # Confetti, FloatingPoints, etc.
│   │
│   ├── Challenge*.jsx        # Header, Filters, Leaderboard, etc.
│   ├── *QuestInput.jsx       # Groan, Recognise, Rewire, Release, etc.
│   ├── GroanMatrix.jsx       # 2D courage challenge matrix
│   ├── QuestCard.jsx         # Unified quest rendering
│   ├── FlowMap*.jsx          # River visualization
│   └── SeeYourFlow.jsx       # Journey mapping
│
├── pages/crm/                # 34 CRM pages
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
│   ├── zarlo/                # zarloEngine.js, zarloPageContent.js
│   ├── crm/                  # 20+ services (contentContext, promptTemplates, towerStats, csvImportService, ecosystemService)
│   └── templates/            # AI prompt templates
│
├── data/                     # Static config (personas, archetypes, beliefs)
├── styles/flow-base.css      # Shared flow styles
├── App.jsx, AppRouter.jsx, Challenge.jsx, Profile.jsx
└── AuthGate.jsx              # Protected route wrapper

supabase/
├── functions/                # Edge Functions (graduation-check, nikigai-conversation, etc.)
└── migrations/               # Database migrations

public/                       # Static assets, flow JSON definitions
scripts/                      # db-query.sh, deploy-functions.sh
docs/                         # 33+ documentation files
```

## Routes

**Core**: `/` (Login) | `/me` (Profile) | `/7-day-challenge` | `/library` | `/flow-compass` | `/feedback` | `/hero-profile` (Hero Command Center)

**Archetypes**: `/archetypes`, `/archetypes/essence`, `/archetypes/protective`

**Flow Finder**: `/nikigai/skills`, `/nikigai/problems`, `/nikigai/persona`, `/nikigai/integration`

**Money Model**: `/attraction-offer`, `/upsell-offer`, `/downsell-offer`, `/continuity-offer`, `/leads-strategy`, `/offer-builder`, `/lead-magnet-selection`, `/product-selection`, `/funnel-builder`, `/funnel-calculator`

**Other Flows**: `/nervous-system`, `/healing-compass`, `/persona-selection`, `/validation-flows`, `/v/:shareToken` (public)

**CRM** (`/crm/*`): Dashboard, Attract, Nurture, Tools (tower hubs) | content/create, content/queue, content/history | marketing, pages, sales, sales/scripts, contacts, email-sequences, warm-outreach | execute, analytics, performance, reports | calculators, calculators/ltv, calculators/cac, calculators/ptuf | import, tools/systems | ascension, objections, implementations, assets, autonomous, alerts

## Key Features

### 1. Universal 10-Stage System

| Stage | Name | Color | Focus |
|-------|------|-------|-------|
| 0 | Flow Finder | #5e17eb | Discover skills/problems/personas (always accessible) |
| 0.5 | Groans | #6d26d7 | Courage challenges (always accessible, user-level) |
| 1-7 | Validation → Launch | gradient | Progressive project stages |
| 8 | Tracking | #E9A23B | Funnel metrics (always accessible) |

Stage flags: `alwaysAccessible`, `isUserLevel`, `isGroansStage`

### 2. 7-Day Challenge System

Categories: Groans (Recognise/Rewire/Reconnect), Healing (Recognise/Release), Flow Finder, Bonus, Tracker

Key files: `Challenge.jsx` (main page), `useChallengeData.js` (state), `QuestCard.jsx` (rendering), `ChallengeHeader.jsx`, `ChallengeFilters.jsx`, `ChallengeLeaderboard.jsx`

Layout: Header (streak, leaderboard badge, settings cog, week type) → Category tabs → Stage tabs (Business only) → Artifact progress → Sub-tabs (Tasks | Voices/Deep Dive) → Quest cards. Tracker tab includes `HorizontalFlowRiver` with compass/challenge legend.

Weekly Planning: Auto-skips "Review Last Week" step for new users with no previous data (0 quests, 0 points).

### 3. Money Model Flows

6 flows consolidated into `MoneyModelFlowBase.jsx` + `moneyModelConfigs.js`. Each wrapper is ~35 lines.

### 4. Flow Compass

Energy tracking using N/E/S/W directions:
- **North** (Green): Flow - Ease + Excited
- **East** (Blue): Redirect - Resistance + Excited
- **South** (Red): Rest - Resistance + Tired
- **West** (Yellow): Honour - Ease + Tired

### 5. Zarlo AI Co-Founder

Floating widget on all pages. Components: `ZarloWidget.jsx`, `ZarloChat.jsx`. Engine: `zarloEngine.js`, `zarloPageContent.js`. Streams responses, context-aware, saves to `zarlo_conversations`.

### 6. Funnel Calculator (Stage 8)

Two modes: **Actual** (track real numbers), **Planner** (project with industry averages). Tracks 8 stages: Awareness → Attraction → Lead Magnet → Nurture → Core → Upsell → Downsell → Continuity.

### 7. CRM Command Center

Three towers with 34 pages and 42 components:

**Attract Tower**: Content Generator, Content Queue/History, Pages Manager, Marketing Hub
- PromptGenerator integrated for AI content generation

**Nurture Tower**: Contacts (full CRUD, lifecycle stages, tagging), Email Sequences (step editor, copy-to-clipboard), Warm Outreach (filtered view of contacts with outreach_status, priority scoring), Sales Pipeline (deals, scripts)

**Tools Tower**: Analytics, Calculators (PTUF/LTV/CAC), Sales Scripts (15 Hormozi scripts), Execute (gamified tasks), Business Systems (4-phase flywheel), CSV Import (6-step wizard)
- Import supports: Contacts, Deals

**Dashboard**: Stats grid, DailyActions widget (today's content + stale leads), EcosystemStatusWidget (flywheel progress), Quick Actions

Key services in `src/lib/crm/`: contentContext.js (data aggregation), promptTemplates.js (7 AI templates), towerStats.js (live stats), csvImportService.js (parsing, validation, batch insert), ecosystemService.js (flywheel auto-detection).

### 8. Groan Matrix

2D matrix: User skills/problems × 5 visibility layers (Screen→Live→Money→Vulnerable→Authority).

Essence zone scoring: scary_score + wahoo_score → essence zone / protective voice / comfort zone.

Workflow: generated → accepted → completed (with proof) or skipped. 48hr outcome tracking.

### 9. Weekly Planning (4-Phase)

| Week | Focus |
|------|-------|
| Push | High-intensity output |
| Flow | Balanced productivity |
| Rest | Recovery & reflection |
| Launch | Campaign execution |

All use purple gradient background; gold for selection.

### 10. First-Time Onboarding

`HomeFirstTime.jsx`: Welcome → 3 persona questions → Branch by persona type. `ExistingProjectFlow`: Name → Description → Skills → Problem → Persona → Stage.

### 11. Journey Mapping (SeeYourFlow)

First-time: 5 steps mapping journey highlights/challenges. Returning: Two-factor check-in (Excited/Tired × Great/Resistance). Saves to localStorage.

### 12. /me Page (MePage.jsx)

Dashboard hub with three sections: Hero Profile (archetype, level, XP), Flow Journey (HorizontalFlowRiver with compass + challenge entries, stats rings, SeeYourFlow inline mapper for first-time), Today's Quest (next stage quest with progress dots). Design: purple gradient hero cards, gold CTAs, glow orbs. See `docs/page-component-design-guide.md`.

### 13. Hero Profile (/hero-profile)

`HeroCommandCenter.jsx` — project-specific hero profile with identity triad, project expression cards, play-list progress. Route: `/hero-profile` or `/hero-profile/:projectId`.

### 14. Archetypes (/archetypes/essence)

`EssenceProfile.jsx` — displays user's essence archetype profile, strengths, shadow aspects, and integration guidance.

### 15. Library of Answers (/library)

`LibraryOfAnswers.jsx` — three GradientWheel visualizations (Skills, Problems, Personas) showing lit segments from Flow Finder completions. `showLitLabels` prop displays labels on lit segments outside the wheel with multi-word wrapping.

### 16. Flow Compass (/flow-compass)

`FlowCompassPage.jsx` — energy tracking with N/E/S/W compass directions. Restyled to match /me design (purple gradient quick-log hero, white project cards, gold CTAs, glass morphism). Project selector for multi-project users. No sidebar.

## Architecture Patterns

### Hook Extraction
```javascript
const { loading, progress, handleQuestComplete } = useChallengeData()
```

### Configurable Base
```javascript
function UpsellFlow() {
  return <MoneyModelFlowBase config={MONEY_MODEL_CONFIGS.upsell} />
}
```

### Data Fetching
```javascript
const { data, error } = await supabase.from('table').select('*').eq('user_id', userId)
```

### Authentication
```jsx
<Route path="/protected" element={<AuthGate><Component /></AuthGate>} />
```

### CSS Scoping
Always scope to parent: `.see-your-flow .entry-card { }` not `.entry-card { }`

### Shared Flow CSS
Import `src/styles/flow-base.css`. Classes: `.primary-button`, `.secondary-button`, `.welcome-container`, `.resume-prompt`, `.nav-buttons`, `.option-btn`, `.input-group`, `.loading-state`, `.spinner`, `.progress-dots`, `.error-message`

### Tower Organization
```javascript
const towers = {
  attract: ['marketing', 'content/create', 'content/queue', 'pages', 'cold-outreach', 'ads'],
  nurture: ['contacts', 'email-sequences', 'sales', 'sales/scripts', 'warm-outreach'],
  tools: ['import', 'tools/systems', 'analytics', 'calculators', 'execute', 'implementations', 'assets', 'alerts']
}
```

### Content Context
```javascript
const context = await getContentContext(userId) // Returns persona, offer, validation, proof, etc.
```

### Haptics
```javascript
import { hapticLight, hapticMedium, hapticSuccess, hapticError } from './lib/haptics'
```

### Celebrations
```javascript
const { celebrateTaskComplete, celebrateLevelUp } = useCelebrations()
```

## Database Schema

### Core Tables
`user_stage_progress` (persona, onboarding) | `user_projects` (stage, points) | `flow_sessions` (completions) | `flow_entries` (compass) | `milestone_completions` | `quest_completions` | `challenge_instances` | `groan_reflections`

### Flow Data
`nikigai_clusters` | `nikigai_responses` | `nikigai_key_outcomes` | `persona_profiles` | `nervous_system_responses` | `healing_compass_responses` | `lead_flow_profiles`

### Assessments
`attraction_offer_assessments` | `upsell_assessments` | `downsell_assessments` | `continuity_assessments` | `leads_assessments` | `lead_magnet_assessments` | `offer_builder_assessments` | `funnel_metrics` | `zarlo_conversations`

### CRM Tables
`crm_pages` | `crm_contacts` (includes outreach columns: outreach_status, platform, engagement_type, priority, temperature, last_message, outreach_status_entered_at) | `crm_email_sequences` | `crm_email_steps` | `sales_deals` | `sales_scripts` | `script_usage_log` | `content_history` | `ecosystem_system_progress` | `offer_implementations`

### Notifications
`push_subscriptions` (endpoint, keys) | `notification_preferences` (quest_reminders, achievement_celebrations, timezone)

### Groan Matrix
`groan_challenges` (scary/wahoo scores, visibility layer) | `groan_proof` | `groan_contract_evidence` | `groan_outcomes` | `groan_streaks` | `groan_user_preferences`

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

## Recent Updates (Feb 2026)

- **Flow Compass Restyled**: Removed sidebar layout, now uses /me design system — purple gradient quick-log hero, white project cards with gradient left accent bars, gold CTAs, glass morphism buttons. Project selector for multi-project users.
- **7-Day Challenge Layout**: Moved "Tasks | Deep Dive" sub-tabs below artifact progress and above quest cards. Replaced "Voices" header badge with "Leaderboard" button. Removed category points summary row (Category Total/Summary/Leaderboard). Removed "Edit" plan button from header. Tracker tab now uses `HorizontalFlowRiver` (matching /me page) with compass/challenge legend.
- **Weekly Planning Skip**: New users with no previous challenge data (0 quests, 0 points) auto-skip the "Review Last Week" step entirely.
- **Library Wheel Labels**: `GradientWheel` `showLitLabels` prop renders labels on lit segments outside the wheel. Multi-word labels wrap into two `<tspan>` lines. Used in all three LibraryOfAnswers wheels.
- **/me Page Legend Fix**: Aligned "COMPASS" and "CHALLENGE" headings horizontally with their legend pills.
- **Warm Leads Merged into Contacts**: `crm_warm_leads` deprecated and merged into `crm_contacts` with outreach columns (`outreach_status`, `platform`, `engagement_type`, `priority`, `temperature`, `outreach_status_entered_at`). Warm Outreach page is now a filtered view of contacts where `outreach_status IS NOT NULL`. Old table renamed to `crm_warm_leads_deprecated`.
- **CSV Import Wizard**: 6-step wizard (`/crm/import`) for bulk importing Contacts and Deals from CSV files. Auto-mapping, validation, batch insert with duplicate handling.
- **Business Flywheel System**: 4-phase checklist (`/crm/tools/systems`) - Attract, Nurture, Deliver, Retain. Auto-detection from source tables. Dashboard widget shows progress.
- **Email Sequences Enhanced**: Step editor for individual emails, copy-to-clipboard (single + all), PromptGenerator integration with template auto-selection.
- **PromptGenerator Expansion**: Now integrated in Pages, Email Sequences, Warm Outreach with 7 templates.
- **Flow Finder Universalized**: User-level completions (not project-specific), syncs with challenge system.

## Recent Updates (Feb 2025)

- **Push Notifications**: Timezone-aware scheduled notifications at 8am/12pm/6pm. See `docs/PUSH_NOTIFICATIONS.md`
- **Challenge Onboarding**: PWA install instructions + notification enable screens
- **Mind Space**: New `/mind-space` flow for quick flow discovery

## Previous Updates (Jan 2025)

- **10-Stage System**: Added Stage 0 (Flow Finder), 0.5 (Groans), 8 (Tracking)
- **Brand Refresh**: Purple→Gold ombre; gold action buttons (was emerald)
- **CRM System**: Tower-based architecture foundation
- **Weekly Planning**: 4-phase cycle with PhaseSelector, TaskMenuPicker
- **Groan Matrix**: 2D challenges with scary/wahoo scoring, proof collection
- **QuickCapture**: 5-step onboarding for business data
- **Haptics**: Mobile vibration feedback patterns

## Key Documentation

- `docs/DEVELOPMENT_PATTERNS.md` - **Required reading for flow/challenge work** - Supabase patterns, challenge sync, error handling
- `docs/crm-status.md` - **CRM feature status** - What's built, recent changes, bugs fixed, full audit
- `docs/crm-testing-checklist.md` - **CRM testing** - 120+ checkpoints for verifying CRM functionality
- `docs/scoring-system-refactor.md` - Points/scoring system architecture and bug fixes
- `docs/PUSH_NOTIFICATIONS.md` - Push notification system setup, testing, troubleshooting
- `docs/page-component-design-guide.md` - **REQUIRED before creating/modifying any page or component UI** — starter templates, decision trees, token tables, anti-patterns
- `docs/2026-01-29-priority-hierarchy.md` - **Priority hierarchy & test milestones** - Defines testable "done" gates, what's built vs what to build next, stops scope creep
- `docs/` - Session notes and historical changes

## Links

- **Live**: https://findmyflow.nichuzz.com
- **Repo**: https://github.com/Nic-Huzz/findmyflow
- **Supabase**: https://supabase.com/dashboard/project/qlwfcfypnoptsocdpxuv
