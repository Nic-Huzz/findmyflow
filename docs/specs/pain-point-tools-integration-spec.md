# Pain Point Tools Integration Spec

**Date:** 2026-09-26
**Source:** Mike Mandel Pain Point Index (Brain Software Podcast eps 230, 236, 253, 255, 257)
**Status:** Approved — ready to build

Three changes shipping in this batch. ADAC, Triple Warmer I AM Tapping, and Garbage Can Technique are deferred pending review.

---

## 1. Pattern Interrupt — Single Screen Rescript

### What it does
A single-screen rescript exercise that fires when a protective voice is identified. Augments the generic RegulationCard (box breathing, 5-4-3-2-1 senses) with a voice-specific cognitive rewire.

From Pain Point #10 (Negative Self-Talk / Low Self-Worth): rescript the voice with a positive declaration.

### Where it triggers

**Trigger A — After logging a stall (TuneTab.jsx)**
- Current flow: User selects category → note → state → voice → "Log Stall" → RegulationCard overlay
- New flow: Same, but when `stallVoice` is set, show PatternInterruptFlow FIRST (rescript the voice), then offer RegulationCard exercises below ("Want to ground your body too?")
- If no voice selected, fall back to existing RegulationCard only

**Trigger B — After courage challenge voice identification (GroanCompletionModal.jsx)**
- Current flow: gap_check step → user sees "Your body reacted more than expected. Which voice showed up?" → selects voice pill → Continue → pattern detection → expectation
- New flow: After voice pill selected, show PatternInterruptFlow inline below the voice pills. Continue button proceeds to pattern detection as before.

### UX — Single screen

**Header:** "Rewire it"

**Copy:** "I'm done with that. I choose to..."

**Tappable pills** (voice-specific, user taps one):
- Ghost → "...be seen"
- Perfectionist → "...start before I'm ready"
- People Pleaser → "...honour what I need"
- Controller → "...let go and trust"
- Auto-Pilot → "...show up fully"

**"Write your own" expander** → text input (max 100 chars), collapsed by default

**Button:** "Done" → save + haptic + 3 RP

**Stall flow only:** After Done, show "Want to ground your body too?" with existing RegulationCard exercises below (skippable).

### Data

**Stall trigger:** Save rescript text to `nervous_system_checkins.drain_note` field, appended with prefix `[rescript] `. No schema change needed.

**Courage trigger:** Save rescript text to `groan_challenges` row. Use existing `gap_voice` field for the voice, add rescript to the completion metadata (saved in handleCompleteReflection).

### New component

`src/components/PatternInterruptFlow.jsx`
- Props: `voice` (string id), `onComplete(rescriptText)`, `onSkip()`
- Single-screen component (no stepper)
- CSS prefix: `pif-`
- Renders inline (no overlay of its own — parent handles overlay/positioning)

### Files to modify

| File | Change |
|------|--------|
| `src/components/PatternInterruptFlow.jsx` | NEW — single-screen rescript component |
| `src/components/TuneTab.jsx` | Lines ~1304-1314: show PatternInterruptFlow above RegulationCard when stallVoice exists |
| `src/components/GroanCompletionModal.jsx` | Lines ~697-748: insert PatternInterruptFlow inline after voice pill selection |

### No DB migration needed

---

## 2. Breathwork Info Pop-up Update

### What it does
Updates the description text for the Morning Meditation/Breathwork practice so the info popup shows a specific recommendation instead of a vague instruction.

### Current text
> "Drop in, connect with your essence, build vagal tone. Try: breathe into the space behind your sternum. Feel it expand on the inhale."

### New text
> "We recommend meditating for at least 10 minutes or breathwork using the 7-11 breath (inhale for 7 counts, exhale for 11) to activate the rest-and-digest response."

### Files to modify

| File | Change |
|------|--------|
| `public/challengeQuestsUpdate.json` | Update `description` field for quest with id `reconnect_morning_meditation_breathwork` |

### No DB migration needed

---

## 3. Weekly Review — New You Protocol + Identity Reframe

### What it does
Adds a new section to the Weekly Review (Sun/Mon) that primes the user's next week with future-self visualisation and an identity-level declaration.

From Pain Point #11 (New You Protocol): meet the future version of yourself who already has the skill. Merge with them.
From Pain Point #7 (Identity-Level Reframe): "I am ___" beats "I'll try to ___".

### Current Weekly Review flow
1. Second Clock (aftertaste follow-up)
2. Protective Voice ("Did your voice win?")
3. Essence Honour ("How did you honour your essence?")
4. Life Fuel (per-path fuel check)
5. Dome Growth (comfort zone expansion)
6. Income (stage 8+)

### New flow (insert after Essence Honour, position 3.5)
1. Second Clock
2. Protective Voice
3. Essence Honour
4. **Next Week (NEW)**
5. Life Fuel
6. Dome Growth
7. Income

### UX — New section

**Section header:** 🔮 Next Week

**Part 1: New You Protocol**
- Copy: "Picture the version of you who already lives next week's focus. What are they doing? How do they carry themselves?"
- Textarea (max 200 chars)
- Placeholder: "I saw myself..."

**Part 2: Identity Reframe**
- Copy: "Now declare it. Not 'I'll try to...' but who are you?"
- Text input (max 100 chars)
- Pre-filled: "I am someone who "
- This is a declaration, not a goal

Both fields are optional (user can skip). The identity declaration does NOT auto-fill the Tune tab Weekly Focus — it primes the user's mindset. The Weekly Focus setup remains a separate action.

### Data

Two new nullable columns on `weekly_reviews`:

```sql
ALTER TABLE weekly_reviews ADD COLUMN new_you_vision text;
ALTER TABLE weekly_reviews ADD COLUMN identity_declaration text;
```

Saved in the existing `handleSubmit` alongside `compounding_text`, `identity_did`, etc.

### Files to modify

| File | Change |
|------|--------|
| `src/components/WeeklyReview.jsx` | Add new section after Essence Honour (after line ~499), two new state vars, include in handleSubmit insert |
| Supabase migration | Two nullable text columns on `weekly_reviews` |

---

## Implementation Order

1. **Breathwork info popup** — 5 min, one JSON field edit
2. **PatternInterruptFlow component** — new component, shared between both triggers
3. **Wire PatternInterruptFlow into TuneTab** — replace RegulationCard for stalls with voice
4. **Wire PatternInterruptFlow into GroanCompletionModal** — insert after voice pill
5. **Weekly Review migration** — add two columns
6. **Weekly Review UI** — new section with New You + Identity Reframe

---

## 4. ADAC — Post-Drain Guided Exercise

### What it does
A 4-step guided defusing exercise that fires after logging a drain. Removes the emotional charge from the trigger in ~5 minutes. Works in waking state, no trance needed.

From Pain Point #15 (Resentment/Unforgiveness): **A**cknowledge → **D**issociate → **A**nchor → **C**hange. Originally for resentment, but the technique generalises to any emotionally charged trigger.

### Where it triggers

**After logging a drain (TuneTab.jsx)**
- Current flow: User selects category → note → state (activated/shutdown) → "Log Drain" → RegulationCard overlay
- New flow: Same, but show ADACSflow FIRST above RegulationCard (same pattern as PI for stalls)
- Shows for EITHER state (activated or shutdown). No state-specific routing.
- Falls through to RegulationCard below ("Want to ground your body too?") using same divider pattern as PI

### UX — 4 steps (single overlay, step through)

**Step 1: Acknowledge**
- Header: "Name it"
- Copy: "What's the feeling right now? Don't judge it, just name it."
- Tappable pills: Angry, Frustrated, Hurt, Anxious, Drained, Resentful, Sad
- "Something else" expander → text input
- Button: "Next"

**Step 2: Dissociate**
- Header: "Step outside it"
- Copy: "Imagine floating up and watching yourself from across the room. See yourself sitting there with that feeling. You're safe up here, just watching."
- Button: "I can see it" (no forced delay — trust the user)

**Step 3: Anchor**
- Header: "Find your anchor"
- Copy: "Think of a time you felt completely calm and in control. Where were you? What could you see?"
- Textarea (max 100 chars), placeholder: "I was..."
- Button: "Got it"

**Step 4: Change**
- Header: "Bring it back"
- Copy: "Now float back down into yourself, but bring that calm feeling with you. The trigger is still there, but the charge is gone."
- Button: "Done" → save + haptic + 5 RP → then show RegulationCard below

### Data

Save ADAC completion to the drain's `nervous_system_checkins` row. Append to `drain_note` field:
```
[adac] feeling: {feeling}, anchor: {anchor_text}
```
Same pattern as Pattern Interrupt rescript save. No schema change needed.

Need to capture the drain's checkin ID (same approach as stall flow — add `.select('id').single()` to drain insert and store in `regulationCheckinId`).

### New component

`src/components/ADACFlow.jsx`
- Props: `onComplete(feelingText, anchorText)`, `onSkip()`
- 4-step stepper with internal state
- CSS prefix: `adac-`
- Renders inside the existing regulation overlay (no overlay of its own)

### Files to modify

| File | Change |
|------|--------|
| `src/components/ADACFlow.jsx` | NEW — 4-step guided flow |
| `src/components/ADACFlow.css` | NEW — styles |
| `src/components/TuneTab.jsx` | Drain save: add `.select('id').single()`, capture checkin ID. Regulation overlay: show ADACFlow above RegulationCard for drains (when `regulationCheckinId` set and checkin type is drain) |

### No DB migration needed

---

## 5. Triple Warmer I AM Tapping — Expression Practice

### What it does
Daily identity installation practice. User taps between 4th and 5th knuckle while saying personalised "I am" declarations. 2 minutes. Wires self-belief at neurological level.

From Pain Point #10 (Self-Worth): Triple Warmer meridian tapping installs identity-level beliefs.

### Where it lives

New daily practice in the **Expression** section of the Tune tab. Added to `challengeQuestsUpdate.json` as a new quest entry. Expression goes from 4 → 5 items (matches Safety at 5).

### How it works

Unlike a simple checkbox, tapping "Complete" opens a **guided micro-flow** that populates personalised declarations from the user's data:

1. **Essence archetype** — pulled from `lead_flow_profiles.custom_essence_name` or `.essence_archetype`
2. **Weekly focus** — pulled from this week's `quest_completions` where `response_data.quest_type = 'weekly_focus_setup'`
3. **Identity declaration** — pulled from latest `weekly_reviews.identity_declaration` (if set via the New You Protocol section we just built)

### UX — 2-screen guided flow

**Screen 1: Setup**
- Header: "I AM Tapping"
- Copy: "Tap gently between your ring and pinky finger knuckles while saying each statement out loud."
- Button: "Start"

**Screen 2: Declarations + Complete**
- All three "I am" statements displayed together, large text, stacked:
  1. "I am [essence archetype name]." (e.g. "I am The Alchemist.")
  2. "I am enough."
  3. "I am someone who [weekly focus / identity declaration]." (e.g. "I am someone who speaks up.")
- If no weekly focus set, 3rd statement is omitted (show only 2)
- Copy below: "Say each one out loud while tapping. Take your time."
- Self-paced. No auto-advance, no timer. User reads, puts phone down or props it up, taps and speaks, picks phone back up.
- Button: "Done" → mark practice complete + haptic + confetti + 5 RP

### Data

No new DB columns. Uses existing:
- `lead_flow_profiles` for essence archetype
- `quest_completions` for weekly focus
- `weekly_reviews` for identity declaration
- Completion saved as normal `quest_completions` row for the practice

### Quest JSON entry

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

### New component

`src/components/TripleWarmerFlow.jsx`
- Props: `userId`, `onComplete()`, `onClose()`
- Fetches essence + weekly focus + identity declaration on mount
- 2-screen flow (setup → declarations + done)
- CSS prefix: `twf-`
- Opens as modal overlay (same pattern as HealingCompletionModal)

### Files to modify

| File | Change |
|------|--------|
| `src/components/TripleWarmerFlow.jsx` | NEW — 3-screen guided flow |
| `src/components/TripleWarmerFlow.css` | NEW — styles |
| `src/components/TuneTab.jsx` | Add `inputType === 'guided'` handling in renderQuestRow to open TripleWarmerFlow (or generic guided flow handler). Add to DAILY_PRACTICE_IDS. |
| `public/challengeQuestsUpdate.json` | Add new quest entry for `practice_triple_warmer` |

### No DB migration needed

---

## 6. Garbage Can Technique — Safety Evening Practice

### What it does
Evening emotional hygiene ritual. Review the day's drains and stalls, defuse the bad (shrink → B&W → throw in can), amplify the good (enlarge → color → frame on wall). Prevents fear and negativity from accumulating overnight. 5 minutes.

From Pain Point #12 (Sleep Issues): Garbage Can Technique clears the emotional residue of the day before bed.

### Where it lives

New daily practice in the **Safety** section of the Tune tab. Safety goes from 5 → 6 items. This is the evening bookend to morning Meditation/Breathwork.

### How it works

Tapping "Complete" opens a guided flow that **surfaces the day's actual logged drains and stalls** from `nervous_system_checkins`. This is the killer feature — the app already has the data.

### UX — 3-screen guided flow

**Screen 1: Bad moments (throw them all away)**
- Header: "Clear the day"
- If user has logged drains/stalls today: show ALL as dismissable cards (category icon + note preview + state emoji)
- Copy: "Freeze-frame each one. Shrink it down, drain the color, throw it in the bin."
- User taps each card to dismiss it → card shrinks + desaturates + fades out (CSS animation)
- If no drains/stalls logged: show "Anything from today that's still sitting with you?" + textarea + single "Throw it away" button (same shrink animation on the text card)
- When all cards dismissed (or textarea processed): auto-advance to Screen 2
- Skip button for users with nothing to clear

**Screen 2: Good moments (frame it)**
- Header: "Keep the good"
- Copy: "Now think of one good moment from today. It can be small."
- Textarea (max 100 chars), placeholder: "The moment when..."
- Copy below: "Make it bigger. Brighter. Full color. Frame it."
- Button: "Framed"

**Screen 3: Complete**
- Copy: "Day cleared. Sleep well."
- Button: "Done" → mark practice complete + haptic + 4 RP

### Data

Save to `quest_completions.reflection_text` as JSON:
```json
{
  "quest_type": "garbage_can",
  "thrown_checkin_ids": ["uuid1", "uuid2"],
  "thrown_custom": "typed text if no drains logged" | null,
  "framed_moment": "the good moment text"
}
```

No new DB columns needed — uses existing `reflection_text` field.

### Surfacing today's drains/stalls

Query on mount:
```sql
SELECT id, checkin_type, source_quest_id, drain_note, after_state
FROM nervous_system_checkins
WHERE user_id = ? AND created_at >= today_start
ORDER BY created_at DESC
```

### Quest JSON entry

```json
{
  "id": "safety_garbage_can",
  "category": "Tune",
  "type": "Reconnect",
  "frequency": "daily",
  "name": "Clear the Day",
  "description": "Evening emotional hygiene. Shrink the bad moments, amplify the good ones. Clears the emotional residue so it doesn't accumulate overnight.",
  "points": 4,
  "inputType": "guided",
  "healing_checkin": false,
  "capacityType": "safety"
}
```

### New component

`src/components/GarbageCanFlow.jsx`
- Props: `userId`, `onComplete()`, `onClose()`
- Fetches today's drains/stalls on mount
- 3-screen stepper
- CSS prefix: `gcf-`
- Opens as modal overlay

### Files to modify

| File | Change |
|------|--------|
| `src/components/GarbageCanFlow.jsx` | NEW — 3-screen guided flow |
| `src/components/GarbageCanFlow.css` | NEW — styles |
| `src/components/TuneTab.jsx` | Add `inputType === 'guided'` handling (shared with Triple Warmer). Add to DAILY_PRACTICE_IDS. |
| `public/challengeQuestsUpdate.json` | Add new quest entry for `safety_garbage_can` |

### No DB migration needed

---

## Updated Implementation Order

**Batch 1 (DONE):**
1. ~~Breathwork info popup~~ ✅
2. ~~PatternInterruptFlow component~~ ✅
3. ~~Wire PI into TuneTab (stalls)~~ ✅
4. ~~Wire PI into GroanCompletionModal (courage)~~ ✅
5. ~~Weekly Review migration~~ ✅
6. ~~Weekly Review New You + Identity Reframe~~ ✅

**Batch 2 (next):**
7. **ADACFlow component** — 4-step guided defusing flow
8. **Wire ADAC into TuneTab drain flow** — capture drain checkin ID, show above RegulationCard
9. **TripleWarmerFlow component** — 3-screen identity installation
10. **Add `inputType === 'guided'` handler to TuneTab** — opens guided flow modal on tap (shared pattern for Triple Warmer + Garbage Can)
11. **Add Triple Warmer to challengeQuestsUpdate.json + DAILY_PRACTICE_IDS**
12. **GarbageCanFlow component** — 3-screen evening ritual with drain surfacing
13. **Add Garbage Can to challengeQuestsUpdate.json + DAILY_PRACTICE_IDS**
