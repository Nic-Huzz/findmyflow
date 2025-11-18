# Vercel Environment Variable Setup

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

4. **Add New Variable**
   - Click **Add New** button
   - Fill in:
     - **Key:** `VITE_MAGIC_LINK_REDIRECT`
     - **Value:** `https://findmyflow.nichuzz.com`
     - **Environments:** Select **Production** (and optionally **Preview**)
   - Click **Save**

5. **Redeploy (Important!)**
   - After adding the environment variable, you need to trigger a new deployment
   - Go to **Deployments** tab
   - Click the **⋯** (three dots) on the latest deployment
   - Click **Redeploy**
   - Or push a new commit to trigger automatic deployment

---

## ⚠️ Important Notes

- **No `/me` path needed** - The code automatically appends `/me` to the domain
- **Redeploy required** - Environment variables are only available after redeployment
- **Check domain** - Make sure the domain matches your production domain exactly

---

## Verification

After redeploying:
1. Check the deployment logs to confirm the environment variable is available
2. Test the magic link flow on production
3. Verify the redirect goes to `https://findmyflow.nichuzz.com/me`

---

**URL:** https://vercel.com/dashboard → Your Project → Settings → Environment Variables

