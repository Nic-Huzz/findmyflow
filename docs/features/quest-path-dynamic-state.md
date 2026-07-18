# Quest Path Map: Dynamic State Lines

*Created: July 18 2026. Status: Design exploration, needs testing.*

## The Idea

Currently, each quest's line on QuestPathMap sits at a fixed X position based on `predicted_state` from the Life Paths exercise. "Dance Facilitator" is classified as "vibe" and stays there forever.

What if each courage challenge moved the dot to the state of that challenge's wahoo classification? The line would snake across the chart, showing the FELT journey over time.

```
Current (static):                    Proposed (dynamic):
                                     
L4 ·                                 L4 ·
L3 ·    ●                            L3 ·         ●──●
L2 ·    ●                            L2 ·    ●──/    \──●
L1 ·    ●                            L1 ·  /               \──●
L0 ·    ●                            L0 · ●
   shut  anxious  safe  vibe            shut  anxious  safe  vibe
   
   (line stays in vibe column)        (line moves based on each challenge outcome)
```

## Data that would feed this

Each courage challenge completion already saves `wahoo_classification` (vibe/peace/anxious/shutdown) and `after_state` (vibe_rise/ventral/sympathetic/dorsal) to `quest_completions.reflection_text` as JSON.

To position a dot, map the classification to an X position:
- vibe/vibe_rise → rightmost column (Vibe Rise)
- peace/ventral → second column (Fun/Safe)
- anxious/sympathetic → third column (Pressure)
- shutdown/dorsal → leftmost column (Uninterested)

The Y position comes from the challenge's depth_level (L0-L4) as it does now.

## Testing with existing data

Huzz's quests with wahoo data (from session queries):

**Dance Event Hosts** — 2 completed challenges with reflection_text:
- "Buy 100 headsets for Europe" → after_state: vibe_rise (Jul 7)
- "Experiment with trial reel viral content" → after_state: ventral (Jul 7)

**Breathwork** — has challenges but need to query:
```sql
SELECT gc.title, qc.reflection_text
FROM quest_completions qc
JOIN quest_tasks qt ON qt.groan_challenge_id = (
  SELECT id FROM groan_challenges WHERE id = ANY(
    SELECT groan_challenge_id FROM quest_tasks WHERE quest_id = 'dd81d7be-9f1a-4399-9ceb-49ec62226e56'
  )
)
WHERE qc.user_id = 'ebe69854-2ebd-4236-a437-3a362f5e1af4'
  AND qc.quest_category = 'Groans'
  AND qc.reflection_text IS NOT NULL;
```

Or simpler — use the groan_challenges.quest_id we just added:
```sql
SELECT gc.title, gc.depth_level, qc.reflection_text
FROM groan_challenges gc
JOIN quest_completions qc ON qc.quest_id = 'play_list_challenge_' || gc.id::text
WHERE gc.quest_id IN (
  SELECT id FROM quests WHERE user_id = 'ebe69854-2ebd-4236-a437-3a362f5e1af4'
)
AND gc.status = 'completed'
AND qc.reflection_text IS NOT NULL
ORDER BY qc.created_at;
```

## The Tension: Art vs Admin Zigzag

A quest like "Dance Facilitator" has two types of tasks:
- **The art** (hosting events, dancing, performing) → likely Vibe Rise
- **The admin** (marketing, cold emails, logistics) → likely Pressure or Bored

The line would zigzag between Vibe Rise and Pressure. Is this useful or confusing?

### Argument: The zigzag IS the story
The zigzag shows the Zone of Excellence vs Zone of Genius split WITHIN a single quest. If 70% of challenges are Vibe Rise and 30% are Pressure, the line trends right with occasional dips left. That's a healthy quest. If 70% are Pressure and 30% are Vibe Rise, the line trends LEFT — this quest might be Zone of Excellence overall.

The TREND of the line tells you: is this quest becoming more Vibe Rise over time (you're leaning into the art) or more Pressure (you're drowning in admin)?

### Argument: The zigzag is confusing
A line that snakes back and forth might look broken or chaotic. Users might think something is wrong rather than reading the pattern. The static line is simpler — you know where each quest sits.

### Possible middle ground
Show the TREND, not every individual point:
- Rolling average of last 5 classifications determines X position
- Individual dots still show at their actual classification
- The line smoothly shifts left or right over time rather than zigzagging per challenge

This would show "Dance Facilitator started at vibe but is drifting toward pressure as more admin tasks pile up" without the noise.

## Implementation notes

**File:** `src/components/level/QuestPathMap.jsx`

Currently, X position is set from `quest.predicted_state` via `stateX()` function. Each quest gets ONE X position.

To make it dynamic:
1. Load wahoo classifications per quest (from reflection_text on quest_completions, joined via groan_challenges.quest_id)
2. Each challenge becomes a dot at (stateX(classification), depthY(depth_level))
3. Connect dots chronologically with a smooth curve
4. The line flows through the state space showing the journey

**Key change:** Instead of a single vertical line, each quest becomes a PATH through 2D space (depth × state).

## What to do next

1. Query Huzz's Dance Events + Breathwork data to see what the dynamic line WOULD look like
2. Sketch/mockup the zigzag vs rolling-average approaches
3. Decide if this replaces the static line or is an optional "detail view" when you tap a quest
