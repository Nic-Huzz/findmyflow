# Quest Map Refactor Brief

## Goal

Clean up QuestPathMap and its data pipeline. The visual is now correct (depth Y axis, flow lines, merge curves, avatar). The code is fragile. Make it architecturally strong without changing the visual.

## Current Problems

### 1. Depth enrichment duplicated in 3 places
`groan_challenges.depth_level` is fetched and merged into quest_tasks separately in:
- `src/components/JourneyTab.jsx` (batch 2 query)
- `src/pages/QuestMapPage.jsx` (loadData)
- `src/components/level/QuestPathMap.jsx` (cross_pollination fetch)

Each does the same pattern: fetch quest_tasks, fetch groan_challenges by ID, merge depth_level. If one changes, the others silently diverge.

### 2. No shared data hook
QuestMapPage and JourneyTab both load quests + tasks + life_path_sessions + cross_pollination independently. Should be one `useQuestMapData(userId)` hook.

### 3. OverviewSVG does too much
Single function handles: lane offset computation, depth band layout, dot positioning, flow line rendering, merge curve rendering, avatar placement, label rendering. ~200 lines of mixed data + rendering logic.

### 4. Dead/unused props
`crossPollination` is passed through multiple layers but the shape keeps changing. `onDotTap` exists but does nothing in overview. `trunkState` and `light` are passed but unused in the new depth-based overview.

### 5. No FK between quest_tasks.groan_challenge_id and groan_challenges.id
The Supabase JS client can't join these tables. Every consumer does a separate query. Adding the FK would allow `select('*, groan_challenges(depth_level)')` everywhere.

## Proposed Architecture

### New hook: `useQuestMapData(userId)`
Location: `src/hooks/useQuestMapData.js`

Returns: `{ quests, questTasks, crossPollination, heroAvatarUrl, trunkState, safety, careers, loading }`

Responsibilities:
- Fetch all quests (not just active, exclude Healing Work + archived)
- Fetch quest_tasks with depth_level enriched from groan_challenges
- Fetch cross_pollination with merge_depth enriched from groan_challenges
- Fetch life_path_sessions (trunk state, safety, careers)
- Fetch hero avatar URL
- Single loading state

Consumers: JourneyTab (for Flow Map overlay), QuestMapPage (standalone route), LevelTab (if needed).

### Extract sub-components from OverviewSVG

| Component | Responsibility |
|---|---|
| `OverviewSVG` | Grid layout (state columns, depth rows, labels) |
| `QuestFlowLine` | Single quest: line + dots + position marker + avatar |
| `MergeCurve` | Single merge: bezier from source to target challenge |

### Migration: Add FK constraint
```sql
ALTER TABLE quest_tasks
ADD CONSTRAINT fk_quest_tasks_groan_challenge
FOREIGN KEY (groan_challenge_id) REFERENCES groan_challenges(id);
```

This enables `select('*, groan_challenges(depth_level)')` and eliminates the separate depth query.

### Clean up props
- Remove `onDotTap` from OverviewSVG (unused)
- Remove `trunkState`, `light` from OverviewSVG (unused in depth-based view)
- Keep them on FocusSVG (per-quest detail slides still use them)

## Files to modify
- Create: `src/hooks/useQuestMapData.js`
- Modify: `src/components/level/QuestPathMap.jsx` (extract sub-components, clean props)
- Modify: `src/components/JourneyTab.jsx` (use hook instead of inline fetch)
- Modify: `src/pages/QuestMapPage.jsx` (use hook instead of inline fetch)
- Create: Supabase migration for FK constraint

## What NOT to change
- The visual output (dot sizes, colors, line styles, merge curve shape, avatar placement)
- FocusSVG (per-quest detail slides, time-based Y axis)
- The depth data in groan_challenges (already backfilled)

## Success criteria
- Same visual, fewer lines of code
- One source of truth for quest map data
- Adding a new data field (e.g. per-task depth) requires changes in 1 file not 3
- Build passes, no runtime regressions
