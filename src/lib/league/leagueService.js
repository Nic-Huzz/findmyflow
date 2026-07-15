/**
 * leagueService.js — Fantasy League CRUD operations
 */
import { supabase } from '../supabaseClient'
import { CONTENT_POINT_VALUES, INVITE_CODE_LENGTH } from './leagueConfig'

// Generate a random invite code (6 uppercase alphanumeric chars)
function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no I/O/0/1 for clarity
  let code = ''
  for (let i = 0; i < INVITE_CODE_LENGTH; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// ============================================
// League CRUD
// ============================================

export async function createLeague({ name, startDate, endDate, numWeeks = 4, userId }) {
  const { data, error } = await supabase
    .from('fantasy_leagues')
    .insert({
      name,
      status: 'upcoming',
      start_date: startDate,
      end_date: endDate,
      num_weeks: numWeeks,
      created_by: userId,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateLeagueStatus(leagueId, status) {
  const { data, error } = await supabase
    .from('fantasy_leagues')
    .update({ status })
    .eq('id', leagueId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getActiveLeague() {
  // Get the most recent non-cancelled league
  const { data, error } = await supabase
    .from('fantasy_leagues')
    .select('*')
    .in('status', ['upcoming', 'active', 'completed'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function getLeague(leagueId) {
  const { data, error } = await supabase
    .from('fantasy_leagues')
    .select('*')
    .eq('id', leagueId)
    .single()

  if (error) throw error
  return data
}

// ============================================
// Team CRUD
// ============================================

export async function createTeam({ leagueId, name, userId }) {
  const inviteCode = generateInviteCode()

  const { data: team, error: teamError } = await supabase
    .from('fantasy_teams')
    .insert({
      league_id: leagueId,
      name,
      invite_code: inviteCode,
      created_by: userId,
    })
    .select()
    .single()

  if (teamError) throw teamError

  // Auto-join the creator to the team (trigger auto-populates league_id)
  const { error: memberError } = await supabase
    .from('fantasy_team_members')
    .insert({
      team_id: team.id,
      user_id: userId,
    })

  if (memberError) throw memberError

  return team
}

/**
 * Join a league as a solo player (creates a 1-member team).
 * Display name defaults to user's first name if not provided.
 */
export async function joinSolo({ leagueId, userId, displayName }) {
  return createTeam({ leagueId, name: displayName, userId })
}

export async function joinTeam({ inviteCode, userId }) {
  // Look up team by invite code (include members for size check)
  const { data: team, error: teamError } = await supabase
    .from('fantasy_teams')
    .select('*, fantasy_leagues(id, status), fantasy_team_members(id)')
    .eq('invite_code', inviteCode.toUpperCase().trim())
    .single()

  if (teamError || !team) {
    throw new Error('Invalid invite code. Please check and try again.')
  }

  // Enforce 3-member team limit
  const currentSize = (team.fantasy_team_members || []).length
  if (currentSize >= 3) {
    throw new Error('This team is full (3/3 members).')
  }

  // Insert member (unique constraints will catch duplicates)
  const { error: memberError } = await supabase
    .from('fantasy_team_members')
    .insert({
      team_id: team.id,
      user_id: userId,
    })

  if (memberError) {
    if (memberError.code === '23505') {
      // Check which constraint was violated
      if (memberError.message.includes('league_id')) {
        throw new Error('You are already on a team in this league.')
      }
      throw new Error('You are already on this team.')
    }
    throw memberError
  }

  return team
}

export async function getTeams(leagueId) {
  const { data, error } = await supabase
    .from('fantasy_teams')
    .select(`
      *,
      fantasy_team_members (
        id, user_id, joined_at
      )
    `)
    .eq('league_id', leagueId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data || []
}

export async function getUserTeam(leagueId, userId) {
  const { data, error } = await supabase
    .from('fantasy_team_members')
    .select(`
      *,
      fantasy_teams (*)
    `)
    .eq('league_id', leagueId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return data?.fantasy_teams || null
}

// ============================================
// Matchup CRUD
// ============================================

export async function createMatchup({ leagueId, weekNumber, weekStart, teamAId, teamBId }) {
  const { data, error } = await supabase
    .from('fantasy_matchups')
    .insert({
      league_id: leagueId,
      week_number: weekNumber,
      week_start: weekStart,
      team_a_id: teamAId,
      team_b_id: teamBId,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getMatchups(leagueId, weekNumber = null) {
  let query = supabase
    .from('fantasy_matchups')
    .select('*')
    .eq('league_id', leagueId)
    .order('week_number', { ascending: true })

  if (weekNumber !== null) {
    query = query.eq('week_number', weekNumber)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

export async function updateMatchupResults(matchupId, results) {
  const { data, error } = await supabase
    .from('fantasy_matchups')
    .update({
      team_a_categories_won: results.teamACategoriesWon,
      team_b_categories_won: results.teamBCategoriesWon,
      team_a_match_points: results.teamAMatchPoints,
      team_b_match_points: results.teamBMatchPoints,
      category_results: results.categoryResults,
      calculated_at: new Date().toISOString(),
    })
    .eq('id', matchupId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteMatchup(matchupId) {
  const { error } = await supabase
    .from('fantasy_matchups')
    .delete()
    .eq('id', matchupId)

  if (error) throw error
}

// ============================================
// Content Submissions
// ============================================

export async function submitContent({ leagueId, userId, teamId, weekNumber, contentType, linkUrl, description }) {
  const config = CONTENT_POINT_VALUES[contentType]
  const pointsValue = config?.points || 0
  const status = config?.autoApprove ? 'approved' : 'pending'

  const { data, error } = await supabase
    .from('league_content_submissions')
    .insert({
      league_id: leagueId,
      user_id: userId,
      team_id: teamId,
      week_number: weekNumber,
      content_type: contentType,
      link_url: linkUrl,
      description,
      points_value: pointsValue,
      status,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getContentSubmissions(leagueId, { weekNumber, status, userId } = {}) {
  let query = supabase
    .from('league_content_submissions')
    .select('*')
    .eq('league_id', leagueId)
    .order('created_at', { ascending: false })

  if (weekNumber !== null && weekNumber !== undefined) {
    query = query.eq('week_number', weekNumber)
  }
  if (status) {
    query = query.eq('status', status)
  }
  if (userId) {
    query = query.eq('user_id', userId)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

export async function reviewContent(submissionId, { status, reviewedBy, reviewNote }) {
  const { data, error } = await supabase
    .from('league_content_submissions')
    .update({
      status,
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
      review_note: reviewNote || null,
    })
    .eq('id', submissionId)
    .select()
    .single()

  if (error) throw error
  return data
}

// ============================================
// Activity Feed
// ============================================

export async function getActivityFeed(leagueId, { limit = 20, offset = 0 } = {}) {
  const { data, error } = await supabase
    .rpc('get_league_activity_feed', {
      p_league_id: leagueId,
      p_limit: limit,
      p_offset: offset,
    })

  if (error) throw error
  return data || []
}

// ============================================
// Reactions
// ============================================

export async function addReaction(submissionId, reactionType = 'cheer') {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('league_content_reactions')
    .upsert({
      submission_id: submissionId,
      user_id: session.user.id,
      reaction_type: reactionType,
    }, { onConflict: 'submission_id,user_id,reaction_type' })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function removeReaction(submissionId, reactionType = 'cheer') {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('league_content_reactions')
    .delete()
    .eq('submission_id', submissionId)
    .eq('user_id', session.user.id)
    .eq('reaction_type', reactionType)

  if (error) throw error
}

export async function getUserReactions(submissionIds) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user || !submissionIds?.length) return []

  const { data, error } = await supabase
    .from('league_content_reactions')
    .select('submission_id, reaction_type')
    .eq('user_id', session.user.id)
    .in('submission_id', submissionIds)

  if (error) throw error
  return data || []
}

// ============================================
// OG Metadata (save after scraping client-side)
// ============================================

export async function updateOGMetadata(submissionId, { ogTitle, ogImage, ogDescription }) {
  const { error } = await supabase
    .from('league_content_submissions')
    .update({
      og_title: ogTitle || null,
      og_image: ogImage || null,
      og_description: ogDescription || null,
    })
    .eq('id', submissionId)

  if (error) throw error
}
