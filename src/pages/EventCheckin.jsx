/**
 * EventCheckin.jsx — /event/:experienceId/checkin
 * Attendee check-in page for before/after state tracking.
 * Scanned via QR code at events. Creates app trial users.
 */
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabaseClient'
import { submitEventCheckin } from '../lib/experienceTemplateService'
import { hapticLight, hapticSuccess } from '../lib/haptics'
import './EventCheckin.css'

const STATES = [
  { id: 'dorsal', label: 'Shutdown', emoji: '😶', desc: 'Numb, low energy, checked out', color: '#6b7280' },
  { id: 'sympathetic', label: 'Activated', emoji: '😰', desc: 'Anxious, restless, on edge', color: '#ef4444' },
  { id: 'ventral', label: 'Safe', emoji: '😌', desc: 'Calm, present, grounded', color: '#10b981' },
  { id: 'vibe_rise', label: 'Vibe Rise', emoji: '🔥', desc: 'Alive, expressed, fully here', color: '#E9A23B' },
]

export default function EventCheckin() {
  const { experienceId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [experience, setExperience] = useState(null)
  const [existing, setExisting] = useState({ before: null, after: null })
  const [selected, setSelected] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  // Determine check-in type: if before exists, this is an after check-in
  const checkinType = existing.before && !existing.after ? 'after' : !existing.before ? 'before' : 'done'

  useEffect(() => {
    if (!user || !experienceId) return
    Promise.all([
      supabase.from('experiences').select('name, experience_date, user_id').eq('id', experienceId).single(),
      supabase.from('event_checkins').select('checkin_type, state').eq('experience_id', experienceId).eq('user_id', user.id),
    ]).then(([{ data: exp }, { data: checkins }]) => {
      setExperience(exp)
      const before = checkins?.find(c => c.checkin_type === 'before')
      const after = checkins?.find(c => c.checkin_type === 'after')
      setExisting({ before: before?.state || null, after: after?.state || null })
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [user, experienceId])

  const handleSubmit = async () => {
    if (!selected || saving || !experience) return
    setSaving(true)
    hapticLight()
    try {
      await submitEventCheckin(experienceId, user.id, experience.user_id, checkinType, selected)
      hapticSuccess()
      setSaved(true)
      if (checkinType === 'before') {
        setExisting(prev => ({ ...prev, before: selected }))
      } else {
        setExisting(prev => ({ ...prev, after: selected }))
      }
    } catch (err) {
      console.error('Check-in error:', err)
    }
    setSaving(false)
  }

  if (!user) {
    return (
      <div className="ec-page">
        <div className="ec-container">
          <div className="ec-icon">🎪</div>
          <h1 className="ec-title">Event Check-in</h1>
          <p className="ec-sub">Sign in to check in for this experience</p>
          <button className="ec-cta" onClick={() => navigate(`/log-in?returnTo=/event/${experienceId}/checkin`)}>
            Sign In →
          </button>
        </div>
      </div>
    )
  }

  if (loading) return <div className="ec-page"><div className="ec-container"><div className="ec-loading">Loading...</div></div></div>

  if (!experience) return (
    <div className="ec-page">
      <div className="ec-container">
        <div className="ec-icon">❌</div>
        <h1 className="ec-title">Experience not found</h1>
        <p className="ec-sub">This check-in link may be invalid or the experience may have been removed.</p>
      </div>
    </div>
  )

  // Both check-ins complete — show shift result
  if (checkinType === 'done' || (saved && checkinType === 'after')) {
    const beforeState = STATES.find(s => s.id === existing.before)
    const afterState = STATES.find(s => s.id === (existing.after || selected))
    return (
      <div className="ec-page">
        <div className="ec-container">
          <div className="ec-icon">✨</div>
          <h1 className="ec-title">Your Shift</h1>
          {experience && <p className="ec-event-name">{experience.name}</p>}
          <div className="ec-shift">
            <div className="ec-shift-state">
              <span className="ec-shift-emoji">{beforeState?.emoji}</span>
              <span className="ec-shift-label">{beforeState?.label}</span>
            </div>
            <span className="ec-shift-arrow">→</span>
            <div className="ec-shift-state">
              <span className="ec-shift-emoji">{afterState?.emoji}</span>
              <span className="ec-shift-label">{afterState?.label}</span>
            </div>
          </div>
          <button className="ec-cta" onClick={() => navigate('/7-day-challenge')}>
            Keep the Vibe Rising →
          </button>
        </div>
      </div>
    )
  }

  // Saved before — waiting for after
  if (saved && checkinType === 'before') {
    return (
      <div className="ec-page">
        <div className="ec-container">
          <div className="ec-icon">✅</div>
          <h1 className="ec-title">Checked In</h1>
          <p className="ec-sub">Enjoy the experience. Check in again after to see your shift.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="ec-page">
      <div className="ec-container">
        <div className="ec-icon">{checkinType === 'before' ? '🎪' : '🔥'}</div>
        <h1 className="ec-title">
          {checkinType === 'before' ? 'How are you feeling?' : 'How do you feel now?'}
        </h1>
        {experience && <p className="ec-event-name">{experience.name}</p>}
        <p className="ec-sub">
          {checkinType === 'before'
            ? 'Quick check-in before we start. Tap the one that fits.'
            : 'The experience is over. What state are you in now?'
          }
        </p>

        <div className="ec-states">
          {STATES.map(s => (
            <button
              key={s.id}
              className={`ec-state-btn ${selected === s.id ? 'selected' : ''}`}
              onClick={() => { hapticLight(); setSelected(s.id) }}
              style={selected === s.id ? { borderColor: s.color, background: `${s.color}15` } : {}}
            >
              <span className="ec-state-emoji">{s.emoji}</span>
              <div>
                <div className="ec-state-label">{s.label}</div>
                <div className="ec-state-desc">{s.desc}</div>
              </div>
            </button>
          ))}
        </div>

        <button className="ec-cta" onClick={handleSubmit} disabled={!selected || saving}>
          {saving ? 'Saving...' : 'Check In'}
        </button>
      </div>
    </div>
  )
}
