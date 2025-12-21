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

## Folder Structure (LEGO Castle Analogy)

Think of this project as building a LEGO castle:

```
/Users/nichurrell/Findmyflow/
├── src/                          # The castle itself
│   ├── components/               # Individual LEGO bricks (reusable pieces)
│   │   ├── FlowCompass.jsx       # Direction picker (N/E/S/W)
│   │   ├── FlowMap.jsx           # Dashboard clusters display
│   │   ├── StageProgressCard.jsx # Progress tracking card
│   │   ├── GraduationModal.jsx   # Stage completion celebration
│   │   └── ...
│   │
│   ├── pages/                    # Rooms in the castle (full page views)
│   │   ├── FlowCompass.jsx       # Flow tracking page
│   │   ├── ValidationFlowsManager.jsx
│   │   └── PublicValidationFlow.jsx
│   │
│   ├── lib/                      # Hidden mechanisms (like the drawbridge pulley)
│   │   ├── supabaseClient.js     # Database connection
│   │   ├── stageConfig.js        # **NEW** Universal 6-stage configuration
│   │   ├── graduationChecker.js  # Project-based graduation logic
│   │   ├── personaStages.js      # Legacy persona stages (being deprecated)
│   │   ├── streakTracking.js     # 7-day challenge streaks
│   │   ├── aiHelper.js           # Claude AI integration
│   │   └── clustering.js         # AI-powered skill/problem clustering
│   │
│   ├── auth/                     # The castle guards (authentication)
│   │   └── AuthProvider.jsx      # Auth context provider
│   │
│   ├── data/                     # Castle blueprints (static config)
│   │   └── personaProfiles.js    # Persona definitions
│   │
│   ├── AppRouter.jsx             # The castle map (all routes)
│   ├── App.jsx                   # Main dashboard (the throne room)
│   ├── Challenge.jsx             # 7-day challenge system
│   ├── NikigaiTest.jsx           # AI conversation flow engine
│   ├── archive/                  # Deprecated code (move *.OLD.jsx files here)
│   └── [FlowName]Flow.jsx        # Various assessment flows
│
├── supabase/                     # The storage chest (database)
│   ├── functions/                # Castle messengers (Edge Functions)
│   │   ├── graduation-check/     # Checks graduation requirements
│   │   ├── nikigai-conversation/ # AI conversation handler
│   │   ├── nervous-system-mirror/# Nervous system AI analysis
│   │   └── ...
│   └── migrations/               # Castle renovation history
│
├── public/                       # Castle decorations (static assets)
│   ├── *.json                    # Flow question definitions
│   └── images/                   # Icons and images
│
├── scripts/                      # Castle maintenance tools
│   ├── db-query.sh               # Query database via REST API
│   └── deploy-functions.sh       # Deploy edge functions
│
├── docs/                         # Castle instruction manuals
│   ├── 7-day-challenge-system.md # **READ THIS** before modifying Challenge.jsx
│   ├── design-guide.md           # Brand colors, typography, components
│   └── supabase-setup.md         # Database connection & migration guide
│
├── .env.local                    # Secret passages (credentials only you know)
├── .github/workflows/            # Automatic castle builders (CI/CD)
└── mockups/                      # Architectural sketches
```

---

## Key Features

### Currently Built and Working:

1. **Universal 6-Stage System** (Dec 2024 Refactor) - All projects follow these stages:
   | Stage | Name | Focus |
   |-------|------|-------|
   | 1 | Validation | Validate with real customers |
   | 2 | Product Creation | Build core offer + lead magnet |
   | 3 | Testing | Test with users, gather feedback |
   | 4 | Money Models | Upsells, downsells, continuity |
   | 5 | Campaign Creation | Lead generation strategy |
   | 6 | Launch | Execute launch with leads funnel |

2. **Persona System** - Three user types (determines initial guidance):
   - **Vibe Seeker**: Exploring, needs Flow Finder first
   - **Vibe Riser**: Building first product, can start from existing project
   - **Movement Maker**: Scaling a business, often has existing traction

3. **Flow Finder** - AI-guided discovery flows:
   - Skills identification (`/nikigai/skills`)
   - Problems you solve (`/nikigai/problems`)
   - Ideal customer persona (`/nikigai/persona`)
   - Integration/synthesis (`/nikigai/integration`)

3. **Money Model Flows** - Business building assessments:
   - $100M Offer (`/100m-offer`)
   - Attraction Offer (`/attraction-offer`)
   - Upsell/Downsell/Continuity flows
   - Lead Magnet flow
   - Leads Strategy flow

5. **7-Day Challenge System** - Gamified daily quests with:
   - Project selector (challenges tied to specific project)
   - Stage tabs (1-6) for browsing stage-specific quests
   - Points tracked per-project
   - **Groan Challenges** - Stage-specific challenges that push users past comfort zones:
     - Each stage has a unique groan challenge with specific fear to overcome
     - Completing groan challenge is required for graduation
     - Captures protective archetype (Ghost, People Pleaser, Perfectionist, Performer, Controller) and fear type
   - **Groan Reflections** - When completing external/visibility quests:
     - Flow Tracker: Captures Ease/Resistance + Excited/Tired (same as Flow Compass)
     - Protective Voice: Which of 5 archetypes showed up
     - Fear Type: What fear emerged (rejection, judgment, not good enough, failure, visibility, success)
   - **See `docs/7-day-challenge-system.md` for full documentation before making changes**

6. **Nervous System Flow** (`/nervous-system`) - AI chat flow that reveals the boundaries trauma has created around visibility and earning

7. **Healing Compass** (`/healing-compass`) - The process to heal the trauma creating those boundaries

8. **Flow Compass** - Tracks energy/progress on projects using N/E/S/W directions:
   - **North (Green)**: Flow - Ease + Excited
   - **East (Blue)**: Redirect - Resistance + Excited
   - **South (Red)**: Rest - Resistance + Tired
   - **West (Yellow)**: Honour - Ease + Tired
   - Visualized as vertical aerial river (bottom-to-top)

9. **Profile Dashboard** - Shows archetype, clusters, and progress

10. **Library of Answers** (`/library`) - All discoveries organized by category with project filter

11. **Push Notifications** - Reminder system for challenges

---

## Database Schema

### Core Tables:

| Table | What it stores |
|-------|----------------|
| `user_stage_progress` | Persona, onboarding status per user |
| `user_projects` | User's projects with `current_stage` (1-6), `is_primary`, `total_points` |
| `flow_sessions` | All assessment flow completions (tracks `flow_type` + `project_id`) |
| `milestone_completions` | Completed milestones per user/project |
| `quest_completions` | Completed daily quests (with `project_id`) |
| `challenge_progress` | 7-day challenge sessions with status (active/completed/abandoned) |
| `groan_reflections` | **NEW** Captures protective voices and fears on quest completion |

### Flow Data Tables:

| Table | What it stores |
|-------|----------------|
| `nikigai_clusters` | AI-generated skill/problem/persona clusters |
| `nikigai_responses` | User responses in flows |
| `nikigai_key_outcomes` | Selected opportunities from flows |
| `persona_profiles` | Customer persona definitions |
| `nervous_system_responses` | Nervous system calibration data |
| `healing_compass_responses` | Healing compass entries |

### Validation Tables:

| Table | What it stores |
|-------|----------------|
| `validation_flows` | User-created validation surveys |
| `validation_responses` | Responses to validation surveys |

### Assessment Tables:

| Table | What it stores |
|-------|----------------|
| `attraction_offer_assessments` | Attraction offer flow results |
| `upsell_assessments` | Upsell flow results |
| `downsell_assessments` | Downsell flow results |
| `continuity_assessments` | Continuity flow results |
| `leads_assessments` | Leads strategy results |
| `lead_magnet_assessments` | Lead magnet flow results |

### Supporting Tables:

| Table | What it stores |
|-------|----------------|
| `user_projects` | User's project/business entities |
| `flow_entries` | Flow compass direction logs |
| `conversation_logs` | Logged conversations for challenges |
| `profiles` | User profile data |
| `push_subscriptions` | Web push notification subscriptions |

---

## Important Patterns

### 1. Data Fetching
All database access uses Supabase client:
```javascript
import { supabase } from './lib/supabaseClient'

// Fetch
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('user_id', userId)

// Insert
const { error } = await supabase
  .from('table_name')
  .insert({ ... })
```

### 2. Authentication
All protected routes use `<AuthGate>`:
```jsx
<Route path="/protected" element={
  <AuthGate>
    <ProtectedComponent />
  </AuthGate>
} />
```

Access user via hook:
```javascript
import { useAuth } from './auth/AuthProvider'
const { user } = useAuth()
```

### 3. AI Flows
Flows use JSON question files in `/public/` and the `NikigaiTest.jsx` component:
```jsx
<NikigaiTest flowFile="100m-offer-flow.json" flowName="$100M Offer Builder" />
```

AI responses handled by edge function `nikigai-conversation`.

### 4. Graduation System (Project-Based)
Defined in `src/lib/stageConfig.js` and `src/lib/graduationChecker.js`.

**To graduate a project to the next stage, user must complete:**
- Required flows for the stage (`flow_sessions` table)
- Required milestones (`milestone_completions` table)
- Stage-specific groan challenge (`quest_completions` table)

**Key Functions:**
```javascript
import { checkProjectGraduationEligibility, graduateProject } from './lib/graduationChecker'

// Check if ready to graduate
const result = await checkProjectGraduationEligibility(userId, projectId, challengeInstanceId)
// Returns: { eligible, requirements: { flows, milestones, groanChallenge } }

// Graduate to next stage
await graduateProject(userId, projectId, currentStage, nextStage)
```

**Note:** Legacy persona-based graduation (`checkGraduationEligibility`) still exists for backwards compatibility but is being deprecated.

### 5. CSS Pattern
Each component has a matching CSS file. Brand colors defined in `src/index.css`:
```css
:root {
  --purple: #5e17eb;
  --gold: #ffdd27;
  --warm-gray: #f8f9fa;
  --text-gray: #495057;
}
```

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

For GitHub Actions (in repo secrets):
```
SUPABASE_PROJECT_REF       # qlwfcfypnoptsocdpxuv
SUPABASE_ACCESS_TOKEN      # From Supabase dashboard
```

---

## Communication Style

When explaining code changes to the user, use the LEGO castle analogy to make technical concepts accessible. For example:

- "I'm adding a new brick to your components folder"
- "This connects the form to your storage chest (database)"
- "I'm updating the hidden mechanism (lib/) that controls graduation"
- "This messenger (edge function) will talk to Claude AI for you"
- "I'm adding a new room (page) to your castle"

---

## Database Access (for Claude)

Query the database using the REST API script:
```bash
./scripts/db-query.sh <table> [columns] [filters]

# Examples:
./scripts/db-query.sh user_stage_progress
./scripts/db-query.sh flow_sessions "id,flow_type,status" "status=eq.completed&limit=10"
./scripts/db-query.sh milestone_completions "*" "order=created_at.desc&limit=5"
```

---

## What's Next

### Completed (Dec 2024 Refactor):
- [x] Project-Based Challenges - Multiple projects with stage progression
- [x] Universal 6-Stage System - All projects follow same 6 stages
- [x] Stage-Specific Groan Challenges - Each stage has unique groan challenge
- [x] Groan Reflections Table - Captures fears/archetypes on quest completion
- [x] FlowMapRiver Visualization - Vertical aerial river (bottom-to-top)
- [x] Library of Answers with Project Filter

### Pending Features:
1. **Groan Reflection UI** - Add inline capture when completing external quests (protective archetype + fear dropdown)

2. **Badges & Achievements** - Add `user_badges` table and award badges for milestones

3. **Pod Leaderboards** - Group "pods" for 7-day challenge with team scoring

4. **AI Personalization** - Use groan_reflections data to personalize coaching ("Your most common fear is judgment...")

5. **Stage 5-6 Milestones** - Finalize milestone definitions for Campaign Creation and Launch stages

---

## Quick Commands

```bash
# Development
npm run dev                    # Start dev server

# Database
npm run db:push               # Apply migrations
npm run db:query <table>      # Query via REST API

# Functions
npm run functions:deploy      # Deploy edge functions

# Build
npm run build                 # Production build
```

---

## Project Links

- **Live**: https://findmyflow.nichuzz.com
- **Repo**: https://github.com/Nic-Huzz/findmyflow
- **Supabase**: https://supabase.com/dashboard/project/qlwfcfypnoptsocdpxuv
