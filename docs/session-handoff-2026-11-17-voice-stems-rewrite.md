# Session Handoff: Voice Stems Rewrite + Onboarding Streamline (Nov 16-21, 2026)

## What was done

### ExperienceGameLive rewrite (`src/components/ExperienceGameLive.jsx`)
- Rewrote from useEffect state machine to simple async for-loop
- Mic opens once, records 1.5s clips, pipelines recording + transcription
- Listens until "fun"/"not fun" detected (no fixed timer)
- Tap buttons (Fun / Not fun + "Not tried") always visible as fallback
- Back button to re-answer previous activity
- Per-run cancellation token (StrictMode safe)
- Classifier fix: "done"/"one"/"run" now correctly map to fun
- Queued action ref: taps during transcription are stored and picked up next iteration
- Supports `mode="paid"` for paid filter (Yes/No buttons, Path!/Hobby flash)

### Experience activities (`src/data/voiceStems.js`)
- Expanded from 30 to 105, then merged overlapping nodes down to 87
- Merges: martial arts (3→1), dancing (3→1), food (3→1), cooking/baking (2→1), style/clothing (4→1), fire (4→1), plant medicine (3→1), meditation/breathwork (3→1), rest/sleep (3→1)
- 3 missing nodes added to `CORE_NODE_IDS` in `src/lib/experienceDomeConfig.js` (sub-combustion-2019, sub-meditation-1950, sub-nap-2019)

### Category voice stems (workshop only)
- 4 category stems added at STAGES[4] with 60s timer (sc_1 through sc_4)
- Stage 7 prompt in `supabase/functions/process-stems/index.ts` with empty-response fallback
- CategoryReveal + NudgeCards components in VoiceStemFlow.jsx
- Category intro screen before stems
- Onboarding skips category (goes straight from avatar to experience game)

### ChooseQuestsFlow bolted into onboarding (`src/flows/ChooseQuestsFlow.jsx`)
- Renders inside VoiceStemFlow via `onComplete` prop after signup gate
- Fixed-position wrapper prevents dark background bleed
- When no paid data exists (onboarding), all fun activities show as one list (no path/passion split)

### Supabase fixes
- `saveToSupabase` uses raw fetch with anon key (not shared auth client) — prevents 401 from stale JWT
- Upserts on email (not id) to handle unique constraint
- RLS policies added: SELECT + UPDATE on `public_leads` for anon
- `generate-avatar-gemini` edge function accepts anon key for onboarding flow
- `stemProcessing.js` updated to spread context (`{ stage, transcripts, ...context }`)

### Bug fixes
- Ripple bug: `startCountdownThenRecord` moved out of `setPosition` updater, uses `positionRef`
- Pause/resume: "Pause" button on countdown + stem screens, overlay with Resume + Start over
- Selection bridge: tap highlights, separate Continue button (no auto-advance)
- Stage 1 `essenceSummary` field: AI returns broader context, used in Stage 2 stems instead of poetic label
- `handlePause` clears `currentStemIdRef` to prevent partial blob transcription
- Session restore: completed + no categoryResults routes to category_intro (workshop) or experience_intro (onboarding)

### Flow routing (current state)
**Onboarding** (`/try/onboarding`):
Landing (no email gate) → Stages 1-3 stems → Stage 3 results → Processing (archetype) → Essence Reveal → Avatar → Experience Game (87 activities) → Signup → Choose Quests → Download App

**Workshop** (`/try/voice-stems`):
Landing (name + email) → Stages 1-3 stems → Stage 3 results → Processing (archetype) → Essence Reveal → Avatar → Category Intro → Category Stems (4, 60s) → Category Reveal → Nudges → Final Results

## Decisions made

1. **Stage 1 answers for archetype generation** — Tested with dad's data. Stage 1 childhood memories produce more authentic archetypes than Stage 4 abstract self-reflection. "Playful Creator / Joy Alchemist" vs "Truth-Teller / Honest Heart". Stage 4 stems will be removed. Plan at `docs/superpowers/plans/2026-11-21-stage1-archetype.md`.

2. **Paid filter removed from onboarding** — "Would you want to get paid for this?" puts people in a limiting mindset. Choose Quests handles path selection better. Paid filter stays in workshop mode.

3. **Category stems in workshop only** — Too advanced for onboarding, users need facilitator context. Kept for workshop where Huzz can frame it.

4. **87 activities (merged from 105)** — Martial arts, dancing, food, style, fire, plant medicine, meditation, rest merged into single nodes. Sub-nodes stay in full dome for deeper exploration.

5. **Tap buttons always visible** — Voice is primary input, tap is fallback. "Not tried" button for activities people haven't experienced.

6. **Choose Quests in onboarding, not in-app** — The app is for daily maintenance, not guided flows. Quest setup happens in onboarding so app opens ready to play.

7. **Dome ratings use `want_paid: null` for onboarding** — No paid filter means no paid data. `ChooseQuestsFlow` detects empty `wantPaidStates` and shows all fun activities as one list.

## In progress / next steps

**IMMEDIATE — Stage 1 archetype plan (not yet executed):**
Plan at `docs/superpowers/plans/2026-11-21-stage1-archetype.md`. Key changes:

1. **Generate archetype from Stage 1 answers** — Use Stage 1 transcripts (childhood memories) for archetype AI instead of Stage 4 abstract stems. Tested: produces "Playful Creator / Joy Alchemist" vs "Truth-Teller / Honest Heart". Far more resonant.

2. **Update Stage 1 results page** — Show primary + secondary archetype + custom blend name + essence + mirror on the Stage 1 results screen (in addition to existing energy + patterns). This is now the identity reveal moment.

3. **Rewrite Stage 2 stem s2a_2** — Currently "When I think about doing {selectedExpression}..." which is confusing (dad's feedback). `selectedExpression` is auto-set from `essenceSummary`. Needs clearer framing now that the user has seen their archetype.

4. **Remove Stage 4 stems entirely** — The 6 "Search" stems (s4_1-s4_6) are no longer needed. Category stems shift from STAGES[4] to STAGES[3]. All stageIndex references need updating.

5. **Move path definition into onboarding** — After choose-quests, before download. Currently path definition (dimensions, fuels, fears, identity declarations, commitment) is a separate in-app flow at `/path-definition/:questId`. Bolt it into onboarding so the app opens fully configured. The app becomes pure daily maintenance with zero guided flows.

6. **Move avatar creation to end of flow** — Avatar comes AFTER path definition as the grand finale. The user has their archetype, their quests, their path definitions, then they create their Pixar selfie as the closing moment. Flow ends on a high.

**Target onboarding flow:**
Landing → Stages 1-3 stems → Archetype reveal (from Stage 1) → Experience Game → Signup → Choose Quests → Path Definition → Avatar Creation → Download App

**DEFERRED:**
- Obsidian presentation notes out of date (Essence Journey Workshop + Onboarding)
- `essenceSummary` field in Stage 1 AI prompt deployed but untested in production
- Ripple bug fix untested in production
- Tap queue fix untested in production

## Gotchas discovered

1. **Supabase upserts need SELECT + INSERT + UPDATE RLS policies** — PostgREST checks SELECT before UPDATE on conflict resolution. Missing SELECT policy causes 401 (not 403).

2. **Supabase REST API returns 401 for RLS violations** (not 403) when using anon key. The error body says "row-level security policy" but the HTTP status is 401.

3. **`public_leads` has UNIQUE on both `id` AND `email`** — Upsert on `id` can 409 if same email exists with different id. Must upsert on `email`.

4. **Shared `supabase` client uses stale JWT** — If a user was previously authenticated and their refresh token expired, ALL requests 401. Public lead capture must use raw fetch with anon key, never the shared client.

5. **`positionRef.current` is stale when `beginStage` calls `startCountdownThenRecord`** — Position state hasn't committed yet. Use `stemId.startsWith('sc_')` to detect category stems, not `positionRef.current.stageIndex`.

6. **React 18 StrictMode + per-run cancellation** — Shared refs between mounts cause parallel runs. Use a local `token` object per useEffect run, not a shared ref.

7. **1.5s audio clips are borderline for Deepgram** — "fun" (0.3s plosive) often returns empty. "yes"/"no" are more reliable. Tap buttons are essential fallback.

8. **ChooseQuestsFlow embedded in dark theme needs fixed-position wrapper** — `.cqf` has light background, `.vs` has dark. Without a full-viewport wrapper with `z-index: 10`, dark bleeds through on scroll.

## Two Modes, One Component — How /onboarding and /voice-stems Work

Both routes render `VoiceStemFlow` with a different `mode` prop:
- `/try/onboarding` → `<VoiceStemFlow mode="onboarding" />`
- `/try/voice-stems` → `<VoiceStemFlow mode="workshop" />`

`const isOnboarding = mode === 'onboarding'` controls all branching.

### What they share
- Same `VoiceStemFlow.jsx` component (2200+ lines)
- Same voice stem recording pipeline (useAudioRecorder → countdown → record → transcribe → process)
- Same Stages 1-3 (essence, suppressed, consequences)
- Same archetype processing (will use Stage 1 answers for both)
- Same essence reveal + blend name
- Same `saveSession()` → localStorage + Supabase `public_leads`
- Same pause/resume/back controls

### Where they diverge (updated Nov 22)

| Feature | Onboarding | Workshop |
|---|---|---|
| Landing page | No name/email gate, just "Begin" | Name + email required |
| Landing pills | Stages 1-3 + Experience Game | Stages 1-4 (includes Category) |
| Archetype | Generated from Stage 1 transcripts, shown on separate reveal screen | Same |
| After Stage 3 | → Experience Game (87 activities) | → Category Intro (4 stems, 60s) |
| Category stems | Skipped | 4 stems → CategoryReveal → NudgeCards |
| Paid filter | Skipped (limiting mindset) | Available via experience_results screen |
| After experience game | → Signup gate | → experience_results (shows fun list) |
| After signup | → Choose Quests → Path Def (pick 1) → Avatar → Download | → Download App |
| After nudges (workshop) | N/A | → Avatar → Final Results |
| Choose Quests | Embedded (ChooseQuestsFlow with onComplete prop) | Not included |
| Path Definition | Embedded (pick 1 quest, rest via in-app banner) | Not included |
| Avatar | At end (after path def / after nudges) | At end (after nudges) |
| Dome ratings `want_paid` | Written as `null` (no paid data) | Written as `true`/`false` if paid filter used |
| Session restore | Checks `archetype_generated` / `avatar_generated` flags | Same |

### Key routing code (search terms for the next agent)
- `isOnboarding ? 'experience_intro' : 'category_intro'` — avatar onSkip (line ~2176)
- `isOnboarding ? 'signup_gate' : 'experience_results'` — exp_live onComplete (line ~2014)
- `isOnboarding ? 'choose_quests' : 'download_app'` — handleSignupComplete (lines ~1715, ~1750)
- Stage pills: `isOnboarding ? [Experience Game] : [Category]` (line ~1785)

### Data flow for onboarding (what gets saved where)
1. **During flow:** `saveSession()` → localStorage (`voice_stems_session` key) + Supabase `public_leads` (upserted on email, raw fetch with anon key)
2. **After signup:** `handleSignupComplete` → `experience_dome_ratings` table (fun=fun, notFun=bored, want_paid=null)
3. **During choose-quests:** `ChooseQuestsFlow` → `quests` table + `quest_tasks` table (via existing flow)
4. **Path definition (TODO):** Would write to `quests` table (dimensions, fuels, fears, identity declarations)
5. **Avatar:** `generate-avatar-gemini` edge function → Supabase storage `deal-screenshots/{userId}/`

### Why the target flow order matters
```
Stages 1-3 → Archetype reveal → Experience Game → Signup → Choose Quests → Path Definition → Avatar → Download
```

- **Stages 1-3 first:** Discover who you were, what happened, and the cost. This is the emotional foundation.
- **Archetype reveal after Stage 1 (planned):** Currently after Stage 3. Moving it up because the archetype is generated from Stage 1 answers anyway. User gets their identity early. Stages 2-3 then show "here's what happened to that person."
- **Experience Game before signup:** Low commitment, fun, fast. Gets dome ratings without asking for an account.
- **Signup gate:** Only asked AFTER they've invested ~20 min and have results worth saving.
- **Choose Quests after signup:** Needs auth (writes to quests table). User picks life paths from their fun activities.
- **Path Definition after quests:** Deeper commitment per quest — dimensions, fears, identity declaration. Sets up the game.
- **Avatar LAST:** The grand finale. Pixar selfie as the closing celebration. User screenshots and shares. Emotional high note.

### Edge function mapping (confusing, document it)
| Edge fn stage | What it does | Called from |
|---|---|---|
| 1 | Stage 1 essence themes | triggerProcessing stageIndex 0 |
| 2 | Stage 2 prediction + source | triggerProcessing stageIndex 1 |
| 3 | Stage 3 dimension scoring | triggerProcessing stageIndex 2 |
| 4 | Archetype matching | Currently triggerProcessing stageIndex 3, moving to processArchetypeFromStage1 |
| 5 | (DEAD) Old batch experience game | Not called |
| 6 | (DEAD) Old batch paid filter | Not called |
| 7 | Category synthesis | triggerProcessing stageIndex 3 (was 4, shifted after archetype removal) |

## Recommendations

1. **Execute the Stage 1 archetype plan first** — It's the highest-impact change. Users get their identity in the first 5 minutes instead of after 25 minutes. Plan is written and ready.

2. **Test the full onboarding flow end-to-end before the next workshop** — Several fixes shipped but only partially tested (ripple, tap queue, essenceSummary). A full run-through on the live URL would catch remaining issues.

3. **Consider making the experience game tap-only (no voice)** — Voice adds ~1s latency per activity and fails on short words. With 87 activities, tap-only would take ~2 min vs ~3-4 min with voice. The voice is valuable for stages 1-3 (bypasses CEO) but less so for fun/not-fun binary.
