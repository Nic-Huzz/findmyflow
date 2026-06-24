# Business Page + Nav Restructure — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Move Business out of the 7-day-challenge into its own top-level page at `/business`, replace the Compass nav icon with Business, and add a placeholder Priority tab in the challenge.

**Architecture:** Create a focused `useBusinessPageData` hook that fetches projects, quest definitions, and completions from existing sources (JSON + Supabase). Build `BusinessPage.jsx` using the v2 mockup design. Extract Business rendering from Challenge.jsx cleanly. Quest flows still return to `/7-day-challenge` for now — a `returnTo` parameter is deferred to Phase 2 since it touches 30+ flow files.

**Tech Stack:** React 18, React Router v7, Supabase, existing hooks (useSubscription), stageConfig

**Design:** `docs/mockups/business-page-v2.html` | Design doc: `docs/plans/2026-03-03-business-page-nav-restructure-design.md`

**Known limitation (Phase 2):** Flow quests hardcode `navigate('/7-day-challenge')` as return path (~100 instances across 30+ files). Users completing business quests from `/business` will land on the challenge page. They can tap the Business toolbar icon to return. Phase 2 adds `?returnTo=/business` query param support.

---

### Task 1: Update Bottom Toolbar — Compass → Business

**Files:**
- Modify: `src/components/BottomToolbar.jsx:28-33`

**Step 1: Replace the compass nav item**

In `MAIN_NAV_ITEMS` array, change the third entry (lines 28-33):

```javascript
// BEFORE:
{
  id: 'compass',
  label: 'Compass',
  icon: '🧭',
  path: '/flow-compass'
},

// AFTER:
{
  id: 'business',
  label: 'Business',
  icon: '💼',
  path: '/business'
},
```

**Step 2: Test manually**

Run: `npm run dev`
- Bottom toolbar shows 💼 Business instead of 🧭 Compass
- Tapping Business navigates to `/business` (blank page expected — route not added yet)
- `/flow-compass` still works via direct URL

**Step 3: Commit**

```bash
git add src/components/BottomToolbar.jsx
git commit -m "feat: replace compass with business in bottom toolbar nav"
```

---

### Task 2: Create useBusinessPageData Hook

**Files:**
- Create: `src/hooks/useBusinessPageData.js`

**Context:** Read these before starting:
- `src/hooks/useChallengeData.js:145-160` — quest JSON loading pattern
- `src/hooks/useChallengeData.js:238-262` — project fetching pattern
- `src/lib/stageConfig.js:17-150` — STAGES enum and STAGE_CONFIG
- `src/data/personaProfiles.js` — normalizePersona function

**Step 1: Create the hook**

```javascript
import { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import { getStageConfig } from '../lib/stageConfig'
import { normalizePersona } from '../data/personaProfiles'

function cacheBustUrl(url) {
  const v = import.meta.env.VITE_APP_VERSION || Date.now()
  return `${url}?v=${v}`
}

export default function useBusinessPageData() {
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [allQuests, setAllQuests] = useState([])
  const [completions, setCompletions] = useState([])
  const [activeStageTab, setActiveStageTab] = useState(null)
  const [showProjectSelector, setShowProjectSelector] = useState(false)
  const [stageProgress, setStageProgress] = useState(null)

  // Load quest definitions from JSON
  useEffect(() => {
    async function loadQuests() {
      try {
        const res = await fetch(cacheBustUrl('/challengeQuestsUpdate.json'))
        const data = await res.json()
        setAllQuests(data.quests || [])
      } catch (err) {
        console.error('Error loading quest data:', err)
      }
    }
    loadQuests()
  }, [])

  // Load user projects + completions + stage progress
  useEffect(() => {
    if (!user?.id) return
    loadUserData()
  }, [user?.id])

  async function loadUserData() {
    setLoading(true)
    try {
      const [projectsResult, completionsResult, stageResult] = await Promise.all([
        supabase
          .from('user_projects')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('quest_completions')
          .select('*')
          .eq('user_id', user.id)
          .eq('quest_category', 'Business'),
        supabase
          .from('user_stage_progress')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()
      ])

      const userProjects = projectsResult.data || []
      setProjects(userProjects)
      setCompletions(completionsResult.data || [])
      setStageProgress(stageResult.data)

      // Select project: try localStorage, then primary, then first
      const savedId = localStorage.getItem('fmf_selected_project_id')
      const saved = savedId && userProjects.find(p => p.id === savedId)
      const primary = userProjects.find(p => p.is_primary)
      const project = saved || primary || userProjects[0] || null

      if (project) {
        setSelectedProject(project)
        setActiveStageTab(project.current_stage ?? 1)
      } else {
        setActiveStageTab(0.9) // No project — show setup
      }
    } catch (err) {
      console.error('Error loading business data:', err)
    } finally {
      setLoading(false)
    }
  }

  // Handle project selection
  const selectProject = useCallback((project) => {
    setSelectedProject(project)
    setActiveStageTab(project.current_stage ?? 1)
    setShowProjectSelector(false)
    try { localStorage.setItem('fmf_selected_project_id', project.id) } catch {}
  }, [])

  // Filter quests for active stage
  const stageQuests = useMemo(() => {
    if (!activeStageTab && activeStageTab !== 0.9) return []
    const userPersona = normalizePersona(stageProgress?.persona)

    return allQuests
      .filter(q => {
        if (q.category !== 'Business') return false
        if (q.stage_required !== activeStageTab) return false
        if (q.archived) return false
        // Persona filtering
        if (q.persona_specific && userPersona) {
          const normalized = q.persona_specific.map(p => normalizePersona(p))
          if (!normalized.includes(userPersona)) return false
        }
        return true
      })
      .sort((a, b) => {
        // Explainers first, groans last
        if (a.isExplainer && !b.isExplainer) return -1
        if (!a.isExplainer && b.isExplainer) return 1
        if (a.type === 'Groan' && b.type !== 'Groan') return 1
        if (a.type !== 'Groan' && b.type === 'Groan') return -1
        return 0
      })
  }, [allQuests, activeStageTab, stageProgress])

  // Check if quest is completed
  const isQuestCompleted = useCallback((questId) => {
    return completions.some(c => c.quest_id === questId)
  }, [completions])

  // Stage progress calculation
  const stageCompletedCount = useMemo(() => {
    return stageQuests.filter(q => isQuestCompleted(q.id)).length
  }, [stageQuests, isQuestCompleted])

  const stageProgressPct = useMemo(() => {
    if (stageQuests.length === 0) return 0
    return Math.round((stageCompletedCount / stageQuests.length) * 100)
  }, [stageCompletedCount, stageQuests])

  // Next incomplete quest
  const nextQuest = useMemo(() => {
    return stageQuests.find(q => !isQuestCompleted(q.id)) || null
  }, [stageQuests, isQuestCompleted])

  // Completed stages for dots
  const completedStages = useMemo(() => {
    if (!selectedProject) return []
    const currentStage = selectedProject.current_stage ?? 1
    const done = []
    // All stages below current are completed (graduated past them)
    const stageIds = [0.9, 1, 2, 3, 4, 5, 6, 7]
    for (const s of stageIds) {
      if (s < currentStage) done.push(s)
    }
    return done
  }, [selectedProject])

  // Current stage config
  const currentStageConfig = useMemo(() => {
    if (activeStageTab == null) return null
    return getStageConfig(activeStageTab)
  }, [activeStageTab])

  return {
    loading,
    user,
    projects,
    selectedProject,
    selectProject,
    showProjectSelector,
    setShowProjectSelector,
    activeStageTab,
    setActiveStageTab,
    stageQuests,
    isQuestCompleted,
    stageCompletedCount,
    stageProgressPct,
    nextQuest,
    completedStages,
    currentStageConfig,
    stageProgress,
    refreshData: loadUserData
  }
}
```

**Step 2: Commit**

```bash
git add src/hooks/useBusinessPageData.js
git commit -m "feat: add useBusinessPageData hook for standalone business page"
```

---

### Task 3: Create BusinessPage CSS

**Files:**
- Create: `src/pages/BusinessPage.css`

**Step 1: Port CSS from mockup, scoped to `.business-page`**

Copy the `<style>` block from `docs/mockups/business-page-v2.html` and scope every selector to `.business-page`. Key changes from the mockup:
- Replace bare `.hero` with `.business-page .hero`
- Replace `.card` with `.business-page .card`
- Replace all other selectors the same way
- Remove `max-width: 430px` and `margin: 0 auto` from body — the app layout handles this
- Remove bottom toolbar CSS — the app's BottomToolbar component handles this
- Add `.business-page` root styles: `min-height: 100vh`, `background: #f2f2f7`, `padding-bottom: calc(120px + env(safe-area-inset-bottom, 0px))`

**Step 2: Commit**

```bash
git add src/pages/BusinessPage.css
git commit -m "feat: add BusinessPage styles from v2 mockup"
```

---

### Task 4: Create BusinessPage Component — Shell

**Files:**
- Create: `src/pages/BusinessPage.jsx`

**Context:** Read these before starting:
- `docs/mockups/business-page-v2.html` — exact HTML structure to replicate
- `src/components/BusinessSetup.jsx:32-268` — props interface for stage 0.9
- `src/components/QuestCard.jsx:294-303` — how flow quest navigation works (plain `<a href>`, NEVER `<Link>`)

**Step 1: Create the component**

```jsx
import { useState } from 'react'
import useBusinessPageData from '../hooks/useBusinessPageData'
import { useSubscription } from '../hooks/useSubscription'
import { isPaidQuest } from '../lib/subscriptionService'
import ChallengeProjectSelector from '../components/ChallengeProjectSelector'
import BusinessSetup from '../components/BusinessSetup'
import './BusinessPage.css'

const STAGE_DOTS = [
  { id: 0.9, label: 'Setup' },
  { id: 1, label: 'Validate' },
  { id: 2, label: 'Product' },
  { id: 3, label: 'Test' },
  { id: 4, label: 'Offer' },
  { id: 5, label: 'Campaign' },
  { id: 6, label: 'Launch' },
  { id: 7, label: 'Growth' },
]

export default function BusinessPage() {
  const {
    loading, user, projects, selectedProject, selectProject,
    showProjectSelector, setShowProjectSelector,
    activeStageTab, setActiveStageTab,
    stageQuests, isQuestCompleted, stageCompletedCount,
    stageProgressPct, nextQuest, completedStages,
    currentStageConfig, stageProgress, refreshData
  } = useBusinessPageData()

  const { hasAccess } = useSubscription()

  if (loading) {
    return (
      <div className="business-page">
        <div className="bp-loading">
          <div className="bp-spinner" />
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  // Project selector overlay
  if (showProjectSelector) {
    return (
      <div className="business-page">
        <ChallengeProjectSelector
          onSelect={(project) => selectProject(project)}
          currentProjectId={selectedProject?.id}
        />
      </div>
    )
  }

  const stageName = currentStageConfig?.name || `Stage ${activeStageTab}`
  const stageDesc = currentStageConfig?.description || ''
  const ringR = 30
  const ringCircumference = 2 * Math.PI * ringR
  const ringOffset = ringCircumference * (1 - stageProgressPct / 100)

  return (
    <div className="business-page">

      {/* 1 — HERO */}
      <div className="hero">
        <div className="hero-inner">
          <div className="hero-text">
            <div className="hero-project">
              {selectedProject?.name || 'No Project Yet'}
            </div>
            <h1 className="hero-title">
              {activeStageTab === 0.9 ? 'Setup' : `Stage ${activeStageTab}: ${stageName}`}
            </h1>
            <p className="hero-desc">{stageDesc}</p>
            {projects.length > 0 && (
              <button
                className="hero-switch"
                onClick={() => setShowProjectSelector(true)}
              >
                Switch Project ▾
              </button>
            )}
          </div>
          <div className="ring-wrap">
            <svg viewBox="0 0 68 68">
              <circle className="ring-bg" cx="34" cy="34" r={ringR} />
              <circle
                className="ring-val"
                cx="34" cy="34" r={ringR}
                style={{
                  strokeDasharray: ringCircumference,
                  strokeDashoffset: ringOffset
                }}
              />
            </svg>
            <span className="ring-label">{stageProgressPct}%</span>
          </div>
        </div>
      </div>

      {/* 2 — STAGE DOTS */}
      <div className="card stage-card">
        <div className="dots">
          {STAGE_DOTS.map(dot => {
            const isDone = completedStages.includes(dot.id)
            const isCurrent = activeStageTab === dot.id
            const dotClass = isDone ? 'done' : isCurrent ? 'current' : 'locked'
            const itemClass = isDone ? 'done' : isCurrent ? 'current' : ''

            return (
              <div
                key={dot.id}
                className={`dot-item ${itemClass}`}
                onClick={() => setActiveStageTab(dot.id)}
                style={{ cursor: 'pointer' }}
              >
                <div className={`dot-circle ${dotClass}`}>
                  {isDone ? '✓' : dot.id === 0.9 ? 'S' : dot.id}
                </div>
                <span className="dot-label">{dot.label}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* 3 — STAGE 0.9: BUSINESS SETUP */}
      {activeStageTab === 0.9 && (
        <div className="card">
          <BusinessSetup
            userId={user?.id}
            existingProject={selectedProject}
            userPersona={stageProgress?.persona}
            onSetupComplete={(project) => {
              selectProject(project)
              refreshData()
            }}
          />
        </div>
      )}

      {/* 4 — UP NEXT CARD (stages 1-7 only, when there's an incomplete quest) */}
      {activeStageTab !== 0.9 && nextQuest && (
        <div className="card next-card">
          <span className="next-eyebrow">Up Next</span>
          <div className="next-name">
            {nextQuest.isExplainer ? '📝' : '🎯'} {nextQuest.name}
          </div>
          <div className="next-meta">
            {nextQuest.isExplainer ? 'Explainer' : nextQuest.type || 'Quest'}
            {' • '}
            {isPaidQuest(nextQuest) && !hasAccess ? 'Paid' : 'Free'}
            {nextQuest.estimatedTime ? ` • ~${nextQuest.estimatedTime}` : ''}
          </div>
          {nextQuest.inputType === 'flow' ? (
            <a
              href={selectedProject?.id
                ? `${nextQuest.flow_route}?projectId=${selectedProject.id}`
                : nextQuest.flow_route}
              className="gold-btn"
            >
              Start Quest →
            </a>
          ) : (
            <button className="gold-btn" disabled>
              Start Quest →
            </button>
          )}
        </div>
      )}

      {/* 5 — QUEST LIST (stages 1-7) */}
      {activeStageTab !== 0.9 && stageQuests.length > 0 && (
        <div className="card">
          <div className="quest-title">
            {activeStageTab === 8 ? 'Tracking' : `Stage ${activeStageTab} Quests`}
          </div>
          {stageQuests.map(quest => {
            const completed = isQuestCompleted(quest.id)
            const paid = isPaidQuest(quest) && !hasAccess

            return (
              <div key={quest.id} className={`q-row ${completed ? 'done' : ''}`}>
                <div className={`q-icon ${completed ? 'done' : 'todo'}`}>
                  {completed ? '✅' : quest.isExplainer ? '📝' : '🎯'}
                </div>
                <div className="q-info">
                  <div className="q-name">{quest.name}</div>
                  <div className="q-sub">
                    {isPaidQuest(quest) ? 'Paid' : 'Free'}
                    {' • '}
                    {completed ? 'Completed' : quest.isExplainer ? 'Explainer' : `Stage ${activeStageTab}`}
                  </div>
                </div>
                {completed ? (
                  <button className="q-btn done-btn">Done</button>
                ) : quest.inputType === 'flow' ? (
                  <a
                    href={selectedProject?.id
                      ? `${quest.flow_route}?projectId=${selectedProject.id}`
                      : quest.flow_route}
                    className="q-btn start-btn"
                    style={{ textDecoration: 'none', textAlign: 'center' }}
                  >
                    {paid ? '🔒' : 'Start'}
                  </a>
                ) : (
                  <button className="q-btn start-btn" disabled={paid}>
                    {paid ? '🔒' : 'Start'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Empty state — stage has no quests */}
      {activeStageTab !== 0.9 && stageQuests.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <p style={{ fontSize: '14px', color: '#9a9daa' }}>
            No quests for this stage yet.
          </p>
        </div>
      )}

    </div>
  )
}
```

**Step 2: Test manually**

- Navigate to `/business` directly in browser URL bar
- Should see loading spinner, then hero + stage dots
- If user has projects: shows project name, stage progress
- If no projects: shows "No Project Yet", stage 0.9 Setup, BusinessSetup component
- Tapping stage dots should change viewed stage + quests
- "Start" links should navigate to flow pages (will return to `/7-day-challenge` — known limitation)

**Step 3: Commit**

```bash
git add src/pages/BusinessPage.jsx
git commit -m "feat: add BusinessPage component with hero, stage dots, quest list"
```

---

### Task 5: Add `/business` Route to AppRouter

**Files:**
- Modify: `src/AppRouter.jsx`

**Step 1: Add lazy import**

Near other page imports (around lines 36-238):

```javascript
const BusinessPage = lazy(() => import('./pages/BusinessPage'))
```

**Step 2: Add protected route**

Near the Challenge route (around line 581-585):

```javascript
<Route path="/business" element={
  <AuthGate>
    <BusinessPage />
  </AuthGate>
} />
```

**Step 3: Test the full flow**

Run: `npm run dev`
- Tap 💼 Business in toolbar → loads BusinessPage
- Hero shows project + stage + ring
- Stage dots work
- Quest "Start" links navigate to flows
- `/flow-compass` still accessible via URL

**Step 4: Commit**

```bash
git add src/AppRouter.jsx
git commit -m "feat: add /business route with AuthGate"
```

---

### Task 6: Remove Business Tab from Challenge

**Files:**
- Modify: `src/hooks/useChallengeData.js:138`
- Modify: `src/Challenge.jsx` (8 blocks)

**Step 1: Update categories array**

In `src/hooks/useChallengeData.js` line 138:

```javascript
// BEFORE:
const categories = ['Play-list', 'Healing', 'Business', 'Bonus']

// AFTER:
const categories = ['Play-list', 'Healing', 'Priority', 'Bonus']
```

**Step 2: Remove Business rendering blocks from Challenge.jsx**

Delete these 8 blocks (search for `activeCategory === 'Business'`):

| Line ~ | Block | Action |
|--------|-------|--------|
| 293 | `useEffect` — auto-select Setup tab when Business active | Delete entire useEffect |
| 1472 | `if (activeCategory === 'Business')` — persona/stage quest filtering | Delete the if block (keep the variable assignment above) |
| 1643 | `activeCategory === 'Business' ? activeStageTab : null` — artifact progress | Change to just `null` |
| 1721-1754 | Stage tabs wrapper for Business | Delete entire block |
| 1817 | `activeCategory === 'Business'` in stageConfig | Change to `false` or remove the ternary |
| 2099-2110 | BusinessSetup stage 0.9 rendering | Delete entire block |
| 2113-2152 | Stage 8 CRM link rendering | Delete entire block |
| 2155-2189 | Business quest cards (stages 1-7) | Delete entire block |

**Step 3: Add Priority tab placeholder**

In Challenge.jsx, inside the quest content area (near where the Business blocks were), add:

```jsx
{activeCategory === 'Priority' && (
  <div style={{
    textAlign: 'center',
    padding: '60px 20px',
    color: '#6c757d'
  }}>
    <span style={{ fontSize: '3rem', display: 'block', marginBottom: '16px' }}>🎯</span>
    <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1a1a2e', marginBottom: '8px' }}>
      Priority Tasks
    </h3>
    <p style={{ fontSize: '14px', lineHeight: 1.5 }}>
      Your personalised priority tasks will appear here soon.
    </p>
  </div>
)}
```

**Step 4: Clean up unused imports**

After removing Business blocks, check if these imports are still needed in Challenge.jsx:
- `BusinessSetup` — remove if no longer used
- `ChallengeStageTabs` — check if still used by other tabs (Healing uses stage-tab styling inline, not the component)
- `ChallengeProjectSelector` — check if still used by other tabs

**Step 5: Test manually**

- Navigate to `/7-day-challenge`
- Tabs show: Play-List | Healing | Priority | Bonus
- No "Business" tab
- Priority tab shows placeholder
- Play-List, Healing, Bonus all work normally
- No console errors

**Step 6: Commit**

```bash
git add src/hooks/useChallengeData.js src/Challenge.jsx
git commit -m "feat: replace Business tab with Priority placeholder in challenge"
```

---

### Task 7: Add Zarlo Context for /business

**Files:**
- Modify: `src/lib/zarlo/zarloPageContent.js`

**Step 1: Add business page entry**

Find the page context object and add:

```javascript
'/business': {
  pageName: 'Business',
  context: 'User is viewing their business stage journey. They can see their current stage progress, available quests, and stage progression from Setup through Growth.',
  suggestions: [
    'What should I focus on in this stage?',
    'Help me understand this quest',
    'How do I graduate to the next stage?'
  ]
},
```

**Step 2: Commit**

```bash
git add src/lib/zarlo/zarloPageContent.js
git commit -m "feat: add Zarlo AI context for /business page"
```

---

### Task 8: Build Check + Full Flow Test

**Step 1: Build**

Run: `npm run build`
Expected: No errors, no unused import warnings.

**Step 2: Full flow test checklist**

| # | Test | Expected |
|---|------|----------|
| 1 | Bottom toolbar shows 💼 Business | Yes, third icon |
| 2 | Tap Business → `/business` loads | Hero + dots + quests |
| 3 | Ring shows correct % for current stage | Matches quest completion ratio |
| 4 | Tapping stage dots changes quests | New stage's quests appear |
| 5 | "Start" on flow quest navigates correctly | Flow page loads |
| 6 | Completing flow → lands on `/7-day-challenge` | Known limitation, user taps Business to return |
| 7 | After return, `/business` shows updated completion | Quest marked done |
| 8 | Switch Project works | New project's stage/quests load |
| 9 | No projects → stage 0.9 Setup shows | BusinessSetup component renders |
| 10 | `/7-day-challenge` has no Business tab | Shows Priority placeholder instead |
| 11 | Play-List / Healing / Bonus tabs still work | No regressions |
| 12 | `/flow-compass` still accessible via URL | Page loads normally |
| 13 | Paid quest shows 🔒 for unpaid users | Lock icon, no Start |
| 14 | No console errors on any page | Clean console |

**Step 3: Fix any issues found, commit**

```bash
git add -A
git commit -m "fix: business page polish and edge cases"
```

---

## Phase 2 (Separate Plan — Not This PR)

1. **Return path support** — Create `useReturnPath()` hook, add `?returnTo=` param to flow quest links from BusinessPage, update 30+ flow files to use dynamic return path
2. **Priority tab content** — Build 4-step onboarding + weekly intentions features
3. **Non-flow quest completion** — BusinessPage currently only links to flow quests. Add inline completion for milestone/text/checkbox quests (port `handleQuestComplete` logic)
4. **Post-completion UX** — Confetti, reflection, graduation modal on BusinessPage after quest completion
