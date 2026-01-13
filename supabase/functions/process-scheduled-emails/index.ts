/**
 * Process Scheduled Emails Edge Function
 *
 * Called by cron job to send due emails.
 * Fetches personalization tokens, renders templates, sends via Resend/Kit.
 *
 * NOTE: Requires RESEND_API_KEY environment variable.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Email templates (simplified versions - full templates in src/lib/emailTemplates.js)
// In production, these would be fetched or imported properly
const EMAIL_TEMPLATES = {
  money_model: {
    day_0: { subject: "{{name}}, your {{offer_type}} strategy is ready" },
    day_1: { subject: "The hidden reason {{offer_type}} feels hard" },
    day_3: { subject: "How {{offer_type}} creators are earning without burnout" },
    day_5: { subject: "{{name}}, the missing piece in your strategy" },
    day_7: { subject: "Your personalized roadmap is waiting, {{name}}" }
  },
  nervous_system: {
    day_0: { subject: "{{name}}, your {{archetype}} pattern revealed" },
    day_1: { subject: "Why knowing your pattern isn't enough" },
    day_3: { subject: "How {{archetype}}s break through" },
    day_5: { subject: "The business strategy that matches your wiring" },
    day_7: { subject: "Ready to expand beyond {{edge_earning}}/year?" }
  }
}

function personalizeText(text: string, tokens: Record<string, any>): string {
  let result = text
  Object.entries(tokens).forEach(([key, value]) => {
    const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
    result = result.replace(placeholder, String(value || ''))
  })
  return result.replace(/\{\{[^}]+\}\}/g, '') // Clean unreplaced
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const resendApiKey = Deno.env.get('RESEND_API_KEY')

    if (!resendApiKey) {
      console.warn('RESEND_API_KEY not set - emails will be logged but not sent')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Find due emails
    const now = new Date().toISOString()
    const { data: dueEmails, error: fetchError } = await supabase
      .from('email_sequence_emails')
      .select(`
        id,
        email_key,
        enrollment:email_sequence_enrollments (
          id,
          sequence_type,
          status,
          lead:public_leads (
            id,
            email,
            personalization_tokens
          )
        )
      `)
      .eq('status', 'scheduled')
      .lte('scheduled_for', now)
      .limit(50) // Process in batches

    if (fetchError) {
      throw new Error(`Failed to fetch due emails: ${fetchError.message}`)
    }

    if (!dueEmails || dueEmails.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No emails due', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let sent = 0
    let failed = 0
    const results: any[] = []

    for (const email of dueEmails) {
      const enrollment = email.enrollment as any
      const lead = enrollment?.lead as any

      // Skip if enrollment is not active
      if (enrollment?.status !== 'active') {
        await supabase
          .from('email_sequence_emails')
          .update({ status: 'cancelled' })
          .eq('id', email.id)
        continue
      }

      const sequenceType = enrollment?.sequence_type
      const tokens = lead?.personalization_tokens || {}
      const recipientEmail = lead?.email

      if (!recipientEmail) {
        await supabase
          .from('email_sequence_emails')
          .update({ status: 'failed', error_message: 'No recipient email' })
          .eq('id', email.id)
        failed++
        continue
      }

      // Get template
      const template = EMAIL_TEMPLATES[sequenceType]?.[email.email_key]
      if (!template) {
        await supabase
          .from('email_sequence_emails')
          .update({ status: 'failed', error_message: 'Template not found' })
          .eq('id', email.id)
        failed++
        continue
      }

      const subject = personalizeText(template.subject, tokens)

      // Send email via Resend (or log if no API key)
      try {
        if (resendApiKey) {
          const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              from: 'Huzz <huzz@findmyflow.nichuzz.com>',
              to: recipientEmail,
              subject: subject,
              // In production, would include full HTML body
              text: `This is email ${email.email_key} from the ${sequenceType} sequence. Full content coming soon!`
            })
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.message || 'Failed to send via Resend')
          }
        } else {
          console.log(`[DRY RUN] Would send email to ${recipientEmail}: ${subject}`)
        }

        // Mark as sent
        await supabase
          .from('email_sequence_emails')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('id', email.id)

        sent++
        results.push({ email_id: email.id, to: recipientEmail, subject, status: 'sent' })

      } catch (sendError: any) {
        await supabase
          .from('email_sequence_emails')
          .update({ status: 'failed', error_message: sendError.message })
          .eq('id', email.id)
        failed++
        results.push({ email_id: email.id, to: recipientEmail, status: 'failed', error: sendError.message })
      }
    }

    // Check for completed sequences
    const completedEnrollmentIds = [...new Set(dueEmails.map(e => (e.enrollment as any)?.id).filter(Boolean))]

    for (const enrollmentId of completedEnrollmentIds) {
      const { data: remaining } = await supabase
        .from('email_sequence_emails')
        .select('id')
        .eq('enrollment_id', enrollmentId)
        .eq('status', 'scheduled')

      if (!remaining || remaining.length === 0) {
        await supabase
          .from('email_sequence_enrollments')
          .update({ status: 'completed', completed_at: new Date().toISOString() })
          .eq('id', enrollmentId)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: dueEmails.length,
        sent,
        failed,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error processing emails:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
