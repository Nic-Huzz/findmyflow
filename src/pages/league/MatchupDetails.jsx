/**
 * MatchupDetails — /league/matchup
 * Head-to-head matchup page with scoreboard, category bars, rosters with points
 */
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { useLeagueData } from '../../hooks/useLeagueData'
import { useMatchupData } from '../../hooks/useMatchupData'
import { useChallengeData } from '../../hooks/useChallengeData'
import { FANTASY_CATEGORIES } from '../../lib/league/leagueConfig'
import './MatchupDetails.css'

export default function MatchupDetails() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const { completions } = useChallengeData()
  const {
    loading, league, teams, userTeam,
    isOnTeam, leagueExists, getCurrentWeek, getWeekMatchups,
    fetchLiveTeamScores, memberNames,
  } = useLeagueData()

  const { categoryScores, matchupData, matchupLoading } = useMatchupData({
    completions,
    userTeam, league, teams,
    getCurrentWeek, getWeekMatchups, fetchLiveTeamScores,
  })

  const currentWeek = getCurrentWeek?.() || 0

  // Loading state
  if (loading) {
    return (
      <div className="matchup-details-page">
        <div className="matchup-toolbar">
          <button className="matchup-back" onClick={() => navigate(-1)}>←</button>
          <h2 className="matchup-toolbar-title">Loading...</h2>
        </div>
      </div>
    )
  }

  // Still loading matchup data (opponent scores are async)
  if (matchupLoading && !matchupData) {
    return (
      <div className="matchup-details-page">
        <div className="matchup-toolbar">
          <button className="matchup-back" onClick={() => navigate(-1)}>←</button>
          <h2 className="matchup-toolbar-title">Week {currentWeek}</h2>
        </div>
        <div className="matchup-empty">
          <p>Loading matchup...</p>
        </div>
      </div>
    )
  }

  // No active matchup → empty state
  if (!leagueExists || !isOnTeam || !matchupData) {
    return (
      <div className="matchup-details-page">
        <div className="matchup-toolbar">
          <button className="matchup-back" onClick={() => navigate(-1)}>←</button>
          <h2 className="matchup-toolbar-title">Matchup</h2>
        </div>
        <div className="matchup-empty">
          <p>No active matchup this week.</p>
          <button className="matchup-cta" onClick={() => navigate('/league')}>Go to League →</button>
        </div>
      </div>
    )
  }

  // Find opponent team
  const currentMatchups = getWeekMatchups?.(currentWeek) || []
  const matchup = currentMatchups.find(
    m => m.team_a_id === userTeam?.id || m.team_b_id === userTeam?.id
  )
  const oppTeamId = matchup
    ? (matchup.team_a_id === userTeam?.id ? matchup.team_b_id : matchup.team_a_id)
    : null
  const oppTeam = oppTeamId ? teams.find(t => t.id === oppTeamId) : null

  const myTeamName = userTeam?.name || 'Your Team'

  return (
    <div className="matchup-details-page">
      {/* Toolbar */}
      <div className="matchup-toolbar">
        <button className="matchup-back" onClick={() => navigate(-1)}>←</button>
        <h2 className="matchup-toolbar-title">Week {currentWeek}</h2>
      </div>

      {/* Scoreboard */}
      <div className="matchup-scoreboard">
        <div className="matchup-team">
          <span className="matchup-team-name">{myTeamName}</span>
          <span className={`matchup-team-score ${matchupData.myWins > matchupData.oppWins ? 'winning' : ''}`}>
            {matchupData.myWins}
          </span>
        </div>
        <span className="matchup-vs-label">vs</span>
        <div className="matchup-team">
          <span className="matchup-team-name">{matchupData.opponentName}</span>
          <span className={`matchup-team-score ${matchupData.oppWins > matchupData.myWins ? 'winning' : ''}`}>
            {matchupData.oppWins}
          </span>
        </div>
      </div>

      {/* Category bars — full width, score on each side */}
      <div className={`matchup-categories${matchupLoading ? ' loading' : ''}`}>
        {matchupData.categories.map(cat => {
          const total = cat.score + cat.oppScore
          const myPct = total > 0 ? Math.round((cat.score / total) * 100) : 50
          const oppPct = 100 - myPct
          const tied = cat.score === cat.oppScore
          const myClass = tied ? '' : cat.winning ? 'win' : 'lose'
          const oppClass = tied ? '' : cat.winning ? 'lose' : 'win'

          return (
            <div key={cat.key} className="matchup-cat-row">
              <span className={`matchup-cat-score ${myClass}`}>{cat.score}</span>
              <div className="matchup-cat-bar-container">
                <span className="matchup-cat-label">{cat.icon} {cat.label}</span>
                <div className="matchup-cat-bar-track">
                  <div
                    className={`matchup-cat-bar-fill-left ${myClass}`}
                    style={{
                      width: `${myPct}%`,
                      ...(tied ? { background: FANTASY_CATEGORIES[cat.key]?.color } : {}),
                    }}
                  />
                  <div
                    className={`matchup-cat-bar-fill-right ${oppClass}`}
                    style={{
                      width: `${oppPct}%`,
                      ...(tied ? { background: FANTASY_CATEGORIES[cat.key]?.color, opacity: 0.4 } : {}),
                    }}
                  />
                </div>
              </div>
              <span className={`matchup-cat-score ${oppClass}`}>{cat.oppScore}</span>
            </div>
          )
        })}
      </div>

      {/* Team Rosters (hidden for solo vs solo) */}
      {((userTeam?.fantasy_team_members || []).length > 1 || (oppTeam?.fantasy_team_members || []).length > 1) && (
        <div className="matchup-rosters">
          <div className="matchup-roster">
            <h3>{myTeamName}</h3>
            {(userTeam?.fantasy_team_members || []).map(m => (
              <div key={m.user_id} className="matchup-roster-member">
                <span className="matchup-roster-name">{memberNames?.[m.user_id] || 'Member'}</span>
                {m.user_id === user?.id && <span className="matchup-you-badge">You</span>}
                <span className="matchup-roster-pts">{m.total_points ?? 0} pts</span>
              </div>
            ))}
          </div>
          {oppTeam && (
            <div className="matchup-roster">
              <h3>{oppTeam.name}</h3>
              {(oppTeam.fantasy_team_members || []).map(m => (
                <div key={m.user_id} className="matchup-roster-member">
                  <span className="matchup-roster-name">{memberNames?.[m.user_id] || 'Member'}</span>
                  <span className="matchup-roster-pts">{m.total_points ?? 0} pts</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
