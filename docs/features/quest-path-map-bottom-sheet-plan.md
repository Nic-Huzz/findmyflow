# QuestPathMap Bottom Sheet — Implementation Plan

## What We're Building

Tappable courage (⚡) and healing (💚) icons on the life path map that open a bottom sheet with full context. One tap, all the details.

## Bottom Sheet Content

### For completed courage challenges (⚡):
- Task name + quest label
- Date completed
- "How did it feel?" (Vibe Rise / Fun / Pressure / Uninterested)
- "Did it go?" (Better / As expected / Worse than expected)
- Identity statement ("Now that I ___, I've proven I'm someone who...")
- Cross-pollination tags ("Also fed: Breathwork")

### For healing-identified tasks (💚):
- Task name + quest label
- Pattern (what's scary)
- Fear text + origin
- Healing stage badge (in_progress / recognised / released)
- Outcome (if completed: Yes / No / Something better)
- CTA: "Continue healing flow" → opens HealingFlowModal

## Data Sources

| Field | Source | Join path |
|---|---|---|
| wahoo_classification | quest_completions.reflection_text JSON | quest_id = 'play_list_challenge_{groan_challenge_id}' |
| expectation_result | quest_completions.reflection_text JSON | same as above |
| identity_statement | quest_completions.reflection_text JSON | same as above |
| cross_pollination | quest_cross_pollination table | source_quest_id or target_quest_id |
| healing pattern/fear | healing_intentions table | quest_task_id |
| healing stage/outcome | healing_intentions table | quest_task_id |

## Build Sequence

### 1. Bottom sheet component
**New file:** `src/components/level/QuestTaskSheet.jsx` + `.css`

Slides up from bottom, dark overlay, close on backdrop tap or swipe down. Uses brand-aligned styling:
- Light background (#fff), rounded top corners (20px)
- Brand gradient accent line at top (purple → gold, 3px)
- Task name as heading (Inter 700, #1a1a2e)
- State pills using existing challenge state colours
- Identity statement in italic
- Cross-pollination tags as small coloured pills
- Healing stage as a progress indicator (3 dots: in_progress → recognised → released)
- CTAs use `.primary-button` from flow-base.css

**Design constraints (from CLAUDE.md):**
- Light theme only (#f5f5f0 or white backgrounds)
- Brand colours: purple #5e17eb, gold #E9A23B
- No em dashes in copy
- CSS scoped to `.qts-` prefix
- Copy readable by a 12-year-old
- Use existing component styles from flow-base.css where possible

### 2. Data fetching on tap
**In QuestPathMap.jsx:**

When a dot is tapped, fetch the completion data:
```js
const [sheetTask, setSheetTask] = useState(null)
const [sheetData, setSheetData] = useState(null)

async function onDotTap(task) {
  setSheetTask(task)
  // Fetch courage completion data
  if (task.groan_challenge_id) {
    const { data } = await supabase.from('quest_completions')
      .select('reflection_text')
      .eq('quest_id', `play_list_challenge_${task.groan_challenge_id}`)
      .maybeSingle()
    if (data?.reflection_text) {
      setSheetData(JSON.parse(data.reflection_text))
    }
  }
  // Healing data already in healingIntentions state
}
```

### 3. Wire tap handlers to SVG icons
**In VerticalQuestLine + FocusSVG:**

Add `onClick` + `cursor: pointer` to ⚡ and 💚 elements:
```jsx
<text ... onClick={() => onDotTap(task)} style={{ cursor: 'pointer' }}>⚡</text>
```

Pass `onDotTap` through: QuestPathMap → OverviewSVG → VerticalQuestLine, and QuestPathMap → FocusSVG.

### 4. Render the sheet
**In QuestPathMap.jsx:**

```jsx
{sheetTask && (
  <QuestTaskSheet
    task={sheetTask}
    quest={activeQuests.find(q => (questTasks[q.id] || []).some(t => t.id === sheetTask.id))}
    completionData={sheetData}
    healingIntention={healingIntentions[sheetTask.id]}
    crossPollination={crossPollination.filter(cp => cp.groan_challenge_id === sheetTask.groan_challenge_id)}
    onClose={() => { setSheetTask(null); setSheetData(null) }}
    onHealingFlow={() => { /* open HealingFlowModal */ }}
  />
)}
```

## Component Structure

```
QuestTaskSheet
├── Backdrop (dark overlay, tap to close)
├── Sheet container (slides up)
│   ├── Drag handle (small grey bar)
│   ├── Brand gradient accent line
│   ├── Task name heading
│   ├── Quest label + date
│   │
│   ├── IF courage challenge:
│   │   ├── "How did it feel?" state pill
│   │   ├── "Did it go?" result pill
│   │   ├── Identity statement (italic)
│   │   └── Cross-pollination tags
│   │
│   ├── IF healing identified:
│   │   ├── Pattern text
│   │   ├── Fear text
│   │   ├── Healing stage indicator
│   │   ├── Outcome (if completed)
│   │   └── "Continue healing flow" CTA
│   │
│   └── Close button
```

## CSS Approach

Use existing app patterns:
- `.qts-overlay` — fixed overlay (same pattern as `.gcm-overlay` in GroanCompletionModal)
- `.qts-sheet` — white card sliding from bottom (same as modal pattern but anchored to bottom)
- State pills reuse `.gcm-wahoo-btn` styling
- CTA buttons reuse `.primary-button` from flow-base.css
- Scoped under `.qts-` prefix per CLAUDE.md convention

## Files Changed

| File | Change |
|---|---|
| `src/components/level/QuestTaskSheet.jsx` | NEW — bottom sheet component |
| `src/components/level/QuestTaskSheet.css` | NEW — scoped styles |
| `src/components/level/QuestPathMap.jsx` | Add tap handlers, sheet state, data fetching |

## Dependencies
- No new tables or migrations
- No new edge functions
- Uses existing data (quest_completions, healing_intentions, quest_cross_pollination)
- Uses existing components (HealingFlowModal for CTA)
