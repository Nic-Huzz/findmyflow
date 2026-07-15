# Dead Code Removal: GroanMatrix Inline Completion

**Created:** 2026-07-12
**Branch:** `light-portal`
**Risk:** Low — the code is unreachable. GroanMatrix is imported but never rendered.

---

## What to Remove

`src/Challenge.jsx` contains a legacy inline groan challenge completion flow that is completely dead. The `GroanMatrix` component is imported (line 32) but never rendered in the JSX. All associated state, handlers, and the inline modal JSX are orphaned.

### State Variables to Remove (all in Challenge.jsx)

| Line | Variable | Why Dead |
|---|---|---|
| ~360 | `selectedGroanChallenge` / `setSelectedGroanChallenge` | Only set by `handleMatrixCellClick` which is only called by GroanMatrix (never rendered) |
| ~375 | `groanReflectionStep` / `setGroanReflectionStep` | Only used by the inline modal |
| ~376 | `groanReflection` / `setGroanReflection` | Only used by the inline modal |
| ~377 | `groanMatrixKey` / `setGroanMatrixKey` | Only passed to GroanMatrix (never rendered) |
| ~378 | `customChallengeText` / `setCustomChallengeText` | Only used by the inline modal popup |
| ~379 | `threePercentText` / `setThreePercentText` | Only used by the inline modal popup |
| ~380 | `groanCellContext` / `setGroanCellContext` | Only set by handleMatrixCellClick |
| ~374 | `groanChallengeLoading` / `setGroanChallengeLoading` | Only used by inline handlers |

### Functions to Remove

| Line | Function | Why Dead |
|---|---|---|
| ~1309 | `handleMatrixCellClick` | Called by GroanMatrix (never rendered) |
| ~1330 | `getEnrichedCellContext` | Called by handleGenerateFromPopup (dead) |
| ~1356 | `handleGenerateFromPopup` | Called from inline modal (dead) |
| ~1389 | Handler for custom challenge creation | Called from inline modal (dead) |
| ~1478 | `handleStartCompletion` | Called from inline modal "I Did It" button (dead) |
| ~1484 | `handleCompleteGroanChallenge` | The old flat-7-RP completion path. Dead. |
| ~1584 | `handleRegenerateChallenge` | Called from inline modal (dead) |
| ~1640 | `closeGroanModal` | Closes the dead inline modal |

### JSX Block to Remove

Lines ~2090-2419: The entire conditional render block starting with:
```jsx
{(selectedGroanChallenge || groanCellContext) && (
  <div className="groan-modal-overlay" ...>
```
This is a ~330 line inline modal that is never shown because `selectedGroanChallenge` and `groanCellContext` are never set (their setter is only called from dead functions).

### Import to Remove

Line 32:
```javascript
import GroanMatrix from './components/GroanMatrix'
```

### useEffect to Update

Lines ~390-395: The modal-active body class effect references `selectedGroanChallenge` and `groanCellContext`. Remove those from the dependency:
```javascript
// Current:
if (healingModalQuest || selectedGroanChallenge || groanCellContext) {
// Change to:
if (healingModalQuest) {
```

### CSS to Remove (from Challenge.css)

All selectors starting with `.groan-modal`, `.groan-btn`, `.groan-popup`, `.groan-reflection`, `.groan-custom`, `.groan-cell`. These classes are only used by the dead inline modal.

Search `src/Challenge.css` for these prefixes and remove the matching rules.

### Removal Order (IMPORTANT — follow this sequence or intermediate builds will fail)

1. Remove the JSX block first (lines ~2090-2419, the `selectedGroanChallenge || groanCellContext` conditional render)
2. Remove the functions (`handleMatrixCellClick`, `getEnrichedCellContext`, `handleGenerateFromPopup`, custom challenge handler, `handleStartCompletion`, `handleCompleteGroanChallenge`, `handleRegenerateChallenge`, `closeGroanModal`)
3. Remove the state variables (`selectedGroanChallenge`, `groanReflectionStep`, `groanReflection`, `groanMatrixKey`, `customChallengeText`, `threePercentText`, `groanCellContext`, `groanChallengeLoading`)
4. Update the `useEffect` modal-active guard (remove `selectedGroanChallenge` and `groanCellContext` from condition)
5. Remove the `import GroanMatrix from './components/GroanMatrix'` line
6. Remove dead CSS from `Challenge.css` (`.groan-modal-*`, `.groan-btn-*`, `.groan-popup-*`, `.groan-reflection-*` selectors)
7. Build check after each major step

### What NOT to Remove

- `src/components/GroanMatrix.jsx` — **still used!** Has its own route at `/groan-matrix` in `AppRouter.jsx` (line 848-852). Also lazy-imported and CSS preloaded in AppRouter. Only the import in Challenge.jsx is dead.
- `src/components/GroanMatrix.css` — loaded by AppRouter.jsx (line 353). Not dead.
- `src/components/GroanCompletionModal.jsx` — this is the LIVE completion path. Do not touch.
- `src/components/GroanReflectionInput.jsx` — used by `QuestCard.jsx`. Not dead.
- Any `groan_challenges` database tables or service functions — used by the live GroanCompletionModal path.
- The `/groan-matrix` route in AppRouter.jsx — still a valid page.

---

## Verification

After removal:

1. `npm run build` must pass
2. Grep for any remaining references to removed functions/state: `grep -n "groanMatrixKey\|handleMatrixCellClick\|handleCompleteGroanChallenge\|handleStartCompletion\|groanReflectionStep\|groanCellContext\|closeGroanModal\|customChallengeText\|threePercentText\|handleGenerateFromPopup\|handleRegenerateChallenge" src/Challenge.jsx` should return 0 results
3. The `/7-day-challenge` page should load and function identically (all 4 tabs, wahoo completion via QuestBoardCard/PlayListTab still works)
4. Challenge.jsx file size should decrease by ~400-500 lines

---

## Expected Impact

Challenge.jsx is currently 2,524 lines. This removal should bring it down to ~2,100 lines. The file will be cleaner, easier to navigate, and the dead GroanMatrix dependency is eliminated.
