# Play-list Matrix Updates — 28 Feb 2026

## UI Changes

### Heading cleanup
- Removed duplicate "Courage Matrix" outer heading from `PlayListTab.jsx`
- "Play-list Matrix" heading (inside `GroanMatrix.jsx`) is now the only heading, with Explainer button inline
- Heading uses `section-title` class to match Flow Finder heading size
- Completed/Essence Zones stats bar moved above the heading
- Removed top padding from `.groan-matrix` to match Flow Finder spacing from sub-tabs

### Modal improvements
- Removed redundant visibility layer pill badge (e.g. "SCREEN") from modal header — the heading already shows the layer name
- Modal overlay `z-index` bumped to 1100 (above bottom toolbar's 1000) so nav bar is hidden when modal is open
- Problem/persona mapping section restyled to match purple modal theme (was white/gray)

### Repeat challenges
- Completed cells now show "Done x3" (completion count) on both desktop grid and mobile cards
- Completed challenge modal shows a "New Challenge" button — clears the current challenge and opens the new challenge form for the same skill + visibility layer cell
- Old completed challenges stay in DB as history

## New Features

### 3% improvement input
- New text input "How can you make this 3% better?" below the custom challenge input in the creation modal
- Saved in the challenge description when creating custom challenges
- Yes/No toggle in the reflection form asks whether the user implemented their 3% improvement (only shown if the challenge had a 3% item)

### Voice Check-in (post-completion step 3)
- New step between Reflection and Compass Check-in (Play-list only)
- Asks "Did your [Essence archetype] voice show up?" — Yes/No toggle, with text input if Yes
- Asks "Did your [Protective archetype] voice show up?" — Yes/No toggle, with text input if Yes
- Can be skipped via "Skip" button
- Saves as `quest_completions` entries (`playlist_essence_voice` / `playlist_protective_voice`, 3 points each)
- Uses the same quest IDs as standalone Voice Logging cards — auto-completes those cards for the day
- Multiple voice completions per day are allowed (one per challenge completed)

### Post-completion flow (Play-list)
1. "I Did It!" button
2. Reflection — scary/wahoo sliders, 3% toggle (if applicable), optional text
3. Voice Check-in — essence + protective voice yes/no with text inputs
4. Compass Check-in — N/E/S/W energy direction (skippable)
5. Confetti + close

## Bug Fixes

### Challenge not appearing on matrix after creation
- **Root cause**: `getEnrichedCellContext()` transformed `sourceType` from `'skill'` to `'skill_x_problem'` when a problem was mapped in the Play-list modal. `createSkillProblemChallenge` doesn't store `visibility_layer`, and the skills-only matrix looks up by `skill_${id}_${layer}` — never finding `skill_x_problem` records.
- **Fix**: `getEnrichedCellContext()` now keeps `sourceType` as `'skill'` on Play-list. Problem/persona are passed as supplementary context (`mappedProblemLabel`, `mappedPersonaLabel`) for AI generation and included in the challenge description, but the challenge record retains `source_type: 'skill'` with proper `visibility_layer`.

### "New Challenge" showing empty modal
- **Root cause**: `handleCellClick` in GroanMatrix passes `layer` (object) and `sourceItem` (object), but the modal checks for `visibilityLayer` (string ID) and `sourceId` (string). When clicking a completed cell then "New Challenge", `groanCellContext` had no `visibilityLayer` so all form sections were hidden.
- **Fix**: `handleMatrixCellClick` now normalizes incoming cell data — extracts `visibilityLayer`, `sourceId`, `sourceLabel`, `sourceInsight` from whichever shape they arrive in.

## Files Changed
- `src/components/PlayListTab.jsx` — removed "Courage Matrix" heading
- `src/components/GroanMatrix.jsx` — heading class change, stats bar moved up, completion count
- `src/components/GroanMatrix.css` — removed top padding
- `src/Challenge.jsx` — modal pill removed, bug fixes, 3% input, voice check-in step, new challenge button, data normalization
- `src/Challenge.css` — modal z-index, purple mapping styles, toggle buttons, voice textarea, new challenge button
