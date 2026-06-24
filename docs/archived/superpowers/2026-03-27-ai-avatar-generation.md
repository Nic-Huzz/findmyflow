# AI Avatar Generation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the manual copy-prompt-to-ChatGPT flow with in-app AI avatar generation via OpenAI's GPT-4o Responses API.

**Architecture:** New Supabase Edge Function (`generate-avatar`) calls OpenAI Responses API with a selfie URL + personalized prompt, receives a base64 PNG, uploads it to Supabase Storage, and returns the public URL. Frontend (`EditEssenceModal.jsx`) adds a "Generate with AI" button that uploads the selfie once, calls the edge function, and previews the result with up to 3 retry attempts per session.

**Tech Stack:** Supabase Edge Functions (Deno), OpenAI Responses API (GPT-4o), Supabase Storage, React

**Spec:** `docs/superpowers/specs/2026-03-27-ai-avatar-generation-design.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `supabase/functions/generate-avatar/index.ts` | Create | Edge function: auth, OpenAI call, storage upload, error handling |
| `src/components/HeroProfile/EditEssenceModal.jsx` | Modify | Add AI generation UI, state management, save path |
| `scripts/deploy-functions.sh` | Modify | Add `generate-avatar` to deploy list |

---

### Task 1: Create the `generate-avatar` Edge Function

**Files:**
- Create: `supabase/functions/generate-avatar/index.ts`

- [ ] **Step 1: Create the edge function file with auth + CORS boilerplate**

```typescript
// supabase/functions/generate-avatar/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Auth: extract user from JWT
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return jsonResponse({ error: 'Missing authorization header' }, 401)
    }
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return jsonResponse({ error: 'Invalid or expired token' }, 401)
    }
    const userId = user.id

    // Parse input
    const { selfie_url, prompt } = await req.json()
    if (!selfie_url || !prompt) {
      return jsonResponse({ error: 'Missing selfie_url or prompt' }, 400)
    }

    // Call OpenAI Responses API
    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiKey) {
      console.error('OPENAI_API_KEY not configured')
      return jsonResponse({ error: 'Image generation is not configured' }, 500)
    }

    const openaiResponse = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
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
                text: prompt,
              },
              {
                type: 'input_image',
                image_url: selfie_url,
              },
            ],
          },
        ],
        tools: [
          {
            type: 'image_generation',
            size: '1024x1024',
            quality: 'high',
          },
        ],
      }),
    })

    if (!openaiResponse.ok) {
      const errBody = await openaiResponse.text()
      console.error('OpenAI API error:', openaiResponse.status, errBody)
      return jsonResponse({ error: 'Image generation failed. Please try again.' }, 502)
    }

    const result = await openaiResponse.json()

    // Extract base64 image from response output
    const imageContent = result.output
      ?.flatMap((o: any) => o.content || [])
      ?.find((c: any) => c.type === 'image')

    if (!imageContent?.image?.data) {
      // Content policy refusal or unexpected response shape
      console.error('No image in OpenAI response:', JSON.stringify(result.output?.map((o: any) => ({
        type: o.type,
        contentTypes: o.content?.map((c: any) => c.type)
      }))))
      return jsonResponse({
        error: 'content_policy',
        message: "Generation couldn't complete. Try a different photo or adjust your lighting."
      }, 422)
    }

    // Decode base64 to binary
    const rawBase64 = imageContent.image.data
    const binaryString = atob(rawBase64)
    const imageBuffer = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      imageBuffer[i] = binaryString.charCodeAt(i)
    }

    // Upload to Supabase Storage using service role (user may not have direct upload perms)
    const adminSupabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const timestamp = Date.now()
    const filePath = `${userId}/ai-avatar-${timestamp}.png`

    const { data: uploadData, error: uploadError } = await adminSupabase.storage
      .from('deal-screenshots')
      .upload(filePath, imageBuffer, {
        contentType: 'image/png',
        upsert: false,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return jsonResponse({ error: 'Failed to save generated image' }, 500)
    }

    const { data: urlData } = adminSupabase.storage
      .from('deal-screenshots')
      .getPublicUrl(uploadData.path)

    return jsonResponse({ url: urlData.publicUrl })
  } catch (error: any) {
    console.error('generate-avatar error:', error)
    return jsonResponse({ error: error.message || 'Unexpected error' }, 500)
  }
})
```

- [ ] **Step 2: Add OPENAI_API_KEY to Supabase secrets**

Run:
```bash
supabase secrets set OPENAI_API_KEY=<your-key>
```

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/generate-avatar/index.ts
git commit -m "feat: add generate-avatar edge function for AI avatar generation"
```

---

### Task 2: Add `generate-avatar` to the Deploy Script

**Files:**
- Modify: `scripts/deploy-functions.sh`

- [ ] **Step 1: Read the current deploy script to find where to add the new function**

Read `scripts/deploy-functions.sh` and identify the list of deployed functions.

- [ ] **Step 2: Add `generate-avatar` to the standard deploy list (with JWT verification)**

Add `generate-avatar` to the list of functions that deploy with default JWT verification (NOT in the `--no-verify-jwt` section).

- [ ] **Step 3: Commit**

```bash
git add scripts/deploy-functions.sh
git commit -m "chore: add generate-avatar to deploy script"
```

---

### Task 3: Add AI Generation State and Selfie Upload to EditEssenceModal

**Files:**
- Modify: `src/components/HeroProfile/EditEssenceModal.jsx`

- [ ] **Step 1: Add new state variables**

After the existing state declarations (around line 31), add:

```javascript
const [generating, setGenerating] = useState(false)
const [attemptsUsed, setAttemptsUsed] = useState(0)
const [selfieFile, setSelfieFile] = useState(null)
const [selfieStorageUrl, setSelfieStorageUrl] = useState(null)
const [aiGeneratedUrl, setAiGeneratedUrl] = useState(null)
```

- [ ] **Step 2: Add a separate file input ref for selfie selection**

After `const fileInputRef = useRef(null)` (line 33), add:

```javascript
const selfieInputRef = useRef(null)
```

- [ ] **Step 3: Add the selfie selection handler**

After the `handleFileSelect` function (after line 101), add:

```javascript
const handleSelfieSelect = async (e) => {
  const file = e.target.files?.[0]
  if (!file) return

  if (!ALLOWED_TYPES.includes(file.type)) {
    setError('Please upload a JPG, PNG, or WebP image')
    return
  }
  if (file.size > MAX_FILE_SIZE) {
    setError('Image must be under 5MB')
    return
  }

  setError(null)
  const compressed = await compressImage(file)
  setSelfieFile(compressed)
  // Immediately trigger generation after selfie is selected
  handleGenerate(compressed)
}
```

- [ ] **Step 4: Add the generation handler**

After `handleSelfieSelect`, add:

```javascript
const handleGenerate = async (selfieOverride) => {
  const file = selfieOverride || selfieFile
  if (!file) {
    // No selfie yet — open file picker, generation will trigger from handleSelfieSelect
    selfieInputRef.current?.click()
    return
  }

  setGenerating(true)
  setError(null)

  try {
    // Upload selfie once, reuse URL for retries
    let url = selfieStorageUrl
    if (!url) {
      url = await uploadEssenceAvatar(userId, file)
      if (!url) {
        setError('Failed to upload photo. Please try again.')
        setGenerating(false)
        return
      }
      setSelfieStorageUrl(url)
    }

    // Call edge function
    const { data, error: fnError } = await supabase.functions.invoke('generate-avatar', {
      body: {
        selfie_url: url,
        prompt: avatarPrompt,
      },
    })

    if (fnError) {
      throw new Error(fnError.message || 'Generation failed')
    }

    if (data?.error === 'content_policy') {
      setError(data.message || "Generation couldn't complete. Try a different photo.")
      setGenerating(false)
      return
    }

    if (data?.error) {
      setError(data.error)
      setGenerating(false)
      return
    }

    if (!data?.url) {
      setError('No image was returned. Please try again.')
      setGenerating(false)
      return
    }

    // Success
    setAiGeneratedUrl(data.url)
    setPreviewUrl(data.url)
    setSelectedFile(null) // AI image is already in storage
    setAttemptsUsed(prev => prev + 1)
  } catch (err) {
    console.error('Avatar generation error:', err)
    setError('Something went wrong generating your avatar. Please try again.')
  } finally {
    setGenerating(false)
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/HeroProfile/EditEssenceModal.jsx
git commit -m "feat: add AI generation state and handlers to EditEssenceModal"
```

---

### Task 4: Update handleSave to Support AI-Generated URLs

**Files:**
- Modify: `src/components/HeroProfile/EditEssenceModal.jsx`

- [ ] **Step 1: Modify the `handleSave` function**

In the `handleSave` function, replace the image URL logic block (lines 201-215):

```javascript
// Current code:
let imageUrl = undefined

// Upload new image if selected
if (selectedFile) {
  const url = await uploadEssenceAvatar(userId, selectedFile)
  if (!url) {
    setError('Failed to upload image. Please try again.')
    setSaving(false)
    return
  }
  imageUrl = url
} else if (previewUrl === originalImage && currentImage !== originalImage) {
  // User reset image back to default
  imageUrl = null
}
```

Replace with:

```javascript
let imageUrl = undefined

if (aiGeneratedUrl && aiGeneratedUrl !== currentImage) {
  // AI-generated image is already in storage — use directly
  imageUrl = aiGeneratedUrl
} else if (selectedFile) {
  // Manual upload — compress and upload
  const url = await uploadEssenceAvatar(userId, selectedFile)
  if (!url) {
    setError('Failed to upload image. Please try again.')
    setSaving(false)
    return
  }
  imageUrl = url
} else if (previewUrl === originalImage && currentImage !== originalImage) {
  // User reset image back to default
  imageUrl = null
}
```

- [ ] **Step 2: Update `hasChanges` memo to include `aiGeneratedUrl`**

In the `hasChanges` useMemo (around line 73), update the `imageChanged` check:

```javascript
const hasChanges = useMemo(() => {
  const imageChanged = selectedFile !== null || aiGeneratedUrl !== null || (previewUrl === originalImage && currentImage !== originalImage)
  const currentCustom = currentName !== originalName ? currentName : ''
  const nameActuallyDifferent = customName.trim() !== (currentCustom || '')
  const currentCustomTagline = currentTagline !== originalTagline ? currentTagline : ''
  const taglineActuallyDifferent = customTagline.trim() !== (currentCustomTagline || '')
  return nameActuallyDifferent || imageChanged || taglineActuallyDifferent
}, [customName, currentName, originalName, selectedFile, aiGeneratedUrl, previewUrl, originalImage, currentImage, customTagline, currentTagline, originalTagline])
```

- [ ] **Step 3: Update `autoCompleteHeroQuest` trigger**

In `handleSave`, the auto-complete fires when `selectedFile` is truthy (line 255). Update to also fire for AI-generated images:

```javascript
// Auto-complete bonus quest if image was updated
if (selectedFile || aiGeneratedUrl) {
  autoCompleteHeroQuest()
}
```

- [ ] **Step 4: Clear `aiGeneratedUrl` when user manually uploads**

In the existing `handleFileSelect` function, add a line to clear the AI state when the user overrides with a manual upload:

```javascript
const handleFileSelect = async (e) => {
  const file = e.target.files?.[0]
  if (!file) return

  if (!ALLOWED_TYPES.includes(file.type)) {
    setError('Please upload a JPG, PNG, or WebP image')
    return
  }
  if (file.size > MAX_FILE_SIZE) {
    setError('Image must be under 5MB')
    return
  }

  setError(null)

  // Clear AI-generated state if user switches to manual upload
  setAiGeneratedUrl(null)

  // Compress before previewing
  const compressed = await compressImage(file)
  setSelectedFile(compressed)
  setPreviewUrl(URL.createObjectURL(compressed))
}
```

- [ ] **Step 5: Clear `aiGeneratedUrl` when user resets image**

In `handleResetImage`, also clear AI state:

```javascript
const handleResetImage = () => {
  setSelectedFile(null)
  setAiGeneratedUrl(null)
  setSelfieFile(null)
  setSelfieStorageUrl(null)
  setPreviewUrl(originalImage)
  if (fileInputRef.current) fileInputRef.current.value = ''
  if (selfieInputRef.current) selfieInputRef.current.value = ''
}
```

- [ ] **Step 6: Commit**

```bash
git add src/components/HeroProfile/EditEssenceModal.jsx
git commit -m "feat: update handleSave to support AI-generated avatar URLs"
```

---

### Task 5: Update the UI with Generate Button and Loading State

**Files:**
- Modify: `src/components/HeroProfile/EditEssenceModal.jsx`

- [ ] **Step 1: Replace the "AI Prompt" button and section with "Generate with AI"**

Replace the upload actions area (lines 351-378) with:

```jsx
<div className="edit-essence-upload-actions">
  <button
    className="edit-essence-upload-btn"
    onClick={() => fileInputRef.current?.click()}
    disabled={generating}
  >
    Choose Photo
  </button>
  <button
    className="edit-essence-generate-btn"
    onClick={() => handleGenerate()}
    disabled={generating || attemptsUsed >= 3}
    title={attemptsUsed >= 3 ? 'Maximum attempts reached' : 'Generate a Pixar-style avatar from your photo'}
  >
    {generating ? 'Generating...' : attemptsUsed > 0 ? `Try Again (${3 - attemptsUsed} left)` : 'Generate with AI'}
  </button>
  {(selectedFile || aiGeneratedUrl || (currentImage && currentImage !== originalImage)) && (
    <button className="edit-essence-reset" onClick={handleResetImage} title="Reset to default">
      ↩
    </button>
  )}
</div>
<input
  ref={fileInputRef}
  type="file"
  accept="image/jpeg,image/png,image/webp"
  onChange={handleFileSelect}
  style={{ display: 'none' }}
/>
<input
  ref={selfieInputRef}
  type="file"
  accept="image/jpeg,image/png,image/webp"
  onChange={handleSelfieSelect}
  style={{ display: 'none' }}
/>
<span className="edit-essence-hint">
  {generating
    ? 'Creating your avatar... this takes about 15 seconds'
    : 'Upload your own photo, or generate a Pixar-style avatar from a selfie'}
</span>
```

- [ ] **Step 2: Remove the "AI Prompt" section entirely**

Delete the entire prompt section (lines 382-396 in the original):

```jsx
{/* Remove this entire block: */}
{showPrompt && (
  <div className="edit-essence-prompt-section">
    ...
  </div>
)}
```

- [ ] **Step 3: Remove unused state and imports related to the prompt section**

Remove these state declarations:
```javascript
const [showPrompt, setShowPrompt] = useState(false)
const [promptCopied, setPromptCopied] = useState(false)
```

Remove the `handleCopyPrompt` function entirely.

Keep `avatarPrompt` and `buildAvatarPrompt` — they're still used by `handleGenerate`.

- [ ] **Step 4: Add CSS for the generate button**

In `src/components/HeroProfile/EditEssenceModal.css` (or wherever EditEssenceModal styles live), add:

```css
.edit-essence-generate-btn {
  background: linear-gradient(135deg, #E9A23B, #d4891f);
  color: #fff;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.edit-essence-generate-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.edit-essence-generate-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

- [ ] **Step 5: Disable "Save Changes" while generating**

Update the save button's `disabled` prop:

```jsx
<button
  className="edit-essence-save"
  onClick={handleSave}
  disabled={saving || generating || !hasChanges}
>
  {saving ? 'Saving...' : 'Save Changes'}
</button>
```

- [ ] **Step 6: Commit**

```bash
git add src/components/HeroProfile/EditEssenceModal.jsx src/components/HeroProfile/EditEssenceModal.css
git commit -m "feat: add Generate with AI button and loading state to EditEssenceModal"
```

Note: If EditEssenceModal styles are in a different CSS file (e.g., `HeroProfile.css`), add the styles there instead. Check the existing import in the component.

---

### Task 6: Deploy and Manual Test

- [ ] **Step 1: Deploy the edge function**

```bash
bash scripts/deploy-functions.sh
```

Or deploy just this function:
```bash
supabase functions deploy generate-avatar
```

- [ ] **Step 2: Manual test checklist**

Test in the running app (`npm run dev`):

1. Open EditEssenceModal (click edit on hero profile)
2. Click "Generate with AI" — should open file picker for selfie
3. Select a selfie photo — should show loading state, then preview the AI-generated avatar after ~15 seconds
4. Click "Try Again" — should regenerate without re-uploading the selfie, counter should decrement
5. After 3 attempts, "Try Again" should be disabled
6. Click "Save Changes" — should save the AI-generated URL directly
7. Verify the hero image updated on the profile
8. Verify `bonus_customize_hero` quest auto-completed
9. Test "Choose Photo" manual upload still works alongside AI generation
10. Test reset button clears both AI and manual state
11. Test closing and reopening modal resets attempt counter

- [ ] **Step 3: Test error scenarios**

1. Test with no internet / OpenAI down — should show error, not increment attempts
2. Test with a photo that might trigger content policy — should show friendly message
3. Test with OPENAI_API_KEY missing — should show "not configured" error

- [ ] **Step 4: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix: address issues found during manual testing"
```
