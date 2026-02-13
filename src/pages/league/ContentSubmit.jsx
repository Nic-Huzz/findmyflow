/**
 * ContentSubmit.jsx — /league/submit
 * Content type selector, link/description form, pending/approved list
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { useLeagueData } from '../../hooks/useLeagueData'
import { submitContent, getContentSubmissions } from '../../lib/league/leagueService'
import { CONTENT_POINT_VALUES } from '../../lib/league/leagueConfig'
import { hapticLight, hapticSuccess } from '../../lib/haptics'
import './ContentSubmit.css'

const CONTENT_TYPES = Object.entries(CONTENT_POINT_VALUES)

export default function ContentSubmit() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { league, userTeam, isOnTeam, getCurrentWeek, loading: leagueLoading } = useLeagueData()

  const [selectedType, setSelectedType] = useState(null)
  const [linkUrl, setLinkUrl] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submissions, setSubmissions] = useState([])
  const [loadingSubs, setLoadingSubs] = useState(true)

  const currentWeek = getCurrentWeek()

  useEffect(() => {
    if (league?.id && user?.id) {
      loadSubmissions()
    }
  }, [league?.id, user?.id])

  async function loadSubmissions() {
    setLoadingSubs(true)
    try {
      const data = await getContentSubmissions(league.id, { userId: user.id })
      setSubmissions(data)
    } catch (err) {
      console.error('Error loading submissions:', err)
    } finally {
      setLoadingSubs(false)
    }
  }

  async function handleSubmit() {
    if (!selectedType || !league?.id || !userTeam?.id) return
    setSubmitting(true)
    try {
      await submitContent({
        leagueId: league.id,
        userId: user.id,
        teamId: userTeam.id,
        weekNumber: currentWeek,
        contentType: selectedType,
        linkUrl: linkUrl.trim() || null,
        description: description.trim() || null,
      })
      hapticSuccess()
      setSelectedType(null)
      setLinkUrl('')
      setDescription('')
      await loadSubmissions()
    } catch (err) {
      alert(err.message || 'Error submitting content')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusColor = (status) => {
    if (status === 'approved') return '#10b981'
    if (status === 'rejected') return '#ef4444'
    return '#E9A23B'
  }

  const getStatusLabel = (status) => {
    if (status === 'approved') return 'Approved'
    if (status === 'rejected') return 'Rejected'
    return 'Pending'
  }

  if (leagueLoading) {
    return (
      <div className="content-submit">
        <div className="cs-loading">
          <div className="cs-spinner" />
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (!league || !isOnTeam) {
    return (
      <div className="content-submit">
        <div className="cs-toolbar">
          <button className="cs-back" onClick={() => navigate('/league')}>←</button>
          <h2 className="cs-toolbar-title">Submit Content</h2>
        </div>
        <div className="cs-empty">
          <span className="cs-empty-icon">⭐</span>
          <h3 className="cs-empty-title">Join a Team First</h3>
          <p className="cs-empty-text">You need to be on a team to submit content.</p>
          <button className="cs-cta" onClick={() => navigate('/league')}>
            Go to League <span>→</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="content-submit">
      {/* Toolbar */}
      <div className="cs-toolbar">
        <button className="cs-back" onClick={() => navigate('/league')}>←</button>
        <h2 className="cs-toolbar-title">Submit Content</h2>
      </div>

      {/* Hero */}
      <div className="cs-hero">
        <span className="cs-hero-label">Week {currentWeek} • {userTeam.name}</span>
        <h2 className="cs-hero-title">Bonus Points</h2>
        <p className="cs-hero-sub">
          Share content to earn extra points for your squad!
        </p>
      </div>

      {/* Content Type Selector */}
      <section className="cs-section">
        <div className="cs-section-header">
          <div className="cs-section-icon">⭐</div>
          <span className="cs-section-title">Choose Content Type</span>
        </div>

        <div className="cs-type-grid">
          {CONTENT_TYPES.map(([key, config]) => (
            <button
              key={key}
              className={`cs-type-card ${selectedType === key ? 'selected' : ''}`}
              onClick={() => { hapticLight(); setSelectedType(key) }}
            >
              <span className="cs-type-icon">{config.icon}</span>
              <span className="cs-type-label">{config.label}</span>
              <span className="cs-type-points">+{config.points} pts</span>
            </button>
          ))}
        </div>
      </section>

      {/* Submission Form */}
      {selectedType && (
        <section className="cs-section">
          <div className="cs-card">
            <h3 className="cs-form-title">
              {CONTENT_POINT_VALUES[selectedType].icon} {CONTENT_POINT_VALUES[selectedType].label}
              <span className="cs-form-points">+{CONTENT_POINT_VALUES[selectedType].points} pts</span>
            </h3>

            <div className="cs-field">
              <label>Link (optional)</label>
              <input
                type="url"
                placeholder="https://..."
                value={linkUrl}
                onChange={e => setLinkUrl(e.target.value)}
              />
            </div>

            <div className="cs-field">
              <label>Description</label>
              <textarea
                placeholder="What did you share?"
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <button
              className="cs-cta"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit for Approval'} <span>→</span>
            </button>
          </div>
        </section>
      )}

      {/* My Submissions */}
      <section className="cs-section">
        <div className="cs-section-header">
          <div className="cs-section-icon">📋</div>
          <span className="cs-section-title">My Submissions</span>
        </div>

        {loadingSubs ? (
          <div className="cs-card" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading...
          </div>
        ) : submissions.length === 0 ? (
          <div className="cs-card" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
            No submissions yet. Share some content!
          </div>
        ) : (
          submissions.map(sub => (
            <div key={sub.id} className="cs-card cs-submission">
              <div className="cs-sub-header">
                <span className="cs-sub-type">
                  {CONTENT_POINT_VALUES[sub.content_type]?.icon} {CONTENT_POINT_VALUES[sub.content_type]?.label}
                </span>
                <span
                  className="cs-sub-status"
                  style={{ color: getStatusColor(sub.status), borderColor: getStatusColor(sub.status) }}
                >
                  {getStatusLabel(sub.status)}
                </span>
              </div>
              {sub.description && (
                <p className="cs-sub-desc">{sub.description}</p>
              )}
              {sub.link_url && (
                <a href={sub.link_url} target="_blank" rel="noopener noreferrer" className="cs-sub-link">
                  View Link ↗
                </a>
              )}
              <div className="cs-sub-meta">
                Week {sub.week_number} • {CONTENT_POINT_VALUES[sub.content_type]?.points || sub.points_value} pts
                {sub.review_note && <> • Note: {sub.review_note}</>}
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  )
}
