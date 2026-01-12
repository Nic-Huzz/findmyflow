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

// Days of week mapping for weekly plan notifications
const DAYS_OF_WEEK = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

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

    // Fetch current week's plans for all users with subscriptions
    // Get the Monday of current week
    const now = new Date()
    const dayOfWeek = now.getUTCDay()
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const weekStart = new Date(now)
    weekStart.setUTCDate(now.getUTCDate() + mondayOffset)
    weekStart.setUTCHours(0, 0, 0, 0)
    const weekStartStr = weekStart.toISOString().split('T')[0]

    const { data: allWeeklyPlans, error: plansError } = await supabaseClient
      .from('weekly_plans')
      .select('*')
      .in('user_id', userIds)
      .eq('week_start', weekStartStr)

    if (plansError) {
      console.error('Error fetching weekly plans:', plansError)
    }

    // Create a map of user_id -> weekly plan
    const plansMap = new Map()
    if (allWeeklyPlans) {
      for (const plan of allWeeklyPlans) {
        plansMap.set(plan.user_id, plan)
      }
    }


    // Group subscriptions by timezone and notification hour
    const notificationsToSend: Array<{
      subscription: any,
      notification: any
    }> = []

    // Process subscriptions sequentially to handle async checks
    for (const sub of subscriptions) {
      const prefs = prefsMap.get(sub.user_id)

      // Skip if user doesn't have preferences or no notifications enabled
      if (!prefs || !(prefs.daily_quests || prefs.leaderboard_updates || prefs.group_activity || prefs.artifact_unlocks)) {
        console.log(`Skipping user ${sub.user_id}: No preferences or notifications disabled`)
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

      // Check if there's a standard notification for this hour
      const notification = NOTIFICATIONS[userLocalHour]

      if (notification) {
        console.log(`User ${sub.user_id}: Adding notification for hour ${userLocalHour}`)
        notificationsToSend.push({ subscription: sub, notification })
      }

      // Check for weekly plan notifications at 8am
      if (userLocalHour === 8) {
        const weeklyPlan = plansMap.get(sub.user_id)
        if (weeklyPlan) {
          const userDay = getCurrentDayInTimezone(timezone)

          // Check if today is groan day
          if (weeklyPlan.weekly_groan_day === userDay && !weeklyPlan.weekly_groan_completed) {
            const groanNotification = {
              title: '🎯 Today is Your Groan Day!',
              body: weeklyPlan.weekly_groan_description
                ? `Time to push past your edge: "${weeklyPlan.weekly_groan_description}"`
                : 'Time to complete your weekly groan challenge',
              url: '/7-day-challenge?tab=Groans',
              tag: 'weekly-groan-day'
            }
            notificationsToSend.push({ subscription: sub, notification: groanNotification })
          }

          // Check if today is big release day
          if (weeklyPlan.big_release_day === userDay && weeklyPlan.big_release_practice) {
            const releaseNotification = {
              title: '🌊 Today is Your Release Day!',
              body: `Time for your ${weeklyPlan.big_release_practice.replace(/_/g, ' ')} practice`,
              url: '/7-day-challenge?tab=Healing',
              tag: 'weekly-release-day'
            }
            notificationsToSend.push({ subscription: sub, notification: releaseNotification })
          }
        }
      }

      // Check for pending recommendations at 9am (business hours nudge)
      if (userLocalHour === 9) {
        const { data: pendingRecs, error: recsError } = await supabaseClient
          .from('recommendations')
          .select('id, priority, title')
          .eq('user_id', sub.user_id)
          .eq('status', 'pending')
          .order('priority', { ascending: true })
          .limit(3)

        if (!recsError && pendingRecs && pendingRecs.length > 0) {
          const highPriority = pendingRecs.filter(r => r.priority === 'high').length
          const recNotification = {
            title: highPriority > 0
              ? `🤖 ${highPriority} High Priority Insight${highPriority > 1 ? 's' : ''}`
              : `🤖 ${pendingRecs.length} AI Insight${pendingRecs.length > 1 ? 's' : ''} Waiting`,
            body: pendingRecs[0].title,
            url: '/crm/alerts',
            tag: 'recommendations-nudge'
          }
          notificationsToSend.push({ subscription: sub, notification: recNotification })
        }
      }

      // Daily Priority Notifications at 8am
      if (userLocalHour === 8) {
        // Check for overdue follow-ups
        const today = new Date().toISOString().split('T')[0]
        const { data: overdueDeals, error: overdueError } = await supabaseClient
          .from('deals')
          .select('id, contact_name, value, next_follow_up_date')
          .eq('user_id', sub.user_id)
          .not('status', 'in', '("won","lost")')
          .lt('next_follow_up_date', today)
          .limit(5)

        // Check for very stale deals (14+ days no activity)
        const staleDate = new Date()
        staleDate.setDate(staleDate.getDate() - 14)
        const staleDateStr = staleDate.toISOString()

        const { data: staleDeals, error: staleError } = await supabaseClient
          .from('deals')
          .select('id, contact_name, value, updated_at')
          .eq('user_id', sub.user_id)
          .not('status', 'in', '("won","lost")')
          .lt('updated_at', staleDateStr)
          .limit(5)

        const overdueCount = (!overdueError && overdueDeals) ? overdueDeals.length : 0
        const staleCount = (!staleError && staleDeals) ? staleDeals.length : 0
        const urgentTotal = overdueCount + staleCount

        if (urgentTotal > 0) {
          let bodyText = ''
          if (overdueCount > 0 && staleCount > 0) {
            bodyText = `${overdueCount} overdue follow-up${overdueCount > 1 ? 's' : ''} & ${staleCount} deal${staleCount > 1 ? 's' : ''} going cold`
          } else if (overdueCount > 0) {
            const topDeal = overdueDeals![0]
            bodyText = `${topDeal.contact_name} follow-up overdue${overdueCount > 1 ? ` (+${overdueCount - 1} more)` : ''}`
          } else {
            const topDeal = staleDeals![0]
            bodyText = `${topDeal.contact_name} needs attention${staleCount > 1 ? ` (+${staleCount - 1} more)` : ''}`
          }

          const priorityNotification = {
            title: `📋 ${urgentTotal} Priority Action${urgentTotal > 1 ? 's' : ''} Today`,
            body: bodyText,
            url: '/crm',
            tag: 'daily-priorities-morning'
          }
          notificationsToSend.push({ subscription: sub, notification: priorityNotification })
        }
      }

      // Afternoon follow-up reminder at 2pm
      if (userLocalHour === 14) {
        const today = new Date().toISOString().split('T')[0]
        const { data: todayFollowUps, error: fuError } = await supabaseClient
          .from('deals')
          .select('id, contact_name, value, next_follow_up_date')
          .eq('user_id', sub.user_id)
          .not('status', 'in', '("won","lost")')
          .lte('next_follow_up_date', today)
          .limit(3)

        if (!fuError && todayFollowUps && todayFollowUps.length > 0) {
          const topDeal = todayFollowUps[0]
          const afternoonNotification = {
            title: `📞 ${todayFollowUps.length} Follow-up${todayFollowUps.length > 1 ? 's' : ''} Remaining`,
            body: `Don't forget: ${topDeal.contact_name}${todayFollowUps.length > 1 ? ` and ${todayFollowUps.length - 1} more` : ''}`,
            url: '/crm',
            tag: 'daily-priorities-afternoon'
          }
          notificationsToSend.push({ subscription: sub, notification: afternoonNotification })
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

    // Import web-push library using npm: specifier for better Deno compatibility
    const webpush = await import('npm:web-push@3.6.7')

    // Configure web-push
    webpush.default.setVapidDetails(
      `mailto:${vapidEmail}`,
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

          await webpush.default.sendNotification(pushSubscription, payload)
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
