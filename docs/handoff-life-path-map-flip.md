# Handoff: Flip LifePathMap to Vertical Orientation

## What needs to happen

Flip `src/components/LifePathMap/LifePathMap.jsx` to vertical orientation matching `src/components/level/QuestPathMap.jsx`.

**Current (LifePathMap):** Horizontal. Trunk on the left, career endpoints on the right. States spread vertically (Vibe Rise top, Shutdown bottom).

**Target (match QuestPathMap):** Vertical. States spread left-to-right (Shutdown → Pressure → Fun → Vibe Rise). Time/progress flows top-to-bottom.

## Why

The Life Paths exercise (`/life-paths`) is the starting point. Its output feeds the QuestPathMap in the Quests tab. If the orientations don't match, the user sees their paths horizontal in the exercise then vertical in their daily view. Confusing.

QuestPathMap is the one they live with daily, so Life Paths should match it.

## Reference

- `src/components/level/QuestPathMap.jsx` — the target orientation (vertical, states left-to-right)
- `src/components/level/QuestPathMap.css` — styling reference
- QuestPathMap constants (lines 39-51): `OV_W=420`, `OV_H=800`, STATE_ZONES with center X positions for each state

## What NOT to change

- The `careers[]` data shape stays the same: `{ id, label, predictedState, livedState, enteredInSpring }`
- The flow logic in `LifePathWidgetTest.jsx` and `TryLifePaths.jsx` — untouched
- The AI suggestions screen just added — it writes to `careers[]`, doesn't touch the map
- The cone of safety concept — just rendered differently (vertical bands instead of horizontal)

## Data flow

```
Life Paths flow (LifePathWidgetTest.jsx)
  → produces careers[] with predictedState
    → LifePathMap.jsx renders them (THIS is what needs flipping)
      → same data later appears in QuestPathMap.jsx (already vertical)
```
