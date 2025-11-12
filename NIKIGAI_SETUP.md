# Nikigai AI Setup Guide

Complete setup instructions to get the Nikigai AI chat tool working.

---

## Prerequisites

- ✅ Supabase project
- ✅ Claude API key (from console.anthropic.com)
- ✅ Node.js installed
- ✅ Supabase CLI installed (for Edge Functions)

---

## Step 1: Database Setup (5 minutes)

### Run the Supabase Migration

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **SQL Editor** → **New Query**
4. Copy contents of `supabase/migrations/create_nikigai_schema.sql`
5. Paste and click **Run**
6. Verify success message: "✅ All Nikigai tables created successfully!"

### Verify Tables Created

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name LIKE 'nikigai%';
```

Should return:
- nikigai_sessions
- nikigai_clusters
- nikigai_key_outcomes
- nikigai_responses
- library_display_cache
- clustering_metrics
- analytics_events

---

## Step 2: Environment Variables (2 minutes)

### Add to `.env.local`

```bash
# Existing Supabase vars (already have these)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# NEW: Claude API Key
VITE_ANTHROPIC_API_KEY=sk-ant-api03-...
```

⚠️ **Important:** Make sure `.env.local` is in `.gitignore` (don't commit API keys!)

---

## Step 3: Deploy Supabase Edge Function (10 minutes)

### Install Supabase CLI (if not installed)

```bash
npm install -g supabase
```

### Login to Supabase

```bash
supabase login
```

### Link to Your Project

```bash
supabase link --project-ref your-project-ref
```

(Find your project ref in Supabase Dashboard → Settings → General)

### Set Edge Function Secrets

```bash
# Set your Claude API key as a secret
supabase secrets set ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
```

### Deploy the Edge Function

```bash
supabase functions deploy extract-nikigai-tags
```

### Verify Deployment

Go to Supabase Dashboard → Edge Functions

You should see: `extract-nikigai-tags` with status "Active"

### Test the Edge Function

```bash
curl -i --location --request POST \
  'https://your-project-ref.supabase.co/functions/v1/extract-nikigai-tags' \
  --header 'Authorization: Bearer your-supabase-anon-key' \
  --header 'Content-Type: application/json' \
  --data '{"response":"I love teaching kids coding"}'
```

Should return:
```json
{
  "tags": {
    "skill_verb": ["teaching"],
    "domain_topic": ["coding", "education"],
    "persona_hint": ["kids"],
    ...
  }
}
```

---

## Step 4: Install Dependencies (2 minutes)

```bash
npm install
```

Make sure you have:
- `@supabase/supabase-js` (already installed)
- React and Vite (already installed)

---

## Step 5: Test the Implementation (10 minutes)

### Option A: Use the Test Page

1. **Add Route to AppRouter.jsx:**

```javascript
import NikigaiTest from './NikigaiTest.jsx'

// In your routes:
{
  path: '/nikigai-test',
  element: <NikigaiTest />
}
```

2. **Start Dev Server:**

```bash
npm run dev
```

3. **Navigate to:** `http://localhost:5173/nikigai-test`

4. **Test the Flow:**
   - Log in first (required)
   - Answer the childhood hobbies question with 3-5 bullets
   - Click Submit
   - Answer the high school question
   - Click Submit
   - Answer the current hobbies question
   - Click Submit
   - **See clusters generate!** 🎉

### Option B: Test Services Directly (Console)

```javascript
// In browser console:

import { extractTags } from './lib/tagExtraction.js'
import { generateClusters } from './lib/clustering.js'

// Test tag extraction
const tags = await extractTags("I love teaching kids coding")
console.log(tags)
// Should show: { skill_verb: ["teaching"], domain_topic: ["coding"], ... }

// Test clustering (with sample data)
const items = [
  { text: "Teaching coding", tags: { skill_verb: ["teaching"], domain_topic: ["coding"] } },
  { text: "Mentoring students", tags: { skill_verb: ["mentoring"], domain_topic: ["education"] } },
  { text: "Building apps", tags: { skill_verb: ["building"], domain_topic: ["tech"] } }
]

const clusters = generateClusters(items)
console.log(clusters)
// Should group similar items together
```

---

## Step 6: Verify Everything Works

### ✅ Checklist

- [ ] Database tables created (7 tables)
- [ ] Edge Function deployed and responding
- [ ] Environment variables set correctly
- [ ] Test page loads without errors
- [ ] Can create a session
- [ ] Can submit a response
- [ ] Tags are extracted correctly
- [ ] Clusters generate after 3rd question
- [ ] Quality metrics appear

---

## Troubleshooting

### "Failed to invoke function"

**Problem:** Edge Function not deployed or secrets not set

**Fix:**
```bash
supabase functions deploy extract-nikigai-tags
supabase secrets set ANTHROPIC_API_KEY=your-key
```

### "Missing Supabase environment variables"

**Problem:** `.env.local` not loaded

**Fix:**
- Restart dev server (`npm run dev`)
- Check file is named `.env.local` (not `.env`)
- Verify variables start with `VITE_`

### "User not authenticated"

**Problem:** Not logged in

**Fix:**
- Log in first through your auth flow
- Check `supabase.auth.getUser()` returns a user

### "No tags extracted"

**Problem:** Edge Function failing or Claude API key invalid

**Fix:**
- Check Claude API key at console.anthropic.com
- Check Edge Function logs in Supabase Dashboard
- Verify secrets: `supabase secrets list`

### Clusters look weird

**Problem:** Not enough data or poor quality responses

**Fix:**
- Make sure you answer all 3 questions before clustering
- Provide 3-5 bullet points per question
- Use descriptive responses (not just single words)

---

## Next Steps

Once everything works:

1. **Complete the Flow:**
   - Add remaining questions from `Nikigai Question Flow v2.2.json`
   - Implement all 7 clustering checkpoints
   - Add cluster refinement interface

2. **Enhance the UI:**
   - Replace test page with beautiful design
   - Add Alfred's conversational voice
   - Implement progress tracking

3. **Build Library of Answers:**
   - Create page to display `library_display_cache`
   - Add filtering and search
   - Enable export functionality

4. **Production Readiness:**
   - Add error handling
   - Implement retry logic
   - Add loading states
   - Enable analytics tracking

---

## File Structure

```
/home/user/findmyflow/
├── src/
│   ├── lib/
│   │   ├── tagExtraction.js       ✅ NEW - AI tag extraction
│   │   ├── weighting.js           ✅ NEW - Tag weighting calculations
│   │   ├── clustering.js          ✅ NEW - Clustering algorithm
│   │   └── supabaseClient.js      (existing)
│   ├── NikigaiTest.jsx            ✅ NEW - Test page
│   └── ...
├── supabase/
│   ├── functions/
│   │   └── extract-nikigai-tags/
│   │       └── index.ts           ✅ NEW - Edge Function
│   └── migrations/
│       ├── create_nikigai_schema.sql  ✅ (already created)
│       └── README.md                  ✅ (already created)
├── docs/
│   ├── nikigai-*.md               ✅ (all specs created)
│   └── ...
├── .env.local                     ⚠️ ADD ANTHROPIC_API_KEY
└── NIKIGAI_SETUP.md               ✅ This file
```

---

## Cost Estimates

### Claude API Usage

**Per user session (complete flow):**
- ~15 questions
- ~5 tag extraction calls per question
- ~75 API calls total
- ~500 input tokens per call
- ~100 output tokens per call

**Cost:** ~$0.08 per complete session

**Free tier:** $5 credit = ~60 complete sessions

### Supabase

- Free tier: 500MB database, 2GB bandwidth
- Edge Functions: 500K invocations/month free
- Should be plenty for testing!

---

## Support

If you get stuck:

1. Check Supabase logs: Dashboard → Edge Functions → Logs
2. Check browser console for errors
3. Verify Edge Function is active and responding
4. Test Claude API key at console.anthropic.com

---

**You're ready to test! 🚀**

Start with: `npm run dev` → Navigate to `/nikigai-test`
