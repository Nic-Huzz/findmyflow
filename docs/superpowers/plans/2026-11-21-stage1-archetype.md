# Stage 1 Archetype + Flow Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate archetype from Stage 1 childhood answers (not Stage 4 abstract stems). Restructure the entire onboarding + workshop flow: archetype reveal after Stage 1, avatar at the end, path definition bolted in.

**Architecture:** Stage 1 processing runs the archetype AI immediately after stems complete, using Stage 1 transcripts. The Stage 1 results page becomes the identity reveal (energy + patterns + mirror + archetype + blend name). Stage 4 "Search" stems are deleted. Avatar moves to the end of the flow as the grand finale. Path definition is embedded after choose-quests in onboarding.

**Tech Stack:** React (VoiceStemFlow.jsx), voiceStems.js, ChooseQuestsFlow.jsx, PathDefinitionFlow (existing, needs embedding)

**Evidence:** Tested with real user data. Stage 1 answers → "Playful Creator + Heart Alchemist → Joy Alchemist". Stage 4 answers → "Truth-Teller + Heart Alchemist → Honest Heart". Stage 1 version is more resonant because childhood memories are richer than abstract self-reflection.

**Target onboarding flow:**
```
Landing → Stage 1 stems → [Archetype AI processes] → Archetype Reveal → Stage 2 stems → Stage 3 stems → Experience Game (87 activities) → Signup → Choose Quests → Path Definition → Avatar Creation → Download App
```

**Target workshop flow:**
```
Landing → Stage 1 stems → [Archetype AI processes] → Archetype Reveal → Stage 2 stems → Stage 3 stems → Category Stems (4, 60s) → Category Reveal → Nudges → Avatar Creation → Final Results
```

**Read first:** `docs/session-handoff-2026-11-17-voice-stems-rewrite.md` — full context on how `/try/onboarding` and `/try/voice-stems` share one component with `isOnboarding` branching, data flow, edge function mapping, and gotchas.

## Global Constraints

- Never use em dashes in user-facing copy
- Never hardcode CSS colors, use `var()` tokens
- Edge function stage 4 prompt unchanged (works with any transcript content)
- `stage4Results` state stays (stores archetype regardless of which transcripts generated it)
- `stemProcessing.js` already spreads context (`{ stage, transcripts, ...context }`)
- Category stems use `sc_` prefix, 60s timer (checked via `stemId.startsWith('sc_')`)

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/data/voiceStems.js` | Modify | Remove STAGES[3] (archetype stems). Category shifts from index 4 to 3. |
| `src/flows/VoiceStemFlow.jsx` | Modify | Archetype after Stage 1, avatar at end, Stage 2 stem rewrite, stageIndex shifts, progress updates |
| `src/flows/ChooseQuestsFlow.jsx` | No change | Already embedded with `onComplete` prop |
| `supabase/functions/process-stems/index.ts` | No change | Stage 4 prompt works with Stage 1 transcripts |

---

### Task 1: Remove archetype stems, shift category

**Files:**
- Modify: `src/data/voiceStems.js`

**Interfaces:**
- Produces: `STAGES` with 4 entries: 0=essence, 1=suppressed, 2=consequences, 3=category
- `getStemsForStage(3)` now returns category stems (sc_1 through sc_4)

- [ ] **Step 1: Delete the archetype stage**

Remove the entire STAGES[3] object (id: 'archetype', label: 'The Search', 6 stems s4_1 through s4_6). The category stage at index 4 automatically becomes index 3.

- [ ] **Step 2: Run build**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/data/voiceStems.js
git commit -m "feat: remove archetype stems, shift category to STAGES[3]"
```

---

### Task 2: Archetype processing after Stage 1

**Files:**
- Modify: `src/flows/VoiceStemFlow.jsx`

**Interfaces:**
- Consumes: Stage 1 transcripts (s1_1 through s1_6 from `transcriptsRef.current`)
- Produces: `stage4Results`, `blendResult`, `essenceName` — set during Stage 1 processing, before Stage 2 begins

The archetype AI currently runs after Stage 4 stems complete (stageIndex 3 branch in `triggerProcessing`). Move it into the Stage 1 processing block so it runs right after Stage 1 results come back.

- [ ] **Step 1: Modify Stage 1 processing to include archetype**

In `triggerProcessing`, find the `stageIndex === 0` block (around line 1424). Currently it:
1. Calls `processStage(1, transcripts, {})`
2. Sets `stage1Results`, `selectedExpression`
3. Shows `results_1`

Change it to also:
4. Call `processStage(4, stage1Transcripts, context)` using the same Stage 1 transcripts
5. Call `essence-mirror-blend` for the custom name
6. Set `stage4Results`, `blendResult`, `essenceName`
7. Save all to session

The archetype AI needs context from stages 2-3 (wound, dimensions) but those don't exist yet at Stage 1. Pass empty strings for those fields — the AI prompt handles missing context gracefully (it uses `|| 'unknown'` fallbacks). The archetype will be based purely on childhood essence, which is what we want.

```js
if (stageIndex === 0) {
  // Stage 1 — cluster essence themes
  const results = await processStage(1, transcripts, {})
  setStage1Results(results)
  const energy = results?.energy || 'your essence'
  const expression = results?.essenceSummary || energy
  setSelectedExpression(expression)

  // Run archetype AI using Stage 1 transcripts
  setProcessingStageKey(4)
  const archetypeResults = await processStage(4, transcripts, {
    selectedExpression: expression,
    stage1Mirror: results?.mirror || '',
    woundScene: '',
    nsLabel: '',
    lowestDimension: '',
  })
  setStage4Results(archetypeResults)

  // Get custom blend name
  const primaryData = getArchetype(archetypeResults.primaryArchetype?.id)
  const secondaryData = getArchetype(archetypeResults.secondaryArchetype?.id)
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
    setEssenceName(archetypeResults.primaryArchetype?.name || 'Your True Self')
  }

  saveSession({
    stage1Transcripts: transcriptsRef.current,
    stage1Results: results,
    selectedExpression: expression,
    stage4Results: archetypeResults,
    completed: true,
  })
  setScreen('results_1')
}
```

- [ ] **Step 2: Update Stage1Results component to show archetype**

The `Stage1Results` component (around line 410) currently shows energy + patterns + mirror. Add archetype display: primary name, secondary name, blend name, essenceBlend, mirrorReveal.

Pass the new props:
```jsx
<Stage1Results
  results={stage1Results}
  archetypeResults={stage4Results}
  blendResult={blendResult}
  essenceName={essenceName}
  onEssenceNameChange={(name) => {
    setEssenceName(name)
    saveSession({ essenceName: name })
  }}
  onContinue={() => beginStage({ stageIndex: 1, layerIndex: 0 })}
/>
```

Update the component to render the archetype section below the existing patterns. Include the editable essence name input (move from EssenceReveal to here). Show:
- Energy label ("Roaming and restless") as headline
- essenceSummary as subtitle
- Patterns (existing)
- Mirror (existing)
- Divider
- Blend name (editable input, gold text)
- Primary + secondary archetype names
- essenceBlend text
- mirrorReveal text
- "This is me" continue button

- [ ] **Step 3: Remove the old stageIndex === 3 archetype branch from triggerProcessing**

Delete the entire `else if (stageIndex === 3)` block that was the old archetype processing path (the one with `processStage(4, ...)`, essence-mirror-blend call, etc.). This code is now in the stageIndex === 0 block.

- [ ] **Step 4: Remove the separate EssenceReveal screen**

The essence reveal is now part of the Stage 1 results page. Remove:
- The `EssenceReveal` component definition
- The `{screen === 'essence_reveal' && ...}` JSX block
- Any routing that goes to `'essence_reveal'`

The `saveEssenceProfile` call that was in essence_reveal's `onContinue` should move to the Stage 1 results `onContinue` or be called after archetype processing.

- [ ] **Step 5: Rewrite Stage 2 stem s2a_2**

Currently: `"When I think about doing {selectedExpression}, the first thing I feel is..."`

The `{selectedExpression}` is auto-set to `essenceSummary` (e.g. "exploring and discovering what's around every corner"). This is confusing because the user didn't choose it and may not recognise it.

Change to reference what the user actually saw — their energy label:
```js
{ id: 's2a_2', text: 'When I think about being {selectedExpression} again, the first thing I feel is...', dynamic: true },
```

Or even simpler, remove the dynamic part entirely and make it universal:
```js
{ id: 's2a_2', text: 'When I think about being that kid again, the first thing I feel is...' },
```

**Decision needed from user:** Which wording? Flag this for the user before implementing. Use the simpler version ("being that kid again") as default if no response.

- [ ] **Step 6: Run build**

```bash
npm run build
```

- [ ] **Step 7: Commit**

```bash
git add src/flows/VoiceStemFlow.jsx src/data/voiceStems.js
git commit -m "feat: archetype from Stage 1 answers, combined reveal page"
```

---

### Task 3: Move avatar to end of flow

**Files:**
- Modify: `src/flows/VoiceStemFlow.jsx`

Currently avatar comes after essence reveal. Move it to after path definition (onboarding) or after nudges (workshop).

- [ ] **Step 1: Update routing — avatar no longer after essence reveal**

The Stage 1 results `onContinue` should go straight to Stage 2 (not avatar):
```jsx
onContinue={() => beginStage({ stageIndex: 1, layerIndex: 0 })}
```
This is already the case if we removed EssenceReveal in Task 2.

- [ ] **Step 2: Move avatar to after path definition (onboarding)**

Current onboarding end: `Choose Quests → Download App`
New: `Choose Quests → Path Definition → Avatar → Download App`

Change ChooseQuestsFlow onComplete:
```jsx
<ChooseQuestsFlow onComplete={() => setScreen('avatar')} />
```

Change avatar onSkip for onboarding:
```jsx
onSkip={() => setScreen('download_app')}
```

Note: Path definition is Task 4. For now, wire avatar after choose-quests. Task 4 will insert path definition between them.

- [ ] **Step 3: Move avatar to after nudges (workshop)**

Current workshop end: `Nudges → Final Results`
New: `Nudges → Avatar → Final Results`

Change NudgeCards onContinue for workshop:
```jsx
onContinue={() => setScreen(isOnboarding ? 'avatar' : 'avatar')}
```

Actually both modes go to avatar now. Simplify:
```jsx
onContinue={() => setScreen('avatar')}
```

Change avatar onSkip:
```jsx
onSkip={() => setScreen(isOnboarding ? 'download_app' : 'final_results')}
```

- [ ] **Step 4: Remove old avatar routing from category_intro**

Currently avatar onSkip routes to `category_intro` (workshop) or `experience_intro` (onboarding). Both of these are wrong now — avatar is at the END, not in the middle. Remove these routes since avatar is now only reached from nudges/choose-quests.

- [ ] **Step 5: Run build**

```bash
npm run build
```

- [ ] **Step 6: Commit**

```bash
git add src/flows/VoiceStemFlow.jsx
git commit -m "feat: move avatar to end of flow (after path def / nudges)"
```

---

### Task 4: Bolt path definition into onboarding

**Files:**
- Modify: `src/flows/VoiceStemFlow.jsx`
- Read: `src/flows/PathDefinitionFlow.jsx` (or wherever path definition lives — search for `path-definition` route in AppRouter.jsx)

Path definition is the per-quest setup: dimensions, fuels, fears, identity declarations, commitment. Currently a separate in-app flow at `/path-definition/:questId`. Needs to run after choose-quests in onboarding.

- [ ] **Step 1: Find the path definition component**

```bash
grep -r "path-definition\|PathDefinition" src/AppRouter.jsx src/flows/
```

Determine: can it be imported and rendered with an `onComplete` prop like ChooseQuestsFlow? Or does it need quest IDs from the choose-quests step?

- [ ] **Step 2: Wire it into the onboarding flow**

After choose-quests completes, the user has created quests. Route to path definition for each quest, then to avatar:

```
Choose Quests → Path Definition (per quest) → Avatar → Download
```

If path definition handles multiple quests internally, embed it like ChooseQuestsFlow:
```jsx
{screen === 'path_definition' && (
  <PathDefinitionFlow onComplete={() => setScreen('avatar')} />
)}
```

If it only handles one quest at a time, may need a wrapper that iterates through created quests.

- [ ] **Step 3: Update ChooseQuestsFlow onComplete routing**

Change from going to avatar:
```jsx
<ChooseQuestsFlow onComplete={() => setScreen('path_definition')} />
```

- [ ] **Step 4: Run build + test**

```bash
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add src/flows/VoiceStemFlow.jsx
git commit -m "feat: bolt path definition into onboarding after choose-quests"
```

---

### Task 5: Update progress tracking, landing page, session restore

**Files:**
- Modify: `src/flows/VoiceStemFlow.jsx`

- [ ] **Step 1: Update totalStems**

Onboarding: 29 stems (6 + 13 + 10, no category, no archetype)
Workshop: 33 stems (6 + 13 + 10 + 4 category)

```js
const totalStems = isOnboarding ? 29 : 33
```

- [ ] **Step 2: Update stemsCompleted**

Remove stageIndex 3 archetype case. Category is now stageIndex 3:
```js
const stemsCompleted = (() => {
  if (position.stageIndex === 0) return position.stemIndex
  if (position.stageIndex === 1) {
    const layer1done = 6
    if (position.layerIndex === null || position.layerIndex === 0) return layer1done + position.stemIndex
    return layer1done + 7 + position.stemIndex
  }
  if (position.stageIndex === 2) return 6 + 13 + position.stemIndex
  return 6 + 13 + 10 + position.stemIndex // stageIndex === 3 (category, workshop only)
})()
```

- [ ] **Step 3: Update stageLabel**

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

- [ ] **Step 4: Update processingStageKey mapping in triggerProcessing**

```js
if (stageIndex === 0) setProcessingStageKey(1)
else if (stageIndex === 1 && layerIndex === 0) setProcessingStageKey('2a')
else if (stageIndex === 1 && layerIndex === 1) setProcessingStageKey('2b')
else if (stageIndex === 2) setProcessingStageKey(3)
else if (stageIndex === 3) setProcessingStageKey(7)
```

Note: processingStageKey 4 (archetype) is now set inside the stageIndex 0 block, not here.

- [ ] **Step 5: Update category stageIndex in triggerProcessing**

The category processing branch changes from `stageIndex === 4` to `stageIndex === 3`.

- [ ] **Step 6: Update transcript key mapping**

```js
const stageKey = stageIndex === 0 ? 'stage1Transcripts'
  : stageIndex === 1 ? 'stage2Transcripts'
  : stageIndex === 2 ? 'stage3Transcripts'
  : 'categoryTranscripts'
```

- [ ] **Step 7: Update category_intro beginStage call**

```jsx
onConfirm={() => beginStage({ stageIndex: 3 })}
```

- [ ] **Step 8: Update landing page pills**

Onboarding: 3 stages + Experience Game (no category, no archetype)
Workshop: 4 stages (includes category, no archetype)

Update descriptions to match new stem counts and time estimates.

- [ ] **Step 9: Update handleRetryProcessing**

```js
const handleRetryProcessing = () => {
  setFlowError(null)
  if (processingStageKey === 4) {
    // Archetype retry — re-run Stage 1 processing which includes archetype
    triggerProcessing(0, null)
  } else {
    triggerProcessing(position.stageIndex, position.layerIndex)
  }
}
```

Note: Since archetype is now part of stageIndex 0 processing, retrying with stageIndex 0 re-runs both Stage 1 + archetype. This means Stage 1 results also regenerate, which is acceptable.

- [ ] **Step 10: Update session restore**

The `completed: true` flag is now set after Stage 1 (not after Stage 4). Session restore with `completed: true` should route appropriately:
- If `stage3Results` exists → user finished everything, go to appropriate end screen
- If only `stage1Results` exists → user got archetype but hasn't done stages 2-3 yet

- [ ] **Step 11: Run build**

```bash
npm run build
```

- [ ] **Step 12: Commit**

```bash
git add src/flows/VoiceStemFlow.jsx
git commit -m "feat: update progress, landing, routing for new flow order"
```

---

### Task 6: Final integration test + push

- [ ] **Step 1: Full build**

```bash
npm run build
```

- [ ] **Step 2: Verify both flows end-to-end**

**Onboarding:**
Landing → Stage 1 (6 stems) → Archetype reveal on results page → Stage 2 (13 stems) → Stage 3 (10 stems) → Experience Game → Signup → Choose Quests → Path Definition → Avatar → Download

**Workshop:**
Landing → Stage 1 (6 stems) → Archetype reveal on results page → Stage 2 (13 stems) → Stage 3 (10 stems) → Category (4 stems, 60s) → Category Reveal → Nudges → Avatar → Final Results

- [ ] **Step 3: Verify stageIndex mapping**

| stageIndex | Stage | Stems | Edge fn stage |
|---|---|---|---|
| 0 | Essence + Archetype | 6 (archetype uses same transcripts) | 1 + 4 |
| 1 (layer 0) | Suppressed L2 | 7 | 2 |
| 1 (layer 1) | Suppressed L3 | 6 | 2 |
| 2 | Consequences | 10 | 3 |
| 3 | Category (workshop only) | 4 | 7 |

- [ ] **Step 4: Deploy edge function if changed**

Only needed if process-stems was modified (it shouldn't be).

- [ ] **Step 5: Push**

```bash
git push origin main
```
