/**
 * ChallengeHeader - Header component for the Challenge page
 *
 * Displays total points, day counter, badges, and settings menu.
 */

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
  streakDays = 0
}) {
  // Flame size based on streak length
  const getFlameClass = () => {
    if (streakDays >= 7) return 'streak-flame legendary'
    if (streakDays >= 5) return 'streak-flame hot'
    if (streakDays >= 3) return 'streak-flame warm'
    if (streakDays >= 1) return 'streak-flame'
    return 'streak-flame cold'
  }

  return (
    <header className="challenge-header">
      <h1>Gamify Your Ambitions</h1>

      <div className="challenge-header-top">
        <div className="challenge-header-badges">
          <button
            className="home-btn"
            title="Go to Home"
            onClick={() => navigate('/me')}
          >
            🏠
          </button>
          {/* Streak Flame */}
          {streakDays > 0 && (
            <div className="streak-badge" title={`${streakDays} day streak!`}>
              <span className={getFlameClass()}>🔥</span>
              <span className="streak-count">{streakDays}</span>
            </div>
          )}
          <div className="challenge-day">
            Day {progress.current_day}/7 {progress.current_day === 7 && '🎉'}
          </div>
          {userData?.essence_archetype && (
            <div
              className="challenge-day archetype-badge"
              title="View your archetypes"
              onClick={() => navigate('/archetypes')}
              style={{ cursor: 'pointer' }}
            >
              Archetypes
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
