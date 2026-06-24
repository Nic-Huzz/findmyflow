# Session Handoff — June 16, 2026

## What Was Built This Session (May 16 – June 16)

### Vibe Rise Movement + Business Model
- Full pitch story at `/creations/worldtour/pitch-story.md` — kid→school→flat years→crack→equation→4 layers→flywheel→Branson/Mateschitz→ask
- Business model at `/creations/worldtour/business-model.md` — 4-layer stack with projections
- Europe monument tour plan at `/creations/worldtour/CLAUDE.md` — itinerary, laws, sponsors, headset logistics
- Wellness positioning guide at `/creations/worldtour/wellness-positioning.md`
- Slide deck prompt at `/creations/worldtour/slide-prompt.md` (paste into Claude Desktop to generate HTML deck)
- Council review completed (5 advisors + peer review + chairman synthesis)
- Obsidian vault updated with 4-layer business model

### The Four-Layer Model
```
Layer 0: Events (free brand stunts + paid workshops — acquisition, not a product)
Layer 1: App ($14.99/mo, 14-day trial — NRC model for personal growth)
Layer 2: Creator Platform ($97/mo — early GHL for experience creators)
Layer 3: Hardware (headsets, 56% margin — yoga mat industry for wellness)
Layer 4: Certification ($3-5K — 9D Breathwork model, but broader)
```

### Key Thesis Points
- **USP**: Nobody gamifies courage. Safety × Expression = experiences you love. Stack enough = life you love.
- **Post-calm market is unowned**: Headspace sells calm. We sell aliveness.
- **9D anchor**: Founded 2021, $0→$5-9M/year in 4 years, 1,300 facilitators, one modality, no app.
- **1,000 fans model**: $35-57K/year from 1,000 raving fans across all 4 layers.
- **Pitch framing**: "I can do this without you. The question is 12 months or 30 months."

### Full Rebrand: FindMyFlow → Vibe Rise
All 5 phases completed across ~50 files:
- Phase 1: Critical UI (splash, headers, PWA, meta tags)
- Phase 2: Landing pages (6 pages)
- Phase 3: Flows + components (46 files)
- Phase 4: Edge functions (11 files)
- Phase 5: Config + docs (package.json, CLAUDE.md)
- PWA icons regenerated with Vibe Rise branding
- Domain: viberise.nichuzz.com (connected in Vercel)

### Fantasy League
- Pioneers League created (active, solo mode, Wahoos/Healing/Tune categories)
- League ID: `619b440c-b929-4bda-99cf-901772fc912c`
- Old fantasy data wiped clean
- Categories realigned: Wahoos (Groans), Healing (Healing/Daily/Weekly), Tune (Tune)
- Edge function `score-league-matchups` updated to match
- Create/Join Team buttons removed (solo only)
- Tabs centered on /league page

### /me Page Updates
- Flow Journey section archived (commented out, not deleted) → replaced with Fantasy League promo card (original styled version from git history)
- Quest banner replaced with CapacityCard (Vibe Rise Score)
- CapacityCard: added `hideMaintenance` prop, `onNavigate` prop, purple CTA button
- Spacing fixed between sections

### Capacity Score Updates
- Maintenance now impacts score as dampened multiplier: `(Safety × Expression) × (0.5 + Maintenance% × 0.5)`
- All completed Wahoos count (removed scary_score >= 7 AND wahoo_score >= 7 filter)
- Score formula: Safety (0-10) × Expression (0-10) × Maintenance multiplier (0.5-1.0) = 0-100

### Creator Portal (Phase 1 + 2)
**Experience Library** (new):
- `experience_templates` table with runsheet, shift_arc, modalities, stats
- Library UI in /create Experiences tab
- 6 creator archetypes (Workshops, Live Events, Cohorts, Books/Media, Facilitation, Retreats)
- Create/archive templates, runsheet preview, "Run This" → ExperienceCreate with template pre-fill
- Manual runsheet editor ("Complete Myself" button)

**AI Journey Designer** (new):
- Select modality/audience/target shift/duration
- Calls `experience-blueprint-ai` edge function (generate_arc action)
- Generates 6-phase Shift Architecture runsheet
- Saves to template's runsheet + shift_arc fields

**Event Attendee Check-in** (new):
- `/event/:experienceId/checkin` route
- `event_checkins` table (before/after state per attendee per event)
- 4-state check-in (Shutdown/Activated/Safe/Vibe Rise)
- Shows personal shift result → CTA to /7-day-challenge

**Creator Aggregate Dashboard** (new):
- EventStateShifts component on ExperienceDetail post-event tab
- Before/after distribution bars, improvement rate, individual shifts
- Copy-able check-in URL for QR codes

### CreateGate Rebuild
- Changed from password-based to account-based (checks user_subscriptions for 'creator' or 'pro' plan)
- 3 blurred teaser sections: How Did They Pay Rent / How Did They Blow Up Their Brand / How Did They Scale Their Income
- Real creator data (Brené Brown, Wim Hof, Tony Robbins, Esther Perel, Gabby Bernstein, Jay Shetty)
- CTA: "Join the waitlist" (saves to creator_interest table)

### Experience Creator Flow Result Page
- Replaced old result screen with 3 blurred teaser sections (same format as CreateGate)
- Selected creators shown with blurred answers for Pay Rent, Blow Up Brand (Rule Break, Unexpected Combo, Extreme Action, Extreme Simplicity), Scale Income (Attraction, Core, Continuity)
- Email capture for /try/ routes, "Unlock the Answers → /create" for logged-in users

### Analytics
- 7 new event trackers added: `daily_checkin`, `wahoo_completed`, `tune_practice`, `healing_completed`, `league_joined`, `app_opened`, `event_checkin`
- Wired into: DailyCheckin, GroanCompletionModal, LeagueOverview, EventCheckin, main.jsx
- Admin dashboard (`/admin-dashboard`) new Engagement section: Opens Today, Unique Users (7d), Check-ins (7d), Wahoos (7d), League Joins, Event Check-ins
- Engagement queries moved to `admin-data` edge function (service_role bypasses RLS on events table)
- Edge function deployed

### Pre-Launch Landing Page
- `/pre-launch` route — cinematic personal letter aesthetic
- Playfair Display italic headline, DM Sans body, floating ambient orbs
- Staggered reveal animation, golden italic pull quote
- CTA → /try/essence-mirror (Essence Voice lead magnet)
- Toolbar + Zarlo hidden on this page

---

## What's NOT Done (Priority Order)

### HIGH — Do Before Onboarding Users
1. **Email sequences** — When someone signs up, NOTHING happens. Need:
   - Welcome email on signup
   - "Here's how to get started" on day 2-3
   - Win-back after 7 days of silence
   - Trial-ending email (3 days before 14-day trial expires)
   - Trial-expired recovery email

2. **Stripe subscription launch** — Infrastructure is 80% ready:
   - Need: Configure Stripe Price IDs (Pro monthly $14.99 + annual $99)
   - Need: Switch `mode: 'payment'` to `mode: 'subscription'` in create-checkout-session
   - Need: Add `trial_period_days: 14` for Pro
   - Need: Add Creator tier as separate Stripe product ($97/mo)
   - Need: Trial-ending conversion modal (3 days before expiry)
   - See business-model.md for full technical build list

3. **Edge function redeployment** — Rebranded email templates need deploying:
   - `send-archetype-profile` (email sender + CTA URLs)
   - `send-workshop-profile` (email sender + CTA URLs)
   - `validation-completion-notify` (footer)
   - `send-agent-instructions` (email + URLs)
   - `process-scheduled-emails` (FROM address)
   - `process-scheduled-newsletters` (FROM address)
   - `notify-lead-capture` (FROM address)
   - Run: `npx supabase functions deploy <function-name> --project-ref qlwfcfypnoptsocdpxuv` for each

### MEDIUM — Do Before Europe Tour (July 10)
4. **Headset order** — Need 100 units for Europe tour
   - Option A: Pitch manufacturer for sponsorship (best case $0)
   - Option B: Order from Alibaba ~$1,800-2,500 (4-7 week lead time — URGENT if not ordered yet)
   - See worldtour/CLAUDE.md headset logistics section

5. **Hostel partnerships** — Selina is #1 target for accommodation + recruitment
   - After-party angle: "we bring 50-100 people to your bar"
   - See worldtour/CLAUDE.md sponsor section

6. **Certification email** — Draft ready in pitch-story.md
   - Send to 120 festival attendees
   - Goal: 2-3 founding member sign-ups at $1,500

### LOW — Can Wait
7. **Phase 3 creator features** (Shift Architecture gating, AI 3% improvements) — for after certification launches
8. **Feedback board upgrade** (Canny or similar)
9. **Landing page at `/`** — currently still PlaySkillsOnboarding, could redirect to /pre-launch

---

## Current State of Key Systems

### Users
- 1,705 account_created events in the database (mostly from earlier testing/events)
- Pioneers League: created and active, 0 members yet
- ~10 people messaged for Layer 1 (Josh x2, Pav, Jonty, Jock, Anna, Alex, Havar, Job). Tim not yet messaged.
- Layer 2: Josh, Jock, Tim identified as creator portal targets
- Layer 3: 120 festival attendees to receive certification email

### Database
- `experience_templates` table — new, for Experience Library
- `event_checkins` table — new, for attendee before/after state tracking
- `fantasy_leagues` — Pioneers League active (619b440c-b929-4bda-99cf-901772fc912c), starts June 1 (may need date update)
- `events` table — analytics events, RLS allows INSERT for all, SELECT only for service_role
- `user_subscriptions` — used by CreateGate for account-based access

### Key File Locations
```
/creations/worldtour/
├── CLAUDE.md              — Tour planning
├── business-model.md      — 4-layer revenue model
├── pitch-story.md         — Full pitch narrative
├── wellness-positioning.md — Regulatory guide
├── slide-prompt.md        — HTML deck generator prompt

/creations/Findmyflow/
├── CLAUDE.md              — Project guide (updated for Vibe Rise)
├── src/lib/analytics.js   — Event tracking (7 new trackers)
├── src/lib/experienceTemplateService.js — Template CRUD + event check-in service
├── src/components/CreatorHome/ExperienceLibrary.jsx — Library UI
├── src/components/CreatorHome/JourneyDesigner.jsx — AI journey designer
├── src/components/EventStateShifts.jsx — Creator dashboard
├── src/pages/EventCheckin.jsx — Attendee check-in page
├── src/pages/PreLaunch.jsx — Pre-launch landing page
├── src/pages/AdminDashboard.jsx — Admin dashboard with engagement metrics
├── src/components/CreateGate.jsx — Account-based creator portal gate
├── src/hooks/useCapacityScore.js — Vibe Rise Score (Safety × Expression × Maintenance)
├── supabase/functions/admin-data/index.ts — includes get_engagement action
├── supabase/functions/score-league-matchups/index.ts — Wahoos/Healing/Tune categories
```

### Pitch Status
- Pitch story written and refined through layer-by-layer review
- Council reviewed and recommended: "Get traction first, pitch second"
- Target: friend investor + Creel (knows Richard Branson)
- Branson/Mateschitz scaling models in appendix
- Ask: TBC (originally $15-25K, to be discussed after traction)
- Key line: "I can do this without you. The question is 12 months or 30 months."

### Brand
- Everything rebranded to Vibe Rise
- Domain: viberise.nichuzz.com
- GitHub repo still: github.com/Nic-Huzz/findmyflow (not renamed)
- Folder on disk still: /creations/Findmyflow (cosmetic, not user-facing)
- Newsletter DB tag still: 'findmyflow' (DB value, not changed to avoid breaking queries)
- Some localStorage keys still use 'findmyflow' prefix (non-user-facing, left as-is)
