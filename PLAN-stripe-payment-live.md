# PLAN: Turn On Stripe Payments

**Rank: #2.** Revenue switch. The entire gating system (stages 1-7 locked, `useSubscription.js`, `UpgradePrompt.jsx`, checkout edge function, webhook) is already built. The only missing pieces are a pricing decision, a Stripe Price ID, and environment secrets. Tiny effort, direct revenue.

## Goal

A user hits an UpgradePrompt, pays via Stripe Checkout, and `user_subscriptions` unlocks stages 1-7 for them — verified end-to-end in test mode, then flipped to live.

## Current state (verified 2026-07-08)

- `supabase/functions/create-checkout-session/index.ts` — complete except line 52: `TODO: Replace STRIPE_PRICE_ID with actual Stripe Price ID once pricing is decided`. Uses `mode: 'payment'` (one-time = lifetime access; no expiry check runs). Reads `Deno.env.get('STRIPE_PRICE_ID')`.
- `supabase/functions/stripe-webhook/` — exists; subscription.updated/deleted handlers are dormant by design while mode is one-time payment (see code comment).
- `src/hooks/useSubscription.js`, `src/components/UpgradePrompt.jsx` — client side done.
- DB table: `user_subscriptions` (stores `stripe_customer_id`).

## Steps (in order)

1. **Pricing decision (HUMAN INPUT REQUIRED — ask Nic, do not guess).** Confirm: price amount, currency (likely AUD or USD), and one-time vs recurring. Everything below assumes one-time (current code). If Nic wants recurring, follow the code comment at `create-checkout-session/index.ts:47-51` (change `mode: 'subscription'`, recurring price, webhook handlers become active) — that is a bigger change, flag it.
2. **Stripe TEST mode:** create Product ("Vibe Rise" / "Scale") + one-time Price. Copy the test `price_...` id.
3. **Set Supabase secrets** (test first): `supabase secrets set STRIPE_PRICE_ID=price_... STRIPE_SECRET_KEY=sk_test_... STRIPE_WEBHOOK_SECRET=whsec_...` — check which secret names the two functions actually read before setting (grep `Deno.env.get` in both functions; do not assume names).
4. **Register the webhook endpoint** in Stripe dashboard: `https://qlwfcfypnoptsocdpxuv.supabase.co/functions/v1/stripe-webhook`, subscribed to at least `checkout.session.completed`. Read `stripe-webhook/index.ts` first to confirm exactly which events it handles and subscribe to those. Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.
5. **Deploy both functions:** `supabase functions deploy create-checkout-session stripe-webhook` (or `scripts/deploy-functions.sh`).
6. **End-to-end test in test mode:** log in as a test user → open a locked stage → UpgradePrompt → checkout with card `4242 4242 4242 4242` → redirected back with `?payment=success` → confirm a `user_subscriptions` row exists and `useSubscription` now reports paid → locked stage opens. Also test cancel path (`?payment=cancelled`).
7. **Flip to live:** create live Product/Price, swap secrets to `sk_live_...` + live price id + live webhook signing secret, redeploy, make one real purchase (refund it after).

## Edge cases a weaker model would miss

- **Webhook signature verification needs the RAW request body.** If anyone "fixes" the webhook by JSON-parsing before `constructEvent`, verification breaks. Don't touch that code.
- **Test vs live webhook secrets are different** — a live checkout with a test `whsec_` silently fails verification and the user pays without being unlocked. This is the #1 way this goes wrong.
- **`user_subscriptions` row may already exist** (customer id stored on first checkout attempt). The webhook must upsert, not insert. Verify the handler does; if it inserts, fix to upsert on `user_id`.
- **One-time payment = no expiry.** Do not add expiry checks or subscription-renewal logic — the code comment documents this as intentional.
- **`allow_promotion_codes: true`** is already on — Nic can create discount codes in Stripe with zero code changes; mention this to him.
- **RLS:** the webhook writes with the service role key; the client reads its own row. If the unlock doesn't appear, check the webhook function uses the service key, not anon.

## Scale creator portal fulfillment (decided 2026-07-13)

The /movement-makers landing page sells Scale: $499 one-time setup + $99/month portal. Fulfillment flow, agreed with Nic:

1. **Checkout:** Stripe Checkout `mode: 'subscription'` with TWO line items: recurring $99/mo Price + one-time $499 Price (first invoice $598). This is separate from the consumer one-time product above; needs its own Product/Prices.
2. **Webhook:** `checkout.session.completed` upserts `user_subscriptions` with `plan: 'creator'`, keyed to the checkout email. Subscription updated/deleted handlers become active for this plan (cancel = access off).
3. **Success page:** "You're in. Log in at create.nichuzz.com with the email you paid with." Magic link login; CreateGate already checks `user_subscriptions` plan 'creator'/'pro'.
4. **Email mismatch gap:** if login email differs from checkout email, CreateGate shows "Paid with a different email? Contact us." Manual resolution is fine at founding-member volume (Nic books a setup call with every buyer anyway).
5. **Desktop app is an OPTION, not the funnel:** web portal is the product. Offer the existing notarized Electron DMG in two places: (a) success/welcome page under the main "Open the portal" button, (b) a persistent "Get the desktop app" link inside the portal. Mac only for now; show PWA install instructions (Chrome/Edge "Install app") alongside for everyone else. DMG needs re-notarizing per release, but it wraps the web app so releases should be rare.
6. **Until this ships:** landing page CTA stays lead capture (`lead_captures` + creator_nurture + notify email); Nic sends a Stripe payment link manually and books the setup call. Swap the CTA to real checkout when this goes live.

## Acceptance criteria

- [ ] Pricing confirmed by Nic (amount, currency, one-time vs recurring)
- [ ] Test-mode purchase unlocks stages 1-7 without page refresh hacks
- [ ] Cancel path returns cleanly, nothing unlocked
- [ ] Webhook events show 200s in Stripe dashboard (no signature failures)
- [ ] Live-mode purchase verified once and refunded
- [ ] Secrets documented in `.env.local` notes / CLAUDE.md Environment Variables section
