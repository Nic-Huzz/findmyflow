# Scoring System Refactor Plan

**Created:** January 25, 2025
**Updated:** February 3, 2025
**Status:** Implemented (with bug fixes)
**Priority:** High

## Problem Statement

The current 7-day challenge has **redundant point storage**:
- `challenge_progress.total_points` - Points in current challenge
- `user_projects.total_points` - Project-level points

These are kept in sync with the same value, which:
1. Creates data drift risk if one update fails
2. Is unclear semantically (are they supposed to be different?)
3. Doesn't provide meaningful category breakdowns

## Solution: Fantasy Football Style Scoring

Implement a **category-based scoring system** where:
- 3 distinct scoring categories tracked independently
- Weekly scores reset each Monday
- Lifetime totals tracked separately
- Leaderboards can rank by total or by category wins

### Scoring Categories

| Category | What it tracks | Quest Categories Included |
|----------|---------------|---------------------------|
| **Business** | Project progression, stage tasks, flows | `Business`, `Flow Finder` |
| **Healing** | Personal development, self-awareness | `Healing`, `Tracker` |
| **Courage** | Visibility challenges, facing fears | `Groans` |

### Category Mapping (Code)

```javascript
// src/lib/scoringCategories.js
export const SCORING_CATEGORIES = {
  // Maps quest category -> scoring category
  'Business': 'business',
  'Flow Finder': 'business',
  'Healing': 'healing',
  'Tracker': 'healing',
  'Groans': 'courage'
}

export const getScoringCategory = (questCategory) => {
  return SCORING_CATEGORIES[questCategory] || 'business' // Default fallback
}
```

---

## Database Schema Changes

### New Table: `challenge_weekly_scores`

Weekly scores that reset each Monday.

```sql
CREATE TABLE challenge_weekly_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES user_projects(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,  -- Monday of the week

  -- Category Scores
  business_score INTEGER DEFAULT 0,
  healing_score INTEGER DEFAULT 0,
  courage_score INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, project_id, week_start_date)
);

-- Index for leaderboard queries
CREATE INDEX idx_weekly_scores_week ON challenge_weekly_scores(week_start_date);
CREATE INDEX idx_weekly_scores_user ON challenge_weekly_scores(user_id);

-- RLS
ALTER TABLE challenge_weekly_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all weekly scores" ON challenge_weekly_scores
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own scores" ON challenge_weekly_scores
  FOR ALL USING (auth.uid() = user_id);
```

### New Table: `user_lifetime_scores`

Cumulative all-time scores (never reset).

```sql
CREATE TABLE user_lifetime_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES user_projects(id) ON DELETE CASCADE,

  -- Lifetime Category Totals
  lifetime_business_score INTEGER DEFAULT 0,
  lifetime_healing_score INTEGER DEFAULT 0,
  lifetime_courage_score INTEGER DEFAULT 0,
  lifetime_total_score INTEGER DEFAULT 0,

  -- Achievement Tracking
  weeks_completed INTEGER DEFAULT 0,
  best_week_total INTEGER DEFAULT 0,
  best_week_date DATE,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, project_id)
);

-- RLS
ALTER TABLE user_lifetime_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all lifetime scores" ON user_lifetime_scores
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own scores" ON user_lifetime_scores
  FOR ALL USING (auth.uid() = user_id);
```

### RPC Function: `increment_scores`

Atomic function to update both weekly and lifetime scores.

**Note:** The original implementation had bugs with NULL `project_id` handling. See [Bug Fixes](#bug-fixes-february-2025) section below.

```sql
-- Fixed version (February 2025)
CREATE OR REPLACE FUNCTION increment_scores(
  p_user_id UUID,
  p_project_id UUID,
  p_category TEXT,  -- 'business', 'healing', or 'courage'
  p_points INTEGER,
  p_week_start DATE DEFAULT NULL  -- Optional: client-provided week start for timezone consistency
)
RETURNS JSON AS $$
DECLARE
  v_week_start DATE;
  v_weekly_record challenge_weekly_scores%ROWTYPE;
  v_lifetime_record user_lifetime_scores%ROWTYPE;
  v_weekly_exists BOOLEAN;
  v_lifetime_exists BOOLEAN;
BEGIN
  -- Use client-provided week start if available, otherwise calculate server-side
  IF p_week_start IS NOT NULL THEN
    v_week_start := p_week_start;
  ELSE
    v_week_start := date_trunc('week', CURRENT_DATE)::DATE;
  END IF;

  -- Check if weekly record exists (handles NULL project_id correctly)
  SELECT EXISTS (
    SELECT 1 FROM challenge_weekly_scores
    WHERE user_id = p_user_id
      AND (project_id = p_project_id OR (project_id IS NULL AND p_project_id IS NULL))
      AND week_start_date = v_week_start
  ) INTO v_weekly_exists;

  -- Insert if not exists
  IF NOT v_weekly_exists THEN
    INSERT INTO challenge_weekly_scores (user_id, project_id, week_start_date, business_score, healing_score, courage_score)
    VALUES (p_user_id, p_project_id, v_week_start, 0, 0, 0);
  END IF;

  -- Update the appropriate category (with proper NULL handling)
  IF p_category = 'business' THEN
    UPDATE challenge_weekly_scores
    SET business_score = business_score + p_points, updated_at = NOW()
    WHERE user_id = p_user_id
      AND (project_id = p_project_id OR (project_id IS NULL AND p_project_id IS NULL))
      AND week_start_date = v_week_start
    RETURNING * INTO v_weekly_record;
  ELSIF p_category = 'healing' THEN
    UPDATE challenge_weekly_scores
    SET healing_score = healing_score + p_points, updated_at = NOW()
    WHERE user_id = p_user_id
      AND (project_id = p_project_id OR (project_id IS NULL AND p_project_id IS NULL))
      AND week_start_date = v_week_start
    RETURNING * INTO v_weekly_record;
  ELSIF p_category = 'courage' THEN
    UPDATE challenge_weekly_scores
    SET courage_score = courage_score + p_points, updated_at = NOW()
    WHERE user_id = p_user_id
      AND (project_id = p_project_id OR (project_id IS NULL AND p_project_id IS NULL))
      AND week_start_date = v_week_start
    RETURNING * INTO v_weekly_record;
  ELSE
    RAISE EXCEPTION 'Invalid category: %. Must be business, healing, or courage', p_category;
  END IF;

  -- Similar pattern for lifetime scores...
  -- (See full implementation in migration file)

  RETURN json_build_object(
    'weekly', json_build_object(
      'business_score', COALESCE(v_weekly_record.business_score, 0),
      'healing_score', COALESCE(v_weekly_record.healing_score, 0),
      'courage_score', COALESCE(v_weekly_record.courage_score, 0),
      'total', COALESCE(v_weekly_record.business_score, 0) + COALESCE(v_weekly_record.healing_score, 0) + COALESCE(v_weekly_record.courage_score, 0)
    ),
    'lifetime', json_build_object(...)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Required Partial Unique Indexes

PostgreSQL UNIQUE constraints don't work with NULL values. These partial indexes handle the NULL `project_id` case:

```sql
-- Weekly scores: unique index for NULL project_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_weekly_scores_user_null_project_week
  ON challenge_weekly_scores(user_id, week_start_date)
  WHERE project_id IS NULL;

-- Lifetime scores: unique index for NULL project_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_lifetime_scores_user_null_project
  ON user_lifetime_scores(user_id)
  WHERE project_id IS NULL;
```

---

## Data Migration & Backfill

### Step 1: Check for NULL quest_category

**IMPORTANT:** Before backfilling, check if any quest_completions have NULL category.

```sql
-- Check for NULL categories
SELECT
  quest_id,
  COUNT(*) as count
FROM quest_completions
WHERE quest_category IS NULL
GROUP BY quest_id;
```

If NULL categories exist, we need to:
1. Look up each quest_id in the challenge data JSON
2. Update the quest_category based on quest definition

```sql
-- Example fix for known quests (update as needed)
UPDATE quest_completions
SET quest_category = 'Business'
WHERE quest_category IS NULL
AND quest_id LIKE 'stage_%';

UPDATE quest_completions
SET quest_category = 'Healing'
WHERE quest_category IS NULL
AND quest_id IN ('recognise_daily', 'rewire_daily', 'release_daily', 'reconnect_daily');

-- etc.
```

### Step 2: Backfill Weekly Scores

```sql
-- Populate challenge_weekly_scores from quest_completions
INSERT INTO challenge_weekly_scores (user_id, project_id, week_start_date, business_score, healing_score, courage_score)
SELECT
  user_id,
  project_id,
  date_trunc('week', completed_at)::DATE as week_start_date,

  -- Business = Business + Flow Finder categories
  COALESCE(SUM(CASE WHEN quest_category IN ('Business', 'Flow Finder') THEN points_earned ELSE 0 END), 0) as business_score,

  -- Healing = Healing + Tracker categories
  COALESCE(SUM(CASE WHEN quest_category IN ('Healing', 'Tracker') THEN points_earned ELSE 0 END), 0) as healing_score,

  -- Courage = Groans category
  COALESCE(SUM(CASE WHEN quest_category = 'Groans' THEN points_earned ELSE 0 END), 0) as courage_score

FROM quest_completions
WHERE user_id IS NOT NULL
  AND project_id IS NOT NULL
GROUP BY user_id, project_id, date_trunc('week', completed_at)::DATE
ON CONFLICT (user_id, project_id, week_start_date) DO UPDATE SET
  business_score = EXCLUDED.business_score,
  healing_score = EXCLUDED.healing_score,
  courage_score = EXCLUDED.courage_score,
  updated_at = NOW();
```

### Step 3: Backfill Lifetime Scores

```sql
-- Populate user_lifetime_scores from weekly scores
INSERT INTO user_lifetime_scores (
  user_id,
  project_id,
  lifetime_business_score,
  lifetime_healing_score,
  lifetime_courage_score,
  lifetime_total_score,
  weeks_completed,
  best_week_total,
  best_week_date
)
SELECT
  user_id,
  project_id,
  SUM(business_score) as lifetime_business_score,
  SUM(healing_score) as lifetime_healing_score,
  SUM(courage_score) as lifetime_courage_score,
  SUM(business_score + healing_score + courage_score) as lifetime_total_score,
  COUNT(*) as weeks_completed,
  MAX(business_score + healing_score + courage_score) as best_week_total,
  (SELECT week_start_date FROM challenge_weekly_scores w2
   WHERE w2.user_id = challenge_weekly_scores.user_id
   AND w2.project_id = challenge_weekly_scores.project_id
   ORDER BY (w2.business_score + w2.healing_score + w2.courage_score) DESC
   LIMIT 1) as best_week_date
FROM challenge_weekly_scores
GROUP BY user_id, project_id
ON CONFLICT (user_id, project_id) DO UPDATE SET
  lifetime_business_score = EXCLUDED.lifetime_business_score,
  lifetime_healing_score = EXCLUDED.lifetime_healing_score,
  lifetime_courage_score = EXCLUDED.lifetime_courage_score,
  lifetime_total_score = EXCLUDED.lifetime_total_score,
  weeks_completed = EXCLUDED.weeks_completed,
  best_week_total = EXCLUDED.best_week_total,
  best_week_date = EXCLUDED.best_week_date,
  updated_at = NOW();
```

### Step 4: Handle User-Level Quests (NULL project_id)

Some quests (Groans, Flow Finder) are user-level, not project-level. These have `project_id = NULL`.

```sql
-- Backfill user-level scores (project_id = NULL)
INSERT INTO challenge_weekly_scores (user_id, project_id, week_start_date, business_score, healing_score, courage_score)
SELECT
  user_id,
  NULL as project_id,  -- User-level
  date_trunc('week', completed_at)::DATE as week_start_date,
  COALESCE(SUM(CASE WHEN quest_category IN ('Business', 'Flow Finder') THEN points_earned ELSE 0 END), 0),
  COALESCE(SUM(CASE WHEN quest_category IN ('Healing', 'Tracker') THEN points_earned ELSE 0 END), 0),
  COALESCE(SUM(CASE WHEN quest_category = 'Groans' THEN points_earned ELSE 0 END), 0)
FROM quest_completions
WHERE user_id IS NOT NULL
  AND project_id IS NULL
GROUP BY user_id, date_trunc('week', completed_at)::DATE
ON CONFLICT (user_id, project_id, week_start_date) DO UPDATE SET
  business_score = EXCLUDED.business_score,
  healing_score = EXCLUDED.healing_score,
  courage_score = EXCLUDED.courage_score;
```

---

## Code Changes Required

### 1. Update Quest Completion Handler

**File:** `src/Challenge.jsx`

The RPC call now includes the client's week start for timezone consistency:

```javascript
import { getScoringCategory } from '../lib/scoringCategories'

const scoringCategory = getScoringCategory(quest.category)

try {
  await supabase.rpc('increment_scores', {
    p_user_id: user.id,
    p_project_id: null, // User-level scores
    p_category: scoringCategory,
    p_points: quest.points,
    p_week_start: getWeekStart() // Pass client's week start for timezone consistency
  })
  await loadUserScores()
} catch (scoreError) {
  console.error('Error updating scores:', scoreError)
  // Non-fatal - continue with quest completion
}
```

**Note:** The old dual-update to `challenge_progress` and `user_projects` is still maintained for backwards compatibility until deprecated columns are removed.

### 2. Create Scoring Categories Helper

**File:** `src/lib/scoringCategories.js` (new file)

```javascript
export const SCORING_CATEGORIES = {
  'Business': 'business',
  'Flow Finder': 'business',
  'Healing': 'healing',
  'Tracker': 'healing',
  'Groans': 'courage'
}

export const getScoringCategory = (questCategory) => {
  return SCORING_CATEGORIES[questCategory] || 'business'
}

export const CATEGORY_DISPLAY = {
  business: { name: 'Business', icon: '💼', color: '#5e17eb' },
  healing: { name: 'Healing', icon: '💚', color: '#10b981' },
  courage: { name: 'Courage', icon: '🦁', color: '#E9A23B' }
}
```

### 3. Update useChallengeData Hook

**File:** `src/hooks/useChallengeData.js`

Key functions added/updated:

```javascript
// Get Monday of current week (in local timezone, formatted as YYYY-MM-DD)
const getWeekStart = () => {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  now.setDate(diff)
  // Format as local date (not UTC) to avoid timezone mismatch
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const date = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${date}`
}

// Load weekly scores from new scoring tables
const loadUserScores = async () => {
  const weekStart = getWeekStart()

  const { data: weekly } = await supabase
    .from('challenge_weekly_scores')
    .select('business_score, healing_score, courage_score')
    .eq('user_id', user.id)
    .eq('week_start_date', weekStart)
    .is('project_id', null) // User-level scores
    .maybeSingle()

  setWeeklyScores(weekly || { business_score: 0, healing_score: 0, courage_score: 0 })
}

// Compute points for header display - always uses completions for reliability
const currentWeeklyPoints = (() => {
  if (!completions || completions.length === 0) return 0
  const weekStart = new Date(getWeekStart() + 'T00:00:00')
  return completions
    .filter(c => new Date(c.completed_at) >= weekStart)
    .reduce((sum, c) => sum + (c.points_earned || 0), 0)
})()
```

### 4. Update ChallengeHeader Component

**File:** `src/components/ChallengeHeader.jsx`

Display category breakdown instead of single total:

```jsx
<div className="score-breakdown">
  <div className="score-category business">
    <span className="icon">💼</span>
    <span className="value">{weeklyScores.business_score}</span>
  </div>
  <div className="score-category healing">
    <span className="icon">💚</span>
    <span className="value">{weeklyScores.healing_score}</span>
  </div>
  <div className="score-category courage">
    <span className="icon">🦁</span>
    <span className="value">{weeklyScores.courage_score}</span>
  </div>
  <div className="score-total">
    <span className="label">Total</span>
    <span className="value">{totalScore}</span>
  </div>
</div>
```

### 5. Update Leaderboard

**File:** `src/components/ChallengeLeaderboard.jsx`

Query the new weekly scores table:

```javascript
const loadLeaderboard = async () => {
  const weekStart = getWeekStart()

  const { data } = await supabase
    .from('challenge_weekly_scores')
    .select(`
      user_id,
      business_score,
      healing_score,
      courage_score,
      profiles!inner(display_name, avatar_url)
    `)
    .eq('week_start_date', weekStart)
    .order('business_score + healing_score + courage_score', { ascending: false })
    .limit(10)

  setLeaderboard(data)
}
```

---

## Columns to Deprecate (After Migration)

Once the new system is working, these columns can be removed:

**Table: `challenge_progress`**
- `total_points`
- `recognise_daily_points`
- `recognise_weekly_points`
- `release_daily_points`
- `release_weekly_points`
- `rewire_daily_points`
- `rewire_weekly_points`
- `reconnect_daily_points`
- `reconnect_weekly_points`

**Table: `user_projects`**
- `total_points`

---

## Future Enhancement: Category-Based Winning

Currently ranking by highest total. To switch to fantasy-style category wins:

```sql
-- View for head-to-head category comparison
CREATE VIEW weekly_category_standings AS
SELECT
  a.user_id,
  a.week_start_date,
  COUNT(CASE WHEN a.business_score > b.business_score THEN 1 END) as business_wins,
  COUNT(CASE WHEN a.healing_score > b.healing_score THEN 1 END) as healing_wins,
  COUNT(CASE WHEN a.courage_score > b.courage_score THEN 1 END) as courage_wins,
  COUNT(CASE WHEN a.business_score > b.business_score THEN 1 END) +
  COUNT(CASE WHEN a.healing_score > b.healing_score THEN 1 END) +
  COUNT(CASE WHEN a.courage_score > b.courage_score THEN 1 END) as total_category_wins
FROM challenge_weekly_scores a
CROSS JOIN challenge_weekly_scores b
WHERE a.week_start_date = b.week_start_date
  AND a.user_id != b.user_id
GROUP BY a.user_id, a.week_start_date
ORDER BY total_category_wins DESC;
```

---

## Bug Fixes (February 2025)

Several bugs were discovered after initial implementation. All have been fixed.

### Bug 1: Header Points Not Updating After Quest Completion

**Symptom:** Points displayed in ChallengeHeader didn't update after completing quests.

**Root Cause:** The `currentWeeklyPoints` calculation checked `if (weeklyScores)` and used RPC-based scores. But once `weeklyScores` was set to a default zeros object `{ business_score: 0, ... }` on first load, it was always truthy. The fallback calculation from `completions` never ran, even when the RPC wasn't working.

**Fix:** Changed `currentWeeklyPoints` to always calculate from `completions` state, which is reliably updated after each quest completion.

```javascript
// src/hooks/useChallengeData.js
const currentWeeklyPoints = (() => {
  // Always calculate from completions (source of truth for current session)
  if (!completions || completions.length === 0) return 0
  const weekStart = new Date(getWeekStart() + 'T00:00:00')
  return completions
    .filter(c => new Date(c.completed_at) >= weekStart)
    .reduce((sum, c) => sum + (c.points_earned || 0), 0)
})()
```

### Bug 2: Tab Bonus Using Stale React State

**Symptom:** Tab completion bonus could calculate wrong total points.

**Root Cause:** `awardTabCompletionBonus` read from the closure's `progress` state, but React state updates are async. When called immediately after `setProgress()`, it still saw old values.

**Fix:** Added optional `currentProgress` parameter to accept fresh data:

```javascript
const awardTabCompletionBonus = async (category, bonusPoints, currentProgress = null) => {
  const effectiveProgress = currentProgress || progress
  // ... use effectiveProgress instead of progress
}

// Caller passes fresh data:
await awardTabCompletionBonus(quest.category, tabStatus.bonusPoints, updatedProgress)
```

### Bug 3: RPC NULL project_id Not Working

**Symptom:** Scores for user-level quests (NULL project_id) weren't being stored.

**Root Cause:** PostgreSQL's `ON CONFLICT` clause doesn't work with NULL values in UNIQUE constraints. The clause `ON CONFLICT (user_id, project_id, week_start_date)` never matched rows where `project_id` was NULL.

**Fix:** Replaced `INSERT ... ON CONFLICT` with explicit existence checks:

```sql
-- Check if record exists (handles NULL correctly)
SELECT EXISTS (
  SELECT 1 FROM challenge_weekly_scores
  WHERE user_id = p_user_id
    AND (project_id = p_project_id OR (project_id IS NULL AND p_project_id IS NULL))
    AND week_start_date = v_week_start
) INTO v_weekly_exists;

IF NOT v_weekly_exists THEN
  INSERT INTO challenge_weekly_scores (...) VALUES (...);
END IF;
```

### Bug 4: Timezone Mismatch Between Client and Server

**Symptom:** Scores stored under wrong week, queries couldn't find them.

**Root Cause:** JavaScript `getWeekStart()` used `toISOString()` which converts to UTC, but `getDay()`/`getDate()` use local timezone. A user in Sydney on Monday local time (Sunday UTC) would get mismatched dates.

**Fix:**
1. Changed `getWeekStart()` to use local date formatting
2. Added optional `p_week_start` parameter to RPC
3. Client passes its calculated week start to ensure consistency

```javascript
// Fixed getWeekStart() - uses local dates
const getWeekStart = () => {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  now.setDate(diff)
  // Format as local date (not UTC)
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const date = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${date}`
}

// RPC call includes week start
await supabase.rpc('increment_scores', {
  p_user_id: user.id,
  p_project_id: null,
  p_category: scoringCategory,
  p_points: quest.points,
  p_week_start: getWeekStart()
})
```

### Bug 5: Missing Error Handling on Completions Reload

**Symptom:** If database query failed, points would show as 0.

**Root Cause:** The completions reload didn't check for errors. If the query failed, `setCompletions(newCompletions || [])` would reset to empty array.

**Fix:** Added error handling to preserve existing state:

```javascript
const { data: newCompletions, error: completionsError } = await supabase
  .from('quest_completions')
  .select('*')
  .eq('user_id', user.id)
  .eq('challenge_instance_id', progress.challenge_instance_id)

if (completionsError) {
  console.error('Error reloading completions:', completionsError)
  // Don't reset completions on error - keep existing state
} else {
  setCompletions(newCompletions || [])
}
```

---

## Implementation Checklist

- [x] Create migration file with new tables (`20250125000001_scoring_system_refactor.sql`)
- [x] Create increment_scores RPC function (in migration)
- [x] Create backfill migration (`20250125000002_scoring_system_backfill.sql`)
- [x] Create src/lib/scoringCategories.js
- [x] Run migrations on Supabase
- [x] Add partial unique indexes for NULL project_id (`20250125000001b_scoring_null_fix.sql`)
- [x] Fix increment_scores RPC for NULL handling (`20260203000000_fix_increment_scores_null_conflict.sql`)
- [x] Update Challenge.jsx quest completion handler
- [x] Update useChallengeData.js with new loaders
- [x] Fix currentWeeklyPoints to use completions
- [x] Fix awardTabCompletionBonus stale state issue
- [x] Fix getWeekStart() timezone issue
- [x] Add error handling for completions reload
- [x] Update ChallengeHeader.jsx UI
- [x] Update ChallengeLeaderboard.jsx
- [ ] Update ChallengeProjectSelector.jsx to use new scores
- [ ] Test thoroughly with existing users
- [ ] Remove deprecated columns (after verification)

---

## Rollback Plan

If issues arise:
1. The old `challenge_progress.total_points` and `user_projects.total_points` columns remain untouched during migration
2. Simply revert code changes to use old columns
3. New tables can be dropped without data loss
4. `quest_completions` (source of truth) is never modified
