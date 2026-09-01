/**
 * LifeMapReview.jsx — Card 1: Review your life story by era
 *
 * Shows raw Life Map responses organized by life period.
 * "Would you like to add more?" opens Life Map in append mode.
 * "Looks good" marks the card complete.
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getEraResponses } from '../../lib/directionEngine'
import { supabase } from '../../lib/supabaseClient'
import { hapticLight, hapticSuccess } from '../../lib/haptics'
import './LifeMapReview.css'

const ERA_ICONS = {
  childhood: '🧒',
  teens: '🎒',
  young_adult: '🎓',
  career: '💼',
  now: '✦',
}

export default function LifeMapReview({ userId, onComplete, onClose }) {
  const navigate = useNavigate()
  const [eras, setEras] = useState(null)
  const [expanded, setExpanded] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getEraResponses(userId).then(data => {
      setEras(data)
      // Auto-expand first era
      if (data?.length) setExpanded(new Set([data[0].key]))
      setLoading(false)
    })
  }, [userId])

  const toggleEra = (key) => {
    hapticLight()
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const handleLooksGood = async () => {
    if (saving) return
    setSaving(true)
    hapticSuccess()

    await supabase.from('direction_reveals').upsert({
      user_id: userId,
      reveal_type: 'life_map_review',
      reveal_data: { reviewed_at: new Date().toISOString(), era_count: eras?.length || 0 },
    }, { onConflict: 'user_id,reveal_type' })

    onComplete?.()
  }

  const handleAddMore = () => {
    navigate('/life-map?append=true')
  }

  if (loading) {
    return (
      <div className="lmr-container">
        <div className="lmr-loading">Loading your story...</div>
      </div>
    )
  }

  if (!eras) {
    return (
      <div className="lmr-container">
        <button className="lmr-close" onClick={onClose}>&times;</button>
        <div className="lmr-empty">
          <div className="lmr-empty-icon">📖</div>
          <h2>Tell your life story first</h2>
          <p>The Life Map helps us understand what drives you. Complete it to unlock your direction.</p>
          <button className="lmr-cta" onClick={() => navigate('/life-map')}>
            Start Life Map
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="lmr-container">
      <button className="lmr-close" onClick={onClose}>&times;</button>

      <div className="lmr-header">
        <h2 className="lmr-title">Your story so far</h2>
        <p className="lmr-subtitle">Everything you shared, organized by when it happened.</p>
      </div>

      <div className="lmr-eras">
        {eras.map(era => (
          <div key={era.key} className={`lmr-era ${expanded.has(era.key) ? 'expanded' : ''}`}>
            <button className="lmr-era-header" onClick={() => toggleEra(era.key)}>
              <span className="lmr-era-icon">{ERA_ICONS[era.key] || '•'}</span>
              <span className="lmr-era-label">{era.label}</span>
              <span className="lmr-era-count">
                {era.skills.length + era.problems.length + era.personas.length}
              </span>
              <span className="lmr-era-chevron">{expanded.has(era.key) ? '▾' : '▸'}</span>
            </button>

            {expanded.has(era.key) && (
              <div className="lmr-era-body">
                {era.skills.length > 0 && (
                  <div className="lmr-category">
                    <div className="lmr-cat-label">Skills</div>
                    {era.skills.map((s, i) => (
                      <div key={i} className="lmr-item">{typeof s === 'string' ? s : s.text || s}</div>
                    ))}
                  </div>
                )}
                {era.problems.length > 0 && (
                  <div className="lmr-category">
                    <div className="lmr-cat-label">Challenges</div>
                    {era.problems.map((p, i) => (
                      <div key={i} className="lmr-item">{typeof p === 'string' ? p : p.text || p}</div>
                    ))}
                  </div>
                )}
                {era.personas.length > 0 && (
                  <div className="lmr-category">
                    <div className="lmr-cat-label">People</div>
                    {era.personas.map((p, i) => (
                      <div key={i} className="lmr-item">{typeof p === 'string' ? p : p.text || p}</div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="lmr-actions">
        <button className="lmr-cta" onClick={handleLooksGood} disabled={saving}>
          {saving ? 'Saving...' : 'Looks good, continue'}
        </button>
        <button className="lmr-secondary" onClick={handleAddMore}>
          Add more to your story
        </button>
      </div>
    </div>
  )
}
