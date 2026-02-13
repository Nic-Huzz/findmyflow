/**
 * LeagueAdmin.jsx — /league/admin
 * Create league, manage matchups, content approval, calculate week results
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { useLeagueData } from '../../hooks/useLeagueData'
import {
  createLeague, updateLeagueStatus,
  createMatchup, deleteMatchup,
  getTeams, getContentSubmissions, reviewContent,
} from '../../lib/league/leagueService'
import { calculateWeekResults } from '../../lib/league/leagueScoring'
import { LEAGUE_STATUSES } from '../../lib/league/leagueConfig'
import { fetchStats } from '../../lib/adminService'
import { hapticLight, hapticSuccess, hapticError } from '../../lib/haptics'
import './LeagueAdmin.css'

export default function LeagueAdmin() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Admin authorization
  const [authorized, setAuthorized] = useState(null) // null = checking

  const {
    loading: leagueLoading, league, setLeague, teams,
    matchups, loadLeagueData, reloadStandings,
  } = useLeagueData()

  // Create League form
  const [leagueName, setLeagueName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [numWeeks, setNumWeeks] = useState(4)
  const [creating, setCreating] = useState(false)

  // Matchup creation
  const [matchWeek, setMatchWeek] = useState(1)
  const [teamAId, setTeamAId] = useState('')
  const [teamBId, setTeamBId] = useState('')
  const [creatingMatchup, setCreatingMatchup] = useState(false)

  // Week calculation
  const [calcWeek, setCalcWeek] = useState(1)
  const [calcStart, setCalcStart] = useState('')
  const [calcEnd, setCalcEnd] = useState('')
  const [calculating, setCalculating] = useState(false)
  const [calcResult, setCalcResult] = useState(null)

  // Content approval
  const [contentSubs, setContentSubs] = useState([])
  const [loadingContent, setLoadingContent] = useState(false)

  // Status management
  const [updatingStatus, setUpdatingStatus] = useState(false)

  // Active tab
  const [activeTab, setActiveTab] = useState('league') // league | matchups | scoring | content

  // Verify admin access on mount
  useEffect(() => {
    if (!user?.id) return
    checkAdminAccess()
  }, [user?.id])

  async function checkAdminAccess() {
    try {
      await fetchStats()
      setAuthorized(true)
    } catch (err) {
      if (err.message.includes('Not authorized') || err.message.includes('403')) {
        setAuthorized(false)
      } else {
        console.error('Admin access check error:', err)
        setAuthorized(true) // Network error fallback
      }
    }
  }

  // Load content submissions
  useEffect(() => {
    if (league?.id && activeTab === 'content') {
      loadContent()
    }
  }, [league?.id, activeTab])

  async function loadContent() {
    setLoadingContent(true)
    try {
      const data = await getContentSubmissions(league.id, { status: 'pending' })
      setContentSubs(data)
    } catch (err) {
      console.error('Error loading content:', err)
    } finally {
      setLoadingContent(false)
    }
  }

  // ============================================
  // Actions
  // ============================================

  async function handleCreateLeague() {
    if (!leagueName.trim()) return
    setCreating(true)
    try {
      const newLeague = await createLeague({
        name: leagueName.trim(),
        startDate: startDate || null,
        endDate: endDate || null,
        numWeeks,
        userId: user.id,
      })
      hapticSuccess()
      setLeague(newLeague)
      setLeagueName('')
      setStartDate('')
      setEndDate('')
      await loadLeagueData()
    } catch (err) {
      alert(err.message || 'Error creating league')
      hapticError()
    } finally {
      setCreating(false)
    }
  }

  async function handleStatusChange(newStatus) {
    if (!league?.id) return
    setUpdatingStatus(true)
    try {
      const updated = await updateLeagueStatus(league.id, newStatus)
      hapticSuccess()
      setLeague(updated)
    } catch (err) {
      alert(err.message || 'Error updating status')
    } finally {
      setUpdatingStatus(false)
    }
  }

  async function handleCreateMatchup() {
    if (!teamAId || !teamBId || teamAId === teamBId || !league?.id) return
    setCreatingMatchup(true)
    try {
      await createMatchup({
        leagueId: league.id,
        weekNumber: matchWeek,
        weekStart: null,
        teamAId,
        teamBId,
      })
      hapticSuccess()
      setTeamAId('')
      setTeamBId('')
      await reloadStandings()
    } catch (err) {
      alert(err.message || 'Error creating matchup')
    } finally {
      setCreatingMatchup(false)
    }
  }

  async function handleDeleteMatchup(matchupId) {
    if (!confirm('Delete this matchup?')) return
    try {
      await deleteMatchup(matchupId)
      hapticLight()
      await reloadStandings()
    } catch (err) {
      alert(err.message || 'Error deleting matchup')
    }
  }

  async function handleCalculateWeek() {
    if (!league?.id || !calcStart || !calcEnd) return
    setCalculating(true)
    setCalcResult(null)
    try {
      const results = await calculateWeekResults(league.id, calcWeek, calcStart, calcEnd)
      hapticSuccess()
      setCalcResult(results)
      await reloadStandings()
    } catch (err) {
      alert(err.message || 'Error calculating results')
      hapticError()
    } finally {
      setCalculating(false)
    }
  }

  async function handleReviewContent(submissionId, status) {
    try {
      await reviewContent(submissionId, {
        status,
        reviewedBy: user.id,
        reviewNote: null,
      })
      hapticSuccess()
      await loadContent()
    } catch (err) {
      alert(err.message || 'Error reviewing content')
    }
  }

  const getTeamNameById = (id) => teams.find(t => t.id === id)?.name || 'Unknown'

  // ============================================
  // Loading
  // ============================================

  if (leagueLoading || authorized === null) {
    return (
      <div className="league-admin">
        <div className="la-loading">
          <div className="la-spinner" />
          <p>{authorized === null ? 'Verifying admin access...' : 'Loading...'}</p>
        </div>
      </div>
    )
  }

  if (authorized === false) {
    return (
      <div className="league-admin">
        <div className="la-toolbar">
          <button className="la-back" onClick={() => navigate('/league')}>←</button>
          <h2 className="la-toolbar-title">League Admin</h2>
        </div>
        <div className="la-loading">
          <span style={{ fontSize: '3rem' }}>🔒</span>
          <p style={{ fontWeight: 700 }}>Not Authorized</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>You don't have admin access.</p>
          <button className="la-cta" style={{ maxWidth: '280px' }} onClick={() => navigate('/league')}>
            Go to League <span>→</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="league-admin">
      {/* Toolbar */}
      <div className="la-toolbar">
        <button className="la-back" onClick={() => navigate('/league')}>←</button>
        <h2 className="la-toolbar-title">League Admin</h2>
      </div>

      {/* Tabs */}
      <div className="la-tabs">
        {['league', 'matchups', 'scoring', 'content'].map(tab => (
          <button
            key={tab}
            className={`la-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => { hapticLight(); setActiveTab(tab) }}
          >
            {tab === 'league' ? 'League' :
             tab === 'matchups' ? 'Matchups' :
             tab === 'scoring' ? 'Scoring' : 'Content'}
          </button>
        ))}
      </div>

      {/* ============ LEAGUE TAB ============ */}
      {activeTab === 'league' && (
        <section className="la-section">
          {!league ? (
            <div className="la-card">
              <h3 className="la-card-title">Create a League</h3>
              <div className="la-field">
                <label>League Name</label>
                <input
                  type="text"
                  placeholder="e.g. Season 1"
                  value={leagueName}
                  onChange={e => setLeagueName(e.target.value)}
                />
              </div>
              <div className="la-field-row">
                <div className="la-field">
                  <label>Start Date</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                </div>
                <div className="la-field">
                  <label>End Date</label>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>
              </div>
              <div className="la-field">
                <label>Number of Weeks</label>
                <input
                  type="number" min="1" max="12"
                  value={numWeeks}
                  onChange={e => setNumWeeks(parseInt(e.target.value) || 4)}
                />
              </div>
              <button
                className="la-cta"
                onClick={handleCreateLeague}
                disabled={creating || !leagueName.trim()}
              >
                {creating ? 'Creating...' : 'Create League'} <span>→</span>
              </button>
            </div>
          ) : (
            <>
              <div className="la-hero">
                <span className="la-hero-label">Managing</span>
                <h2 className="la-hero-title">{league.name}</h2>
                <p className="la-hero-sub">
                  Status: <strong>{league.status}</strong> • {league.num_weeks} weeks
                  {league.start_date && <> • Starts {league.start_date}</>}
                </p>
              </div>

              <div className="la-card">
                <h3 className="la-card-title">Change Status</h3>
                <div className="la-status-btns">
                  {Object.values(LEAGUE_STATUSES).map(s => (
                    <button
                      key={s}
                      className={`la-status-btn ${league.status === s ? 'active' : ''}`}
                      onClick={() => handleStatusChange(s)}
                      disabled={updatingStatus || league.status === s}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="la-card">
                <h3 className="la-card-title">Teams ({teams.length})</h3>
                {teams.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>No teams yet</p>
                ) : (
                  teams.map(t => (
                    <div key={t.id} className="la-team-row">
                      <span className="la-team-name">{t.name}</span>
                      <span className="la-team-code">{t.invite_code}</span>
                      <span className="la-team-count">
                        {(t.fantasy_team_members || []).length}/3
                      </span>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </section>
      )}

      {/* ============ MATCHUPS TAB ============ */}
      {activeTab === 'matchups' && league && (
        <section className="la-section">
          <div className="la-card">
            <h3 className="la-card-title">Create Matchup</h3>
            <div className="la-field">
              <label>Week</label>
              <input
                type="number" min="1" max={league.num_weeks}
                value={matchWeek}
                onChange={e => setMatchWeek(parseInt(e.target.value) || 1)}
              />
            </div>
            <div className="la-field-row">
              <div className="la-field">
                <label>Team A</label>
                <select value={teamAId} onChange={e => setTeamAId(e.target.value)}>
                  <option value="">Select...</option>
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div className="la-field la-vs">vs</div>
              <div className="la-field">
                <label>Team B</label>
                <select value={teamBId} onChange={e => setTeamBId(e.target.value)}>
                  <option value="">Select...</option>
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              className="la-cta"
              onClick={handleCreateMatchup}
              disabled={creatingMatchup || !teamAId || !teamBId || teamAId === teamBId}
            >
              {creatingMatchup ? 'Creating...' : 'Add Matchup'} <span>→</span>
            </button>
          </div>

          {/* Existing Matchups */}
          {Array.from({ length: league.num_weeks }, (_, i) => i + 1).map(weekNum => {
            const weekMatchups = matchups.filter(m => m.week_number === weekNum)
            if (weekMatchups.length === 0) return null
            return (
              <div key={weekNum} className="la-card">
                <h4 className="la-week-title">Week {weekNum}</h4>
                {weekMatchups.map(m => (
                  <div key={m.id} className="la-matchup-item">
                    <span>{getTeamNameById(m.team_a_id)} vs {getTeamNameById(m.team_b_id)}</span>
                    {m.calculated_at ? (
                      <span className="la-matchup-result">
                        {m.team_a_match_points}-{m.team_b_match_points}
                      </span>
                    ) : (
                      <button
                        className="la-delete-btn"
                        onClick={() => handleDeleteMatchup(m.id)}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )
          })}
        </section>
      )}

      {/* ============ SCORING TAB ============ */}
      {activeTab === 'scoring' && league && (
        <section className="la-section">
          <div className="la-card">
            <h3 className="la-card-title">Calculate Week Results</h3>
            <div className="la-field">
              <label>Week Number</label>
              <input
                type="number" min="1" max={league.num_weeks}
                value={calcWeek}
                onChange={e => setCalcWeek(parseInt(e.target.value) || 1)}
              />
            </div>
            <div className="la-field-row">
              <div className="la-field">
                <label>Week Start Date</label>
                <input type="date" value={calcStart} onChange={e => setCalcStart(e.target.value)} />
              </div>
              <div className="la-field">
                <label>Week End Date</label>
                <input type="date" value={calcEnd} onChange={e => setCalcEnd(e.target.value)} />
              </div>
            </div>
            <button
              className="la-cta"
              onClick={handleCalculateWeek}
              disabled={calculating || !calcStart || !calcEnd}
            >
              {calculating ? 'Calculating...' : `Calculate Week ${calcWeek}`} <span>→</span>
            </button>
          </div>

          {calcResult && (
            <div className="la-card">
              <h3 className="la-card-title">Results — Week {calcWeek}</h3>
              {calcResult.map(m => (
                <div key={m.id} className="la-result-item">
                  <div className="la-result-teams">
                    <strong>{getTeamNameById(m.team_a_id)}</strong>
                    <span className="la-result-score">
                      {m.team_a_categories_won} - {m.team_b_categories_won}
                    </span>
                    <strong>{getTeamNameById(m.team_b_id)}</strong>
                  </div>
                  <div className="la-result-points">
                    {m.team_a_match_points} pts — {m.team_b_match_points} pts
                  </div>
                  {m.category_results && (
                    <div className="la-result-categories">
                      {m.category_results.map(cr => (
                        <div key={cr.category} className="la-cat-row">
                          <span>{cr.label}</span>
                          <span>{cr.teamAScore} - {cr.teamBScore}</span>
                          <span className={`la-cat-winner ${cr.winner || ''}`}>
                            {cr.winner === 'a' ? '←' : cr.winner === 'b' ? '→' : '—'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ============ CONTENT TAB ============ */}
      {activeTab === 'content' && league && (
        <section className="la-section">
          <div className="la-section-header">
            <div className="la-section-icon">📋</div>
            <span className="la-section-title">Pending Approvals ({contentSubs.length})</span>
          </div>

          {loadingContent ? (
            <div className="la-card" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading...
            </div>
          ) : contentSubs.length === 0 ? (
            <div className="la-card" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
              No pending submissions!
            </div>
          ) : (
            contentSubs.map(sub => (
              <div key={sub.id} className="la-card la-content-item">
                <div className="la-content-header">
                  <span className="la-content-type">{sub.content_type}</span>
                  <span className="la-content-week">Week {sub.week_number}</span>
                </div>
                {sub.description && <p className="la-content-desc">{sub.description}</p>}
                {sub.link_url && (
                  <a href={sub.link_url} target="_blank" rel="noopener noreferrer" className="la-content-link">
                    View ↗
                  </a>
                )}
                <div className="la-content-actions">
                  <button
                    className="la-approve-btn"
                    onClick={() => handleReviewContent(sub.id, 'approved')}
                  >
                    Approve (+{sub.points_value} pts)
                  </button>
                  <button
                    className="la-reject-btn"
                    onClick={() => handleReviewContent(sub.id, 'rejected')}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </section>
      )}
    </div>
  )
}
