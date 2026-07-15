/**
 * useMatchupData — Derives fantasy category scores from in-memory completions
 * and fetches opponent matchup data for the challenge header.
 *
 * Two-phase rendering:
 *   1. Instant: categoryScores derived from completions (no DB query)
 *   2. Async:   opponent scores fetched, per-category W/L computed
 */
import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { FANTASY_CATEGORIES, CATEGORY_KEYS } from '../lib/league/leagueConfig'
import { getWeekStartLocal } from '../lib/dateUtils'
import { triggerSideCannons } from '../components/Celebrations'
import { hapticSuccess, hapticError } from '../lib/haptics'
import { sendNotification } from '../lib/notifications'
import { supabase } from '../lib/supabaseClient'

export function useMatchupData({
  completions,
  contentSubmissions,
  userTeam,
  league,
  teams,
  getCurrentWeek,
  getWeekMatchups,
  fetchLiveTeamScores,
}) {
  const [matchupData, setMatchupData] = useState(null)
  const [matchupLoading, setMatchupLoading] = useState(false)
  const [flipEvent, setFlipEvent] = useState(null)
  const fetchIdRef = useRef(0)
  const lastHiddenRef = useRef(null)
  const prevWinningRef = useRef(null) // { [categoryKey]: boolean } for W/L flip detection
  const lastNotifyRef = useRef(0) // rate limit: max 1 game day notify per 15min

  // ─── Phase 1: Derive user's category scores from in-memory completions ───
  const categoryScores = useMemo(() => {
    const scores = Object.fromEntries(CATEGORY_KEYS.map(k => [k, 0]))

    if (completions?.length > 0) {
      const weekStart = new Date(getWeekStartLocal() + 'T00:00:00')
      const weekCompletions = completions.filter(
        c => new Date(c.completed_at) >= weekStart
      )

      weekCompletions.forEach(c => {
        const catEntry = Object.values(FANTASY_CATEGORIES).find(f =>
          f.dbFilter.includes(c.quest_category)
        )
        if (!catEntry) return
        scores[catEntry.key] += (c.points_earned || 0)
      })
    }

    // Reach: sum approved content submissions for current week
    const currentWeek = getCurrentWeek?.()
    if (contentSubmissions?.length > 0 && currentWeek) {
      const weekApproved = contentSubmissions.filter(s =>
        s.status === 'approved' && s.week_number === currentWeek
      )
      scores.reach = weekApproved.reduce((sum, s) => sum + (s.points_value || 0), 0)
    }

    return scores
  }, [completions, contentSubmissions, getCurrentWeek])

  // ─── Phase 2: Fetch opponent scores and compute matchup ───
  const fetchOpponentData = useCallback(async () => {
    if (!userTeam || !league || league.status !== 'active') {
      setMatchupData(null)
      return
    }
    if (!getCurrentWeek || !getWeekMatchups || !fetchLiveTeamScores) return

    const weekNum = getCurrentWeek()
    if (!weekNum) { setMatchupData(null); return }

    const weekMatchups = getWeekMatchups(weekNum)
    const matchup = weekMatchups.find(
      m => m.team_a_id === userTeam.id || m.team_b_id === userTeam.id
    )
    if (!matchup) { setMatchupData(null); return }

    const oppTeamId =
      matchup.team_a_id === userTeam.id
        ? matchup.team_b_id
        : matchup.team_a_id
    const oppTeam = teams.find(t => t.id === oppTeamId)
    if (!oppTeam) { setMatchupData(null); return }

    const oppMemberIds = (oppTeam.fantasy_team_members || []).map(m => m.user_id)

    // Track fetch ID to discard stale responses
    const thisId = ++fetchIdRef.current
    setMatchupLoading(true)

    try {
      const oppScores = await fetchLiveTeamScores(oppMemberIds, weekNum)
      if (!oppScores || thisId !== fetchIdRef.current) return

      const categories = CATEGORY_KEYS.map(key => {
        const my = categoryScores[key] || 0
        const opp = oppScores[key] || 0
        return {
          key,
          label: FANTASY_CATEGORIES[key].label,
          icon: FANTASY_CATEGORIES[key].icon,
          color: FANTASY_CATEGORIES[key].color,
          score: my,
          oppScore: opp,
          winning: my > opp,
        }
      })

      const myWins = categories.filter(c => c.winning).length
      const oppWins = categories.filter(c => c.oppScore > c.score).length

      setMatchupData({
        opponentName: oppTeam.name,
        myWins,
        oppWins,
        categories,
      })

      // ─── W/L flip detection ───
      if (prevWinningRef.current) {
        const flippedWin = []
        let lostFlip = false
        for (const cat of categories) {
          const wasWinning = prevWinningRef.current[cat.key]
          if (wasWinning === undefined) continue
          if (!wasWinning && cat.winning) flippedWin.push(cat)
          if (wasWinning && !cat.winning && cat.oppScore > cat.score) lostFlip = true
        }
        if (flippedWin.length > 0) {
          triggerSideCannons()
          hapticSuccess()
          setFlipEvent({
            type: 'win',
            categories: flippedWin.map(c => c.label),
            myWins,
            oppWins,
          })

          // Game day push to opponent team (rate-limited to 1 per 15min)
          const now = Date.now()
          if (now - lastNotifyRef.current > 15 * 60 * 1000) {
            lastNotifyRef.current = now
            ;(async () => {
              try {
                const { data: prefs } = await supabase
                  .from('notification_preferences')
                  .select('user_id, matchup_alerts')
                  .in('user_id', oppMemberIds)
                const enabledIds = (prefs || [])
                  .filter(p => p.matchup_alerts !== false)
                  .map(p => p.user_id)
                for (const uid of enabledIds) {
                  sendNotification(uid, {
                    title: `🏆 ${userTeam.name} just overtook you!`,
                    body: `You're now trailing ${oppWins}-${myWins}. Time to fight back!`,
                    url: '/league/matchup',
                    tag: 'matchup-flip',
                  }).catch(() => {})
                }
              } catch (err) {
                console.warn('Game day notify error:', err)
              }
            })()
          }
        } else if (lostFlip) {
          hapticError()
          setFlipEvent({ type: 'loss' })
        }
      }
      prevWinningRef.current = Object.fromEntries(
        categories.map(c => [c.key, c.winning])
      )
    } catch (err) {
      console.warn('Error fetching opponent scores:', err)
    } finally {
      if (thisId === fetchIdRef.current) setMatchupLoading(false)
    }
  }, [userTeam, league, teams, categoryScores, getCurrentWeek, getWeekMatchups, fetchLiveTeamScores])

  // Fetch on mount and when deps change
  useEffect(() => {
    fetchOpponentData()
  }, [fetchOpponentData])

  // ─── Tab visibility: refetch when returning after 60s+ ───
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        lastHiddenRef.current = Date.now()
      } else if (lastHiddenRef.current && Date.now() - lastHiddenRef.current > 60_000) {
        fetchOpponentData()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [fetchOpponentData])

  // ─── Weekly recap data (last week's result) ───
  const recapData = useMemo(() => {
    if (!userTeam || !league || !getWeekMatchups) return null
    const weekNum = getCurrentWeek?.() || 0
    if (weekNum < 2) return null

    const lastWeekMatchups = getWeekMatchups(weekNum - 1) || []
    const lastMatch = lastWeekMatchups.find(
      m => (m.team_a_id === userTeam.id || m.team_b_id === userTeam.id) && m.calculated_at
    )
    if (!lastMatch) return null

    const isTeamA = lastMatch.team_a_id === userTeam.id
    const oppTeamId = isTeamA ? lastMatch.team_b_id : lastMatch.team_a_id
    const oppName = teams?.find(t => t.id === oppTeamId)?.name || 'Opponent'

    return {
      matchup: lastMatch,
      userTeamId: userTeam.id,
      opponentName: oppName,
      lastWeek: weekNum - 1,
    }
  }, [userTeam, league, teams, getCurrentWeek, getWeekMatchups])

  return {
    categoryScores,
    matchupData,
    matchupLoading,
    refreshMatchup: fetchOpponentData,
    flipEvent,
    clearFlipEvent: () => setFlipEvent(null),
    recapData,
  }
}
