# Progress Tab: Narrative Redesign Spec

## Summary

Replace the current Progress tab (hero stage + zone matrix + life fuel diamond + per-quest radars) with a 3-section narrative structure that tells the user's transformation story.

## Current State

The existing `ProgressTab.jsx` shows:
1. Hero stage card (Campbell journey names + movie refs + next step CTA)
2. Zone Matrix (Clarity x Action 2x2 grid)
3. Life Fuel Diamond (SVG diamond chart, % per channel)
4. Per-quest radars (PerQuestRadar swipeable cards)

## New Structure

```
Section 0: WHERE YOU ARE
  Hero stage + Zone Matrix + smart diagnostic + ordered CTA

Section 1: THE EVIDENCE
  Courage feed (what you did, what grew, how it felt, what it fed)

Section 2: THE JOURNEY
  Per-quest radars (start, now, dream) + life fuel comparison
```

## Design Mockups

Two HTML mockups exist and MUST be followed:
- `public/progress-tab-design.html` — brand-aligned single-page design (active user state)
- `public/progress-stages-mockup.html` — all 7 onboarding stages showing what appears at each step

The mockups show the exact visual design, connective tissue, and progressive disclosure. Read both before implementing.

## Connective Tissue (CRITICAL)

Sections are connected by italic bridge text that tells the story. These bridges change based on user stage:

```js
const BRIDGES = {
  essence: 'you are...',
  pain_early: 'but right now...',
  pain_progress: 'and it\'s working.',
  voice_early: 'what\'s getting in the way?',
  voice_progress: 'what\'s still getting in the way?',
  voice_late: 'your Ghost is getting quieter.',
  evidence: 'but this week you fought back.',
  journey: 'here\'s how far you\'ve come.',
  next: 'next step',
  income: 'the [EssenceName] is earning from what they love.',
}
```

Render as: `<div className="pt-bridge"><span className="pt-bridge-text">{text}</span></div>`

Bridge selection logic:
- Use `pain_early` when courage fuel data has NOT filled any missing job fuels
- Use `pain_progress` when courage fuels ARE filling gaps
- Use `voice_early` for first month of data
- Use `voice_progress` when voice count is decreasing
- Use `voice_late` when voice count dropped 50%+ from peak

## Section 0: WHERE YOU ARE

### What it shows

Hero stage bar (keep existing) + diagnostic copy + smart CTA. Remove Zone Matrix (replaced by narrative flow).

### Smart CTA logic

Show ONE CTA based on what's missing, checked in this order:

```js
// Priority order: each step depends on the previous
const checks = [
  { key: 'essence', check: hasEssence, title: 'Who are you really?', sub: 'Find out in 3 minutes.', route: '/essence-mirror' },
  { key: 'dome', check: hasDomeRatings, title: 'What lights you up?', sub: 'Tick experiences you love.', route: '/experience-game' },
  { key: 'current_job', check: hasCurrentJob, title: 'Where are you now?', sub: 'Map your current work.', route: '/add-current-job' },
  { key: 'paths', check: hasPaths, title: 'Choose your paths', sub: 'Turn experiences into life paths.', route: '/choose-quests' },
]
const nextStep = checks.find(c => !c.check)
```

### Data queries for checks

```js
// Has essence?
const { count: essenceCount } = await supabase.from('lead_flow_profiles')
  .select('id', { count: 'exact', head: true })
  .eq('user_id', userId)

// Has dome ratings? (already in calculateZoneMatrix)
// hasDome from matrixData

// Has current job?
const { count: currentJobCount } = await supabase.from('quests')
  .select('id', { count: 'exact', head: true })
  .eq('user_id', userId)
  .eq('is_current_job', true)

// Has non-current-job paths?
const { count: pathCount } = await supabase.from('quests')
  .select('id', { count: 'exact', head: true })
  .eq('user_id', userId)
  .eq('status', 'active')
  .eq('is_current_job', false)
```

### Diagnostic copy (when all steps complete)

Based on zone matrix position:
- **Self-Actualisation**: "You're on the diagonal. Keep going."
- **Misguided Zone**: "You're taking action but your direction isn't clear yet. Define your paths to move right."
- **Head Full of Dreams**: "You know what you want but haven't stretched this week. Add a courage challenge."
- **Unfulfilment**: "Start with the Experience Dome to find what lights you up."

### Protective voice section

Shows between fuel pain and evidence. Only renders when voice data exists.

**Data sources (combined, deduplicated by month):**

```js
// Source 1: Voice tagged on courage challenges
const { data: challengeVoices } = await supabase.from('groan_challenges')
  .select('predicted_voice, completed_at')
  .eq('user_id', userId)
  .not('predicted_voice', 'is', null)
  .eq('status', 'completed')

// Source 2: Voice wins from weekly reviews (stored as "ghost: what happened")
const { data: reviewVoices } = await supabase.from('weekly_reviews')
  .select('identity_did, identity_text, created_at')
  .eq('user_id', userId)
  .eq('identity_did', true)

// Combine: extract voice ID from each, count per month
// challengeVoices: voice = row.predicted_voice
// reviewVoices: voice = row.identity_text?.split(':')[0]?.trim()
```

**Display:**
- Find the dominant voice (most frequent)
- Count this month vs last month
- Find which dome dimension co-occurs most with that voice (from `groan_challenges.expansion_dimensions`)
- Show dot visualization: filled dots for count, empty dots for the difference
- Bridge text: "It's getting quieter" (if decreasing) or "Still showing up" (if same/increasing)

**When no voice data:** Skip this section entirely. Don't show an empty card.

### Design

- Keep hero stage bar (existing)
- Keep zone matrix (existing)
- Replace "Next step" card with the smart CTA (single button, purple, full width)
- Add diagnostic copy between matrix and CTA
- Remove movie refs (too much text for a 12-year-old)

## Section 1: THE EVIDENCE

### What it shows

A simple feed of recent courage challenges with their outcomes. No charts, no scores. Just readable rows.

### Each row shows:

```
[challenge title]
  [dim icon] [dim label] [level from] -> [level to]  |  [NS emoji]  |  [fuel icons]
```

Example:
```
Asked for a raise
  💜 Vulnerability 1 -> 2  |  😊 Fun  |  🤝 📈

Ran my first workshop
  👥 People 3 -> 5  |  🔥 Vibe Rise  |  📈 ✨

Posted my face on Instagram
  🪞 Identity 1 -> 2  |  😰 Stressful  |  (no fuel)
```

### Data query

```js
// This week's completed courage challenges
const weekStart = getWeekStartLocal()
const { data: groans } = await supabase.from('groan_challenges')
  .select('id, title, dimension_values, expansion_dimensions')
  .eq('user_id', userId)
  .eq('status', 'completed')
  .not('dimension_values', 'is', null)
  .gte('completed_at', weekStart + 'T00:00:00')
  .order('completed_at', { ascending: false })

// NS states for these challenges
const { data: checkins } = await supabase.from('nervous_system_checkins')
  .select('source_challenge_id, after_state')
  .in('source_challenge_id', groanIds)
  .not('after_state', 'is', null)

// Life fuel from quest_completions (parsed from reflection_text JSON)
const { data: completions } = await supabase.from('quest_completions')
  .select('reflection_text')
  .eq('user_id', userId)
  .eq('quest_category', 'Groans')
  .not('reflection_text', 'is', null)
  .gte('created_at', weekStart + 'T00:00:00')
```

### Dome growth per dimension

To show "level from -> to", compare each challenge's dimension values against the user's prior dome edges (same computation as WeeklyReview's `weeklyGrowth`). Use `getNumericTier()` from `domeDimensions.js` for numeric dimensions.

### When empty (no courage challenges this week)

```
Nothing yet this week.

Your progress shows up here when you complete
a courage challenge.

[Add a courage challenge]  -> opens WahooCreator or navigates to Paths tab
```

### NS state display

Map to 4 user-facing labels:
- vibe_rise / ventral -> "🔥 Vibe Rise"
- fun -> "😊 Fun"
- pressure / sympathetic / growth_edge -> "😰 Stressful"
- bored / uninterested / dorsal -> "😐 Bored"

### Life fuel display

Show fuel emojis that were checked for that challenge (parsed from `quest_completions.reflection_text` JSON `life_fuel` field). Match by challenge ID or timestamp proximity.

## Section 2: THE JOURNEY

### What it shows

Per-quest radar cards (existing `PerQuestRadar` component, already fixed with DomeOfSafety.css import) + life fuel comparison.

### Life fuel comparison

Below the radar cards, show two states:
1. **Started**: from `quests.life_fuel_baseline` (captured in current job flow)
2. **Now**: from courage challenge life fuel data (calculated from `quest_completions`)

Format:
```
Life Fuel         Started    Now
🔓 Choice          ✗         ✓ 
🤝 Connection      ✓         ✓
📈 Mastery         ✓         ✓
✨ Meaning          ✗         ✓
```

When no courage data exists yet, show only the "Started" column with a note: "Complete courage challenges to see how your fuels change."

### When no quests exist

```
Your Paths

You don't have any life paths yet.
Once you choose your paths, you'll see your
progress here.

[Choose paths]  -> /choose-quests
```

## Dynamic Pain Card (Fuel Feedback Loop)

The fuel pain card should NOT stay static. It evolves as courage challenge data accumulates:

**State A (no courage data):** Static snapshot from current job flow.
"Your current life gives you Connection and Mastery, but you're missing Choice and Meaning."

**State B (some courage data):** Compare job fuels vs courage challenge fuels.
"Your job gives you 🤝 Connection and 📈 Mastery. Your courage challenges are adding 🔓 Choice and ✨ Meaning."

**State C (strong courage data):** Show the shift.
"When you started, you were missing Choice and Meaning. Now your paths give you all four fuels. Your job alone still doesn't, but your whole life does."

**State D (all fuels active everywhere):**
"All four fuels are active. You're getting Choice, Connection, Mastery, and Meaning from what you love."

### Transition logic (precise):

```js
const jobFuels = currentJobQuest?.life_fuel_baseline || {} // { choice: false, connection: true, ... }
const courageFuels = calculateLifeFuel(courageEntries)     // { choice: 45, connection: 80, ... }
const FUEL_THRESHOLD = 20 // % — channel counts as "active" above this

const jobHas = CHANNEL_IDS.filter(id => jobFuels[id])
const jobMissing = CHANNEL_IDS.filter(id => !jobFuels[id])
const courageFilledGaps = jobMissing.filter(id => (courageFuels?.[id] || 0) >= FUEL_THRESHOLD)

// State A: no courage data at all
if (!courageFuels) → show static pain from job baseline

// State B: courage is filling some gaps
if (courageFilledGaps.length > 0 && courageFilledGaps.length < jobMissing.length)
  → "Your job gives you X. Your courage challenges are adding Y."

// State C: courage filled all gaps
if (courageFilledGaps.length === jobMissing.length)
  → "When you started, you were missing X. Now your paths give you all four."

// State D: all fuels active (including job)
if (jobMissing.length === 0)
  → "All four fuels are active."
```

## Evidence Trajectory Line

Below the weekly evidence feed, show a single comparison line:
"This week: 3 challenges, 3 dimensions grew. Last month: 8 challenges, 5 dimensions grew."

Data: count completed `groan_challenges` from current week vs prior 30 days. Count unique dimensions from `dimension_values` keys.

## Income-to-Identity Connection (Stage 8+)

The income card bridge text should connect earnings back to the essence archetype:
"The [Radiant Rebel] is earning from what they love."

This closes the full Dispenza loop visually: identity → action → income. The income isn't just a number, it's proof the identity shift worked.

## What to Remove

1. **Life Fuel Diamond SVG** (Section removed, fuel data moves to Section 2 as comparison table)
2. **Movie refs** on hero stage card (too much text)
3. **Courage score / avg gap numbers** (replaced by evidence feed)
4. **Monthly dome stretch text** (replaced by weekly growth in evidence feed)

## What to Keep

1. **Hero stage bar** (simplified, no movie refs)
2. **Zone Matrix** (existing, works well)
3. **PerQuestRadar** (existing, already fixed)
4. **HERO_STAGES** constant (keep for stage names + next step routes, remove refs arrays)

## File Changes

### `src/components/ProgressTab.jsx`
- Complete rewrite of the render function
- Add data fetching for: essence check, current job check, path check, weekly courage feed, NS states, life fuel per challenge
- Remove: life fuel diamond SVG, monthly dims computation
- Keep: hero stage fetch, zone matrix fetch, PerQuestRadar component

### `src/components/ProgressTab.css`
- Remove: `pt-fuel-diamond`, `pt-fuel-label`, `pt-fuel-svg`, `pt-fuel-pct`, `pt-fuel-name` styles
- Add: `pt-smart-cta`, `pt-diagnostic`, `pt-evidence-feed`, `pt-evidence-row`, `pt-evidence-dims`, `pt-evidence-ns`, `pt-evidence-fuel`, `pt-fuel-compare`, `pt-empty`

### No new files needed

## Conventions

- Light theme (`#f5f5f0` background, white cards)
- No em dashes in user-facing copy
- CSS scoped with `pt-` prefix
- 12-year-old readable language throughout
- Fixed bottom buttons: `left: 50%; transform: translateX(-50%); max-width: 480px`
- Import `getNumericTier` from `domeDimensions.js` for tier calculations
- Import `getWeekStartLocal` from `dateUtils` for week boundary
- NS states normalised to 4 user-facing labels (Vibe Rise, Fun, Stressful, Bored)

## Related

- Obsidian: `Frameworks/Courage Narrative Engine.md` (narrative hierarchy + design decisions)
- `docs/features/path-definition-narrative-redesign.md` (upstream flow that feeds this data)
- `src/components/WeeklyReview.jsx` (weekly growth computation pattern to reuse)
- `src/components/PerQuestRadar.jsx` (existing radar component, keep as-is)
- `src/lib/scoreUtilities.js` (`calculateZoneMatrix` function)
