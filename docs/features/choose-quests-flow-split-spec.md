# Choose Quests Flow Split — Implementation Spec

## Context

The current `/choose-quests` flow is too long. Users discover paths AND define them (dimensions, fuels, buts, identity, courage challenge) in one session. This causes drop-off at the commitment screens when users are still in discovery energy.

**Solution:** Split into two flows. Flow 1 = discovery (what paths exist?). Flow 2 = commitment (how serious am I about each path?). Flow 1 creates the quests. Flow 2 enriches them one at a time from the Paths tab.

## Flow 1: Path Discovery (`/choose-quests`)

### What it does now
Select dome experiences → Deep dive (formats + vectors) → AI generates projects → User removes unwanted projects → 4+ projects cluster into paths → User reviews/renames/moves projects → Path definition (3 screens x N paths) → Save

### What it becomes
Select dome experiences → Deep dive (formats + vectors) → AI generates projects → User removes unwanted projects → 4+ projects cluster into paths → User reviews/renames/moves projects → **Save quests + redirect to Paths tab**

### Steps removed from Flow 1
All path definition screens (Setup, Framing, Commitment) move to Flow 2. Flow 1 ends after paths review.

### What gets saved at end of Flow 1
For each path the user confirms:
- `quests` row: `label` (path name), `status: 'active'`, `predicted_state: 'vibe_rise'`, `career_id: 'dome-bridge-{timestamp}'`
- `quest_experiences` rows: one per project under each path, with `label` = project name
- `life_path_sessions` upsert (so Paths tab unlocks)
- Hero stage graduation check (stage 4→5 trigger: 1+ quest created)

### What does NOT get saved (deferred to Flow 2)
- `precursor_level`, `current_dimensions`, `dream_dimensions` (dome dimension ratings)
- `staying_fuels`, `path_fuels` (life fuel selections)
- `buts`, `fear_outcome`, `identity_declaration`, `protective_voice`
- First courage challenge creation

### What DOES get saved from deep dive data
- `career_vector`: resolved via majority rule from the path's projects. Each project inherits the vector from its source experience. If a path has 3 projects (2x `facilitate_it`, 1x `do_it`), the path's vector = `facilitate_it`. Fallback = first project's vector.
- `format_picks`: union of all format picks across the path's projects.

### Custom projects
Users can add their own project ideas at the projects step. "+ Add your own project" text input at the bottom of the projects list. Custom projects get `draws_from: 'custom'` and no vector (user sets this in Flow 2 if needed).

### UI fixes in Flow 1

#### 1. Remove "Toast / wedding speech" sub-node
**File:** `src/data/experienceDomeSubNodes.js`
**Action:** Remove `{ id: 'fmt-speak-toast', label: 'Toast / wedding speech' }` (or equivalent) from the public speaking sub-nodes.

#### 2. Project tags on paths review screen
**File:** `src/flows/ChooseQuestsFlow.jsx` (PATHS_REVIEW step)
**Current:** Small purple tags with `↕` suffix
**Change:**
- Make tags larger (font-size 13px, padding 6px 12px)
- Add "Projects:" label above the tags section
- Add "Click to move" subtitle text below the label (font-size 11px, opacity 0.4)

**File:** `src/flows/ChooseQuestsFlow.css`
- `.cqf-path-source` → increase padding/font-size
- Add `.cqf-projects-label` and `.cqf-projects-hint` styles

### Save logic (replaces current `saveQuests`)

```javascript
// For each confirmed path:
const { data: quest } = await supabase.from('quests').insert({
  user_id: user.id,
  label: path.name,
  career_id: `dome-bridge-${Date.now()}-${idx}`,
  predicted_state: 'vibe_rise',
  status: 'active',
  // Save vector + formats from deep dive (available in Flow 1)
  career_vector: questVector,
  format_picks: questFormats.length ? questFormats : null,
}).select('id').single()

// Create quest_experiences for each project under the path
if (path.projects?.length) {
  await supabase.from('quest_experiences').insert(
    path.projects.map((p, j) => ({
      quest_id: quest.id,
      user_id: user.id,
      label: p.name,
      status: 'active',
      sort_order: j,
    }))
  )
}
```

### Post-save redirect
Navigate to `/7-day-challenge` (Paths tab). Show a toast or inline prompt:
"Your paths are set. Tap a path to define your first courage challenge."

---

## Flow 2: Path Definition (`/path-definition/:questId`)

### What it does
Opens for ONE path at a time. User defines their relationship to this path: where they are, where they want to be, what's in the way, and commits to a first step.

### Entry points
- **Paths tab:** CTA on each quest card — "Define this path →" (shows when quest has no `current_dimensions` yet)
- **Post Flow 1 redirect:** Optional auto-prompt for first path

### Route
New route: `/path-definition/:questId`

### Screens (3 screens, same content as current path_def but improved)

#### Screen 0: Setup
1. **Precursor level** — "Have you taken any steps on this path already?" (Not yet / I've tried it / I do it for fun / I've been paid / It's my job)
2. **Dome dimensions — ALL 8, CURRENT + ASPIRATION**
   - Show all 8 dimensions (People, Money, Vulnerability, Stakes, Rarity, Identity, Context, Business)
   - For each: select CURRENT level, then select ASPIRATION level
   - This creates the radar gap (purple = current, gold = aspiration)
   - The precursor answer auto-places "Our Guess" marker (not "YOU")
   - **All dimension tiers framed as "per experience"** (not per month). Tier values come from `src/data/domeDimensions.js` (source of truth). Update that file with the new tiers:
   - **Money:** $0, $500, $1,000, $2,500, $5,000, $10,000+
   - **People:** 1, 10, 50, 100, 250, 500, 1,000, 10,000
   - Other dimensions (Vulnerability, Stakes, Rarity, Identity, Context, Business) keep existing tier structure from domeDimensions.js

#### Screen 1: Framing (Life Fuel + Buts + Reframe)
1. **Life Fuel — current life**
   - "What does your current life give you?"
   - Multi-select: Choice, Connection, Mastery, Meaning
   - **Add "None of the above" option** (saves empty array)
2. **Life Fuel — this path**
   - "What does this path give you?"
   - Multi-select: same 4 options
3. **Life Fuel comparison**
   - **Spell out words, not just emojis**
   - Example: "Your current life gives you Connection. This path gives you Choice, Connection, Mastery, Meaning. So what's in the way?"
4. **Buts** — "What's stopping you?"
   - User enters 1-3 buts (text inputs)
5. **Reframe**
   - **"See the reframe" = proper button** (gold background, not text link)
   - Shows "I [but], AND [reframe]" transformation

#### Screen 2: Commitment
1. **Smallest step this week**
   - Text input
   - **Fear/block display: show ALL entered buts**, not just one. Let user pick which but is the biggest block, or show them all.
2. **Fear outcome** — "If your but wins and you never do this, what are you most afraid happens?"
3. **Identity declaration** — "I am someone who..."
   - Text input + example chips
4. **Protective voice** — "Which voice tries to stop you from being that person?"
   - **Add space between emoji and label** in the voice options
   - Perfectionist, Ghost, People Pleaser, Controller, Auto-Pilot
5. **Create first courage challenge** from smallest step
   - Insert `groan_challenges` + `quest_tasks` linking to the quest

### Commitment page UX redesign (item 12)
Current screen is too cramped — smallest step, block display, fear, identity, voice picker all on one scroll. 

**Proposed:** Break Screen 2 into sub-steps within the screen:
- 2a: Smallest step + fear (action-oriented)
- 2b: Identity declaration + voice picker (identity-oriented)

Or use a progressive reveal: each section appears after the previous one is filled in. Reduces visual overwhelm without adding more route transitions.

### What gets saved at end of Flow 2
Updates the existing quest row:
```javascript
await supabase.from('quests').update({
  precursor_level,
  current_dimensions,
  dream_dimensions,
  staying_fuels: [...stayingFuels],
  path_fuels: [...pathFuels],
  buts: butTexts,
  fear_outcome,
  identity_declaration,
  protective_voice,
}).eq('id', questId)
```

Creates first courage challenge:
```javascript
const { data: challenge } = await supabase.from('groan_challenges').insert({
  user_id, text: smallestStep, status: 'active',
  source_type: 'skill', challenge_source: 'path_definition',
  source_label: questLabel,
})
await supabase.from('quest_tasks').insert({
  quest_id: questId, user_id, text: smallestStep,
  is_courage_challenge: true, groan_challenge_id: challenge.id,
})
```

---

## Architecture Changes

### New files
- `src/flows/PathDefinitionFlow.jsx` — new flow component for Flow 2
- `src/flows/PathDefinitionFlow.css` — styles

### Modified files
- `src/flows/ChooseQuestsFlow.jsx` — remove PATH_DEF step, update save logic to create quests + projects without definition data
- `src/AppRouter.jsx` — add `/path-definition/:questId` route
- `src/components/level/LevelTab.jsx` or `QuestBoardCard.jsx` — add "Define this path →" CTA on quests without `current_dimensions`
- `src/data/experienceDomeSubNodes.js` — remove toast/wedding speech sub-node
- `src/data/domeDimensions.js` — update money tiers and people tiers

### DB changes
None. All columns already exist on the `quests` table. Flow 2 just UPDATE's the row that Flow 1 INSERT'd.

### Quest hierarchy integration
Flow 1 creates paths. If the user already has a category quest (from Direction Bridge at Stage 8+), Flow 1 could ask "Does this path belong to [category name]?" and set `category_quest_id`. For Phase 2 users (pre-category), paths are standalone.

---

## Implementation Order

### Phase A: Flow 1 polish (ship first)
1. Remove toast/wedding speech sub-node
2. Update project tags UI (bigger, label, hint)
3. Update save logic: create quests + quest_experiences, skip path definition
4. Post-save redirect to Paths tab with prompt
5. Deploy + test

### Phase B: Flow 2 build
1. Create PathDefinitionFlow.jsx — **full state rewrite, not extraction from ChooseQuestsFlow.** Current path_def uses index-based state (precursorLevels[pathIdx], selectedDims[pathIdx]). Flow 2 needs quest-ID-based state that loads/saves directly from/to the DB per quest. This is a ground-up component, not a copy-paste.
2. Implement all UI fixes (dimensions current+aspiration, tiers from domeDimensions.js, "Our Guess", life fuel "none", spelled-out comparison, reframe button, voice emoji spacing, all buts shown, commitment redesign)
3. Add route to AppRouter
4. Add "Define this path →" CTA to quest cards (condition: `quest.current_dimensions` is null)
5. Deploy + test

### Phase C: Cleanup
1. Remove old PATH_DEF code from ChooseQuestsFlow.jsx
2. Remove unused state variables (pdPathIndex, pdScreen, precursorLevels, selectedDims, etc.)
3. Update CLAUDE.md with new route + flow description

## Resolved Design Questions

### Dome dimension current + aspiration UI
Reuse the ambition radar interaction pattern from `/try/ambition-radar` (AmbitionRadar.jsx). Purple shape = current, gold shape = aspiration. Same dual-state per dimension. Adapt the component for use inside PathDefinitionFlow rather than as a standalone lead magnet.

### Re-run behavior
Additive. New paths created alongside existing ones. To prevent accidental duplication:
- On entering `/choose-quests`, if user has existing dome-bridge paths, show a note: "You already have [N] paths. This will add new ones alongside them."
- On Paths tab, each quest card needs a delete/archive option (long-press or swipe or menu) so users can remove duplicates.
- Delete sets `quest.status = 'archived'` (soft delete, preserves history).
