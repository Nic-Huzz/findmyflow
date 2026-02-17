/**
 * ChallengeHeader - Header component for the Challenge page
 *
 * Shows fantasy category scores as mini progress bars with green/red W/L
 * coloring when in an active matchup, or category colors when solo.
 * Team matchup banner replaces old rank display.
 */
import { FANTASY_CATEGORIES, CATEGORY_KEYS } from '../lib/league/leagueConfig'
import { useScoreAnimation } from '../hooks/useScoreAnimation'

// Week type display info
const WEEK_TYPES = {
  push: { label: 'Push', icon: '🔥', color: '#ef4444' },
  flow: { label: 'Flow', icon: '🌊', color: '#3b82f6' },
  rest: { label: 'Rest', icon: '🌙', color: '#8b5cf6' },
  launch: { label: 'Launch', icon: '🎯', color: '#f59e0b' }
}

// Lighter variants for category score text in solo mode
const CATEGORY_TEXT_COLORS = {
  business_efficiency: '#a78bfa',
  play_list: '#E9A23B',
  healing: '#34d399',
  voice: '#c4b5fd',
  bonus: '#93c5fd',
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
}) {
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

  // Build bar data from either matchup (green/red) or solo (category colors)
  const bars = CATEGORY_KEYS.map(key => {
    const cat = FANTASY_CATEGORIES[key]
    const matchCat = matchupData?.categories?.find(c => c.key === key)

    if (matchCat) {
      // Matchup mode: bar width = myScore / (myScore + oppScore)
      const total = matchCat.score + matchCat.oppScore
      const pct = total > 0 ? Math.round((matchCat.score / total) * 100) : 50
      const tied = matchCat.score === matchCat.oppScore
      const displayScore = animatedCategoryScores?.[key] ?? matchCat.score
      return {
        key,
        icon: cat.icon,
        score: displayScore,       // animated for display
        pct,                       // raw for bar width (CSS transitions handle the slide)
        colorClass: tied ? '' : matchCat.winning ? 'win' : 'lose',
        colorStyle: tied ? cat.color : null,
        textColor: tied ? CATEGORY_TEXT_COLORS[key] : null,
      }
    }

    // Solo mode: bar width = score / max(scores)
    const score = categoryScores?.[key] || 0
    const displayScore = animatedCategoryScores?.[key] || 0
    const maxScore = categoryScores
      ? Math.max(...Object.values(categoryScores), 1)
      : 1
    return {
      key,
      icon: cat.icon,
      score: displayScore,       // animated for display
      pct: Math.round((score / maxScore) * 100),  // raw for bar width
      colorClass: `cat-${key}`,
      colorStyle: null,
      textColor: CATEGORY_TEXT_COLORS[key],
    }
  })

  return (
    <header className="challenge-header">
      <h1>Gamify Your Ambitions</h1>

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

      {/* Total points */}
      <div className="challenge-total-row">
        <span className="challenge-total-value">{animatedWeeklyPoints.pts ?? weeklyPoints}</span>
        <span className="challenge-total-label">
          {matchupData ? 'total pts' : 'weekly pts'}
        </span>
      </div>

      {/* Category bars grid */}
      <div className={`challenge-bars-grid${matchupLoading ? ' loading' : ''}`}>
        {bars.map(bar => (
          <div key={bar.key} className="challenge-bar-item">
            <span className="challenge-bar-icon">{bar.icon}</span>
            <div className="challenge-bar-track">
              <div
                className={`challenge-bar-fill ${bar.colorClass}`}
                style={{
                  width: `${bar.pct}%`,
                  ...(bar.colorStyle ? { background: bar.colorStyle } : {}),
                }}
              />
            </div>
            <span
              className={`challenge-bar-value ${bar.colorClass}`}
              style={bar.textColor ? { color: bar.textColor } : undefined}
            >
              {bar.score}
            </span>
          </div>
        ))}
      </div>

      {/* Bottom row: Streak + actions */}
      <div className="challenge-header-top">
        <div className="challenge-header-badges">
          <div className="streak-badge">
            <span className={`hero-streak-flame ${getFlameClass()}`}>🔥</span>
            <span className="streak-badge-num">{streakDays}</span>
          </div>
          <div
            className="challenge-day archetype-badge"
            title="View leaderboard"
            onClick={onLeaderboardClick}
            style={{ cursor: 'pointer' }}
          >
            🏆 Leaderboard
          </div>
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

    </header>
  )
}

export default ChallengeHeader
