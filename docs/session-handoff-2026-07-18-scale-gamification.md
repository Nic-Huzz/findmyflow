# Session Handoff: Scale Gamification + Stripe Launch (Jul 13-18)

## What was done

### Stripe Payment Flow (live, Jul 14)
- Products: Scale Setup (`prod_UsyctdcmpVwlCs`, $499 AUD) + Scale Portal (`prod_UsdZD0VH5q0wwe`, $99/mo AUD)
- Payment link: `https://buy.stripe.com/28E8wP9W42nneol6ITfIs0k`
- Promo code: `FOUNDING` (100% off both, 10 uses). Old `FOUNDING10` still active but only discounts Portal.
- Webhook (`supabase/functions/stripe-webhook/index.ts`): deployed with `--no-verify-jwt`, sends welcome email with DMG links, notifies Huzz. Scale product detection via `SCALE_PRODUCT_IDS` array.
- Claim function (`supabase/functions/claim-subscription/index.ts`): atomic claim for pay-before-signup users.
- `pending_subscriptions` table + `get_user_id_by_email` RPC applied to Supabase.
- Webhook endpoint registered in Stripe Dashboard (3 events).
- `create.nichuzz.com` domain reassigned from `claude-portal-site` to `viberise-creator` via Vercel API.
- DB constraint: `user_subscriptions` has `UNIQUE(user_id, plan_type)` composite key.
- `subscriptionService.js`: handles multiple plan rows per user, claims via edge function.
- `CreateGate.jsx`: hides toolbar when blocking, feature row CSS added.
- `CreatorLogin.jsx`: brand purple bg, app icon, gold button, `?welcome=scale` banner, "Welcome, Movement Maker" tagline.
- Landing page (`/movement-makers`): Scale rebrand, screenshots, IS THIS YOU section, 3 Secrets, Coming Soon Business Accelerator, sticky CTA. `/login` → `/log-in` redirect.
- Download popup in creator sidebar (BottomToolbar), hidden on mobile.

### Scale Gamification (built, not merged to main)
**Branch:** `feature/interior-scoreboard-sprint2`
**Score:** 140 → 260 (+120 points)

Built and committed:
- `src/lib/creatorGamification.js` — single localStorage JSON, celebration queue (3s cooldown), CreatorXP computation, level thresholds, spider graph tier calculations
- `src/components/CreatorHome/CreatorRadarChart.jsx` + `.css` — 5-6 axis radar chart on Growth tab (Impact, Consistency, Retention, Brand, Price, optional Reach)
- `src/components/CreatorHome/CreatorCelebrations.jsx` + `.css` — 14 milestone celebrations with confetti + Huzz-voiced toasts
- `src/components/CreatorHome/SectionLaunchPad.jsx` + `.css` — per-section guidance cards on all 3 tabs
- CreatorXP + 5 levels (Dreamer→Movement Maker) in hero section
- Origin story overlay (first visit, skipped on payment redirect)
- Movement Maker identity (login, portal greeting, email)
- Founding member badge (gold pill, first 50 by payment date + manual whitelist)
- Event countdown urgency (amber 14d, red 7d, pulse 3d)
- Pipeline staleness nudge (daily, binary trigger)
- Value-framed locked playbook copy in BlowUpBrandCard
- Days since last event mirror on Growth tab
- Instagram connection status lifted to CreatorHomeV2 for launch pad

### Octalysis Research
- `docs/research/octalysis-scale-portal-analysis.md` — current score 260
- `docs/research/octalysis-scale-gamification-recommendations.md` — per-CD recommendations, all decisions logged, Easy/Medium/Hard tiers with clarifying questions answered
- `docs/research/octalysis-business-builder-analysis.md` — RCT, Stardew Valley, GDT, Duolingo, Shopify analysis
- `docs/features/personal-monopoly-finder.md` — full spec (built by prior session, mounted on Identity tab)
- `docs/superpowers/plans/2026-07-16-scale-gamification-easy-tier.md` — detailed spec with architecture decisions
- `docs/superpowers/plans/2026-07-18-scale-gamification-implementation-plan.md` — impact-first timeline with Week 3 testing gate

### Monopoly Finder (built by prior session)
- `src/components/CreatorPositionCard.jsx` + `.css` — mounted on Identity tab
- `src/components/BranchInsightCard.jsx` + `.css` — branch chart + gap + frontier
- `src/hooks/useBranchScoring.js` — weighted branch scoring
- `public/data/spiralDynamicsMatrix.json` — frontier data for 10 branches

## Decisions made

- **Stripe**: subscription mode with two line items ($499 one-time + $99/mo), webhook with `--no-verify-jwt`, pending_subscriptions for pay-before-signup
- **DB constraint**: `UNIQUE(user_id, plan_type)` allows pro + creator rows per user. All `onConflict` calls must use `'user_id,plan_type'`
- **Gamification order**: impact-first (not difficulty-first). Monopoly + spider + XP before celebrations.
- **Week 3 testing gate**: mandatory. 3 real users through portal before building more features.
- **CD8 capped at 4**: Scale users are anxious about business. No punitive loss mechanics.
- **Spider graph on Growth tab** (not Identity). Branch chart on Identity tab. Different data, different purpose.
- **Launch pads framed as "Your launch pad"** not "Setup checklist" (paid users, not free trial).
- **`attendee_count` not a bug**: missing computation from `experience_attendees` table. Low attendance reframe dormant until computed. Not blocking.
- **Electron app** already serves `dist-creator/`. "Claude Portal" screen was stale build. Fix: `npm run build:creator` + repackage DMG.

## What's NOT built yet (specced + decisions confirmed)

| Feature | Spec | Days | Key decision |
|---|---|---|---|
| M1 Sequential score reveal | Implementation plan G7 | 2 | attendees→satisfaction→repeat→revenue, auto-advance |
| M3 Building streak | Implementation plan G8 | 2 | Weekly, growth tasks, forgiving |
| M5 Dynamic share card | Implementation plan G10 | 2 | SVG avatar, manual refresh, border upgrades by level |
| M6 Portfolio on Growth | Implementation plan G13 | 2 | Growth page, everything they've built |
| M8 Alt positionings | Implementation plan G9 | 2 | 3 options from generate-positioning, user picks |
| M10 Hidden achievements | Implementation plan G11 | 1 | 8 defined: Polymath, Cult Leader, Sold Out, Chain Reactor, Origin Story, Night Owl, Full Stack, Century |
| M11 Quarterly planning | Implementation plan G12 | 2 | Select from library, set dates, Experiences tab |
| M14 Community feed triggers | Implementation plan G14 | 2 | Build triggers now, UI at 5+ users |
| H1 AI Insight Drops | Implementation plan G16 | 5 | AI-generated, 5 types, needs edge function |
| H2 Zarlo for creators | Implementation plan G15 | 7 | Playful mentor, unlocks after Results, 7 triggers |
| H3 Creator profile page | Implementation plan G17 | 3 | Public, no revenue/attendees, `create.nichuzz.com/creator/[id]` |
| G19 Spider celebrations | Implementation plan G19 | 2 | Confetti on tier upgrade |

## Gotchas

- **Webhook needs `--no-verify-jwt`** when deploying to Supabase. Stripe doesn't send JWT.
- **`onConflict` must be `'user_id,plan_type'`** not `'user_id'`. Composite unique constraint.
- **`attendee_count` is NOT a column** on `experiences` table. Attendees tracked in `experience_attendees` table. Pre-existing code references `e.attendee_count` which is always undefined.
- **Celebration queue** uses module-level variables (not React state). `setTimeout` has no cleanup. React 18 handles unmount gracefully.
- **`getGamificationState()` reads localStorage every render** in the origin story check. Acceptable because it short-circuits after first dismissal.
- **Founding badge query** is a nested Supabase call. If inner `.maybeSingle()` returns null, falls back to `'1970-01-01'` which resolves correctly. Fragile but works.
- **Instagram launch pad** triggers `document.querySelector('.ig-connect-btn')?.click()`. If InstagramConnect component hasn't rendered yet (Growth tab not visited), the click targets nothing. Harmless.
- **Cherry-pick conflicts**: main and feature branches diverge on `CreatorHomeV2.jsx`, `MovementMakers.jsx`. When merging to main, expect conflicts. Take the feature branch version.

## Recommendations for next agent

1. **Do NOT merge to main yet.** User explicitly said not to. Branch has gamification + interior scoreboard work that needs user testing first.
2. **Week 3 testing gate is mandatory.** Get 3 real users through the portal. Watch what they do. Document what works/falls flat. THEN decide what to build next.
3. **Next highest-impact code feature**: M10 Hidden Achievements (1 day, 8 already defined, pure delight).
4. **Next highest-impact non-code**: Monthly Scale call + accountability pairs (0 code, CD5 boost).
5. **Deactivate old `FOUNDING10` promo code** in Stripe Dashboard (MCP can't do this).
6. **Rebuild Electron DMG** after merging to main: `npm run build:creator` then repackage. No code change needed.
7. **All feature specs are in the implementation plan.** A fresh agent can pick up any feature from the spec alone. Don't re-research, just build.
