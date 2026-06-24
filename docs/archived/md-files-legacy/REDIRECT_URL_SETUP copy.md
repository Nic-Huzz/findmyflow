# Magic Link Redirect URL Setup

## ✅ Code Updated

I've updated `src/auth/AuthProvider.jsx` to support a configurable redirect URL via environment variable.

## 🎯 Two Issues to Fix

### **Issue 1: Old Deployment at `findmyflow.nichuzz.com`**
The domain is showing an old version of your flow. You need to deploy the latest code.

### **Issue 2: Redirect URL Configuration**
You need to set which domain should receive magic links.

---

## 📋 Solution Steps

### **Step 1: Decide Your Production Domain**
What domain do you want users to land on after clicking the magic link?

**Option A:** Update `findmyflow.nichuzz.com` with new code  
**Option B:** Use a different domain (e.g., your Vercel URL)

---

### **Step 2: Deploy Latest Code**

If using `findmyflow.nichuzz.com`:
```bash
# Make sure you've committed all changes
git add .
git commit -m "Update flow and fix redirect URL"

# Push to trigger deployment (if using Vercel/GitHub integration)
git push

# Or deploy manually via Vercel CLI
vercel --prod
```

If using a different domain:
- Deploy to that domain
- Make sure it has the latest code with the new flow

---

### **Step 3: Set Environment Variable in Vercel**

1. Go to your Vercel project dashboard
2. Go to **Settings → Environment Variables**
3. Add new variable:
   - **Name:** `VITE_MAGIC_LINK_REDIRECT`
   - **Value:** `https://findmyflow.nichuzz.com` (or your production domain)
   - **Environment:** Production (and Preview if needed)

**Important:** Use just the domain (no `/me` path) - the code appends `/me` automatically

---

### **Step 4: Update Supabase Redirect URL Whitelist**

Supabase requires you to whitelist redirect URLs for security:

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Authentication → URL Configuration**
4. Under **Redirect URLs**, add:
   - `https://findmyflow.nichuzz.com/me`
   - `http://localhost:5173/me` (for local development)
   - Any other domains you use

5. Click **Save**

---

## 🔍 Testing

After deployment:

1. **Local testing:**
   - Magic links from `localhost` → redirect to `localhost/me` ✅

2. **Production testing:**
   - Access your flow from production domain
   - Complete the flow and get magic link
   - Click magic link → should redirect to `VITE_MAGIC_LINK_REDIRECT/me`
   - Should see new flow (not old one)

---

## 🚨 Current Behavior

**Right now:**
- Code uses `window.location.origin` (dynamic)
- If you access from `findmyflow.nichuzz.com` → redirects there
- That domain has old code → shows old flow ❌

**After fix:**
- Production uses `VITE_MAGIC_LINK_REDIRECT` environment variable
- Always redirects to your specified domain
- That domain has new code → shows new flow ✅

---

## 💡 Quick Fix (If Urgent)

If you need an immediate fix without deploying, you can hardcode the redirect URL temporarily:

**In `src/auth/AuthProvider.jsx` line 48, change:**
```javascript
const redirectUrl = import.meta.env.VITE_MAGIC_LINK_REDIRECT 
  ? import.meta.env.VITE_MAGIC_LINK_REDIRECT
  : `${window.location.origin}/me`
```

**To:**
```javascript
const redirectUrl = 'https://your-production-domain.com/me'  // Hardcoded for now
```

Then deploy. **But using environment variable is better long-term!**

---

## ❓ Questions to Answer

1. **What's your production domain?** (The one with the new flow)
2. **Is `findmyflow.nichuzz.com` connected to Vercel?** (Auto-deploys on push?)
3. **Do you want to update that domain or use a different one?**

Once you answer, I can help you complete the setup!

