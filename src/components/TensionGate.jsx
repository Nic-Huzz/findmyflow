/**
 * TensionGate.jsx
 *
 * First-time gate for the 7-day challenge portal.
 * Shows 3+1 tension diagnostic questions before entering.
 * Saves scores to user_stage_progress for zone calibration.
 *
 * Created: 2026-04-01
 */

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import '../styles/flow-base.css'

const STORAGE_KEY = 'tension_gate_progress'

function computeJourneyLevel(scores) {
  if (scores.identity != null && scores.identity < 3) return { level: 1, name: 'Identity', emphasis: 'identity' }
  if (scores.vulnerability != null && scores.vulnerability < 3) return { level: 2, name: 'Vulnerability', emphasis: 'vulnerability' }
  if (scores.enough != null && scores.enough < 3) return { level: 4, name: 'Enough', emphasis: 'enough' }
  if (scores.passion != null && scores.passion < 3) return { level: 7, name: 'Passion-Risk', emphasis: 'passion' }
  return { level: 1, name: 'All Clear', emphasis: 'all_clear' }
}

export default function TensionGate({ onComplete }) {
  const { user } = useAuth()
  const [questions, setQuestions] = useState(null)
  const [currentQ, setCurrentQ] = useState(0) // 0-3
  const [scores, setScores] = useState({ identity: null, vulnerability: null, enough: null, passion: null })
  const [saving, setSaving] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isEntering, setIsEntering] = useState(true)

  const QUESTION_KEYS = ['tension_identity', 'tension_vulnerability', 'tension_enough', 'tension_passion']
  const SCORE_FIELDS = ['identity', 'vulnerability', 'enough', 'passion']

  useEffect(() => {
    fetch(`/tension-assessment-v2.json?v=${Date.now()}`)
      .then(r => r.json())
      .then(d => setQuestions(d))
      .catch(err => console.error('Failed to load tension questions:', err))
  }, [])

  useEffect(() => {
    if (isEntering) {
      const t = setTimeout(() => setIsEntering(false), 350)
      return () => clearTimeout(t)
    }
  }, [isEntering, currentQ])

  const transition = (next) => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setTimeout(() => {
      next()
      setIsTransitioning(false)
      setIsEntering(true)
    }, 200)
  }

  const handleSelect = async (score) => {
    if (isTransitioning) return

    const field = SCORE_FIELDS[currentQ]
    const newScores = { ...scores, [field]: score }
    setScores(newScores)

    // After Q3: check if Q4 needed
    if (currentQ === 2) {
      const allHigh = newScores.identity >= 2 && newScores.vulnerability >= 2 && newScores.enough >= 2
      if (allHigh) {
        transition(() => setCurrentQ(3))
      } else {
        await saveAndComplete({ ...newScores, passion: null })
      }
      return
    }

    // After Q4: done
    if (currentQ === 3) {
      await saveAndComplete(newScores)
      return
    }

    // Q1 or Q2: advance
    transition(() => setCurrentQ(currentQ + 1))
  }

  const saveAndComplete = async (finalScores) => {
    setSaving(true)
    const computed = computeJourneyLevel(finalScores)

    try {
      await supabase.from('user_stage_progress').upsert({
        user_id: user.id,
        tension_discover: finalScores.identity,
        tension_regulate: finalScores.vulnerability,
        tension_reveal: finalScores.enough,
        tension_value: finalScores.passion,
        priority_layer: computed.emphasis,
        tension_gate_completed: true,
      }, { onConflict: 'user_id' })
    } catch (err) {
      console.warn('Error saving tension data:', err)
    }

    setSaving(false)
    onComplete()
  }

  if (!questions) return null

  const qData = questions.questions?.[currentQ]
  if (!qData) return null

  const transitionClass = isTransitioning ? 'hft-transitioning' : ''
  const enterClass = isEntering ? 'hft-entering' : ''

  return (
    <div className="tension-gate flow-base" style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '20px',
      background: 'linear-gradient(135deg, #4a0ea8 0%, #5e17eb 50%, #7c3aed 100%)',
      color: 'white',
    }}>
      {/* Progress */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '2rem' }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{
            width: 8, height: 8, borderRadius: '50%',
            background: i === currentQ ? '#E9A23B' : i < currentQ ? 'rgba(233,162,59,0.5)' : 'rgba(255,255,255,0.15)',
            transform: i === currentQ ? 'scale(1.3)' : 'none',
            transition: 'all 0.3s ease',
          }} />
        ))}
      </div>

      <div className={`${transitionClass} ${enterClass}`} style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
        width: '100%', maxWidth: 480,
      }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            display: 'inline-block', background: 'rgba(233,162,59,0.2)', color: '#E9A23B',
            fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px',
            padding: '0.3rem 0.85rem', borderRadius: 20, marginBottom: '0.75rem',
          }}>
            Before we begin
          </div>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 0.5rem' }}>
            {qData.question}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', margin: 0 }}>
            Be honest. There's no wrong answer.
          </p>
        </div>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 0 }}>
          {qData.options.map((option) => (
            <button
              key={option.score}
              className="option-btn"
              onClick={() => handleSelect(option.score)}
              disabled={saving}
              style={option.image ? { display: 'flex', alignItems: 'center', gap: '0.75rem' } : undefined}
            >
              {option.image && (
                <img
                  src={option.image}
                  alt=""
                  style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover', flexShrink: 0, objectPosition: option.focalPoint || 'center' }}
                  onError={(e) => { e.target.style.display = 'none' }}
                />
              )}
              <span>{option.label}</span>
            </button>
          ))}
        </div>

        {currentQ > 0 && (
          <button
            onClick={() => transition(() => setCurrentQ(currentQ - 1))}
            style={{
              marginTop: '1rem', background: 'transparent', border: 'none',
              color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            ← Back
          </button>
        )}
      </div>
    </div>
  )
}
