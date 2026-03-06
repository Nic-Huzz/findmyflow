import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { GROAN_VISIBILITY_LAYERS } from '../lib/stageConfig'
import { createGroanChallenge, acceptGroanChallenge } from '../lib/crm/groanChallengeService'
import './MobilePlaylistPicker.css'

export default function MobilePlaylistPicker({
  userId,
  onCellClick,
  layerLockStatus,
}) {
  const [step, setStep] = useState('skills') // skills | layer | day | generate
  const [skills, setSkills] = useState([])
  const [selectedSkill, setSelectedSkill] = useState(null)
  const [selectedLayer, setSelectedLayer] = useState(null)
  const [selectedDay, setSelectedDay] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [generatedChallenge, setGeneratedChallenge] = useState(null)
  const [error, setError] = useState(null)
  const [showLayerExplainer, setShowLayerExplainer] = useState(false)

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

  const handleGenerate = async () => {
    if (!selectedSkill || !selectedLayer) return
    setGenerating(true)
    setError(null)
    setGeneratedChallenge(null)
    try {
      const { data: aiData, error: aiError } = await supabase.functions.invoke('groan-challenge-generator', {
        body: {
          sourceType: 'skill',
          sourceLabel: selectedSkill.cluster_label,
          sourceInsight: selectedSkill.insight || '',
          visibilityLayer: selectedLayer,
        }
      })
      if (aiError) throw aiError
      if (!aiData?.title) throw new Error('No challenge generated')

      const { data: dbRecord, error: saveError } = await createGroanChallenge({
        userId,
        title: aiData.title,
        description: aiData.description,
        visibilityLayer: selectedLayer,
        sourceType: 'skill',
        sourceId: selectedSkill.id,
        sourceLabel: selectedSkill.cluster_label,
        scaryScore: aiData.scaryScore || 5,
        wahooScore: aiData.wahooScore || 5,
        generationPrompt: aiData.prompt,
      })
      if (saveError) throw saveError

      setGeneratedChallenge(dbRecord)
    } catch (err) {
      console.error('Error generating challenge:', err)
      setError('Failed to generate challenge. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const handleAccept = async () => {
    if (!generatedChallenge) return
    const { error: acceptError } = await acceptGroanChallenge(generatedChallenge.id)
    if (acceptError) {
      console.warn('Error accepting:', acceptError)
      return
    }
    onCellClick?.({
      sourceType: 'skill',
      sourceId: selectedSkill.id,
      sourceLabel: selectedSkill.cluster_label,
      visibilityLayer: selectedLayer,
      challenge: { ...generatedChallenge, accepted_at: new Date().toISOString() },
    })
    setGeneratedChallenge(null)
    setStep('skills')
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
                    setStep('day')
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

  // Step 3: pick a day
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  if (step === 'day') {
    const layerObj = GROAN_VISIBILITY_LAYERS.find(l => l.id === selectedLayer)
    return (
      <div className="mpp-container">
        <button className="mpp-back" onClick={() => setStep('layer')}>
          &larr; {layerObj?.icon} {layerObj?.label}
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
                onClick={() => { setSelectedDay(day); setStep('generate') }}>
                <div className="mpp-item-body">
                  <div className="mpp-item-name">{day}</div>
                </div>
                <span className="mpp-item-arrow">&rsaquo;</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Step 4: generate
  return (
    <div className="mpp-container">
      <button className="mpp-back" onClick={() => { setStep('day'); setGeneratedChallenge(null) }}>
        &larr; Change day
      </button>
      <h3 className="mpp-step-title">
        {selectedSkill?.cluster_label} &times; {GROAN_VISIBILITY_LAYERS.find(l => l.id === selectedLayer)?.label || selectedLayer} &mdash; {selectedDay}
      </h3>

      {generating && (
        <div className="mpp-generating">
          <div className="spinner" />
          <p>Generating your challenge...</p>
        </div>
      )}

      {!generating && !generatedChallenge && (
        <div className="mpp-generating">
          <button className="mpp-gold-btn" onClick={handleGenerate}>Generate Challenge</button>
          {error && <p className="mpp-error">{error}</p>}
        </div>
      )}

      {!generating && generatedChallenge && (
        <div className="mpp-challenge-card">
          <p className="mpp-challenge-text">{generatedChallenge.title}</p>
          {generatedChallenge.description && (
            <p className="mpp-challenge-desc">{generatedChallenge.description}</p>
          )}
          <button className="mpp-gold-btn" onClick={handleAccept}>Accept Challenge</button>
          <button className="mpp-regen-btn" onClick={handleGenerate}>Generate Another</button>
        </div>
      )}
    </div>
  )
}
