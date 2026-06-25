import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

/**
 * notify-league-interest
 *
 * Called by a Supabase database webhook on league_signups INSERT.
 * Sends an email to Huzz via Resend when someone expresses interest in Fantasy League.
 *
 * Dashboard webhook setup:
 *   Table: public.league_signups
 *   Events: INSERT
 *   Type: HTTP Request (POST)
 *   URL: https://qlwfcfypnoptsocdpxuv.supabase.co/functions/v1/notify-league-interest
 *   Header: Authorization: Bearer <service_role_key>
 */

const RESEND_KEY = Deno.env.get('RESEND_KEY') || ''
const NOTIFY_EMAIL = 'huzz@nichuzz.com'

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
    const payload = await req.json()
    const record = payload.record || payload

    const name = record.name || 'Unknown'
    const email = record.email || 'No email provided'
    const whatsapp = record.whatsapp || 'Not provided'
    const teamReadiness = record.team_readiness || 'unknown'
    const teamName = record.team_name || 'None'
    const userId = record.user_id || 'anonymous'
    const createdAt = record.created_at || new Date().toISOString()

    const readinessLabel = {
      'solo': 'Playing solo',
      'friends': 'Has friends in mind',
      'ready': 'Team ready to go',
    }[teamReadiness] || teamReadiness

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Vibe Rise <huzz@nichuzz.com>',
        to: NOTIFY_EMAIL,
        subject: `Fantasy League interest: ${name}`,
        html: `
          <div style="font-family: -apple-system, sans-serif; padding: 20px; max-width: 500px;">
            <h2 style="color: #5e17eb; margin-bottom: 8px;">New Fantasy League Interest</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>WhatsApp:</strong> ${whatsapp}</p>
            <p><strong>Team status:</strong> ${readinessLabel}</p>
            ${teamName !== 'None' ? `<p><strong>Team name:</strong> ${teamName}</p>` : ''}
            <p><strong>User ID:</strong> ${userId}</p>
            <p><strong>Expressed interest:</strong> ${createdAt}</p>
            <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 20px 0;" />
            <p style="color: #999; font-size: 13px;">
              Reply to confirm their spot in Season 1.
            </p>
          </div>
        `,
      }),
    })

    const result = await res.json()

    return new Response(
      JSON.stringify({ success: true, email_id: result.id, player_name: name }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('notify-league-interest error:', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
