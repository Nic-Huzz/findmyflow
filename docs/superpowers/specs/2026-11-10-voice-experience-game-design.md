# Voice Experience Game + Choose Quests — Spec for Next Agent

**Date:** 2026-11-10
**Status:** Ready to build
**Repo:** FindMyFlow (`/Users/nichuzz/creations/Findmyflow`) on `main` branch
**Context:** `docs/session-handoff-2026-11-10-voice-stem-engine.md` — read this first for full session context
**Design:** `docs/essence-journey-voice-first-design.md` — the full voice-first journey design

---

## What exists (DO NOT TOUCH)

The voice stem prototype is live at `/try/voice-stems`. It has 4 stages working end-to-end:

- **Stage 1:** 6 stems about childhood essence → Level 4 recognition output
- **Stage 2:** 13 stems about suppression → wound stage + NS archetype mapping
- **Stage 3:** 10 stems about current life → 5-dimension radar
- **Stage 4:** 6 stems about identity → essence archetype reveal + avatar generation

All code lives in:
- `src/flows/VoiceStemFlow.jsx` (~1400 lines) — the main component
- `src/flows/VoiceStemFlow.css` (~1100 lines)
- `src/data/voiceStems.js` — stem definitions
- `src/hooks/useAudioRecorder.js` — recording hook
- `src/lib/deepgramClient.js` — transcription client
- `src/lib/stemProcessing.js` — AI processing client
- `supabase/functions/transcribe/index.ts` — Deepgram proxy
- `supabase/functions/process-stems/index.ts` — Claude processing

**DO NOT modify Stages 1-4.** They are tested and working. The experience game is a NEW addition that comes AFTER Stage 4, before the final results.

---

## What to build

Add Stage 5 (Experience Game) and Stage 6 (Choose Quests) to the existing VoiceStemFlow. The voice-first experience game replaces the tap-based `ExperienceGameFlow.jsx`.

### Stage 5a: Experience Discovery (voice — "fun / not fun")

**Mechanic:** Activity names read aloud (shown on screen as text), participant says "fun" or "not fun" instantly. ~3 seconds per activity. Pure speed, pure gut.

**Activities:** Use the existing experience list from `src/flows/ExperienceGameFlow.jsx`. The activities are organized by primal branches (Movement, Play, Bonds, Story, etc.). For the voice version, flatten the list — no branch grouping during the exercise, just rapid fire through all activities.

**Recording:** Each activity gets its OWN short recording (3 seconds, not 30). This is different from the stem mechanic. The participant sees the activity name, says "fun" or "not fun", recording stops, next activity appears.

**Alternative (simpler for V1):** Show activities in batches of 10. Record one continuous 30-second clip per batch where they say "fun, not fun, fun, fun, not fun..." in sequence. AI maps responses to activities by order. Less precise but uses the existing recording infrastructure.

**AI processing after all activities:** Send the transcript to Claude with the activity list. Claude maps each "fun"/"not fun" response to the corresponding activity. Returns: `{ fun: ["Dancing", "Climbing", ...], notFun: ["Accounting", ...], suppressed: [] }`.

**Suppressed detection (V2):** In a future version, detect hesitation (>500ms pause before "not fun") and flag those as potentially suppressed. For V1, just capture fun/not fun.

### Stage 5b: Paid Filter (voice — "paid / not paid")

**Mechanic:** Only show activities marked "fun" from Stage 5a. For each, participant says "yes" (could get paid) or "no" (just passion). Same rapid-fire format.

**AI processing:** Returns `{ passion: ["Dancing", ...], path: ["Workshop facilitation", ...] }`.

### Stage 6: Choose Quests (tap-based — existing flow)

**Mechanic:** Feed the fun + paid data into the existing `ChooseQuestsFlow.jsx`. This flow already accepts dome data and generates quest paths. The voice-captured data should map to the same data structures ChooseQuestsFlow expects.

**Integration point:** ChooseQuestsFlow reads from `useDomeData()` hook which queries `experience_dome_ratings` table. The voice experience game data needs to be saved to this same table so ChooseQuestsFlow works without modification.

---

## How to integrate into VoiceStemFlow

### State machine extension

Current flow:
```
landing → stage1 stems → results_1 → stage2 stems → results_2 → stage3 stems → results_3 → stage4 stems → essence_reveal → final_results → avatar
```

New flow:
```
... → essence_reveal → experience_game → paid_filter → choose_quests → final_results → avatar
```

The `essence_reveal` screen's "See your full journey" button currently goes to `final_results`. Change it to go to `experience_game`.

### New screens to add

| Screen | What it shows |
|---|---|
| `experience_game` | Rapid-fire activity names, "fun / not fun" recording |
| `experience_processing` | "Mapping your experiences..." |
| `experience_results` | Fun list with suppressed flags |
| `paid_filter` | Rapid-fire on fun list, "paid / not paid" |
| `paid_processing` | "Finding your paths..." |
| `choose_quests` | Existing ChooseQuestsFlow with onComplete |

### New data in voiceStems.js

The experience game doesn't use sentence stems. It uses a flat list of activities. Add a new export:

```js
export const EXPERIENCE_ACTIVITIES = [
  // Pull from ExperienceGameFlow.jsx's existing activity list
  // Flatten all branches into one array
  // Each: { id: 'dance_public', label: 'Dancing in public', branch: 'movement' }
]
```

### New AI processing

Add `stage: 5` and `stage: 6` handlers to `process-stems/index.ts`:

**Stage 5 prompt:** "Here's a transcript of someone saying 'fun' or 'not fun' for each activity in order. Map each response to the activity. Return JSON with fun/notFun/uncertain arrays."

**Stage 6 prompt:** "Here's a transcript of someone saying 'yes' or 'no' for each fun activity. Map each response. Return JSON with passion/path arrays."

### Data persistence

Save to `experience_dome_ratings` table so ChooseQuestsFlow works:
- fun + paid → `ns_state: 'vibe_rise'`, `want_paid: true`
- fun + not paid → `ns_state: 'fun'`, `want_paid: false`
- not fun → don't save (or `ns_state: 'bored'`)

This requires a Supabase user. For the public flow (no auth), save to localStorage and skip ChooseQuestsFlow. For the onboarding flow (with auth), save to the table.

---

## What NOT to do

1. **Don't modify Stages 1-4 code.** They work. Add new code after them.
2. **Don't refactor VoiceStemFlow.jsx.** It's 1400 lines and stable. Add to it, don't restructure it.
3. **Don't change the recording hook.** `useAudioRecorder` works for 30-second stems. For 3-second rapid-fire, you may need a different recording approach (or use the batch approach described above).
4. **Don't change the edge function prompts for Stages 1-4.** They're tuned and tested.
5. **Don't deploy without testing on localhost first.** The live URL auto-deploys from main.

---

## Recommended build order

1. **Add experience activity data** to `voiceStems.js`
2. **Add Stage 5 AI prompt** to `process-stems/index.ts` (+ deploy)
3. **Add experience_game screen** to VoiceStemFlow.jsx — simplest version first (batch recording, not per-activity)
4. **Add paid_filter screen**
5. **Wire into ChooseQuestsFlow** (if auth available) or just show results (if public)
6. **Test end-to-end**

---

## For the workshop (deadline: 2026-11-11)

The experience game is NOT needed for the workshop. The current 4-stage flow ending with the essence archetype reveal + avatar is a complete workshop experience. The experience game is for the ONBOARDING version where participants become app users.

Build this AFTER the workshop, not before.
