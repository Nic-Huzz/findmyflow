# Stripe Paywall + Business Tab Restructure — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Gate Business quests behind Stripe payment, add a Setup stage tab to the Business tab, simplify onboarding to a universal Mind Space path, and update scoring categories.

**Architecture:** Supabase Edge Functions handle Stripe Checkout Session creation and webhook processing. A `user_subscriptions` table tracks payment status. Frontend `useSubscription` hook gates quest access in `QuestCard`. Business tab gets a new Setup stage (0.9) containing Quick Capture, moved from onboarding. Stage 8 becomes a CRM link.

**Tech Stack:** React 18, Supabase (PostgreSQL + Edge Functions/Deno), Stripe Checkout Sessions, Vite

**Design Doc:** `docs/plans/2026-02-28-stripe-business-tab-design.md`

---

## Task 1: Database — Add `user_subscriptions` table

**Files:**
- Create: `supabase/migrations/20260228200000_add_user_subscriptions.sql`

**Step 1: Write the migration**

```sql
-- Subscription/payment status for Stripe integration
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  plan_type TEXT NOT NULL DEFAULT 'pro',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own subscription"
  ON user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscriptions"
  ON user_subscriptions FOR ALL
  USING (auth.role() = 'service_role');
```

**Step 2: Apply migration**

Run: `npx supabase db push` or apply via Supabase dashboard.

**Step 3: Commit**

```bash
git add supabase/migrations/20260228200000_add_user_subscriptions.sql
git commit -m "feat: add user_subscriptions table for Stripe payment gating"
```

---

## Task 2: Subscription service + hook

**Files:**
- Create: `src/lib/subscriptionService.js`
- Create: `src/hooks/useSubscription.js`

**Step 1: Create `src/lib/subscriptionService.js`**

```javascript
/**
 * Subscription Service
 *
 * Checks user payment status and determines quest access.
 * Works with user_subscriptions table populated by Stripe webhook.
 */
import { supabase } from './supabaseClient'

// Quest IDs that are free without payment (in addition to all isExplainer quests)
const FREE_QUEST_IDS = [
  'attraction_offer_assessment'
]

/**
 * Check if a quest requires payment
 * @param {object} quest - Quest object from challengeQuestsUpdate.json
 * @returns {boolean} - true if quest requires active subscription
 */
export function isPaidQuest(quest) {
  if (!quest) return false
  // Non-Business quests are always free
  if (quest.category !== 'Business') return false
  // Flow Finder (stage 0) quests are always free
  if (quest.stage_required === 0) return false
  // Explainer quests are always free
  if (quest.isExplainer) return false
  // Specific whitelisted quests are free
  if (FREE_QUEST_IDS.includes(quest.id)) return false
  // Everything else in Business stages 1-7 requires payment
  return quest.stage_required >= 1 && quest.stage_required <= 7
}

/**
 * Check if user has an active subscription
 * @param {string} userId
 * @returns {Promise<{active: boolean, plan: string|null, expires: string|null}>}
 */
export async function checkSubscription(userId) {
  if (!userId) return { active: false, plan: null, expires: null }

  const { data, error } = await supabase
    .from('user_subscriptions')
    .select('status, plan_type, current_period_end')
    .eq('user_id', userId)
    .maybeSingle()

  if (error || !data) return { active: false, plan: null, expires: null }

  const isActive = data.status === 'active'
  // For subscriptions with an end date, check if still valid
  if (isActive && data.current_period_end) {
    const now = new Date()
    const end = new Date(data.current_period_end)
    if (end < now) return { active: false, plan: data.plan_type, expires: data.current_period_end }
  }

  return {
    active: isActive,
    plan: data.plan_type,
    expires: data.current_period_end
  }
}

/**
 * Create a Stripe Checkout Session via edge function
 * @param {string} userId
 * @returns {Promise<string>} - Checkout URL to redirect to
 */
export async function createCheckoutSession(userId) {
  const { data: { session } } = await supabase.auth.getSession()

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`
      },
      body: JSON.stringify({
        return_url: window.location.href
      })
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to create checkout session')
  }

  const { url } = await response.json()
  return url
}
```

**Step 2: Create `src/hooks/useSubscription.js`**

```javascript
/**
 * useSubscription — React hook for checking user payment status
 *
 * Fetches once on mount, re-fetches on window focus (catches post-checkout return).
 * Returns: { hasSubscription, loading, plan, refresh }
 */
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { checkSubscription } from '../lib/subscriptionService'

export function useSubscription() {
  const { user } = useAuth()
  const [hasSubscription, setHasSubscription] = useState(false)
  const [loading, setLoading] = useState(true)
  const [plan, setPlan] = useState(null)

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setHasSubscription(false)
      setLoading(false)
      return
    }
    setLoading(true)
    const result = await checkSubscription(user.id)
    setHasSubscription(result.active)
    setPlan(result.plan)
    setLoading(false)
  }, [user?.id])

  // Fetch on mount
  useEffect(() => {
    refresh()
  }, [refresh])

  // Re-fetch on window focus (user returning from Stripe Checkout)
  useEffect(() => {
    const handleFocus = () => refresh()
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [refresh])

  return { hasSubscription, loading, plan, refresh }
}
```

**Step 3: Commit**

```bash
git add src/lib/subscriptionService.js src/hooks/useSubscription.js
git commit -m "feat: add subscription service and useSubscription hook"
```

---

## Task 3: UpgradePrompt component

**Files:**
- Create: `src/components/UpgradePrompt.jsx`
- Create: `src/components/UpgradePrompt.css`

**Step 1: Create UpgradePrompt component**

Build a component that:
- Overlays the quest card input area when a paid quest is accessed without subscription
- Shows a lock icon, message ("Unlock Business Modules to access this quest"), and a gold CTA button
- Button calls `createCheckoutSession()` and redirects to Stripe
- Styled with brand gold (#E9A23B) button, purple lock icon, glass morphism background
- Read `docs/page-component-design-guide.md` for design tokens before styling

**Key props:**
- `onUpgrade` — callback that triggers checkout flow
- `loading` — show spinner while creating checkout session

**Step 2: Commit**

```bash
git add src/components/UpgradePrompt.jsx src/components/UpgradePrompt.css
git commit -m "feat: add UpgradePrompt component for paid quest gating"
```

---

## Task 4: Integrate subscription check into QuestCard

**Files:**
- Modify: `src/components/QuestCard.jsx`
- Modify: `src/Challenge.jsx`

**Step 1: Add `paidLocked` prop to QuestCard**

In `QuestCard.jsx` (~line 49), add new props:

```javascript
paidLocked = false,    // true if quest requires payment and user has no subscription
onUpgrade = null,      // callback to trigger Stripe checkout
```

**Step 2: Render UpgradePrompt when paidLocked**

After the quest description section (~line 148), before the input area, add:

```javascript
{paidLocked && (
  <UpgradePrompt onUpgrade={onUpgrade} />
)}
```

When `paidLocked` is true, hide the input/completion area (the existing `locked` prop handles prerequisite locking — `paidLocked` is a separate concept for payment gating).

**Step 3: Pass subscription state from Challenge.jsx**

In `Challenge.jsx`:
- Import `useSubscription` and `isPaidQuest`
- Call `useSubscription()` at the top of the component (~line 63)
- When rendering QuestCard instances, pass:

```javascript
paidLocked={isPaidQuest(quest) && !hasSubscription}
onUpgrade={handleUpgrade}
```

- Add `handleUpgrade` function that calls `createCheckoutSession(user.id)` and redirects

**Step 4: Commit**

```bash
git add src/components/QuestCard.jsx src/Challenge.jsx
git commit -m "feat: integrate payment gating into QuestCard with UpgradePrompt"
```

---

## Task 5: Stage 8 → CRM link + archive quests

**Files:**
- Modify: `public/challengeQuestsUpdate.json`
- Modify: `src/Challenge.jsx`

**Step 1: Archive Stage 8 quests**

In `challengeQuestsUpdate.json`, find the three Stage 8 quests and add `"archived": true, "archived_reason": "Stage 8 simplified to CRM link - Feb 2026"`:
- `three_percent_better` (search for this id)
- `funnel_calculator` (search for this id)
- `weekly_funnel_update` (search for this id)

**Step 2: Render CRM link for Stage 8**

In `Challenge.jsx`, in the Business tab rendering section (~line 1424), add a check: when `viewingStage === 8`, render a CRM link card instead of quest cards:

```jsx
{activeCategory === 'Business' && viewingStage === 8 && (
  <div className="crm-link-card">
    <h3>FindMyFlow CRM</h3>
    <p>Track your funnel, manage contacts, and run your business from the Command Center.</p>
    <a href="/crm" className="primary-button gold">Click Here For FindMyFlow CRM</a>
  </div>
)}
```

Style the card using existing `.quest-card` patterns + gold CTA from design guide.

**Step 3: Commit**

```bash
git add public/challengeQuestsUpdate.json src/Challenge.jsx
git commit -m "feat: simplify Stage 8 to CRM link, archive tracking quests"
```

---

## Task 6: Add Setup stage to stageConfig

**Files:**
- Modify: `src/lib/stageConfig.js`

**Step 1: Add SETUP stage constant**

In `STAGES` object (~line 17), add:

```javascript
SETUP: 0.9,
```

**Step 2: Add SETUP stage config**

In `STAGE_CONFIG` (~line 30), add between GROANS (0.5) and VALIDATION (1):

```javascript
[STAGES.SETUP]: {
  id: 0.9,
  name: 'Business Setup',
  shortName: 'Setup',
  description: 'Set up your business project to unlock the stages',
  icon: '⚙️',
  color: '#5e17eb',
  requiredFlows: [],
  milestones: [],
  groanChallenge: null,
  tabLabel: 'Setup',
  upsellPrompt: null,
  externalLink: null,
  isUserLevel: false,
  alwaysAccessible: true,
  isBusinessSetup: true  // Flag to identify this as the setup stage
},
```

**Step 3: Commit**

```bash
git add src/lib/stageConfig.js
git commit -m "feat: add Business Setup stage (0.9) to stage config"
```

---

## Task 7: BusinessSetup component

**Files:**
- Create: `src/components/BusinessSetup.jsx`
- Create: `src/components/BusinessSetup.css`

**Step 1: Create BusinessSetup component**

Build a component that wraps the existing Quick Capture flow for use inside the Business tab's Setup stage. Key requirements:

- Import and render `QuickCapture` from `src/components/onboarding/QuickCapture/`
- Pre-populate wheel segments from user's `nikigai_clusters` data (fetch from supabase on mount)
- Include product capture step (name, description, type, stage)
- On completion: create `user_project` via supabase insert, then call `onSetupComplete` callback
- Show welcome message at the top: "Set up your business project to unlock the stages"
- If user already has an active project, show "Setup Complete" state with checkmark
- Read `docs/page-component-design-guide.md` for styling tokens

**Key props:**
- `userId` — current user ID
- `onSetupComplete` — callback after project creation
- `existingProject` — if truthy, show completed state

**Step 2: Commit**

```bash
git add src/components/BusinessSetup.jsx src/components/BusinessSetup.css
git commit -m "feat: add BusinessSetup component for Setup stage tab"
```

---

## Task 8: Render Setup stage in Challenge.jsx

**Files:**
- Modify: `src/Challenge.jsx`
- Modify: `src/components/ChallengeStageTabs.jsx`

**Step 1: Update ChallengeStageTabs**

In `ChallengeStageTabs.jsx`, the Setup stage (0.9) will automatically appear via `getAllStages()` since it's in `STAGE_CONFIG`. Verify it renders correctly between Play-list and Validation. The `getTabState` function (~line 42) should handle it via the `alwaysAccessible` flag — verify this works for stage 0.9.

**Step 2: Render BusinessSetup in Challenge.jsx**

In `Challenge.jsx`, in the Business tab section (~line 1424), add a check before quest rendering:

```javascript
// Show BusinessSetup component when viewing Setup stage
if (activeCategory === 'Business' && viewingStage === 0.9) {
  return (
    <BusinessSetup
      userId={user?.id}
      existingProject={selectedProject}
      onSetupComplete={handleProjectSelected}
    />
  )
}
```

**Step 3: Gate stages 1-7 behind Setup completion**

If user has no active project (Setup not complete), stages 1-7 should show as locked in `ChallengeStageTabs`. This may already work via existing stage progression logic — verify and adjust if needed. The Setup tab should auto-select when Business tab is clicked and no project exists.

**Step 4: Commit**

```bash
git add src/Challenge.jsx src/components/ChallengeStageTabs.jsx
git commit -m "feat: render BusinessSetup in Setup stage tab, gate stages behind setup"
```

---

## Task 9: Stripe Edge Functions

**Files:**
- Create: `supabase/functions/create-checkout-session/index.ts`
- Create: `supabase/functions/stripe-webhook/index.ts`

**Step 1: Create checkout session edge function**

Reference existing edge function pattern from `supabase/functions/graduation-check/index.ts` for CORS headers and Supabase client setup.

```typescript
// supabase/functions/create-checkout-session/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-10-16' })
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) throw new Error('Unauthorized')

    const { return_url } = await req.json()

    // Find or create Stripe customer
    const { data: existingSub } = await supabase
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle()

    let customerId = existingSub?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id }
      })
      customerId = customer.id
    }

    // Create checkout session
    // TODO: Replace PRICE_ID with actual Stripe Price ID once pricing is decided
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'payment', // Change to 'subscription' for recurring
      line_items: [{
        price: Deno.env.get('STRIPE_PRICE_ID'),
        quantity: 1,
      }],
      success_url: `${return_url}?payment=success`,
      cancel_url: `${return_url}?payment=cancelled`,
      metadata: { supabase_user_id: user.id }
    })

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ message: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

**Step 2: Create webhook edge function**

```typescript
// supabase/functions/stripe-webhook/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno'

serve(async (req) => {
  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-10-16' })
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const signature = req.headers.get('stripe-signature')!
  const body = await req.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!
    )
  } catch (err) {
    return new Response(`Webhook signature verification failed: ${err.message}`, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.supabase_user_id
      if (!userId) break

      await supabase.from('user_subscriptions').upsert({
        user_id: userId,
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: session.subscription as string || null,
        status: 'active',
        plan_type: 'pro',
        current_period_start: new Date().toISOString(),
        current_period_end: session.subscription ? null : null, // Set for subscriptions via subscription.updated
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string

      const { data: sub } = await supabase
        .from('user_subscriptions')
        .select('user_id')
        .eq('stripe_customer_id', customerId)
        .maybeSingle()

      if (sub) {
        await supabase.from('user_subscriptions').update({
          status: subscription.status === 'active' ? 'active' : subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString()
        }).eq('user_id', sub.user_id)
      }
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string

      await supabase.from('user_subscriptions').update({
        status: 'expired',
        updated_at: new Date().toISOString()
      }).eq('stripe_customer_id', customerId)
      break
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

**Step 3: Commit**

```bash
git add supabase/functions/create-checkout-session/index.ts supabase/functions/stripe-webhook/index.ts
git commit -m "feat: add Stripe checkout + webhook edge functions"
```

---

## Task 10: Simplify onboarding — universal Mind Space path

**Files:**
- Modify: `src/components/HomeFirstTime.jsx`

**Step 1: Remove Quick Capture and ExistingProject branching**

In `HomeFirstTime.jsx`:

- Remove `QUICK_CAPTURE`, `PROJECT_TYPE`, `NEW_PROJECT_EXPLAINER`, `EXISTING_PROJECT` from `SCREENS` object (~line 37)
- Remove the `QuickCapture` and `ExistingProjectFlow` imports (~line 32-33)
- Modify `handleContinueAfterPersona` (~line 397): ALL paths now go to Mind Space
  - Remove the `if (pathConfig.showQuickCapture)` branch (~line 404)
  - Both Path 1 (Vibe Seeker) and Paths 2-4 should navigate to `/mind-space`

```javascript
const handleContinueAfterPersona = async () => {
  // All users go to Mind Space after persona reveal
  await Promise.all([ensureDiscoveryProject(), markOnboardingComplete()])
  navigate('/mind-space')
}
```

- Remove `handleQuickCaptureComplete` (~line 417)
- Remove `handleProjectType` (~line 386)
- Remove `handleExistingProjectComplete` (~line 478)
- Remove render cases for QUICK_CAPTURE, PROJECT_TYPE, NEW_PROJECT_EXPLAINER, EXISTING_PROJECT screens
- Keep `handleSkipToProfile` as fallback ("I'll do this later")

**Step 2: Remove the Vibe Seeker explainer screen branching**

The `VIBE_SEEKER_EXPLAINER` screen can stay but should say something like "Let's discover your flow" for ALL users, not just Vibe Seekers. Or remove it entirely and go straight to Mind Space after persona reveal.

**Step 3: Commit**

```bash
git add src/components/HomeFirstTime.jsx
git commit -m "feat: simplify onboarding to universal Mind Space path for all users"
```

---

## Task 11: Mind Space combination selection step

**Files:**
- Modify: `src/flows/MindSpace.jsx` (or wherever Mind Space results are shown)

**Step 1: Add combination selection after extraction**

After Mind Space completes its extraction and shows results, add a new step before navigating away:

- Check user's persona from `user_stage_progress`
- If Vibe Seeker: show "Which combination sounds most exciting?"
- If Vibe Riser / Movement Maker: "Which combination most aligns with your current business?"
- Display the extracted skill × problem × persona combinations as selectable cards
- On selection: save the chosen combination as the user's primary cluster selection in `nikigai_clusters` or a new `primary_combination` field
- Navigate to `/me`

**Step 2: Commit**

```bash
git add src/flows/MindSpace.jsx
git commit -m "feat: add persona-aware combination selection step to Mind Space"
```

---

## Task 12: Update scoring categories

**Files:**
- Modify: `src/lib/scoringCategories.js`

**Step 1: Update SCORING_CATEGORIES mapping**

In `scoringCategories.js` (~line 15), change:

```javascript
export const SCORING_CATEGORIES = {
  // Healing score (includes Voices now)
  'Healing': 'healing',
  'Voices': 'healing',    // Merged from courage → healing
  'Daily': 'healing',
  'Weekly': 'healing',

  // Courage score
  'Groans': 'courage',

  // Remove Business and Bonus from scoring
  // 'Business': 'business',   -- REMOVED
  // 'Bonus': 'business',      -- REMOVED
  // 'Flow Finder': 'business', -- REMOVED
  // 'Tracker': 'bonus',       -- REMOVED
}
```

**Step 2: Update CATEGORY_DISPLAY**

Remove `business` display config. Keep `healing` and `courage` only.

**Step 3: Update SCORING_CATEGORY_KEYS**

```javascript
export const SCORING_CATEGORY_KEYS = ['healing', 'courage']
```

**Step 4: Update calculateTotalScore and formatScoresForDisplay**

Remove `business_score` references. Only sum `healing_score` + `courage_score`.

**Step 5: Verify downstream usage**

Search for `business_score`, `getScoringCategory`, `SCORING_CATEGORY_KEYS` across the codebase to find any other files that need updating (likely leaderboard components, the `/me` page stats rings, etc.).

**Step 6: Commit**

```bash
git add src/lib/scoringCategories.js
git commit -m "feat: update scoring — remove Business/Bonus, merge Voices into Healing"
```

---

## Task 13: Environment setup + Stripe account

**Files:**
- Modify: `.env.local` (add Stripe keys)
- Modify: `supabase/config.toml` (if edge function config needed)
- Modify: `scripts/deploy-functions.sh` (add new functions)

**Step 1: Set up Stripe account**

- Create Stripe account at https://stripe.com (or use existing)
- Get publishable key and secret key from Stripe Dashboard → Developers → API Keys
- Create a Product + Price in Stripe Dashboard (even a placeholder — can change later)
- Get the Price ID (e.g. `price_xxx`)

**Step 2: Add environment variables**

```bash
# .env.local
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Supabase secrets (via CLI or dashboard)
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
supabase secrets set STRIPE_PRICE_ID=price_...
```

**Step 3: Set up Stripe webhook**

In Stripe Dashboard → Developers → Webhooks:
- Add endpoint: `https://qlwfcfypnoptsocdpxuv.supabase.co/functions/v1/stripe-webhook`
- Select events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
- Copy the webhook signing secret → set as `STRIPE_WEBHOOK_SECRET`

**Step 4: Add new functions to deploy script**

In `scripts/deploy-functions.sh`, add:

```bash
supabase functions deploy create-checkout-session --no-verify-jwt
supabase functions deploy stripe-webhook --no-verify-jwt
```

Note: `stripe-webhook` needs `--no-verify-jwt` because Stripe sends the request, not an authenticated user.

**Step 5: Commit**

```bash
git add scripts/deploy-functions.sh
git commit -m "feat: add Stripe edge functions to deploy script"
```

---

## Task 14: End-to-end testing

**No files to create — manual verification steps.**

**Step 1: Test subscription check (no payment)**

- Log in as a test user
- Navigate to `/7-day-challenge` → Business tab
- Verify: "Understand X" explainer quests are accessible (clickable)
- Verify: All other Business quests show UpgradePrompt overlay
- Verify: Attraction Offer Assessment is accessible (no lock)
- Verify: Stage 8 shows CRM link card, not quests

**Step 2: Test Stripe checkout flow**

- Click "Unlock Business Modules" on a locked quest
- Verify: Redirected to Stripe Checkout page
- Complete payment with test card `4242 4242 4242 4242`
- Verify: Redirected back to challenge page
- Verify: All Business quests now unlocked (no UpgradePrompt)
- Verify: `user_subscriptions` row created in database

**Step 3: Test Setup stage**

- As a new user (or user with no projects): click Business tab
- Verify: Setup tab is selected, shows BusinessSetup component
- Complete Quick Capture + product creation
- Verify: Project created, stages 1-7 now accessible

**Step 4: Test simplified onboarding**

- Sign up as a new user
- Verify: Q1 → Q2 → Q3 → Persona Reveal → Mind Space (no Quick Capture branching)
- Complete Mind Space
- Verify: Combination selection question appears (persona-aware)
- Select combination → lands on `/me`

**Step 5: Test scoring update**

- Complete a Business quest → verify NO points added to leaderboard
- Complete a Healing quest → verify points go to `healing` category
- Complete a Voices quest → verify points go to `healing` category (not courage)
- Check leaderboard displays only Healing + Courage categories

---

## Dependency Order

```
Task 1 (DB migration) — no dependencies
Task 2 (Service + hook) — depends on Task 1
Task 3 (UpgradePrompt) — no dependencies
Task 4 (QuestCard integration) — depends on Tasks 2, 3
Task 5 (Stage 8 CRM link) — no dependencies
Task 6 (stageConfig Setup) — no dependencies
Task 7 (BusinessSetup component) — depends on Task 6
Task 8 (Challenge.jsx Setup render) — depends on Tasks 6, 7
Task 9 (Stripe Edge Functions) — depends on Task 1
Task 10 (Onboarding simplify) — no dependencies
Task 11 (Mind Space combination) — depends on Task 10
Task 12 (Scoring update) — no dependencies
Task 13 (Env setup) — depends on Task 9
Task 14 (E2E testing) — depends on all above
```

**Parallelizable groups:**
- Group A: Tasks 1, 3, 5, 6, 10, 12 (all independent)
- Group B: Tasks 2, 7, 9 (depend on Group A items)
- Group C: Tasks 4, 8, 11, 13 (depend on Group B items)
- Group D: Task 14 (depends on everything)
