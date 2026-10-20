# Pain Point Tools → Main

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cherry-pick ONLY the 6 pain point tools (Pattern Interrupt, ADAC, Triple Warmer, Garbage Can, breathwork info update, Weekly Review New You Protocol) to main without bringing any other feature work.

**Architecture:** Create a clean branch from main, copy the self-contained new files, surgically apply TuneTab/WeeklyReview/challengeQuestsUpdate edits from the feature branch's working tree, build-verify, merge to main.

**Tech Stack:** React 18, Supabase PostgreSQL

**Spec:** `docs/specs/pain-point-tools-integration-spec.md`

## Global Constraints

- The working tree on `feat/pay-the-bills` has 17 modified files spanning 10+ features. We must NOT bring essence archetype, VibeRiseRadar, PathDefinition, ZoneCal, observations, or universe response changes to main.
- The 8 new component files (PI, ADAC, TWF, GCF + CSS) are untracked and survive branch switches.
- `npm run build` must pass on the new branch before merging.
- Migration must be applied to live Supabase before merge.

## Files to bring

**Copy as-is (untracked, self-contained):**
- `src/components/PatternInterruptFlow.jsx`
- `src/components/PatternInterruptFlow.css`
- `src/components/ADACFlow.jsx`
- `src/components/ADACFlow.css`
- `src/components/TripleWarmerFlow.jsx`
- `src/components/TripleWarmerFlow.css`
- `src/components/GarbageCanFlow.jsx`
- `src/components/GarbageCanFlow.css`
- `supabase/migrations/20260926000002_pain_point_tools_columns.sql`

**Surgical edits to main's versions:**
- `src/components/TuneTab.jsx` — imports, state vars, drain/stall save changes, regulation overlay, guided flow modals, practice IDs
- `src/components/WeeklyReview.jsx` — 2 state vars, save fields, New You Protocol section
- `public/challengeQuestsUpdate.json` — breathwork text + 2 new practice entries

---

### Task 1: Create clean branch and stage new files

**Files:**
- All 8 new component files + 1 migration (already untracked in working tree)

- [ ] **Step 1: Stash tracked changes on feat/pay-the-bills**

```bash
git stash push -m "pain-point-extraction: stash tracked changes"
```

The 8 new component files + migration are untracked and will NOT be stashed. They survive.

- [ ] **Step 2: Switch to main and create branch**

```bash
git checkout main
git pull origin main
git checkout -b feat/pain-point-tools
```

- [ ] **Step 3: Verify new files are present**

```bash
ls src/components/PatternInterruptFlow.jsx src/components/ADACFlow.jsx src/components/TripleWarmerFlow.jsx src/components/GarbageCanFlow.jsx supabase/migrations/20260926000002_pain_point_tools_columns.sql
```

All 9 files should exist in the working tree.

---

### Task 2: Surgical edits to TuneTab.jsx

**Files:**
- Modify: `src/components/TuneTab.jsx`

**6 edit points**, applied to main's version of TuneTab:

- [ ] **Step 1: Add imports after the RegulationCard import**

After the line `import RegulationCard from './RegulationCard'`, add:

```js
import PatternInterruptFlow from './PatternInterruptFlow'
import ADACFlow from './ADACFlow'
import TripleWarmerFlow from './TripleWarmerFlow'
import GarbageCanFlow from './GarbageCanFlow'
```

- [ ] **Step 2: Add guided flow practice IDs to DAILY_PRACTICE_IDS**

In the `DAILY_PRACTICE_IDS` array, add `'safety_garbage_can'` after `'safety_savouring'` in the Safety section, and add `'practice_triple_warmer'` after `'practice_social_media'` in the Expression section.

- [ ] **Step 3: Add state variables**

After `const [healingModalQuest, setHealingModalQuest] = useState(null)`, add:

```js
  const [guidedFlowId, setGuidedFlowId] = useState(null) // for guided micro-flows (Triple Warmer, Garbage Can)
```

After `const [regulationState, setRegulationState] = useState(null)`, add:

```js
  const [regulationVoice, setRegulationVoice] = useState(null) // voice for Pattern Interrupt
  const [regulationCheckinId, setRegulationCheckinId] = useState(null) // checkin id for rescript/adac save
  const [regulationType, setRegulationType] = useState(null) // 'drain' | 'stall' — drives which flow shows
  const [regulationFlowDone, setRegulationFlowDone] = useState(false) // true after PI/ADAC completes, shows divider + RegulationCard
```

- [ ] **Step 4: Update handleSaveDrain to capture checkin ID and set regulation type**

In `handleSaveDrain` (~line 566), replace:

```js
      const { error } = await supabase.from('nervous_system_checkins').insert({
        user_id: userId,
        before_state: null,
        after_state: drainState,
        checkin_type: 'drain',
        source_quest_id: drainCategory,
        drain_note: drainNote.trim() || null,
      })
```

With (adds `.select().single()` to get the inserted row ID):

```js
      const { data: insertedRow, error } = await supabase.from('nervous_system_checkins').insert({
        user_id: userId,
        before_state: null,
        after_state: drainState,
        checkin_type: 'drain',
        source_quest_id: drainCategory,
        drain_note: drainNote.trim() || null,
      }).select().single()
```

Then after `setRegulationState(savedState)` (~line 583), add:

```js
      setRegulationType('drain')
      setRegulationCheckinId(insertedRow?.id || null)
```

- [ ] **Step 5: Update handleSaveStall to capture checkin ID, voice, and set regulation type**

In `handleSaveStall` (~line 610), replace:

```js
      const { error } = await supabase.from('nervous_system_checkins').insert({
        user_id: userId,
        before_state: null,
        after_state: stallState,
        checkin_type: 'stall',
        source_quest_id: stallCategory,
        drain_note: stallNote.trim() || null,
        protective_voice: stallVoice,
      })
```

With:

```js
      const savedVoice = stallVoice
      const { data: insertedRow, error } = await supabase.from('nervous_system_checkins').insert({
        user_id: userId,
        before_state: null,
        after_state: stallState,
        checkin_type: 'stall',
        source_quest_id: stallCategory,
        drain_note: stallNote.trim() || null,
        protective_voice: stallVoice,
      }).select().single()
```

Then after `setRegulationState(savedState)` (~line 628), add:

```js
      setRegulationVoice(savedVoice)
      setRegulationType('stall')
      setRegulationCheckinId(insertedRow?.id || null)
```

- [ ] **Step 6: Add `inputType === 'guided'` handler in renderQuestRow**

In `renderQuestRow`, between the `completed` check and the `useInlineComplete` button, add a guided handler. The full button section should read:

```jsx
        {completed ? (
          <span className="ht-item-action done-action">Done</span>
        ) : quest.inputType === 'guided' ? (
          <button
            className="ht-item-action"
            onClick={() => setGuidedFlowId(quest.id)}
          >
            Start
          </button>
        ) : useInlineComplete ? (
```

- [ ] **Step 7: Replace the regulation overlay**

Replace the existing regulation overlay block:

```jsx
      {/* Regulation overlay after drain/stall save */}
      {regulationState && (
        <div className="tt-info-overlay" onClick={() => setRegulationState(null)}>
          <div className="tt-info-modal tt-regulation-modal" onClick={e => e.stopPropagation()}>
            <RegulationCard
              state={regulationState}
              onDone={() => setRegulationState(null)}
              onSkip={() => setRegulationState(null)}
            />
          </div>
        </div>
      )}
```

With:

```jsx
      {/* Regulation overlay after drain/stall save */}
      {regulationState && (
        <div className="tt-info-overlay" onClick={() => { setRegulationState(null); setRegulationVoice(null); setRegulationCheckinId(null); setRegulationType(null); setRegulationFlowDone(false) }}>
          <div className="tt-info-modal tt-regulation-modal" onClick={e => e.stopPropagation()}>
            {/* Stall: Pattern Interrupt (voice rescript) */}
            {regulationType === 'stall' && regulationVoice && (
              <PatternInterruptFlow
                voice={regulationVoice}
                onComplete={async (rescriptText) => {
                  if (regulationCheckinId && rescriptText) {
                    const { data: row } = await supabase
                      .from('nervous_system_checkins')
                      .select('drain_note')
                      .eq('id', regulationCheckinId)
                      .single()
                    const existingNote = row?.drain_note || ''
                    const newNote = existingNote
                      ? `${existingNote}\n[rescript] ${rescriptText}`
                      : `[rescript] ${rescriptText}`
                    await supabase
                      .from('nervous_system_checkins')
                      .update({ drain_note: newNote })
                      .eq('id', regulationCheckinId)
                  }
                  await supabase.rpc('increment_scores', {
                    p_user_id: userId,
                    p_project_id: null,
                    p_category: 'healing',
                    p_points: 3,
                    p_week_start: getWeekStartLocal(),
                  }).catch(() => {})
                  onRefreshPoints?.()
                  setRegulationFlowDone(true)
                  setRegulationVoice(null)
                  setRegulationType(null)
                }}
                onSkip={() => { setRegulationVoice(null); setRegulationType(null) }}
              />
            )}
            {/* Drain: ADAC (emotional defusing) */}
            {regulationType === 'drain' && (
              <ADACFlow
                onComplete={async (feeling, anchor) => {
                  if (regulationCheckinId) {
                    const { data: row } = await supabase
                      .from('nervous_system_checkins')
                      .select('drain_note')
                      .eq('id', regulationCheckinId)
                      .single()
                    const existingNote = row?.drain_note || ''
                    const adacNote = `[adac] feeling: ${feeling}, anchor: ${anchor}`
                    const newNote = existingNote
                      ? `${existingNote}\n${adacNote}`
                      : adacNote
                    await supabase
                      .from('nervous_system_checkins')
                      .update({ drain_note: newNote })
                      .eq('id', regulationCheckinId)
                  }
                  await supabase.rpc('increment_scores', {
                    p_user_id: userId,
                    p_project_id: null,
                    p_category: 'healing',
                    p_points: 5,
                    p_week_start: getWeekStartLocal(),
                  }).catch(() => {})
                  onRefreshPoints?.()
                  setRegulationFlowDone(true)
                  setRegulationType(null)
                }}
                onSkip={() => setRegulationType(null)}
              />
            )}
            {regulationFlowDone && (
              <div className="pif-body-divider">
                <span>Want to ground your body too?</span>
              </div>
            )}
            {(regulationFlowDone || (!regulationVoice && regulationType !== 'stall' && regulationType !== 'drain')) && (
              <RegulationCard
                state={regulationState}
                onDone={() => { setRegulationState(null); setRegulationVoice(null); setRegulationCheckinId(null); setRegulationType(null); setRegulationFlowDone(false) }}
                onSkip={() => { setRegulationState(null); setRegulationVoice(null); setRegulationCheckinId(null); setRegulationType(null); setRegulationFlowDone(false) }}
              />
            )}
          </div>
        </div>
      )}
```

- [ ] **Step 8: Add guided flow modals before the closing fragment**

Before the final `</>` of the component's return, add:

```jsx
      {/* Guided flow modals (Triple Warmer, Garbage Can) */}
      {guidedFlowId === 'practice_triple_warmer' && (
        <TripleWarmerFlow
          userId={userId}
          onComplete={async () => {
            await handleInlineComplete({ id: 'practice_triple_warmer', type: 'Practice', points: 5 })
            setGuidedFlowId(null)
          }}
          onClose={() => setGuidedFlowId(null)}
        />
      )}
      {guidedFlowId === 'safety_garbage_can' && (
        <GarbageCanFlow
          userId={userId}
          onComplete={async (reflectionData) => {
            try {
              await supabase.from('quest_completions').insert({
                user_id: userId,
                quest_id: 'safety_garbage_can',
                quest_category: 'Tune',
                quest_type: 'Reconnect',
                points_earned: 4,
                challenge_instance_id: null,
                challenge_day: 0,
                project_id: null,
                reflection_text: JSON.stringify(reflectionData),
              })
              await supabase.rpc('increment_scores', {
                p_user_id: userId,
                p_project_id: null,
                p_category: getScoringCategory('Tune'),
                p_points: 4,
                p_week_start: getWeekStartLocal(),
              })
            } catch (err) {
              console.error('Garbage Can save error:', err)
            }
            hapticSuccess()
            confetti({ particleCount: 80, spread: 60, origin: { y: 0.5 } })
            setGuidedFlowId(null)
            onRefreshPoints?.()
          }}
          onClose={() => setGuidedFlowId(null)}
        />
      )}
```

---

### Task 3: Surgical edits to WeeklyReview.jsx

**Files:**
- Modify: `src/components/WeeklyReview.jsx`

**3 edit points:**

- [ ] **Step 1: Add state variables**

After `const [voiceText, setVoiceText] = useState('')`, add:

```js
  // New You Protocol + Identity Reframe
  const [newYouVision, setNewYouVision] = useState('')
  const [identityDeclaration, setIdentityDeclaration] = useState('I am someone who ')
```

- [ ] **Step 2: Add fields to the save/submit**

In the `handleSubmit` upsert object, after `compounding_text: compoundingText.trim() || null,`, add:

```js
          new_you_vision: newYouVision.trim() || null,
          identity_declaration: identityDeclaration.trim() !== 'I am someone who' ? identityDeclaration.trim() || null : null,
```

- [ ] **Step 3: Add the New You Protocol section in the JSX**

Find `</div>` + empty line + `<div className="wr-footer">` near the bottom (~line 658 on main). Insert this block BEFORE `<div className="wr-footer">`:

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
```

---

### Task 4: Update challengeQuestsUpdate.json

**Files:**
- Modify: `public/challengeQuestsUpdate.json`

- [ ] **Step 1: Update breathwork description**

Find the practice with `"id": "reconnect_morning_meditation_breathwork"` and replace its `description` with:

```
"We recommend meditating for at least 10 minutes or breathwork using the 7-11 breath (inhale for 7 counts, exhale for 11) to activate the rest-and-digest response."
```

- [ ] **Step 2: Add Triple Warmer practice entry**

After the last Expression practice entry (before the closing of the practices array), add:

```json
    {
      "id": "practice_triple_warmer",
      "category": "Tune",
      "type": "Practice",
      "frequency": "daily",
      "name": "I AM Tapping",
      "description": "Tap between your ring and pinky finger knuckles while saying your identity declarations out loud. 2 minutes to install self-belief at a neurological level.",
      "points": 5,
      "inputType": "guided",
      "healing_checkin": false,
      "capacityType": "expression"
    }
```

- [ ] **Step 3: Add Garbage Can practice entry**

In the Safety section (after `safety_savouring`), add:

```json
    {
      "id": "safety_garbage_can",
      "category": "Tune",
      "type": "Reconnect",
      "frequency": "daily",
      "name": "Clear the Day",
      "description": "Process today's drains: freeze-frame the bad moments, shrink them to black and white, throw them away. Then amplify one good moment.",
      "points": 4,
      "inputType": "guided",
      "healing_checkin": false,
      "capacityType": "safety"
    }
```

---

### Task 5: Apply migration, build, commit, merge to main

- [ ] **Step 1: Apply migration to Supabase**

Use `supabase` MCP `apply_migration` to run `supabase/migrations/20260926000002_pain_point_tools_columns.sql`. Verify with:

```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'weekly_reviews'
  AND column_name IN ('new_you_vision', 'identity_declaration');
```

Expected: 2 rows.

- [ ] **Step 2: Build**

```bash
npm run build
```

Expected: Clean build, no errors.

- [ ] **Step 3: Stage and commit**

```bash
git add src/components/PatternInterruptFlow.jsx src/components/PatternInterruptFlow.css \
  src/components/ADACFlow.jsx src/components/ADACFlow.css \
  src/components/TripleWarmerFlow.jsx src/components/TripleWarmerFlow.css \
  src/components/GarbageCanFlow.jsx src/components/GarbageCanFlow.css \
  src/components/TuneTab.jsx src/components/WeeklyReview.jsx \
  public/challengeQuestsUpdate.json \
  supabase/migrations/20260926000002_pain_point_tools_columns.sql

git commit -m "feat: pain point tools — Pattern Interrupt, ADAC, Triple Warmer, Garbage Can

- Pattern Interrupt: single-screen voice rescript after stalls (+ RegulationCard follow-on)
- ADAC: 4-step emotional defusing after drains (Name → Dissociate → Anchor → Reintegrate)
- Triple Warmer I AM Tapping: guided morning identity installation pulling essence + weekly focus
- Garbage Can (Clear the Day): evening drain processing with shrink/amplify animations
- Weekly Review: New You Protocol vision + identity declaration section
- Breathwork info popup updated to 7-11 breath technique
- Migration: gap_rescript on groan_challenges, new_you_vision + identity_declaration on weekly_reviews"
```

- [ ] **Step 4: Merge to main and push**

```bash
git checkout main
git merge feat/pain-point-tools
git push origin main
```

- [ ] **Step 5: Return to feature branch and restore work**

```bash
git checkout feat/pay-the-bills
git stash pop
```
