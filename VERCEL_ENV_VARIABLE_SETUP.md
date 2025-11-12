# Vercel Environment Variable Setup

## 📋 Required Environment Variables

Your findmyflow app needs these environment variables in Vercel:

| Variable | Required | Purpose |
|----------|----------|---------|
| `VITE_SUPABASE_URL` | ✅ Yes | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | ✅ Yes | Your Supabase anonymous key |
| `VITE_MAGIC_LINK_REDIRECT` | ✅ Yes | Magic link redirect URL |
| `VITE_ANTHROPIC_API_KEY` | ⚠️ Optional | Claude AI for nervous system flow (highly recommended) |

---

## Where to Set Environment Variables

### **Step-by-Step Instructions:**

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Sign in to your account

2. **Select Your Project**
   - Find your project (likely named "findmyflow" or similar)
   - Click on the project name

3. **Navigate to Settings**
   - Click **Settings** in the top navigation
   - Click **Environment Variables** in the left sidebar

4. **Add All Required Variables**

   Add each variable one by one:

   **a) Supabase URL:**
   - Click **Add New** button
   - **Key:** `VITE_SUPABASE_URL`
   - **Value:** Your Supabase URL (e.g., `https://xxxxx.supabase.co`)
   - **Environments:** Select **Production, Preview, Development**
   - Click **Save**

   **b) Supabase Anon Key:**
   - Click **Add New** button
   - **Key:** `VITE_SUPABASE_ANON_KEY`
   - **Value:** Your Supabase anon/public key
   - **Environments:** Select **Production, Preview, Development**
   - Click **Save**

   **c) Magic Link Redirect:**
   - Click **Add New** button
   - **Key:** `VITE_MAGIC_LINK_REDIRECT`
   - **Value:** `https://findmyflow.nichuzz.com` (or your production domain)
   - **Environments:** Select **Production** (and optionally **Preview**)
   - Click **Save**

   **d) Anthropic API Key (Optional but Recommended):**
   - Click **Add New** button
   - **Key:** `VITE_ANTHROPIC_API_KEY`
   - **Value:** Your Anthropic API key (starts with `sk-ant-`)
   - **Environments:** Select **Production, Preview, Development**
   - Click **Save**

5. **Redeploy (Important!)**
   - After adding the environment variable, you need to trigger a new deployment
   - Go to **Deployments** tab
   - Click the **⋯** (three dots) on the latest deployment
   - Click **Redeploy**
   - Or push a new commit to trigger automatic deployment

---

## ⚠️ Important Notes

### Supabase Credentials:
- Get these from: https://supabase.com/dashboard → Your Project → Settings → API
- The anon key is safe to expose in the browser (protected by Row Level Security)

### Magic Link Redirect:
- **No `/me` path needed** - The code automatically appends `/me` to the domain
- **Check domain** - Make sure the domain matches your production domain exactly

### Anthropic API Key:
- **Optional but highly recommended** - Enables AI-powered pattern mirroring in nervous system flow
- Without it, the flow uses conditional logic fallback (still works, but less accurate)
- Get your key from: https://console.anthropic.com/settings/keys
- **Cost:** ~$0.0014 per user (very affordable!)
- The key is exposed in the browser, but that's okay - you should set usage limits in Anthropic console

### General:
- **Redeploy required** - Environment variables are only available after redeployment
- **All environments** - Add variables to Production, Preview, and Development for consistency

---

## Verification

After redeploying:
1. **Check deployment logs** to confirm all environment variables are available
2. **Test Supabase connection** - Try signing up/logging in
3. **Test magic link flow** - Verify redirect goes to correct domain
4. **Test nervous system flow** (if Anthropic key added):
   - Go through the flow
   - Complete the triage tests
   - Check if pattern mirroring gives personalized, accurate reflection
   - If it's generic, check browser console for API errors

### How to Check if AI is Working:
- **With AI:** Pattern reflection will be deeply personalized, mention specific fears you tested, use empathetic language
- **Without AI (fallback):** Pattern reflection will be more generic, template-based
- Check browser console (F12) for: `"VITE_ANTHROPIC_API_KEY not configured"` message

---

## 🔗 Quick Links

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Environment Variables:** https://vercel.com/dashboard → Your Project → Settings → Environment Variables
- **Supabase Dashboard:** https://supabase.com/dashboard
- **Anthropic Console:** https://console.anthropic.com/settings/keys

---

## 🆘 Troubleshooting

**Problem:** Supabase connection fails
- ✅ Double-check URL and anon key are correct
- ✅ Ensure RLS policies are set up in Supabase
- ✅ Redeploy after adding variables

**Problem:** Magic link redirect goes to wrong URL
- ✅ Check `VITE_MAGIC_LINK_REDIRECT` matches your production domain exactly
- ✅ No trailing slash
- ✅ Use `https://` not `http://`

**Problem:** AI pattern mirror not working
- ✅ Check if `VITE_ANTHROPIC_API_KEY` is added in Vercel
- ✅ Verify API key is valid in Anthropic console
- ✅ Check browser console for error messages
- ✅ Fallback logic should still work (just less personalized)

**Problem:** Variables not showing up
- ✅ You must redeploy after adding environment variables
- ✅ Clear browser cache
- ✅ Check you're on the latest deployment

