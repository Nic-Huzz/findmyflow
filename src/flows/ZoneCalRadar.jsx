import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { ZONE_CAL_DIMENSIONS, getDiagnosis, getNextSpoke } from '../data/zoneCalDimensions'
import GenericRadar from '../components/GenericRadar'
import PublicEmailGate from '../components/PublicEmailGate'
import { hapticLight, hapticSuccess } from '../lib/haptics'
import { createFunnelTracker } from '../lib/funnelTracker'
import './ZoneCalRadar.css'

/**
 * ZoneCalRadar - Lead magnet at /try/zone-cal-radar
 *
 * 8 dimensions, 5 levels each, arranged as a journey:
 * Repair (Identity > Vulnerability > Direction > Worth) then
 * Build (Growth > Output > Risk > Play)
 *
 * Flow: Hook > 8 questions (tier cards, auto-advance) > Email Gate > Calculating > Results
 */

const STAGE_ORDER = ['hook', ...ZONE_CAL_DIMENSIONS.map(d => d.id), 'email_gate', 'calculating', 'results']
const STORAGE_KEY = 'zone_cal_radar_progress'
const PROGRESS_TTL = 24 * 60 * 60 * 1000
const CALC_LABELS = [
  'Reading your answers...',
  'Mapping your 8 dimensions...',
  'Checking the sequence...',
  'Finding your diagnosis...',
  'Building your shape...',
]

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (Date.now() - (data.saved_at || 0) > PROGRESS_TTL) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    return data
  } catch { return null }
}

function saveProgress(stage, answers) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ stage, answers, saved_at: Date.now() }))
  } catch {}
}

function clearProgress() {
  try { localStorage.removeItem(STORAGE_KEY) } catch {}
}

export default function ZoneCalRadar() {
  const saved = useRef(loadProgress())
  const [stage, setStage] = useState(() => saved.current?.stage || 'hook')
  const [answers, setAnswers] = useState(() => saved.current?.answers || {})
  const [utmParams, setUtmParams] = useState({})
  const [calcStep, setCalcStep] = useState(0)
  const radarRef = useRef(null)
  const tracker = useRef(createFunnelTracker('zone_cal_radar'))
  const submittedRef = useRef(false)
  const advanceTimer = useRef(null)

  // Persist progress (not on calculating/results)
  useEffect(() => {
    if (['calculating', 'results'].includes(stage)) return
    saveProgress(stage, answers)
  }, [stage, answers])

  // Track funnel steps
  useEffect(() => {
    const idx = STAGE_ORDER.indexOf(stage)
    if (idx >= 0) tracker.current.step(stage, idx)
  }, [stage])

  // Capture UTM params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setUtmParams({
      utm_source: params.get('utm_source') || null,
      utm_medium: params.get('utm_medium') || null,
      utm_campaign: params.get('utm_campaign') || null,
      referrer: document.referrer || null,
    })
  }, [])

  // Scroll to top on stage change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [stage])

  // Calculating animation
  useEffect(() => {
    if (stage !== 'calculating') return
    let i = 0
    const interval = setInterval(() => {
      i++
      if (i < CALC_LABELS.length) setCalcStep(i)
      else { clearInterval(interval); setStage('results') }
    }, 500)
    return () => clearInterval(interval)
  }, [stage])

  const currentDim = ZONE_CAL_DIMENSIONS.find(d => d.id === stage)
  const currentDimIndex = ZONE_CAL_DIMENSIONS.findIndex(d => d.id === stage)

  const goBack = () => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current)
    const idx = STAGE_ORDER.indexOf(stage)
    if (idx > 0) setStage(STAGE_ORDER[idx - 1])
  }

  const handleTierSelect = useCallback((dimId, level) => {
    hapticLight()
    setAnswers(prev => ({ ...prev, [dimId]: level }))
    // Cancel any pending auto-advance, then set a new one
    if (advanceTimer.current) clearTimeout(advanceTimer.current)
    advanceTimer.current = setTimeout(() => {
      const idx = STAGE_ORDER.indexOf(dimId)
      if (idx < STAGE_ORDER.length - 1) setStage(STAGE_ORDER[idx + 1])
      advanceTimer.current = null
    }, 300)
  }, [])

  const handleEmailSubmit = useCallback(async (submittedEmail, submittedName) => {
    if (submittedRef.current) return
    submittedRef.current = true

    setCalcStep(0)
    setStage('calculating')

    const diagnosis = Object.keys(answers).length === 8
      ? getDiagnosis(answers)
      : { id: 'incomplete' }

    try {
      await supabase.from('lead_captures').insert({
        email: submittedEmail,
        source: 'zone-cal-radar',
        scores: {
          dimensions: answers,
          diagnosis: diagnosis.id,
        },
        metadata: { name: submittedName || null, ...utmParams },
      })

      clearProgress()

      supabase.functions.invoke('notify-lead-capture', {
        body: {
          email: submittedEmail,
          name: submittedName,
          source: 'Zone Cal Radar',
          meta: { scores: answers, diagnosis: diagnosis.id },
        },
      }).catch(() => {})
    } catch (err) {
      console.error('Error saving zone cal data:', err)
      submittedRef.current = false
      setStage('email_gate')
    }
  }, [answers, utmParams])

  const handleShare = useCallback(async () => {
    if (!radarRef.current) return
    try {
      const { default: html2canvas } = await import('html2canvas')
      const canvas = await html2canvas(radarRef.current, {
        backgroundColor: '#f5f5f0',
        scale: 2,
        useCORS: true,
      })
      canvas.toBlob(async (blob) => {
        if (!blob) return
        const file = new File([blob], 'zone-cal-radar.png', { type: 'image/png' })
        if (navigator.share && navigator.canShare?.({ files: [file] })) {
          await navigator.share({
            title: 'My Zone Cal Radar',
            text: 'Where am I on the self-actualisation map?',
            files: [file],
          })
        } else {
          const a = document.createElement('a')
          a.href = URL.createObjectURL(blob)
          a.download = 'zone-cal-radar.png'
          a.click()
          URL.revokeObjectURL(a.href)
        }
      }, 'image/png')
    } catch {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href)
      }
    }
  }, [])

  const diagnosis = Object.keys(answers).length === 8 ? getDiagnosis(answers) : null
  const nextSpoke = Object.keys(answers).length === 8 ? getNextSpoke(answers) : null
  const isRepairPhase = currentDimIndex >= 0 && currentDimIndex <= 3

  return (
    <div className="zcr flow-base">
      <div className="zcr-inner">

        {/* Hook */}
        {stage === 'hook' && (
          <div className="zcr-hook">
            <div className="zcr-hook-emoji">🧭</div>
            <h1>Where are you on the map?</h1>
            <p className="zcr-hook-sub">
              8 questions. 90 seconds. See your self-actualisation shape.
            </p>
            <p className="zcr-hook-desc">
              Your life has 8 dimensions. Some are strong. Some are flat.
              The shape tells you where you are, what's blocking you,
              and the one thing to focus on next.
            </p>
            <button className="primary-button" onClick={() => setStage(STAGE_ORDER[1])}>
              See my shape
            </button>
          </div>
        )}

        {/* Questions: tier card picker, one dimension at a time */}
        {currentDim && (
          <div className="zcr-question" key={currentDim.id}>
            {/* Progress dots */}
            <div className="zcr-progress">
              {ZONE_CAL_DIMENSIONS.map((d, i) => (
                <div
                  key={d.id}
                  className={`zcr-progress-dot ${i <= currentDimIndex ? 'active' : ''} ${i === currentDimIndex ? 'current' : ''}`}
                />
              ))}
            </div>

            {/* Phase label */}
            <div className="zcr-phase-label">
              {isRepairPhase ? 'Inner work' : 'Outer work'} · {currentDimIndex + 1} of 8
            </div>

            {/* Back button */}
            {currentDimIndex > 0 && (
              <button className="zcr-back" onClick={goBack}>Back</button>
            )}

            <div className="zcr-q-emoji">{currentDim.emoji}</div>
            <h2 className="zcr-q-title">{currentDim.name}</h2>
            <p className="zcr-q-text">{currentDim.question}</p>

            {/* Tier cards */}
            <div className="zcr-tiers">
              {currentDim.levels.map(tier => (
                <div
                  key={tier.level}
                  className={`zcr-tier ${answers[currentDim.id] === tier.level ? 'selected' : ''}`}
                  onClick={() => handleTierSelect(currentDim.id, tier.level)}
                >
                  <div className="zcr-tier-level">{tier.level}</div>
                  <div className="zcr-tier-content">
                    <div className="zcr-tier-label">{tier.label}</div>
                    <div className="zcr-tier-desc">{tier.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Email Gate */}
        {stage === 'email_gate' && (
          <div className="zcr-email">
            <PublicEmailGate
              flowType="zone_cal_radar"
              onEmailSubmit={handleEmailSubmit}
              title="Your shape is ready"
              subtitle="Enter your details to see your Zone Cal radar"
            />
          </div>
        )}

        {/* Calculating */}
        {stage === 'calculating' && (
          <div className="zcr-calculating">
            <div className="typing-indicator"><span /><span /><span /></div>
            <p className="zcr-calc-label">{CALC_LABELS[calcStep]}</p>
          </div>
        )}

        {/* Results */}
        {stage === 'results' && diagnosis && (
          <div className="zcr-results">
            <div className="zcr-results-card" ref={radarRef}>
              <h1 className="zcr-results-headline">{diagnosis.name}</h1>
              <p className="zcr-results-tagline">{diagnosis.headline}</p>

              <GenericRadar
                dimensions={ZONE_CAL_DIMENSIONS}
                scores={answers}
                maxLevel={5}
                size={320}
              />

              <p className="zcr-results-summary">{diagnosis.description}</p>
            </div>

            {/* Next spoke card */}
            {nextSpoke && (
              <div className="zcr-next-spoke">
                <h3>Your next spoke</h3>
                <div className="zcr-spoke-card">
                  <span className="zcr-spoke-emoji">{nextSpoke.emoji}</span>
                  <div>
                    <strong>{nextSpoke.name}</strong>
                    <p>{nextSpoke.question}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Dimension breakdown */}
            <div className="zcr-breakdown">
              <h3>Your 8 dimensions</h3>
              {ZONE_CAL_DIMENSIONS.map(dim => {
                const val = answers[dim.id] || 0
                const tier = dim.levels.find(l => l.level === val)
                return (
                  <div key={dim.id} className={`zcr-dim-row ${val <= 2 ? 'low' : val >= 4 ? 'high' : ''}`}>
                    <span className="zcr-dim-emoji">{dim.emoji}</span>
                    <div className="zcr-dim-info">
                      <strong>{dim.name}: {val}/5</strong>
                      <span className="zcr-dim-tier-label">{tier?.label}</span>
                    </div>
                  </div>
                )
              })}
            </div>

            <button className="primary-button zcr-share-btn" onClick={handleShare}>
              Share my shape
            </button>

            <div className="zcr-results-cta">
              <p>Your shape shows where you are. Vibe Rise helps you move.</p>
              <a href="/get-started" className="primary-button">Start the journey</a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
