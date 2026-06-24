import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import webpush from 'npm:web-push@3.6.7'
import { encode as base64url } from 'https://deno.land/std@0.168.0/encoding/base64url.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// --- APNs JWT Token Generation ---

let cachedApnsToken: { token: string; expires: number } | null = null

async function getApnsJwt(): Promise<string> {
  // Reuse token if valid (APNs tokens last 60 min, we refresh at 50)
  if (cachedApnsToken && Date.now() < cachedApnsToken.expires) {
    return cachedApnsToken.token
  }

  const keyId = Deno.env.get('APNS_KEY_ID')
  const teamId = Deno.env.get('APNS_TEAM_ID')
  const keyP8 = Deno.env.get('APNS_KEY_P8')

  if (!keyId || !teamId || !keyP8) {
    throw new Error('APNs credentials not configured (APNS_KEY_ID, APNS_TEAM_ID, APNS_KEY_P8)')
  }

  // Build JWT header + claims
  const header = { alg: 'ES256', kid: keyId }
  const now = Math.floor(Date.now() / 1000)
  const claims = { iss: teamId, iat: now }

  const encodedHeader = base64url(new TextEncoder().encode(JSON.stringify(header)))
  const encodedClaims = base64url(new TextEncoder().encode(JSON.stringify(claims)))
  const signingInput = `${encodedHeader}.${encodedClaims}`

  // Import the P8 private key
  const pemBody = keyP8
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s/g, '')

  const keyData = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0))

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    keyData,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  )

  // Sign
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    cryptoKey,
    new TextEncoder().encode(signingInput)
  )

  // Convert DER signature to raw r||s format for JWT
  const sigBytes = new Uint8Array(signature)
  const encodedSig = base64url(sigBytes)

  const jwt = `${signingInput}.${encodedSig}`

  // Cache for 50 minutes
  cachedApnsToken = { token: jwt, expires: Date.now() + 50 * 60 * 1000 }
  return jwt
}

// --- Send via APNs HTTP/2 ---

async function sendApns(deviceToken: string, payload: object, bundleId: string): Promise<void> {
  const jwt = await getApnsJwt()

  // Use production APNs endpoint
  const url = `https://api.push.apple.com/3/device/${deviceToken}`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'authorization': `bearer ${jwt}`,
      'apns-topic': bundleId,
      'apns-push-type': 'alert',
      'apns-priority': '10',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      aps: {
        alert: {
          title: (payload as any).title,
          body: (payload as any).body || '',
        },
        sound: 'default',
        badge: 1,
      },
      url: (payload as any).url || '/',
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw Object.assign(new Error(`APNs error: ${response.status} ${errorBody}`), {
      statusCode: response.status,
    })
  }
}

// --- Main Handler ---

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId, title, body, url, tag } = await req.json()

    if (!userId || !title) {
      return new Response(
        JSON.stringify({ error: 'userId and title are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: subscriptions, error: fetchError } = await supabaseClient
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId)

    if (fetchError) {
      console.error('Error fetching subscriptions:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch subscriptions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No subscriptions found for user' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Split subscriptions by type
    const apnsSubs = subscriptions.filter(s => s.endpoint?.startsWith('apns://'))
    const webSubs = subscriptions.filter(s => !s.endpoint?.startsWith('apns://'))

    const payload = { title, body: body || '', url: url || '/', tag: tag || 'default' }

    const results: Array<{ success: boolean; endpoint: string; error?: string }> = []

    // --- Send to APNs devices ---
    if (apnsSubs.length > 0) {
      const bundleId = Deno.env.get('APNS_BUNDLE_ID') || 'com.nichuzz.viberise'

      for (const sub of apnsSubs) {
        try {
          const deviceToken = sub.keys?.token || sub.endpoint.replace('apns://', '')
          await sendApns(deviceToken, payload, bundleId)
          results.push({ success: true, endpoint: sub.endpoint })
        } catch (error: any) {
          console.error('APNs error:', error.message)

          // 410 Gone = token expired, clean up
          if (error.statusCode === 410 || error.statusCode === 400) {
            await supabaseClient
              .from('push_subscriptions')
              .delete()
              .eq('endpoint', sub.endpoint)
          }

          results.push({ success: false, endpoint: sub.endpoint, error: error.message })
        }
      }
    }

    // --- Send to Web Push devices ---
    if (webSubs.length > 0) {
      const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')
      const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')
      const vapidEmail = Deno.env.get('VAPID_EMAIL')

      if (!vapidPublicKey || !vapidPrivateKey || !vapidEmail) {
        console.error('VAPID keys not configured, skipping web push')
      } else {
        const formattedEmail = vapidEmail.startsWith('mailto:') ? vapidEmail : `mailto:${vapidEmail}`
        webpush.setVapidDetails(formattedEmail, vapidPublicKey, vapidPrivateKey)

        const webPayload = JSON.stringify({
          ...payload,
          icon: '/icon-192.png',
          badge: '/badge-72x72.png',
          timestamp: Date.now(),
        })

        for (const sub of webSubs) {
          try {
            await webpush.sendNotification(
              { endpoint: sub.endpoint, keys: sub.keys },
              webPayload
            )
            results.push({ success: true, endpoint: sub.endpoint })
          } catch (error: any) {
            console.error('Web push error:', error.message)

            if (error.statusCode === 410 || error.statusCode === 404) {
              await supabaseClient
                .from('push_subscriptions')
                .delete()
                .eq('endpoint', sub.endpoint)
            }

            results.push({ success: false, endpoint: sub.endpoint, error: error.message })
          }
        }
      }
    }

    const sent = results.filter(r => r.success).length
    const failed = results.length - sent

    return new Response(
      JSON.stringify({ success: true, sent, failed, total: subscriptions.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Error in send-push-notification function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
