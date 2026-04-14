/**
 * WoundMapFlow.jsx
 *
 * Level 0 quest: Map Your Origin Story
 * 4-stage wound diagnostic (infancy → teens) where users tap
 * which Pixar scene resonates with their experience.
 *
 * Steps:
 *   1-4: Wound stages (scene selection, auto-advance)
 *   5:   Reveal (dominant archetype summary)
 *
 * Saves to journey_onboarding_selections table.
 * Route: /wound-map?returnTo=/7-day-challenge
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import { WOUND_STAGES, ARCHETYPES } from '../data/woundStages'
import './WoundMapFlow.css'

const TIEBREAK_ORDER = ['sympathetic', 'dorsal', 'ventral']

function getDominantArchetype(selections) {
  const counts = {}
  for (const stageId of Object.keys(selections)) {
    const sceneId = selections[stageId]
    const stage = WOUND_STAGES.find(s => s.id === stageId)
    const scene = stage?.scenes.find(s => s.id === sceneId)
    if (scene?.archetype) {
      counts[scene.archetype] = (counts[scene.archetype] || 0) + 1
    }
  }
  const max = Math.max(0, ...Object.values(counts))
  if (max === 0) return null
  const tied = Object.keys(counts).filter(a => counts[a] === max)
  return TIEBREAK_ORDER.find(a => tied.includes(a)) || tied[0]
}

export default function WoundMapFlow() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const returnTo = searchParams.get('returnTo') || '/7-day-challenge'

  const [stageIndex, setStageIndex] = useState(0)
  const [selections, setSelections] = useState({})
  const [showReveal, setShowReveal] = useState(false)
  const [saving, setSaving] = useState(false)

  // Transition state
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isEntering, setIsEntering] = useState(true)
  const [slideDirection, setSlideDirection] = useState('right')
  const autoAdvanceRef = useRef(null)

  useEffect(() => {
    return () => {
      if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current)
    }
  }, [])

  useEffect(() => {
    if (isEntering) {
      const timer = setTimeout(() => setIsEntering(false), 400)
      return () => clearTimeout(timer)
    }
  }, [isEntering, stageIndex, showReveal])

  // Hide bottom toolbar
  useEffect(() => {
    document.body.classList.add('modal-active')
    return () => document.body.classList.remove('modal-active')
  }, [])

  const transitionTo = useCallback((setter, value, direction = 'right') => {
    if (isTransitioning) return
    setSlideDirection(direction)
    setIsTransitioning(true)
    setTimeout(() => {
      setter(value)
      setIsTransitioning(false)
      setIsEntering(true)
    }, 250)
  }, [isTransitioning])

  const handleSceneSelect = (stageId, sceneId) => {
    if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current)

    const newSelections = { ...selections, [stageId]: sceneId }
    setSelections(newSelections)

    autoAdvanceRef.current = setTimeout(() => {
      if (stageIndex < WOUND_STAGES.length - 1) {
        transitionTo(setStageIndex, stageIndex + 1, 'right')
      } else {
        // All stages done — show reveal
        transitionTo(setShowReveal, true, 'right')
      }
      autoAdvanceRef.current = null
    }, 600)
  }

  const handleBack = () => {
    if (showReveal) {
      setStageIndex(WOUND_STAGES.length - 1)
      transitionTo(setShowReveal, false, 'left')
      return
    }
    if (stageIndex > 0) {
      transitionTo(setStageIndex, stageIndex - 1, 'left')
    } else {
      navigate(returnTo)
    }
  }

  const handleSave = async () => {
    if (!user?.id || saving) return
    setSaving(true)

    try {
      const rows = WOUND_STAGES.map(stage => {
        const sceneId = selections[stage.id]
        const scene = stage.scenes.find(s => s.id === sceneId)
        return {
          user_id: user.id,
          stage_id: stage.id,
          scene_id: sceneId,
          zone: scene?.zone || null,
          archetype: scene?.archetype || null,
        }
      }).filter(r => r.scene_id)

      const { error } = await supabase
        .from('journey_onboarding_selections')
        .upsert(rows, { onConflict: 'user_id,stage_id' })

      if (error) console.warn('Failed to save wound map:', error)

      // Award XP for completing wound map
      const { data: existing } = await supabase.from('quest_completions')
        .select('id').eq('user_id', user.id).eq('quest_id', 'wound_map').maybeSingle()
      if (!existing) {
        await supabase.from('quest_completions').insert({
          user_id: user.id,
          quest_id: 'wound_map',
          quest_category: 'Healing',
          quest_type: 'Recognise',
          points_earned: 8,
          challenge_day: 0,
        }).catch(() => {})
      }
    } catch (err) {
      console.warn('Wound map save error:', err)
    }

    setSaving(false)
    navigate(returnTo)
  }

  const transitionClass = `${isTransitioning ? 'wm-transitioning' : ''} ${isEntering ? 'wm-entering' : ''}`
  const directionClass = slideDirection === 'left' ? 'wm-slide-left' : 'wm-slide-right'
  const dominant = getDominantArchetype(selections)
  const dominantInfo = dominant ? ARCHETYPES[dominant] : null

  // ─── Reveal Step ──────────────────────────────────────────────────────────

  if (showReveal) {
    return (
      <div className={`wound-map-flow wm-reveal ${transitionClass} ${directionClass}`}>
        <div className="wm-content">
          <div className="wm-reveal-header">
            <div className="wm-reveal-icon" style={{ color: dominantInfo?.color }}>
              {dominantInfo?.icon}
            </div>
            <h2 className="wm-reveal-title">Your Origin Pattern</h2>
            <p className="wm-reveal-label" style={{ color: dominantInfo?.color }}>
              {dominantInfo?.label}
            </p>
          </div>

          <p className="wm-reveal-desc">{dominantInfo?.description}</p>

          <div className="wm-reveal-stages">
            {WOUND_STAGES.map(stage => {
              const sceneId = selections[stage.id]
              const scene = stage.scenes.find(s => s.id === sceneId)
              if (!scene) return null
              return (
                <div key={stage.id} className="wm-reveal-stage-row">
                  <span className="wm-reveal-stage-label">{stage.subtitle}</span>
                  <span className="wm-reveal-stage-scene" style={{ color: scene.color }}>
                    {scene.name}
                  </span>
                </div>
              )
            })}
          </div>

          <button className="wm-save-btn" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Continue'}
          </button>
        </div>

        <button className="wm-back-btn" onClick={handleBack}>
          &#8592; Back
        </button>
      </div>
    )
  }

  // ─── Stage Selection ──────────────────────────────────────────────────────

  const stage = WOUND_STAGES[stageIndex]
  const selectedScene = selections[stage.id]

  return (
    <div className={`wound-map-flow ${transitionClass} ${directionClass}`}>
      {/* Stage progress dots */}
      <div className="wm-progress">
        {WOUND_STAGES.map((s, i) => (
          <span
            key={s.id}
            className={`wm-dot ${i === stageIndex ? 'active' : i < stageIndex ? 'completed' : ''}`}
          />
        ))}
      </div>

      <div className="wm-content">
        <div className="wm-header">
          <span className="wm-label">{stage.subtitle}</span>
          <h2 className="wm-title">{stage.title}</h2>
          <p className="wm-prompt">Which feels most like your experience?</p>
        </div>

        <div className="wm-scenes">
          {stage.scenes.map((scene, sceneIndex) => (
            <button
              key={scene.id}
              className={`wm-card ${selectedScene === scene.id ? 'wm-card-selected' : ''}`}
              onClick={() => handleSceneSelect(stage.id, scene.id)}
              style={{ animationDelay: `${0.1 + sceneIndex * 0.1}s` }}
            >
              {scene.image && (
                <img
                  className="wm-card-image"
                  src={scene.image}
                  alt={scene.name}
                  style={{ objectPosition: scene.focalPoint || 'center' }}
                  onError={(e) => {
                    e.target.style.display = 'none'
                    if (e.target.nextElementSibling) e.target.nextElementSibling.style.display = 'flex'
                  }}
                />
              )}
              <div
                className="wm-card-icon-fallback"
                style={{ display: scene.image ? 'none' : 'flex', background: `${scene.color}15` }}
              >
                <span>{scene.icon}</span>
              </div>
              <div className="wm-card-pill">
                <div className="wm-card-name">{scene.name}</div>
                <div className="wm-card-desc">{scene.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <button className="wm-back-btn" onClick={handleBack}>
        &#8592; Back
      </button>
    </div>
  )
}
