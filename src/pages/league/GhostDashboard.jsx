/**
 * GhostDashboard.jsx — /league
 * Ghost Self League dashboard: hero card, day timeline, category bars,
 * day-by-day table, streak/PBs, history.
 *
 * Self-contained — fetches its own completions (lightweight query)
 * instead of depending on Challenge.jsx's completions prop.
 */
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { supabase } from '../../lib/supabaseClient'
import { buildDailyScores, getScoresThrough, compareCategories, applyDecay, getWeekDates } from '../../lib/ghost/ghostScoring'
import { getOrCreateCurrentWeek, getGhostStreak, getWeekHistory, getContentSubmissions, saveGhostScores } from '../../lib/ghost/ghostService'
import { DAY_LABELS } from '../../lib/ghost/ghostConfig'
import { getWeekStartLocal, formatLocalDate } from '../../lib/dateUtils'
import { hapticLight } from '../../lib/haptics'
import './GhostDashboard.css'

export default function GhostDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const userId = user?.id

  const [loading, setLoading] = useState(true)
  const [completions, setCompletions] = useState([])
  const [ghostRow, setGhostRow] = useState(null)
  const [streak, setStreak] = useState(null)
  const [contentSubs, setContentSubs] = useState([])
  const [history, setHistory] = useState([])
  const [showDayTable, setShowDayTable] = useState(false)

  const weekStart = getWeekStartLocal()
  const lastWeekStart = getWeekStartLocal(new Date(), -1)
  const today = formatLocalDate(new Date())
  const weekDates = getWeekDates(weekStart)

  useEffect(() => {
    if (!userId) return
    let active = true

    async function load() {
      setLoading(true)

      // Fetch 2 weeks of completions (current week for live scores, last week for ghost population)
      const [compRes, row, streakData, content, historyData] = await Promise.all([
        supabase.from('quest_completions')
          .select('quest_category, points_earned, completed_at')
          .eq('user_id', userId)
          .gte('completed_at', lastWeekStart + 'T00:00:00'),
        getOrCreateCurrentWeek(userId, weekStart),
        getGhostStreak(userId),
        getContentSubmissions(userId, weekStart),
        getWeekHistory(userId, 8),
      ])

      if (!active) return

      setCompletions(compRes.data || [])
      setStreak(streakData)
      setContentSubs(content)
      setHistory(historyData)

      // Populate ghost if empty (same logic as useGhostMatchup)
      if (row && row.ghost_daily_scores && Object.keys(row.ghost_daily_scores).length === 0) {
        const lastWeekContent = await getContentSubmissions(userId, lastWeekStart)
        const lastWeekScores = buildDailyScores(compRes.data || [], lastWeekStart, lastWeekContent)
        const consecutiveLosses = streakData?.consecutive_losses || 0
        const decayedGhost = applyDecay(lastWeekScores, consecutiveLosses)

        // Translate date keys to current week
        const lastDates = Object.keys(decayedGhost).sort()
        const thisDates = getWeekDates(weekStart)
        const translated = {}
        lastDates.forEach((d, i) => { if (thisDates[i]) translated[thisDates[i]] = decayedGhost[d] })

        // Save (non-blocking, with error logging)
        saveGhostScores(row.id, translated)

        row.ghost_daily_scores = translated
      }

      setGhostRow(row)
      setLoading(false)
    }

    load()
    return () => { active = false }
  }, [userId, weekStart, lastWeekStart])

  // Live scores from completions
  const currentDaily = useMemo(() => {
    if (!completions.length) return {}
    return buildDailyScores(completions, weekStart, contentSubs)
  }, [completions, weekStart, contentSubs])

  const currentTotals = useMemo(() => getScoresThrough(currentDaily, today), [currentDaily, today])
  const ghostTotals = useMemo(() => {
    if (!ghostRow?.ghost_daily_scores) return { tune: 0, courage: 0, community: 0 }
    return getScoresThrough(ghostRow.ghost_daily_scores, today)
  }, [ghostRow, today])

  const comparison = useMemo(() => compareCategories(currentTotals, ghostTotals), [currentTotals, ghostTotals])

  if (loading) {
    return (
      <div className="ghost-dash">
        <div className="ghost-dash-toolbar">
          <button className="ghost-dash-back" onClick={() => navigate('/7-day-challenge')}>←</button>
          <h2 className="ghost-dash-toolbar-title">Ghost Mode</h2>
        </div>
        <div className="ghost-dash-loading">
          <div className="ghost-dash-spinner" />
          <span>Loading...</span>
        </div>
      </div>
    )
  }

  const resultLabel = comparison.userWins > comparison.ghostWins ? 'Ahead of your ghost'
    : comparison.ghostWins > comparison.userWins ? 'Ghost is ahead'
    : 'All tied up'
  const resultColor = comparison.userWins > comparison.ghostWins ? '#6ee7b7'
    : comparison.ghostWins > comparison.userWins ? '#fca5a5'
    : '#E9A23B'

  const categories = [
    { key: 'tune', label: 'Tune', icon: '☀️', color: '#f9a8d4', current: currentTotals.tune, ghost: ghostTotals.tune },
    { key: 'courage', label: 'Courage', icon: '🔥', color: '#E9A23B', current: currentTotals.courage, ghost: ghostTotals.courage },
    { key: 'community', label: 'Community', icon: '📣', color: '#67e8f9', current: currentTotals.community, ghost: ghostTotals.community },
  ]

  return (
    <div className="ghost-dash">
      {/* Toolbar */}
      <div className="ghost-dash-toolbar">
        <button className="ghost-dash-back" onClick={() => navigate('/7-day-challenge')}>←</button>
        <h2 className="ghost-dash-toolbar-title">Ghost Mode</h2>
        <button className="ghost-dash-help" onClick={() => navigate('/league/guide')}>?</button>
      </div>

      {/* Hero Card */}
      <div className="ghost-dash-hero">
        <div className="ghost-dash-hero-vs">
          <div className="ghost-dash-hero-side">
            <span className="ghost-dash-hero-label">This week</span>
            <span className="ghost-dash-hero-score" style={{ color: '#ffffff' }}>{comparison.userWins}</span>
          </div>
          <span className="ghost-dash-hero-divider">:</span>
          <div className="ghost-dash-hero-side">
            <span className="ghost-dash-hero-label">Last week</span>
            <span className="ghost-dash-hero-score" style={{ color: 'rgba(255,255,255,0.4)' }}>{comparison.ghostWins}</span>
          </div>
        </div>
        <div className="ghost-dash-hero-status" style={{ color: resultColor }}>
          {resultLabel}
        </div>
      </div>

      {/* Category Bars */}
      <div className="ghost-dash-cats">
        {categories.map(cat => {
          const maxVal = Math.max(cat.current, cat.ghost, 1)
          const userPct = Math.round((cat.current / maxVal) * 100)
          const ghostPct = Math.round((cat.ghost / maxVal) * 100)
          const winning = cat.current > cat.ghost

          return (
            <div key={cat.key} className="ghost-dash-cat">
              <div className="ghost-dash-cat-header">
                <span>{cat.icon} {cat.label}</span>
                <span className={`ghost-dash-cat-result ${winning ? 'win' : cat.ghost > cat.current ? 'loss' : 'tie'}`}>
                  {cat.current} {winning ? '↑' : cat.ghost > cat.current ? '' : '·'} {cat.ghost}
                </span>
              </div>
              <div className="ghost-dash-cat-bars">
                <div className="ghost-dash-cat-bar you" style={{ width: `${userPct}%` }} />
                <div className="ghost-dash-cat-bar ghost" style={{ width: `${ghostPct}%` }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Day Timeline — shows how many categories you're winning (0-3) */}
      <div className="ghost-dash-timeline">
        <div className="ghost-dash-days">
          {weekDates.map((date, i) => {
            const isFuture = date > today
            const isToday = date === today
            const currentDay = currentDaily[date] || { tune: 0, courage: 0, community: 0 }
            const ghostDay = ghostRow?.ghost_daily_scores?.[date] || { tune: 0, courage: 0, community: 0 }
            const dayComparison = compareCategories(currentDay, ghostDay)
            const wins = dayComparison.userWins

            return (
              <div key={date} className={`ghost-dash-day ${isToday ? 'today' : ''} ${isFuture ? 'future' : ''}`}>
                <span className="ghost-dash-day-label">{DAY_LABELS[i]}</span>
                <div className={`ghost-dash-day-dot wins-${isFuture ? 'future' : wins} ${isFuture ? 'locked' : ''}`}>
                  {isFuture ? '·' : <><span className="ghost-dash-day-wins">{wins}</span><span className="ghost-dash-day-of">/3</span></>}
                </div>
              </div>
            )
          })}
        </div>
        <button
          className="ghost-dash-toggle"
          onClick={() => { hapticLight(); setShowDayTable(!showDayTable) }}
        >
          {showDayTable ? 'Hide' : 'Show'} day-by-day breakdown {showDayTable ? '▲' : '▼'}
        </button>

        {showDayTable && (
          <div className="ghost-dash-table">
            <div className="ghost-dash-table-header">
              <span>Day</span>
              <span>☀️ Tune</span>
              <span>🔥 Courage</span>
              <span>📣 Community</span>
            </div>
            {weekDates.map((date, i) => {
              const isFuture = date > today
              const cur = currentDaily[date] || { tune: 0, courage: 0, community: 0 }
              const gh = ghostRow?.ghost_daily_scores?.[date] || { tune: 0, courage: 0, community: 0 }

              return (
                <div key={date} className={`ghost-dash-table-row ${isFuture ? 'future' : ''} ${date === today ? 'today' : ''}`}>
                  <span className="ghost-dash-table-day">{DAY_LABELS[i]}</span>
                  <span className={!isFuture && cur.tune > gh.tune ? 'ahead' : !isFuture && gh.tune > cur.tune ? 'behind' : ''}>
                    {isFuture ? '·' : `${cur.tune} : ${gh.tune}`}
                  </span>
                  <span className={!isFuture && cur.courage > gh.courage ? 'ahead' : !isFuture && gh.courage > cur.courage ? 'behind' : ''}>
                    {isFuture ? '·' : `${cur.courage} : ${gh.courage}`}
                  </span>
                  <span className={!isFuture && cur.community > gh.community ? 'ahead' : !isFuture && gh.community > cur.community ? 'behind' : ''}>
                    {isFuture ? '·' : `${cur.community} : ${gh.community}`}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Streak + PBs */}
      {streak && (
        <div className="ghost-dash-stats">
          {(streak.current_streak === 0 && streak.longest_streak === 0 && streak.total_wins === 0) ? (
            <div className="ghost-dash-stat ghost-dash-stat-empty">
              <span className="ghost-dash-stat-value">🌱</span>
              <span className="ghost-dash-stat-label">Finish this week to start your record</span>
            </div>
          ) : (
            <>
              <div className="ghost-dash-stat">
                <span className="ghost-dash-stat-value">{streak.current_streak}</span>
                <span className="ghost-dash-stat-label">Current Streak</span>
              </div>
              <div className="ghost-dash-stat">
                <span className="ghost-dash-stat-value">{streak.longest_streak}</span>
                <span className="ghost-dash-stat-label">Best Streak</span>
              </div>
              <div className="ghost-dash-stat">
                <span className="ghost-dash-stat-value">{streak.total_wins}-{streak.total_losses}-{streak.total_draws}</span>
                <span className="ghost-dash-stat-label">W-L-D</span>
              </div>
            </>
          )}
        </div>
      )}

      {streak && (streak.pb_tune > 0 || streak.pb_courage > 0 || streak.pb_community > 0) && (
        <div className="ghost-dash-pbs">
          <h3 className="ghost-dash-section-title">Personal Bests</h3>
          <div className="ghost-dash-pb-row">
            {streak.pb_tune > 0 && <span className="ghost-dash-pb">☀️ {streak.pb_tune}</span>}
            {streak.pb_courage > 0 && <span className="ghost-dash-pb">🔥 {streak.pb_courage}</span>}
            {streak.pb_community > 0 && <span className="ghost-dash-pb">📣 {streak.pb_community}</span>}
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="ghost-dash-history">
          <h3 className="ghost-dash-section-title">Past Weeks</h3>
          {history.map(week => {
            const emoji = week.result === 'win' ? '✅' : week.result === 'loss' ? '❌' : '🤝'
            return (
              <div key={week.id} className="ghost-dash-history-row">
                <span className="ghost-dash-history-date">{week.week_start}</span>
                <span>{emoji} {week.categories_won}-{week.categories_lost}</span>
                <span className="ghost-dash-history-score">
                  {week.current_tune + week.current_courage + week.current_community} pts
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
