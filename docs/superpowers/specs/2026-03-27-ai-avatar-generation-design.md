# AI Avatar Generation

Replace the manual copy-prompt-to-ChatGPT workflow with in-app avatar generation. Users upload a selfie, click generate, and get a Pixar-style hero avatar without leaving FindMyFlow.

## Context

The first onboarding step ("Create your character") requires users to upload a custom archetype photo. Currently they must:
1. Click "AI Prompt" in EditEssenceModal
2. Copy the generated prompt
3. Leave the app, paste into ChatGPT/Midjourney
4. Download the result
5. Come back and upload it

This friction sits at the very first step of the onboarding funnel.

## Solution

### Backend: New Edge Function `generate-avatar`

**Location**: `supabase/functions/generate-avatar/index.ts`

**Input** (POST, JSON):
```json
{
  "selfie_url": "<public Supabase Storage URL of uploaded selfie>",
  "prompt": "<output of buildAvatarPrompt()>"
}
```

The selfie is uploaded to Supabase Storage first by the frontend (reusing `uploadEssenceAvatar`), then its public URL is passed to the edge function. This avoids the ~2MB request body limit on Supabase Edge Functions.

**Auth**: Supabase JWT (same pattern as other edge functions). Rejects unauthenticated requests.

**Secret**: `OPENAI_API_KEY` (added to Supabase project secrets).

**Logic**:
1. Validate auth, extract `user_id` from JWT
2. Validate `selfie_url` is present and is a valid Supabase Storage URL
3. Call OpenAI Responses API (`POST https://api.openai.com/v1/responses`):
   - Model: `gpt-4o`
   - Input: user message with `input_image` (selfie URL) + `input_text` (prompt)
   - Tools: `[{ type: "image_generation", size: "1024x1024", quality: "high" }]`
4. Extract the base64-encoded PNG from the response output
5. Decode base64 to a Uint8Array
6. Upload to Supabase Storage (`deal-screenshots` bucket) at path `{user_id}/ai-avatar-{timestamp}.png`
7. Return `{ url: "<public URL>" }`

**Error handling**:
- 401: Unauthenticated request
- 400: Missing or invalid `selfie_url` / `prompt`
- 502: OpenAI API failure (network error, rate limit, server error)
- 422: OpenAI returned a valid response but no image (content policy refusal). The model may refuse to generate from certain selfies due to likeness/safety policies. Return `{ error: "content_policy", message: "Generation couldn't complete. Try a different photo or adjust your lighting." }` so the frontend can show a helpful message without incrementing the attempt counter.

**Timeout**: Generation takes 10-30 seconds. Supabase Edge Functions default to 60s, which is sufficient.

**Cost**: ~$0.04-0.08 per high-quality 1024x1024 image.

### Frontend: EditEssenceModal Changes

**File**: `src/components/HeroProfile/EditEssenceModal.jsx`

**New state**:
- `generating` (boolean): loading state during AI generation
- `attemptsUsed` (number): tracks generations this session, max 3
- `selfieFile` (File | null): the uploaded reference photo, separate from the generated result
- `selfieStorageUrl` (string | null): public URL of the selfie after first upload, reused for retries
- `aiGeneratedUrl` (string | null): storage URL of the AI-generated avatar, used by `handleSave`

**Updated UI flow**:

1. **Upload area** gains two buttons side by side:
   - "Choose Photo" (existing manual upload, unchanged)
   - "Generate with AI" (new, gold accent button)

2. **Clicking "Generate with AI"**:
   - If no selfie uploaded yet: trigger the file picker first, store as `selfieFile`
   - If selfie ready:
     1. If `selfieStorageUrl` is null (first attempt): upload selfie to Supabase Storage via `uploadEssenceAvatar`, save returned URL to `selfieStorageUrl`
     2. If `selfieStorageUrl` already set (retry): skip upload, reuse existing URL
     3. Show loading spinner with message ("Creating your avatar... ~15 seconds")
     4. Call the edge function with `selfieStorageUrl` + `buildAvatarPrompt()` output
   - On success: set `aiGeneratedUrl` to the returned URL, set `previewUrl` to the returned URL, set `selectedFile` to null, increment `attemptsUsed`
   - On error: show error message, do not increment attempts

3. **After generation**:
   - Preview shows the AI-generated avatar
   - If `attemptsUsed < 3`: show "Try Again" button to regenerate
   - If `attemptsUsed >= 3`: hide "Try Again", user must pick from current result or upload manually
   - "Save Changes" works as before (if image came from AI, URL is already in storage, save it directly to `custom_essence_image` without re-uploading)

4. **"AI Prompt" copy button**: Remove. The in-app generation replaces this flow entirely.

**No changes to**:
- `autoCompleteHeroQuest` (still fires on save when image changes)
- `buildAvatarPrompt` in `essencePreferences.js` (still generates the prompt text)
- `uploadEssenceAvatar` (still used for manual photo uploads)
- `compressImage` (still used for manual uploads)

### Save Flow Differences

| Source | previewUrl | selectedFile | aiGeneratedUrl | On save |
|--------|-----------|-------------|---------------|---------|
| Manual upload | blob URL | File object | null | `uploadEssenceAvatar` uploads to storage, saves URL |
| AI generated | Storage URL | null | Storage URL | Use `aiGeneratedUrl` directly as `imageUrl`, skip `uploadEssenceAvatar` |
| Manual after AI | blob URL | File object | cleared to null | Normal manual upload path |

**`handleSave` modification**: Add a new branch before the existing `selectedFile` check:

```javascript
let imageUrl = undefined

if (aiGeneratedUrl && aiGeneratedUrl !== currentImage) {
  // AI-generated image is already in storage
  imageUrl = aiGeneratedUrl
} else if (selectedFile) {
  const url = await uploadEssenceAvatar(userId, selectedFile)
  // ... existing logic
} else if (previewUrl === originalImage && currentImage !== originalImage) {
  imageUrl = null  // reset to default
}
```

If the user manually uploads after generating (overriding the AI result), `aiGeneratedUrl` should be cleared to null so the manual path takes over.

### Attempt Tracking

- Tracked in React state only (resets if modal closes and reopens). No database persistence needed.
- 3 attempts per modal session is a soft guardrail against runaway costs, not a hard user-facing limit.
- If they close and reopen the modal, attempts reset. This is intentional: the goal is preventing accidental spam, not enforcing a billing quota.

### Edge Function: OpenAI Responses API Call

```typescript
const response = await fetch('https://api.openai.com/v1/responses', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'gpt-4o',
    input: [
      {
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: prompt  // from buildAvatarPrompt()
          },
          {
            type: 'input_image',
            image_url: selfie_url  // public Supabase Storage URL
          }
        ]
      }
    ],
    tools: [
      {
        type: 'image_generation',
        size: '1024x1024',
        quality: 'high'
      }
    ]
  })
})

const result = await response.json()

// Extract base64 image from response
const imageContent = result.output
  ?.flatMap(o => o.content || [])
  ?.find(c => c.type === 'image')

// imageContent.image.data contains base64-encoded PNG
const imageBuffer = Uint8Array.from(
  atob(imageContent.image.data),
  c => c.charCodeAt(0)
)
```

> Note: The exact Responses API field names should be verified against https://platform.openai.com/docs/api-reference at implementation time, as OpenAI may have updated them since this spec was written.

## Files Changed

| File | Change |
|------|--------|
| `supabase/functions/generate-avatar/index.ts` | New edge function |
| `src/components/HeroProfile/EditEssenceModal.jsx` | Add AI generation UI, attempt tracking, direct-URL save path |
| Supabase secrets | Add `OPENAI_API_KEY` |

## Files NOT Changed

- `src/lib/essencePreferences.js` (buildAvatarPrompt, uploadEssenceAvatar, compressImage all stay)
- `src/hooks/usePriorityTab.js` (onboarding step detection unchanged)
- Quest completion logic (autoCompleteHeroQuest fires on any image save)

## Out of Scope

- Generation history / gallery of past attempts
- Style picker (always Pixar for now)
- Prompt editing by the user
- Billing / payment for generations
