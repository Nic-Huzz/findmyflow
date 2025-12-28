import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import { getDirectionColor, getDirectionLabel, getDirectionIcon, formatFlowDate } from '../lib/flowCompass'
import './FlowCompassPage.css'
import '../Profile.css'

// Generate month options for date picker (last 5 years)
const generateMonthOptions = () => {
  const options = []
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()

  for (let year = currentYear; year >= currentYear - 5; year--) {
    const maxMonth = year === currentYear ? currentMonth : 11
    for (let month = maxMonth; month >= 0; month--) {
      const date = new Date(year, month, 1)
      options.push({
        value: `${year}-${String(month + 1).padStart(2, '0')}`,
        label: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      })
    }
  }

  return options
}

const MONTH_OPTIONS = generateMonthOptions()

/**
 * FlowCompassPage - Redesigned with card grid and quick log
 * Based on merged mockup design
 */

const FlowCompassPage = () => {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const [projects, setProjects] = useState([])
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [selectedEnergy, setSelectedEnergy] = useState(null) // 'excited' or 'tired'
  const [selectedFlow, setSelectedFlow] = useState(null) // 'ease' or 'resistance'
  const [headline, setHeadline] = useState('') // headline for quick log
  const [comment, setComment] = useState('') // optional comment for quick log
  const [dateOption, setDateOption] = useState('recent') // 'recent' or 'custom'
  const [customMonth, setCustomMonth] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [timelineModal, setTimelineModal] = useState({ isOpen: false, project: null, entries: [] })
  const [projectStats, setProjectStats] = useState({})
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [creatingProject, setCreatingProject] = useState(false)

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

      // Auto-select the first (and only) project for single-project MVP
      if (data && data.length > 0) {
        setSelectedProjectId(data[0].id)
        await loadProjectStats(data.map(p => p.id))
      } else {
        // No projects exist - still load unassigned entries from challenge
        await loadUnassignedEntries()
        // Show create modal
        setShowCreateModal(true)
      }
    } catch (err) {
      console.error('Error loading projects:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadProjectStats = async (projectIds) => {
    try {
      // Load entries for all projects
      const { data: projectData, error: projectError } = await supabase
        .from('flow_entries')
        .select('project_id, direction, logged_at')
        .in('project_id', projectIds)
        .eq('user_id', user.id)

      if (projectError) throw projectError

      // Also load entries without a project_id (from challenge tracker quests)
      const { data: unassignedData, error: unassignedError } = await supabase
        .from('flow_entries')
        .select('id, project_id, direction, logged_at, activity_description, reasoning')
        .is('project_id', null)
        .eq('user_id', user.id)

      if (unassignedError) throw unassignedError

      // Calculate stats per project
      const stats = {}
      projectIds.forEach(projectId => {
        const projectEntries = projectData.filter(e => e.project_id === projectId)
        stats[projectId] = calculateProjectStats(projectEntries)
      })

      // Add unassigned entries stats with special key
      if (unassignedData && unassignedData.length > 0) {
        stats['unassigned'] = calculateProjectStats(unassignedData)
      }

      setProjectStats(stats)
    } catch (err) {
      console.error('Error loading project stats:', err)
    }
  }

  // Load unassigned entries when there are no projects
  const loadUnassignedEntries = async () => {
    try {
      const { data: unassignedData, error: unassignedError } = await supabase
        .from('flow_entries')
        .select('id, project_id, direction, logged_at, activity_description, reasoning')
        .is('project_id', null)
        .eq('user_id', user.id)

      if (unassignedError) throw unassignedError

      // Only set stats if there are unassigned entries
      if (unassignedData && unassignedData.length > 0) {
        setProjectStats({
          'unassigned': calculateProjectStats(unassignedData)
        })
      }
    } catch (err) {
      console.error('Error loading unassigned entries:', err)
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

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      alert('Please enter a project name')
      return
    }

    setCreatingProject(true)
    try {
      const { data, error } = await supabase
        .from('user_projects')
        .insert({
          user_id: user.id,
          name: newProjectName.trim(),
          description: 'Tracking my flow journey',
          status: 'active'
        })
        .select()
        .single()

      if (error) throw error

      // Close modal and reload projects
      setShowCreateModal(false)
      setNewProjectName('')
      await loadProjects()
    } catch (err) {
      console.error('Error creating project:', err)
      alert('Failed to create project. Please try again.')
    } finally {
      setCreatingProject(false)
    }
  }

  // Helper to get date from month string
  const getDateFromMonth = (monthStr) => {
    if (!monthStr) return new Date()
    const [year, month] = monthStr.split('-')
    return new Date(parseInt(year), parseInt(month) - 1, 15)
  }

  // Get direction from energy + flow
  const getDirection = () => {
    if (selectedEnergy === 'excited' && selectedFlow === 'ease') return 'north'
    if (selectedEnergy === 'excited' && selectedFlow === 'resistance') return 'east'
    if (selectedEnergy === 'tired' && selectedFlow === 'resistance') return 'south'
    if (selectedEnergy === 'tired' && selectedFlow === 'ease') return 'west'
    return null
  }

  const getDirectionLabelLocal = (dir) => {
    const labels = { north: 'Flow', east: 'Redirect', south: 'Rest', west: 'Honour' }
    return labels[dir] || ''
  }

  const handleQuickLog = async () => {
    if (!selectedProjectId || !selectedEnergy || !selectedFlow) {
      alert('Please complete all fields before logging.')
      return
    }

    if (dateOption === 'custom' && !customMonth) {
      alert('Please select a date.')
      return
    }

    setSubmitting(true)
    try {
      const direction = getDirection()

      // Calculate logged_at based on date option
      const loggedAt = dateOption === 'recent'
        ? new Date().toISOString()
        : getDateFromMonth(customMonth).toISOString()

      const { data, error } = await supabase
        .from('flow_entries')
        .insert({
          user_id: user.id,
          project_id: selectedProjectId,
          direction,
          internal_state: selectedEnergy,
          external_state: selectedFlow,
          activity_description: headline.trim() || 'Flow check-in',
          reasoning: comment.trim() || 'Daily reflection',
          logged_at: loggedAt
        })
        .select()
        .single()

      if (error) throw error

      // Reset form but keep project selected
      setSelectedEnergy(null)
      setSelectedFlow(null)
      setHeadline('')
      setComment('')
      setDateOption('recent')
      setCustomMonth(null)

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
      let query = supabase
        .from('flow_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('logged_at', { ascending: false })
        .limit(20)

      // Handle unassigned entries (from challenge tracker quests)
      if (project.id === null) {
        query = query.is('project_id', null)
      } else {
        query = query.eq('project_id', project.id)
      }

      const { data, error } = await query

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
            🧭 Flow Compass
          </li>
          <li className="nav-item" onClick={() => { navigate('/library'); setSidebarOpen(false); }}>
            📚 Library of Answers
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
          <h1 className="page-title">Flow Compass</h1>
          <p className="page-subtitle">Track your project momentum and flow states</p>
        </div>
      </div>

      {/* Quick Log Section - Styled like SeeYourFlow */}
      <div className="quick-log flow-style">
        <h2 className="quick-log-title">Log Your Flow</h2>

        {/* Energy Question */}
        <div className="question-group">
          <label className="question-label">Are you feeling excited?</label>
          <div className="two-options">
            <button
              className={`option-btn ${selectedEnergy === 'excited' ? 'selected' : ''}`}
              onClick={() => setSelectedEnergy('excited')}
            >
              <span className="option-emoji">🔥</span>
              <span>Excited</span>
            </button>
            <button
              className={`option-btn ${selectedEnergy === 'tired' ? 'selected' : ''}`}
              onClick={() => setSelectedEnergy('tired')}
            >
              <span className="option-emoji">😴</span>
              <span>Tired</span>
            </button>
          </div>
        </div>

        {/* Flow Question */}
        <div className="question-group">
          <label className="question-label">How is the business flowing?</label>
          <div className="two-options">
            <button
              className={`option-btn ${selectedFlow === 'ease' ? 'selected' : ''}`}
              onClick={() => setSelectedFlow('ease')}
            >
              <span className="option-emoji">✨</span>
              <span>Great</span>
            </button>
            <button
              className={`option-btn ${selectedFlow === 'resistance' ? 'selected' : ''}`}
              onClick={() => setSelectedFlow('resistance')}
            >
              <span className="option-emoji">🧗</span>
              <span>Facing resistance</span>
            </button>
          </div>
        </div>

        {/* Direction Preview */}
        {selectedEnergy && selectedFlow && (
          <div className={`direction-preview direction-${getDirection()}`}>
            <span className="direction-arrow">→</span>
            <span>{getDirectionLabelLocal(getDirection())}</span>
          </div>
        )}

        {/* Headline */}
        <div className="question-group">
          <label className="question-label">Headline</label>
          <input
            type="text"
            className="headline-input"
            placeholder="e.g., Landed a new client"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
          />
        </div>

        {/* Comment */}
        <div className="question-group">
          <label className="question-label">Comment (optional)</label>
          <textarea
            className="comment-textarea"
            placeholder="Any additional thoughts..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
          />
        </div>

        {/* Date Option */}
        <div className="question-group">
          <label className="question-label">When</label>
          <div className="date-options">
            <button
              className={`date-option ${dateOption === 'recent' ? 'selected' : ''}`}
              onClick={() => setDateOption('recent')}
            >
              Most Recent
            </button>
            <button
              className={`date-option ${dateOption === 'custom' ? 'selected' : ''}`}
              onClick={() => setDateOption('custom')}
            >
              Choose Date
            </button>
          </div>

          {dateOption === 'custom' && (
            <select
              className="month-picker"
              value={customMonth || ''}
              onChange={(e) => setCustomMonth(e.target.value)}
            >
              <option value="">Select month...</option>
              {MONTH_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          )}
        </div>

        {/* Submit Button */}
        <button
          className="submit-btn"
          onClick={handleQuickLog}
          disabled={!selectedProjectId || !selectedEnergy || !selectedFlow || submitting || (dateOption === 'custom' && !customMonth)}
        >
          {submitting ? 'Logging...' : 'Log Flow'}
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
                        <span>{stats.north}% Flowing</span>
                      </div>
                    )}
                    {stats.east > 0 && (
                      <div className="legend-item">
                        <div className="legend-dot momentum-east"></div>
                        <span>{stats.east}% Redirect</span>
                      </div>
                    )}
                    {stats.south > 0 && (
                      <div className="legend-item">
                        <div className="legend-dot momentum-south"></div>
                        <span>{stats.south}% Resting</span>
                      </div>
                    )}
                    {stats.west > 0 && (
                      <div className="legend-item">
                        <div className="legend-dot momentum-west"></div>
                        <span>{stats.west}% Honouring</span>
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

        {/* Challenge Entries Card - show entries from 7-day challenge tracker quests */}
        {projectStats['unassigned'] && projectStats['unassigned'].total > 0 && (
          <div className="project-card challenge-entries-card">
            <div className="project-card-header">
              <h3 className="project-card-title">Challenge Entries</h3>
              <p className="project-card-description">Flow entries logged from the 7-Day Challenge</p>
              <div className="project-status-row">
                <span className="project-status-badge">
                  <span className={`health-indicator ${getHealthIndicator(projectStats['unassigned'])}`}></span>
                  <span>From Challenge</span>
                </span>
                <span className="project-count">{projectStats['unassigned'].total} entries total</span>
              </div>
            </div>

            {/* Momentum Bar */}
            {projectStats['unassigned'].total > 0 && (
              <div className="momentum-section">
                <div className="momentum-label">Flow Momentum</div>
                <div className="momentum-bar">
                  {projectStats['unassigned'].north > 0 && <div className="momentum-segment momentum-north" style={{ width: `${projectStats['unassigned'].north}%` }}></div>}
                  {projectStats['unassigned'].east > 0 && <div className="momentum-segment momentum-east" style={{ width: `${projectStats['unassigned'].east}%` }}></div>}
                  {projectStats['unassigned'].south > 0 && <div className="momentum-segment momentum-south" style={{ width: `${projectStats['unassigned'].south}%` }}></div>}
                  {projectStats['unassigned'].west > 0 && <div className="momentum-segment momentum-west" style={{ width: `${projectStats['unassigned'].west}%` }}></div>}
                </div>
                <div className="momentum-legend">
                  {projectStats['unassigned'].north > 0 && (
                    <div className="legend-item">
                      <div className="legend-dot momentum-north"></div>
                      <span>{projectStats['unassigned'].north}% Flowing</span>
                    </div>
                  )}
                  {projectStats['unassigned'].east > 0 && (
                    <div className="legend-item">
                      <div className="legend-dot momentum-east"></div>
                      <span>{projectStats['unassigned'].east}% Redirect</span>
                    </div>
                  )}
                  {projectStats['unassigned'].south > 0 && (
                    <div className="legend-item">
                      <div className="legend-dot momentum-south"></div>
                      <span>{projectStats['unassigned'].south}% Resting</span>
                    </div>
                  )}
                  {projectStats['unassigned'].west > 0 && (
                    <div className="legend-item">
                      <div className="legend-dot momentum-west"></div>
                      <span>{projectStats['unassigned'].west}% Honouring</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Recent Entries */}
            {projectStats['unassigned'].recent && projectStats['unassigned'].recent.length > 0 && (
              <div className="recent-entries">
                <div className="recent-title">Recent Activity</div>
                {projectStats['unassigned'].recent.map(entry => (
                  <div key={entry.id} className="entry-mini">
                    <div className={`entry-mini-dot momentum-${entry.direction}`}></div>
                    <div className="entry-mini-info">
                      <span className="entry-mini-direction">
                        {getDirectionLabel(entry.direction)} - {entry.activity_description || 'Challenge Log'}
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
                className="view-timeline-btn"
                onClick={() => openTimeline({ id: null, name: 'Challenge Entries' })}
              >
                View Timeline
              </button>
            </div>
          </div>
        )}
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

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="timeline-modal" onClick={(e) => e.stopPropagation()}>
          <div className="timeline-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="timeline-modal-header">
              <h2 className="timeline-modal-title">Create Your Project</h2>
            </div>
            <div className="timeline-modal-body">
              <p style={{ marginBottom: '20px', color: '#666' }}>
                Let's set up your Flow Compass. What project are you working on?
              </p>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Project Name *
                </label>
                <input
                  type="text"
                  className="project-select"
                  placeholder="e.g., My Business Launch, Personal Growth Journey..."
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !creatingProject) {
                      handleCreateProject()
                    }
                  }}
                  autoFocus
                  disabled={creatingProject}
                  style={{ width: '100%', padding: '12px' }}
                />
              </div>
              <button
                className="submit-log-btn"
                onClick={handleCreateProject}
                disabled={!newProjectName.trim() || creatingProject}
                style={{ width: '100%', marginBottom: '12px' }}
              >
                {creatingProject ? 'Creating...' : 'Create Project'}
              </button>
              <div style={{ textAlign: 'center', margin: '16px 0', color: '#999', fontSize: '14px' }}>
                or
              </div>
              <button
                className="submit-log-btn"
                onClick={() => navigate('/nikigai/skills')}
                style={{ width: '100%', background: 'linear-gradient(135deg, #5e17eb, #7c3aed)' }}
              >
                Complete Flow Finder
              </button>
              <p style={{ marginTop: '12px', fontSize: '13px', color: '#999', textAlign: 'center' }}>
                Completing the Flow Finder will help you discover your ideal project
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FlowCompassPage
