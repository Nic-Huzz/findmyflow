# Fantasy League — Reach Category Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Healing scoring category with Reach (content/social tasks). League scoring becomes: Tune + Courage + Reach (win 2 of 3). Healing points roll into Courage. Reach section appears on Courage tab for league members only.

**Architecture:** Four tasks. Task 1 updates the scoring config + engine. Task 2 updates the edge function. Task 3 updates the ChallengeHeader pills. Task 4 reactivates ContentChallenges as the Reach section on the Courage tab.

**Tech Stack:** React 18 + Supabase (PostgreSQL, Edge Functions) + Vite

## Global Constraints

- Light theme (#f5f5f0 background, #5e17eb purple, #E9A23B gold)
- Branch: `light-portal`
- Win 2 of 3 categories mechanic stays the same. `calculateMatchupResult` logic unchanged.
- DB columns on `fantasy_matchups` unchanged (team_a_categories_won, team_b_categories_won, etc.)
- `league_content_submissions` table already exists and stores content submissions per league/week/user.
- `community_feed` table exists with `postFeedEvent` and `postSharedWahoo` helpers in `src/lib/communityFeed.js`.
- User-facing language: "wahoo" → "courage challenge" in new copy. Internal code names stay.

## Spec Reference

Full spec: `docs/features/league-reach-category-spec.md`

The 6 Reach tasks:
- Accountability Post (4pts, in-app, auto-scored)
- Comment & Engage (2pts, in-app, auto-detected)
- Shout Out a Player (4pts, in-app, auto-scored)
- Share the Leaderboard (2pts, social, URL + admin)
- Courage Proof (8pts, social, URL + admin, cross-posts to community feed)
- Flow in the Wild (10pts, social, URL + admin, cross-posts to community feed)

---

### Task 1: Scoring Config + Engine

**Files:**
- Modify: `src/lib/league/leagueConfig.js`
- Modify: `src/lib/league/leagueScoring.js`

**Interfaces:**
- Consumes: `quest_completions` table (for Tune + Courage), `league_content_submissions` table (for Reach)
- Produces: Updated `FANTASY_CATEGORIES`, scoring functions that include Reach from content submissions

- [ ] **Step 1: Update FANTASY_CATEGORIES in leagueConfig.js**

In `src/lib/league/leagueConfig.js`, replace the FANTASY_CATEGORIES object (lines ~78-103):

```javascript
// BEFORE:
export const FANTASY_CATEGORIES = {
  play_list: {
    key: 'play_list',
    label: 'Wahoos',
    icon: '🔥',
    color: '#E9A23B',
    dbFilter: ['Groans'],
    scoringType: 'raw',
  },
  healing: {
    key: 'healing',
    label: 'Healing',
    icon: '💚',
    color: '#10b981',
    dbFilter: ['Healing', 'Daily', 'Weekly'],
    scoringType: 'raw',
  },
  tune: {
    key: 'tune',
    label: 'Tune',
    icon: '☀️',
    color: '#5e17eb',
    dbFilter: ['Tune'],
    scoringType: 'raw',
  },
}

// AFTER:
export const FANTASY_CATEGORIES = {
  tune: {
    key: 'tune',
    label: 'Tune',
    icon: '☀️',
    color: '#5e17eb',
    dbFilter: ['Tune'],
    scoringType: 'raw',
  },
  courage: {
    key: 'courage',
    label: 'Courage',
    icon: '🔥',
    color: '#E9A23B',
    dbFilter: ['Groans', 'Healing', 'Daily', 'Weekly'],
    scoringType: 'raw',
  },
  reach: {
    key: 'reach',
    label: 'Reach',
    icon: '📣',
    color: '#10b981',
    dbFilter: [],  // Reach scores come from league_content_submissions, not quest_completions
    scoringType: 'content',
  },
}
```

- [ ] **Step 2: Update CONTENT_POINT_VALUES — remove dropped tasks**

In `src/lib/league/leagueConfig.js`, remove these from `CONTENT_POINT_VALUES`:
- `carousel_highlights` (dropped — too high effort)
- `customise_hero` (dropped — onboarding action, not weekly reach)
- `share_hero_profile` (dropped — merged into future "Share Your Journey")

Rename `playlist_proof` to `courage_proof`:
```javascript
// BEFORE:
playlist_proof: {
  label: 'Play-List Proof',
  points: 8,
  icon: '🎭',
  description: 'Share evidence of a courage challenge you completed',
  submissionType: 'url',
  templateType: 'courage',
},

// AFTER:
courage_proof: {
  label: 'Courage Proof',
  points: 8,
  icon: '💪',
  description: 'Share evidence of a courage challenge you completed',
  submissionType: 'url',
  templateType: 'courage',
  crossPostToFeed: true,
},
```

Rename `offer_in_wild` to `flow_in_wild`:
```javascript
// BEFORE:
offer_in_wild: {
  label: 'Offer in the Wild',
  points: 10,
  icon: '🎯',
  description: 'Show proof of your offer out there — a screenshot, DM, or conversation',
  submissionType: 'url',
},

// AFTER:
flow_in_wild: {
  label: 'Flow in the Wild',
  points: 10,
  icon: '🌍',
  description: 'Show proof of your flow out there: a screenshot, DM, or conversation',
  submissionType: 'url',
  crossPostToFeed: true,
},
```

Add `crossPostToFeed: true` to `courage_proof` and `flow_in_wild`. This flag tells the submission handler to also post to the community feed.

- [ ] **Step 3: Update calculateUserCategoryScores — add Reach from content submissions**

In `src/lib/league/leagueScoring.js`, the `calculateUserCategoryScores` function (line ~24) currently only queries `quest_completions`. Add a second query for approved content submissions:

```javascript
export async function calculateUserCategoryScores(userId, startDate, endDate, approvedContentPoints = 0) {
  const { data, error } = await supabase.rpc('get_league_scores', {
    member_ids: [userId],
    start_date: startDate,
    end_date: endDate,
  })

  if (error) {
    console.error('Error fetching completions for scoring:', error)
    return Object.fromEntries(CATEGORY_KEYS.map(k => [k, 0]))
  }

  const scores = Object.fromEntries(CATEGORY_KEYS.map(k => [k, 0]))

  ;(data || []).forEach(row => {
    for (const [key, config] of Object.entries(FANTASY_CATEGORIES)) {
      if (config.dbFilter.includes(row.quest_category)) {
        scores[key] += parseInt(row.total_points) || 0
      }
    }
  })

  // Reach: add approved content submission points
  scores.reach = approvedContentPoints

  return scores
}
```

The `approvedContentPoints` parameter already exists and is passed from the edge function. Currently it's unused in the scoring. Now it maps to the `reach` category.

- [ ] **Step 4: Update calculateTeamScores — pass content points to reach**

In `src/lib/league/leagueScoring.js`, the `calculateTeamScores` function (line ~64) already receives `contentPointsByUser`. Verify the content points flow through to `calculateUserCategoryScores` correctly:

```javascript
const allUserScores = await Promise.all(
  memberUserIds.map(userId =>
    calculateUserCategoryScores(
      userId,
      startDate,
      endDate,
      contentPointsByUser[userId] || 0  // This becomes scores.reach
    )
  )
)
```

This already works — `approvedContentPoints` is already passed. We just need to make sure it gets assigned to `scores.reach` (done in Step 3).

- [ ] **Step 5: Verify calculateMatchupResult still works**

`calculateMatchupResult` iterates over `CATEGORY_KEYS` (which is now `['tune', 'courage', 'reach']`). It compares per-category and counts wins. Win 2 of 3. This logic is unchanged and works with the new categories. No modification needed.

Verify: `CATEGORY_KEYS = Object.keys(FANTASY_CATEGORIES)` — this auto-updates when we change FANTASY_CATEGORIES. Confirm this line exists (line ~105).

- [ ] **Step 6: Update getCategoryEmoji and getCategoryColor**

These functions iterate over FANTASY_CATEGORIES to find a match. Since we renamed `play_list` → `courage` and `healing` → `reach`, any code that calls `getCategoryEmoji('Groans')` will now return the courage icon (🔥) instead of the old play_list icon. This is correct.

Check: are there any hardcoded references to the old category keys (`play_list`, `healing`) in the codebase?

```bash
grep -rn "'play_list'\|\"play_list\"\|'healing'" src/lib/league/ src/hooks/useMatchupData.js src/components/ChallengeHeader.jsx
```

If found, update them to the new keys (`courage`, `reach`).

- [ ] **Step 7: Verify build**

Run: `npm run build`

- [ ] **Step 8: Commit**

```bash
git add src/lib/league/leagueConfig.js src/lib/league/leagueScoring.js
git commit -m "feat: League scoring — Tune/Courage/Reach categories, Healing merged into Courage"
```

---

### Task 2: Edge Function

**Files:**
- Modify: `supabase/functions/score-league-matchups/index.ts`

**IMPORTANT:** Read the full edge function first. It mirrors the client-side scoring. Three changes needed:
1. Update FANTASY_CATEGORIES constant (matches leagueConfig.js)
2. Content submission points now map to `reach` key instead of uncategorized bonus
3. calculateMatchupResult stays the same (win 2 of 3)

- [ ] **Step 1: Update FANTASY_CATEGORIES in edge function**

In `supabase/functions/score-league-matchups/index.ts`, replace the FANTASY_CATEGORIES constant (lines 22-27):

```typescript
// BEFORE:
const FANTASY_CATEGORIES: Record<string, { key: string; label: string; dbFilter: string[]; scoringType: string }> = {
  play_list: { key: 'play_list', label: 'Wahoos', dbFilter: ['Groans'], scoringType: 'raw' },
  healing: { key: 'healing', label: 'Healing', dbFilter: ['Healing', 'Daily', 'Weekly'], scoringType: 'raw' },
  tune: { key: 'tune', label: 'Tune', dbFilter: ['Tune'], scoringType: 'raw' },
}

// AFTER:
const FANTASY_CATEGORIES: Record<string, { key: string; label: string; dbFilter: string[]; scoringType: string }> = {
  tune: { key: 'tune', label: 'Tune', dbFilter: ['Tune'], scoringType: 'raw' },
  courage: { key: 'courage', label: 'Courage', dbFilter: ['Groans', 'Healing', 'Daily', 'Weekly'], scoringType: 'raw' },
  reach: { key: 'reach', label: 'Reach', dbFilter: [], scoringType: 'content' },
}
```

- [ ] **Step 2: Update calculateUserScores — add content points to reach**

In the edge function's `calculateUserScores` function (line ~217), add content points as the reach score:

```typescript
async function calculateUserScores(
  supabase: any,
  userId: string,
  startDate: string,
  endDate: string,
  approvedContentPoints = 0
): Promise<Record<string, number>> {
  const scores: Record<string, number> = Object.fromEntries(CATEGORY_KEYS.map(k => [k, 0]))

  const { data: completions } = await supabase
    .from('quest_completions')
    .select('quest_id, quest_category, points_earned')
    .eq('user_id', userId)
    .gte('completed_at', startDate)
    .lte('completed_at', endDate + 'T23:59:59.999Z')

  if (!completions) return scores

  for (const c of completions) {
    const catEntry = Object.values(FANTASY_CATEGORIES).find(f => f.dbFilter.includes(c.quest_category))
    if (!catEntry) continue
    scores[catEntry.key] += (c.points_earned || 0)
  }

  // Reach: approved content submission points
  scores.reach = approvedContentPoints

  return scores
}
```

- [ ] **Step 3: Verify calculateMatchupResult unchanged**

The edge function's `calculateMatchupResult` (line ~274) iterates over CATEGORY_KEYS and counts wins. With new keys (`tune`, `courage`, `reach`), it still works. Win 2 of 3. No change needed.

- [ ] **Step 4: Deploy**

```bash
npx supabase functions deploy score-league-matchups --project-ref qlwfcfypnoptsocdpxuv
```

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/score-league-matchups/index.ts
git commit -m "feat: edge function — Tune/Courage/Reach scoring categories"
```

---

### Task 3: ChallengeHeader — Updated Pills

**Files:**
- Modify: `src/components/ChallengeHeader.jsx`
- Modify: `src/hooks/useMatchupData.js`

**IMPORTANT:** Read both files fully first. Key changes:
1. ChallengeHeader: 3 pills change labels/icons (Tune stays, Wahoos→Courage, Healing→Reach)
2. useMatchupData: category keys update

- [ ] **Step 1: Update ChallengeHeader DISPLAY_KEYS**

In `src/components/ChallengeHeader.jsx`, find the `DISPLAY_KEYS` array (line ~96):

```javascript
// BEFORE:
const DISPLAY_KEYS = ['tune', 'play_list', 'healing']

// AFTER:
const DISPLAY_KEYS = ['tune', 'courage', 'reach']
```

- [ ] **Step 2: Update CATEGORY_TEXT_COLORS**

In `src/components/ChallengeHeader.jsx`, find `CATEGORY_TEXT_COLORS` (lines ~26-30):

```javascript
// BEFORE:
const CATEGORY_TEXT_COLORS = {
  tune: '#10b981',
  play_list: '#E9A23B',
  healing: '#34d399',
}

// AFTER:
const CATEGORY_TEXT_COLORS = {
  tune: '#5e17eb',
  courage: '#E9A23B',
  reach: '#10b981',
}
```

- [ ] **Step 3: Update useMatchupData — category comparison**

In `src/hooks/useMatchupData.js`, the Phase 2 fetch (line ~89) builds per-category comparison. The `CATEGORY_KEYS` import auto-updates from leagueConfig. Verify:

```javascript
import { FANTASY_CATEGORIES, CATEGORY_KEYS } from '../lib/league/leagueConfig'
```

This imports the updated keys. The `categoryScores` useMemo (line ~35) loops over `FANTASY_CATEGORIES` to find matching quest_categories. Since `dbFilter` arrays changed, Groans now maps to `courage` instead of `play_list`, and Healing/Daily/Weekly also map to `courage`. Reach has empty dbFilter (scored from content submissions, not quest_completions).

The `categoryScores` will show `reach: 0` because quest_completions don't have Reach items. That's correct — Reach scores come from the matchup data (opponent comparison), not from local completions.

**Fix needed:** The `categoryScores` useMemo only counts quest_completions. We need to also count approved content submissions for the user's own Reach display:

After the existing useMemo (line ~53), add:

```javascript
// Reach: count approved content submissions for current week
const [reachPoints, setReachPoints] = useState(0)

useEffect(() => {
  if (!userTeam || !league) return
  const weekNum = getCurrentWeek?.()
  if (!weekNum) return

  supabase
    .from('league_content_submissions')
    .select('points_value')
    .eq('league_id', league.id)
    .eq('user_id', userId)  // need userId — check if available via props
    .eq('week_number', weekNum)
    .eq('status', 'approved')
    .then(({ data }) => {
      const total = (data || []).reduce((sum, s) => sum + (s.points_value || 0), 0)
      setReachPoints(total)
    })
}, [userTeam, league, completions])  // re-check when completions change (proxy for "something happened")
```

Wait — `useMatchupData` doesn't receive `userId` directly. Check the hook's props. It receives `completions`, `userTeam`, `league`, `teams`, `getCurrentWeek`, `getWeekMatchups`, `fetchLiveTeamScores`. No `userId`.

**Alternative:** Get userId from `supabase.auth.getUser()` inside the hook. Or add it to the merged `categoryScores`:

Actually, simpler: the ChallengeHeader already receives `categoryScores` from useMatchupData AND `weeklyPoints` from useChallengeData. The `weeklyPoints` is the total across all categories. We can compute Reach separately.

For now, the pills can show 0 for Reach until content submissions are counted. The score will update when the matchup data is fetched (opponent comparison includes the correct reach scores from the edge function).

**Decision: skip the local Reach counting for now.** The pill shows 0 until the auto-scorer runs. This is acceptable as a v1 — content submissions are admin-approved anyway, so there's always a delay.

- [ ] **Step 4: Verify build**

Run: `npm run build`

- [ ] **Step 5: Manual test**

- `/7-day-challenge` header shows 3 pills: ☀️ Tune, 🔥 Courage, 📣 Reach
- Courage pill counts both wahoo AND healing points
- Reach pill shows 0 (until content submissions are approved)
- Matchup banner still works

- [ ] **Step 6: Commit**

```bash
git add src/components/ChallengeHeader.jsx src/hooks/useMatchupData.js
git commit -m "feat: ChallengeHeader — Tune/Courage/Reach pills"
```

---

### Task 4: Reach Section on Courage Tab

**Files:**
- Modify: `src/components/PlayListTab.jsx` (add Reach section, league-only)
- Modify: `src/components/ContentChallenges.jsx` (update: remove dropped tasks, rename, add cross-post flag)
- Modify: `src/Challenge.jsx` (pass league data to PlayListTab)

**IMPORTANT:** This task reactivates `ContentChallenges.jsx` which is currently imported but not rendered (archived). Read it fully first. It's ~300 lines with template modals, player picker, and URL submission.

- [ ] **Step 1: Update ContentChallenges — remove dropped tasks, rename**

In `src/components/ContentChallenges.jsx`, the component reads `CONTENT_POINT_VALUES` from leagueConfig. Since we updated those values in Task 1 (removed 3 tasks, renamed 2), the component auto-reflects the changes. Verify by checking that `CONTENT_TYPES = Object.entries(CONTENT_POINT_VALUES)` (line ~20) still works.

If any rendering code references the old keys (`carousel_highlights`, `customise_hero`, `share_hero_profile`, `playlist_proof`, `offer_in_wild`) by name, update them:
- `playlist_proof` → `courage_proof` (check template logic)
- `offer_in_wild` → `flow_in_wild` (check template logic)

- [ ] **Step 2: Add cross-posting for Courage Proof and Flow in the Wild**

In `ContentChallenges.jsx`, in the `handleUrlSubmit` function (line ~127), after successful submission, check if the content type has `crossPostToFeed: true` and post to community feed:

```javascript
const handleUrlSubmit = async (contentType) => {
  if (!urlInput.trim()) return
  setSubmitting(true)
  try {
    const submission = await submitContent({
      leagueId, userId, teamId, weekNumber,
      contentType,
      linkUrl: urlInput.trim(),
      description: null,
    })
    setExpandedCard(null)
    setUrlInput('')
    onSubmitted?.()

    // Cross-post to community feed if flagged
    const config = CONTENT_POINT_VALUES[contentType]
    if (config?.crossPostToFeed) {
      const { postFeedEvent } = await import('../lib/communityFeed')
      postFeedEvent(userId, 'reach_share', config.label, null, {
        linkUrl: urlInput.trim(),
        contentType,
        points: config.points,
      })
    }

    // OG scrape (existing)
    if (submission?.id) {
      supabase.functions.invoke('scrape-og-metadata', {
        body: { submissionId: submission.id },
      }).catch(err => console.warn('OG scrape failed:', err))
    }
  } catch (err) {
    console.error('Error submitting content:', err)
    alert('Error submitting. Please try again.')
  } finally {
    setSubmitting(false)
  }
}
```

- [ ] **Step 3: Add Reach section to PlayListTab (league-only)**

In `src/components/PlayListTab.jsx`, add ContentChallenges at the bottom, only if user is in an active league. PlayListTab needs league data passed as props.

Add import:
```javascript
import ContentChallenges from './ContentChallenges'
```

Add props to PlayListTab signature:
```javascript
export default function PlayListTab({
  userId,
  currentVisibilityLayer = 'screen',
  onQuestComplete,
  onRefreshPoints,
  wahooCount = 0,
  // League data (for Reach section)
  leagueData = null,
}) {
```

At the bottom of the return, before the GroanCompletionModal, add:
```jsx
{/* Reach section — only if in active league */}
{leagueData?.league?.status === 'active' && leagueData?.isOnTeam && (
  <div className="plt-reach-section">
    <div className="plt-reach-header">
      <span className="plt-reach-icon">📣</span>
      <span className="plt-reach-title">Reach</span>
    </div>
    <ContentChallenges
      leagueId={leagueData.league.id}
      userId={userId}
      teamId={leagueData.userTeam?.id}
      weekNumber={leagueData.getCurrentWeek?.()}
      leagueStatus={leagueData.league.status}
      isOnTeam={leagueData.isOnTeam}
      teams={leagueData.teams}
      contentSubmissions={leagueData.contentSubmissions}
      onSubmitted={leagueData.onContentSubmitted}
      standings={leagueData.standings}
      userTeam={leagueData.userTeam}
      userData={leagueData.userData}
    />
  </div>
)}
```

- [ ] **Step 4: Pass league data from Challenge.jsx to PlayListTab**

In `src/Challenge.jsx`, find where PlayListTab is rendered (search for `<PlayListTab`). Add the `leagueData` prop:

```jsx
{activeCategory === 'Courage' && (
  <PlayListTab
    userId={user?.id}
    currentVisibilityLayer={getLevelConfig(currentJourneyLevel)?.visibilityLayer || 'screen'}
    onQuestComplete={handleQuestComplete}
    onRefreshPoints={() => { loadStageProgress(); loadUserScores(); reloadCompletions() }}
    wahooCount={wahooCountThisWeek}
    leagueData={{
      league,
      userTeam,
      isOnTeam,
      teams,
      getCurrentWeek,
      contentSubmissions,
      onContentSubmitted: loadContentSubmissions,
      standings,
      userData: stageProgress,
    }}
  />
)}
```

Check which of these variables are available in Challenge.jsx scope. `league`, `userTeam`, `isOnTeam`, `teams`, `getCurrentWeek` come from `useLeagueData()`. `contentSubmissions` and `loadContentSubmissions` may need to be added — check if Challenge.jsx already loads content submissions. If not, add a fetch:

```javascript
const [contentSubmissions, setContentSubmissions] = useState([])

// In the league data loading section:
useEffect(() => {
  if (!league?.id || !user?.id) return
  supabase
    .from('league_content_submissions')
    .select('*')
    .eq('league_id', league.id)
    .eq('user_id', user.id)
    .then(({ data }) => { if (data) setContentSubmissions(data) })
}, [league?.id, user?.id])
```

- [ ] **Step 5: Add Reach section CSS**

Append to `src/Challenge.css` (inside `.playlist-tab` scope):

```css
/* ── Reach Section (league-only) ── */
.playlist-tab .plt-reach-section {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.playlist-tab .plt-reach-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.playlist-tab .plt-reach-icon {
  font-size: 1.2rem;
}

.playlist-tab .plt-reach-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: #1a1a1a;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
```

- [ ] **Step 6: Verify build**

Run: `npm run build`

- [ ] **Step 7: Manual test**

- Join a league (or be in one already)
- Open Courage tab
- Scroll to bottom: "Reach" section should appear with 6 content task cards
- Non-league users should NOT see Reach section
- Tap a task card: URL input or player picker expands
- Submit: creates content submission
- Courage Proof + Flow in the Wild: also posts to community feed

- [ ] **Step 8: Commit**

```bash
git add src/components/PlayListTab.jsx src/components/ContentChallenges.jsx src/Challenge.jsx src/Challenge.css
git commit -m "feat: Reach section on Courage tab — content challenges for league members"
```
