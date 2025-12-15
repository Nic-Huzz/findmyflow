# 7-Day Challenge System Documentation

> **Purpose**: This document describes how the 7-day challenge gamification system works in FindMyFlow. Use this as the source of truth when making changes.

---

## Overview

The 7-day challenge is the core gamification engine that drives user engagement and stage progression. Users complete daily/weekly quests organized into categories, earn points, and must complete a 7-day streak to graduate to the next stage.

**Key Principle**: A 7-day challenge streak is **mandatory** for graduating to the next stage across all personas.

---

## Personas & Stages

### Persona Progression

| Persona | Stages | Description |
|---------|--------|-------------|
| **Vibe Seeker** | `clarity` | Exploring, finding direction |
| **Vibe Riser** | `validation` → `creation` → `testing` → `launch` | Building first product |
| **Movement Maker** | `ideation` → `creation` → `launch` | Scaling a business |

### Stage Graduation Flow

```
vibe_seeker (clarity)
    ↓ graduates → switches persona
vibe_riser (validation → creation → testing → launch)
    ↓ graduates → switches persona
movement_maker (ideation → creation → launch)
```

**Important**: When a user graduates to a new stage:
1. Their active challenge is **archived** (status = 'completed')
2. A **new challenge starts** automatically with new stage-appropriate quests
3. Points and streak reset for the new stage

---

## Quest Categories

| Category | Type | Description |
|----------|------|-------------|
| **Flow Finder** | Stage-specific | Flows and milestones for progression (persona/stage filtered) |
| **Daily** | Recurring | Daily practices (Recognise, Release, Rewire, Reconnect) |
| **Weekly** | Recurring | Weekly deep-work tasks |
| **Tracker** | Non-blocking | Flow Compass direction logging |
| **Bonus** | Optional | Extra challenges for bonus points |

### The 4 R's (Daily/Weekly Quest Types)

| R Type | Purpose | Examples |
|--------|---------|----------|
| **Recognise** | Awareness building | Essence Voice, Protective Voice, Frequency tracking |
| **Release** | Emotional processing | Daily release, Big Release sessions |
| **Rewire** | Behavior change | Dopamine diet, Future successful you |
| **Reconnect** | Self-connection | Meditation, Breathwork, Prayer |

---

## Quest Filtering Rules

### CRITICAL: Quests are filtered by persona AND stage

```javascript
// Quest is shown only if:
// 1. No persona_specific set, OR user's persona matches
// 2. No stage_required set, OR user's stage matches

if (quest.persona_specific) {
  // Must match user's persona (e.g., ["vibe_seeker"])
}
if (quest.stage_required) {
  // Must match user's current stage (e.g., "clarity")
}
```

### Flow Finder Visibility

| Persona | Flow Finder Quests Visible |
|---------|---------------------------|
| Vibe Seeker | Skills, Problems, Persona, Integration flows |
| Vibe Riser | Persona Validation, $100M Offer, Lead Magnet, etc. |
| Movement Maker | Money Model Guide, Attraction/Upsell/Downsell/Continuity offers |

**Flow Finder flows (Skills, Problems, Persona, Integration) are ONLY for Vibe Seekers.** They should be completely hidden for other personas.

---

## Database Schema

### Core Tables

#### `challenge_progress`
Tracks active/completed challenge instances per user.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | FK to auth.users |
| `challenge_instance_id` | uuid | Unique ID for this challenge instance |
| `status` | text | 'active' or 'completed' |
| `current_day` | int | Current day (0-7), advances on new calendar day |
| `challenge_start_date` | timestamp | When challenge started |
| `last_active_date` | timestamp | Last activity (for day advancement) |
| `total_points` | int | Sum of all points earned |
| `streak_days` | int | Current consecutive day streak |
| `longest_streak` | int | Max streak achieved (used for graduation) |
| `persona` | text | Persona when challenge started (set by startChallenge) |
| `current_stage` | text | Stage when challenge started (set by startChallenge) |
| `{category}_{daily/weekly}_points` | int | Category-specific points (recognise, release, rewire, reconnect only) |
| `group_id` | uuid | Optional FK to challenge_groups |

#### `quest_completions`
Records each completed quest within a challenge.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | FK to auth.users |
| `challenge_instance_id` | uuid | FK to challenge_progress |
| `quest_id` | text | Quest identifier from JSON |
| `quest_category` | text | Category (Flow Finder, Daily, Weekly, etc.) |
| `quest_type` | text | Type (Recognise, Release, etc.) |
| `points_earned` | int | Points for this completion |
| `challenge_day` | int | Day when completed |
| `reflection_text` | text | User's input/reflection |
| `completed_at` | timestamp | Completion timestamp |

#### `user_stage_progress`
Source of truth for user's current persona and stage.

| Column | Type | Description |
|--------|------|-------------|
| `user_id` | uuid | PK, FK to auth.users |
| `persona` | text | Current persona (vibe_seeker, vibe_riser, movement_maker) |
| `current_stage` | text | Current stage within persona |
| `conversations_logged` | int | Count for graduation requirement |
| `default_project_id` | uuid | Default project for Flow Compass |

#### `milestone_completions`
Tracks completed milestones for graduation.

| Column | Type | Description |
|--------|------|-------------|
| `user_id` | uuid | FK to auth.users |
| `milestone_id` | text | Milestone identifier |
| `persona` | text | Persona when completed (for filtering) |
| `stage` | text | Stage when completed |
| `evidence_text` | text | User's description/proof |

**Note**: Unique constraint on (user_id, milestone_id) prevents duplicate milestone claims.

---

## Points System

### How Points Are Calculated

1. **Per-quest points**: Defined in `challengeQuestsUpdate.json`
2. **Total points**: Stored in `challenge_progress.total_points`
3. **Category points**:
   - Recognise/Release/Rewire/Reconnect have dedicated columns
   - Flow Finder/Tracker/Bonus calculated from `quest_completions`

### Point Ranges

| Quest Type | Points |
|------------|--------|
| Daily quests | 3-7 pts |
| Weekly quests | 15-30 pts |
| Flow Finder flows | 30-40 pts |
| Milestones | 10-40 pts |

### CRITICAL: Points Must Be Filtered by Persona/Stage

When displaying points, ONLY count completions for quests valid for current persona/stage:

```javascript
// Get valid quest IDs for current persona/stage
const validQuestIds = getValidQuestIds(category)

// Filter completions
const categoryCompletions = completions.filter(c =>
  c.quest_category === category && validQuestIds.includes(c.quest_id)
)
```

This prevents points from a previous stage bleeding into the current stage display.

---

## Streak System

### How Streaks Work

1. **Increment once per calendar day** (not 24-hour period)
2. First quest completion of the day increments `streak_days`
3. Streak breaks if **2+ calendar days** without activity
4. `longest_streak` tracks the maximum ever achieved

### Streak Logic (`streakTracking.js`)

```javascript
// On quest completion:
if (isFirstCompletionToday) {
  streak_days += 1
  longest_streak = max(streak_days, longest_streak)
}

// On page load:
if (daysSinceLastActive >= 2) {
  streak_days = 0  // Streak broken
}
```

### Graduation Uses Maximum Streak (Per Challenge)

Graduation checks use `longest_streak` from the **active challenge**, not current `streak_days`. Once a user achieves a 7-day streak within a challenge, they can graduate even if the streak later resets.

**Important:** Each new challenge resets the streak. When a user graduates and starts a new stage, they need a fresh 7-day streak for that new stage.

---

## Quest Input Types

| inputType | Behavior | Handler |
|-----------|----------|---------|
| `text` | Free-form text input | Direct save to reflection_text |
| `checkbox` | Simple completion toggle | May have milestone_type for milestone tracking |
| `milestone` | Structured milestone input | `handleMilestoneCompletion()` |
| `conversation_log` | Log customer/mentor chat | `handleConversationLogCompletion()` |
| `flow_compass` | Direction logging (N/E/S/W) | `handleFlowCompassCompletion()` |
| `flow` | Link to AI flow | Completion tracked via flow page |

### Checkbox with milestone_type

When `inputType === 'checkbox'` AND `milestone_type` is set:
- Creates quest_completion record
- ALSO creates milestone_completion record
- Important for graduation tracking

---

## Graduation Requirements

### Per-Stage Requirements

Defined in `src/lib/personaStages.js`:

```javascript
{
  flows_required: ['flow_id_1', 'flow_id_2'],  // Must complete these flows
  milestones: ['milestone_1', 'milestone_2'],   // Must complete these milestones
  challenge_streak: 7,                          // Must achieve 7-day streak
  conversations_required: 3                     // Optional: logged conversations
}
```

### Groan Challenge

- **Required for every stage graduation**
- Must be completed **within the current 7-day challenge** (not carried over from previous challenges)
- Defined as milestone: `groan_challenge_completed`
- Validation: `milestone_completions.created_at` must be >= `challenge_progress.challenge_start_date`

### Graduation Check Flow

1. User navigates to graduation page
2. `graduation-check` edge function verifies:
   - All required flows completed (check `flow_sessions`)
   - All required milestones achieved (check `milestone_completions`, filtered by persona)
   - 7-day streak achieved (check `challenge_progress.longest_streak`)
3. If all pass → graduation executes:
   - Insert into `stage_graduations`
   - Update `user_stage_progress` to next stage
   - Archive current challenge (status = 'completed')
   - Special: Vibe Seeker graduating → switches persona to Vibe Riser

---

## Auto-Completion Logic

### Flow Finder Sync (`syncFlowFinderWithChallenge`)

When a user completes a Flow Finder flow (Skills, Problems, Persona, Integration):

1. Check user has active challenge
2. **Verify user's persona/stage matches quest requirements**
3. Check not already completed in this challenge
4. Create quest_completion record
5. Update challenge_progress.total_points

**CRITICAL**: Only create completion if quest is valid for user's persona/stage. Flow Finder flows are ONLY for `vibe_seeker` in `clarity` stage.

---

## Day Advancement

### How Days Advance

```javascript
// On page load:
const daysSinceLastActive = floor((today - lastActiveDate) / msPerDay)

if (daysSinceLastActive >= 1 && current_day < 7) {
  current_day = min(current_day + daysSinceLastActive, 7)
  last_active_date = now
}
```

- Days advance based on **calendar days**, not 24-hour periods
- Maximum day is 7 (challenge is 7 days)
- Day 0 → Day 1 happens on first activity

---

## Duplicate Prevention

### Per-Day Quests (Daily/Weekly)

```javascript
// Check if completed TODAY
.gte('completed_at', `${todayDate}T00:00:00.000Z`)
.lte('completed_at', `${todayDate}T23:59:59.999Z`)
```

### Milestone Quests (One-time)

```javascript
// Check if EVER completed in this challenge (no date filter)
.eq('quest_id', quest.id)
.eq('challenge_instance_id', challengeInstanceId)
```

---

## Key Files

| File | Purpose |
|------|---------|
| `src/Challenge.jsx` | Main challenge page component |
| `src/Challenge.css` | Challenge styling |
| `src/lib/streakTracking.js` | Streak increment/break logic |
| `src/lib/questCompletion.js` | Auto-complete flows as quests |
| `src/lib/questCompletionHelpers.js` | Handlers for special input types |
| `src/lib/personaStages.js` | Stage definitions & graduation requirements |
| `src/lib/graduationChecker.js` | Eligibility checks |
| `supabase/functions/graduation-check/` | Graduation edge function |
| `public/challengeQuestsUpdate.json` | Quest definitions |

---

## Common Bugs to Avoid

### 1. Points from wrong persona/stage

**Problem**: User sees points from quests completed in a previous stage.

**Solution**: Always filter completions by valid quest IDs for current persona/stage:
```javascript
const validQuestIds = getValidQuestIds(category)
const filtered = completions.filter(c => validQuestIds.includes(c.quest_id))
```

### 2. Milestones not saving for checkbox quests

**Problem**: Checkbox quests with `milestone_type` don't save to `milestone_completions`.

**Solution**: In `handleQuestComplete`, check for `milestone_type` even when `inputType === 'checkbox'`:
```javascript
if (quest.inputType === 'checkbox' && quest.milestone_type) {
  await handleMilestoneCompletion(...)
}
```

### 3. Auto-completion ignoring persona/stage

**Problem**: `syncFlowFinderWithChallenge` creates completions for wrong persona.

**Solution**: Check user's persona/stage before creating completion:
```javascript
if (userPersona !== requiredPersona) {
  return { skipped: true, reason: 'Quest not valid for user persona' }
}
```

### 4. Undefined variables in success messages

**Problem**: `artifactUnlocked` used without being defined.

**Solution**: Always define variables before using:
```javascript
const categoryArtifact = challengeData?.artifacts?.find(a => a.category === quest.category)
const artifactUnlocked = categoryArtifact && checkArtifactUnlock(...)
```

---

## Testing Checklist

When modifying the challenge system, verify:

- [ ] Quest filtering respects persona AND stage
- [ ] Points only count for valid quests
- [ ] Streak increments correctly (once per calendar day)
- [ ] Milestones save for checkbox quests with `milestone_type`
- [ ] Auto-completion checks persona/stage before creating
- [ ] Graduation requirements work for each persona/stage
- [ ] Day advancement works across calendar days
- [ ] Duplicate prevention works (daily vs milestone quests)

---

## Database Queries for Debugging

```bash
# Check user's current persona/stage
./scripts/db-query.sh user_stage_progress "*" "user_id=eq.{USER_ID}"

# Check active challenge
./scripts/db-query.sh challenge_progress "*" "user_id=eq.{USER_ID}&status=eq.active"

# Check quest completions for a challenge
./scripts/db-query.sh quest_completions "*" "challenge_instance_id=eq.{CHALLENGE_ID}&order=completed_at.desc"

# Check milestone completions
./scripts/db-query.sh milestone_completions "*" "user_id=eq.{USER_ID}"
```

---

*Last updated: December 2024*
