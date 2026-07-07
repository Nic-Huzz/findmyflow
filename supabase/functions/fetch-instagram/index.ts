import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const COMPOSIO_API_KEY = Deno.env.get('COMPOSIO_API_KEY')
const COMPOSIO_BASE = 'https://backend.composio.dev/api/v3.1'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Execute a Composio tool via REST API
async function composioExecute(toolSlug: string, connectedAccountId: string, args: Record<string, any>, entityId?: string) {
  const res = await fetch(`${COMPOSIO_BASE}/tools/execute/${toolSlug}`, {
    method: 'POST',
    headers: {
      'x-api-key': COMPOSIO_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      connected_account_id: connectedAccountId,
      entity_id: entityId || connectedAccountId,
      arguments: args,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Composio ${toolSlug} failed: ${err}`)
  }

  const data = await res.json()
  return data.data || data.response?.data || data
}

// Extract metric value from Instagram insights response
function metricValue(metric: any): number | null {
  if (metric.total_value?.value !== undefined) return metric.total_value.value
  if (metric.total_value !== undefined && typeof metric.total_value !== 'object') return metric.total_value
  const vals = metric.values || []
  if (vals.length > 0) return vals[vals.length - 1]?.value ?? null
  return null
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  try {
    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {}
    const targetUserId = body.user_id
    const isInitialSync = body.initial_sync === true

    // Get connected Instagram accounts to sync
    let query = supabase
      .from('user_integrations')
      .select('*')
      .eq('platform', 'instagram')
      .eq('status', 'active')

    if (targetUserId) {
      query = query.eq('user_id', targetUserId)
    }

    const { data: integrations, error: intError } = await query
    if (intError) throw new Error(`Failed to fetch integrations: ${intError.message}`)
    if (!integrations?.length) {
      return new Response(
        JSON.stringify({ synced: 0, message: 'No active Instagram integrations' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const results = []

    for (const integration of integrations) {
      const { user_id, composio_connection_id } = integration
      if (!composio_connection_id) continue

      try {
        // 1. Fetch account info (followers, following)
        const userInfo = await composioExecute(
          'INSTAGRAM_GET_USER_INFO',
          composio_connection_id,
          { ig_user_id: 'me' },
          user_id
        )

        // 2. Fetch account insights as daily time series (max 28 days for initial, last 3 for cron)
        const now = Math.floor(Date.now() / 1000)
        const sinceDays = isInitialSync ? 28 : 3
        const since = now - (sinceDays * 86400)

        // Build daily metrics map: { '2026-06-17': { reach: 100, views: 200, ... } }
        const dailyMetrics: Record<string, Record<string, number>> = {}
        const today = new Date().toISOString().split('T')[0]

        // A. Fetch REACH as daily time_series (only metric that supports it)
        try {
          const reachData = await composioExecute(
            'INSTAGRAM_GET_USER_INSIGHTS',
            composio_connection_id,
            { metric: ['reach'], period: 'day', since, until: now },
            user_id
          )
          const reachMetrics = reachData.data || reachData || []
          if (Array.isArray(reachMetrics)) {
            for (const m of reachMetrics) {
              for (const v of (m.values || [])) {
                if (v.end_time && v.value !== undefined) {
                  const date = v.end_time.split('T')[0]
                  if (!dailyMetrics[date]) dailyMetrics[date] = {}
                  dailyMetrics[date].reach = v.value
                }
              }
            }
          }
        } catch (e) {
          console.warn(`Reach time_series failed for ${user_id}:`, e.message)
        }

        // B. Fetch all other metrics as total_value (stored on today's row)
        const totalValueMetrics = ['views', 'total_interactions', 'accounts_engaged', 'likes', 'comments', 'shares', 'saves', 'follows_and_unfollows', 'profile_links_taps']
        try {
          const totalData = await composioExecute(
            'INSTAGRAM_GET_USER_INSIGHTS',
            composio_connection_id,
            {
              metric: totalValueMetrics,
              period: 'day',
              metric_type: 'total_value',
              since: now - (sinceDays * 86400),
              until: now,
            },
            user_id
          )
          if (!dailyMetrics[today]) dailyMetrics[today] = {}
          const totalMetrics = totalData.data || totalData || []
          if (Array.isArray(totalMetrics)) {
            for (const m of totalMetrics) {
              if (m.name && m.total_value?.value !== undefined) {
                dailyMetrics[today][m.name] = m.total_value.value
              }
            }
          }
        } catch (e) {
          console.warn(`Total value metrics failed for ${user_id}:`, e.message)
        }

        // 3. Upsert daily metrics rows (one per day)
        const followers = userInfo.followers_count || null
        const following = userInfo.follows_count || null

        // Always upsert today with follower count even if no insights
        if (!dailyMetrics[today]) dailyMetrics[today] = {}

        for (const [date, m] of Object.entries(dailyMetrics)) {
          await supabase.from('instagram_metrics').upsert({
            user_id,
            date,
            followers: date === today ? followers : null,
            following: date === today ? following : null,
            reach: m.reach ?? null,
            views: m.views ?? null,
            accounts_engaged: m.accounts_engaged ?? null,
            total_interactions: m.total_interactions ?? null,
            likes: m.likes ?? null,
            comments: m.comments ?? null,
            shares: m.shares ?? null,
            saves: m.saves ?? null,
            profile_link_taps: m.profile_links_taps ?? null,
            follows_net: m.follows_and_unfollows ?? null,
          }, { onConflict: 'user_id,date' })
        }

        // 4. Fetch recent posts (last 30 days for initial, last 7 for daily)
        const postDays = isInitialSync ? 90 : 7
        const postSince = now - (postDays * 86400)

        let allPosts: any[] = []
        let cursor: string | null = null
        let pages = 0
        const maxPages = isInitialSync ? 10 : 2

        do {
          const mediaArgs: any = {
            ig_user_id: 'me',
            limit: 25,
            fields: 'id,caption,media_type,media_product_type,permalink,timestamp,like_count,comments_count,thumbnail_url,media_url',
            since: postSince,
          }
          if (cursor) mediaArgs.after = cursor

          const mediaData = await composioExecute(
            'INSTAGRAM_GET_IG_USER_MEDIA',
            composio_connection_id,
            mediaArgs,
            user_id
          )

          const posts = mediaData.data || mediaData || []
          if (Array.isArray(posts)) allPosts = allPosts.concat(posts)

          cursor = mediaData.paging?.cursors?.after || null
          pages++
        } while (cursor && pages < maxPages)

        // 5. For each post, fetch insights and upsert
        for (const post of allPosts) {
          let postReach = 0, postViews = 0, postShares = 0, postSaves = 0
          let postSkipRate: number | null = null, postAvgWatchTime: number | null = null, postTotalWatchTime: number | null = null

          const isReel = post.media_product_type === 'REELS'

          // Base metrics (all post types)
          try {
            const postInsights = await composioExecute(
              'INSTAGRAM_GET_IG_MEDIA_INSIGHTS',
              composio_connection_id,
              {
                ig_media_id: post.id,
                metric: ['reach', 'views', 'likes', 'comments', 'shares', 'saved'],
              },
              user_id
            )

            const postMetrics = postInsights.data || postInsights || []
            if (Array.isArray(postMetrics)) {
              for (const m of postMetrics) {
                const val = (m.values?.[0]?.value) ?? (m.total_value?.value) ?? 0
                if (m.name === 'reach') postReach = val
                if (m.name === 'views') postViews = val
                if (m.name === 'shares') postShares = val
                if (m.name === 'saved') postSaves = val
              }
            }
          } catch (e) {
            console.warn(`Post insights failed for ${post.id}:`, e.message)
          }

          // Reel-specific metrics (separate call so failure doesn't break base metrics)
          if (isReel) {
            try {
              const reelInsights = await composioExecute(
                'INSTAGRAM_GET_IG_MEDIA_INSIGHTS',
                composio_connection_id,
                {
                  ig_media_id: post.id,
                  metric: ['reels_skip_rate', 'ig_reels_avg_watch_time', 'ig_reels_video_view_total_time'],
                },
                user_id
              )

              const reelMetrics = reelInsights.data || reelInsights || []
              if (Array.isArray(reelMetrics)) {
                for (const m of reelMetrics) {
                  const val = (m.values?.[0]?.value) ?? (m.total_value?.value) ?? null
                  if (m.name === 'reels_skip_rate' && val !== null) postSkipRate = val
                  if (m.name === 'ig_reels_avg_watch_time' && val !== null) postAvgWatchTime = val
                  if (m.name === 'ig_reels_video_view_total_time' && val !== null) postTotalWatchTime = val
                }
              }
            } catch (e) {
              console.warn(`Reel metrics failed for ${post.id}:`, e.message)
            }
          }

          const postData = {
            user_id,
            ig_media_id: post.id,
            caption: post.caption || null,
            media_type: post.media_type || null,
            media_product_type: post.media_product_type || null,
            permalink: post.permalink || null,
            thumbnail_url: post.thumbnail_url || post.media_url || null,
            posted_at: post.timestamp || null,
            like_count: post.like_count || 0,
            comments_count: post.comments_count || 0,
            shares: postShares,
            saves: postSaves,
            reach: postReach,
            views: postViews,
            skip_rate: postSkipRate,
            avg_watch_time: postAvgWatchTime,
            total_watch_time: postTotalWatchTime,
            updated_at: new Date().toISOString(),
          }

          // Insert new posts (skip if already exists to preserve experience_id tags)
          await supabase.from('instagram_posts').upsert(postData, {
            onConflict: 'user_id,ig_media_id',
            ignoreDuplicates: true,
          })

          // Update metrics on existing posts (preserves experience_id)
          const { user_id: _u, ig_media_id: _m, ...updateData } = postData
          await supabase.from('instagram_posts')
            .update(updateData)
            .eq('user_id', user_id)
            .eq('ig_media_id', post.id)
        }

        // 6. Update last_synced_at
        await supabase
          .from('user_integrations')
          .update({
            last_synced_at: new Date().toISOString(),
            platform_username: userInfo.username || integration.platform_username,
            platform_user_id: userInfo.id || integration.platform_user_id,
          })
          .eq('id', integration.id)

        results.push({ user_id, status: 'ok', posts: allPosts.length })

      } catch (userError) {
        console.error(`Sync failed for user ${user_id}:`, userError.message)

        // Mark as error if auth failed
        if (userError.message.includes('401') || userError.message.includes('OAuthException')) {
          await supabase
            .from('user_integrations')
            .update({ status: 'error' })
            .eq('id', integration.id)
        }

        results.push({ user_id, status: 'error', error: userError.message })
      }
    }

    return new Response(
      JSON.stringify({ synced: results.length, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('fetch-instagram error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
