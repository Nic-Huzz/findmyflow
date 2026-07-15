# Session Handoff: Creator Portal Launch (Jun 17 - Jul 10, 2026)

## What was done

### Email Playbook (Ship30 Reverse-Engineering)
- Scanned 65 emails from `hello@ship30for30.com` via Composio Gmail MCP
- Mapped full sequence: 3 launch cycles, cadence, email types, companion content
- Docs created:
  - `docs/content/email-sequences/start-running-experiences-email-roadmap.md` (600+ lines)
  - `docs/content/email-sequences/companion-content-checklist.md`
  - `docs/content/email-sequences/creator-portal-email-drafts.md` (10 emails)
- Obsidian: `Business/Start Running Experiences - Email Playbook.md`

### Landing Page Mockup
- `public/creator-portal-mockup.html` — full HTML mockup iterated through ~30 revisions
- Final structure: Hero → Quiz Embed → Is This You → Secrets (3 questions) → What's Inside (Movement Maker + Experience Portal side-by-side) → Proof → Pricing (two-tier: $499 Movement Maker intensive + $99/mo Experience Portal) → Story → FAQ → Email Capture → Final CTA
- NOT yet converted to React component (Phase 2 still in progress)

### Email Sequences (Code)
- 5 transactional onboarding emails drafted in `creator-portal-email-drafts.md` (days 0,1,3,7,11)
- 5 nurture emails drafted and WIRED into code:
  - `supabase/functions/enroll-email-sequence/index.ts` — added `creator_nurture` schedule
  - `supabase/functions/process-scheduled-emails/index.ts` — added 5 full HTML email templates
  - `src/flows/ExperienceCreatorFlow.jsx` — auto-enrolls after `saveTryEmail()` (fire-and-forget)
- **Edge functions need redeployment** to Supabase for emails to actually send

### Experience Creator Flow Fixes
- All 4 navigate paths → `/create` (was `/get-started` and `/me`)
- Race condition fix: `gateChecked` state in CreatorHomeV2 prevents redirect loop
- Paid users see revealed answers (revenue model pills, rule break evidence, offer data)
- `useSubscription` loading guard prevents flash of blurred content
- Missing CreateGate wrappers added on `/create/attraction-stack` and `/create/marketing-campaign`
- CreateGate now uses `checkSubscription()` from subscriptionService (checks `current_period_end`)

### Data Enrichment (all 33 DNA creators, 100% coverage)
| Dataset | File | Before | After |
|---------|------|--------|-------|
| Revenue models | `creatorEarlyRevenueModels.json` | 10/33 | 33/33 (5 model types + descriptions) |
| Remarkable analysis | `experienceCreatorRemarkableAnalysis.json` | 10/33 | 33/33 (5 triggers + 3-layer rule break) |
| Blow-up meta-patterns | `experienceCreatorDNA.json` | 0/33 | 33/33 (bridge/category/content_vehicle/portable) |
| Vehicle/Identity/Access | `experienceCreatorGrowthStrategies.json` | 0/33 | 33/33 |
| Brené Brown DNA profile | `experienceCreatorDNA.json` | missing | added (was in archived 221 but not active 33) |

### Bug Fixes (from code review sweep)
- `extreme_action` undefined check (was `!== 'no'`, now `=== 'yes' || === 'partial'`)
- `enroll-email-sequence` unknown sequence_type fallback (now returns 400)
- `.single()` → `.maybeSingle()` on public_leads lookup
- CreateGate `.catch()` on checkAccess
- `.ecf-try-saved` missing CSS rule
- Wrong data field for "Pay Rent" (`first_step` → `early_growth` → `early_revenue_model`)
- `hurrellnic@gmail.com` added to `user_subscriptions` with `plan_type: 'creator'`

## Decisions made

1. **Pricing: $499 Movement Maker intensive + $99/mo Experience Portal** — Council recommended $500 one-time for founding cohort, not $99/mo subscription. The intensive IS the product; the portal is the retention mechanism. Ship30 model: bootcamp sells transformation, membership retains habit.

2. **"Apply" not "Buy"** — Council unanimously said replace purchase CTA with "Apply for Founding Member Spot" (Calendly/Typeform). Invoice manually for first 10. Removes Stripe as launch blocker.

3. **Product naming: "Movement Maker" (intensive) + "Experience Portal" (tools)** — Split maps to 4 phases: Setup + Pre-Event = Movement Maker, Deliver + Grow = Experience Portal.

4. **Section 2 display: single "Rule Break" statement** — Council + user feedback: 4 trigger tags (Rule Break, Unexpected Combo, etc) are jargon. Single `rule_broken.evidence` with "Rule Break" label is clearer.

5. **Philosophy reframe: "Everyone believed X. They proved Y."** — Original phrasing was ambiguous about whose belief it stated.

6. **Quiz as hero position** — Experience Creator quiz embed moved to position 2 (after hero, before "Is This You"). Same pattern as /movement-makers page.

7. **Lead magnet funnel: /try/experience-creators → 5 nurture emails → /create** — Quiz captures email but previously went nowhere. Now auto-enrolls in `creator_nurture` sequence.

## In progress / next steps

### Not done (priority order):
1. **React landing page conversion** — `public/creator-portal-mockup.html` needs converting to `src/pages/CreatorPortalLanding.jsx` + route at `/creator-portal`. Plan exists at `/Users/nichuzz/.claude/plans/melodic-bubbling-cocke.md`.
2. **Stripe subscription wiring** — 2 file changes in `create-checkout-session` + `stripe-webhook`. Blocked on user creating Stripe Price in dashboard.
3. **Edge function deployment** — `enroll-email-sequence` and `process-scheduled-emails` need deploying for emails to actually send: `npx supabase functions deploy enroll-email-sequence --project-ref qlwfcfypnoptsocdpxuv` and same for `process-scheduled-emails`.
4. **Rule break 3-layer UI** — Data exists (philosophy/product/marketing) but no UI displays it yet. Could replace current Section 2 display.
5. **Vehicle/Identity/Access UI** — Data exists in growthStrategies but no UI displays it.

### Uncommitted changes on disk:
Many modified files from other parallel sessions (pipeline, LifePathMap, QuestBoardCard, CEODashboard, etc). These are NOT from this session. Our session's changes are all committed and pushed to main.

## Gotchas discovered

1. **`experienceCreatorDNA.json` was trimmed from 221 → 32 in a prior session** but the supporting data files (Growth, Offers, Remarkable) still had 33 entries including Brené Brown. This caused orphaned data and missing profiles. Fixed by adding her back.

2. **`creatorEarlyRevenueModels.json` exists separately from `experienceCreatorGrowthStrategies.json`** — both have "how they paid rent" data but in different formats. The PayRentFlow uses the revenue file; the ExperienceCreatorFlow result page was incorrectly using the growth file's `early_growth` field (biographical narrative) instead of `early_revenue_model` (actual income source).

3. **`r?.extreme_action?.present !== 'no'` evaluates to true when `r` is undefined** — `undefined !== 'no'` is `true` in JavaScript. Caused crash for creators not in remarkable data.

4. **CreatorHomeV2 has a gate that redirects to `/experience-creators` if no `creatorSelection` exists.** This creates a race condition when navigating from the flow: data isn't fetched yet, gate fires, bounces back. Fixed with `gateChecked` state but fragile.

5. **Branch confusion**: work was sometimes on `light-portal` branch instead of `main`. Multiple merge-then-push sequences needed.

6. **Stripe subscriptions require credit card even with trial_period_days.** Cannot claim "no credit card required" on the landing page.

## Recommendations

1. **DM 10 experience creators this week with the $499 Movement Maker offer.** The council was unanimous: the page doesn't convert people, conversations do. The page's only job is to start conversations. Close 3 founders through DM before optimizing anything else.

2. **Deploy the edge functions** so the email nurture sequence actually fires when someone takes the quiz. Currently wired in code but functions aren't deployed.

3. **Record a 60-second Loom video** for the landing page hero. The council and best-practice research both said this would do more for conversion than any copy change.

4. **Convert mockup to React** only after you have 3 founding members. The HTML mockup works for sharing via DM. Don't over-engineer before validating demand.

5. **Add the vehicle/identity/access data to the creator results page** as a future enhancement. The data is ready, just needs UI.
