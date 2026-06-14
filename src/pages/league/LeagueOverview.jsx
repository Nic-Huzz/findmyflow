/**
 * LeagueOverview.jsx — /league
 * Fantasy League hub: standings, schedule, join/create team, expandable team cards
 */
import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { useLeagueData } from '../../hooks/useLeagueData'
import { createTeam, joinTeam, joinSolo } from '../../lib/league/leagueService'
import { FANTASY_CATEGORIES, CATEGORY_KEYS } from '../../lib/league/leagueConfig'
import { hapticLight, hapticSuccess } from '../../lib/haptics'
import { supabase } from '../../lib/supabaseClient'
import LeagueLeaderboard from '../../components/league/LeagueLeaderboard'
import { trackLeagueJoined } from '../../lib/analytics'
import './LeagueOverview.css'

export default function LeagueOverview() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const {
    loading, league, teams, userTeam, standings, matchups,
    isOnTeam, leagueExists, reloadTeams, getCurrentWeek, getWeekMatchups,
    getWeekDateRange, fetchLiveTeamScores, memberNames,
  } = useLeagueData()

  // UI State
  const [activeTab, setActiveTab] = useState('standings') // standings | schedule | rules
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showSoloModal, setShowSoloModal] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [teamName, setTeamName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  // Handle ?join= query param
  useEffect(() => {
    const joinParam = searchParams.get('join')
    if (joinParam && !isOnTeam) {
      setJoinCode(joinParam.toUpperCase())
      setShowJoinModal(true)
    }
  }, [searchParams, isOnTeam])

  const currentWeek = getCurrentWeek()

  // Pre-fill display name from profile
  const getDefaultDisplayName = async () => {
    if (!user?.id) return ''
    const { data } = await supabase
      .from('user_stage_progress')
      .select('display_name')
      .eq('user_id', user.id)
      .maybeSingle()
    return data?.display_name?.split(' ')[0] || user.email?.split('@')[0] || ''
  }

  // ============================================
  // Actions
  // ============================================

  const handleJoinSolo = async () => {
    if (!league?.id) return
    setActionLoading(true)
    try {
      const name = displayName.trim()
      const fallback = await getDefaultDisplayName()
      await joinSolo({ leagueId: league.id, userId: user.id, displayName: name || fallback || 'Player' })
      trackLeagueJoined({ leagueId: league.id, teamName: name || fallback || 'Player' })
      hapticSuccess()
      setShowSoloModal(false)
      setDisplayName('')
      await reloadTeams()
    } catch (err) {
      alert(err.message || 'Error joining league')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCreateTeam = async () => {
    if (!teamName.trim() || !league?.id) return
    setActionLoading(true)
    try {
      await createTeam({ leagueId: league.id, name: teamName.trim(), userId: user.id })
      hapticSuccess()
      setShowCreateModal(false)
      setTeamName('')
      await reloadTeams()
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
    const shareText = `Join my Fantasy League on Vibe Rise! Code: ${userTeam.invite_code} — ${shareUrl}`

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Join the League', text: shareText })
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(shareText)
      alert('Share link copied to clipboard!')
    }
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
          <button className="lo-back" onClick={() => navigate('/me')}>←</button>
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
        <button className="lo-back" onClick={() => navigate('/me')}>←</button>
        <h2 className="lo-toolbar-title">Fantasy League</h2>
      </div>

      {/* Hero Card */}
      <div className="lo-hero">
        <span className="lo-hero-label">
          {currentWeek === 0 ? 'Coming Soon' :
           currentWeek <= (league.num_weeks || 4) ? `Week ${currentWeek}` : 'Season Complete'}
        </span>
        <h2 className="lo-hero-title">{league.name}</h2>
        <p className="lo-hero-sub">
          {currentWeek === 0 && getDaysUntilStart() !== null && (
            <>Starts in {getDaysUntilStart()} day{getDaysUntilStart() !== 1 ? 's' : ''}!</>
          )}
          {currentWeek >= 1 && currentWeek <= (league.num_weeks || 4) && (
            <>{league.num_weeks}-week season • {teams.length} player{teams.length !== 1 ? 's' : ''} competing</>
          )}
          {league.status === 'completed' && (
            <>Final results are in!</>
          )}
        </p>

        {/* Join Actions */}
        {!isOnTeam && league.status !== 'completed' ? (
          <div className="lo-hero-actions">
            <button className="lo-cta" onClick={() => { hapticLight(); setShowSoloModal(true) }}>
              Join Solo <span>→</span>
            </button>
          </div>
        ) : isOnTeam && (
          <div className="lo-my-team-badge">
            <span>Playing as: <strong>{userTeam.name}</strong></span>
            <button className="lo-share-btn" onClick={handleShare}>
              Invite
            </button>
          </div>
        )}
      </div>

      {/* View Matchup card */}
      {isOnTeam && currentWeek > 0 && (
        <div
          className="league-matchup-card"
          onClick={() => { hapticLight(); navigate('/league/matchup') }}
          style={{
            background: 'linear-gradient(135deg, rgba(94,23,235,0.06), rgba(233,162,59,0.06))',
            border: '1px solid rgba(94,23,235,0.12)',
            borderRadius: '14px', padding: '14px 18px',
            margin: '0 16px 16px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            transition: 'all 0.2s',
          }}
        >
          <span style={{ fontWeight: 700, color: '#5e17eb', fontSize: '0.9rem' }}>
            ⚔️ View This Week's Matchup
          </span>
          <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>→</span>
        </div>
      )}

      {/* Guide link */}
      <a
        href="/league/guide"
        style={{
          display: 'block',
          textAlign: 'center',
          margin: '0 16px 12px',
          color: '#5e17eb',
          fontWeight: 600,
          fontSize: '0.85rem',
          textDecoration: 'none',
        }}
      >
        New to Fantasy? Read the full guide →
      </a>

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

      {/* Tab Content */}
      {activeTab === 'standings' && (
        <LeagueLeaderboard
          standings={standings}
          matchups={matchups}
          userTeam={userTeam}
          league={league}
          teams={teams}
          getCurrentWeek={getCurrentWeek}
          getWeekMatchups={getWeekMatchups}
          getWeekDateRange={getWeekDateRange}
          fetchLiveTeamScores={fetchLiveTeamScores}
          memberNames={memberNames}
        />
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
                  <strong>Join the League</strong>
                  <p>Play solo or form a team. Complete quests to earn points across 3 categories.</p>
                </div>
              </div>
              <div className="lo-rule">
                <span className="lo-rule-num">2</span>
                <div>
                  <strong>Compete Weekly</strong>
                  <p>Head-to-head matchups each week. Your quest scores compete across 3 categories.</p>
                </div>
              </div>
              <div className="lo-rule">
                <span className="lo-rule-num">3</span>
                <div>
                  <strong>Win Categories</strong>
                  <p>Win 2+ of 3 categories = Win (3 pts). Tie 1-1 = Draw (1 pt each). Win 0 = Loss (0 pts).</p>
                </div>
              </div>
            </div>

            <h4 className="lo-rules-subtitle">3 Scoring Categories</h4>
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

      {/* Join Solo Modal */}
      {showSoloModal && (
        <div className="lo-modal-overlay" onClick={() => setShowSoloModal(false)}>
          <div className="lo-modal" onClick={e => e.stopPropagation()}>
            <div className="lo-modal-header">
              <h3>Join the League</h3>
              <button className="lo-modal-close" onClick={() => setShowSoloModal(false)}>×</button>
            </div>
            <div className="lo-modal-body">
              <div className="lo-field">
                <label>Display Name (optional)</label>
                <input
                  type="text"
                  placeholder="Defaults to your first name"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  maxLength={30}
                  autoFocus
                />
              </div>
              <div className="lo-modal-actions">
                <button className="lo-cancel" onClick={() => setShowSoloModal(false)}>Cancel</button>
                <button
                  className="lo-save"
                  onClick={handleJoinSolo}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Joining...' : 'Join'}
                </button>
              </div>
            </div>
          </div>
        </div>
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
    </div>
  )
}
