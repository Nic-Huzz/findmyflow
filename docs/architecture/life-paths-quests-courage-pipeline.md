# Life Paths → Quests → Courage Pipeline

**Updated:** 2026-07-14

## How it all connects

```
/life-paths flow
  ├── User enters careers + tags with states (vibe/fun/stress/uninterested)
  ├── User selects which careers to actively pursue (SELECT_QUESTS, multi-select)
  ├── User enters stuck points per selected career (STUCK_ALL, one screen)
  └── On COMPLETE:
        ├── Each selected career → quests table (upsert on user_id + career_id)
        ├── Each stuck point → groan_challenges table (status: active, source: life_paths)
        ├── Each stuck point → quest_tasks table (linked to quest + groan_challenge)
        └── Each stuck point → priority_weekly_picks table (so it appears on Courage tab)
```

## Tables involved

| Table | What it stores | Key columns |
|-------|---------------|-------------|
| `life_path_sessions` | Raw session data from /life-paths flow | `careers` (JSON), `stuck_points` (JSON), `step`, `safety` |
| `quests` | Active life path quests on the Quests tab | `career_id`, `label`, `predicted_state`, `status` |
| `quest_tasks` | Tasks within a quest (stuck points become these) | `quest_id`, `groan_challenge_id`, `text`, `is_courage_challenge` |
| `groan_challenges` | Individual courage challenges (wahoos) | `title`, `status`, `challenge_source`, `accepted_at` |
| `priority_weekly_picks` | What appears as "Active Wahoos" on the Courage tab | `reference_id` (→ groan_challenges.id), `pick_type: 'groan'` |

## Data flow on completion

```
career "Retreat Designer"
  → quests row: { label: "Retreat Designer", career_id: "c4", status: "active" }
  
stuck point "Host a 1-day at Istana"
  → groan_challenges row: { title: "Host a 1-day at Istana", status: "active", challenge_source: "life_paths" }
  → quest_tasks row: { quest_id: above quest, groan_challenge_id: above groan, is_courage_challenge: true }
  → priority_weekly_picks row: { reference_id: above groan id, pick_type: "groan" }
```

## Where things appear in the UI

| Location | What shows | Source table |
|----------|-----------|-------------|
| **Quests tab** (LevelTab) | Active quest cards with tasks | `quests` + `quest_tasks` |
| **Courage tab** (PlayListTab) | Active wahoos / courage challenges | `priority_weekly_picks` → `groan_challenges` |
| **Quest board card** | Tasks under each quest, tagged with ⚡ if courage | `quest_tasks.is_courage_challenge` |
| **Life path map** (/life-paths) | All careers on the map | `life_path_sessions.careers` |

## Tab unlock sequence

| Tab | Always open? | Unlocks when |
|-----|-------------|-------------|
| Journey | Yes | — |
| Tune | Yes | — |
| Quests | No | `life_path_sessions` exists (auto-detected in Challenge.jsx) |
| Courage | No | User clicks "Unlock →" button in Getting Started on Journey tab |

## Key files

- `/life-paths` flow: `src/pages/LifePathWidgetTest.jsx`
- Quests tab: `src/components/level/LevelTab.jsx`
- Courage tab: `src/components/PlayListTab.jsx`
- Getting Started: `src/components/journey/JourneyOnboarding.jsx`
- Tab unlock logic: `src/Challenge.jsx` (lines ~410-430)
- Quest cards: `src/components/QuestBoardCard.jsx`

## Deduplication

- Quests: upsert on `user_id + career_id` (re-running /life-paths updates, doesn't duplicate)
- Groan challenges: check for existing `title + user_id` before inserting
- Quest tasks: check for existing `quest_id + text` before inserting
- Priority picks: upsert with `ignoreDuplicates: true`
