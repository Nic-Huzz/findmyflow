# Blocker Fixes — Push to Main

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 6 blockers and 3 warnings across the uncommitted `feat/pay-the-bills` branch so all features can be cherry-picked to main.

**Architecture:** Targeted fixes only — no new features, no refactors. Each task is a surgical edit to an existing file.

**Tech Stack:** React 18, Supabase PostgreSQL

**Spec:** Review findings from 4 parallel code review agents (2026-10-04 session)

## Global Constraints

- Light theme only. Brand purple `#5e17eb`, gold `#E9A23B`.
- Never use em dashes in user-facing copy.
- Write so a 12-year-old would understand.
- Import dimensions from `src/data/domeDimensions.js`, never inline.
- `npm run build` must pass clean after every task.

---

### Task 1: Fix grounded_guardian image paths

**Files:**
- Modify: `src/data/essenceArchetypes.js:96-98`

**Interfaces:**
- Consumes: Image files at `public/images/essence/grounded-guardian.png`, `vision-grounded-guardian.png`, `swipe-grounded-guardian.png` (confirmed to exist)
- Produces: Correct image rendering for grounded_guardian archetype cards

- [ ] **Step 1: Fix the three image paths**

Replace lines 96-98:
```js
    image: '/images/essence/grounded-guardian.png',
    visionImage: '/images/essence/vision-grounded-guardian.png',
    swipeImage: '/images/essence/swipe-grounded-guardian.png',
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Clean build, no errors.

---

### Task 2: Update EssenceIdentify to 8 archetypes

**Files:**
- Modify: `src/pages/EssenceIdentify.jsx:12-54`

**Interfaces:**
- Consumes: `essenceProfiles` from `src/data/essenceProfiles.js` (has all archetypes including old ones — the reveal lookup uses `.find(a => a.name === finalArchetype)` which will still work for the new names since essenceProfiles contains all)
- Produces: Public quiz at `/essence-identify` serving only the 8 current archetypes

The 4 removed archetypes must be replaced with their closest new equivalents:
- `Sacred Jester` → absorbed into `Playful Creator` (both are Activator/humor-based)
- `Truth-Teller` → absorbed into `Mystic Messenger` (both are Transmuter/truth-based)
- `Heart Holder` → absorbed into `Grounded Guardian` (both are Stabilizer/care-based)
- `Wild Alchemist` → absorbed into `Heart Alchemist` (both are Transmuter/transformation-based)

- [ ] **Step 1: Replace VIBE_OPTIONS**

```js
const VIBE_OPTIONS = [
  { emoji: '💥', label: 'The spark that shakes things up', archetype: 'Radiant Rebel' },
  { emoji: '🎨', label: 'The creator who brings joy to life', archetype: 'Playful Creator' },
  { emoji: '🔮', label: 'The one who sees what others miss', archetype: 'Mystic Messenger' },
  { emoji: '💛', label: 'The alchemist who transforms pain into gold', archetype: 'Heart Alchemist' },
  { emoji: '🛡️', label: 'The steady heartbeat that helps everyone breathe', archetype: 'Grounded Guardian' },
  { emoji: '🌌', label: 'The connector who bridges worlds', archetype: 'Cosmic Connector' },
  { emoji: '👑', label: 'The compass in chaos who leads with care', archetype: 'Compassionate Leader' },
  { emoji: '⚙️', label: 'The architect who turns chaos into rhythm', archetype: 'Rhythm Architect' },
]
```

- [ ] **Step 2: Replace WOUND_OPTIONS**

```js
const WOUND_OPTIONS = [
  { emoji: '🚨', label: "I thought being bold would inspire others, but it made me the target. So I started filtering how I showed up.", archetype: 'Radiant Rebel' },
  { emoji: '🎈', label: "I thought my energy made things better, until it got called annoying. So I stopped being playful and started being 'normal'.", archetype: 'Playful Creator' },
  { emoji: '🔮', label: "I thought seeing the truth helped, until it made people leave. So I learned to stay quiet even when it hurt.", archetype: 'Mystic Messenger' },
  { emoji: '🌊', label: "I thought my feelings mattered, until they were called 'too much'. So I stopped sharing and held it all alone.", archetype: 'Heart Alchemist' },
  { emoji: '🪢', label: "I thought caring for others was my gift, until they said I was babying people. So I learned to keep my care to myself.", archetype: 'Grounded Guardian' },
  { emoji: '🌀', label: "I thought my way of connecting things was magic, until they said it was confusing. So I made myself smaller to fit in.", archetype: 'Cosmic Connector' },
  { emoji: '🩹', label: "I thought holding everyone together would keep the peace, but no one noticed when I was breaking. So I became the glue and lost my shape.", archetype: 'Compassionate Leader' },
  { emoji: '🧱', label: "I thought my standards made things better, until they called me controlling. So I hid my need for order.", archetype: 'Rhythm Architect' },
]
```

- [ ] **Step 3: Replace CHILD_OPTIONS**

```js
const CHILD_OPTIONS = [
  { emoji: '🚦', label: "I liked to challenge rules, not to be bad, but because I wanted to do what I want, not what others told me to do.", archetype: 'Radiant Rebel' },
  { emoji: '🪁', label: "I liked games and making things fun. Joy was my way of connecting.", archetype: 'Playful Creator' },
  { emoji: '🔮', label: "I noticed things others missed, patterns, feelings, what was really going on underneath.", archetype: 'Mystic Messenger' },
  { emoji: '🎨', label: "I liked to turn what I felt into art, drama, or stories.", archetype: 'Heart Alchemist' },
  { emoji: '🛡️', label: "I wanted to be the safe place, the friend who made everyone feel okay to be themselves.", archetype: 'Grounded Guardian' },
  { emoji: '🧬', label: "I liked to connect the dots between weird things, magic, science, stories, symbols.", archetype: 'Cosmic Connector' },
  { emoji: '🎤', label: "I liked to make sure no one got left out. I'd give up my turn, cheer the loudest, or carry everyone's feelings.", archetype: 'Compassionate Leader' },
  { emoji: '⚙️', label: "I liked to line things up, build systems, and make sure everything worked the way it should.", archetype: 'Rhythm Architect' },
]
```

- [ ] **Step 4: Replace CHARACTER_GROUPS**

```js
const CHARACTER_GROUPS = [
  { archetype: 'Radiant Rebel', characters: ['Deadpool', 'Billie Eilish', 'Katniss Everdeen'] },
  { archetype: 'Playful Creator', characters: ['Spider-Man', 'Robin Williams', 'Willy Wonka'] },
  { archetype: 'Mystic Messenger', characters: ['Morpheus', 'Rafiki', 'Luna Lovegood'] },
  { archetype: 'Heart Alchemist', characters: ['Tony Stark', 'David Bowie', 'Elizabeth Gilbert'] },
  { archetype: 'Grounded Guardian', characters: ['Ted Lasso', 'Uncle Iroh', 'Samwise Gamgee'] },
  { archetype: 'Cosmic Connector', characters: ['Doctor Strange', 'Rick Rubin', 'Gandalf'] },
  { archetype: 'Compassionate Leader', characters: ['Mufasa', 'Captain America', 'Brene Brown'] },
  { archetype: 'Rhythm Architect', characters: ['Hermione Granger', 'Spock', 'Shuri'] },
]
```

- [ ] **Step 5: Update file header comment**

Change line 10 from:
```js
// --- Quiz Data (8 archetypes from get-started path) ---
```
to:
```js
// --- Quiz Data (8 archetypes — must match ESSENCE_ARCHETYPES in essenceArchetypes.js) ---
```

- [ ] **Step 6: Verify build**

Run: `npm run build`
Expected: Clean build, no errors.

---

### Task 3: Fix PathDefinitionFlow aliveness race condition

**Files:**
- Modify: `src/flows/PathDefinitionFlow.jsx:444-448`

**Interfaces:**
- Consumes: `alivenessScores` state, `alivenessStep` state, `VIBE_RISE_DIMENSIONS` array
- Produces: No blank screen between last question and reveal

The race: `setTimeout(() => setAlivenessStep(prev => prev + 1), 300)` fires 300ms after `setAlivenessScores`. If React hasn't flushed the scores update by the time step advances to 5, `isReveal` is true but `allAnswered` is false → blank screen.

Fix: batch both updates together. Remove the setTimeout and advance step inside the scores setter callback, using `flushSync` is overkill — instead, just set both in the same event handler synchronously (React 18 batches these).

- [ ] **Step 1: Replace the onClick handler**

Find the onClick at approximately line 444-449:
```js
                        onClick={() => {
                          hapticLight()
                          setAlivenessScores(prev => ({ ...prev, [currentDim.id]: score }))
                          // Auto-advance after short delay
                          setTimeout(() => setAlivenessStep(prev => prev + 1), 300)
                        }}>
```

Replace with:
```js
                        onClick={() => {
                          hapticLight()
                          setAlivenessScores(prev => ({ ...prev, [currentDim.id]: score }))
                          setAlivenessStep(prev => prev + 1)
                        }}>
```

This removes the 300ms delay entirely. Both state updates batch in React 18, so the next render sees both the new score AND the advanced step simultaneously. No blank frame possible.

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Clean build, no errors.

---

### Task 4: Create missing DB migrations

**Files:**
- Create: `supabase/migrations/20261004000001_universe_response_columns.sql`
- Create: `supabase/migrations/20261004000002_coping_mechanism_column.sql`

**Interfaces:**
- Produces: `universe_response`, `universe_response_note`, `universe_response_updated_at` columns on `groan_challenges`
- Produces: `coping_mechanism` column on `groan_challenges`
- Consumed by: `WeeklyReview.jsx` queries at lines ~131, ~153, ~509, ~529, ~623

- [ ] **Step 1: Create universe_response migration**

Create `supabase/migrations/20261004000001_universe_response_columns.sql`:

```sql
-- Universe Response columns for groan_challenges
-- Tracks whether the universe responded to a courage challenge
-- Used in Weekly Review "Universe check" section

ALTER TABLE groan_challenges
  ADD COLUMN IF NOT EXISTS universe_response text
    CHECK (universe_response IN ('none', 'not_sure', 'compliment', 'opportunity', 'both')),
  ADD COLUMN IF NOT EXISTS universe_response_note text,
  ADD COLUMN IF NOT EXISTS universe_response_updated_at timestamptz;
```

- [ ] **Step 2: Create coping_mechanism migration**

Create `supabase/migrations/20261004000002_coping_mechanism_column.sql`:

```sql
-- Coping mechanism column for groan_challenges
-- Captures why an active courage challenge was not completed
-- Used in Weekly Review "Coping Pattern" section

ALTER TABLE groan_challenges
  ADD COLUMN IF NOT EXISTS coping_mechanism text
    CHECK (coping_mechanism IN ('learning', 'procrastination', 'avoidance', 'people_pleasing', 'external_block'));
```

- [ ] **Step 3: Apply migrations to Supabase**

Run both migrations against the live database using the Supabase MCP `apply_migration` tool. Verify columns exist afterward with:

```sql
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'groan_challenges'
  AND column_name IN ('universe_response', 'universe_response_note', 'universe_response_updated_at', 'coping_mechanism');
```

Expected: 4 rows returned.

---

### Task 5: Clean up warnings (EssenceMirrorFlow dead icons, ZoneCalSection error guard, vibeRiseDimensions comment)

**Files:**
- Modify: `src/flows/EssenceMirrorFlow.jsx:38-51` — remove 4 dead ARCHETYPE_ICON entries
- Modify: `src/components/ZoneCalSection.jsx:~161-199` — add try/finally around handleCheckinComplete
- Modify: `src/data/vibeRiseDimensions.js:4` — fix "6 dims" comment to "5 dims"

**Interfaces:**
- No interface changes. These are internal cleanup fixes.

- [ ] **Step 1: Remove dead ARCHETYPE_ICON entries**

In `src/flows/EssenceMirrorFlow.jsx`, remove these 4 lines from the `ARCHETYPE_ICON` object:
```js
  sacred_jester: <FaceSmileIcon style={{ width: 28, height: 28 }} />,
  truth_teller: <BoltIcon style={{ width: 28, height: 28 }} />,
  heart_holder: <HeartIcon style={{ width: 28, height: 28, color: '#ec4899' }} />,
  wise_sage: <MapPinIcon style={{ width: 28, height: 28 }} />,
```

Also check if `FaceSmileIcon`, `BoltIcon`, `MapPinIcon` are still imported elsewhere in the file. If any are now unused, remove from the import statement. `HeartIcon` is still used by `heart_alchemist`, keep it.

- [ ] **Step 2: Add try/finally to ZoneCalSection**

In `src/components/ZoneCalSection.jsx`, find `handleCheckinComplete`. Wrap the body in try/finally so `isSubmitting.current` always resets:

```js
  const handleCheckinComplete = async (scores) => {
    if (isSubmitting.current) return
    isSubmitting.current = true
    try {
      // ... existing logic (snapshot save, bridge attempt, etc.) ...
    } catch (err) {
      console.error('Check-in submit error:', err)
    } finally {
      isSubmitting.current = false
    }
  }
```

- [ ] **Step 3: Fix vibeRiseDimensions comment**

In `src/data/vibeRiseDimensions.js` line 4, change:
```js
 * NOT the lead magnet (VibeRiseRadar.jsx has its own 6 dims, separate product).
```
to:
```js
 * NOT the lead magnet (VibeRiseRadar.jsx has its own 5 dims, separate product).
```

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: Clean build. If unused icon imports cause warnings, remove them.

---

### Task 6: Commit, cherry-pick to main, push

**Files:** All files modified/created across tasks 1-5 + all pre-existing uncommitted work on `feat/pay-the-bills`

- [ ] **Step 1: Stage and commit all changes on feat/pay-the-bills**

```bash
git add -A
git commit -m "feat: pain point tools, essence 8-archetype, vibe rise radar, zone cal, observations, weekly review extras

- Pattern Interrupt, ADAC, Triple Warmer I AM Tapping, Garbage Can flows
- Essence archetypes simplified from 12 to 8, EssenceIdentify updated
- Vibe Rise Radar rewritten to 5 dimensions
- Path Definition aliveness baseline screen (race condition fixed)
- Zone Cal polish (submit guard, previous scores overlay)
- Intelligence observations engine + card
- Zarlo context injection for observations
- GenericRadar scores3 layer
- Weekly Review: New You Protocol, universe response, incomplete challenges
- DB migrations: pain point tools, universe response, coping mechanism, zone cal snapshots, observations"
```

- [ ] **Step 2: Switch to main and cherry-pick**

```bash
git checkout main
git pull origin main
git cherry-pick <commit-hash-from-step-1>
```

If there are merge conflicts, resolve them manually. The most likely conflicts are in files that were also changed on main since the branch diverged.

- [ ] **Step 3: Verify build on main**

```bash
npm run build
```

Expected: Clean build, no errors.

- [ ] **Step 4: Push to main**

```bash
git push origin main
```

- [ ] **Step 5: Switch back to feature branch**

```bash
git checkout feat/pay-the-bills
```
