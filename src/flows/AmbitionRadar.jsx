import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { DOME_DIMENSIONS } from '../data/domeDimensions'
import { PRECURSOR_LEVELS, PRECURSOR_DEFAULTS } from '../data/precursorDefaults'
import DomeOfSafety from '../components/DomeOfSafety'
import { hapticLight, hapticSuccess } from '../lib/haptics'
import { createFunnelTracker } from '../lib/funnelTracker'
import './AmbitionRadar.css'

/**
 * AmbitionRadar — Free lead magnet at /try/ambition-radar
 *
 * 5-step flow:
 * 1. Dream input (free text)
 * 2. Dream dimensions (8 tier pickers, one at a time)
 * 3. Precursor (pre-fills current levels)
 * 4. Reality check (adjust pre-filled current levels)
 * 5. Results (animated radar reveal + share + email CTA)
 */

const STEPS = { DREAM: 0, DIMENSIONS: 1, PRECURSOR: 2, REALITY: 3, RESULTS: 4 }
const STEP_COUNT = 5
const STORAGE_KEY = 'ambition_radar_progress'
const PROGRESS_TTL = 24 * 60 * 60 * 1000 // 24 hours

function getDimTiers(dim) {
  if (dim.type === 'numeric') {
    const prefix = dim.inputType === 'money' ? '$' : ''
    return dim.tiers.map((t, i) => ({ level: i + 1, label: `${prefix}${t >= 1000 ? `${t / 1000}K` : t}` }))
  }
  return dim.levels
}

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

function saveProgress(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, saved_at: Date.now() })) } catch {}
}

function getTierLabel(dim, level) {
  if (!level) return null
  const tiers = getDimTiers(dim)
  const tier = tiers.find(t => t.level === level)
  return tier?.label || null
}

function getTopGaps(current, dream) {
  return DOME_DIMENSIONS.map(dim => {
    const c = current[dim.id] || 0
    const d = dream[dim.id] || 0
    const maxL = dim.maxLevel
    const gapRatio = maxL > 0 ? (d - c) / maxL : 0
    return { dim, current: c, dream: d, gapRatio }
  })
    .filter(g => g.gapRatio > 0)
    .sort((a, b) => b.gapRatio - a.gapRatio)
    .slice(0, 3)
}

export default function AmbitionRadar() {
  const saved = useRef(loadProgress())
  const [step, setStep] = useState(() => saved.current?.step || STEPS.DREAM)
  const [dreamText, setDreamText] = useState(() => saved.current?.dreamText || '')
  const [dreamDims, setDreamDims] = useState(() => saved.current?.dreamDims || {})
  const [dimIndex, setDimIndex] = useState(() => saved.current?.dimIndex || 0)
  const [precursor, setPrecursor] = useState(() => saved.current?.precursor || null)
  const [currentDims, setCurrentDims] = useState(() => saved.current?.currentDims || {})
  const [expandedDim, setExpandedDim] = useState(null)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [emailError, setEmailError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [utmParams, setUtmParams] = useState({})
  const tracker = useRef(createFunnelTracker('ambition_radar'))

  // Track each step reached
  useEffect(() => {
    const stepNames = ['dream', 'dimensions', 'precursor', 'reality', 'results']
    tracker.current.step(stepNames[step] || `step_${step}`, step)
  }, [step])

  // Persist progress (not on results step)
  useEffect(() => {
    if (step === STEPS.RESULTS) return
    saveProgress({ step, dreamText, dreamDims, dimIndex, precursor, currentDims })
  }, [step, dreamText, dreamDims, dimIndex, precursor, currentDims])

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

  // Scroll to top on step change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [step, dimIndex])

  // Auto-transition from dimensions to precursor when all 8 are done
  useEffect(() => {
    if (step !== STEPS.DIMENSIONS) return
    const lastDim = DOME_DIMENSIONS[DOME_DIMENSIONS.length - 1]
    if (dimIndex === DOME_DIMENSIONS.length - 1 && dreamDims[lastDim.id] != null) {
      setStep(STEPS.PRECURSOR)
    }
  }, [step, dimIndex, dreamDims])

  const goBack = useCallback(() => {
    if (step === STEPS.DIMENSIONS && dimIndex > 0) {
      setDimIndex(i => i - 1)
    } else if (step > STEPS.DREAM) {
      if (step === STEPS.PRECURSOR) {
        // Clear last dim so the auto-transition useEffect doesn't immediately bounce forward
        const lastDimId = DOME_DIMENSIONS[DOME_DIMENSIONS.length - 1].id
        setDreamDims(prev => { const next = { ...prev }; delete next[lastDimId]; return next })
        setDimIndex(DOME_DIMENSIONS.length - 1)
      }
      setStep(s => s - 1)
    }
  }, [step, dimIndex])

  // Progress: steps 0-4, step 1 has 8 sub-steps
  const progressDots = []
  for (let i = 0; i < STEP_COUNT; i++) {
    if (i === STEPS.DIMENSIONS) {
      for (let d = 0; d < DOME_DIMENSIONS.length; d++) {
        const isDone = step > STEPS.DIMENSIONS || (step === STEPS.DIMENSIONS && d < dimIndex)
        const isActive = step === STEPS.DIMENSIONS && d === dimIndex
        progressDots.push({ done: isDone, active: isActive })
      }
    } else {
      progressDots.push({ done: step > i, active: step === i })
    }
  }

  // ── Step 2: Select dream tier for current dimension ──
  const handleDreamSelect = useCallback((dimId, level) => {
    hapticLight()
    setDreamDims(prev => ({ ...prev, [dimId]: level }))
    // Auto-advance via functional updater — no stale closure on dimIndex
    setTimeout(() => {
      setDimIndex(i => {
        if (i < DOME_DIMENSIONS.length - 1) return i + 1
        return i // last dim — useEffect handles step transition
      })
    }, 200)
  }, [])

  // ── Step 3: Precursor select ──
  const handlePrecursor = useCallback((levelId) => {
    hapticLight()
    setPrecursor(levelId)
    const defaults = PRECURSOR_DEFAULTS[levelId] || {}
    setCurrentDims(defaults)
    setTimeout(() => setStep(STEPS.REALITY), 200)
  }, [])

  // ── Step 4: Reality check adjust ──
  const handleRealitySelect = useCallback((dimId, level) => {
    hapticLight()
    setCurrentDims(prev => ({ ...prev, [dimId]: level }))
  }, [])

  // ── Step 5: Email submit ──
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    setEmailError('')

    if (!name.trim()) { setEmailError('What should we call you?'); return }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError('Please enter a valid email')
      return
    }
    if (submitting) return
    setSubmitting(true)

    try {
      await supabase.from('lead_captures').insert({
        email: email.trim(),
        source: 'ambition-radar',
        scores: {
          dream_text: dreamText,
          precursor,
          current_dimensions: currentDims,
          dream_dimensions: dreamDims,
        },
        metadata: { name: name.trim(), ...utmParams },
      })
      hapticSuccess()
      setSubmitted(true)
      localStorage.removeItem(STORAGE_KEY)
    } catch (err) {
      console.error('Lead capture error:', err)
      setEmailError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }, [email, name, dreamText, precursor, currentDims, dreamDims, utmParams, submitting])

  // ── Share / download radar ──
  const radarRef = useRef(null)
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
        const file = new File([blob], 'ambition-radar.png', { type: 'image/png' })
        if (navigator.share && navigator.canShare?.({ files: [file] })) {
          await navigator.share({
            title: 'My Ambition Radar',
            text: 'See the gap between where I am and where I want to be',
            files: [file],
          })
        } else {
          const a = document.createElement('a')
          a.href = URL.createObjectURL(blob)
          a.download = 'ambition-radar.png'
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

  // ── Render ──
  const currentDim = DOME_DIMENSIONS[dimIndex]
  const gaps = step === STEPS.RESULTS ? getTopGaps(currentDims, dreamDims) : []

  return (
    <div className="ar">
      <div className="ar-container">
        {/* Progress bar */}
        <div className="ar-progress">
          {progressDots.map((d, i) => (
            <div key={i} className={`ar-progress-dot ${d.done ? 'done' : ''} ${d.active ? 'active' : ''}`} />
          ))}
        </div>

        {/* Back button */}
        {step > STEPS.DREAM && step < STEPS.RESULTS && (
          <button className="ar-back" onClick={goBack}>← Back</button>
        )}

        {/* ═══ STEP 1: Dream ═══ */}
        {step === STEPS.DREAM && (
          <div className="ar-step ar-dream">
            <h1>What's <span>your ambition</span>?</h1>
            <p>See the gap between where you are and where you want to be.</p>
            <input
              className="ar-dream-input"
              type="text"
              placeholder="e.g. Run ecstatic dance events"
              value={dreamText}
              onChange={e => setDreamText(e.target.value)}
              autoFocus
            />
            <div className="ar-bottom">
              <button
                className="ar-btn ar-btn-primary"
                disabled={!dreamText.trim()}
                onClick={() => { hapticLight(); setStep(STEPS.DIMENSIONS); setDimIndex(0) }}
              >
                Let's see →
              </button>
            </div>
          </div>
        )}

        {/* ═══ STEP 2: Dream dimensions ═══ */}
        {step === STEPS.DIMENSIONS && currentDim && (
          <div className="ar-step" key={`dim-${dimIndex}`}>
            <div className="ar-dim-counter">{dimIndex + 1} of {DOME_DIMENSIONS.length}</div>
            <div className="ar-dim-header">
              <h2>If this came to life...</h2>
            </div>
            <div className="ar-dim-icon">{currentDim.icon}</div>
            <div className="ar-dim-question">{currentDim.dreamQuestion}</div>
            <div className="ar-tiers">
              {getDimTiers(currentDim).map(tier => (
                <div
                  key={tier.level}
                  className={`ar-tier ${dreamDims[currentDim.id] === tier.level ? 'selected' : ''}`}
                  onClick={() => handleDreamSelect(currentDim.id, tier.level)}
                >
                  <div className="ar-tier-label">{tier.label}</div>
                  {tier.description && <div className="ar-tier-desc">{tier.description}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ STEP 3: Precursor ═══ */}
        {step === STEPS.PRECURSOR && (
          <div className="ar-step ar-precursor">
            <h2>Have you taken any steps on this already?</h2>
            <p>This helps us understand where you're starting from.</p>
            <div className="ar-precursor-cards">
              {PRECURSOR_LEVELS.map(level => (
                <div
                  key={level.id}
                  className={`ar-pre-card ${precursor === level.id ? 'selected' : ''}`}
                  onClick={() => handlePrecursor(level.id)}
                >
                  <div className="ar-pre-card-label">{level.label}</div>
                  <div className="ar-pre-card-desc">{level.description}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ STEP 4: Reality check ═══ */}
        {step === STEPS.REALITY && (
          <div className="ar-step ar-reality">
            <h2>Here's where we think you are</h2>
            <p>Update anything that doesn't feel right.</p>
            <div className="ar-reality-list">
              {DOME_DIMENSIONS.map(dim => {
                const isExpanded = expandedDim === dim.id
                const currentLevel = currentDims[dim.id] || 1
                const tiers = getDimTiers(dim)
                const currentTier = tiers.find(t => t.level === currentLevel)

                return (
                  <div
                    key={dim.id}
                    className={`ar-reality-item ${isExpanded ? 'expanded' : ''}`}
                  >
                    <div
                      className="ar-reality-row"
                      onClick={() => {
                        hapticLight()
                        setExpandedDim(isExpanded ? null : dim.id)
                      }}
                    >
                      <div className="ar-reality-dim">
                        <span className="ar-reality-dim-icon">{dim.icon}</span>
                        <span className="ar-reality-dim-name">{dim.label}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span className="ar-reality-level">{currentTier?.label || `Level ${currentLevel}`}</span>
                        <span className="ar-reality-chevron">▼</span>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="ar-reality-tiers">
                        {tiers.map(tier => (
                          <div
                            key={tier.level}
                            className={`ar-reality-tier ${currentLevel === tier.level ? 'selected' : ''}`}
                            onClick={() => handleRealitySelect(dim.id, tier.level)}
                          >
                            <div className="ar-reality-tier-label">{tier.label}</div>
                            {tier.description && <div className="ar-reality-tier-desc">{tier.description}</div>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="ar-bottom">
              <button
                className="ar-btn ar-btn-primary"
                onClick={() => { hapticSuccess(); setStep(STEPS.RESULTS) }}
              >
                Show my radar →
              </button>
            </div>
          </div>
        )}

        {/* ═══ STEP 5: Results ═══ */}
        {step === STEPS.RESULTS && (
          <div className="ar-step ar-results">
            <h2>Your Ambition Radar</h2>
            <p className="ar-results-sub">The gap between where you are and where you want to be</p>

            <div className="ar-radar-wrap" ref={radarRef}>
              <DomeOfSafety
                domeEdges={currentDims}
                edgeZone={dreamDims}
              />
            </div>

            {/* Gap cards */}
            {gaps.length > 0 && (
              <div className="ar-gaps">
                {gaps.map(({ dim, current, dream }) => {
                  const cLabel = getTierLabel(dim, current)
                  const dLabel = getTierLabel(dim, dream)
                  return (
                    <div key={dim.id} className="ar-gap-card">
                      <div className="ar-gap-dim">
                        <span>{dim.icon}</span>
                        <span>{dim.label}</span>
                      </div>
                      <div className="ar-gap-text">
                        {cLabel && dLabel
                          ? <>{cLabel} <span className="ar-gap-arrow">→</span> {dLabel}</>
                          : <>Level {current} <span className="ar-gap-arrow">→</span> Level {dream}</>
                        }
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Actions */}
            <div className="ar-actions">
              <button className="ar-share-btn" onClick={handleShare}>
                📤 Share your radar
              </button>

              <div className="ar-divider">or</div>

              {!submitted ? (
                <>
                  <div className="ar-cta-title">Want help closing this gap?</div>
                  <div className="ar-cta-sub">Get your first courage challenge and start moving.</div>
                  <form className="ar-email-form" onSubmit={handleSubmit}>
                    <input
                      className="ar-email-input"
                      type="text"
                      placeholder="Your first name"
                      value={name}
                      onChange={e => { setName(e.target.value); setEmailError('') }}
                    />
                    <input
                      className="ar-email-input"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={e => { setEmail(e.target.value); setEmailError('') }}
                    />
                    {emailError && <div className="ar-email-error">{emailError}</div>}
                    <button
                      type="submit"
                      className="ar-btn ar-btn-primary"
                      disabled={submitting}
                    >
                      {submitting ? 'Saving...' : 'Get my first challenge →'}
                    </button>
                  </form>
                </>
              ) : (
                <div className="ar-success">
                  <div className="ar-success-icon">🎯</div>
                  <div className="ar-success-text">
                    You're in. Check your inbox for your first courage challenge.
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
