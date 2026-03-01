/**
 * leagueScoring.js — Fantasy League scoring engine
 *
 * Queries quest_completions for 3 fantasy categories:
 * Play-List, Healing, Bonus. Win 2 of 3 to take the week.
 */
import { supabase } from '../supabaseClient'
import { FANTASY_CATEGORIES, CATEGORY_KEYS, MATCH_POINTS } from './leagueConfig'

// ============================================
// Individual User Scoring
// ============================================

/**
 * Calculate a single user's scores across all fantasy categories
 * for a given date range.
 *
 * @param {string} userId
 * @param {string} startDate - ISO date string (inclusive)
 * @param {string} endDate - ISO date string (inclusive)
 * @param {number} approvedContentPoints - Pre-calculated approved content points for Bonus
 * @returns {{ [categoryKey]: number }}
 */
export async function calculateUserCategoryScores(userId, startDate, endDate, approvedContentPoints = 0) {
  // Fetch all quest_completions for this user in the date range
  const { data: completions, error } = await supabase
    .from('quest_completions')
    .select('quest_id, quest_category, points_earned, completed_at')
    .eq('user_id', userId)
    .gte('completed_at', startDate)
    .lte('completed_at', endDate + 'T23:59:59.999Z')

  if (error) {
    console.error('Error fetching completions for scoring:', error)
    return Object.fromEntries(CATEGORY_KEYS.map(k => [k, 0]))
  }

  const scores = {}

  for (const [key, config] of Object.entries(FANTASY_CATEGORIES)) {
    const categoryCompletions = completions.filter(c =>
      config.dbFilter.includes(c.quest_category)
    )
    scores[key] = categoryCompletions.reduce((sum, c) => sum + (c.points_earned || 0), 0)
  }

  // Add approved content points to Bonus
  scores.bonus = (scores.bonus || 0) + approvedContentPoints

  return scores
}

// ============================================
// Team Scoring
// ============================================

/**
 * Calculate team scores by summing member scores.
 *
 * @param {string[]} memberUserIds - Array of user IDs on the team
 * @param {string} startDate
 * @param {string} endDate
 * @param {{ [userId]: number }} contentPointsByUser - Approved content points per user
 * @returns {{ [categoryKey]: number, members: { [userId]: { [categoryKey]: number } } }}
 */
export async function calculateTeamScores(memberUserIds, startDate, endDate, contentPointsByUser = {}) {
  const memberScores = {}
  const teamTotals = Object.fromEntries(CATEGORY_KEYS.map(k => [k, 0]))

  // Calculate each member's scores
  await Promise.all(
    memberUserIds.map(async (userId) => {
      const userContentPoints = contentPointsByUser[userId] || 0
      const scores = await calculateUserCategoryScores(userId, startDate, endDate, userContentPoints)
      memberScores[userId] = scores

      for (const key of CATEGORY_KEYS) {
        teamTotals[key] += scores[key] || 0
      }
    })
  )

  return { ...teamTotals, members: memberScores }
}

// ============================================
// Matchup Calculation
// ============================================

/**
 * Calculate the result of a head-to-head matchup between two teams.
 *
 * @param {{ [categoryKey]: number }} teamAScores
 * @param {{ [categoryKey]: number }} teamBScores
 * @returns {{ teamACategoriesWon, teamBCategoriesWon, teamAMatchPoints, teamBMatchPoints, categoryResults }}
 */
export function calculateMatchupResult(teamAScores, teamBScores) {
  let teamACategoriesWon = 0
  let teamBCategoriesWon = 0
  const categoryResults = []

  for (const key of CATEGORY_KEYS) {
    const config = FANTASY_CATEGORIES[key]
    const aScore = teamAScores[key] || 0
    const bScore = teamBScores[key] || 0

    let winner = null
    if (aScore > bScore) {
      teamACategoriesWon++
      winner = 'a'
    } else if (bScore > aScore) {
      teamBCategoriesWon++
      winner = 'b'
    }
    // tie = no point to either

    categoryResults.push({
      category: key,
      label: config.label,
      teamAScore: aScore,
      teamBScore: bScore,
      winner,
    })
  }

  // Determine match points (3 categories):
  // WIN (3 pts): Win 2+ categories
  // DRAW (1 pt each): 1-1 split (1 tied)
  // LOSS (0 pts): Win 0 categories
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

  return {
    teamACategoriesWon,
    teamBCategoriesWon,
    teamAMatchPoints,
    teamBMatchPoints,
    categoryResults,
  }
}

// ============================================
// Full Week Calculation
// ============================================

/**
 * Calculate all matchups for a given week in a league.
 *
 * @param {string} leagueId
 * @param {number} weekNumber
 * @param {string} startDate - Week start date
 * @param {string} endDate - Week end date
 * @returns {Object[]} Array of updated matchup results
 */
export async function calculateWeekResults(leagueId, weekNumber, startDate, endDate) {
  // 1. Get all matchups for this week
  const { data: matchups, error: matchupError } = await supabase
    .from('fantasy_matchups')
    .select('*')
    .eq('league_id', leagueId)
    .eq('week_number', weekNumber)

  if (matchupError) throw matchupError
  if (!matchups || matchups.length === 0) return []

  // 2. Get all teams and their members
  const { data: teams, error: teamError } = await supabase
    .from('fantasy_teams')
    .select(`
      id,
      fantasy_team_members (user_id)
    `)
    .eq('league_id', leagueId)

  if (teamError) throw teamError

  const teamMembersMap = {}
  teams.forEach(t => {
    teamMembersMap[t.id] = (t.fantasy_team_members || []).map(m => m.user_id)
  })

  // 3. Get approved content submissions for this week
  const { data: contentSubs, error: contentError } = await supabase
    .from('league_content_submissions')
    .select('user_id, points_value')
    .eq('league_id', leagueId)
    .eq('week_number', weekNumber)
    .eq('status', 'approved')

  if (contentError) {
    console.error('Error loading content submissions:', contentError)
  }

  const contentPointsByUser = {}
  ;(contentSubs || []).forEach(sub => {
    contentPointsByUser[sub.user_id] = (contentPointsByUser[sub.user_id] || 0) + sub.points_value
  })

  // 4. Calculate team scores and matchup results
  const results = []
  const teamScoresCache = {}

  for (const matchup of matchups) {
    // Calculate team scores (cache to avoid recalculating if same team in multiple matchups)
    if (!teamScoresCache[matchup.team_a_id]) {
      teamScoresCache[matchup.team_a_id] = await calculateTeamScores(
        teamMembersMap[matchup.team_a_id] || [],
        startDate,
        endDate,
        contentPointsByUser
      )
    }
    if (!teamScoresCache[matchup.team_b_id]) {
      teamScoresCache[matchup.team_b_id] = await calculateTeamScores(
        teamMembersMap[matchup.team_b_id] || [],
        startDate,
        endDate,
        contentPointsByUser
      )
    }

    const teamAScores = teamScoresCache[matchup.team_a_id]
    const teamBScores = teamScoresCache[matchup.team_b_id]

    const result = calculateMatchupResult(teamAScores, teamBScores)

    // 5. Save to DB
    const { data: updated, error: updateError } = await supabase
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
      .select()
      .single()

    if (updateError) {
      console.error('Error saving matchup result:', updateError)
    } else {
      results.push(updated)
    }
  }

  return results
}

// ============================================
// League Standings
// ============================================

/**
 * Calculate league standings from all matchup results.
 * Sort: match points → total category wins → total raw points
 *
 * @param {string} leagueId
 * @returns {Object[]} Sorted standings array
 */
export async function calculateLeagueStandings(leagueId) {
  // Get all teams
  const { data: teams, error: teamError } = await supabase
    .from('fantasy_teams')
    .select(`
      id, name, invite_code,
      fantasy_team_members (user_id)
    `)
    .eq('league_id', leagueId)

  if (teamError) throw teamError
  if (!teams) return []

  // Get all calculated matchups
  const { data: matchups, error: matchupError } = await supabase
    .from('fantasy_matchups')
    .select('*')
    .eq('league_id', leagueId)
    .not('calculated_at', 'is', null)

  if (matchupError) throw matchupError

  // Aggregate stats per team
  const standings = teams.map(team => {
    let matchPoints = 0
    let categoryWins = 0
    let totalRawPoints = 0
    let wins = 0
    let draws = 0
    let losses = 0

    ;(matchups || []).forEach(m => {
      if (m.team_a_id === team.id) {
        matchPoints += m.team_a_match_points || 0
        categoryWins += m.team_a_categories_won || 0
        if (m.team_a_match_points === MATCH_POINTS.WIN) wins++
        else if (m.team_a_match_points === MATCH_POINTS.DRAW) draws++
        else losses++
        // Sum raw points from category_results
        ;(m.category_results || []).forEach(cr => {
          totalRawPoints += cr.teamAScore || 0
        })
      } else if (m.team_b_id === team.id) {
        matchPoints += m.team_b_match_points || 0
        categoryWins += m.team_b_categories_won || 0
        if (m.team_b_match_points === MATCH_POINTS.WIN) wins++
        else if (m.team_b_match_points === MATCH_POINTS.DRAW) draws++
        else losses++
        ;(m.category_results || []).forEach(cr => {
          totalRawPoints += cr.teamBScore || 0
        })
      }
    })

    return {
      teamId: team.id,
      teamName: team.name,
      inviteCode: team.invite_code,
      memberCount: (team.fantasy_team_members || []).length,
      memberUserIds: (team.fantasy_team_members || []).map(m => m.user_id),
      matchPoints,
      categoryWins,
      totalRawPoints,
      wins,
      draws,
      losses,
    }
  })

  // Sort: match points → category wins → total raw points (all descending)
  standings.sort((a, b) => {
    if (b.matchPoints !== a.matchPoints) return b.matchPoints - a.matchPoints
    if (b.categoryWins !== a.categoryWins) return b.categoryWins - a.categoryWins
    return b.totalRawPoints - a.totalRawPoints
  })

  return standings
}
