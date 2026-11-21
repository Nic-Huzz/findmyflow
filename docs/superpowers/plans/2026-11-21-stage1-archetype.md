# Stage 1 Archetype — Remove Stage 4 Stems Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove Stage 4 voice stems (The Search, 6 questions). Generate archetype from Stage 1 childhood transcripts instead. Move archetype reveal + avatar to new positions in the flow. Bolt path definition into onboarding after choose-quests.

**Architecture:** After Stage 1 processing, run the archetype AI immediately using Stage 1 transcripts. Show archetype reveal (primary + secondary + blend name + essence + mirror) on the Stage 1 results page. Stages 2-3 follow (wound + consequences). Avatar moves to the END of the flow (after path definition) as the grand finale.

**IMPORTANT: This plan supersedes the original version. Key changes from the earlier draft:**
- Archetype processes after Stage 1 (not after Stage 3)
- Stage 1 results page shows archetype + essence (combined screen)
- Avatar moves to END of flow (after path definition, before download)
- Path definition bolted into onboarding (after choose-quests)
- Stage 2 stem s2a_2 rewritten for clarity

**Target onboarding flow:**
Landing → Stage 1 stems → Archetype reveal (from Stage 1) → Stage 2 stems → Stage 3 stems → Experience Game → Signup → Choose Quests → Path Definition → Avatar Creation → Download App

**Target workshop flow:**
Landing → Stage 1 stems → Archetype reveal → Stage 2 stems → Stage 3 stems → Category Stems → Category Reveal → Nudges → Avatar Creation → Final Results

**Tech Stack:** React (VoiceStemFlow.jsx), voiceStems.js (STAGES array), process-stems edge function (no prompt change needed, Stage 1 answers work with existing Stage 4 prompt)

**Spec:** Tested with dad's Stage 1 answers — produced "Playful Creator + Heart Alchemist → Joy Alchemist" vs original "Truth-Teller + Heart Alchemist → Honest Heart". Stage 1 answers are richer and more resonant.

## Global Constraints

- Never use em dashes in user-facing copy
- Never hardcode CSS colors
- Stage 4 edge function prompt stays unchanged (it works with any transcript content)
- Stage 4 archetype state (`stage4Results`) stays — it stores the archetype results regardless of which transcripts generated them
- The `completed: true` flag must still be set after archetype processing
- Onboarding and workshop both get this change

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/flows/VoiceStemFlow.jsx` | Modify | Remove Stage 4 recording trigger, run archetype AI after Stage 3 results |
| `src/data/voiceStems.js` | Modify | Remove STAGES[3] (archetype stems), shift STAGES[4] (category) to STAGES[3] |

**NOT modified:**
- `supabase/functions/process-stems/index.ts` — Stage 4 prompt works with any transcripts
- `src/lib/stemProcessing.js` — already spreads context
- `src/data/essenceArchetypes.js` — archetype data unchanged
- `src/components/ExperienceGameLive.jsx` — not affected

---

## !! WARNING — TASKS BELOW ARE OUTDATED !!

**The tasks below were written for the ORIGINAL plan (archetype after Stage 3).** The decisions have changed:

1. **Archetype processes after Stage 1, not Stage 3.** The `processArchetypeFromStage1` function should trigger after Stage 1 processing, not after Stage 3 results "Continue" button. The Stage 1 results page becomes the archetype reveal page (shows energy + patterns + mirror + primary/secondary archetype + blend name + essence).

2. **Avatar moves to END of flow.** Tasks below put avatar after essence reveal. It should come after path definition, as the grand finale before download.

3. **Path definition needs bolting in.** Not covered in tasks below. Needs to be added after choose-quests: `Signup → Choose Quests → Path Definition → Avatar → Download`.

4. **Stage 2 stem s2a_2 needs rewriting.** Currently "When I think about doing {selectedExpression}..." — confusing because selectedExpression is auto-set. Needs clearer framing. New wording TBD with user.

**Recommendation:** Re-plan these tasks from scratch using the target flows in the header above. The file changes are correct (remove STAGES[3], shift category) but the VoiceStemFlow wiring needs to be redesigned for the new flow order.

---

### Task 1: Remove archetype stage from voiceStems.js, shift category

**Files:**
- Modify: `src/data/voiceStems.js`

**Interfaces:**
- Produces: `STAGES` array with 4 entries (was 5). Index 0=essence, 1=suppressed, 2=consequences, 3=category. Archetype stage removed entirely.
- Consumers: `getStemsForStage(stageIndex)` — stageIndex 3 now returns category stems (was archetype). stageIndex 4 no longer exists.

- [ ] **Step 1: Remove the archetype stage**

In `voiceStems.js`, remove the entire stage object at index 3 (id: 'archetype', label: 'The Search'). This is lines 69-80:

```js
  {
    id: 'archetype',
    label: 'The Search',
    description: 'Who are you underneath all of this.',
    stems: [
      { id: 's4_1', text: "The version of me I'd be if nobody was judging is..." },
      { id: 's4_2', text: 'The energy I bring when I stop performing is...' },
      { id: 's4_3', text: "The thing people don't realise about me is..." },
      { id: 's4_4', text: "The way I act when I'm at my most free is..." },
      { id: 's4_5', text: 'The word that describes who I really am is...' },
      { id: 's4_6', text: "When I'm alone and being honest, I am..." },
    ],
  },
```

Delete those lines. The category stage (previously index 4) becomes index 3 automatically.

- [ ] **Step 2: Verify getStemsForStage**

After removal:
- `getStemsForStage(0)` = essence (6 stems) ✓
- `getStemsForStage(1, 0)` = suppressed layer 1 (7 stems) ✓
- `getStemsForStage(1, 1)` = suppressed layer 2 (6 stems) ✓
- `getStemsForStage(2)` = consequences (10 stems) ✓
- `getStemsForStage(3)` = category (4 stems, was index 4) ✓
- `getStemsForStage(4)` = undefined (no more) ✓

- [ ] **Step 3: Run build**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/data/voiceStems.js
git commit -m "feat: remove archetype stems (Stage 4), shift category to index 3"
```

---

### Task 2: Rewire VoiceStemFlow — archetype from Stage 1 transcripts

**Files:**
- Modify: `src/flows/VoiceStemFlow.jsx`

**Interfaces:**
- Consumes: `stage1Results` (transcripts from Stage 1), `stage2Results` (wound context), `stage3Results` (dimensions)
- Produces: `stage4Results` (archetype, same shape as before), `blendResult`, `essenceName`

This is the main task. Multiple changes in VoiceStemFlow.jsx:

- [ ] **Step 1: Change Stage 3 results "Continue" button**

Currently `results_3` onContinue triggers `beginStage({ stageIndex: 3 })` which starts Stage 4 recording. Change it to trigger archetype processing directly.

Find (around line 1960):
```jsx
<Stage3Results
  results={stage3Results}
  onContinue={() => beginStage({ stageIndex: 3 })}
/>
```

Replace with:
```jsx
<Stage3Results
  results={stage3Results}
  onContinue={() => processArchetypeFromStage1()}
/>
```

- [ ] **Step 2: Create processArchetypeFromStage1 function**

Add this function after `triggerProcessing` (around line 1572). This replaces the `stageIndex === 3` branch in triggerProcessing. It:
1. Shows processing screen
2. Builds Stage 1 transcripts (from transcriptsRef, using s1_ stem IDs)
3. Calls processStage(4) with Stage 1 transcripts + all context
4. Calls essence-mirror-blend
5. Sets stage4Results, blendResult, essenceName
6. Shows essence_reveal

```js
const processArchetypeFromStage1 = useCallback(async () => {
  setScreen('processing')
  setProcessingStageKey(4)
  setFlowError(null)

  // Build transcripts from Stage 1 stems (s1_1 through s1_6)
  const stage1Stems = getStemsForStage(0, null, { selectedExpression, confirmedPrediction })
  const transcripts = stage1Stems.map(stem => ({
    stemId: stem.id,
    stemText: stem.text,
    transcript: transcriptsRef.current[stem.id] || '',
  }))

  const lowestDim = stage3Results?.dimensions
    ? Object.entries(stage3Results.dimensions).reduce((low, [k, v]) =>
        (v?.score || 5) < (low.score || 5) ? { key: k, score: v?.score } : low, { key: '', score: 5 }
      ).key
    : ''

  try {
    const results = await processStage(4, transcripts, {
      selectedExpression,
      confirmedPrediction,
      stage1Mirror: stage1Results?.mirror || '',
      woundScene: stage2Results?.woundScene || '',
      nsLabel: stage2Results?.nsLabel || '',
      lowestDimension: lowestDim,
    })
    setStage4Results(results)
    saveSession({
      stage4Results: results,
      completed: true,
    })

    // Call essence-mirror-blend for custom name
    const primaryData = getArchetype(results.primaryArchetype?.id)
    const secondaryData = getArchetype(results.secondaryArchetype?.id)
    if (primaryData && secondaryData) {
      try {
        const { data: blendData } = await supabase.functions.invoke('essence-mirror-blend', {
          body: {
            primary: {
              name: primaryData.name,
              poetic_line: primaryData.poetic_line,
              superpower: primaryData.superpower,
              essence_wound: primaryData.essence_wound,
              poetic_vision: primaryData.poetic_vision,
              energetic_transmission: primaryData.energetic_transmission,
              north_star: primaryData.north_star,
              vision_in_action: primaryData.vision_in_action,
            },
            secondary: {
              name: secondaryData.name,
              poetic_line: secondaryData.poetic_line,
              superpower: secondaryData.superpower,
              essence_wound: secondaryData.essence_wound,
              poetic_vision: secondaryData.poetic_vision,
              energetic_transmission: secondaryData.energetic_transmission,
              north_star: secondaryData.north_star,
              vision_in_action: secondaryData.vision_in_action,
            },
          },
        })
        if (blendData?.blended_name) {
          setBlendResult(blendData)
          setEssenceName(blendData.blended_name.replace(/^The\s+/i, ''))
          saveSession({ blendResult: blendData, essenceName: blendData.blended_name.replace(/^The\s+/i, '') })
        } else {
          setEssenceName(primaryData.name)
        }
      } catch (blendErr) {
        console.warn('Blend API error:', blendErr)
        setEssenceName(primaryData.name)
      }
    } else {
      setEssenceName(results.primaryArchetype?.name || 'Your True Self')
    }
    setScreen('essence_reveal')
  } catch (err) {
    console.error('Archetype processing error:', err)
    setFlowError('Something went wrong analysing your responses. Tap to retry.')
  }
}, [selectedExpression, confirmedPrediction, stage1Results, stage2Results, stage3Results])
```

- [ ] **Step 3: Remove stageIndex === 3 branch from triggerProcessing**

In `triggerProcessing`, delete the entire `else if (stageIndex === 3)` block (lines 1484-1547). This was the old Stage 4 recording → processing path. It is replaced by `processArchetypeFromStage1`.

- [ ] **Step 4: Shift category from stageIndex 4 to stageIndex 3**

In `triggerProcessing`, the category processing block is currently:
```js
} else if (stageIndex === 4) {
```
Change to:
```js
} else if (stageIndex === 3) {
```

Also update the processingStageKey mapping. Currently:
```js
if (stageIndex === 0) setProcessingStageKey(1)
else if (stageIndex === 1 && layerIndex === 0) setProcessingStageKey('2a')
else if (stageIndex === 1 && layerIndex === 1) setProcessingStageKey('2b')
else if (stageIndex === 2) setProcessingStageKey(3)
else if (stageIndex === 3) setProcessingStageKey(4)
else if (stageIndex === 4) setProcessingStageKey(7)
```

Remove the `stageIndex === 3 → 4` line (archetype no longer goes through triggerProcessing) and change `stageIndex === 4 → 7` to `stageIndex === 3 → 7`:

```js
if (stageIndex === 0) setProcessingStageKey(1)
else if (stageIndex === 1 && layerIndex === 0) setProcessingStageKey('2a')
else if (stageIndex === 1 && layerIndex === 1) setProcessingStageKey('2b')
else if (stageIndex === 2) setProcessingStageKey(3)
else if (stageIndex === 3) setProcessingStageKey(7)
```

- [ ] **Step 5: Update progress tracking**

**5a. totalStems:** Change `39` to `33` (removed 6 archetype stems):
```js
const totalStems = 33 // 6 + 13 + 10 + 4(category)
```

**5b. stemsCompleted:** Remove the stageIndex 3 archetype line, shift category:
```js
const stemsCompleted = (() => {
  if (position.stageIndex === 0) return position.stemIndex
  if (position.stageIndex === 1) {
    const layer1done = 6
    if (position.layerIndex === null || position.layerIndex === 0) return layer1done + position.stemIndex
    return layer1done + 7 + position.stemIndex
  }
  if (position.stageIndex === 2) return 6 + 13 + position.stemIndex
  return 6 + 13 + 10 + position.stemIndex // stageIndex === 3 (category)
})()
```

**5c. stageLabel:** Remove archetype label, update totals. Category is now stage 4 of 4 (for workshop). For onboarding, category is skipped so it only shows stages 1-3:
```js
const stageLabel = (() => {
  const total = isOnboarding ? 3 : 4
  if (position.stageIndex === 0) return `Stage 1 of ${total}  ·  Stem ${position.stemIndex + 1} of ${currentStems.length}`
  if (position.stageIndex === 1) {
    const layer = position.layerIndex === 0 ? 'Layer 2' : 'Layer 3'
    return `Stage 2 of ${total} (${layer})  ·  Stem ${position.stemIndex + 1} of ${currentStems.length}`
  }
  if (position.stageIndex === 2) return `Stage 3 of ${total}  ·  Stem ${position.stemIndex + 1} of ${currentStems.length}`
  return `Your Category  ·  Stem ${position.stemIndex + 1} of ${currentStems.length}`
})()
```

Note: `isOnboarding` is not in scope inside the IIFE. It is available in the component scope since `const isOnboarding = mode === 'onboarding'` is at the top. IIFEs in JSX still close over component variables, so this works.

- [ ] **Step 6: Update category stem timer check**

The `startCountdownThenRecord` uses `stemId.startsWith('sc_')` for the 60s timer. Category stems still use `sc_` prefix. No change needed here.

- [ ] **Step 7: Update avatar onSkip routing for workshop**

Currently workshop routes avatar → `category_intro`. Category is now stageIndex 3 (was 4). Find:
```jsx
onSkip={() => setScreen(isOnboarding ? 'experience_intro' : 'category_intro')}
```

The `beginStage` call in `category_intro` currently does `beginStage({ stageIndex: 4 })`. Change to `beginStage({ stageIndex: 3 })`:

Find the category_intro JSX block and change:
```jsx
onConfirm={() => beginStage({ stageIndex: 4 })}
```
To:
```jsx
onConfirm={() => beginStage({ stageIndex: 3 })}
```

- [ ] **Step 8: Update transcript key mapping**

In `triggerProcessing`, the stageKey mapping for category was using stageIndex === 4. Now it's stageIndex === 3. But stageIndex === 3 previously mapped to `'stage4Transcripts'`. With archetype removed, we need:

```js
const stageKey = stageIndex === 0 ? 'stage1Transcripts'
  : stageIndex === 1 ? 'stage2Transcripts'
  : stageIndex === 2 ? 'stage3Transcripts'
  : 'categoryTranscripts'
```

This was already set to `'categoryTranscripts'` for the old stageIndex 4 catch-all. With the shift, stageIndex 3 hits the catch-all. Verify this is correct after changes.

- [ ] **Step 9: Update landing page stage pills**

Workshop shows "Stage 4: The Search" — remove it. Category becomes stage 4. Update counts:

Workshop pills:
```js
{ n: 1, label: 'Living from Essence', desc: '6 stems — who you were as a kid' },
{ n: 2, label: 'Essence Suppressed', desc: '13 stems — what got shut down and why' },
{ n: 3, label: 'Consequences', desc: '10 stems — the cost of suppression now' },
...(!isOnboarding ? [
  { n: 4, label: 'Your Category', desc: '4 stems — the problem you were made to solve' },
] : []),
```

Remove the old "The Search" pill entirely.

Update workshop description: "33 stems, 4 stages, about 20 minutes"
Update onboarding description: "29 stems, 3 stages, about 20 minutes" (no category, no archetype stems)

Wait — onboarding has stages 1-3 (29 stems) + experience game. So "3 voice stages + experience game, about 25 minutes".

- [ ] **Step 10: Update session restore resume options**

The `resume=4` option currently calls `beginStage({ stageIndex: 3 })` for archetype. With archetype removed, `resume=4` should either be removed or mapped to category. Update:

```js
} else if (resumeStage === '4' && saved.stage3Results) {
  beginStage({ stageIndex: 3 }) // now category, not archetype
}
```

This is fine — stageIndex 3 is now category.

- [ ] **Step 11: Update handleRetryProcessing**

The error retry for processing currently calls `triggerProcessing(position.stageIndex, position.layerIndex)`. Since archetype no longer goes through triggerProcessing, if the archetype processing fails, the retry needs to call `processArchetypeFromStage1` instead. Check if the retry button's screen state could be `processing` with `processingStageKey === 4`:

The processing error screen shows a Retry button that calls `handleRetryProcessing`. If archetype processing fails (processingStageKey is 4), it would call triggerProcessing which no longer has a stageIndex 3 → archetype branch.

Fix: in `handleRetryProcessing`, check if processingStageKey is 4 and call `processArchetypeFromStage1`:

```js
const handleRetryProcessing = () => {
  setFlowError(null)
  if (processingStageKey === 4) {
    processArchetypeFromStage1()
  } else {
    triggerProcessing(position.stageIndex, position.layerIndex)
  }
}
```

- [ ] **Step 12: Run build**

```bash
npm run build
```

- [ ] **Step 13: Commit**

```bash
git add src/flows/VoiceStemFlow.jsx
git commit -m "feat: generate archetype from Stage 1 answers, remove Stage 4 stems"
```

---

### Task 3: Test + deploy

- [ ] **Step 1: Full build**

```bash
npm run build
```

- [ ] **Step 2: Verify flow order**

**Onboarding:**
Landing → Stages 1-3 stems → Stage 3 results → Processing (archetype from Stage 1) → Essence Reveal → Avatar → Experience Game → Signup → Choose Quests → Download

**Workshop:**
Landing → Stages 1-3 stems → Stage 3 results → Processing (archetype from Stage 1) → Essence Reveal → Avatar → Category Intro → Category Stems (stageIndex 3, 60s) → Category Reveal → Nudges → Final Results

- [ ] **Step 3: Verify stageIndex mapping**

| stageIndex | Stage | Stems | Edge fn stage |
|---|---|---|---|
| 0 | Essence | 6 | 1 |
| 1 (layer 0) | Suppressed L2 | 7 | 2 |
| 1 (layer 1) | Suppressed L3 | 6 | 2 |
| 2 | Consequences | 10 | 3 |
| — | Archetype (no stems) | 0 | 4 (uses Stage 1 transcripts) |
| 3 | Category (workshop only) | 4 | 7 |

- [ ] **Step 4: Push**

```bash
git push origin main
```
