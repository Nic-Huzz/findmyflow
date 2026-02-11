import { useState, useMemo } from 'react'

function getActivityColor(lastActive) {
  if (!lastActive) return 'var(--text-muted)'
  const daysAgo = (Date.now() - new Date(lastActive).getTime()) / (1000 * 60 * 60 * 24)
  if (daysAgo < 3) return '#10b981'
  if (daysAgo < 7) return '#E9A23B'
  return '#ef4444'
}

function formatTimeAgo(dateStr) {
  if (!dateStr) return 'Never'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return `${Math.floor(days / 30)}mo ago`
}

function getInitials(name, email) {
  if (name) {
    const parts = name.trim().split(/\s+/)
    return parts.length > 1
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase()
  }
  return email ? email.slice(0, 2).toUpperCase() : '??'
}

export default function UserTable({ users, onNudge }) {
  const [sortKey, setSortKey] = useState('last_active')
  const [sortDir, setSortDir] = useState('desc')

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const sorted = useMemo(() => {
    const copy = [...users]
    copy.sort((a, b) => {
      let aVal = a[sortKey]
      let bVal = b[sortKey]

      // Handle nulls
      if (aVal == null && bVal == null) return 0
      if (aVal == null) return 1
      if (bVal == null) return -1

      // Dates
      if (sortKey === 'last_active' || sortKey === 'created_at') {
        aVal = new Date(aVal).getTime()
        bVal = new Date(bVal).getTime()
      }

      // Strings
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase()
        bVal = (bVal || '').toLowerCase()
      }

      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return copy
  }, [users, sortKey, sortDir])

  const sortIndicator = (key) => {
    if (sortKey !== key) return ''
    return sortDir === 'asc' ? ' \u2191' : ' \u2193'
  }

  if (users.length === 0) {
    return (
      <div className="ad-empty">
        <span className="ad-empty-icon">👥</span>
        <h3 className="ad-empty-title">No users found</h3>
        <p className="ad-empty-text">Try adjusting your filter or search.</p>
      </div>
    )
  }

  return (
    <div className="ad-table-wrap">
      <table className="ad-table">
        <thead>
          <tr>
            <th onClick={() => handleSort('display_name')}>
              User{sortIndicator('display_name')}
            </th>
            <th className="ad-hide-mobile" onClick={() => handleSort('current_stage')}>
              Stage{sortIndicator('current_stage')}
            </th>
            <th onClick={() => handleSort('quest_count')}>
              Quests{sortIndicator('quest_count')}
            </th>
            <th onClick={() => handleSort('last_active')}>
              Active{sortIndicator('last_active')}
            </th>
            <th className="ad-hide-mobile">Notifs</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(user => (
            <tr key={user.id}>
              <td>
                <div className="ad-user-cell">
                  <div className="ad-avatar">
                    {getInitials(user.display_name, user.email)}
                  </div>
                  <div className="ad-user-info">
                    <span className="ad-user-name">
                      {user.display_name || 'Unnamed'}
                    </span>
                    <span className="ad-user-email">{user.email}</span>
                  </div>
                </div>
              </td>
              <td className="ad-hide-mobile">
                <span className="ad-stage-badge">
                  {user.current_stage != null ? `Stage ${user.current_stage}` : '—'}
                </span>
              </td>
              <td>
                <span className="ad-quest-count">{user.quest_count}</span>
              </td>
              <td>
                <span
                  className="ad-activity"
                  style={{ color: getActivityColor(user.last_active) }}
                >
                  {formatTimeAgo(user.last_active)}
                </span>
              </td>
              <td className="ad-hide-mobile">
                <span className={`ad-notif-dot ${user.has_push ? 'on' : 'off'}`} />
              </td>
              <td>
                <button
                  className="ad-nudge-btn"
                  onClick={() => onNudge(user)}
                  disabled={!user.has_push}
                  title={user.has_push ? 'Send nudge' : 'No push subscription'}
                >
                  📨
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
