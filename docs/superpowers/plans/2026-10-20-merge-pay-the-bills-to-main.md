# Merge feat/pay-the-bills to main — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. This is a sequential plan — each task depends on the previous one. Do NOT parallelize.

**Goal:** Merge 28 unique commits from `feat/pay-the-bills` plus uncommitted work onto `main`, resolving all conflicts, with zero feature loss on either side.

**Architecture:** Merge `main` INTO the feature branch (single conflict resolution pass), then fast-forward `main` to the merged result. Every conflict file has a pre-determined winner. No manual grafting needed — both sides already have observations code.

**Branch state at plan start:**
- `feat/pay-the-bills`: 33 commits ahead of merge base, 5 are duplicates (already cherry-picked to main)
- `main`: 18 commits ahead of merge base (pain point tools, observations wiring, Aliveness Compass, framing screens)
- Uncommitted on branch: 6 modified files (ProgressTab, WeeklyReview, WeeklyReview.css, PayTheBillsSection, challengeCompletionService, ux-decision-flow.html) + 2 new migrations + docs
- `stash@{0}`: "recovered: feature work stash" — mostly stale, but ZoneCalSection fixes are needed

## Global Constraints

- Do NOT pop `stash@{0}` wholesale — it's mostly superseded by main. Only ZoneCalSection fixes are needed.
- `vibeRiseDimensions.js` is untracked on the branch but committed on main (identical content). Must be removed before merge to avoid add/add conflict.
- The erroneous handoff doc `docs/session-handoff-2026-10-20-rebase-to-main.md` has incorrect merge rules (says "take branch" for WeeklyReview and TuneTab). Delete it — this plan supersedes it.
- Convention: no em dashes in user-facing copy. CSS scoped to parent class.

## Conflict Resolution Map (reference for Task 3)

| File | Winner | Reason |
|---|---|---|
| `ProgressTab.jsx` | **Branch** (`--ours`) | Branch already has observations code + reflection cards + zone cal + our fixes |
| `GenericRadar.jsx` | **Main** (`--theirs`) | Main has `scores3` prop (superset) |
| `VibeRiseRadar.jsx` | **Main** (`--theirs`) | Oct 5 intentional 6→5 dim reduction for Aliveness Compass |
| `ZarloChat.jsx` | **Main** (`--theirs`) | Main has null guard fix (1-line diff) |
| `WeeklyReview.jsx` | **Manual merge** | Both sides add state vars at same location. Keep New You Protocol (main) AND universe check + coping (branch) |
| `WeeklyReview.css` | **Manual merge** (if conflicts) | Both sides append styles. Keep all additions from both sides |
| `vibe-rise-aliveness-compass-spec.md` | **Main** (`--theirs`) | Main is more complete (286 vs 248 lines) |

---

### Task 1: Pre-merge fixes and commit

**Goal:** Get the branch to a clean committed state with all critical fixes applied before touching git merge.

**Files:**
- Modify: `src/components/ProgressTab.jsx:591` (remove reflection_text filter)
- Already modified this session: `src/components/ProgressTab.jsx:922` (getVoiceDisplay fix)
- Already modified this session: `src/components/PayTheBillsSection.jsx:26,84` (bridge exclusion + is_current_job removal)
- Already modified this session: `src/lib/challengeCompletionService.js:165` (first_vibe_rise count check)
- Already created this session: `supabase/migrations/20260926100002_universe_response_columns.sql`
- Uncommitted from prior work: `src/components/WeeklyReview.jsx`, `src/components/WeeklyReview.css`
- Delete: `docs/session-handoff-2026-10-20-rebase-to-main.md` (incorrect merge rules)

- [ ] **Step 1: Fix the observation query filter**

In `src/components/ProgressTab.jsx`, line 591, remove the `.not('reflection_text', 'is', null)` filter. This is the `f8669c70` fix from main that the branch is missing. Without it, the observations engine silently drops completions with no reflection text.

Change:
```jsx
          // Completions (life fuel + observations need quest_id, aftertaste)
          supabase.from('quest_completions')
            .select('reflection_text, quest_id, aftertaste, aftertaste_week_later')
            .eq('user_id', userId)
            .eq('quest_category', 'Groans')
            .not('reflection_text', 'is', null)
            .order('created_at', { ascending: true }),
```

To:
```jsx
          // Completions (observations need quest_id, aftertaste — unfiltered)
          supabase.from('quest_completions')
            .select('reflection_text, quest_id, aftertaste, aftertaste_week_later')
            .eq('user_id', userId)
            .eq('quest_category', 'Groans')
            .order('created_at', { ascending: true }),
```

- [ ] **Step 2: Delete the incorrect handoff doc**

```bash
rm docs/session-handoff-2026-10-20-rebase-to-main.md
```

- [ ] **Step 3: Delete the untracked vibeRiseDimensions.js**

This file is identical to main's committed version. Removing it prevents an add/add conflict during merge. Main will bring its version over.

```bash
rm src/data/vibeRiseDimensions.js
```

- [ ] **Step 4: Build to verify all fixes compile**

```bash
npm run build
```

Expected: `✓ built in ~15s`, no errors.

- [ ] **Step 5: Stage and commit everything**

Stage the modified files (critical fixes + uncommitted feature work), new migration, and docs. Do NOT stage `.superpowers/` or `ux-decision-flow.html`.

```bash
git add \
  src/components/ProgressTab.jsx \
  src/components/WeeklyReview.jsx \
  src/components/WeeklyReview.css \
  src/components/PayTheBillsSection.jsx \
  src/lib/challengeCompletionService.js \
  supabase/migrations/20260926100002_universe_response_columns.sql \
  supabase/migrations/20260926100000_zone_cal_snapshots.sql \
  docs/features/universe-response-spec.md \
  docs/frameworks/zone-cal-dome-product-architecture.md \
  docs/specs/2026-09-26-pay-the-bills-spec.md \
  docs/specs/pain-point-tools-integration-spec.md \
  docs/specs/zone-cal-progress-tab-spec.md \
  docs/superpowers/plans/ \
  docs/superpowers/specs/ \
  docs/session-handoff-2026-10-05-pain-point-tools-push.md \
  docs/book/book-chapter-list-toby-structure.md

git commit -m "feat: universe check + coping pattern in WeeklyReview, critical bug fixes

- WeeklyReview: universe response follow-up for prior-week 'not_sure' challenges
- WeeklyReview: coping pattern detection for old uncompleted challenges
- ProgressTab: fix getVoiceDisplay() returning object instead of .name
- ProgressTab: remove reflection_text filter on completions query (observation fix)
- PayTheBillsSection: exclude bridge jobs from hasCompletedCurrentJobFlow check
- PayTheBillsSection: remove is_current_job from handleGotJob (prevents query corruption)
- challengeCompletionService: add count check for first_vibe_rise (was firing every time)
- Migration: universe_response + coping_mechanism columns on groan_challenges
- Migration: zone_cal_snapshots table
- Docs: specs and plans from prior sessions"
```

- [ ] **Step 6: Verify clean working tree**

```bash
git status
```

Expected: only untracked files remaining (`.superpowers/`, `ux-decision-flow.html`). No modified files.

---

### Task 2: Dry-run the merge

**Goal:** Confirm the exact conflicts before committing to the merge. Abort if unexpected.

- [ ] **Step 1: Dry-run merge**

```bash
git merge main --no-commit --no-ff
```

- [ ] **Step 2: Check conflict list**

```bash
git diff --name-only --diff-filter=U
```

Expected conflicts (5-7 files):
1. `src/components/ProgressTab.jsx`
2. `src/components/GenericRadar.jsx`
3. `src/flows/VibeRiseRadar.jsx`
4. `src/components/Zarlo/ZarloChat.jsx`
5. `docs/features/vibe-rise-aliveness-compass-spec.md`
6. `src/components/WeeklyReview.jsx` (likely — both sides add state vars at same insertion point)
7. `src/components/WeeklyReview.css` (possible — both sides append styles)

**If a file NOT in this list appears: STOP. Abort with `git merge --abort` and report what's unexpected.**

- [ ] **Step 3: If expected, abort the dry-run**

```bash
git merge --abort
```

---

### Task 3: Execute the merge

**Goal:** Merge main into the branch, resolve all 5 conflicts per the resolution map.

- [ ] **Step 1: Start the merge**

```bash
git merge main --no-ff -m "merge: bring main (pain-point-tools, observations, Aliveness Compass) into feat/pay-the-bills"
```

This will stop with conflicts. That's expected.

- [ ] **Step 2: Resolve ProgressTab — take branch version**

The branch version is the more complete file (1,700+ lines with reflection cards, zone cal, completion flow, observations, and our critical fixes). Main's version only adds observations wiring which the branch already has. The one query fix (reflection_text filter) was already applied in Task 1.

```bash
git checkout --ours src/components/ProgressTab.jsx
git add src/components/ProgressTab.jsx
```

- [ ] **Step 3: Resolve GenericRadar — take main version**

Main has the `scores3` prop needed for Aliveness Compass layered radar comparisons. Branch version only has `scores`/`scores2`.

```bash
git checkout --theirs src/components/GenericRadar.jsx
git add src/components/GenericRadar.jsx
```

- [ ] **Step 4: Resolve VibeRiseRadar — take main version**

Main intentionally reduced from 6 dims to 5 (Oct 5, Aliveness Compass alignment). Branch has the older 6-dim version.

```bash
git checkout --theirs src/flows/VibeRiseRadar.jsx
git add src/flows/VibeRiseRadar.jsx
```

- [ ] **Step 5: Resolve ZarloChat — take main version**

Main has a null guard (`if (!userContext) return`) that prevents the injected context effect from running before data loads. 1-line difference.

```bash
git checkout --theirs src/components/Zarlo/ZarloChat.jsx
git add src/components/Zarlo/ZarloChat.jsx
```

- [ ] **Step 6: Resolve aliveness spec — take main version**

Main's spec is more complete (286 lines vs 248).

```bash
git checkout --theirs docs/features/vibe-rise-aliveness-compass-spec.md
git add docs/features/vibe-rise-aliveness-compass-spec.md
```

- [ ] **Step 7: Resolve WeeklyReview.jsx — take branch, then add main's 3 pieces**

Do NOT try to resolve conflict markers. Take the branch version wholesale, then surgically add main's New You Protocol.

```bash
git checkout --ours src/components/WeeklyReview.jsx
```

Now make 3 edits to add main's New You Protocol:

**7a. State vars** — search for the coping pattern state (branch's last addition before pathFuels):
```jsx
  // Coping pattern: old uncompleted challenges
  const [incompleteChallenges, setIncompleteChallenges] = useState([]) // [{ id, title, answer }]

  // Per-path fuel reviews:
```
Replace with:
```jsx
  // Coping pattern: old uncompleted challenges
  const [incompleteChallenges, setIncompleteChallenges] = useState([]) // [{ id, title, answer }]

  // New You Protocol + Identity Reframe
  const [newYouVision, setNewYouVision] = useState('')
  const [identityDeclaration, setIdentityDeclaration] = useState('I am someone who ')

  // Per-path fuel reviews:
```

**7b. Save payload** — search for the compounding_text line in the upsert:
```jsx
          compounding_text: compoundingText.trim() || null,
```
Replace with:
```jsx
          compounding_text: compoundingText.trim() || null,
          new_you_vision: newYouVision.trim() || null,
          identity_declaration: identityDeclaration.trim() !== 'I am someone who' ? identityDeclaration.trim() || null : null,
```

**7c. JSX section** — search for the closing div before wr-footer:
```jsx
        </div>

        <div className="wr-footer">
```
Replace with:
```jsx
          {/* New You Protocol + Identity Reframe */}
          <div className="wr-question">
            <div className="wr-question-top">
              <span className="wr-question-icon">✨</span>
              <span className="wr-question-label">Next week</span>
            </div>
            <p className="wr-question-text">
              Picture the version of you who already lives next week's focus. What are they doing?
            </p>
            <textarea
              className="wr-textarea"
              value={newYouVision}
              onChange={e => setNewYouVision(e.target.value)}
              placeholder="I see myself..."
              rows={3}
              maxLength={500}
            />
            <p className="wr-question-text" style={{ marginTop: 16 }}>
              Now declare it. Not "I'll try to..." Who are you?
            </p>
            <input
              type="text"
              className="wr-text-input"
              value={identityDeclaration}
              onChange={e => setIdentityDeclaration(e.target.value)}
              maxLength={100}
            />
          </div>

        </div>

        <div className="wr-footer">
```

Then stage:
```bash
git add src/components/WeeklyReview.jsx
```

- [ ] **Step 8: Resolve WeeklyReview.css (if conflicted)**

If this file has conflicts, both sides appended new styles. Keep all styles from both sides — remove conflict markers and keep everything.

```bash
git add src/components/WeeklyReview.css
```

If no conflict (auto-merged), skip this step.

- [ ] **Step 9: Verify no remaining conflicts**

```bash
git diff --name-only --diff-filter=U
```

Expected: empty output (no remaining conflicts).

- [ ] **Step 10: Complete the merge commit**

```bash
git commit --no-edit
```

- [ ] **Step 11: Build**

```bash
npm run build
```

Expected: `✓ built in ~15s`, no errors. If build fails, read the error — it will be a missing import or reference. Fix it, amend the merge commit, rebuild.

---

### Task 4: Apply ZoneCalSection stash fixes

**Goal:** Apply the 5 improvements from `stash@{0}` that fix bugs identified in the QA sweep. These are surgical edits — do NOT pop the stash.

**Files:**
- Modify: `src/components/ZoneCalSection.jsx`

The stash fixes these issues:
1. `bridgeAttempted` state → ref (fixes useEffect re-trigger loop, QA issue #9)
2. `isSubmitting` ref guard (prevents double-tap on check-in submit)
3. `previousScores` capture before refetch (fixes scores3 radar showing wrong data)
4. Same-diagnosis retake UI (shows headline when diagnosis doesn't change)
5. `scores3` prop uses `cr.previousScores` instead of `latest?.scores`

- [ ] **Step 1: Replace import**

In `src/components/ZoneCalSection.jsx`, search for:
```jsx
import { useState, useEffect, useMemo } from 'react'
```
Replace with:
```jsx
import { useState, useEffect, useRef } from 'react'
```
(`useMemo` is imported but never called — confirmed 0 usages.)

- [ ] **Step 2: Replace state vars block**

Search for:
```jsx
  const [completionResult, setCompletionResult] = useState(null) // { scores, diagnosis, narrative }
  const [bridgeAttempted, setBridgeAttempted] = useState(false)
```
Replace with:
```jsx
  const [completionResult, setCompletionResult] = useState(null) // { scores, diagnosis, narrative, previousScores }
  const bridgeAttemptedRef = useRef(false)
  const isSubmitting = useRef(false)
```

- [ ] **Step 3: Replace bridge attempt check**

Search for:
```jsx
      if (!bridgeAttempted && userEmail) {
        setBridgeAttempted(true)
```
Replace with:
```jsx
      if (!bridgeAttemptedRef.current && userEmail) {
        bridgeAttemptedRef.current = true
```

- [ ] **Step 4: Fix useEffect dep array**

Search for:
```jsx
  }, [userId, userEmail, bridgeAttempted])
```
Replace with:
```jsx
  }, [userId, userEmail])
```

- [ ] **Step 5: Replace entire handleCheckinComplete function**

Search for the entire function (from signature to closing brace):
```jsx
  const handleCheckinComplete = async (scores) => {
    const newDiagnosis = getDiagnosis(scores)

    await supabase.from('zone_cal_snapshots').insert({
      user_id: userId,
      scores,
      diagnosis: newDiagnosis.id,
      source: 'in_app',
    })

    // Build completion result for narrative
    if (latest) {
      const oldDiagnosis = getDiagnosis(latest.scores)
      setCompletionResult({
        scores,
        diagnosis: newDiagnosis,
        oldDiagnosis,
        narrative: getChangeNarrative(latest.scores, scores, oldDiagnosis, newDiagnosis),
      })
    } else {
      setCompletionResult({ scores, diagnosis: newDiagnosis, oldDiagnosis: null, narrative: null })
    }

    setShowCheckin(false)

    // Refetch snapshots
    const { data } = await supabase
      .from('zone_cal_snapshots')
      .select('scores, diagnosis, source, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(2)
    setSnapshots(data || [])
  }
```

Replace with:
```jsx
  const handleCheckinComplete = async (scores) => {
    if (isSubmitting.current) return
    isSubmitting.current = true
    const newDiagnosis = getDiagnosis(scores)

    await supabase.from('zone_cal_snapshots').insert({
      user_id: userId,
      scores,
      diagnosis: newDiagnosis.id,
      source: 'in_app',
    })

    // Build completion result for narrative (capture previousScores before refetch)
    if (latest) {
      const oldDiagnosis = getDiagnosis(latest.scores)
      setCompletionResult({
        scores,
        diagnosis: newDiagnosis,
        oldDiagnosis,
        previousScores: latest.scores,
        narrative: getChangeNarrative(latest.scores, scores, oldDiagnosis, newDiagnosis),
      })
    } else {
      setCompletionResult({ scores, diagnosis: newDiagnosis, oldDiagnosis: null, previousScores: null, narrative: null })
    }

    setShowCheckin(false)

    // Refetch snapshots
    const { data } = await supabase
      .from('zone_cal_snapshots')
      .select('scores, diagnosis, source, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(2)
    setSnapshots(data || [])
    isSubmitting.current = false
  }
```

- [ ] **Step 6: Replace completion result JSX block**

Search for the entire completion result render section:
```jsx
          {/* Diagnosis change narrative */}
          {cr.oldDiagnosis && cr.narrative && (
            <div className="zcs-transition">
              <div className="zcs-transition-old">You were in <strong>{cr.oldDiagnosis.name}</strong></div>
              <div className="zcs-transition-arrow">↓</div>
              <div className="zcs-transition-new">Now you're in <strong>{cr.diagnosis.name}</strong></div>
              <div className="zcs-transition-narrative">{cr.narrative}</div>
            </div>
          )}

          {/* First-time result (no previous) */}
          {!cr.oldDiagnosis && (
            <>
              <div className="zcs-diagnosis-name">{cr.diagnosis.name}</div>
              <div className="zcs-diagnosis-headline">{cr.diagnosis.headline}</div>
            </>
          )}

          <GenericRadar
            dimensions={ZONE_CAL_DIMENSIONS}
            scores={cr.scores}
            scores3={latest?.scores || null}
            maxLevel={5}
            size={280}
          />
```

Replace with:
```jsx
          {/* Diagnosis change narrative (different diagnosis) */}
          {cr.oldDiagnosis && cr.oldDiagnosis.id !== cr.diagnosis.id && (
            <div className="zcs-transition">
              <div className="zcs-transition-old">You were in <strong>{cr.oldDiagnosis.name}</strong></div>
              <div className="zcs-transition-arrow">↓</div>
              <div className="zcs-transition-new">Now you're in <strong>{cr.diagnosis.name}</strong></div>
              <div className="zcs-diagnosis-headline">{cr.diagnosis.headline}</div>
              <div className="zcs-transition-narrative">{cr.narrative}</div>
            </div>
          )}

          {/* Same diagnosis on retake */}
          {cr.oldDiagnosis && cr.oldDiagnosis.id === cr.diagnosis.id && (
            <>
              <div className="zcs-diagnosis-name">{cr.diagnosis.name}</div>
              <div className="zcs-diagnosis-headline">{cr.diagnosis.headline}</div>
              <div className="zcs-transition-narrative">{cr.narrative}</div>
            </>
          )}

          {/* First-time result (no previous) */}
          {!cr.oldDiagnosis && (
            <>
              <div className="zcs-diagnosis-name">{cr.diagnosis.name}</div>
              <div className="zcs-diagnosis-headline">{cr.diagnosis.headline}</div>
            </>
          )}

          <GenericRadar
            dimensions={ZONE_CAL_DIMENSIONS}
            scores={cr.scores}
            scores3={cr.previousScores}
            maxLevel={5}
            size={280}
          />
```

- [ ] **Step 2: Build**

```bash
npm run build
```

Expected: pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/ZoneCalSection.jsx
git commit -m "fix: ZoneCalSection — bridgeAttempted ref, double-submit guard, scores3 capture, same-diagnosis UI"
```

---

### Task 5: Merge to main and push

**Goal:** Fast-forward main to the merged branch and push.

- [ ] **Step 1: Checkout main**

```bash
git checkout main
```

- [ ] **Step 2: Merge the branch**

```bash
git merge feat/pay-the-bills
```

This should fast-forward (main's HEAD is an ancestor of the branch's merge commit). If it doesn't fast-forward, that's OK — a merge commit is fine too.

- [ ] **Step 3: Verify the merge**

Quick sanity checks:

```bash
# Branch features present:
test -f src/lib/challengeCompletionService.js && echo "✅ challengeCompletionService"
test -f src/components/PayTheBillsSection.jsx && echo "✅ PayTheBillsSection"
test -f src/components/ZoneCalSection.jsx && echo "✅ ZoneCalSection"
test -f src/components/DomeGrowthOverlay.jsx && echo "✅ DomeGrowthOverlay"
test -f src/flows/FindBridgeFlow.jsx && echo "✅ FindBridgeFlow"

# Main features present:
test -f src/components/ADACFlow.jsx && echo "✅ ADACFlow (pain point tools)"
test -f src/components/PatternInterruptFlow.jsx && echo "✅ PatternInterruptFlow"
grep -q "scores3" src/components/GenericRadar.jsx && echo "✅ GenericRadar scores3"
grep -q "newYouVision" src/components/WeeklyReview.jsx && echo "✅ New You Protocol"
grep -q "universe_response" src/components/WeeklyReview.jsx && echo "✅ Universe check"

# Migrations:
test -f supabase/migrations/20260926100001_pay_the_bills_columns.sql && echo "✅ Bridge jobs migration"
test -f supabase/migrations/20260926100002_universe_response_columns.sql && echo "✅ Universe response migration"
test -f supabase/migrations/20260926000003_quest_aliveness_snapshots.sql && echo "✅ Aliveness snapshots migration"
```

**Expected:** All ✅. If any check fails, the merge resolution in Task 3 missed something — investigate before pushing.

- [ ] **Step 4: Final build**

```bash
npm run build
```

- [ ] **Step 5: Push**

```bash
git push origin main
```

---

### Task 6: Post-merge verification

**Goal:** Confirm New You Protocol survived the merge (it should have been resolved in Task 3 Step 7).

- [ ] **Step 1: Verify New You Protocol is present**

```bash
grep -c "newYouVision\|new_you_vision\|identity_declaration" src/components/WeeklyReview.jsx
```

Expected: 5+ matches (2 state vars, 2 save fields, JSX section). If 0 matches, the Task 3 merge resolution was incorrect — go back and re-read Task 3 Step 7.

---

## Post-merge testing checklist

After all tasks complete, test these in the browser:

### From the branch (never deployed before)
1. **Completion flow** — Complete a courage challenge. Should be 3 screens (wahoo + aftertaste + voice), not 11. DomeGrowthOverlay radar animation should appear.
2. **Reflection cards** — After completing, go to Progress tab. Cross-pollination, share, gap check, life fuel, universe response cards should appear in evidence feed.
3. **Pay the Bills** — Go to `/add-current-job`, pick "Pay the bills". PayTheBillsSection should appear on Paths tab. Try FindBridgeFlow.
4. **Zone Cal** — Progress tab should show Zone Cal radar section. Complete a check-in (8 questions). Verify radar renders with scores.
5. **Lock hints** — On LevelTab, locked sections should show "Complete discovery to unlock Paths" hint.

### Already on main (verify nothing broke)
6. **Observations** — Progress tab should show observation cards below evidence feed.
7. **Pain point tools** — Tune tab should have PatternInterrupt, ADAC, TripleWarmer, GarbageCanFlow.
8. **New You Protocol** — Weekly Review should have "Next week" vision + identity declaration section.
9. **Aliveness Compass** — Path definition flow should have 5-dim baseline radar on Screen 0.
10. **Zarlo** — Floating widget should still work with observation context.

### From uncommitted work
11. **Universe check in Weekly Review** — Open weekly review. If you had "not sure" universe responses last week, they should appear for follow-up.
12. **Coping pattern in Weekly Review** — Old uncompleted challenges should appear for classification.
13. **Universe response note** — On ProgressTab reflection card, selecting a universe response should show a "What happened?" text input.

### Migrations to apply
14. Run `20260926100001_pay_the_bills_columns.sql` (bridge columns on quests)
15. Run `20260926100002_universe_response_columns.sql` (universe_response + coping_mechanism on groan_challenges)
16. Verify `20260926000003_quest_aliveness_snapshots.sql` is already applied (came from main)
17. Verify `20260926100000_zone_cal_snapshots.sql` is applied
