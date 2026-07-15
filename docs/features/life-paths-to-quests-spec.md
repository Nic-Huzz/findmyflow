# Life Paths → Quests + Courage Challenges

**Created:** 2026-07-14
**Status:** Ready to build

---

## The Problem

Life paths completed in `/life-paths` don't create quests or courage challenges. Stuck reasons are saved as dead JSON. The wahoo micro-actions screen duplicates the Courage tab.

## Current Flow

```
... MAP → WAHOOS (pick ONE career) → STUCK → STUCK_SPRING → WAHOOS (micro-actions) → COMPLETE
```

## New Flow

```
... MAP → SELECT_QUESTS (multi-select) → STUCK_ALL (one screen, all careers) → COMPLETE
```

---

## Step-by-Step

### SELECT_QUESTS (replaces old single-picker)

**Prompt:** "Which of these do you want to actively pursue? We recommend 1-3 to start."

Multi-select cards. Each shows career name + state emoji. Gold border on selected. CTA: "Break these down ->" (min 1 selected).

### STUCK_ALL (one combined screen, replaces per-career loop)

**One scrollable screen** with each selected career as a section header. Under each, the existing stuck input: "What have you been putting off?" + free text + stuck reason pills.

User fills in as many or few as they want per career. No forced spring prompt per career (too tedious). One "Done ->" CTA at the bottom.

### COMPLETE (creates DB records)

```javascript
// For each selected career → quest
const { data: quest } = await supabase.from('quests').upsert({
  user_id: userId,
  career_id: career.id,
  label: career.label,
  predicted_state: career.predictedState,
  status: 'active',
}, { onConflict: 'user_id,career_id' }).select('id').single()

// For each stuck point under this career → courage challenge
const { data: groan } = await supabase.from('groan_challenges').insert({
  user_id: userId,
  title: stuckPoint.text,
  challenge_text: stuckPoint.text,
  status: 'generated',
  source: 'life_paths',
})

await supabase.from('quest_tasks').insert({
  user_id: userId,
  quest_id: quest.id,
  groan_challenge_id: groan.id,
  task_text: stuckPoint.text,
  is_courage: true,
  status: 'pending',
})
```

### Removed

- WAHOOS micro-actions screen (deleted)
- STUCK_SPRING per-career loop (merged into one screen)
- `wahooSteps` state + `wahoo_steps` field in session (unused)

---

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/LifePathWidgetTest.jsx` | Replace WAHOOS + STUCK loop with SELECT_QUESTS + STUCK_ALL. Add quest/challenge creation at COMPLETE. Remove wahooSteps. |

## What NOT to change

- `quests`, `groan_challenges`, `quest_tasks` table schemas (all work as-is)
- Quest map, Getting Started, Courage tab (no changes needed)
- STUCK input UI pattern (free text + pills, just rendered per-career on one screen)

## Edge Cases

- **Re-run:** Upsert prevents duplicate quests. Check existing `groan_challenges` title + user_id before inserting.
- **0 careers selected:** Validation, can't proceed.
- **0 stuck reasons for a career:** Quest created, no linked challenges. User adds via WahooCreator later.
