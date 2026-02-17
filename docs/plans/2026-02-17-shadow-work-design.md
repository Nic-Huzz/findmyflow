# Shadow Work Workshop — Design & Implementation Plan

> Date: 2026-02-17
> Source: `docs/shadow-work-workshop-draft.md` (5-act workshop, 51 slides)
> Target: Healing tab > Recognise > Deep Dive flow at `/shadow-work`

---

## Design Decisions

| Question | Decision |
|----------|----------|
| Repeatability | Growing inventory — each completion adds new shadows. Once per calendar week (Mon-Sun). |
| Privacy | Standard — saved to `quest_completions.response_data` like all other quests. |
| Zarlo access | Full context — Zarlo can see shadow traits, archetypes, and origin stories. |
| Groan Matrix link | Not now — future feature. No auto-generation of courage challenges in V1. |
| Step count | All 14 steps kept — this is a Deep Dive, meant to be longer. |
| Component pattern | Flow route (`inputType: "flow"`, `flow_route: "/shadow-work"`) — same as HealingCompass. |
| Styling | Reuses `NervousSystemHealingCompass.css` — same purple gradient, gold CTAs, progress dots. Small `.sw-` additions only. |

---

## Architecture

### Component: `src/flows/ShadowWorkFlow.jsx`

Full-page 14-screen flow. Uses named screens in an ordered array with `currentScreen` state and render functions per screen (identical pattern to `HealingCompass.jsx`).

**Imports:**
- `NervousSystemHealingCompass.css` (shared healing flow styles)
- `ShadowWorkFlow.css` (small `.sw-` additions)
- `useAutoSave` hook
- `completeFlowQuest` from `questCompletion.js`
- `PROTECTIVE_VOICES` from `src/data/protectiveVoices.js` (for archetype cards in step 7)

### Screen Order

```js
const SCREEN_ORDER = [
  'loading', 'time_check',
  'teach_what_are_shadows',      // 1 - Teach
  'teach_shadows_and_light',     // 2 - Teach
  'input_shadow_traits',         // 3 - Input: 1-5 free text entries
  'input_what_scares_you',       // 4 - Input: fear per shadow
  'teach_root_emotions',         // 5 - Teach
  'input_label_shadows',         // 6 - Input: Shame/Guilt/Fear per shadow
  'teach_protective_archetypes', // 7 - Teach: 5 archetype cards from protectiveVoices.js
  'input_map_armour',            // 8 - Input: archetype per shadow
  'teach_heartbreaking_truth',   // 9 - Teach
  'input_suppressed_essence',    // 10 - Input: essence + blocker + archetype
  'teach_origin_story',          // 11 - Teach
  'input_timeline',              // 12 - Input: event + emotion + feelings
  'connect_the_dots',            // 13 - Auto-generated mirror moment (read-only)
  'complete'                     // 14 - Closing + save
]
```

**Progress dots:** 14 dots (excluding loading/time_check). Gold fill on completed, glow on active.

### Data Flow — The Shadows Array

Unique pattern: a shared `shadows` array gets enriched across 4 input steps.

```
Step 3:  shadows = [{ trait: "I hide how creative I am" }]
Step 4:  shadows = [{ trait: "...", fear: "People would think I'm weird" }]
Step 6:  shadows = [{ trait: "...", fear: "...", root_emotion: "shame" }]
Step 8:  shadows = [{ trait: "...", fear: "...", root_emotion: "...", archetype: "ghost" }]
```

Step 10 and 12 are separate objects:

```js
const initialState = {
  shadows: [],                    // steps 3 → 4 → 6 → 8
  suppressed_essence: {           // step 10
    trait: '',
    whats_stopping: '',
    archetype: ''
  },
  origin: {                       // step 12
    event: '',
    emotion: '',
    feelings: ''
  }
}
```

**Step 13 (Connect the Dots)** reads from all three to auto-generate:

> "This experience of **{origin.event}** made you feel **{origin.emotion}**. To protect yourself, you started hiding **{suppressed_essence.trait || shadows[0].trait}** and became the **{suppressed_essence.archetype || shadows[0].archetype}** instead."

### Saved Data (quest_completions.response_data)

```json
{
  "shadows": [
    {
      "trait": "I hide how much I care about fashion",
      "fear": "People would think I'm superficial",
      "root_emotion": "guilt",
      "archetype": "performer"
    }
  ],
  "suppressed_essence": {
    "trait": "I want to dress boldly and colourfully",
    "whats_stopping": "Fear of being judged as trying too hard",
    "archetype": "performer"
  },
  "origin": {
    "event": "Being teased about my rainbow clothes in school",
    "emotion": "embarrassment",
    "feelings": "I felt stupid and wanted to disappear"
  },
  "connect_the_dots": "This experience of being teased about my rainbow clothes made you feel embarrassment. To protect yourself, you started hiding your desire to dress boldly and became the Performer instead."
}
```

### Weekly Calendar Lock

Frequency: once per calendar week (Monday 00:00 to Sunday 23:59).

Check in `questCompletion.js`:
```js
// Get start of current week (Monday)
const now = new Date()
const day = now.getDay()
const diff = day === 0 ? 6 : day - 1  // Sunday = 6 days back, else day - 1
const monday = new Date(now)
monday.setDate(now.getDate() - diff)
monday.setHours(0, 0, 0, 0)

// Query: any completion this week?
const { data } = await supabase
  .from('quest_completions')
  .select('id')
  .eq('quest_id', 'recognise_shadow_work')
  .eq('user_id', userId)
  .gte('completed_at', monday.toISOString())
  .limit(1)
```

If completed this week:
- Quest card shows "Completed this week" with next Monday's date
- `/shadow-work` time_check screen shows "You completed this X days ago" + "View Last Session" option

### Auto-Save

Uses `useAutoSave('shadow-work', user?.id)` — saves `{ currentScreen, shadows, suppressed_essence, origin }` on every state change. Resume prompt on return (same pattern as HealingCompass).

---

## CSS Additions: `src/flows/ShadowWorkFlow.css`

Small file — only `.sw-` prefixed classes for shadow-specific elements:

- `.sw-shadow-card` — individual shadow trait card shown in steps 4/6/8 (displays the trait text + current annotations + new input)
- `.sw-shadow-card-trait` — the trait text label on each card
- `.sw-add-shadow-btn` — "Add another shadow" button in step 3
- `.sw-shadow-list` — container for the 1-5 shadow cards
- `.sw-mirror-text` — the auto-generated connect-the-dots sentence (step 13)

All other styling reuses `NervousSystemHealingCompass.css` classes directly.

---

## Quest Definition

Add to `public/challengeQuestsUpdate.json`:

```json
{
  "id": "recognise_shadow_work",
  "category": "Healing",
  "type": "Recognise",
  "frequency": "deepdive",
  "name": "Shadow Work Workshop",
  "description": "Discover the hidden parts of yourself and trace them to their origin",
  "points": 8,
  "inputType": "flow",
  "flow_id": "shadow_work",
  "flow_route": "/shadow-work",
  "learnMore": "Shadow work is the process of exploring parts of yourself you've suppressed — both traits you're ashamed of and authentic parts you've hidden to stay safe. By tracing these shadows back to their origin, you can begin to reclaim them. This flow takes about 15-20 minutes."
}
```

- 8 points (highest in healing — HealingCompass is 5, NervousSystem is 6)
- No prerequisites
- Weekly calendar lock handled in completion logic, not quest definition

---

## Zarlo Integration

In `src/lib/zarlo/zarloPageContent.js`, add shadow work data to context:

- Pull all completions from `quest_completions` where `quest_id = 'recognise_shadow_work'`
- Include: shadow traits, archetypes, root emotions, suppressed essence, origin story
- Enables coaching like: "I notice your Ghost tends to show up when you're facing visibility challenges..."

---

## Files Changed

| File | Change |
|------|--------|
| `src/flows/ShadowWorkFlow.jsx` | **New** — 14-screen flow component |
| `src/flows/ShadowWorkFlow.css` | **New** — small `.sw-` prefixed additions |
| `src/AppRouter.jsx` | Add lazy import + route `/shadow-work` under AuthGate |
| `public/challengeQuestsUpdate.json` | Add `recognise_shadow_work` quest definition |
| `src/lib/questCompletion.js` | Add weekly calendar check (Mon-Sun) for `recognise_shadow_work` |
| `src/lib/zarlo/zarloPageContent.js` | Add shadow work data to Zarlo context |

**Not changed:**
- `RecogniseQuestInput.jsx` — not needed, quest uses `inputType: "flow"` + `flow_route`
- `HealingSummary.jsx` — shadow work display deferred to future iteration
- No new DB migration — saves to existing `quest_completions.response_data` as JSON

---

## Implementation Order

1. **Quest definition** — add to `challengeQuestsUpdate.json`
2. **Route** — add to `AppRouter.jsx`
3. **Core component** — `ShadowWorkFlow.jsx` with all 14 screens
4. **CSS** — `ShadowWorkFlow.css` for `.sw-` additions
5. **Weekly lock** — add calendar check to `questCompletion.js`
6. **Zarlo** — add shadow data to `zarloPageContent.js`
7. **Test** — full flow walkthrough, weekly lock, auto-save resume, quest card display

---

## Teach Step Copy (from workshop)

### Step 1 — What Are Shadows?
> A shadow is any part of yourself you suppress. We suppress for two reasons:
> 1. Society or culture told us it's "wrong" or "bad"
> 2. It's a trait we've hidden because we've been hurt emotionally

### Step 2 — Shadows & Light
> Fun fact about shadows? They can't survive in the light. Throughout this flow, I'll invite you to bring yours into the light — by writing them down, you're already beginning.

### Step 5 — Root Emotions
> Almost all shadows stem from a fear of feeling one of three root emotions:
> - **Shame** — "Something is wrong with me"
> - **Guilt** — "I shouldn't be this way"
> - **Fear** — "If I express this, I'll lose safety"

### Step 7 — Protective Archetypes
> To avoid feeling those emotions, we adopt protective behaviours. These five archetypes are your armour:
> [Render 5 archetype cards from protectiveVoices.js with name, icon, lie, origin]

### Step 9 — The Heartbreaking Truth
> Sometimes authentic parts of ourselves become a shadow too. Think about yourself as a kid — things you used to love. Now imagine getting teased, made fun of, or rejected for those things. We suppress that authentic part to protect ourselves.

### Step 11 — Your Origin Story
> You didn't wake up today and decide to be this protective archetype. Something from the time you were a kid to today caused it to show up. Let's trace it back.

### Step 13 — Connect the Dots
> [Auto-generated from captured data — the "mirror moment"]

### Step 14 — What Now?
> Your shadows exist because parts of you were made to feel unaccepted. All shadows are actually authentic parts of you. Now that you've brought them into the light, the healing has already begun.

---

## Input Step Details

### Step 3 — Your Shadow Traits
- 1-5 free text entries
- Guided prompts below each input:
  - "What situations make you play smaller than you truly are?"
  - "Where in your life do you push, perform, or prove something?"
  - "Where do you avoid saying how you really feel?"
  - "What trait do you hide because you believe it won't be accepted?"
- "Add another" button (up to 5)
- Minimum 1 entry to continue

### Step 4 — What Scares You?
- For each shadow from step 3, show the trait text + free text input
- Prompt: "Take a moment to think about sharing this shadow with the world. What are you scared would happen?"
- Optional (can skip individual shadows)

### Step 6 — Label Your Shadows
- For each shadow, show trait text + 3-option selector: Shame / Guilt / Fear
- Uses `.hc-option-btn` grid (3-column)

### Step 8 — Map Your Armour
- For each shadow, show trait + root emotion + 5 archetype selector
- Uses `.ns-hc-contract-option` cards (same as HealingCompass protective pattern step)
- Pre-select user's known archetype from `lead_flow_profiles` if available

### Step 10 — Suppressed Essence
- Free text: "What's one authentic thing you'd love to do or experience but hold yourself back from?"
- Free text: "What's stopping you?"
- Archetype selector: "Instead of expressing it, which protective archetype do you become?"

### Step 12 — Timeline
- Free text: "Can you think of a time when you first embodied this archetype? What happened?"
- Emotion dropdown: Shame / Guilt / Fear / Embarrassment / Rejection / Loneliness
- Free text: "How did it make you feel?"

---

## Connections to Existing System

| System | Connection |
|--------|-----------|
| Protective Archetypes | Pulls existing archetype from `lead_flow_profiles`. Pre-selects in step 8. |
| Healing Compass | Origin story (step 12) deepens the "wound" from Healing Compass. Future: cross-reference in HealingSummary. |
| Nervous System | Safety contracts connect to shadow suppression patterns. |
| Groan Matrix | Future: shadows could generate courage challenges at matching visibility layers. |
| Flow Finder | Suppressed essence (step 10) may reveal uncaptured skills/passions. |
| Recognise quests | `recognise_protective_observe` gains deeper context from shadow work data. |

---

## Open for Future Iterations

- HealingSummary integration (display shadow work results)
- Groan Matrix auto-generation from shadow data
- Shadow inventory view (see all shadows across completions)
- Splinter ↔ Shadow cross-reference visualization
