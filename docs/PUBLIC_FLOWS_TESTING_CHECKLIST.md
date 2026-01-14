# Public Flows Testing Checklist

Use this checklist to verify all new features before going live with the public lead magnet flows.

---

## Pre-Testing Setup

- [ ] Database migration applied (`npm run db:push` or via Supabase dashboard)
- [ ] Edge functions deployed (`npm run functions:deploy:all`)
- [ ] Environment variables set (if using Resend for emails):
  - [ ] `RESEND_API_KEY` in Supabase Edge Function secrets
- [ ] (Optional) Pixel IDs configured in `.env`:
  - [ ] `VITE_META_PIXEL_ID`
  - [ ] `VITE_LINKEDIN_PARTNER_ID`

---

## 1. Money Model Flow (`/try/attraction`)

### Flow Completion
- [ ] Navigate to `/try/attraction`
- [ ] Click "I've Got Time, Let's Go" - flow should start
- [ ] Answer all 10 questions
- [ ] Email gate appears after Q10
- [ ] Enter test email and submit
- [ ] Results page displays with:
  - [ ] Recommended offer name
  - [ ] Confidence percentage
  - [ ] Funnel structure (if applicable)
  - [ ] Alternative strategy scores

### Download Button
- [ ] "Download Your Results" button visible on results page
- [ ] Click button - print dialog opens
- [ ] PDF preview shows branded content with:
  - [ ] Find My Flow header
  - [ ] Offer name and confidence
  - [ ] Funnel steps
  - [ ] All strategy scores
  - [ ] Next steps section
  - [ ] Footer with CTA

### A/B Test CTA
- [ ] CTA section displays below results
- [ ] One of 3 variants shows (refresh in incognito to see different variants):
  - [ ] Control: "Want to learn how to build your own tech tools with AI?"
  - [ ] Urgency: "Ready to turn your results into action?"
  - [ ] Value: "Get a personalized roadmap to bring this to life"
- [ ] Interest buttons work (Yes/Maybe/No)
- [ ] Thank you message appears after selection
- [ ] "Continue to Find My Flow" button redirects correctly

### Database Verification
- [ ] Check `public_offer_assessments` table - new row with responses
- [ ] Check `public_leads` table - email saved with:
  - [ ] `personalization_tokens` populated
  - [ ] `flow_results` populated
  - [ ] `ab_variant` populated
- [ ] Check `email_sequence_enrollments` - enrollment created
- [ ] Check `email_sequence_emails` - 5 emails scheduled (day_0, day_1, day_3, day_5, day_7)
- [ ] Check `ab_test_assignments` - variant assignment recorded
- [ ] Check `ab_test_conversions` - interest click recorded

---

## 2. Nervous System Flow (`/try/nervous-system`)

### Flow Completion
- [ ] Navigate to `/try/nervous-system`
- [ ] Click "I've Got Time, Let's Go" - flow should start
- [ ] Complete journey and welcome screens
- [ ] Answer 4 initial questions (impact, income, positive change, struggle)
- [ ] Complete calibration (sway test video + directions)
- [ ] Complete 5 triage tests (binary search for edges)
- [ ] Complete safety contracts testing (7 contracts)
- [ ] Email gate appears after contracts
- [ ] Enter test email and submit
- [ ] Click "Show Me" to generate AI reflection
- [ ] Results page displays with:
  - [ ] Archetype name and description
  - [ ] Nervous system limits (earning + visibility)
  - [ ] Primary limiting belief
  - [ ] What needs rewiring

### Warning Signs Section
- [ ] "Watch For These Patterns" section appears on results page
- [ ] Warning signs are personalized based on answers (not generic)
- [ ] Each warning includes:
  - [ ] Icon and title
  - [ ] Description of the pattern
  - [ ] Common triggers list
  - [ ] Practice recommendation (purple box)
- [ ] Maximum 4 warnings shown (to avoid overwhelm)

### Warning Signs Test Scenarios

Test these specific answer combinations to verify warnings appear correctly:

| Test Scenario | Answers to Give | Expected Warning |
|---------------|-----------------|------------------|
| Self-sabotage | Answer YES to "self-sabotage" test (test 4) | "Self-Sabotage Near Success" |
| Major visibility gap | Goal: 100,000+ / Edge lands at <10,000 | "Major Visibility Resistance" |
| Major earning gap | Goal: $1M+ / Edge lands at <$150K | "Major Earning Resistance" |
| Greed contract | Answer YES to "charge what I'm worth = greedy" | "Pricing Guilt Pattern" |
| Visibility contract | Answer YES to "visible = judged" | "Visibility Avoidance Pattern" |
| Unsafe pursuing | Answer NO to "safe to pursue ambition" (test 3) | "Ambition Feels Dangerous" |

- [ ] Test at least 3 scenarios above
- [ ] Verify correct warnings appear for each
- [ ] Verify warnings DO NOT appear when conditions aren't met

### Download Button
- [ ] "Download Your Results" button visible on results page
- [ ] Click button - print dialog opens
- [ ] PDF preview shows branded content with:
  - [ ] Find My Flow header
  - [ ] Archetype name and description
  - [ ] Earning and visibility edges
  - [ ] Primary limiting belief
  - [ ] Active safety contracts
  - [ ] Rewiring section
  - [ ] **Warning signs section (with triggers + practices)**
  - [ ] Next steps

### A/B Test CTA
- [ ] Same checks as Money Model flow above

### Database Verification
- [ ] Check `public_nervous_system_responses` table - new row with all data
- [ ] Check `public_leads` table - email saved with personalization tokens
- [ ] Check `email_sequence_enrollments` - enrollment with `sequence_type: 'nervous_system'`
- [ ] Check `email_sequence_emails` - 5 emails scheduled

---

## 3. Email Sequence (Dry Run)

### Enrollment Check
- [ ] Complete a flow with test email
- [ ] Verify `email_sequence_enrollments` has new entry with `status: 'active'`
- [ ] Verify `email_sequence_emails` has 5 entries:
  - [ ] `day_0` scheduled for ~5 minutes from now
  - [ ] `day_1` scheduled for next day at 10am
  - [ ] `day_3` scheduled for 3 days out at 10am
  - [ ] `day_5` scheduled for 5 days out at 10am
  - [ ] `day_7` scheduled for 7 days out at 10am

### Process Emails Function (Manual Test)
- [ ] Invoke `process-scheduled-emails` Edge Function manually
- [ ] Without RESEND_API_KEY: Check logs show "[DRY RUN] Would send email..."
- [ ] With RESEND_API_KEY: Check email arrives (use real email)
- [ ] Verify email status updated to 'sent' in database

### Email Personalization
- [ ] Check email subject has tokens replaced (no `{{placeholder}}` visible)
- [ ] Money Model emails include offer type
- [ ] Nervous System emails include archetype name

---

## 4. Pixel Tracking (Console Verification)

> Note: Full pixel testing requires Meta/LinkedIn pixels installed in index.html

### Console Logs (Development)
- [ ] Open browser console before starting flow
- [ ] Click "Let's Go" - see `[Meta Pixel] Tracked: FlowStarted`
- [ ] At 50% progress - see `[Meta Pixel] Tracked: FlowProgress50`
- [ ] Submit email - see `[Meta Pixel] Tracked: EmailCaptured`
- [ ] View results - see `[Meta Pixel] Tracked: FlowCompleted`
- [ ] Click CTA interest - see `[Meta Pixel] Tracked: CTAClicked`

### Pixel Helper Tools (Production)
- [ ] Install Meta Pixel Helper Chrome extension
- [ ] Install LinkedIn Insight Tag Helper Chrome extension
- [ ] Run through flows and verify events fire

---

## 5. A/B Test Variant Distribution

### Variant Randomization
- [ ] Open incognito window, complete flow, note CTA variant
- [ ] Clear session, repeat 5+ times
- [ ] Verify seeing different variants (roughly equal distribution)

### Session Consistency
- [ ] Note your variant
- [ ] Refresh page - same variant should persist
- [ ] Navigate away and back - same variant should persist

### Conversion Tracking
- [ ] Complete flow and click CTA interest
- [ ] Check `ab_test_conversions` table for entry with:
  - [ ] Correct `variant`
  - [ ] `conversion_type` = `interest_yes` (or maybe/no)
- [ ] Click "Continue to Find My Flow"
- [ ] Check for `conversion_type` = `cta_continue`

---

## 6. Error Handling

### Network Errors
- [ ] Disable network, try to submit email - graceful handling
- [ ] Re-enable network, submit succeeds

### Nervous System AI Error
- [ ] If AI reflection fails, error screen displays
- [ ] "Try Again" button works
- [ ] "Continue to Find My Flow" button redirects correctly

### PDF Download Blocked
- [ ] If popup blocked, alert should inform user to allow popups

---

## 7. Email Copy Review

> ⚠️ CRITICAL: Review all email copy before going live!

### Money Model Emails (`src/lib/emailTemplates.js`)
- [ ] Day 0: Subject and body copy reviewed
- [ ] Day 1: Subject and body copy reviewed
- [ ] Day 3: Subject and body copy reviewed
- [ ] Day 5: Subject and body copy reviewed
- [ ] Day 7: Subject and body copy reviewed

### Nervous System Emails (`src/lib/emailTemplates.js`)
- [ ] Day 0: Subject and body copy reviewed
- [ ] Day 1: Subject and body copy reviewed
- [ ] Day 3: Subject and body copy reviewed
- [ ] Day 5: Subject and body copy reviewed
- [ ] Day 7: Subject and body copy reviewed

### Personalization Check
- [ ] All `{{tokens}}` have appropriate fallbacks
- [ ] Tone is consistent with brand voice
- [ ] CTAs are clear and links are correct

---

## 8. Cross-Browser Testing

- [ ] Chrome (desktop)
- [ ] Safari (desktop)
- [ ] Firefox (desktop)
- [ ] Chrome (mobile)
- [ ] Safari (mobile - iOS)

---

## 9. Production Checklist

Before going live:

- [ ] All tests above pass
- [ ] Email copy reviewed and approved
- [ ] Resend API key configured in production
- [ ] Meta Pixel ID added to index.html (if using)
- [ ] LinkedIn Insight Tag added to index.html (if using)
- [ ] Edge functions deployed to production
- [ ] Database migration applied to production
- [ ] Test with real email to verify full flow

---

## Notes

_Use this space to document any issues found during testing:_

| Issue | Status | Notes |
|-------|--------|-------|
| | | |
| | | |
| | | |

---

Last Updated: January 2026
