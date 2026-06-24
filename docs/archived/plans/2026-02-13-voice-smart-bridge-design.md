# Voice Smart Bridge — Design Doc

**Date:** 2026-02-13
**Status:** Approved
**Goal:** Unify the two disconnected voice systems, flip the prompt hierarchy so samples and corrections lead over sliders, add influence blend bootstrapping, and rewrite the prompt builder to produce output that actually sounds like the user.

---

## Problem Statement

Two voice systems exist that don't talk to each other:

1. **`voice_profiles` + VoiceTraining flow** — 7-step voice training, 6 celebrity-inspired templates, DNA extraction, feedback loop. Fully wired into Content Generator.
2. **`voice_taste_config` + content-review Voice tab** — corrections log, on/off-brand words, auto-learning trigger. Orphaned — not connected to generation.

The prompt builder (`buildVoiceInstructions()` in `voiceProfile.js:338`) is the real bottleneck:
- Uses **one** writing sample truncated to **300 characters** (line 420-425)
- Sliders get 5 lines of description; the richest data gets nearly thrown away
- No code path for influence blends or corrections from content-review
- Hierarchy is inverted: sliders lead, examples trail

## Design Principles

1. **Examples over abstractions** — real writing samples in prompts beat any amount of slider descriptions
2. **Voice Profile is the single source of truth** — `voice_taste_config` retires
3. **Corrections compound over time** — zero corrections at launch is fine; the system gets smarter naturally
4. **Influence blend bootstraps** — "write like X meets Y meets Z" using Claude's knowledge of famous writers
5. **Analysis is good enough** — the `voice-analyzer` edge function doesn't need a rewrite; the prompt builder does

## Voice Fidelity Hierarchy

| Layer | Signal | Weight in Prompt | Status |
|-------|--------|-----------------|--------|
| 1 | User's own writing samples | Highest — all samples, full text | Built but under-used (1 sample, 300 chars) |
| 2 | Correction pairs ("not this → this") | High — concrete examples | Built in voice_taste_config, not wired to prompts |
| 3 | Influence blend ("X meets Y meets Z") | Good bootstrap | **New** |
| 4 | Explicit rules (dos/donts/brand words) | Medium | Built |
| 5 | Sliders (formality, humor, emoji) | Lowest — optional fine-tuning | Built but overweighted |

---

## Data Model Changes

### voice_profiles table — add columns

```sql
ALTER TABLE voice_profiles
  ADD COLUMN IF NOT EXISTS corrections JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS voice_influences JSONB DEFAULT '[]';
```

**corrections** — array of `{original, corrected, category, rule_learned, created_at}` (same schema as voice_taste_config.corrections)

**voice_influences** — array of `{name, description, snippets}`:
```json
[
  {
    "name": "Alex Hormozi",
    "description": "Direct, no-BS, makes complex business simple, short punchy sentences",
    "snippets": ["AI-generated representative excerpt 1", "excerpt 2"]
  }
]
```

### Trigger update

Update `trg_content_comment_resolved` to write corrections to `voice_profiles` instead of `voice_taste_config`:

```sql
-- Phase 1: Huzz only (target the admin user's voice profile)
CREATE OR REPLACE FUNCTION append_voice_correction()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'resolved' AND NEW.resolved_text IS NOT NULL AND OLD.status != 'resolved' THEN
    UPDATE voice_profiles
    SET corrections = COALESCE(corrections, '[]'::jsonb) || jsonb_build_array(jsonb_build_object(
      'original', NEW.highlighted_text,
      'corrected', NEW.resolved_text,
      'rule_learned', COALESCE(NEW.comment, NEW.quick_reaction),
      'category', NEW.category,
      'created_at', now()::text
    )),
    updated_at = now()
    WHERE user_id = (SELECT user_id FROM admin_users WHERE role = 'admin' LIMIT 1);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Migrate voice_taste_config seed data

```sql
-- Move on_brand_words into voice_profiles.detected_patterns.voice_dos
-- Move off_brand_words into voice_profiles.detected_patterns.voice_donts
-- Move any corrections into voice_profiles.corrections
-- Then drop voice_taste_config
```

### Drop voice_taste_config

After migration confirmed, drop the table, trigger, and remove service functions (`fetchVoiceConfig`, `updateVoiceConfig` from `contentReviewService.js`).

---

## Prompt Builder Rewrite

### buildEnhancedVoiceInstructions() — new structure

Replace the current implementation in `voiceProfile.js:338-671` with a new hierarchy:

```
## Voice Identity
You are writing as [user]. Their voice is a blend of:
- [Influence 1]: [user's description of what they like]
- [Influence 2]: [user's description]
- [Influence 3]: [user's description]

## How They Actually Write (Study These Carefully)
Match the energy, sentence structure, vocabulary, and personality
of these real writing samples:

---
[Sample 1 — full text, not truncated]
---
[Sample 2 — full text]
---
[Sample 3 — full text]
---
[...up to 5 samples, ~2000 chars each max]

## Voice Corrections (Do This, Not That)
The user has explicitly corrected these patterns:
- Don't say "[original]" → say "[corrected]" ([category])
[...up to 20 most recent corrections]

## Voice Rules
DO:
[• dos list from detected_patterns + voice_analyzer output]

DON'T:
[• donts list]

Catchphrases to weave in naturally: [list]

## Style Notes (Fine-Tuning)
[Only included if user manually adjusted sliders from defaults]
Sentence length preference: [short/medium/long]
Emoji usage: [description]
Formality: [description]
```

### Key changes from current:
- **All samples included, not one** — up to 5 samples, 2000 chars each (10x more voice data)
- **Influence blend leads** — sets the overall direction before examples refine it
- **Corrections are concrete** — "don't say X, say Y" with actual text from content review
- **Sliders are last** — only included if user explicitly adjusted them, not as primary signal
- **No origin story truncation** — background context stays but doesn't compete with samples

### Token budget consideration

With 5 samples × 2000 chars + influences + corrections, the voice section could be ~12,000 chars (~3,000 tokens). The content-generator edge function already budgets for context. Monitor token usage and add a smart truncation strategy if needed (prioritize newest/most representative samples).

---

## VoiceTraining Flow — Reordered Steps

### New step order

| Step | Title | What | Changes |
|------|-------|------|---------|
| 1 | **Your Writing** | Paste 3-5 pieces of content. Prompt: "Include at least one casual piece (social post, text, email) — that's where your real voice lives." | **Promoted from step 6.** Min 1 sample (100+ chars), max 5 (2000 chars each). |
| 2 | **Your Influences** | Name up to 3 writers/creators. For each: Claude generates 2-3 representative snippets. User confirms "yes that's the vibe" or edits description. | **New step.** |
| 3 | Your Story | Origin story | Kept as-is |
| 4 | Your People | Audience description | Kept as-is |
| 5 | Your Difference | Unique approach | Kept as-is |
| 6 | Your Style | Sliders | **Demoted.** Collapsed by default. Auto-populated from samples + influences. "Fine-tune if needed." |
| 7 | Voice Generation | AI analysis + save | Kept — but prompt rebuilt around new hierarchy |

### Step 2: Your Influences — detail

```
┌─────────────────────────────────────────────┐
│  Who inspires your voice?                   │
│                                             │
│  Name up to 3 writers, creators, or brands  │
│  whose communication style you admire.      │
│                                             │
│  ┌─ Influence 1 ──────────────────────────┐ │
│  │ Name: [Alex Hormozi              ]     │ │
│  │ What you like: [Direct, no-BS,    ]    │ │
│  │ [makes complex business simple    ]    │ │
│  │                                        │ │
│  │ ┌── AI-Generated Snippets ──────────┐  │ │
│  │ │ "Stop overthinking your offer.    │  │ │
│  │ │  Here's the math: if you can't   │  │ │
│  │ │  explain your value in one        │  │ │
│  │ │  sentence, you don't have one."   │  │ │
│  │ │                                   │  │ │
│  │ │  [✓ That's the vibe]  [✗ Not quite] │ │
│  │ └───────────────────────────────────┘  │ │
│  └────────────────────────────────────────┘ │
│                                             │
│  [+ Add another influence]                  │
└─────────────────────────────────────────────┘
```

When user types a name and description, call Claude (via edge function or inline) to generate 2-3 representative paragraphs. User confirms or adjusts. Confirmed snippets are stored in `voice_influences[].snippets` and can optionally be used as supplementary few-shot examples in prompts.

### Template presets

Templates become influence presets instead of standalone profiles:

```javascript
// "Bold Challenger" template pre-fills:
{
  voice_influences: [
    { name: "Alex Hormozi", description: "Direct, confrontational, no-fluff business advice" },
    { name: "Gary Vee", description: "Hustle energy, short punchy sentences, calls to action" }
  ],
  // Sliders pre-set from template
  preferences: { sentenceLength: 25, emojiUsage: 30, ... }
}
// User still goes through steps 1 (add own samples) and 3-5
```

---

## Content Review Voice Tab — DNA Dashboard

Replace `VoiceDashboard.jsx` to read from `voice_profiles` instead of `voice_taste_config`.

### Layout (top to bottom)

1. **Voice Summary Card**
   - Voice name + summary from profile
   - Influence chips: writer names as pills
   - Confidence indicator:
     | Data Available | Label |
     |---|---|
     | Template only | "Getting started" |
     | + Influences confirmed | "Warming up" |
     | + 3+ writing samples | "Learning your voice" |
     | + 10+ corrections | "Dialed in" |
     | + 25+ corrections | "Your voice twin" |

2. **"How AI Writes For You"** (collapsible, default closed)
   - Shows the assembled voice instructions that get sent to Claude
   - Toggle: "See what AI sees"

3. **Corrections Feed** (migrated from current Voice tab)
   - "original" → "corrected" with category badge
   - Sourced from `voice_profiles.corrections`
   - Category counts + total

4. **Brand Words**
   - On-brand (green chips) / Off-brand (red chips)
   - Sourced from `voice_profiles.detected_patterns.voice_dos` / `voice_donts`

5. **Writing Samples**
   - Count + truncated previews
   - Shows how many samples the profile is trained on

6. **"Edit Voice Profile"** button → navigates to `/voice-training`

No editing on this page. Dashboard only.

---

## Edge Functions

### voice-analyzer — updates

The `voice-analyzer` edge function receives `voiceData` which will now include:
- `contentSamples` (promoted to step 1, more likely to have data)
- `voiceInfluences` (new — array of {name, description, snippets})
- Everything else as before

The analysis prompt should weight samples more heavily and incorporate influence context. The output schema stays the same — `voiceType`, `summary`, `traits`, `patterns`, `doAndDont`, `sampleOutput`.

### New: generate-influence-snippets (lightweight)

Small edge function or inline Claude call for Step 2:
- Input: `{name: "Alex Hormozi", description: "direct, no-BS..."}`
- Output: `{snippets: ["paragraph 1", "paragraph 2"]}`
- Uses Haiku for speed/cost (this is a quick generation, not deep analysis)

### extract-voice-dna — keep but don't change

This function still works as a standalone tool. It's not broken, just not used in the VoiceTraining flow. Leave it for potential future use (e.g., bulk content import analysis). No changes needed.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/lib/voiceProfile.js` | Rewrite `buildVoiceInstructions()` and `buildEnhancedVoiceInstructions()` with new hierarchy. Add influence and corrections to prompt output. |
| `src/lib/contentReviewService.js` | Remove `fetchVoiceConfig()` and `updateVoiceConfig()`. Add `fetchVoiceProfileForDashboard()` that reads from `voice_profiles`. |
| `src/components/content-review/VoiceDashboard.jsx` | Rewrite to read from `voice_profiles` via new service function. New layout with summary card, corrections feed, confidence indicator, prompt preview. |
| `src/flows/VoiceTraining/index.jsx` | Reorder steps: Writing(1) → Influences(2) → Story(3) → People(4) → Difference(5) → Style(6) → Generation(7). Update stage order arrays and labels. |
| `src/flows/VoiceTraining/components/Step6_Samples.jsx` | Rename to Step1_Writing.jsx. Update copy to emphasize mixing formal + informal. |
| `src/flows/VoiceTraining/components/` | New: `Step2_Influences.jsx` — name + description + AI snippet generation + confirm UX. |
| `src/flows/VoiceTraining/components/Step5_Preferences.jsx` | Rename to Step6_Style.jsx. Make sliders collapsed by default with "Fine-tune" toggle. |
| `src/flows/VoiceTraining/components/VoiceTemplates.jsx` | Update templates to pre-fill influences instead of just saving fixed settings. |
| `src/flows/VoiceTraining/components/Step7_Generation.jsx` | Pass new voiceData shape (with influences) to voice-analyzer. |
| `supabase/functions/voice-analyzer/index.ts` | Update `buildAnalysisPrompt()` to weight samples more heavily, include influence context. |
| `supabase/migrations/` | New migration: add columns, update trigger, migrate seed data, drop voice_taste_config. |

## Files to Create

| File | Purpose |
|------|---------|
| `src/flows/VoiceTraining/components/Step2_Influences.jsx` | New influence selection step with AI snippet generation |
| `supabase/migrations/YYYYMMDD_voice_smart_bridge.sql` | Schema changes, trigger update, data migration |

## Files to Delete

| File | Reason |
|------|--------|
| (none — just remove functions from contentReviewService.js) | |

---

## Out of Scope (YAGNI)

- Auto-pattern detection from corrections (Approach C — parked in priority-hierarchy.md)
- Scraping writer content (Claude's knowledge is enough)
- Per-user voice profiles for non-admin users (Phase 1 is Huzz only for content review)
- Zarlo integration (stays fixed personality)
- Voice consistency checking during content review
- Editing voice profile from within content-review page
- URL import for writing samples (paste is enough for now)
- extract-voice-dna changes (works standalone, leave it)

---

## Future: Approach C — Voice Intelligence (Parked)

After enough corrections accumulate:
- Auto-generate voice rules from N corrections in same category
- Confidence scoring per category
- Before/After examples showing how AI output improved
- Concrete correction examples baked into Sol prompts

Tracked in `docs/2026-01-29-priority-hierarchy.md` → Ideas Parking Lot.

---

## Success Criteria

1. Voice tab on `/content-review` shows the unified voice profile (not "No voice config found")
2. Content Generator produces noticeably more "Huzz-sounding" content when voice profile has 3+ samples
3. Corrections from content-review drafts feed into voice_profiles and appear in the prompt
4. Influence blend generates representative snippets that user can confirm
5. The system works well at zero corrections (bootstrap mode) and gets smarter over time
