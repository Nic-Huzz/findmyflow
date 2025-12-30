# Session: Weekly Planning System Polish
**Date:** December 30, 2024

## Overview

This session completed Phase 4 Integration and Phase 5 Polish of the Weekly Planning System. All features are now connected and styled.

---

## Changes Made

### 1. Quest Highlighting from Weekly Plan

**Files Modified:**
- `src/Challenge.jsx` - Added `isPlanned` and `plannedDay` props to all QuestCard instances

**What it does:**
- Morning routine quests selected in the weekly plan are now highlighted
- Green left border and "📋 Planned" badge appear on planned quests
- Works for all quest categories (Groans, Healing, Business, Bonus, Tracker)

**Mapping:**
| Weekly Plan Selection | Quest ID |
|----------------------|----------|
| Meditation | `reconnect_morning_meditation` |
| Breathwork | `reconnect_morning_breathwork` |
| Rise & Vibe Dance | `reconnect_morning_dance` |
| Daily Prayer | `reconnect_daily_prayer` |

---

### 2. Push Notifications for Groan/Release Days

**Files Modified:**
- `supabase/functions/scheduled-notifications/index.ts`

**What it does:**
- Sends personalized notifications at **8am user's local time** on their planned days
- **Groan Day notification:**
  - Title: "🎯 Today is Your Groan Day!"
  - Body: Shows their custom groan description
  - Only sent if groan not yet completed
  - Links to `/7-day-challenge?tab=Groans`
- **Release Day notification:**
  - Title: "🌊 Today is Your Release Day!"
  - Body: Shows their chosen release practice
  - Links to `/7-day-challenge?tab=Healing`

**Deployed:** Yes ✅

---

### 3. Groan Completion Connected to Weekly Plan

**Files Modified:**
- `src/Challenge.jsx` - Added `completeWeeklyGroan()` call after groan reflection saves

**What it does:**
- When any groan quest is completed, `weekly_groan_completed` is set to `true` in the `weekly_plans` table
- WeekPlanCard shows checkmark ✓ next to completed groan
- Prevents repeat groan day notifications

---

### 4. Groan Storytelling Carousel Animations

**Files Modified:**
- `src/components/WeeklyPlanningFlow.jsx` - Added swipe handlers and slide direction state
- `src/components/WeeklyPlanningFlow.css` - Added keyframe animations

**What it does:**
- Smooth slide transitions when navigating the groan story carousel
- Touch/swipe gesture support for mobile (swipe left = next, swipe right = back)
- "← Swipe to continue →" hint on first 2 slides
- Direction-aware animations (slide in from left or right)

**Animations added:**
```css
@keyframes slideInFromRight { ... }
@keyframes slideInFromLeft { ... }
@keyframes pulse { ... }  /* For swipe hint */
```

---

### 5. Week Type Theming

**Files Modified:**
- `src/components/WeeklyPlanningFlow.css` - Added theme CSS variables and classes
- `src/components/WeeklyPlanningFlow.jsx` - Applied week type class to container
- `src/components/WeekPlanCard.css` - Added themed card styles
- `src/components/WeekPlanCard.jsx` - Applied week type class to card

**Theme Colors:**

| Week Type | Icon | Primary Color | Use |
|-----------|------|---------------|-----|
| Push | 🔥 | `#ef4444` (Red) | Go all in, stretch edges |
| Flow | 🌊 | `#3b82f6` (Blue) | Balanced, sustainable |
| Rest | 🌙 | `#8b5cf6` (Purple) | Lighter load |
| Launch | 🎯 | `#f59e0b` (Orange) | Heavy business focus |

**Visual effects:**
- WeeklyPlanningFlow background gradient changes based on week type
- WeekPlanCard has colored left border matching week type
- Week type badge in header has themed background

---

### 6. Analytics Tracking

**Files Modified:**
- `src/lib/analytics.js` - Added new tracking functions
- `src/components/WeeklyPlanningFlow.jsx` - Added plan completion tracking
- `src/Challenge.jsx` - Added groan completion tracking

**New tracking functions:**

```javascript
trackWeeklyPlanCompleted({
  weekType,           // 'push' | 'flow' | 'rest' | 'launch'
  morningRoutineCount, // Number of routines selected
  hasGroan,           // Boolean
  hasRelease,         // Boolean
  has3Percent         // Boolean
})

trackGroanCompleted({
  weekType,      // Week type when groan completed
  dayPlanned,    // Day user planned to do groan
  dayCompleted   // Actual day groan was completed
})

trackMorningRoutineCompleted({ routineType })  // Ready for future use
```

**Events stored in:** `events` table

---

## Testing Checklist

### Quest Highlighting
- [ ] Create a weekly plan with morning routines selected
- [ ] Go to Challenge page → Groans tab → Reconnect section
- [ ] Verify selected routines show green border and "📋 Planned" badge
- [ ] Verify non-selected routines don't have the badge
- [ ] Complete a planned quest → badge should disappear (quest is done)

### Push Notifications (Groan/Release Days)
- [ ] Create a weekly plan with groan day set to today
- [ ] Wait until 8am local time OR manually invoke the edge function
- [ ] Verify notification received: "🎯 Today is Your Groan Day!"
- [ ] Complete the groan → verify no repeat notification tomorrow
- [ ] Test release day notification similarly

**Manual test command:**
```bash
curl -X POST https://qlwfcfypnoptsocdpxuv.supabase.co/functions/v1/scheduled-notifications \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### Groan Completion → Weekly Plan
- [ ] Start with fresh weekly plan (groan not completed)
- [ ] Complete any groan quest (Recognise, Rewire, or Reconnect)
- [ ] Check WeekPlanCard → groan should show checkmark ✓
- [ ] Refresh page → checkmark persists
- [ ] Check database: `weekly_plans.weekly_groan_completed = true`

### Carousel Animations
- [ ] Go to Weekly Planning Flow (edit plan or start fresh)
- [ ] Navigate to Step 4 (Groan carousel)
- [ ] **Swipe left** → verify slide animates in from right
- [ ] **Swipe right** → verify slide animates in from left
- [ ] **Tap dots** → verify animation matches direction
- [ ] Verify "← Swipe to continue →" shows on slides 1-2 only
- [ ] Verify swipe hint pulses/fades

### Week Type Theming
- [ ] Start Weekly Planning Flow
- [ ] Select **Push Week** → background should turn red gradient
- [ ] Select **Flow Week** → background should turn blue gradient
- [ ] Select **Rest Week** → background should turn purple gradient
- [ ] Select **Launch Week** → background should turn orange gradient
- [ ] Complete planning → go to Challenge page
- [ ] Verify WeekPlanCard has colored left border matching week type
- [ ] Verify week type badge in header is themed

### Analytics
- [ ] Complete a weekly plan
- [ ] Check `events` table for `weekly_plan_completed` event
- [ ] Verify payload contains: weekType, morningRoutineCount, hasGroan, etc.
- [ ] Complete a groan quest
- [ ] Check `events` table for `groan_completed` event
- [ ] Verify payload contains: weekType, dayPlanned, dayCompleted

**Query to check events:**
```sql
SELECT * FROM events
WHERE name IN ('weekly_plan_completed', 'groan_completed')
ORDER BY created_at DESC
LIMIT 10;
```

---

## Database Changes

No new migrations required. Uses existing tables:
- `weekly_plans` - Already has all required columns
- `events` - For analytics tracking

---

## Edge Function Deployment

The `scheduled-notifications` function was deployed with groan/release day notifications:

```bash
SUPABASE_ACCESS_TOKEN=sbp_xxx npx supabase functions deploy scheduled-notifications --project-ref qlwfcfypnoptsocdpxuv
```

---

## Files Changed Summary

| File | Changes |
|------|---------|
| `src/Challenge.jsx` | Added isPlanned/plannedDay props, groan analytics, completeWeeklyGroan call |
| `src/components/WeeklyPlanningFlow.jsx` | Swipe handlers, slide direction, week type class, analytics |
| `src/components/WeeklyPlanningFlow.css` | Slide animations, week type themes, swipe hint |
| `src/components/WeekPlanCard.jsx` | Week type class on container |
| `src/components/WeekPlanCard.css` | Themed card styles with colored borders |
| `src/lib/analytics.js` | New tracking functions for weekly planning |
| `supabase/functions/scheduled-notifications/index.ts` | Groan/release day notifications |

---

## Known Limitations

1. **Notification timing:** Groan/release notifications only sent at 8am. Users who wake later may miss them.
2. **Swipe detection:** Requires 50px minimum swipe distance to trigger slide change.
3. **Analytics:** Events stored but no dashboard to view them yet.

---

## Next Steps (Future Enhancements)

From the original plan document:
- [ ] Video from Nic for groan storytelling (replace slides with video)
- [ ] Streak tracking per week type ("3 Push Weeks in a row!")
- [ ] Week reflection on Sunday before planning next week
- [ ] Smart suggestions based on past completions
- [ ] Group sync - groups plan together on Sunday
