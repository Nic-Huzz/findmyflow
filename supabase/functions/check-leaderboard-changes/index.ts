import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('🔍 Checking for leaderboard changes...')

    // Get all active challenge progress, ordered by points
    const { data: currentLeaderboard, error: leaderboardError } = await supabaseClient
      .from('challenge_progress')
      .select('user_id, total_points, group_id')
      .eq('status', 'active')
      .order('total_points', { ascending: false })

    if (leaderboardError) {
      console.error('Error fetching leaderboard:', leaderboardError)
      throw leaderboardError
    }

    if (!currentLeaderboard || currentLeaderboard.length === 0) {
      console.log('No active users on leaderboard')
      return new Response(
        JSON.stringify({ message: 'No active users' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Calculate current ranks
    const currentRanks = currentLeaderboard.map((entry, index) => ({
      user_id: entry.user_id,
      rank: index + 1,
      total_points: entry.total_points,
      group_id: entry.group_id
    }))

    console.log(`📊 Current leaderboard has ${currentRanks.length} users`)

    // Get previous snapshots for comparison (last snapshot for each user)
    const userIds = currentRanks.map(r => r.user_id)

    const { data: previousSnapshots, error: snapshotError } = await supabaseClient
      .from('leaderboard_snapshots')
      .select('*')
      .in('user_id', userIds)
      .eq('leaderboard_type', 'weekly')
      .order('created_at', { ascending: false })

    if (snapshotError) {
      console.error('Error fetching snapshots:', snapshotError)
    }

    // Create a map of most recent rank for each user
    const previousRankMap = new Map()
    if (previousSnapshots) {
      previousSnapshots.forEach(snapshot => {
        if (!previousRankMap.has(snapshot.user_id)) {
          previousRankMap.set(snapshot.user_id, snapshot.rank)
        }
      })
    }

    // Detect overtakes and send notifications
    const overtakes = []

    // Import webpush only if VAPID keys are configured
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')
    const vapidEmail = Deno.env.get('VAPID_EMAIL')

    let webpush = null
    if (vapidPublicKey && vapidPrivateKey && vapidEmail) {
      try {
        const webpushModule = await import('https://esm.sh/web-push@3.6.6')
        webpush = webpushModule.default || webpushModule
        webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey)
        console.log('✅ Web push configured successfully')
      } catch (error: any) {
        console.error('⚠️ Error configuring web push:', error.message)
      }
    } else {
      console.log('⚠️ VAPID keys not configured, notifications will be skipped')
    }

    for (const currentRank of currentRanks) {
      const previousRank = previousRankMap.get(currentRank.user_id)

      // If user had a previous rank and their rank got worse (number increased)
      if (previousRank && currentRank.rank > previousRank) {
        const positionsLost = currentRank.rank - previousRank
        console.log(`🔄 User ${currentRank.user_id} dropped from rank ${previousRank} to ${currentRank.rank}`)

        overtakes.push({
          user_id: currentRank.user_id,
          old_rank: previousRank,
          new_rank: currentRank.rank,
          positions_lost: positionsLost
        })

        // Check if user has leaderboard notifications enabled
        const { data: prefs } = await supabaseClient
          .from('notification_preferences')
          .select('leaderboard_updates')
          .eq('user_id', currentRank.user_id)
          .single()

        if (prefs && prefs.leaderboard_updates) {
          // Get user's push subscriptions
          const { data: subscriptions } = await supabaseClient
            .from('push_subscriptions')
            .select('*')
            .eq('user_id', currentRank.user_id)

          if (subscriptions && subscriptions.length > 0 && webpush) {
            // Send notification
            const notificationPayload = JSON.stringify({
              title: '🏆 Leaderboard Update',
              body: positionsLost === 1
                ? 'Someone just passed you on the leaderboard!👀'
                : `You dropped ${positionsLost} positions on the leaderboard!👀`,
              icon: '/icon-192.png',
              badge: '/badge-72x72.png',
              tag: 'leaderboard-overtake',
              url: '/7-day-challenge',
              timestamp: Date.now()
            })

            for (const sub of subscriptions) {
              try {
                const pushSubscription = {
                  endpoint: sub.endpoint,
                  keys: sub.keys
                }
                await webpush.sendNotification(pushSubscription, notificationPayload)
                console.log(`✅ Sent overtake notification to user ${currentRank.user_id}`)
              } catch (error: any) {
                console.error(`Error sending notification: ${error.message}`)

                // Clean up invalid subscriptions
                if (error.statusCode === 410 || error.statusCode === 404) {
                  await supabaseClient
                    .from('push_subscriptions')
                    .delete()
                    .eq('endpoint', sub.endpoint)
                }
              }
            }
          } else if (subscriptions && subscriptions.length > 0 && !webpush) {
            console.log(`⚠️ User ${currentRank.user_id} has subscriptions but web push is not configured`)
          }
        }
      }
    }

    // Save current rankings as new snapshots
    const newSnapshots = currentRanks.map(rank => ({
      user_id: rank.user_id,
      rank: rank.rank,
      total_points: rank.total_points,
      leaderboard_type: 'weekly',
      group_id: rank.group_id
    }))

    const { error: insertError } = await supabaseClient
      .from('leaderboard_snapshots')
      .insert(newSnapshots)

    if (insertError) {
      console.error('Error saving snapshots:', insertError)
    } else {
      console.log(`💾 Saved ${newSnapshots.length} new snapshots`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Checked ${currentRanks.length} users, found ${overtakes.length} overtakes`,
        overtakes
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Error in check-leaderboard-changes:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
