# Life Path Progress Tracker — Implementation Plan

## What We're Building

A visual progress tracker on the Quests tab showing life path quests as SVG paths with three line states:
1. **Coloured + solid** = courage challenge done AND feels safe (inside cone of safety)
2. **Grey + solid** = courage challenge done but doesn't feel safe yet (beyond cone)
3. **Dashed + ghost** = not done yet

Colour maps to safety states: red (Uninterested) → yellow (Pressure) → green (Fun) → purple/pink (Vibe Rise). The gradient maps to Y-position on the SVG, so a path climbing from Pressure to Vibe Rise naturally picks up all four colours.

Swipeable: slide 0 = all paths overview (with global cone), swipe right = individual quest focus with action cards.

The cone of safety is a **global geometric shape** — a triangle from the trunk that covers a Y-range. A steep path to Vibe Rise exits the cone early (ambitious, not yet safe). A shallow path to Fun stays inside longer (achievable, already feels safe). The SAME cone treats different paths differently based on ambition level. This is the core insight of the visualization.

## Phase 1: Data Model

### 1A. Add `safety_status` column to `quest_tasks`

**Migration:** `supabase/migrations/YYYYMMDD_add_quest_task_safety_status.sql`

```sql
alter table quest_tasks add column safety_status text;
-- Values: null (regular task, not a courage challenge)
--         'safe' (done + felt good + met/exceeded expectations)
--         'not_safe' (done + felt bad or worse than expected)
-- Only set on courage challenges after GroanCompletionModal completion.
```

No JSON parsing, no string joins. Clean, queryable, lives on the row where it belongs.

**Why not use the existing reflection_text JSON:** Fragile join via `play_list_challenge_{groan_id}` string concatenation. Requires parsing JSON per task. Can't query or filter server-side. A column is the right tool.

### 1B. Set `safety_status` during GroanCompletionModal completion

**File:** `src/components/GroanCompletionModal.jsx`

In `handleCompleteReflection()`, after step 5b (syncing quest_tasks done), add:

```js
// 5c. Set safety_status on linked quest_tasks
const isSafe = ['vibe', 'peace'].includes(wahooClassification)
  && ['better', 'expected'].includes(expectationResult)
try {
  await supabase
    .from('quest_tasks')
    .update({ safety_status: isSafe ? 'safe' : 'not_safe' })
    .eq('groan_challenge_id', challenge.id)
    .eq('user_id', userId)
} catch (e) {
  console.warn('Error setting safety status:', e)
}
```

## Phase 2: Prerequisites

### 2A. Gate quest creation behind life-paths completion

**File:** `src/components/level/LevelTab.jsx`

**Current state:** `hasLifePaths` is true if ANY `life_path_sessions` row exists — even incomplete ones.

**Changes:**
- Tighten the query (~line 258) to require completion:
  ```js
  .eq('step', 'complete')
  ```
- Extract `current_state` and `safety` (currently only `careers` and `current_career` are stored):
  ```js
  .select('id, careers, current_career, current_state, safety')
  ```
  Add state: `lifePathCurrentState`, `lifePathSafety`
- **Existing users with quests but no life-paths:** Show a soft prompt above quests: "Complete Life Paths to see your progress map" with a link to `/try/life-paths`. Don't block quest creation — they already have quests. Only hard-gate for users with zero quests.
- For users with zero quests AND no life-paths: show a locked card:
  ```jsx
  <div className="quest-locked-card">
    <p>Map your life paths first, then add quests along them</p>
    <a href="/try/life-paths">Start Life Paths →</a>
  </div>
  ```

### 2B. QuestBoardCard courage completion → GroanCompletionModal

**File:** `src/components/QuestBoardCard.jsx`

**Current state:** `toggleTask()` at line 120 directly updates `quest_tasks.done` and `groan_challenges.status`. No "How did that feel?" flow.

**Changes:**
- Add state: `const [groanModalChallenge, setGroanModalChallenge] = useState(null)`
- In `toggleTask()`, intercept courage completion (unchecked → checked):
  ```js
  if (!task.done && task.is_courage_challenge && task.groan_challenge_id) {
    const { data: gc } = await supabase
      .from('groan_challenges').select('*')
      .eq('id', task.groan_challenge_id).single()
    if (gc && gc.status !== 'completed') {
      setGroanModalChallenge(gc)
      return // modal handles DB updates + safety_status
    }
  }
  // ...existing toggle logic for non-courage tasks and un-completing
  ```
- Import and render `GroanCompletionModal`:
  ```jsx
  {groanModalChallenge && (
    <GroanCompletionModal
      challenge={groanModalChallenge}
      userId={userId}
      onComplete={() => { setGroanModalChallenge(null); onUpdate?.() }}
      onClose={() => setGroanModalChallenge(null)}
    />
  )}
  ```
- **Critical:** GroanCompletionModal already syncs `quest_tasks.done = true` AND now sets `safety_status`. Don't duplicate those updates in toggleTask.
- Un-checking a completed courage task: existing direct toggle, also clear safety_status:
  ```js
  if (!newDone && task.is_courage_challenge) {
    await supabase.from('quest_tasks')
      .update({ safety_status: null })
      .eq('id', task.id)
  }
  ```

## Phase 3: The Visualization Component

### 3A. New component: `QuestPathMap.jsx`

**Location:** `src/components/level/QuestPathMap.jsx`

**Why new, not extending LifePathMap:** Different layout (portrait card vs landscape tree), different data model (progress along paths vs career overview), different visual (three line states vs lit/parked). Shares geometry from `lifePaths.js`.

**Props:**
```js
QuestPathMap({
  quests,              // array from quests table
  questTasks,          // { questId: [tasks] } map
  healingIntentions,   // { taskId: healingIntention }
  trunkState,          // from life_path_sessions.current_state
  safety,              // 0-1 from life_path_sessions.safety
  careers,             // from life_path_sessions.careers (for global cone)
  onTaskTap,           // callback(task)
  onClose,
})
```

Note: no `safetyData` prop. `safety_status` lives directly on `quest_tasks` rows, already in `questTasks`.

**Structure (swipeable slides):**
- CSS `scroll-snap-type: x mandatory` container
- Slide 0: All paths overview with **global cone** from `computeCone(careers, safety)`
- Slides 1-N: Individual quest focus (zoomed path, milestones, progress bar, action cards)
- Dot indicators synced to scroll position

### 3B. Path rendering with `getPointAtLength()`

**Why not De Casteljau:** Bezier parameter `t` does NOT equal arc-length fraction. `t=0.5` is not the halfway point along the curve. For accurate milestone placement and segment splitting, `getPointAtLength()` is simpler and correct.

**Approach:** Render a hidden reference `<path>` per quest, use refs + useEffect:

```js
const pathRef = useRef(null)
const [pathPoints, setPathPoints] = useState(null)

useEffect(() => {
  if (!pathRef.current) return
  const path = pathRef.current
  const totalLen = path.getTotalLength()
  const tasks = questTasks[quest.id] || []
  const n = tasks.length

  // Place each task at equal intervals along the path
  const points = tasks.map((task, i) => {
    const frac = n > 1 ? i / (n - 1) : 0.5
    const pt = path.getPointAtLength(frac * totalLen)
    return { x: pt.x, y: pt.y, task }
  })

  // Character marker at the last completed task's position
  const lastDoneIdx = tasks.reduce((acc, t, i) => t.done ? i : acc, -1)
  const charFrac = lastDoneIdx >= 0 && n > 1 ? lastDoneIdx / (n - 1) : 0
  const charPt = path.getPointAtLength(charFrac * totalLen)

  setPathPoints({ points, charPt, totalLen })
}, [quest.id, questTasks])
```

**Three line segments via `stroke-dashoffset` trick:**

Instead of splitting the path into sub-paths (complex), render the SAME path three times with different `stroke-dasharray` + `stroke-dashoffset` to show different portions:

```jsx
{/* 1. Ghost — full path */}
<path d={pathD} stroke="rgba(255,255,255,0.04)" strokeDasharray="5,12" />

{/* 2. Done but not safe — from safe end to character */}
<path d={pathD} stroke="rgba(255,255,255,0.13)" strokeWidth={3}
      strokeDasharray={`${doneLen} ${totalLen}`}
      strokeDashoffset={0} />

{/* 3. Safe — from trunk to safe end */}
<path d={pathD} stroke="url(#safeGrad)" strokeWidth={3.5}
      strokeDasharray={`${safeLen} ${totalLen}`}
      strokeDashoffset={0} />
```

The safe line renders on top, covering the grey line up to the safe point. The grey line extends further to the character. The ghost shows everything beyond.

### 3C. Cone of safety (global, geometric)

**On the overview slide:** Use the existing `computeCone(careers, safety)` from lifePaths.js. Render as a subtle triangle from the trunk. The coloured portion of EACH path stops where it exits the cone — ambitious paths (steep climb to Vibe Rise) leave the cone early, achievable paths (to Fun) stay inside longer.

**Determining where a path intersects the cone:**
```js
const cone = computeCone(careers, safety)

// For each milestone point along the path:
const isPointSafe = (pt) => pt.y >= cone.topY && pt.y <= cone.botY

// The safe portion of the path = the section inside the cone
// Walk the points to find where the path exits the cone
```

**On focus slides:** Show the cone as a subtle background, but safety_status on individual tasks determines the coloured vs grey distinction (per the GroanCompletionModal data). The cone provides context for WHY some tasks aren't safe yet.

### 3D. Progress fractions

```js
const tasks = questTasks[quest.id] || []
const courageTasks = tasks.filter(t => t.is_courage_challenge)
const doneTasks = tasks.filter(t => t.done)
const safeCourageTasks = courageTasks.filter(t => t.safety_status === 'safe')
const unsafeCourageTasks = courageTasks.filter(t => t.safety_status === 'not_safe')

// Line extends for ALL done tasks
const doneFraction = tasks.length > 0 ? doneTasks.length / tasks.length : 0

// Colour only comes from safe courage challenges
// Regular done tasks don't contribute to the coloured portion
const safeFraction = courageTasks.length > 0
  ? safeCourageTasks.length / tasks.length  // as fraction of TOTAL tasks for path position
  : 0
```

Regular tasks advance the grey line (they're done). Only courage challenges that felt safe light up the colour. This means a quest with 10 regular tasks and 0 courage tasks has a full grey line and zero colour — "you did the work but haven't pushed your safety boundary."

### 3E. Milestone rendering

For each task point along the path:

| Task state | Visual |
|---|---|
| `done && safety_status === 'safe'` | Coloured fill (state colour at that Y position) |
| `done && safety_status === 'not_safe'` | Grey fill `rgba(255,255,255,0.15)` |
| `done && !is_courage_challenge` | Small coloured dot (safe by default, not scary) |
| `!done` | Empty outline `stroke="rgba(255,255,255,0.08)"` |
| Has active `healing_intention` | Red gap/pill with fear text |
| Has healed `healing_intention` | Green dashed circle, struck-through text |

### 3F. Focus slide footer

Below each quest's SVG:

1. **Dual progress bar:**
   - Grey fill = % tasks done
   - Coloured gradient fill = % safe (courage tasks with safety_status = 'safe')
   - Labels: "X% done" / "Y% safe"

2. **Next courage step card** (gold border):
   - First `quest_task` where `done = false AND is_courage_challenge = true`
   - Tappable → could open task in QuestBoardCard or create the courage challenge

3. **Fear blocking your path card** (red border):
   - First `healing_intention` with `healing_stage != null AND outcome IS NULL`
   - Tappable → opens HealingFlowModal

4. **Expand your safety card** (green border):
   - Only shows when `unsafeCourageTasks.length > 0`
   - "N tasks done but don't feel safe yet — complete healing flows to light them up"
   - Tappable → opens relevant healing flow

### 3G. Colour gradient

```jsx
<linearGradient id="safeGrad" x1="0" y1="1" x2="0.8" y2="0">
  <stop offset="0%" stopColor="#ef4444"/>    {/* Uninterested = red */}
  <stop offset="35%" stopColor="#f59e0b"/>   {/* Pressure = yellow */}
  <stop offset="65%" stopColor="#10b981"/>   {/* Fun = green */}
  <stop offset="100%" stopColor="#c084fc"/>  {/* Vibe Rise = purple/pink */}
</linearGradient>
```

This maps to Y position on the SVG canvas, not task index. Keeps STATE_META colours unchanged for labels/bands. The gradient is only for the progress line.

## Phase 4: Integration

### 4A. Button at top of Quests tab

**File:** `src/components/level/LevelTab.jsx`

**Placement:** Between "Your Journey" section and "Active Quests" header (~line 476).

**Render when:** `hasLifePaths && quests.length > 0`

```jsx
<button className="quest-path-btn" onClick={() => setShowPathMap(true)}>
  <span className="quest-path-btn-icon">✦</span>
  <span>Your Life Paths</span>
  <span className="quest-path-btn-arrow">→</span>
</button>
```

### 4B. Full-screen modal overlay

```jsx
{showPathMap && (
  <div className="quest-path-overlay">
    <QuestPathMap
      quests={quests}
      questTasks={questTasks}
      trunkState={lifePathCurrentState}
      safety={lifePathSafety}
      careers={lifePathCareers}
      onClose={() => setShowPathMap(false)}
    />
  </div>
)}
```

Dark background, full viewport height, close button top-right.

### 4C. Data already available in LevelTab

- `quests` and `questTasks` — already loaded
- `lifePathCareers` — already loaded, add `current_state` and `safety` to the query
- `healing_intentions` — loaded per-quest in QuestBoardCard, but QuestPathMap needs them all at once. Load in QuestPathMap's own useEffect.
- `safety_status` — on quest_tasks rows, already in `questTasks`

## Build Sequence

| # | Task | Files | Deps | Effort |
|---|------|-------|------|--------|
| 1 | Migration: add safety_status column | migration SQL | None | Small |
| 2 | Set safety_status in GroanCompletionModal | GroanCompletionModal.jsx | Migration | Small |
| 3 | Courage completion → modal in QuestBoardCard | QuestBoardCard.jsx | None | Small |
| 4 | Gate quests behind life-paths | LevelTab.jsx | None | Small |
| 5 | QuestPathMap component + CSS | New files | lifePaths.js | Large |
| 6 | Wire into LevelTab | LevelTab.jsx | QuestPathMap | Small |

Steps 1-4 are small and independent. Step 5 is the bulk. Step 6 wires it together.

## Data Flow

```
life_path_sessions (email, step='complete')
  → current_state → trunk Y position
  → safety → global cone width
  → careers → cone computation via computeCone()

quests (user_id, status='active')
  → predicted_state → destination Y position
  → label → path name

quest_tasks (quest_id)
  → done → grey line extends
  → is_courage_challenge → determines if task affects colour
  → safety_status → 'safe' = coloured, 'not_safe' = grey, null = regular task
  → groan_challenge_id → links to courage challenge

healing_intentions (quest_task_id)
  → healing_stage → active block (red gap on path)
  → outcome → healed (green dashed circle)
```

## Resolved Decisions

1. **Cone is global geometry**, not per-path fraction. `computeCone(careers, safety)` gives the triangle. Different paths intersect it differently based on their angle/ambition. Overview slide shows this.

2. **Regular tasks don't affect colour.** They advance the grey line. Only courage challenges with `safety_status = 'safe'` light up the coloured portion. This prevents inflated visuals from non-scary tasks.

3. **`safety_status` column** on `quest_tasks` instead of parsing JSON from quest_completions. Clean, queryable, set during GroanCompletionModal flow.

4. **`getPointAtLength()` with refs** instead of De Casteljau bezier splitting. Simpler, arc-length accurate.

5. **Existing users soft-prompted**, not hard-gated. Show "Complete Life Paths to see your progress map" above existing quests. Only hard-gate adding NEW quests for users with zero quests.

6. **`stroke-dasharray` trick** for three line segments — render the same path three times with different dash patterns instead of computing sub-paths. Simpler, no path splitting needed.

7. **Gradient colours** (red→yellow→green→purple) are for the progress line only. Existing STATE_META colours unchanged for labels/bands.
