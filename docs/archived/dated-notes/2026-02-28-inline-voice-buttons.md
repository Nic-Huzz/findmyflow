# Inline Voice Buttons & Voices Tab Removal

**Date:** 2026-02-28

## Summary

Replaced the hidden Voices sub-tab with inline Essence/Protective voice buttons directly on completed flow quest cards. Users can now log their inner voices without navigating to a separate tab.

## Changes

### New: Inline Voice Buttons on Flow Quest Cards

- Two pill buttons (Essence + Protective) appear below every completed flow quest card
- Each pill has a chevron arrow indicating dropdown behavior
- Clicking a pill opens a themed textarea (purple for Essence, gold for Protective)
- Status dot turns green after saving; pill shows "Saved" label and becomes non-interactive
- Voice entries save to `quest_completions` with `quest_category: 'Healing'` and `quest_type: 'recognise'`
- Quest IDs: `inline_voice_{flowQuestId}_essence` / `inline_voice_{flowQuestId}_protective`
- 3 XP awarded per entry, counted toward Healing tab progress
- Page reloads after save so score display updates

**New files:**
- `src/components/VoiceDropdown.jsx` — self-contained component with Supabase read/write
- `src/components/VoiceDropdown.css` — purple/gold themed styling

**Modified files:**
- `src/components/QuestCard.jsx` — renders VoiceDropdown on completed flow quests, accepts `userId` and `userArchetypes` props
- `src/Challenge.jsx` — passes `userId` and `userArchetypes` to all QuestCard instances
- `src/components/PlayListTab.jsx` — passes props through to QuestCard

### Removed: Voices Sub-Tab (Tasks | Voices Toggle)

The Business stage tabs no longer show a Tasks/Voices toggle. All quests appear in a single list.

- Removed `businessSubTab` / `setBusinessSubTab` state from `useChallengeData.js`
- Removed sub-tab toggle UI from `Challenge.jsx`
- Removed `generateVoiceQuestsForStage` import from `Challenge.jsx` (no longer needed)

### Removed: Voice Logging from Play-list Tab

The Play-list tab's "Voice Logging" section (with `playlist_essence_voice` and `playlist_protective_voice` quests) has been removed. The Groan Matrix remains.

- Removed `getPlaylistVoiceQuests()` function from `PlayListTab.jsx`
- Removed Voice Logging quest card rendering

### Moved: Groan Quests Back to Tasks List

Stage groan quests (e.g. `groan_stage_1_validation`) were previously hidden in the Voices sub-tab. They now appear in the main quest list, always sorted to the bottom of each stage.

**Sort order:** Explainer quests (top) → Regular quests (middle) → Groan quests (bottom)

### Cleaned Up

- Deleted `mockups/` directory (3 HTML prototype files)
- Updated CSS comment for `.business-sub-tabs` (still used by Bonus tab)

## Bug Fixes

- **Duplicate save prevention:** Guard added so users cannot submit the same voice entry twice
- **Week start format:** Changed from ISO timestamp to `YYYY-MM-DD` string via `getWeekStartLocal()` to match the rest of the app's scoring format

## Data Model

Voice entries are stored in the existing `quest_completions` table:

| Column | Value |
|--------|-------|
| `quest_id` | `inline_voice_{flowQuestId}_essence` or `_protective` |
| `quest_category` | `Healing` |
| `quest_type` | `recognise` |
| `points_earned` | 3 |
| `challenge_instance_id` | `null` (user-level) |
| `challenge_day` | 0 |
| `project_id` | Current selected project |
| `reflection_text` | JSON: `{ voice_type, source_quest, archetype, text }` |
