# Email Sequence Architecture

## Resend Tracking

Yes, Resend supports open/click tracking via webhooks. We can get real-time events for: delivery, open, bounce, click. We'd set up a webhook endpoint that writes these events back to our `email_sequence_emails` table (which already has `opened_at` and `clicked_at` columns).

## Aha Moment Hypothesis

Based on the app structure, the hypothesis for the magic metric:

Users who complete Flow Finder Skills + set their first Play-List challenge within 7 days have [X]% higher 30-day retention than those who don't.

Flow Finder gives them the "this sees me" moment. Play-List gives them the "I'm actually doing something" moment. Together = identity + action.

## Data Availability (Launch Strategy)

For launch, design the sequences assuming minimal data (tension scores + essence archetype only). Then as we track what users actually do in week 1, we can layer in richer personalization. Build the pipes now, fill them with data later.

---

## Sequence Architecture

5 email sequences, 2 trigger types:

```
SIGN UP
  │
  ├─ Immediately: Store in drip system
  │
  ├─ 30min: Day 0 email (Essence Profile) ← same for everyone
  │
  ├─ Has tension scores?
  │     NO → Generic Sequence (Days 1-7)
  │     │      Goal: Build excitement + drive to tension assessment
  │     │      If they complete assessment mid-sequence → next-day switch to layer sequence
  │     │
  │     YES → Layer Sequence (Days 1-7) based on weakest layer
  │            4 variants: Discover | Regulate | Reveal | Value
  │
  └─ Post-flow triggers (separate from drip)
        Fires when user completes specific flows, anytime
        Examples: "You just finished Flow Finder → here's what Zarlo sees"
```

### Post-Flow Triggered Emails

These are not part of the 7-day drip. They fire anytime a user completes a specific flow:

- **Complete tension assessment** → "Your river map is ready"
- **Complete Flow Finder Skills** → "Zarlo found 3 patterns"
- **Complete first Groan challenge** → "You just expanded your comfort zone"
- **Complete Play Profile** → "Your Founder DNA match is..."

These are the "milestone interrupts" that feel magical because they arrive right after you did something.
