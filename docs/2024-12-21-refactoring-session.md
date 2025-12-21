# FindMyFlow Refactoring Session - December 21, 2024

## Session Summary

This document captures the refactoring work completed and planned during the December 21, 2024 session.

---

## Part 1: Completed Changes

### 1.1 Archive Folders Merged

**Before:**
- `/src/archive/` - 11 deprecated files
- `/src/archived/` - 3 deprecated files

**After:**
- `/src/archive/` - All 14 deprecated files in one location

**Files moved:**
- `HealingCompass.OLD.jsx`
- `NervousSystemFlow.OLD.jsx`
- `NikigaiTest.jsx`

---

### 1.2 FlowCompass Naming Collision Fixed

**Problem:** Two components with the same name caused confusion:
- `src/components/FlowCompass.jsx` (88 lines) - Small wrapper component
- `src/pages/FlowCompass.jsx` (774 lines) - Full page component

**Solution:**
- Renamed page version to `FlowCompassPage.jsx`
- Updated component name inside file
- Updated CSS import to `FlowCompassPage.css`
- Updated `AppRouter.jsx` import and route

**Files changed:**
- `src/pages/FlowCompass.jsx` → `src/pages/FlowCompassPage.jsx`
- `src/pages/FlowCompass.css` → `src/pages/FlowCompassPage.css`
- `src/AppRouter.jsx` - Import and route updated

---

### 1.3 Root Files Organized Into Folders

**New `/src/flows/` folder (14 files):**

| File | Type |
|------|------|
| AttractionOfferFlow.jsx | Money Model |
| UpsellFlow.jsx | Money Model |
| DownsellFlow.jsx | Money Model |
| ContinuityFlow.jsx | Money Model |
| LeadsStrategyFlow.jsx | Money Model |
| LeadMagnetFlow.jsx | Money Model |
| FlowFinderSkills.jsx | Flow Finder |
| FlowFinderProblems.jsx | Flow Finder |
| FlowFinderPersona.jsx | Flow Finder |
| FlowFinderIntegration.jsx | Flow Finder |
| NervousSystemFlow.jsx | Assessment |
| HealingCompass.jsx | Assessment |
| PersonaSelectionFlow.jsx | Assessment |
| HybridArchetypeFlow.jsx | Assessment |

**New `/src/profiles/` folder (2 components + CSS):**
- EssenceProfile.jsx + EssenceProfile.css
- ProtectiveProfile.jsx + ProtectiveProfile.css

**Files updated with new import paths:**
- `src/AppRouter.jsx` - All flow imports updated
- `src/App.jsx` - HybridArchetypeFlow import updated
- `src/PersonaAssessment.jsx` - HybridArchetypeFlow import updated
- All moved files - Relative paths fixed (`./lib/` → `../lib/`, etc.)

---

### 1.4 Debug Console.logs Removed

**Files cleaned:**
| File | Statements Removed |
|------|-------------------|
| `src/App.jsx` | 5 console.logs |
| `src/HybridArchetypeFlow.jsx` | 8 console.logs |
| `src/pages/FlowCompass.jsx` | 2 console.logs |
| `src/components/StageProgressCard.jsx` | 1 debug block |

**Total: 16 console.log statements removed**

**Intentionally kept for production monitoring:**
- `src/FlowFinderProblems.jsx` - AI clustering logs
- `src/FlowFinderIntegration.jsx` - Project creation logs
- All `console.error` statements in catch blocks

---

### 1.5 Groan Reflection UI Added

**New files created:**
- `src/components/GroanReflectionInput.jsx` - 5-step multi-form component
- `src/components/GroanReflectionInput.css` - Matching theme styles

**Files modified:**
- `src/lib/questCompletionHelpers.js` - Added `handleGroanReflectionCompletion()`
- `src/Challenge.jsx` - Integrated GroanReflectionInput for groan quests

**Component captures:**
- Step 1: What groan task was completed
- Step 2: Protective archetype (Ghost, People Pleaser, Perfectionist, Performer, Controller)
- Step 3: Fear type (Rejection, Judgment, Not Good Enough, Failure, Visibility, Success, Other)
- Step 4: Flow direction (how the action felt)
- Step 5: Optional reflection note

---

## Part 2: Money Model Flows - Comparison Matrix

### 2.1 Structure Overview

| Flow | Lines | Questions | DB Table | Flow Type | Quest ID |
|------|-------|-----------|----------|-----------|----------|
| AttractionOfferFlow | 632 | 10 | `attraction_offer_assessments` | `attraction_offer` | `attraction_offer` |
| UpsellFlow | 605 | 10 | `upsell_assessments` | `upsell_flow` | - |
| DownsellFlow | 599 | 10 | `downsell_assessments` | `downsell_flow` | - |
| ContinuityFlow | 609 | 10 | `continuity_assessments` | `continuity_flow` | - |
| LeadsStrategyFlow | 508 | 10 | `leads_assessments` | `100m_leads` | - |
| LeadMagnetFlow | 619 | 10 | `lead_magnet_assessments` | `lead_magnet_offer` | `flow_lead_magnet` |

**Total lines across 6 flows: ~3,572**

---

### 2.2 Identical Code (Can Be Shared)

| Element | Approx Lines | Notes |
|---------|--------------|-------|
| STAGES constant | 15 | Exactly the same in all 6 |
| State variables | 10 | Same 10 useState hooks |
| goBack() function | 12 | Identical logic |
| BackButton component | 20 | Identical JSX + inline styles |
| getCurrentGroupIndex() | 8 | Same algorithm |
| getGroupProgress() | 6 | Same algorithm |
| Progress dots rendering | 50 | Same JSX structure |
| Question rendering | 100 | Same pattern for Q1-Q10 |
| Calculating screen | 30 | Same animation |
| Error handling | 20 | Same try/catch patterns |

**Estimated shared code: ~400 lines per flow (65%)**
**Potential reduction: ~2,000 lines** (keeping only config differences)

---

### 2.3 Variable Code (Must Be Configurable)

| Element | Example Values |
|---------|----------------|
| **STAGE_GROUPS labels** | "Market" vs "Strategy" vs "Resources" |
| **Questions JSON path** | `/attraction-offer-questions.json` |
| **Offers JSON path** | `/Money Model/Attraction/offers.json` |
| **DB table name** | `attraction_offer_assessments` |
| **flow_type value** | `attraction_offer` |
| **flowId for quest** | `attraction_offer` |
| **CSS class** | `attraction-offer-flow` |
| **Welcome screen text** | Flow-specific headlines |
| **Success screen text** | Flow-specific congratulations |

---

### 2.4 Structural Differences

| Flow | Has viewingResults | Has searchParams | Auto-navigate | Milestone logic |
|------|-------------------|------------------|---------------|-----------------|
| AttractionOfferFlow | Yes | Yes | No | No |
| UpsellFlow | Yes | Yes | No | No |
| DownsellFlow | Yes | Yes | No | No |
| ContinuityFlow | Yes | Yes | No | No |
| LeadsStrategyFlow | No | No | No | No |
| LeadMagnetFlow | No | No | Yes (2s delay) | Yes |

**Key observations:**
- First 4 flows (Attraction, Upsell, Downsell, Continuity) are nearly identical
- LeadsStrategyFlow is simpler (no viewingResults, no searchParams)
- LeadMagnetFlow has unique features (auto-navigate, milestone creation)

---

### 2.5 Recommended Config Structure

```javascript
// src/flows/moneyModelConfigs.js

export const FLOW_CONFIGS = {
  attraction_offer: {
    // Identity
    name: 'Attraction Offer',
    slug: 'attraction-offer',

    // Data sources
    questionsPath: '/attraction-offer-questions.json',
    offersPath: '/Money Model/Attraction/offers.json',

    // Database
    dbTable: 'attraction_offer_assessments',
    flowType: 'attraction_offer',
    questId: 'attraction_offer',
    pointsEarned: 35,

    // UI
    cssClass: 'attraction-offer-flow',
    stageGroups: [
      { id: 'welcome', label: 'Welcome', stages: ['welcome'] },
      { id: 'business', label: 'Business', stages: ['q1', 'q2', 'q3'] },
      { id: 'operations', label: 'Operations', stages: ['q4', 'q5'] },
      { id: 'market', label: 'Market', stages: ['q6', 'q7'] },
      { id: 'goals', label: 'Goals', stages: ['q8', 'q9', 'q10'] },
      { id: 'results', label: 'Results', stages: ['calculating', 'reveal'] },
      { id: 'complete', label: 'Complete', stages: ['success'] }
    ],

    // Content
    welcomeTitle: 'Design Your Attraction Offer',
    welcomeSubtitle: 'Build an irresistible front-end offer that draws in your ideal customers.',
    successTitle: 'Your Attraction Offer is Ready!',
    successMessage: 'You now have a clear blueprint for your front-end offer.',

    // Behavior flags
    hasViewingResults: true,
    useSearchParams: true,
    autoNavigateOnSuccess: false,
    autoNavigateDelay: 0,
    createsMilestone: false,
    milestoneType: null
  },

  // ... similar configs for other 5 flows

  lead_magnet: {
    name: 'Lead Magnet',
    slug: 'lead-magnet',
    questionsPath: '/lead-magnet-questions.json',
    offersPath: '/lead-magnet-offers.json',
    dbTable: 'lead_magnet_assessments',
    flowType: 'lead_magnet_offer',
    questId: 'flow_lead_magnet',
    pointsEarned: 35,
    cssClass: 'lead-magnet-flow',
    stageGroups: [
      { id: 'welcome', label: 'Welcome', stages: ['welcome'] },
      { id: 'resources', label: 'Resources', stages: ['q1', 'q2', 'q3'] },
      { id: 'skills', label: 'Skills', stages: ['q4', 'q5', 'q6'] },
      { id: 'business', label: 'Business', stages: ['q7', 'q8'] },
      { id: 'priorities', label: 'Priorities', stages: ['q9', 'q10'] },
      { id: 'results', label: 'Results', stages: ['calculating', 'reveal'] },
      { id: 'complete', label: 'Complete', stages: ['success'] }
    ],
    welcomeTitle: 'Create Your Lead Magnet',
    welcomeSubtitle: 'Design a valuable free resource that attracts your ideal customers.',
    successTitle: 'Your Lead Magnet Strategy is Complete!',
    successMessage: 'You have a clear plan for your lead magnet.',
    hasViewingResults: false,
    useSearchParams: false,
    autoNavigateOnSuccess: true,
    autoNavigateDelay: 2000,
    createsMilestone: true,
    milestoneType: 'lead_magnet_completed'
  }
};
```

---

## Part 3: De-Risking Migration Plan

### 3.1 Overview

**Goal:** Consolidate 6 Money Model flows (~3,572 lines) into 1 configurable base component (~600 lines) + 6 config objects (~300 lines total).

**Expected reduction:** ~2,600 lines of duplicated code

**Risk level:** Medium - requires careful migration to avoid breaking 6 different user flows

---

### 3.2 Phase 1: Extract Shared Components (LOW RISK)

**Objective:** Create reusable components without changing flow behavior

**New components to create:**
```
src/components/money-model/
├── MoneyModelBackButton.jsx      (~30 lines)
├── MoneyModelProgressDots.jsx    (~60 lines)
├── MoneyModelCalculating.jsx     (~40 lines)
├── MoneyModelQuestion.jsx        (~80 lines)
└── index.js                      (barrel export)
```

**Steps:**
1. Create `src/components/money-model/` folder
2. Extract BackButton component (identical in all 6 flows)
3. Extract ProgressDots component (identical in all 6 flows)
4. Extract Calculating screen component
5. Import these in ONE flow (AttractionOfferFlow) as a test
6. Verify build and functionality
7. Roll out to remaining 5 flows

**Success criteria:** All 6 flows work identically, just with imported components

**Rollback plan:** Delete new components, revert imports

---

### 3.3 Phase 2: Create Config File (NO RISK)

**Objective:** Define all flow configurations without changing any flow code

**Steps:**
1. Create `src/flows/moneyModelConfigs.js`
2. Define config object for each of the 6 flows
3. Export configs but don't use them yet
4. Verify build passes

**Success criteria:** New file exists, no flows changed, build passes

**Rollback plan:** Delete config file

---

### 3.4 Phase 3: Create Base Component (LOW-MEDIUM RISK)

**Objective:** Build the configurable base component

**New file:**
```
src/flows/MoneyModelFlowBase.jsx (~600 lines)
```

**Steps:**
1. Create base component that accepts config as prop
2. Implement all shared logic using config values
3. Handle optional features with config flags:
   - `hasViewingResults` → conditionally include state
   - `useSearchParams` → conditionally use hook
   - `autoNavigateOnSuccess` → conditionally navigate
   - `createsMilestone` → conditionally create milestone
4. Create ONE wrapper component to test:
   ```jsx
   // src/flows/LeadsStrategyFlowNew.jsx
   import MoneyModelFlowBase from './MoneyModelFlowBase'
   import { FLOW_CONFIGS } from './moneyModelConfigs'

   export default function LeadsStrategyFlow() {
     return <MoneyModelFlowBase config={FLOW_CONFIGS.leads_strategy} />
   }
   ```
5. Test LeadsStrategyFlow thoroughly (chosen because simplest)
6. Keep original flows unchanged during testing

**Success criteria:** New LeadsStrategyFlow works identically to original

**Rollback plan:** Delete new files, keep original LeadsStrategyFlow.jsx

---

### 3.5 Phase 4: Migrate One Flow at a Time (MEDIUM RISK)

**Objective:** Replace each flow with config-based version

**Order of migration (simplest to most complex):**
1. LeadsStrategyFlow - No special features
2. LeadMagnetFlow - Has auto-navigate + milestone (test these features)
3. ContinuityFlow - Standard with viewingResults
4. DownsellFlow - Standard with viewingResults
5. UpsellFlow - Standard with viewingResults
6. AttractionOfferFlow - Standard with viewingResults

**Steps for each flow:**
1. Create new wrapper using MoneyModelFlowBase
2. Update AppRouter.jsx to use new component
3. Test flow end-to-end:
   - Welcome screen displays correctly
   - All 10 questions work
   - Calculating animation plays
   - Results display correctly
   - Data saves to correct database table
   - Quest completion triggers
   - Success screen shows
4. Verify database entries are correct
5. If issues, revert just that one flow
6. Move old flow file to archive once confirmed working

**Success criteria:** All 6 flows work identically to before

**Rollback plan:** Keep original flow files until migration confirmed

---

### 3.6 Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| DB saves to wrong table | Low | High | Config defines exact table name - verified before migration |
| Quest completion fails | Low | Medium | Config defines exact flowId - verified before migration |
| UI looks different | Medium | Low | Welcome/Success text in config - easy to adjust |
| LeadMagnet milestone breaks | Medium | Medium | Test milestone creation explicitly before migration |
| CSS styling differs | Low | Low | Check if CSS files are actually different first |
| State management breaks | Medium | High | Base component uses same useState pattern - minimal change |

---

### 3.7 Testing Checklist (Per Flow)

```markdown
## [Flow Name] Migration Checklist

### Pre-Migration
- [ ] Original flow working correctly
- [ ] Config values verified against original code
- [ ] CSS file compared (if different, handle in config)

### Welcome Screen
- [ ] Title displays correctly
- [ ] Subtitle displays correctly
- [ ] Start button works

### Questions (Q1-Q10)
- [ ] All questions display
- [ ] Options are clickable
- [ ] Back button works
- [ ] Progress dots update

### Calculating
- [ ] Animation displays
- [ ] Transitions to reveal

### Results
- [ ] Recommended offer displays
- [ ] All offer scores calculated
- [ ] "Show all options" works (if applicable)

### Save & Complete
- [ ] Data saves to correct database table
- [ ] Quest completion triggers
- [ ] Correct points awarded
- [ ] flow_sessions entry created

### Success Screen
- [ ] Success message displays
- [ ] Navigation works
- [ ] Auto-navigate works (if applicable)
- [ ] Milestone created (if applicable)

### Post-Migration
- [ ] Original file moved to archive
- [ ] AppRouter updated
- [ ] Build passes
- [ ] No console errors
```

---

## Part 4: Current Folder Structure

After all changes, the project structure is:

```
src/
├── flows/                    # NEW - All flow components
│   ├── AttractionOfferFlow.jsx
│   ├── ContinuityFlow.jsx
│   ├── DownsellFlow.jsx
│   ├── FlowFinderIntegration.jsx
│   ├── FlowFinderPersona.jsx
│   ├── FlowFinderProblems.jsx
│   ├── FlowFinderSkills.jsx
│   ├── HealingCompass.jsx
│   ├── HybridArchetypeFlow.jsx
│   ├── LeadMagnetFlow.jsx
│   ├── LeadsStrategyFlow.jsx
│   ├── NervousSystemFlow.jsx
│   ├── PersonaSelectionFlow.jsx
│   └── UpsellFlow.jsx
│
├── profiles/                 # NEW - Profile components
│   ├── EssenceProfile.jsx
│   ├── EssenceProfile.css
│   ├── ProtectiveProfile.jsx
│   └── ProtectiveProfile.css
│
├── pages/                    # Page-level components
│   ├── FlowCompassPage.jsx   # RENAMED
│   ├── FlowCompassPage.css   # RENAMED
│   ├── LibraryOfAnswers.jsx
│   ├── LibraryOfAnswers.css
│   ├── PublicValidationFlow.jsx
│   ├── PublicValidationFlow.css
│   ├── ValidationFlowsManager.jsx
│   └── ValidationFlowsManager.css
│
├── components/               # Reusable UI components
│   ├── GroanReflectionInput.jsx    # NEW
│   ├── GroanReflectionInput.css    # NEW
│   ├── FlowCompass.jsx             # Wrapper (no collision now)
│   ├── ChallengeProjectSelector.jsx
│   ├── ChallengeStageTabs.jsx
│   ├── ConversationLogInput.jsx
│   ├── FlowCompassInput.jsx
│   ├── FlowMap.jsx
│   ├── FlowMapRiver.jsx
│   ├── GraduationModal.jsx
│   ├── MilestoneInput.jsx
│   └── ... (other components)
│
├── lib/                      # Utilities and helpers
│   ├── questCompletionHelpers.js   # MODIFIED - added groan handler
│   ├── supabaseClient.js
│   ├── stageConfig.js
│   ├── graduationChecker.js
│   └── ... (other utilities)
│
├── data/                     # Static configuration
├── auth/                     # Authentication
├── archive/                  # MERGED - All deprecated code
│
├── App.jsx                   # Main dashboard
├── AppRouter.jsx             # Router config (MODIFIED)
├── Challenge.jsx             # Challenge page (MODIFIED)
├── Profile.jsx               # Profile page
├── PersonaAssessment.jsx     # Assessment (MODIFIED)
└── ... (CSS files remain at root)
```

---

## Part 5: Money Model Consolidation - COMPLETED

### Phase 1: Extract Shared Components (COMPLETED)

Created `/src/components/MoneyModelShared/`:
- `BackButton.jsx` - Shared back navigation button
- `ProgressDots.jsx` - Shared progress indicator
- `index.js` - Clean exports

Updated all 6 flows to use shared components, removing ~320 lines of duplicated code.

### Phase 2: Create Config File (COMPLETED)

Created `/src/flows/moneyModelConfigs.js`:
- Shared `STAGES` constant
- 3 stage group templates (`marketGoals`, `strategyExecution`, `resourcesSkills`)
- Complete configuration for all 6 flows including:
  - Display settings (name, title, cssClass)
  - Data paths (questionsPath, offersPath)
  - Database settings (dbTable, flowType, flowVersion)
  - Quest integration (questId, pointsEarned)
  - Feature flags (hasViewingResults, hasSearchParams, hasBackButton)
  - Special features (createsMilestone, autoNavigateOnSuccess)

### Phase 3: Create Base Component & Migrate Flows (COMPLETED)

Created `/src/flows/MoneyModelFlowBase.jsx` (450 lines):
- All state management
- Data loading with format normalization (handles both `[...]` and `{ offers: [...] }`)
- Saved results viewing
- Scoring algorithm with disqualification logic
- Question navigation
- Database save + flow tracking + quest completion
- Milestone creation (for LeadMagnet)
- Auto-navigation (for LeadMagnet)
- All render stages (Welcome, Questions, Calculating, Reveal, Success)

Migrated all 6 flows to thin wrappers:

| Flow | Before | After | Reduction |
|------|--------|-------|-----------|
| AttractionOfferFlow | 574 lines | 35 lines | 94% |
| UpsellFlow | 550 lines | 32 lines | 94% |
| DownsellFlow | 560 lines | 33 lines | 94% |
| ContinuityFlow | 555 lines | 35 lines | 94% |
| LeadsStrategyFlow | 470 lines | 37 lines | 92% |
| LeadMagnetFlow | 580 lines | 37 lines | 94% |
| **Total** | ~3,289 lines | ~209 lines | **94%** |

### Bundle Size Impact

- Before consolidation: 955.81 KB
- After consolidation: 906.43 KB
- **Saved: 49.38 KB (5.2% reduction)**

---

## Part 6: Challenge.jsx Decomposition Plan

### Current State Analysis

**File:** `src/Challenge.jsx`
**Lines:** 3,261
**Complexity:** Very High

#### State Variables (30+)

| Category | Variables |
|----------|-----------|
| UI State | `loading`, `activeCategory`, `activeRTypeFilter`, `activeFrequencyFilter`, `showOnboarding`, `showGroupSelection`, `showProjectSelector`, `showSettingsMenu`, `showExplainer`, `showLockedTooltip`, `expandedLearnMore` |
| Data | `challengeData`, `dailyReleaseChallenges`, `progress`, `completions`, `userData`, `stageProgress` |
| Quest Input | `questInputs` |
| Group/Leaderboard | `groupMode`, `groupCode`, `groupCodeInput`, `groupData`, `leaderboard`, `leaderboardView`, `userRank` |
| Prerequisites | `nervousSystemComplete`, `healingCompassComplete`, `pastParallelStory` |
| Project-Based | `selectedProject`, `activeStageTab`, `projectStage` |

#### Functions (35+)

| Category | Functions |
|----------|-----------|
| Data Loading | `loadChallengeData`, `loadUserProgress`, `loadUserData`, `loadStageProgress`, `loadLeaderboard`, `loadGroupInfo`, `advanceDay` |
| Prerequisite Checks | `checkNervousSystemComplete`, `checkHealingCompassComplete` |
| Challenge/Group | `showGroupSelectionModal`, `handlePlaySolo`, `handleCreateGroup`, `handleJoinGroup`, `startChallenge`, `startChallengeWithProject`, `handleRestartChallenge`, `handleProjectSelected` |
| Quest Completion | `handleQuestComplete` (~200 lines!), `isQuestCompletedToday`, `isQuestEverCompleted`, `isQuestLocked`, `getRequiredQuestName` |
| Points/Progress | `getCategoryPoints`, `getPointsToday`, `checkArtifactUnlock`, `getArtifactProgress`, `getTabCompletionStatus`, `awardTabCompletionBonus`, `getValidQuestIds`, `getCompletedStages` |
| UI Helpers | `toggleLearnMore`, `renderDescription`, `getDailyStreak`, `getDayLabels`, `getDailyReleaseChallenge`, `renderDailyReleaseChallenge`, `triggerConfetti`, `handleCloseExplainer`, `handleOpenExplainer` |

#### Render Sections

| Section | Lines (approx) | Notes |
|---------|----------------|-------|
| Onboarding | 60 | Shown when no active challenge |
| Group Selection | 50 | Solo/Create/Join options |
| Project Selector | 15 | Wrapper for ChallengeProjectSelector |
| Loading/Error | 20 | Simple states |
| Header | 100 | Points, day, badges, settings menu |
| Category Tabs | 15 | 5 category buttons |
| Stage Tabs | 20 | Flow Finder stage selector |
| Filter Chips | 80 | R-type and frequency filters |
| Leaderboard | 80 | Weekly/all-time views |
| Artifact Progress | 70 | Progress bars per category |
| Category Points | 20 | Points summary |
| Quest Cards (Groans) | ~300 | Quest list for Groans |
| Quest Cards (Healing) | ~200 | Quest list for Healing |
| Quest Cards (Flow Finder) | ~200 | Quest list for Flow Finder |
| Quest Cards (Bonus) | ~150 | Quest list for Bonus |
| Quest Cards (Tracker) | ~150 | Quest list for Tracker |

### Key Problem: Quest Card Duplication

The quest card rendering logic is **repeated 5+ times** (once per category) with only minor variations. Each instance includes:
- Quest header (name + points)
- Streak bubbles (7-day visualization)
- Description with markdown links
- Learn More accordion
- Input area (varies by inputType: text, dropdown, checkbox, flow, groan, conversation_log, milestone, flow_compass)
- Locked state handling
- Completed badge + View Results button

**Estimated duplicated JSX:** ~1,200 lines

---

### Decomposition Strategy (6 Phases)

#### Phase 1: Extract Custom Hook (ZERO RISK)

**Create:** `src/hooks/useChallengeData.js`
**Lines to extract:** ~700

Move all state and data loading logic:
- All 30+ useState declarations
- All useEffect hooks for data loading
- All prerequisite checking functions
- Return object with state and handlers

**Risk Level:** ZERO - Just moving code, no behavioral changes
**Testing:** Load Challenge page, verify all data loads correctly

---

#### Phase 2: Extract QuestCard Component (LOW RISK)

**Create:** `src/components/ChallengeQuest/QuestCard.jsx`
**Lines to eliminate:** ~1,200

Unified component that handles ALL quest types:

```jsx
<QuestCard
  quest={quest}
  completed={isQuestCompletedToday(quest.id, quest)}
  locked={isQuestLocked(quest)}
  streak={getDailyStreak(quest.id)}
  dayLabels={getDayLabels()}
  category={activeCategory}
  questInput={questInputs[quest.id]}
  onInputChange={(value) => setQuestInputs(...)}
  onComplete={(data, event) => handleQuestComplete(quest, data, event)}
  expandedLearnMore={expandedLearnMore[quest.id]}
  onToggleLearnMore={() => toggleLearnMore(quest.id)}
  showLockedTooltip={showLockedTooltip === quest.id}
  onToggleLockedTooltip={() => setShowLockedTooltip(...)}
  // Prerequisite flags for locking
  healingCompassComplete={healingCompassComplete}
  nervousSystemComplete={nervousSystemComplete}
  // For groan quests
  projectId={selectedProject?.id}
  challengeInstanceId={progress?.challenge_instance_id}
  stage={projectStage}
  // Daily release content
  dailyReleaseChallenge={getDailyReleaseChallenge()}
  pastParallelStory={pastParallelStory}
/>
```

**Risk Level:** LOW - Preserves exact rendering, just in a component
**Testing:** Complete quests in each category, verify all input types work

---

#### Phase 3: Extract Header Component (LOW RISK)

**Create:** `src/components/ChallengeHeader.jsx`
**Lines to extract:** ~150

Contents:
- Total points display (clickable to leaderboard)
- Day counter (Day X/7)
- Complete badge (when Day 7)
- Archetype badge
- Settings menu (dropdown with Home, Explainer, Notifications)
- Restart Challenge button

**Risk Level:** LOW
**Testing:** Click all header elements, verify navigation works

---

#### Phase 4: Extract Onboarding Screens (LOW RISK)

**Create:** `src/components/ChallengeOnboarding.jsx`
**Create:** `src/components/GroupSelectionModal.jsx`
**Lines to extract:** ~150

Move the three intro screens:
1. Welcome/Onboarding (4 R's explanation)
2. Group Selection (Solo/Create/Join)
3. Project Selector wrapper

**Risk Level:** LOW
**Testing:** Start new challenge, verify onboarding flow works

---

#### Phase 5: Extract Leaderboard Section (LOW RISK)

**Create:** `src/components/ChallengeLeaderboard.jsx`
**Lines to extract:** ~100

Contents:
- Weekly/All-Time toggle
- Group code display + WhatsApp share
- Leaderboard entries with rank badges

**Risk Level:** LOW
**Testing:** Click Leaderboard, toggle views, verify data displays

---

#### Phase 6: Extract Filter & Progress Components (LOW RISK)

**Create:** `src/components/QuestFilters.jsx` (~80 lines)
- R-type filter chips (Recognise, Rewire, Reconnect, Release)
- Frequency filter (All, Daily, Weekly)

**Create:** `src/components/ArtifactProgressCard.jsx` (~80 lines)
- Progress bars for each R-type
- Unlock status display
- Tab completion bonus text

**Create:** `src/components/CategoryPointsSummary.jsx` (~30 lines)
- Category total
- Points today
- Leaderboard button

**Risk Level:** LOW
**Testing:** Switch between tabs, verify filters and progress display correctly

---

### Implementation Order & Risk Assessment

| Phase | Component | Lines | Risk | Confidence |
|-------|-----------|-------|------|------------|
| 1 | useChallengeData hook | ~700 | ZERO | 95% |
| 2 | QuestCard | ~1,200 | LOW | 85% |
| 3 | ChallengeHeader | ~150 | LOW | 90% |
| 4 | Onboarding screens | ~150 | LOW | 90% |
| 5 | ChallengeLeaderboard | ~100 | LOW | 90% |
| 6 | Filters + Progress | ~190 | LOW | 90% |

### Expected Results

**Before:** 3,261 lines in one file

**After:**
| File | Lines |
|------|-------|
| Challenge.jsx (orchestrator) | ~400 |
| useChallengeData.js | ~700 |
| QuestCard.jsx | ~250 |
| ChallengeHeader.jsx | ~100 |
| ChallengeOnboarding.jsx | ~80 |
| GroupSelectionModal.jsx | ~70 |
| ChallengeLeaderboard.jsx | ~100 |
| QuestFilters.jsx | ~80 |
| ArtifactProgressCard.jsx | ~80 |
| CategoryPointsSummary.jsx | ~30 |
| **Total** | ~1,890 |

**Reduction:** 3,261 → ~1,890 lines (**42% reduction**)

More importantly:
- Challenge.jsx becomes a readable orchestrator (~400 lines)
- Each component has a single responsibility
- QuestCard eliminates ~1,200 lines of duplication
- Logic is testable in isolation

---

### De-Risking Strategy

Same approach as Money Model consolidation:

1. **Create backup before each phase:**
   ```bash
   cp src/Challenge.jsx src/Challenge.backup.jsx
   ```

2. **Test after each phase:**
   - Load Challenge page
   - Complete a quest in each category
   - Verify leaderboard displays
   - Verify streak tracking works
   - Verify graduation checking works

3. **Git commit after each phase:**
   - Small, reversible commits
   - Clear commit messages

4. **Phase 1 first (ZERO risk):**
   - Custom hook extraction has no behavioral changes
   - If it breaks, easy to revert

5. **Phase 2 is the big one:**
   - QuestCard unification requires careful prop mapping
   - May need to handle edge cases per category
   - Test thoroughly before committing

---

## Completed Cleanup (After Money Model Consolidation)

### Unused Components Deleted

After verifying no imports reference these files, the following were deleted:

| File | Lines | Reason |
|------|-------|--------|
| `src/components/FlowHistory.jsx` | 115 | Not imported anywhere |
| `src/components/FlowInsights.jsx` | 147 | Not imported anywhere |
| `src/components/FlowLogModal.jsx` | 202 | Not imported anywhere |
| `src/components/StageProgressCard.jsx` | 98 | Not imported anywhere |

**Total removed:** 562 lines of unused code

---

---

## Part 7: Challenge.jsx Decomposition - COMPLETED

### Summary

Successfully decomposed `Challenge.jsx` from 3,261 lines to 1,058 lines (**68% reduction**) across 6 phases.

### Phase 1: Extract Custom Hook (COMPLETED)

**Created:** `src/hooks/useChallengeData.js` (1,147 lines)

Extracted all state management and data loading:
- 30+ useState declarations
- All useEffect hooks for data loading
- All data loading functions (loadChallengeData, loadUserProgress, loadLeaderboard, etc.)
- All helper functions (getCategoryPoints, getDailyStreak, isQuestCompletedToday, etc.)
- Returns ~100 state variables and functions to Challenge.jsx

**Challenge.jsx reduction:** 3,261 → 2,068 lines

---

### Phase 2: Extract QuestCard Component (COMPLETED)

**Created:** `src/components/QuestCard.jsx` (317 lines)

Unified quest card component handling all variations:
- Streak bubbles (daily quests)
- Learn more sections
- Special lock states (Healing Compass, Nervous System prerequisites)
- All input types (text, dropdown, flow, conversation_log, milestone, flow_compass, groan)
- Completed states with View Results buttons
- Daily release challenge content

Replaced ~1,200 lines of duplicated quest rendering across 5 categories (Groans, Healing, Flow Finder, Bonus, Tracker).

**Challenge.jsx reduction:** 2,068 → 1,336 lines

---

### Phase 3: Extract Header Component (COMPLETED)

**Created:** `src/components/ChallengeHeader.jsx` (108 lines)

Contents:
- Title "Gamify Your Ambitions"
- Total points display with rank (clickable to leaderboard)
- Day counter (Day X/7) with completion badge
- Archetype badge (conditional)
- Settings menu with dropdown (⚙️ Home, 📖 Explainer, 🔔 Notifications)
- Restart Challenge button (Day 7)

**Challenge.jsx reduction:** 1,336 → 1,264 lines

---

### Phase 4: Extract Onboarding Screens (COMPLETED)

**Created:** `src/components/ChallengeOnboarding.jsx` (124 lines)

Handles two screens via `screen` prop:
1. **Welcome screen** (`screen="welcome"`)
   - 🚀 Title and intro text
   - Four R's explanation (🔍 Recognise, 🕊️ Release, ⚡ Rewire, 🌊 Reconnect)
   - Start button

2. **Group selection** (`screen="group-selection"`)
   - 🎯 Title
   - Solo (🎯), Create Group (👥), Join Group (🔗) options
   - Group code input

**Challenge.jsx reduction:** 1,264 → 1,182 lines

---

### Phase 5: Extract Leaderboard Component (COMPLETED)

**Created:** `src/components/ChallengeLeaderboard.jsx` (90 lines)

Contents:
- Weekly/All-Time toggle
- Group code display with WhatsApp share button
- Leaderboard entries with medal emojis (🥇🥈🥉)
- "You" badge for current user

**Challenge.jsx reduction:** 1,182 → 1,118 lines

---

### Phase 6: Extract Filter Component (COMPLETED)

**Created:** `src/components/ChallengeFilters.jsx` (86 lines)

Contents:
- Frequency filter (All, Daily, Weekly)
- R-type filters (varies by category):
  - Groans: All, Recognise, Rewire, Reconnect
  - Healing: All, Recognise, Release

**Challenge.jsx reduction:** 1,118 → 1,058 lines

---

### Final Results

| Phase | Challenge.jsx Lines | New Component |
|-------|---------------------|---------------|
| Original | 3,261 | - |
| Phase 1 | 2,068 | useChallengeData.js (1,147) |
| Phase 2 | 1,336 | QuestCard.jsx (317) |
| Phase 3 | 1,264 | ChallengeHeader.jsx (108) |
| Phase 4 | 1,182 | ChallengeOnboarding.jsx (124) |
| Phase 5 | 1,118 | ChallengeLeaderboard.jsx (90) |
| Phase 6 | **1,058** | ChallengeFilters.jsx (86) |

**Total reduction:** 3,261 → 1,058 lines (**68% reduction**)

### New Files Created

```
src/
├── hooks/
│   └── useChallengeData.js      # 1,147 lines - All state & data loading
│
└── components/
    ├── QuestCard.jsx            # 317 lines - Unified quest card
    ├── ChallengeHeader.jsx      # 108 lines - Header with points/settings
    ├── ChallengeOnboarding.jsx  # 124 lines - Welcome & group selection
    ├── ChallengeLeaderboard.jsx # 90 lines - Leaderboard display
    └── ChallengeFilters.jsx     # 86 lines - Filter chips
```

### Benefits Achieved

1. **Challenge.jsx is now readable** - 1,058 lines (was 3,261)
2. **Single responsibility** - Each component does one thing
3. **Reusable QuestCard** - Eliminates ~1,200 lines of duplication
4. **Testable logic** - Hook can be tested independently
5. **Easier maintenance** - Changes to leaderboard don't risk breaking quests

### Backup

Original file preserved at `src/Challenge.backup.jsx` (3,261 lines)

---

*Document created: December 21, 2024*
*Last updated: December 22, 2024 - Challenge.jsx decomposition completed*
