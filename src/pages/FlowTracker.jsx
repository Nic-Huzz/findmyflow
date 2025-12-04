import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import { getDirectionColor, getDirectionLabel, getDirectionIcon, formatFlowDate } from '../lib/flowCompass'
import './FlowTracker.css'
import '../Profile.css'

/**
 * FlowTracker - Redesigned with card grid and quick log
 * Based on merged mockup design
 */

const FlowTracker = () => {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const [projects, setProjects] = useState([])
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [selectedEnergy, setSelectedEnergy] = useState(null) // 'excited' or 'tired'
  const [selectedFlow, setSelectedFlow] = useState(null) // 'ease' or 'resistance'
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [timelineModal, setTimelineModal] = useState({ isOpen: false, project: null, entries: [] })
  const [projectStats, setProjectStats] = useState({})
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (user?.id) {
      loadProjects()
    }
  }, [user])

  const loadProjects = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('user_projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setProjects(data || [])

      // Load stats for each project
      if (data && data.length > 0) {
        await loadProjectStats(data.map(p => p.id))
      }
    } catch (err) {
      console.error('Error loading projects:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadProjectStats = async (projectIds) => {
    try {
      const { data, error } = await supabase
        .from('flow_entries')
        .select('project_id, direction, logged_at')
        .in('project_id', projectIds)
        .eq('user_id', user.id)

      if (error) throw error

      // Calculate stats per project
      const stats = {}
      projectIds.forEach(projectId => {
        const projectEntries = data.filter(e => e.project_id === projectId)
        stats[projectId] = calculateProjectStats(projectEntries)
      })

      setProjectStats(stats)
    } catch (err) {
      console.error('Error loading project stats:', err)
    }
  }

  const calculateProjectStats = (entries) => {
    if (!entries || entries.length === 0) {
      return { total: 0, north: 0, east: 0, south: 0, west: 0, recent: [] }
    }

    const directionCounts = {
      north: 0,
      east: 0,
      south: 0,
      west: 0
    }

    entries.forEach(entry => {
      if (directionCounts.hasOwnProperty(entry.direction)) {
        directionCounts[entry.direction]++
      }
    })

    const total = entries.length
    const percentages = {
      north: total > 0 ? Math.round((directionCounts.north / total) * 100) : 0,
      east: total > 0 ? Math.round((directionCounts.east / total) * 100) : 0,
      south: total > 0 ? Math.round((directionCounts.south / total) * 100) : 0,
      west: total > 0 ? Math.round((directionCounts.west / total) * 100) : 0
    }

    // Get 3 most recent entries
    const recent = entries
      .sort((a, b) => new Date(b.logged_at) - new Date(a.logged_at))
      .slice(0, 3)

    return { total, ...percentages, recent }
  }

  const handleQuickLog = async () => {
    if (!selectedProjectId || !selectedEnergy || !selectedFlow) {
      alert('Please complete all fields before logging.')
      return
    }

    setSubmitting(true)
    try {
      // Determine direction from energy + flow
      let direction
      if (selectedEnergy === 'excited' && selectedFlow === 'ease') {
        direction = 'north'
      } else if (selectedEnergy === 'excited' && selectedFlow === 'resistance') {
        direction = 'east'
      } else if (selectedEnergy === 'tired' && selectedFlow === 'resistance') {
        direction = 'south'
      } else if (selectedEnergy === 'tired' && selectedFlow === 'ease') {
        direction = 'west'
      }

      const { data, error } = await supabase
        .from('flow_entries')
        .insert({
          user_id: user.id,
          project_id: selectedProjectId,
          direction,
          internal_state: selectedEnergy,
          external_state: selectedFlow,
          reasoning: `Quick log: ${selectedEnergy} and ${selectedFlow === 'ease' ? 'flowing well' : 'facing resistance'}`
        })
        .select()
        .single()

      if (error) throw error

      console.log('✅ Quick log entry created:', data.id)

      // Reset form
      setSelectedProjectId('')
      setSelectedEnergy(null)
      setSelectedFlow(null)

      // Reload projects to update stats
      await loadProjects()
    } catch (err) {
      console.error('Error logging entry:', err)
      alert('Failed to log entry. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const openTimeline = async (project) => {
    try {
      const { data, error } = await supabase
        .from('flow_entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('project_id', project.id)
        .order('logged_at', { ascending: false })
        .limit(20)

      if (error) throw error

      setTimelineModal({
        isOpen: true,
        project,
        entries: data || []
      })
    } catch (err) {
      console.error('Error loading timeline:', err)
    }
  }

  const closeTimeline = () => {
    setTimelineModal({ isOpen: false, project: null, entries: [] })
  }

  const getHealthIndicator = (stats) => {
    if (!stats || stats.total === 0) return 'health-low'
    if (stats.total >= 15) return 'health-great'
    if (stats.total >= 8) return 'health-good'
    return 'health-low'
  }

  const groupEntriesByDate = (entries) => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const lastWeek = new Date(today)
    lastWeek.setDate(lastWeek.getDate() - 7)

    const groups = {
      today: [],
      yesterday: [],
      thisWeek: []
    }

    entries.forEach(entry => {
      const entryDate = new Date(entry.logged_at)
      if (entryDate.toDateString() === today.toDateString()) {
        groups.today.push(entry)
      } else if (entryDate.toDateString() === yesterday.toDateString()) {
        groups.yesterday.push(entry)
      } else if (entryDate >= lastWeek) {
        groups.thisWeek.push(entry)
      }
    })

    return groups
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const getUserInitials = (email) => {
    if (!email) return '?'
    const parts = email.split('@')[0].split(/[._-]/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return email.substring(0, 2).toUpperCase()
  }

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">
          <div className="typing-indicator">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      {/* Mobile Top Bar */}
      <div className="mobile-topbar">
        <div className="topbar-content">
          <div className="topbar-logo">FindMyFlow</div>
          <button className="hamburger-btn" onClick={toggleSidebar}>
            ☰
          </button>
        </div>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={toggleSidebar}></div>
      )}

      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? '' : 'mobile-hidden'}`}>
        <div className="logo">FindMyFlow</div>

        <div className="user-profile">
          <div className="user-avatar">{getUserInitials(user?.email)}</div>
          <div className="user-name">{user?.email?.split('@')[0] || 'User'}</div>
          <div className="user-email">{user?.email}</div>
        </div>

        <ul className="nav-menu">
          <li className="nav-item" onClick={() => { navigate('/me'); setSidebarOpen(false); }}>
            📊 Dashboard
          </li>
          <li className="nav-item" onClick={() => { navigate('/archetypes'); setSidebarOpen(false); }}>
            ✨ Archetypes
          </li>
          <li className="nav-item" onClick={() => { navigate('/7-day-challenge'); setSidebarOpen(false); }}>
            📈 7-Day Challenge
          </li>
          <li className="nav-item active" onClick={() => setSidebarOpen(false)}>
            🧭 Flow Tracker
          </li>
          <li className="nav-item" onClick={() => { navigate('/feedback'); setSidebarOpen(false); }}>
            💬 Give Feedback
          </li>
        </ul>

        <div className="signout-link" onClick={signOut}>
          Sign Out
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Page Header */}
        <div className="page-header">
        <div>
          <h1 className="page-title">Flow Tracker</h1>
          <p className="page-subtitle">Track your project momentum and flow states</p>
        </div>
        <button className="add-project-btn" onClick={() => alert('Project creation coming soon!')}>
          + New Project
        </button>
      </div>

      {/* Quick Log Section */}
      <div className="quick-log">
        <h2 className="quick-log-title">Quick Log</h2>

        {/* Project Selection */}
        <div className="project-select-group">
          <label className="project-select-label">Select Project</label>
          <select
            className="project-select"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
          >
            <option value="">Choose a project...</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        {/* Energy Question */}
        <div className="question-group">
          <h3 className="question-heading">Are you feeling excited or tired?</h3>
          <div className="button-row">
            <button
              className={`energy-btn energy-excited ${selectedEnergy === 'excited' ? 'selected' : ''}`}
              onClick={() => setSelectedEnergy('excited')}
            >
              Excited
            </button>
            <button
              className={`energy-btn energy-tired ${selectedEnergy === 'tired' ? 'selected' : ''}`}
              onClick={() => setSelectedEnergy('tired')}
            >
              Tired
            </button>
          </div>
        </div>

        {/* Flow Question */}
        <div className="question-group">
          <h3 className="question-heading">How is the project flowing?</h3>
          <div className="button-row">
            <button
              className={`flow-btn flow-great ${selectedFlow === 'ease' ? 'selected' : ''}`}
              onClick={() => setSelectedFlow('ease')}
            >
              <span className="arrow-icon">↑</span>
              <span>Great</span>
            </button>
            <button
              className={`flow-btn flow-resistance ${selectedFlow === 'resistance' ? 'selected' : ''}`}
              onClick={() => setSelectedFlow('resistance')}
            >
              <span className="arrow-icon">→</span>
              <span>Facing Resistance</span>
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          className="submit-log-btn"
          onClick={handleQuickLog}
          disabled={!selectedProjectId || !selectedEnergy || !selectedFlow || submitting}
        >
          {submitting ? 'Logging...' : 'Log Entry'}
        </button>
      </div>

      {/* Projects Grid */}
      <div className="projects-grid">
        {projects.map(project => {
          const stats = projectStats[project.id] || { total: 0, north: 0, east: 0, south: 0, west: 0, recent: [] }

          return (
            <div key={project.id} className="project-card">
              <div className="project-card-header">
                <h3 className="project-card-title">{project.name}</h3>
                {project.description && (
                  <p className="project-card-description">{project.description}</p>
                )}
                <div className="project-status-row">
                  <span className="project-status-badge">
                    <span className={`health-indicator ${getHealthIndicator(stats)}`}></span>
                    <span>{project.status || 'Active'}</span>
                  </span>
                  <span className="project-count">{stats.total} entries total</span>
                </div>
              </div>

              {/* Momentum Bar */}
              {stats.total > 0 && (
                <div className="momentum-section">
                  <div className="momentum-label">Flow Momentum</div>
                  <div className="momentum-bar">
                    {stats.north > 0 && <div className="momentum-segment momentum-north" style={{ width: `${stats.north}%` }}></div>}
                    {stats.east > 0 && <div className="momentum-segment momentum-east" style={{ width: `${stats.east}%` }}></div>}
                    {stats.south > 0 && <div className="momentum-segment momentum-south" style={{ width: `${stats.south}%` }}></div>}
                    {stats.west > 0 && <div className="momentum-segment momentum-west" style={{ width: `${stats.west}%` }}></div>}
                  </div>
                  <div className="momentum-legend">
                    {stats.north > 0 && (
                      <div className="legend-item">
                        <div className="legend-dot momentum-north"></div>
                        <span>{stats.north}% Growth</span>
                      </div>
                    )}
                    {stats.east > 0 && (
                      <div className="legend-item">
                        <div className="legend-dot momentum-east"></div>
                        <span>{stats.east}% Explore</span>
                      </div>
                    )}
                    {stats.south > 0 && (
                      <div className="legend-item">
                        <div className="legend-dot momentum-south"></div>
                        <span>{stats.south}% Rest</span>
                      </div>
                    )}
                    {stats.west > 0 && (
                      <div className="legend-item">
                        <div className="legend-dot momentum-west"></div>
                        <span>{stats.west}% Reflect</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Recent Entries */}
              {stats.recent && stats.recent.length > 0 && (
                <div className="recent-entries">
                  <div className="recent-title">Recent Activity</div>
                  {stats.recent.map(entry => (
                    <div key={entry.id} className="entry-mini">
                      <div className={`entry-mini-dot momentum-${entry.direction}`}></div>
                      <div className="entry-mini-info">
                        <span className="entry-mini-direction">
                          {getDirectionLabel(entry.direction)} - {entry.activity_description || 'Activity'}
                        </span>
                        <span className="entry-mini-time">{formatFlowDate(entry.logged_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Card Actions */}
              <div className="card-actions">
                <button
                  className="quick-add-mini-btn"
                  onClick={() => setSelectedProjectId(project.id)}
                >
                  + Add Entry
                </button>
                <button
                  className="view-timeline-btn"
                  onClick={() => openTimeline(project)}
                >
                  View Timeline
                </button>
              </div>
            </div>
          )
        })}

        {/* Empty State Card */}
        <div className="empty-card" onClick={() => alert('Project creation coming soon!')}>
          <div className="empty-icon">➕</div>
          <div className="empty-title">Start a New Project</div>
          <div className="empty-text">Track your flow journey on something new</div>
        </div>
      </div>
      </div>

      {/* Timeline Modal */}
      {timelineModal.isOpen && (
        <div className="timeline-modal" onClick={closeTimeline}>
          <div className="timeline-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="timeline-modal-header">
              <h2 className="timeline-modal-title">{timelineModal.project?.name} Timeline</h2>
              <button className="close-modal-btn" onClick={closeTimeline}>×</button>
            </div>
            <div className="timeline-modal-body">
              {timelineModal.entries.length === 0 ? (
                <div className="empty-state">
                  <p className="empty-icon">🧭</p>
                  <p className="empty-text">No entries yet for this project</p>
                </div>
              ) : (
                <div className="timeline-container">
                  {Object.entries(groupEntriesByDate(timelineModal.entries)).map(([period, entries]) => {
                    if (entries.length === 0) return null

                    return (
                      <div key={period} className="date-group">
                        <div className="date-header">
                          {period === 'today' && 'Today'}
                          {period === 'yesterday' && 'Yesterday'}
                          {period === 'thisWeek' && 'This Week'}
                        </div>
                        {entries.map((entry, index) => (
                          <div key={entry.id} className="timeline-entry">
                            <div className={`timeline-dot ${entry.direction}`}></div>
                            {index < entries.length - 1 && <div className="timeline-line"></div>}
                            <div className="entry-card">
                              <div className="entry-header">
                                <div className="entry-direction" style={{ color: getDirectionColor(entry.direction) }}>
                                  <span className="direction-arrow">{getDirectionIcon(entry.direction)}</span>
                                  <span>{getDirectionLabel(entry.direction)}</span>
                                </div>
                                <div className="entry-time">{formatFlowDate(entry.logged_at)}</div>
                              </div>
                              <div className="entry-states">
                                <div className="state-box">
                                  <div className="state-label">Internal</div>
                                  <div className="state-value">{entry.internal_state}</div>
                                </div>
                                <div className="state-box">
                                  <div className="state-label">External</div>
                                  <div className="state-value">{entry.external_state}</div>
                                </div>
                              </div>
                              {entry.reasoning && (
                                <p className="entry-reasoning">{entry.reasoning}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FlowTracker
