# Healing Tab: User-Level Migration

**Date:** 2026-02-09
**Branch:** `crm/audit-fixes-and-migrations`

## Summary

Healing quest completions are now **user-level** (like Flow Finder), meaning they persist across all challenges and projects. Previously, Healing completions were tied to a specific challenge instance and project — starting a new challenge meant losing Healing history.

**Key difference from Flow Finder:** Healing quests are repeatable (daily/weekly/deepdive), while Flow Finder quests are complete-once-ever. This required unique index changes to allow multiple user-level Healing rows per user+quest.

---

## Files Modified

### 1. `src/Challenge.jsx`

**Completion insert override (line ~555)**
```javascript
if (quest.category === 'Healing') {
  completionData.challenge_instance_id = null
  completionData.project_id = null
  completionData.challenge_day = 0  // NOT NULL constraint requires a value
}
```

**Duplicate check split (line ~596)**
- Healing: checks `user_id + quest_id + IS NULL challenge_instance_id + date`
- Other categories: checks `user_id + quest_id + challenge_instance_id + date` (existing behavior)

**Skip challenge_progress for Healing (line ~665)**
- `challenge_progress` table update, streak update, and `user_projects` points sync are all wrapped in `if (quest.category !== 'Healing')`.
- Healing scoring is handled entirely by the `increment_scores` RPC (user-level, `p_project_id: null`).

**Hoisted variables (line ~658)**
- `rType`, `frequencyKey`, and `newTotalPoints` are declared above the `if (quest.category !== 'Healing')` block so they remain available for the artifact unlock check and success message that follow.

**Skip tab completion bonus for Healing (line ~771)**
- `awardTabCompletionBonus` writes to `challenge_progress`, so it's wrapped in `if (quest.category !== 'Healing')`.

**Healing tab rendering — all 4 R-types (line ~1488)**
- Changed `['Recognise', 'Release']` to `['Recognise', 'Release', 'Rewire', 'Reconnect']` so all Healing quest types render as subsections.

### 2. `src/components/ChallengeFilters.jsx`

**Added Rewire and Reconnect filter chips for Healing tab**
- Previously only showed Recognise and Release chips (Groans had Recognise/Rewire/Reconnect).
- Now shows all 4: Recognise, Release, Rewire, Reconnect.

### 3. `src/components/HealingSummary.jsx`

**Fixed query (line ~66-68)** — Pre-existing bugs:
- Changed `.eq('quest_type', 'Healing')` to `.eq('quest_category', 'Healing')` — `quest_type` values are Recognise/Release/Rewire/Reconnect, not "Healing".
- Changed `response_data` to `reflection_text` in SELECT — `quest_completions` table has `reflection_text`, not `response_data`.
- Removed broken second query that used `.in('quest_category', ['Recognise', 'Release'])`.

**Fixed processing loop (line ~107-108)**
- Changed `completion.response_data` references to `completion.reflection_text`.

**Added all 4 R-types to type tracking**
- `byType` object now tracks `{ Recognise, Release, Rewire, Reconnect }` (was only Recognise and Release).
- Classification logic now handles all 4 types by `quest_type` or `quest_id` prefix.

**Updated balance display**
- Shows all 4 types with icons: Recognise (👁️), Release (🌊), Rewire (🔄), Reconnect (🤝).
- Each type gets its own percentage and bar segment.

### 4. `src/components/HealingSummary.css`

**Added styles for Rewire and Reconnect**

| Element | Rewire | Reconnect |
|---------|--------|-----------|
| `.voice-item` bg | `rgba(74, 222, 128, 0.25)` (green) | `rgba(251, 146, 60, 0.25)` (orange) |
| `.voice-percent` color | `#86efac` | `#fdba74` |
| `.voice-bar` bg | `#4ade80` | `#fb923c` |

### 5. `supabase/migrations/20260209150000_user_level_healing_completions.sql`

**Step 1:** Drop both unique indexes that would block repeatable user-level Healing completions:
- `idx_quest_completions_user_level_unique`
- `idx_quest_completions_no_duplicates`

**Step 2:** Recreate `idx_quest_completions_user_level_unique` scoped to Business (Flow Finder) only:
```sql
CREATE UNIQUE INDEX idx_quest_completions_user_level_unique
  ON quest_completions(user_id, quest_id)
  WHERE challenge_instance_id IS NULL AND quest_category = 'Business';
```

**Step 3:** Recreate `idx_quest_completions_no_duplicates` excluding Healing:
```sql
CREATE UNIQUE INDEX idx_quest_completions_no_duplicates
  ON quest_completions(user_id, quest_id, COALESCE(project_id, '00000000-0000-0000-0000-000000000000'::uuid))
  WHERE quest_category != 'Healing';
```

**Step 4:** Deduplicate existing Healing completions (keep newest per user+quest+day).

**Step 5:** Convert all existing Healing completions to user-level:
```sql
UPDATE quest_completions
SET challenge_instance_id = NULL, project_id = NULL, challenge_day = 0
WHERE quest_category = 'Healing' AND challenge_instance_id IS NOT NULL;
```

---

## Files Verified Safe (No Changes Needed)

| File | Why It's Safe |
|------|---------------|
| `src/hooks/useChallengeData.js` | Already loads and merges user-level (`IS NULL`) + challenge-specific completions. `isQuestCompletedToday` checks by quest_id + date only. `getCategoryPoints` and `getArtifactProgress` filter from merged array. |
| `src/lib/questCompletionHelpers.js` | `syncFlowFinderWithChallenge` is Business-only. Other helpers don't touch Healing. |
| `src/lib/scoringCategories.js` | Maps `'Healing' → 'healing'` correctly. |
| `public/challengeQuestsUpdate.json` | Quest definitions unchanged. |

---

## How It Works Now

```
User completes Healing quest
  → completionData override: challenge_instance_id=null, project_id=null, challenge_day=0
  → Duplicate check: user_id + quest_id + IS NULL + date range
  → Insert to quest_completions (user-level row)
  → increment_scores RPC (user-level, project_id=null)
  → Skip: challenge_progress, streak, project points, tab bonus
  → Reload: merges challenge-specific + user-level completions
  → UI: isQuestCompletedToday sees it in merged completions array
```

When user starts a new challenge or switches projects:
- `useChallengeData` loads user-level completions (lines 174-180) and merges with challenge-specific (lines 273-300).
- All prior Healing completions remain visible.

---

## Edge Cases

| Scenario | Handled? | Details |
|----------|----------|---------|
| Daily quest completed twice same day | Yes | Date-range filter in duplicate check |
| Weekly quest completed twice same week | Yes | `isQuestCompletedToday` checks `>= weekStartStr` for weekly frequency |
| Deepdive quests (one-time) | Yes | `isQuestCompletedToday` returns `questCompletions.length > 0` |
| `challenge_day` NOT NULL constraint | Yes | Set to `0` for user-level |
| No active challenge | Yes | User-level completions loaded independently |
| Existing data duplicates across instances | Yes | Migration deduplicates before converting |
| Unique index blocking repeatable Healing | Yes | Index scoped to `quest_category = 'Business'` only |
| `idx_quest_completions_no_duplicates` blocking | Yes | Index excludes `quest_category = 'Healing'` |

---

## Known Pre-Existing Issues (Not Caused by This Change)

1. **Healing tab is locked in UI** — `Challenge.jsx` line 1261: `const isLocked = category === 'Healing' || category === 'Bonus'`. The tab shows "Coming soon" and can't be clicked. Unlock when ready for release.

2. **HealingSummary `reflection_text` is usually plain text, not JSON** — The "Emotions Processed", "Trigger Patterns", and "Release Methods" sections parse `reflection_text` as JSON looking for structured data (`data.emotion`, `data.trigger`, `data.release_method`). Most Healing quest completions store plain text reflections, so these sections will typically be empty unless structured input components are used. The `try/catch` prevents errors.

---

## Verification Queries

Check migration applied correctly:
```sql
SELECT challenge_instance_id, project_id, challenge_day
FROM quest_completions
WHERE quest_category = 'Healing'
LIMIT 5;
-- Expected: null, null, 0
```

Check unique index scope:
```sql
SELECT indexdef FROM pg_indexes
WHERE indexname = 'idx_quest_completions_user_level_unique';
-- Should include: WHERE challenge_instance_id IS NULL AND quest_category = 'Business'
```

Check no-duplicates index scope:
```sql
SELECT indexdef FROM pg_indexes
WHERE indexname = 'idx_quest_completions_no_duplicates';
-- Should include: WHERE quest_category != 'Healing'
```
