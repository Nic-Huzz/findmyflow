# Creator App Deployment Checklist

## Context

We've split the Vibe Rise app into two builds from one codebase:
- **Consumer app** (`viberise.nichuzz.com`) — daily challenge, league, healing, levels
- **Creator app** (`create.nichuzz.com`) — creator portal, CRM, business tools

Both share the same GitHub repo (`Nic-Huzz/findmyflow`) and the same Supabase project (`qlwfcfypnoptsocdpxuv`). A build flag `VITE_APP_MODE` in `src/AppRouter.jsx` controls which routes are visible:
- `consumer`: `/create/*` redirects to `/league`, `/crm/*` redirects to `/me`
- `creator`: `/` redirects to `/create`, `/7-day-challenge` redirects to `/create`
- unset (local dev): all routes available

## What's Already Done

- [x] Build flag (`IS_CREATOR`/`IS_CONSUMER`) added to `src/AppRouter.jsx` (lines 501-509, 527-534)
- [x] Build scripts in `package.json`: `build:consumer`, `build:creator`, `dev:creator`
- [x] `capacitor.config.creator.json` created (`com.nichuzz.viberise.creator`)
- [x] Consumer Vercel project (`findmyflow`) has `VITE_APP_MODE=consumer` env var set for Production
- [x] Creator Vercel project (`viberise-creator`) created with env vars:
  - `VITE_APP_MODE=creator`
  - `VITE_SUPABASE_URL=https://qlwfcfypnoptsocdpxuv.supabase.co`
  - `VITE_SUPABASE_ANON_KEY` (set via CLI)
- [x] `.gitignore` updated with `dist-creator/`

## What Needs to Be Done

### 1. Connect Creator Vercel Project to GitHub

The `viberise-creator` project exists on Vercel but isn't connected to the GitHub repo yet (CLI deploy failed due to file size — needs to build on Vercel's servers instead).

1. Go to [vercel.com](https://vercel.com) → project **viberise-creator**
2. **Settings → Git** → Connect to repository `Nic-Huzz/findmyflow`
3. **Settings → General**:
   - **Build Command**: `npm run build:creator`
   - **Output Directory**: `dist-creator`
   - **Install Command**: `npm ci` (default)
   - **Node.js Version**: 22.x (match consumer project)
4. Verify env vars are set in **Settings → Environment Variables**:
   - `VITE_APP_MODE` = `creator` (Production)
   - `VITE_SUPABASE_URL` = `https://qlwfcfypnoptsocdpxuv.supabase.co` (Production)
   - `VITE_SUPABASE_ANON_KEY` = the anon key from `.env.local` (Production)
5. Click **Deploy** (or push to main to trigger auto-deploy)

### 2. Set Up Domain

1. In Vercel project **viberise-creator** → **Settings → Domains** → Add `create.nichuzz.com`
2. In DNS provider (wherever `nichuzz.com` is managed), add:
   - **Type**: CNAME
   - **Name**: `create`
   - **Value**: `cname.vercel-dns.com`
3. Wait for DNS propagation (~5 min) and SSL provisioning (~2 min)
4. Verify `create.nichuzz.com` loads the creator portal

### 3. Verify Both Deployments

After both projects are deployed:

**Consumer (`viberise.nichuzz.com`):**
- [ ] `/create` → redirects to `/league`
- [ ] `/crm` → redirects to `/me`
- [ ] `/business` → redirects to `/league`
- [ ] `/7-day-challenge` → loads normally
- [ ] `/league` → loads normally
- [ ] AI consent modal appears on first visit

**Creator (`create.nichuzz.com`):**
- [ ] `/` → redirects to `/create`
- [ ] `/create` → loads CreatorHome (Identity tab)
- [ ] `/create/experiences` → loads Experiences tab
- [ ] `/create/growth` → loads Growth tab
- [ ] `/crm` → loads CRM dashboard
- [ ] `/7-day-challenge` → redirects to `/create`
- [ ] Bottom toolbar shows: Identity | Experiences | Growth | Profile
- [ ] Login works (same Supabase auth)

### 4. PWA Setup for Creator App (Optional)

The creator app works as a PWA out of the box since the existing service worker and manifest are shared. Users can:
- **iPhone/iPad**: Open `create.nichuzz.com` in Safari → Share → Add to Home Screen
- **Desktop**: Open in Chrome → three dots → Install app
- **Android**: Open in Chrome → banner appears automatically

If the PWA manifest name shows "Vibe Rise" instead of "Vibe Rise for Creators", update `public/manifest.json` with a build-flag-aware version or create a separate `manifest.creator.json`.

### 5. Future: iOS App for Creator Portal

When ready to submit the creator app to the App Store:

1. Create `ios-creator/` directory:
   - Temporarily rename `capacitor.config.json` → `capacitor.config.consumer.json`
   - Rename `capacitor.config.creator.json` → `capacitor.config.json`
   - Run `npx cap add ios`
   - Move generated `ios/` → `ios-creator/`
   - Restore original config files
2. In `ios-creator/App/App.xcodeproj`, update:
   - `PRODUCT_BUNDLE_IDENTIFIER`: `com.nichuzz.viberise.creator`
   - App name: "Vibe Rise for Creators"
   - App icons and splash screen (dark theme branding)
3. Add `NSCameraUsageDescription` and `NSPhotoLibraryUsageDescription` to `ios-creator/App/App/Info.plist`
4. Build, archive, upload to App Store Connect as a separate app listing

## Key Files

- `src/AppRouter.jsx` — build flag + mode-specific redirects (lines 501-534)
- `package.json` — build scripts (`build:consumer`, `build:creator`, `dev:creator`)
- `capacitor.config.json` — consumer iOS shell
- `capacitor.config.creator.json` — creator iOS shell
- `docs/creator-app-restoration-guide.md` — full list of creator routes and components
