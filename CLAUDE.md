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
│   ├── crm/                  # 37 CRM components
│   │   ├── CRMLayout.jsx           # Wrapper with nudge engine
│   │   ├── Content*.jsx            # Generator, Planning, Checklist, etc.
│   │   ├── Weekly*.jsx             # Planning, Reflection, etc.
│   │   ├── Lead*.jsx               # Capture, Score, Sliders
│   │   ├── Story*.jsx              # Miner, Bank
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
├── pages/crm/                # 33 CRM pages
│   ├── Dashboard.jsx         # Command center
│   ├── Attract.jsx, Nurture.jsx, Tools.jsx  # Tower hubs
│   ├── Content*.jsx          # Create, Queue, History
│   ├── Sales*.jsx, Contacts.jsx, EmailSequences.jsx
│   └── *Calculator.jsx, Analytics.jsx, etc.
│
├── lib/
│   ├── supabaseClient.js     # Database connection
│   ├── stageConfig.js        # 10-stage system with ombre colors
│   ├── graduationChecker.js  # Project graduation logic
│   ├── haptics.js            # Mobile vibration feedback
│   ├── aiHelper.js           # Claude AI integration
│   ├── zarlo/                # zarloEngine.js, zarloPageContent.js
│   ├── crm/                  # 20+ services (contentContext, promptTemplates, towerStats)
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
docs/                         # 31 documentation files
```

## Routes

**Core**: `/` (Login) | `/me` (Profile) | `/7-day-challenge` | `/library` | `/flow-compass` | `/feedback`

**Archetypes**: `/archetypes`, `/archetypes/essence`, `/archetypes/protective`

**Flow Finder**: `/nikigai/skills`, `/nikigai/problems`, `/nikigai/persona`, `/nikigai/integration`

**Money Model**: `/attraction-offer`, `/upsell-offer`, `/downsell-offer`, `/continuity-offer`, `/leads-strategy`, `/offer-builder`, `/lead-magnet-selection`, `/product-selection`, `/funnel-builder`, `/funnel-calculator`

**Other Flows**: `/nervous-system`, `/healing-compass`, `/persona-selection`, `/validation-flows`, `/v/:shareToken` (public)

**CRM** (`/crm/*`): Dashboard, Attract, Nurture, Tools (tower hubs) | content/create, content/queue, content/history | marketing, pages, sales, sales/scripts, contacts, email-sequences, warm-outreach | execute, analytics, performance, reports | calculators, calculators/ltv, calculators/cac, calculators/ptuf | ascension, objections, implementation, assets, autonomous, alerts

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

Key files: `useChallengeData.js` (state), `QuestCard.jsx` (rendering), `ChallengeHeader/Filters/Leaderboard.jsx`

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

Three towers: **Attract** (content, pages, outreach), **Nurture** (contacts, email, pipeline), **Tools** (analytics, calculators, scripts).

Key services in `src/lib/crm/`: contentContext.js (data aggregation), promptTemplates.js (AI prompts), towerStats.js (live stats).

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
  attract: ['marketing', 'pages', 'cold-outreach', 'ads'],
  nurture: ['contacts', 'email-sequences', 'sales', 'warm-outreach'],
  tools: ['analytics', 'calculators', 'scripts', 'execute']
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
`crm_pages` | `crm_contacts` | `crm_email_sequences` | `crm_email_steps` | `crm_warm_leads`

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

## Recent Updates (Jan 2025)

- **10-Stage System**: Added Stage 0 (Flow Finder), 0.5 (Groans), 8 (Tracking)
- **Brand Refresh**: Purple→Gold ombre; gold action buttons (was emerald)
- **CRM System**: 33 pages, 37 components, tower-based architecture
- **Weekly Planning**: 4-phase cycle with PhaseSelector, TaskMenuPicker
- **Groan Matrix**: 2D challenges with scary/wahoo scoring, proof collection
- **QuickCapture**: 5-step onboarding for business data
- **Haptics**: Mobile vibration feedback patterns

See `docs/` for detailed session notes and historical changes.

## Links

- **Live**: https://findmyflow.nichuzz.com
- **Repo**: https://github.com/Nic-Huzz/findmyflow
- **Supabase**: https://supabase.com/dashboard/project/qlwfcfypnoptsocdpxuv
