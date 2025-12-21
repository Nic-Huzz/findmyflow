/**
 * ChallengeLeaderboard - Leaderboard component for the Challenge page
 *
 * Displays weekly/all-time leaderboard with group code sharing.
 */

function ChallengeLeaderboard({
  leaderboard,
  leaderboardView,
  setLeaderboardView,
  groupCode,
  currentDay
}) {
  return (
    <div className="leaderboard-section">
      <div className="leaderboard-header">
        <h2 className="section-title">Leaderboard</h2>
        <div className="leaderboard-toggle">
          <button
            className={`toggle-btn ${leaderboardView === 'weekly' ? 'active' : ''}`}
            onClick={() => setLeaderboardView('weekly')}
          >
            This Week
          </button>
          <button
            className={`toggle-btn ${leaderboardView === 'alltime' ? 'active' : ''}`}
            onClick={() => setLeaderboardView('alltime')}
          >
            All Time
          </button>
        </div>
      </div>

      {groupCode && currentDay === 0 && (
        <div className="group-code-display">
          <div className="group-code-info">
            Group Code: <strong>{groupCode}</strong>
          </div>
          <button
            className="whatsapp-share-btn"
            onClick={() => {
              const message = `Join my 7-Day Find My Flow Challenge! Use code: ${groupCode}`
              const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
              window.open(whatsappUrl, '_blank')
            }}
          >
            <svg className="whatsapp-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
            Share group code via WhatsApp
          </button>
        </div>
      )}

      <div className="leaderboard-list">
        {leaderboard.length === 0 && (
          <div className="leaderboard-empty">
            <p>No participants yet. Be the first to complete a quest!</p>
          </div>
        )}

        {leaderboard.map((entry) => (
          <div
            key={entry.userId}
            className={`leaderboard-entry ${entry.isCurrentUser ? 'current-user' : ''}`}
          >
            <div className="leaderboard-rank">
              {entry.rank === 1 && '🥇'}
              {entry.rank === 2 && '🥈'}
              {entry.rank === 3 && '🥉'}
              {entry.rank > 3 && `#${entry.rank}`}
            </div>
            <div className="leaderboard-info">
              <div className="leaderboard-name">
                {entry.name}
                {entry.isCurrentUser && <span className="you-badge">You</span>}
              </div>
              <div className="leaderboard-meta">Day {entry.currentDay}/7</div>
            </div>
            <div className="leaderboard-points">
              {entry.totalPoints} pts
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ChallengeLeaderboard
