# Social V1 Gaps — Implementation Plan

**Created:** 2026-07-13
**Status:** Ready to build
**Effort:** ~1 day total

Two small gaps from the Social V1 build that need closing.

---

## Gap 1: Auto-posts for Streak Milestones + RP Level-Ups

### Problem

`useCelebrations.js` has TODO comments on `celebrateStreakMilestone` and `celebrateLevelUp` — they can't call `postFeedEvent` because the hook doesn't have access to `userId`.

### Fix

Don't change the hook. Post from Challenge.jsx where userId IS available. Both celebration functions are called FROM Challenge.jsx, so we can post right next to the call site.

### File: `src/Challenge.jsx`

**Step 1:** Add import (if not already present):
```javascript
import { postFeedEvent } from './lib/communityFeed'
```

**Step 2:** Find where `celebrateStreakMilestone` is called. Search for `celebrateStreakMilestone`:

```javascript
// After the existing celebration call, add:
celebrateStreakMilestone(streakDays)
postFeedEvent(user.id, 'streak_milestone', `Hit a ${streakDays}-day streak`)
```

**Step 3:** Find where `celebrateLevelUp` is called. Search for `celebrateLevelUp`:

```javascript
// After the existing celebration call, add:
celebrateLevelUp(newLevel)
postFeedEvent(user.id, 'level_up', `Reached ${newLevel.name || newLevel}`)
```

**Step 4:** Remove TODO comments from `useCelebrations.js` (lines 60 and 82).

### Testing
- [ ] Complete enough wahoos to hit a streak milestone → check `community_feed` table for `streak_milestone` event
- [ ] Level up → check `community_feed` table for `level_up` event
- [ ] Dedup: triggering the same milestone twice doesn't create duplicate (unique index)

---

## Gap 2: Anonymous Solidarity on Journey Tab

### What It Is

On the Journey tab, when a user is at Stage 6→7 and has identified a protective voice, show: "3 other people identified the same voice this month."

### File: `src/components/JourneyTab.jsx`

**Step 1:** Add a query in the existing useEffect (inside the Promise.all or after it):

```javascript
// After voice counting, query how many OTHER users identified the same dominant voice
if (dominant) {
  const { count } = await supabase
    .from('nervous_system_checkins')
    .select('user_id', { count: 'exact', head: true })
    .eq('protective_voice', dominant[0])
    .neq('user_id', userId)
    .gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString())
  setSolidarityCount(count || 0)
}
```

**Step 2:** Add state:
```javascript
const [solidarityCount, setSolidarityCount] = useState(0)
```

**Step 3:** Add to JSX, after the voice dots section:
```jsx
{solidarityCount > 0 && dominant && (
  <p className="jt-solidarity">
    {solidarityCount} other {solidarityCount === 1 ? 'person' : 'people'} identified the same voice this month.
  </p>
)}
```

**Step 4:** Add CSS to `JourneyTab.css`:
```css
.jt-solidarity {
  text-align: center;
  font-size: 0.8rem;
  color: #9ca3af;
  margin: 4px 0 0;
  font-style: italic;
}
```

### Testing
- [ ] User at Stage 5-6 with dominant voice: solidarity count shows if others share the voice
- [ ] Count is 0: nothing renders (no "0 other people" message)
- [ ] Only counts last 30 days, excludes current user

---

## Build Sequence

```
1. Streak + level-up auto-posts in Challenge.jsx (30 min)
2. Remove TODO comments from useCelebrations.js (5 min)
3. Anonymous solidarity query + UI in JourneyTab (30 min)
4. Build check (npm run build)
5. Commit
```

---

*Total: ~1 day (generous). No blockers. No new tables or migrations.*
