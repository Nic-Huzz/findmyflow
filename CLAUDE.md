# FindMyFlow - Claude Guide

## Overview

Personal development web app helping burnt-out professionals discover their ideal career path. Built on **Nikigai** framework (Nic + Ikigai). Users complete AI-guided "flows" to identify skills, problems they solve, and ideal customers.

**The Journey Story (Zone Calibration Framework):**

Users arrive at FindMyFlow at **The Crack** or after sitting in **Head Full of Dreams** too long. The app's job is to move them along the Sprouter diagonal toward **Self-Actualisation** (self-knowledge + action moving together).

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

**FindMyFlow's value proposition**: We build your X axis so your Y axis stops wasting your life.

See `docs/zone-calibration-framework.md` for the full theoretical framework (Original IP: Huzz Hurrell).

**Core Architecture:**
- **Project-Centric**: Multiple projects per user, each with stage progression
- **10-Stage System**: Flow Finder (0), Play-List (0.5), Setup (0.9), Stages 1-7, Tracking (8)
- **Fantasy League**: Solo-player competitive league with 3 scoring categories and weekly matchups
- **Play Profile**: Founder DNA assessment with AI-powered stuck-point diagnostics
- **CRM Command Center**: Tower-based marketing/sales hub (Attract, Nurture, Tools)
- **Groan Matrix**: AI-generated courage challenges across skills × visibility layers
- **7-Day Challenges**: Gamified stage-specific quests
- **Weekly Planning**: 4-phase cycle (Push, Flow, Rest, Launch)
- **Zarlo AI**: Context-aware assistant on every page
- **Stripe Payments**: Business stages 1-7 gated behind one-time or recurring payment
- **Brand Colors**: Purple (#5e17eb) → Gold (#E9A23B) ombre gradient
- Based on Alex Hormozi's $100M Offers framework

## Tech Stack

React 18 + Vite + React Router v7 | Supabase (PostgreSQL, Auth, Edge Functions) | Anthropic Claude API | Vercel | Web Push API

## Folder Structure

```
src/
├── flows/                    # 71 flow components
│   ├── MoneyModelFlowBase.jsx      # Shared base (6 flows use this)
│   ├── moneyModelConfigs.js        # Money Model configurations
│   ├── FlowFinder*.jsx             # Skills, Problems, Persona, Integration
│   ├── *OfferFlow.jsx              # Attraction, Upsell, Downsell, GrandSlam
│   ├── FunnelCalculator.jsx        # Stage 8 metrics tracker
│   └── NervousSystemFlow.jsx, HealingCompass.jsx, etc.
│
├── hooks/
│   ├── useChallengeData.js   # Challenge state management
│   ├── useLeagueData.js      # Fantasy league state management
│   ├── useMatchupData.js     # Live matchup scoring + opponent fetch
│   ├── useNewsfeed.js        # League activity feed + reactions
│   ├── useCelebrations.js    # Confetti, toasts, level-up animations
│   ├── useExecute.js         # Execute page operations
│   └── useAutoSave.js, useSteppedForm.js
│
├── components/
│   ├── crm/                  # 41 CRM components
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
│   ├── league/               # LeagueLeaderboard.jsx
│   ├── PlayProfile/          # Quiz, Dashboard, DNA, AI Diagnostic, Challenge
│   ├── BusinessSetup.jsx     # Stage 0.9 setup wizard
│   ├── Challenge*.jsx        # Header, Filters, etc.
│   ├── *QuestInput.jsx       # Groan, Recognise, Rewire, Release, etc.
│   ├── GroanMatrix.jsx       # 2D courage challenge matrix
│   ├── QuestCard.jsx         # Unified quest rendering
│   ├── FlowMapRiver.jsx      # River visualization
│   └── SeeYourFlow.jsx       # Journey mapping
│
├── pages/crm/                # 33 CRM pages
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
├── data/                     # Static config (personas, archetypes, beliefs, founderDnaGames, founderDnaStuckPoints)
├── pages/league/             # LeagueOverview, WeekMatchups, MatchupDetails, ContentSubmit, NewsfeedPage, LeagueAdmin
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

**Flow Finder**: `/life-map` (consolidated flow; `/nikigai/skills`, `/nikigai/problems`, `/nikigai/persona` redirect here), `/nikigai/integration`

**Money Model**: `/attraction-offer`, `/upsell-offer`, `/downsell-offer`, `/continuity-offer`, `/leads-strategy`, `/offer-builder`, `/lead-magnet-selection`, `/product-selection`, `/funnel-builder`, `/funnel-calculator`

**Play Profile**: `/play-profile` (quiz + dashboard), `/play-profile?mode=retake`, `/play-profile?mode=unstuck`, `/play-profile?mode=rate`

**Fantasy League**: `/league` (overview), `/league/week` (matchups), `/league/matchup` (details), `/league/submit` (content), `/league/guide`, `/league/admin`, `/fantasy` (landing)

**Journey**: `/get-started` (onboarding), `/essence-mirror` (essence archetype discovery), `/zone-diagnosis/:levelNumber` (zone diagnosis flow)

**Creator Portal**: `/create` (Creator Home with Shift Architecture), `/create/experience/new` (new experience), `/create/experience/:id` (edit experience); `/business` redirects to `/create`

**Direction**: `/career-clarity` (Career Clarity Quiz, public), `/people` (People Matching, AuthGate), `/experience-creators` (Experience Creator Matching)

**Other Flows**: `/nervous-system`, `/healing-compass`, `/persona-selection`, `/validation-flows`, `/v/:shareToken` (public)

**CRM** (`/crm/*`): Dashboard, Attract, Nurture, Tools (tower hubs) | content/create, content/queue, content/history | marketing, pages, sales, sales/scripts, contacts, email-sequences, warm-outreach | execute, analytics, performance, reports | calculators, calculators/ltv, calculators/cac, calculators/ptuf | import, tools/systems | ascension, objections, implementations, assets, autonomous, alerts

## Key Features

### 1. Universal 10-Stage System

| Stage | Name | Color | Focus |
|-------|------|-------|-------|
| 0 | Flow Finder | #5e17eb | Discover skills/problems/personas (always accessible) |
| 0.5 | Play-List | #6d26d7 | Courage challenges via Groan Matrix (always accessible, user-level) |
| 0.9 | Setup | — | Business setup — project creation + product identification (unlocks stages 1-7) |
| 1-7 | Validation → Launch | gradient | Progressive project stages (paid, except "Understand X" explainers) |
| 8 | Tracking | #E9A23B | Funnel metrics (always accessible) |

Stage flags: `alwaysAccessible`, `isUserLevel`, `isGroansStage`

### 2. 7-Day Challenge System

Category tabs: Play-List, Business, Healing, Bonus

Key files: `Challenge.jsx` (main page), `useChallengeData.js` (state), `QuestCard.jsx` (rendering), `ChallengeHeader.jsx`, `ChallengeFilters.jsx`

Layout: Header (matchup banner if in league → score block with 3 category pills → streak/leaderboard/settings/week-type) → Category tabs → Stage tabs (Business only) → Artifact progress → Sub-tabs (Tasks | Deep Dive) → Quest cards. Tracker tab includes `HorizontalFlowRiver` with compass/challenge legend.

**Play-List tab** contains: Flow Finder quests, Skills-only Groan Matrix, Voice logging (essence + protective check-ins). Active challenges section card at top (from `priority_weekly_picks`).

**Priority tab** contains: 7-step onboarding sequence, then layer-based challenge recommendations. Key hook: `usePriorityTab.js` exports `ONBOARDING_QUEST_IDS`, `LAYER_RECOMMENDATIONS`, `computePriorityLayer`, `TENSION_LAYER_DISPLAY`.

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

2D matrix: User skills × 5 visibility layers (Screen→Live→Money→Vulnerable→Authority). On Play-List tab, skills-only with optional problem/persona mapping per cell.

Essence zone scoring: scary_score + wahoo_score → essence zone / protective voice / comfort zone.

Workflow: generated → accepted → completed (with proof) or skipped. 48hr outcome tracking.

Post-completion flow: "I Did It!" → Reflection (scary/wahoo sliders, 3% improvement) → Voice Check-in (essence + protective yes/no) → Compass Check-in (N/E/S/W) → Confetti. Completed cells show "Done ×N" badge and allow repeating via "New Challenge" button.

### 9. Weekly Planning (4-Phase)

| Week | Focus |
|------|-------|
| Push | High-intensity output |
| Flow | Balanced productivity |
| Rest | Recovery & reflection |
| Launch | Campaign execution |

All use purple gradient background; gold for selection.

### 10. First-Time Onboarding

`HomeFirstTime.jsx`: Universal path for all personas — Welcome → Q1 (Journey Stage) → Q2 (Wealth Ladder) → Q3 (Primary Goal) → Persona Reveal → Mind Space → `/me`. No branching by persona type.

### 11. Journey Mapping (SeeYourFlow)

First-time: 5 steps mapping journey highlights/challenges. Returning: Two-factor check-in (Excited/Tired × Great/Resistance). Saves to localStorage.

### 12. /me Page (MePage.jsx)

Dashboard hub with three sections: Hero Profile (archetype, level, XP), Flow Journey (HorizontalFlowRiver with compass + challenge entries, stats rings, SeeYourFlow inline mapper for first-time), Dynamic Quest Section (3-state: onboarding steps when incomplete, layer recommendations when complete, "Set Your Priority" when no tension scores). Design: purple gradient hero cards, gold CTAs, glow orbs. See `docs/page-component-design-guide.md`.

### 13. Hero Profile (/hero-profile)

`HeroCommandCenter.jsx` — project-specific hero profile with identity triad, project expression cards, play-list progress. Route: `/hero-profile` or `/hero-profile/:projectId`.

### 14. Archetypes (/archetypes/essence)

`EssenceProfile.jsx` — displays user's essence archetype profile, strengths, shadow aspects, and integration guidance.

### 15. Library of Answers (/library)

`LibraryOfAnswers.jsx` — three GradientWheel visualizations (Skills, Problems, Personas) showing lit segments from Flow Finder completions. `showLitLabels` prop displays labels on lit segments outside the wheel with multi-word wrapping.

### 16. Flow Compass (/flow-compass)

`FlowCompassPage.jsx` — energy tracking with N/E/S/W compass directions. Restyled to match /me design (purple gradient quick-log hero, white project cards, gold CTAs, glass morphism). Project selector for multi-project users. No sidebar.

### 17. Fantasy League

Solo-player competitive league with 4-week seasons and weekly head-to-head matchups.

**3 Scoring Categories** (from `quest_completions.quest_category`):

| Category | Icon | Color | Quest Categories |
|----------|------|-------|------------------|
| Play-List | 🎮 | #E9A23B | Groans |
| Healing | 💚 | #10b981 | Healing, Daily, Weekly |
| Bonus | ⭐ | #E9A23B | Bonus, Tracker + approved content submissions |

**Match Points**: WIN (2+ categories) = 3pts, DRAW (1-1 split) = 1pt, LOSS = 0pts.

**Content Submissions**: 10 types (2-10pts each), admin-approved, feed into Bonus category. Reaction system (cheer/fire/clap/heart).

**Key files**: `src/lib/league/` (leagueConfig, leagueService, leagueScoring), `src/hooks/useLeagueData.js`, `src/pages/league/`, `src/components/league/LeagueLeaderboard.jsx`

**Edge Function**: `score-league-matchups` — cron auto-scores active leagues every 15 min.

**Solo default**: Each player is a 1-member team named after their display name. Teams support up to 3 members.

### 18. Play Profile (Founder DNA)

AI-powered founder assessment: quiz → DNA match → stuck point → AI diagnostic → custom challenge.

**Flow**: `PlayProfileFlow.jsx` with modes: default (dashboard), `?mode=retake` (quiz), `?mode=unstuck` (stuck point workflow), `?mode=rate` (rate completed challenge).

**Components**: `PlayProfileQuiz.jsx` (GameSelection → DNASliders → DNAReveal → StuckPointSelection → FollowUpQuestions), `PlayProfileDashboard.jsx` (active/completed challenges), `AIDiagnostic.jsx` (multi-turn AI), `ChallengeDelivery.jsx`, `ChallengeRating.jsx`.

**Database**: `founder_dna_results` (profile + matched founder), `founder_dna_sessions` (challenge sessions with ratings). Static data: `public/data/founderDnaFounders.json`.

**Scoring**: Completing a founder DNA challenge = +10 XP to Play-List category.

### 19. Stripe Payment Gating

Business stages 1-7 locked behind Stripe payment. Free: Flow Finder, Play-List, Healing, Setup, "Understand X" explainers, Stage 4 Attraction Offer, CRM. Paid: all other business quests.

**Key files**: `useSubscription.js` (checks `user_subscriptions`), `UpgradePrompt.jsx` (overlay), `create-checkout-session` + `stripe-webhook` edge functions.

## Architecture Patterns

### Taxonomy Lookups (IMPORTANT)
Always use the compat-aware lookup functions, never raw `.find()`:
```javascript
import { findSkillSegment, resolveSkillId, findProblemSegment, resolveProblemId } from '../lib/wheelTaxonomy'

// CORRECT: handles legacy ids from existing user data
const seg = findSkillSegment(savedCategoryId)
const prob = findProblemSegment(savedProblemId)

// WRONG: will return undefined for old ids like 'clarifying' or 'physical_vitality'
const seg = SKILLS_SEGMENTS.find(s => s.id === savedCategoryId)
```
Skills field is `placemakes` (not `playSkills`). Use `seg.placemakes || seg.playSkills || []` for backwards compat.
Skills hue: `i * 36` (10 segments). Problems hue: `i * 30` (12 segments). Personas: `i * 30` (12 segments).

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

## Writing Style

- **Never use em dashes** (`—` or `--`) in user-facing copy. Use commas, full stops, or rephrase instead. Em dashes are a tell-tale sign of AI-generated text.

## Pixar Image Generation Style

All AI-generated images use Pixar 3D cinematic animation style via Gemini 3.1 Flash. Include this in ALL image prompts:

```
Pixar 3D cinematic animation style — the EXACT rendering quality of Pixar's Inside Out 2, Soul, and Coco.
Smooth subsurface-scattering skin, large expressive eyes with visible iris detail and specular highlights,
slightly exaggerated proportions, volumetric atmospheric lighting with visible light rays, depth of field with subtle bokeh.
```

Must be 3D rendered (NOT 2D/watercolor/flat). End with `"No text or words anywhere in the image."` Use purple→gold brand gradients in skies/lighting. See `docs/page-component-design-guide.md` section 7 for full API pattern and usage list.

## Database Schema

### Core Tables
`user_stage_progress` (persona, onboarding; cols include: hero_avatar_url, journey_onboarding_completed, has_seen_challenge_intro, current_journey_level default 0) | `user_projects` (stage, points) | `flow_sessions` (completions) | `flow_entries` (compass) | `milestone_completions` | `quest_completions` | `challenge_instances` | `groan_reflections` | `journey_onboarding_selections` (wound stage scene picks from onboarding flow)

### Flow Data
`nikigai_clusters` | `nikigai_responses` | `nikigai_key_outcomes` | `persona_profiles` | `nervous_system_responses` | `healing_compass_responses` | `lead_flow_profiles`

### Assessments
`attraction_offer_assessments` | `upsell_assessments` | `downsell_assessments` | `continuity_assessments` | `leads_assessments` | `lead_magnet_assessments` | `offer_builder_assessments` | `funnel_metrics` | `zarlo_conversations`

### CRM Tables
`crm_pages` | `crm_contacts` (includes outreach columns: outreach_status, platform, engagement_type, priority, temperature, last_message, outreach_status_entered_at) | `crm_email_sequences` | `crm_email_steps` | `sales_deals` | `sales_scripts` | `script_usage_log` | `content_history` | `ecosystem_system_progress` | `offer_implementations`

### Fantasy League
`fantasy_leagues` (name, status, start/end date, num_weeks) | `fantasy_teams` (name, invite_code, solo or up to 3 members) | `fantasy_team_members` (team_id, user_id) | `fantasy_matchups` (week_number, team_a/b, category_results, match_points) | `league_content_submissions` (content_type, link_url, points_value, approval status) | `league_content_reactions` (cheer/fire/clap/heart) | `league_signups` (landing page signups)

### Play Profile
`founder_dna_results` (DNA profile, matched founder, archetype, sliders, games) | `founder_dna_sessions` (stuck point, diagnosis, challenge, ratings, voice/compass data)

### Payments
`user_subscriptions` (Stripe subscription tracking)

### Notifications
`push_subscriptions` (endpoint, keys) | `notification_preferences` (quest_reminders, achievement_celebrations, timezone)

### Journey Level Progress
`user_level_progress` (per-user-per-level row: zone_diagnosis_zone, boss, deep_dive/boss_fight/milestone flags, healing_day_dates, courage_challenge_ids, graduated_at) | `boss_fight_sessions` (pre/post questions, wound age, tension scores, body location, child need, challenge text)

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

## Recent Updates (Apr 2026)

- **Creator Portal** (`/create`): Standalone route for experience business builders (replaces `/business`). CreatorHome with Shift Architecture hub, 4-phase build (Phase 1: checklist-to-challenge bridge + Play Profile, Phase 2: offer wiring into result screen, Phase 3: 4-layer assessment card with inline editing, Phase 4: attendee upload, cost logger, real dashboard KPIs, post-event tab). `/try/experience-creators` is the public lead magnet; `/experience-creators` is now AuthGate'd. Bottom toolbar Create tab locked. Key file: `src/pages/create/`.
- **Experience Creator Matching** (`/experience-creators`): New flow where users browse 59 experience creators (workshop leaders, retreat hosts, cohort builders, performers, facilitators) organized by 6 business model archetypes, select who they resonate with, and receive a per-layer product suite recommendation (attraction/core/scale/continuity) with "hell yes or not quite" validation at each layer. 318-person corpus (75 founders + 243 non-founders including 15 modern creators: Brené Brown, Tony Robbins, Marie Forleo, Wim Hof, etc.). All non-founders have 5 DNA sliders (workRhythm, fuelType, knowledgeStyle + 2 employee-specific: impactStyle, growthMode). Pixar-style portraits via Gemini 3.1 Flash. Full brief: `docs/feature-brief-experience-creator-matching.md`. Key data: `public/data/experienceCreatorDNA.json` (247 DNA profiles), `public/data/experienceCreatorOfferMap.json` (per-person revenue stream → offer slot mapping), `public/images/creators/` (Pixar portraits).
- **Career Clarity Quiz Restyled** (`/career-clarity`): Converted from Tailwind dark theme to FindMyFlow purple gradient design system using `ccq-` scoped CSS classes. Gold selection buttons, glass morphism cards, progress dots. LocalStorage persistence across all stages including results. Both CTA paths (own-thing + job) now route to `/get-started`.
- **Level 3: Direction Updated**: Deep dive changed from Flow Finder Problems (redundant, problems tagged at Level 0) to Career Clarity Quiz. People Matching (`/people`) added as extra quest. Completion checks wired: `quiz_results` table for career clarity, `findmyflow_saved_people` localStorage for people matching.
- **Employee Play Profile DNA**: 2 new sliders replace business-specific ones for non-founders. `impactStyle` (Direct ↔ Systemic, replaces orientation) and `growthMode` (Deep Expertise ↔ Broad Leadership, replaces scaleApproach). 85% confidence vs 55-65% for the old business sliders applied to non-founders.
- **15 Modern Experience Creators Added**: Brené Brown, Tony Robbins, Marie Forleo, Wim Hof, Adriene Mishler, James Clear, Esther Perel, Priya Parker, Jay Shetty, Elizabeth Gilbert, Simon Sinek, Ali Abdaal, Tara Brach, Glennon Doyle, Gabby Bernstein. Full profiles, career models, skill tags, and DNA sliders in all data files.
- **Corpus Expanded to 318**: 75 founders + 243 non-founders (up from 275). All 243 non-founders have DNA slider data in `experienceCreatorDNA.json`.
- **PlaySkill Taxonomy V2**: Skills wheel overhauled from 12 abstract categories to 10 plain-English role-skills: storytelling, teaching, coaching, performing, creating, building, designing, leading, connecting, speaking_up. Each has 3-5 concrete "placemakes" (felt examples anchored in famous people, e.g. "Holding someone through a hard moment, like Fred Rogers airing a full minute of silence"). Field renamed `playSkills` to `placemakes`. Legacy compat layer (`resolveSkillId`, `findSkillSegment`) handles old saved data. Key files: `src/lib/wheelTaxonomy.js`, `public/data/playSkillTaxonomyV2.json`. Full handoff: `docs/taxonomy-v2-handoff.md`.
- **Problem Taxonomy V2**: Problems wheel overhauled from 12 abstract categories to 12 felt categories: kids_deserved_better ("Kids who deserved better"), voice_taken ("The voice that got taken"), pain_not_believed ("Pain that nobody takes seriously"), world_losing ("The world we're losing"), life_not_yours ("A life that isn't yours to live"), feeling_stupid ("Feeling stupid when you're not"), locked_out ("Locked out of what you need"), work_treated_nothing ("Your work being treated as nothing"), left_behind ("Being left behind"), forgot_what_for ("Forgetting what it was all for"), stopped_wondering ("People who stopped wondering"), work_hollows ("Work that hollows you out"). Each has 3-5 placemakes. Legacy compat: `resolveProblemId`, `findProblemSegment`. Key files: `src/lib/wheelTaxonomy.js`, `public/data/problemTaxonomyV2.json`.
- **275-Person Matching Corpus**: 75 founders + 200 non-founders (scientists, artists, activists, athletes, writers, educators) tagged with play-skills and problems. Data: `public/data/founderPlaySkills.json`, `nonFounderPlaySkills.json`, `nonFounderProfiles.json`. Verified at 1.6% error rate. Corpus designed to balance under-represented skill categories (nurturing, clarifying, synthesizing, connecting in old taxonomy).
- **Taxonomy Code Migration**: 15 source files updated. `wheelAlignment.js` (cross-wheel mappings), `skillProductMapping.js` (product recommendations), 5 keyword-mapping files, hue calculations (skills: i*36 for 10 segments, problems: i*30 for 12). Edge function `classify-response` deployed at v17.
- **CuriosityCompassFlow Placemake UI**: Step 6 (play-skill picker) now shows enriched cards with "Looks like [famous person]..." examples below each placemake label. Imports from `playSkillTaxonomyV2.json`.
- **Essence Mirror Flow**: 9-step essence discovery flow at `/essence-mirror`. Replaces HomeFirstTime as the first-time user experience. Hook slides → 12 swipeable superpower cards (That's me / Not me) → Vision confirmation with Pixar scene cards → Pixar essence pick (single select) → AI Mirror reveal (Haiku blends primary + secondary archetype) → Hero avatar generation (Gemini 3.1 Flash + GPT-4o fallback) → Name hero → Save. Key files: `src/flows/EssenceMirrorFlow.jsx`, `src/data/essenceArchetypes.js`, `supabase/functions/essence-mirror-blend/`, `supabase/functions/generate-avatar-gemini/`.
- **12 Essence Archetypes**: Radiant Rebel, Playful Creator, Sacred Jester (Activator), Mystic Messenger, Truth-Teller, Heart Alchemist (Transmuter), Grounded Guardian, Heart Holder, Rhythm Architect (Stabilizer), Wise Sage, Cosmic Connector, Compassionate Leader (Bridger). Each has: poetic_line, superpower, north_star, poetic_vision, essence_wound, inner_child_desire, characters, image, visionImage, swipeImage.
- **36 Pixar-style images**: 12 essence portraits, 12 vision scenes, 12 swipe card portraits. Generated via Gemini 3.1 Flash. Stored in `public/images/essence/`.
- **Level 0: Getting Set Up**: Pre-level with Curiosity Compass + Create Hero Avatar + Tension Assessment quests. Hero avatar auto-completes if done in Essence Mirror.
- **Tension Assessment**: Moved from HomeFirstTime pre-entry gate to Level 0 quest at `/tension-assessment`. 3+1 diagnostic questions (identity, vulnerability, enough, conditional passion).
- **Dynamic Level Detection**: `/me` and Challenge portal read `current_journey_level` from `user_stage_progress`. Progress bars wired to real `user_level_progress` data.
- **Avatar Generation**: Gemini 3.1 Flash primary, GPT-4o fallback. Edge function `generate-avatar-gemini` takes photo + essence prompt, generates Pixar-style hero avatar, uploads to Supabase Storage.
- **HomeFirstTime archived**: Replaced by redirect to `/essence-mirror`. Import removed from MePage.

## Recent Updates (Mar 2026)

- **Journey Progression System (Phases 1-4)**: 9-level progression (Getting Set Up → Identity → Vulnerability → Direction → Enough → Growth → Execution → Passion-Risk → Play). Each level has: Sweet Spot graph, Zone Diagnosis flow, Deep Dive, Boss Fight, Milestone, 3 progress bars (quests/healing/courage). Key files: `src/components/level/LevelConfig.js` (all 9 levels 0-8), `src/components/level/LevelTab.jsx` (template), `src/components/level/SweetSpotGraph.jsx` (brand SVG), `src/flows/ZoneDiagnosisFlow.jsx` (5-step flow at `/zone-diagnosis/:levelNumber`).
- **Zone Diagnosis Flow**: Multi-step flow — Graph → Zone Explainer → Zone Pick → Protective Voices (conditional) → Boss Reveal. Saves to `user_level_progress`. Protective voices: topLeft = Performer/Controller/People Pleaser, bottomRight = Perfectionist/Ghost.
- **Journey Onboarding (Phase 1)**: 4-beat story at `/get-started` — Hook slides → Wound stages (4 stages, 3 Pixar scenes each) → Reframe → Promise with inline signup. Key files: `src/components/onboarding/JourneyOnboarding.jsx`, `src/lib/journeyOnboarding.js`.
- **Tension Questions (Phase 2)**: 3+1 journey-mapped questions in `HomeFirstTime.jsx` with Pixar images. Data in `public/tension-assessment-v2.json`.
- **Image Focal Points**: All 28 Pixar onboarding images have `focalPoint` data for mobile cropping (`objectPosition` CSS). Applied in JourneyOnboarding.jsx, HomeFirstTime.jsx, tension-assessment-v2.json.
- **Level Tab in Challenge Portal (Phase 3-4)**: Priority tab renamed to "Level". XP bar in ChallengeHeader.jsx. `JourneyGraphPopup.jsx` for journey visualization. LevelTab wired into Challenge.jsx with userId prop for DB reads.
- **/me Page Current Level Card**: Quest section shows Current Level card (level name, question, 3 mini progress bars, CTA) for post-onboarding users. XP bar shows "Level 1: Identity".
- **DB Tables**: `user_level_progress` and `boss_fight_sessions` in `supabase/migrations/20260329000000_level_progress.sql` (applied).
- **Priority Tab Onboarding System**: 7-step onboarding sequence in the Priority tab (Mind Space, What is Healing, Healing Compass, Play-List Finder, Nervous System, Check Alignment, Set Play-list Task). Each step unlocks progressively. After onboarding, priority layer recommendations show quests or playlist layers based on tension scores. Key files: `usePriorityTab.js` (ONBOARDING_QUEST_IDS, LAYER_RECOMMENDATIONS, computePriorityLayer), `PriorityTab.jsx`, `PriorityTab.css`.
- **/me Page Dynamic Quest Section**: Replaced static "Today's Quest" with 3-state display. Onboarding incomplete: shows step progress with next step CTA. Onboarding complete + tension scores: shows layer-based recommended challenges. Complete + no scores: shows "Set Your Priority" prompt. Imports shared constants from `usePriorityTab.js`.
- **Play-List Tab Active Challenges**: New section card at top of Play-list tab showing active groan challenges from `priority_weekly_picks` (current week, `pick_type = 'groan'`). Clicking "Complete" opens `GroanCompletionModal`.
- **MobilePlaylistPicker Redesign**: Section card UI for skills/layer/day steps. New layer explainer modal (purple "Explainer" button shows all 5 visibility layers). Added day-of-week picker step between layer selection and generation.
- **Play Profile Past Challenges**: Restyled from plain list to section card design (`pp-history-card`) with green checkmarks, gold challenge names, type badges, dates, voice/compass badges.
- **Essence Profile Tagline Edit**: Removed standalone tagline edit button. Tagline editing now integrated into "Customize Your Archetype" modal (`EditEssenceModal.jsx`) alongside name + photo.
- **Challenge Header Cleanup**: Removed "Gamify Your Ambitions" heading.
- **Graduation Checker Refactor**: Simplified `graduationChecker.js` (252 lines removed).
- **CRM Service Updates**: Fixes and improvements across ascension, challenge data, content context, deal, funnel sync, tower stats, and intelligence engine services.
- **Fantasy League Restructured**: Solo players as default (1-member teams named after display name). 3 scoring categories (Play-List, Healing, Bonus). Auto-scoring edge function runs every 15 min. Content submissions with 10 types and approval workflow.
- **Play Profile (Founder DNA)**: Full assessment flow — quiz, DNA matching to famous founders, stuck point selection, AI diagnostic, custom challenge generation, challenge rating with voice/compass data. +10 XP to Play-List on completion.
- **Challenge Header Redesign**: Compact pill layout — matchup banner (if in league) → score block with 3 animated category pills → streak/leaderboard/settings/week-type row.
- **Play-List Tab**: Replaces old "Groans" tab. Contains Flow Finder quests, skills-only Groan Matrix, and voice logging. Post-completion adds voice check-in step (essence + protective) between reflection and compass.
- **Business Setup (Stage 0.9)**: New gating stage — project creation + product identification before unlocking stages 1-7. Vibe seekers auto-skip product step.
- **Stripe Payment Gating**: Business stages 1-7 locked behind payment. Free access to Flow Finder, Play-List, Healing, Setup, explainer quests, CRM.
- **Universal Onboarding**: All personas follow same path — Q1/Q2/Q3 → Persona Reveal → Mind Space → `/me`. No branching. Quick Capture moved to Business Setup tab.
- **MindSpace Combination Selection**: New Step 4 — generates all skill × problem × persona triplets from starred items, user selects primary combination, saved as `cluster_type: 'primary_combination'`.
- **Groan Matrix Enhancements**: Problem/persona mapping per cell, 3% improvement input, voice check-in step, "Done ×N" completion badges, repeatable challenges via "New Challenge" button.
- **MobilePlaylistPicker Challenge Flow**: Challenges now insert into `priority_weekly_picks` on accept (previously only created in `groan_challenges`). Removed unwanted groan popup after accept. Added "Generate Inspiration with AI" button using `groan-challenge-generator` edge function. Success confirmation state after accepting.
- **Active Challenges on Both Tabs**: Play-List and Priority tabs both query `priority_weekly_picks` for active groan challenges. Clicking "Complete" opens `GroanCompletionModal` with full reflection flow (scary/wahoo + 3% improvement + voice check-in + compass).
- **3% Improvement Explainer**: GroanCompletionModal reflection step shows "How can you make this 3% better next time?" with purple Explainer button that opens a popup explaining the compounding 3% rule.
- **Bottom Toolbar Hiding**: Modals (GroanCompletionModal, HealingCompletionModal) now add `body.modal-active` class to hide BottomToolbar. Applied in Challenge.jsx, PlayListTab.jsx, and PriorityTab.jsx.
- **Dead Code Cleanup**: Removed 17 unused components (3,651 lines): ChallengeLeaderboard, ExistingProjectFlow, FlowCompass, FlowMap, LetsPlayReviewInput, PriorityDnaInlineFlow, PriorityRecommendedCard, ShadowExpandable, WeekPlanCard, 4 CRM ComingSoon placeholders.

## Previous Updates (Feb 2026)

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
