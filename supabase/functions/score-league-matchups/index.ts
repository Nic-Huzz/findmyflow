/**
 * score-league-matchups — Cron Edge Function
 *
 * Runs every 15 minutes. For each active league:
 * 1. Finds matchups that are uncalculated or stale (current week only)
 * 2. Recalculates scores from quest_completions
 * 3. Updates fantasy_matchups with results
 *
 * Uses service role key — bypasses RLS entirely.
 * Triggered by pg_cron or external scheduler (e.g. Vercel cron, GitHub Actions).
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const STALE_MS = 15 * 60 * 1000 // 15 minutes — match the cron interval

// Fantasy scoring categories — mirrors leagueConfig.js (3 categories)
// Tune + Courage + Reach (win 2 of 3). Healing merged into Courage.
const FANTASY_CATEGORIES: Record<string, { key: string; label: string; dbFilter: string[]; scoringType: string }> = {
  tune: { key: 'tune', label: 'Tune', dbFilter: ['Tune'], scoringType: 'raw' },
  courage: { key: 'courage', label: 'Courage', dbFilter: ['Groans', 'Healing', 'Daily', 'Weekly'], scoringType: 'raw' },
  reach: { key: 'reach', label: 'Reach', dbFilter: [], scoringType: 'content' },
}

const CATEGORY_KEYS = Object.keys(FANTASY_CATEGORIES)

const MATCH_POINTS = { WIN: 3, DRAW: 1, LOSS: 0 }

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-CA') // YYYY-MM-DD
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    console.log('🏆 Starting league auto-scoring...')

    // 1. Get all active leagues (started but not ended)
    const now = new Date()
    const todayStr = formatDate(now)

    const { data: leagues, error: leagueErr } = await supabase
      .from('fantasy_leagues')
      .select('id, start_date, end_date, num_weeks, status')
      .lte('start_date', todayStr)
      .in('status', ['active', 'upcoming'])

    if (leagueErr) throw leagueErr
    if (!leagues?.length) {
      console.log('No active leagues found')
      return jsonResponse({ message: 'No active leagues', scored: 0 })
    }

    let totalScored = 0
    const results: Record<string, number[]> = {}

    for (const league of leagues) {
      const scored = await scoreLeague(supabase, league, now)
      if (scored.length > 0) {
        results[league.id] = scored
        totalScored += scored.length
      }
    }

    console.log(`✅ Auto-scoring complete. Scored ${totalScored} week(s) across ${Object.keys(results).length} league(s)`)
    return jsonResponse({ success: true, totalScored, results })

  } catch (error: any) {
    console.error('❌ Auto-scoring error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// ─── Score a single league ───

async function scoreLeague(supabase: any, league: any, now: Date): Promise<number[]> {
  const start = new Date(league.start_date + 'T00:00:00')
  if (now < start) return []

  const diffDays = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  const currentWeek = Math.min(Math.floor(diffDays / 7) + 1, league.num_weeks || 4)

  // Fetch all matchups for this league
  const { data: matchups, error } = await supabase
    .from('fantasy_matchups')
    .select('id, week_number, team_a_id, team_b_id, calculated_at')
    .eq('league_id', league.id)

  if (error || !matchups?.length) return []

  // Determine which weeks need scoring
  const weekStatus: Record<number, { hasNull: boolean; latestCalc: number | null; matchups: any[] }> = {}
  for (const m of matchups) {
    const wk = m.week_number
    if (!weekStatus[wk]) weekStatus[wk] = { hasNull: false, latestCalc: null, matchups: [] }
    weekStatus[wk].matchups.push(m)
    if (!m.calculated_at) {
      weekStatus[wk].hasNull = true
    } else {
      const t = new Date(m.calculated_at).getTime()
      if (!weekStatus[wk].latestCalc || t > weekStatus[wk].latestCalc) {
        weekStatus[wk].latestCalc = t
      }
    }
  }

  const weeksToScore: number[] = []
  for (let wk = 1; wk <= currentWeek; wk++) {
    const status = weekStatus[wk]
    if (!status) continue
    if (status.hasNull) {
      weeksToScore.push(wk)
    } else if (wk === currentWeek && (now.getTime() - (status.latestCalc || 0) > STALE_MS)) {
      weeksToScore.push(wk)
    }
  }

  if (weeksToScore.length === 0) return []

  // Load teams + members once
  const { data: teams } = await supabase
    .from('fantasy_teams')
    .select('id, fantasy_team_members(user_id)')
    .eq('league_id', league.id)

  const teamMembers: Record<string, string[]> = {}
  for (const t of (teams || [])) {
    teamMembers[t.id] = (t.fantasy_team_members || []).map((m: any) => m.user_id)
  }

  const scored: number[] = []

  for (const wk of weeksToScore) {
    try {
      const weekStart = new Date(start)
      weekStart.setDate(start.getDate() + (wk - 1) * 7)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      const startStr = formatDate(weekStart)
      const endStr = formatDate(weekEnd)

      // Get approved content submissions for bonus points
      const { data: contentSubs } = await supabase
        .from('league_content_submissions')
        .select('user_id, points_value')
        .eq('league_id', league.id)
        .eq('week_number', wk)
        .eq('status', 'approved')

      const contentPointsByUser: Record<string, number> = {}
      for (const s of (contentSubs || [])) {
        contentPointsByUser[s.user_id] = (contentPointsByUser[s.user_id] || 0) + s.points_value
      }

      // Score each matchup in this week
      const weekMatchups = (weekStatus[wk]?.matchups || [])
      for (const matchup of weekMatchups) {
        const teamAMembers = teamMembers[matchup.team_a_id] || []
        const teamBMembers = teamMembers[matchup.team_b_id] || []

        const teamAScores = await calculateTeamScores(supabase, teamAMembers, startStr, endStr, contentPointsByUser)
        const teamBScores = await calculateTeamScores(supabase, teamBMembers, startStr, endStr, contentPointsByUser)

        const result = calculateMatchupResult(teamAScores, teamBScores)

        const { error: updateErr } = await supabase
          .from('fantasy_matchups')
          .update({
            team_a_categories_won: result.teamACategoriesWon,
            team_b_categories_won: result.teamBCategoriesWon,
            team_a_match_points: result.teamAMatchPoints,
            team_b_match_points: result.teamBMatchPoints,
            category_results: result.categoryResults,
            calculated_at: new Date().toISOString(),
          })
          .eq('id', matchup.id)

        if (updateErr) {
          console.error(`Failed to update matchup ${matchup.id}:`, updateErr)
        }
      }

      scored.push(wk)
      console.log(`  ✓ League ${league.id} week ${wk} scored`)
    } catch (err) {
      console.error(`  ✗ League ${league.id} week ${wk} failed:`, err)
    }
  }

  return scored
}

// ─── Scoring helpers (mirrors leagueScoring.js) ───

async function calculateUserScores(
  supabase: any,
  userId: string,
  startDate: string,
  endDate: string,
  approvedContentPoints = 0
): Promise<Record<string, number>> {
  const scores: Record<string, number> = Object.fromEntries(CATEGORY_KEYS.map(k => [k, 0]))

  const { data: completions } = await supabase
    .from('quest_completions')
    .select('quest_id, quest_category, points_earned')
    .eq('user_id', userId)
    .gte('completed_at', startDate)
    .lte('completed_at', endDate + 'T23:59:59.999Z')

  if (!completions) return scores

  for (const c of completions) {
    const catEntry = Object.values(FANTASY_CATEGORIES).find(f => f.dbFilter.includes(c.quest_category))
    if (!catEntry) continue
    scores[catEntry.key] += (c.points_earned || 0)
  }

  // Reach: approved content submission points
  scores.reach = approvedContentPoints

  return scores
}

async function calculateTeamScores(
  supabase: any,
  memberIds: string[],
  startDate: string,
  endDate: string,
  contentPointsByUser: Record<string, number>
): Promise<Record<string, number>> {
  const teamScores: Record<string, number> = Object.fromEntries(CATEGORY_KEYS.map(k => [k, 0]))

  const allUserScores = await Promise.all(
    memberIds.map(userId =>
      calculateUserScores(
        supabase,
        userId,
        startDate,
        endDate,
        contentPointsByUser[userId] || 0
      )
    )
  )

  for (const userScores of allUserScores) {
    for (const key of CATEGORY_KEYS) {
      teamScores[key] += userScores[key]
    }
  }

  return teamScores
}

function calculateMatchupResult(teamAScores: Record<string, number>, teamBScores: Record<string, number>) {
  let teamACategoriesWon = 0
  let teamBCategoriesWon = 0
  const categoryResults: any[] = []

  for (const key of CATEGORY_KEYS) {
    const config = FANTASY_CATEGORIES[key]
    const a = teamAScores[key] || 0
    const b = teamBScores[key] || 0

    let winner: string | null = null
    if (a > b) {
      teamACategoriesWon++
      winner = 'a'
    } else if (b > a) {
      teamBCategoriesWon++
      winner = 'b'
    }
    // tie = no point to either, winner stays null

    categoryResults.push({
      category: key,
      label: config.label,
      teamAScore: a,
      teamBScore: b,
      winner,
    })
  }

  let teamAMatchPoints = MATCH_POINTS.LOSS
  let teamBMatchPoints = MATCH_POINTS.LOSS

  if (teamACategoriesWon >= 2) {
    teamAMatchPoints = MATCH_POINTS.WIN
    teamBMatchPoints = MATCH_POINTS.LOSS
  } else if (teamBCategoriesWon >= 2) {
    teamAMatchPoints = MATCH_POINTS.LOSS
    teamBMatchPoints = MATCH_POINTS.WIN
  } else if (teamACategoriesWon === 1 && teamBCategoriesWon === 1) {
    teamAMatchPoints = MATCH_POINTS.DRAW
    teamBMatchPoints = MATCH_POINTS.DRAW
  }

  return { teamACategoriesWon, teamBCategoriesWon, teamAMatchPoints, teamBMatchPoints, categoryResults }
}
