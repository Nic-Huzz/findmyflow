/**
 * Notify Lead Capture Edge Function
 *
 * Sends an email to huzz@nichuzz.com whenever a new lead captures their email
 * in any public flow (offer audit, money model, career clarity, waitlist, signup).
 * Uses Resend for email delivery.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const NOTIFY_EMAIL = 'huzz@nichuzz.com'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, name, source, meta } = await req.json()

    if (!email || !source) {
      return new Response(
        JSON.stringify({ error: 'email and source are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const timestamp = new Date().toLocaleString('en-AU', { timeZone: 'Australia/Sydney' })

    // Build meta rows if extra context provided
    const metaRows = meta
      ? Object.entries(meta)
          .filter(([, v]) => v != null && v !== '')
          .map(([k, v]) => `<p style="margin:6px 0;color:#374151;"><strong>${k}:</strong> ${v}</p>`)
          .join('')
      : ''

    const emailHtml = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <div style="background:linear-gradient(135deg,#5e17eb,#7c3aed);padding:24px 30px;border-radius:16px 16px 0 0;text-align:center;">
          <h1 style="color:white;margin:0;font-size:22px;">New Lead Captured</h1>
          <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:14px;">${source}</p>
        </div>
        <div style="background:#f9fafb;padding:24px 30px;border-radius:0 0 16px 16px;">
          <div style="background:white;border:1px solid #e5e7eb;border-radius:12px;padding:18px;margin-bottom:16px;">
            <p style="margin:6px 0;color:#374151;font-size:16px;"><strong>${name || 'Anonymous'}</strong></p>
            <p style="margin:6px 0;color:#5e17eb;font-size:16px;">${email}</p>
          </div>
          ${metaRows ? `
          <div style="background:white;border:1px solid #e5e7eb;border-radius:12px;padding:18px;margin-bottom:16px;">
            <h3 style="color:#7c3aed;margin:0 0 10px;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Details</h3>
            ${metaRows}
          </div>` : ''}
          <p style="font-size:12px;color:#9ca3af;margin:0;text-align:right;">${timestamp} AEST</p>
        </div>
      </div>
    `

    if (resendApiKey) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'FindMyFlow <notifications@findmyflow.nichuzz.com>',
          to: NOTIFY_EMAIL,
          subject: `New lead: ${name || email} — ${source}`,
          html: emailHtml,
        }),
      })

      if (!res.ok) {
        const err = await res.text()
        console.error('Resend error:', err)
        return new Response(
          JSON.stringify({ error: 'Failed to send notification', details: err }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log(`Lead notification sent: ${email} from ${source}`)
    } else {
      console.log('RESEND_API_KEY not set — would notify:', { email, name, source })
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('Error in notify-lead-capture:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
