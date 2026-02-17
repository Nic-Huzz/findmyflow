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

    // -----------------------------------------------------------------------
    // Auth guard — verify caller is admin or service role
    // -----------------------------------------------------------------------
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    // Allow service role key (for cron) or validate user JWT as admin
    if (token !== supabaseServiceKey) {
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
      // Temp service client to check admin
      const tempSupa = createClient(supabaseUrl, supabaseServiceKey)
      const { data: adminCheck } = await tempSupa
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

    // 4. Check if any drafts are now fully processed
    for (const draftId of draftIds) {
      const { data: remaining } = await supabase
        .from('newsletter_sends')
        .select('id')
        .eq('draft_id', draftId)
        .eq('status', 'queued')
        .limit(1)

      if (!remaining || remaining.length === 0) {
        // Check if at least one email was actually delivered
        const { count: sentCount } = await supabase
          .from('newsletter_sends')
          .select('id', { count: 'exact', head: true })
          .eq('draft_id', draftId)
          .eq('status', 'sent')

        const finalStatus = (sentCount && sentCount > 0) ? 'sent' : 'failed'

        await supabase
          .from('content_drafts')
          .update({
            status: finalStatus,
            sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
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
