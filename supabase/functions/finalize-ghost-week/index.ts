/**
 * finalize-ghost-week — One-shot week finalization for Ghost Self League
 *
 * Called lazily by the client on first visit after a week ends.
 * Builds authoritative daily scores, compares 2-of-3, sets result,
 * updates ghost_streaks (atomic), seeds next week's ghost with decay.
 *
 * Uses service role key — bypasses RLS for atomic streak upsert.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TUNE_FILTER = ['Tune']
const COURAGE_FILTER = ['Groans', 'Healing', 'Daily', 'Weekly']

const DECAY_RATES: Record<number, number> = { 1: 0.75, 2: 0.50 }
const DECAY_RESET_THRESHOLD = 3

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { userId, weekStart, utcOffsetMinutes = 0 } = await req.json()
    if (!userId || !weekStart) {
      return new Response(JSON.stringify({ error: 'userId and weekStart required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Helper: convert UTC timestamp to local date string using client's timezone offset
    const toLocalDate = (utcTimestamp: string) => {
      const d = new Date(utcTimestamp)
      d.setMinutes(d.getMinutes() - utcOffsetMinutes)
      return d.toISOString().slice(0, 10)
    }

    // Verify JWT matches the userId being finalized
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
    )
    const token = authHeader.replace('Bearer ', '')
    const { data: { user: authUser }, error: authErr } = await anonClient.auth.getUser(token)
    if (authErr || authUser?.id !== userId) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // 1. Fetch the week's row — guard against double finalization
    const { data: weekRow } = await supabase
      .from('ghost_weekly_results')
      .select('*')
      .eq('user_id', userId)
      .eq('week_start', weekStart)
      .single()

    if (!weekRow) {
      return new Response(JSON.stringify({ error: 'Week row not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (weekRow.result !== 'pending') {
      // Already finalized — return existing result
      return new Response(JSON.stringify({ result: weekRow.result, alreadyFinalized: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2. Build authoritative daily scores from quest_completions
    // Use client's timezone offset to align week boundaries with local time
    const mondayLocal = new Date(weekStart + 'T00:00:00Z')
    mondayLocal.setMinutes(mondayLocal.getMinutes() + utcOffsetMinutes) // shift to local midnight in UTC terms
    const sundayEnd = new Date(mondayLocal)
    sundayEnd.setDate(sundayEnd.getDate() + 7)

    const { data: completions } = await supabase
      .from('quest_completions')
      .select('quest_category, points_earned, completed_at')
      .eq('user_id', userId)
      .gte('completed_at', mondayLocal.toISOString())
      .lt('completed_at', sundayEnd.toISOString())

    const { data: contentSubs } = await supabase
      .from('ghost_content_submissions')
      .select('points_value, created_at')
      .eq('user_id', userId)
      .eq('week_start', weekStart)

    // Build per-day raw scores (using local dates via offset)
    const dailyRaw: Record<string, { tune: number; courage: number; community: number }> = {}
    for (let i = 0; i < 7; i++) {
      const d = new Date(mondayLocal)
      d.setDate(d.getDate() + i)
      // Reverse the offset to get the local date string
      const localD = new Date(d)
      localD.setMinutes(localD.getMinutes() - utcOffsetMinutes)
      const key = localD.toISOString().slice(0, 10)
      dailyRaw[key] = { tune: 0, courage: 0, community: 0 }
    }

    ;(completions || []).forEach((c: any) => {
      const day = toLocalDate(c.completed_at)
      if (!dailyRaw[day]) return
      if (TUNE_FILTER.includes(c.quest_category)) {
        dailyRaw[day].tune += (c.points_earned || 0)
      } else if (COURAGE_FILTER.includes(c.quest_category)) {
        dailyRaw[day].courage += (c.points_earned || 0)
      }
    })

    ;(contentSubs || []).forEach((s: any) => {
      const day = toLocalDate(s.created_at)
      if (dailyRaw[day]) {
        dailyRaw[day].community += (s.points_value || 0)
      }
    })

    // Convert to cumulative
    const dates = Object.keys(dailyRaw).sort()
    const cumulative: Record<string, { tune: number; courage: number; community: number }> = {}
    let runTune = 0, runCourage = 0, runCommunity = 0

    dates.forEach(date => {
      runTune += dailyRaw[date].tune
      runCourage += dailyRaw[date].courage
      runCommunity += dailyRaw[date].community
      cumulative[date] = { tune: runTune, courage: runCourage, community: runCommunity }
    })

    // 3. Get final totals
    const lastDate = dates[dates.length - 1]
    const userFinal = lastDate ? cumulative[lastDate] : { tune: 0, courage: 0, community: 0 }

    // Ghost final totals from the stored ghost
    const ghostDates = Object.keys(weekRow.ghost_daily_scores || {}).sort()
    const ghostLastDate = ghostDates[ghostDates.length - 1]
    const ghostFinal = ghostLastDate
      ? weekRow.ghost_daily_scores[ghostLastDate]
      : { tune: 0, courage: 0, community: 0 }

    // 4. Compare categories
    const categories = ['tune', 'courage', 'community'] as const
    let userWins = 0, ghostWins = 0

    categories.forEach(key => {
      const u = userFinal[key] || 0
      const g = ghostFinal[key] || 0
      if (u > g) userWins++
      else if (g > u) ghostWins++
    })

    let result = 'draw'
    if (userWins >= 2) result = 'win'
    else if (ghostWins >= 2) result = 'loss'

    // 5. Update the week row
    await supabase
      .from('ghost_weekly_results')
      .update({
        user_daily_scores: cumulative,
        current_tune: userFinal.tune,
        current_courage: userFinal.courage,
        current_community: userFinal.community,
        ghost_tune: ghostFinal.tune || 0,
        ghost_courage: ghostFinal.courage || 0,
        ghost_community: ghostFinal.community || 0,
        categories_won: userWins,
        categories_lost: ghostWins,
        result,
        finalized_at: new Date().toISOString(),
      })
      .eq('id', weekRow.id)

    // 6. Update ghost_streaks (atomic upsert)
    const { data: streakRow } = await supabase
      .from('ghost_streaks')
      .select('*')
      .eq('user_id', userId)
      .single()

    const prev = streakRow || {
      current_streak: 0, longest_streak: 0, consecutive_losses: 0,
      total_wins: 0, total_losses: 0, total_draws: 0,
      pb_tune: 0, pb_courage: 0, pb_community: 0,
    }

    const newStreak = result === 'win' ? prev.current_streak + 1 : 0
    const newConsecLosses = result === 'loss' ? prev.consecutive_losses + 1 : 0

    const streakUpdate = {
      user_id: userId,
      current_streak: newStreak,
      longest_streak: Math.max(prev.longest_streak, newStreak),
      consecutive_losses: newConsecLosses,
      total_wins: prev.total_wins + (result === 'win' ? 1 : 0),
      total_losses: prev.total_losses + (result === 'loss' ? 1 : 0),
      total_draws: prev.total_draws + (result === 'draw' ? 1 : 0),
      last_result: result,
      last_result_at: weekStart,
      pb_tune: Math.max(prev.pb_tune, userFinal.tune),
      pb_courage: Math.max(prev.pb_courage, userFinal.courage),
      pb_community: Math.max(prev.pb_community, userFinal.community),
      updated_at: new Date().toISOString(),
    }

    if (streakRow) {
      await supabase.from('ghost_streaks').update(streakUpdate).eq('user_id', userId)
    } else {
      await supabase.from('ghost_streaks').insert(streakUpdate)
    }

    // 7. Seed next week's ghost (apply decay if needed)
    const nextMonday = new Date(mondayDate)
    nextMonday.setDate(nextMonday.getDate() + 7)
    const nextWeekStart = nextMonday.toISOString().slice(0, 10)

    // Translate date keys to next week (ghost keys must match the week they'll be compared against)
    const translateDates = (scores: Record<string, any>) => {
      const translated: Record<string, any> = {}
      for (const [date, vals] of Object.entries(scores)) {
        const d = new Date(date + 'T00:00:00Z')
        d.setDate(d.getDate() + 7)
        translated[d.toISOString().slice(0, 10)] = vals
      }
      return translated
    }

    let nextGhost: Record<string, any> = {}
    if (newConsecLosses >= DECAY_RESET_THRESHOLD) {
      nextGhost = {}
    } else if (newConsecLosses > 0 && DECAY_RATES[newConsecLosses]) {
      const mult = DECAY_RATES[newConsecLosses]
      for (const [date, scores] of Object.entries(cumulative)) {
        nextGhost[date] = {
          tune: Math.round((scores as any).tune * mult),
          courage: Math.round((scores as any).courage * mult),
          community: Math.round((scores as any).community * mult),
        }
      }
      nextGhost = translateDates(nextGhost)
    } else {
      nextGhost = translateDates(cumulative)
    }

    // Seed next week's row — only write ghost if not already populated
    const { data: existingNext } = await supabase
      .from('ghost_weekly_results')
      .select('id, ghost_daily_scores')
      .eq('user_id', userId)
      .eq('week_start', nextWeekStart)
      .maybeSingle()

    if (existingNext && Object.keys(existingNext.ghost_daily_scores || {}).length > 0) {
      // Already populated (by client or earlier finalization) — don't overwrite
    } else if (existingNext) {
      // Row exists but ghost is empty — update it
      await supabase.from('ghost_weekly_results')
        .update({ ghost_daily_scores: nextGhost })
        .eq('id', existingNext.id)
    } else {
      // No row yet — insert
      await supabase.from('ghost_weekly_results')
        .insert({ user_id: userId, week_start: nextWeekStart, ghost_daily_scores: nextGhost })
    }

    return new Response(JSON.stringify({
      result,
      userWins,
      ghostWins,
      streak: newStreak,
      consecutiveLosses: newConsecLosses,
      userFinal,
      ghostFinal,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
