# Journey Tab Enrichment Implementation Plan (v2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enrich the Journey tab with a completed stages timeline, stage requirements, onboarding items, zone assessments, completed section, orphaned wahoo prompts, and backdate existing users. Move content from LevelTab (Quests) to JourneyTab (Journey) so Quests = "what to do", Journey = "where you are."

**Architecture:** Three tasks. Task 1 creates sub-components and adds the timeline + requirements. Task 2 moves onboarding + zones + completed from LevelTab to JourneyTab using the sub-components. Task 3 adds orphaned wahoo prompts + deploys/runs the backfill. Sub-components prevent JourneyTab from becoming a God component.

**Tech Stack:** React 18 + Supabase (PostgreSQL) + Vite

## Global Constraints

- Light theme (background `#f5f5f0`, brand purple `#5e17eb`, gold `#E9A23B`)
- CSS scoped: new sub-components get their own CSS files with unique prefixes
- No em dashes in user-facing copy
- Write so a 12-year-old would understand
- Branch: `light-portal`
- `DeepDiveCard` component (`src/components/level/DeepDiveCard.jsx`) uses `level-deep-dive` / `level-dd-*` CSS classes scoped under `.level-tab` in `LevelTab.css`. When using DeepDiveCard outside LevelTab, wrap in a div with class `level-tab` OR duplicate the ~70 lines of CSS with a new prefix. **Recommendation: wrap in `level-tab` class div** (simpler, no CSS duplication, DeepDiveCard is a shared component).
- LevelTab fires ~20 parallel `.then()` queries on mount (not serial awaits). This pattern is fine — copy it for JourneyTab sub-components rather than cramming into Promise.all.

## File Map

```
CREATE:
  src/components/journey/JourneyTimeline.jsx       — completed stages + current stage indicator
  src/components/journey/JourneyTimeline.css
  src/components/journey/JourneyOnboarding.jsx     — "Getting Started" items (moved from LevelTab)
  src/components/journey/JourneyOnboarding.css
  src/components/journey/JourneyZones.jsx           — zone assessment strip + modal (moved from LevelTab)
  src/components/journey/JourneyZones.css
  src/components/journey/JourneyCompleted.jsx       — completed quests + exercises (moved from LevelTab)
  src/components/journey/JourneyCompleted.css

MODIFY:
  src/components/JourneyTab.jsx                     — compose sub-components, add "What's next", add orphan prompt
  src/components/JourneyTab.css                     — "What's next" + orphan prompt styles
  src/components/level/LevelTab.jsx                 — remove onboarding, zones, completed sections + their state/fetches
```

## What Stays on LevelTab (Quests tab) After Task 2

These sections + their state + data fetches MUST remain:

| Section | State vars needed | Data fetches needed |
|---|---|---|
| Active Quests (QuestBoardCard) | `quests`, `questTasks`, `loadQuests` | `supabase.from('quests')`, `supabase.from('quest_tasks')` |
| Add Quest form | `showAddQuest`, `addQuestLabel`, `addQuestState`, `addQuestCareerId`, `addQuestCustom`, `addQuestSaving`, `lifePathCareers`, `handleAddQuest` | `life_path_sessions` fetch (for career dropdown) |
| "I need help with..." | `activeStruggle`, `hasCareerClarity`, `hasCareerAlignment`, `hasWoundMap`, `hasHealingCompass`, `hasFlowDeepDive`, `hasPeopleMatching` | All their respective existence checks |
| Life Path Progress button | `hasLifePaths` | (derived from life_path_sessions fetch above) |
| Unlock explainer modals | `unlockExplainer` | (no fetch, just UI state) |
| Capacity card | `capacityRefresh` | (prop from parent) |

State vars that CAN be removed from LevelTab (only used by sections being moved):
- `allLevelProgress`, `setAllLevelProgress`, `zoneModalLevel`, `setZoneModalLevel` (zone assessments)
- `hasCuriosityMap`, `hasEssenceAvatar`, `hasLifeMap` (onboarding section — BUT check: `hasLifeMap` is NOT used by remaining sections. `hasCuriosityMap` IS used by the completed section being moved. `hasLifePaths` is used by Active Quests empty state — MUST STAY.)
- `hasWahoos`, `hasPlaySkills`, `hasHealingCompletion`, `hasPlaylistCompletion` (onboarding section only)
- The `user_level_progress` all-levels fetch (line 301-311)
- The `essence_mirror_completed` / `hero_avatar_url` checks IF not used elsewhere

**CRITICAL CHECK:** Before removing any state var from LevelTab, grep for it in the REMAINING sections (Active Quests, Add Quest, "I need help with...", unlock modals). If it appears, keep it.

---

### Task 1: Sub-Components + Timeline + Requirements

**Files:**
- Create: `src/components/journey/JourneyTimeline.jsx`
- Create: `src/components/journey/JourneyTimeline.css`
- Modify: `src/components/JourneyTab.jsx` (import + render JourneyTimeline, add "What's next" section)
- Modify: `src/components/JourneyTab.css` (add "What's next" styles)

**Interfaces:**
- Consumes: `userId`, `heroStage` (from JourneyTab parent), DB tables for evidence timestamps
- Produces: `JourneyTimeline` component showing completed stages with dates + evidence

- [ ] **Step 1: Create journey directory**

```bash
mkdir -p src/components/journey
```

- [ ] **Step 2: Create JourneyTimeline component**

Create `src/components/journey/JourneyTimeline.jsx`:

```javascript
/**
 * JourneyTimeline — Completed hero stages above current stage.
 * Each completed stage shows: name + date + what they did.
 * CSS prefix: jtl-
 */

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import './JourneyTimeline.css'

const HERO_STAGES = [
  { stage: 2, name: 'The Earthquake', icon: '⚡' },
  { stage: 3, name: 'Head Full of Dreams', icon: '💭' },
  { stage: 4, name: 'Mirror / Mentor', icon: '🪞' },
  { stage: 5, name: 'First Vibe Rise', icon: '🔥' },
  { stage: 6, name: 'The Daily Loop', icon: '🔄' },
  { stage: 7, name: 'Pattern Revealed', icon: '🔮' },
]

export default function JourneyTimeline({ userId, heroStage }) {
  const [evidence, setEvidence] = useState({})

  useEffect(() => {
    if (!userId || heroStage < 3) return

    const ev = {}

    // All evidence fetches fire in parallel (not serial)
    // Stage 2: first NS check-in
    supabase.from('nervous_system_checkins')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          ev[2] = { date: data.created_at, label: 'First check-in' }
          setEvidence(prev => ({ ...prev, [2]: ev[2] }))
        }
      })

    // Stage 3: life paths session
    supabase.auth.getUser().then(({ data: userData }) => {
      const email = userData?.user?.email
      if (!email) return
      supabase.from('life_path_sessions')
        .select('created_at')
        .eq('client_email', email)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()
        .then(({ data }) => {
          if (data) setEvidence(prev => ({ ...prev, [3]: { date: data.created_at, label: 'Life Paths mapped' } }))
        })
    })

    // Stage 4: essence mirror
    supabase.from('user_stage_progress')
      .select('essence_mirror_completed, hero_avatar_url, updated_at')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.essence_mirror_completed && data?.hero_avatar_url) {
          setEvidence(prev => ({ ...prev, [4]: { date: data.updated_at, label: 'Hero avatar created' } }))
        }
      })

    // Stage 5: first Vibe Rise wahoo
    supabase.from('quest_completions')
      .select('completed_at')
      .eq('user_id', userId)
      .eq('quest_category', 'Groans')
      .like('reflection_text', '%"wahoo_classification":"vibe"%')
      .order('completed_at', { ascending: true })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setEvidence(prev => ({ ...prev, [5]: { date: data.completed_at, label: 'First Vibe Rise moment' } }))
      })

    // Stage 6: life path at vibe + charging/teaching
    supabase.from('quests')
      .select('label, updated_at')
      .eq('user_id', userId)
      .eq('status', 'active')
      .eq('predicted_state', 'vibe')
      .in('depth_level', ['charging', 'teaching'])
      .order('updated_at', { ascending: true })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setEvidence(prev => ({ ...prev, [6]: { date: data.updated_at, label: `${data.label} reached Vibe Rise` } }))
      })
  }, [userId, heroStage])

  if (heroStage < 3) return null

  const completedStages = HERO_STAGES.filter(s => s.stage < heroStage)

  return (
    <div className="jtl-timeline">
      {completedStages.map(s => {
        const ev = evidence[s.stage]
        return (
          <div key={s.stage} className="jtl-item">
            <div className="jtl-dot" />
            <div className="jtl-content">
              <div className="jtl-name">{s.icon} {s.name}</div>
              {ev && (
                <div className="jtl-detail">
                  {ev.label}
                  {ev.date && ` · ${new Date(ev.date).toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })}`}
                </div>
              )}
            </div>
          </div>
        )
      })}
      <div className="jtl-item jtl-current">
        <div className="jtl-dot jtl-dot-current" />
        <div className="jtl-content">
          <div className="jtl-name">You are here</div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create JourneyTimeline CSS**

Create `src/components/journey/JourneyTimeline.css`:

```css
.jtl-timeline { padding: 0 8px 8px; }

.jtl-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 8px 0;
  position: relative;
}

.jtl-item:not(:last-child)::after {
  content: '';
  position: absolute;
  left: 7px;
  top: 24px;
  bottom: -8px;
  width: 2px;
  background: rgba(94, 23, 235, 0.12);
}

.jtl-item.jtl-current::after { display: none; }

.jtl-dot {
  width: 16px; height: 16px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 2px;
  background: #5e17eb;
  opacity: 0.25;
}

.jtl-dot-current {
  opacity: 1;
  box-shadow: 0 0 0 4px rgba(94, 23, 235, 0.15);
}

.jtl-content { flex: 1; }

.jtl-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: #1a1a1a;
}

.jtl-item:not(.jtl-current) .jtl-name { opacity: 0.5; }

.jtl-detail {
  font-size: 0.75rem;
  color: rgba(0, 0, 0, 0.35);
  margin-top: 1px;
}
```

- [ ] **Step 4: Add "What's next" section to JourneyTab**

In `src/components/JourneyTab.jsx`, import JourneyTimeline and add it before the stage card. Then add the "What's next" section after the stage card.

At the top, add import:
```javascript
import JourneyTimeline from './journey/JourneyTimeline'
```

In the JSX, BEFORE the existing `jt-stage-card` div:
```jsx
<JourneyTimeline userId={userId} heroStage={heroStage} />
```

AFTER the `jt-stage-card` div, add the "What's next" requirement display. Use the HERO_STAGES array already defined in JourneyTab for the stage names. The requirements are:

```jsx
{/* What's Next */}
<div className="jt-next">
  {heroStage === 2 && (
    <a href="/life-paths" className="jt-next-card">
      <span className="jt-next-icon">🗺️</span>
      <div className="jt-next-body">
        <div className="jt-next-label">Next step</div>
        <div className="jt-next-text">Map your life paths to see what futures are possible</div>
      </div>
      <span className="jt-next-arrow">→</span>
    </a>
  )}
  {heroStage === 3 && (
    <a href="/essence-mirror" className="jt-next-card">
      <span className="jt-next-icon">🦸</span>
      <div className="jt-next-body">
        <div className="jt-next-label">Next step</div>
        <div className="jt-next-text">Discover your essence archetype and create your hero avatar</div>
      </div>
      <span className="jt-next-arrow">→</span>
    </a>
  )}
  {heroStage === 4 && (
    <div className="jt-next-card">
      <span className="jt-next-icon">🔥</span>
      <div className="jt-next-body">
        <div className="jt-next-label">Next step</div>
        <div className="jt-next-text">Do a courage challenge that makes you feel alive</div>
      </div>
    </div>
  )}
  {heroStage === 5 && (
    <div className="jt-next-card">
      <span className="jt-next-icon">💰</span>
      <div className="jt-next-body">
        <div className="jt-next-label">Next step</div>
        <div className="jt-next-text">Get a life path to Vibe Rise at Charging or Teaching depth</div>
      </div>
    </div>
  )}
  {heroStage === 6 && (
    <div className="jt-next-card">
      <span className="jt-next-icon">💚</span>
      <div className="jt-next-body">
        <div className="jt-next-label">Next step</div>
        <div className="jt-next-text">Keep exploring what blocks you. A pattern is emerging.</div>
        {dominant && <div className="jt-next-sub">{formatVoice(dominant[0])}: {dominant[1]} of 5</div>}
      </div>
    </div>
  )}
</div>
```

- [ ] **Step 5: Add "What's next" CSS to JourneyTab.css**

Append to `src/components/JourneyTab.css`:

```css
/* ── What's Next ── */
.jt-next { margin-top: 16px; }

.jt-next-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #fff;
  border-radius: 14px;
  padding: 14px 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  border-left: 3px solid #E9A23B;
  text-decoration: none;
  color: inherit;
}

.jt-next-icon { font-size: 1.3rem; flex-shrink: 0; }
.jt-next-body { flex: 1; }

.jt-next-label {
  font-size: 0.7rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.8px;
  color: #E9A23B; margin-bottom: 2px;
}

.jt-next-text {
  font-size: 0.85rem; color: #1a1a1a; line-height: 1.3;
}

.jt-next-sub {
  font-size: 0.75rem; color: rgba(94, 23, 235, 0.5);
  margin-top: 4px; font-weight: 600;
}

.jt-next-arrow {
  font-size: 1.2rem; color: #E9A23B; font-weight: 700; flex-shrink: 0;
}
```

- [ ] **Step 6: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 7: Commit**

```bash
git add src/components/journey/ src/components/JourneyTab.jsx src/components/JourneyTab.css
git commit -m "feat: JourneyTimeline sub-component + what's next requirements"
```

---

### Task 2: Move Onboarding + Zones + Completed from LevelTab to JourneyTab

**Files:**
- Create: `src/components/journey/JourneyOnboarding.jsx` + `.css`
- Create: `src/components/journey/JourneyZones.jsx` + `.css`
- Create: `src/components/journey/JourneyCompleted.jsx` + `.css`
- Modify: `src/components/JourneyTab.jsx` (import + render sub-components)
- Modify: `src/components/level/LevelTab.jsx` (remove sections + unused state)

**Interfaces:**
- Consumes: `userId` prop from JourneyTab. Each sub-component does its own data fetching (parallel `.then()` pattern, matching LevelTab's existing approach).
- Produces: Three self-contained sub-components that render on Journey tab.

**IMPORTANT: Read these files first before implementing:**
- `src/components/level/LevelTab.jsx` lines 158-365 (all data fetches)
- `src/components/level/LevelTab.jsx` lines 443-527 (onboarding section JSX)
- `src/components/level/LevelTab.jsx` lines 669-734 (zone assessments JSX)
- `src/components/level/LevelTab.jsx` lines 736-759 (completed section JSX)
- `src/components/level/DeepDiveCard.jsx` (used by onboarding + completed)
- `src/components/level/SweetSpotGraph.jsx` (used by zone modal)
- `src/components/level/LevelConfig.js` (LEVEL_CONFIG used by zones)
- `src/components/level/LevelTab.css` lines 282-354 (DeepDiveCard styles under `.level-tab`)

- [ ] **Step 1: Create JourneyOnboarding component**

Create `src/components/journey/JourneyOnboarding.jsx`. This component:
- Fetches its own data (curiosity map, life map, life paths, essence avatar, wahoos, play skills, healing completion checks)
- Copies the EXACT fetch patterns from LevelTab lines 183-345 (the individual `.then()` calls)
- Renders the EXACT same JSX as LevelTab lines 445-527
- Wraps DeepDiveCard usage in a div with `className="level-tab"` so the CSS scoping works
- Only renders if at least one item is incomplete

Key imports:
```javascript
import DeepDiveCard from '../level/DeepDiveCard'
import '../../components/level/LevelTab.css' // for level-deep-dive styles
```

The component must handle the sequential locking: Curiosity Map → Life Map → Life Paths (each locked until previous done). Copy the exact conditional logic from LevelTab lines 452-526.

Props: `{ userId }` only. All state is internal.

- [ ] **Step 2: Create JourneyOnboarding CSS**

Create `src/components/journey/JourneyOnboarding.css`. Minimal — most styles come from LevelTab.css via the `level-tab` wrapper. Only add the section header if needed:

```css
.jo-section {
  margin-top: 20px;
}

.jo-section-title {
  font-size: 1rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 12px;
}
```

- [ ] **Step 3: Create JourneyZones component**

Create `src/components/journey/JourneyZones.jsx`. This component:
- Fetches `user_level_progress` for all 8 levels (copy LevelTab lines 301-311)
- Renders the zone assessment horizontal scroll strip (copy LevelTab lines 669-688)
- Renders the zone modal with SweetSpotGraph (copy LevelTab lines 692-734)
- Imports `SweetSpotGraph` and `LEVEL_CONFIG`

Key imports:
```javascript
import SweetSpotGraph from '../level/SweetSpotGraph'
import { LEVEL_CONFIG } from '../level/LevelConfig'
```

Props: `{ userId }` only.

- [ ] **Step 4: Create JourneyZones CSS**

Create `src/components/journey/JourneyZones.css`:

```css
/* ── Zone Assessment Strip ── */
.jz-section { margin-top: 20px; }

.jz-title {
  font-size: 1rem; font-weight: 700;
  color: #1a1a1a; margin: 0 0 12px;
  text-align: center;
}

.jz-strip {
  display: flex; gap: 8px;
  overflow-x: auto; -webkit-overflow-scrolling: touch;
  padding: 4px 0;
}

.jz-card {
  flex-shrink: 0; padding: 10px 14px;
  border-radius: 12px; border: 1px solid rgba(0,0,0,0.08);
  background: white; cursor: pointer;
  font-family: inherit; text-align: center; min-width: 90px;
}

.jz-card.completed {
  border-color: rgba(94,23,235,0.15);
  background: rgba(94,23,235,0.03);
}

.jz-label { font-size: 0.75rem; font-weight: 600; color: #1a1a1a; }
.jz-check { font-size: 0.7rem; margin-top: 2px; }

/* ── Zone Modal ── */
.jz-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.4); z-index: 1000;
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
}

.jz-modal {
  background: white; border-radius: 20px; padding: 24px;
  max-width: 400px; width: 100%; max-height: 80vh;
  overflow-y: auto; position: relative;
}

.jz-modal-close {
  position: absolute; top: 12px; right: 16px;
  background: none; border: none; font-size: 1.2rem;
  cursor: pointer; color: rgba(0,0,0,0.3);
}

.jz-modal-title {
  font-size: 1.2rem; font-weight: 700;
  color: #1a1a1a; margin: 0 0 8px;
}

.jz-modal-question {
  font-size: 0.9rem; color: rgba(0,0,0,0.5);
  line-height: 1.4; margin: 0 0 14px; font-style: italic;
}

.jz-modal-result {
  background: rgba(94,23,235,0.04); border-radius: 12px;
  padding: 12px; margin-bottom: 14px;
}

.jz-modal-result-label {
  font-size: 0.7rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.5px;
  color: rgba(94,23,235,0.5); margin-bottom: 4px;
}

.jz-modal-result-name {
  font-size: 0.95rem; font-weight: 600; color: #1a1a1a;
}

.jz-modal-cta {
  display: block; text-align: center;
  padding: 12px; border-radius: 12px;
  background: linear-gradient(135deg, #5e17eb, #E9A23B);
  color: white; font-size: 0.9rem; font-weight: 600;
  text-decoration: none; margin-bottom: 10px;
}

.jz-modal-boss {
  font-size: 0.8rem; color: rgba(0,0,0,0.4);
  text-align: center; margin-top: 8px;
}

.jz-modal-boss-name { font-weight: 600; color: #5e17eb; }
```

- [ ] **Step 5: Create JourneyCompleted component**

Create `src/components/journey/JourneyCompleted.jsx`. This component:
- Fetches completed exercises (curiosity map, life map, life paths) using existence checks
- Fetches closed quests (`quests` where `status !== 'active'`)
- Renders completed DeepDiveCards + closed quest rows
- Wraps DeepDiveCard usage in `className="level-tab"` div

Copy the exact rendering from LevelTab lines 736-759.

Props: `{ userId }` only.

- [ ] **Step 6: Create JourneyCompleted CSS**

Create `src/components/journey/JourneyCompleted.css`:

```css
.jc-section { margin-top: 20px; opacity: 0.7; }

.jc-title {
  font-size: 1rem; font-weight: 700;
  color: #1a1a1a; margin: 0 0 12px; text-align: center;
}

.jc-quest {
  display: flex; align-items: center;
  gap: 10px; padding: 10px 0;
  border-bottom: 1px solid rgba(0,0,0,0.04);
}

.jc-quest:last-child { border-bottom: none; }
.jc-icon { font-size: 1rem; }
.jc-label { flex: 1; font-size: 0.85rem; color: #1a1a1a; }

.jc-status {
  font-size: 0.7rem; font-weight: 600;
  color: rgba(0,0,0,0.35);
  text-transform: uppercase; letter-spacing: 0.5px;
}
```

- [ ] **Step 7: Compose sub-components in JourneyTab**

In `src/components/JourneyTab.jsx`, add imports:
```javascript
import JourneyOnboarding from './journey/JourneyOnboarding'
import JourneyZones from './journey/JourneyZones'
import JourneyCompleted from './journey/JourneyCompleted'
```

In the JSX, add after the "What's next" section and before voice progress:
```jsx
<JourneyOnboarding userId={userId} />
```

After the life paths summary section:
```jsx
<JourneyZones userId={userId} />
```

Before stuck detection:
```jsx
<JourneyCompleted userId={userId} />
```

- [ ] **Step 8: Remove sections from LevelTab**

In `src/components/level/LevelTab.jsx`:

**Remove JSX blocks:**
1. "Your Journey" onboarding section (lines ~445-527) — the entire `{(!hasCuriosityMap || ...` block
2. "Life Path Progress button" (lines ~530-537) — now on Journey tab as Flow Map
3. "Zone Assessments" section + zone modal (lines ~669-734)
4. "Completed" section (lines ~736-759)

**State vars — definitive keep/remove list:**

The `levelQuests` array (lines 378-403) uses many boolean state vars for per-level progress tracking. This array STAYS (it powers the Quests tab's level progress). Therefore most "onboarding" booleans must also stay.

| State var | REMOVE? | Why |
|---|---|---|
| `allLevelProgress` | **YES REMOVE** | Only used by zone strip (lines 678, 694) — moved to JourneyZones |
| `zoneModalLevel` | **YES REMOVE** | Only used by zone modal (lines 692-716) — moved to JourneyZones |
| `hasCuriosityMap` | **NO KEEP** | Used by `levelQuests` completed section condition (line 737) AND... wait, that section is being removed. But NOT used by levelQuests array itself. Grep shows: lines 446, 453, 457, 737, 743 — ALL are in removed sections. **YES REMOVE** |
| `hasEssenceAvatar` | **NO KEEP** | Used by `levelQuests` array (lines 382, 390) + DeepDiveCard isCompleted (line 887) + extraQuests done check (line 893). These are level progress bars that STAY. |
| `hasLifeMap` | **NO KEEP** | Used by `levelQuests` array (line 383) + DeepDiveCard (line 887). Level progress bars STAY. |
| `hasWahoos` | **NO KEEP** | Used by `levelQuests` extraQuests (line 393) + unlock check (lines 487, 497). Lines 487, 497 are in the onboarding section being REMOVED, but line 393 is in levelQuests which STAYS. |
| `hasPlaySkills` | **NO KEEP** | Same as hasWahoos — used by levelQuests (line 393). |
| `hasHealingCompletion` | **NO KEEP** | Used by levelQuests extraQuests (line 394). STAYS. |
| `hasPlaylistCompletion` | **NO KEEP** | Used by levelQuests extraQuests (line 395). STAYS. |
| `hasCuriosityCompass` | **NO KEEP** | Used by levelQuests (lines 392, 393) + locking logic (line 903). STAYS. |
| `tuneDaysDone` | **NO KEEP** | Used by levelQuests (line 402). STAYS. |
| `courageDone` | **NO KEEP** | Used by levelQuests (line 395) + progress bars (lines 909, 919, 932, 1023). STAYS. |
| `healingDone` | **NO KEEP** | Used by levelQuests (line 396) + progress bars (lines 942, 952, 965). STAYS. |
| `hasPlaylistUpdate` | **NO KEEP** | Used by levelQuests extraQuests (line 901). STAYS. |

**Summary: Only 3 state vars can be removed from LevelTab:**
1. `allLevelProgress` + `setAllLevelProgress` (state + its `user_level_progress` all-levels fetch at lines 301-311)
2. `zoneModalLevel` + `setZoneModalLevel` (state only, no fetch)
3. `hasCuriosityMap` + `setHasCuriosityMap` (state + its `curiosity_clusters` fetch at lines 216-223)

**Everything else stays** because `levelQuests` (the per-level progress bar system) references it.

**Data fetches to remove** (only for the 3 removed state vars):
- Lines 216-223: `curiosity_clusters` existence check → `setHasCuriosityMap`
- Lines 301-311: `user_level_progress` all-levels fetch → `setAllLevelProgress`

**Data fetches to keep** (all others — they feed state vars used by levelQuests).

- [ ] **Step 9: Deploy and run backfill**

Deploy the backfill edge function:
```bash
npx supabase functions deploy backfill-hero-stages --project-ref qlwfcfypnoptsocdpxuv
```

Invoke it:
```bash
curl -X POST "https://qlwfcfypnoptsocdpxuv.supabase.co/functions/v1/backfill-hero-stages" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

Verify:
```sql
SELECT user_id, current_journey_level FROM user_stage_progress ORDER BY current_journey_level DESC;
```

- [ ] **Step 10: Verify build**

Run: `npm run build`
Expected: Build succeeds. No unused import warnings.

- [ ] **Step 11: Manual test**

Journey tab should show (top to bottom):
1. Completed stages timeline (if stage > 2)
2. Current stage card
3. "What's next" requirement card
4. "Getting Started" onboarding items (if any incomplete)
5. Voice progress dots (if stage 5-6)
6. Life Paths summary + Flow Map button
7. Zone Assessments horizontal strip
8. Completed section
9. Stuck detection

Quests tab should show (only):
1. Active Quests with task checklists
2. Add Quest form
3. "I need help with..." struggle pills

- [ ] **Step 12: Commit**

```bash
git add src/components/journey/ src/components/JourneyTab.jsx src/components/JourneyTab.css src/components/level/LevelTab.jsx
git commit -m "feat: move onboarding + zones + completed to Journey tab, clean LevelTab"
```

---

### Task 3: Orphaned Wahoo Prompts

**Files:**
- Modify: `src/components/JourneyTab.jsx` (add orphan detection + prompt)
- Modify: `src/components/JourneyTab.css` (orphan styles)

**Interfaces:**
- Consumes: `groan_challenges`, `quest_tasks` (two-step orphan detection query)
- Produces: Contextual prompt on Journey tab showing unlinked wahoos

- [ ] **Step 1: Add orphan detection to JourneyTab**

Add state:
```javascript
const [orphanedWahoos, setOrphanedWahoos] = useState([])
```

Add fetch inside the existing `.then(async ...)` block (or as a separate parallel `.then()` call):

```javascript
// Orphaned wahoos: completed but not linked to any quest
const completedRes = await supabase
  .from('groan_challenges')
  .select('id, title, challenge_text')
  .eq('user_id', userId)
  .eq('status', 'completed')
  .limit(50)

const linkedRes = await supabase
  .from('quest_tasks')
  .select('groan_challenge_id')
  .eq('user_id', userId)
  .not('groan_challenge_id', 'is', null)

const linkedIds = new Set((linkedRes.data || []).map(t => t.groan_challenge_id))
setOrphanedWahoos(
  (completedRes.data || []).filter(w => !linkedIds.has(w.id)).slice(0, 10)
)
```

- [ ] **Step 2: Render orphan prompt**

Add to JSX, after "What's next" section and before JourneyOnboarding:

```jsx
{orphanedWahoos.length > 0 && (
  <div className="jt-section jt-orphan-section">
    <h3 className="jt-section-title">Unlinked Courage Challenges</h3>
    <p className="jt-orphan-intro">
      You've done {orphanedWahoos.length} courage challenge{orphanedWahoos.length > 1 ? 's' : ''} not connected to a life path yet.
    </p>
    {orphanedWahoos.slice(0, 5).map(w => (
      <div key={w.id} className="jt-orphan-item">
        <span className="jt-orphan-icon">⚡</span>
        <span className="jt-orphan-text">{w.title || w.challenge_text}</span>
      </div>
    ))}
    {orphanedWahoos.length > 5 && (
      <div className="jt-orphan-more">+ {orphanedWahoos.length - 5} more</div>
    )}
    {lifePaths.length === 0 ? (
      <a href="/life-paths" className="jt-orphan-cta">Map Your Life Paths first →</a>
    ) : (
      <p className="jt-orphan-hint">Add quests on the Quests tab to link these.</p>
    )}
  </div>
)}
```

- [ ] **Step 3: Add orphan CSS**

Append to `src/components/JourneyTab.css`:

```css
/* ── Orphaned Wahoos ── */
.jt-orphan-section { border-left: 3px solid #E9A23B; }

.jt-orphan-intro {
  font-size: 0.85rem; color: rgba(0,0,0,0.5);
  line-height: 1.4; margin: 0 0 12px;
}

.jt-orphan-item {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 0; border-bottom: 1px solid rgba(0,0,0,0.04);
}

.jt-orphan-icon { font-size: 0.9rem; }
.jt-orphan-text { font-size: 0.85rem; color: #1a1a1a; }

.jt-orphan-more {
  font-size: 0.75rem; color: rgba(0,0,0,0.3);
  padding: 6px 0; font-style: italic;
}

.jt-orphan-hint {
  font-size: 0.8rem; color: rgba(0,0,0,0.4);
  margin: 12px 0 0; line-height: 1.4;
}

.jt-orphan-cta {
  display: block; text-align: center;
  padding: 10px; border-radius: 10px;
  background: rgba(233,162,59,0.08); color: #E9A23B;
  font-size: 0.85rem; font-weight: 600;
  text-decoration: none; margin-top: 12px;
}
```

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/components/JourneyTab.jsx src/components/JourneyTab.css
git commit -m "feat: Journey tab — orphaned wahoo prompt + life paths linking nudge"
```
