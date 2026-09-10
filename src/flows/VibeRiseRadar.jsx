import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { createFunnelTracker } from '../lib/funnelTracker'
import PublicEmailGate from '../components/PublicEmailGate'
import './VibeRiseRadar.css'

/**
 * VibeRiseRadar — Free lead magnet at /try/vibe-rise-radar
 * "How alive are you right now?"
 *
 * 6 dimensions: Permission, Safety, Freedom, Connection, Presence, Joy
 * Flow: Hook → 6 questions (1-5 slider each) → Email Gate → Radar Results
 */

const DIMENSIONS = [
  {
    id: 'permission',
    name: 'Permission',
    emoji: '🚪',
    question: 'How free do you feel to express yourself right now?',
    low: 'Holding back. Something is stopping you from expressing what you feel.',
    high: 'You feel fully allowed to be yourself. No filter needed.',
    anchors: ['Completely held back', 'Slightly constrained', 'Neutral', 'Mostly free', 'Fully free to express'],
  },
  {
    id: 'safety',
    name: 'Safety',
    emoji: '🛡️',
    question: 'How safe do you feel to let go right now?',
    low: 'Guarded. Your body is bracing for something.',
    high: 'You trust the room. You could fall and be caught.',
    anchors: ['Completely guarded', 'On edge', 'Neutral', 'Mostly safe', 'Fully safe to let go'],
  },
  {
    id: 'freedom',
    name: 'Freedom',
    emoji: '🦅',
    question: 'Are you being fully yourself right now, or holding back?',
    low: 'You know who you could be here, but you are not being that person yet.',
    high: 'You are fully yourself. Nothing held back.',
    anchors: ['Completely holding back', 'Mostly holding back', 'Half and half', 'Mostly myself', 'Fully myself'],
  },
  {
    id: 'connection',
    name: 'Connection',
    emoji: '🤝',
    question: 'How connected do you feel to the people around you?',
    low: 'Alone in a crowd. People are here but you do not feel bonded to them.',
    high: 'Deeply connected. You feel part of something.',
    anchors: ['Completely alone', 'Mostly alone', 'Some connection', 'Mostly connected', 'Deeply connected'],
  },
  {
    id: 'presence',
    name: 'Presence',
    emoji: '👁️',
    question: 'How fully are you here right now?',
    low: 'In your head. Thinking about the past, the future, your phone, anything but this moment.',
    high: 'Fully here. Nothing else exists right now.',
    anchors: ['Completely in my head', 'Mostly distracted', 'Half here', 'Mostly present', 'Fully here'],
  },
  {
    id: 'joy',
    name: 'Joy',
    emoji: '✨',
    question: 'How alive do you feel right now?',
    low: 'Flat. Going through the motions.',
    high: 'Buzzing. This is what being alive feels like.',
    anchors: ['Completely flat', 'Low energy', 'Neutral', 'Feeling good', 'Fully alive'],
  },
]

const STAGE_ORDER = ['hook', ...DIMENSIONS.map(d => d.id), 'email_gate', 'calculating', 'results']
const STORAGE_KEY = 'vibe_rise_radar_progress'

function loadProgress() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : null
  } catch { return null }
}

function saveProgress(stage, answers) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ stage, answers }))
  } catch {}
}

function clearProgress() {
  try { localStorage.removeItem(STORAGE_KEY) } catch {}
}

// ── Radar SVG ──

function polarToXY(cx, cy, angle, radius) {
  const rad = (angle - 90) * (Math.PI / 180)
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) }
}

function RadarChart({ scores, size = 300, showLabels = true }) {
  const cx = size / 2
  const cy = size / 2
  const maxRadius = (size / 2) - (showLabels ? 50 : 20)
  const angleStep = 360 / DIMENSIONS.length
  const ringCount = 5

  const rings = Array.from({ length: ringCount }, (_, i) => {
    const r = maxRadius * ((i + 1) / ringCount)
    return DIMENSIONS.map((_, j) => polarToXY(cx, cy, j * angleStep, r))
      .map(p => `${p.x},${p.y}`).join(' ')
  })

  const spokes = DIMENSIONS.map((_, i) => {
    const end = polarToXY(cx, cy, i * angleStep, maxRadius)
    return { x1: cx, y1: cy, x2: end.x, y2: end.y }
  })

  const polygon = DIMENSIONS.map((dim, i) => {
    const val = scores[dim.id] || 0
    const ratio = Math.max(val / 5, 0.05)
    return polarToXY(cx, cy, i * angleStep, ratio * maxRadius)
  }).map(p => `${p.x},${p.y}`).join(' ')

  const total = DIMENSIONS.reduce((sum, d) => sum + (scores[d.id] || 0), 0)
  const max = DIMENSIONS.length * 5
  const pct = Math.round((total / max) * 100)

  const labels = DIMENSIONS.map((dim, i) => {
    const pos = polarToXY(cx, cy, i * angleStep, maxRadius + 28)
    return { ...dim, x: pos.x, y: pos.y }
  })

  return (
    <div className="vrr-radar-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {rings.map((pts, i) => (
          <polygon key={i} points={pts} fill="none" stroke="#e0ddd8" strokeWidth={1} opacity={0.5} />
        ))}
        {spokes.map((s, i) => (
          <line key={i} {...s} stroke="#e0ddd8" strokeWidth={1} opacity={0.4} />
        ))}
        <polygon
          points={polygon}
          fill="rgba(94, 23, 235, 0.15)"
          stroke="#5e17eb"
          strokeWidth={2.5}
        />
        {DIMENSIONS.map((dim, i) => {
          const val = scores[dim.id] || 0
          const ratio = Math.max(val / 5, 0.05)
          const pos = polarToXY(cx, cy, i * angleStep, ratio * maxRadius)
          return (
            <circle key={dim.id} cx={pos.x} cy={pos.y} r={4} fill="#5e17eb" />
          )
        })}
        {showLabels && labels.map(l => (
          <text
            key={l.id}
            x={l.x}
            y={l.y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={11}
            fontWeight={600}
            fill="#444"
          >
            <tspan>{l.emoji} </tspan>
            <tspan>{l.name}</tspan>
          </text>
        ))}
      </svg>
      <div className="vrr-radar-score">{pct}% alive</div>
    </div>
  )
}

// ── Verdict ──

function getVerdict(scores) {
  const total = DIMENSIONS.reduce((sum, d) => sum + (scores[d.id] || 0), 0)
  const max = DIMENSIONS.length * 5
  const pct = Math.round((total / max) * 100)
  const low = DIMENSIONS.filter(d => (scores[d.id] || 0) <= 2)
  const high = DIMENSIONS.filter(d => (scores[d.id] || 0) >= 4)

  if (pct >= 80) return {
    headline: 'You are alive.',
    summary: 'Most of your channels are wide open. You are not just surviving, you are creating. The question now is: what could you build from this place?',
    state: 'vibe_rise',
  }
  if (pct >= 60) return {
    headline: 'Some channels are open. Some are closed.',
    summary: `${high.length > 0 ? high.map(d => d.name).join(' and ') + ' are alive. ' : ''}But ${low.length > 0 ? low.map(d => d.name).join(' and ') : 'some dimensions'} need attention. The gap between where you are and where you could be is your comfort zone.`,
    state: 'fun',
  }
  if (pct >= 40) return {
    headline: 'You are running on half power.',
    summary: `${low.map(d => d.name).join(', ')} have been turned down. This is what happens when life installs obligations in place of aliveness. You do not need more knowledge. You need more courage.`,
    state: 'stressed',
  }
  return {
    headline: 'Your aliveness channels have been shut down.',
    summary: 'This is not a character flaw. It is what happens when you spend years building a life you need to escape from. The path back starts with one brave thing.',
    state: 'bored',
  }
}

// ── Main Component ──

export default function VibeRiseRadar() {
  const saved = useRef(loadProgress())
  const [stage, setStage] = useState(() => saved.current?.stage || 'hook')
  const [answers, setAnswers] = useState(() => saved.current?.answers || {})
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [utmParams, setUtmParams] = useState({})
  const [calcStep, setCalcStep] = useState(0)
  const containerRef = useRef(null)
  const radarRef = useRef(null)
  const tracker = useRef(createFunnelTracker('vibe_rise_radar'))
  const submittedRef = useRef(false)

  useEffect(() => {
    if (['calculating', 'results'].includes(stage)) return
    saveProgress(stage, answers)
  }, [stage, answers])

  useEffect(() => {
    const idx = STAGE_ORDER.indexOf(stage)
    if (idx >= 0) tracker.current.step(stage, idx)
  }, [stage])

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
  }, [stage])

  useEffect(() => {
    if (stage !== 'calculating') return
    const labels = ['Reading your responses...', 'Mapping your 6 dimensions...', 'Measuring your aliveness...', 'Building your radar...']
    let i = 0
    const interval = setInterval(() => {
      i++
      if (i < labels.length) setCalcStep(i)
      else { clearInterval(interval); setStage('results') }
    }, 600)
    return () => clearInterval(interval)
  }, [stage])

  const currentDim = DIMENSIONS.find(d => d.id === stage)
  const currentDimIndex = DIMENSIONS.findIndex(d => d.id === stage)

  const goBack = () => {
    const idx = STAGE_ORDER.indexOf(stage)
    if (idx > 0) setStage(STAGE_ORDER[idx - 1])
  }

  const handleSliderSelect = (dimId, value) => {
    setAnswers(prev => ({ ...prev, [dimId]: value }))
  }

  const handleNext = () => {
    const idx = STAGE_ORDER.indexOf(stage)
    if (idx < STAGE_ORDER.length - 1) setStage(STAGE_ORDER[idx + 1])
  }

  const handleEmailSubmit = async (submittedEmail, submittedName) => {
    if (submittedRef.current) return
    submittedRef.current = true

    setEmail(submittedEmail)
    setName(submittedName)
    setCalcStep(0)
    setStage('calculating')

    const verdictState = Object.keys(answers).length === 6
      ? getVerdict(answers).state
      : 'incomplete'

    try {
      await supabase.from('public_leads').upsert({
        email: submittedEmail,
        name: submittedName || null,
        source_flow: 'vibe_rise_radar',
        flow_results: {
          ...answers,
          verdict: verdictState,
          ...utmParams,
        },
      }, { onConflict: 'email', ignoreDuplicates: false })

      clearProgress()

      supabase.functions.invoke('notify-lead-capture', {
        body: {
          email: submittedEmail,
          name: submittedName,
          source: 'Vibe Rise Radar',
          meta: { scores: answers, verdict: verdictState },
        },
      }).catch(() => {})
    } catch (err) {
      console.error('Error saving radar data:', err)
    }
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
        const file = new File([blob], 'vibe-rise-radar.png', { type: 'image/png' })
        if (navigator.share && navigator.canShare?.({ files: [file] })) {
          await navigator.share({
            title: 'My Vibe Rise Radar',
            text: 'How alive am I right now?',
            files: [file],
          })
        } else {
          const a = document.createElement('a')
          a.href = URL.createObjectURL(blob)
          a.download = 'vibe-rise-radar.png'
          a.click()
        }
      }, 'image/png')
    } catch {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href)
      }
    }
  }, [])

  const verdict = Object.keys(answers).length === 6 ? getVerdict(answers) : null
  const lowDims = DIMENSIONS.filter(d => (answers[d.id] || 0) <= 2)
  const highDims = DIMENSIONS.filter(d => (answers[d.id] || 0) >= 4)

  return (
    <div className="vrr flow-base" ref={containerRef}>
      <div className="vrr-inner">

        {/* ── Hook ── */}
        {stage === 'hook' && (
          <div className="vrr-hook">
            <div className="vrr-hook-emoji">✨</div>
            <h1>How alive are you right now?</h1>
            <p className="vrr-hook-sub">
              6 questions. 60 seconds. See your aliveness as a shape.
            </p>
            <p className="vrr-hook-desc">
              Most people are running at half power and don't even know it.
              This radar shows you which parts of your aliveness are open
              and which have been shut down.
            </p>
            <button className="primary-button" onClick={() => setStage(STAGE_ORDER[1])}>
              See my radar
            </button>
          </div>
        )}

        {/* ── Questions ── */}
        {currentDim && (
          <div className="vrr-question">
            <div className="vrr-progress">
              {DIMENSIONS.map((d, i) => (
                <div
                  key={d.id}
                  className={`vrr-progress-dot ${i <= currentDimIndex ? 'active' : ''} ${i === currentDimIndex ? 'current' : ''}`}
                />
              ))}
            </div>

            <div className="vrr-q-emoji">{currentDim.emoji}</div>
            <h2 className="vrr-q-title">{currentDim.name}</h2>
            <p className="vrr-q-text">{currentDim.question}</p>

            <div className="vrr-slider-wrap">
              {[1, 2, 3, 4, 5].map(val => (
                <button
                  key={val}
                  className={`vrr-slider-option ${answers[currentDim.id] === val ? 'selected' : ''}`}
                  onClick={() => handleSliderSelect(currentDim.id, val)}
                >
                  <span className="vrr-slider-num">{val}</span>
                  <span className="vrr-slider-label">{currentDim.anchors[val - 1]}</span>
                </button>
              ))}
            </div>

            <div className="vrr-nav">
              {currentDimIndex > 0 && (
                <button className="secondary-button" onClick={goBack}>Back</button>
              )}
              {answers[currentDim.id] != null && (
                <button className="primary-button" onClick={handleNext}>
                  {currentDimIndex === DIMENSIONS.length - 1 ? 'See my radar' : 'Next'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Email Gate ── */}
        {stage === 'email_gate' && (
          <div className="vrr-email">
            <PublicEmailGate
              flowType="vibe_rise_radar"
              onEmailSubmit={handleEmailSubmit}
              title="Your radar is ready"
              subtitle="Enter your details to see your aliveness shape"
            />
          </div>
        )}

        {/* ── Calculating ── */}
        {stage === 'calculating' && (
          <div className="vrr-calculating">
            <div className="typing-indicator"><span /><span /><span /></div>
            <p className="vrr-calc-label">
              {['Reading your responses...', 'Mapping your 6 dimensions...', 'Measuring your aliveness...', 'Building your radar...'][calcStep]}
            </p>
          </div>
        )}

        {/* ── Results ── */}
        {stage === 'results' && verdict && (
          <div className="vrr-results">
            <div className="vrr-results-card" ref={radarRef}>
              <h1 className="vrr-results-headline">{verdict.headline}</h1>
              <RadarChart scores={answers} size={320} />
              <p className="vrr-results-summary">{verdict.summary}</p>

              {lowDims.length > 0 && (
                <div className="vrr-results-section">
                  <h3>Where you're constrained</h3>
                  {lowDims.map(d => (
                    <div key={d.id} className="vrr-dim-card low">
                      <span className="vrr-dim-emoji">{d.emoji}</span>
                      <div>
                        <strong>{d.name}: {answers[d.id]}/5</strong>
                        <p>{d.low}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {highDims.length > 0 && (
                <div className="vrr-results-section">
                  <h3>Where you're alive</h3>
                  {highDims.map(d => (
                    <div key={d.id} className="vrr-dim-card high">
                      <span className="vrr-dim-emoji">{d.emoji}</span>
                      <div>
                        <strong>{d.name}: {answers[d.id]}/5</strong>
                        <p>{d.high}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button className="primary-button vrr-share-btn" onClick={handleShare}>
              Share my radar
            </button>

            <div className="vrr-results-cta">
              <p>Your comfort zone decides how alive you feel. Vibe Rise expands it.</p>
              <a href="/get-started" className="primary-button">Start expanding</a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
