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

        // 2. Fetch account insights as daily time series (last 14 days for initial, last 3 for cron)
        const now = Math.floor(Date.now() / 1000)
        const sinceDays = isInitialSync ? 14 : 3
        const since = now - (sinceDays * 86400)

        // Build daily metrics map: { '2026-06-17': { reach: 100, views: 200, ... } }
        const dailyMetrics: Record<string, Record<string, number>> = {}
        const today = new Date().toISOString().split('T')[0]

        // Fetch each metric group separately (Instagram API is picky about combos)
        const metricGroups = [
          ['reach', 'views', 'total_interactions', 'accounts_engaged'],
          ['likes', 'comments', 'shares', 'saves'],
          ['follows_and_unfollows', 'profile_links_taps'],
        ]

        for (const metrics of metricGroups) {
          try {
            const insightsData = await composioExecute(
              'INSTAGRAM_GET_USER_INSIGHTS',
              composio_connection_id,
              {
                metric: metrics,
                period: 'day',
                since,
                until: now,
              },
              user_id
            )

            const metricsArray = insightsData.data || insightsData || []
            if (Array.isArray(metricsArray)) {
              for (const m of metricsArray) {
                const name = m.name
                if (!name) continue

                // time_series returns values[] with {value, end_time} per day
                const values = m.values || []
                for (const v of values) {
                  if (v.end_time && v.value !== undefined) {
                    const date = v.end_time.split('T')[0]
                    if (!dailyMetrics[date]) dailyMetrics[date] = {}
                    dailyMetrics[date][name] = v.value
                  }
                }

                // Also check total_value format
                if (m.total_value?.value !== undefined && values.length === 0) {
                  if (!dailyMetrics[today]) dailyMetrics[today] = {}
                  dailyMetrics[today][name] = m.total_value.value
                }
              }
            }
          } catch (e) {
            console.warn(`Insights group [${metrics.join(',')}] failed for ${user_id}:`, e.message)
          }
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
        const postDays = isInitialSync ? 30 : 7
        const postSince = now - (postDays * 86400)

        let allPosts: any[] = []
        let cursor: string | null = null
        let pages = 0
        const maxPages = isInitialSync ? 5 : 2

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
            // Per-post insights can fail for older posts or stories
            console.warn(`Post insights failed for ${post.id}:`, e.message)
          }

          // Insert new posts (skip if already exists to preserve experience_id tags)
          await supabase.from('instagram_posts').upsert({
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
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id,ig_media_id',
            ignoreDuplicates: true,
          })

          // Update metrics on existing posts (preserves experience_id)
          await supabase.from('instagram_posts')
            .update({
              caption: post.caption || null,
              like_count: post.like_count || 0,
              comments_count: post.comments_count || 0,
              shares: postShares,
              saves: postSaves,
              reach: postReach,
              views: postViews,
              thumbnail_url: post.thumbnail_url || post.media_url || null,
              updated_at: new Date().toISOString(),
            })
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
