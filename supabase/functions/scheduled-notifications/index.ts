import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import webpush from 'npm:web-push@3.6.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Simplified notification schedule - 3 core times
// Key is the local time (hour) when notification should be sent
const NOTIFICATIONS = {
  8: {
    title: '🌅 Morning Quest Check',
    body: 'Start your day with intention - check your quests!',
    url: '/7-day-challenge',
    tag: 'morning-quest',
    preference: 'quest_reminders'
  },
  12: {
    title: '🎯 Midday Check-In',
    body: 'How are your quests going? Keep the momentum!',
    url: '/7-day-challenge',
    tag: 'midday-checkin',
    preference: 'quest_reminders'
  },
  18: {
    title: '📝 Evening Reflection',
    body: 'Time to log your quest progress for the day!',
    url: '/7-day-challenge',
    tag: 'evening-reflection',
    preference: 'quest_reminders'
  }
}

// Get current day of week in a specific timezone (lowercase)
function getCurrentDayInTimezone(timezone: string): string {
  try {
    const now = new Date()
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'long'
    })
    return formatter.format(now).toLowerCase()
  } catch (error) {
    console.error(`Invalid timezone for day check: ${timezone}`, error)
    return ''
  }
}

// Get the Monday of the current week as YYYY-MM-DD in a specific timezone
function getWeekStartInTimezone(timezone: string): string {
  try {
    const now = new Date()
    // Get the local date parts in the user's timezone
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(now) // Returns YYYY-MM-DD in en-CA locale
    const [year, month, day] = parts.split('-').map(Number)
    const localDate = new Date(year, month - 1, day)
    const dayOfWeek = localDate.getDay()
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    localDate.setDate(localDate.getDate() + mondayOffset)
    const y = localDate.getFullYear()
    const m = String(localDate.getMonth() + 1).padStart(2, '0')
    const d = String(localDate.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  } catch (error) {
    console.error(`Invalid timezone for week start: ${timezone}`, error)
    // Fallback to UTC
    const now = new Date()
    const dayOfWeek = now.getUTCDay()
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const weekStart = new Date(now)
    weekStart.setUTCDate(now.getUTCDate() + mondayOffset)
    return weekStart.toISOString().split('T')[0]
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

    // Get all push subscriptions
    const { data: subscriptions, error: fetchError } = await supabaseClient
      .from('push_subscriptions')
      .select('*')

    if (fetchError) {
      console.error('Error fetching subscriptions:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch subscriptions', details: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No active subscriptions found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get notification preferences for all users with subscriptions
    const userIds = [...new Set(subscriptions.map(s => s.user_id))]
    const { data: allPrefs, error: prefsError } = await supabaseClient
      .from('notification_preferences')
      .select('*')
      .in('user_id', userIds)

    if (prefsError) {
      console.error('Error fetching preferences:', prefsError)
    }

    // Create a map of user_id -> preferences
    const prefsMap = new Map()
    if (allPrefs) {
      for (const pref of allPrefs) {
        prefsMap.set(pref.user_id, pref)
      }
    }

    // Group subscriptions by timezone and notification hour
    const notificationsToSend: Array<{
      subscription: any,
      notification: any
    }> = []

    // Process subscriptions sequentially to handle async checks
    for (const sub of subscriptions) {
      let prefs = prefsMap.get(sub.user_id)

      // If no preferences exist, create default ones
      if (!prefs) {
        console.log(`User ${sub.user_id}: No preferences found, creating defaults...`)
        const { data: newPrefs, error: createError } = await supabaseClient
          .from('notification_preferences')
          .upsert({
            user_id: sub.user_id,
            quest_reminders: true,
            achievement_celebrations: true,
            timezone: 'UTC'
          }, { onConflict: 'user_id' })
          .select()
          .single()

        if (createError) {
          console.error(`Failed to create preferences for ${sub.user_id}:`, createError)
          continue
        }
        prefs = newPrefs
        console.log(`Created default preferences for ${sub.user_id}`)
      }

      // Skip if all notifications disabled
      if (!(prefs.quest_reminders || prefs.achievement_celebrations)) {
        console.log(`Skipping user ${sub.user_id}: All notifications disabled`)
        continue
      }

      // Check if user's challenge is still active
      const { data: challenge } = await supabaseClient
        .from('challenge_progress')
        .select('challenge_start_date, status')
        .eq('user_id', sub.user_id)
        .eq('status', 'active')
        .order('challenge_start_date', { ascending: false })
        .limit(1)
        .single()

      // Skip if no active challenge
      if (!challenge) {
        console.log(`Skipping user ${sub.user_id}: No active challenge`)
        continue
      }

      // Get user's timezone (default to UTC if not set)
      const timezone = prefs.timezone || 'UTC'

      // Get current hour in user's timezone
      const userLocalHour = getCurrentHourInTimezone(timezone)

      if (userLocalHour === -1) {
        console.error(`Invalid timezone for user ${sub.user_id}: ${timezone}`)
        continue
      }

      // Log the detected hour for debugging
      console.log(`User ${sub.user_id}: timezone=${timezone}, localHour=${userLocalHour}`)

      // Monday 8am: replace standard morning notification with "Plan Your Week"
      // for users who haven't picked their priority quests yet
      if (userLocalHour === 8 && prefs.quest_reminders) {
        const userDay = getCurrentDayInTimezone(timezone)

        if (userDay === 'monday') {
          // Check if user has picks for this week (timezone-aware)
          const userWeekStart = getWeekStartInTimezone(timezone)
          const { data: picks } = await supabaseClient
            .from('priority_weekly_picks')
            .select('id')
            .eq('user_id', sub.user_id)
            .eq('week_start_date', userWeekStart)
            .limit(1)

          if (!picks || picks.length === 0) {
            const planNotification = {
              title: 'Plan Your Week!',
              body: 'Choose your priority quests for this week.',
              url: '/7-day-challenge?tab=priority',
              tag: 'monday-weekly-plan'
            }
            console.log(`User ${sub.user_id}: Monday plan reminder (no picks for ${userWeekStart})`)
            notificationsToSend.push({ subscription: sub, notification: planNotification })
            continue // skip standard 8am notification — plan reminder replaces it
          }
        }
      }

      // Check if there's a standard notification for this hour
      const notification = NOTIFICATIONS[userLocalHour]

      if (notification) {
        // Check if user has this notification type enabled
        const prefKey = notification.preference
        if (prefs[prefKey]) {
          console.log(`User ${sub.user_id}: Adding notification for hour ${userLocalHour}`)
          notificationsToSend.push({ subscription: sub, notification })
        } else {
          console.log(`User ${sub.user_id}: Skipping notification - ${prefKey} disabled`)
        }
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

    // Configure web-push (using static import at top of file)
    // Add mailto: prefix if not present
    const formattedEmail = vapidEmail.startsWith('mailto:') ? vapidEmail : `mailto:${vapidEmail}`
    webpush.setVapidDetails(
      formattedEmail,
      vapidPublicKey,
      vapidPrivateKey
    )

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
