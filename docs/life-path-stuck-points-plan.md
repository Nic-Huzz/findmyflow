# Life Path Stuck Points — Implementation Plan (v3)

## What we're building

Three new steps in the `/life-paths` flow that surface what the user has been avoiding, capture why, and convert blocks into wahoos that appear in the wahoo tab. Progress saves after every step so nothing is lost. Returning users resume where they left off.

---

## Flow (11 steps)

```
CURRENT → ENTER → TAG → SPRING → TAG_NEW → READING → MAP → STUCK → STUCK_SPRING → WAHOOS → COMPLETE
```

Future split if drop-off is a problem:
- `/life-paths` = identification (CURRENT → READING)
- `/life-paths/blocks` = blocks (MAP → STUCK_SPRING)
- `/life-paths/wahoos` = wahoos (WAHOOS → COMPLETE)

All share the same `life_path_sessions` row.

---

## New steps: detailed UX

### MAP (extracted from current WAHOOS)

Panel content:
```
Which career path pulls you most?

[● Career 1]
[● Career 2]
[● Career 3]

[Break it down →]
```

Returning users who already explored a career see a small indicator next to it ("3 stuck points, 2 wahoos"). They can select any career, including previously explored ones.

---

### STUCK

Panel content:
```
What have you wanted to do to get closer
to "[career]" but haven't yet?

[Input] [Add]

1. Research retreat venues          ⏰ Too busy
2. Ask Sarah to co-facilitate       (tap to add reason)
3. Sign up for that course          😰 Scared

[That's all I can think of →]
```

**Reason selector interaction (non-blocking):**

1. User types a stuck point, hits Add
2. The entry appears in the list immediately
3. A row of 6 small reason buttons fades in below that entry
4. If the user taps one within ~5 seconds, it attaches to that entry (emoji + label appears next to it)
5. If they start typing the next stuck point instead, the reason buttons fade out. The entry stays without a reason. That's fine.
6. The reason is optional. It's there for users who want to reflect, invisible to those who want to brain-dump fast.

**Reason buttons:**

| Emoji | Label | Stored code |
|-------|-------|-------------|
| ⏰ | Too busy | `too_busy` |
| 💰 | Need more money | `need_money` |
| 📚 | Need to learn more | `need_learn` |
| 😰 | Scared of failing | `scared` |
| ⏳ | Waiting for the right time | `waiting` |
| 🤷 | Don't know where to start | `dont_know` |

Min 1 stuck point required to advance.

---

### STUCK_SPRING

Panel content:
```
Is that really all?

What about things you've been:
  · Too busy for?
  · Waiting to save more for?
  · Wanting to learn more before doing?
  · Waiting for the right moment?

[Input] [Add]

4. Book a venue for a test event    ⏳ Waiting
5. Take breathwork training         💰 Need more money

[That's everything →]
```

Same input + reason pattern. Same non-blocking reason selector. The prompt categories match the reason buttons, nudging them to think about each type of avoidance.

"That's everything →" always visible (even with 0 new entries — they can skip the spring).

---

### WAHOOS (updated with stuck point bubbles)

Panel content:
```
If we broke down living the "[career]"
life path into tiny steps, what are they?

── Things you've been putting off ──
[Research venues ⏰]  [Ask Sarah 😰]  [Course 📚]
[Book venue ⏳]  [Breathwork 💰]

↑ Tap to add as a step

── Your steps ──
1. Research retreat venues    ☐
2. Ask Sarah to co-facilitate ☐
3. Draft a 3-day outline      ☐

[Input] [Add]

[Save & finish →]
```

**Bubble interaction:**
- Stuck points appear as tappable pills in a "Things you've been putting off" section
- Each pill shows the text + reason emoji (if set)
- Tap a pill → it disappears from the bubbles and appears in the numbered steps list below
- The pill has a subtle animation (shrink out of bubbles, grow into list)
- Free-text input below for new steps that aren't stuck points
- User can also ✕ remove any step from the list

**On "Save & finish →":**
1. Save full session to `life_path_sessions` (including `stuck_points` with reasons)
2. For each stuck point that was tapped into the wahoo steps:

```javascript
import { createGroanChallenge, acceptGroanChallenge } from '../lib/crm/groanChallengeService'
import { getWeekStartLocal } from '../lib/dateUtils'

const { data: dbRecord } = await createGroanChallenge({
  userId: user.id,
  title: stuckPoint.text,
  description: `Life path: ${selectedCareer.label}${stuckPoint.reasonLabel ? `. Blocked by: ${stuckPoint.reasonLabel}` : ''}`,
  visibilityLayer: 'screen',
  sourceType: 'life_path',
  sourceLabel: selectedCareer.label,
  scaryScore: 5,
  wahooScore: 5,
  wahooCategory: null,
})

if (dbRecord) {
  await acceptGroanChallenge(dbRecord.id)
  await supabase.from('priority_weekly_picks').upsert({
    user_id: user.id,
    week_start_date: getWeekStartLocal(),
    pick_type: 'groan',
    reference_id: dbRecord.id,
    display_name: stuckPoint.text,
  }, { onConflict: 'user_id,week_start_date,pick_type,reference_id', ignoreDuplicates: true })
}
```

This creates `groan_challenges` (status: generated → accepted) + `priority_weekly_picks`. The wahoo tab reads from `priority_weekly_picks` joined to `groan_challenges`. The stuck point appears as an active wahoo this week.

---

## Data model

### Add column:

```sql
alter table life_path_sessions
  add column stuck_points jsonb default '[]'::jsonb;
```

### Stuck point structure:

```json
{
  "id": "sp1",
  "careerId": "c3",
  "text": "Research retreat venues",
  "reason": "too_busy",
  "reasonLabel": "Too busy",
  "reasonEmoji": "⏰",
  "fromSpring": false,
  "addedToWahoos": true
}
```

The `careerId` groups stuck points by career. When the user returns and selects a different career, they see that career's stuck points (or empty if new).

### Reason constants:

```javascript
export const STUCK_REASONS = [
  { id: 'too_busy', label: 'Too busy', emoji: '⏰' },
  { id: 'need_money', label: 'Need more money', emoji: '💰' },
  { id: 'need_learn', label: 'Need to learn more', emoji: '📚' },
  { id: 'scared', label: 'Scared of failing', emoji: '😰' },
  { id: 'waiting', label: 'Waiting for the right time', emoji: '⏳' },
  { id: 'dont_know', label: "Don't know where to start", emoji: '🤷' },
]
```

---

## Returning users

### On mount:

```javascript
const { data } = await supabase
  .from('life_path_sessions')
  .select('*')
  .eq('client_email', user.email)
  .order('updated_at', { ascending: false })
  .limit(1)
  .maybeSingle()
```

### If session exists:

Restore all state:
- `currentCareer` from `current_career` + `current_state`
- `careers` from `careers` JSONB
- `stuckPoints` from `stuck_points` JSONB
- `wahooSteps` from `wahoo_steps` JSONB
- `safety` from `safety`
- `sessionId` from `id`
- `step` from `step` — land on exactly where they left off

If `step` is `complete`, land on MAP so they can explore another career or add to existing ones.

### No "start fresh":

There is no reset/delete option. The session evolves over time. Users can:
- Add new careers (go back to ENTER via a "+ Add careers" button visible on MAP)
- Add new stuck points for any career
- Add new wahoo steps
- Remove items with ✕

### Multiple careers:

The MAP step shows all careers. Each career can have its own stuck points and wahoo steps. When they select a career:
- STUCK step filters stuck points by `careerId`
- WAHOOS step filters wahoo steps by `selectedWahooId` (already works this way)
- Bubbles show only the selected career's stuck points

---

## Healing intention integration

When `HealingIntentionSetter` opens (weekly healing focus), pass stuck points as a prop:

```jsx
<HealingIntentionSetter
  userId={user.id}
  stuckPoints={stuckPointsFromSession}
  onSave={handleIntentionSave}
  onClose={closeIntentionSetter}
/>
```

Below the "I keep..." textarea, render suggestion pills:

```
── From your life path ──
[I keep saying I'm too busy to research retreat venues]
[I keep being scared to ask Sarah to co-facilitate]
[I keep waiting for the right time to book a venue]
```

Tap a pill → fills the textarea. User can edit or use as-is, then proceed with somatic steps.

**Query:** Load from `life_path_sessions.stuck_points` where `client_email = user.email`, most recent session, filter to entries with a reason set.

---

## Save-as-you-go

The auto-save effect triggers on:
```javascript
[step, taggedCareers.length, safety, wahooCount, stuckPointsCount, user]
```

Adding `stuckPointsCount` (total stuck points across all careers) ensures saves fire when stuck points are added. Every step transition also triggers a save.

The `step` field in the database records exactly where they are. On return, they resume at that step.

---

## Files to modify

| File | Changes |
|------|---------|
| `src/pages/LifePathWidgetTest.jsx` | Add MAP, STUCK, STUCK_SPRING. Update WAHOOS with bubbles. Session loading on mount. groan_challenges insert on save. |
| `src/components/LifePathMap/lifePaths.js` | Add `STUCK_REASONS` constant |
| `src/components/HealingIntentionSetter.jsx` | Accept `stuckPoints` prop, render suggestion pills |
| `src/Challenge.jsx` | Pass stuck points to HealingIntentionSetter |
| Supabase | Add `stuck_points` column |
| `src/pages/FacilitateLifePaths.jsx` | Sync new steps (no session loading) |
| `src/flows/TryLifePaths.jsx` | Sync new steps (stuck points before email gate) |

---

## Build sequence

| Step | What | Time |
|------|------|------|
| 1 | Add `stuck_points` column via MCP | 1 min |
| 2 | Add `STUCK_REASONS` to lifePaths.js | 2 min |
| 3 | Extract MAP step from WAHOOS in LifePathWidgetTest.jsx | 10 min |
| 4 | Build STUCK step with non-blocking reason selector | 20 min |
| 5 | Build STUCK_SPRING step | 10 min |
| 6 | Update WAHOOS with stuck point bubbles + groan_challenges insert | 20 min |
| 7 | Session loading for returning users | 15 min |
| 8 | Healing intention suggestion pills | 10 min |
| 9 | Sync to facilitator + /try/ | 15 min |

**Total: ~100 minutes**

---

## What "done" looks like

**First visit:** User picks "Run retreats." Gets asked what they've wanted to do but haven't. Types "Research venues" → taps ⏰. Types "Ask Sarah" → starts typing the next one, reason fades (no reason attached, that's fine). Gets pushed for more. Adds "Breathwork course" → taps 💰. On the wahoo step, three bubbles float above the input. They tap "Research venues" and "Ask Sarah." Both move into steps. They add "Draft a 3-day outline" as free text. Save. Both tapped items appear in their wahoo tab this week.

**Return visit:** User opens `/life-paths`. Their map loads with all previous careers. They're on the MAP step. They select "Start a podcast" (a different career). STUCK step is empty (new career, no stuck points yet). They add "Buy a mic" → ⏳, "Record episode 1" → 😰. Break into steps. Save. New wahoos appear alongside the retreat ones.

**Healing tab:** User opens weekly healing intention. Below the "I keep..." textarea, they see: [I keep saying I'm too busy to research retreat venues] [I keep being scared to record episode 1]. They tap the second one. It fills the textarea. They proceed with body sensing. Their healing work is now connected to a specific blocked action on a specific life path.
