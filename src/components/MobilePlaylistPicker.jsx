import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { GROAN_VISIBILITY_LAYERS } from '../lib/stageConfig'
import { createGroanChallenge, acceptGroanChallenge } from '../lib/crm/groanChallengeService'
import { getWeekStartLocal } from '../lib/dateUtils'
import './MobilePlaylistPicker.css'

export default function MobilePlaylistPicker({
  userId,
  onChallengeAccepted,
  layerLockStatus,
}) {
  const [step, setStep] = useState('skills') // skills | layer | challenge | day | success
  const [skills, setSkills] = useState([])
  const [selectedSkill, setSelectedSkill] = useState(null)
  const [selectedLayer, setSelectedLayer] = useState(null)
  const [selectedDay, setSelectedDay] = useState(null)
  const [challengeText, setChallengeText] = useState('')
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState(null)
  const [showLayerExplainer, setShowLayerExplainer] = useState(false)
  const successTimerRef = useRef(null)

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => { if (successTimerRef.current) clearTimeout(successTimerRef.current) }
  }, [])

  useEffect(() => {
    if (!userId) return
    supabase
      .from('nikigai_clusters')
      .select('id, cluster_label, cluster_type, proficiency, insight')
      .eq('user_id', userId)
      .eq('cluster_type', 'skills')
      .order('proficiency', { ascending: false })
      .then(({ data }) => {
        const map = new Map()
        for (const item of (data || [])) {
          if (!map.has(item.cluster_label)) map.set(item.cluster_label, item)
        }
        setSkills([...map.values()])
      })
  }, [userId])

  const handleSaveChallenge = async () => {
    if (!challengeText.trim() || !selectedSkill || !selectedLayer || !selectedDay || saving) return
    setSaving(true)
    setError(null)
    try {
      const title = `${challengeText.trim()} (${selectedDay})`
      const { data: dbRecord, error: saveError } = await createGroanChallenge({
        userId,
        title,
        description: `${selectedSkill.cluster_label} × ${GROAN_VISIBILITY_LAYERS.find(l => l.id === selectedLayer)?.label || selectedLayer}`,
        visibilityLayer: selectedLayer,
        sourceType: 'skill',
        sourceId: selectedSkill.id,
        sourceLabel: selectedSkill.cluster_label,
        scaryScore: 5,
        wahooScore: 5,
      })
      if (saveError) throw saveError

      const { error: acceptError } = await acceptGroanChallenge(dbRecord.id)
      if (acceptError) throw acceptError

      // Insert into priority_weekly_picks so it shows as active challenge
      const { error: pickError } = await supabase.from('priority_weekly_picks').insert({
        user_id: userId,
        week_start_date: getWeekStartLocal(),
        pick_type: 'groan',
        reference_id: dbRecord.id,
        display_name: title,
      })
      if (pickError) console.warn('Error saving weekly pick:', pickError)

      // Notify parent to refresh active challenges list
      onChallengeAccepted?.()

      // Show success, then reset
      setStep('success')
      successTimerRef.current = setTimeout(() => {
        setChallengeText('')
        setSelectedSkill(null)
        setSelectedLayer(null)
        setSelectedDay(null)
        setStep('skills')
      }, 1500)
    } catch (err) {
      console.error('Error saving challenge:', err)
      setError('Failed to save challenge. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (step === 'success') {
    return (
      <div className="mpp-container">
        <div className="mpp-section-card mpp-success-card">
          <div className="mpp-success-icon">✅</div>
          <p className="mpp-success-text">Challenge confirmed!</p>
        </div>
      </div>
    )
  }

  if (step === 'skills') {
    return (
      <div className="mpp-container">
        <div className="mpp-section-card">
          <div className="mpp-section-header">
            <div className="mpp-section-header-left">
              <span className="mpp-section-icon">🎯</span>
              <span className="mpp-section-title">Choose a skill to challenge</span>
            </div>
            <span className="mpp-section-count">{skills.length}</span>
          </div>
          <div className="mpp-section-items">
            {skills.map(skill => (
              <button key={skill.id} className="mpp-item-row"
                onClick={() => { setSelectedSkill(skill); setStep('layer') }}>
                <div className="mpp-item-body">
                  <div className="mpp-item-name">{skill.cluster_label}</div>
                </div>
                <span className="mpp-item-arrow">&rsaquo;</span>
              </button>
            ))}
          </div>
        </div>
        {skills.length === 0 && (
          <p className="mpp-empty">Complete Flow Finder to discover your skills first.</p>
        )}
      </div>
    )
  }

  if (step === 'layer') {
    return (
      <div className="mpp-container">
        <button className="mpp-back" onClick={() => setStep('skills')}>
          &larr; {selectedSkill?.cluster_label}
        </button>
        <div className="mpp-section-card">
          <div className="mpp-section-header">
            <div className="mpp-section-header-left">
              <span className="mpp-section-icon">👁</span>
              <span className="mpp-section-title">Choose visibility level</span>
            </div>
            <button className="mpp-explainer-btn" onClick={() => setShowLayerExplainer(true)}>
              Explainer
            </button>
          </div>
          <div className="mpp-section-items">
            {GROAN_VISIBILITY_LAYERS.map(layer => {
              const locked = layerLockStatus?.[layer.id]?.locked
              return (
                <button key={layer.id}
                  className={`mpp-item-row ${locked ? 'locked' : ''}`}
                  disabled={locked}
                  onClick={() => {
                    setSelectedLayer(layer.id)
                    setStep('challenge')
                  }}>
                  <div className="mpp-item-body">
                    <div className="mpp-item-name">{locked ? '🔒' : layer.icon} {layer.label}</div>
                  </div>
                  {!locked && <span className="mpp-item-arrow">&rsaquo;</span>}
                </button>
              )
            })}
          </div>
        </div>

        {showLayerExplainer && (
          <div className="mpp-overlay" onClick={() => setShowLayerExplainer(false)}>
            <div className="mpp-overlay-card" onClick={e => e.stopPropagation()}>
              <div className="mpp-overlay-header">
                <h3>Visibility Layers</h3>
                <button className="mpp-overlay-close" onClick={() => setShowLayerExplainer(false)}>&times;</button>
              </div>
              {GROAN_VISIBILITY_LAYERS.map(layer => (
                <div key={layer.id} className="mpp-explainer-layer">
                  <div className="mpp-explainer-layer-top">
                    <span className="mpp-explainer-icon">{layer.icon}</span>
                    <div>
                      <div className="mpp-explainer-label">{layer.label}</div>
                      <div className="mpp-explainer-fear">{layer.fear}</div>
                    </div>
                  </div>
                  <p className="mpp-explainer-desc">{layer.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Step 3: enter challenge text
  if (step === 'challenge') {
    const layerObj = GROAN_VISIBILITY_LAYERS.find(l => l.id === selectedLayer)
    return (
      <div className="mpp-container">
        <button className="mpp-back" onClick={() => setStep('layer')}>
          &larr; {layerObj?.icon} {layerObj?.label}
        </button>
        <div className="mpp-section-card">
          <div className="mpp-section-header">
            <div className="mpp-section-header-left">
              <span className="mpp-section-icon">✏️</span>
              <span className="mpp-section-title">What's your challenge?</span>
            </div>
          </div>
          <div className="mpp-challenge-form">
            <div className="mpp-step-context">
              {selectedSkill?.cluster_label} × {layerObj?.label}
            </div>
            <input
              type="text"
              className="mpp-challenge-input"
              placeholder="Type your challenge..."
              value={challengeText}
              onChange={e => setChallengeText(e.target.value)}
            />
            <button
              className="mpp-gold-btn"
              disabled={!challengeText.trim()}
              onClick={() => setStep('day')}
            >
              Next
            </button>
            <button
              className="mpp-ai-btn"
              disabled={generating}
              onClick={async () => {
                setGenerating(true)
                try {
                  const { data } = await supabase.functions.invoke('groan-challenge-generator', {
                    body: {
                      sourceType: 'skill',
                      sourceLabel: selectedSkill.cluster_label,
                      sourceInsight: selectedSkill.insight || '',
                      visibilityLayer: selectedLayer,
                    }
                  })
                  if (data?.title) setChallengeText(data.title)
                } catch (err) {
                  console.error('AI generation error:', err)
                } finally {
                  setGenerating(false)
                }
              }}
            >
              {generating ? 'Generating...' : 'Generate Inspiration with AI'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Step 4: pick a day
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  if (step === 'day') {
    const layerObj = GROAN_VISIBILITY_LAYERS.find(l => l.id === selectedLayer)
    return (
      <div className="mpp-container">
        <button className="mpp-back" onClick={() => setStep('challenge')}>
          &larr; {challengeText}
        </button>
        <div className="mpp-section-card">
          <div className="mpp-section-header">
            <div className="mpp-section-header-left">
              <span className="mpp-section-icon">📅</span>
              <span className="mpp-section-title">Pick a day</span>
            </div>
          </div>
          <div className="mpp-section-items">
            {DAYS.map(day => (
              <button key={day} className="mpp-item-row"
                disabled={saving}
                onClick={() => { setSelectedDay(day) }}>
                <div className="mpp-item-body">
                  <div className="mpp-item-name">{day}</div>
                </div>
                {selectedDay === day ? (
                  <span className="mpp-item-check-mark">✓</span>
                ) : (
                  <span className="mpp-item-arrow">&rsaquo;</span>
                )}
              </button>
            ))}
          </div>
          <button
            className="mpp-gold-btn mpp-gold-btn-spaced"
            disabled={!selectedDay || saving}
            onClick={handleSaveChallenge}
          >
            {saving ? 'Saving...' : 'Accept Challenge'}
          </button>
          {error && <p className="mpp-error">{error}</p>}
        </div>
      </div>
    )
  }

  return null
}
