import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

/**
 * notify-app-build-interest
 *
 * Called from AppBuildInterest.jsx when a user clicks "I'm interested".
 * Sends a notification email to Huzz via Resend.
 */

const RESEND_KEY = Deno.env.get('RESEND_KEY') || ''
const NOTIFY_EMAILS = ['huzz@nichuzz.com', 'nichurrell@icloud.com']

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const { userEmail, userName, userId } = await req.json()

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Vibe Rise <huzz@nichuzz.com>',
        to: NOTIFY_EMAILS,
        subject: `Build an App interest: ${userName || userEmail || 'Unknown'}`,
        html: `
          <div style="font-family: -apple-system, sans-serif; padding: 20px; max-width: 500px;">
            <h2 style="color: #E9A23B; margin-bottom: 8px;">New "Build an App" Interest</h2>
            <p><strong>Name:</strong> ${userName || 'Not set'}</p>
            <p><strong>Email:</strong> ${userEmail || 'Not set'}</p>
            <p><strong>User ID:</strong> ${userId || 'Unknown'}</p>
            <p><strong>Expressed interest:</strong> ${new Date().toISOString()}</p>
            <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 20px 0;" />
            <p style="color: #999; font-size: 13px;">
              <a href="https://supabase.com/dashboard/project/qlwfcfypnoptsocdpxuv" style="color: #5e17eb;">View in Supabase</a>
            </p>
          </div>
        `,
      }),
    })

    const result = await res.json()

    return new Response(
      JSON.stringify({ success: true, email_id: result.id }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('notify-app-build-interest error:', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
