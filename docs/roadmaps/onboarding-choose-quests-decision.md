# Decision: Choose Quests in Onboarding Flow

**Status:** Pending
**Date:** 2026-11-17
**Context:** Voice stems onboarding flow (`/try/onboarding`)

## Current Flow
Paid filter → Signup gate → Download app

## Proposed Flow
Paid filter → Signup gate → **Choose quests (in browser)** → Download app

## Why
- "Your quests are ready" is a stronger download hook than "find paths in the app"
- User arrives in app with quests already created, reducing first-session friction
- Choose quests uses their dome ratings (fun/hobby/path) which are saved at signup

## Open Questions

1. **Build in onboarding or redirect to app?**
   - Option A: Build ChooseQuestsFlow into the `/try/onboarding` route (standalone, works pre-download)
   - Option B: After signup, redirect to `/choose-quests` in the web app (already built, needs auth)
   - Option B is faster but means they're suddenly "in the app" before downloading

2. **What if they're on mobile?**
   - Option A works in any browser
   - Option B lands them in the PWA, which may be confusing before they've downloaded the native app

3. **Scope of ChooseQuestsFlow**
   - Full version: dome → AI suggests paths → pick paths → path definition (3 screens per path)
   - Light version: just show fun+path activities grouped by branch, pick 1-3 as quests
   - Full version is ~15 min extra. Light version is ~2 min.

## Recommendation
Option A (light version in browser) — show their path activities grouped by branch, let them pick 1-3 as quests, save to Supabase. Fast, clean, strong download hook. Full path definition can happen in-app.

## Dependencies
- Stage 5+6 results (fun/path/hobby) must be saved before this screen
- User must be authenticated (signup gate handles this)
- Quests table write needs user_id
