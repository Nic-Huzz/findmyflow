# Stripe Paywall + Business Tab Restructure + Onboarding Simplification

**Date:** 2026-02-28
**Status:** Approved Design
**Relates to:** Priority Hierarchy items #7-9

---

## Overview

Three interconnected changes:
1. **Simplify onboarding** — all users follow the same path: Q1-Q2-Q3 → Mind Space → /me
2. **Restructure Business tab** — add Setup stage tab before Validation, move Quick Capture there
3. **Stripe paywall** — gate Business quests (except explainers + Attraction Offer) behind payment

---

## 1. Simplified Onboarding Flow

### New Flow (All Users)

```
Sign Up → Archetype Reveal
    ↓
Q1: Journey Stage (employed/self-employed)
Q2: Wealth Ladder (service/productized/products)
Q3: Primary Goal
    ↓
Persona Reveal (Vibe Seeker / Vibe Riser / Movement Maker)
    ↓
Mind Space (ALL users — paste AI conversation, extract skills/problems/personas)
    ↓
Combination Selection:
  • Vibe Seeker: "Which combination sounds most exciting?"
  • Vibe Riser/MM: "Which combination most aligns with your current business?"
    ↓
→ /me page
```

### What Changes

| Before | After |
|--------|-------|
| Vibe Seekers → Mind Space | ALL users → Mind Space |
| Vibe Risers/MM → Quick Capture (wheels + products) | Quick Capture moves to Business Setup tab |
| ExistingProjectFlow branching | Removed from onboarding |
| 4 different onboarding paths | 1 universal path |

### What Stays
- Q1-Q2-Q3 persona questions
- Persona reveal screen
- Mind Space flow
- `user_stage_progress` save (persona, employment_status, wealth_ladder, primary_goal)
- Mind Space results saved to `nikigai_clusters`

### Mind Space Enhancement
After Mind Space extraction, add a persona-aware combination selection step:
- **Vibe Seeker:** "Which combination sounds most exciting?" (discovery-oriented)
- **Vibe Riser / Movement Maker:** "Which combination most aligns with your current business?" (anchored to reality)
- Selected combination stored as primary cluster selection

---

## 2. Business Tab Restructure

### New Stage Tab Layout

```
Business Tab:
[Setup] → [Validation] → [Product] → [Testing] → [Money Models] → [Grand Slam] → [Campaign] → [Launch] → [CRM]
```

### Setup Tab (New — Before Validation)

- **Stage ID:** 0.9 (between Groans 0.5 and Validation 1)
- **Always accessible:** Yes (on Business tab)
- **Free:** Yes (no Stripe gate)
- **Icon:** ⚙️ or 🏗️
- **Colour:** #5e17eb (brand purple)

**Contents:**
- Welcome message: "Set up your business project to unlock the stages"
- Quick Capture wheels (skills/problems/personas) — pre-populated from Mind Space data
- Product capture (name, description, type, stage)
- On completion: creates `user_project`, unlocks Stage 1 tab

**Behaviours:**
- Required before any Stage 1-7 content is accessible
- Shows checkmark once complete
- Returning users with existing projects see it as completed
- Pre-fills wheel segments from Mind Space `nikigai_clusters` data

### Stage 8 → CRM Link

**Archive these quests:**
- `three_percent_better` ("3% Better")
- `funnel_calculator` ("Funnel Calculator")
- `weekly_funnel_update` ("Weekly Funnel Update")

**New Stage 8 behaviour:**
- Tab still shows as "Tracking" with 📊 icon and gold colour (#E9A23B)
- Clicking it shows a single CRM link card: "Click Here For FindMyFlow CRM" → `/crm`
- No quests, no sub-tabs, no artifact progress
- Still `alwaysAccessible: true`

---

## 3. Free vs Paid Quest Gating

### Free Tier (No Payment Required)

| Location | Free Content |
|----------|-------------|
| Flow Finder (Stage 0) | All quests — 100% free gateway |
| Play-list (Stage 0.5) | All quests — unaffected |
| Healing | All quests — unaffected |
| Business Setup | Full setup flow |
| Stage 1: Validation | "Understand Validation" explainer only |
| Stage 2: Product Creation | "Understand Product Creation" explainer only |
| Stage 3: Testing | "Understand Testing" explainer only |
| Stage 4: Money Models | "Understand Money Models" + "Attraction Offer Assessment" |
| Stage 5: Offer Creation | "Understand Offer Creation" explainer only |
| Stage 6: Campaign | "Understand Campaign Creation" explainer only |
| Stage 7: Launch | "Understand Launch" explainer only |
| Stage 8: Tracking | CRM link (no quests) |

### Paid Tier (Stripe Required)

Every other Business quest in Stages 1-7.

### Gating Logic

```javascript
// In subscriptionService.js
function isPaidQuest(quest) {
  // Not a Business quest → always free
  if (quest.category !== 'Business') return false
  // Flow Finder stage → always free
  if (quest.stage_required === 0) return false
  // Explainer quests → always free
  if (quest.isExplainer) return true // wait, false
  // Attraction Offer Assessment → free
  if (quest.id === 'attraction_offer_assessment') return false
  // Everything else in Business stages 1-7 → paid
  return quest.stage_required >= 1 && quest.stage_required <= 7
}
```

### UX for Locked Quests
- Quest card visible (user can see title, description, points)
- Input/completion area replaced with UpgradePrompt overlay
- "Unlock Business Modules" button → triggers Stripe Checkout
- Locked icon on the quest card

---

## 4. Stripe Infrastructure

### Architecture: Stripe Checkout Sessions

User clicks locked quest → UpgradePrompt → Edge Function creates Checkout Session → user redirected to Stripe-hosted page → webhook updates DB → user redirected back → quests unlock.

### New Files

```
supabase/functions/create-checkout-session/index.ts
  └── Creates Stripe Checkout Session
  └── Accepts: user_id, price_id (or plan_type)
  └── Returns: checkout session URL
  └── Supports both one-time and subscription pricing

supabase/functions/stripe-webhook/index.ts
  └── Handles Stripe webhook events:
      • checkout.session.completed → create/update user_subscriptions
      • customer.subscription.updated → update status
      • customer.subscription.deleted → mark cancelled/expired
  └── Validates webhook signature with STRIPE_WEBHOOK_SECRET

src/lib/subscriptionService.js
  └── checkSubscription(userId) → { active, plan_type, expires }
  └── isPaidQuest(quest) → boolean
  └── createCheckoutSession(userId) → redirectUrl

src/hooks/useSubscription.js
  └── Wraps subscriptionService
  └── Fetches once on mount, caches in state
  └── Re-fetches on window focus (catches post-checkout return)
  └── Returns: { hasSubscription, loading, plan }

src/components/UpgradePrompt.jsx
  └── Locked quest overlay
  └── "Unlock Business Modules" button
  └── Triggers createCheckoutSession → window.location redirect
```

### Database

```sql
-- supabase/migrations/XXXXXX_add_subscriptions.sql

CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,          -- null for one-time purchases
  status TEXT NOT NULL DEFAULT 'active', -- active, cancelled, past_due, expired
  plan_type TEXT NOT NULL DEFAULT 'pro', -- flexible for future tiers
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,       -- null for lifetime/one-time
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- RLS: users can only read their own subscription
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own subscription"
  ON user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Edge functions (service role) can insert/update
CREATE POLICY "Service role can manage subscriptions"
  ON user_subscriptions FOR ALL
  USING (auth.role() = 'service_role');
```

### Environment Variables

```
# Edge Functions (Supabase secrets)
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Frontend (.env.local)
VITE_STRIPE_PUBLISHABLE_KEY=pk_...
```

### Checkout Flow

```
1. User clicks locked quest
2. UpgradePrompt shown with "Unlock Business Modules" button
3. Button calls createCheckoutSession() →
   POST /functions/v1/create-checkout-session
   Body: { user_id, return_url: window.location.href }
4. Edge function:
   a. Creates Stripe Customer (or retrieves existing)
   b. Creates Checkout Session with price_id + success/cancel URLs
   c. Returns { url: checkout_session.url }
5. Frontend redirects to Stripe Checkout
6. User completes payment on Stripe
7. Stripe sends webhook → stripe-webhook edge function
8. Edge function validates signature, upserts user_subscriptions
9. User redirected to success_url (back to challenge page)
10. useSubscription hook re-fetches → hasSubscription = true → quests unlock
```

---

## 5. Scoring Update (Separate Task)

- Remove "Business" and "Bonus" from scoring categories
- Merge "Voices" into "Healing" category
- Update `scoringCategories.js` and any leaderboard/points logic

---

## 6. Files to Modify

### Onboarding
- `src/components/HomeFirstTime.jsx` — remove Quick Capture branching, make Mind Space universal, add combination selection step
- `src/components/onboarding/QuickCapture/` — move into Business Setup tab component

### Challenge Page
- `src/lib/stageConfig.js` — add Setup stage (0.9), update Stage 8 config
- `src/components/ChallengeStageTabs.jsx` — render Setup tab, handle new stage
- `src/Challenge.jsx` — handle Setup tab rendering, integrate subscription check, Stage 8 CRM link
- `src/components/QuestCard.jsx` — add locked/paid state with UpgradePrompt
- `public/challengeQuestsUpdate.json` — archive Stage 8 quests, ensure `isExplainer` flags correct

### New Files
- `supabase/functions/create-checkout-session/index.ts`
- `supabase/functions/stripe-webhook/index.ts`
- `supabase/migrations/XXXXXX_add_subscriptions.sql`
- `src/lib/subscriptionService.js`
- `src/hooks/useSubscription.js`
- `src/components/UpgradePrompt.jsx`
- `src/components/BusinessSetup.jsx` (or similar — Setup tab content)

### Scoring (Separate)
- `src/lib/scoringCategories.js`
- Related leaderboard/points components

---

## 7. Migration Path for Existing Users

- Users who already completed Quick Capture: Business Setup tab shows as completed
- Users with existing projects: Setup tab pre-filled and marked complete
- No existing payment data to migrate (clean slate)
- Stage 8 quest completions preserved in DB but quests no longer shown

---

## Key Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Stripe integration method | Checkout Sessions | Simplest, most secure, flexible pricing |
| Pricing model | TBD (infrastructure supports both) | Build gate first, decide pricing later |
| Business Setup access | Free | Users invest before paying → better conversion |
| Onboarding simplification | Universal Mind Space path | One path for all personas, simpler code + UX |
| Stage 8 | CRM link only | Simplify, push users to CRM for tracking |
| Free quests | Explainers + Attraction Offer | Enough to see value, not enough to execute |
| Mind Space follow-up | Persona-aware combination question | Contextual without being overwhelming |
