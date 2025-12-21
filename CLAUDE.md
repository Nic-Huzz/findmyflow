# FindMyFlow - Project Guide for Claude

## Project Overview

FindMyFlow is a personal development web app that helps burnt-out professionals discover their ideal career path and build a business around their natural strengths. Users complete AI-guided "flows" (interactive questionnaires) to identify their skills, problems they solve, and ideal customer personas. The app is built on the **Nikigai** framework (Nic + Ikigai - the creator's adaptation of the Japanese concept).

**Architecture (Dec 2024 Refactor):**
- **Project-Centric**: Users can have multiple projects, each with its own stage progression
- **Universal 6-Stage System**: All projects follow the same 6 stages (Validation → Product Creation → Testing → Money Models → Campaign Creation → Launch)
- **Persona at User Level**: Three user personas (Vibe Seeker, Vibe Riser, Movement Maker) determine initial guidance, but stages are project-based
- **Gamified 7-Day Challenges**: Stage-specific quests with groan challenges that push users past comfort zones
- The Money Model flows are based on Alex Hormozi's $100M Offers framework.

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **React 18** | Frontend framework |
| **Vite** | Build tool and dev server |
| **React Router v7** | Client-side routing |
| **Supabase** | Backend (PostgreSQL database, Auth, Edge Functions) |
| **Anthropic Claude API** | AI conversations in flows |
| **Vercel** | Hosting and deployment |
| **Web Push API** | Push notifications |

---

## Folder Structure

```
/Users/nichurrell/creations/Findmyflow/
├── src/
│   ├── flows/                         # All flow components (14 files)
│   │   ├── MoneyModelFlowBase.jsx     # Shared base for all Money Model flows (450 lines)
│   │   ├── moneyModelConfigs.js       # Configuration for 6 Money Model flows
│   │   ├── AttractionOfferFlow.jsx    # Thin wrapper (~35 lines)
│   │   ├── UpsellFlow.jsx             # Thin wrapper
│   │   ├── DownsellFlow.jsx           # Thin wrapper
│   │   ├── ContinuityFlow.jsx         # Thin wrapper
│   │   ├── LeadsStrategyFlow.jsx      # Thin wrapper
│   │   ├── LeadMagnetFlow.jsx         # Thin wrapper
│   │   ├── FlowFinderSkills.jsx       # AI-guided skills discovery
│   │   ├── FlowFinderProblems.jsx     # AI-guided problems discovery
│   │   ├── FlowFinderPersona.jsx      # AI-guided persona discovery
│   │   ├── FlowFinderIntegration.jsx  # Synthesis of all discoveries
│   │   ├── NervousSystemFlow.jsx      # Nervous system calibration
│   │   ├── HealingCompass.jsx         # Trauma healing flow
│   │   ├── PersonaSelectionFlow.jsx   # Persona type selection
│   │   └── HybridArchetypeFlow.jsx    # Archetype assessment
│   │
│   ├── hooks/                         # Custom React hooks
│   │   └── useChallengeData.js        # All Challenge state & data loading (1,147 lines)
│   │
│   ├── components/                    # Reusable UI components
│   │   ├── MoneyModelShared/          # Shared Money Model components
│   │   │   ├── BackButton.jsx         # Navigation back button
│   │   │   ├── ProgressDots.jsx       # Progress indicator
│   │   │   └── index.js               # Barrel export
│   │   │
│   │   ├── QuestCard.jsx              # Unified quest card (317 lines)
│   │   ├── ChallengeHeader.jsx        # Challenge header with points/settings
│   │   ├── ChallengeOnboarding.jsx    # Welcome & group selection screens
│   │   ├── ChallengeLeaderboard.jsx   # Leaderboard display
│   │   ├── ChallengeFilters.jsx       # Filter chips for quests
│   │   ├── ChallengeProjectSelector.jsx # Project selection UI
│   │   ├── ChallengeStageTabs.jsx     # Stage tabs (1-6)
│   │   │
│   │   ├── GroanReflectionInput.jsx   # 5-step groan reflection form
│   │   ├── FlowCompassInput.jsx       # N/E/S/W direction picker
│   │   ├── ConversationLogInput.jsx   # Conversation logging form
│   │   ├── MilestoneInput.jsx         # Milestone completion form
│   │   │
│   │   ├── FlowMap.jsx                # Dashboard clusters display
│   │   ├── FlowMapRiver.jsx           # Vertical river visualization
│   │   ├── FlowMapMockups.jsx         # Design mockups page
│   │   ├── FlowCompass.jsx            # Direction picker wrapper
│   │   │
│   │   ├── GraduationModal.jsx        # Stage completion celebration
│   │   ├── HomeFirstTime.jsx          # First-time user onboarding
│   │   ├── ExistingProjectFlow.jsx    # Existing project onboarding
│   │   ├── PortalExplainer.jsx        # Challenge explainer modal
│   │   │
│   │   ├── NotificationPrompt.jsx     # Push notification prompt
│   │   ├── NotificationSettings.jsx   # Notification preferences
│   │   ├── InstallPWA.jsx             # PWA install prompt
│   │   └── ErrorBoundary.jsx          # React error boundary
│   │
│   ├── pages/                         # Full page components
│   │   ├── FlowCompassPage.jsx        # Flow compass tracking page
│   │   ├── LibraryOfAnswers.jsx       # All discoveries organized
│   │   ├── ValidationFlowsManager.jsx # Validation survey manager
│   │   └── PublicValidationFlow.jsx   # Public validation survey
│   │
│   ├── profiles/                      # Profile display components
│   │   ├── EssenceProfile.jsx         # Essence archetype display
│   │   └── ProtectiveProfile.jsx      # Protective archetype display
│   │
│   ├── lib/                           # Utilities and helpers
│   │   ├── supabaseClient.js          # Database connection
│   │   ├── stageConfig.js             # Universal 6-stage configuration
│   │   ├── graduationChecker.js       # Project graduation logic
│   │   ├── questCompletionHelpers.js  # Quest completion handlers
│   │   ├── questCompletion.js         # Quest completion utilities
│   │   ├── streakTracking.js          # 7-day streak logic
│   │   ├── projectCreation.js         # Project creation utilities
│   │   ├── flowCompass.js             # Flow compass utilities
│   │   ├── aiHelper.js                # Claude AI integration
│   │   ├── clustering.js              # AI-powered clustering
│   │   ├── tagExtraction.js           # Tag extraction from responses
│   │   ├── weighting.js               # Scoring/weighting functions
│   │   ├── validationFlows.js         # Validation flow utilities
│   │   ├── notifications.js           # Push notification utilities
│   │   ├── personaStages.js           # Legacy persona stages
│   │   ├── sanitize.js                # Input sanitization
│   │   ├── analytics.js               # Analytics tracking
│   │   ├── anthropicClient.js         # Anthropic API client
│   │   ├── promptResolver.js          # Dynamic prompt resolution
│   │   └── templates/                 # AI prompt templates
│   │       ├── nervousSystemTemplates.js
│   │       ├── essenceRevealTemplate.js
│   │       └── protectiveMirrorTemplate.js
│   │
│   ├── data/                          # Static configuration
│   │   ├── personaProfiles.js         # Persona definitions
│   │   ├── protectiveProfiles.js      # Protective archetype data
│   │   ├── essenceProfiles.js         # Essence archetype data
│   │   └── nervousSystemBeliefs.js    # NS belief configurations
│   │
│   ├── auth/                          # Authentication
│   │   └── AuthProvider.jsx           # Auth context provider
│   │
│   ├── archive/                       # Deprecated code (14 files)
│   │
│   ├── App.jsx                        # Main dashboard
│   ├── AppRouter.jsx                  # Router config (all routes)
│   ├── Challenge.jsx                  # 7-day challenge (1,058 lines, decomposed)
│   ├── Profile.jsx                    # User profile page
│   ├── PersonaAssessment.jsx          # Login/signup page
│   ├── ArchetypeSelection.jsx         # Archetype picker
│   ├── Feedback.jsx                   # User feedback form
│   ├── MoneyModelGuide.jsx            # Money model overview
│   ├── FlowLibrary.jsx                # Legacy flow library
│   ├── RetreatLanding.jsx             # Retreat landing page
│   └── AuthGate.jsx                   # Protected route wrapper
│
├── supabase/
│   ├── functions/                     # Edge Functions
│   │   ├── graduation-check/          # Graduation requirements
│   │   ├── nikigai-conversation/      # AI conversation handler
│   │   ├── nervous-system-mirror/     # NS AI analysis
│   │   ├── scheduled-notifications/   # Cron job for notifications
│   │   └── ...
│   └── migrations/                    # Database migrations
│
├── public/                            # Static assets
│   ├── *.json                         # Flow question definitions
│   └── Money Model/                   # Offer configurations
│
├── scripts/                           # Maintenance scripts
│   ├── db-query.sh                    # Query database via REST API
│   └── deploy-functions.sh            # Deploy edge functions
│
├── docs/                              # Documentation
│   ├── 7-day-challenge-system.md      # Challenge system docs
│   ├── 2024-12-21-refactoring-session.md # Major refactoring docs
│   ├── design-guide.md                # Brand colors, typography
│   └── supabase-setup.md              # Database setup guide
│
└── .github/workflows/                 # CI/CD
    └── scheduled-notifications.yml    # Cron for notifications
```

---

## Routes & Pages

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | PersonaAssessment | Login/signup + persona selection |
| `/me` | Profile | User dashboard with clusters |
| `/7-day-challenge` | Challenge | Gamified daily quests |
| `/library` | LibraryOfAnswers | All discoveries organized |
| `/flow-compass` | FlowCompassPage | Energy tracking (N/E/S/W) |
| `/archetypes` | ArchetypeSelection | View archetypes |
| `/archetypes/essence` | EssenceProfile | Essence archetype details |
| `/archetypes/protective` | ProtectiveProfile | Protective archetype details |
| `/nikigai/skills` | FlowFinderSkills | AI skills discovery |
| `/nikigai/problems` | FlowFinderProblems | AI problems discovery |
| `/nikigai/persona` | FlowFinderPersona | AI persona discovery |
| `/nikigai/integration` | FlowFinderIntegration | Synthesis flow |
| `/nervous-system` | NervousSystemFlow | NS calibration |
| `/healing-compass` | HealingCompass | Trauma healing |
| `/attraction-offer` | AttractionOfferFlow | $100M Offer builder |
| `/upsell-offer` | UpsellFlow | Upsell strategy |
| `/downsell-offer` | DownsellFlow | Downsell strategy |
| `/continuity-offer` | ContinuityFlow | Continuity model |
| `/leads-strategy` | LeadsStrategyFlow | Lead gen strategy |
| `/lead-magnet` | LeadMagnetFlow | Lead magnet type |
| `/persona-selection` | PersonaSelectionFlow | Customer persona |
| `/validation-flows` | ValidationFlowsManager | Survey manager |
| `/v/:shareToken` | PublicValidationFlow | Public survey (no auth) |
| `/settings/notifications` | NotificationSettings | Notification prefs |
| `/feedback` | Feedback | User feedback |
| `/retreats` | RetreatLanding | Retreat landing page |
| `/money-model-guide` | MoneyModelGuide | Educational overview |

---

## Key Features

### 1. Universal 6-Stage System
All projects follow these stages:

| Stage | Name | Focus |
|-------|------|-------|
| 1 | Validation | Validate with real customers |
| 2 | Product Creation | Build core offer + lead magnet |
| 3 | Testing | Test with users, gather feedback |
| 4 | Money Models | Upsells, downsells, continuity |
| 5 | Campaign Creation | Lead generation strategy |
| 6 | Launch | Execute launch with leads funnel |

### 2. 7-Day Challenge System
Gamified quests organized by category:
- **Groans**: Recognise, Rewire, Reconnect challenges
- **Healing**: Recognise, Release challenges
- **Flow Finder**: Discovery flows (Skills, Problems, Persona)
- **Bonus**: Extra credit activities
- **Tracker**: Flow compass logging

Key components:
- `useChallengeData.js` - All state management (1,147 lines)
- `QuestCard.jsx` - Unified quest rendering (317 lines)
- `ChallengeHeader.jsx` - Points, day counter, settings
- `ChallengeLeaderboard.jsx` - Weekly/all-time rankings
- `ChallengeFilters.jsx` - Category/frequency filters

### 3. Money Model Flows (Consolidated)
Six flows consolidated into one configurable base:
- `MoneyModelFlowBase.jsx` - Shared logic (450 lines)
- `moneyModelConfigs.js` - All 6 flow configurations
- Each flow is now ~35 lines (94% reduction from original)

### 4. Flow Finder (AI-Guided Discovery)
- Skills identification (`/nikigai/skills`)
- Problems you solve (`/nikigai/problems`)
- Ideal customer persona (`/nikigai/persona`)
- Integration/synthesis (`/nikigai/integration`)

### 5. Nervous System & Healing
- **Nervous System Flow** - Reveals trauma boundaries around visibility/earning
- **Healing Compass** - Process to heal those boundaries

### 6. Flow Compass
Tracks energy using N/E/S/W directions:
- **North (Green)**: Flow - Ease + Excited
- **East (Blue)**: Redirect - Resistance + Excited
- **South (Red)**: Rest - Resistance + Tired
- **West (Yellow)**: Honour - Ease + Tired

---

## Architecture Patterns

### 1. Custom Hook Extraction
Large components extract state management into hooks:
```javascript
// Challenge.jsx uses useChallengeData hook
import { useChallengeData } from './hooks/useChallengeData'

function Challenge() {
  const {
    loading, progress, completions,
    handleQuestComplete, getCategoryPoints,
    // ... 100+ more state/functions
  } = useChallengeData()

  // Component only handles rendering
}
```

### 2. Configurable Base Components
Flows use a shared base with configuration:
```javascript
// LeadMagnetFlow.jsx - thin wrapper
import MoneyModelFlowBase from './MoneyModelFlowBase'
import { MONEY_MODEL_CONFIGS } from './moneyModelConfigs'

function LeadMagnetFlow() {
  return <MoneyModelFlowBase config={MONEY_MODEL_CONFIGS.leadMagnet} />
}
```

### 3. Component Decomposition
Large components broken into focused pieces:
```javascript
// Challenge.jsx orchestrates these components:
<ChallengeHeader />        // Points, settings, day counter
<ChallengeFilters />       // Category/frequency filters
<ChallengeLeaderboard />   // Leaderboard display
<QuestCard />              // Individual quest rendering
<ChallengeOnboarding />    // Welcome/group selection
```

### 4. Data Fetching
All database access uses Supabase client:
```javascript
import { supabase } from './lib/supabaseClient'

const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('user_id', userId)
```

### 5. Authentication
Protected routes use `<AuthGate>`:
```jsx
<Route path="/protected" element={
  <AuthGate>
    <ProtectedComponent />
  </AuthGate>
} />
```

---

## Database Schema

### Core Tables

| Table | What it stores |
|-------|----------------|
| `user_stage_progress` | Persona, onboarding status per user |
| `user_projects` | Projects with `current_stage` (1-6), `total_points` |
| `flow_sessions` | Flow completions (tracks `flow_type` + `project_id`) |
| `milestone_completions` | Completed milestones per user/project |
| `quest_completions` | Daily quest completions (with `project_id`) |
| `challenge_instances` | Active 7-day challenge sessions |
| `groan_reflections` | Protective voices and fears on quest completion |

### Flow Data Tables

| Table | What it stores |
|-------|----------------|
| `nikigai_clusters` | AI-generated skill/problem/persona clusters |
| `nikigai_responses` | User responses in flows |
| `nikigai_key_outcomes` | Selected opportunities |
| `persona_profiles` | Customer persona definitions |
| `nervous_system_responses` | NS calibration data |
| `healing_compass_responses` | Healing compass entries |

### Assessment Tables

| Table | What it stores |
|-------|----------------|
| `attraction_offer_assessments` | Attraction offer results |
| `upsell_assessments` | Upsell flow results |
| `downsell_assessments` | Downsell flow results |
| `continuity_assessments` | Continuity flow results |
| `leads_assessments` | Leads strategy results |
| `lead_magnet_assessments` | Lead magnet results |

---

## Environment Variables

Required in `.env.local`:
```
VITE_SUPABASE_URL          # Supabase project URL
VITE_SUPABASE_ANON_KEY     # Supabase anon/public key
ANTHROPIC_API_KEY          # Claude API key (server-side only)
VITE_VAPID_PUBLIC_KEY      # Web push public key
VAPID_PRIVATE_KEY          # Web push private key (server-side)
VAPID_EMAIL                # Email for VAPID
```

For GitHub Actions:
```
SUPABASE_PROJECT_REF       # qlwfcfypnoptsocdpxuv
SUPABASE_ACCESS_TOKEN      # From Supabase dashboard
```

---

## Recent Updates (Dec 2024)

### Challenge.jsx Decomposition
Reduced from 3,261 to 1,058 lines (68% reduction):
- Extracted `useChallengeData.js` hook (1,147 lines)
- Created `QuestCard.jsx` component (317 lines)
- Created `ChallengeHeader.jsx` (108 lines)
- Created `ChallengeOnboarding.jsx` (124 lines)
- Created `ChallengeLeaderboard.jsx` (90 lines)
- Created `ChallengeFilters.jsx` (86 lines)

### Money Model Consolidation
Reduced 6 flows from ~3,572 lines to ~209 lines (94% reduction):
- Created `MoneyModelFlowBase.jsx` (450 lines)
- Created `moneyModelConfigs.js` for all configurations
- Each flow is now a thin wrapper (~35 lines)

### Deleted Unused Components
- FlowHistory.jsx
- FlowInsights.jsx
- FlowLogModal.jsx
- StageProgressCard.jsx

---

## Quick Commands

```bash
npm run dev              # Start dev server
npm run build            # Production build
npm run db:push          # Apply migrations
./scripts/db-query.sh    # Query database
```

---

## Project Links

- **Live**: https://findmyflow.nichuzz.com
- **Repo**: https://github.com/Nic-Huzz/findmyflow
- **Supabase**: https://supabase.com/dashboard/project/qlwfcfypnoptsocdpxuv
