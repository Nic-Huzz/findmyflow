import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import webpush from 'npm:web-push@3.6.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Extract JWT and verify user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return jsonResponse({ error: 'Missing authorization header' }, 401)
    }

    const token = authHeader.replace('Bearer ', '')

    // Create anon client to verify the JWT
    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token)
    if (authError || !user) {
      return jsonResponse({ error: 'Invalid or expired token' }, 401)
    }

    // 2. Create service_role client for cross-user queries
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 3. Check admin_users table
    const { data: adminRecord, error: adminError } = await supabase
      .from('admin_users')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (adminError || !adminRecord) {
      return jsonResponse({ error: 'Not authorized' }, 403)
    }

    // 4. Parse request
    const body = await req.json()
    const { action } = body

    // 5. Route to handler
    switch (action) {
      case 'get_users':
        return await handleGetUsers(supabase, body)
      case 'get_stats':
        return await handleGetStats(supabase)
      case 'get_engagement':
        return await handleGetEngagement(supabase)
      case 'send_nudge':
        return await handleSendNudge(supabase, user.id, body)
      default:
        return jsonResponse({ error: `Unknown action: ${action}` }, 400)
    }
  } catch (error: any) {
    console.error('Admin data error:', error)
    return jsonResponse({ error: error.message }, 500)
  }
})

// ─── GET USERS ───────────────────────────────────────────────────────────

async function handleGetUsers(supabase: any, params: any) {
  const { filter, search } = params

  // Fetch all users (filters applied in-memory after enrichment)
  // For MVP with <1000 users this is fine; add server-side pagination later
  const { data: { users: authUsers }, error: usersError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  })

  if (usersError) {
    console.error('Error listing users:', usersError)
    return jsonResponse({ error: 'Failed to list users' }, 500)
  }

  const userIds = authUsers.map((u: any) => u.id)

  // Fetch related data in parallel
  const [
    stageProgressResult,
    profilesResult,
    questsResult,
    subscriptionsResult,
    preferencesResult,
  ] = await Promise.all([
    supabase
      .from('user_stage_progress')
      .select('user_id, persona, current_stage, onboarding_v2_completed, updated_at')
      .in('user_id', userIds),
    supabase
      .from('lead_flow_profiles')
      .select('user_id, user_name')
      .in('user_id', userIds),
    supabase
      .from('quest_completions')
      .select('user_id')
      .in('user_id', userIds),
    supabase
      .from('push_subscriptions')
      .select('user_id')
      .in('user_id', userIds),
    supabase
      .from('notification_preferences')
      .select('user_id, quest_reminders')
      .in('user_id', userIds),
  ])

  // Build lookup maps
  const stageMap = new Map(
    (stageProgressResult.data || []).map((r: any) => [r.user_id, r])
  )
  const profileMap = new Map(
    (profilesResult.data || []).map((r: any) => [r.user_id, r])
  )

  // Count quests per user
  const questCounts = new Map<string, number>()
  for (const q of questsResult.data || []) {
    questCounts.set(q.user_id, (questCounts.get(q.user_id) || 0) + 1)
  }

  // Track which users have push subscriptions
  const pushUserIds = new Set(
    (subscriptionsResult.data || []).map((s: any) => s.user_id)
  )

  // Track notification preferences
  const prefMap = new Map(
    (preferencesResult.data || []).map((p: any) => [p.user_id, p])
  )

  // Assemble user records
  let users = authUsers.map((authUser: any) => {
    const stage = stageMap.get(authUser.id)
    const profile = profileMap.get(authUser.id)
    const prefs = prefMap.get(authUser.id)

    return {
      id: authUser.id,
      email: authUser.email,
      display_name: profile?.user_name || null,
      persona: stage?.persona || null,
      current_stage: stage?.current_stage ?? null,
      onboarding_completed: stage?.onboarding_v2_completed || false,
      quest_count: questCounts.get(authUser.id) || 0,
      last_active: stage?.updated_at || authUser.last_sign_in_at || authUser.created_at,
      has_push: pushUserIds.has(authUser.id),
      notifications_enabled: prefs?.quest_reminders ?? false,
      created_at: authUser.created_at,
    }
  })

  // Apply filters
  const now = Date.now()
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000

  if (filter === 'active') {
    users = users.filter((u: any) => now - new Date(u.last_active).getTime() < sevenDaysMs)
  } else if (filter === 'inactive') {
    users = users.filter((u: any) => now - new Date(u.last_active).getTime() >= sevenDaysMs)
  } else if (filter === 'no_notifications') {
    users = users.filter((u: any) => !u.has_push)
  }

  // Apply search
  if (search) {
    const q = search.toLowerCase()
    users = users.filter((u: any) =>
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.display_name && u.display_name.toLowerCase().includes(q))
    )
  }

  return jsonResponse({ users, total: users.length })
}

// ─── GET STATS ───────────────────────────────────────────────────────────

async function handleGetStats(supabase: any) {
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [
    usersResult,
    activeResult,
    pushResult,
    questsResult,
  ] = await Promise.all([
    // Total users — fetch all to count accurately
    supabase.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    // Active users (updated stage progress in last 7 days)
    supabase
      .from('user_stage_progress')
      .select('user_id', { count: 'exact', head: true })
      .gte('updated_at', sevenDaysAgo),
    // Users with push subscriptions
    supabase
      .from('push_subscriptions')
      .select('user_id', { count: 'exact', head: true }),
    // Total quest completions
    supabase
      .from('quest_completions')
      .select('user_id', { count: 'exact', head: true }),
  ])

  const totalUsers = usersResult.data?.users?.length || 0

  const activeThisWeek = activeResult.count || 0
  const notificationsEnabled = pushResult.count || 0
  const totalQuests = questsResult.count || 0
  const avgQuests = totalUsers > 0 ? Math.round(totalQuests / totalUsers) : 0

  return jsonResponse({
    totalUsers,
    activeThisWeek,
    notificationsEnabled,
    avgQuests,
  })
}

// ─── GET ENGAGEMENT ─────────────────────────────────────────────────────

async function handleGetEngagement(supabase: any) {
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const day7 = new Date(now.getTime() - 7 * 86400000).toISOString().split('T')[0]

  const [
    appOpens1d,
    appOpens7d,
    wahoos7d,
    dailyCheckins7d,
    tunePractices7d,
    healingCompleted7d,
    leagueJoins,
    eventCheckins,
  ] = await Promise.all([
    supabase.from('events').select('id', { count: 'exact', head: true }).eq('name', 'app_opened').gte('created_at', today),
    supabase.from('events').select('id', { count: 'exact', head: true }).eq('name', 'app_opened').gte('created_at', day7),
    supabase.from('events').select('id', { count: 'exact', head: true }).eq('name', 'wahoo_completed').gte('created_at', day7),
    supabase.from('events').select('id', { count: 'exact', head: true }).eq('name', 'daily_checkin').gte('created_at', day7),
    supabase.from('events').select('id', { count: 'exact', head: true }).eq('name', 'tune_practice').gte('created_at', day7),
    supabase.from('events').select('id', { count: 'exact', head: true }).eq('name', 'healing_completed').gte('created_at', day7),
    supabase.from('events').select('id', { count: 'exact', head: true }).eq('name', 'league_joined'),
    supabase.from('events').select('id', { count: 'exact', head: true }).eq('name', 'event_checkin'),
  ])

  // Unique users who opened app in last 7 days (DAU proxy)
  const { data: uniqueOpens } = await supabase
    .from('events')
    .select('session_id')
    .eq('name', 'app_opened')
    .gte('created_at', day7)

  const uniqueSessions7d = new Set((uniqueOpens || []).map((e: any) => e.session_id)).size

  return jsonResponse({
    appOpens1d: appOpens1d.count || 0,
    appOpens7d: appOpens7d.count || 0,
    uniqueSessions7d,
    wahoos7d: wahoos7d.count || 0,
    dailyCheckins7d: dailyCheckins7d.count || 0,
    tunePractices7d: tunePractices7d.count || 0,
    healingCompleted7d: healingCompleted7d.count || 0,
    leagueJoins: leagueJoins.count || 0,
    eventCheckins: eventCheckins.count || 0,
  })
}

// ─── SEND NUDGE ──────────────────────────────────────────────────────────

async function handleSendNudge(supabase: any, adminUserId: string, params: any) {
  const { targetUserId, title, body, url } = params

  if (!targetUserId || !title || !body) {
    return jsonResponse({ error: 'targetUserId, title, and body are required' }, 400)
  }

  // Get target user's display name for {name} variable replacement
  const { data: profile } = await supabase
    .from('lead_flow_profiles')
    .select('user_name')
    .eq('user_id', targetUserId)
    .single()

  const userName = profile?.user_name || 'there'
  const resolvedTitle = title.replace(/\{name\}/g, userName)
  const resolvedBody = body.replace(/\{name\}/g, userName)

  // Get push subscriptions for target user
  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', targetUserId)

  let pushResult = { sent: 0, failed: 0 }

  if (subscriptions && subscriptions.length > 0) {
    // Configure web-push
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')
    const vapidEmail = Deno.env.get('VAPID_EMAIL')

    if (vapidPublicKey && vapidPrivateKey && vapidEmail) {
      const formattedEmail = vapidEmail.startsWith('mailto:') ? vapidEmail : `mailto:${vapidEmail}`
      webpush.setVapidDetails(formattedEmail, vapidPublicKey, vapidPrivateKey)

      const payload = JSON.stringify({
        title: resolvedTitle,
        body: resolvedBody,
        icon: '/icon-192.png',
        badge: '/badge-72x72.png',
        tag: 'admin-nudge',
        url: url || '/',
        timestamp: Date.now(),
      })

      const results = await Promise.allSettled(
        subscriptions.map(async (sub: any) => {
          try {
            await webpush.sendNotification(
              { endpoint: sub.endpoint, keys: sub.keys },
              payload
            )
            return { success: true }
          } catch (error: any) {
            // Clean up expired subscriptions
            if (error.statusCode === 410 || error.statusCode === 404) {
              await supabase
                .from('push_subscriptions')
                .delete()
                .eq('endpoint', sub.endpoint)
            }
            return { success: false }
          }
        })
      )

      pushResult.sent = results.filter(
        (r) => r.status === 'fulfilled' && (r.value as any).success
      ).length
      pushResult.failed = results.length - pushResult.sent
    }
  }

  // Log to coach_nudges
  await supabase.from('coach_nudges').insert({
    user_id: targetUserId,
    trigger_type: 'admin_nudge',
    message: resolvedBody,
    nudge_title: resolvedTitle,
    nudge_url: url || null,
    admin_sender_id: adminUserId,
    shown_at: new Date().toISOString(),
  })

  return jsonResponse({
    success: true,
    push: pushResult,
    message: subscriptions?.length
      ? `Notification sent (${pushResult.sent} delivered, ${pushResult.failed} failed)`
      : 'Nudge logged (user has no push subscriptions)',
  })
}
