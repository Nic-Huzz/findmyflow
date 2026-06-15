/**
 * ExperienceLibrary.jsx — Reusable experience type library
 * Compact list: emoji + name/meta left, "Run This →" right.
 * CSS prefix: el-
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { fetchTemplates, createTemplate, archiveTemplate } from '../../lib/experienceTemplateService'
import { hapticLight, hapticSuccess } from '../../lib/haptics'
import './ExperienceLibrary.css'

const EXPERIENCE_TYPES = [
  { id: 'workshop', label: 'Workshops & Training', emoji: '🎓' },
  { id: 'performance', label: 'Live Events & Performance', emoji: '🎭' },
  { id: 'cohort', label: 'Cohorts & Courses', emoji: '👥' },
  { id: 'books_media', label: 'Books, Content & Media', emoji: '📚' },
  { id: 'facilitation', label: 'Facilitation & Community', emoji: '🤝' },
  { id: 'retreats', label: 'Retreats & Immersive', emoji: '🏔️' },
]

const TYPE_EMOJI = Object.fromEntries(EXPERIENCE_TYPES.map(t => [t.id, t.emoji]))

export default function ExperienceLibrary({ onCreateFromTemplate }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    fetchTemplates(user.id).then(data => {
      setTemplates(data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [user])

  if (loading || templates.length === 0) return null

  return (
    <div className="el-library">
      <h3 className="el-title">Your Experience Library</h3>

      <div className="el-list">
        {templates.map(t => {
          const meta = [
            t.duration_minutes && `${t.duration_minutes}m`,
            t.times_delivered > 0 && `${t.times_delivered}× delivered`,
            t.times_delivered > 0 && t.avg_attendees && `~${Math.round(t.avg_attendees)} avg`,
          ].filter(Boolean).join(' · ') || 'New'

          return (
            <div key={t.id} className="el-item">
              <span className="el-item-emoji">{TYPE_EMOJI[t.experience_type] || '✨'}</span>
              <div className="el-item-info">
                <span className="el-item-name">{t.name}</span>
                <span className="el-item-meta">{meta}</span>
              </div>
              <button
                className="el-item-run"
                onClick={() => {
                  hapticSuccess()
                  if (onCreateFromTemplate) {
                    onCreateFromTemplate(t)
                  } else {
                    navigate(`/create/experience/new?templateId=${t.id}`)
                  }
                }}
              >
                Run →
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
