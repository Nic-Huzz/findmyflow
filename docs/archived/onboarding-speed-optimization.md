# Onboarding Speed Optimization

**Date:** Feb 2026
**Files:** `QuickCapture.jsx`, `MePage.jsx`, `HomeFirstTime.jsx`

## Problem

After completing onboarding ("Complete Setup" on QuickCapture), users waited 8-30+ seconds to see `/me`. Two bottlenecks stacked on each other:

1. **QuickCapture `saveToDatabase`** made 14+ sequential DB round-trips (~4-8s)
2. **`window.location.href = '/me'`** forced a full browser reload (~3-8s) even though MePage was already loaded in memory (HomeFirstTime renders *inside* MePage)

## Solution

### Change 1: Parallel DB saves in QuickCapture

`saveToDatabase` in `QuickCapture.jsx` was restructured from 14+ sequential awaits into 2 parallel rounds:

```
Round 1 (Promise.all):
  ├── saveWheelData('skills')      ← 2-3 internal Supabase calls
  ├── saveWheelData('problems')    ← 2-3 internal Supabase calls
  ├── saveWheelData('personas')    ← 2-3 internal Supabase calls
  └── SELECT existing user_projects ← 1 call (result needed for Round 2)

Round 2 (Promise.all):
  ├── Batch INSERT products         ← 1 call (all products in single array)
  ├── UPSERT user_stage_progress    ← 1 call (flags only, see critical invariant below)
  └── Batch INSERT user_projects    ← 1 call (all projects in single array)
```

**Result: ~0.8-1.5s instead of ~4-8s.**

### Change 2: In-place React state refresh instead of full page reload

MePage already renders HomeFirstTime as a child (line 357-358). When onboarding completes, we just need MePage to re-fetch its gate condition (`stageProgress.onboarding_v2_completed`) and hero data.

**MePage.jsx:**
- `fetchStageProgress` extracted as `useCallback` (was inline in useEffect)
- New `refreshAfterOnboarding` callback: `Promise.all([fetchStageProgress(), refreshHero()])`
- Passed to HomeFirstTime as `onOnboardingComplete` prop

**HomeFirstTime.jsx:**
- Accepts `onOnboardingComplete` prop
- All 5 exit points call `await onOnboardingComplete()` instead of `window.location.href = '/me'`
- Every call site has a `window.location.href = '/me'` fallback if prop is absent

**Result: ~0s instead of ~3-8s.**

## Critical Invariants

These are the things that MUST remain true. If any future change violates these, the onboarding flow will break.

### 1. The QuickCapture upsert must NOT set `persona` or `current_stage`

```javascript
// CORRECT — only flags QuickCapture owns:
supabase.from('user_stage_progress').upsert({
  user_id: userId,
  onboarding_completed: true,
  onboarding_v2_completed: true,
  guidance_emphasis: guidanceEmphasis
}, { onConflict: 'user_id' })
```

**Why:** `persona` and `current_stage` are already set correctly by `saveOnboardingV2Data` in HomeFirstTime.jsx during Q3. That function uses `derivePersonaFromWealthLadder()` (which accounts for `employmentStatus`) and `determineOnboardingPath()` (which returns path-specific `startingStage` values like 2, 3, 4, 6, 7). If QuickCapture's upsert includes these fields, Supabase's `ON CONFLICT DO UPDATE SET` will overwrite the correct values with wrong ones (e.g. stage '6' becomes 'validation', employed+products user gets 'movement_maker' instead of 'vibe_riser').

### 2. Empty product/project arrays must NOT be passed to Supabase insert

```javascript
// CORRECT:
const productInsertPromise = productInserts.length > 0
  ? supabase.from('products').insert(productInserts)
  : Promise.resolve({ error: null })
```

**Why:** `supabase.from('products').insert([])` sends an empty array to PostgREST, which returns HTTP 400. This would throw in the error check and show the user a confusing error.

### 3. `saveTriggeredRef` must stay locked (true) on success

```javascript
// On success: ref stays true (set at line 226, never reset)
// On error: ref is reset to false (line 355) to allow retry
```

**Why:** `onComplete(capturedData)` is NOT awaited — it fires the async `handleQuickCaptureComplete` and immediately falls through to `finally { setIsSaving(false) }`. This re-enables the "Complete Setup" button for ~200ms before the component unmounts (when `fetchStageProgress` resolves and MePage re-renders). If the ref were reset, a fast double-tap could trigger duplicate product inserts. Keeping it locked prevents this.

### 4. `logError` in the catch block must be non-blocking (no await)

```javascript
// CORRECT — fire and forget:
logError({ ... }).then(({ offerSupport }) => {
  setErrorSupport(() => offerSupport)
}).catch(logErr => { ... })
```

**Why:** The `finally` block sets `setIsSaving(false)`. If `logError` were awaited, `finally` wouldn't run until the network call completes (potentially seconds). If the user taps retry during that wait, a second `saveToDatabase` starts with `isSaving = true`, then the first invocation's `finally` fires and sets `isSaving = false` mid-save — a race condition that re-enables the button while a save is in flight.

### 5. `onOnboardingComplete` must always have a `window.location.href` fallback

```javascript
// CORRECT pattern at every call site:
if (onOnboardingComplete) {
  await onOnboardingComplete()
} else {
  window.location.href = '/me'
}
```

**Why:** HomeFirstTime could theoretically render without the prop (e.g. if someone imports it directly outside MePage). The fallback ensures onboarding always completes even without the optimization.

### 6. `markOnboardingComplete` must stay as `.update()`, NOT `.upsert()`

```javascript
// CORRECT:
supabase.from('user_stage_progress')
  .update({ onboarding_v2_completed: true })
  .eq('user_id', user.id)
```

**Why:** Changing to `.upsert()` would require including `user_id` in the payload, which triggers `ON CONFLICT DO UPDATE SET` for ALL columns in the payload. If you add `persona` or `current_stage` to make the upsert work (they may have NOT NULL constraints), you'd overwrite the correct values set during Q3. The `.update()` is safe because the row is guaranteed to exist (Q3's `saveOnboardingV2Data` creates it and blocks progression on failure).

## Flow Architecture

```
MePage.jsx
  ├── stageProgress === null || !onboarding_v2_completed?
  │   └── <HomeFirstTime onOnboardingComplete={refreshAfterOnboarding} />
  │         ├── Q1 → Q2 → Q3 (saves persona + current_stage via saveOnboardingV2Data)
  │         ├── PersonaReveal → handleContinueAfterPersona
  │         │     ├── Path 1: → Vibe Seeker Explainer → handleSkipToProfile / handleStartMindSpace
  │         │     ├── Paths 2-4: → QuickCapture → saveToDatabase → onComplete → handleQuickCaptureComplete
  │         │     └── Fallback: → onOnboardingComplete()
  │         └── ExistingProjectFlow → handleExistingProjectComplete
  │
  │   When onOnboardingComplete() is called:
  │     1. fetchStageProgress() re-queries DB → stageProgress updates
  │     2. refreshHero() re-fetches archetype/project/XP data
  │     3. MePage re-renders → onboarding gate (line 357) passes → real /me content shows
  │
  └── stageProgress.onboarding_v2_completed === true?
      └── Real /me page content (hero, journey, quests, profile)
```

## All Exit Points from HomeFirstTime

| Handler | When | Calls onOnboardingComplete? | Fallback |
|---------|------|---------------------------|----------|
| `handleContinueAfterPersona` | Persona reveal → no QuickCapture path | Yes (else branch) | `window.location.href` |
| `handleQuickCaptureComplete` | QuickCapture "Complete Setup" succeeds | Yes | `window.location.href` |
| `handleSkipToProfile` | "I'll do this later" button | Yes | `window.location.href` |
| `handleExistingProjectComplete` | ExistingProjectFlow completes | Yes | `window.location.href` |
| `handleStartMindSpace` | "I have 2 minutes now" button | No (navigates to /mind-space) | N/A |

## How to Verify

1. `npm run build` — no errors
2. Test on Chrome DevTools → Network → "Slow 3G":
   - **QuickCapture path**: Q1→Q2→Q3→Persona Reveal→QuickCapture→Complete Setup. /me should render in <5s. Check products, wheels, and XP appear.
   - **Skip path**: Q1→Q2→Q3→Persona Reveal→Continue→"I'll do this later". /me renders quickly.
   - **MindSpace path**: Same but "I have 2 minutes now". Navigates to /mind-space.
   - **ExistingProjectFlow path**: If reachable, verify same fast transition.
3. Browser console — no errors during transition
4. Check DB — no duplicate products or projects after onboarding
5. Verify `user_stage_progress.persona` and `current_stage` match Q3 selections (not overwritten by QuickCapture)

## Pre-existing Issues (Not Addressed)

- `saveWheelData` logs `segmentError` but does not throw — wheel segment failures are silently swallowed. This existed before the optimization and is a separate concern.
- `markOnboardingComplete` uses `.update()` which silently no-ops if the row is missing. Safe because Q3 guarantees the row exists, but has no user-visible error if something goes wrong.
