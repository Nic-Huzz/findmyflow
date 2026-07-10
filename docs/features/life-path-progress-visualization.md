# Life Path Progress Visualization

## Overview

Visual representation of courage + healing progress along life path quest lines. Each quest is a branch from the user's current position (trunk) to the destination state. Progress is shown as nodes along the path.

## Mockup

`public/life-path-progress-mockup.html` — standalone SVG mockup showing the design.

## How It Works

### Position Calculation

Both endpoints are data-driven from existing systems:

- **Trunk (YOU)**: `stateY(currentCareer.state)` from `lifePaths.js`. Left side, X ~40.
- **Destination**: `stateY(quest.predicted_state)`. Right side, X ~360.
- **Curvature**: Bezier curve via existing `branchPath()` function. Path going up = ambitious (Pressure → Vibe Rise). Path level = achievable (Fun → Fun).

### Nodes Along the Path

Placed at equal intervals using SVG `getPointAtLength()`:

1. **⚡ Courage nodes** (gold filled circles) — completed courage challenges. Each one moves the character marker forward.
2. **💚 Healing blocks** (red outlined rectangles) — active fears from healing_intentions. Show the fear text. Obstacle on the path.
3. **✓ Healed blocks** (green dashed circles) — completed healing intentions (outcome recorded). Obstacle dissolved, path clear.
4. **○ Future tasks** (empty circles) — uncompleted quest_tasks. Not yet reached.
5. **● Character marker** (white pulsing dot) — current position on the path. Advances as tasks complete.

### Cone of Safety

Existing cone geometry from LifePathMap. Shows what feels reachable. Expands as:
- More courage challenges completed (expression grows)
- More healing blocks cleared (safety grows)
- Capacity Score increases

### Data Sources

All data already exists:

| Visual Element | Data Source |
|---|---|
| Quest label + state | `quests` table (label, predicted_state) |
| Trunk position | `life_path_sessions` (current_career, current_state) |
| Courage nodes | `quest_tasks` where `is_courage_challenge = true AND done = true` |
| Healing blocks | `healing_intentions` where `healing_stage = 'in_progress' OR 'recognised'` |
| Healed blocks | `healing_intentions` where `outcome IS NOT NULL` |
| Future tasks | `quest_tasks` where `done = false` |
| Character position | Fraction: completed_tasks / total_tasks along path |

### Color Mapping

Uses existing STATE_META colors:
- Vibe Rise paths: `#E9A23B` (gold)
- Fun paths: `#10b981` (green)
- Pressure paths: `#ef4444` (red)
- Uninterested paths: `#6b7280` (gray)

### Implementation Approach

1. Extend `LifePathMap.jsx` SVG engine (already handles branches, cone, trunk)
2. Add node rendering along paths using `getPointAtLength()`
3. Load quest_tasks + healing_intentions per quest
4. Render as a card at the top of the Quest tab (v2 visual anchor)
5. Tappable nodes: courage nodes show completion details, healing blocks open the healing flow

### Relationship to Existing Components

- `LifePathMap.jsx` — base SVG engine (careers, cone, states)
- `lifePaths.js` — position calculations, branchPath(), stateY()
- `QuestBoardCard.jsx` — quest data already loaded
- `HealingFlowModal.jsx` — opens when healing block is tapped

### What's New vs What Exists

| Component | Exists | New |
|---|---|---|
| SVG canvas + dark background | ✅ LifePathMap | — |
| Branch paths from trunk | ✅ branchPath() | — |
| Cone of safety | ✅ computeCone() | — |
| State bands + labels | ✅ LifePathMap | — |
| Trunk marker + pulse | ✅ LifePathMap | — |
| Courage nodes on paths | — | ✅ New |
| Healing blocks on paths | — | ✅ New |
| Character position marker | — | ✅ New |
| Progress fill (partial path) | — | ✅ New |
| Node labels | — | ✅ New |
