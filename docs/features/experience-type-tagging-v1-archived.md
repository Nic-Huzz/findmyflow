# Experience Type Tagging + NS State Reporting

*Created: July 18 2026. Status: Spec ready, not started.*

## The Insight

A quest like "Dance Events" contains many TYPES of work: performing (hosting discos), marketing (posting reels), outreach (sales calls), building (creating apps). Each type triggers a different nervous system state. The quest isn't uniformly "Vibe Rise" or "Pressure". The experience type determines the state.

**From Huzz's real data:**
- Performing tasks (hosting, DJing, dancing) → mostly Vibe Rise
- Marketing tasks (posting, sharing, reels) → mostly Fun
- Outreach tasks (sales calls, cold reach outs) → mostly Pressure
- Building tasks (coding, frameworks, apps) → mostly Fun

**The product insight:** If we auto-tag tasks by experience type and track NS state per type, we can tell users: "Your performing tasks are 90% Vibe Rise. Your outreach tasks are 100% Pressure. Consider delegating outreach."

## What Changes

### 1. New column: `experience_type` on `quest_tasks`

```sql
ALTER TABLE quest_tasks ADD COLUMN experience_type text;
```

Values: `performing` | `creating` | `marketing` | `outreach` | `learning` | `admin`

| Type | Signal Words | Example Tasks |
|------|-------------|---------------|
| `performing` | host, perform, facilitate, DJ, present, lead, run (event), dance | "Host silent disco", "Lead breathwork session" |
| `creating` | build, create, design, write, develop, make, compose, record | "Build landing page", "Create coaching framework" |
| `marketing` | post, share, film, reel, content, promote, publish, launch | "Post reel about events", "Share workshop on socials" |
| `outreach` | call, email, reach out, pitch, message, contact, sell, DM | "Sales calls for Sprouter", "100 reach outs" |
| `learning` | learn, train, study, course, read, practice (solo), research | "Breathwork training", "Study polyvagal theory" |
| `admin` | buy, book, set up, organise, plan, schedule, update, fix | "Buy 100 headsets", "Book venue" |

Note: `task_signal` column already exists for post-completion feel (lit_me_up/was_okay/bored). `experience_type` is separate: it's the TYPE of work, set at creation, not a reaction.

### 2. Auto-classify on task creation

**Option A: Client-side keyword classifier (fast, free)**

Simple prefix-matching in `questSkillTagger.js`:

```javascript
export function classifyExperienceType(taskText) {
  const t = taskText.toLowerCase()
  if (/\b(host|perform|facilitat|dj|present|lead|danc|sing|run\s+(event|session|workshop))/.test(t)) return 'performing'
  if (/\b(call|email|reach\s*out|pitch|messag|contact|sell|dm|cold)/.test(t)) return 'outreach'
  if (/\b(post|share|film|reel|content|promot|publish|launch|social)/.test(t)) return 'marketing'
  if (/\b(build|creat|design|writ|develop|mak|code|compos|record)/.test(t)) return 'creating'
  if (/\b(learn|train|stud|course|read|research|practic)/.test(t)) return 'learning'
  if (/\b(buy|book|set\s*up|organis|plan|schedul|updat|fix|admin)/.test(t)) return 'admin'
  return null // unclassified
}
```

**Option B: AI classifier via edge function (accurate, costs ~$0.001/call)**

Extend `classify-quest-skills` or create new `classify-task-type`:

```
Given a task description for a life quest, classify it into ONE experience type:
- performing: live facilitation, hosting, presenting, dancing, leading groups
- creating: building something new (apps, frameworks, programs, art)
- marketing: content creation, posting, sharing, filming for audience
- outreach: direct 1:1 contact (calls, emails, pitches, DMs)
- learning: studying, training, courses, solo practice
- admin: logistics, purchasing, scheduling, setup

Task: "{taskText}"
Quest: "{questLabel}"

Return JSON: { "experience_type": "..." }
```

**Recommendation: Option A for v1, Option B as upgrade.** The keyword classifier handles 90% of cases. Fallback to AI for ambiguous text. Cost of being wrong is low (user can correct).

### 3. Input placeholder hint

In `QuestBoardCard.jsx` task input (line 388), rotate action-first placeholders:

```javascript
const TASK_PLACEHOLDERS = [
  "Host a session...",
  "Post content about...",
  "Call 5 potential...",
  "Build the page for...",
  "Learn about...",
]
```

Below the input, show a subtle hint:
```
Tip: start with what you'll DO (host, post, call, build)
```

This naturally produces text the classifier can tag accurately.

### 4. Conditional NS state question on task completion

Currently:
- **Courage challenges** → full GroanCompletionModal (4-state wahoo + identity + expectation)
- **Regular tasks** → 3-state signal (🔥 Lit me up | 😐 Was okay | 😴 Bored)

Change: for regular tasks with `experience_type` in `['performing', 'outreach', 'marketing']`, show the **4-state NS question** instead of the 3-state signal. These are the types where the state data is diagnostically valuable.

For `learning`, `admin`, `creating` → keep the existing 3-state signal (or skip). These are less NS-informative.

**Implementation in `QuestBoardCard.jsx`:**

```javascript
// After task completion (line ~199)
const MEANINGFUL_TYPES = ['performing', 'outreach', 'marketing']

if (task.is_courage_challenge) {
  // existing: open GroanCompletionModal
} else if (MEANINGFUL_TYPES.includes(task.experience_type)) {
  // NEW: show inline 4-state wahoo question
  setWahooPromptTask(task)
} else {
  // existing: show signal prompt (lit_me_up / was_okay / bored)
}
```

The inline 4-state prompt is lighter than GroanCompletionModal. Just the 4 buttons (Vibe Rise / Fun / Pressure / Uninterested), save to `task_signal` mapped as:
- vibe → 'lit_me_up'
- peace → 'was_okay'  
- anxious → 'pressure' (new value)
- shutdown → 'bored'

Or better: save the wahoo_classification directly to a new `wahoo_classification` column on `quest_tasks` so we don't conflate the two systems.

```sql
ALTER TABLE quest_tasks ADD COLUMN wahoo_classification text;
-- Values: 'vibe' | 'peace' | 'anxious' | 'shutdown'
```

### 5. Reporting UI on quest detail view

On the FocusSVG slide in QuestPathMap (or a new section in QuestBoardCard), show per-type breakdown:

```
Experience Type Breakdown
─────────────────────────
⚡ Performing (5 tasks)   ████████░░ 80% Vibe Rise
📣 Marketing (4 tasks)    ██████░░░░ 60% Fun, 40% Pressure  
📞 Outreach (2 tasks)     ██████████ 100% Pressure
🔨 Creating (3 tasks)     ████████░░ 80% Fun

💡 Your performing work is your Zone of Genius.
   Consider delegating outreach.
```

This only shows once a quest has 5+ completed tasks with wahoo data.

**Data query:**

```sql
SELECT 
  qt.experience_type,
  COALESCE(qt.wahoo_classification, 
    CASE qt.task_signal
      WHEN 'lit_me_up' THEN 'vibe'
      WHEN 'was_okay' THEN 'peace'
      WHEN 'bored' THEN 'shutdown'
    END
  ) as state,
  COUNT(*) as count
FROM quest_tasks qt
WHERE qt.quest_id = $1
  AND qt.done = true
  AND qt.experience_type IS NOT NULL
  AND (qt.wahoo_classification IS NOT NULL OR qt.task_signal IS NOT NULL)
GROUP BY qt.experience_type, state
ORDER BY qt.experience_type;
```

### 6. Rolling average integration

The dynamic state lines on QuestPathMap already use wahoo_classification from `quest_completions.reflection_text`. To include regular task wahoo data:

In the `wahooStates` fetch in QuestPathMap.jsx, also query `quest_tasks.wahoo_classification` for non-courage tasks that have it. The rolling average then includes ALL tasks, not just courage challenges.

## Build Sequence

### Sprint 1: Tag + Hint (1 hour)
1. Migration: `ALTER TABLE quest_tasks ADD COLUMN experience_type text;`
2. Client-side classifier function in `questSkillTagger.js`
3. Call classifier on task creation in `QuestBoardCard.jsx`
4. Input placeholder rotation + "start with action" hint
5. Backfill existing tasks: run classifier on all existing quest_tasks

### Sprint 2: Conditional NS Question (1 hour)
1. Migration: `ALTER TABLE quest_tasks ADD COLUMN wahoo_classification text;`
2. Inline 4-state prompt component (lighter than GroanCompletionModal)
3. Wire into QuestBoardCard completion flow for meaningful types
4. Save wahoo_classification to quest_tasks

### Sprint 3: Reporting (1 hour)
1. Experience type breakdown component
2. Add to QuestBoardCard (below progress, above task list)
3. "Zone of Genius" / "Consider delegating" insight generation
4. Only show with 5+ completed + classified tasks

### Sprint 4: Rolling Average Integration (30 min)
1. Include quest_tasks.wahoo_classification in QuestPathMap data fetch
2. Non-courage tasks feed the rolling average line
3. Ghost dots for regular tasks (smaller, no ⚡ badge)

## Files to Touch

| File | Change |
|------|--------|
| `supabase/migrations/new` | Add experience_type + wahoo_classification columns |
| `src/lib/questSkillTagger.js` | Add `classifyExperienceType()` function |
| `src/components/QuestBoardCard.jsx` | Auto-tag on creation, conditional NS prompt, reporting UI |
| `src/components/level/QuestPathMap.jsx` | Include regular task wahoo in rolling average |
| `src/components/level/LevelTab.jsx` | Pass experience_type to QuestBoardCard if needed |

## Edge Cases

- **Ambiguous tasks** ("Practice breathwork"): could be learning OR performing. Classifier picks learning (solo practice). User can correct via tap-to-change on the type badge.
- **Tasks with no type**: Shown in reporting as "Other". Don't ask NS question.
- **Retroactive classification**: Sprint 1 backfill runs classifier on all existing quest_tasks. Won't have wahoo data for completed ones, but future completions will.
- **Cross-pollination**: Merge challenges inherit experience_type from the source task.
