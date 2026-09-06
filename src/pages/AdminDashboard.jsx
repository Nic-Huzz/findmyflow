import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { fetchUsers, fetchStats, fetchEngagement, fetchLeads, fetchFunnelMetrics } from '../lib/adminService'
import UserTable from '../components/admin/UserTable'
import NudgeModal from '../components/admin/NudgeModal'
import './AdminDashboard.css'

export default function AdminDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(null) // null = checking
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [nudgeUser, setNudgeUser] = useState(null)
  const [toast, setToast] = useState(null)
  const debounceRef = useRef(null)
  const [engagement, setEngagement] = useState(null)
  const [leads, setLeads] = useState(null)
  const [funnelMetrics, setFunnelMetrics] = useState(null)

  // Initial load — verify admin access and fetch stats
  useEffect(() => {
    if (!user?.id) return
    loadData()
  }, [user?.id])

  // Re-fetch users when filter or search changes (with debounce on search)
  useEffect(() => {
    if (!user?.id || authorized !== true) return

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      loadUsers()
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [filter, search, authorized, user?.id])

  async function loadData() {
    setLoading(true)
    try {
      const statsData = await fetchStats()
      setStats(statsData)
      setAuthorized(true)
    } catch (err) {
      if (err.message.includes('Not authorized') || err.message.includes('403')) {
        setAuthorized(false)
      } else {
        console.error('Admin stats error:', err)
        // Network error — still try to show the page
        setAuthorized(true)
      }
    }

    // Load engagement metrics via edge function (service_role bypasses RLS on events table)
    try {
      const engData = await fetchEngagement()
      setEngagement(engData)
    } catch (err) {
      console.warn('Engagement metrics error:', err)
    }

    // Load lead capture metrics
    try {
      const leadsData = await fetchLeads()
      setLeads(leadsData)
    } catch (err) {
      console.warn('Leads metrics error:', err)
    }

    // Load funnel drop-off metrics
    try {
      const funnelData = await fetchFunnelMetrics()
      setFunnelMetrics(funnelData)
    } catch (err) {
      console.warn('Funnel metrics error:', err)
    }

    try {
      const usersData = await fetchUsers()
      setUsers(usersData.users || [])
    } catch (err) {
      console.error('Admin users error:', err)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  async function loadUsers() {
    try {
      const data = await fetchUsers(
        filter === 'all' ? undefined : filter,
        search || undefined
      )
      setUsers(data.users || [])
    } catch (err) {
      console.error('Error loading users:', err)
    }
  }

  function handleNudgeSent(result) {
    setToast(result.message || 'Nudge sent!')
    setTimeout(() => setToast(null), 4000)
  }

  // Loading state
  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="ad-loading">
          <div className="ad-spinner" />
          <p>Verifying admin access...</p>
        </div>
      </div>
    )
  }

  // Not authorized
  if (authorized === false) {
    return (
      <div className="admin-dashboard">
        <div className="ad-empty">
          <span className="ad-empty-icon">🔒</span>
          <h3 className="ad-empty-title">Not Authorized</h3>
          <p className="ad-empty-text">You don't have admin access.</p>
          <button className="ad-cta" onClick={() => navigate('/me')}>
            Go to Dashboard <span>→</span>
          </button>
        </div>
      </div>
    )
  }

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'inactive', label: 'Inactive' },
    { key: 'no_notifications', label: 'No Notifs' },
  ]

  return (
    <div className="admin-dashboard">
      {/* Toolbar */}
      <div className="ad-toolbar">
        <button className="ad-back" onClick={() => navigate('/me')}>←</button>
        <h2 className="ad-toolbar-title">Admin</h2>
      </div>

      {/* Hero Stats */}
      {stats && (
        <div className="ad-hero">
          <span className="ad-hero-label">Command Center</span>
          <h2 className="ad-hero-title">User Dashboard</h2>
          <div className="ad-stats-grid">
            <div className="ad-stat">
              <span className="ad-stat-value">{stats.totalUsers}</span>
              <span className="ad-stat-label">Total Users</span>
            </div>
            <div className="ad-stat">
              <span className="ad-stat-value ad-stat-gold">{stats.activeThisWeek}</span>
              <span className="ad-stat-label">Active (7d)</span>
            </div>
            <div className="ad-stat">
              <span className="ad-stat-value">{stats.notificationsEnabled}</span>
              <span className="ad-stat-label">Push Enabled</span>
            </div>
            <div className="ad-stat">
              <span className="ad-stat-value">{stats.avgQuests}</span>
              <span className="ad-stat-label">Avg Quests</span>
            </div>
          </div>
        </div>
      )}

      {/* Engagement Metrics */}
      {engagement && (
        <div className="ad-hero" style={{ marginTop: 12 }}>
          <span className="ad-hero-label">Engagement</span>
          <h2 className="ad-hero-title">Find My Flow Metrics</h2>
          <div className="ad-stats-grid">
            <div className="ad-stat">
              <span className="ad-stat-value ad-stat-gold">{engagement.appOpens1d}</span>
              <span className="ad-stat-label">Opens Today</span>
            </div>
            <div className="ad-stat">
              <span className="ad-stat-value">{engagement.uniqueSessions7d}</span>
              <span className="ad-stat-label">Unique Users (7d)</span>
            </div>
            <div className="ad-stat">
              <span className="ad-stat-value">{engagement.dailyCheckins7d}</span>
              <span className="ad-stat-label">Check-ins (7d)</span>
            </div>
            <div className="ad-stat">
              <span className="ad-stat-value">{engagement.wahoos7d}</span>
              <span className="ad-stat-label">Wahoos (7d)</span>
            </div>
            <div className="ad-stat">
              <span className="ad-stat-value">{engagement.leagueJoins}</span>
              <span className="ad-stat-label">League Joins</span>
            </div>
            <div className="ad-stat">
              <span className="ad-stat-value">{engagement.eventCheckins}</span>
              <span className="ad-stat-label">Event Check-ins</span>
            </div>
          </div>
        </div>
      )}

      {/* Lead Captures */}
      {leads && (
        <div className="ad-hero" style={{ marginTop: 12 }}>
          <span className="ad-hero-label">Lead Magnets</span>
          <h2 className="ad-hero-title">Lead Captures</h2>
          <div className="ad-stats-grid">
            <div className="ad-stat">
              <span className="ad-stat-value ad-stat-gold">{leads.totalLeads}</span>
              <span className="ad-stat-label">Total Leads</span>
            </div>
            <div className="ad-stat">
              <span className="ad-stat-value">{leads.leadsThisWeek}</span>
              <span className="ad-stat-label">This Week</span>
            </div>
            {Object.entries(leads.bySource || {}).map(([source, counts]) => (
              <div className="ad-stat" key={source}>
                <span className="ad-stat-value">{counts.total}</span>
                <span className="ad-stat-label">{source}</span>
              </div>
            ))}
          </div>

          {/* Recent leads list */}
          {leads.recentLeads?.length > 0 && (
            <div className="ad-leads-list">
              {leads.recentLeads.map((lead, i) => (
                <div key={i} className="ad-lead-row">
                  <div className="ad-lead-info">
                    <span className="ad-lead-name">{lead.name || 'Anonymous'}</span>
                    <span className="ad-lead-email">{lead.email}</span>
                  </div>
                  <div className="ad-lead-meta">
                    {lead.dreamText && <span className="ad-lead-dream">"{lead.dreamText}"</span>}
                    <span className="ad-lead-source">{lead.source}</span>
                    <span className="ad-lead-date">{new Date(lead.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Funnel Drop-off */}
      {funnelMetrics && Object.keys(funnelMetrics.funnels || {}).length > 0 && (
        <div className="ad-hero" style={{ marginTop: 12 }}>
          <span className="ad-hero-label">Conversion</span>
          <h2 className="ad-hero-title">Funnel Drop-off (30d)</h2>
          {Object.entries(funnelMetrics.funnels).map(([funnelName, data]) => (
            <div key={funnelName} className="ad-funnel-section">
              <div className="ad-funnel-header">
                <span className="ad-funnel-name">{funnelName.replace(/_/g, ' ')}</span>
                <span className="ad-funnel-count">{data.totalSessions} sessions ({data.recentSessions} this week)</span>
              </div>
              <div className="ad-funnel-steps">
                {data.steps.map((step, i) => {
                  const barWidth = data.steps[0]?.reached > 0
                    ? Math.max(4, Math.round((step.reached / data.steps[0].reached) * 100))
                    : 0
                  return (
                    <div key={step.name} className="ad-funnel-step">
                      <div className="ad-funnel-step-label">
                        <span className="ad-funnel-step-name">{step.name.replace(/_/g, ' ')}</span>
                        <span className="ad-funnel-step-count">{step.reached}</span>
                      </div>
                      <div className="ad-funnel-bar-bg">
                        <div
                          className="ad-funnel-bar"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                      {step.dropOff > 0 && i > 0 && (
                        <span className="ad-funnel-dropoff">-{step.dropOff}%</span>
                      )}
                      {step.avgTimeOnStepSec != null && (
                        <span className="ad-funnel-time">{step.avgTimeOnStepSec}s avg</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters + Search */}
      <div className="ad-controls">
        <div className="ad-filters">
          {filters.map(f => (
            <button
              key={f.key}
              className={`ad-chip ${filter === f.key ? 'active' : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <input
          className="ad-search"
          type="text"
          placeholder="Search name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* User Table */}
      <UserTable users={users} onNudge={setNudgeUser} />

      {/* Nudge Modal */}
      {nudgeUser && (
        <NudgeModal
          user={nudgeUser}
          onClose={() => setNudgeUser(null)}
          onSent={handleNudgeSent}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="ad-toast">{toast}</div>
      )}
    </div>
  )
}
