# Inline Voice Buttons on Flow Quest Cards

**Date**: 2026-02-28
**Status**: Approved

## Problem

The Voices tab is hidden inside the Play-list tab as a sub-tab. Users don't discover it, so voice entries (essence/protective) are rarely completed.

## Solution

Add Essence and Protective voice pill buttons directly under every "Start X" flow button on quest cards. Each pill toggles a dropdown textarea for quick voice logging.

## Visual Design

- Two pill buttons side by side below the graduation text
- Chevron arrow (▾) on each pill indicating dropdown behavior, rotates when open
- Status dot (top-right of pill): empty = not done, filled green = saved
- Essence = purple theme (#5e17eb), Protective = gold/amber theme (#E9A23B)
- Only one dropdown open at a time
- Dropdown contains: prompt text + textarea + Save button

## Data Model

- Saves to `quest_completions` table (existing)
- `quest_category: 'Healing'` — counts toward Healing tab progress
- `quest_type: 'recognise'`
- `quest_id`: `inline_voice_{flowQuestId}_essence` / `inline_voice_{flowQuestId}_protective`
- `points_earned: 3` (matching existing voice quests)
- `challenge_instance_id: null`, `challenge_day: 0` (user-level, not challenge-bound)
- `project_id`: current selected project

## Scope

- Only on flow-type quests (`inputType === 'flow'`) showing "Start X" buttons
- Not shown when quest is completed or locked
- New component: `VoiceDropdown.jsx`
- CSS scoped inside QuestCard styles or own file

## Component API

```jsx
<VoiceDropdown
  questId={quest.id}
  userId={user.id}
  projectId={selectedProject?.id}
  userArchetypes={userArchetypes}
/>
```

## Behavior

1. On mount: check `quest_completions` for existing entries, set status dots
2. Click pill: toggle dropdown, close other if open
3. Type + Save: insert into `quest_completions`, flip dot to green, close dropdown
4. 3 XP awarded per voice entry (essence and protective scored independently)
