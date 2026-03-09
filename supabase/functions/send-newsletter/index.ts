/**
 * Send Newsletter Edge Function
 *
 * Sends newsletters via Resend to segmented contact pools.
 * Handles batching (100/day limit), deduplication, and staggered scheduling.
 *
 * POST body: { draft_id, segment, scheduled_for? }
 *
 * segment shape:
 *   { sources: ['all'] | ['external', 'crm', 'leads'], tags?: string[] }
 *
 * NOTE: Requires RESEND_API_KEY environment variable.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const DAILY_LIMIT = 100
const FROM_ADDRESS = 'Huzz <huzz@nichuzz.com>'

// ---------------------------------------------------------------------------
// Simple Markdown to HTML converter
// ---------------------------------------------------------------------------

function simpleMarkdownToHtml(md: string): string {
  let html = md

  // Headings (### before ## before #)
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>')

  // Horizontal rules
  html = html.replace(/^---+$/gm, '<hr>')

  // Bold and italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')

  // Images (must come before links to avoid ![alt](url) matching as link)
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; height: auto; border-radius: 8px; margin: 12px 0;">')

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')

  // Unordered lists: collapse consecutive "- " lines into <ul>
  html = html.replace(/(^- .+$\n?)+/gm, (block) => {
    const items = block.trim().split('\n').map((line) => {
      return `<li>${line.replace(/^- /, '')}</li>`
    }).join('')
    return `<ul>${items}</ul>\n`
  })

  // Ordered lists: collapse consecutive "1. " style lines into <ol>
  html = html.replace(/(^\d+\. .+$\n?)+/gm, (block) => {
    const items = block.trim().split('\n').map((line) => {
      return `<li>${line.replace(/^\d+\. /, '')}</li>`
    }).join('')
    return `<ol>${items}</ol>\n`
  })

  // Paragraphs: wrap remaining text blocks that are not already wrapped in tags
  const lines = html.split('\n')
  const processed: string[] = []
  let buffer = ''

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed === '') {
      if (buffer) {
        processed.push(`<p>${buffer}</p>`)
        buffer = ''
      }
    } else if (/^<(h[1-6]|ul|ol|li|hr|p|div|blockquote|img)/.test(trimmed)) {
      if (buffer) {
        processed.push(`<p>${buffer}</p>`)
        buffer = ''
      }
      processed.push(trimmed)
    } else {
      buffer += (buffer ? '<br>' : '') + trimmed
    }
  }
  if (buffer) {
    processed.push(`<p>${buffer}</p>`)
  }

  const body = processed.join('\n')

  return `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #333;">${body}</div>`
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: 'RESEND_API_KEY is not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // -----------------------------------------------------------------------
    // Authenticate caller — verify JWT and check admin_users
    // -----------------------------------------------------------------------
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    })

    const { data: { user }, error: authError } = await userClient.auth.getUser(token)
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: adminCheck } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', user.id)
      .single()

    if (!adminCheck) {
      return new Response(
        JSON.stringify({ error: 'Forbidden — admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { draft_id, segment, scheduled_for, test_email } = await req.json()

    // -----------------------------------------------------------------------
    // Test mode — send to a single address, no DB side effects
    // -----------------------------------------------------------------------
    if (test_email) {
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

      const subject = `[TEST] ${draft.subject_line || draft.title || 'Newsletter'}`
      let htmlBody: string
      if (draft.body_html) htmlBody = draft.body_html
      else if (draft.body_markdown) htmlBody = simpleMarkdownToHtml(draft.body_markdown)
      else htmlBody = '<p>No content</p>'

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: FROM_ADDRESS,
          to: test_email,
          subject,
          html: htmlBody,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        return new Response(
          JSON.stringify({ error: errorData.message || `Resend error ${response.status}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: true, test: true, sent_to: test_email }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // -----------------------------------------------------------------------
    // Validate segment
    // -----------------------------------------------------------------------
    if (!segment || !segment.sources || !Array.isArray(segment.sources) || segment.sources.length === 0) {
      return new Response(
        JSON.stringify({ error: 'segment.sources is required and must be a non-empty array' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // -----------------------------------------------------------------------
    // Fetch draft
    // -----------------------------------------------------------------------
    const { data: draft, error: draftError } = await supabase
      .from('content_drafts')
      .select('*')
      .eq('id', draft_id)
      .single()

    if (draftError || !draft) {
      return new Response(
        JSON.stringify({ error: 'Draft not found', detail: draftError?.message }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!['review', 'approved'].includes(draft.status)) {
      return new Response(
        JSON.stringify({ error: `Cannot send draft with status "${draft.status}". Must be "review" or "approved".` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // -----------------------------------------------------------------------
    // Collect recipients from pools
    // -----------------------------------------------------------------------
    const queryAll = segment.sources.includes('all')
    const tags: string[] | undefined = segment.tags && segment.tags.length > 0 ? segment.tags : undefined

    // Map: lowercased email -> { email (original case), source }
    const recipientMap = new Map<string, { email: string; source: string }>()

    // 1) external_contacts
    if (queryAll || segment.sources.includes('external')) {
      let query = supabase
        .from('external_contacts')
        .select('email')
        .eq('subscribed', true)

      if (tags) {
        query = query.overlaps('tags', tags)
      }

      const { data: externals } = await query
      if (externals) {
        for (const row of externals) {
          if (row.email) {
            const key = row.email.toLowerCase()
            if (!recipientMap.has(key)) {
              recipientMap.set(key, { email: row.email, source: 'external' })
            }
          }
        }
      }
    }

    // 2) crm_contacts
    if (queryAll || segment.sources.includes('crm')) {
      let query = supabase
        .from('crm_contacts')
        .select('email')
        .not('email', 'is', null)

      if (tags) {
        query = query.overlaps('tags', tags)
      }

      const { data: crmContacts } = await query
      if (crmContacts) {
        for (const row of crmContacts) {
          if (row.email) {
            const key = row.email.toLowerCase()
            if (!recipientMap.has(key)) {
              recipientMap.set(key, { email: row.email, source: 'crm' })
            }
          }
        }
      }
    }

    // 3) public_leads (no tags column — include when findmyflow tag
    //    is selected or no tags are active, since quiz leads are FMF users)
    if (queryAll || segment.sources.includes('leads')) {
      const includeLeads = !tags || tags.includes('findmyflow')
      if (includeLeads) {
        const { data: leads } = await supabase
          .from('public_leads')
          .select('email')
          .not('email', 'is', null)

        if (leads) {
          for (const row of leads) {
            if (row.email) {
              const key = row.email.toLowerCase()
              if (!recipientMap.has(key)) {
                recipientMap.set(key, { email: row.email, source: 'leads' })
              }
            }
          }
        }
      }
    }

    const recipients = Array.from(recipientMap.values())
    const total = recipients.length

    if (total === 0) {
      return new Response(
        JSON.stringify({ success: true, total: 0, sent_now: 0, scheduled_later: 0, batches: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // -----------------------------------------------------------------------
    // Prepare email content
    // -----------------------------------------------------------------------
    const subject = draft.subject_line || draft.title || 'Newsletter'
    let htmlBody: string

    if (draft.body_html) {
      htmlBody = draft.body_html
    } else if (draft.body_markdown) {
      htmlBody = simpleMarkdownToHtml(draft.body_markdown)
    } else {
      htmlBody = '<p>No content</p>'
    }

    // -----------------------------------------------------------------------
    // Determine base time and batching
    // -----------------------------------------------------------------------
    const now = new Date()
    let baseTime: Date

    if (scheduled_for) {
      const parsed = new Date(scheduled_for)
      // If scheduled_for is in the future, use it. Otherwise treat as "now".
      baseTime = parsed > now ? parsed : now
    } else {
      baseTime = now
    }

    const sendImmediately = baseTime.getTime() <= now.getTime()
    const totalBatches = Math.ceil(total / DAILY_LIMIT)

    // -----------------------------------------------------------------------
    // Insert all recipients into newsletter_sends with staggered schedule
    // -----------------------------------------------------------------------
    const sendRows = recipients.map((r, i) => {
      const batchIndex = Math.floor(i / DAILY_LIMIT)
      const batchTime = new Date(baseTime.getTime() + batchIndex * 24 * 60 * 60 * 1000)

      return {
        draft_id,
        recipient_email: r.email,
        recipient_source: r.source,
        status: 'queued',
        scheduled_for: batchTime.toISOString(),
      }
    })

    // Insert in chunks (Supabase has row limits per insert)
    const CHUNK_SIZE = 500
    const insertedIds: string[] = []

    for (let i = 0; i < sendRows.length; i += CHUNK_SIZE) {
      const chunk = sendRows.slice(i, i + CHUNK_SIZE)
      const { data: inserted, error: insertError } = await supabase
        .from('newsletter_sends')
        .insert(chunk)
        .select('id, recipient_email, scheduled_for')

      if (insertError) {
        console.error('Insert error:', insertError.message)
        throw new Error(`Failed to insert newsletter_sends: ${insertError.message}`)
      }

      if (inserted) {
        for (const row of inserted) {
          insertedIds.push(row.id)
        }
      }
    }

    // -----------------------------------------------------------------------
    // Send first batch immediately if applicable
    // -----------------------------------------------------------------------
    let sentNow = 0

    if (sendImmediately) {
      // Get the first batch (first DAILY_LIMIT rows that were just inserted)
      const { data: firstBatch } = await supabase
        .from('newsletter_sends')
        .select('id, recipient_email')
        .eq('draft_id', draft_id)
        .eq('status', 'queued')
        .order('scheduled_for', { ascending: true })
        .limit(DAILY_LIMIT)

      if (firstBatch) {
        for (const row of firstBatch) {
          try {
            const response = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                from: FROM_ADDRESS,
                to: row.recipient_email,
                subject,
                html: htmlBody,
              }),
            })

            if (!response.ok) {
              const errorData = await response.json()
              throw new Error(errorData.message || `Resend error ${response.status}`)
            }

            const resendResult = await response.json()

            await supabase
              .from('newsletter_sends')
              .update({
                status: 'sent',
                resend_id: resendResult.id || null,
                sent_at: new Date().toISOString(),
              })
              .eq('id', row.id)

            sentNow++
          } catch (sendError: any) {
            console.error(`Failed to send to ${row.recipient_email}:`, sendError.message)

            await supabase
              .from('newsletter_sends')
              .update({
                status: 'failed',
                error_message: sendError.message,
              })
              .eq('id', row.id)
          }
        }
      }
    }

    // -----------------------------------------------------------------------
    // Update draft status
    // -----------------------------------------------------------------------
    const scheduledLater = total - sentNow
    const allDone = scheduledLater === 0
    const draftStatus = allDone ? 'sent' : 'sending'

    await supabase
      .from('content_drafts')
      .update({
        status: draftStatus,
        segment,
        scheduled_for: baseTime.toISOString(),
        sent_at: sendImmediately ? new Date().toISOString() : null,
      })
      .eq('id', draft_id)

    // -----------------------------------------------------------------------
    // Response
    // -----------------------------------------------------------------------
    return new Response(
      JSON.stringify({
        success: true,
        total,
        sent_now: sentNow,
        scheduled_later: scheduledLater,
        batches: totalBatches,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Error in send-newsletter:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
