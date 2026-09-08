import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import webpush from 'npm:web-push@3.6.7'
import { encode as base64url } from 'https://deno.land/std@0.168.0/encoding/base64url.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const NUDGE_24H = {
  title: 'Your journey continues',
  body: "It's been a day since you last checked in. Your quests are waiting.",
  url: '/7-day-challenge',
  tag: 'inactivity-24h',
}

const FAREWELL_7D = {
  title: "We'll stop sending notifications",
  body: "It's been a week. We'll pause notifications until you're back. Your progress is saved.",
  url: '/7-day-challenge',
  tag: 'inactivity-7d',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Scheduled notifications check running...')

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch users with notification preferences who aren't paused and have a last_seen_at
    const { data: prefs, error: prefsError } = await supabaseClient
      .from('notification_preferences')
      .select('user_id, last_seen_at, notifications_paused')
      .eq('notifications_paused', false)
      .not('last_seen_at', 'is', null)

    if (prefsError) {
      console.error('Error fetching preferences:', prefsError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch preferences', details: prefsError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!prefs || prefs.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No eligible users found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Determine which users need a nudge based on elapsed time since last_seen_at
    const now = Date.now()
    const HOUR = 60 * 60 * 1000

    const nudge24hUserIds: string[] = []
    const farewell7dUserIds: string[] = []

    for (const pref of prefs) {
      const elapsed = now - new Date(pref.last_seen_at).getTime()
      const elapsedHours = elapsed / HOUR

      if (elapsedHours >= 23 && elapsedHours <= 25) {
        nudge24hUserIds.push(pref.user_id)
      } else if (elapsedHours >= 156 && elapsedHours <= 180) {
        // 6 days 12 hours = 156h, 7 days 12 hours = 180h
        farewell7dUserIds.push(pref.user_id)
      }
    }

    const allTargetUserIds = [...nudge24hUserIds, ...farewell7dUserIds]

    if (allTargetUserIds.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No notifications to send at this time' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch push subscriptions for targeted users only
    const { data: subscriptions, error: fetchError } = await supabaseClient
      .from('push_subscriptions')
      .select('*')
      .in('user_id', allTargetUserIds)

    if (fetchError) {
      console.error('Error fetching subscriptions:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch subscriptions', details: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No push subscriptions for targeted users' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Build notifications list
    const nudge24hSet = new Set(nudge24hUserIds)
    const farewell7dSet = new Set(farewell7dUserIds)

    const notificationsToSend: Array<{ subscription: any; notification: typeof NUDGE_24H }> = []

    for (const sub of subscriptions) {
      if (farewell7dSet.has(sub.user_id)) {
        notificationsToSend.push({ subscription: sub, notification: FAREWELL_7D })
      } else if (nudge24hSet.has(sub.user_id)) {
        notificationsToSend.push({ subscription: sub, notification: NUDGE_24H })
      }
    }

    console.log(`Sending ${notificationsToSend.length} notifications (24h: ${nudge24hUserIds.length} users, 7d: ${farewell7dUserIds.length} users)`)

    // --- APNs JWT helper ---
    let cachedApnsToken: { token: string; expires: number } | null = null

    async function getApnsJwt(): Promise<string> {
      if (cachedApnsToken && Date.now() < cachedApnsToken.expires) {
        return cachedApnsToken.token
      }
      const keyId = Deno.env.get('APNS_KEY_ID')!
      const teamId = Deno.env.get('APNS_TEAM_ID')!
      const keyP8 = Deno.env.get('APNS_KEY_P8')!
      const header = { alg: 'ES256', kid: keyId }
      const iat = Math.floor(Date.now() / 1000)
      const claims = { iss: teamId, iat }
      const encodedHeader = base64url(new TextEncoder().encode(JSON.stringify(header)))
      const encodedClaims = base64url(new TextEncoder().encode(JSON.stringify(claims)))
      const signingInput = `${encodedHeader}.${encodedClaims}`
      const pemBody = keyP8
        .replace(/-----BEGIN PRIVATE KEY-----/g, '')
        .replace(/-----END PRIVATE KEY-----/g, '')
        .replace(/\s/g, '')
      const keyData = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0))
      const cryptoKey = await crypto.subtle.importKey(
        'pkcs8', keyData, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']
      )
      const signature = await crypto.subtle.sign(
        { name: 'ECDSA', hash: 'SHA-256' }, cryptoKey, new TextEncoder().encode(signingInput)
      )
      const encodedSig = base64url(new Uint8Array(signature))
      const jwt = `${signingInput}.${encodedSig}`
      cachedApnsToken = { token: jwt, expires: Date.now() + 50 * 60 * 1000 }
      return jwt
    }

    // --- Split into APNs and Web Push ---
    const apnsItems = notificationsToSend.filter(n => n.subscription.endpoint?.startsWith('apns://'))
    const webItems = notificationsToSend.filter(n => !n.subscription.endpoint?.startsWith('apns://'))

    const results: Array<{ success: boolean; endpoint: string; error?: string }> = []

    // Send APNs
    const apnsConfigured = Deno.env.get('APNS_KEY_ID') && Deno.env.get('APNS_TEAM_ID') && Deno.env.get('APNS_KEY_P8')
    if (apnsItems.length > 0 && apnsConfigured) {
      const bundleId = Deno.env.get('APNS_BUNDLE_ID') || 'com.nichuzz.viberise'
      for (const { subscription, notification } of apnsItems) {
        try {
          const deviceToken = subscription.keys?.token || subscription.endpoint.replace('apns://', '')
          const jwt = await getApnsJwt()
          const apnsHost = Deno.env.get('APNS_USE_SANDBOX') === 'true'
            ? 'api.sandbox.push.apple.com'
            : 'api.push.apple.com'
          const response = await fetch(`https://${apnsHost}/3/device/${deviceToken}`, {
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
                alert: { title: notification.title, body: notification.body },
                sound: 'default',
                badge: 1,
              },
              url: notification.url,
            }),
          })
          if (!response.ok) {
            const errText = await response.text()
            if (response.status === 410) {
              await supabaseClient.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint)
            }
            results.push({ success: false, endpoint: subscription.endpoint, error: `APNs ${response.status}: ${errText}` })
          } else {
            results.push({ success: true, endpoint: subscription.endpoint })
          }
        } catch (error: any) {
          results.push({ success: false, endpoint: subscription.endpoint, error: error.message })
        }
      }
    } else if (apnsItems.length > 0) {
      console.warn(`${apnsItems.length} APNs subscriptions skipped: APNS credentials not configured`)
    }

    // Send Web Push
    if (webItems.length > 0) {
      const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')
      const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')
      const vapidEmail = Deno.env.get('VAPID_EMAIL')

      if (vapidPublicKey && vapidPrivateKey && vapidEmail) {
        const formattedEmail = vapidEmail.startsWith('mailto:') ? vapidEmail : `mailto:${vapidEmail}`
        webpush.setVapidDetails(formattedEmail, vapidPublicKey, vapidPrivateKey)

        for (const { subscription, notification } of webItems) {
          try {
            const payload = JSON.stringify({
              title: notification.title,
              body: notification.body,
              icon: '/icon-192.png',
              badge: '/badge-72x72.png',
              tag: notification.tag,
              url: notification.url,
              timestamp: Date.now(),
            })
            await webpush.sendNotification(
              { endpoint: subscription.endpoint, keys: subscription.keys },
              payload
            )
            results.push({ success: true, endpoint: subscription.endpoint })
          } catch (error: any) {
            console.error('Error sending to subscription:', error)
            if (error.statusCode === 410 || error.statusCode === 404) {
              await supabaseClient.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint)
            }
            results.push({ success: false, endpoint: subscription.endpoint, error: error.message })
          }
        }
      } else {
        console.error('VAPID keys not configured, skipping web push')
      }
    }

    // After sending 7-day farewells, pause notifications for those users
    if (farewell7dUserIds.length > 0) {
      const { error: pauseError } = await supabaseClient
        .from('notification_preferences')
        .update({ notifications_paused: true })
        .in('user_id', farewell7dUserIds)

      if (pauseError) {
        console.error('Error pausing notifications for farewell users:', pauseError)
      } else {
        console.log(`Paused notifications for ${farewell7dUserIds.length} farewell users`)
      }
    }

    const sent = results.filter(r => r.success).length
    const failed = results.length - sent

    console.log(`Notifications sent: ${sent} successful, ${failed} failed`)

    return new Response(
      JSON.stringify({ success: true, sent, failed, total: notificationsToSend.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('Error in scheduled-notifications function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
