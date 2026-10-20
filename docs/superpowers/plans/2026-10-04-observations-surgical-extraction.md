# Intelligence Observations — Surgical Extraction to Main

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cherry-pick only the Intelligence Observations feature from `feat/pay-the-bills` onto `main` and push to production.

**Architecture:** The observation system is self-contained: a pure-function engine (`observationEngine.js`) runs 15 detectors over user data, an `ObservationCard` component renders up to 3 cards between Essence and Voice on ProgressTab, and Zarlo receives pre-loaded observation context via a custom event. The only shared surface is ProgressTab (which needs 6 surgical insertions) and Zarlo (which needs prop additions).

**Tech Stack:** React 18, Supabase (PostgreSQL + RLS), Vite

**Spec:** `docs/features/intelligence-observations-spec.md`

## Global Constraints

- **Branch safety:** All work happens on `main` directly. The migration is already applied to prod Supabase — we're shipping the frontend code to match.
- **No other branch work:** Do NOT bring Zone Cal, reflection cards, DomeGrowthOverlay, bridge flow, or any other `feat/pay-the-bills` changes.
- **Light theme, no em dashes** in user-facing copy.
- **CSS scoping:** All observation CSS is scoped to `.progress-tab` parent.
- **Emojis allowed for now** — observation icons are emojis; the Heroicons sweep is a separate ticket.

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/lib/observationEngine.js` | 15 pure-function detectors + engine runner |
| Create | `src/components/ObservationCard.jsx` | Card with swipe + X dismiss, type borders, Zarlo CTA |
| Create | `src/components/ObservationCard.css` | Scoped card styles, fade-in animation |
| Create | `supabase/migrations/20260926000001_user_dismissed_observations.sql` | Already applied to prod — file exists for migration history only |
| Modify | `src/components/ProgressTab.jsx` | 6 insertion points: imports, state, queries, destructure, engine call, render block, handlers |
| Modify | `src/components/Zarlo/ZarloWidget.jsx` | Add event listener, injectedContext state, pass props to ZarloChat |
| Modify | `src/components/Zarlo/ZarloChat.jsx` | Accept injectedContext props, inject into greeting + follow-up system prompts, re-init on context change |

---

### Task 1: Commit observation files on feature branch, then create extraction branch

**Files:**
- No new file changes — committing existing work

**CRITICAL CONTEXT:** The 4 standalone observation files (`observationEngine.js`, `ObservationCard.jsx`, `.css`, migration) are **untracked** (never committed). The Zarlo files have **uncommitted** observation changes. `git checkout feat/pay-the-bills -- <file>` only retrieves committed state, so we must commit these files on the feature branch first.

- [ ] **Step 1: Commit observation files on `feat/pay-the-bills`**

```bash
git add \
  src/lib/observationEngine.js \
  src/components/ObservationCard.jsx \
  src/components/ObservationCard.css \
  supabase/migrations/20260926000001_user_dismissed_observations.sql \
  src/components/Zarlo/ZarloChat.jsx \
  src/components/Zarlo/ZarloWidget.jsx
git commit -m "feat: Intelligence Observations system + Zarlo context integration"
```

- [ ] **Step 2: Stash remaining uncommitted work and create extraction branch**

```bash
git stash -u
git checkout main
git pull origin main
git checkout -b feat/observations-extraction
```

- [ ] **Step 3: Verify clean state**

```bash
git status
# Should show: nothing to commit, working tree clean
```

---

### Task 2: Add standalone observation files (no dependencies on other branch work)

**Files:**
- Create: `src/lib/observationEngine.js`
- Create: `src/components/ObservationCard.jsx`
- Create: `src/components/ObservationCard.css`
- Create: `supabase/migrations/20260926000001_user_dismissed_observations.sql`

**Interfaces:**
- Produces: `runObservationEngine(data, dismissedIds)` → sorted observation array; `ObservationCard` component with props `{ observation, onDismiss, onAskZarlo }`

- [ ] **Step 1: Copy the 4 standalone files from the feature branch**

These are now committed on `feat/pay-the-bills` (from Task 1), so `git checkout` works:

```bash
git checkout feat/pay-the-bills -- \
  src/lib/observationEngine.js \
  src/components/ObservationCard.jsx \
  src/components/ObservationCard.css \
  supabase/migrations/20260926000001_user_dismissed_observations.sql
```

- [ ] **Step 2: Verify files landed correctly**

```bash
ls -la src/lib/observationEngine.js src/components/ObservationCard.jsx src/components/ObservationCard.css supabase/migrations/20260926000001_user_dismissed_observations.sql
```

All 4 files should exist.

- [ ] **Step 3: Commit**

```bash
git add src/lib/observationEngine.js src/components/ObservationCard.jsx src/components/ObservationCard.css supabase/migrations/20260926000001_user_dismissed_observations.sql
git commit -m "feat: add Intelligence Observations engine, card component, and migration"
```

---

### Task 3: Patch ProgressTab with observation wiring (6 insertion points)

**Files:**
- Modify: `src/components/ProgressTab.jsx`

**Interfaces:**
- Consumes: `runObservationEngine()` from `observationEngine.js`, `ObservationCard` component
- Produces: Observation cards rendered between Essence and Voice sections

There are 6 exact insertion points in main's `ProgressTab.jsx`. Apply them in order.

- [ ] **Step 1: Add imports (after line 18 — after `import './ProgressTab.css'`)**

Add these two imports after the existing import block:

```jsx
import ObservationCard from './ObservationCard'
import { runObservationEngine } from '../lib/observationEngine'
```

The file on main ends its imports at line 18 (`import './ProgressTab.css'`). Insert these two lines immediately after.

- [ ] **Step 2: Add state declaration (after the `questNames` useState, which is at line 162 on main)**

Find this line on main:
```jsx
  const [questNames, setQuestNames] = useState({})
```

Insert immediately after it:
```jsx

  // Observations (Intelligence Observations system)
  const [observations, setObservations] = useState([])
```

- [ ] **Step 3: Expand the `completionsRes` query to include observation-needed fields**

Find this query in the Promise.all block on main:
```jsx
          // Life fuel from quest_completions
          supabase.from('quest_completions')
            .select('reflection_text')
            .eq('user_id', userId)
            .eq('quest_category', 'Groans')
            .not('reflection_text', 'is', null),
```

Replace it with (adds `quest_id, aftertaste, aftertaste_week_later` to select + adds ascending order):
```jsx
          // Completions (life fuel + observations need quest_id, aftertaste)
          supabase.from('quest_completions')
            .select('reflection_text, quest_id, aftertaste, aftertaste_week_later')
            .eq('user_id', userId)
            .eq('quest_category', 'Groans')
            .not('reflection_text', 'is', null)
            .order('created_at', { ascending: true }),
```

- [ ] **Step 4: Add 5 new queries to the Promise.all block + expand destructure**

Find the end of the Promise.all queries on main. The last query before the closing `])` is the `income_self_reports` query. After that query (and before the `])`), add these 5 queries:

```jsx
          // Observations: all completed challenges (voice, dims, prediction, quest)
          supabase.from('groan_challenges')
            .select('id, status, gap_voice, dimension_values, completed_at, predicted_difficulty, experienced_difficulty, quest_id')
            .eq('user_id', userId)
            .eq('status', 'completed'),
          // Observations: all NS checkins
          supabase.from('nervous_system_checkins')
            .select('before_state, after_state, created_at, source_challenge_id')
            .eq('user_id', userId)
            .not('before_state', 'is', null)
            .order('created_at', { ascending: true }),
          // Observations: dismissed observation IDs
          supabase.from('user_dismissed_observations')
            .select('observation_id')
            .eq('user_id', userId),
          // Observations: path fuel reviews
          supabase.from('path_fuel_reviews')
            .select('quest_id, choice, connection, mastery, meaning, week_of, created_at')
            .eq('user_id', userId)
            .order('week_of', { ascending: true }),
          // Observations: cross-pollination
          supabase.from('quest_cross_pollination')
            .select('source_quest_id, target_quest_id')
            .eq('user_id', userId),
```

Then expand the destructure. On main it's:
```jsx
        const [
          stageRes,
          essenceRes,
          currentJobRes,
          pathRes,
          questsRes,
          groanRes,
          completionsRes,
          challengeVoicesRes,
          reviewVoicesRes,
          monthlyGroanRes,
          stageProgressRes,
        ] = await Promise.all([
```

Replace with:
```jsx
        const [
          stageRes,
          essenceRes,
          currentJobRes,
          pathRes,
          questsRes,
          groanRes,
          completionsRes,
          challengeVoicesRes,
          reviewVoicesRes,
          monthlyGroanRes,
          stageProgressRes,
          obsChallengesRes,
          obsNsCheckinsRes,
          obsDismissedRes,
          obsPathFuelRes,
          obsCrossPollinationRes,
        ] = await Promise.all([
```

- [ ] **Step 5: Add observation engine call in the data processing section**

Find this block on main (around line 441-448, the income data processing):
```jsx
        if ((stageRes.data?.current_journey_level || 0) >= 8 && stageProgressRes.data?.[0]) {
          const inc = stageProgressRes.data[0]
          setIncomeData({
            amount: inc.amount_cents / 100,
            currency: inc.currency || 'USD',
            source: inc.source,
            monthYear: inc.month_year,
          })
        }
```

Insert immediately after the closing `}`:
```jsx

        // ── Intelligence Observations ──
        const dismissedIds = (obsDismissedRes.data || []).map(d => d.observation_id)
        const obsQueue = runObservationEngine(
          {
            completions: completionsRes.data || [],
            challenges: obsChallengesRes.data || [],
            nsCheckins: obsNsCheckinsRes.data || [],
            pathFuelReviews: obsPathFuelRes.data || [],
            crossPollination: obsCrossPollinationRes.data || [],
            questNames: namesMap,
          },
          dismissedIds
        )
        setObservations(obsQueue)
```

Note: `namesMap` is already defined earlier in the same function on main (around line 288).

- [ ] **Step 6: Add dismiss + Zarlo handler functions**

Find this line on main (the `setupComplete` useMemo, approximately line 505-509 on main):
```jsx
  // Setup completion map
  const setupComplete = useMemo(() => ({
```

Insert immediately before it:
```jsx
  // ── Observation handlers ──
  const dismissObservation = async (observationId, resolutionKey) => {
    setObservations(prev => prev.filter(o => o.id !== observationId))
    const dismissKey = resolutionKey || observationId
    if (userId) {
      await supabase
        .from('user_dismissed_observations')
        .upsert({
          user_id: userId,
          observation_id: dismissKey,
          dismissed_at: new Date().toISOString(),
        }, { onConflict: 'user_id,observation_id' })
    }
  }

  const handleAskZarlo = (context) => {
    window.dispatchEvent(new CustomEvent('zarlo:openWithContext', {
      detail: { context, source: 'observation' }
    }))
  }

```

- [ ] **Step 7: Add observation cards render block between Essence and Voice**

Search for the string `{/* ═══ VOICE SECTION ═══ */}` on main (line 720). The `)}` two lines above it closes the Essence card `<>...</>` fragment. Insert the observations block between them:
```jsx
      )}

      {/* ═══ OBSERVATIONS (Intelligence Observations) ═══ */}
      {observations.length > 0 && (
        <>
          <div className="pt-bridge"><span className="pt-bridge-text">what your data shows...</span></div>
          <div className="obs-section-header">Observations</div>
          <div className="obs-section">
            {observations.slice(0, 3).map(obs => (
              <ObservationCard
                key={obs.id}
                observation={obs}
                onDismiss={dismissObservation}
                onAskZarlo={handleAskZarlo}
              />
            ))}
          </div>
        </>
      )}

      {/* ═══ VOICE SECTION ═══ */}
```

- [ ] **Step 8: Build and verify**

```bash
npm run build
```

Expected: Build succeeds with no errors. Warnings about chunk size are fine.

- [ ] **Step 9: Commit**

```bash
git add src/components/ProgressTab.jsx
git commit -m "feat: wire Intelligence Observations into ProgressTab (6 insertion points)"
```

---

### Task 4: Copy Zarlo files wholesale from feature branch

**Files:**
- Modify: `src/components/Zarlo/ZarloWidget.jsx`
- Modify: `src/components/Zarlo/ZarloChat.jsx`

**Interfaces:**
- Consumes: `zarlo:openWithContext` custom event from ProgressTab's `handleAskZarlo`
- Produces: Observation-aware Zarlo with `injectedContext` in greeting + follow-up system prompts

**WHY wholesale copy is safe:** Both Zarlo files' diffs vs main are observation-only (no Zone Cal, bridge flow, or other branch work mixed in). Verified by `git diff main -- src/components/Zarlo/*.jsx`. This is faster and less error-prone than manual patching.

- [ ] **Step 1: Copy both Zarlo files from the feature branch**

```bash
git checkout feat/pay-the-bills -- \
  src/components/Zarlo/ZarloWidget.jsx \
  src/components/Zarlo/ZarloChat.jsx
```

- [ ] **Step 2: Verify the diff is observation-only (no unexpected changes)**

```bash
git diff --cached -- src/components/Zarlo/ZarloWidget.jsx
git diff --cached -- src/components/Zarlo/ZarloChat.jsx
```

**ZarloWidget.jsx** should show exactly 2 hunks:
1. New `injectedContext` + `injectedContextKey` state + event listener (18 lines added after `checkProactiveInsights`)
2. Updated `ZarloChat` render: `onClose` wraps `handleClose` + clears context, 2 new props passed

**ZarloChat.jsx** should show exactly 4 hunks:
1. Function signature: adds `injectedContext = null, injectedContextKey = null` params
2. New `useEffect` for re-initialization on context change (12 lines after init useEffect)
3. `showAIGreeting`: `const` → `let` pageContext, observation context appended, conditional greeting prompt
4. `sendAIMessage`: `const` → `let` pageContext, observation context appended

If you see ANY changes not related to observations (e.g. different imports, removed code, new features), STOP and revert with `git checkout HEAD -- src/components/Zarlo/`.

- [ ] **Step 3: Build and verify**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git commit -m "feat: Zarlo observation context integration (greeting + follow-up + re-init)"
```

---

### Task 5: Final build, push, and restore working branch

**Files:**
- No file changes

- [ ] **Step 1: Full build verification**

```bash
npm run build
```

Expected: Clean build, no errors.

- [ ] **Step 2: Review all commits on this branch**

```bash
git log --oneline feat/observations-extraction --not main
```

Expected: 3 commits:
1. `feat: add Intelligence Observations engine, card component, and migration`
2. `feat: wire Intelligence Observations into ProgressTab (6 insertion points)`
3. `feat: Zarlo observation context integration (greeting + follow-up + re-init)`

- [ ] **Step 3: Merge to main and push**

```bash
git checkout main
git merge feat/observations-extraction
git push origin main
```

- [ ] **Step 4: Return to feature branch and restore stash**

```bash
git checkout feat/pay-the-bills
git stash pop
```

- [ ] **Step 5: Verify Vercel deployment**

Watch the Vercel deployment at https://vercel.com/dashboard. Confirm the build succeeds and the app loads at https://viberise.nichuzz.com.
