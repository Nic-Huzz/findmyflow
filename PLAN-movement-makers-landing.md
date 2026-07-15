# PLAN: Finalise /movement-makers Landing Page

Living plan. Add items as they come up, then execute all stages in one pass.

## Context

`/movement-makers` (`src/pages/MovementMakers.jsx` + `.css`) is the public website landing page for the creator portal. It was written for the old cohort model and old portal features. We are moving to: no cohorts, $499 one-time setup + $99/month, and the current portal (Blow Up Brand pipeline, experience pipeline, grow metrics).

Decisions confirmed with Nic (2026-07-13):
- Cohort model is dead. Replace all cohort copy with new data.
- Business Model Finder is still relevant (keep in card 1). Execution Engine framing stays (card 2).
- Keep the three screenshot placeholder boxes but relabel them to the components we will actually screenshot.
- Pricing: $499 one-time setup, then $99/month. Stripe supports this natively (subscription Checkout with an extra one-time line item; first invoice $598, then $99/mo).

## Verified facts

- `lead_captures` table exists: `email` (not null), `source` (text), `scores` (jsonb), RLS allows anonymous inserts. Pattern to copy: `FacilitatorScore.jsx:404-414`.
- `notify-app-build-interest` edge function accepts `{ userEmail, userName, userId, source }` (used by CreateGate waitlist). userId can be null.
- MovementMakers.jsx does NOT import useAuth. Page is public. CTA must capture email inline, not assume a logged-in user.
- Existing checkout edge function `create-checkout-session` uses `mode: 'payment'`. The $499+$99/mo model requires `mode: 'subscription'` + activating dormant webhook handlers. That work lives in `PLAN-stripe-payment-live.md`, NOT this plan. This plan wires the CTA to lead capture only.

## Stage 1: Remove cohort model

- Hero badges: `10 Per Cohort / Weekly Check-ins / Full Creator Portal` → `Full Creator Portal / Built From 200+ Events / Cancel Anytime`
- Delete the `mm-group-bar` block ("Plus: Weekly check-ins with your cohort")
- Pricing card: remove "10 experience creators per monthly cohort" tagline and "10 spots per cohort. Founding membership pricing." line
- Final CTA sub: "10 spots. Monthly cohort. Full system. Triple guarantee." → "Full system. Setup included. Cancel anytime."
- FAQs:
  - "What happens on the check-ins?" → "What do I get in the setup?" (explains the $499: we build your positioning, rule break, and business model with you, so the portal starts full, not empty)
  - Trim cohort/group references from "How is this different from a course?" and "What's the time commitment?" answers

## Stage 2: What's Included rework (split by what each price buys)

Two blocks instead of one flat grid, so the $499 and the $99/mo each have a clear "here is what you get".

**Block A: The Setup ($499, one time)** — the identity content. Done once, yours forever.

| Card | Icon | Features |
|---|---|---|
| Position | 💎 | Business Model Finder (see what to build based on creators like you), Blow Up Brand pipeline (Rule Break → Reach → Growth → Scale Score), AI positioning statement |

**Block B: The Portal ($99/month)** — the Experiences + Growth tabs. The engine you run every event through.

| Card | Icon | Features |
|---|---|---|
| Fill | ⚡ | Experience pipeline (attract → capture → convert → deliver → grow), The Execution Engine (tasks become challenges with deadlines), fill checklists, Price-It-Right calculator |
| Run | 🎪 | Run sheets built from your checklist, reusable templates, run-it-again in one tap |
| Grow | 🔄 | Repeat-attendee tracking, profit per event, the 3% note (one improvement per event), contact list that builds itself |

Archived from old copy: Journey Compass, Play Profile, The Customer Bible framing (replaced by contact list line), old Setup/Pre-Event/Deliver/Post-Event card names.

Copy rules: no em dashes, 12-year-old language.

## Stage 3: Screenshot placeholders

Keep the three `mm-phase-screenshot` boxes, relabel:
- Card 1 (Position): `[Screenshot: Playbook tab stepper]`
- Card 2 (Fill): `[Screenshot: Experience pipeline view]`
- Card 4 (Grow): `[Screenshot: Grow metrics view]`

Nic takes the screenshots later; drop them in as `<img>` when supplied.

## Stage 4: Pricing + CTA

**Value anchor: TIME, not a dollar stack (decided 2026-07-13).**
Sourced from our own research (`public/data/creatorGrowthTimelines.json`, 16 top creators, `trust_years` field): average 12 years of grinding before blow-up (Jay Shetty and Ali Abdaal fastest at 3, Gabor Maté 32, Brené Brown 8, Wim Hof 24). Anchor copy direction: "We studied how the biggest experience creators blew up. On average it took 12 years. Most quit long before that. The setup gives you what they figured out the slow way." Each module can still carry a small "worth $X" label inside the What's Included cards, but the headline anchor is years, not $1,276.

- Section headline: "$1,276 of value. $100/month." → time anchor headline (e.g. "The biggest creators took 12 years to figure this out.")
- Price card:
  - Eyebrow: FOUNDING PRICE
  - Amount block: `$499` setup, then `$99/month` (restructure `.mm-price-amount`, may need a second line + CSS)
  - Remove the `$1,276/month` strikethrough value anchor (replaced by time anchor above)
  - Keep ROI line: "Fill 3 extra seats at your next experience and it's paid for itself."
  - Spots line → "8 spots left at founding price." (manual number; update by editing the page)
- CTA "Join The Next Cohort →" → "Get Started →":
  - Click reveals inline email input (page is public, no auth)
  - Submit does THREE things (unified funnel, decided 2026-07-13):
    1. Insert `lead_captures { email, source: 'movement-makers' }`
    2. Enroll `creator_nurture` sequence via `enroll-email-sequence` (same as Step 1 embed, fire-and-forget)
    3. Fire `notify-app-build-interest` with `{ userEmail: email, userId: null, source: 'movement-makers-pricing' }` so Nic gets pinged for high-intent leads only
  - Success state: "You're in. We'll be in touch to book your setup."
  - Basic validation: email contains '@' (copy FacilitatorScore pattern)
- Guarantees section: check the three cards still make sense without cohorts (THE COMMITMENT card references checklists + attendance, likely fine; adjust wording if it implies group accountability)
- Refund line consistency: $99 first month refundable, $499 setup non-refundable (identity content access). Must match FAQ (Stage 6 item 5).

## Stage 5 (separate, do not do here): Stripe checkout

Tracked in `PLAN-stripe-payment-live.md`. Changes needed for this pricing:
- `create-checkout-session`: `mode: 'subscription'`, line items = recurring $99/mo price + one-time $499 price
- Webhook subscription handlers become active (currently dormant by design)
- Swap the Stage 4 lead-capture CTA to real checkout once live

## Stage 6: Content alignment fixes (decided 2026-07-13)

1. Hero sub (currently "A monthly cohort of experience creators...") → "Scale your income + impact as an experience creator."
2. Pricing headline "Simple. One price. Everything included." → "One setup. One subscription. Everything included."
3. Proof grid 4th stat label "Experiences delivered" → "Signature formats" (detail line stays: Healing Compass, Shaking Breathwork, Vibe Rise, Retreats).
4. Guarantee "THE COMMITMENT": "run 1 experience through the system" → "run 1 experience through the pipeline".
5. Refund policy (FAQ "Can I cancel anytime?"): $99/month is refundable in the first month; the $499 setup is NOT refundable because it gives access to the identity content. Rewrite the answer to say this plainly.
6. Brand byline: "Founder, Healing But Fun" → "Founder, Vibe Rise". Footer "by Healing But Fun. Built in Bali." → "by Vibe Rise. Built in Bali."
7. Story quote: keep "my events do 100+ people", REMOVE the "$2K profit each" claim.

Note: the embedded matching flow already captures leads to `experience_creator_leads` + enrolls `creator_nurture` sequence. No change needed; landing page will have two capture points after Stage 4.

## Backlog / add here as things come up

- (empty)

## Acceptance criteria

- [ ] Zero cohort references anywhere on the page
- [ ] What's Included matches the shipped portal (Position / Fill / Run / Grow)
- [ ] Placeholder boxes relabeled to the three agreed screenshots
- [ ] Pricing shows $499 setup + $99/month
- [ ] CTA captures email to `lead_captures` and fires notify email, works logged out
- [ ] Stage 6 content fixes applied (hero sub, pricing headline, proof label, guarantee wording, refund FAQ, Vibe Rise byline, profit claim removed)
- [ ] What's Included clearly splits $499 (Position) vs $99/mo (Fill / Run / Grow)
- [ ] Time anchor uses the sourced 12-year average, not an invented number
- [ ] Pricing CTA email lands in `lead_captures`, enrolls `creator_nurture`, and pings Nic
- [ ] "8 spots left at founding price" shows on the price card
- [ ] Page checked at mobile width (~390px); `document.title` + OG tags set for link sharing
- [ ] No em dashes in copy; readable by a 12-year-old
- [ ] `npm run build` + `npm run build:creator` pass
