/**
 * LeagueOverview.jsx — /league
 * Fantasy League hub: standings, schedule, join/create team, expandable team cards
 */
import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { useLeagueData } from '../../hooks/useLeagueData'
import { createTeam, joinTeam } from '../../lib/league/leagueService'
import { FANTASY_CATEGORIES, CATEGORY_KEYS, LEAGUE_STATUSES } from '../../lib/league/leagueConfig'
import { hapticLight, hapticSuccess } from '../../lib/haptics'
import './LeagueOverview.css'

export default function LeagueOverview() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const {
    loading, league, teams, userTeam, standings, matchups,
    isOnTeam, leagueExists, reloadTeams, getCurrentWeek, getWeekMatchups,
  } = useLeagueData()

  // UI State
  const [activeTab, setActiveTab] = useState('standings') // standings | schedule | rules
  const [expandedTeam, setExpandedTeam] = useState(null)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [teamName, setTeamName] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)

  // Handle ?join= query param
  useEffect(() => {
    const joinParam = searchParams.get('join')
    if (joinParam && !isOnTeam) {
      setJoinCode(joinParam.toUpperCase())
      setShowJoinModal(true)
    }
  }, [searchParams, isOnTeam])

  const currentWeek = getCurrentWeek()

  // ============================================
  // Actions
  // ============================================

  const handleCreateTeam = async () => {
    if (!teamName.trim() || !league?.id) return
    setActionLoading(true)
    try {
      await createTeam({ leagueId: league.id, name: teamName.trim(), userId: user.id })
      hapticSuccess()
      setShowCreateModal(false)
      setTeamName('')
      await reloadTeams()
      setShowShareModal(true)
    } catch (err) {
      alert(err.message || 'Error creating team')
    } finally {
      setActionLoading(false)
    }
  }

  const handleJoinTeam = async () => {
    if (!joinCode.trim()) return
    setActionLoading(true)
    try {
      await joinTeam({ inviteCode: joinCode.trim(), userId: user.id })
      hapticSuccess()
      setShowJoinModal(false)
      setJoinCode('')
      await reloadTeams()
    } catch (err) {
      alert(err.message || 'Error joining team')
    } finally {
      setActionLoading(false)
    }
  }

  const handleShare = async () => {
    if (!userTeam?.invite_code) return
    const shareUrl = `${window.location.origin}/league?join=${userTeam.invite_code}`
    const shareText = `Join my Fantasy League squad on FindMyFlow! Code: ${userTeam.invite_code} — ${shareUrl}`

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Join My Squad', text: shareText })
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(shareText)
      alert('Share link copied to clipboard!')
    }
    setShowShareModal(false)
  }

  const handleCopyCode = async () => {
    if (!userTeam?.invite_code) return
    await navigator.clipboard.writeText(userTeam.invite_code)
    hapticLight()
    alert(`Code copied: ${userTeam.invite_code}`)
  }

  const getDaysUntilStart = () => {
    if (!league?.start_date) return null
    const start = new Date(league.start_date)
    const now = new Date()
    const diff = Math.ceil((start - now) / (1000 * 60 * 60 * 24))
    return diff > 0 ? diff : 0
  }

  const getTeamNameById = (teamId) => {
    const team = teams.find(t => t.id === teamId)
    return team?.name || 'TBD'
  }

  // ============================================
  // Loading
  // ============================================

  if (loading) {
    return (
      <div className="league-overview">
        <div className="lo-loading">
          <div className="lo-spinner" />
          <p>Loading league...</p>
        </div>
      </div>
    )
  }

  if (!leagueExists) {
    return (
      <div className="league-overview">
        <div className="lo-toolbar">
          <button className="lo-back" onClick={() => navigate(-1)}>←</button>
          <h2 className="lo-toolbar-title">Fantasy League</h2>
        </div>
        <div className="lo-empty">
          <span className="lo-empty-icon">🏆</span>
          <h3 className="lo-empty-title">No Active League</h3>
          <p className="lo-empty-text">A league hasn't been created yet. Check back soon!</p>
          <button className="lo-cta" onClick={() => navigate('/7-day-challenge')}>
            Back to Challenge <span>→</span>
          </button>
        </div>
      </div>
    )
  }

  // ============================================
  // Render
  // ============================================

  return (
    <div className="league-overview">
      {/* Toolbar */}
      <div className="lo-toolbar">
        <button className="lo-back" onClick={() => navigate(-1)}>←</button>
        <h2 className="lo-toolbar-title">Fantasy League</h2>
      </div>

      {/* Hero Card */}
      <div className="lo-hero">
        <span className="lo-hero-label">
          {league.status === 'upcoming' ? 'Coming Soon' :
           league.status === 'active' ? `Week ${currentWeek}` : 'Season Complete'}
        </span>
        <h2 className="lo-hero-title">{league.name}</h2>
        <p className="lo-hero-sub">
          {league.status === 'upcoming' && getDaysUntilStart() !== null && (
            <>Starts in {getDaysUntilStart()} day{getDaysUntilStart() !== 1 ? 's' : ''}!</>
          )}
          {league.status === 'active' && (
            <>{league.num_weeks}-week season • {teams.length} teams competing</>
          )}
          {league.status === 'completed' && (
            <>Final results are in!</>
          )}
        </p>

        {/* Team Actions */}
        {!isOnTeam && league.status !== 'completed' ? (
          <div className="lo-hero-actions">
            <button className="lo-cta" onClick={() => { hapticLight(); setShowJoinModal(true) }}>
              Join a Team <span>→</span>
            </button>
            <button className="lo-ghost-btn" onClick={() => { hapticLight(); setShowCreateModal(true) }}>
              Create a Team
            </button>
          </div>
        ) : isOnTeam && (
          <div className="lo-my-team-badge">
            <span>Your squad: <strong>{userTeam.name}</strong></span>
            <button className="lo-share-btn" onClick={() => setShowShareModal(true)}>
              Share Code
            </button>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="lo-tabs">
        {['standings', 'schedule', 'rules'].map(tab => (
          <button
            key={tab}
            className={`lo-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => { hapticLight(); setActiveTab(tab) }}
          >
            {tab === 'standings' ? 'Standings' : tab === 'schedule' ? 'Schedule' : 'Rules'}
          </button>
        ))}
      </div>

      {/* Content Submission Link */}
      {isOnTeam && league.status === 'active' && (
        <button
          className="lo-content-link"
          onClick={() => navigate('/league/submit')}
        >
          ⭐ Submit Content for Bonus Points <span>→</span>
        </button>
      )}

      {/* Tab Content */}
      {activeTab === 'standings' && (
        <section className="lo-section">
          <div className="lo-section-header">
            <div className="lo-section-icon">🏆</div>
            <span className="lo-section-title">
              {league.status === 'upcoming' ? 'Teams' : 'Standings'}
            </span>
          </div>

          {(league.status === 'upcoming' ? teams : standings).length === 0 ? (
            <div className="lo-card">
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
                No teams formed yet. Be the first to create one!
              </p>
            </div>
          ) : (
            (league.status === 'upcoming' ? teams.map((t, i) => ({
              teamId: t.id, teamName: t.name, inviteCode: t.invite_code,
              memberCount: (t.fantasy_team_members || []).length,
              matchPoints: 0, wins: 0, draws: 0, losses: 0,
              categoryWins: 0, totalRawPoints: 0,
              memberUserIds: (t.fantasy_team_members || []).map(m => m.user_id),
            })) : standings).map((team, index) => (
              <div
                key={team.teamId}
                className={`lo-card accented ${expandedTeam === team.teamId ? 'expanded' : ''} ${
                  userTeam?.id === team.teamId ? 'my-team' : ''
                }`}
              >
                <div
                  className="lo-team-header"
                  onClick={() => {
                    hapticLight()
                    setExpandedTeam(expandedTeam === team.teamId ? null : team.teamId)
                  }}
                >
                  <div className="lo-team-rank">
                    {league.status !== 'upcoming' ? (
                      <span className={`lo-rank-num ${index < 1 ? 'gold' : ''}`}>
                        #{index + 1}
                      </span>
                    ) : null}
                    <div className="lo-team-info">
                      <span className="lo-team-name">{team.teamName}</span>
                      <span className="lo-team-meta">
                        {team.memberCount}/3 players
                        {league.status !== 'upcoming' && ` • ${team.wins}W ${team.draws}D ${team.losses}L`}
                      </span>
                    </div>
                  </div>
                  <div className="lo-team-points">
                    {league.status !== 'upcoming' && (
                      <span className="lo-points-value">{team.matchPoints} pts</span>
                    )}
                    <span className="lo-expand-chevron">
                      {expandedTeam === team.teamId ? '▲' : '▼'}
                    </span>
                  </div>
                </div>

                {expandedTeam === team.teamId && (
                  <div className="lo-team-detail">
                    <div className="lo-team-code">
                      Code: <strong>{team.inviteCode}</strong>
                    </div>
                    {league.status !== 'upcoming' && (
                      <div className="lo-category-scores">
                        {/* Category breakdown from latest matchup would go here */}
                        <div className="lo-stat-row">
                          <span>Category Wins</span>
                          <strong>{team.categoryWins}</strong>
                        </div>
                        <div className="lo-stat-row">
                          <span>Total Raw Points</span>
                          <strong>{team.totalRawPoints}</strong>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </section>
      )}

      {activeTab === 'schedule' && (
        <section className="lo-section">
          {Array.from({ length: league.num_weeks || 4 }, (_, i) => i + 1).map(weekNum => {
            const weekMatchups = getWeekMatchups(weekNum)
            return (
              <div key={weekNum} className="lo-card">
                <div className="lo-week-header">
                  <span className="lo-week-label">Week {weekNum}</span>
                  {weekNum === currentWeek && league.status === 'active' && (
                    <span className="lo-week-badge">Current</span>
                  )}
                </div>
                {weekMatchups.length === 0 ? (
                  <p className="lo-no-matchups">Matchups TBD</p>
                ) : (
                  weekMatchups.map(m => (
                    <div key={m.id} className="lo-matchup-row">
                      <div className={`lo-matchup-team ${m.team_a_match_points === 3 ? 'winner' : ''}`}>
                        <span className="lo-matchup-name">{getTeamNameById(m.team_a_id)}</span>
                        {m.calculated_at && (
                          <span className="lo-matchup-score">{m.team_a_categories_won}</span>
                        )}
                      </div>
                      <span className="lo-matchup-vs">
                        {m.calculated_at ? `${m.team_a_match_points} - ${m.team_b_match_points}` : 'vs'}
                      </span>
                      <div className={`lo-matchup-team ${m.team_b_match_points === 3 ? 'winner' : ''}`}>
                        <span className="lo-matchup-name">{getTeamNameById(m.team_b_id)}</span>
                        {m.calculated_at && (
                          <span className="lo-matchup-score">{m.team_b_categories_won}</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )
          })}
        </section>
      )}

      {activeTab === 'rules' && (
        <section className="lo-section">
          <div className="lo-card">
            <h3 className="lo-rules-title">How It Works</h3>
            <div className="lo-rules-list">
              <div className="lo-rule">
                <span className="lo-rule-num">1</span>
                <div>
                  <strong>Form a Squad</strong>
                  <p>Teams of 3 players. Create a team or join with an invite code.</p>
                </div>
              </div>
              <div className="lo-rule">
                <span className="lo-rule-num">2</span>
                <div>
                  <strong>Compete Weekly</strong>
                  <p>Head-to-head matchups each week. Your team's combined quest scores compete across 5 categories.</p>
                </div>
              </div>
              <div className="lo-rule">
                <span className="lo-rule-num">3</span>
                <div>
                  <strong>Win Categories</strong>
                  <p>Win 3+ of 5 categories = Win (3 pts). Tie 2-2 = Draw (1 pt each). Win 0-1 = Loss (0 pts).</p>
                </div>
              </div>
            </div>

            <h4 className="lo-rules-subtitle">5 Scoring Categories</h4>
            <div className="lo-categories-grid">
              {CATEGORY_KEYS.map(key => {
                const cat = FANTASY_CATEGORIES[key]
                return (
                  <div key={key} className="lo-category-pill" style={{ borderColor: cat.color }}>
                    <span className="lo-cat-icon">{cat.icon}</span>
                    <span className="lo-cat-label">{cat.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Join Team Modal */}
      {showJoinModal && (
        <div className="lo-modal-overlay" onClick={() => setShowJoinModal(false)}>
          <div className="lo-modal" onClick={e => e.stopPropagation()}>
            <div className="lo-modal-header">
              <h3>Join a Team</h3>
              <button className="lo-modal-close" onClick={() => setShowJoinModal(false)}>×</button>
            </div>
            <div className="lo-modal-body">
              <div className="lo-field">
                <label>Invite Code</label>
                <input
                  type="text"
                  placeholder="e.g. ABC123"
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  autoFocus
                />
              </div>
              <div className="lo-modal-actions">
                <button className="lo-cancel" onClick={() => setShowJoinModal(false)}>Cancel</button>
                <button
                  className="lo-save"
                  onClick={handleJoinTeam}
                  disabled={actionLoading || !joinCode.trim()}
                >
                  {actionLoading ? 'Joining...' : 'Join Team'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="lo-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="lo-modal" onClick={e => e.stopPropagation()}>
            <div className="lo-modal-header">
              <h3>Create a Team</h3>
              <button className="lo-modal-close" onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            <div className="lo-modal-body">
              <div className="lo-field">
                <label>Team Name</label>
                <input
                  type="text"
                  placeholder="e.g. Flow Warriors"
                  value={teamName}
                  onChange={e => setTeamName(e.target.value)}
                  maxLength={30}
                  autoFocus
                />
              </div>
              <div className="lo-modal-actions">
                <button className="lo-cancel" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button
                  className="lo-save"
                  onClick={handleCreateTeam}
                  disabled={actionLoading || !teamName.trim()}
                >
                  {actionLoading ? 'Creating...' : 'Create Team'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Invite Modal */}
      {showShareModal && userTeam && (
        <div className="lo-modal-overlay" onClick={() => setShowShareModal(false)}>
          <div className="lo-modal" onClick={e => e.stopPropagation()}>
            <div className="lo-modal-header">
              <h3>Share Invite Code</h3>
              <button className="lo-modal-close" onClick={() => setShowShareModal(false)}>×</button>
            </div>
            <div className="lo-modal-body">
              <div className="lo-share-code">
                <span className="lo-code-display">{userTeam.invite_code}</span>
                <button className="lo-copy-btn" onClick={handleCopyCode}>Copy</button>
              </div>
              <p className="lo-share-hint">Share this code with 2 friends to complete your squad!</p>
              <div className="lo-modal-actions">
                <button className="lo-cancel" onClick={() => setShowShareModal(false)}>Close</button>
                <button className="lo-cta" onClick={handleShare} style={{ flex: 1 }}>
                  Share <span>→</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
