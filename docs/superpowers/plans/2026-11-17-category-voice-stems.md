# Category Voice Stems + Category Statement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 4 category voice stems after avatar creation, synthesize a Category Statement via AI, show 3 nudge dares.

**Architecture:** New stage (stageIndex 4) appended to STAGES array. Same recording pipeline as stages 1-4 but with 60s timer (not 30s) since these are analytical, not emotional. New AI prompt in `process-stems` edge function as stage 7. Intro screen before stems. Empty-response fallback generates nudges from essence data only (skips category). `stemProcessing.js` already updated to spread context (done).

**Tech Stack:** React (VoiceStemFlow.jsx), Supabase Edge Functions (process-stems/index.ts), Claude Haiku 4.5

**Spec:** `docs/features/category-voice-stems-spec.md`

## Global Constraints

- Never use em dashes in user-facing copy
- Write so a 12-year-old would understand
- Never hardcode CSS colors, use `var()` tokens from `src/styles/theme-tokens.css`
- CSS scoped to parent (e.g. `.vs .vs-category-reveal {}`)
- Supabase edge functions use `npm:@anthropic-ai/sdk@0.39.0` and `claude-haiku-4-5-20251001`
- All `saveSession()` calls persist to both localStorage and Supabase `public_leads`
- Voice stem recording uses `useAudioRecorder` hook + `startCountdownThenRecord` pattern
- Category stems use 60s timer (not 30s) since they require more thought

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/data/voiceStems.js` | Modify | Add category stage (index 4) with 4 stems |
| `supabase/functions/process-stems/index.ts` | Modify | Add `buildStage7Prompt` + stage 7 routing |
| `src/flows/VoiceStemFlow.jsx` | Modify | Add state, processing, intro screen, category reveal, nudges, flow routing |
| `src/lib/stemProcessing.js` | DONE | Already updated to spread context (`{ stage, transcripts, ...context }`) |

---

### Task 1: Add category stems to voiceStems.js

**Files:**
- Modify: `src/data/voiceStems.js:69-82` (append new stage at index 4, after archetype)

**Interfaces:**
- Produces: `STAGES[4]` with id `'category'`, 4 stems with ids `sc_1` through `sc_4`. `getStemsForStage(4, null, context)` returns these 4 stems.

- [ ] **Step 1: Add the category stage**

Insert after the closing `},` of the archetype stage (index 3) and before the `]` that closes the STAGES array:

```js
  {
    id: 'category',
    label: 'Your Category',
    description: 'The problem you were made to solve.',
    stems: [
      { id: 'sc_1', text: 'The problem I see that nobody else is solving right is...' },
      { id: 'sc_2', text: 'Everyone assumes the answer is... but I think that\'s wrong because...' },
      { id: 'sc_3', text: 'The experience that showed me a different way was...' },
      { id: 'sc_4', text: 'If I could solve it my way, I would...' },
    ],
  },
```

NOTE: This appends at index 4. Existing stages 0-3 are untouched. `getStemsForStage(4, null, {})` will return these 4 stems with no code changes to that function.

- [ ] **Step 2: Run build**

```bash
npm run build
```

Expected: passes. No other files reference `STAGES[4]` yet.

- [ ] **Step 3: Commit**

```bash
git add src/data/voiceStems.js
git commit -m "feat: add 4 category voice stems (stage index 4)"
```

---

### Task 2: Add stage 7 prompt to process-stems edge function

**Files:**
- Modify: `supabase/functions/process-stems/index.ts`

**Interfaces:**
- Consumes: `stage: 7` in request body, `transcripts` (4 category stems), context fields from prior stages
- Produces: JSON with `categoryName`, `categoryStatement`, `connectionThread`, `nudgeSuggestions[]`

- [ ] **Step 1: Add buildStage7Prompt function**

Add after `buildStage6Prompt` function (around line 279):

```typescript
function buildStage7Prompt(transcripts: any[], context: any): string {
  const stemLines = transcripts.map(t =>
    `"${t.stemText}"\nResponse: ${t.transcript || '(no response)'}`
  ).join('\n\n')

  // Check if category stems are mostly empty
  const hasContent = transcripts.some(t => (t.transcript || '').trim().length > 5)

  if (!hasContent) {
    // Fallback: generate nudges from essence data only, skip category
    return `You are generating 3 weekly dares for someone based on their self-discovery results.

They discovered:
- Childhood essence: ${context.stage1Energy || 'unknown'} - ${context.stage1Summary || ''}
- Their archetype: ${context.primaryArchetype || 'unknown'}
- Their essence blend: ${context.essenceBlend || ''}
- Their wound prediction: "${context.confirmedPrediction || ''}"
- Their protective rule: "${context.rule || ''}"

They could not articulate a problem they want to solve yet. That is okay. Focus on reconnecting them with their essence through action.

Return ONLY valid JSON:

{
  "categoryName": null,
  "categoryStatement": null,
  "connectionThread": null,
  "nudgeSuggestions": [
    "A specific action they could take this week to reconnect with their childhood essence. Concrete, doable, slightly scary. Max 20 words.",
    "A second nudge that tests their prediction/rule. Max 20 words.",
    "A third nudge from a different angle. Max 20 words."
  ]
}

Rules:
- The nudges should feel like dares, not homework. Slightly scary, deeply meaningful.
- Reference their specific essence energy and archetype.
- NEVER use em dashes. Use periods, commas, or restructure.`
  }

  return `You are synthesizing a Category Statement for someone who just completed a deep self-discovery exercise.

They discovered:
- Childhood essence: ${context.stage1Energy || 'unknown'} - ${context.stage1Summary || ''}
- What shut it down: "${context.confirmedPrediction || ''}", installed at ${context.woundStage || 'unknown'} (${context.woundScene || ''})
- The rule they made: "${context.rule || ''}"
- Their protective pattern: ${context.protectivePattern || 'unknown'}
- Their nervous system response: ${context.nsLabel || 'unknown'}
- Their archetype: ${context.primaryArchetype || 'unknown'} + ${context.secondaryArchetype || 'unknown'}
- Their essence blend: ${context.essenceBlend || ''}
- Their lowest dimension: ${context.lowestDimension || 'unknown'}

They then answered 4 category stems (spoken, raw, unfiltered):

${stemLines}

Synthesize a Category Statement that connects their essence to their category. This should feel like a revelation, not a business plan.

Return ONLY valid JSON:

{
  "categoryName": "2-4 words. The name of their category. Not a job title. A movement. E.g. 'Courage as Medicine', 'Play as Therapy', 'Movement as Freedom'. Something they would put on a flag.",
  "categoryStatement": "3-4 sentences in second person. First: connect their wound to the problem they see. Second: name the wrong assumption and why they see through it. Third: how their archetype essence solves it differently. Fourth: one sentence that makes them feel like they were MADE for this. Max 80 words total.",
  "connectionThread": "One sentence connecting their childhood essence to their category. E.g. 'The kid who could not stop moving became the person who teaches others that the body knows before the mind does.' Max 30 words.",
  "nudgeSuggestions": [
    "A specific action they could take this week based on their category and essence. Concrete, doable, slightly scary. Max 20 words.",
    "A second nudge from a different angle. Max 20 words.",
    "A third nudge from a different angle. Max 20 words."
  ]
}

Rules:
- The categoryName should feel like something they would put on a flag, not a LinkedIn headline.
- The categoryStatement should make them emotional. This is the moment it all clicks together.
- Use their actual words from ALL stages wherever possible.
- The nudgeSuggestions should feel like dares, not homework. Slightly scary, deeply meaningful.
- The connectionThread should read like a movie tagline about their life.
- NEVER use em dashes. Use periods, commas, or restructure the sentence instead.`
}
```

- [ ] **Step 2: Add stage 7 routing in the serve handler**

In the `switch (stage)` block, add before the `default` case:

```typescript
      case 7: {
        prompt = buildStage7Prompt(transcripts, body)
        break
      }
```

Note: we pass `body` directly as context since `stemProcessing.js` now spreads all context fields into the body. The edge function's `buildStage7Prompt` reads whatever fields it needs from `context`.

- [ ] **Step 3: Update stage validation**

Change:
```typescript
if (![1, 2, 3, 4, 5, 6].includes(stage)) {
```
To:
```typescript
if (![1, 2, 3, 4, 5, 6, 7].includes(stage)) {
```

- [ ] **Step 4: Update max_tokens for stage 7**

Change:
```typescript
max_tokens: stage === 4 ? 1500 : 1024,
```
To:
```typescript
max_tokens: (stage === 4 || stage === 7) ? 1500 : 1024,
```

- [ ] **Step 5: Deploy edge function**

```bash
npx supabase functions deploy process-stems --project-ref qlwfcfypnoptsocdpxuv --yes
```

- [ ] **Step 6: Commit**

```bash
git add supabase/functions/process-stems/index.ts
git commit -m "feat: add stage 7 category synthesis prompt with empty-response fallback"
```

---

### Task 3: Wire category stems into VoiceStemFlow

**Files:**
- Modify: `src/flows/VoiceStemFlow.jsx`

**Interfaces:**
- Consumes: `STAGES[4]` from voiceStems.js, `processStage(7, transcripts, context)` from edge function
- Produces: `categoryResults` state, new screen states: `category_intro`, `category_reveal`, `nudges`

- [ ] **Step 1: Add state**

After `const [essenceName, setEssenceName] = useState('')` (around line 1077), add:

```js
  const [categoryResults, setCategoryResults] = useState(null)
```

- [ ] **Step 2: Add processing label**

In `ProcessingScreen` labels object (around line 334), add:

```js
    7: 'Discovering your category...',
```

- [ ] **Step 3: Add MAX_CATEGORY_SECONDS constant**

After `const MAX_STEM_SECONDS = 30` (around line 26), add:

```js
const MAX_CATEGORY_SECONDS = 60
```

- [ ] **Step 4: Update startCountdownThenRecord to use category timer**

In `startCountdownThenRecord` (around line 1248), the stem timer uses `MAX_STEM_SECONDS`. For category stems, use `MAX_CATEGORY_SECONDS`. Check the stemId prefix since `positionRef` may be stale when called from `beginStage`.

The function signature is `const startCountdownThenRecord = useCallback((stemId) => {`. Change:

```js
setStemSeconds(MAX_STEM_SECONDS)
```
To:
```js
const maxSecs = stemId.startsWith('sc_') ? MAX_CATEGORY_SECONDS : MAX_STEM_SECONDS
setStemSeconds(maxSecs)
```

And change:
```js
let secs = MAX_STEM_SECONDS
```
To:
```js
let secs = maxSecs
```

This works because category stem IDs are `sc_1` through `sc_4` (defined in Task 1). No dependency on position state timing.

- [ ] **Step 5: Update triggerProcessing for stageIndex 4**

In `triggerProcessing`, find the processingStageKey block. The current code ends with:
```js
else setProcessingStageKey(4)
```

Change that `else` to be explicit, and add category:
```js
else if (stageIndex === 3) setProcessingStageKey(4)
else if (stageIndex === 4) setProcessingStageKey(7)
```

- [ ] **Step 6: Add stageIndex 4 processing branch**

After the `stageIndex === 3` block in `triggerProcessing` (after the essence-mirror-blend call, around line 1476), add before the closing `} catch`:

```js
      } else if (stageIndex === 4) {
        // Category synthesis — send all prior data + category transcripts
        const results = await processStage(7, transcripts, {
          stage1Energy: stage1Results?.energy || '',
          stage1Summary: stage1Results?.essenceSummary || stage1Results?.energy || '',
          confirmedPrediction: confirmedPrediction || '',
          rule: stage2Results?.rule || stage2Results?.protectiveRule || '',
          protectivePattern: stage2Results?.protectivePattern || '',
          woundStage: stage2Results?.woundStage || '',
          woundScene: stage2Results?.woundScene || '',
          nsLabel: stage2Results?.nsLabel || '',
          lowestDimension: stage3Results?.lowestDimension || '',
          primaryArchetype: stage4Results?.primaryArchetype?.name || '',
          secondaryArchetype: stage4Results?.secondaryArchetype?.name || '',
          essenceBlend: stage4Results?.essenceBlend || '',
        })
        setCategoryResults(results)
        saveSession({ categoryResults: results })
        setScreen('category_reveal')
```

- [ ] **Step 7: Update session restore**

In the useEffect that restores from localStorage (around line 1150), add after essenceName restore:

```js
      if (saved.categoryResults) setCategoryResults(saved.categoryResults)
```

- [ ] **Step 8: Update handleRestart**

In handleRestart, add after the existing state resets:

```js
    setCategoryResults(null)
```

- [ ] **Step 9: Update progress tracking**

**9a. totalStems** (line 1122): Change `35` to `39`:
```js
  const totalStems = 39 // 6 + 13 + 10 + 6 + 4(category)
```

**9b. stemsCompleted** (lines 1123-1132): Replace the entire IIFE:
```js
  const stemsCompleted = (() => {
    if (position.stageIndex === 0) return position.stemIndex
    if (position.stageIndex === 1) {
      const layer1done = 6
      if (position.layerIndex === null || position.layerIndex === 0) return layer1done + position.stemIndex
      return layer1done + 7 + position.stemIndex
    }
    if (position.stageIndex === 2) return 6 + 13 + position.stemIndex
    if (position.stageIndex === 3) return 6 + 13 + 10 + position.stemIndex
    return 6 + 13 + 10 + 6 + position.stemIndex // stageIndex === 4 (category)
  })()
```

**9c. stageLabel** (lines 1136-1143): Replace the entire IIFE:
```js
  const stageLabel = (() => {
    const total = 5
    if (position.stageIndex === 0) return `Stage 1 of ${total}  ·  Stem ${position.stemIndex + 1} of ${currentStems.length}`
    if (position.stageIndex === 1) {
      const layer = position.layerIndex === 0 ? 'Layer 2' : 'Layer 3'
      return `Stage 2 of ${total} (${layer})  ·  Stem ${position.stemIndex + 1} of ${currentStems.length}`
    }
    if (position.stageIndex === 2) return `Stage 3 of ${total}  ·  Stem ${position.stemIndex + 1} of ${currentStems.length}`
    if (position.stageIndex === 3) return `Stage 4 of ${total}  ·  Stem ${position.stemIndex + 1} of ${currentStems.length}`
    return `Your Category  ·  Stem ${position.stemIndex + 1} of ${currentStems.length}`
  })()
```

- [ ] **Step 10: Route avatar → category intro**

Find the avatar JSX block (search for `screen === 'avatar'`). Change `onSkip` from:
```jsx
onSkip={() => setScreen(isOnboarding ? 'experience_intro' : 'final_results')}
```
To:
```jsx
onSkip={() => setScreen('category_intro')}
```

- [ ] **Step 11: Update landing page stage pills**

Find the landing stages array (search for `'Living from Essence'`). Replace with:

```jsx
            <div className="vs-landing-stages">
              {[
                { n: 1, label: 'Living from Essence', desc: '6 stems — who you were as a kid' },
                { n: 2, label: 'Essence Suppressed', desc: '13 stems — what got shut down and why' },
                { n: 3, label: 'Consequences', desc: '10 stems — the cost of suppression now' },
                { n: 4, label: 'The Search', desc: '6 stems — who you are underneath it all' },
                { n: 5, label: 'Your Category', desc: '4 stems — the problem you were made to solve' },
                ...(isOnboarding ? [
                  { n: 6, label: 'The Experience Game', desc: '105 activities — what lights you up' },
                  { n: 7, label: 'The Paid Filter', desc: 'your fun activities — path or hobby' },
                ] : []),
              ].map(s => (
```

Update the landing description:
```jsx
            <p className="vs-landing-desc">
              {isOnboarding
                ? "Speak fast. Don't think. First thing that comes. 7 stages, about 35 minutes."
                : "You'll complete sentences out loud. Speak fast. Don't think. First thing that comes. 39 stems, 5 stages, about 25 minutes."
              }
            </p>
```

- [ ] **Step 12: Run build**

```bash
npm run build
```

- [ ] **Step 13: Commit**

```bash
git add src/flows/VoiceStemFlow.jsx
git commit -m "feat: wire category stems + 60s timer + processing into VoiceStemFlow"
```

---

### Task 4: Build category intro, CategoryReveal, and NudgeCards screens

**Files:**
- Modify: `src/flows/VoiceStemFlow.jsx` (add 2 sub-components + 3 JSX screen blocks)

**Interfaces:**
- Consumes: `categoryResults` (categoryName, categoryStatement, connectionThread, nudgeSuggestions), `isOnboarding` flag
- Produces: 3 screens: `category_intro`, `category_reveal`, `nudges`. After nudges, routes to `experience_intro` (onboarding) or `final_results` (workshop).

- [ ] **Step 1: Add CategoryReveal component**

Add after the `Stage3Results` component (around line 640):

```jsx
function CategoryReveal({ results, onContinue }) {
  if (!results) return null
  const hasCategory = results.categoryName && results.categoryStatement

  return (
    <div className="vs-results">
      <div className="vs-results-header">
        <div className="vs-results-label">{hasCategory ? 'Your Category' : 'Your Essence'}</div>
        {hasCategory && <h2 className="vs-gold-text">{results.categoryName}</h2>}
      </div>

      {results.connectionThread && (
        <p style={{ color: 'var(--vs-muted)', fontSize: '0.95rem', textAlign: 'center', margin: '0 0 20px', lineHeight: 1.6, fontStyle: 'italic' }}>
          {results.connectionThread}
        </p>
      )}

      {results.categoryStatement && (
        <div className="vs-results-card">
          <p style={{ fontSize: '1rem', lineHeight: 1.7, margin: 0, color: 'var(--vs-text)' }}>
            {results.categoryStatement}
          </p>
        </div>
      )}

      <button className="vs-btn-primary" onClick={onContinue} style={{ marginTop: 16 }}>
        {hasCategory ? 'See your dares' : 'See your dares for this week'}
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Add NudgeCards component**

```jsx
function NudgeCards({ nudges, categoryName, onContinue }) {
  return (
    <div className="vs-results">
      <div className="vs-results-header">
        {categoryName && <div className="vs-results-label">{categoryName}</div>}
        <h2>Three dares for this week</h2>
      </div>
      <p style={{ color: 'var(--vs-muted)', fontSize: '0.9rem', textAlign: 'center', margin: '0 0 16px' }}>
        Small actions that honour your essence. Pick at least one.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {(nudges || []).map((nudge, i) => (
          <div key={i} className="vs-results-card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <span style={{ color: 'var(--vs-gold)', fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
            <span style={{ color: 'var(--vs-text)', lineHeight: 1.5 }}>{nudge}</span>
          </div>
        ))}
      </div>

      <button className="vs-btn-primary" onClick={onContinue} style={{ marginTop: 20 }}>
        Continue
      </button>
    </div>
  )
}
```

- [ ] **Step 3: Add screen JSX blocks**

Add after the `{screen === 'avatar' && ...}` block:

```jsx
        {/* CATEGORY INTRO */}
        {screen === 'category_intro' && (
          <div className="vs-exp-intro">
            <div className="vs-results-card">
              <div className="vs-results-label">Stage 5</div>
              <h2 className="vs-results-title">Your Category</h2>
              <p className="vs-exp-intro-desc">
                You just met yourself. Now let&apos;s find out what you&apos;re here to do.
              </p>
              <p className="vs-exp-intro-desc" style={{ marginTop: 12 }}>
                4 stems. Take your time on these. There&apos;s no wrong answer.
              </p>
            </div>
            <div className="vs-bottom-action">
              <DoubleConfirmButton
                onConfirm={() => beginStage({ stageIndex: 4 })}
                label="Start"
                confirmLabel="Ready? Tap to begin"
              />
            </div>
          </div>
        )}

        {/* CATEGORY REVEAL */}
        {screen === 'category_reveal' && categoryResults && (
          <CategoryReveal
            results={categoryResults}
            onContinue={() => setScreen('nudges')}
          />
        )}

        {/* NUDGE DARES */}
        {screen === 'nudges' && categoryResults && (
          <NudgeCards
            nudges={categoryResults.nudgeSuggestions}
            categoryName={categoryResults.categoryName}
            onContinue={() => setScreen(isOnboarding ? 'experience_intro' : 'final_results')}
          />
        )}
```

- [ ] **Step 4: Run build**

```bash
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add src/flows/VoiceStemFlow.jsx
git commit -m "feat: category intro + CategoryReveal + NudgeCards screens"
```

---

### Task 5: Final integration test + deploy

**Files:**
- All modified files from Tasks 1-4

- [ ] **Step 1: Full build**

```bash
npm run build
```

- [ ] **Step 2: Verify complete flow order**

**Workshop** (`/try/voice-stems`):
Landing (name+email) → Stages 1-4 stems → Essence Reveal → Avatar → Category Intro → Category Stems (4, 60s each) → Category Reveal → Nudges → Final Results

**Onboarding** (`/try/onboarding`):
Landing (no gate) → Stages 1-4 stems → Essence Reveal → Avatar → Category Intro → Category Stems (4, 60s each) → Category Reveal → Nudges → Experience Game → Paid Filter → Signup → Download

- [ ] **Step 3: Verify stageIndex mapping**

| stageIndex | Stage | Stems | Timer | Edge fn stage |
|---|---|---|---|---|
| 0 | Essence | 6 | 30s | 1 |
| 1 (layer 0) | Suppressed L2 | 7 | 30s | 2 |
| 1 (layer 1) | Suppressed L3 | 6 | 30s | 2 |
| 2 | Consequences | 10 | 30s | 3 |
| 3 | Archetype | 6 | 30s | 4 |
| 4 | Category | 4 | 60s | 7 |

Edge function stages 5+6 are deprecated (old batch experience game). Left in place, not removed.

- [ ] **Step 4: Test empty-response fallback**

Inject test data with empty category transcripts and verify the AI returns `categoryName: null` with essence-based nudges only.

- [ ] **Step 5: Push**

```bash
git push origin main
```

- [ ] **Step 6: Verify deployment**

```bash
gh api repos/Nic-Huzz/findmyflow/deployments --jq '.[0] | {sha: .sha[0:8], created: .created_at}'
```
