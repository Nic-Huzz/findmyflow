# Tab Restructure: Voice-First Onboarding — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename tabs from Discover/Paths/Tune/Progress to Daily/Weekly/Progress, remove the Discover tab from the main Challenge view, remove the Paths lock gate, add first-open landing logic, create two standalone pages (/discovery and /direction), and update all downstream navigation references. End state: the app is a daily maintenance tool, not a discovery tool.

**Architecture:** Four tasks, each ending with a passing build. Task 1 is mechanical renames. Task 2 removes the Discover tab rendering and unlock gate. Task 3 adds landing logic. Task 4 adds new pages and UI. Each task is independently shippable but must execute in order.

**Tech Stack:** React 18 + Vite + Supabase + React Router v7

**Spec:** `docs/superpowers/specs/2026-11-09-tab-restructure-voice-onboarding-design.md`

## Global Constraints

- Light theme throughout, no dark backgrounds
- No em dashes in user-facing copy
- CSS scoped to parent class
- 12-year-old readable copy
- Build must pass (`npm run build`) after every task
- Line numbers verified against main commit `c645a6e4` (2026-11-10)

---

### Task 1: Tab Renames + URL Migration

**Goal:** Rename all tab references from Discover/Paths/Tune to Daily/Weekly. Preserve backward-compatible URL routing. No behavior changes, no component removals.

**Files:**
- Modify: `src/hooks/useChallengeData.js:39-145`
- Modify: `src/Challenge.jsx:412,1647,1656,1715,1774,1781`
- Modify: `src/components/level/LevelTab.jsx:530,622,640,777,810`
- Modify: `src/components/level/LevelConfig.js:40,49,313,327`
- Modify: `src/flows/MoneyMapFlow.jsx:714,741,762`
- Modify: `src/flows/PathDefinitionFlow.jsx:367,655,1098`
- Modify: `src/components/FinancialSecurityCard.jsx:250`
- Modify: `src/pages/LifePathWidgetTest.jsx:986`
- Modify: `src/lib/onboardingV2.js:539`
- Modify: `src/data/journeyChapters.js:41`

**Interfaces:**
- Produces: Tab names 'Daily', 'Weekly', 'Progress' used everywhere. All `?tab=` URL params use lowercase (`daily`, `weekly`, `progress`) with backward compat for old names.

- [ ] **Step 1:** `src/hooks/useChallengeData.js` — Replace TAB_TO_CATEGORY mapping (lines 39-61) with:
```js
const TAB_TO_CATEGORY = {
  // Daily (was Tune + Discover)
  'daily': 'Daily',
  'tune': 'Daily',           // backward compat
  'bonus': 'Daily',          // backward compat
  'discover': 'Daily',       // backward compat
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
Line 72: Change default fallback from `'Discover'` to `'Daily'`.
Line 145: Change `['Discover', 'Paths', 'Tune', 'Progress']` to `['Daily', 'Weekly', 'Progress']`.

- [ ] **Step 2:** `src/Challenge.jsx` — Rename tab references:
  - Line 412: `new Set(['Discover', 'Tune', 'Progress'])` → `new Set(['Daily', 'Weekly', 'Progress'])`
  - Line 1377: `activeCategory === 'Tune'` → `activeCategory === 'Daily'` (guard function)
  - Line 1647: `setActiveCategory('Paths')` → `setActiveCategory('Weekly')`
  - Line 1656: `setActiveCategory('Paths')` → `setActiveCategory('Weekly')`
  - Line 1715: `activeCategory === 'Tune'` → `activeCategory === 'Daily'` (TuneTab render)
  - Line 1774: `activeCategory === 'Paths'` → `activeCategory === 'Weekly'` (step2 banner)
  - Line 1781: `activeCategory === 'Paths'` → `activeCategory === 'Weekly'` (LevelTab render)
  - NOTE: Lines 923, 968 reference `quest.category === 'Tune'` — these are QUEST categories, not tab names. Do NOT change them.

- [ ] **Step 3:** `src/components/level/LevelTab.jsx` — Update onNavigateTab calls:
  - Line 530: `onNavigateTab?.('Discover')` → `onNavigateTab?.('Daily')`
  - Lines 622, 640: `onNavigateTab?.('Paths')` → `onNavigateTab?.('Weekly')`
  - Lines 777, 810: `onNavigateTab?.('Paths')` → `onNavigateTab?.('Weekly')`

- [ ] **Step 4:** `src/components/level/LevelConfig.js` — Lines 40, 49, 313, 327: `navigateTo: 'Courage'` → `navigateTo: 'Weekly'`

- [ ] **Step 5:** URL param updates in flow files:
  - `src/flows/MoneyMapFlow.jsx` lines 714, 741, 762: `?tab=Paths` → `?tab=weekly`
  - `src/flows/PathDefinitionFlow.jsx` lines 367, 655, 1098: `?tab=Paths` → `?tab=weekly`
  - `src/components/FinancialSecurityCard.jsx` line 250: `?tab=Paths` → `?tab=weekly`
  - `src/pages/LifePathWidgetTest.jsx` line 986: `?tab=Paths` → `?tab=weekly`

- [ ] **Step 6:** `src/lib/onboardingV2.js` line 539: `discover: { name: 'Discover'` → `discover: { name: 'Daily'`

- [ ] **Step 7:** `src/data/journeyChapters.js` line 41: Change `nextAction: 'Explore your direction on the Discover tab'` → `nextAction: 'Find your direction'` and `nextRoute: '/7-day-challenge'` → `nextRoute: '/direction'`

- [ ] **Step 8:** Build check: `npm run build`

- [ ] **Step 9:** Commit
```bash
git add -A && git commit -m "feat: rename tabs Discover/Paths/Tune → Daily/Weekly/Progress with backward-compat URL routing"
```

---

### Task 2: Discover Tab Removal + Unlock Gate Removal

**Goal:** Remove DiscoverTab rendering from Challenge.jsx, remove the Paths lock gate (unlock logic, lock icon, lock hint), and clean up the onUnlockTab prop chain. After this task, Weekly is always visible with no lock.

**Files:**
- Modify: `src/Challenge.jsx:52-53,412,457-468,1595,1601-1604,1610-1611,1618-1621,1761-1771`
- Modify: `src/Challenge.css:691-699`
- Modify: `src/components/DiscoverTab.jsx:33`
- Modify: `src/components/JourneyTab.jsx:17`

**Interfaces:**
- Consumes: Tab names from Task 1 ('Daily', 'Weekly', 'Progress')
- Produces: No Discover tab in Challenge render, no lock gate, onUnlockTab removed

- [ ] **Step 1:** `src/Challenge.jsx` — Remove Discover tab rendering:
  - Delete lines 1761-1771 (entire `activeCategory === 'Discover' && (<DiscoverTab .../>)` block). After Task 1's rename, this block is dead code — nothing sets activeCategory to 'Discover' anymore (URL mapping sends 'discover' → 'Daily', and there's no 'Discover' tab button). But it must still be deleted to avoid confusion and remove the import.
  - Delete line 52: `import DiscoverTab from './components/DiscoverTab'`
  - Delete line 53: `import './components/DiscoverTab.css'`
  - KEEP DiscoverTab.jsx file in repo (needed for Task 4's /discovery page)

- [ ] **Step 2:** `src/Challenge.jsx` — Remove unlock gate logic:
  - Delete lines 457-468: Tab unlock Supabase queries (life_path_sessions + current_job check)
  - Line 1595: Change `const isLocked = isComingSoon || !unlockedTabs.has(category)` → `const isLocked = isComingSoon`
  - Delete lines 1601-1602: `if (isLocked && category === 'Paths')` redirect
  - Delete line 1611: Lock icon span `{isLocked && !isComingSoon && <span className="lock-icon">...</span>}`
  - Delete lines 1618-1621: `.paths-lock-hint` div
  - Simplify lines 1782-1784: Remove `setUnlockedTabs` wrapper in LevelTab onNavigateTab callback, keep just `setActiveCategory(tab)`
  - Delete or simplify `unlockedTabs` state at line 412 if no longer read

- [ ] **Step 3:** `src/Challenge.css` — Delete `.paths-lock-hint` rule (lines 691-699)

- [ ] **Step 4:** `src/components/DiscoverTab.jsx` line 33: Remove `onUnlockTab` from destructured props. Grep for any usage inside and remove.

- [ ] **Step 5:** `src/components/JourneyTab.jsx` line 17: Remove `onUnlockTab` from destructured props. Line 404: Remove `onUnlockTab={onUnlockTab}` from JourneyOnboarding render.

- [ ] **Step 6:** `src/components/onboarding/JourneyOnboarding.jsx` line 19: Remove `onUnlockTab` from destructured props. Grep for any usage inside and remove.

- [ ] **Step 7:** Build check: `npm run build`

- [ ] **Step 8:** Commit
```bash
git add -A && git commit -m "feat: remove Discover tab from Challenge + remove Paths lock gate"
```

---

### Task 3: Landing Logic + allSetupDone Extraction

**Goal:** New/incomplete users land on Progress tab, returning users land on Daily. Extract `allSetupDone` check from ProgressTab to useChallengeData.js.

**Files:**
- Modify: `src/hooks/useChallengeData.js` (add allSetupDone check + landing logic)

**Interfaces:**
- Consumes: Tab names from Task 1, Discover removed from Task 2
- Produces: `allSetupDone` boolean returned from useChallengeData hook

- [ ] **Step 1:** `src/hooks/useChallengeData.js` — Add setup completion check. IMPORTANT: Mirror ProgressTab's EXACT queries (lines 563-590), not approximations. Add state + effect:
```js
// Setup completion check for landing logic
const [allSetupDone, setAllSetupDone] = useState(null) // null = loading
const initialLandingSet = useRef(false)

useEffect(() => {
  if (!user?.id) return
  Promise.all([
    // Dome check — same as ProgressTab line 663
    supabase.from('experience_dome_ratings').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    // Essence check — must match ProgressTab line 575: checks lead_flow_profiles, NOT user_stage_progress
    supabase.from('lead_flow_profiles').select('id').eq('user_id', user.id).limit(1),
    // Money map check — same as ProgressTab line 572
    supabase.from('user_stage_progress').select('money_map_completed').eq('user_id', user.id).maybeSingle(),
    // Paths check — must match ProgressTab line 586: active, non-current-job quests
    supabase.from('quests').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'active').neq('is_current_job', true),
  ]).then(([domeRes, essenceRes, stageRes, questsRes]) => {
    const done = (domeRes.count || 0) > 0
      && (essenceRes.data?.length || 0) > 0
      && !!stageRes.data?.money_map_completed
      && (questsRes.count || 0) > 0
    setAllSetupDone(done)
  })
}, [user?.id])
```

- [ ] **Step 2:** `src/hooks/useChallengeData.js` — Integrate landing logic into initial category selection to avoid flash. Instead of a separate useEffect that redirects AFTER content renders, modify the `getInitialCategory` function (lines 69-73) to return `null` when no `?tab=` param is present, and add a useEffect that sets the real category once `allSetupDone` resolves:
```js
// In getInitialCategory: if no ?tab= param, return null (pending)
function getInitialCategory() {
  const params = new URLSearchParams(window.location.search)
  const tabParam = params.get('tab')?.toLowerCase()
  if (tabParam && TAB_TO_CATEGORY[tabParam]) return TAB_TO_CATEGORY[tabParam]
  if (tabParam) return 'Daily'
  return null // no explicit tab — will be set by landing logic
}

// Then add effect:
useEffect(() => {
  if (activeCategory !== null || allSetupDone === null) return
  if (initialLandingSet.current) return
  initialLandingSet.current = true
  setActiveCategory(allSetupDone ? 'Daily' : 'Progress')
}, [activeCategory, allSetupDone])
```
NOTE: Challenge.jsx must handle `activeCategory === null` by showing a loading state (the existing skeleton/loading check should cover this since the main data loading runs in parallel).

- [ ] **Step 3:** Return `allSetupDone` from the hook alongside existing values.

- [ ] **Step 4:** Build check: `npm run build`

- [ ] **Step 5:** Commit
```bash
git add -A && git commit -m "feat: add first-open landing logic — incomplete users land on Progress"
```

---

### Task 4: New Pages + Empty State + Onboarding Banner

**Goal:** Create /discovery standalone page, /direction standalone page, update Weekly tab empty state, add "Find something new" link, add persistent onboarding banner to Progress, update ExperienceGameFlow return navigation.

**Files:**
- Create: `src/pages/DiscoveryPage.jsx`
- Create: `src/pages/DirectionPage.jsx`
- Modify: `src/AppRouter.jsx` (add routes)
- Modify: `src/components/DiscoverTab.jsx:33` (add hideDirection prop)
- Modify: `src/components/level/LevelTab.jsx:501-530` (empty state + "Find something new")
- Modify: `src/flows/ExperienceGameFlow.jsx:811,850` (returnTo support)
- Modify: `src/components/ProgressTab.jsx` (onboarding banner)
- Modify: `src/components/ProgressTab.css` (banner styles)
- Modify: `src/components/DiscoverTab.jsx` (essence mirror returnTo)

**Interfaces:**
- Consumes: `allSetupDone` from Task 3, tab names from Task 1

- [ ] **Step 1:** Create `src/pages/DiscoveryPage.jsx`:
```jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabaseClient'
import DiscoverTab from '../components/DiscoverTab'

export default function DiscoveryPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [heroStage, setHeroStage] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    supabase.from('user_stage_progress')
      .select('current_journey_level')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        setHeroStage(data?.current_journey_level || 0)
        setLoading(false)
      })
  }, [user?.id])

  if (!user) { navigate('/log-in'); return null }
  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh' }}>
      <DiscoverTab
        userId={user.id}
        heroStage={heroStage}
        hideDirection={true}
        onUpdate={() => {}}
      />
    </div>
  )
}
```

- [ ] **Step 2:** Create `src/pages/DirectionPage.jsx`:
```jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabaseClient'
import DirectionSection from '../components/direction/DirectionSection'

export default function DirectionPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [heroStage, setHeroStage] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    supabase.from('user_stage_progress')
      .select('current_journey_level')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        const stage = data?.current_journey_level || 0
        setHeroStage(stage)
        setLoading(false)
        if (stage < 8) navigate('/7-day-challenge?tab=progress')
      })
  }, [user?.id, navigate])

  if (!user) { navigate('/log-in'); return null }
  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', padding: '20px 16px' }}>
      <button onClick={() => navigate('/7-day-challenge?tab=progress')} style={{ background: 'none', border: 'none', color: '#5e17eb', fontSize: '0.95rem', cursor: 'pointer', marginBottom: 16 }}>
        &larr; Back to Progress
      </button>
      <DirectionSection userId={user.id} onUpdate={() => {}} />
    </div>
  )
}
```

- [ ] **Step 3:** `src/AppRouter.jsx` — Add routes:
```jsx
const DiscoveryPage = lazyRetry(() => import('./pages/DiscoveryPage'))
const DirectionPage = lazyRetry(() => import('./pages/DirectionPage'))
// Inside routes, near other AuthGate routes:
<Route path="/discovery" element={<AuthGate><Suspense fallback={<LoadingSpinner />}><DiscoveryPage /></Suspense></AuthGate>} />
<Route path="/direction" element={<AuthGate><Suspense fallback={<LoadingSpinner />}><DirectionPage /></Suspense></AuthGate>} />
```

- [ ] **Step 4:** `src/components/DiscoverTab.jsx` line 33 — Add `hideDirection = false` to props. Wrap DirectionSection render in `{!hideDirection && ...}`.

- [ ] **Step 5:** `src/components/level/LevelTab.jsx` — Update empty state (lines 501-507):
  - Remove lock emoji
  - Change copy to: "Find something you want to pursue"
  - Link to `/experience-game?returnTo=%2F7-day-challenge%3Ftab%3Dweekly`

- [ ] **Step 6:** `src/components/level/LevelTab.jsx` line 530 — Update discovery prompt:
  - Change copy to: "Not feeling any of these? Find something new"
  - Change `onClick` to `navigate('/experience-game?returnTo=' + encodeURIComponent('/7-day-challenge?tab=weekly'))`
  - `useNavigate` is already imported (line 14) — no new import needed

- [ ] **Step 7:** `src/flows/ExperienceGameFlow.jsx` — Add returnTo support:
  - Add `import { useSearchParams } from 'react-router-dom'` (or add to existing import)
  - Near line 808: `const [searchParams] = useSearchParams()` and `const returnTo = decodeURIComponent(searchParams.get('returnTo') || '/7-day-challenge?tab=daily')`
  - Lines 811, 850: Replace `navigate('/7-day-challenge?tab=discover')` with `navigate(returnTo)`

- [ ] **Step 8:** `src/components/ProgressTab.jsx` — Add onboarding banner after StageCard AND hide the existing smart CTA. Use the EXISTING `allSetupDone` variable (line 1009) — no new import needed.

First, at lines 1596-1612, wrap the existing smart CTA block in a comment or delete it — the onboarding banner replaces it as the primary CTA for incomplete users:
```jsx
{/* REMOVED: replaced by onboarding banner above
{nextCta && allSetupDone === false && (
  ... existing smart CTA ...
)}
*/}
```

Then add the new banner after StageCard:
```jsx
{!allSetupDone && (
  <div className="pt-onboarding-banner">
    <div className="pt-onboarding-title">Complete your onboarding</div>
    <button className="pt-cta pt-cta-purple" onClick={() => window.open('https://cal.com/nichuzz/onboarding', '_blank')}>
      Book your onboarding call &rarr;
    </button>
    <button className="pt-onboarding-secondary" onClick={() => navigate('/discovery')}>
      Want to do it yourself? &rarr;
    </button>
  </div>
)}
```
Note: booking URL is placeholder — update when real URL is decided.

- [ ] **Step 9:** `src/components/ProgressTab.css` — Add banner styles:
```css
.progress-tab .pt-onboarding-banner {
  background: #fff;
  border-radius: 16px;
  padding: 24px 20px;
  text-align: center;
  margin-bottom: 16px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.progress-tab .pt-onboarding-title {
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 16px;
}
.progress-tab .pt-onboarding-secondary {
  background: none;
  border: none;
  color: #888;
  font-size: 0.9rem;
  cursor: pointer;
  margin-top: 8px;
}
```

- [ ] **Step 10:** `src/components/DiscoverTab.jsx` — Update essence mirror navigation to include returnTo:
  - Find `navigate('/essence-mirror')` and change to `navigate('/essence-mirror?returnTo=/discovery')`

- [ ] **Step 11:** Build check: `npm run build`

- [ ] **Step 12:** Commit
```bash
git add -A && git commit -m "feat: add /discovery + /direction pages, Weekly empty state, onboarding banner, ExperienceGameFlow returnTo"
```
