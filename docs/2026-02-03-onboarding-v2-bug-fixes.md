# Onboarding V2 Bug Fixes

**Date:** February 3, 2026
**Commits:** `2ac4de0` → `06329b1` (5 commits)

## Overview

Investigation and fixes for critical bugs in the Onboarding V2 flow that were causing:
- Silent save failures to Supabase
- Users getting stuck on Q1-3 screens
- Data loss when users completed onboarding
- Constraint violations preventing saves

---

## Bugs Fixed

### 1. NOT NULL Constraint Violation on `current_stage`

**Files:** `OnboardingV2.jsx`, `HomeFirstTime.jsx`, `PersonaAssessment.jsx`

**Problem:** Code was setting `current_stage: null` for pre_ladder users, but the database has a `NOT NULL` constraint.

```javascript
// Before (broken)
current_stage: wealthLadderRung === 'pre_ladder' ? null : 1

// After (fixed)
current_stage: wealthLadderRung === 'pre_ladder' ? '0' : '1'
```

**Root Cause:** The `user_stage_progress` table has:
```sql
current_stage text NOT NULL DEFAULT 'validation'
```

Pre-ladder users (Vibe Seekers) should get stage `'0'` (Flow Finder), not `null`.

---

### 2. Wrong `employment_status` Value

**File:** `HomeFirstTime.jsx` (line 236)

**Problem:** Code was using `option.data.employment_status` which contains short values like `'employed'`, but the database constraint expects full values like `'employed_exploring'`.

```javascript
// Before (broken)
const empStatus = option.data?.employment_status || option.value
// Returns: 'employed' (INVALID)

// After (fixed)
const empStatus = option.value
// Returns: 'employed_exploring' (VALID)
```

**Root Cause:** The `persona-assessment.json` has inconsistent value locations:
- Q1: `option.value` has correct DB values
- Q1: `option.data.employment_status` has wrong values

Database constraint:
```sql
CHECK (employment_status IN (
  'employed_exploring',
  'employed_building',
  'self_employed_early',
  'self_employed_established'
))
```

---

### 3. Silent Update Failures (Update vs Upsert)

**File:** `OnboardingV2.jsx`

**Problem:** Using `.update()` which silently succeeds even if no row exists (updates 0 rows, no error).

```javascript
// Before (broken)
await supabase
  .from('user_stage_progress')
  .update({...})
  .eq('user_id', userId)

// After (fixed)
await supabase
  .from('user_stage_progress')
  .upsert({
    user_id: userId,
    ...
  }, { onConflict: 'user_id' })
```

---

### 4. Async Save Not Awaited

**File:** `HomeFirstTime.jsx` (lines 305-314)

**Problem:** `saveOnboardingV2Data()` was called without `await`, so localStorage was cleared and screen transitioned before save completed.

```javascript
// Before (broken)
saveOnboardingV2Data(derivedPersona, emphasis, option.value)
clearSavedProgress()  // Clears immediately!
transitionToScreen(SCREENS.PERSONA_REVEAL)  // Transitions immediately!

// After (fixed)
const success = await saveOnboardingV2Data(derivedPersona, emphasis, option.value)
if (success) {
  clearSavedProgress()
  transitionToScreen(SCREENS.PERSONA_REVEAL)
} else {
  setError('Failed to save your answers. Please try again.')
}
```

---

### 5. Wrong Stage Allocation

**Files:** `OnboardingV2.jsx`, `HomeFirstTime.jsx`

**Problem:** Hardcoding stage to `'1'` for all non-pre-ladder users instead of using the path configuration.

```javascript
// Before (broken)
current_stage: wealthLadderRung === 'pre_ladder' ? '0' : '1'

// After (fixed)
const pathConfig = determineOnboardingPath(wealthLadderRung, goal)
const startingStage = pathConfig.startingStage !== null
  ? String(pathConfig.startingStage)
  : '0'
```

**Correct Stage Allocation:**

| Wealth Ladder | Goal | Starting Stage |
|---------------|------|----------------|
| pre_ladder | discovery | 0 |
| pre_ladder | creation | 0 |
| service | creation | 2 |
| service | monetization | 3 |
| productized | creation | 4 |
| productized | monetization | 6 |
| productized | growth | 4 |
| products | monetization | 7 |
| products | growth | 7 |

---

### 6. Wrong Persona Mapping in QuickCapture

**File:** `QuickCapture.jsx` (line 341)

**Problem:** Fallback persona map had `service: 'vibe_seeker'` instead of `'vibe_riser'`.

```javascript
// Before (broken)
const personaMap = {
  service: 'vibe_seeker',  // WRONG
  productized: 'vibe_riser',
  products: 'movement_maker'
}

// After (fixed)
const personaMap = {
  service: 'vibe_riser',  // CORRECT
  productized: 'vibe_riser',
  products: 'movement_maker'
}
```

---

### 7. Missing Error Handling

**Files:** Multiple

Added error checking to all Supabase save operations that previously had none:

| File | Operation | Fix |
|------|-----------|-----|
| `PersonaAssessment.jsx` | insert user_stage_progress | Added error check |
| `PersonaAssessment.jsx` | insert lead_flow_profiles | Added error check |
| `ExistingProjectFlow.jsx` | update user_stage_progress | Added error check |
| `QuickCapture.jsx` | update/insert user_stage_progress | Added error check + throw |
| `HomeFirstTime.jsx` | Q3 save | Added user-facing error message |

---

## Files Changed

| File | Changes |
|------|---------|
| `src/components/onboarding/OnboardingV2.jsx` | Upsert instead of update, error handling, correct stages |
| `src/components/onboarding/OnboardingV2.css` | Error message styles |
| `src/components/HomeFirstTime.jsx` | Correct employment_status, await save, error feedback |
| `src/components/ExistingProjectFlow.jsx` | Error handling on update |
| `src/components/onboarding/QuickCapture/QuickCapture.jsx` | Error handling, correct persona map |
| `src/PersonaAssessment.jsx` | Error handling on inserts, removed null current_stage |

---

## Valid Q1-Q3 Combinations

All combinations produce valid database values:

| Q1 (Employment) | Q2 (Ladder) | Q3 (Goal) | Persona | Emphasis | Stage |
|-----------------|-------------|-----------|---------|----------|-------|
| any | pre_ladder | discovery | vibe_seeker | deep_discovery | 0 |
| any | pre_ladder | creation | vibe_seeker | fast_track_creation | 0 |
| any | service | creation | vibe_riser | offer_refinement | 2 |
| any | service | monetization | vibe_riser | client_acquisition | 3 |
| any | productized | creation | vibe_riser | suite_building | 4 |
| any | productized | monetization | vibe_riser | launch_sales | 6 |
| any | productized | growth | vibe_riser | suite_building | 4 |
| any | products | monetization | vibe_riser/mm* | pipeline_optimization | 7 |
| any | products | growth | vibe_riser/mm* | scale_systems | 7 |

*movement_maker if self_employed, vibe_riser if employed

---

## Database Constraints Reference

```sql
-- employment_status
CHECK (employment_status IS NULL OR employment_status IN (
  'employed_exploring', 'employed_building',
  'self_employed_early', 'self_employed_established'
))

-- wealth_ladder_rung
CHECK (wealth_ladder_rung IS NULL OR wealth_ladder_rung IN (
  'pre_ladder', 'service', 'productized', 'products'
))

-- primary_goal
CHECK (primary_goal IS NULL OR primary_goal IN (
  'discovery', 'creation', 'monetization', 'growth'
))

-- guidance_emphasis
CHECK (guidance_emphasis IS NULL OR guidance_emphasis IN (
  'deep_discovery', 'fast_track_creation', 'offer_refinement',
  'client_acquisition', 'suite_building', 'launch_sales',
  'pipeline_optimization', 'scale_systems'
))

-- persona
CHECK (persona IS NULL OR persona IN (
  'vibe_seeker', 'vibe_riser', 'movement_maker'
))

-- current_stage
NOT NULL DEFAULT 'validation'
```

---

## Testing

After deploying, clear localStorage before testing:

```javascript
Object.keys(localStorage).filter(k => k.includes('onboarding')).forEach(k => localStorage.removeItem(k))
```

Then test all Q1-Q3 combinations to verify saves work correctly.

---

## Remaining Considerations

1. **Race Condition:** PersonaAssessment and HomeFirstTime both write to user_stage_progress. Consider consolidating.

2. **Stale localStorage:** 24-hour expiry on saved progress could restore outdated data.

3. **RLS Policies:** Upsert operations should work with current policies, but explicit UPSERT policy could prevent edge cases.
