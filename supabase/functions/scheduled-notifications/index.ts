import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Notification schedule configuration
// Key is the local time (hour) when notification should be sent
const NOTIFICATIONS = {
  7: {
    title: '🌅 Morning Reconnect',
    body: 'Remember Your Daily Reconnect Quests To Start Your Day on a High',
    url: '/7-day-challenge',
    tag: 'morning-reconnect'
  },
  9: {
    title: '✨ Embrace Your Essence',
    body: 'Reminder to Embrace Your Essence Today',
    url: '/archetypes',
    tag: 'embrace-essence'
  },
  12: {
    title: '🎯 Midday Check-In',
    body: 'How can we make this afternoon a "Hell Yea"?',
    url: '/7-day-challenge',
    tag: 'midday-checkin'
  },
  17: {
    title: '📅 Evening Goals',
    body: 'What weekly quests can we get done this evening?',
    url: '/7-day-challenge',
    tag: 'evening-quests'
  },
  20: {
    title: '📝 Daily Reflection',
    body: 'Reminder to enter your quests for the day!',
    url: '/7-day-challenge',
    tag: 'daily-reflection'
  }
}

// Get current hour in a specific timezone
function getCurrentHourInTimezone(timezone: string): number {
  try {
    const now = new Date()
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      hour12: false
    })
    return parseInt(formatter.format(now))
  } catch (error) {
    console.error(`Invalid timezone: ${timezone}`, error)
    return -1
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Scheduled notifications check running...')

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get all active users with push subscriptions and their preferences
    const { data: subscriptions, error: fetchError } = await supabaseClient
      .from('push_subscriptions')
      .select(`
        *,
        notification_preferences!inner(*)
      `)

    if (fetchError) {
      console.error('Error fetching subscriptions:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch subscriptions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No active subscriptions found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Group subscriptions by timezone and notification hour
    const notificationsToSend: Array<{
      subscription: any,
      notification: any
    }> = []

    // Process subscriptions sequentially to handle async checks
    for (const sub of subscriptions) {
      const prefs = sub.notification_preferences

      // Skip if user doesn't have any notifications enabled
      if (!prefs || !(prefs.daily_quests || prefs.leaderboard_updates || prefs.group_activity || prefs.artifact_unlocks)) {
        continue
      }

      // Check if user's 7-day challenge is still active
      const { data: challenge } = await supabaseClient
        .from('challenge_instances')
        .select('start_date')
        .eq('user_id', sub.user_id)
        .order('start_date', { ascending: false })
        .limit(1)
        .single()

      if (challenge && challenge.start_date) {
        const daysSinceStart = Math.floor((Date.now() - new Date(challenge.start_date).getTime()) / (1000 * 60 * 60 * 24))
        // Skip if challenge is complete (7+ days old)
        if (daysSinceStart >= 7) {
          console.log(`Skipping user ${sub.user_id}: Challenge completed ${daysSinceStart} days ago`)
          continue
        }
      }

      // Get user's timezone (default to UTC if not set)
      const timezone = prefs.timezone || 'UTC'

      // Get current hour in user's timezone
      const userLocalHour = getCurrentHourInTimezone(timezone)

      if (userLocalHour === -1) {
        console.error(`Invalid timezone for user ${sub.user_id}: ${timezone}`)
        continue
      }

      // Check if there's a notification for this hour
      const notification = NOTIFICATIONS[userLocalHour]

      if (notification) {
        notificationsToSend.push({ subscription: sub, notification })
      }
    }

    console.log(`Found ${notificationsToSend.length} notifications to send`)

    if (notificationsToSend.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No notifications to send at this time' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get VAPID keys from environment
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')
    const vapidEmail = Deno.env.get('VAPID_EMAIL')

    if (!vapidPublicKey || !vapidPrivateKey || !vapidEmail) {
      console.error('VAPID keys not configured')
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Import web-push library
    const webpush = await import('https://esm.sh/web-push@3.6.6')

    // Configure web-push
    webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey)

    // Send notifications
    const results = await Promise.allSettled(
      notificationsToSend.map(async ({ subscription, notification }) => {
        try {
          const payload = JSON.stringify({
            title: notification.title,
            body: notification.body,
            icon: '/icon-192.png',
            badge: '/badge-72x72.png',
            tag: notification.tag,
            url: notification.url,
            timestamp: Date.now()
          })

          const pushSubscription = {
            endpoint: subscription.endpoint,
            keys: subscription.keys
          }

          await webpush.sendNotification(pushSubscription, payload)
          return { success: true, endpoint: subscription.endpoint }
        } catch (error: any) {
          console.error('Error sending to subscription:', error)

          // If subscription is invalid/expired, delete it from database
          if (error.statusCode === 410 || error.statusCode === 404) {
            await supabaseClient
              .from('push_subscriptions')
              .delete()
              .eq('endpoint', subscription.endpoint)
          }

          return { success: false, endpoint: subscription.endpoint, error: error.message }
        }
      })
    )

    // Count successes and failures
    const sent = results.filter(r => r.status === 'fulfilled' && r.value.success).length
    const failed = results.length - sent

    console.log(`Notifications sent: ${sent} successful, ${failed} failed`)

    return new Response(
      JSON.stringify({
        success: true,
        sent,
        failed,
        total: notificationsToSend.length
      }),
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
