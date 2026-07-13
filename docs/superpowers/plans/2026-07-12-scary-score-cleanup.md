# Scary Score / Wahoo Score Cleanup Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove all references to `scary_score` and `wahoo_score` from the codebase. These fields are dead — post-wahoo feedback is now captured via NS state ("How did that feel?" = Vibe Rise/Fun/Pressure/Uninterested). The scores were a 1-10 rating that nobody uses.

**Architecture:** Single cleanup task. Remove display code, stop inserting/updating scores, leave DB columns (dropping them is a migration for zero benefit).

**Tech Stack:** React 18 + Supabase

## Global Constraints

- Do NOT drop `scary_score`, `wahoo_score`, `scary_score_after`, `wahoo_score_after` DB columns. They exist in the `groan_challenges` table and are referenced by old migrations + SQL reports. Leaving them as nullable columns with no new data is safe.
- Several of the files referencing these scores are for **dead/archived features** (GroanMatrix, checklistChallengeService, StrikeDesignFlow, FeedCard, LibraryOfAnswers). The cleanup can be aggressive here.

## Full Reference Map

| File | Line(s) | What it does | Status |
|---|---|---|---|
| `src/components/GroanCompletionModal.jsx` | 126 | Updates `scary_score` + `wahoo_score` after completion | **Dead** — post-wahoo now uses NS state classification |
| `src/components/GroanMatrix.jsx` | 531-537, 693-699 | Displays score pills on matrix cells | **Dead** — GroanMatrix removed from Challenge.jsx imports in Sprint 2 |
| `src/components/playlist/FeedCard.jsx` | 78-84 | Shows score pills on shared feed posts | **Dead feature** — playlist feed not actively used |
| `src/lib/playlistFeedService.js` | 67-68 | Inserts `null` scores on feed posts | Already null, just remove the fields |
| `src/lib/checklistChallengeService.js` | 142-143, 198-199 | Creates challenges with scores from old checklist system | **Dead** — checklist challenges archived |
| `src/flows/StrikeDesignFlow.jsx` | 223-224 | Creates challenges with scores from Strike Design flow | **Dead** — flow archived |
| `src/pages/LibraryOfAnswers.jsx` | 499 | SELECTs scores in query | **Dead feature** — Library page not actively used. Remove from SELECT |
| `src/lib/crm/groanChallengeService.js` | 129-130 | Inserts `scary_score` + `wahoo_score` in `createGroanChallenge` | **Active** — stop inserting (remove from insert object) |
| `src/lib/crm/groanChallengeService.js` | 187-188 | Updates `scary_score_after` + `wahoo_score_after` in `completeGroanChallenge` | **Active** — stop updating (remove from update object) |
| `src/lib/crm/groanChallengeService.js` | 243-244 | Updates scores in `updateChallengeScores` function | **Active** — entire function is dead if nobody calls it. Check callers. |
| `src/lib/crm/groanChallengeService.js` | 934-935 | Inserts scores in `createSkillProblemChallenge` | **Active** — stop inserting |

---

### Task 1: Remove All Scary/Wahoo Score References

**Files:**
- Modify: `src/lib/crm/groanChallengeService.js`
- Modify: `src/components/GroanCompletionModal.jsx`
- Modify: `src/components/GroanMatrix.jsx`
- Modify: `src/components/playlist/FeedCard.jsx`
- Modify: `src/lib/playlistFeedService.js`
- Modify: `src/lib/checklistChallengeService.js`
- Modify: `src/flows/StrikeDesignFlow.jsx`
- Modify: `src/pages/LibraryOfAnswers.jsx`

- [ ] **Step 1: groanChallengeService.js — stop inserting/updating scores**

In `createGroanChallenge` (line ~99), remove `scaryScore` and `wahooScore` from destructuring and from the insert object:

```javascript
// Remove from destructuring:
scaryScore = 5,
wahooScore = 5,

// Remove from .insert():
scary_score: scaryScore,
wahoo_score: wahooScore,
```

In `completeGroanChallenge` (line ~187), remove:
```javascript
// Remove from .update():
scary_score_after: scaryScoreAfter,
wahoo_score_after: wahooScoreAfter
```

Also remove `scaryScoreAfter` and `wahooScoreAfter` from the function's parameter destructuring.

In `updateChallengeScores` (line ~243), check if any callers exist. If none, delete the entire function. If callers exist, remove the score fields from the update.

In `createSkillProblemChallenge` (line ~934), remove:
```javascript
scary_score: scaryScore,
wahoo_score: wahooScore,
```

And remove from that function's parameter destructuring.

- [ ] **Step 2: GroanCompletionModal.jsx — remove score update**

Line 126: Remove the `.update({ scary_score: scores.scary, wahoo_score: scores.wahoo })` call entirely. If this is inside a function that does other things, keep the function but remove the score update line. If the entire block is just the score update, remove the block.

Also check: is there a UI step in the modal that ASKS the user for scary/wahoo scores? If yes, remove that step too. The modal should only have the NS state classification ("How did that feel?").

- [ ] **Step 3: GroanMatrix.jsx — remove score display**

Lines 531-537 and 693-699: Remove the score pills display blocks:
```jsx
// DELETE both instances of:
{!compact && challenge.scary_score && challenge.wahoo_score && (
  <div className="groan-cell-scores">
    <span className="groan-score scary">
      😰 {challenge.scary_score}
    </span>
    <span className="groan-score wahoo">
      🎉 {challenge.wahoo_score}
    </span>
  </div>
)}
```

Note: GroanMatrix is already dead code (removed from Challenge.jsx imports). This cleanup is for hygiene.

- [ ] **Step 4: FeedCard.jsx — remove score pills**

Lines 78-84: Remove the score display block:
```jsx
// DELETE:
{(post.scary_score != null || post.wahoo_score != null) && (
  <div className="pfc-scores">
    {post.scary_score != null && (
      <span className="pfc-score-pill">😰 {post.scary_score}/10</span>
    )}
    {post.wahoo_score != null && (
      <span className="pfc-score-pill">🤩 {post.wahoo_score}/10</span>
    )}
  </div>
)}
```

Note: FeedCard/playlist feed is a dead feature. This cleanup is for hygiene.

- [ ] **Step 5: playlistFeedService.js — remove null score fields**

Lines 67-68: Remove from the insert object:
```javascript
// DELETE:
scary_score: null,
wahoo_score: null,
```

- [ ] **Step 6: checklistChallengeService.js — remove score fields**

Lines 142-143 and 198-199: Remove from both insert objects:
```javascript
// DELETE both instances:
scary_score: scary,
wahoo_score: wahoo,
// and:
scary_score: 5,
wahoo_score: 5,
```

Also remove `scary` and `wahoo` from the function parameter destructuring if they exist.

Note: checklistChallengeService is dead code (archived feature). This cleanup is for hygiene.

- [ ] **Step 7: StrikeDesignFlow.jsx — remove score fields**

Lines 223-224: Remove from the insert/create call:
```javascript
// DELETE:
scary_score: scaryScore,
wahoo_score: wahooScore,
```

Remove `scaryScore` and `wahooScore` from any state or destructuring in this component.

Note: StrikeDesignFlow is dead code (archived feature). This cleanup is for hygiene.

- [ ] **Step 8: LibraryOfAnswers.jsx — remove from SELECT**

Line 499: Remove `scary_score, wahoo_score` from the select string:
```javascript
// BEFORE:
.select('id, title, source_label, visibility_layer, scary_score, wahoo_score, status, completed_at, created_at')

// AFTER:
.select('id, title, source_label, visibility_layer, status, completed_at, created_at')
```

Also search the component for any display of these fields and remove.

Note: LibraryOfAnswers is a dead feature. This cleanup is for hygiene.

- [ ] **Step 9: Verify build**

Run: `npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 10: Commit**

```bash
git add src/lib/crm/groanChallengeService.js src/components/GroanCompletionModal.jsx src/components/GroanMatrix.jsx src/components/playlist/FeedCard.jsx src/lib/playlistFeedService.js src/lib/checklistChallengeService.js src/flows/StrikeDesignFlow.jsx src/pages/LibraryOfAnswers.jsx
git commit -m "chore: remove dead scary_score + wahoo_score references (DB columns kept)"
```
