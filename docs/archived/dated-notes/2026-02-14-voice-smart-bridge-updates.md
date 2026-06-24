# Voice Smart Bridge — Implementation Summary

**Date:** 2026-02-14
**Branch:** `feature/content-review`
**Plan:** `docs/plans/2026-02-13-voice-smart-bridge-implementation.md`

## What Changed

### Architecture: Unified Voice System

Merged `voice_taste_config` (content review corrections/brand words) and `voice_profiles` (voice training output) into a **single `voice_profiles` table**. The old `voice_taste_config` table has been dropped.

**New prompt hierarchy** (highest to lowest weight):
1. Voice influences (writers/creators the user admires)
2. Writing samples (few-shot examples — most practical weight)
3. Corrections (from resolved content review comments)
4. Voice rules (dos/donts, catchphrases, patterns)
5. Origin story (background context)
6. Sliders (sentence length, emoji, humor, formality, vulnerability — "Style Notes")

### Voice Training Flow — Reordered Steps

| Old Order | New Order |
|-----------|-----------|
| 1. Origin Story | **1. Writing Samples** (promoted — most valuable signal) |
| 2. Audience | **2. Influences** (brand new step with AI preview) |
| 3. Success Wins | **3. Origin Story** |
| 4. Difference | **4. Your People** (audience) |
| 5. Style Preferences | **5. Your Difference** |
| 6. Writing Samples | **6. Style Preferences** (sliders collapsed by default) |
| 7. Generation | **7. Generation** |

- **Step 3 (Success Wins) removed** — low signal, high friction
- **Step 2 (Influences) is new** — users name 1-3 writers/creators they admire, with AI-generated style preview ("That's the vibe" / "Not quite")
- **Templates now pre-fill** influences + preferences instead of saving directly to DB

### New Edge Function: `generate-influence-snippets`

- Calls Claude Haiku 4.5 to generate 2 short paragraphs in a named writer's style
- Used in Voice Training Step 2 for "Preview this style" feature
- JWT-authenticated

### Updated Edge Function: `voice-analyzer`

- Now includes voice influences in the analysis prompt
- Writing samples weighted as "most important data"
- AI analysis results stored in `detected_patterns` JSONB (traits, dos/donts, hookStyle, sample_output)
- `voice_name` set from AI-generated voiceType label
- Merges existing dos/donts (from content review corrections) instead of overwriting
- JWT-authenticated — uses `authUser.id` instead of client-provided userId

### Database Migration: `20260216000000_voice_smart_bridge.sql`

- Added columns: `corrections JSONB`, `voice_influences JSONB`, `audience_description TEXT`, `unique_approach TEXT`
- Migrated `voice_taste_config` data: `on_brand_words` → `detected_patterns.voice_dos`, `off_brand_words` → `detected_patterns.voice_donts`, `corrections` → `corrections`
- Updated `append_voice_correction()` trigger to write to `voice_profiles` (with admin_uid guard + RAISE WARNING)
- Dropped `voice_taste_config` table and its RLS policies

### VoiceDashboard (Content Review)

- Now reads from `voice_profiles` via `fetchVoiceProfileForDashboard()`
- Uses `supabase.auth.getUser()` instead of `admin_users` lookup (RLS fix)
- Shows: confidence indicator, voice summary, influence chips, corrections by category, on-brand words, collapsible prompt preview

### `buildVoiceInstructions()` (voiceProfile.js)

- Rewritten with new hierarchy (influences → samples → corrections → rules → sliders)
- Normalizes hook_styles across all variants (camelCase, snake_case, singular/plural)
- Limits: 5 samples × 2000 chars, 20 most recent corrections
- Origin story truncated only when > 200 chars

### VoiceRecorder (Speech-to-Text)

- Fixed stale closure bug — SpeechRecognition no longer recreated on every transcript update
- Uses refs for `existingText`, `onTranscript`, `isRecording` to maintain stable instance

### VoiceProfileCard

- Now reads AI analysis from `detected_patterns` for DB-loaded profiles (return visits)
- Falls back through `profile.voice_name` → `profile.voiceType` for voice type label

## Haiku Model Upgrade

Updated **all 19 edge functions** from Haiku 3.0/3.5 to **Haiku 4.5** (`claude-haiku-4-5-20251001`):

| Old Model | Files Updated |
|-----------|--------------|
| `claude-3-haiku-20240307` | 11 files (api/chat.js, aiHelper.js, anthropicClient.js, extract-nikigai-tags, generate-meta-skills, analyze-validation-responses, skill-recommendations, generate-cluster-label, classify-response, flow-analyze, flow-extract-tags) |
| `claude-3-5-haiku-20241022` | 8 files (nervous-system-mirror, content-generator, essence-hybrid-generator, implementation-coach, lead-magnet-ideas, niche-sharpener, groan-challenge-generator, product-positioning) |

## Files Changed

### Created
- `src/flows/VoiceTraining/components/Step1_Writing.jsx`
- `src/flows/VoiceTraining/components/Step2_Influences.jsx`
- `src/flows/VoiceTraining/components/Step3_Story.jsx`
- `src/flows/VoiceTraining/components/Step4_Audience.jsx`
- `src/flows/VoiceTraining/components/Step5_Difference.jsx`
- `src/flows/VoiceTraining/components/Step6_Style.jsx`
- `supabase/functions/generate-influence-snippets/index.ts`
- `supabase/migrations/20260216000000_voice_smart_bridge.sql`

### Modified
- `src/flows/VoiceTraining/index.jsx` — rewritten (new step order, template pre-fill, DEFAULT_VOICE_DATA)
- `src/flows/VoiceTraining/VoiceTraining.css` — influence card styles, suggestion hint styles
- `src/flows/VoiceTraining/components/VoiceTemplates.jsx` — synchronous pre-fill instead of async save
- `src/flows/VoiceTraining/components/VoiceProfileCard.jsx` — detected_patterns fallback
- `src/flows/VoiceTraining/components/VoiceRecorder.jsx` — stale closure fix
- `src/components/content-review/VoiceDashboard.jsx` — reads voice_profiles, confidence indicator
- `src/lib/voiceProfile.js` — buildVoiceInstructions rewrite, hook_styles normalization
- `src/lib/contentReviewService.js` — fetchVoiceProfileForDashboard (replaces fetchVoiceConfig)
- `src/lib/contentContext.js` — voice_influences in SELECT, removed success_story/client_wins
- `supabase/functions/voice-analyzer/index.ts` — detected_patterns mapping, auth, merge dos/donts
- 19 edge function files — Haiku model upgrade

### Deleted
- `src/flows/VoiceTraining/components/Step1_Origin.jsx`
- `src/flows/VoiceTraining/components/Step2_Audience.jsx`
- `src/flows/VoiceTraining/components/Step3_Wins.jsx`
- `src/flows/VoiceTraining/components/Step4_Difference.jsx`
- `src/flows/VoiceTraining/components/Step5_Preferences.jsx`
- `src/flows/VoiceTraining/components/Step6_Samples.jsx`

### Dropped
- `voice_taste_config` table (data migrated to `voice_profiles`)
