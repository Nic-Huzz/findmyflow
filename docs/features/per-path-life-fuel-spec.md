# Per-Path Life Fuel Tracking — Feature Spec

> Courage challenges grow the 8 dome dimensions (the HOW). Life fuels measure whether a path feels right (the WHY). These are different signals. Fuels should be measured at the path level, weekly.

## The Problem

Currently, life fuel is tagged per courage challenge in the post-completion flow. This is noisy:
- A single challenge moment doesn't reflect whether a path fulfills you
- The 4 fuels (Choice, Connection, Mastery, Meaning) are outcomes of aligned living, not properties of a single action
- The "Life Fuel Over Time" bar chart on Progress tab uses fake START values and unclear NOW values

## The Solution

Ask about life fuels per active path in the weekly review. Show the result as a percentage bar per path.

## Data Collection: Weekly Review Addition

After Q3 (Courage) in the weekly review, for each active quest:

```
This week on [App Building]...

🔓 I did this because I wanted to          ○ Yes  ○ No
🤝 The people felt like my tribe            ○ Yes  ○ No
📈 I used or grew a skill I love            ○ Yes  ○ No
✨ This served something I care about       ○ Yes  ○ No

[ I didn't work on this path ]  ← skips this path (null, not counted)
```

## DB Schema

```sql
CREATE TABLE path_fuel_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  quest_id uuid REFERENCES quests NOT NULL,
  week_of date NOT NULL,
  choice boolean,
  connection boolean,
  mastery boolean,
  meaning boolean,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, quest_id, week_of)
);

ALTER TABLE path_fuel_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_path_fuel_reviews"
  ON path_fuel_reviews FOR ALL USING (user_id = auth.uid());
```

## Visualization: Fuel Bars Below Radar

Below each per-quest radar on the Progress tab (in PerQuestRadar), show 4 fuel bars. Each bar = `weeks_filled / weeks_active` as a percentage.

```
┌─────────────────────────────────────────┐
│ ● App Building                3 courage │
│                                         │
│           [radar diagram]               │
│    💰 Biggest growth area: Money        │
│                                         │
│  ── LIFE FUEL ──────────────────────    │
│  🔓 Choice      ████████████████░░  87% │
│  🤝 Connection  ██████████░░░░░░░░  62% │
│  📈 Mastery     ██████████████████ 100% │
│  ✨ Meaning     ████████░░░░░░░░░░  50% │
│                              8 weeks    │
└─────────────────────────────────────────┘
```

Bar color: purple (#5e17eb) fill on light gray track. Percentage label right-aligned.

"8 weeks" label = how many active weeks of data exist. If < 4 weeks, show what we have with a "(X weeks)" qualifier.

## Weekly Review Flow

Insert after Q3 (Courage), before Dome review:

```
Q3: Courage challenges...
Q4 (NEW): Life fuel per path
  → For each active quest, show the 4 fuel yes/no toggles
  → "I didn't work on this" toggle skips the path entirely (nulls)
  → If user has 3+ paths, batch: "Which paths gave you Choice this week?" multi-select
Q5: Dome this month...
```

## What This Replaces

- Remove `life_fuel` checkboxes from post-courage completion flow
- Remove `calculateLifeFuel()` usage from ProgressTab
- Remove the "Life Fuel Over Time" bar chart (fake data)
- Remove `renderFuelPain()` from ProgressTab
- Keep `life_fuel_baseline` on current job quest (honest binary "what your job gives you")

## What This Connects To

- **PerQuestRadar**: Fuel bars sit below each radar card
- **Weekly Review**: New question section
- **Current Job baseline**: Binary comparison — "your job gives you X, this path gives you Y"
- **Direction Bridge (stage 8+)**: Fuel data informs "which path fulfills you most?"

## Implementation Order

1. Create `path_fuel_reviews` table + migration
2. Add fuel question to weekly review flow
3. Query fuel data in PerQuestRadar, render bars below radar
4. Remove old fuel bar chart from ProgressTab
5. Remove life_fuel checkboxes from post-courage flow (optional, can keep as secondary signal)

## Open Questions

1. When a path has < 4 weeks of data, show bars or "not enough data yet"?
2. Should fuel bars also appear on QuestBoardCard in the Paths tab?
3. For 3+ paths, is per-path or batched ("which paths gave you Choice?") better UX?
