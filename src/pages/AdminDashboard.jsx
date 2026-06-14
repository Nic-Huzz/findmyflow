import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabaseClient'
import { fetchUsers, fetchStats } from '../lib/adminService'
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

    // Load engagement metrics from events table
    try {
      const now = new Date()
      const today = now.toISOString().split('T')[0]
      const day7 = new Date(now - 7 * 86400000).toISOString().split('T')[0]
      const day30 = new Date(now - 30 * 86400000).toISOString().split('T')[0]

      const [
        { count: appOpens7d },
        { count: appOpens1d },
        { count: wahoos7d },
        { count: dailyCheckins7d },
        { count: leagueJoins },
        { data: eventCounts },
      ] = await Promise.all([
        supabase.from('events').select('id', { count: 'exact', head: true }).eq('name', 'app_opened').gte('created_at', day7),
        supabase.from('events').select('id', { count: 'exact', head: true }).eq('name', 'app_opened').gte('created_at', today),
        supabase.from('events').select('id', { count: 'exact', head: true }).eq('name', 'wahoo_completed').gte('created_at', day7),
        supabase.from('events').select('id', { count: 'exact', head: true }).eq('name', 'daily_checkin').gte('created_at', day7),
        supabase.from('events').select('id', { count: 'exact', head: true }).eq('name', 'league_joined'),
        supabase.from('events').select('name, created_at').gte('created_at', day7).in('name', ['app_opened', 'wahoo_completed', 'daily_checkin', 'tune_practice', 'healing_completed']),
      ])

      // Calculate DAU from unique sessions per day
      const dailyUsers = {}
      ;(eventCounts || []).forEach(e => {
        const day = e.created_at?.substring(0, 10)
        if (day) {
          if (!dailyUsers[day]) dailyUsers[day] = new Set()
          dailyUsers[day].add(e.session_id || 'unknown')
        }
      })
      const activeDays = Object.keys(dailyUsers).length || 1

      setEngagement({
        appOpens7d: appOpens7d || 0,
        appOpens1d: appOpens1d || 0,
        wahoos7d: wahoos7d || 0,
        dailyCheckins7d: dailyCheckins7d || 0,
        leagueJoins: leagueJoins || 0,
        eventsPerDay: Math.round((eventCounts?.length || 0) / activeDays),
      })
    } catch (err) {
      console.warn('Engagement metrics error:', err)
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
          <h2 className="ad-hero-title">Vibe Rise Metrics</h2>
          <div className="ad-stats-grid">
            <div className="ad-stat">
              <span className="ad-stat-value ad-stat-gold">{engagement.appOpens1d}</span>
              <span className="ad-stat-label">Opens Today</span>
            </div>
            <div className="ad-stat">
              <span className="ad-stat-value">{engagement.appOpens7d}</span>
              <span className="ad-stat-label">Opens (7d)</span>
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
              <span className="ad-stat-value">{engagement.eventsPerDay}</span>
              <span className="ad-stat-label">Events/Day</span>
            </div>
          </div>
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
