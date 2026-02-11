import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
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
