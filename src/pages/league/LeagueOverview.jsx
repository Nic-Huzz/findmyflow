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
import { supabase } from '../../lib/supabaseClient'
import { STAGE_CONFIG } from '../../lib/stageConfig'
import LeagueLeaderboard from '../../components/league/LeagueLeaderboard'
import './LeagueOverview.css'

export default function LeagueOverview() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const {
    loading, league, teams, userTeam, standings, matchups,
    isOnTeam, leagueExists, reloadTeams, getCurrentWeek, getWeekMatchups,
    getWeekDateRange, fetchLiveTeamScores, memberNames,
    userNomination, changeNomination,
  } = useLeagueData()

  // UI State
  const [activeTab, setActiveTab] = useState('standings') // standings | schedule | rules
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [teamName, setTeamName] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [projects, setProjects] = useState([])
  const [selectedProjectId, setSelectedProjectId] = useState(null) // for create/join modals
  const [changeProjectId, setChangeProjectId] = useState(null) // for weekly change modal
  const [showProjectPicker, setShowProjectPicker] = useState(false) // for weekly change

  // Handle ?join= query param
  useEffect(() => {
    const joinParam = searchParams.get('join')
    if (joinParam && !isOnTeam) {
      setJoinCode(joinParam.toUpperCase())
      setShowJoinModal(true)
    }
  }, [searchParams, isOnTeam])

  // Load user's active projects when needed
  const loadProjects = async () => {
    if (!user?.id) return
    const { data } = await supabase
      .from('user_projects')
      .select('id, name, description, current_stage, is_primary')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false })
    setProjects(data || [])
    // Auto-select primary or first
    if (data?.length && !selectedProjectId) {
      const primary = data.find(p => p.is_primary)
      setSelectedProjectId(primary?.id || data[0].id)
    }
  }

  useEffect(() => {
    if (showJoinModal || showCreateModal || showProjectPicker) {
      loadProjects()
    }
  }, [showJoinModal, showCreateModal, showProjectPicker])

  const currentWeek = getCurrentWeek()

  // ============================================
  // Actions
  // ============================================

  const handleCreateTeam = async () => {
    if (!teamName.trim() || !league?.id || !selectedProjectId) return
    setActionLoading(true)
    try {
      await createTeam({ leagueId: league.id, name: teamName.trim(), userId: user.id, projectId: selectedProjectId })
      hapticSuccess()
      setShowCreateModal(false)
      setTeamName('')
      setSelectedProjectId(null)
      await reloadTeams()
      setShowShareModal(true)
    } catch (err) {
      alert(err.message || 'Error creating team')
    } finally {
      setActionLoading(false)
    }
  }

  const handleJoinTeam = async () => {
    if (!joinCode.trim() || !selectedProjectId) return
    setActionLoading(true)
    try {
      await joinTeam({ inviteCode: joinCode.trim(), userId: user.id, projectId: selectedProjectId })
      hapticSuccess()
      setShowJoinModal(false)
      setJoinCode('')
      setSelectedProjectId(null)
      await reloadTeams()
    } catch (err) {
      alert(err.message || 'Error joining team')
    } finally {
      setActionLoading(false)
    }
  }

  const handleChangeNomination = async (projectId) => {
    try {
      await changeNomination(projectId)
      hapticSuccess()
      setShowProjectPicker(false)
    } catch (err) {
      alert(err.message || 'Error changing project')
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

  const getStageInfo = (stageNumber) => STAGE_CONFIG[stageNumber] || { name: `Stage ${stageNumber}`, icon: '📍' }

  const renderProjectPicker = (onSelect = setSelectedProjectId, selected = selectedProjectId) => (
    <div className="lo-project-picker">
      <label className="lo-picker-label">Pick your Business project</label>
      <p className="lo-picker-hint">Your Business score will come from quests you complete for this project. You can change it each week.</p>
      <div className="lo-project-list">
        {projects.map(p => {
          const stage = getStageInfo(p.current_stage)
          return (
            <div
              key={p.id}
              className={`lo-project-option ${selected === p.id ? 'selected' : ''}`}
              onClick={() => onSelect(p.id)}
            >
              <div className="lo-project-option-info">
                <span className="lo-project-option-name">{p.name}</span>
                <span className="lo-project-option-stage">{stage.icon} {stage.name}</span>
              </div>
              <span className="lo-project-option-check">{selected === p.id ? '✓' : '○'}</span>
            </div>
          )
        })}
      </div>
      {projects.length === 0 && (
        <p className="lo-picker-empty">No active projects found. Complete onboarding first.</p>
      )}
    </div>
  )

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

        {/* Nominated project display */}
        {isOnTeam && userNomination && (
          <div className="lo-nomination-badge" style={{ position: 'relative', zIndex: 1 }}>
            <div className="lo-nomination-info">
              <span className="lo-nomination-label">Business Project</span>
              <span className="lo-nomination-name">{userNomination.user_projects?.name || 'Unknown'}</span>
            </div>
            {league.status === 'active' && (
              <button className="lo-change-btn" onClick={() => {
                hapticLight()
                setChangeProjectId(userNomination?.project_id || null)
                setShowProjectPicker(true)
              }}>
                Change
              </button>
            )}
          </div>
        )}

        {/* Prompt to nominate if on team but no nomination yet */}
        {isOnTeam && !userNomination && league.status === 'active' && (
          <div className="lo-nomination-badge" style={{ position: 'relative', zIndex: 1 }}>
            <div className="lo-nomination-info">
              <span className="lo-nomination-label">Business Project</span>
              <span className="lo-nomination-name" style={{ color: 'rgba(255,255,255,0.6)' }}>Not set</span>
            </div>
            <button className="lo-change-btn" onClick={() => {
              hapticLight()
              setChangeProjectId(null)
              setShowProjectPicker(true)
            }}>
              Select
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
              {renderProjectPicker()}
              <div className="lo-modal-actions">
                <button className="lo-cancel" onClick={() => setShowJoinModal(false)}>Cancel</button>
                <button
                  className="lo-save"
                  onClick={handleJoinTeam}
                  disabled={actionLoading || !joinCode.trim() || !selectedProjectId}
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
              {renderProjectPicker()}
              <div className="lo-modal-actions">
                <button className="lo-cancel" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button
                  className="lo-save"
                  onClick={handleCreateTeam}
                  disabled={actionLoading || !teamName.trim() || !selectedProjectId}
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

      {/* Change Project Nomination Modal */}
      {showProjectPicker && (
        <div className="lo-modal-overlay" onClick={() => setShowProjectPicker(false)}>
          <div className="lo-modal" onClick={e => e.stopPropagation()}>
            <div className="lo-modal-header">
              <h3>Change Business Project</h3>
              <button className="lo-modal-close" onClick={() => setShowProjectPicker(false)}>×</button>
            </div>
            <div className="lo-modal-body">
              <p className="lo-picker-hint" style={{ marginBottom: 16 }}>
                Week {currentWeek}: Choose which project scores count for Business this week. Previous weeks stay locked.
              </p>
              <div className="lo-project-list">
                {projects.map(p => {
                  const stage = getStageInfo(p.current_stage)
                  const isCurrent = userNomination?.project_id === p.id
                  return (
                    <div
                      key={p.id}
                      className={`lo-project-option ${changeProjectId === p.id ? 'selected' : ''}`}
                      onClick={() => setChangeProjectId(p.id)}
                    >
                      <div className="lo-project-option-info">
                        <span className="lo-project-option-name">
                          {p.name} {isCurrent ? '(current)' : ''}
                        </span>
                        <span className="lo-project-option-stage">{stage.icon} {stage.name}</span>
                      </div>
                      <span className="lo-project-option-check">{changeProjectId === p.id ? '✓' : '○'}</span>
                    </div>
                  )
                })}
              </div>
              <div className="lo-modal-actions">
                <button className="lo-cancel" onClick={() => setShowProjectPicker(false)}>Cancel</button>
                <button
                  className="lo-save"
                  onClick={() => handleChangeNomination(changeProjectId)}
                  disabled={!changeProjectId}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
