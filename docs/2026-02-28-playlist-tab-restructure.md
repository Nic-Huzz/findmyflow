# Play-list Tab Restructure — 2026-02-28

## Summary

Restructured the 7-Day Challenge page to replace the standalone Groans and Tracker tabs with a unified **Play-list** tab. Play-list is now the default tab and contains three sections: Flow Finder quests, a skills-only Groan Matrix, and voice logging.

## Steps Implemented (all 9)

1. **useChallengeData.js** — Updated `TAB_TO_CATEGORY`, default tab is now `Play-list`, categories = `['Play-list', 'Business', 'Healing', 'Bonus']`
2. **GroanMatrix.jsx** — Added `sourceTypes` prop to filter visible source tabs (Play-list gets skills-only)
3. **PlayListTab.jsx** (new) — Three sections: Flow Finder quests, Skills-only matrix, Voice logging
4. **Challenge.jsx** — Play-list tab rendering, removed Tracker/Groans standalone blocks, added `excludeStages={[0, 0.5]}` to Business stage tabs
5. **Challenge.jsx** — Problem/persona mapping dropdowns in groan modal with `getEnrichedCellContext()` enrichment
6. **CompassCheckin.jsx** (new) + **Challenge.jsx** — Compass energy check-in after Play-list challenge completion (3-state modal: view/generate → reflection → compass)
7. **ChallengeStageTabs.jsx** — Added `excludeStages` prop with division-by-zero guard
8. **challengeQuestsUpdate.json** — Archived `recognise_flow_update`, `tracker_essence_voice`, `tracker_protective_voice`
9. **Challenge.css** — Styles for `.playlist-tab`, `.groan-mapping-step`, `.compass-checkin-modal`

## Bugs Found & Fixed

1. **Critical**: `handleCompassAfterGroan` wasn't clearing `groanCellContext`, so the modal would re-open after compass completion. Fixed by adding `setGroanCellContext(null)`.
2. **Important**: Play-list voice quest IDs (`playlist_essence_voice`, `playlist_protective_voice`) weren't in `RECOGNISE_QUEST_IDS` in `QuestCard.jsx`, so they'd render as blank buttons instead of the `RecogniseQuestInput` text area. Fixed by adding both IDs.
3. **Minor**: Division-by-zero guard added to `ChallengeStageTabs` progress calculation when `excludeStages` reduces project stages to ≤1.

## Areas Needing Manual Verification

### 1. Problem/persona mapping flow
`getEnrichedCellContext()` transforms a skill cell context into `skill_x_problem` when a problem is mapped. Need to verify `handleGenerateFromPopup` properly routes that enriched context to `createSkillProblemChallenge` vs the regular challenge generation. The existing code paths for `skill_x_problem` existed before, but the handoff from the new mapping dropdowns is untested.

### 2. Compass save path
`handleCompassAfterGroan` passes `progress?.challenge_instance_id` to `handleFlowCompassCompletion`. That `progress` is the 7-day challenge instance, not the groan challenge. It should still save a valid `flow_entries` row, but need to confirm the function doesn't require a specific challenge instance format.

### 3. Voice quest completion
The playlist voice IDs were added to `RECOGNISE_QUEST_IDS` so they render the right input, but the actual save path when you submit — whether `handleQuestComplete` correctly processes quests with `category: 'Voices'` that don't belong to a specific stage — is worth testing. They might hit the `challenge_day: 0` / `quest_category` mismatch patterns fixed previously.

### 4. flowFinderData staleness
The `useEffect` only fetches once (`!flowFinderData` guard). If someone completes Flow Finder skills then switches to Play-list, the mapping dropdowns won't show newly added items until page refresh.

## Suggested Test Order

1. Open Play-list tab → verify 3 sections render
2. Click a matrix cell → check mapping dropdowns appear with Flow Finder data
3. Generate a challenge with a problem mapped → verify it creates correctly
4. Complete a challenge → confirm compass check-in appears, then saves and closes
5. Try the voice quests → make sure the text input appears (not a bare button)
