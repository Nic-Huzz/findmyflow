# FindMyFlow - Project Guide for Claude

## Project Overview

FindMyFlow is a personal development web app that helps burnt-out professionals discover their ideal career path and build a business around their natural strengths. Users complete AI-guided "flows" (interactive questionnaires) to identify their skills, problems they solve, and ideal customer personas. The app is built on the **Nikigai** framework (Nic + Ikigai - the creator's adaptation of the Japanese concept).

**Architecture (Jan 2025):**
- **Project-Centric**: Users can have multiple projects, each with its own stage progression
- **Universal 7-Stage System**: All projects follow 6 progression stages + 1 always-accessible tracking stage
- **CRM Command Center**: Tower-based marketing & sales hub (Attract, Nurture, Tools) for operational execution
- **Groan Matrix**: AI-generated courage challenges mapped across skills × visibility layers
- **Gamified 7-Day Challenges**: Stage-specific quests with groan challenges that push users past comfort zones
- **Zarlo AI Co-Founder**: Context-aware AI assistant available on every page
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
│   ├── flows/                         # All flow components
│   │   ├── MoneyModelFlowBase.jsx     # Shared base for all Money Model flows (450 lines)
│   │   ├── moneyModelConfigs.js       # Configuration for Money Model flows
│   │   ├── AttractionOfferFlow.jsx    # Thin wrapper (~35 lines)
│   │   ├── UpsellFlow.jsx             # Thin wrapper
│   │   ├── DownsellFlow.jsx           # Thin wrapper
│   │   ├── ContinuityFlow.jsx         # Thin wrapper
│   │   ├── LeadsStrategyFlow.jsx      # Thin wrapper
│   │   ├── OfferBuilderFlow.jsx       # $100M Offer builder
│   │   ├── LeadMagnetSelectionFlow.jsx # Lead magnet type selector
│   │   ├── ProductSelectionFlow.jsx   # Product value equation
│   │   ├── FunnelBuilderFlow.jsx      # Campaign funnel builder
│   │   ├── FunnelCalculator.jsx       # Stage 7 funnel metrics tracker
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
│   │   ├── crm/                       # CRM system components
│   │   │   ├── CRMLayout.jsx          # Wrapper with nudge engine + onboarding
│   │   │   ├── EmptyState.jsx         # Empty state displays
│   │   │   ├── OnboardingTour.jsx     # First-time CRM user guidance
│   │   │   ├── PageTransition.jsx     # Smooth route transitions
│   │   │   ├── PromptGenerator.jsx    # AI prompt generation interface
│   │   │   ├── PullToRefresh.jsx      # Mobile refresh gesture
│   │   │   ├── Skeleton.jsx           # Loading placeholders
│   │   │   └── index.js               # Barrel export (20+ components)
│   │   │
│   │   ├── onboarding/QuickCapture/   # Streamlined onboarding
│   │   │   ├── QuickCapture.jsx       # 5-step business data capture
│   │   │   ├── MultiProductCapture.jsx # Multi-product support
│   │   │   └── DeliverySelector.jsx   # Product type selection
│   │   │
│   │   ├── GroanMatrix.jsx            # 2D courage challenge matrix
│   │   ├── QuestCard.jsx              # Unified quest card (317 lines)
│   │   ├── ChallengeHeader.jsx        # Challenge header with points/settings
│   │   ├── ChallengeOnboarding.jsx    # Welcome & group selection screens
│   │   ├── ChallengeLeaderboard.jsx   # Leaderboard display
│   │   ├── ChallengeFilters.jsx       # Filter chips for quests
│   │   ├── ChallengeProjectSelector.jsx # Project selection UI
│   │   ├── ChallengeStageTabs.jsx     # Stage tabs (1-6)
│   │   │
│   │   ├── GroanReflectionInput.jsx   # 5-step groan reflection form
│   │   ├── RecogniseQuestInput.jsx    # Essence/protective voice tracking
│   │   ├── RewireQuestInput.jsx       # Behavior change quests
│   │   ├── ReleaseQuestInput.jsx      # Emotional release tracking
│   │   ├── ReconnectQuestInput.jsx    # Meditation, breathwork, prayer
│   │   ├── LaunchReviewInput.jsx      # 5-question launch rating
│   │   ├── FlowCompassInput.jsx       # N/E/S/W direction picker
│   │   ├── ConversationLogInput.jsx   # Conversation logging form
│   │   ├── MilestoneInput.jsx         # Milestone completion form
│   │   │
│   │   ├── Zarlo/                     # AI Co-Founder widget
│   │   │   ├── ZarloWidget.jsx        # Floating button trigger
│   │   │   ├── ZarloChat.jsx          # Chat modal with streaming
│   │   │   ├── ZarloMessage.jsx       # Individual message display
│   │   │   ├── ZarloQuickReplies.jsx  # Suggested replies
│   │   │   └── index.js               # Barrel export
│   │   │
│   │   ├── FlowMap.jsx                # Dashboard clusters display
│   │   ├── FlowMapRiver.jsx           # Vertical river visualization (clickable with popups)
│   │   ├── FlowMapMockups.jsx         # Design mockups page
│   │   ├── FlowCompass.jsx            # Direction picker wrapper
│   │   ├── SeeYourFlow.jsx            # Journey mapping + check-in component
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
│   │   ├── PublicValidationFlow.jsx   # Public validation survey
│   │   │
│   │   └── crm/                       # CRM tower pages
│   │       ├── Dashboard.jsx          # CRM command center (HQ)
│   │       ├── Attract.jsx            # Attract tower hub
│   │       ├── Nurture.jsx            # Nurture tower hub
│   │       ├── Tools.jsx              # Tools tower hub
│   │       ├── Marketing.jsx          # Content creation
│   │       ├── Pages.jsx              # Landing page tracking
│   │       ├── Sales.jsx              # Sales pipeline
│   │       ├── Contacts.jsx           # Contact database
│   │       ├── EmailSequences.jsx     # Email automation
│   │       ├── WarmOutreach.jsx       # Warm lead follow-up
│   │       └── Execute.jsx            # Weekly execution
│   │
│   ├── profiles/                      # Profile display components
│   │   ├── EssenceProfile.jsx         # Essence archetype display
│   │   └── ProtectiveProfile.jsx      # Protective archetype display
│   │
│   ├── lib/                           # Utilities and helpers
│   │   ├── supabaseClient.js          # Database connection
│   │   ├── stageConfig.js             # Universal 7-stage + Groans configuration
│   │   ├── haptics.js                 # Mobile haptic feedback (vibration API)
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
│   │   ├── templates/                 # AI prompt templates
│   │   │   ├── nervousSystemTemplates.js
│   │   │   ├── essenceRevealTemplate.js
│   │   │   └── protectiveMirrorTemplate.js
│   │   ├── zarlo/                     # Zarlo AI system
│   │   │   ├── zarloEngine.js         # Conversation management
│   │   │   └── zarloPageContent.js    # Context-aware page content
│   │   │
│   │   └── crm/                       # CRM services & utilities
│   │       ├── index.js               # Barrel export (20+ services)
│   │       ├── contentContext.js      # User data aggregation for prompts
│   │       ├── promptTemplates.js     # AI prompt library for copy generation
│   │       └── towerStats.js          # Live stats for tower cards
│   │
│   ├── data/                          # Static configuration
│   │   ├── personaProfiles.js         # Persona definitions
│   │   ├── protectiveProfiles.js      # Protective archetype data
│   │   ├── essenceProfiles.js         # Essence archetype data
│   │   └── nervousSystemBeliefs.js    # NS belief configurations
│   │
│   ├── styles/                        # Shared CSS
│   │   └── flow-base.css              # Shared flow styles (buttons, resume, etc.)
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
│   └── AuthGate.jsx                   # Protected route wrapper
│
├── supabase/
│   ├── functions/                     # Edge Functions
│   │   ├── graduation-check/          # Graduation requirements
│   │   ├── nikigai-conversation/      # AI conversation handler
│   │   ├── nervous-system-mirror/     # NS AI analysis
│   │   ├── groan-challenge-generator/ # AI-generated groan challenges
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
├── docs/                              # Documentation (31 files)
│   ├── 7-day-challenge-system.md      # Challenge system docs
│   ├── session-2024-12-26-journey-mapping.md # Journey mapping session
│   ├── 2024-12-21-refactoring-session.md # Major refactoring docs
│   ├── CSS-SCOPING-GUIDELINES.md      # CSS scoping best practices
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
| `/offer-builder` | OfferBuilderFlow | $100M Offer builder |
| `/lead-magnet-selection` | LeadMagnetSelectionFlow | Lead magnet type selector |
| `/product-selection` | ProductSelectionFlow | Product value equation |
| `/funnel-builder` | FunnelBuilderFlow | Campaign funnel builder |
| `/funnel-calculator` | FunnelCalculator | Stage 7 funnel metrics |
| `/persona-selection` | PersonaSelectionFlow | Customer persona |
| `/validation-flows` | ValidationFlowsManager | Survey manager |
| `/v/:shareToken` | PublicValidationFlow | Public survey (no auth) |
| `/settings/notifications` | NotificationSettings | Notification prefs |
| `/feedback` | Feedback | User feedback |
| `/money-model-guide` | MoneyModelGuide | Educational overview |
| **CRM Routes** | | |
| `/crm` | Dashboard | CRM command center (HQ) |
| `/crm/attract` | Attract | Lead acquisition tower hub |
| `/crm/nurture` | Nurture | Relationship building tower hub |
| `/crm/tools` | Tools | Analytics & implementation hub |
| `/crm/marketing` | Marketing | Content creation |
| `/crm/pages` | Pages | Landing page tracking |
| `/crm/sales` | Sales | Sales pipeline & deals |
| `/crm/contacts` | Contacts | Contact database |
| `/crm/email-sequences` | EmailSequences | Email automation |
| `/crm/warm-outreach` | WarmOutreach | Warm lead follow-up |
| `/crm/execute` | Execute | Weekly task execution |

---

## Key Features

### 1. Universal 7-Stage System
All projects follow these stages (Stage 7 is always accessible):

| Stage | Name | Focus |
|-------|------|-------|
| 1 | Validation | Validate with real customers |
| 2 | Product Creation | Build core offer + lead magnet |
| 3 | Testing | Test with users, gather feedback |
| 4 | Money Models | Upsells, downsells, continuity |
| 5 | Campaign Creation | Lead generation strategy |
| 6 | Launch | Execute launch with leads funnel |
| 7 | Tracking | Funnel metrics & optimization (always accessible) |

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

### 7. Journey Mapping & SeeYourFlow
Multi-step journey mapping for new users, check-in mode for returning users.

**First-Time Flow (5 Steps):**
| Step | Question | Creates |
|------|----------|---------|
| 1 | Current State (two-factor) | Flow entry with direction |
| 2 | Journey Start (month picker) | Backdated entry tagged North |
| 3 | Highlights (up to 3) | North entries with titles |
| 4 | Challenges (up to 3) | East/South entries based on feeling |
| 5 | Summary | Celebration with stats |

**Returning User Mode:**
- Two-factor questions (Excited/Tired + Great/Facing resistance)
- Headline + Comment fields
- Date option: "Most Recent" or "Choose Date"
- Progress saved to localStorage for resume

**Two-Factor Flow Model:**
| Internal | External | Direction | Color |
|----------|----------|-----------|-------|
| Excited | Great (Ease) | North | Green |
| Excited | Facing Resistance | East | Blue |
| Tired | Great (Ease) | West | Yellow |
| Tired | Facing Resistance | South | Red |

### 8. First-Time Onboarding
`HomeFirstTime.jsx` orchestrates new user onboarding:
1. Welcome screen with user name
2. 3 persona questions → persona reveal
3. Branch by persona:
   - Vibe Seeker → Flow Finder explainer → `/nikigai/skills`
   - Vibe Riser/Movement Maker → Project type choice
     - "Start Fresh" → Flow Finder
     - "Existing Project" → `ExistingProjectFlow` (6-step capture)

**ExistingProjectFlow** captures: Name → Description → Skills (3) → Problem → Persona → Stage

### 9. Zarlo AI Co-Founder
Context-aware AI assistant available on every page via floating widget.

**Components:**
- `ZarloWidget.jsx` - Floating button (bottom-right)
- `ZarloChat.jsx` - Modal with streaming chat
- `zarloEngine.js` - Conversation management with Anthropic API
- `zarloPageContent.js` - Page-specific context content

**Features:**
- Streams responses in real-time
- Context-aware (knows which page user is on)
- Conversation history saved to `zarlo_conversations` table
- Quick reply suggestions based on context

### 10. Funnel Calculator (Stage 7)
Spreadsheet-like funnel tracking tool at `/funnel-calculator`.

**Two Modes:**
- **Actual Mode**: Track real campaign numbers
- **Planner Mode**: Project outcomes with industry-average conversion rates

**Funnel Stages Tracked:**
1. Awareness (people reached)
2. Attraction Offer (engagements)
3. Lead Magnet (opt-ins)
4. Nurture (engaged leads)
5. Core Offer (sales)
6. Upsell (conversions)
7. Downsell (conversions)
8. Continuity (subscribers)

**Industry Average Rates (Planner Mode):**
- Awareness → Attraction: 5%
- Attraction → Lead Magnet: 25%
- Lead Magnet → Nurture: 40%
- Nurture → Core: 5%
- Core → Upsell: 20%
- Core → Downsell: 30%
- Core → Continuity: 15%

### 11. CRM Command Center (Jan 2025)
Tower-based marketing & sales management system at `/crm`.

**Three Towers:**

| Tower | Focus | Key Pages |
|-------|-------|-----------|
| **Attract** | Lead acquisition | Content, Landing Pages, Cold Outreach, Ads |
| **Nurture** | Relationship building | Contacts, Email Sequences, Pipeline, Warm Outreach |
| **Tools** | Analytics & execution | Analytics, Calculators, Scripts, Implementations |

**Dashboard Stats:**
- Total Points (gamification)
- Current Streak (daily consistency)
- Monthly Revenue ($)
- Pipeline Value ($)

**Key Components:**
- `CRMLayout.jsx` - Wrapper with nudge engine + onboarding tour
- `PullToRefresh` - Mobile refresh gesture with haptic feedback
- `PageTransition` - Smooth route transitions
- `Skeleton` components - Loading placeholders
- `PromptGenerator` - AI prompt generation interface

**CRM Library Services (`src/lib/crm/index.js`):**
- Task Management, Deal/Sales Pipeline, Analytics & Reporting
- Stats & Gamification (LEVELS system), Funnel Actuals
- Recommendations Engine, Content Triggers, Ascension Engine
- Tone Adapter (psychological prompt personalization)
- Tower Stats, Groan Challenge Service

### 12. Groan Matrix (Courage Challenges)
2D matrix of AI-generated courage challenges at user level.

**Matrix Structure:**
- **Rows**: User's discovered skills, problems, or personas (from Flow Finder)
- **Columns**: 5 visibility layers representing fear dimensions
- **Cells**: AI-generated challenges for each combination

**5 Visibility Layers:**

| Layer | Icon | Fear | Difficulty |
|-------|------|------|------------|
| SCREEN | 📱 | Being seen online | 1 |
| LIVE | ⚡ | Real-time judgment | 2 |
| MONEY | 💰 | "Am I worth it?" | 3 |
| VULNERABLE | 💗 | Rejected for real self | 4 |
| AUTHORITY | 👑 | Imposter syndrome | 5 |

**Essence Zone Scoring:**
Based on `scary_score` (1-10) + `wahoo_score` (1-10):
- High scary + High wahoo = "essence zone" (trauma around expressing true self)
- High scary + Low wahoo = "protective voice speaking"
- Low scary + High wahoo = "comfort zone"
- Low scary + Low wahoo = "neutral zone"

**Challenge Workflow:**
- `generated` → `accepted` → `completed` (with proof) or `skipped` (with reason)
- Proof types: link, screenshot, text
- 48hr follow-up outcomes: engagement, conversations, call_booked, sale_made

### 13. QuickCapture Onboarding
Streamlined 5-step flow for capturing user business data.

**Steps:**
1. Skills selection (from wheel taxonomy)
2. Problems selection (from wheel taxonomy)
3. Personas selection (from wheel taxonomy)
4. Products capture (category → type → subtype)
5. Summary/confirmation

**Product Categories:**
- **Service**: Custom (1:1) or Packaged
- **Productized**: Live Group, Self-Paced Course, Managed Service
- **Product**: Digital, Software/App, Physical

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
// UpsellFlow.jsx - thin wrapper
import MoneyModelFlowBase from './MoneyModelFlowBase'
import { MONEY_MODEL_CONFIGS } from './moneyModelConfigs'

function UpsellFlow() {
  return <MoneyModelFlowBase config={MONEY_MODEL_CONFIGS.upsell} />
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

### 6. CSS Scoping Convention
Always scope CSS selectors to parent containers to prevent conflicts:
```css
/* BAD - affects all .entry-card elements globally */
.entry-card { background: #fafafa; }

/* GOOD - scoped to parent container */
.timeline-entry .entry-card { background: #fafafa; }

/* GOOD - scoped with component class */
.see-your-flow .entry-card { background: rgba(255,255,255,0.1); }
```
See `docs/CSS-SCOPING-GUIDELINES.md` for full conventions.

### 7. Shared Flow CSS (flow-base.css)
All assessment flows use shared styles from `src/styles/flow-base.css`:
```css
@import '../styles/flow-base.css';
```

**Shared classes available:**
- `.primary-button` / `.secondary-button` - Standard button styling
- `.welcome-container` - Flex container with button-at-bottom pattern
- `.resume-prompt` - Resume session prompt (centered, max-width: 400px)
- `.time-icon` - Stopwatch emoji (4rem)
- `.nav-buttons` - Navigation button container
- `.option-btn` - Selection option buttons
- `.input-group` - Form input with label
- `.info-box` - Info/help box styling
- `.loading-state` / `.spinner` - Loading indicators
- `.progress-dots` / `.progress-dot` - Progress indicators
- `.error-message` - Error text styling

**Creating new flows:**
1. Import flow-base.css at top of flow CSS file
2. Use standard class names for common UI elements
3. Add flow-specific classes with `.my-flow .element` scoping
4. Keep unique structural elements with flow-specific prefixes (e.g., `.fb-welcome`)

### 8. localStorage for Progress
Multi-step flows save progress to localStorage for resume:
```javascript
// Save progress
localStorage.setItem(`journey_mapping_${userId}_${projectId}`, JSON.stringify({ step, data }))

// Check completion
localStorage.getItem(`journey_mapping_completed_${userId}_${projectId}`)
```

### 9. Tower-Based Organization (CRM)
CRM features grouped into 3 "towers" representing business functions:
```javascript
// Each tower has: hub page, quick stats, individual feature pages
const towers = {
  attract: { pages: ['marketing', 'pages', 'cold-outreach', 'ads'] },
  nurture: { pages: ['contacts', 'email-sequences', 'sales', 'warm-outreach'] },
  tools: { pages: ['analytics', 'calculators', 'scripts', 'execute'] }
}
```

### 10. Content Context Normalization
`contentContext.js` aggregates data from multiple challenge flows:
```javascript
import { getContentContext } from './lib/crm/contentContext'

const context = await getContentContext(userId)
// Returns normalized: persona, offer, validation, proof, launch, voice, products
```

### 11. Prompt Template Library
Prompts as templated functions for external AI tools:
```javascript
import { generateLandingPagePrompt, checkTemplateReadiness } from './lib/crm/promptTemplates'

// Check if user has required data
const { ready, missing } = checkTemplateReadiness('landingPage', availableData)

// Generate copy-paste ready prompt
const prompt = generateLandingPagePrompt(context)
```

### 12. Pull-to-Refresh Pattern
All CRM pages support native mobile pull-to-refresh:
```javascript
import { PullToRefresh, usePullToRefresh } from './components/crm'

function MyPage() {
  const { refreshing, onRefresh } = usePullToRefresh(fetchData)
  return <PullToRefresh onRefresh={onRefresh}>{content}</PullToRefresh>
}
```

### 13. Haptic Feedback
Simple haptic patterns for mobile immersion:
```javascript
import { hapticLight, hapticMedium, hapticSuccess, hapticError } from './lib/haptics'

// Usage
hapticLight()      // 10ms vibration
hapticMedium()     // 20ms vibration
hapticSuccess()    // 10ms, 50ms pause, 20ms pattern
hapticError()      // 50ms, 30ms pause, 50ms pattern
```

---

## Database Schema

### Core Tables

| Table | What it stores |
|-------|----------------|
| `user_stage_progress` | Persona, onboarding status per user |
| `user_projects` | Projects with `current_stage` (1-6), `total_points` |
| `flow_sessions` | Flow completions (tracks `flow_type` + `project_id`) |
| `flow_entries` | Flow compass entries (direction, internal/external state, headline, comment) |
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
| `lead_flow_profiles` | Lead capture profiles with essence/protective archetypes |

### Assessment Tables

| Table | What it stores |
|-------|----------------|
| `attraction_offer_assessments` | Attraction offer results |
| `upsell_assessments` | Upsell flow results |
| `downsell_assessments` | Downsell flow results |
| `continuity_assessments` | Continuity flow results |
| `leads_assessments` | Leads strategy results |
| `lead_magnet_assessments` | Lead magnet results |
| `offer_builder_assessments` | $100M Offer builder results |
| `funnel_metrics` | Funnel calculator tracking data |
| `zarlo_conversations` | Zarlo AI chat history |

### CRM Tables (Jan 2025)

| Table | What it stores |
|-------|----------------|
| `crm_pages` | Landing/sales pages with visitors, conversions, generated copy |
| `crm_contacts` | Contact database with lifecycle stages (lead → customer → evangelist) |
| `crm_email_sequences` | Email campaign definitions with open/click rates |
| `crm_email_steps` | Individual emails in sequences with metrics |
| `crm_warm_leads` | Warm lead tracking with platform, engagement type, priority |

### Groan Matrix Tables (Jan 2025)

| Table | What it stores |
|-------|----------------|
| `groan_challenges` | Main challenge data with scary/wahoo scores, visibility layer, source type |
| `groan_proof` | Proof of challenge completion (link, screenshot, text) |
| `groan_contract_evidence` | Accountability contracts |
| `groan_outcomes` | 48hr follow-up results (engagement, conversations, sales) |
| `groan_streaks` | User streak tracking with badges |
| `groan_user_preferences` | User opt-in preferences for tracking |

**Groan ENUMs:**
- `groan_visibility_layer`: screen, live, money, vulnerable, authority
- `groan_source_type`: skill, problem, persona
- `groan_challenge_status`: active, completed, skipped
- `groan_outcome_type`: engagement, conversations, call_booked, sale_made, nothing_yet, unexpected

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

## Recent Updates

### Jan 2025: CRM Command Center & Groan Matrix

**CRM System (Major Addition)**
- Tower-based marketing & sales hub: Attract, Nurture, Tools
- Dashboard command center with quick stats and actions
- New routes: `/crm`, `/crm/attract`, `/crm/nurture`, `/crm/tools`, etc.
- Pull-to-refresh with haptic feedback on all CRM pages
- Skeleton loading states for better perceived performance
- Onboarding tour for first-time CRM users
- Nudge engine for context-aware micro-coaching

**CRM Pages:**
- `Marketing.jsx` - Content creation with AI assistance
- `Pages.jsx` - Landing page tracking with AI copy generation
- `Sales.jsx` - Sales pipeline with deal stages
- `Contacts.jsx` - Contact database with lifecycle stages
- `EmailSequences.jsx` - Email automation builder
- `WarmOutreach.jsx` - Warm lead follow-up management
- `Execute.jsx` - Weekly task execution

**CRM Library (`src/lib/crm/`):**
- `contentContext.js` - Aggregates user data from multiple sources for prompts
- `promptTemplates.js` - AI prompt library (landing pages, sales pages, email sequences, etc.)
- `towerStats.js` - Real-time stats for tower card displays
- `index.js` - Barrel export with 20+ service modules

**Groan Matrix System:**
- 2D challenge matrix: user skills × 5 visibility layers
- AI-generated courage challenges with scary/wahoo scoring
- Essence zone calculation for authentic growth identification
- Proof collection system (link, screenshot, text)
- 48hr follow-up outcomes tracking
- New tables: `groan_challenges`, `groan_proof`, `groan_outcomes`, `groan_streaks`

**QuickCapture Onboarding:**
- `QuickCapture.jsx` - 5-step business data capture
- `MultiProductCapture.jsx` - Multi-product support
- `DeliverySelector.jsx` - Product type selection (Service/Productized/Product)

**New Components:**
- `PullToRefresh` - Mobile refresh gesture with haptic feedback
- `PageTransition` - Smooth route transitions
- `Skeleton` components - Loading placeholders (Card, Stat, Dashboard, Tower)
- `OnboardingTour` - First-time user guidance
- `PromptGenerator` - AI prompt generation interface
- `EmptyState` - Empty state displays

**New Utilities:**
- `haptics.js` - Mobile vibration API wrappers (light, medium, success, error patterns)

**Database Migrations:**
- `20260123000000_crm_pages.sql` - CRM pages table
- `20260123000001_groan_matrix_system_fixed.sql` - Full Groan Matrix schema
- `20260124000000_nurture_tables.sql` - Contacts, email sequences, warm leads

**Stage Configuration Updates:**
- Added Groans as Stage 0.5 (always accessible, user-level)
- `isGroansStage` flag for quest filtering

---

### Dec 2024

#### Dec 30: Stage 7 Tracking, Zarlo AI, Quest UI Overhaul
**Stage 7: Funnel Calculator**
- New always-accessible Tracking stage (Stage 7)
- `FunnelCalculator.jsx` with Actual + Planner modes
- Industry average conversion rates for projections
- Revenue calculations (one-time + recurring)
- `funnel_metrics` database table

**Zarlo AI Co-Founder**
- `ZarloWidget` floating button + modal on all pages
- `ZarloChat` with streaming responses
- Context-aware page content system
- `zarloEngine.js` for conversation management
- `zarlo_conversations` table for history

**Quest Input Components Overhaul**
- `RecogniseQuestInput` - Essence/protective voice cards
- `RewireQuestInput` - Expanded with multiple quest types
- `ReleaseQuestInput` - Improved daily/weekly release UI
- `ReconnectQuestInput` - Meditation, breathwork, prayer tracking
- `GroanReflectionInput` - Refined 5-step reflection flow
- `LaunchReviewInput` - New 5-question launch rating system

**New Challenge Quests**
- Stage 5: Content Plan, Lead Capture, Nurture Sequence, CRM Setup
- Stage 6: Launch Sequence, First 10 Signups, Post-Launch Review
- Stage 7: Funnel Calculator, Baseline, Weekly Update

**Other Changes**
- Archived `LeadMagnetFlow` (replaced by `LeadMagnetSelectionFlow`)
- `FunnelBuilderFlow` enhanced with offer stack display
- New routes: `/offer-builder`, `/lead-magnet-selection`, `/product-selection`, `/funnel-builder`, `/funnel-calculator`

#### Dec 26-27: Journey Mapping & Flow River Popups
**New Features:**
- `SeeYourFlow.jsx` - 5-step journey mapping for first-time users, check-in mode for returning users
- FlowMapRiver clickable markers with popup details
- LocalStorage progress saving for journey mapping resume
- Updated FlowCompassPage quick log with two-factor questions

**CSS Fixes:**
- Scoped `.entry-card` in FlowCompassPage.css to `.timeline-entry .entry-card` to prevent conflicts

**Documentation:**
- `docs/session-2024-12-26-journey-mapping.md` - Full session details

#### Dec 21: Challenge.jsx Decomposition
Reduced from 3,261 to 1,058 lines (68% reduction):
- Extracted `useChallengeData.js` hook (1,147 lines)
- Created `QuestCard.jsx` component (317 lines)
- Created `ChallengeHeader.jsx` (108 lines)
- Created `ChallengeOnboarding.jsx` (124 lines)
- Created `ChallengeLeaderboard.jsx` (90 lines)
- Created `ChallengeFilters.jsx` (86 lines)

#### Money Model Consolidation
Reduced 6 flows from ~3,572 lines to ~209 lines (94% reduction):
- Created `MoneyModelFlowBase.jsx` (450 lines)
- Created `moneyModelConfigs.js` for all configurations
- Each flow is now a thin wrapper (~35 lines)

#### Deleted Unused Components
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
