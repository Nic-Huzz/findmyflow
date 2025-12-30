/**
 * ChallengeHeader - Header component for the Challenge page
 *
 * Displays total points, day counter, badges, and settings menu.
 * Updated to show "Week of X" format for weekly planning system.
 */

// Week type display info
const WEEK_TYPES = {
  push: { label: 'Push', icon: '🔥', color: '#ef4444' },
  flow: { label: 'Flow', icon: '🌊', color: '#3b82f6' },
  rest: { label: 'Rest', icon: '🌙', color: '#8b5cf6' },
  launch: { label: 'Launch', icon: '🎯', color: '#f59e0b' }
}

// Days of week for groan display
const DAYS_SHORT = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed',
  thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun'
}

function ChallengeHeader({
  progress,
  userRank,
  userData,
  navigate,
  settingsMenuRef,
  showSettingsMenu,
  setShowSettingsMenu,
  handleOpenExplainer,
  handleRestartChallenge,
  onLeaderboardClick,
  streakDays = 0,
  weekLabel = null,
  weekType = null,
  weeklyPlan = null,
  onEditPlan = null
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

  return (
    <header className="challenge-header">
      <h1>Gamify Your Ambitions</h1>

      {/* Row 1: Non-clickable info - Rank, Points, Streak, Week Type */}
      <div className="challenge-header-top">
        <div className="challenge-header-badges">
          {/* Rank Badge - clickable to show leaderboard */}
          {userRank && (
            <div
              className="rank-badge"
              title={`Ranked #${userRank} on leaderboard`}
              onClick={onLeaderboardClick}
              style={{ cursor: 'pointer' }}
            >
              🏆 #{userRank}
            </div>
          )}
          {/* Points */}
          <div className="challenge-day">
            {progress.total_points || 0} pts
          </div>
          {/* Streak Flame */}
          {streakDays > 0 && (
            <div className="streak-badge" title={`${streakDays} day streak!`}>
              <span className={getFlameClass()}>🔥</span>
              <span className="streak-count">{streakDays}</span>
            </div>
          )}
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

      {/* Row 2: Clickable actions - Voices, Settings, Edit */}
      <div className="challenge-header-top">
        <div className="challenge-header-badges">
          {userData?.essence_archetype && (
            <div
              className="challenge-day archetype-badge"
              title="View your voices"
              onClick={() => navigate('/archetypes')}
              style={{ cursor: 'pointer' }}
            >
              🎭 Voices
            </div>
          )}
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
              </div>
            )}
          </div>
          {/* Edit Plan button */}
          {onEditPlan && (
            <div
              className="challenge-day edit-badge"
              onClick={onEditPlan}
              style={{ cursor: 'pointer' }}
            >
              ✏️ Edit
            </div>
          )}
        </div>
      </div>

      {progress.current_day === 7 && (
        <button className="restart-challenge-btn" onClick={handleRestartChallenge}>
          Start New 7-Day Challenge
        </button>
      )}
    </header>
  )
}

export default ChallengeHeader
