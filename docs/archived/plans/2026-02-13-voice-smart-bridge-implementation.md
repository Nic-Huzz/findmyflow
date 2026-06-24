# Voice Smart Bridge Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Unify voice_profiles and voice_taste_config into a single system where writing samples and corrections lead the prompt, not sliders.

**Architecture:** Migration adds columns to voice_profiles and retires voice_taste_config. Prompt builder rewrite flips the hierarchy (samples > corrections > influences > rules > sliders). VoiceTraining flow reorders steps (writing first, sliders last). VoiceDashboard reads from voice_profiles.

**Tech Stack:** React 18, Supabase (PostgreSQL, Edge Functions), Anthropic Claude API

**Design Doc:** `docs/plans/2026-02-13-voice-smart-bridge-design.md`

---

### Task 1: Database Migration — Schema Changes

**Files:**
- Create: `supabase/migrations/20260213200000_voice_smart_bridge.sql`

**Step 1: Write the migration**

```sql
-- Voice Smart Bridge Migration
-- Adds corrections + voice_influences to voice_profiles
-- Migrates voice_taste_config seed data
-- Updates trigger to write to voice_profiles
-- Drops voice_taste_config

-- 1. Add new columns to voice_profiles
ALTER TABLE voice_profiles
  ADD COLUMN IF NOT EXISTS corrections JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS voice_influences JSONB DEFAULT '[]';

-- 2. Migrate voice_taste_config seed data into the admin user's voice profile
-- Move on_brand_words → detected_patterns.voice_dos
-- Move off_brand_words → detected_patterns.voice_donts
-- Move corrections → corrections column
DO $$
DECLARE
  admin_uid UUID;
  vtc_record RECORD;
BEGIN
  -- Get admin user ID
  SELECT user_id INTO admin_uid FROM admin_users WHERE role = 'admin' LIMIT 1;

  -- Get voice_taste_config data
  SELECT * INTO vtc_record FROM voice_taste_config WHERE owner_id IS NULL LIMIT 1;

  IF vtc_record IS NOT NULL AND admin_uid IS NOT NULL THEN
    -- Ensure voice profile exists for admin
    INSERT INTO voice_profiles (user_id, voice_name)
    VALUES (admin_uid, 'My Voice')
    ON CONFLICT (user_id) DO NOTHING;

    -- Merge on_brand_words into detected_patterns.voice_dos
    -- Merge off_brand_words into detected_patterns.voice_donts
    UPDATE voice_profiles
    SET
      detected_patterns = jsonb_set(
        jsonb_set(
          COALESCE(detected_patterns, '{}'::jsonb),
          '{voice_dos}',
          COALESCE(
            (SELECT jsonb_agg(w) FROM unnest(vtc_record.on_brand_words) AS w),
            '[]'::jsonb
          )
        ),
        '{voice_donts}',
        COALESCE(
          (SELECT jsonb_agg(w) FROM unnest(vtc_record.off_brand_words) AS w),
          '[]'::jsonb
        )
      ),
      corrections = COALESCE(vtc_record.corrections, '[]'::jsonb),
      updated_at = now()
    WHERE user_id = admin_uid;
  END IF;
END $$;

-- 3. Update the trigger to write to voice_profiles instead of voice_taste_config
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

-- 4. Drop voice_taste_config and its policies
DROP TRIGGER IF EXISTS trg_content_comment_resolved ON content_comments;
CREATE TRIGGER trg_content_comment_resolved
  AFTER UPDATE ON content_comments
  FOR EACH ROW
  EXECUTE FUNCTION append_voice_correction();

DROP POLICY IF EXISTS "Admins can read voice_taste_config" ON voice_taste_config;
DROP POLICY IF EXISTS "Admins can update voice_taste_config" ON voice_taste_config;
DROP POLICY IF EXISTS "Admins can insert voice_taste_config" ON voice_taste_config;
DROP TABLE IF EXISTS voice_taste_config;
```

**Step 2: Apply migration**

Run: `npx supabase db push` or apply via Supabase dashboard.

**Step 3: Verify**

Query to confirm:
```sql
SELECT id, corrections, voice_influences,
  detected_patterns->'voice_dos' as dos,
  detected_patterns->'voice_donts' as donts
FROM voice_profiles
WHERE user_id = (SELECT user_id FROM admin_users LIMIT 1);
```

Expected: Row exists with migrated on/off-brand words in detected_patterns, empty corrections (or migrated ones), empty voice_influences.

**Step 4: Commit**

```bash
git add supabase/migrations/20260213200000_voice_smart_bridge.sql
git commit -m "feat: voice smart bridge migration — add corrections, influences, retire voice_taste_config"
```

---

### Task 2: Prompt Builder Rewrite

This is the highest-impact change. Rewrite `buildVoiceInstructions()` and `buildEnhancedVoiceInstructions()` to use the new hierarchy: samples > corrections > influences > rules > sliders.

**Files:**
- Modify: `src/lib/voiceProfile.js:338-671`

**Step 1: Rewrite buildVoiceInstructions()**

Replace the function at line 338 with the new hierarchy. The function should:

1. Lead with influence blend (if voice_influences exist)
2. Include ALL content_samples (up to 5, 2000 chars each — not 1 sample at 300 chars)
3. Include corrections array (up to 20 most recent)
4. Include dos/donts from detected_patterns
5. Include catchphrases
6. Sliders ONLY as a final "Style Notes" section, with human-readable descriptions

Key code structure:
```javascript
export function buildVoiceInstructions(voiceProfile) {
  if (!voiceProfile) return ''
  const sections = []

  // 1. Voice Identity — influences
  const influences = voiceProfile.voice_influences || []
  if (influences.length > 0) {
    let influenceText = '## Voice Identity\nWrite in a style that blends:\n'
    influences.forEach(inf => {
      influenceText += `- ${inf.name}: ${inf.description}\n`
    })
    sections.push(influenceText)
  }

  // 2. Writing samples — few-shot examples (HIGHEST weight)
  const samples = voiceProfile.content_samples || []
  if (samples.length > 0) {
    let samplesText = '## How They Actually Write (Study These Carefully)\n'
    samplesText += 'Match the energy, sentence structure, vocabulary, and personality:\n'
    samples.slice(0, 5).forEach((s, i) => {
      samplesText += `\n--- Sample ${i + 1} ---\n${s.slice(0, 2000)}\n`
    })
    sections.push(samplesText)
  }

  // 3. Corrections — "do this, not that"
  const corrections = voiceProfile.corrections || []
  if (corrections.length > 0) {
    let correctionsText = '## Voice Corrections (Do This, Not That)\n'
    corrections.slice(-20).forEach(c => {
      correctionsText += `- Don't say "${c.original}" → say "${c.corrected}" (${c.category})\n`
    })
    sections.push(correctionsText)
  }

  // 4. Voice rules — dos/donts
  const patterns = voiceProfile.detected_patterns || {}
  // ... dos, donts, catchphrases

  // 5. Sliders — only as final fine-tuning
  // ... minimal section, human-readable

  return sections.join('\n\n')
}
```

**Step 2: Update buildEnhancedVoiceInstructions()**

This function wraps buildVoiceInstructions + feedback. Keep the feedback integration but ensure corrections from voice_profiles.corrections don't duplicate with voice_feedback corrections. The content-review corrections are specific text corrections; the voice_feedback is categorical ("too_formal" etc). They're complementary, not duplicates.

**Step 3: Verify**

In browser console on any page with Supabase auth:
```javascript
import { fetchVoiceProfile, buildVoiceInstructions } from './lib/voiceProfile'
const { data } = await fetchVoiceProfile(userId)
console.log(buildVoiceInstructions(data))
```

Expected: Prompt output with new hierarchy. If no samples/influences exist yet, sliders section still works as fallback.

**Step 4: Commit**

```bash
git add src/lib/voiceProfile.js
git commit -m "feat: rewrite voice prompt builder — samples and corrections lead, sliders demoted"
```

---

### Task 3: Content Review Service — Remove Old, Add New

**Files:**
- Modify: `src/lib/contentReviewService.js:97-118`

**Step 1: Remove fetchVoiceConfig() and updateVoiceConfig()**

Delete lines 97-118 (the two functions that read/write voice_taste_config).

**Step 2: Add fetchVoiceProfileForDashboard()**

Add a new function that fetches the admin user's voice profile for the dashboard:

```javascript
export async function fetchVoiceProfileForDashboard() {
  // Phase 1: fetch the admin user's voice profile
  const { data: admin } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('role', 'admin')
    .limit(1)
    .single()

  if (!admin) return null

  const { data, error } = await supabase
    .from('voice_profiles')
    .select('*')
    .eq('user_id', admin.user_id)
    .maybeSingle()

  if (error) throw error
  return data
}
```

**Step 3: Verify**

The old functions are gone. The new function returns a voice profile or null.

**Step 4: Commit**

```bash
git add src/lib/contentReviewService.js
git commit -m "feat: content review service — replace voice_taste_config with voice_profiles"
```

---

### Task 4: Voice Dashboard Rewrite

**Files:**
- Modify: `src/components/content-review/VoiceDashboard.jsx`

**Step 1: Rewrite VoiceDashboard to read from voice_profiles**

Replace the entire component. New layout:

1. **Voice Summary Card** — voice name, summary, influence chips, confidence indicator
2. **"How AI Writes For You"** — collapsible prompt preview (calls buildVoiceInstructions)
3. **Corrections Feed** — from voice_profiles.corrections (same UI as before but new data source)
4. **Brand Words** — from detected_patterns.voice_dos / voice_donts
5. **Writing Samples** — count + truncated previews
6. **"Edit Voice Profile"** button → `/voice-training`

Import `fetchVoiceProfileForDashboard` from contentReviewService and `buildVoiceInstructions` from voiceProfile.

Confidence logic:
```javascript
function getConfidenceLevel(profile) {
  if (!profile) return { label: 'No profile', level: 0 }
  const corrections = profile.corrections?.length || 0
  const samples = profile.content_samples?.length || 0
  const influences = profile.voice_influences?.length || 0

  if (corrections >= 25) return { label: 'Your voice twin', level: 5 }
  if (corrections >= 10) return { label: 'Dialed in', level: 4 }
  if (samples >= 3) return { label: 'Learning your voice', level: 3 }
  if (influences > 0) return { label: 'Warming up', level: 2 }
  return { label: 'Getting started', level: 1 }
}
```

**Step 2: Verify**

Navigate to `/content-review` → Voice tab. Should show the voice profile data (or "No voice profile found" if none exists). If profile exists with migrated brand words, those should appear as chips.

**Step 3: Commit**

```bash
git add src/components/content-review/VoiceDashboard.jsx
git commit -m "feat: voice dashboard — unified DNA dashboard reading from voice_profiles"
```

---

### Task 5: VoiceTraining Flow — Reorder Steps

**Files:**
- Modify: `src/flows/VoiceTraining/index.jsx`

**Step 1: Update STAGES, STEP_LABELS, and stage order arrays**

New step mapping:
```
STEP_1 → 'Your Writing'     (was Step 6: Content Samples)
STEP_2 → 'Your Influences'  (NEW)
STEP_3 → 'Your Story'       (was Step 1)
STEP_4 → 'Your People'      (was Step 2)
STEP_5 → 'Your Difference'  (was Step 4)
STEP_6 → 'Your Style'       (was Step 5: Preferences — demoted)
STEP_7 → 'Voice Generation'  (unchanged)
```

Note: Step 3 "Your Wins" is removed (was Step 3). The origin story, audience, and unique difference are the essential context steps. "Wins" was nice-to-have and adds friction.

Update:
- `STEP_LABELS` object with new titles
- `DEFAULT_VOICE_DATA` to add `voiceInfluences: []`
- Stage rendering to map new components to steps
- `stageOrder` arrays in goNext/goBack

**Step 2: Update component imports and rendering**

```javascript
import Step1_Writing from './components/Step1_Writing'         // renamed from Step6_Samples
import Step2_Influences from './components/Step2_Influences'   // NEW
import Step3_Story from './components/Step3_Story'             // renamed from Step1_Origin
import Step4_Audience from './components/Step4_Audience'       // renamed from Step2_Audience
import Step5_Difference from './components/Step5_Difference'   // renamed from Step4_Difference
import Step6_Style from './components/Step6_Style'             // renamed from Step5_Preferences
import Step7_Generation from './components/Step7_Generation'
```

**Step 3: Verify**

Navigate to `/voice-training` (or wherever the route is). Steps should appear in new order with correct labels in the progress header.

**Step 4: Commit**

```bash
git add src/flows/VoiceTraining/index.jsx
git commit -m "feat: voice training — reorder steps (writing first, sliders last)"
```

---

### Task 6: Step1_Writing — Rename and Update Step6_Samples

**Files:**
- Create: `src/flows/VoiceTraining/components/Step1_Writing.jsx` (copy from Step6_Samples.jsx, then modify)

**Step 1: Copy and rename**

Copy `Step6_Samples.jsx` to `Step1_Writing.jsx`. Update:

- Component name: `Step1_Writing`
- Header: "Share your writing" (instead of "Share your existing content")
- Subheading: "Paste 3-5 pieces of content you've written. Include at least one casual piece (social post, text, email) — that's where your real voice lives."
- Max samples: 5 (already 5)
- Max chars per sample: 2000 (already 2000)
- Min chars per sample: 100 (already 100)
- Placeholder: add "A text or DM about your work" to the examples list
- Remove the "Skip" button — writing samples are now step 1 and important (but keep min 1, not required to fill all 5)
- Update the tip: "Best results: Mix formal (blog post, email) with informal (social post, text message). The casual stuff captures your real voice best."

**Step 2: Verify**

Component renders correctly in step 1 position.

**Step 3: Commit**

```bash
git add src/flows/VoiceTraining/components/Step1_Writing.jsx
git commit -m "feat: Step1_Writing — promoted writing samples to first step"
```

---

### Task 7: Step2_Influences — New Component

**Files:**
- Create: `src/flows/VoiceTraining/components/Step2_Influences.jsx`

**Step 1: Build the component**

Structure:
- Up to 3 influence cards
- Each card: name input + "What do you like about their style?" textarea
- On blur/submit of name+description: call Claude to generate 2-3 representative snippets
- Show snippets with "That's the vibe" / "Not quite" buttons
- "Not quite" clears snippets so user can edit description and regenerate
- "+ Add another influence" button (up to 3)
- "Skip" option — influences are helpful but not required
- Continue button enabled if at least 0 influences added (can skip entirely)

For snippet generation, use `supabase.functions.invoke('voice-analyzer')` is too heavy. Instead, call the content-generator edge function with a lightweight prompt, OR add a simple inline fetch to Claude. Given the codebase already calls Claude from edge functions, create a minimal edge function.

Actually — simpler approach: call the existing `content-generator` edge function with a special `type: 'influence_snippets'` mode, OR just build a small new function. Let's use a new edge function to keep it clean.

**Step 2: Verify**

Type a writer name + description, snippets appear. Confirm/reject works. Data stored in voiceData.voiceInfluences.

**Step 3: Commit**

```bash
git add src/flows/VoiceTraining/components/Step2_Influences.jsx
git commit -m "feat: Step2_Influences — influence blend with AI snippet generation"
```

---

### Task 8: Generate Influence Snippets Edge Function

**Files:**
- Create: `supabase/functions/generate-influence-snippets/index.ts`

**Step 1: Build the edge function**

Lightweight function:
- Input: `{ name: string, description: string }`
- Calls Claude Haiku (fast + cheap) with prompt:
  "Write 2 short paragraphs (2-3 sentences each) in the distinctive writing style of [name]. The user describes what they like about this writer's style: [description]. Write about a generic business/personal development topic. Make the style unmistakable."
- Output: `{ snippets: string[] }`
- CORS headers, error handling

```typescript
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01'
  },
  body: JSON.stringify({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 500,
    messages: [{ role: 'user', content: prompt }]
  })
})
```

**Step 2: Deploy**

Run: `npx supabase functions deploy generate-influence-snippets`

**Step 3: Verify**

Test via curl or browser:
```javascript
const { data } = await supabase.functions.invoke('generate-influence-snippets', {
  body: { name: 'Alex Hormozi', description: 'Direct, no-BS business advice' }
})
console.log(data.snippets) // Should be 2 paragraphs in Hormozi's style
```

**Step 4: Commit**

```bash
git add supabase/functions/generate-influence-snippets/
git commit -m "feat: generate-influence-snippets edge function (Haiku for speed)"
```

---

### Task 9: Step6_Style — Demote Sliders

**Files:**
- Create: `src/flows/VoiceTraining/components/Step6_Style.jsx` (copy from Step5_Preferences.jsx, then modify)

**Step 1: Copy and update**

Copy `Step5_Preferences.jsx` to `Step6_Style.jsx`. Changes:

- Component name: `Step6_Style`
- Wrap the sliders section in a collapsible div, collapsed by default
- Add a toggle button: "Fine-tune style (optional)" that expands/collapses
- Add note above toggle: "These are auto-set from your writing samples and influences. Adjust only if needed."
- Catchphrases section stays visible (not collapsed) — these are high value
- Header: "Style & Catchphrases" instead of "Fine-tune your style"

```jsx
const [showSliders, setShowSliders] = useState(false)

// In JSX:
<button
  className="vt-secondary-btn"
  onClick={() => setShowSliders(!showSliders)}
  style={{ marginBottom: '16px' }}
>
  {showSliders ? '▾ Hide style sliders' : '▸ Fine-tune style sliders (optional)'}
</button>

{showSliders && (
  <div style={{ marginBottom: '32px' }}>
    {SLIDERS.map(slider => ( /* existing slider JSX */ ))}
  </div>
)}
```

**Step 2: Verify**

Sliders are hidden by default. Toggle shows/hides them. Catchphrases always visible.

**Step 3: Commit**

```bash
git add src/flows/VoiceTraining/components/Step6_Style.jsx
git commit -m "feat: Step6_Style — demote sliders to collapsed optional section"
```

---

### Task 10: Rename Remaining Steps

**Files:**
- Create: `src/flows/VoiceTraining/components/Step3_Story.jsx` (copy from Step1_Origin.jsx — rename only)
- Create: `src/flows/VoiceTraining/components/Step4_Audience.jsx` (copy from Step2_Audience.jsx — rename only)
- Create: `src/flows/VoiceTraining/components/Step5_Difference.jsx` (copy from Step4_Difference.jsx — rename only)

**Step 1: Copy and rename component names**

For each file:
- Copy source file to new name
- Update the default export function name to match new step number
- No logic changes needed

**Step 2: Verify**

All imports in index.jsx resolve correctly. Flow navigates through all 7 steps.

**Step 3: Commit**

```bash
git add src/flows/VoiceTraining/components/Step3_Story.jsx \
        src/flows/VoiceTraining/components/Step4_Audience.jsx \
        src/flows/VoiceTraining/components/Step5_Difference.jsx
git commit -m "refactor: rename voice training steps to match new order"
```

---

### Task 11: VoiceTemplates — Templates as Influence Presets

**Files:**
- Modify: `src/flows/VoiceTraining/components/VoiceTemplates.jsx`
- Modify: `src/flows/VoiceTraining/index.jsx` (handleTemplateSelect)

**Step 1: Update template selection behavior**

Instead of immediately saving a template as the full profile, templates now pre-fill voiceData with influences and preferences:

In `index.jsx`, change `handleTemplateSelect` to:
```javascript
const handleTemplateSelect = (templateId) => {
  const template = VOICE_TEMPLATES[templateId]
  if (!template) return

  // Pre-fill influences from template inspiration
  const influenceNames = template.inspiration.split(', ')
  const influences = influenceNames.map(name => ({
    name,
    description: template.description,
    snippets: [],
    confirmed: false
  }))

  updateVoiceData({
    voiceInfluences: influences,
    preferences: {
      sentenceLength: template.settings.sentence_length,
      emojiUsage: template.settings.emoji_usage,
      humorLevel: template.settings.humor_level,
      formalityLevel: template.settings.formality_level,
      vulnerabilityLevel: template.settings.vulnerability_level
    },
    catchphrases: template.signature_phrases || []
  })

  // Jump to step 1 (writing) — user still provides their own samples
  animateToStage(STAGES.STEP_1)
}
```

**Step 2: Update VoiceTemplates.jsx**

Change the "Use" button text to something like "Start with this style →" to indicate it's a starting point, not the final profile.

Add subtitle: "This pre-fills your style preferences. You'll still add your own writing samples next."

**Step 3: Verify**

Select a template → get redirected to Step 1 (writing samples) with influences and preferences pre-filled. Navigating to Step 2 should show the template's inspiration names pre-filled.

**Step 4: Commit**

```bash
git add src/flows/VoiceTraining/index.jsx \
        src/flows/VoiceTraining/components/VoiceTemplates.jsx
git commit -m "feat: templates become influence presets — pre-fill, don't save immediately"
```

---

### Task 12: Step7_Generation — Pass New voiceData Shape

**Files:**
- Modify: `src/flows/VoiceTraining/components/Step7_Generation.jsx`

**Step 1: Update the voiceData passed to voice-analyzer**

The edge function now receives `voiceInfluences` in addition to existing fields. No changes needed to the component itself — it already passes `voiceData` directly to the edge function.

Verify that `voiceData` in index.jsx includes:
```javascript
const DEFAULT_VOICE_DATA = {
  originStory: '',
  audienceDescription: '',
  uniqueApproach: '',
  preferences: { ... },
  catchphrases: [],
  contentSamples: [],
  voiceInfluences: [],   // NEW
}
```

This was added in Task 5. Just verify the data flows through.

**Step 2: Commit** (if any changes needed)

```bash
git add src/flows/VoiceTraining/components/Step7_Generation.jsx
git commit -m "feat: Step7_Generation — pass voice influences to analyzer"
```

---

### Task 13: Voice Analyzer Edge Function — Update Prompt

**Files:**
- Modify: `supabase/functions/voice-analyzer/index.ts`

**Step 1: Update buildAnalysisPrompt()**

Add voice influences to the prompt:

```typescript
// After existing sections, before TASK:
const influences = voiceData.voiceInfluences || []
let influenceSection = ''
if (influences.length > 0) {
  influenceSection = `
VOICE INFLUENCES (writers/creators they admire):
${influences.map(inf => `- ${inf.name}: "${inf.description}"`).join('\n')}

Consider how these influences shape their natural voice.
`
}
```

Also update the content samples section to emphasize their importance:

```typescript
if (hasSamples) {
  samplesSection = `
ACTUAL CONTENT SAMPLES (THIS IS THE MOST IMPORTANT DATA — analyze these deeply for voice patterns):
${contentSamples.filter(s => s.trim()).map((s, i) => `
Sample ${i + 1}:
"${s}"
`).join('\n')}

These samples are the ground truth for this person's voice. Everything else is supplementary context.
`
}
```

**Step 2: Update saveProfile() to store voice_influences**

Add to profileData:
```typescript
voice_influences: voiceData.voiceInfluences || [],
```

**Step 3: Deploy**

Run: `npx supabase functions deploy voice-analyzer`

**Step 4: Verify**

Run through VoiceTraining flow end-to-end with samples + influences → profile is generated and saved with voice_influences populated.

**Step 5: Commit**

```bash
git add supabase/functions/voice-analyzer/
git commit -m "feat: voice-analyzer — weight samples highest, include influences in prompt"
```

---

### Task 14: Clean Up Old Step Files

**Files:**
- Delete references to old step files in any imports

**Step 1: Verify no other files import the old step names**

Search for imports of `Step1_Origin`, `Step2_Audience`, `Step4_Difference`, `Step5_Preferences`, `Step6_Samples` outside of VoiceTraining/index.jsx. If no external imports, the old files can be deleted or left (they're not referenced anymore).

**Step 2: Optionally delete old files**

If no external references:
- `Step1_Origin.jsx` (replaced by Step3_Story.jsx)
- `Step2_Audience.jsx` (replaced by Step4_Audience.jsx)
- `Step3_Wins.jsx` (removed entirely — was Step 3)
- `Step4_Difference.jsx` (replaced by Step5_Difference.jsx)
- `Step5_Preferences.jsx` (replaced by Step6_Style.jsx)
- `Step6_Samples.jsx` (replaced by Step1_Writing.jsx)

**Step 3: Commit**

```bash
git add -A src/flows/VoiceTraining/components/
git commit -m "refactor: clean up old voice training step files"
```

---

### Task 15: End-to-End Verification

**Step 1: Verify the full flow**

1. Navigate to `/voice-training`
2. Select a template → get pre-filled influences + preferences
3. Step 1: Paste 2-3 writing samples → continue
4. Step 2: See pre-filled influences → generate snippets → confirm
5. Steps 3-5: Fill in story, audience, difference
6. Step 6: Sliders collapsed by default, catchphrases visible
7. Step 7: Generation runs → profile saved

**Step 2: Verify content review Voice tab**

1. Navigate to `/content-review` → Voice tab
2. Should show the unified voice profile with:
   - Summary card with influence chips
   - Confidence indicator
   - Corrections feed (empty initially)
   - Brand words from detected_patterns
   - Writing sample count

**Step 3: Verify corrections loop**

1. Go to Drafts tab → select a draft → highlight text → add comment
2. Resolve the comment with corrected text
3. Go to Voice tab → correction should appear in feed
4. Check that `voice_profiles.corrections` has the new entry

**Step 4: Verify prompt output**

Check that content generation uses the new prompt hierarchy by inspecting the voice instructions:
```javascript
import { fetchVoiceProfile, buildEnhancedVoiceInstructions } from './lib/voiceProfile'
const { data } = await fetchVoiceProfile(userId)
console.log(buildEnhancedVoiceInstructions(data))
```

Should show: influences → samples → corrections → rules → sliders (in that order).

**Step 5: Final commit**

```bash
git add -A
git commit -m "feat: voice smart bridge — complete unification of voice systems"
```

---

## Task Dependency Graph

```
Task 1 (Migration)
  ↓
Task 2 (Prompt Builder) ←── can start after Task 1
  ↓
Task 3 (Service Cleanup) ←── can start after Task 1
  ↓
Task 4 (Voice Dashboard) ←── needs Task 3

Task 5 (Flow Reorder) ←── independent of Tasks 2-4
  ↓
Task 6 (Step1_Writing) ←── needs Task 5
Task 7 (Step2_Influences) ←── needs Task 5 + Task 8
Task 8 (Edge Function) ←── independent
Task 9 (Step6_Style) ←── needs Task 5
Task 10 (Rename Steps) ←── needs Task 5
Task 11 (Templates) ←── needs Task 5
Task 12 (Step7 Update) ←── needs Task 5
  ↓
Task 13 (Voice Analyzer) ←── independent of UI tasks
Task 14 (Cleanup) ←── needs all step tasks done
Task 15 (E2E Verify) ←── needs everything done
```

**Parallelizable groups:**
- Group A: Tasks 1, 2, 3, 4 (backend + prompt + dashboard)
- Group B: Tasks 5, 6, 7, 8, 9, 10, 11, 12 (VoiceTraining UI)
- Group C: Task 13 (edge function)
- Sequential: Task 14 → Task 15
