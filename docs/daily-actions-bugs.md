# DailyActions.jsx - Bug Report

**File**: `src/components/crm/DailyActions.jsx`
**Date**: Feb 2026

---

## Bug 1: LIMIT 10 applied before client-side day filtering (lines 85-127)

**Severity**: High — can hide overdue leads entirely

The Supabase query fetches the top 10 warm leads sorted by priority, then filters them client-side by due date (`dayOffset`). If a user has >10 leads, high-priority leads that aren't due yet consume the 10-row limit, and lower-priority leads that ARE due today get excluded.

**Example**: 12 high-priority warm leads (not stale), 5 medium-priority stale leads. Query returns the 10 high-priority ones. Client filter removes all of them. User sees "No actions" despite 5 overdue leads.

**Fix options**:
- Remove `.limit(10)` and do all filtering client-side (simple, slightly more data)
- Move staleness filtering into the query itself (more complex, more efficient)
- Two-pass query: first fetch due/stale leads, then fill remaining slots with upcoming leads

---

## Bug 2: Hot leads always appear as "due today" (lines 106-107)

**Severity**: Medium — clutters today's view with leads that don't need follow-up yet

```js
const threshold = STALE_THRESHOLDS[temperature] || 3  // hot = 1
const isDueToday = daysInStatus >= threshold - 1       // hot: >= 0, always true
```

For hot leads, `threshold - 1 = 0`, so `isDueToday` is always `true` regardless of when the lead was last contacted. A hot lead added 5 minutes ago shows up as needing follow-up.

**Fix options**:
- Change hot threshold to 2 (so isDueToday triggers after 1 day)
- Change formula: `isDueToday = daysInStatus >= Math.max(1, threshold - 1)`
- Accept as intentional (hot leads should always be visible) and document the behavior

---

## Bug 3: Unnecessary nurture re-fetch on day navigation (lines 37-41, 83-92)

**Severity**: Low — performance waste, no user-visible impact

The `useEffect` triggers `loadDailyData()` on every `dayOffset` change, re-running both queries. But the nurture query (lines 85-92) fetches the same leads regardless of `dayOffset` — only the client-side filter changes. The content query does use `dayName` so it needs to re-fetch.

**Fix**: Split into two effects — one for content (depends on `dayOffset`) and one for nurture (depends only on `userId`). Apply the day filter in a `useMemo` over the cached leads.

---

## Bug 4: "..." always appended to content context (line 200)

**Severity**: Low — minor UI glitch

```jsx
{item.context.substring(0, 50)}...
```

Appends "..." even when `context` is under 50 characters (e.g., "Follow up email" becomes "Follow up email...").

**Fix**: `{item.context.length > 50 ? item.context.substring(0, 50) + '...' : item.context}`

---

## Note: Week boundary content disappearance (line 67)

Not a bug per se, but content planned in a previous week that was never posted disappears from the daily view because of:

```js
.gte('created_at', weekStart)
```

Planned content from last week won't show even if still in 'planned'/'draft' status. May be intentional for the weekly planning model.
