# Session Handoff — June 16-17, 2026

## What Was Built

### Creator Portal Deployment
- **Vercel project `viberise-creator`** deployed at `create.nichuzz.com`
- Build command: `npm run build:creator`, output: `dist-creator/`
- Env vars: `VITE_APP_MODE=creator`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- `CreatorLogin.jsx` — separate login page for creator PWA (email/password + magic link)
- `CreateGate.jsx` — added "Already a member? Sign in" button for PWA users
- Title: "Vibe Rise — Where Experience Creators Grow" (creator build only)
- Bottom toolbar shows on `/create/experiences`, `/create/growth`, `/create/profile`

### Instagram Integration
- **3 DB tables**: `user_integrations`, `instagram_metrics`, `instagram_posts` (migration applied)
- **3 edge functions deployed**: `connect-instagram`, `instagram-callback`, `fetch-instagram`
- **Composio setup**: API key `ak_SGs-o0n8pHmKmEeOocA-` (Supabase secret), auth config `ac_oVxkacixGr3u`
- **Connection live**: @_huzz connected, data flowing (7 posts, 2 days of reach metrics)
- `InstagramConnect.jsx` — connect/status/refresh card on Growth tab
- `InstagramPostSelector.jsx` — bottom sheet to tag posts to experiences (on Attract node)
- `BrandPulseCard.jsx` — composite brand growth metric (reach 50%, engagement 30%, follower growth 20%)
- `useBrandPulse.js` — hook calculating score from `instagram_metrics`

**Known issues with Instagram:**
- Only `reach` metric supports daily time_series. All other metrics (views, likes, etc.) use `total_value` (single total for period, stored on today's row only)
- Instagram API only returns insights data from after connection was authorized — no historical reach data before Jun 17
- Brand Pulse shows "Declining" with only 2 data points — will stabilize with more daily data
- `instagram-callback` redirect doesn't work (Composio shows its own success page instead of redirecting). User connection was activated manually in DB. Needs fixing for other users.
- Daily cron not yet set up — data only syncs on manual Refresh

### Roots × Reach Gamification (V1)
- `useRootScore.js` — 5 binary infrastructure checks, returns 0-5
- `useReachScore.js` — 10 rolling 7-day activity checks, returns 0-10
- `RootReachCard.jsx` + `RootReachCard.css` — card on Growth tab showing both scores
- Incomplete items show `→` arrows linking to where the action can be done
- Prescription card shows plain-language "next move" for lowest Root gap
- **Gamification spec**: `docs/creator-gamification-spec.md` (3 LLM Council rounds)
- **V1 plan**: `docs/creator-gamification-v1-plan.md`

**Root checks:**
1. Blow Up Brand → `remarkable_angles` exists
2. Leads Strategy → `flow_sessions` type='leads_strategy'
3. Lead Magnet → `flow_sessions` type='attraction_offer' OR `products` tier='attraction'
4. Offer → `products` with `money_model_tier`
5. Contacts → `crm_contacts` count >= 10

**Reach checks (rolling 7 days):**
content_history, experience_checklist_items, crm_contacts outreach, groan_challenges, experiences delivered, execute_tasks, contact_experiences, three_percent_note, pipeline_metrics, instagram_posts

### Electron Creator Mode
- `electron:build` now uses `VITE_APP_MODE=creator` + `dist-creator/`
- App ID: `com.nichuzz.viberise.creator`, DMG: `Vibe-Rise-Creator-mac-{arch}.dmg`
- Terminal tab in bottom toolbar (desktop only via `isElectron` check)
- `/create/terminal` route wired to AIPortal

### AI Build Engine Setup (ported from claude-portal)
- `server/lib/detect-tools.cjs` — detects Node, Claude Code, Vercel CLI
- `server/lib/install-tools.cjs` — one-click npm install with sudo avoidance
- `server/lib/fix-npm-prefix.cjs` — Mac npm prefix fix
- `SetupWizard.jsx` + `useBuildEngine()` hook
- 6 new API routes in `terminal-server.cjs`
- **Spec**: `docs/ai-build-engine-spec.md`

### Spec Docs Written
- `docs/creator-app-distribution-strategy.md` — IAP avoidance (3.1.3(f)), PWA, Electron, Mac App Store
- `docs/instagram-integration-spec.md` — Full Instagram integration spec
- `docs/instagram-implementation-plan.md` — Implementation plan
- `docs/creator-gamification-spec.md` — Roots × Reach equation, 3 council rounds
- `docs/creator-gamification-v1-plan.md` — V1 build plan
- `docs/ai-build-engine-spec.md` — AI Build Engine with prompt templates
- `docs/brand-pulse-post-tagging-spec.md` — Post gallery tagging (NEW, not built)

## What Needs Doing Next (Priority Order)

### Immediate Fixes
1. **Instagram callback redirect** — Composio redirects to its own page, not our callback. `instagram-callback` edge function never fires. Need to investigate Composio's redirect_url behavior or use a webhook instead.
2. **Auto-complete past experiences** — Experiences with dates 7+ days in the past should auto-move to `status='completed'`. Currently manual. The Tuk Tuk Tournament from May 30 still shows as "Upcoming". Either cron or client-side check on load.
3. **Daily Instagram cron** — Set up pg_cron to call `fetch-instagram` daily. Pattern exists in `supabase/migrations/Sql commands/setup_league_auto_scoring.sql`.
4. **Reach item links point to /crm routes** — Several Reach breakdown items in `useReachScore.js` link to `/crm/*` routes which are NOT accessible from the creator portal. Review each and either bring those CRM pages into `/create/*` routes or build creator-native equivalents. Current links that need fixing:
   - `content` → `/crm/content-create` (CRM content generator)
   - `outreach` → `/crm/warm-outreach` (CRM warm outreach)
   - `tasks` → `/crm/execute` (CRM execute system)
   - `contacts_added` → `/crm/contacts` (CRM contacts)

### Ready to Build
4. **Brand Pulse post tagging** — Tap Brand Pulse → post gallery → tag as experience/brand building. Spec at `docs/brand-pulse-post-tagging-spec.md`. ~3-4 hours.
5. **Frontend design review** — RootReachCard and BrandPulseCard need proper design review via `/frontend-design` skill. Current design is functional but not polished.

### V2 Gamification
6. **Root Maintenance layer** — Unlocks when Foundation >= 3. Per-item decay schedules. See gamification spec.
7. **Root→Node diagnostics** — Link Root gaps to pipeline nodes with plain-language prescriptions.
8. **3% Chain integration** — Surface the chain as the momentum signal, not replace it.

### AI Build Engine
9. **Lead Magnet Builder** — First ⚡ flow. Frontend questions → prompt template → Claude Code in terminal.
10. **Landing Page Builder** — Second ⚡ flow.
11. **Content Batch Creator** — Could work via edge function (no terminal needed).

## Key Data

| Item | Value |
|------|-------|
| Supabase project | qlwfcfypnoptsocdpxuv |
| Consumer Vercel | findmyflow → viberise.nichuzz.com |
| Creator Vercel | viberise-creator → create.nichuzz.com |
| Composio API key | ak_SGs-o0n8pHmKmEeOocA- (Supabase secret) |
| Composio auth config | ac_oVxkacixGr3u (Instagram) |
| Composio connection | ca_24fPWMZvMAyP (@_huzz) |
| Your user ID | ebe69854-2ebd-4236-a437-3a362f5e1af4 |
| Instagram IG ID | 34856592823989391 |

## Commits This Session
```
d9bbadd fix: add sign-in button to CreateGate for PWA users
08961af feat: creator-specific login page + title for creator portal PWA
8b3e11b fix: show bottom toolbar on /create/experiences, /create/growth, /create/profile
9e2caf5 fix: connect-instagram falls back to toolkit default
e1e0697 fix: connect-instagram uses correct Composio v3.1 API format
8e444b3 feat: redesign RootReachCard — rename to Roots, proper CSS, premium feel
78158cc fix: fetch-instagram passes entity_id to Composio v3.1 API
7844e73 fix: fetch-instagram pulls 14 days of daily time-series metrics
bd16442 fix: lower Brand Pulse minimum data threshold from 7 to 2 days
02c9a4d fix: fetch-instagram pulls max data — 28 days metrics, 90 days posts
d7b0c30 fix: use time_series for reach only, total_value for all other metrics
0362c31 fix: Refresh button passes initial_sync=true for full data pull
4f750d2 feat: tappable arrows on incomplete Roots/Reach items
```
Plus earlier commits: Instagram integration, gamification, Electron, AI Build Engine, spec docs.
