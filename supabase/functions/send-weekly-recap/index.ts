import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import webpush from "npm:web-push@3.6.7"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Service role auth guard
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (token !== supabaseServiceKey) {
      return new Response(JSON.stringify({ error: 'Service role required' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: leagues } = await supabase
      .from('fantasy_leagues').select('id, current_week').eq('status', 'active')
    if (!leagues?.length) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')!
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!
    const vapidEmail = Deno.env.get('VAPID_EMAIL')!
    webpush.setVapidDetails(`mailto:${vapidEmail}`, vapidPublicKey, vapidPrivateKey)

    let totalSent = 0

    for (const league of leagues) {
      const lastWeek = (league.current_week || 1) - 1
      if (lastWeek < 1) continue

      const { data: matchups } = await supabase
        .from('fantasy_matchups').select('*')
        .eq('league_id', league.id).eq('week_number', lastWeek)
        .not('calculated_at', 'is', null)
      if (!matchups?.length) continue

      const { data: teams } = await supabase
        .from('fantasy_teams')
        .select('id, name, fantasy_team_members(user_id)')
        .eq('league_id', league.id)
      if (!teams) continue
      const teamMap = Object.fromEntries(teams.map((t: any) => [t.id, t]))

      // Collect ALL member IDs for this league for batch queries
      const allMemberIds = teams.flatMap(
        (t: any) => (t.fantasy_team_members || []).map((m: any) => m.user_id)
      )

      // Batch: notification prefs for all members
      const { data: prefs } = await supabase
        .from('notification_preferences')
        .select('user_id, matchup_alerts')
        .in('user_id', allMemberIds)
      const prefsMap = Object.fromEntries((prefs || []).map((p: any) => [p.user_id, p]))

      // Batch: push subscriptions for all members
      const { data: allSubs } = await supabase
        .from('push_subscriptions').select('*').in('user_id', allMemberIds)
      const subsMap: Record<string, any[]> = {}
      for (const sub of (allSubs || [])) {
        if (!subsMap[sub.user_id]) subsMap[sub.user_id] = []
        subsMap[sub.user_id].push(sub)
      }

      for (const m of matchups) {
        for (const side of ['a', 'b'] as const) {
          const myTeamId = side === 'a' ? m.team_a_id : m.team_b_id
          const oppTeamId = side === 'a' ? m.team_b_id : m.team_a_id
          const myWins = side === 'a' ? m.team_a_categories_won : m.team_b_categories_won
          const oppWins = side === 'a' ? m.team_b_categories_won : m.team_a_categories_won

          const myTeam = teamMap[myTeamId]
          const oppTeam = teamMap[oppTeamId]
          if (!myTeam || !oppTeam) continue

          const result = myWins > oppWins ? 'W' : myWins < oppWins ? 'L' : 'D'
          const emoji = result === 'W' ? '🎉' : result === 'L' ? '💪' : '🤝'
          const resultText = result === 'W'
            ? `You beat ${oppTeam.name} ${myWins}-${oppWins}`
            : result === 'L'
            ? `You lost to ${oppTeam.name} ${myWins}-${oppWins}`
            : `You drew with ${oppTeam.name} ${myWins}-${oppWins}`

          const memberIds = (myTeam.fantasy_team_members || []).map((mem: any) => mem.user_id)
          const payload = JSON.stringify({
            title: `Week ${lastWeek} Recap ${emoji}`,
            body: resultText,
            url: '/league/matchup',
            tag: 'weekly-recap',
          })

          for (const uid of memberIds) {
            const pref = prefsMap[uid]
            if (pref && pref.matchup_alerts === false) continue

            const subs = subsMap[uid]
            if (!subs?.length) continue

            for (const sub of subs) {
              try {
                await webpush.sendNotification({
                  endpoint: sub.endpoint,
                  keys: { p256dh: sub.p256dh, auth: sub.auth },
                }, payload)
                totalSent++
              } catch (err) {
                if ((err as any).statusCode === 410) {
                  await supabase.from('push_subscriptions').delete().eq('id', sub.id)
                }
              }
            }
          }
        }
      }
    }

    return new Response(JSON.stringify({ sent: totalSent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Weekly recap error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
