# Wahoo Discovery & Inspiration — Implementation Plan

Created: 2026-06-12. Status: ALL 3 PHASES BUILT. Phase 1: discovery flow + gate
swaps. Phase 2: WahooInspiration (play-skills row + Ikigai Mix + pillar stub) in
PlayListTab. Phase 3: WahooCreator slimmed to freetext + bucket list (browse/AI
paths now live in WahooInspiration). Build + lint verified. Manual E2E pending.

## What's changing (one paragraph)

Wahoo identification moves away from play-skills as the required gate. A new 3-page
**Wahoo Discovery flow** (1-5 wahoos per category: Creation, Connection, Appearance)
becomes the Wahoo tab's first-visit state, launched from a renamed Level 0 quest
"Unlock Your Wahoos". Play-skills are repositioned as one of three **inspiration
engines** in a new "Need inspiration?" section on the Wahoo tab (play-skills now,
Ikigai Mix now, Essence Chamber pillar gaps later). The unlock/quest/gate signal
changes from "has play-skills rows" to "has wahoos with a category".

**Zero migrations. Zero edge function changes.** Everything needed already exists:
- `groan_challenges.wahoo_category` column + `status 'generated'/'accepted'` workflow
- `groan_source_type` ENUM already includes `skill_x_problem` (20260124100000)
- `groan-challenge-generator` already handles `skill_x_problem` with
  `skillLabel`/`problemLabel`/`personaLabel` (index.ts:229, 495-502)
- Accept pipeline: `createGroanChallenge` → `acceptGroanChallenge` →
  `priority_weekly_picks` insert (pattern at WahooCreator.jsx:163-187)
- `hasCompletedFlowFinder(userId)` in groanChallengeService.js:843 returns whether
  user has ≥1 skills + problems + persona clusters (gates Ikigai Mix visibility)

## Verified touch points (the entire blast radius)

| # | File:line | Current behavior | Change |
|---|---|---|---|
| 1 | `LevelConfig.js:28-34` | Quest `play_skills` "Find Your Wahoos", action `openPlaySkillPicker` | Rename id `find_wahoos`, name "Unlock Your Wahoos", action → navigate to Wahoo tab |
| 2 | `LevelTab.jsx:235, 358` | Done check `(hasCuriosityCompass \|\| hasPlaySkills)` | `(hasWahoos \|\| hasPlaySkills \|\| hasCuriosityCompass)` — compat OR |
| 3 | `LevelTab.jsx:368-` | Special render branch for `play_skills` with Start/Edit buttons mounting PlaySkillPicker | Delete branch; `find_wahoos` renders as normal navigate quest. Remove PlaySkillPicker import/mount from LevelTab |
| 4 | `LevelTab.jsx:166-178` | `hasPlaySkills` from skills rows `step_id 'get_started'` | Keep (compat). Add `hasWahoos` query: `groan_challenges` where `wahoo_category` not null, limit 1 |
| 5 | `Challenge.jsx:274-280` | Pre-unlock Wahoo tab via stale `step_id 'identify_topics'` (EXISTING BUG: PlaySkillPicker writes 'get_started', so tab re-locks on refresh) | Replace query: `groan_challenges` `wahoo_category` not null, limit 1, OR `nikigai_clusters` `step_id 'get_started'` + `cluster_type 'skills'` (compat). Fixes the bug |
| 6 | `PlayListTab.jsx:210-263` | State 1 gate: `playskills.length === 0` → "Find Your Play-Skills First" CTA → PlaySkillPicker | Gate becomes: no category wahoos AND no playskills → render `WahooDiscoveryFlow` full-tab |
| 7 | `PlayListTab.jsx:344-364` | State 2: bubbles + Active Wahoos + WahooCreator | Add `<WahooInspiration>` section below WahooCreator |
| 8 | `WahooCreator.jsx` | Two paths: freetext + browse (play-skill categories) | Phase 3 only: remove choose/browse steps, freetext becomes default. Until then, untouched |

**NOT touched (verified safe):** PlaySkillPicker.jsx itself (still writes
`step_id 'get_started'`); all Class 2 readers (ScopeMapFlow, CreatorHomeV2,
PeopleMatching, ExperienceCreatorFlow, RemarkableFlow, OfferBuilder100M,
ScaleIncomeFlow, ExperienceBlueprint, LifeMapFlow) — they read any
`cluster_type 'skills'` rows and already handle empty; GroanMatrix (reads
`flowFinderData.skills` from deeper Flow Finder, not PlaySkillPicker);
`groan-challenge-generator` edge function; all deeper flows that write skills rows.

## The shared signal

One concept drives quest ✓, permanent tab unlock, and tab state:

```js
// "Has this user identified wahoos?"
const { data } = await supabase
  .from('groan_challenges')
  .select('id')
  .eq('user_id', userId)
  .not('wahoo_category', 'is', null)
  .limit(1)
const hasWahoos = data?.length > 0
```

**Compat rule (existing users):** everywhere this gates something, OR it with the
old play-skills signal (`cluster_type 'skills'` + `step_id 'get_started'`), so
nobody who completed Level 0 under the old system sees their quest un-complete or
tab re-lock. New users only ever hit the wahoo path.

State model:
- Quest tapped → in-session unlock + navigate (existing `onNavigateTab` at Challenge.jsx:2130-2132, no change)
- Flow completed → wahoo rows exist → quest ✓, permanent unlock on reload, tab shows normal state
- Started flow but quit → nothing saved → gate intact, tab re-locks on reload, quest incomplete. Self-healing.

---

## Phase 1 — WahooDiscoveryFlow + gate swap (the bug-sensitive core)

### 1a. New component: `src/components/WahooDiscoveryFlow.jsx` (+ `.css`, prefix `wdf-`)

Rendered full-tab by PlayListTab when gate is open (replaces State 1 JSX).
Props: `userId`, `onComplete`.

**Pages 1-3** (Creation 🎨 → Connection 🤝 → Appearance 👤):
- Category explainer (one warm line each, e.g. Creation: "Making something and
  letting it exist where people can see it")
- 2-3 greyed example chips per category as anchors (static, from a local const)
- 1-5 free-text inputs: one visible initially, "+ Add another" up to 5, min 1
  non-empty to advance
- Progress dots, Back button (state preserved in local component state)

**Page 4 — "Pick your first Wahoo":**
- All entered wahoos listed grouped by category; user taps ONE
- Recommendation: ONE first active wahoo, not three. Active Wahoos are weekly
  picks (`priority_weekly_picks`), and Level 1's courage count is 1/week; three
  active in week one at Level 0 is overload. The rest sit visibly in the bucket.
- Save on confirm (nothing persisted before this moment):
  1. Loop all entries → `createGroanChallenge({ userId, title, description: title,
     visibilityLayer: 'screen', sourceType: 'skill', sourceLabel: 'Wahoo Discovery',
     scaryScore: 7, wahooScore: 7, wahooCategory })` — matches quick-add convention
     (PlayListTab.jsx:105-115), all land as `status 'generated'`
  2. For the chosen one: `acceptGroanChallenge(id)` + `priority_weekly_picks`
     insert (`pick_type 'groan'`, `week_start_date: getWeekStartLocal()`,
     `display_name: title`) — exact pattern from WahooCreator.jsx:176-187
  3. Run saves sequentially with a `saving` flag; on any error, show retry, do NOT
     call onComplete (avoids half-saved + gate-passed mismatch). Partial inserts
     are harmless: extra 'generated' rows just appear in the bucket.
- Success beat (confetti via useCelebrations or simple), then `onComplete()` →
  PlayListTab refetches playskills + categoryWahoos + activeChallenges → normal
  state renders with their wahoos in the bubbles. The unlock payoff happens on
  the screen they're already on.

### 1b. Gate swap in PlayListTab.jsx

- Derive `hasCategoryWahoos = Object.values(categoryWahoos).flat().length > 0`
  (categoryWahoos already fetched at line 44-71 — no new query)
- State 1 condition `playskills.length === 0` →
  `!hasCategoryWahoos && playskills.length === 0`
- State 1 body → `<WahooDiscoveryFlow userId={userId} onComplete={refetchAll} />`
  (keep Active Wahoos + completion modal renders that exist in current State 1)
- GOTCHA: loading flag must wait for BOTH playskills and categoryWahoos fetches
  (they're in the same Promise.all at line 77 — verify fetchCategoryWahoos resolves
  before `setLoading(false)`; it's inside the Promise.all, so yes)

### 1c. Quest swap in LevelConfig.js + LevelTab.jsx

- LevelConfig.js:28-34: `{ id: 'find_wahoos', name: 'Unlock Your Wahoos',
  narrative: 'Open your Wahoo space and name what would light you up.',
  icon: '🔥', navigateTo: 'Wahoo' }` (use the same navigateTo mechanic as
  `playlist_challenge` quests on levels 1+ and `healing_task` at Level 0)
- LevelTab.jsx: add `hasWahoos` state + query in the existing useEffect (160-219)
- Done checks at 235 and 358: `q.id === 'find_wahoos' ?
  (hasWahoos || hasPlaySkills || hasCuriosityCompass)`
- Delete the `play_skills` special render branch (368-) and the PlaySkillPicker
  mount/import in LevelTab. Verify no `quest_completions` rows are keyed to
  'play_skills' (done state is computed live, not persisted — confirmed by reading
  the done-check ternaries, but grep to be safe)
- Confirm LevelTab's quest tap handler passes `navigateTo` through `onNavigateTab`
  (same path the healing_task quest uses)

### 1d. Unlock fix in Challenge.jsx:274-280

Replace the `identify_topics` query with:

```js
Promise.all([
  supabase.from('groan_challenges').select('id').eq('user_id', user.id)
    .not('wahoo_category', 'is', null).limit(1),
  supabase.from('nikigai_clusters').select('id').eq('user_id', user.id)
    .eq('cluster_type', 'skills').eq('step_id', 'get_started').limit(1),
]).then(([w, s]) => {
  if (w.data?.length > 0 || s.data?.length > 0)
    setUnlockedTabs(prev => new Set([...prev, 'Wahoo']))
})
```

This also fixes the existing refresh re-lock bug.

## Phase 2 — "Need inspiration?" section

New component `src/components/WahooInspiration.jsx` (+ `.css`, prefix `wi-`),
mounted in PlayListTab below WahooCreator. Collapsible card: "Need inspiration? 💡".
Source rows appear only when their data exists — the section is the permanent home
for ALL inspiration engines (Essence Chamber briefing: pillar-fed wahoos belong on
the Wahoo tab / Y axis).

**Row 1 — ✨ Your play-skills** (always shown):
- If user has play-skill categories (pass `categoryIds` from PlayListTab, same
  derivation as WahooCreator's prop): render category chips → tap → generate 2-3
  suggestions via `groan-challenge-generator` `{ sourceType: 'skill', sourceLabel:
  seg.displayName, visibilityLayer }` → suggestion cards → accept via the standard
  3-step pipeline (include a one-tap wahoo-category select on the card,
  default 'creation')
- If none: copy "Play-skills are a deck of things that light people up. Pick yours
  for tailored Wahoo ideas." + button → mounts existing `PlaySkillPicker`
  (positioned as optional inspiration, NOT a requirement) → on complete, refetch
  playskills in PlayListTab → chips appear
- This is a lift of WahooCreator's `generateSuggestions` (WahooCreator.jsx:104-)
  — extract or duplicate; duplication is acceptable, it's ~40 lines

**Row 2 — 🎯 Ikigai Mix** (shown when `hasCompletedFlowFinder(userId).completed`,
service fn already exists at groanChallengeService.js:843):
- Fetch clusters via existing `fetchFlowFinderData(userId)` (service:753) —
  returns deduped `{ skills, problems, personas }`
- Three chip rows (skill / problem / persona), tap one each; "Shuffle 🎲" randomizes
  the trio; "Mix" enabled when all three selected
- Generate: `groan-challenge-generator` `{ sourceType: 'skill_x_problem',
  skillLabel, problemLabel, personaLabel, visibilityLayer }` — handled server-side
  at index.ts:229 already; response sourceLabel comes back as
  "skill × problem (for persona)" (index.ts:502)
- Accept: `createGroanChallenge` with `sourceType: 'skill_x_problem'`, the combined
  sourceLabel, user-picked `wahooCategory` (one-tap select on preview, default
  'creation'), then acceptGroanChallenge + weekly pick — OR save-for-later button
  that skips steps 2-3 (lands in bucket as 'generated')
- Sells the X axis: when row hidden, optionally show a locked teaser "Complete the
  Life Map to unlock Ikigai Mix" (one line, links /life-map)

**Row 3 — 🏛️ Fill a pillar** (FUTURE, do not build): appears when Essence Chamber
data exists (`flow_sessions.response_data.essence_chamber`, per the other
workstream). Empty/flickering pillars → "test a new orb" wahoo suggestions through
the same generator pipeline (new sourceType 'pillar' = one-line
`ALTER TYPE ... ADD VALUE` when needed; precedent: 20260429100000). Leave a
commented stub only.

## Phase 3 — WahooCreator slim-down (optional, lowest priority)

Once WahooInspiration ships, WahooCreator's 'choose' and 'browse'/'suggestions'
steps duplicate Row 1. Remove them: component opens straight at 'freetext'
("I know what I want to do" becomes the only path), keep 'fromlist' (bucket list)
step. Until this ships, keeping both paths is zero-risk redundancy.

## Edge cases / bug matrix

| Scenario | Outcome |
|---|---|
| Existing user with play-skills, no wahoos | Quest ✓ (compat OR), tab unlocked (compat OR), tab shows State 2 (playskills.length > 0). Sees normal tab + inspiration section. Never sees discovery flow |
| Existing user with quick-add wahoos | hasWahoos true everywhere; normal |
| New user quits flow mid-way + reloads | Nothing saved; tab re-locks; quest incomplete; taps quest again, restarts flow. Coherent |
| Save fails on entry 3 of 7 | Entries 1-2 exist as 'generated' (harmless bucket items), retry re-saves rest; acceptable duplicate risk is low (single retry path), or dedupe by exact title in the retry loop |
| Level 1+ user with zero wahoos and zero skills | Tabs aren't locked above Level 0 (Challenge.jsx:1820); lands on Wahoo tab → gate condition true → sees discovery flow. Correct: they should still identify wahoos |
| User completes flow, then deletes... | No delete path exists for groan_challenges in UI; not reachable |
| DailyCheckin / Tune / Healing tabs | Untouched |
| Wahoo Map (GroanMatrix) | Reads flowFinderData (deeper Flow Finder), unaffected |

## Verification checklist (before merge)

- [ ] `npm run build` + `npm run lint` (compare against HEAD lint baseline)
- [ ] Grep `play_skills` repo-wide — only remaining hits should be taxonomy/unrelated
- [ ] Grep `identify_topics` — Challenge.jsx hit gone; LevelTab.jsx:207-218
      (`hasPlaylistCompletion`, used by levels 1+ playlist quest fallback) is
      separate and stays
- [ ] Grep `quest_completions` for 'play_skills' keying — expect none
- [ ] New user E2E: fresh account → Level tab → "Unlock Your Wahoos" → tab opens →
      flow → 3 categories × ≥1 entry → pick first → success → bubbles populated,
      Active Wahoos shows 1 → reload → tab still unlocked, quest ✓
- [ ] Existing-user E2E (account with get_started skills rows): quest still ✓,
      tab unlocked, State 2 renders, inspiration section shows play-skill chips
- [ ] Ikigai Mix: account with Life Map data → row visible → mix → suggestion →
      accept → appears in Active Wahoos + correct category bubble
- [ ] Account WITHOUT Life Map data → Ikigai row hidden/teaser
- [ ] Quit flow at page 2 → reload → tab locked, no orphan rows in groan_challenges

## Build order

1. Phase 1 (flow + 4 gate swaps) — ship together, they're one atomic concept change
2. Phase 2 Row 1 (play-skills inspiration) — restores the browse capability removed
   from the new-user path
3. Phase 2 Row 2 (Ikigai Mix)
4. Phase 3 (WahooCreator slim) — anytime after 2

## Open items

- Page 1-3 example chips copy (3 per category) — draft during build, Nic reviews
- Whether the first-wahoo pick should offer "or skip, I'll choose later"
  (recommend yes: small text link, all rows stay 'generated', quest/unlock still
  satisfied since rows exist)
