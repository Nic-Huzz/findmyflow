# Courage + Quests Unification Plan

> Make `quest_tasks` the single source of truth for courage challenges. Stop using `priority_weekly_picks` for groan type. One atomic deploy.

## The Problem

Courage challenges have two data sources:
- **Quests tab** reads `quest_tasks` where `is_courage_challenge = true`
- **Courage tab** reads `priority_weekly_picks` where `pick_type = 'groan'`

If a challenge exists in one but not the other, it's visible on one tab but invisible on the other. 6 creation flows write to picks, only 2 also write quest_tasks.

## The Fix

Remove `priority_weekly_picks` as a data source for courage challenges. All reads and writes go through `quest_tasks`. Healing picks (`daily_healing`, `weekly_healing`) stay untouched in `priority_weekly_picks`.

## Files to Change

### Creation flows — stop writing groan picks, ensure quest_task is created

| File | Current | Change |
|---|---|---|
| `WahooCreator.jsx` (line 133) | Writes pick + quest_task | Remove pick upsert. Quest_task already created (line 153) |
| `TuneTab.jsx` (line 799) | Writes pick only | Replace pick insert with quest_task insert. Needs QuestSelector or auto-assign to most recent quest |
| `CuriosityCompassFlow.jsx` (line 313) | Writes pick only | Replace pick insert with quest_task insert. Needs quest linking |

### Completion + cleanup — stop deleting groan picks

| File | Current | Change |
|---|---|---|
| `GroanCompletionModal.jsx` (line 232-242) | Deletes groan pick after completion | Remove the delete block. Already marks quest_task done (line 248-255) |
| `QuestBoardCard.jsx` (line 315) | Deletes groan pick during orphan cleanup | Remove pick delete. Quest_task update already handles it |

### Read path — switch data source

| File | Current | Change |
|---|---|---|
| `PlayListTab.jsx` (line 138) | Reads `priority_weekly_picks` where `pick_type = 'groan'` | Read `quest_tasks` where `is_courage_challenge = true AND done = false`, join to `quests` for grouping and `groan_challenges` for metadata |

### Orphan banner — backfill old data

| File | Change |
|---|---|
| `PlayListTab.jsx` (new section) | Detect orphan `groan_challenges` without `quest_tasks`. Show banner with quest dropdown to assign them. For users without quests, prompt to create one first |

### Dead code removal

| File | Change |
|---|---|
| `WahooInspiration.jsx` (line 256) | Archived flow — remove pick insert (dead code) |
| `MobilePlaylistPicker.jsx` (line 115) | Dead flow — remove pick insert |
| `WahooCreator.jsx` (line 252) | Bucket list activation — remove pick upsert |

## Orphan Data (12 remaining)

| User | Active | Completed | Has Quests? |
|---|---|---|---|
| andrewhurrell@me.com | 1 | 0 | Yes (4 quests) |
| jontycoats@gmail.com | 1 | 0 | No |
| joshua.scrivano@hotmail.com | 2 | 3 | No |
| shleb.white@gmail.com | 4 | 0 | No |

Orphan banner handles these: if user has quests, show dropdown. If not, prompt to create a quest first.

## What stays untouched

- `priority_weekly_picks` table (still used for healing picks)
- `usePriorityTab.js` (manages healing picks, not groan)
- `PriorityWeekPicker.jsx` (builds healing pick objects)
- `Challenge.jsx` hasEverPlannedWeek check (queries all pick types, healing picks satisfy it)

## "I Did It!" button flow change

Currently: PlayListTab passes `pick.reference_id` → fetches `groan_challenges` → opens GroanCompletionModal

After: PlayListTab passes `task.groan_challenge_id` → fetches `groan_challenges` → opens GroanCompletionModal (same modal, different source for the challenge ID)
