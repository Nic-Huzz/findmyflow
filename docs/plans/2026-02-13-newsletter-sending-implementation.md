# Newsletter Sending System - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add newsletter sending to the existing ContentReview page - pick a segment, pick a time, send via Resend with auto-batching for free tier limits.

**Architecture:** Two new Supabase tables (external_contacts, newsletter_sends) + two edge functions (send-newsletter, process-scheduled-newsletters) + a SendPanel UI component added to the existing ContentReview page. Contacts come from 3 pools (external_contacts, crm_contacts, public_leads), queried by segment. Sends over 100 contacts auto-batch across days.

**Tech Stack:** React + Vite (frontend), Supabase Edge Functions (Deno), Resend API (email), existing Supabase project `qlwfcfypnoptsocdpxuv`.

**Design doc:** `docs/plans/2026-02-13-newsletter-sending-design.md`

---

## Task 1: Database Migration - New Tables + RLS

**Files:**
- Create: `supabase/migrations/20260213100000_newsletter_sending.sql`

**Step 1: Write the migration**

```sql
-- ============================================================
-- Newsletter Sending Infrastructure
-- ============================================================

-- External contacts (program participants, event attendees, Substack, manual)
create table external_contacts (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text,
  source text,
  tags text[] default '{}',
  subscribed boolean default true,
  unsubscribed_at timestamptz,
  created_at timestamptz default now()
);

-- Newsletter send tracking (one row per recipient per send)
create table newsletter_sends (
  id uuid primary key default gen_random_uuid(),
  draft_id uuid references content_drafts(id) on delete cascade,
  recipient_email text not null,
  recipient_source text,
  resend_id text,
  status text default 'queued',
  scheduled_for timestamptz not null,
  sent_at timestamptz,
  error_message text,
  created_at timestamptz default now()
);

-- Indexes for cron query performance
create index idx_newsletter_sends_queued
  on newsletter_sends (scheduled_for)
  where status = 'queued';

create index idx_newsletter_sends_draft
  on newsletter_sends (draft_id);

create index idx_external_contacts_email
  on external_contacts (email);

create index idx_external_contacts_tags
  on external_contacts using gin (tags);

-- RLS: admin-only (matches existing content_drafts pattern)
alter table external_contacts enable row level security;
alter table newsletter_sends enable row level security;

create policy "Admins can read external_contacts"
  on external_contacts for select
  using (exists (select 1 from admin_users where user_id = auth.uid()));

create policy "Admins can insert external_contacts"
  on external_contacts for insert
  with check (exists (select 1 from admin_users where user_id = auth.uid()));

create policy "Admins can update external_contacts"
  on external_contacts for update
  using (exists (select 1 from admin_users where user_id = auth.uid()));

create policy "Admins can read newsletter_sends"
  on newsletter_sends for select
  using (exists (select 1 from admin_users where user_id = auth.uid()));

create policy "Admins can insert newsletter_sends"
  on newsletter_sends for insert
  with check (exists (select 1 from admin_users where user_id = auth.uid()));

create policy "Admins can update newsletter_sends"
  on newsletter_sends for update
  using (exists (select 1 from admin_users where user_id = auth.uid()));

-- Service role bypass for edge functions (they use service key)
-- Edge functions already use SUPABASE_SERVICE_ROLE_KEY which bypasses RLS.
```

**Step 2: Apply the migration via Supabase MCP**

Run: `apply_migration` on project `qlwfcfypnoptsocdpxuv` with name `newsletter_sending` and the SQL above.

**Step 3: Verify tables exist**

Run SQL on project `qlwfcfypnoptsocdpxuv`:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('external_contacts', 'newsletter_sends');
```
Expected: both tables returned.

**Step 4: Verify RLS policies**

Run SQL:
```sql
SELECT tablename, policyname FROM pg_policies
WHERE tablename IN ('external_contacts', 'newsletter_sends');
```
Expected: 6 policies (3 per table).

**Step 5: Commit**

```bash
git add supabase/migrations/20260213100000_newsletter_sending.sql
git commit -m "feat: add external_contacts + newsletter_sends tables for newsletter system"
```

---

## Task 2: Newsletter Service (Frontend API Layer)

**Files:**
- Create: `src/lib/newsletterService.js`

This service provides all frontend API calls for the SendPanel component.

**Step 1: Write the service**

```javascript
import { supabase } from './supabaseClient'

// ===== SEGMENT QUERIES =====

/**
 * Count contacts matching a segment.
 * @param {Object} segment - { sources: string[], tags?: string[] }
 * @returns {Promise<number>} total unique emails
 */
export async function countSegmentRecipients(segment) {
  const emails = await querySegmentEmails(segment)
  return emails.length
}

/**
 * Query unique emails matching a segment across all contact pools.
 * Deduplicates by email (lowercased).
 */
export async function querySegmentEmails(segment) {
  const { sources = [], tags = [] } = segment
  const allSources = sources.includes('all')
  const emails = new Set()

  // External contacts
  if (allSources || sources.includes('external')) {
    let query = supabase
      .from('external_contacts')
      .select('email, name')
      .eq('subscribed', true)

    if (tags.length > 0 && !allSources) {
      query = query.overlaps('tags', tags)
    }

    const { data } = await query
    data?.forEach(c => {
      if (c.email) emails.add(c.email.toLowerCase())
    })
  }

  // CRM contacts
  if (allSources || sources.includes('crm')) {
    let query = supabase
      .from('crm_contacts')
      .select('email, name')
      .not('email', 'is', null)

    if (tags.length > 0 && !allSources) {
      query = query.overlaps('tags', tags)
    }

    const { data } = await query
    data?.forEach(c => {
      if (c.email) emails.add(c.email.toLowerCase())
    })
  }

  // Public leads (quiz takers)
  if (allSources || sources.includes('leads')) {
    const { data } = await supabase
      .from('public_leads')
      .select('email')
      .not('email', 'is', null)

    data?.forEach(c => {
      if (c.email) emails.add(c.email.toLowerCase())
    })
  }

  return Array.from(emails)
}

// ===== AVAILABLE TAGS =====

/**
 * Get all distinct tags across external_contacts and crm_contacts.
 */
export async function fetchAvailableTags() {
  const tags = new Set()

  const { data: extData } = await supabase
    .from('external_contacts')
    .select('tags')
    .eq('subscribed', true)

  extData?.forEach(c => c.tags?.forEach(t => tags.add(t)))

  const { data: crmData } = await supabase
    .from('crm_contacts')
    .select('tags')
    .not('tags', 'is', null)

  crmData?.forEach(c => c.tags?.forEach(t => tags.add(t)))

  return Array.from(tags).sort()
}

// ===== SEND / SCHEDULE =====

/**
 * Send a newsletter (invokes the send-newsletter edge function).
 * @param {string} draftId
 * @param {Object} segment - { sources: string[], tags?: string[] }
 * @param {string|null} scheduledFor - ISO timestamp or null for send-now
 */
export async function sendNewsletter(draftId, segment, scheduledFor = null) {
  const { data, error } = await supabase.functions.invoke('send-newsletter', {
    body: { draft_id: draftId, segment, scheduled_for: scheduledFor },
  })

  if (error) throw error
  return data
}

// ===== SEND PROGRESS =====

/**
 * Get send progress for a draft.
 * @returns {{ total: number, sent: number, queued: number, failed: number, nextBatchAt: string|null }}
 */
export async function fetchSendProgress(draftId) {
  const { data, error } = await supabase
    .from('newsletter_sends')
    .select('status, scheduled_for')
    .eq('draft_id', draftId)

  if (error) throw error
  if (!data || data.length === 0) return null

  const total = data.length
  const sent = data.filter(s => s.status === 'sent').length
  const queued = data.filter(s => s.status === 'queued').length
  const failed = data.filter(s => s.status === 'failed').length

  const nextQueued = data
    .filter(s => s.status === 'queued')
    .sort((a, b) => new Date(a.scheduled_for) - new Date(b.scheduled_for))

  return {
    total,
    sent,
    queued,
    failed,
    nextBatchAt: nextQueued.length > 0 ? nextQueued[0].scheduled_for : null,
  }
}
```

**Step 2: Verify imports resolve**

Check that `supabaseClient.js` exports `supabase`:
- File: `src/lib/supabaseClient.js` (already confirmed, exports `supabase`)

**Step 3: Commit**

```bash
git add src/lib/newsletterService.js
git commit -m "feat: add newsletterService for segment queries and send API"
```

---

## Task 3: Send Newsletter Edge Function

**Files:**
- Create: `supabase/functions/send-newsletter/index.ts`

This is the core sending function. Called by the frontend to queue + send emails.

**Step 1: Write the edge function**

```typescript
/**
 * Send Newsletter Edge Function
 *
 * Takes a draft_id + segment, queries matching contacts,
 * queues them in newsletter_sends with staggered scheduled_for times,
 * and sends the first batch (up to 100) immediately via Resend.
 *
 * Requires: RESEND_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const DAILY_LIMIT = 100
const FROM_ADDRESS = 'Huzz <huzz@findmyflow.nichuzz.com>'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const resendApiKey = Deno.env.get('RESEND_API_KEY')

    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: 'RESEND_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { draft_id, segment, scheduled_for } = await req.json()

    if (!draft_id || !segment) {
      return new Response(
        JSON.stringify({ error: 'draft_id and segment are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 1. Fetch the draft
    const { data: draft, error: draftError } = await supabase
      .from('content_drafts')
      .select('*')
      .eq('id', draft_id)
      .single()

    if (draftError || !draft) {
      return new Response(
        JSON.stringify({ error: 'Draft not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Query contacts matching segment (dedup by email)
    const emails = new Set<string>()
    const emailMeta: Record<string, { name?: string; source: string }> = {}
    const { sources = [], tags = [] } = segment
    const allSources = sources.includes('all')

    // External contacts
    if (allSources || sources.includes('external')) {
      let query = supabase
        .from('external_contacts')
        .select('email, name')
        .eq('subscribed', true)

      if (tags.length > 0 && !allSources) {
        query = query.overlaps('tags', tags)
      }

      const { data } = await query
      data?.forEach((c: any) => {
        if (c.email) {
          const e = c.email.toLowerCase()
          if (!emails.has(e)) {
            emails.add(e)
            emailMeta[e] = { name: c.name, source: 'external_contacts' }
          }
        }
      })
    }

    // CRM contacts
    if (allSources || sources.includes('crm')) {
      let query = supabase
        .from('crm_contacts')
        .select('email, name')
        .not('email', 'is', null)

      if (tags.length > 0 && !allSources) {
        query = query.overlaps('tags', tags)
      }

      const { data } = await query
      data?.forEach((c: any) => {
        if (c.email) {
          const e = c.email.toLowerCase()
          if (!emails.has(e)) {
            emails.add(e)
            emailMeta[e] = { name: c.name, source: 'crm_contacts' }
          }
        }
      })
    }

    // Public leads
    if (allSources || sources.includes('leads')) {
      const { data } = await supabase
        .from('public_leads')
        .select('email')
        .not('email', 'is', null)

      data?.forEach((c: any) => {
        if (c.email) {
          const e = c.email.toLowerCase()
          if (!emails.has(e)) {
            emails.add(e)
            emailMeta[e] = { source: 'public_leads' }
          }
        }
      })
    }

    if (emails.size === 0) {
      return new Response(
        JSON.stringify({ error: 'No contacts match this segment' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. Calculate staggered schedule
    const baseTime = scheduled_for ? new Date(scheduled_for) : new Date()
    const allEmails = Array.from(emails)
    const sends: any[] = []

    for (let i = 0; i < allEmails.length; i++) {
      const batchIndex = Math.floor(i / DAILY_LIMIT)
      const batchTime = new Date(baseTime.getTime() + batchIndex * 24 * 60 * 60 * 1000)
      const email = allEmails[i]

      sends.push({
        draft_id,
        recipient_email: email,
        recipient_source: emailMeta[email]?.source || 'unknown',
        status: 'queued',
        scheduled_for: batchTime.toISOString(),
      })
    }

    // 4. Insert all sends
    const { error: insertError } = await supabase
      .from('newsletter_sends')
      .insert(sends)

    if (insertError) {
      return new Response(
        JSON.stringify({ error: `Failed to queue sends: ${insertError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 5. Send the first batch immediately (if not future-scheduled)
    let sentNow = 0
    const isImmediate = !scheduled_for || new Date(scheduled_for) <= new Date()

    if (isImmediate) {
      const firstBatch = allEmails.slice(0, DAILY_LIMIT)
      const subject = draft.subject_line || draft.title
      const htmlBody = draft.body_html || simpleMarkdownToHtml(draft.body_markdown)

      for (const email of firstBatch) {
        try {
          const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: FROM_ADDRESS,
              to: email,
              subject,
              html: htmlBody,
            }),
          })

          if (response.ok) {
            const resendData = await response.json()
            await supabase
              .from('newsletter_sends')
              .update({
                status: 'sent',
                resend_id: resendData.id,
                sent_at: new Date().toISOString(),
              })
              .eq('draft_id', draft_id)
              .eq('recipient_email', email)

            sentNow++
          } else {
            const errData = await response.json()
            await supabase
              .from('newsletter_sends')
              .update({
                status: 'failed',
                error_message: errData.message || 'Resend API error',
              })
              .eq('draft_id', draft_id)
              .eq('recipient_email', email)
          }
        } catch (sendErr: any) {
          await supabase
            .from('newsletter_sends')
            .update({
              status: 'failed',
              error_message: sendErr.message,
            })
            .eq('draft_id', draft_id)
            .eq('recipient_email', email)
        }
      }
    }

    // 6. Update draft status
    const allSent = sentNow === allEmails.length
    await supabase
      .from('content_drafts')
      .update({
        status: allSent ? 'sent' : 'sending',
        segment,
        scheduled_for: scheduled_for || null,
        sent_at: isImmediate ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', draft_id)

    return new Response(
      JSON.stringify({
        success: true,
        total: allEmails.length,
        sent_now: sentNow,
        scheduled_later: allEmails.length - sentNow,
        batches: Math.ceil(allEmails.length / DAILY_LIMIT),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('send-newsletter error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

/**
 * Basic markdown to HTML for email bodies.
 * Handles: headings, bold, italic, links, paragraphs, lists, line breaks.
 * Not a full parser — just enough for newsletters.
 */
function simpleMarkdownToHtml(md: string): string {
  if (!md) return ''

  let html = md
    // Headings
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold + italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    // Unordered lists
    .replace(/^[*-] (.+)$/gm, '<li>$1</li>')
    // Horizontal rules
    .replace(/^---$/gm, '<hr>')
    // Line breaks (double newline = paragraph break)
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')

  // Wrap list items
  html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
  // Clean up nested ul tags
  html = html.replace(/<\/ul>\s*<ul>/g, '')

  return `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #1a1a2e;"><p>${html}</p></div>`
}
```

**Step 2: Deploy the edge function**

Use Supabase MCP `deploy_edge_function`:
- project_id: `qlwfcfypnoptsocdpxuv`
- name: `send-newsletter`
- verify_jwt: `true`
- entrypoint_path: `index.ts`
- files: the index.ts above

**Step 3: Verify deployment**

Use `list_edge_functions` on the project. Confirm `send-newsletter` appears.

**Step 4: Commit the local file**

```bash
git add supabase/functions/send-newsletter/index.ts
git commit -m "feat: add send-newsletter edge function with auto-batching"
```

---

## Task 4: Scheduled Newsletter Processor (Cron Edge Function)

**Files:**
- Create: `supabase/functions/process-scheduled-newsletters/index.ts`

Picks up queued sends where `scheduled_for <= now()`, sends up to 100 per run.

**Step 1: Write the edge function**

```typescript
/**
 * Process Scheduled Newsletters Edge Function
 *
 * Called by cron (hourly). Finds queued newsletter_sends that are due,
 * sends up to 100 via Resend, updates statuses.
 *
 * Requires: RESEND_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const BATCH_LIMIT = 100
const FROM_ADDRESS = 'Huzz <huzz@findmyflow.nichuzz.com>'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const resendApiKey = Deno.env.get('RESEND_API_KEY')

    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: 'RESEND_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const now = new Date().toISOString()

    // 1. Find due sends (queued + scheduled_for <= now)
    const { data: dueSends, error: fetchError } = await supabase
      .from('newsletter_sends')
      .select('id, draft_id, recipient_email')
      .eq('status', 'queued')
      .lte('scheduled_for', now)
      .limit(BATCH_LIMIT)

    if (fetchError) {
      throw new Error(`Failed to fetch due sends: ${fetchError.message}`)
    }

    if (!dueSends || dueSends.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No sends due', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Group by draft_id to fetch drafts efficiently
    const draftIds = [...new Set(dueSends.map(s => s.draft_id))]
    const draftsMap: Record<string, any> = {}

    for (const draftId of draftIds) {
      const { data: draft } = await supabase
        .from('content_drafts')
        .select('title, subject_line, body_markdown, body_html')
        .eq('id', draftId)
        .single()

      if (draft) draftsMap[draftId] = draft
    }

    // 3. Send each email
    let sent = 0
    let failed = 0

    for (const send of dueSends) {
      const draft = draftsMap[send.draft_id]
      if (!draft) {
        await supabase
          .from('newsletter_sends')
          .update({ status: 'failed', error_message: 'Draft not found' })
          .eq('id', send.id)
        failed++
        continue
      }

      const subject = draft.subject_line || draft.title
      const htmlBody = draft.body_html || simpleMarkdownToHtml(draft.body_markdown)

      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: FROM_ADDRESS,
            to: send.recipient_email,
            subject,
            html: htmlBody,
          }),
        })

        if (response.ok) {
          const resendData = await response.json()
          await supabase
            .from('newsletter_sends')
            .update({
              status: 'sent',
              resend_id: resendData.id,
              sent_at: new Date().toISOString(),
            })
            .eq('id', send.id)
          sent++
        } else {
          const errData = await response.json()
          await supabase
            .from('newsletter_sends')
            .update({
              status: 'failed',
              error_message: errData.message || 'Resend API error',
            })
            .eq('id', send.id)
          failed++
        }
      } catch (sendErr: any) {
        await supabase
          .from('newsletter_sends')
          .update({ status: 'failed', error_message: sendErr.message })
          .eq('id', send.id)
        failed++
      }
    }

    // 4. Check if any drafts are now fully sent
    for (const draftId of draftIds) {
      const { data: remaining } = await supabase
        .from('newsletter_sends')
        .select('id')
        .eq('draft_id', draftId)
        .eq('status', 'queued')
        .limit(1)

      if (!remaining || remaining.length === 0) {
        await supabase
          .from('content_drafts')
          .update({ status: 'sent', updated_at: new Date().toISOString() })
          .eq('id', draftId)
      }
    }

    return new Response(
      JSON.stringify({ processed: dueSends.length, sent, failed }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('process-scheduled-newsletters error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

/** Same markdown converter as send-newsletter */
function simpleMarkdownToHtml(md: string): string {
  if (!md) return ''
  let html = md
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/^[*-] (.+)$/gm, '<li>$1</li>')
    .replace(/^---$/gm, '<hr>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
  html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
  html = html.replace(/<\/ul>\s*<ul>/g, '')
  return `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #1a1a2e;"><p>${html}</p></div>`
}
```

**Step 2: Deploy the edge function**

Use Supabase MCP `deploy_edge_function`:
- project_id: `qlwfcfypnoptsocdpxuv`
- name: `process-scheduled-newsletters`
- verify_jwt: `true`
- entrypoint_path: `index.ts`

**Step 3: Set up cron trigger**

Run SQL via Supabase MCP to create the cron job (uses pg_cron extension):

```sql
-- Check if pg_cron is enabled
select extname from pg_extension where extname = 'pg_cron';
```

If pg_cron exists:
```sql
select cron.schedule(
  'process-scheduled-newsletters',
  '0 * * * *',  -- every hour on the hour
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'supabase_url') || '/functions/v1/process-scheduled-newsletters',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

If pg_cron is NOT available, note this as a manual step — Huzz can trigger via Supabase dashboard or we use an external cron (GitHub Actions, cron-job.org, etc.).

**Step 4: Commit**

```bash
git add supabase/functions/process-scheduled-newsletters/index.ts
git commit -m "feat: add cron edge function for processing scheduled newsletter batches"
```

---

## Task 5: SendPanel UI Component

**Files:**
- Create: `src/components/content-review/SendPanel.jsx`
- Create: `src/components/content-review/SendPanel.css`

The segment picker + schedule + send/confirm UI.

**Step 1: Write the SendPanel component**

```jsx
import { useState, useEffect, useCallback } from 'react'
import {
  countSegmentRecipients,
  fetchAvailableTags,
  sendNewsletter,
  fetchSendProgress,
} from '../../lib/newsletterService'
import './SendPanel.css'

const SOURCE_OPTIONS = [
  { id: 'all', label: 'All Contacts' },
  { id: 'external', label: 'External' },
  { id: 'crm', label: 'CRM' },
  { id: 'leads', label: 'Quiz Leads' },
]

const DAILY_LIMIT = 100

export default function SendPanel({ draft, onStatusChange }) {
  const [sources, setSources] = useState(['all'])
  const [availableTags, setAvailableTags] = useState([])
  const [selectedTags, setSelectedTags] = useState([])
  const [recipientCount, setRecipientCount] = useState(null)
  const [countLoading, setCountLoading] = useState(false)

  const [scheduleMode, setScheduleMode] = useState('now') // 'now' | 'scheduled'
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('09:00')

  const [showConfirm, setShowConfirm] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState(null)
  const [sendError, setSendError] = useState(null)

  const [progress, setProgress] = useState(null)

  // Load available tags
  useEffect(() => {
    fetchAvailableTags().then(setAvailableTags).catch(console.error)
  }, [])

  // Load send progress if draft is in sending state
  useEffect(() => {
    if (draft?.status === 'sending' || draft?.status === 'sent') {
      fetchSendProgress(draft.id).then(setProgress).catch(console.error)
    }
  }, [draft?.id, draft?.status])

  // Count recipients when segment changes
  const updateCount = useCallback(async () => {
    setCountLoading(true)
    try {
      const segment = buildSegment()
      const count = await countSegmentRecipients(segment)
      setRecipientCount(count)
    } catch (err) {
      console.error('Failed to count recipients:', err)
      setRecipientCount(null)
    } finally {
      setCountLoading(false)
    }
  }, [sources, selectedTags])

  useEffect(() => {
    updateCount()
  }, [updateCount])

  function buildSegment() {
    return {
      sources,
      tags: selectedTags.length > 0 ? selectedTags : [],
    }
  }

  function toggleSource(id) {
    if (id === 'all') {
      setSources(['all'])
      return
    }
    setSources(prev => {
      const without = prev.filter(s => s !== 'all' && s !== id)
      const next = prev.includes(id) ? without : [...without, id]
      return next.length === 0 ? ['all'] : next
    })
  }

  function toggleTag(tag) {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  async function handleSend() {
    setSending(true)
    setSendError(null)
    try {
      let scheduledFor = null
      if (scheduleMode === 'scheduled' && scheduledDate) {
        scheduledFor = new Date(`${scheduledDate}T${scheduledTime}`).toISOString()
      }

      const result = await sendNewsletter(draft.id, buildSegment(), scheduledFor)
      setSendResult(result)
      setShowConfirm(false)
      onStatusChange?.()
    } catch (err) {
      setSendError(err.message || 'Failed to send')
    } finally {
      setSending(false)
    }
  }

  // If draft is already sending/sent, show progress
  if (progress) {
    const pct = progress.total > 0 ? Math.round((progress.sent / progress.total) * 100) : 0
    return (
      <div className="sp-panel">
        <h3 className="sp-title">Send Progress</h3>
        <div className="sp-progress-bar">
          <div className="sp-progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="sp-progress-text">
          {progress.sent}/{progress.total} sent
          {progress.failed > 0 && <span className="sp-failed"> ({progress.failed} failed)</span>}
        </div>
        {progress.queued > 0 && progress.nextBatchAt && (
          <div className="sp-next-batch">
            {progress.queued} remaining - next batch {new Date(progress.nextBatchAt).toLocaleString()}
          </div>
        )}
      </div>
    )
  }

  // If already sent and no progress data, show sent badge
  if (draft?.status === 'sent') {
    return (
      <div className="sp-panel">
        <div className="sp-sent-badge">Sent {draft.sent_at ? new Date(draft.sent_at).toLocaleString() : ''}</div>
      </div>
    )
  }

  // If send result just came back
  if (sendResult) {
    return (
      <div className="sp-panel">
        <h3 className="sp-title">Sent!</h3>
        <div className="sp-result">
          <div>{sendResult.sent_now} sent now</div>
          {sendResult.scheduled_later > 0 && (
            <div>{sendResult.scheduled_later} scheduled ({sendResult.batches} batches over {sendResult.batches} days)</div>
          )}
        </div>
      </div>
    )
  }

  const batches = recipientCount ? Math.ceil(recipientCount / DAILY_LIMIT) : 0

  return (
    <div className="sp-panel">
      <h3 className="sp-title">Send Newsletter</h3>

      {/* Source chips */}
      <div className="sp-section">
        <label className="sp-label">Audience</label>
        <div className="sp-chips">
          {SOURCE_OPTIONS.map(opt => (
            <button
              key={opt.id}
              className={`sp-chip ${sources.includes(opt.id) ? 'sp-chip--active' : ''}`}
              onClick={() => toggleSource(opt.id)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tag filter */}
      {availableTags.length > 0 && !sources.includes('all') && (
        <div className="sp-section">
          <label className="sp-label">Filter by tag</label>
          <div className="sp-chips">
            {availableTags.map(tag => (
              <button
                key={tag}
                className={`sp-chip sp-chip--tag ${selectedTags.includes(tag) ? 'sp-chip--active' : ''}`}
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recipient count */}
      <div className="sp-count">
        {countLoading ? (
          <span className="sp-count-loading">Counting...</span>
        ) : recipientCount !== null ? (
          <>
            <strong>{recipientCount}</strong> recipient{recipientCount !== 1 ? 's' : ''}
            {batches > 1 && (
              <span className="sp-batch-warn">
                ({batches} batches over {batches} days - free tier limit)
              </span>
            )}
          </>
        ) : null}
      </div>

      {/* Schedule mode */}
      <div className="sp-section">
        <label className="sp-label">When</label>
        <div className="sp-schedule-toggle">
          <button
            className={`sp-schedule-btn ${scheduleMode === 'now' ? 'sp-schedule-btn--active' : ''}`}
            onClick={() => setScheduleMode('now')}
          >
            Send Now
          </button>
          <button
            className={`sp-schedule-btn ${scheduleMode === 'scheduled' ? 'sp-schedule-btn--active' : ''}`}
            onClick={() => setScheduleMode('scheduled')}
          >
            Schedule
          </button>
        </div>
        {scheduleMode === 'scheduled' && (
          <div className="sp-datetime">
            <input
              type="date"
              value={scheduledDate}
              onChange={e => setScheduledDate(e.target.value)}
              className="sp-input"
            />
            <input
              type="time"
              value={scheduledTime}
              onChange={e => setScheduledTime(e.target.value)}
              className="sp-input"
            />
          </div>
        )}
      </div>

      {/* Send button */}
      <button
        className="sp-send-btn"
        disabled={!recipientCount || recipientCount === 0 || (scheduleMode === 'scheduled' && !scheduledDate)}
        onClick={() => setShowConfirm(true)}
      >
        {scheduleMode === 'now' ? 'Send Now' : 'Schedule Send'}
      </button>

      {/* Confirmation modal */}
      {showConfirm && (
        <div className="sp-confirm-overlay" onClick={() => !sending && setShowConfirm(false)}>
          <div className="sp-confirm" onClick={e => e.stopPropagation()}>
            <h4>{scheduleMode === 'now' ? 'Send now?' : 'Schedule send?'}</h4>
            <div className="sp-confirm-details">
              <div><strong>Subject:</strong> {draft.subject_line || draft.title}</div>
              <div><strong>To:</strong> {recipientCount} contact{recipientCount !== 1 ? 's' : ''}</div>
              {batches > 1 && (
                <div className="sp-batch-warn">
                  Will send in {batches} batches over {batches} days (100/day limit)
                </div>
              )}
              {scheduleMode === 'scheduled' && (
                <div><strong>Scheduled:</strong> {scheduledDate} at {scheduledTime}</div>
              )}
            </div>
            {sendError && <div className="sp-error">{sendError}</div>}
            <div className="sp-confirm-actions">
              <button
                className="sp-confirm-cancel"
                onClick={() => setShowConfirm(false)}
                disabled={sending}
              >
                Cancel
              </button>
              <button
                className="sp-confirm-send"
                onClick={handleSend}
                disabled={sending}
              >
                {sending ? 'Sending...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

**Step 2: Write the CSS**

```css
/* SendPanel.css — Newsletter send controls */

.sp-panel {
  padding: 1rem 1.25rem;
  border-top: 1px solid var(--cr-border, #e9ecef);
  background: var(--cr-surface, #fff);
}

.sp-title {
  font-size: 0.95rem;
  font-weight: 600;
  margin: 0 0 0.75rem;
  color: var(--cr-text, #1a1a2e);
}

.sp-section {
  margin-bottom: 0.75rem;
}

.sp-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--cr-text-secondary, #6c757d);
  margin-bottom: 0.375rem;
}

/* Chips */
.sp-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.sp-chip {
  padding: 0.3rem 0.65rem;
  border-radius: 999px;
  border: 1px solid var(--cr-border, #e9ecef);
  background: var(--cr-input-bg, #f8f9fa);
  color: var(--cr-text-secondary, #6c757d);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.15s;
}

.sp-chip:hover {
  border-color: var(--cr-purple, #5e17eb);
  color: var(--cr-purple, #5e17eb);
}

.sp-chip--active {
  background: var(--cr-purple, #5e17eb);
  border-color: var(--cr-purple, #5e17eb);
  color: #fff;
}

.sp-chip--tag {
  font-size: 0.75rem;
}

/* Count */
.sp-count {
  font-size: 0.85rem;
  margin: 0.5rem 0 0.75rem;
  color: var(--cr-text, #1a1a2e);
}

.sp-count-loading {
  color: var(--cr-text-muted, #adb5bd);
}

.sp-batch-warn {
  display: block;
  font-size: 0.75rem;
  color: var(--cr-gold, #E9A23B);
  margin-top: 0.25rem;
}

/* Schedule */
.sp-schedule-toggle {
  display: flex;
  gap: 0;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid var(--cr-border, #e9ecef);
}

.sp-schedule-btn {
  flex: 1;
  padding: 0.4rem 0.75rem;
  border: none;
  background: var(--cr-input-bg, #f8f9fa);
  color: var(--cr-text-secondary, #6c757d);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.15s;
}

.sp-schedule-btn--active {
  background: var(--cr-purple, #5e17eb);
  color: #fff;
}

.sp-datetime {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.sp-input {
  padding: 0.4rem 0.6rem;
  border: 1px solid var(--cr-border, #e9ecef);
  border-radius: 6px;
  font-size: 0.85rem;
  background: var(--cr-input-bg, #f8f9fa);
  color: var(--cr-text, #1a1a2e);
}

/* Send button */
.sp-send-btn {
  width: 100%;
  padding: 0.6rem;
  border-radius: 8px;
  border: none;
  background: var(--cr-purple, #5e17eb);
  color: #fff;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
  margin-top: 0.25rem;
}

.sp-send-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.sp-send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Confirmation modal */
.sp-confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.sp-confirm {
  background: #fff;
  border-radius: 12px;
  padding: 1.5rem;
  max-width: 380px;
  width: 90%;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
}

.sp-confirm h4 {
  margin: 0 0 0.75rem;
  font-size: 1.1rem;
}

.sp-confirm-details {
  font-size: 0.85rem;
  line-height: 1.6;
  margin-bottom: 1rem;
}

.sp-error {
  color: #dc3545;
  font-size: 0.8rem;
  margin-bottom: 0.5rem;
}

.sp-confirm-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.sp-confirm-cancel,
.sp-confirm-send {
  padding: 0.4rem 1rem;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
  border: none;
}

.sp-confirm-cancel {
  background: var(--cr-input-bg, #f8f9fa);
  color: var(--cr-text-secondary, #6c757d);
}

.sp-confirm-send {
  background: var(--cr-purple, #5e17eb);
  color: #fff;
}

.sp-confirm-send:disabled {
  opacity: 0.6;
}

/* Progress bar */
.sp-progress-bar {
  height: 8px;
  background: var(--cr-input-bg, #f8f9fa);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.sp-progress-fill {
  height: 100%;
  background: var(--cr-purple, #5e17eb);
  border-radius: 4px;
  transition: width 0.3s;
}

.sp-progress-text {
  font-size: 0.85rem;
}

.sp-failed {
  color: #dc3545;
}

.sp-next-batch {
  font-size: 0.8rem;
  color: var(--cr-text-secondary, #6c757d);
  margin-top: 0.25rem;
}

.sp-sent-badge {
  color: var(--cr-green, #22c55e);
  font-weight: 600;
}

.sp-result {
  font-size: 0.9rem;
  line-height: 1.6;
}
```

**Step 3: Commit**

```bash
git add src/components/content-review/SendPanel.jsx src/components/content-review/SendPanel.css
git commit -m "feat: add SendPanel component for newsletter segment/schedule/send"
```

---

## Task 6: Wire SendPanel into ContentReview Page

**Files:**
- Modify: `src/pages/ContentReview.jsx`
- Modify: `src/AppRouter.jsx` (add CSS import)

**Step 1: Import SendPanel in ContentReview.jsx**

Add to the imports at top of `src/pages/ContentReview.jsx` (after line 6):

```jsx
import SendPanel from '../components/content-review/SendPanel'
```

**Step 2: Add a reload callback**

Inside the `ContentReview` component, add a handler that reloads the current draft (to pick up status changes after sending). Place this after the existing `handleAddComment` function (around line 111):

```jsx
  const handleDraftStatusChange = () => {
    if (selectedDraftId) loadDraft(selectedDraftId)
    loadDrafts()
  }
```

**Step 3: Render SendPanel below MarkdownViewer**

In the JSX, find the section where `MarkdownViewer` is rendered (around line 177-180). Wrap MarkdownViewer and SendPanel together:

Replace:
```jsx
          {currentDraft ? (
            <MarkdownViewer
              draft={currentDraft}
              comments={comments}
              onAddComment={handleAddComment}
            />
          ) : (
            <div className="cr-viewer-empty">Select a draft to review</div>
          )}
```

With:
```jsx
          {currentDraft ? (
            <div className="cr-viewer-wrapper">
              <MarkdownViewer
                draft={currentDraft}
                comments={comments}
                onAddComment={handleAddComment}
              />
              <SendPanel
                draft={currentDraft}
                onStatusChange={handleDraftStatusChange}
              />
            </div>
          ) : (
            <div className="cr-viewer-empty">Select a draft to review</div>
          )}
```

**Step 4: Add the CSS import to AppRouter.jsx**

In `src/AppRouter.jsx`, add after the ContentReview.css import (line 260):

```jsx
import './components/content-review/SendPanel.css'
```

**Step 5: Add wrapper CSS**

Add to `src/pages/ContentReview.css` at the end:

```css
/* Wrapper for viewer + send panel */
.cr-viewer-wrapper {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}
```

**Step 6: Verify locally**

Run: `cd ~/creations/Findmyflow && npm run dev`

Navigate to `/content-review`. Select a draft. Confirm:
- SendPanel appears below the markdown content
- Source chips render (All, External, CRM, Quiz Leads)
- Recipient count shows (should show existing crm_contacts + public_leads counts)
- Send Now / Schedule toggle works
- Clicking Send Now shows confirmation modal

**Step 7: Commit**

```bash
git add src/pages/ContentReview.jsx src/AppRouter.jsx src/pages/ContentReview.css
git commit -m "feat: wire SendPanel into ContentReview page"
```

---

## Task 7: End-to-End Test (Manual)

Verify the full flow works.

**Step 1: Seed a test contact**

Run SQL on project `qlwfcfypnoptsocdpxuv`:

```sql
INSERT INTO external_contacts (email, name, source, tags)
VALUES ('huzz@nichuzz.com', 'Huzz (test)', 'manual', ARRAY['test']);
```

**Step 2: Verify a draft exists**

Run SQL:
```sql
SELECT id, title, subject_line, status FROM content_drafts LIMIT 5;
```

If no drafts exist, insert a test draft:
```sql
INSERT INTO content_drafts (title, subject_line, body_markdown, status, created_by)
VALUES (
  'Test Newsletter',
  'Test Subject Line',
  '# Hello\n\nThis is a **test newsletter** from FindMyFlow.\n\n- Item 1\n- Item 2\n\nCheers,\nHuzz',
  'review',
  'huzz'
);
```

**Step 3: Test the full flow in the UI**

1. Go to `/content-review`
2. Select the test draft
3. In SendPanel, select "External" source
4. Confirm count shows "1 recipient"
5. Click "Send Now"
6. Confirm in the modal
7. Check: did the email arrive at huzz@nichuzz.com?

**Step 4: Verify the send was logged**

Run SQL:
```sql
SELECT recipient_email, status, resend_id, sent_at
FROM newsletter_sends
ORDER BY created_at DESC
LIMIT 5;
```

Expected: one row with status 'sent', a resend_id, and a sent_at timestamp.

**Step 5: Verify draft status updated**

Run SQL:
```sql
SELECT id, title, status, sent_at FROM content_drafts
WHERE title = 'Test Newsletter';
```

Expected: status = 'sent', sent_at populated.

**Step 6: Clean up test data**

```sql
DELETE FROM newsletter_sends WHERE recipient_email = 'huzz@nichuzz.com';
DELETE FROM external_contacts WHERE email = 'huzz@nichuzz.com' AND source = 'manual';
-- Only delete test draft if you created one:
-- DELETE FROM content_drafts WHERE title = 'Test Newsletter';
```

---

## Summary

| Task | What | Files |
|------|------|-------|
| 1 | DB migration (tables + RLS) | `supabase/migrations/20260213100000_newsletter_sending.sql` |
| 2 | Newsletter service (frontend) | `src/lib/newsletterService.js` |
| 3 | Send newsletter edge function | `supabase/functions/send-newsletter/index.ts` |
| 4 | Scheduled processor edge function | `supabase/functions/process-scheduled-newsletters/index.ts` |
| 5 | SendPanel UI component | `src/components/content-review/SendPanel.jsx` + `.css` |
| 6 | Wire into ContentReview | Modify `ContentReview.jsx`, `AppRouter.jsx`, `ContentReview.css` |
| 7 | End-to-end manual test | SQL + UI verification |

**Total new files:** 5 (1 migration, 1 service, 2 edge functions, 1 component + CSS)
**Modified files:** 3 (ContentReview.jsx, AppRouter.jsx, ContentReview.css)
**Estimated tasks:** 7 tasks, each 5-15 mins
