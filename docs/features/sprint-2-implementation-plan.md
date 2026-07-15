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

### Invocation Strategy

Supabase Edge Functions have a 150s timeout. Querying ALL users in one invocation will timeout at scale. Use the existing pattern from `score-league-matchups`: the cron calls the function once, the function fetches a batch of user IDs and processes them.

```typescript
// 1. Fetch active users (had a checkin in last 14 days)
const { data: activeUsers } = await supabase
  .from('nervous_system_checkins')
  .select('user_id')
  .gte('created_at', new Date(Date.now() - 14 * 86400000).toISOString())
  .order('user_id')

const uniqueUserIds = [...new Set(activeUsers.map(r => r.user_id))]

// 2. Process each user (10 queries per user, each fast with index)
for (const userId of uniqueUserIds) {
  try {
    const brief = await generateBriefForUser(userId)
    await supabase.from('zarlo_briefs').upsert(
      { user_id: userId, brief, generated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
  } catch (e) {
    console.error(`Brief failed for ${userId}:`, e)
    // Skip and continue — one user's failure shouldn't block others
  }
}
```

At <100 active users (current scale), this completes in <30s. At 1,000+ users, split into batched invocations.

### New Users / Insufficient Data

If a user has <3 days of data, the Brief should still generate but with empty/null pattern fields. The Brief structure uses `null` for undetectable patterns, not errors. Zarlo's prompt handles null gracefully ("no patterns detected yet").

### Pattern Detection Logic (Exact Algorithms)

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
Flag any day where a single state is >60% of check-ins for that day AND has at least 3 data points for that day.

**Contradiction detection (exact logic):**
```javascript
// Contradiction 1: "Reports Safe but Pressure wahoos increasing"
const last14dCheckins = checkins.filter(c => c.checkin_type === 'daily' && withinDays(c, 14))
const safePct = last14dCheckins.filter(c => c.before_state === 'ventral').length / last14dCheckins.length
const last14dWahoos = wahoos.filter(w => withinDays(w, 14))
const pressurePct = last14dWahoos.filter(w => w.wahoo_classification === 'anxious').length / last14dWahoos.length
if (safePct > 0.5 && pressurePct > 0.3) {
  contradictions.push('Reports Safe but Pressure wahoos increasing')
}

// Contradiction 2: "Healing tab declining while voice count rising"
const healingLast30 = healingIntentions.filter(h => withinDays(h, 30)).length
const healingFirst30 = healingIntentions.filter(h => withinDays(h, 30, 60)).length
if (healingFirst30 > 0 && healingLast30 < healingFirst30 * 0.5 && dominantVoiceCount >= 3) {
  contradictions.push('Healing tab declining while protective voice count rising')
}
```

**Threshold detection (exact logic):**
```javascript
// Voice graduation
const voiceCountToGraduate = Math.max(0, 5 - dominantVoiceCount)
const voiceGraduationReady = voiceCountToGraduate === 0

// Streak milestone  
const MILESTONES = [7, 14, 21, 30, 60, 100, 200, 365]
const nextMilestone = MILESTONES.find(m => m > currentStreak)
const streakMilestoneApproaching = nextMilestone && (nextMilestone - currentStreak) <= 3
  ? `${nextMilestone}_day` : null

// Stage stuck (days since last stage-relevant action)
const STUCK_THRESHOLDS = { 4: 7, 5: 7, 6: 7, 7: 7, 8: 14, 9: 14 }
const threshold = STUCK_THRESHOLDS[heroStage] || 14
const daysSinceLastProgress = /* days since last quest_completion, healing_intention, or stage change */
const stageStuckDays = daysSinceLastProgress > threshold ? daysSinceLastProgress : 0
```

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
**Create:** `src/components/JourneyTab.css`

```jsx
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import './JourneyTab.css'

// Hero stage names + feeling targets (from measurement framework)
const HERO_STAGES = [
  { stage: 0, name: 'Not Started', feeling: '' },
  { stage: 1, name: 'The Matrix', feeling: 'Something just shifted. I can\'t go back.' },
  { stage: 2, name: 'The Earthquake', feeling: 'Something just shifted. I can\'t go back.' },
  { stage: 3, name: 'Head Full of Dreams', feeling: 'I can see it but I can\'t reach it.' },
  { stage: 4, name: 'Mirror / Mentor', feeling: 'I feel so seen. I have words for this now.' },
  { stage: 5, name: 'First Vibe Rise', feeling: 'I didn\'t know I could feel this alive.' },
  { stage: 6, name: 'The Daily Loop', feeling: 'I\'m actually doing it. Every day.' },
  { stage: 7, name: 'Pattern Revealed', feeling: 'That\'s what\'s been stopping me.' },
  { stage: 8, name: 'The Ordeal', feeling: 'That hurt. But something released.' },
  { stage: 9, name: 'Flow Statement', feeling: 'Of course. This was always my path.' },
  { stage: 10, name: 'Aligned Action', feeling: 'I\'m doing the thing. For real.' },
]

export default function JourneyTab({ userId }) {
  const [heroStage, setHeroStage] = useState(0)
  const [voiceCounts, setVoiceCounts] = useState({})
  const [brief, setBrief] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    Promise.all([
      supabase.from('user_stage_progress')
        .select('current_journey_level')
        .eq('user_id', userId).maybeSingle(),
      supabase.from('healing_intentions')
        .select('protective_voice')
        .eq('user_id', userId)
        .not('protective_voice', 'is', null),
      supabase.from('zarlo_briefs')
        .select('brief')
        .eq('user_id', userId).maybeSingle(),
    ]).then(([stageRes, voiceRes, briefRes]) => {
      setHeroStage(stageRes.data?.current_journey_level || 0)
      
      const counts = {}
      voiceRes.data?.forEach(row => {
        if (row.protective_voice)
          counts[row.protective_voice] = (counts[row.protective_voice] || 0) + 1
      })
      setVoiceCounts(counts)
      setBrief(briefRes.data?.brief || null)
      setLoading(false)
    })
  }, [userId])

  if (loading) return <div className="jt-loading">Loading journey...</div>

  const stageInfo = HERO_STAGES[heroStage] || HERO_STAGES[0]
  const sorted = Object.entries(voiceCounts).sort((a, b) => b[1] - a[1])
  const dominant = sorted[0] // [name, count] or undefined

  return (
    <div className="jt-container">
      {/* Current Stage */}
      <div className="jt-stage-card">
        <div className="jt-stage-number">Stage {heroStage}</div>
        <h2 className="jt-stage-name">{stageInfo.name}</h2>
        {stageInfo.feeling && (
          <p className="jt-stage-feeling">"{stageInfo.feeling}"</p>
        )}
      </div>

      {/* Voice Progress (Stage 6→7 only) */}
      {heroStage >= 5 && heroStage < 7 && dominant && (
        <div className="jt-section">
          <h3 className="jt-section-title">Pattern Recognition</h3>
          <div className="jt-voice-dots">
            {[1, 2, 3, 4, 5].map(i => (
              <span key={i} className={`jt-dot ${i <= dominant[1] ? 'jt-dot-filled' : ''}`} />
            ))}
          </div>
          <p className="jt-voice-hint">
            {dominant[1] < 3 && `${dominant[1]} of 5 patterns identified`}
            {dominant[1] === 3 && `The ${formatVoice(dominant[0])} keeps showing up.`}
            {dominant[1] === 4 && `Four times. There's something underneath it.`}
            {dominant[1] >= 5 && `The ${formatVoice(dominant[0])}. Five times. You're ready.`}
          </p>
        </div>
      )}

      {/* Approaching Thresholds (from Zarlo Brief) */}
      {brief?.thresholds?.streak_milestone_approaching && (
        <div className="jt-section">
          <p className="jt-threshold-hint">
            Streak milestone approaching: {brief.thresholds.streak_milestone_approaching.replace('_', '-')}
          </p>
        </div>
      )}
    </div>
  )
}

function formatVoice(name) {
  return name?.charAt(0).toUpperCase() + name?.slice(1).replace(/_/g, ' ')
}
```

**CSS (`JourneyTab.css`):** Light background, purple/gold accents, `.jt-` prefix. Stage card centered, feeling target in italic purple. Voice dots as 12px circles (filled = purple, empty = light grey border). Follow existing tab content patterns from TuneTab/PlayListTab.

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

---

## Testing Checklist (Post-Deploy)

### Journey Tab (visual QA)
- [ ] Navigate to `/7-day-challenge?tab=journey` — does the tab render?
- [ ] Stage card shows correct hero stage number + name
- [ ] Feeling target text displays in italic purple
- [ ] If user is Stage 5-6: voice dots appear with correct fill count
- [ ] Voice hint text matches count (1-2: "X of 5 patterns", 3: "keeps showing up", 4: "underneath it", 5: "ready to see the root")
- [ ] If user has no healing_intentions data: voice section hidden (no error)
- [ ] Tab switching (Journey → Tune → Journey) works without re-fetching or errors
- [ ] Mobile responsive: card doesn't overflow on small screens

### Zarlo Brief (functional QA — after migration + deploy + cron)
- [ ] Invoke Edge Function manually: `curl -X POST https://qlwfcfypnoptsocdpxuv.supabase.co/functions/v1/generate-zarlo-brief -H "Authorization: Bearer [SERVICE_ROLE_KEY]"` — returns 200
- [ ] Check `zarlo_briefs` table has a row for your user with populated JSON
- [ ] Brief JSON structure matches spec: `current_state`, `patterns`, `convergence`, `thresholds`, `contradictions`
- [ ] Open Zarlo chat — does it reference any Brief data? (e.g. voice counts, patterns)
- [ ] New user with <3 days data: Brief generates with null patterns (not error)

### Zarlo Proactive Bubble (Sprint 1C — verify still working)
- [ ] User with protective_voice count >= 3: notification dot appears on Zarlo FAB
- [ ] Tapping bubble opens Zarlo chat
- [ ] Dismissing bubble clears notification dot
- [ ] Bubble doesn't reappear for same threshold (localStorage check)

### Post-Wahoo Responses (Sprint 1A — verify still working)
- [ ] Complete a wahoo, select Vibe Rise: gold confetti + essence callout + identity prompt
- [ ] Complete a wahoo, select Fun: purple confetti + "That landed. Good." + identity prompt
- [ ] Complete a wahoo, select Pressure: no confetti + "The voice told you to stop" + voice capture input
- [ ] Complete a wahoo, select Uninterested: no confetti + "This one didn't land" + no input
- [ ] Check `quest_completions` table: Vibe Rise/Pressure = 10 RP, Fun = 7 RP, Uninterested = 9 RP

### Daily Check-in RP (Sprint 1B — verify still working)
- [ ] Complete daily check-in (any state): check `quest_completions` for `daily_checkin_YYYY-MM-DD` row with 2 points
- [ ] Complete check-in again same day: no duplicate row (catch block handles gracefully)

### Dead Code Removal (regression)
- [ ] `/7-day-challenge` page loads normally (all tabs work)
- [ ] Wahoo completion via QuestBoardCard still works (GroanCompletionModal path)
- [ ] Wahoo completion via PlayListTab still works
- [ ] `/groan-matrix` route still loads (GroanMatrix component not removed, only Challenge.jsx import)

---

*Depends on: Sprint 1 (committed). No other blockers.*
*Next: Sprint 3 (graduation celebrations, insight drop cards, stuck mechanics) — write plan after Sprint 2 learnings.*
