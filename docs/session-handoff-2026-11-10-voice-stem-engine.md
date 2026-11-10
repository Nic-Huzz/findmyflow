# Session Handoff: Voice Stem Engine + Essence Journey Workshop (2026-11-06 to 2026-11-10)

## What was done

### Voice Stem Engine (feat/voice-stems → merged to main)
- **`src/flows/VoiceStemFlow.jsx`** (~1400 lines) — standalone voice-first sentence completion flow at `/try/voice-stems`. 4 stages, 35 stems, MediaRecorder + Deepgram Nova-2 + Claude Haiku processing.
- **`src/flows/VoiceStemFlow.css`** (~1100 lines) — dark fullscreen UI, mobile-optimised with safe-area padding, 48px touch targets.
- **`src/hooks/useAudioRecorder.js`** — MediaRecorder hook with MIME detection (WebM/Opus for Chrome, MP4/AAC for Safari), silence auto-stop (5s), WKWebView detection.
- **`src/lib/deepgramClient.js`** — transcription proxy client (raw fetch with FormData to edge function).
- **`src/lib/stemProcessing.js`** — AI processing client (supabase.functions.invoke). Passes flat context fields for Stage 4.
- **`src/data/voiceStems.js`** — 35 stem definitions across 4 stages with dynamic text resolution.
- **`supabase/functions/transcribe/index.ts`** — Deepgram Nova-2 proxy. Config: `utt_split=0.3`, `paragraphs=true`, `smart_format=true`. File size guard (10MB), content-type validation.
- **`supabase/functions/process-stems/index.ts`** — Claude processing with stage-specific prompts. Stage 1: Level 4 recognition output. Stage 2: wound stage + NS archetype mapping. Stage 3: 5 unified dimension scoring. Stage 4: essence archetype matching from 12 archetypes.
- **`public/essence-journey-slides.html`** — 17-slide workshop deck, arrow key navigation, dark aesthetic.

### Essence Journey Workshop System (feat/essence-journey → merged to main)
- **`src/flows/JourneyContainer.jsx`** — dual-mode container (`/journey` solo, `/journey/:code` workshop) with checkpoint gates.
- **`src/flows/ChildhoodReflectionFlow.jsx`** — Stage 1 tap-based flow (pre-voice-stems, still exists).
- **`src/components/journey/`** — JoinScreen, CheckpointScreen, FacilitatorDashboard, WorkshopCreatePage.
- **`src/hooks/useWorkshopChannel.js`** — Supabase Realtime broadcast + presence hook.
- **`supabase/migrations/20261107000001_workshop_tables.sql`** — workshop_sessions + workshop_participants tables with RLS.
- `onComplete` prop added to 7 existing flows (WoundMap, EssenceMirror, ExperienceGame, ChooseQuests, VibeRiseRadar, AlivenessQuiz, ZoneCalRadar).
- AuthProvider anonymous user guard added.

### Edge Functions Deployed
- `transcribe` (Deepgram proxy) — deployed with `--no-verify-jwt`
- `process-stems` (Claude processing) — deployed with `--no-verify-jwt`
- `DEEPGRAM_API_KEY` set in Supabase secrets

### Supabase Changes
- 5 old edge functions deleted to make room: analyze-deal-screenshot, extract-story-from-image, ingest-content-draft, lead-magnet-ideas, implementation-coach.
- Workshop tables migration written but NOT applied (workshop system not tested live yet).
- Anonymous Sign-Ins and Manual Linking NOT enabled yet (needed for workshop join flow).

## Decisions made

1. **Voice-first replaces tap-based onboarding.** Spoken sentence completions bypass the cognitive editor better than form inputs. Validated by Nic's own test — Stage 4 archetype match (Playful Creator + Radiant Rebel) was "the exact answer I give myself." The me/not me card selection flow is no longer needed.

2. **6-Stage Circle collapsed to 6 from 8.** Party Nic + Corporate Nic merged into "Consequences" (two symptoms of same disease). The Moment merged into The Rave Guide as "The Breakthrough." 8 stages = autobiography/content. 6 stages = workshops/products/app.

3. **VibeRise Radar + Aliveness Quiz overlap.** 9 dimensions consolidated into 5 unified: Choice, Connection, Growth, Meaning, Safety. Each gets 2 stems in Stage 3 (10 total). Safety is the meta-dimension that gates the others. See `docs/vibe-rise-aliveness-overlap-analysis.md`.

4. **Stage 1 output = Level 4 recognition, not identity.** "You DID this" not "you ARE this." Prevents the CEO from performing to match an archetype label in later stages.

5. **Stage 2 maps to wound stages + NS archetype automatically.** AI extracts wound stage (home/school/friends), wound scene (The Chameleon, Good Student, etc.), and NS archetype (sympathetic/dorsal/ventral) from spoken content. No Pixar scene selection needed.

6. **Chameleon is the 6th protective voice.** Discovered during Nic's own test. Sits outside the 2x2 like People Pleaser. People Pleaser = "I'll do what you want." Chameleon = "I'll BE who you want." Identity-level conformity, not behaviour-level compliance. Not yet coded into the app.

7. **Haiku for all stages** (Sonnet 4 model unavailable via API). Quality was still good enough — nailed the archetype match.

8. **Save-as-you-go.** Transcripts save to localStorage + Supabase BEFORE AI processing. Prevents data loss on processing failure. Session data merges instead of overwriting.

9. **Workshop uses double-confirm gates** between stages instead of Realtime facilitator unlock. Simpler, no infrastructure risk. Participant taps Continue → "Ready? Tap to begin" → next stage starts.

10. **Workshop vs Onboarding = different endings, same Stages 1-4.** Workshop ends on The Dare or essence reveal. Onboarding ends on full Search (experiences + quests) + app handoff.

## In progress / next steps

### Immediate (for workshop in ~36 hours)
1. **Full end-to-end test on live URL.** Never done a complete run through all 4 stages on the deployed Vercel URL without skip/resume params. Critical before the workshop.
2. **Slide 5 needs actual URL + QR code.** Currently shows `/try/voice-stems` placeholder.
3. **Workshop close/ending.** TBD — The Dare, essence reveal, or just the avatar. Nic deciding.

### Next feature: Experience Game + Choose Quests (voice-first)
Designed but not coded. See `docs/essence-journey-voice-first-design.md` Stage 4 full version:
- **4a: Archetypes** — me/not me + "because..." (CEO detection). NOT needed — stem-based matching works.
- **4b: Experiences** — fun/not fun rapid fire on 80+ activities + "because..." on flagged hesitations.
- **4c: Paid filter** — paid/not paid on fun list.
- **4d: Choose Quests** — tap-based (existing ChooseQuestsFlow).
- **Stage 5: Courage Challenge** — TBD, challenge system being updated.

### Report Card Page
Designed but not coded. After final results: download AI prompt for ChatGPT/Claude memory, email results, share on socials.

### Obsidian updates needed
- Chameleon as 6th protective voice — needs framework doc.
- Nervous System Graph needs update to include Chameleon.

## Gotchas discovered

1. **Deepgram transcribes names wrong.** "Spiff" → "stiff" cascaded into a wrong Connection score (2/5 instead of 4/5). No fix in V1 — facilitator corrects on Zoom.

2. **Safari outputs MP4/AAC not WebM/Opus.** The `useAudioRecorder` hook detects MIME type at runtime. Deepgram accepts both. But the file extension in FormData must match (`.m4a` for Safari, `.webm` for Chrome). This is handled.

3. **`?skip=N` clears state if not careful.** Fixed — saved data loads before skip now. But if localStorage is empty and you skip, stages run with null context.

4. **Timer stacking bug on resume.** `startCountdownThenRecord` must clear existing intervals before creating new ones. Fixed — but any code that calls `beginStage` should ensure no existing recording is in progress.

5. **Sonnet model ID.** `claude-sonnet-4-6-20250514` does NOT exist. `claude-sonnet-4-20250514` also 404'd. Currently all stages use Haiku (`claude-haiku-4-5-20251001`). The Anthropic API key may not have Sonnet access, or the model ID format changed.

6. **`public_leads` table requires email NOT NULL.** Save-as-you-go uses placeholder `anon-{sessionId}@voice-stems.local` until real email provided. The email from the landing form is passed in all subsequent saves.

7. **MoneyMapFlow import on `feat/voice-stems` branch.** The branch was created from a commit that imported MoneyMapFlow but the file lived on another branch. Commented out. When merging branches, watch for this.

8. **Aliveness commits landed on voice-stems branch** from another session. They're intentional (AlivenessCheckin, alivenessEngine, PerQuestRadar update) and fully wired via ProgressTab. Not contamination — legitimate parallel work.

## Recommendations

1. **Do a full end-to-end test on the live Vercel URL NOW.** Clear localStorage, fresh run, all 4 stages + avatar. This is the single highest-risk item.

2. **Write a handoff spec for the experience game voice-first flow.** Give a fresh agent: the design doc (`docs/essence-journey-voice-first-design.md`), the voiceStems.js pattern, the process-stems edge function pattern, and the existing ExperienceGameFlow/ChooseQuestsFlow as reference. It's a separate build.

3. **Add the Chameleon to the protective voices** in the app data + Obsidian. It surfaced organically from the voice stems — it's real.

4. **Build the report card page** as a post-workshop follow-up. AI prompt download is the highest-value output — gives participants a way to carry their essence into every AI conversation.

## Key files for a fresh agent

| File | What it does |
|---|---|
| `src/flows/VoiceStemFlow.jsx` | The main voice stem flow (~1400 lines) |
| `src/flows/VoiceStemFlow.css` | All styles |
| `src/data/voiceStems.js` | 35 stem definitions |
| `src/hooks/useAudioRecorder.js` | Recording hook |
| `src/lib/deepgramClient.js` | Transcription client |
| `src/lib/stemProcessing.js` | AI processing client |
| `supabase/functions/transcribe/index.ts` | Deepgram proxy |
| `supabase/functions/process-stems/index.ts` | Claude processing (4 stage prompts) |
| `docs/essence-journey-voice-first-design.md` | Full voice-first design (all stages) |
| `docs/superpowers/specs/2026-11-09-voice-stem-engine-design.md` | Original prototype spec |
| `docs/8-stage-circle-x-fmf-flow-mapping.md` | How flows map to the 6-stage circle |
| `docs/vibe-rise-aliveness-overlap-analysis.md` | Why 9 dimensions became 5 |
| `Obsidian: Presentations/Essence Journey Workshop Presentation.md` | Workshop facilitation script |
| `Obsidian: Frameworks/Sentence Completion Stems - Essence Journey.md` | All stems + research |
| `Obsidian: Frameworks/Vocal Stem Exercise.md` | Neuroscience behind the mechanic |
