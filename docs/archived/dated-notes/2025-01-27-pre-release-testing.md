# Pre-Release Testing Checklist
**Date:** January 27, 2025
**Changes:** Error handling, scoring sync, race condition fix, CSS scoping

---

## Summary of Changes

| Area | What Changed |
|------|--------------|
| Error Handling | Added WhatsApp help button + error logging for save failures |
| Scoring Sync | Fixed 4 locations where points weren't syncing to leaderboard |
| Race Condition | Tab completion bonus now uses fresh DB data instead of stale state |
| CSS | Scoped chat styles, removed unused import |

---

## Testing Checklist

### Test 1: Quest Completion & Points
**Goal:** Verify quest completion saves correctly and points update

1. [ ] Go to `/7-day-challenge`
2. [ ] Select any incomplete quest
3. [ ] Complete the quest with a reflection
4. [ ] **Verify:**
   - [ ] Success message appears with points
   - [ ] Points increase in header/progress bar
   - [ ] Quest shows as completed (checkmark)

**Pass:** Points update immediately, no errors
**Fail:** Points don't update, error message, or console errors

---

### Test 2: Tab Completion Bonus (Race Condition Fix)
**Goal:** Verify bonus awards when completing final quest in a category

1. [ ] Go to `/7-day-challenge`
2. [ ] Find a category where you're 1 quest away from completing all
3. [ ] Complete that final quest
4. [ ] **Verify:**
   - [ ] Bonus points message appears (e.g., "+X pts bonus earned!")
   - [ ] Total points include the bonus
   - [ ] Category shows "bonus earned" indicator

**Pass:** Bonus awards immediately after final quest
**Fail:** Bonus doesn't award, or awards incorrect amount

---

### Test 3: QuickCapture Onboarding Save
**Goal:** Verify new user onboarding saves products correctly

1. [ ] Use incognito/new browser OR create test account
2. [ ] Go through QuickCapture flow (or trigger it from profile)
3. [ ] Add at least 2 products/services
4. [ ] Complete the flow
5. [ ] **Verify:**
   - [ ] No error messages during save
   - [ ] Products appear in your profile/project

**Pass:** All products save, flow completes smoothly
**Fail:** Error message appears, products missing

---

### Test 4: Money Model Flow Save
**Goal:** Verify assessment data saves correctly

1. [ ] Go to any Money Model flow (e.g., `/attraction-offer`)
2. [ ] Complete the flow with answers
3. [ ] Finish and save
4. [ ] **Verify:**
   - [ ] Success message appears
   - [ ] No error alerts
   - [ ] Data persists (refresh page, data still there)

**Pass:** Assessment saves, persists on refresh
**Fail:** Error message, data lost on refresh

---

### Test 5: Error Handling & WhatsApp Help
**Goal:** Verify error UI shows help option when saves fail

1. [ ] Open browser DevTools > Network tab
2. [ ] Enable "Offline" mode (or throttle to offline)
3. [ ] Try to complete a quest or save something
4. [ ] **Verify:**
   - [ ] Error message appears
   - [ ] WhatsApp help button is visible
   - [ ] Button opens WhatsApp with pre-filled message

**Pass:** Error shows with actionable help button
**Fail:** Generic error with no help, or app crashes

---

### Test 6: CSS Styling Check
**Goal:** Verify no style leaks between components

1. [ ] Visit these pages and check for visual issues:
   - [ ] `/7-day-challenge` - Quest cards look correct
   - [ ] `/me` - Profile page styling intact
   - [ ] `/crm/dashboard` - CRM dashboard looks right
   - [ ] Any flow page - Buttons, inputs styled correctly

**Pass:** All pages look normal, no unexpected styling
**Fail:** Buttons wrong color, text overlapping, layout broken

---

### Test 7: Leaderboard Sync
**Goal:** Verify points sync to leaderboard tables

1. [ ] Complete a quest (note the points earned)
2. [ ] Check leaderboard on `/7-day-challenge`
3. [ ] **Verify:**
   - [ ] Your score updated on leaderboard
   - [ ] Points match what you earned

**Pass:** Leaderboard reflects new points
**Fail:** Leaderboard shows old score

---

## Quick Database Verification (Optional)

Run in Supabase SQL Editor to check recent activity:

```sql
-- Check recent quest completions
SELECT quest_id, points_earned, created_at
FROM quest_completions
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC
LIMIT 5;

-- Check if error logs are working
SELECT * FROM error_logs
ORDER BY created_at DESC
LIMIT 10;

-- Check scoring sync
SELECT * FROM challenge_weekly_scores
WHERE user_id = 'YOUR_USER_ID'
ORDER BY updated_at DESC
LIMIT 5;
```

---

## Results

| Test | Status | Notes |
|------|--------|-------|
| 1. Quest Completion | | |
| 2. Tab Bonus | | |
| 3. QuickCapture | | |
| 4. Money Model | | |
| 5. Error Handling | | |
| 6. CSS Styling | | |
| 7. Leaderboard | | |

---

## Issues Found

*(Document any issues here during testing)*

1.

---

## Sign-Off

- [ ] All critical tests pass
- [ ] No blocking issues found
- [ ] Ready for user release

**Tested by:** _______________
**Date:** _______________
