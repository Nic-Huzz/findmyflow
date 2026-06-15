# Creator App Restoration Guide

When building the separate "Vibe Rise for Creators" app, restore these routes and components that were removed from the consumer app for App Store compliance.

## What was removed (commit d2e99cd, June 2026)

### Routes removed from AppRouter.jsx
All `/create/*` and `/business/*` routes were replaced with redirects to `/league`.

Original routes to restore:
```
/create              → CreatorHome (wrapped in CreateGate + AuthGate)
/create/inspiration  → ExperienceInspiration
/create/experience/new → ExperienceCreate
/create/experience/:id → ExperienceDetail
/create/pay-rent     → PayRentFlow
/create/remarkable   → RemarkableFlow
/create/attraction-stack → ExperienceAttractionStack
/create/marketing-campaign → ExperienceMarketingCampaign
/create/scale-income → ScaleIncomeFlow
/create/plays        → StrikeDesignFlow
/create/build-app    → AppBuildDashboard
/create/build-app/prework → AppBuildPrework
/create/build-app/challenge/:number → AppBuildChallenge
/business/app        → BusinessPage
```

### CRM routes (still in AppRouter but admin-only)
All `/crm/*` routes remain in the codebase. For the creator app, these should be accessible to all subscribers, not just admins.

### Components still in codebase (not deleted)
- `src/components/CreateGate.jsx` — account-based access gate (checks user_subscriptions)
- `src/components/CreatorHome/` — Creator portal home
- `src/pages/BusinessPage.jsx` — Business stage progression
- All CRM components in `src/components/crm/`
- All CRM pages in `src/pages/crm/`
- `src/components/UpgradePrompt.jsx` — payment lock overlay (unused)

### Navigation changes to reverse
- `BottomToolbar.jsx`: Create tab was replaced with League tab. Creator app needs its own nav: Create Home, CRM, Tools, Profile
- `ProfileHub.jsx`: Create Portal admin card was removed
- `CreateGate.jsx`: "Already a Movement Maker?" hint was removed
- `subscriptionService.js`: `createCheckoutSession` and `isPaidQuest` were removed

### Shared infrastructure (same Supabase project)
- Same `auth.users` table
- Same `user_subscriptions` table (plan_type='creator' or 'pro')
- Same edge functions
- Same database — no schema changes needed

### How to set up the creator app
1. New Capacitor project with different appId (e.g., `com.nichuzz.viberise.creator`)
2. Build flag: `VITE_APP_MODE=creator` to switch routes/nav at build time
3. Creator app's `capacitor.config.json` points to `/create` or a creator-specific URL
4. New App Store listing with different bundle ID
5. Share the same Supabase project (same URL + anon key)
