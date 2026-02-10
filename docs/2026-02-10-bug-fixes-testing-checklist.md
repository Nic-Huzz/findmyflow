# Bug Fixes Testing Checklist — Feb 10 2026

Two sessions of fixes from a 20-bug audit of the challenge system, plus a date utilities refactor. All fixes verified via `npm run build` and code review.

---

## 1. Challenge Page — `/7-day-challenge`

### 1.1 Double-Click Guard (#3)
**What was broken:** Rapidly clicking "Complete Quest" could submit the same quest twice, awarding double points.
**What was fixed:** Added `completingQuestId` state guard in `Challenge.jsx` + `disabled={isCompleting}` on all 7 button variants in `QuestCard.jsx`.

- [ ] Find an incomplete quest with a text input
- [ ] Rapidly double-click/tap "Complete Quest"
- [ ] **Expected:** Button shows "Completing..." and is disabled. Only one completion recorded. Only one set of points awarded.
- [ ] Check `quest_completions` table — no duplicate rows for that quest+date

### 1.2 Tab Completion Bonus (#1)
**What was broken:** Completing the last quest in a tab never triggered the bonus on that render due to stale closure. Bonus only appeared after page refresh.
**What was fixed:** `handleQuestComplete` now captures fresh `completions` and `progress` in local variables and passes them directly to `getTabCompletionStatus()` and `awardTabCompletionBonus()`.

- [ ] Find a challenge tab where you have only 1 quest left to complete (e.g. Groans > Recognise)
- [ ] Complete that final quest
- [ ] **Expected:** Tab completion bonus alert fires immediately (not after refresh). Bonus points awarded.
- [ ] If no tab is close to completion, skip this test — it only triggers when ALL quests in a tab category are done.

### 1.3 Save Button Stuck on Success (#12)
**What was broken:** In `GroanReflectionInput` and `LaunchReviewInput`, `setIsSubmitting(false)` was only in the `catch` block, so on success the button stayed stuck on "Saving..."
**What was fixed:** Moved `setIsSubmitting(false)` to a `finally` block in both components.

- [ ] Complete a Groan Reflection quest (multi-step input with archetype, fears, direction)
- [ ] **Expected:** After submission, button returns to normal state. No stuck "Saving..." spinner.
- [ ] Complete a Launch Review quest (if available at your stage)
- [ ] **Expected:** Same — button resets after success.

### 1.4 Regeneration Safety (#20)
**What was broken:** "Regenerate" deleted the old groan challenge FIRST, then tried to generate a new one. If generation failed (network error, API error), the challenge was gone forever.
**What was fixed:** Now generates the new challenge first, checks the result, only deletes the old one on success.

- [ ] Open a groan challenge from the matrix, click "Regenerate"
- [ ] **Expected (normal):** New challenge appears, old one is replaced.
- [ ] **Expected (if generation fails):** Old challenge remains. Error alert shown. Nothing deleted.
- [ ] *(Optional)* To test failure: temporarily disable wifi, click Regenerate, then reconnect.

### 1.5 Loading State (#8)
**What was broken:** `setLoading(false)` was inside `loadUserProgress()`, which fired while 9 other parallel loads were still in-flight. Page would flash content then keep loading.
**What was fixed:** `setLoading(true)` now wraps the entire `Promise.all` of 10 functions, with `.finally(() => setLoading(false))`.

- [ ] Navigate to `/7-day-challenge` from another page
- [ ] **Expected:** Single loading spinner until ALL data loads. No content flash followed by reload.
- [ ] Switch between challenge tabs (Groans, Healing, Business, etc.)
- [ ] **Expected:** Tabs switch without getting stuck in a loading state.

### 1.6 CSS Class Leak (#14)
**What was broken:** `document.body.classList.add('hide-bottom-toolbar')` was in the render path, with no cleanup on unmount. Navigating away left the class on `<body>`.
**What was fixed:** Moved to a `useEffect` with proper cleanup that removes the class on unmount.

- [ ] On the challenge page, trigger the project selector dropdown
- [ ] Navigate away to `/me` or any other page
- [ ] Open DevTools console, run: `document.body.classList.contains('hide-bottom-toolbar')`
- [ ] **Expected:** Returns `false`. The class should be cleaned up.

---

## 2. Me Page — `/me`

### 2.1 Duplicate Key Warning
**What was broken:** Users with both project-level and user-level completions for the same quest (e.g. `recognise_positive_frequency`) saw React warnings about duplicate keys. Two identical nodes appeared on the flow river.
**What was fixed:** Added `seenQuestIds` Set deduplication in `MePage.jsx` before building timeline entries.

- [ ] Navigate to `/me`
- [ ] Open browser console
- [ ] **Expected:** No `Warning: Encountered two children with the same key` messages.
- [ ] **Expected:** Flow river shows one node per quest, not duplicates.

---

## 3. Weekly Planning

### 3.1 "Day of Week" Label (#15)
**What was broken:** Stat showed "Days Active" but the value was actually day-of-week offset from Monday (not real active days).
**What was fixed:** Label changed to "Day of Week".

- [ ] Open Weekly Planning flow
- [ ] Find the stats section
- [ ] **Expected:** Label reads "Day of Week", not "Days Active".

---

## 4. CRM Pages — Date Utilities Refactor (#2, #16, #19)

**What was broken:**
- 10+ duplicate `getWeekStart` implementations across the codebase
- Some used UTC (`toISOString`), others used local timezone — inconsistent behavior near midnight
- Non-zero-padded date formats (`2026-2-5` instead of `2026-02-05`) in some paths

**What was fixed:** Created `src/lib/dateUtils.js` as single source of truth. All files now import from it. All dates are local timezone, zero-padded.

**Files changed:** `streakTracking.js`, `useChallengeData.js`, `scoringCategories.js`, `executeHelpers.js`, `contentStrategy.js`, `weeklyPlanningService.js`, `funnelSyncService.js`, `taskService.js`, `analyticsService.js`, `Dashboard.jsx`, `FunnelBaselineFlow.jsx`, `WeeklyPlanningFlow.jsx`

### 4.1 Dashboard
- [ ] Navigate to `/crm/dashboard`
- [ ] **Expected:** Stats show correct current week (Mon–Sun). No off-by-one day errors.
- [ ] "This week" and "Last week" comparisons should reference the right weeks.

### 4.2 Execute
- [ ] Navigate to `/crm/execute`
- [ ] **Expected:** Tasks grouped under correct week. Today's date shown correctly.

### 4.3 Analytics
- [ ] Navigate to `/crm/analytics`
- [ ] **Expected:** Week ranges in charts start on Monday. No shifted-by-one-day issues.

### 4.4 Weekly Planning
- [ ] Navigate to weekly planning from CRM
- [ ] **Expected:** Week dates are correct. "Get last week's scores" returns the right week.

### 4.5 Streak Tracking
- [ ] Complete a quest, check your streak count
- [ ] **Expected:** Streak calculated correctly. Completing a quest at 11pm local time should count as "today", not "tomorrow".

---

## 5. Console Cleanup (#18)

**What was fixed:** Removed ~20 `console.log` statements with emoji markers from `questCompletionHelpers.js` and `questCompletion.js`. Kept all `console.error` and `console.warn` for real errors.

- [ ] Open browser console, complete any quest
- [ ] **Expected:** No emoji debug logs (like `🎯 Quest complete`, `✅ Syncing`, `📊 Scoring`).
- [ ] Real errors should still appear if something fails.

---

## 6. Security

### 6.1 Supabase Token Rotation
**What happened:** A Supabase Personal Access Token was committed in `docs/2026-01-05-crm-test-checklist.md` at line 143 (commit 6b8ab381). The token has been removed from the file but remains in git history.

- [ ] **REQUIRED:** Rotate the Supabase Personal Access Token in Supabase dashboard (Account Settings > Access Tokens)
- [ ] Update the `SUPABASE_ACCESS_TOKEN` GitHub secret with the new token
- [ ] Dismiss the GitHub secret scanning alert

---

## Quick Smoke Test

If short on time, these 4 tests cover the highest-risk changes:

1. **Double-click guard:** Rapidly click "Complete Quest" — should only fire once
2. **CRM Dashboard dates:** Open `/crm/dashboard` — week ranges should be correct
3. **Loading state:** Navigate to `/7-day-challenge` — single clean load, no flash
4. **Me page console:** Open `/me` with console open — no duplicate key warnings
