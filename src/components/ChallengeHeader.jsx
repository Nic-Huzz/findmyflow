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
  onLeaderboardClick
}) {
  return (
    <header className="challenge-header">
      <h1>Gamify Your Ambitions</h1>

      <div className="challenge-points">
        <div className="total-points clickable" onClick={onLeaderboardClick}>
          <span className="points-label">Total Points</span>
          <span className="points-value">{progress.total_points || 0}</span>
          {userRank && (
            <>
              <span className="points-separator">•</span>
              <span className="points-label">Your Rank</span>
              <span className="points-value">#{userRank}</span>
            </>
          )}
        </div>
      </div>

      <div className="challenge-header-top">
        <div className="challenge-header-badges">
          <div className="challenge-day">
            Day {progress.current_day}/7
            {progress.current_day === 7 && (
              <span className="challenge-complete-badge">
                <span className="complete-text">Complete!</span>
              </span>
            )}
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
