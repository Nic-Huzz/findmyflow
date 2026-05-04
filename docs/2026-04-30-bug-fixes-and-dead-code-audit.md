# Bug Fixes & Dead Code Audit — 30 April 2026

## Bugs Fixed

### 1. Groan Matrix layers always unlocked (stageConfig.js:377)

`getLayerLockStatus()` accepted no parameters and returned every visibility layer as `{ locked: false }`, ignoring the `unlock` config on each `GROAN_VISIBILITY_LAYERS` entry. The call site in `Challenge.jsx` was passing `flowFinderComplete` and `highestStage` but they were silently dropped.

**Fix:** Function now accepts `(flowFinderComplete, highestStage)` and checks each layer's unlock type (`flow_finder` or `stage`) against the user's actual progress.

**Impact:** Money (stage 4), Vulnerable (stage 6), and Authority (stage 8) layers were accessible to all users regardless of progress.

---

### 2. Stale selectedProject on first load (useChallengeData.js:297)

The user-level completions query used `selectedProject?.id` from React state, but `selectedProject` is always `null` when this query runs because the project is fetched and set to state earlier in the same function (state updates are async). The query always fell back to a zero UUID, missing real completions.

**Fix:** Changed to `projectData?.id`, the local variable from the same-function fetch that's already resolved.

**Impact:** Quest completion state could appear incorrect on first page load until a refresh.

---

### 3. validation_responses queried by nonexistent user_id column (crm/contentContext.js:47)

The CRM content context queried `validation_responses.user_id`, but that table has no `user_id` column. Responses are linked via `flow_id` through `validation_flows` (which does have `user_id`). Every other query in the codebase uses `flow_id` or `session_id`.

**Fix:** Rewrote to first fetch the user's `validation_flows`, then count responses by `flow_id`.

**Impact:** `validationCount` was always 0 in CRM content context, making the validation section appear empty.

---

### 4. Streak calculation uses 0-indexed month (useChallengeData.js:1599-1618)

`getConsecutiveStreakDays` built date keys with `date.getMonth()` (0-indexed: January = 0). Both the Set population and the lookup used the same format so it was internally consistent, but produced keys like `"2026-0-15"` for January 15. If any other code compared against ISO-formatted dates, it would silently fail. More importantly, the inconsistency with the rest of the codebase (which uses `toLocaleDateString('en-CA')` for YYYY-MM-DD) made this fragile.

**Fix:** Changed all three `getMonth()` calls to `getMonth() + 1`.

**Impact:** Streak flame count could show incorrect values if completion dates spanned month boundaries in edge cases.

---

### 5. Stream prescription navigates to dead redirect (ScopeMapFlow.jsx:211)

When the Scope Map diagnostic classified a user as "Stream", `handlePrescriptionAction` navigated to `/nikigai/skills`. That route was changed to a `<Navigate to="/life-map" replace />` redirect during the Life Map restructure, so users were silently bounced to Life Map with no context about why.

**Fix:** Navigate directly to `/life-map`.

**Impact:** Stream users hit an unnecessary redirect. The CTA text ("Explore my skills") and destination were misaligned.

---

### 6. Manual stage selection saves wrong reasoning to DB (ScopeMapFlow.jsx:159,199)

`handleManualSelect` called `setResult({ ...result, reasoning: 'User self-selected' })` then immediately called `saveResult(stage)`. Since `setResult` is a React state update (async), the `result?.reasoning` read inside `saveResult` still had the original AI reasoning, not `'User self-selected'`.

**Fix:** `saveResult` now accepts an optional `reasoningOverride` parameter. `handleManualSelect` passes `'User self-selected'` directly.

**Impact:** DB records always stored AI reasoning even when the user manually picked a different river stage.

---

### 7. Stale lifetimeXP in tier-up detection (ChallengeHeader.jsx:67)

The `useEffect` that detects tier-ups compared `getLevelNumber(newXP) > getLevelNumber(lifetimeXP)`, but `lifetimeXP` was missing from the dependency array `[user?.id, totalXP]`. If `totalXP` changed rapidly, the closure could capture a stale `lifetimeXP` value, causing tier-up toasts to either not fire or fire spuriously.

**Fix:** Added `lifetimeXP` to the dependency array.

**Impact:** Tier-up celebrations could misfire or be skipped after rapid XP gains.

---

## Dead Code Audit

### Unused Exports (36 total, not removed)

**stageConfig.js** (17): `getVisibilityLayerDisplay`, `getVisibilityLayersByDifficulty`, `GROAN_SKIP_REASONS`, `GROAN_STREAK_BADGES`, `getNextStreakBadge`, `FLOW_FINDER_CONFIG`, `getPreviousStage`, `isStageUnlocked`, `canAccessStage`, `getRequiredFlows`, `getRequiredMilestones`, `getGroanChallenge`, `generateVoiceQuestion`, `areStageFlowsComplete`, `getStageProgress`, `determineStartingStage`, `LEGACY_STAGE_MAPPING`

**wheelTaxonomy.js** (7): `LEGACY_SKILL_ID_MAP`, `LEGACY_PROBLEM_ID_MAP`, `getDimensionsForWheel`, `getClassificationPrompt`, `FEATURE_ARCHETYPES`, `DOMAIN_FEATURE_MAP`, `PROBLEM_TYPE_FEATURE_MAP`

**intelligenceEngine.js** (3): `calculatePostsNeeded`, `CONTENT_INTENT`, `CTA_TYPES`

**onboardingV2.js** (3): `getGoalDisabledReason`, `getNextEmphasis`, `getRecommendedEmphasis`

**projectCreation.js** (3): `getOrCreateActiveProject`, `createExistingProject`, `checkProjectExists`

**emailPersonalization.js** (3): `SUBJECT_TEMPLATES`, `generateEmailSubject`, `generateAllSubjectLines`

**contentStrategy.js** (1): `DAYS_OPTIONS`

### Verified Clean

- All deleted files (10) have zero remaining imports
- All components in `src/components/` are actively imported
- All routes in `AppRouter.jsx` point to valid components
- All CSS imports reference existing files
- No orphaned JSON files in `public/`
