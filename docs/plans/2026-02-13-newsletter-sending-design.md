# Newsletter Sending System - Design

**Date:** 2026-02-13
**Status:** Approved
**Scope:** Plumbing + simple UI (Phase 1A MVP)

## Goal

Huzz can review a content draft, pick a contact segment, choose a time, and send a newsletter via Resend - all from the existing ContentReview page. Sends over 100 contacts auto-batch across days to stay within Resend free tier limits.

## Architecture

```
ContentReview page (existing)
    + SendPanel component (new)
        -> newsletterService.js (new)
            -> send-newsletter edge function (new)
                -> Resend batch API
                -> newsletter_sends table (new)

process-scheduled-newsletters edge function (new, cron)
    -> picks up queued sends where scheduled_for <= now()
    -> sends up to 100 per run via Resend
    -> updates newsletter_sends status
```

## Database

### New table: `external_contacts`

For contacts not in the app (program participants, event attendees, Substack).

```sql
create table external_contacts (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text,
  source text,          -- 'program', 'event', 'substack', 'manual'
  tags text[],          -- ['program-alumni', 'event-attendee']
  subscribed boolean default true,
  unsubscribed_at timestamptz,
  created_at timestamptz default now()
);
```

### New table: `newsletter_sends`

Tracks every individual email sent.

```sql
create table newsletter_sends (
  id uuid primary key default gen_random_uuid(),
  draft_id uuid references content_drafts(id),
  recipient_email text not null,
  recipient_source text, -- 'external_contacts', 'crm_contacts', 'public_leads'
  resend_id text,
  status text default 'queued', -- queued -> sent -> failed
  scheduled_for timestamptz,
  sent_at timestamptz,
  error_message text,
  created_at timestamptz default now()
);
```

### Existing table: `content_drafts` (no changes needed)

Already has: subject_line, body_markdown, body_html, status, segment (jsonb), scheduled_for, sent_at.

### Segment format (stored in content_drafts.segment)

```json
{"sources": ["all"]}
{"sources": ["external"], "tags": ["program-alumni"]}
{"sources": ["crm", "external"], "tags": ["event-attendee"]}
```

## Contact pools

| Pool | Table | Count | Has email | Has tags |
|------|-------|-------|-----------|----------|
| CRM Contacts | `crm_contacts` | 77 | 39 | Yes (text[]) |
| Quiz Leads | `public_leads` | 7 | 7 | No (but has personalization_tokens jsonb) |
| External | `external_contacts` | 0 (needs import) | All | Yes (text[]) |

## Edge Functions

### `send-newsletter` (invoked by UI)

Input: `{ draft_id, segment, send_at? }`

1. Validate draft exists and is approved
2. Query contacts matching segment (dedup by email across pools)
3. If send_at is in the future, set all scheduled_for to staggered times starting at send_at
4. If send now:
   - First 100: scheduled_for = now (sent immediately by this function)
   - Remaining: scheduled_for = +24h, +48h, etc. (picked up by cron)
5. Insert all recipients into `newsletter_sends` with status `queued`
6. Send the first batch (up to 100) via Resend batch API
7. Update sent rows: status = 'sent', resend_id, sent_at
8. Update draft: status = 'sending' (or 'sent' if all done), sent_at
9. Return: { total, sent_now, scheduled_later }

### `process-scheduled-newsletters` (cron, hourly)

1. Query `newsletter_sends` where status = 'queued' and scheduled_for <= now()
2. Group by draft_id, limit 100 per draft
3. For each batch: send via Resend, update status
4. If all sends for a draft are complete, update draft status to 'sent'

## UI Changes

### SendPanel component (`src/components/content-review/SendPanel.jsx`)

Renders below the markdown viewer when draft status is 'review' or 'approved'.

**Segment Picker:**
- Source chips: All / External / CRM / Quiz Leads (multi-select)
- Tag dropdown: populated from distinct tags across selected sources
- Live recipient count query

**Schedule Options:**
- "Send Now" button
- "Schedule" with date/time picker

**Confirmation Modal:**
- Subject line
- Recipient count
- Batch warning if >100: "Will send in X batches over Y days"
- Confirm / Cancel

**Progress Indicator (when status is 'sending'):**
- "87/350 sent - next batch in 16 hours"
- Progress bar

### Modified files:
- `src/pages/ContentReview.jsx` - add SendPanel to draft detail view
- `src/lib/contentReviewService.js` - add approve/schedule status updates

### New files:
- `src/components/content-review/SendPanel.jsx`
- `src/components/content-review/SendPanel.css`
- `src/lib/newsletterService.js`
- `supabase/functions/send-newsletter/index.ts`
- `supabase/functions/process-scheduled-newsletters/index.ts`

## Constraints

- Resend free tier: 100 emails/day, 3,000/month
- Auto-batching handles the daily limit transparently
- No unsubscribe management in MVP (add later)
- Admin-only (RLS on content_drafts already gates access)
- Markdown -> HTML conversion needed for email body (use existing body_html or convert at send time)

## Not in scope (later)

- Contact import UI (CSV upload into external_contacts)
- Unsubscribe link / management
- Open/click tracking (Resend provides this, wire up later)
- AI draft generation
- Voice learning loop
- A/B testing
