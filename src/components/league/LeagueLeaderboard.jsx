/**
 * LeagueLeaderboard.jsx — Rich leaderboard for the Standings tab
 *
 * Hero matchup card, week navigator, compact matchup rows,
 * and ranked standings table with category bars + member scores.
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { FANTASY_CATEGORIES, CATEGORY_KEYS } from '../../lib/league/leagueConfig'
import { hapticLight } from '../../lib/haptics'
import './LeagueLeaderboard.css'

const RANK_MEDALS = ['🥇', '🥈', '🥉']

export default function LeagueLeaderboard({
  standings, matchups, userTeam, league, teams,
  getCurrentWeek, getWeekMatchups, getWeekDateRange,
  fetchLiveTeamScores, memberNames,
}) {
  const currentWeek = getCurrentWeek()
  const isUpcoming = league?.status === 'upcoming'
  const numWeeks = league?.num_weeks || 4

  // State
  const [selectedWeek, setSelectedWeek] = useState(currentWeek || 1)
  const [expandedTeamId, setExpandedTeamId] = useState(null)
  const [liveMatchupScores, setLiveMatchupScores] = useState(null)
  const [expandedTeamScores, setExpandedTeamScores] = useState(null)
  const [loadingLive, setLoadingLive] = useState(false)
  const [loadingExpand, setLoadingExpand] = useState(false)
  const [expandedMiniMatchup, setExpandedMiniMatchup] = useState(null)

  // Keep selectedWeek in sync if currentWeek changes
  useEffect(() => {
    if (currentWeek > 0) setSelectedWeek(currentWeek)
  }, [currentWeek])

  // ============================================
  // Helpers
  // ============================================

  const getTeamById = useCallback((teamId) => {
    return teams.find(t => t.id === teamId)
  }, [teams])

  const getTeamNameById = useCallback((teamId) => {
    return getTeamById(teamId)?.name || 'TBD'
  }, [getTeamById])

  const getTeamMembers = useCallback((teamId) => {
    const team = getTeamById(teamId)
    return (team?.fantasy_team_members || []).map(m => m.user_id)
  }, [getTeamById])

  // Find the user's matchup for a given week
  const getUserMatchup = useCallback((weekNum) => {
    if (!userTeam) return null
    const weekMatchups = getWeekMatchups(weekNum)
    return weekMatchups.find(m =>
      m.team_a_id === userTeam.id || m.team_b_id === userTeam.id
    ) || null
  }, [userTeam, getWeekMatchups])

  // Orient matchup so user's team is always on the left
  const orientMatchup = useCallback((matchup) => {
    if (!matchup || !userTeam) return null
    const isTeamA = matchup.team_a_id === userTeam.id
    return {
      myTeamId: isTeamA ? matchup.team_a_id : matchup.team_b_id,
      oppTeamId: isTeamA ? matchup.team_b_id : matchup.team_a_id,
      myMatchPoints: isTeamA ? matchup.team_a_match_points : matchup.team_b_match_points,
      oppMatchPoints: isTeamA ? matchup.team_b_match_points : matchup.team_a_match_points,
      myCategoriesWon: isTeamA ? matchup.team_a_categories_won : matchup.team_b_categories_won,
      oppCategoriesWon: isTeamA ? matchup.team_b_categories_won : matchup.team_a_categories_won,
      categoryResults: (matchup.category_results || []).map(cr => ({
        ...cr,
        myScore: isTeamA ? cr.teamAScore : cr.teamBScore,
        oppScore: isTeamA ? cr.teamBScore : cr.teamAScore,
        myWinner: cr.winner === (isTeamA ? 'a' : 'b'),
        oppWinner: cr.winner === (isTeamA ? 'b' : 'a'),
      })),
      calculated: !!matchup.calculated_at,
    }
  }, [userTeam])

  // ============================================
  // Live score fetching (hero card)
  // ============================================

  useEffect(() => {
    if (isUpcoming || !userTeam) {
      setLiveMatchupScores(null)
      setLoadingLive(false)
      return
    }

    const matchup = getUserMatchup(selectedWeek)
    if (!matchup) {
      setLiveMatchupScores(null)
      setLoadingLive(false)
      return
    }

    // Already calculated — use stored results
    if (matchup.calculated_at) {
      setLiveMatchupScores(null)
      setLoadingLive(false)
      return
    }

    // Uncalculated — fetch live scores
    let cancelled = false
    setLoadingLive(true)

    const myMembers = getTeamMembers(userTeam.id)
    const oppId = matchup.team_a_id === userTeam.id ? matchup.team_b_id : matchup.team_a_id
    const oppMembers = getTeamMembers(oppId)

    Promise.all([
      fetchLiveTeamScores(myMembers, selectedWeek),
      fetchLiveTeamScores(oppMembers, selectedWeek),
    ]).then(([my, opp]) => {
      if (!cancelled) {
        if (my && opp) {
          setLiveMatchupScores({ my, opponent: opp })
        } else {
          setLiveMatchupScores(null)
        }
        setLoadingLive(false)
      }
    }).catch(() => {
      if (!cancelled) setLoadingLive(false)
    })

    return () => { cancelled = true }
  }, [selectedWeek, userTeam, isUpcoming, getUserMatchup, getTeamMembers, fetchLiveTeamScores])

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

    if (league?.status !== 'upcoming' && team.memberUserIds?.length > 0) {
      setLoadingExpand(true)
      try {
        const scores = await fetchLiveTeamScores(team.memberUserIds, selectedWeek)
        if (expandingTeamRef.current === targetId) {
          setExpandedTeamScores(scores)
        }
      } catch {
        // silently fail — bars will show zero
      } finally {
        if (expandingTeamRef.current === targetId) {
          setLoadingExpand(false)
        }
      }
    }
  }

  // ============================================
  // Week navigation
  // ============================================

  const handlePrevWeek = () => {
    hapticLight()
    setSelectedWeek(w => Math.max(1, w - 1))
    setExpandedMiniMatchup(null)
    setExpandedTeamId(null)
    setExpandedTeamScores(null)
    expandingTeamRef.current = null
  }

  const handleNextWeek = () => {
    hapticLight()
    setSelectedWeek(w => Math.min(numWeeks, w + 1))
    setExpandedMiniMatchup(null)
    setExpandedTeamId(null)
    setExpandedTeamScores(null)
    expandingTeamRef.current = null
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
          const maxVal = Math.max(cr.teamAScore || 0, cr.teamBScore || 0)
          if (maxVal > maxes[cr.category]) maxes[cr.category] = maxVal
        })
      }
    })

    // Also account for live scores
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
  // Render: Hero Matchup Card
  // ============================================

  const renderHeroCard = () => {
    if (isUpcoming || !userTeam) return null

    const matchup = getUserMatchup(selectedWeek)

    // Bye week
    if (!matchup) {
      return (
        <div className="ll-matchup-hero">
          <span className="ll-hero-eyebrow">YOUR MATCHUP · WEEK {selectedWeek}</span>
          <div className="ll-bye-message">
            <span className="ll-bye-icon">🏖️</span>
            <p className="ll-bye-text">Bye week — no opponent</p>
          </div>
        </div>
      )
    }

    const oriented = orientMatchup(matchup)
    const isLive = !oriented.calculated && liveMatchupScores

    // Build category rows from either calculated or live data
    let categoryRows
    if (oriented.calculated) {
      categoryRows = oriented.categoryResults
    } else if (isLive) {
      categoryRows = CATEGORY_KEYS.map(key => {
        const myScore = liveMatchupScores.my?.[key] || 0
        const oppScore = liveMatchupScores.opponent?.[key] || 0
        return {
          category: key,
          label: FANTASY_CATEGORIES[key].label,
          myScore,
          oppScore,
          myWinner: myScore > oppScore,
          oppWinner: oppScore > myScore,
        }
      })
    }

    // Count category wins for live display
    let myWins = 0, oppWins = 0
    if (isLive && categoryRows) {
      categoryRows.forEach(r => {
        if (r.myWinner) myWins++
        if (r.oppWinner) oppWins++
      })
    }

    return (
      <div className="ll-matchup-hero">
        <span className="ll-hero-eyebrow">
          YOUR MATCHUP · WEEK {selectedWeek}
          {isLive && <span className="ll-live-badge">LIVE</span>}
        </span>

        <div className="ll-hero-teams">
          <span className="ll-hero-team-name">{getTeamNameById(oriented.myTeamId)}</span>
          <span className="ll-hero-vs">VS</span>
          <span className="ll-hero-team-name">{getTeamNameById(oriented.oppTeamId)}</span>
        </div>

        {loadingLive && !categoryRows && (
          <div className="ll-hero-loading">
            <div className="ll-spinner" />
          </div>
        )}

        {categoryRows && (
          <div className="ll-hero-categories">
            {categoryRows.map(row => {
              const cat = FANTASY_CATEGORIES[row.category]
              return (
                <div key={row.category} className="ll-cat-row">
                  <span className={`ll-cat-score ${row.myWinner ? 'll-winning' : ''}`}>
                    {row.myScore}
                  </span>
                  <span className="ll-cat-label">
                    {cat.icon} {cat.label}
                  </span>
                  <span className={`ll-cat-score ${row.oppWinner ? 'll-winning' : ''}`}>
                    {row.oppScore}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        <div className="ll-hero-result">
          {oriented.calculated ? (
            <span className="ll-result-text">
              Result: {oriented.myCategoriesWon} – {oriented.oppCategoriesWon}
              {oriented.myMatchPoints === 3 && ' · Win'}
              {oriented.oppMatchPoints === 3 && ' · Loss'}
              {oriented.myMatchPoints === 1 && ' · Draw'}
            </span>
          ) : isLive ? (
            <span className="ll-result-text">
              Live: {myWins} – {oppWins}
            </span>
          ) : null}
        </div>
      </div>
    )
  }

  // ============================================
  // Render: Week Navigator
  // ============================================

  const renderWeekNav = () => {
    if (isUpcoming) return null

    return (
      <div className="ll-week-nav">
        <button
          className="ll-week-arrow"
          onClick={handlePrevWeek}
          disabled={selectedWeek <= 1}
          aria-label="Previous week"
        >
          ←
        </button>
        <div className="ll-week-center">
          <span className="ll-week-label">Week {selectedWeek}</span>
          {selectedWeek === currentWeek && (
            <span className="ll-current-badge">Current</span>
          )}
        </div>
        <button
          className="ll-week-arrow"
          onClick={handleNextWeek}
          disabled={selectedWeek >= numWeeks}
          aria-label="Next week"
        >
          →
        </button>
      </div>
    )
  }

  // ============================================
  // Render: Week Matchups (browsing non-current weeks)
  // ============================================

  const renderWeekMatchups = () => {
    if (isUpcoming) return null
    // Only show compact matchups for all weeks (gives context for any week)
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
                      {team.memberCount}/3 players
                      {!isUpcoming && ` · ${team.wins}W ${team.draws}D ${team.losses}L`}
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
                  {/* Category bars */}
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

                  {/* Member list (always shown) / contributions (active only) */}
                  {!isUpcoming && expandedTeamScores?.members ? (
                    <div className="ll-members">
                      <span className="ll-members-title">THIS WEEK'S CONTRIBUTIONS</span>
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
                  ) : isUpcoming && team.memberUserIds?.length > 0 && (
                    <div className="ll-members">
                      <span className="ll-members-title">SQUAD MEMBERS</span>
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
      {renderHeroCard()}
      {renderWeekNav()}
      {renderWeekMatchups()}
      {renderStandings()}
    </div>
  )
}
