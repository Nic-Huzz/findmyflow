# PLAN: Turn On Email Sending (Resend)

**Rank: #3.** The email infrastructure (`process-scheduled-emails` edge function with Resend integration, `crm_email_sequences` / `crm_email_steps` tables, EmailSequences UI) is built but runs in dry-run mode: without `RESEND_API_KEY` it only console.logs. One env var + domain verification + a cron trigger turns on the whole nurture engine — which both the launch email playbook and the pipeline templates (PLAN-pipeline-email-templates) depend on.

## Goal

Scheduled emails actually send from a verified domain, on a schedule, with a working end-to-end test to a real inbox.

## Current state (verified 2026-07-08)

- `supabase/functions/process-scheduled-emails/index.ts` — complete, Resend API integration, dry-runs without `RESEND_API_KEY`.
- `src/pages/crm/EmailSequences.jsx` — sequence UI (note: has +83 lines of uncommitted changes, likely cold-outreach work; read the diff before touching).
- Known issue from session handoff (2026-06-17): **daily cron was a known issue** — verify whether any cron/schedule actually invokes the function.

## Steps (in order)

1. **Read `process-scheduled-emails/index.ts` fully.** Note: the exact env var names it reads, the `from` address it uses, how it selects due emails (query + status transitions), and how it marks sent/failed.
2. **Verify the sending domain in Resend.** Add `nichuzz.com` (or a subdomain like `mail.nichuzz.com`) in the Resend dashboard, add the DKIM/SPF DNS records, wait for verification. **Do not send from an unverified domain** — Resend rejects it or it lands in spam. Confirm the `from` address in the function matches the verified domain; fix it if it's a placeholder.
3. **Set the secret:** `supabase secrets set RESEND_API_KEY=re_...` and redeploy the function.
4. **Wire the schedule.** Check `supabase/migrations/` for an existing `pg_cron` + `pg_net` job invoking the function (grep migrations for `cron.schedule` and `process-scheduled-emails`). If none exists, create a migration scheduling it (e.g. every 15 min, same pattern as `score-league-matchups` if that one uses pg_cron — copy its working pattern rather than inventing one).
5. **End-to-end test:** create a test sequence in `/crm/email-sequences` with one step, enrol a contact whose email is Nic's own, set the due time to now, invoke the function manually (`supabase functions invoke process-scheduled-emails` or via dashboard), confirm the email arrives, and confirm the DB row transitions so it does NOT send again on the next run.
6. **Idempotency check:** invoke the function twice in a row — the second run must send nothing.

## Edge cases a weaker model would miss

- **Double-send risk is the big one.** The function must mark an email sent/in-flight before or atomically with sending. If it selects due rows and marks them after the Resend call, a crash mid-batch resends. Read the code; if it marks after, note the risk but don't refactor unless it's trivial.
- **The cron job invoking an edge function needs the function's auth header** (anon or service key in the `pg_net` call). A 401 in function logs = missing header.
- **Timezone:** due-time comparisons should be UTC in both the scheduler and the rows. A "9am" step stored naive-local sends at the wrong hour.
- **Unsubscribe:** check whether emails include any unsubscribe mechanism. If not, flag it to Nic before mass sending (legal requirement in AU/US for marketing email) — do not silently ship mass email without it.
- **Resend free tier limits** (~100/day): fine for testing, flag before a launch blast.
- **Don't conflate this with the uncommitted EmailSequences.jsx cold-outreach changes** — those are content/UI work in a different plan. This plan is pure plumbing.

## Acceptance criteria

- [ ] Domain verified in Resend; `from` address matches
- [ ] `RESEND_API_KEY` set; function deployed; manual invoke sends a real email to Nic's inbox
- [ ] Cron/schedule exists and fires (visible in function logs at the expected interval)
- [ ] Sent emails are marked and never re-sent (double-invoke test passes)
- [ ] Failure path: a bad recipient address logs an error without blocking the rest of the batch
