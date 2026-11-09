# Tab Restructure: Voice-First Onboarding

**Date:** 2026-11-09  
**Status:** Draft  
**Branch:** TBD  
**Context:** Voice-first onboarding moves discovery off the app and onto a guided call. The app becomes a daily maintenance tool, not a discovery tool. This spec covers the tab restructure, Discover tab removal, and all downstream changes.

## The Shift

**Before:** User signs up → works through 10+ solo flows in the app (Experience Game, Essence Mirror, Choose Quests, etc.) via the Discover tab → app is both onboarding AND daily tool.

**After:** User joins a 35-min guided voice call → all discovery data captured via AI → app opens with profile already populated → app is the daily maintenance tool only.

**Source brief:** `huzz-brand/docs/voice-first-onboarding-ux-brief.md`

---

## 1. Tab Structure

### Before (4 tabs)

| Tab | Role | Default |
|-----|------|---------|
| Discover | Phase 1 discovery funnel + Phase 2→3 bridge | Yes (always) |
| Paths | Quest board, weekly focus, life paths | Locked until choose-quests |
| Tune | Daily practices, drains, check-ins | Always visible |
| Progress | Long view: journey map, evidence, voice, radar | Always visible |

### After (3 tabs)

| Tab | New Name | Role | Default |
|-----|----------|------|---------|
| ~~Discover~~ | Removed | — | — |
| Tune | **Daily** | Daily practices, drains, check-ins, NS check-in | Yes (every open after first) |
| Paths | **Weekly** | Quest board, weekly focus, life paths, financial security, "find something new" | Always visible, no lock |
| Progress | **Progress** | Journey map, essence card, dome radar, evidence, voice, observations, setup checklist | First open only |

### Landing logic

- **First open** (user has no data OR just completed voice call): Land on **Progress** tab so they see their populated profile.
- **Every subsequent open**: Land on **Daily** tab.
- **Detection:** Check `allSetupDone` (dome + essence + paths + money_map all complete). If false → Progress (where the onboarding banner lives). If true → Daily. This ensures partially-onboarded users (e.g. played Experience Game once then bounced) still land on Progress and see the "Book your call" banner. The setup completion flags are already computed in ProgressTab; extract the check to `useChallengeData.js` so the parent can use it for default tab selection.

---

## 2. Discover Tab Removal

### What Discover currently contains (in render order)

1. DirectionSection (stage 8+ only) — Phase 2→3 bridge
2. "Revisit" label (stage 8+)
3. Step 1 banner (dismissible)
4. Step 2 banner (dismissible)
5. "Experience to Try This Week" card
6. Experience Game card
7. Essence Mirror card
8. Money Map card
9. Bridge CTA (locked → ready → done states)
10. Dome Radar visualization (expandable)

### Where each piece goes

| Component | New Home | Mechanism |
|-----------|----------|-----------|
| DirectionSection | Progress tab via StageCard | StageCard CTA already wired for stage 8+ direction. Update `journeyChapters.js` line 41: `nextAction` → "Find your direction", `nextRoute` → `/direction` (standalone page for DirectionSection). |
| "Experience to Try This Week" | Weekly tab, under Your Paths | New link: "Not feeling any of these? Find something new →" below path list, above "+ Add a Path". Navigates to Experience Game. |
| Experience Game card | Accessible via Weekly tab link + `/experience-game` route | No longer a card on a tab. Accessed through "Find something new" link or direct URL. |
| Essence Mirror card | Accessible via essence card on Progress + `/essence-mirror` route | Tap essence card on Progress to revisit. |
| Money Map card | Setup checklist on Progress + `/money-map` route | Triggered by setup checklist or StageCard CTA. |
| Bridge CTA | Not needed post-call. Lives on solo fallback `/discovery` page only. | Voice call handles this. Solo users get it at `/discovery`. |
| Dome Radar | Already on Progress tab | No change. |
| Step banners | Solo fallback `/discovery` page only | Dead for call-onboarded users. |
| "Revisit" label | Not needed | Removed. |

---

## 3. Solo Fallback (users who skip the call)

### Design

The app assumes you've done the call. If you haven't, Progress shows a persistent onboarding banner.

**Progress tab for incomplete users (top to bottom):**

1. **Persistent "Book your onboarding call" banner** — not dismissible. Disappears only when all setup steps are complete (call or solo). Contains:
   - Primary CTA: "Book your onboarding call →" (links to booking page)
   - Secondary link: "Want to do it yourself? →" (navigates to `/discovery`)
2. StageCard (adapts to current stage as normal)
3. Whatever sections they've earned data for (progressive disclosure already built)
4. Setup checklist at bottom showing remaining steps (already exists in ProgressTab)

### `/discovery` standalone page

A new route at `/discovery` renders the existing `DiscoverTab` component directly, wrapped in a thin page shell that provides the props it needs. This avoids duplication — DiscoverTab already handles the full funnel UX.

**Page shell (`DiscoveryPage.jsx`) responsibilities:**
- Auth guard (redirect to `/log-in` if no user)
- Fetch `userId` from Supabase auth
- Fetch `heroStage` from `user_stage_progress`
- Pass `onUnlockTab` as no-op (Weekly is always visible)
- Pass `onUpdate` as no-op (Challenge.jsx reloads on mount when user navigates back)
- Pass `heroStage` capped to exclude DirectionSection (or pass a prop to suppress it, since Direction lives on Progress via StageCard now)
- After full funnel completion → navigate to `/7-day-challenge?tab=weekly`

This means DiscoverTab needs one small change: accept an optional `hideDirection` prop (default false) to skip rendering DirectionSection when used as a standalone page. Everything else works as-is.

---

## 4. Weekly Tab Changes

### New "Find something new" link

Positioned below the path list, above "+ Add a Path" button (in LevelTab.jsx Your Paths section):

```
[Your Paths]
  AI Coding           24/27
  Travel Experience    11/11
  ...

  Not feeling any of these? Find something new →    ← NEW
  
  + Add a Path
  
  We recommend focusing on 1-3 quests at a time
```

**"Find something new →"** navigates to `/experience-game`. After the user rates experiences, the flow can bridge to `/choose-quests` to create a new path.

**Distinction from "+ Add a Path":**
- "Find something new" = I don't know what I want, guide me (→ Experience Game → ChooseQuests)
- "+ Add a Path" = I already know what I want, let me type it in

### Empty state update

LevelTab.jsx:501-508 currently shows "Complete discovery first to unlock your paths" with a lock icon. Update to:

- Copy: "Find something you want to pursue →"
- Link: navigates to Experience Game (or `/discovery` for solo fallback users)
- Remove lock icon

---

## 5. StageCard Direction CTA Update

**File:** `src/data/journeyChapters.js` line 41

**Before:**
```js
{ heroStage: null, name: 'Find your direction', ..., 
  nextAction: 'Explore your direction on the Discover tab', 
  nextRoute: '/7-day-challenge', checkFn: 'directionComplete' }
```

**After:**
```js
{ heroStage: null, name: 'Find your direction', ..., 
  nextAction: 'Find your direction', 
  nextRoute: '/direction', checkFn: 'directionComplete' }
```

This requires creating a `/direction` route that renders DirectionSection as a standalone page (similar to `/discovery`). DirectionSection needs to fetch its own data (userId, heroStage, direction status) rather than receiving them as props from DiscoverTab.

---

## 6. URL Deep Link Migration

### TAB_TO_CATEGORY mapping update

**File:** `src/hooks/useChallengeData.js` lines 39-61

All old URL params continue working via backward compat. No external links break.

```js
const TAB_TO_CATEGORY = {
  // Daily (was Tune + Discover)
  'daily': 'Daily',
  'tune': 'Daily',           // backward compat
  'bonus': 'Daily',          // backward compat
  'discover': 'Daily',       // backward compat — old Discover links land on Daily
  'journey': 'Daily',        // backward compat
  
  // Weekly (was Paths)
  'weekly': 'Weekly',
  'paths': 'Weekly',         // backward compat
  'play-list': 'Weekly',     // backward compat
  'playlist': 'Weekly',      // backward compat
  'wahoo': 'Weekly',         // backward compat
  'courage': 'Weekly',       // backward compat
  'priority': 'Weekly',      // backward compat
  'level': 'Weekly',         // backward compat
  'quests': 'Weekly',        // backward compat
  'business': 'Weekly',      // backward compat
  'create': 'Weekly',        // backward compat
  'groans': 'Weekly',        // backward compat
  'healing': 'Weekly',       // backward compat
  'tracker': 'Weekly',       // backward compat
  
  // Progress (unchanged)
  'progress': 'Progress',
  
  // Special views (unchanged)
  'leaderboard': 'Leaderboard',
  'summary': 'GroansSummary',
  'healing-summary': 'HealingSummary',
}
```

### Default fallback

**Line 72:** Change `'Discover'` → `'Daily'`

### Categories array

**Line 145:** Change `['Discover', 'Paths', 'Tune', 'Progress']` → `['Daily', 'Weekly', 'Progress']`

### Direct `?tab=` URL params in code

These files construct URL params with capital-P `?tab=Paths` (bypasses the lowercase mapping). Update to lowercase `?tab=weekly`:

| File | Lines | Current | Change to |
|------|-------|---------|-----------|
| `PathDefinitionFlow.jsx` | 364, 652, 1095 | `?tab=Paths` | `?tab=weekly` |
| `MoneyMapFlow.jsx` | 614, 636, 657 | `?tab=Paths` | `?tab=weekly` |
| `FinancialSecurityCard.jsx` | 135 | `?tab=Paths` | `?tab=weekly` |
| `LifePathWidgetTest.jsx` | 986 | `?tab=Paths` | `?tab=weekly` |
| `ExperienceGameFlow.jsx` | 810, 848 | `?tab=discover` | Navigate to `/discovery` instead (for solo fallback) OR `?tab=daily` (for post-call users) |

### Hardcoded tab name references

**Challenge.jsx:**

| Line | Current | Change to |
|------|---------|-----------|
| 411 | `new Set(['Discover', 'Tune', 'Progress'])` | `new Set(['Daily', 'Weekly', 'Progress'])` |
| 1585 | `!unlockedTabs.has(category)` in isLocked | Remove (see Section 7) |
| 1591-1592 | `setActiveCategory('Discover')` on locked Paths click | Remove (see Section 7) |
| 1608 | `!unlockedTabs.has('Paths') && activeCategory === 'Discover'` | Remove (see Section 7) |
| 1637 | `onBack={() => setActiveCategory('Paths')}` (GroansSummary) | `'Weekly'` |
| 1646 | `onBack={() => setActiveCategory('Paths')}` (HealingSummary) | `'Weekly'` |
| 1751-1753 | `activeCategory === 'Discover'` renders DiscoverTab | Remove entire block |
| 1756 | `activeCategory === 'Paths'` | `'Weekly'` |
| 1763 | `activeCategory === 'Paths'` | `'Weekly'` |

**LevelTab.jsx:**

| Line | Current | Change to |
|------|---------|-----------|
| 523 | `onNavigateTab?.('Discover')` | `onNavigateTab?.('Daily')` |
| 615, 633, 770, 803 | `onNavigateTab?.('Paths')` | `onNavigateTab?.('Weekly')` |

**LevelConfig.js:**

| Line | Current | Change to |
|------|---------|-----------|
| 40, 49, 313, 327 | `navigateTo: 'Courage'` | `navigateTo: 'Weekly'` |

**onboardingV2.js:**

| Line | Current | Change to |
|------|---------|-----------|
| 539 | `discover: { name: 'Discover', ...}` | `discover: { name: 'Daily', ...}` |

---

## 7. Unlock Gate Removal

The Paths tab lock gate is fully removed. Weekly tab is always visible.

### Deletions

| File | Lines | What |
|------|-------|------|
| Challenge.jsx | 455-466 | Tab unlock logic (Supabase queries for life_path_sessions + current job) |
| Challenge.jsx | 1585 | `\|\| !unlockedTabs.has(category)` from isLocked calculation |
| Challenge.jsx | 1591-1592 | Paths-locked redirect to Discover |
| Challenge.jsx | 1601 | Lock icon conditional for non-comingSoon tabs |
| Challenge.jsx | 1607-1612 | "Complete discovery to unlock Paths" hint |
| Challenge.jsx | 1752 | `onUnlockTab` prop on DiscoverTab |
| Challenge.css | 691-694 | `.paths-lock-hint` CSS rule |
| DiscoverTab.jsx | 33 | `onUnlockTab` from function signature |
| JourneyTab.jsx | 74 | `onUnlockTab` from function signature |
| JourneyOnboarding.jsx | 19 | `onUnlockTab` from function signature |

### State simplification

`unlockedTabs` state can potentially be removed entirely since all tabs are always visible. The only remaining use would be `lockedCategories` (for future "coming soon" tabs), which is already a separate concern. Consider collapsing to just `lockedCategories`.

---

## 8. Flow Navigation Updates

### ExperienceGameFlow → return navigation

**Lines 810, 848:** Currently navigate to `/7-day-challenge?tab=discover`.

**New behavior:** Use `?returnTo=` query param to determine where to go back.

**Implementation:**
- Weekly tab "Find something new" link: `navigate('/experience-game?returnTo=' + encodeURIComponent('/7-day-challenge?tab=weekly'))`
- Solo fallback `/discovery` page: `navigate('/experience-game?returnTo=/discovery')`
- ExperienceGameFlow reads `decodeURIComponent(searchParams.get('returnTo'))` and uses it. Default: `/7-day-challenge?tab=weekly`.
- Same pattern already used by EssenceMirrorFlow (line 96), so this is consistent. Note: returnTo values containing query params (like `?tab=weekly`) must be encoded/decoded to avoid nested `?` breaking URL parsing.

### EssenceMirrorFlow → returnTo default

**Line 96:** Currently defaults `returnTo` to `/me`.

**When called from `/discovery`:** DiscoverTab should pass `?returnTo=/discovery`. No change needed to EssenceMirrorFlow itself — just update the navigate call in DiscoverTab.jsx line 263:

```js
// Before:
navigate('/essence-mirror')

// After:
navigate('/essence-mirror?returnTo=/discovery')
```

### MoneyMapFlow → completion navigation

**Lines 614, 636, 657:** Navigate to `/7-day-challenge?tab=Paths`. Update to `?tab=weekly`. No other changes needed.

---

## 9. New Routes

Two new standalone pages:

### `/discovery`

Solo fallback page. Renders DiscoverTab (or simplified version) outside the tab system.

- Fetches own `userId`, `heroStage` from Supabase
- No `onUnlockTab` or `onUpdate` callbacks
- No DirectionSection (that's on Progress via StageCard)
- After full completion → navigate to `/7-day-challenge?tab=weekly`
- Route added to AppRouter.jsx

### `/direction`

Direction bridge page for stage 8+ users. Renders DirectionSection outside the tab system.

- Fetches own `userId`, `heroStage`, direction status from Supabase
- After completing all 5 cards → navigate to `/7-day-challenge?tab=progress`
- Triggered via StageCard CTA on Progress tab
- Route added to AppRouter.jsx

---

## 10. Persistent Onboarding Banner (Progress Tab)

New component at top of ProgressTab for users with incomplete setup.

### Visibility

Shows when `!allSetupDone` (already computed in ProgressTab). Not dismissible. Disappears when all 4 setup checks pass (dome + essence + paths + money_map).

### Content

```
┌─────────────────────────────────────────┐
│  Complete your onboarding               │
│                                         │
│  [Book your onboarding call →]  (primary CTA, purple)
│                                         │
│  Want to do it yourself? →      (secondary link, grey)
│                                         │
└─────────────────────────────────────────┘
```

- Primary CTA links to booking page URL (configurable, possibly external Calendly/Cal.com link)
- Secondary link navigates to `/discovery`
- Replaces the current `SETUP_CHECKS` smart CTA section (ProgressTab lines 1516-1532) for the primary CTA, but the setup checklist at the bottom (lines 1546-1581) remains as progress indicator

---

## 11. Files Changed Summary

| File | Type | Changes |
|------|------|---------|
| `src/hooks/useChallengeData.js` | Edit | TAB_TO_CATEGORY mapping, categories array, default fallback |
| `src/Challenge.jsx` | Edit | Tab names, remove Discover rendering, remove unlock gate, remove lock UI, add first-open landing logic |
| `src/Challenge.css` | Edit | Remove `.paths-lock-hint`, update any tab-name-specific styles |
| `src/components/DiscoverTab.jsx` | Edit | Remove `onUnlockTab` prop, update essence mirror navigate to include returnTo |
| `src/components/ProgressTab.jsx` | Edit | Add persistent onboarding banner |
| `src/components/ProgressTab.css` | Edit | Banner styles |
| `src/components/level/LevelTab.jsx` | Edit | Tab name refs, add "Find something new" link, update empty state |
| `src/components/level/LevelConfig.js` | Edit | `navigateTo` references |
| `src/data/journeyChapters.js` | Edit | Direction step CTA text + route |
| `src/flows/ExperienceGameFlow.jsx` | Edit | Return navigation (returnTo param) |
| `src/flows/MoneyMapFlow.jsx` | Edit | `?tab=Paths` → `?tab=weekly` |
| `src/flows/PathDefinitionFlow.jsx` | Edit | `?tab=Paths` → `?tab=weekly` |
| `src/components/FinancialSecurityCard.jsx` | Edit | `?tab=Paths` → `?tab=weekly` |
| `src/pages/LifePathWidgetTest.jsx` | Edit | `?tab=Paths` → `?tab=weekly` |
| `src/lib/onboardingV2.js` | Edit | Tab name reference |
| `src/components/JourneyTab.jsx` | Edit | Remove `onUnlockTab` prop |
| `src/components/journey/JourneyOnboarding.jsx` | Edit | Remove `onUnlockTab` prop |
| `src/pages/DiscoveryPage.jsx` | **New** | Standalone solo fallback page at `/discovery` |
| `src/pages/DirectionPage.jsx` | **New** | Standalone direction bridge page at `/direction` |
| `src/AppRouter.jsx` | Edit | Add `/discovery` and `/direction` routes |

---

## 12. What This Spec Does NOT Cover

- **Voice onboarding call implementation** — the call itself, audio recording, AI transcription, stem exercises. That's a separate system being built in huzz-brand.
- **Voice data integration** — how call data populates the app's existing data structures (essence, dome ratings, quests). Separate spec needed.
- **Booking page** — the external page where users book their onboarding call. URL TBD.
- **Daily tab content changes** — TuneTab internals stay the same, just renamed. Any future changes to what "Daily" contains are separate work.
- **Weekly tab content changes** — beyond the "Find something new" link and empty state update, LevelTab internals stay the same.

---

## 13. Open Questions

1. **Booking page URL.** Where does "Book your onboarding call" link to? External Calendly? An in-app page? **Decision: TBD.**

2. **ExperienceGameFlow return behavior.** When accessed from Weekly tab's "Find something new" link (not from `/discovery`), should it return to Weekly tab or stay in the experience game flow until a new path is created? **Recommendation:** Return to Weekly, let the user naturally flow from there.

## 14. Decisions Made

- **Tab names confirmed:** Daily, Weekly, Progress (left to right). "Daily" accepted despite TuneTab containing some weekly-cadence items.
- **Tab order confirmed:** `['Daily', 'Weekly', 'Progress']` — Daily leftmost as default landing.
