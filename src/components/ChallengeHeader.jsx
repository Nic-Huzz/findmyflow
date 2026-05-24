/**
 * ChallengeHeader - Header component for the Challenge page
 *
 * Shows fantasy category scores as mini progress bars with green/red W/L
 * coloring when in an active matchup, or category colors when solo.
 * Team matchup banner replaces old rank display.
 */
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import { getLevelProgress, getLevelMaxXP, getLevelNumber, LEVELS, getLevel } from '../lib/crm/statsService'
import { FANTASY_CATEGORIES } from '../lib/league/leagueConfig'
import { useScoreAnimation } from '../hooks/useScoreAnimation'
import JourneyGraphPopup from './JourneyGraphPopup'
import { calculateLeagueStandings } from '../lib/league/leagueScoring'

// Week type display info
const WEEK_TYPES = {
  push: { label: 'Push', icon: '🔥', color: '#ef4444' },
  flow: { label: 'Flow', icon: '🌊', color: '#3b82f6' },
  rest: { label: 'Rest', icon: '🌙', color: '#8b5cf6' },
  launch: { label: 'Launch', icon: '🎯', color: '#f59e0b' }
}

// Lighter variants for category score text in solo mode
const CATEGORY_TEXT_COLORS = {
  tune: '#10b981',
  play_list: '#E9A23B',
  healing: '#34d399',
}

function ChallengeHeader({
  navigate,
  settingsMenuRef,
  showSettingsMenu,
  setShowSettingsMenu,
  handleOpenExplainer,
  onLeaderboardClick,
  streakDays = 0,
  weekType = null,
  weeklyPoints = 0,
  matchupData = null,
  categoryScores = null,
  matchupLoading = false,
  totalXP = 0,
  currentJourneyLevel = 0,
  wahooCount = 0,
}) {
  const { user } = useAuth()
  const [showGraph, setShowGraph] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [fetchedXP, setFetchedXP] = useState(null)
  const prevXPRef = useRef(0)

  // Primary: use prop from parent. Fallback: use self-fetched value.
  const lifetimeXP = totalXP > 0 ? totalXP : (fetchedXP || 0)

  // Backup fetch — runs once on mount to guarantee RP shows even if parent is slow
  useEffect(() => {
    if (!user?.id) return
    supabase
      .from('user_lifetime_scores')
      .select('lifetime_total_score')
      .eq('user_id', user.id)
      .is('project_id', null)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!error && data?.lifetime_total_score != null) {
          setFetchedXP(data.lifetime_total_score)
        }
      })
  }, [user?.id])

  // Sync XP ref from prop (level-up celebration handled by LevelUpModal in parent)
  useEffect(() => {
    const best = totalXP > 0 ? totalXP : (fetchedXP || 0)
    prevXPRef.current = best
  }, [totalXP, fetchedXP])

  // Flame size based on streak length
  const getFlameClass = () => {
    if (streakDays >= 7) return 'streak-flame legendary'
    if (streakDays >= 5) return 'streak-flame hot'
    if (streakDays >= 3) return 'streak-flame warm'
    if (streakDays >= 1) return 'streak-flame'
    return 'streak-flame cold'
  }

  const weekTypeInfo = weekType ? WEEK_TYPES[weekType] : null

  // Animated numbers — displayed values count up/down, bar widths snap via CSS transition
  const animatedCategoryScores = useScoreAnimation(categoryScores)
  const animatedWeeklyPoints = useScoreAnimation({ pts: weeklyPoints })

  // Display: Tune, Play-list (Wahoos), Healing
  const DISPLAY_KEYS = ['tune', 'play_list', 'healing']

  // Build score data for display
  const bars = DISPLAY_KEYS.map(key => {
    const cat = FANTASY_CATEGORIES[key]
    const matchCat = matchupData?.categories?.find(c => c.key === key)
    const displayScore = matchCat
      ? (animatedCategoryScores?.[key] ?? matchCat.score)
      : (animatedCategoryScores?.[key] || 0)

    return {
      key,
      label: cat.label,
      icon: cat.icon,
      score: displayScore,
      textColor: CATEGORY_TEXT_COLORS[key],
    }
  })

  return (
    <header className="challenge-header">
      {/* Team matchup banner — taps to matchup details page */}
      {matchupData && (
        <div
          className="challenge-matchup-banner"
          onClick={() => navigate('/league/matchup')}
          style={{ cursor: 'pointer' }}
        >
          <span className="challenge-matchup-team-name">Your Team</span>
          <span className="challenge-matchup-pill">
            <span className={matchupData.myWins > matchupData.oppWins ? 'winning' : matchupData.myWins < matchupData.oppWins ? 'losing' : ''}>
              {matchupData.myWins}
            </span>
            -
            <span className={matchupData.oppWins > matchupData.myWins ? 'winning' : matchupData.oppWins < matchupData.myWins ? 'losing' : ''}>
              {matchupData.oppWins}
            </span>
          </span>
          <span className="challenge-matchup-vs">vs</span>
          <span>{matchupData.opponentName}</span>
        </div>
      )}

      <h1 className="challenge-app-title">Find My Flow</h1>

      {/* Score block: total left, category pills right */}
      <div className={`challenge-score-block${matchupLoading ? ' loading' : ''}`}>
        <div className="challenge-total">
          <span className="challenge-total-value">{animatedWeeklyPoints.pts ?? weeklyPoints}</span>
          <span className="challenge-total-label">
            {matchupData ? 'total pts' : 'weekly pts'}
          </span>
        </div>
        <div className="challenge-divider" />
        <div className="challenge-category-pills">
          {bars.map(bar => (
            <div key={bar.key} className="challenge-pill" style={bar.textColor ? { color: bar.textColor } : undefined}>
              <span className="challenge-pill-icon">{bar.icon}</span>
              <span className="challenge-pill-score">{bar.score}</span>
              <span className="challenge-pill-label">{bar.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Vibe Rank Bar */}
      {(() => {
        const vibeLevel = getLevel(lifetimeXP)
        const vibeProgress = getLevelProgress(lifetimeXP)
        const vibeMax = getLevelMaxXP(lifetimeXP)
        const isMax = getLevelNumber(lifetimeXP) === LEVELS.length
        return (
          <div className="challenge-level-bar">
            <div className="challenge-level-row">
              <span className="challenge-level-name">{vibeLevel.emoji} {vibeLevel.name}</span>
              <span className="challenge-level-xp">{isMax ? `${lifetimeXP} RP ✦` : `${lifetimeXP} / ${vibeMax} RP`}</span>
            </div>
            <div className="challenge-level-track">
              <div className="challenge-level-fill" style={{ width: `${vibeProgress}%` }} />
            </div>
          </div>
        )
      })()}

      {/* Bottom row: Streak + actions */}
      <div className="challenge-header-top">
        <div className="challenge-header-badges">
          <div className="streak-badge">
            <span className={`hero-streak-flame ${getFlameClass()}`}>🔥</span>
            <span className="streak-badge-num">{streakDays}</span>
          </div>
          <button
            className="challenge-journey-btn"
            onClick={() => setShowLeaderboard(true)}
          >
            🏆 Leaderboard
          </button>
          <div className="settings-menu-container" ref={settingsMenuRef}>
            <button
              className="challenge-day settings-badge"
              title="Settings"
              onClick={() => setShowSettingsMenu(!showSettingsMenu)}
            >
              ⚙️
            </button>
            {showSettingsMenu && (
              <div className="settings-dropdown">
                <button
                  className="settings-menu-item"
                  onClick={() => {
                    navigate('/me')
                    setShowSettingsMenu(false)
                  }}
                >
                  🏠 Home
                </button>
                <button
                  className="settings-menu-item"
                  onClick={() => {
                    handleOpenExplainer()
                    setShowSettingsMenu(false)
                  }}
                >
                  📖 Explainer
                </button>
                <button
                  className="settings-menu-item"
                  onClick={() => {
                    navigate('/settings/notifications')
                    setShowSettingsMenu(false)
                  }}
                >
                  🔔 Notifications
                </button>
                <button
                  className="settings-menu-item"
                  onClick={() => {
                    navigate('/league')
                    setShowSettingsMenu(false)
                  }}
                >
                  🏆 Fantasy League
                </button>
              </div>
            )}
          </div>
          {/* Week Type Badge */}
          {weekTypeInfo && (
            <div
              className="challenge-day week-type-bubble"
              style={{ backgroundColor: weekTypeInfo.color, color: 'white' }}
            >
              {weekTypeInfo.icon} {weekTypeInfo.label.toUpperCase()}
            </div>
          )}
        </div>
      </div>

      <JourneyGraphPopup
        isOpen={showGraph}
        onClose={() => setShowGraph(false)}
        currentLevel={1}
      />

      {showLeaderboard && (
        <FestLeaderboard
          userId={user?.id}
          onClose={() => setShowLeaderboard(false)}
        />
      )}
    </header>
  )
}

export default ChallengeHeader
