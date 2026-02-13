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
import { calculateLeagueStandings } from '../lib/league/leagueScoring'

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
      const [teamsData, userTeamData, matchupsData, standingsData] = await Promise.all([
        getTeams(leagueData.id),
        getUserTeam(leagueData.id, user.id),
        getMatchups(leagueData.id),
        leagueData.status !== 'upcoming'
          ? calculateLeagueStandings(leagueData.id)
          : Promise.resolve([]),
      ])

      setTeams(teamsData)
      setUserTeam(userTeamData)
      setMatchups(matchupsData)
      setStandings(standingsData)

      // 3. Load content submissions if user is on a team
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
  const getCurrentWeek = useCallback(() => {
    if (!league?.start_date || league.status === 'upcoming') return 0
    const start = new Date(league.start_date)
    const now = new Date()
    const diffDays = Math.floor((now - start) / (1000 * 60 * 60 * 24))
    const week = Math.floor(diffDays / 7) + 1
    return Math.min(week, league.num_weeks || 4)
  }, [league])

  // Get matchups for a specific week
  const getWeekMatchups = useCallback((weekNumber) => {
    return matchups.filter(m => m.week_number === weekNumber)
  }, [matchups])

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
  }
}
