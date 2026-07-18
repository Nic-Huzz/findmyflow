# Fix: Quest path lines should always start from the bottom (L0)

*Created: July 18 2026. Priority: Low — visual improvement, not a blocker.*

## What's happening

On the QuestPathMap (`/quest-map`), each life path is drawn as a vertical line from the lowest depth task to the highest. If a quest only has data at L3 (charging), the line starts at L3 and goes nowhere — it looks like the path appeared from thin air.

## What it should do

Lines should always start from the bottom (L0) regardless of where the data begins. The assumption: the user started their journey before the app. They were at L0-L2 before they started tracking. The line should reflect that history.

## The fix

**File:** `src/components/level/QuestPathMap.jsx`

**Line 450-451** (the vertical line for each quest):

```diff
- <line x1={x} y1={firstY + 4} x2={x} y2={lastY - 4}
+ <line x1={x} y1={firstY + 4} x2={x} y2={OV_BOTTOM}
    stroke={colour} strokeWidth="2.5" strokeLinecap="round" opacity="0.4" />
```

`OV_BOTTOM` is already defined at line 44: `const OV_BOTTOM = OV_H - 100` (900 - 100 = 800). This is the Y position of L0 on the chart.

**What this does:** The line always extends down to L0 (bottom of the chart). The dots still appear at their actual depth levels. The line just shows the full journey from L0 to wherever the user is now.

**Edge case:** If a quest has NO tasks/challenges at all (like "Dance Event Hosts" which has 0 quest_tasks), the line has no `firstY`. Check how `firstY` is set — if it's undefined when there are no positioned dots, the line shouldn't render at all. The existing `positioned.length` check likely handles this.

## Context

- `OV_TOP` = 60 (top of chart, L4 position)
- `OV_BOTTOM` = 800 (bottom of chart, L0 position)
- `depthY(d)` function at line 55-58 maps depth level to Y coordinate
- Quests get their X position from state columns (shutdown → vibe rise, left → right)
- The line is drawn BEHIND the dots (rendered first in the `<g>` group)

## One line change. Build passes. No dependencies.
