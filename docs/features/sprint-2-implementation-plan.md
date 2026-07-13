# Sprint 2: Implementation Plan

**Created:** 2026-07-12
**Branch:** `light-portal`
**Depends on:** Sprint 1 (committed `4655939`)
**Spec doc:** `docs/features/octalysis-alignment-implementation-notes.md` (Sections 6, 7, 9)

---

## What Sprint 2 Builds

Sprint 1 changed how FAILURE FEELS. Sprint 2 changes how the app SEES YOU. The Zarlo Brief gives the AI a full picture of the user's journey, enabling proactive pattern detection, interim milestones, and the Journey tab.

| Item | What It Does | Effort |
|---|---|---|
| **2A** Zarlo Brief Edge Function | Pre-computes daily user summary for Zarlo context | 2-3 days |
| **2B** Zarlo Brief integration | Wires the Brief into zarloEngine system prompt | 1 day |
| **2C** Journey tab shell | New tab on `/7-day-challenge` page | 1 day |
| **2D** Stage 6→7 interim milestones | Voice count progress on Journey tab + Zarlo messages | 1 day |

**Total estimated effort:** 5-6 days

---

## 2A: Zarlo Brief Edge Function

### What It Does

A Supabase Edge Function that runs daily (via pg_cron) for each active user. Queries ALL user data and compresses it into a ~500 token structured summary. This summary is stored and used as Zarlo's context window.

### Files to Create

**`supabase/functions/generate-zarlo-brief/index.ts`**

```typescript
// Inputs: user_id (from cron or on-demand call)
// Outputs: structured brief stored in zarlo_briefs table
//
// Queries (all for the given user_id):
// 1. nervous_system_checkins — ALL: state distribution, day-of-week patterns
// 2. healing_intentions — ALL: protective voice counts, patterns
// 3. groan_challenges (completed) — ALL: wahoo classifications, visibility layers
// 4. quest_completions — ALL: reflection text, identity statements
// 5. quests — CURRENT: active life paths, predicted states
// 6. weekly_reviews — ALL: multiplier scores over time
// 7. user_stage_progress — CURRENT: essence, hero stage
// 8. experience_checkins — ALL: predictions vs outcomes
// 9. quest_cross_pollination — ALL: which paths feed each other
// 10. groan_streaks — CURRENT: streak data
```

**Output structure (JSON stored in `zarlo_briefs` table):**

```json
{
  "generated_at": "2026-07-12T08:00:00Z",
  "current_state": {
    "hero_stage": 6,
    "streak_days": 14,
    "capacity_score": 67,
    "essence_archetype": "Radiant Rebel",
    "essence_name": "Phoenix",
    "last_checkin_state": "ventral"
  },
  "patterns": {
    "day_of_week": { "wednesday": { "activated_pct": 78 } },
    "protective_voices": { "perfectionist": 4, "ghost": 2 },
    "dominant_voice": { "name": "perfectionist", "count": 4 },
    "wahoo_trend": { "pressure_pct_month1": 20, "pressure_pct_current": 35 },
    "visibility_layers": { "screen": 12, "live": 3, "money": 0, "vulnerable": 1, "authority": 0 },
    "healing_tab_visits_last_30d": 2,
    "healing_tab_visits_first_30d": 8
  },
  "convergence": {
    "cross_pollination_pairs": [["breathwork", "coaching"]],
    "cross_pollination_count": 3
  },
  "thresholds": {
    "voice_graduation_ready": false,
    "voice_count_to_graduate": 1,
    "streak_milestone_approaching": "21_day",
    "stage_stuck_days": 12
  },
  "contradictions": [
    "Reports Safe but Pressure wahoos increasing",
    "Healing tab declining while voice count rising"
  ]
}
```

### Database Migration

**`supabase/migrations/YYYYMMDD_create_zarlo_briefs.sql`**

```sql
create table zarlo_briefs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  brief jsonb not null,
  generated_at timestamptz default now(),
  
  constraint one_brief_per_user unique (user_id)
);

-- RLS: users can read their own brief
alter table zarlo_briefs enable row level security;
create policy "Users read own brief" on zarlo_briefs
  for select using (auth.uid() = user_id);

-- Service role can upsert (edge function runs with service key)
create policy "Service can upsert briefs" on zarlo_briefs
  for all using (true) with check (true);

-- Index for fast lookup
create index idx_zarlo_briefs_user on zarlo_briefs(user_id);
```

### Cron Setup

Follow existing pattern from `supabase/migrations/Sql commands/setup_scheduled_notifications.sql`:

```sql
-- Run daily at 4am UTC (before most users wake up)
select cron.schedule(
  'generate-zarlo-briefs',
  '0 4 * * *',
  $$
  select net.http_post(
    url := 'https://qlwfcfypnoptsocdpxuv.supabase.co/functions/v1/generate-zarlo-brief',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

The Edge Function should iterate over all active users (users with a `nervous_system_checkins` row in the last 14 days) and upsert one brief per user.

### Pattern Detection Logic

The key algorithms in the Edge Function:

**Day-of-week pattern:**
```sql
SELECT 
  EXTRACT(DOW FROM created_at) as day,
  before_state,
  COUNT(*) as count
FROM nervous_system_checkins
WHERE user_id = $1 AND checkin_type = 'daily'
GROUP BY day, before_state
```
Flag any day where a single state is >60% of check-ins for that day.

**Contradiction detection:**
- "Reports Safe but Pressure wahoos increasing": compare last 7 days daily check-in states vs last 7 days wahoo classifications
- "Healing tab declining while voice count rising": compare healing_intentions created_at frequency (last 30d vs first 30d) vs protective voice count trend

**Threshold detection:**
- Voice graduation: dominant voice count >= 4 (one away from 5)
- Streak milestone: current streak within 3 days of 7/14/21/30/60/100
- Stage stuck: days since last stage-relevant action (varies per stage, see spec doc Section 9 Gap 2)

---

## 2B: Zarlo Brief Integration

### What Changes

**File:** `src/lib/zarlo/zarloEngine.js`

In the `getUserContext` function, after all current queries, add one more:

```javascript
// Load pre-computed Zarlo Brief
const { data: briefData } = await supabase
  .from('zarlo_briefs')
  .select('brief')
  .eq('user_id', userId)
  .maybeSingle()
```

Add to the returned context object:

```javascript
zarloBrief: briefData?.brief || null,
```

**File:** `src/lib/zarlo/zarloPageContent.js` (or wherever the system prompt is built)

Add the Brief to Zarlo's system prompt when available:

```javascript
if (userContext.zarloBrief) {
  systemPrompt += `\n\nZARLO BRIEF (pre-computed daily summary of this user's full journey):\n${JSON.stringify(userContext.zarloBrief, null, 2)}\n\nUse this data to notice patterns, name contradictions, and signal approaching thresholds. Be warm but direct. Never shame. Name what you see.`
}
```

### Fallback

If no Brief exists yet (new user, cron hasn't run), Zarlo falls back to the existing context (Sprint 1C voice counting + page context). No breakage.

---

## 2C: Journey Tab Shell

### What Changes

**File:** `src/hooks/useChallengeData.js` (line 138)

```javascript
// Current:
const categories = ['Tune', 'Wahoo', 'Healing', 'Level']

// Change to:
const categories = ['Tune', 'Wahoo', 'Healing', 'Journey', 'Level']
```

**File:** `src/Challenge.jsx`

Add conditional render block:

```jsx
{activeCategory === 'Journey' && (
  <JourneyTab userId={user?.id} />
)}
```

Add import:

```javascript
import JourneyTab from './components/JourneyTab'
```

### New Component

**Create:** `src/components/JourneyTab.jsx`

V1 shell — displays hero stage progress and interim milestones:

```jsx
// JourneyTab — hero's journey progress + interim milestones
// 
// Sections:
// 1. Current stage name + feeling target
// 2. Progress toward next graduation (if applicable)
// 3. Protective voice count (Stage 6→7 only)
// 4. Chapter count (session attendance, future)
//
// Data sources:
// - user_stage_progress (hero stage)
// - healing_intentions (voice counts)
// - zarlo_briefs (thresholds, patterns)
```

Keep it minimal for V1. The Journey tab is a CONTAINER that will grow as more features are built (graduation celebrations, stuck mechanics, insight drops). Start with:

- Hero stage number + name + feeling target
- If Stage 6→7: protective voice count dots (●●●○○)
- If brief exists: any approaching thresholds shown as gentle text

### CSS

**Create:** `src/components/JourneyTab.css`

Follow existing tab content styling (light background, purple/gold accents, `.jt-` prefix for scoping).

---

## 2D: Stage 6→7 Interim Milestones

### What Changes

This builds on Sprint 1C (voice counting) and the Journey tab (2C).

**In `JourneyTab.jsx`:**

Query protective voice counts (same query Sprint 1C added to zarloEngine):

```javascript
const { data: voiceData } = await supabase
  .from('healing_intentions')
  .select('protective_voice')
  .eq('user_id', userId)
  .not('protective_voice', 'is', null)

// Count + find dominant
const counts = {}
voiceData?.forEach(row => {
  if (row.protective_voice) {
    counts[row.protective_voice] = (counts[row.protective_voice] || 0) + 1
  }
})
const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
const dominant = sorted[0] // [name, count]
```

Display as dots:

```jsx
{dominant && (
  <div className="jt-voice-progress">
    <p className="jt-voice-label">Pattern Recognition</p>
    <div className="jt-voice-dots">
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={`jt-dot ${i <= dominant[1] ? 'filled' : ''}`} />
      ))}
    </div>
    <p className="jt-voice-hint">
      {dominant[1] < 3 && `${dominant[1]} of 5 patterns identified`}
      {dominant[1] === 3 && `The ${dominant[0]} keeps showing up. That's three times now.`}
      {dominant[1] === 4 && `Four times. There's something underneath it.`}
      {dominant[1] >= 5 && `The ${dominant[0]}. Five times. You're ready to see the root.`}
    </p>
  </div>
)}
```

---

## Build Sequence

```
Day 1-2: Edge Function (2A)
  - Write migration for zarlo_briefs table
  - Build Edge Function with all 10 queries + pattern detection
  - Test with manual invocation
  - Set up pg_cron schedule

Day 3: Integration (2B)
  - Wire Brief into zarloEngine getUserContext
  - Add Brief to Zarlo system prompt
  - Test: does Zarlo reference patterns from the Brief?

Day 4: Journey Tab (2C)
  - Add tab to categories array
  - Build JourneyTab shell component
  - Display hero stage + feeling target

Day 5: Milestones (2D)
  - Add voice count dots to Journey tab
  - Add threshold hints from Brief
  - Test full flow: healing flow → voice count increases → Journey tab updates → Zarlo references it
```

---

## Success Metrics

| Metric | How to Measure |
|---|---|
| Zarlo Brief generates without error | Edge Function logs, daily cron check |
| Zarlo references Brief data in conversation | Manual test: does Zarlo mention patterns? |
| Journey tab renders correctly | Visual QA at each hero stage |
| Voice count dots update after healing flow | Functional test: complete healing flow, check dots |

**North star (same as Sprint 1):** % of life paths trending toward Vibe Rise state.

---

*Depends on: Sprint 1 (committed). No other blockers.*
*Next: Sprint 3 (graduation celebrations, insight drop cards, stuck mechanics) — write plan after Sprint 2 learnings.*
