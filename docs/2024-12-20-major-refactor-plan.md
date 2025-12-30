# FindMyFlow Major Refactor Plan

**Created:** December 20, 2024
**Status:** Planning Complete - Ready for Implementation

---

## Executive Summary

This document captures the comprehensive audit and implementation plan for transforming FindMyFlow from a **persona-centric** to a **project-centric** experience.

### Key Changes:
1. **New Intro Flow** - Huzz's personal story replaces Zarlo welcome
2. **Project-Based Stages** - Universal 6-stage progression per project (not per persona)
3. **New Home Screen** - First-time experience + Flow Map river visualization
4. **Restructured 7-Day Challenge** - Project selector + stage-based tabs

---

## Part 1: Current Architecture Audit

### 1.1 Persona System

#### Core Files

| File | Purpose |
|------|---------|
| `src/lib/personaStages.js` | Master config: personas, stages, graduation requirements |
| `src/lib/graduationChecker.js` | Handles stage progression and persona switching |
| `src/data/personaProfiles.js` | Persona definitions + `normalizePersona()` helper |

#### Current Persona Structure

```javascript
// Three personas with different stage progressions
vibe_seeker: ['clarity']  // 1 stage
vibe_riser: ['validation', 'creation', 'testing', 'launch']  // 4 stages
movement_maker: ['ideation', 'creation', 'launch']  // 3 stages
```

#### Files Using Persona System

| File | Usage |
|------|-------|
| `src/components/StageProgressCard.jsx` | Displays persona stages, graduation requirements |
| `src/components/GraduationModal.jsx` | Celebration messages |
| `src/Profile.jsx` | Dashboard, graduation handling |
| `src/Challenge.jsx` | Quest filtering by persona + stage |
| `src/PersonaAssessment.jsx` | Initial persona assignment |
| `src/lib/questCompletionHelpers.js` | Persona-aware milestone creation |
| `supabase/functions/graduation-check/index.ts` | Server-side graduation validation |

#### Database Tables with Persona/Stage

| Table | Fields |
|-------|--------|
| `user_stage_progress` | `persona`, `current_stage` |
| `challenge_progress` | `persona`, `current_stage` (snapshot) |
| `milestone_completions` | `persona`, `stage` |
| `conversation_logs` | `stage` |
| `validation_flows` | `persona`, `stage` (optional) |
| `stage_graduations` | `persona`, `from_stage`, `to_stage` |

---

### 1.2 Challenge System

#### Core Files

| File | Purpose |
|------|---------|
| `src/Challenge.jsx` | Main 7-day challenge UI, quest management |
| `src/lib/questCompletionHelpers.js` | Special quest type handlers |
| `src/lib/questCompletion.js` | Auto-complete quests when flows finish |
| `src/lib/streakTracking.js` | Streak management |
| `public/challengeQuestsUpdate.json` | Quest definitions |

#### Quest Filtering Logic (Current)

```javascript
// Challenge.jsx lines 1098-1127
const getValidQuestIds = (category) => {
  return quests.filter(quest => {
    if (quest.category !== category) return false

    // Filter by persona_specific array
    if (quest.persona_specific && userPersona) {
      const normalizedQuestPersonas = quest.persona_specific.map(normalizePersona)
      if (!normalizedQuestPersonas.includes(userPersona)) return false
    }

    // Filter by stage_required field
    if (quest.stage_required && currentStage) {
      if (quest.stage_required !== currentStage) return false
    }

    return true
  }).map(q => q.id)
}
```

#### Quest Configuration Structure (Current)

```json
{
  "quests": [
    {
      "id": "quest_id",
      "category": "Flow Finder",
      "type": "challenge",
      "frequency": "daily",
      "points": 10,
      "persona_specific": ["vibe_seeker", "vibe_riser"],
      "stage_required": "validation",
      "inputType": "text",
      "milestone_type": "optional_milestone_name"
    }
  ]
}
```

#### Database Tables

| Table | Purpose |
|-------|---------|
| `challenge_progress` | Active challenge state, points, streaks |
| `quest_completions` | Individual quest completion records |
| `milestone_completions` | Graduation milestone tracking |
| `challenge_groups` | Group/pod metadata |
| `challenge_participants` | Group membership |

---

### 1.3 Project & Flow Compass System

#### Core Files

| File | Purpose |
|------|---------|
| `src/pages/FlowCompass.jsx` | Main project UI, entry logging |
| `src/lib/projectCreation.js` | Auto-creates projects from flows |
| `src/components/FlowLogModal.jsx` | Modal for logging entries |
| `src/components/FlowCompassInput.jsx` | Challenge quest input |
| `src/components/FlowMap.jsx` | Dashboard display |

#### Database Schema

```sql
-- user_projects
CREATE TABLE user_projects (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  name text NOT NULL,
  description text,
  source_flow text,  -- 'nikigai', '100m_offer', etc.
  source_session_id uuid,
  status text DEFAULT 'active',
  created_at timestamptz,
  updated_at timestamptz
);

-- flow_entries
CREATE TABLE flow_entries (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  project_id uuid REFERENCES user_projects(id),
  direction text NOT NULL,  -- 'north', 'east', 'south', 'west'
  internal_state text NOT NULL,  -- 'excited', 'tired'
  external_state text NOT NULL,  -- 'ease', 'resistance'
  activity_description text,
  reasoning text NOT NULL,
  challenge_instance_id uuid,
  logged_at timestamptz,
  activity_date date
);
```

#### Current Limitation
- Single-project MVP: Only one active project per user at a time
- `default_project_id` stored in `user_stage_progress`

---

### 1.4 Flow Finder (Nikigai) System

#### Core Components

| File | Purpose |
|------|---------|
| `src/FlowFinderSkills.jsx` | Q1-Q5: Discovers role archetypes |
| `src/FlowFinderProblems.jsx` | Q1-Q7: Identifies problem themes |
| `src/FlowFinderPersona.jsx` | Auto-generates personas from problems |
| `src/FlowFinderIntegration.jsx` | Combines all, user selects opportunity |

#### Data Flow

```
User Input → flow_sessions (tracking)
    ↓
nikigai-conversation edge function (Claude AI)
    ↓
Semantic Clustering
    ↓
nikigai_clusters table (skills, problems, persona)
    ↓
Integration: User selects combination
    ↓
nikigai_key_outcomes (selected_opportunity)
    ↓
[Optional] user_projects creation
```

#### Challenge Integration

```javascript
// syncFlowFinderWithChallenge quest mapping
{
  'skills': 'flow_finder_skills' → 40 points,
  'problems': 'flow_finder_problems' → 40 points,
  'persona': 'flow_finder_persona' → 30 points,
  'integration': 'flow_finder_integration' → 30 points
}
// Only available for vibe_seeker in clarity stage
```

---

### 1.5 Home Screen (Profile.jsx)

#### Current Data Fetching

```javascript
// From lead_flow_profiles
const { data } = await supabase
  .from('lead_flow_profiles')
  .select('*')
  .ilike('email', user.email)

// From user_stage_progress
const { data } = await supabase
  .from('user_stage_progress')
  .select('*')
  .eq('user_id', user.id)

// Challenge status
const active = await hasActiveChallenge(user.id)
```

#### Current Layout

1. Mobile topbar + Sidebar navigation
2. "Your Voices" section (Essence + Protective archetypes)
3. "Journey Guide" section (StageProgressCard)
4. FlowMap component
5. CTA Banner (7-day challenge)
6. Onboarding modal (localStorage tracked)

---

## Part 2: Proposed Changes

### 2.1 New Intro Flow

**Replaces:** Current Zarlo welcome in PersonaAssessment.jsx

#### Screen Sequence

| Screen | Content | Button |
|--------|---------|--------|
| 1 | "Welcome! I'm Huzz! Ever since I quit my job two and a half years ago, I've developed an unwavering belief in 'Flow'. The idea that there's a unique path that only you could walk due to your combination of skills, experiences and circumstances." | "Tell me more!" |
| 2 | "I believe the universe communicates with us every day about what this path is. The problem is it can't talk to us directly, so it uses what I like to call 'Ease and Resistance'. As an acronym it spells 'EAR' — coincidence? 🤔" | "Continue" |
| 3 | "I believe when you find your flow — aligning what gives you flow internally, with what's flowing externally (ease) — life becomes crazy and magical. It's the only way I can describe going from 13 headsets dancing on beaches in Thailand to 350 headsets hosting events at Bali Beach clubs in less than 12 months of quitting my job." | "I'm keen for a crazy, magical journey!" |
| 4 | "This webapp is designed to help you find your flow. It has everything I wish I had on my journey from the beginning. So you can go from idea to monetising your mission as fast as possible. Ready to get started?" | "Yep!" |

**Then:** Existing Essence → Protective flows (with Huzz voice, not Zarlo)

---

### 2.2 Universal 6-Stage Progression

**Replaces:** Persona-specific stage progressions

```
Step 0: Flow Finder (prerequisite for Vibe Seeker & Vibe Riser new opportunities)
    ↓
Stage 1: Validation
Stage 2: Product Creation
Stage 3: Testing
Stage 4: Money Models
Stage 5: Campaign Creation
Stage 6: Launch
```

#### Stage Details

| Stage | Name | Required Flows | Notes |
|-------|------|----------------|-------|
| 0 | Flow Finder | skills, problems, persona, integration | Prerequisite for VS & VR new |
| 1 | Validation | user_validation | Validate opportunity |
| 2 | Product Creation | 100m_offer, lead_magnet | Upsell: buildwithAI |
| 3 | Testing | - | Test with users |
| 4 | Money Models | upsell, downsell, continuity | Expand offer stack |
| 5 | Campaign Creation | leads_strategy | External: Marketing Tower |
| 6 | Launch | attraction_offer | External: Sales Tower |

#### Stage Advancement
- **Trigger:** Required flows completed for current stage
- **Simplified:** No streak requirement, no milestone requirement
- **Per-Project:** Each project tracks its own stage independently

---

### 2.3 Persona Assessment Updates

**Keep:** Existing 3 questions with voting system

#### Question 1: "Where are you in your journey?"
| Option | Maps To |
|--------|---------|
| "Searching for my direction" - I'm exploring what I want to do | Vibe Seeker |
| "I know what I want to build" - I have clarity, now I need to execute | Vibe Riser |
| "Already making money, ready to scale" - I'm generating revenue and want to grow | Movement Maker |

#### Question 2: "What have you created so far?"
| Option | Maps To |
|--------|---------|
| "Nothing concrete yet" - Still in the idea phase | Vibe Seeker |
| "An offer or service" - But income is inconsistent | Vibe Riser |
| "A business with consistent revenue" - Ready to expand and scale | Movement Maker |

#### Question 3: "What would make this month a win?"
| Option | Maps To |
|--------|---------|
| "Finally knowing my path" - Clarity on what to pursue | Vibe Seeker |
| "Landing paying clients" - Monetizing my skills | Vibe Riser |
| "Scaling my impact and income" - Growing what's already working | Movement Maker |

#### Post-Assessment Branching

```
Vibe Seeker → Flow Finder (Step 0) → Project created at Stage 1

Vibe Riser → "New or existing opportunity?"
  → New: Flow Finder → Project at Stage 1
  → Existing: ExistingProjectFlow → Project at Stage 1-3

Movement Maker → "New or existing opportunity?"
  → New: Flow Finder → "New or existing?" in Integration → Stage 1 or 4+
  → Existing: ExistingProjectFlow → Stage 4-6
```

#### Stage Determination Question (for existing projects)

```
"How would you describe where this opportunity is right now?"

○ "Haven't validated with customers" → Stage 1
○ "Validated but no full product" → Stage 2
○ "Have product, not tested broadly" → Stage 3
○ "Have product with customers" → Stage 4
○ "Multiple offers, ready to scale marketing" → Stage 5
○ "Ready to launch major campaign" → Stage 6
```

---

### 2.4 Existing Project Flow

**For:** Vibe Riser/Movement Maker who select "existing project"

#### Questions

| Question | Purpose |
|----------|---------|
| "What skills does this project use?" | Link to skills |
| "What problem does it solve?" | Link to problem |
| "Who is your ideal customer?" | Link to persona |
| "How long have you been working on this?" | Duration |
| "What have been major milestone moments?" | milestone_moments (JSONB) |
| "What have been major resistant moments?" | resistant_moments (JSONB) |
| "How are you currently feeling about it?" | current_feeling |
| Stage determination question | Sets current_stage |

---

### 2.5 New Home Screen Structure

#### First-Time Users (onboarding_completed = false)

```
┌─────────────────────────────────────────┐
│  YOUR ESSENCE                           │
│  [Archetype Name + Brief description]   │
├─────────────────────────────────────────┤
│  YOUR PROTECTIVE PATTERN                │
│  [Pattern Name + Brief description]     │
├─────────────────────────────────────────┤
│                                         │
│   To start finding your flow            │
│         click here                      │
│            [ → ]                        │
│                                         │
└─────────────────────────────────────────┘
```

#### Returning Users (onboarding_completed = true)

```
┌─────────────────────────────────────────┐
│  [PERSONA BADGE]                        │
│  Vibe Riser • Stage: Product Creation   │
├─────────────────────────────────────────┤
│                                         │
│  FLOW MAP (River Visualization)         │
│  ~~~N~~~E~~~S~~~W~~~N~~~                │
│                                         │
│  [View Flow Compass →]                  │
├─────────────────────────────────────────┤
│  [🎯 Start 7-Day Challenge]             │
├─────────────────────────────────────────┤
│  [📚 Library of Answers]                │
├─────────────────────────────────────────┤
│  OTHER PROJECTS                         │
│  [Project B] [Project C] [+ New]        │
└─────────────────────────────────────────┘
```

#### Flow Map River Visualization
- Connected nodes showing N/E/S/W journey over time
- Color-coded by direction
- Shows project's Flow Compass entries as flowing path

#### Library of Answers Page

```
┌─────────────────────────────────────────┐
│  📚 Library of Answers                  │
├─────────────────────────────────────────┤
│  FLOW FINDER                            │
│  Skills: [clusters]                     │
│  Problems: [clusters]                   │
│  Personas: [clusters]                   │
│  Integration: [selected opportunity]    │
│  [Answer more questions →]              │
├─────────────────────────────────────────┤
│  THINGS SLOWING YOUR FLOW DOWN          │
│  Nervous System Limitations             │
│  [View Results] or [Complete 7-Day      │
│   Challenge to unlock]                  │
└─────────────────────────────────────────┘
```

---

### 2.6 New 7-Day Challenge Structure

#### Challenge Start Flow

```
User clicks "Start 7-Day Challenge"
    ↓
Select Project Modal:
  ○ Project A (Stage 2: Product Creation)
  ○ Project B (Stage 4: Money Models)
    ↓
Challenge locked to selected project for 7 days
```

#### Tab Structure

```
┌─────┬─────────┬─────────┬─────────┬──────────┬────────┐
│ ✓   │    ✓    │ CURRENT │    🔒   │    🔒    │   🔒   │
│Valid│ Product │ Testing │  Money  │ Campaign │ Launch │
│     │ Create  │         │  Models │ Creation │        │
└─────┴─────────┴─────────┴─────────┴──────────┴────────┘
```

#### Tab States

| State | Visual | Behavior |
|-------|--------|----------|
| Completed | ✓ checkmark | Can view, backfill badge if incomplete |
| Current | Highlighted | Active quests shown |
| Locked | 🔒 lock | Can preview, can't complete |

#### Backfill Badges
- Stages before current that weren't fully completed show ⚠️
- Clicking shows: "Add your validation story to help AI understand your journey"

#### Points System

| Scope | Description |
|-------|-------------|
| Per quest | Individual quest points |
| Per challenge | Sum in this 7-day period |
| Per project | All-time for this project |

#### Two Leaderboards

1. **Current 7-Day Challenge** - Points in active challenge
2. **All-Time Project** - Total points per project

---

## Part 3: Database Migrations

```sql
-- Migration: Add onboarding tracking
ALTER TABLE user_stage_progress
ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;

-- Migration: Extend user_projects for stages
ALTER TABLE user_projects
ADD COLUMN current_stage INTEGER DEFAULT 1,
ADD COLUMN total_points INTEGER DEFAULT 0,
ADD COLUMN is_primary BOOLEAN DEFAULT FALSE,
ADD COLUMN duration TEXT,
ADD COLUMN milestone_moments JSONB,
ADD COLUMN resistant_moments JSONB,
ADD COLUMN current_feeling TEXT;

-- Migration: Link challenges to projects
ALTER TABLE challenge_progress
ADD COLUMN project_id UUID REFERENCES user_projects(id);

-- Migration: Link quest completions to projects
ALTER TABLE quest_completions
ADD COLUMN project_id UUID REFERENCES user_projects(id),
ADD COLUMN stage TEXT;

-- Migration: Link flow sessions to projects
ALTER TABLE flow_sessions
ADD COLUMN project_id UUID REFERENCES user_projects(id);
```

---

## Part 4: Files Impact Summary

### 🔴 Major Refactor Required

| File | Reason |
|------|--------|
| `src/lib/personaStages.js` | Replace with universal 6-stage config |
| `src/lib/graduationChecker.js` | Project-based graduation |
| `src/Challenge.jsx` | Project selector, stage tabs, new filtering |
| `src/components/StageProgressCard.jsx` | Project stages UI |
| `src/Profile.jsx` | New layout, first-time flow |
| `src/components/FlowMap.jsx` | River visualization |
| `public/challengeQuestsUpdate.json` | Reorganize by stage |
| `supabase/functions/graduation-check/index.ts` | Sync with new system |

### 🟡 Moderate Changes

| File | Reason |
|------|--------|
| `src/PersonaAssessment.jsx` | Add Huzz intro, branching logic |
| `src/FlowFinderIntegration.jsx` | Add stage determination |
| `src/lib/projectCreation.js` | Add stage field |
| `src/lib/questCompletionHelpers.js` | Add project_id |
| `src/pages/FlowCompass.jsx` | Project creation flow |

### 🟢 Minor Updates

| File | Reason |
|------|--------|
| `src/data/personaProfiles.js` | Keep as-is for identity |
| `src/components/GraduationModal.jsx` | Update messages |
| `src/lib/streakTracking.js` | No persona changes |
| `src/FlowFinderSkills.jsx` | No changes |
| `src/FlowFinderProblems.jsx` | No changes |
| `src/FlowFinderPersona.jsx` | No changes |

### New Files to Create

| File | Purpose |
|------|---------|
| `src/components/HomeFirstTime.jsx` | First-time home screen |
| `src/components/OnboardingAssessment.jsx` | New persona funnel |
| `src/components/ExistingProjectFlow.jsx` | Abbreviated project capture |
| `src/components/FlowMapRiver.jsx` | River visualization |
| `src/pages/LibraryOfAnswers.jsx` | New page |
| `src/components/ChallengeProjectSelector.jsx` | Project selector |
| `src/components/ChallengeStageTabs.jsx` | 6-stage tabs |
| `public/existing-project-flow.json` | Existing project questions |

---

## Part 5: Implementation Phases

### Phase 1: Database + Config (Foundation)
1. Run database migrations
2. Create new `src/lib/stageConfig.js` with universal 6-stage system
3. Update `challengeQuestsUpdate.json` structure

### Phase 2: Intro Flow (Isolated)
4. Update `PersonaAssessment.jsx` with Huzz intro
5. Remove Zarlo references from Essence/Protective intros

### Phase 3: Project System (Core Change)
6. Update `projectCreation.js` with stage field
7. Create `ExistingProjectFlow.jsx`
8. Update `FlowFinderIntegration.jsx` with stage determination

### Phase 4: Home Screen
9. Create `HomeFirstTime.jsx`
10. Create `OnboardingAssessment.jsx`
11. Create `FlowMapRiver.jsx`
12. Create `LibraryOfAnswers.jsx`
13. Refactor `Profile.jsx`

### Phase 5: Challenge System (Biggest Change)
14. Create `ChallengeProjectSelector.jsx`
15. Create `ChallengeStageTabs.jsx`
16. Refactor `Challenge.jsx`
17. Update `questCompletionHelpers.js`
18. Update graduation system

### Phase 6: Cleanup
19. Update edge function `graduation-check`
20. Update `StageProgressCard.jsx`
21. Test full flow end-to-end

---

## Part 6: Key Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Persona system | Keep but decouple from stages | Still valuable for identity/messaging |
| Stage progression | Universal 6-stage per project | Simpler, project-centric |
| Zarlo character | Retire, Huzz only | Brand consistency |
| Flow Finder | Step 0, prerequisite for VS/VR new | Ensures data quality |
| Multiple projects | Yes, with primary | Users work on multiple things |
| Challenge locking | One project per 7-day | Focus and accountability |
| Backfill | Badges, not blockers | Respects experienced users |
| Stage advancement | Flows only, no streak/milestone | Simplified |

---

## Appendix: Current User Journey

```
App.jsx (lead magnet)
  → Zarlo Welcome
  → Persona Quiz (3 questions)
  → Essence Flow
  → Protective Flow
  → Email + Auth
  → Profile.jsx dashboard
  → 7-Day Challenge (optional)
  → Flows based on persona/stage
```

## Appendix: New User Journey

```
PersonaAssessment.jsx
  → Huzz Intro (4 screens)
  → Essence Flow
  → Protective Flow
  → Email + Auth
  → HomeFirstTime.jsx (Essence + Protective + CTA)
  → "Start Finding Your Flow" button
  → OnboardingAssessment (3 persona questions + branching)
  → Flow Finder OR ExistingProjectFlow
  → Project created with stage
  → Profile.jsx (full dashboard with Flow Map)
  → 7-Day Challenge (project-based)
```

---

*Document created during planning session. Implementation to follow.*
