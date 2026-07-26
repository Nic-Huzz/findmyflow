/**
 * useGhostMatchup — Ghost Self League hook
 *
 * Replaces useLeagueData + useMatchupData with a single hook.
 * Computes live scores from in-memory completions (no cron).
 * Fetches ghost from DB. Triggers lazy finalization of previous weeks.
 *
 * Returns the same shape as useMatchupData so ChallengeHeader works with minimal changes.
 */
import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { FANTASY_CATEGORIES, CATEGORY_KEYS } from '../lib/ghost/ghostConfig'
import { buildDailyScores, getScoresThrough, compareCategories, getFinalTotals, applyDecay, getWeekDates } from '../lib/ghost/ghostScoring'
import { getOrCreateCurrentWeek, getPreviousWeekResult, saveGhostScores, getGhostStreak, getContentSubmissions } from '../lib/ghost/ghostService'
import { getWeekStartLocal, formatLocalDate } from '../lib/dateUtils'
import { triggerSideCannons } from '../components/Celebrations'
import { hapticSuccess } from '../lib/haptics'
import { supabase } from '../lib/supabaseClient'

export function useGhostMatchup({ completions, userId }) {
  const [ghostRow, setGhostRow] = useState(null)
  const [streak, setStreak] = useState(null)
  const [contentSubs, setContentSubs] = useState([])
  const [lastWeekContentSubs, setLastWeekContentSubs] = useState([])
  const [lastWeekRow, setLastWeekRow] = useState(null)
  const [loading, setLoading] = useState(true)
  const [flipEvent, setFlipEvent] = useState(null)
  const initRef = useRef(false)
  const lastUserIdRef = useRef(null)

  // Reset init when userId changes (e.g. login swap)
  if (userId !== lastUserIdRef.current) {
    lastUserIdRef.current = userId
    initRef.current = false
  }

  const weekStart = getWeekStartLocal()
  const lastWeekStart = getWeekStartLocal(new Date(), -1)
  const today = formatLocalDate(new Date())

  // ─── Initialize: fetch/create ghost row, streak, content subs ───
  const initialize = useCallback(async () => {
    if (!userId || initRef.current) return
    initRef.current = true
    setLoading(true)

    try {
      // Parallel fetches
      const [row, streakData, currentContent, lastWeekContent] = await Promise.all([
        getOrCreateCurrentWeek(userId, weekStart),
        getGhostStreak(userId),
        getContentSubmissions(userId, weekStart),
        getContentSubmissions(userId, lastWeekStart),
      ])

      setStreak(streakData)
      setContentSubs(currentContent)
      setLastWeekContentSubs(lastWeekContent)

      if (!row) { setLoading(false); return }

      // Check if previous week needs finalization
      const prevResult = await getPreviousWeekResult(userId, weekStart)
      if (prevResult && prevResult.result !== 'pending') {
        setLastWeekRow(prevResult)
      }
      if (prevResult && prevResult.result === 'pending') {
        // Finalize previous week via edge function
        try {
          const { data: finalizeResult } = await supabase.functions.invoke('finalize-ghost-week', {
            body: { userId, weekStart: lastWeekStart, utcOffsetMinutes: new Date().getTimezoneOffset() },
          })

          // Refresh streak + finalized previous week row
          const [updatedStreak, finalizedPrev] = await Promise.all([
            getGhostStreak(userId),
            getPreviousWeekResult(userId, weekStart),
          ])
          setStreak(updatedStreak)
          if (finalizedPrev) setLastWeekRow(finalizedPrev)

          // Refresh ghost row (may have been updated with ghost scores by finalization)
          const refreshedRow = await getOrCreateCurrentWeek(userId, weekStart)
          setGhostRow(refreshedRow)
          setLoading(false)
          return
        } catch (err) {
          console.warn('Ghost: finalization failed:', err)
        }
      }

      // If ghost is empty (new week, not yet populated), compute from completions
      // Wait for completions to load before populating — if empty, defer to next init cycle
      if (row.ghost_daily_scores && Object.keys(row.ghost_daily_scores).length === 0) {
        if (!completions || completions.length === 0) {
          // Completions not loaded yet — allow re-init on next render when they arrive
          initRef.current = false
          setGhostRow(row)
          setLoading(false)
          return
        }

        // Build ghost from last week's completions (in memory)
        const lastWeekScores = buildDailyScores(
          completions,
          lastWeekStart,
          lastWeekContent,
        )

        // Apply decay if consecutive losses
        const consecutiveLosses = streakData?.consecutive_losses || 0
        const decayedGhost = applyDecay(lastWeekScores, consecutiveLosses)

        // Translate date keys from last week to this week
        // (ghost keys must match the week they'll be compared against)
        const lastDates = Object.keys(decayedGhost).sort()
        const thisDates = getWeekDates(weekStart)
        const translatedGhost = {}
        lastDates.forEach((oldDate, i) => {
          if (thisDates[i]) translatedGhost[thisDates[i]] = decayedGhost[oldDate]
        })

        // Save to DB
        await saveGhostScores(row.id, translatedGhost)
        setGhostRow({ ...row, ghost_daily_scores: translatedGhost })
        setLoading(false)
        return
      }

      setGhostRow(row)
    } catch (err) {
      console.warn('Ghost: init error:', err)
    } finally {
      setLoading(false)
    }
  }, [userId, weekStart, lastWeekStart, completions])

  useEffect(() => {
    initialize()
  }, [initialize])

  // ─── Live scores: compute from in-memory completions ───
  const currentDailyScores = useMemo(() => {
    if (!completions?.length) return {}
    return buildDailyScores(completions, weekStart, contentSubs)
  }, [completions, weekStart, contentSubs])

  const currentTotals = useMemo(() => {
    return getScoresThrough(currentDailyScores, today)
  }, [currentDailyScores, today])

  const ghostTotals = useMemo(() => {
    if (!ghostRow?.ghost_daily_scores) return { tune: 0, courage: 0, community: 0 }
    return getScoresThrough(ghostRow.ghost_daily_scores, today)
  }, [ghostRow, today])

  // ─── Category comparison ───
  const comparison = useMemo(() => {
    return compareCategories(currentTotals, ghostTotals)
  }, [currentTotals, ghostTotals])

  // ─── Category scores (for ChallengeHeader compat) ───
  const categoryScores = useMemo(() => ({
    tune: currentTotals.tune || 0,
    courage: currentTotals.courage || 0,
    reach: currentTotals.community || 0,  // ChallengeHeader uses 'reach' key
  }), [currentTotals])

  // ─── Matchup data (for ChallengeHeader compat) ───
  const matchupData = useMemo(() => {
    if (!ghostRow || loading) return null

    const categories = comparison.categories.map(cat => ({
      key: cat.key === 'community' ? 'reach' : cat.key,
      label: cat.key === 'community' ? 'Community' : FANTASY_CATEGORIES[cat.key]?.label || cat.key,
      icon: cat.key === 'community' ? FANTASY_CATEGORIES.reach?.icon : FANTASY_CATEGORIES[cat.key]?.icon,
      color: cat.key === 'community' ? FANTASY_CATEGORIES.reach?.color : FANTASY_CATEGORIES[cat.key]?.color,
      score: cat.current,
      oppScore: cat.ghost,
      winning: cat.winner === 'user',
    }))

    // Total point delta for header display
    const totalCurrent = currentTotals.tune + currentTotals.courage + currentTotals.community
    const totalGhost = ghostTotals.tune + ghostTotals.courage + ghostTotals.community
    const delta = totalCurrent - totalGhost

    return {
      opponentName: 'Ghost',
      myWins: comparison.userWins,
      oppWins: comparison.ghostWins,
      categories,
      delta,  // positive = ahead, negative = behind
    }
  }, [ghostRow, loading, comparison, currentTotals, ghostTotals])

  // ─── W/L flip detection (side cannons when overtaking ghost) ───
  // Only fires when a category flips from losing→winning mid-session.
  // Uses sessionStorage so navigating away and back doesn't re-trigger.
  // Waits for completions to load before recording baseline (prevents
  // false flip from 0-0 tied → real scores on initial load).
  const hasCompletionsLoaded = completions && completions.length > 0
  useEffect(() => {
    if (!matchupData || !hasCompletionsLoaded) return

    const currentWinning = Object.fromEntries(
      matchupData.categories.map(c => [c.key, c.winning])
    )
    const currentKey = JSON.stringify(currentWinning)

    // Load previous state from sessionStorage (survives page navigation)
    const storedPrev = sessionStorage.getItem('ghost_prev_winning')

    if (!storedPrev) {
      // First load this session — record baseline, no flip
      sessionStorage.setItem('ghost_prev_winning', currentKey)
      return
    }

    // Same state as last time — no change, no flip
    if (storedPrev === currentKey) return

    // Compare against previous state
    const prevWinning = JSON.parse(storedPrev)
    const flippedWin = []
    for (const cat of matchupData.categories) {
      const wasWinning = prevWinning[cat.key]
      if (wasWinning === false && cat.winning) flippedWin.push(cat)
    }

    if (flippedWin.length > 0) {
      triggerSideCannons()
      hapticSuccess()
      setFlipEvent({
        type: 'win',
        categories: flippedWin.map(c => c.label),
        myWins: matchupData.myWins,
        oppWins: matchupData.oppWins,
      })
    }

    // Update stored state
    sessionStorage.setItem('ghost_prev_winning', currentKey)
  }, [matchupData, hasCompletionsLoaded])

  // ─── Recap data (last week's result for GhostRecapCard) ───
  const recapData = useMemo(() => {
    if (!ghostRow) return null
    if (!streak || !streak.last_result || !streak.last_result_at) return null
    const lastResultDate = typeof streak.last_result_at === 'string'
      ? streak.last_result_at.slice(0, 10)
      : streak.last_result_at
    if (lastResultDate !== lastWeekStart) return null

    return {
      result: streak.last_result,
      weekStart: lastWeekStart,
      categoriesWon: lastWeekRow?.categories_won || 0,
      categoriesLost: lastWeekRow?.categories_lost || 0,
      currentTune: lastWeekRow?.current_tune || 0,
      currentCourage: lastWeekRow?.current_courage || 0,
      currentCommunity: lastWeekRow?.current_community || 0,
      ghostTune: lastWeekRow?.ghost_tune || 0,
      ghostCourage: lastWeekRow?.ghost_courage || 0,
      ghostCommunity: lastWeekRow?.ghost_community || 0,
      streak: streak.current_streak,
      isFirstWeek: !lastWeekRow, // no previous finalized row = first ever week
    }
  }, [ghostRow, streak, lastWeekStart, lastWeekRow])

  return {
    // ChallengeHeader compat
    categoryScores,
    matchupData,
    matchupLoading: loading,
    flipEvent,
    clearFlipEvent: () => setFlipEvent(null),
    recapData,

    // Ghost-specific
    ghostRow,
    streak,
    currentDailyScores,
    comparison,
    currentTotals,
    ghostTotals,
  }
}
