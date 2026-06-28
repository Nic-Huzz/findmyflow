/**
 * useLeagueData — Custom hook for Fantasy League state management
 *
 * Pattern follows useChallengeData.js — loads league, teams, standings,
 * matchups, user's team, and content submissions.
 */
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../auth/AuthProvider'
import {
  getActiveLeague,
  getTeams,
  getUserTeam,
  getMatchups,
  getContentSubmissions,
} from '../lib/league/leagueService'
import { calculateLeagueStandings, calculateTeamScores } from '../lib/league/leagueScoring'
import { formatLocalDate } from '../lib/dateUtils'
import { supabase } from '../lib/supabaseClient'

export function useLeagueData() {
  const { user } = useAuth()

  // Core state
  const [loading, setLoading] = useState(true)
  const [league, setLeague] = useState(null)
  const [teams, setTeams] = useState([])
  const [userTeam, setUserTeam] = useState(null)
  const [standings, setStandings] = useState([])
  const [matchups, setMatchups] = useState([])
  const [contentSubmissions, setContentSubmissions] = useState([])
  const [error, setError] = useState(null)
  const [memberNames, setMemberNames] = useState({})
  const [memberAvatars, setMemberAvatars] = useState({})
  const [memberEssenceNames, setMemberEssenceNames] = useState({})

  // Derived
  const isOnTeam = !!userTeam
  const leagueExists = !!league

  // Load all league data
  const loadLeagueData = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    setError(null)

    try {
      // 1. Get active league
      const leagueData = await getActiveLeague()
      setLeague(leagueData)

      if (!leagueData) {
        setTeams([])
        setUserTeam(null)
        setStandings([])
        setMatchups([])
        setContentSubmissions([])
        return
      }

      // 2. Load everything in parallel
      // Auto-detect active from date, not status field
      const leagueStarted = new Date() >= new Date(leagueData.start_date + 'T00:00:00')
      const [teamsData, userTeamData, matchupsData, standingsData] = await Promise.all([
        getTeams(leagueData.id),
        getUserTeam(leagueData.id, user.id),
        getMatchups(leagueData.id),
        leagueStarted
          ? calculateLeagueStandings(leagueData.id)
          : Promise.resolve([]),
      ])

      setTeams(teamsData)
      setUserTeam(userTeamData)
      setMatchups(matchupsData)
      setStandings(standingsData)

      // 3. Load member display names + avatars
      const allMemberIds = (teamsData || []).flatMap(t =>
        (t.fantasy_team_members || []).map(m => m.user_id)
      )
      if (allMemberIds.length > 0) {
        const [{ data: names }, { data: avatarRows }] = await Promise.all([
          supabase.rpc('get_member_display_names', { member_ids: allMemberIds }),
          supabase.rpc('get_member_profiles', { member_ids: allMemberIds }),
        ])
        const nameMap = {}
        ;(names || []).forEach(n => {
          nameMap[n.user_id] = n.display_name || 'Player'
        })
        setMemberNames(nameMap)
        // Deduplicate: first row per user_id wins (most recent)
        const avatarMap = {}
        const essenceNameMap = {}
        ;(avatarRows || []).forEach(r => {
          if (!avatarMap[r.user_id] && r.custom_essence_image) {
            avatarMap[r.user_id] = r.custom_essence_image
          }
          if (!essenceNameMap[r.user_id] && r.custom_essence_name) {
            essenceNameMap[r.user_id] = r.custom_essence_name
          }
        })
        setMemberAvatars(avatarMap)
        setMemberEssenceNames(essenceNameMap)
      }

      // 4. Load content submissions if user is on a team
      if (userTeamData) {
        const subs = await getContentSubmissions(leagueData.id, { userId: user.id })
        setContentSubmissions(subs)
      }

    } catch (err) {
      console.error('Error loading league data:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  // Reload standings only (after matchup calculation)
  const reloadStandings = useCallback(async () => {
    if (!league?.id) return
    try {
      const [standingsData, matchupsData] = await Promise.all([
        calculateLeagueStandings(league.id),
        getMatchups(league.id),
      ])
      setStandings(standingsData)
      setMatchups(matchupsData)
    } catch (err) {
      console.error('Error reloading standings:', err)
    }
  }, [league?.id])

  // Reload teams (after join/create)
  const reloadTeams = useCallback(async () => {
    if (!league?.id || !user?.id) return
    try {
      const [teamsData, userTeamData] = await Promise.all([
        getTeams(league.id),
        getUserTeam(league.id, user.id),
      ])
      setTeams(teamsData)
      setUserTeam(userTeamData)
    } catch (err) {
      console.error('Error reloading teams:', err)
    }
  }, [league?.id, user?.id])

  // Reload content submissions
  const reloadContent = useCallback(async () => {
    if (!league?.id || !user?.id) return
    try {
      const subs = await getContentSubmissions(league.id, { userId: user.id })
      setContentSubmissions(subs)
    } catch (err) {
      console.error('Error reloading content:', err)
    }
  }, [league?.id, user?.id])

  // Get current week number based on league start date
  // Auto-detects active state from date — no dependency on status field
  const getCurrentWeek = useCallback(() => {
    if (!league?.start_date) return 0
    const start = new Date(league.start_date + 'T00:00:00')
    const now = new Date()
    if (now < start) return 0 // hasn't started yet
    const diffDays = Math.floor((now - start) / (1000 * 60 * 60 * 24))
    const week = Math.floor(diffDays / 7) + 1
    return Math.min(week, league.num_weeks || 4)
  }, [league])

  // Get matchups for a specific week
  const getWeekMatchups = useCallback((weekNumber) => {
    return matchups.filter(m => m.week_number === weekNumber)
  }, [matchups])

  // Get date range for a specific week number
  const getWeekDateRange = useCallback((weekNumber) => {
    if (!league?.start_date) return null
    const leagueStart = new Date(league.start_date + 'T00:00:00')
    const weekStart = new Date(leagueStart)
    weekStart.setDate(leagueStart.getDate() + (weekNumber - 1) * 7)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    return { start: formatLocalDate(weekStart), end: formatLocalDate(weekEnd) }
  }, [league?.start_date])

  // Fetch live team scores for a set of member user IDs
  // Defaults to current week, but accepts an optional weekNumber override
  const fetchLiveTeamScores = useCallback(async (memberUserIds, weekNumber = null) => {
    const targetWeek = weekNumber !== null ? weekNumber : getCurrentWeek()
    if (!targetWeek || !league?.id) return null
    const range = getWeekDateRange(targetWeek)
    if (!range) return null

    // Get approved content submissions for this week
    const { data: contentSubs } = await supabase
      .from('league_content_submissions')
      .select('user_id, points_value')
      .eq('league_id', league.id)
      .eq('week_number', targetWeek)
      .eq('status', 'approved')

    const contentPointsByUser = {}
    ;(contentSubs || []).forEach(sub => {
      contentPointsByUser[sub.user_id] = (contentPointsByUser[sub.user_id] || 0) + sub.points_value
    })

    return calculateTeamScores(memberUserIds, range.start, range.end, contentPointsByUser)
  }, [league?.id, getCurrentWeek, getWeekDateRange])

  // Load on mount
  useEffect(() => {
    loadLeagueData()
  }, [loadLeagueData])

  return {
    // State
    loading,
    error,
    league,
    setLeague,
    teams,
    userTeam,
    standings,
    matchups,
    contentSubmissions,

    // Derived
    isOnTeam,
    leagueExists,

    // Actions
    loadLeagueData,
    reloadStandings,
    reloadTeams,
    reloadContent,

    // Helpers
    getCurrentWeek,
    getWeekMatchups,
    getWeekDateRange,
    fetchLiveTeamScores,
    memberNames,
    memberAvatars,
    memberEssenceNames,
  }
}
