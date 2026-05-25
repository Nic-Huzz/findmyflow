/**
 * ExperienceLibrary.jsx — Reusable experience type library
 * Shows saved templates with delivery count, runsheet preview, and "Run This" CTA.
 * CSS prefix: el-
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { fetchTemplates, createTemplate, archiveTemplate, updateTemplate } from '../../lib/experienceTemplateService'
import { hapticLight, hapticSuccess } from '../../lib/haptics'
import JourneyDesigner from './JourneyDesigner'
import './ExperienceLibrary.css'
import './JourneyDesigner.css'

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
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState('workshop')
  const [newDuration, setNewDuration] = useState('')
  const [creating, setCreating] = useState(false)
  const [designerOpen, setDesignerOpen] = useState(null) // template ID

  useEffect(() => {
    if (!user) return
    fetchTemplates(user.id).then(data => {
      setTemplates(data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [user])

  const handleCreate = async () => {
    if (!newName.trim() || creating) return
    setCreating(true)
    hapticLight()
    try {
      const template = await createTemplate(user.id, {
        name: newName.trim(),
        experience_type: newType,
        duration_minutes: newDuration ? parseInt(newDuration) : null,
        runsheet: [
          { phase: 'opening', duration: 5, notes: '' },
          { phase: 'main', duration: 30, notes: '' },
          { phase: 'closing', duration: 5, notes: '' },
        ],
      })
      hapticSuccess()
      setTemplates(prev => [template, ...prev])
      setShowCreate(false)
      setNewName('')
      setNewDuration('')
    } catch (err) {
      console.error('Create template error:', err)
    }
    setCreating(false)
  }

  const handleArchive = async (id) => {
    hapticLight()
    await archiveTemplate(id)
    setTemplates(prev => prev.filter(t => t.id !== id))
  }

  if (loading) return null

  return (
    <div className="el-library">
      <div className="el-header">
        <h3 className="el-title">Your Experience Library</h3>
        <button className="el-add-btn" onClick={() => { hapticLight(); setShowCreate(!showCreate) }}>
          {showCreate ? '×' : '+'}
        </button>
      </div>

      {showCreate && (
        <div className="el-create-form">
          <input
            className="el-input"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Experience name (e.g. Vibe Rise Dance Journey)"
            autoFocus
          />
          <div className="el-create-row">
            <select className="el-select" value={newType} onChange={e => setNewType(e.target.value)}>
              {EXPERIENCE_TYPES.map(t => (
                <option key={t.id} value={t.id}>{t.emoji} {t.label}</option>
              ))}
            </select>
            <input
              className="el-input el-input-sm"
              value={newDuration}
              onChange={e => setNewDuration(e.target.value)}
              placeholder="Duration (min)"
              type="number"
            />
          </div>
          <button className="el-create-btn" onClick={handleCreate} disabled={!newName.trim() || creating}>
            {creating ? 'Creating...' : 'Add to Library'}
          </button>
        </div>
      )}

      {templates.length === 0 && !showCreate && (
        <div className="el-empty">
          <div className="el-empty-icon">📚</div>
          <p className="el-empty-text">Your library is empty. Add your first experience type to build a reusable runsheet.</p>
          <button className="el-empty-cta" onClick={() => setShowCreate(true)}>
            + Add First Experience Type
          </button>
        </div>
      )}

      <div className="el-grid">
        {templates.map(t => (
          <div key={t.id} className="el-card">
            <div className="el-card-top">
              <span className="el-card-emoji">{TYPE_EMOJI[t.experience_type] || '✨'}</span>
              <div className="el-card-info">
                <div className="el-card-name">{t.name}</div>
                <div className="el-card-meta">
                  {t.duration_minutes && `${t.duration_minutes} min`}
                  {t.duration_minutes && t.times_delivered > 0 && ' · '}
                  {t.times_delivered > 0 && `Delivered ${t.times_delivered}×`}
                  {t.times_delivered > 0 && t.avg_attendees && ` · ~${Math.round(t.avg_attendees)} avg`}
                  {t.times_delivered === 0 && !t.duration_minutes && 'New template'}
                </div>
              </div>
            </div>

            {t.runsheet?.length > 0 && (
              <div className="el-runsheet-preview">
                {t.runsheet.map((phase, i) => (
                  <div key={i} className="el-phase-dot">
                    <div className="el-phase-bar" />
                    <span className="el-phase-name">{phase.phase}</span>
                    {phase.duration && <span className="el-phase-dur">{phase.duration}m</span>}
                  </div>
                ))}
              </div>
            )}

            <div className="el-card-actions">
              <button
                className="el-run-btn"
                onClick={() => {
                  hapticSuccess()
                  if (onCreateFromTemplate) {
                    onCreateFromTemplate(t)
                  } else {
                    navigate(`/create/experience/new?templateId=${t.id}`)
                  }
                }}
              >
                Run This →
              </button>
              <button
                className="el-edit-btn"
                onClick={() => { hapticLight(); setDesignerOpen(designerOpen === t.id ? null : t.id) }}
              >
                {designerOpen === t.id ? 'Close' : '🤖 Design'}
              </button>
            </div>

            {designerOpen === t.id && (
              <JourneyDesigner
                templateId={t.id}
                onSaved={(runsheet) => {
                  setTemplates(prev => prev.map(tp => tp.id === t.id ? { ...tp, runsheet, duration_minutes: runsheet.reduce((s, p) => s + (p.duration || 0), 0) } : tp))
                  setDesignerOpen(null)
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
