# Skill System: Remaining Implementation

*Created: July 20 2026. Prerequisite: session-handoff-2026-07-18-dynamic-state-lines-skill-tagging.md*

## 1. Rolling Average in QuestPathMap (~30 min)

### What
Replace Option A (every dot at its wahoo X) with Option B (rolling average, window=5). The line smoothly drifts between state columns instead of zigzagging.

### Where
`src/components/level/QuestPathMap.jsx` — the `pathPoints` computation around line 482.

### How

After building `pathPoints` (each with `{ x, y, state, task }`), compute rolling average X:

```javascript
// Map states to numeric values for averaging
const STATE_VALUES = { shutdown: 1, anxious: 2, peace: 3, vibe: 4 }

// Compute rolling average X for each point
const WINDOW = 5
const smoothedPoints = pathPoints.map((p, i) => {
  // Collect last WINDOW states (including this one)
  const windowStates = []
  for (let j = Math.max(0, i - WINDOW + 1); j <= i; j++) {
    const s = pathPoints[j].state
    if (s && STATE_VALUES[s]) windowStates.push(STATE_VALUES[s])
  }
  if (windowStates.length === 0) return p // no wahoo data, keep original X

  const avg = windowStates.reduce((a, b) => a + b, 0) / windowStates.length
  // Interpolate X between state zone centers
  const floor = Math.floor(avg)
  const ceil = Math.ceil(avg)
  const frac = avg - floor
  const centers = [0, 65, 160, 255, 355] // index 1=shutdown, 2=anxious, 3=peace, 4=vibe
  const smoothX = centers[floor] + frac * (centers[ceil] - centers[floor])

  return { ...p, x: smoothX }
})
```

Replace `pathPoints` with `smoothedPoints` for the path `d` attribute. Keep ghost dots at original `p.x` positions (the raw wahoo state).

### Test
Open `/quest-map` with Huzz's account. The Vibe Rise quest should show a smooth line that dips left around L2 (sales calls) and recovers by L3.

## 2. Backfill Existing Tasks with skill_tags (~15 min)

### What
Run the keyword classifier on all existing quest_tasks that have text but no skill_tags. For courage challenges that don't keyword-match, fall back to their quest's skill_tags.

### How

SQL script (run via Supabase dashboard or MCP):

```sql
-- Step 1: Tag courage challenges with their quest's skill_tags as fallback
-- (keyword classification needs JS, so we handle the fallback-only case in SQL)
UPDATE quest_tasks qt
SET skill_tags = q.skill_tags
FROM quests q
WHERE qt.quest_id = q.id
  AND qt.skill_tags IS NULL
  AND qt.is_courage_challenge = true
  AND q.skill_tags IS NOT NULL
  AND array_length(q.skill_tags, 1) > 0;
```

For regular tasks, run a Node script that loads all tasks with null skill_tags, runs `classifyTaskSkills()` on each, and updates the ones that match:

```javascript
// scripts/backfill-task-skills.js
import { createClient } from '@supabase/supabase-js'
import { classifyTaskSkills } from '../src/lib/questSkillTagger.js'

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

const { data: tasks } = await supabase
  .from('quest_tasks')
  .select('id, text, is_courage_challenge')
  .is('skill_tags', null)
  .not('text', 'is', null)

let updated = 0
for (const task of tasks) {
  const skills = classifyTaskSkills(task.text)
  if (skills) {
    await supabase.from('quest_tasks').update({ skill_tags: skills }).eq('id', task.id)
    updated++
  }
}
console.log(`Backfilled ${updated} of ${tasks.length} tasks`)
```

Run with: `node --experimental-modules scripts/backfill-task-skills.js`

Skip the Node script. Just do the SQL fallback for courage challenges. Regular tasks without keyword matches stay null (by design, they don't get XP). Old regular tasks are outside the 30-day alignment window anyway. New tasks going forward are already tagged on creation.

## 3. Milestone Celebrations on Level-Up (~20 min)

### What
When `awardSkillXP()` increments XP past a level threshold, show a celebration. "Performing: Charging unlocked!"

### Where
- `supabase/migrations/` — modify `increment_skill_xp` RPC to return old + new level
- `src/lib/skillProgress.js` — check RPC return for level change
- Callers in GroanCompletionModal + QuestBoardCard

### How

**Step 1: Modify the RPC to return old level alongside new.**

```sql
CREATE OR REPLACE FUNCTION increment_skill_xp(p_user_id uuid, p_skill_id text)
RETURNS jsonb AS $$
DECLARE
  old_level text;
  new_xp int;
  new_level text;
BEGIN
  -- Get old level (or null if first time)
  SELECT level INTO old_level FROM user_skill_progress
    WHERE user_id = p_user_id AND skill_id = p_skill_id;

  -- Upsert + increment
  INSERT INTO user_skill_progress (user_id, skill_id, xp, level, updated_at)
  VALUES (p_user_id, p_skill_id, 1, 'education', now())
  ON CONFLICT (user_id, skill_id)
  DO UPDATE SET xp = user_skill_progress.xp + 1, updated_at = now();

  -- Compute new level from updated XP
  SELECT xp INTO new_xp FROM user_skill_progress
    WHERE user_id = p_user_id AND skill_id = p_skill_id;

  new_level := CASE
    WHEN new_xp >= 25 THEN 'teaching'
    WHEN new_xp >= 15 THEN 'charging'
    WHEN new_xp >= 8  THEN 'practising'
    WHEN new_xp >= 3  THEN 'testing'
    ELSE 'education'
  END;

  -- Update level
  UPDATE user_skill_progress SET level = new_level
    WHERE user_id = p_user_id AND skill_id = p_skill_id;

  RETURN jsonb_build_object(
    'old_level', COALESCE(old_level, 'none'),
    'new_level', new_level,
    'xp', new_xp
  );
END;
$$ LANGUAGE plpgsql;
```

One DB call total. Returns `{ old_level, new_level, xp }`.

**Step 2: Check return in `awardSkillXP()`:**

```javascript
export async function awardSkillXP(userId, skillTags) {
  if (!userId || !skillTags?.length) return null

  let levelUp = null
  for (const skillId of skillTags) {
    try {
      const { data, error } = await supabase.rpc('increment_skill_xp', {
        p_user_id: userId,
        p_skill_id: skillId,
      })
      if (error) { console.warn(`Skill XP failed for ${skillId}:`, error); continue }
      if (data?.old_level && data.new_level !== data.old_level && data.old_level !== 'none') {
        levelUp = { skillId, newLevel: data.new_level, xp: data.xp }
      }
    } catch (err) {
      console.warn(`Skill XP failed for ${skillId}:`, err)
    }
  }
  return levelUp
}
```

**Step 3: Toast on level-up in callers:**

```javascript
const levelUp = await awardSkillXP(userId, skills)
if (levelUp) {
  // Simple toast — haptic + inline banner
  hapticSuccess()
  // Show toast via state or a lightweight toast system
}
```

### Level Names (confirmed)
- 0 XP: Learning
- 3 XP: Testing
- 8 XP: Practising
- 15 XP: Charging
- 25 XP: Teaching

These match the depth levels intentionally. The skill level IS the depth: "I'm at the Charging level of performing" means "I charge money for performing."

## 4. Skill Level Picker (~30 min)

### What
After quest creation, let the user set their starting level for each skill the quest was tagged with. Prevents experienced performers from starting at 0 XP. Two trigger points:

1. **After `/life-paths` completion (batch):** Multiple quests created at once. Show a single screen with all unique skills across all new quests, each with level buttons.
2. **On individual quest creation (LevelTab / QuestSelector):** One quest at a time. Only show skills the user hasn't set a level for yet.

### Where
- `/life-paths` flow completion step (new screen at end of flow)
- `src/components/level/LevelTab.jsx` — state `skillLevelPicker` already exists (line 66), just never renders
- `src/lib/skillProgress.js` — `setSkillStartingLevel()` already exists (line 50)

### How

**Batch version (after /life-paths):**

New step added to the life-paths flow completion. After careers are saved as quests:

1. Collect all unique skill_tags from the newly created quests
2. Filter out skills the user already has XP for (query `user_skill_progress`)
3. If any remain, show a screen:

```
Where are you starting?

Performing
[Learning] [Testing] [Practising] [Charging] [Teaching]

Coaching
[Learning] [Testing] [Practising] [Charging] [Teaching]

Connecting
[Learning] [Testing] [Practising] [Charging] [Teaching]
```

4. On submit, call `setSkillStartingLevel(userId, skillId, level)` for each
5. Skip button available ("I'll figure this out later")

**Single quest version (LevelTab):**

The state already exists at `LevelTab.jsx` line 66:
```javascript
const [skillLevelPicker, setSkillLevelPicker] = useState(null) // { questId, skills }
```

And it's set after quest creation at line 148-159. Just needs the actual modal JSX rendered:

```jsx
{skillLevelPicker && (
  <SkillLevelPickerModal
    skills={skillLevelPicker.skills}
    userId={userId}
    onDone={() => { setSkillLevelPicker(null); onUpdate?.() }}
    onSkip={() => setSkillLevelPicker(null)}
  />
)}
```

The modal component is shared between both trigger points. Shows only skills the user hasn't leveled yet. Each skill gets 5 tappable buttons. Calls `setSkillStartingLevel()` on confirm.

### Files
- `src/components/level/SkillLevelPickerModal.jsx` — new shared component
- `src/components/level/LevelTab.jsx` — render the modal (wiring exists, just add JSX)
- Life paths completion flow — add as final step before redirect
- `src/lib/skillProgress.js` — `setSkillStartingLevel()` already built
