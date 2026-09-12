import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { EVENT_DIMENSIONS } from '../data/eventDimensions'
import GenericRadar from '../components/GenericRadar'
import { hapticLight, hapticSuccess } from '../lib/haptics'
import { createFunnelTracker } from '../lib/funnelTracker'
import './EventRadar.css'

/**
 * EventRadar - Before/after event measurement at /try/event-radar
 *
 * 6 dimensions: Permission, Safety, Intensity, Rarity, Connection, Presence
 * Flow: Hook > Before (6 questions) > After (6 questions) > Email (optional) > Results
 *
 * Results show dual radar overlay: before (amber dashed) vs after (purple solid).
 * If email matches an existing user profile, maps the data.
 */

const PHASES = { HOOK: 'hook', BEFORE: 'before', AFTER: 'after', EMAIL: 'email', CALCULATING: 'calculating', RESULTS: 'results' }
const STORAGE_KEY = 'event_radar_progress'

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (Date.now() - (data.saved_at || 0) > 4 * 60 * 60 * 1000) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    return data
  } catch { return null }
}

function saveProgress(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, saved_at: Date.now() }))
  } catch {}
}

function clearProgress() {
  try { localStorage.removeItem(STORAGE_KEY) } catch {}
}

const CALC_LABELS = [
  'Reading your responses...',
  'Comparing before and after...',
  'Measuring the shift...',
  'Building your radar...',
]

export default function EventRadar() {
  const saved = useRef(loadProgress())
  const [phase, setPhase] = useState(() => saved.current?.phase || PHASES.HOOK)
  const [beforeScores, setBeforeScores] = useState(() => saved.current?.beforeScores || {})
  const [afterScores, setAfterScores] = useState(() => saved.current?.afterScores || {})
  const [dimIndex, setDimIndex] = useState(() => saved.current?.dimIndex || 0)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [emailError, setEmailError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [calcStep, setCalcStep] = useState(0)
  const [utmParams, setUtmParams] = useState({})
  const radarRef = useRef(null)
  const tracker = useRef(createFunnelTracker('event_radar'))
  const advanceTimer = useRef(null)

  // Persist progress
  useEffect(() => {
    if ([PHASES.CALCULATING, PHASES.RESULTS].includes(phase)) return
    saveProgress({ phase, beforeScores, afterScores, dimIndex })
  }, [phase, beforeScores, afterScores, dimIndex])

  // Track funnel steps
  useEffect(() => {
    const stepName = phase === PHASES.BEFORE ? `before_${dimIndex}` :
                     phase === PHASES.AFTER ? `after_${dimIndex}` : phase
    tracker.current.step(stepName, phase === PHASES.BEFORE ? dimIndex + 1 :
                         phase === PHASES.AFTER ? dimIndex + 7 :
                         phase === PHASES.EMAIL ? 13 :
                         phase === PHASES.RESULTS ? 15 : 0)
  }, [phase, dimIndex])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setUtmParams({
      utm_source: params.get('utm_source') || null,
      utm_medium: params.get('utm_medium') || null,
      utm_campaign: params.get('utm_campaign') || null,
      referrer: document.referrer || null,
    })
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [phase, dimIndex])

  // Calculating animation
  useEffect(() => {
    if (phase !== PHASES.CALCULATING) return
    let i = 0
    const interval = setInterval(() => {
      i++
      if (i < CALC_LABELS.length) setCalcStep(i)
      else { clearInterval(interval); setPhase(PHASES.RESULTS) }
    }, 500)
    return () => clearInterval(interval)
  }, [phase])

  const currentDim = EVENT_DIMENSIONS[dimIndex]
  const isBefore = phase === PHASES.BEFORE
  const isAfter = phase === PHASES.AFTER
  const currentScores = isBefore ? beforeScores : afterScores
  const setCurrentScores = isBefore ? setBeforeScores : setAfterScores

  const goBack = () => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current)
    if ((isBefore || isAfter) && dimIndex > 0) {
      setDimIndex(i => i - 1)
    } else if (isAfter && dimIndex === 0) {
      setPhase(PHASES.BEFORE)
      setDimIndex(EVENT_DIMENSIONS.length - 1)
    } else if (isBefore && dimIndex === 0) {
      setPhase(PHASES.HOOK)
    }
  }

  const handleSelect = useCallback((value) => {
    hapticLight()
    const dimId = EVENT_DIMENSIONS[dimIndex].id
    setCurrentScores(prev => ({ ...prev, [dimId]: value }))

    if (advanceTimer.current) clearTimeout(advanceTimer.current)
    advanceTimer.current = setTimeout(() => {
      if (dimIndex < EVENT_DIMENSIONS.length - 1) {
        setDimIndex(i => i + 1)
      } else if (isBefore) {
        setPhase(PHASES.AFTER)
        setDimIndex(0)
      } else {
        setPhase(PHASES.EMAIL)
      }
      advanceTimer.current = null
    }, 300)
  }, [dimIndex, isBefore, setCurrentScores])

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    setEmailError('')
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError('Please enter a valid email')
      return
    }
    if (submitting) return
    setSubmitting(true)

    try {
      await supabase.from('lead_captures').insert({
        email: email.trim(),
        source: 'event-radar',
        scores: { before: beforeScores, after: afterScores },
        metadata: { name: name.trim() || null, ...utmParams },
      })
      hapticSuccess()
      setSubmitted(true)
      clearProgress()
    } catch (err) {
      console.error('Event radar save error:', err)
      setEmailError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }

    setCalcStep(0)
    setPhase(PHASES.CALCULATING)
  }

  const skipEmail = () => {
    setCalcStep(0)
    setPhase(PHASES.CALCULATING)
  }

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
        const file = new File([blob], 'event-radar.png', { type: 'image/png' })
        if (navigator.share && navigator.canShare?.({ files: [file] })) {
          await navigator.share({
            title: 'My Event Radar',
            text: 'Before vs after. See what shifted.',
            files: [file],
          })
        } else {
          const a = document.createElement('a')
          a.href = URL.createObjectURL(blob)
          a.download = 'event-radar.png'
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

  // Shift calculations for results
  const shifts = EVENT_DIMENSIONS.map(dim => {
    const before = beforeScores[dim.id] || 0
    const after = afterScores[dim.id] || 0
    return { dim, before, after, delta: after - before }
  })
  const totalBefore = shifts.reduce((s, sh) => s + sh.before, 0)
  const totalAfter = shifts.reduce((s, sh) => s + sh.after, 0)
  const totalShift = totalAfter - totalBefore
  const maxTotal = EVENT_DIMENSIONS.length * 5
  const beforePct = Math.round((totalBefore / maxTotal) * 100)
  const afterPct = Math.round((totalAfter / maxTotal) * 100)

  return (
    <div className="er flow-base">
      <div className="er-inner">

        {/* Hook */}
        {phase === PHASES.HOOK && (
          <div className="er-hook">
            <div className="er-hook-emoji">✨</div>
            <h1>Rate your experience</h1>
            <p className="er-hook-sub">
              6 questions before. 6 questions after. See what shifted.
            </p>
            <p className="er-hook-desc">
              Answer how you feel right now, before the event starts.
              After the event, answer the same 6 questions again.
              The radar shows you what changed.
            </p>
            <button className="primary-button" onClick={() => { setPhase(PHASES.BEFORE); setDimIndex(0) }}>
              Start: before the event
            </button>
          </div>
        )}

        {/* Questions (Before + After share the same UI) */}
        {(isBefore || isAfter) && currentDim && (
          <div className="er-question" key={`${phase}-${dimIndex}`}>
            <div className="er-progress">
              {EVENT_DIMENSIONS.map((_, i) => (
                <div
                  key={i}
                  className={`er-progress-dot ${i <= dimIndex ? 'active' : ''} ${i === dimIndex ? 'current' : ''}`}
                />
              ))}
            </div>

            <div className="er-phase-badge">
              {isBefore ? '⏳ Before' : '✨ After'} · {dimIndex + 1} of 6
            </div>

            {(dimIndex > 0 || isAfter) && (
              <button className="er-back" onClick={goBack}>Back</button>
            )}

            <div className="er-q-emoji">{currentDim.emoji}</div>
            <h2 className="er-q-title">{currentDim.name}</h2>
            <p className="er-q-text">
              {isBefore ? currentDim.beforeQuestion : currentDim.afterQuestion}
            </p>

            <div className="er-options">
              {currentDim.anchors.map((anchor, i) => {
                const val = i + 1
                return (
                  <button
                    key={val}
                    className={`er-option ${currentScores[currentDim.id] === val ? 'selected' : ''}`}
                    onClick={() => handleSelect(val)}
                  >
                    <span className="er-option-num">{val}</span>
                    <span className="er-option-label">{anchor}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Email (optional, not gated) */}
        {phase === PHASES.EMAIL && (
          <div className="er-email-step">
            <h2>See your shift</h2>
            <p>Enter your email to save your results. Or skip to see them now.</p>
            {!submitted ? (
              <form className="er-email-form" onSubmit={handleEmailSubmit}>
                <input
                  className="er-email-input"
                  type="text"
                  placeholder="Your first name"
                  value={name}
                  onChange={e => { setName(e.target.value); setEmailError('') }}
                />
                <input
                  className="er-email-input"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setEmailError('') }}
                />
                {emailError && <div className="er-email-error">{emailError}</div>}
                <button type="submit" className="primary-button" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save and see results'}
                </button>
              </form>
            ) : (
              <p className="er-saved-msg">Saved!</p>
            )}
            <button className="secondary-button er-skip" onClick={skipEmail}>
              Skip, just show me
            </button>
          </div>
        )}

        {/* Calculating */}
        {phase === PHASES.CALCULATING && (
          <div className="er-calculating">
            <div className="typing-indicator"><span /><span /><span /></div>
            <p className="er-calc-label">{CALC_LABELS[calcStep]}</p>
          </div>
        )}

        {/* Results */}
        {phase === PHASES.RESULTS && (
          <div className="er-results">
            <div className="er-results-card" ref={radarRef}>
              <h1 className="er-results-headline">
                {totalShift > 0 ? `+${totalShift} shift` : totalShift === 0 ? 'No shift' : `${totalShift} shift`}
              </h1>
              <p className="er-results-sub">{beforePct}% before &rarr; {afterPct}% after</p>

              <GenericRadar
                dimensions={EVENT_DIMENSIONS}
                scores={afterScores}
                scores2={beforeScores}
                maxLevel={5}
                size={320}
              />

              <div className="er-legend">
                <span className="er-legend-item"><span className="er-legend-dot er-legend-before" />Before</span>
                <span className="er-legend-item"><span className="er-legend-dot er-legend-after" />After</span>
              </div>
            </div>

            {/* Shift breakdown */}
            <div className="er-shifts">
              <h3>What shifted</h3>
              {shifts
                .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
                .map(({ dim, before, after, delta }) => (
                  <div key={dim.id} className={`er-shift-row ${delta > 0 ? 'up' : delta < 0 ? 'down' : ''}`}>
                    <span className="er-shift-emoji">{dim.emoji}</span>
                    <div className="er-shift-info">
                      <strong>{dim.name}</strong>
                      <span className="er-shift-detail">
                        {before}/5 &rarr; {after}/5
                        {delta !== 0 && (
                          <span className={`er-shift-delta ${delta > 0 ? 'positive' : 'negative'}`}>
                            {delta > 0 ? `+${delta}` : delta}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                ))}
            </div>

            <button className="primary-button er-share-btn" onClick={handleShare}>
              Share my shift
            </button>

            <div className="er-results-cta">
              <p>Want to feel this way more often? Vibe Rise tracks what makes you come alive.</p>
              <a href="/get-started" className="primary-button">Learn more</a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
