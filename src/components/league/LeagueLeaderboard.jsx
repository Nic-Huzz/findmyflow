/**
 * LeagueLeaderboard.jsx — Standings tab content
 *
 * Renders: mini matchup rows + ranked standings table with category bars.
 * Hero matchup card and week navigator are now in LeagueOverview (parent).
 * Receives selectedWeek and liveMatchupScores as props.
 */
import { useState, useCallback, useRef } from 'react'
import { FANTASY_CATEGORIES, CATEGORY_KEYS } from '../../lib/league/leagueConfig'
import { hapticLight } from '../../lib/haptics'
import './LeagueLeaderboard.css'

const RANK_MEDALS = ['🥇', '🥈', '🥉']

export default function LeagueLeaderboard({
  standings, matchups, userTeam, league, teams,
  getCurrentWeek, getWeekMatchups, getWeekDateRange,
  fetchLiveTeamScores, memberNames,
  selectedWeek, liveMatchupScores,
}) {
  const currentWeek = getCurrentWeek()
  const isUpcoming = currentWeek === 0

  // State
  const [expandedTeamId, setExpandedTeamId] = useState(null)
  const [expandedTeamScores, setExpandedTeamScores] = useState(null)
  const [loadingExpand, setLoadingExpand] = useState(false)
  const [expandedMiniMatchup, setExpandedMiniMatchup] = useState(null)

  // ============================================
  // Helpers
  // ============================================

  const getTeamById = useCallback((teamId) => {
    return teams.find(t => t.id === teamId)
  }, [teams])

  const getTeamNameById = useCallback((teamId) => {
    return getTeamById(teamId)?.name || 'TBD'
  }, [getTeamById])

  // ============================================
  // Team expand handler
  // ============================================

  const expandingTeamRef = useRef(null)

  const handleTeamExpand = async (team) => {
    hapticLight()
    if (expandedTeamId === team.teamId) {
      setExpandedTeamId(null)
      setExpandedTeamScores(null)
      expandingTeamRef.current = null
      return
    }

    const targetId = team.teamId
    expandingTeamRef.current = targetId
    setExpandedTeamId(targetId)
    setExpandedTeamScores(null)

    if (!isUpcoming && team.memberUserIds?.length > 0) {
      setLoadingExpand(true)
      try {
        const scores = await fetchLiveTeamScores(team.memberUserIds, selectedWeek)
        if (expandingTeamRef.current === targetId) {
          setExpandedTeamScores(scores)
        }
      } catch {
        // silently fail
      } finally {
        if (expandingTeamRef.current === targetId) {
          setLoadingExpand(false)
        }
      }
    }
  }

  // ============================================
  // Category bar scaling
  // ============================================

  const getCategoryMaxes = useCallback(() => {
    const maxes = Object.fromEntries(CATEGORY_KEYS.map(k => [k, 1]))
    const weekMatchups = getWeekMatchups(selectedWeek)

    weekMatchups.forEach(m => {
      if (m.category_results) {
        m.category_results.forEach(cr => {
          if (!(cr.category in maxes)) return
          const maxVal = Math.max(cr.teamAScore || 0, cr.teamBScore || 0)
          if (maxVal > maxes[cr.category]) maxes[cr.category] = maxVal
        })
      }
    })

    if (liveMatchupScores) {
      CATEGORY_KEYS.forEach(k => {
        const myVal = liveMatchupScores.my?.[k] || 0
        const oppVal = liveMatchupScores.opponent?.[k] || 0
        const maxVal = Math.max(myVal, oppVal)
        if (maxVal > maxes[k]) maxes[k] = maxVal
      })
    }

    return maxes
  }, [selectedWeek, getWeekMatchups, liveMatchupScores])

  // ============================================
  // Render: Week Matchups (compact rows)
  // ============================================

  const renderWeekMatchups = () => {
    if (isUpcoming) return null
    const weekMatchups = getWeekMatchups(selectedWeek)
    if (weekMatchups.length === 0) return null

    return (
      <div className="ll-mini-matchups">
        <span className="ll-section-label">MATCHUPS</span>
        {weekMatchups.map(m => {
          const isExpanded = expandedMiniMatchup === m.id
          const isCalculated = !!m.calculated_at

          return (
            <div key={m.id} className={`ll-mini-matchup ${isExpanded ? 'll-mini-expanded' : ''}`}>
              <div
                className="ll-mini-header"
                onClick={() => {
                  hapticLight()
                  setExpandedMiniMatchup(isExpanded ? null : m.id)
                }}
              >
                <span className={`ll-mini-name ${isCalculated && m.team_a_match_points === 3 ? 'll-mini-winner' : ''}`}>
                  {getTeamNameById(m.team_a_id)}
                </span>
                <span className="ll-mini-score">
                  {isCalculated
                    ? `${m.team_a_categories_won} – ${m.team_b_categories_won}`
                    : 'vs'
                  }
                </span>
                <span className={`ll-mini-name ${isCalculated && m.team_b_match_points === 3 ? 'll-mini-winner' : ''}`}>
                  {getTeamNameById(m.team_b_id)}
                </span>
                <span className="ll-mini-chevron">{isExpanded ? '▲' : '▼'}</span>
              </div>

              {isExpanded && isCalculated && m.category_results && (
                <div className="ll-mini-detail">
                  {m.category_results.map(cr => {
                    const cat = FANTASY_CATEGORIES[cr.category]
                    if (!cat) return null
                    return (
                      <div key={cr.category} className="ll-mini-cat-row">
                        <span className={`ll-mini-cat-score ${cr.winner === 'a' ? 'll-winning' : ''}`}>
                          {cr.teamAScore}
                        </span>
                        <span className="ll-mini-cat-label">{cat.icon} {cat.label}</span>
                        <span className={`ll-mini-cat-score ${cr.winner === 'b' ? 'll-winning' : ''}`}>
                          {cr.teamBScore}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}

              {isExpanded && !isCalculated && (
                <div className="ll-mini-detail">
                  <p className="ll-mini-pending">Not yet calculated</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  // ============================================
  // Render: Standings Table
  // ============================================

  const renderStandings = () => {
    const standingsList = isUpcoming
      ? teams.map(t => ({
          teamId: t.id,
          teamName: t.name,
          inviteCode: t.invite_code,
          memberCount: (t.fantasy_team_members || []).length,
          memberUserIds: (t.fantasy_team_members || []).map(m => m.user_id),
          matchPoints: 0, wins: 0, draws: 0, losses: 0,
          categoryWins: 0, totalRawPoints: 0,
        }))
      : standings

    if (standingsList.length === 0) {
      return (
        <div className="ll-empty-standings">
          <p>No teams formed yet. Be the first to create one!</p>
        </div>
      )
    }

    const maxes = getCategoryMaxes()

    return (
      <div className="ll-standings">
        <span className="ll-section-label">
          {isUpcoming ? 'TEAMS' : 'STANDINGS'}
        </span>

        {standingsList.map((team, index) => {
          const isMine = userTeam?.id === team.teamId
          const isExpanded = expandedTeamId === team.teamId

          return (
            <div
              key={team.teamId}
              className={`ll-team-row ${isMine ? 'll-team-row--mine' : ''} ${isExpanded ? 'll-team-row--expanded' : ''}`}
            >
              <div
                className="ll-team-header"
                onClick={() => handleTeamExpand(team)}
              >
                <div className="ll-team-left">
                  <span className="ll-rank">
                    {!isUpcoming && index < 3 ? RANK_MEDALS[index] : !isUpcoming ? `#${index + 1}` : ''}
                  </span>
                  <div className="ll-team-info">
                    <span className="ll-team-name">{team.teamName}</span>
                    <span className="ll-team-record">
                      {team.memberCount > 1 ? `${team.memberCount} players · ` : ''}
                      {!isUpcoming && `${team.wins}W ${team.draws}D ${team.losses}L`}
                    </span>
                  </div>
                </div>
                <div className="ll-team-right">
                  {!isUpcoming && (
                    <span className="ll-match-pts">{team.matchPoints} pts</span>
                  )}
                  <span className="ll-chevron">{isExpanded ? '▲' : '▼'}</span>
                </div>
              </div>

              {isExpanded && (
                <div className="ll-team-detail">
                  {!isUpcoming && (
                    <div className="ll-category-bars">
                      {CATEGORY_KEYS.map(key => {
                        const cat = FANTASY_CATEGORIES[key]
                        const score = expandedTeamScores?.[key] || 0
                        const max = maxes[key] || 1
                        const pct = Math.min(100, Math.round((score / max) * 100))

                        return (
                          <div key={key} className="ll-bar-row">
                            <span className="ll-bar-label">{cat.icon} {cat.label}</span>
                            <div className="ll-bar-track">
                              <div
                                className="ll-bar-fill"
                                style={{
                                  width: loadingExpand ? '0%' : `${pct}%`,
                                  backgroundColor: cat.color,
                                }}
                              />
                            </div>
                            <span className="ll-bar-value">
                              {loadingExpand ? '…' : score}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {!isUpcoming && expandedTeamScores?.members && team.memberCount > 1 && (
                    <div className="ll-members">
                      <span className="ll-members-title">CONTRIBUTIONS</span>
                      {Object.entries(expandedTeamScores.members)
                        .map(([userId, scores]) => {
                          const total = CATEGORY_KEYS.reduce((sum, k) => sum + (scores[k] || 0), 0)
                          return { userId, total }
                        })
                        .sort((a, b) => b.total - a.total)
                        .map(({ userId, total }) => (
                          <div key={userId} className="ll-member-row">
                            <span className="ll-member-name">
                              {memberNames[userId] || 'Player'}
                            </span>
                            <span className="ll-member-dots" />
                            <span className="ll-member-pts">{total} pts</span>
                          </div>
                        ))
                      }
                    </div>
                  )}
                  {isUpcoming && team.memberUserIds?.length > 1 && (
                    <div className="ll-members">
                      <span className="ll-members-title">TEAM MEMBERS</span>
                      {team.memberUserIds.map(userId => (
                        <div key={userId} className="ll-member-row">
                          <span className="ll-member-name">
                            {memberNames[userId] || 'Player'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {loadingExpand && (
                    <div className="ll-expand-loading">
                      <div className="ll-spinner" />
                    </div>
                  )}

                  {!isUpcoming && (
                    <div className="ll-team-stat">
                      <span>Category Wins</span>
                      <strong>{team.categoryWins}</strong>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  // ============================================
  // Main Render
  // ============================================

  return (
    <div className="league-leaderboard">
      {renderWeekMatchups()}
      {renderStandings()}
    </div>
  )
}
