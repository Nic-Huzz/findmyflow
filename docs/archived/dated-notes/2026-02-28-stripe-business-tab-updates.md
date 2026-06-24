# Stripe Paywall + Business Tab Restructure + Onboarding Simplification

**Date:** 2026-02-28
**Status:** Implementation complete, pending E2E testing + Stripe account setup
**Design Doc:** `docs/plans/2026-02-28-stripe-business-tab-design.md`
**Implementation Plan:** `docs/plans/2026-02-28-stripe-business-tab-implementation.md`

---

## Summary

Three interconnected changes shipped in a single session:

1. **Stripe payment gating** — Business quests (stages 1-7) locked behind payment, with free explainer quests visible to all
2. **Business tab restructure** — new Setup stage tab, Stage 8 simplified to CRM link
3. **Onboarding simplification** — all users follow one universal path through Mind Space

---

## 1. Stripe Payment Infrastructure

### New Files

| File | Purpose |
|------|---------|
| `supabase/migrations/20260228220000_add_user_subscriptions.sql` | `user_subscriptions` table with RLS policies |
| `src/lib/subscriptionService.js` | `isPaidQuest()`, `checkSubscription()`, `createCheckoutSession()` |
| `src/hooks/useSubscription.js` | React hook: fetches on mount, re-fetches on window focus |
| `src/components/UpgradePrompt.jsx` + `.css` | Lock overlay with "Unlock Business Modules" gold CTA |
| `supabase/functions/create-checkout-session/index.ts` | Edge function: creates Stripe Checkout Session |
| `supabase/functions/stripe-webhook/index.ts` | Edge function: handles `checkout.session.completed`, `subscription.updated`, `subscription.deleted` |

### Modified Files

| File | Change |
|------|--------|
| `src/components/QuestCard.jsx` | Added `paidLocked` and `onUpgrade` props; renders `UpgradePrompt` when locked |
| `src/Challenge.jsx` | Integrated `useSubscription` hook; passes `paidLocked` to Business QuestCards; added `handleUpgrade` function |
| `scripts/deploy-functions.sh` | Added `create-checkout-session` and `stripe-webhook` to `NO_VERIFY_JWT_FUNCTIONS` |
| `.env.local` | Added `VITE_STRIPE_PUBLISHABLE_KEY` |
| `.mcp.json` | Added Stripe MCP server config |

### Free vs Paid Gating Logic

```
FREE (no payment required):
- Flow Finder (stage 0) — all quests
- Play-list (stage 0.5) — all quests
- Healing — all quests
- Business Setup (stage 0.9) — full setup flow
- Stages 1-7 — "Understand X" explainer quests only
- Stage 4 — Attraction Offer Assessment (additionally free)
- Stage 8 — CRM link (no quests)

PAID (Stripe required):
- All other Business quests in stages 1-7
```

### Checkout Flow

```
User clicks locked quest → UpgradePrompt overlay shown
  → "Unlock Business Modules" button
  → POST /functions/v1/create-checkout-session
  → Redirect to Stripe-hosted checkout page
  → Payment completes → Stripe webhook fires
  → user_subscriptions row created (status: 'active')
  → User redirected back → useSubscription re-fetches → quests unlock
```

### Current Mode

Set to `mode: 'payment'` (one-time purchase = lifetime access). To switch to recurring subscriptions, change to `mode: 'subscription'` in `create-checkout-session/index.ts` — the webhook's `subscription.updated` and `subscription.deleted` handlers will then activate.

### Remaining Setup (Manual)

1. Create product + price in Stripe Dashboard
2. Set Supabase secrets: `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`
3. Create webhook endpoint in Stripe Dashboard pointing to `/functions/v1/stripe-webhook`
4. Deploy edge functions: `bash scripts/deploy-functions.sh`
5. Apply migrations: `supabase db push`

---

## 2. Business Tab Restructure

### New Setup Stage (0.9)

| File | Change |
|------|--------|
| `src/lib/stageConfig.js` | Added `SETUP: 0.9` to `STAGES`; added full `STAGE_CONFIG` entry with `isBusinessSetup: true`, `alwaysAccessible: true` |
| `src/components/BusinessSetup.jsx` + `.css` | New component: project name form → creates `user_project` → unlocks stages 1-7 |
| `src/Challenge.jsx` | Renders `BusinessSetup` when `viewingStage === 0.9`; auto-selects Setup tab when no project exists |
| `src/components/ChallengeStageTabs.jsx` | Handles Setup stage via existing `alwaysAccessible` logic |

**Tab layout:**
```
[Setup] → [Validation] → [Product] → [Testing] → [Money Models] → [Grand Slam] → [Campaign] → [Launch] → [Tracking]
```

- Setup tab visible only when user has no project (excluded via `excludeStages={[0, 0.5, 0.9]}` when project exists)
- On completion: creates `user_project` with `source_flow: 'business_setup'`, `current_stage: 1`

### Stage 8 → CRM Link

| File | Change |
|------|--------|
| `public/challengeQuestsUpdate.json` | Archived 3 quests: `rewire_3_percent_better`, `flow_funnel_calculator`, `flow_funnel_baseline` |
| `src/Challenge.jsx` | When `viewingStage === 8`: renders gold CRM link card instead of quest cards |

Stage 8 now shows a single card: "Click Here For FindMyFlow CRM" → `/crm`

---

## 3. Onboarding Simplification

### Modified: `src/components/HomeFirstTime.jsx`

**Before:** 4 different onboarding paths based on persona type
- Vibe Seekers → Mind Space
- Vibe Risers/Movement Makers → Quick Capture (wheels + products)
- ExistingProjectFlow branching for users with businesses

**After:** 1 universal path for all users
```
Sign Up → Q1 (Journey Stage) → Q2 (Wealth Ladder) → Q3 (Primary Goal)
  → Persona Reveal → Mind Space → /me
```

**Removed:**
- `QuickCapture` and `ExistingProjectFlow` imports
- `QUICK_CAPTURE`, `PROJECT_TYPE`, `NEW_PROJECT_EXPLAINER`, `EXISTING_PROJECT` screens
- `handleQuickCaptureComplete`, `handleProjectType`, `handleExistingProjectComplete` handlers
- ~216 lines of branching logic

Quick Capture functionality moved to Business Setup tab (see above).

---

## 4. Mind Space Combination Selection

### Modified: `src/flows/MindSpace.jsx` + `MindSpace.css`

Added a new **step 4** (flow now has 5 steps total: Copy → Paste → Review → Combine → Complete).

After the user reviews and stars their top skills/problems/personas in step 3:

1. Fetches user's persona from `user_stage_progress`
2. Shows persona-aware heading:
   - Vibe Seeker: "Which combination sounds most exciting?"
   - Vibe Riser / Movement Maker: "Which combination most aligns with your current business?"
3. Generates all skill × problem × persona triplets from starred items
4. User selects one combination (gold border highlight)
5. Saves to `nikigai_clusters` with `cluster_type: 'primary_combination'`, `cluster_stage: 'selected'`
6. Proceeds to results/completion screen

**Auto-skip:** If only 1 combination possible, auto-selects and skips to results.

### New Migration: `supabase/migrations/20260228230000_add_primary_combination_cluster_type.sql`

Adds `'primary_combination'` to `valid_cluster_type` and `'selected'` to `valid_cluster_stage` CHECK constraints on `nikigai_clusters`.

---

## 5. Scoring Categories Update

### Modified: `src/lib/scoringCategories.js`

| Before | After |
|--------|-------|
| 4 scoring buckets: healing, courage, business, bonus | 2 scoring buckets: healing, courage |
| Voices → courage | Voices → healing |
| Business/Flow Finder/Bonus/Tracker → business | Removed from scoring entirely |

- `SCORING_CATEGORY_KEYS` reduced to `['healing', 'courage']`
- `calculateTotalScore` sums only healing + courage
- `formatScoresForDisplay` only shows healing + courage
- Default fallback category changed from `'business'` to `'healing'`

---

## Bug Fixes Applied

| Bug | Fix | File |
|-----|-----|------|
| UpgradePrompt button stuck in "Loading..." permanently on success path | Added `finally { setLoading(false) }` | `UpgradePrompt.jsx` |
| Setup tab visible to users with existing projects | Added `0.9` to `excludeStages` | `Challenge.jsx` |
| `cluster_type: 'primary_combination'` violates DB CHECK constraint | Created migration to add to allowed values | `20260228230000` migration |
| `cluster_stage: 'selected'` violates DB CHECK constraint | Included in same migration | `20260228230000` migration |
| `items` field stored as object instead of array (inconsistent with existing data) | Wrapped in array `[{...}]` | `MindSpace.jsx` |
| `handleCombinationSelect` unnecessarily async | Removed `async` keyword | `MindSpace.jsx` |
| `generateCombinations` recreated on every render | Hoisted to module level as pure utility | `MindSpace.jsx` |
| Auto-save failure silently swallowed for single combinations | Added return value check + warning | `MindSpace.jsx` |
| SQL migration partial-failure risk | Wrapped in `BEGIN`/`COMMIT` transaction | `20260228230000` migration |
| Stripe mode ambiguity (one-time vs subscription) | Added detailed comment explaining lifetime access behaviour | `create-checkout-session/index.ts` |

---

## New File Inventory

```
src/lib/subscriptionService.js          — Subscription business logic
src/hooks/useSubscription.js            — React hook for payment state
src/components/UpgradePrompt.jsx        — Lock overlay component
src/components/UpgradePrompt.css        — Lock overlay styles
src/components/BusinessSetup.jsx        — Setup stage component
src/components/BusinessSetup.css        — Setup stage styles
supabase/functions/create-checkout-session/index.ts  — Stripe checkout edge function
supabase/functions/stripe-webhook/index.ts           — Stripe webhook handler
supabase/migrations/20260228220000_add_user_subscriptions.sql       — Subscriptions table
supabase/migrations/20260228230000_add_primary_combination_cluster_type.sql  — Constraint update
docs/plans/2026-02-28-stripe-business-tab-design.md        — Approved design doc
docs/plans/2026-02-28-stripe-business-tab-implementation.md — 14-task implementation plan
```

## Modified File Summary

```
src/Challenge.jsx                  — Payment gating, Setup stage, Stage 8 CRM link
src/Challenge.css                  — CRM link card + BusinessSetup styles
src/components/QuestCard.jsx       — paidLocked + onUpgrade props
src/components/ChallengeStageTabs.jsx — Setup stage tab handling
src/components/HomeFirstTime.jsx   — Simplified to universal Mind Space path
src/lib/stageConfig.js             — Added SETUP stage (0.9)
src/lib/scoringCategories.js       — Removed Business/Bonus, merged Voices→Healing
src/flows/MindSpace.jsx            — Combination selection step (5 steps total)
src/flows/MindSpace.css            — Combination card styles
public/challengeQuestsUpdate.json  — Archived Stage 8 quests
scripts/deploy-functions.sh        — Added new edge functions
.env.local                         — Added VITE_STRIPE_PUBLISHABLE_KEY
.mcp.json                          — Added Stripe MCP server
```
