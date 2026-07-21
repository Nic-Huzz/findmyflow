/**
 * QuarterlyPlanner.jsx — One-time quarterly planning prompt
 *
 * Modal that shows once per quarter on the Experiences tab.
 * User picks from their experience library or creates new.
 * Selecting navigates to create experience flow.
 * Dismisses permanently for the quarter after any interaction.
 *
 * CSS prefix: qp-
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { fetchTemplates } from '../../lib/experienceTemplateService'
import { hapticLight, hapticSuccess } from '../../lib/haptics'
import { getGamificationState, updateGamificationState } from '../../lib/creatorGamification'
import './QuarterlyPlanner.css'

const TYPE_EMOJI = {
  workshop: '🎓',
  performance: '🎭',
  cohort: '👥',
  books_media: '📚',
  facilitation: '🤝',
  retreats: '🏔️',
}

function getCurrentQuarter() {
  const now = new Date()
  const q = Math.floor(now.getMonth() / 3) + 1
  return `${now.getFullYear()}-Q${q}`
}

function getQuarterLabel(quarterKey) {
  const [year, q] = quarterKey.split('-Q')
  const months = { 1: 'Jan-Mar', 2: 'Apr-Jun', 3: 'Jul-Sep', 4: 'Oct-Dec' }
  return `${months[q]} ${year}`
}

export default function QuarterlyPlanner({ experiences = [], pastExperiences = [] }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const quarter = getCurrentQuarter()
  const [visible, setVisible] = useState(false)
  const [templates, setTemplates] = useState([])
  const [showLibrary, setShowLibrary] = useState(false)

  useEffect(() => {
    const state = getGamificationState()
    const alreadySeen = state.quarterlyPlannerDismissed === quarter
    setVisible(!alreadySeen)
  }, [quarter])

  useEffect(() => {
    if (!user?.id) return
    fetchTemplates(user.id).then(data => setTemplates(data || [])).catch(() => {})
  }, [user?.id])

  function dismiss() {
    setVisible(false)
    updateGamificationState({ quarterlyPlannerDismissed: quarter })
    hapticLight()
  }

  function selectTemplate(t) {
    dismiss()
    hapticSuccess()
    navigate(`/create/experience/new?templateId=${t.id}&type=${t.experience_type}`)
  }

  function createNew() {
    dismiss()
    hapticSuccess()
    navigate('/create/experience/new')
  }

  if (!visible) return null

  // Count this quarter's actual experiences
  const quarterStart = new Date()
  quarterStart.setMonth(Math.floor(quarterStart.getMonth() / 3) * 3, 1)
  quarterStart.setHours(0, 0, 0, 0)
  const thisQuarterCount = [...experiences, ...pastExperiences].filter(e => {
    const d = new Date(e.experience_date || e.created_at)
    return d >= quarterStart
  }).length

  return (
    <div className="qp-overlay" onClick={dismiss}>
      <div className="qp-modal" onClick={e => e.stopPropagation()}>
        <button className="qp-close" onClick={dismiss}>&times;</button>

        <div className="qp-modal-header">
          <span className="qp-icon">📅</span>
          <div>
            <div className="qp-title">Plan Your Quarter</div>
            <div className="qp-quarter-label">{getQuarterLabel(quarter)}</div>
          </div>
        </div>

        <p className="qp-prompt">What experiences are you running this quarter?</p>
        <p className="qp-sub">Pick from your library or start fresh.</p>

        {thisQuarterCount > 0 && (
          <div className="qp-existing">
            You already have {thisQuarterCount} experience{thisQuarterCount !== 1 ? 's' : ''} this quarter.
          </div>
        )}

        {/* Library picker */}
        {templates.length > 0 && (
          <div className="qp-library">
            <button
              className={`qp-library-toggle${showLibrary ? ' open' : ''}`}
              onClick={() => { hapticLight(); setShowLibrary(!showLibrary) }}
            >
              <span>Your library</span>
              <span className="qp-library-count">{templates.length}</span>
              <span className="qp-chevron">{showLibrary ? '▴' : '▾'}</span>
            </button>

            {showLibrary && (
              <div className="qp-library-list">
                {templates.map(t => (
                  <button key={t.id} className="qp-library-item" onClick={() => selectTemplate(t)}>
                    <span className="qp-library-emoji">{TYPE_EMOJI[t.experience_type] || '✨'}</span>
                    <div className="qp-library-info">
                      <span className="qp-library-name">{t.name}</span>
                      {t.times_delivered > 0 && (
                        <span className="qp-library-meta">{t.times_delivered}&times; delivered</span>
                      )}
                    </div>
                    <span className="qp-library-arrow">&rsaquo;</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <button className="qp-create-btn" onClick={createNew}>
          + Create new experience
        </button>

        <button className="qp-later" onClick={dismiss}>
          Not right now
        </button>
      </div>
    </div>
  )
}
