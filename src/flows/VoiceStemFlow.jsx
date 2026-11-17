/**
 * VoiceStemFlow.jsx
 * Voice Stem Engine — /try/voice-stems
 *
 * State machine:
 * landing → stem → processing → selection_1 (pick theme)
 * → stem (stage 2 layer 2) → processing → selection_2 (confirm prediction)
 * → stem (stage 2 layer 3) → processing → results_2
 * → stem (stage 3) → processing → results_3
 * → final_results
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import GenericRadar from '../components/GenericRadar'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabaseClient'
import { useAudioRecorder } from '../hooks/useAudioRecorder'
import { transcribeAudio } from '../lib/deepgramClient'
import { processStage } from '../lib/stemProcessing'
import { getStemsForStage, EXPERIENCE_ACTIVITIES } from '../data/voiceStems'
import { getArchetype } from '../data/essenceArchetypes'
import ExperienceGameLive from '../components/ExperienceGameLive'
import './VoiceStemFlow.css'

const STORAGE_KEY = 'voice_stems_session'
const MAX_STEM_SECONDS = 30
const MAX_CATEGORY_SECONDS = 60

// ── Helpers ─────────────────────────────────────────────────────────────────

function loadSession() {
  try {
    const s = localStorage.getItem(STORAGE_KEY)
    return s ? JSON.parse(s) : null
  } catch { return null }
}

function saveSession(data) {
  try {
    // Merge with existing session data instead of overwriting
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    const merged = { ...existing, ...data }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
    // Also save to Supabase (fire and forget)
    saveToSupabase(merged)
  } catch (e) {
    // localStorage unavailable — non-fatal
    void e
  }
}

let _sessionId = null
function getSessionId() {
  if (_sessionId) return _sessionId
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (stored?._sessionId) { _sessionId = stored._sessionId; return _sessionId }
  } catch { /* ignore */ }
  _sessionId = crypto.randomUUID()
  return _sessionId
}

async function saveToSupabase(data) {
  try {
    const sessionId = getSessionId()
    const placeholderEmail = `anon-${sessionId}@voice-stems.local`
    const url = import.meta.env.VITE_SUPABASE_URL
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY
    // Public lead capture — always use anon key, never a user session
    // Upsert on email (unique constraint), not id
    const email = data.email || placeholderEmail
    await fetch(`${url}/rest/v1/public_leads?on_conflict=email`, {
      method: 'POST',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        id: sessionId,
        email,
        source_flow: 'voice_stems',
        flow_results: { ...data, _sessionId: sessionId },
      }),
    })
  } catch {
    // Supabase save failure is non-fatal
  }
}

function clearSession() {
  try { localStorage.removeItem(STORAGE_KEY) } catch (e) { void e }
}

// Emoji map for selection bridge themes
const THEME_EMOJIS = ['🎭', '🌿', '🎨', '⚡', '🏆', '🎵', '🌊', '✨', '🔥', '💡']

// Stage 3 radar dimensions (matches processStage output)
const RADAR_DIMENSIONS = [
  { id: 'choice',     name: 'Choice',     emoji: '🎯' },
  { id: 'connection', name: 'Connection', emoji: '🤝' },
  { id: 'growth',     name: 'Growth',     emoji: '🌱' },
  { id: 'meaning',    name: 'Meaning',    emoji: '✨' },
  { id: 'safety',     name: 'Safety',     emoji: '🛡️' },
]

// ── Sub-screen components ────────────────────────────────────────────────────

function ProgressBar({ label, percent }) {
  return (
    <div className="vs-progress-bar-wrap">
      <div className="vs-progress-label">{label}</div>
      <div className="vs-progress-track">
        <div className="vs-progress-fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

function CountdownOverlay({ count, stemText }) {
  return (
    <div className="vs-countdown-overlay">
      {stemText && <div className="vs-stem-text">{stemText}</div>}
      <div className="vs-countdown-num" key={count}>{count}</div>
      <div className="vs-countdown-label">Get ready to speak...</div>
    </div>
  )
}

function RecordingZone({ secondsLeft, onDone }) {
  const isLow = secondsLeft <= 8
  const mins = Math.floor(secondsLeft / 60)
  const secs = secondsLeft % 60
  const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`

  return (
    <div className="vs-recording-zone">
      <div className="vs-recording-dot" />
      <div className="vs-recording-label">Recording</div>
      <div className={`vs-timer${isLow ? ' vs-timer-low' : ''}`}>{timeStr}</div>
      <button className="vs-done-btn" onClick={onDone}>Done early</button>
    </div>
  )
}

function DoubleConfirmButton({ onConfirm, label = 'Continue', confirmLabel = 'Ready? Tap to begin' }) {
  const [confirmed, setConfirmed] = useState(false)
  if (!confirmed) {
    return <button className="vs-btn-primary" onClick={() => setConfirmed(true)}>{label}</button>
  }
  return <button className="vs-btn-primary vs-btn-ready" onClick={onConfirm}>{confirmLabel}</button>
}

function SignupGate({ prefillEmail, onComplete }) {
  const { signInWithCode, verifyCode, user } = useAuth()
  const [email, setEmail] = useState(prefillEmail || '')
  const [code, setCode] = useState('')
  const [step, setStep] = useState('email') // email → code → saving
  const [error, setError] = useState(null)
  const [sending, setSending] = useState(false)
  const completedRef = useRef(false)

  const safeComplete = useCallback((u) => {
    if (completedRef.current) return
    completedRef.current = true
    onComplete(u)
  }, [onComplete])

  // If already logged in (or auth resolves after mount), skip straight to saving
  useEffect(() => {
    if (user) {
      safeComplete(user)
    }
  }, [user, safeComplete])

  const handleSendCode = async (e) => {
    e.preventDefault()
    if (!email.trim() || sending) return
    setSending(true)
    setError(null)
    const result = await signInWithCode(email.trim(), { shouldCreateUser: true })
    setSending(false)
    if (result.success) {
      setStep('code')
    } else {
      setError(result.message || 'Failed to send code. Try again.')
    }
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    if (!code.trim() || sending) return
    setSending(true)
    setError(null)
    const result = await verifyCode(email.trim(), code.trim())
    setSending(false)
    if (result.success) {
      setStep('saving')
      safeComplete(result.user)
    } else {
      setError(result.message || 'Invalid code. Try again.')
    }
  }

  if (step === 'saving') {
    return (
      <div className="vs-signup-gate">
        <div className="vs-spinner" />
        <p>Setting up your account...</p>
      </div>
    )
  }

  return (
    <div className="vs-signup-gate">
      <div className="vs-results-label">Almost there</div>
      <h2>Create your account</h2>
      <p className="vs-signup-desc">
        Save your results and discover your life paths.
      </p>

      {step === 'email' && (
        <form className="vs-signup-form" onSubmit={handleSendCode}>
          <input
            className="vs-input"
            type="email"
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {error && <div className="vs-error-msg">{error}</div>}
          <button className="vs-btn-primary" type="submit" disabled={sending}>
            {sending ? 'Sending...' : 'Send verification code'}
          </button>
        </form>
      )}

      {step === 'code' && (
        <form className="vs-signup-form" onSubmit={handleVerify}>
          <p style={{ fontSize: '0.9rem', color: 'var(--vs-muted)' }}>
            Check {email} for a 6-digit code.
          </p>
          <input
            className="vs-input"
            type="text"
            inputMode="numeric"
            placeholder="Enter code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoFocus
            required
          />
          {error && <div className="vs-error-msg">{error}</div>}
          <button className="vs-btn-primary" type="submit" disabled={sending}>
            {sending ? 'Verifying...' : 'Verify and continue'}
          </button>
          <button
            type="button"
            className="vs-btn-ghost"
            onClick={() => { setStep('email'); setCode(''); setError(null) }}
          >
            Use a different email
          </button>
        </form>
      )}
    </div>
  )
}

function DownloadApp({ userEmail, essenceArchetype, pathActivities }) {
  const [linkSent, setLinkSent] = useState(false)
  const [sending, setSending] = useState(false)

  const APP_STORE_URL = 'https://apps.apple.com/app/vibe-rise/id6740644498'
  const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.nichuzz.viberise'

  const handleSendLink = async () => {
    if (!userEmail || sending) return
    setSending(true)
    try {
      const { error } = await supabase.functions.invoke('send-app-link', {
        body: { email: userEmail, appStoreUrl: APP_STORE_URL, playStoreUrl: PLAY_STORE_URL },
      })
      if (!error) setLinkSent(true)
    } catch {
      // Silent fail — buttons are still there
    }
    setSending(false)
  }

  // Build tease from path activities (things they'd get paid for)
  const pathLabels = (pathActivities || []).slice(0, 3).map(a => a.label)
  const hasPaths = pathLabels.length > 0

  return (
    <div className="vs-signup-gate">
      <div className="vs-results-label">You're in</div>
      <h2>Get the app</h2>

      {essenceArchetype && (
        <p className="vs-download-archetype">{essenceArchetype}</p>
      )}

      <p className="vs-signup-desc">
        Open the app to find unique paths based on your answers.
      </p>

      <div className="vs-download-buttons">
        <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" className="vs-btn-primary">
          Download for iPhone
        </a>
        <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" className="vs-btn-primary vs-btn-secondary">
          Download for Android
        </a>
      </div>

      {userEmail && (
        <button
          className="vs-btn-ghost"
          onClick={handleSendLink}
          disabled={linkSent || sending}
          style={{ marginTop: 8 }}
        >
          {linkSent ? 'Link sent!' : sending ? 'Sending...' : 'Send download link to my email'}
        </button>
      )}
    </div>
  )
}

function ProcessingScreen({ stage }) {
  const labels = {
    1: 'Finding your essence themes...',
    '2a': 'Identifying the prediction...',
    '2b': 'Tracing the source...',
    3: 'Scoring your dimensions...',
    4: 'Finding your essence archetype...',
    5: 'Mapping your experiences...',
    6: 'Finding your paths...',
    7: 'Discovering your category...',
  }
  return (
    <div className="vs-processing">
      <div className="vs-spinner" />
      <h2>Analysing your responses</h2>
      <p>{labels[stage] || 'Processing...'}</p>
      <div className="vs-processing-dots">
        <div className="vs-processing-dot" />
        <div className="vs-processing-dot" />
        <div className="vs-processing-dot" />
      </div>
    </div>
  )
}

// Selection bridge — either pick an essence theme or confirm a prediction
function SelectionBridge({ type, options, onSelect }) {
  const [selected, setSelected] = useState(null)

  const isTheme = type === 'theme'

  const title = isTheme
    ? 'From what you shared, these themes came through'
    : 'This is the prediction running underneath'

  const sub = isTheme
    ? 'Which one feels most charged? Tap the one that hits hardest.'
    : 'Which of these is the fear that keeps stopping you?'

  const handlePick = (opt) => {
    setSelected(opt)
  }

  const handleConfirm = () => {
    if (selected) onSelect(selected)
  }

  return (
    <div className="vs-selection">
      <div className="vs-selection-label">{isTheme ? 'Stage 1 Complete' : 'Layer 2 Complete'}</div>
      <h2>{title}</h2>
      <p className="vs-selection-sub">{sub}</p>
      <div className="vs-selection-cards">
        {options.map((opt, i) => {
          const label = typeof opt === 'string' ? opt : opt.label || opt.text || String(opt)
          const sub2 = typeof opt === 'object' ? (opt.description || opt.sub || '') : ''
          return (
            <button
              key={i}
              className={`vs-option-card${selected === opt ? ' vs-selected' : ''}`}
              onClick={() => handlePick(opt)}
            >
              <span className="vs-option-emoji">{THEME_EMOJIS[i % THEME_EMOJIS.length]}</span>
              <div className="vs-option-text">
                <strong>{label}</strong>
                {sub2 && <span>{sub2}</span>}
              </div>
            </button>
          )
        })}
      </div>
      {selected && (
        <button className="vs-btn-primary" onClick={handleConfirm} style={{ marginTop: 16 }}>
          Continue
        </button>
      )}
    </div>
  )
}

// Stage 1 results card (themes + summary)
function Stage1Results({ results, onContinue }) {
  if (!results) return null
  const energy = results.energy || 'alive'
  const patterns = results.patterns || results.essenceThemes?.map(t => ({ label: t.label || t, evidence: t.evidence || '' })) || []
  const mirror = results.mirror || results.summary || ''

  return (
    <div className="vs-results-card">
      <h2 className="vs-results-title">The kid in you was <span className="vs-gold-text">{energy}</span></h2>
      {results.essenceSummary && (
        <p style={{ color: 'var(--vs-muted)', fontSize: '0.95rem', margin: '4px 0 16px', lineHeight: 1.5 }}>
          {results.essenceSummary}
        </p>
      )}
      <p className="vs-results-mirror">{mirror}</p>
      <div className="vs-results-patterns">
        {patterns.map((p, i) => (
          <div key={i} className="vs-pattern-card">
            <div className="vs-pattern-label">{p.label}</div>
            {p.evidence && <div className="vs-pattern-evidence">&ldquo;{p.evidence}&rdquo;</div>}
          </div>
        ))}
      </div>
      <p className="vs-results-prompt">Which of these feels most alive right now? Which one do you miss most?</p>
      <button className="vs-cta" onClick={onContinue}>Continue</button>
    </div>
  )
}

// Stage 2 results card (full thread: essence → prediction → source → rule)
function Stage2Results({ results, selectedExpression, confirmedPrediction, onContinue }) {
  const thread = results?.thread || results?.fullThread || null
  const rawSource = results?.sourceEvent || results?.source || {}
  const source = typeof rawSource === 'string' ? { description: rawSource }
    : { description: [rawSource.what, rawSource.who ? `(${rawSource.who})` : '', rawSource.approximateAge ? `around age ${rawSource.approximateAge}` : ''].filter(Boolean).join(' '), ...rawSource }
  const rule = results?.rule || results?.protectiveRule || ''
  const pattern = results?.protectivePattern || results?.pattern || ''

  return (
    <div className="vs-results">
      <div className="vs-results-header">
        <div className="vs-results-label">Stage 2 Complete</div>
        <h2>The Thread</h2>
      </div>

      <div className="vs-results-card">
        <h4>How it connects</h4>
        <div className="vs-thread-block">
          {selectedExpression && (
            <div className="vs-thread-row">
              <span className="vs-thread-arrow">▸</span>
              <div className="vs-thread-content">
                <strong>You loved</strong>
                <span>{selectedExpression}</span>
              </div>
            </div>
          )}
          {(confirmedPrediction || results?.prediction) && (
            <div className="vs-thread-row">
              <span className="vs-thread-arrow">▸</span>
              <div className="vs-thread-content">
                <strong>You predict</strong>
                <span>{confirmedPrediction || results?.prediction}</span>
              </div>
            </div>
          )}
          {(source?.description || source?.event || results?.sourceEvent) && (
            <div className="vs-thread-row">
              <span className="vs-thread-arrow">▸</span>
              <div className="vs-thread-content">
                <strong>Because</strong>
                <span>{source?.description || source?.event || results?.sourceEvent}</span>
              </div>
            </div>
          )}
          {rule && (
            <div className="vs-thread-row">
              <span className="vs-thread-arrow">▸</span>
              <div className="vs-thread-content">
                <strong>So you made a rule</strong>
                <span>{rule}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {thread && (
        <div className="vs-results-card">
          <h4>The Full Thread</h4>
          <p style={{ fontSize: '0.95rem', lineHeight: 1.6, margin: 0, color: 'var(--vs-muted)' }}>
            {typeof thread === 'string' ? thread : JSON.stringify(thread)}
          </p>
        </div>
      )}

      {pattern && (
        <div className="vs-results-card">
          <h4>Protective Pattern</h4>
          <span className="vs-theme-tag">{pattern}</span>
        </div>
      )}

      {/* Wound mapping */}
      {(results.woundStage || results.woundScene || results.nsArchetype) && (
        <div className="vs-wound-mapping">
          {results.woundStage && (
            <div className="vs-wound-row">
              <span className="vs-wound-label">Installed at</span>
              <span className="vs-wound-value">{results.woundStage}</span>
            </div>
          )}
          {results.woundScene && (
            <div className="vs-wound-row">
              <span className="vs-wound-label">You became</span>
              <span className="vs-wound-value">{results.woundScene}</span>
            </div>
          )}
          {results.nsLabel && (
            <div className="vs-wound-row">
              <span className="vs-wound-label">Your nervous system learned</span>
              <span className="vs-wound-value">{results.nsLabel}</span>
            </div>
          )}
        </div>
      )}

      <button className="vs-btn-primary" onClick={onContinue} style={{ marginTop: 8 }}>
        Continue to Stage 3
      </button>
    </div>
  )
}

// Stage 3 results (radar chart + dimension insights)
function Stage3Results({ results, onContinue }) {
  const scores = {}
  const insights = {}

  if (results?.dimensions) {
    Object.entries(results.dimensions).forEach(([key, val]) => {
      scores[key] = typeof val === 'object' ? (val.score || val.value || 0) : val
      insights[key] = typeof val === 'object' ? (val.insight || '') : ''
    })
  } else {
    // Flat structure: { choice: 3, connection: 2, ... }
    RADAR_DIMENSIONS.forEach(d => {
      if (results?.[d.id] !== undefined) {
        const v = results[d.id]
        scores[d.id] = typeof v === 'object' ? (v.score || v.value || 0) : v
        insights[d.id] = typeof v === 'object' ? (v.insight || '') : ''
      }
    })
  }

  // Fallback: also check nested scores key
  if (Object.keys(scores).length === 0 && results?.scores) {
    Object.entries(results.scores).forEach(([key, val]) => {
      scores[key] = typeof val === 'object' ? (val.score || 0) : val
      insights[key] = typeof val === 'object' ? (val.insight || '') : ''
    })
  }

  const insightEntries = results?.dimensionInsights || results?.insights || null

  const lowestDim = RADAR_DIMENSIONS.reduce((acc, d) => {
    return (scores[d.id] || 0) < (scores[acc?.id] || 6) ? d : acc
  }, RADAR_DIMENSIONS[0])

  return (
    <div className="vs-results">
      <div className="vs-results-header">
        <div className="vs-results-label">Stage 3 Complete</div>
        <h2>The Cost of Suppression</h2>
      </div>

      {Object.keys(scores).length > 0 && (
        <div className="vs-results-card">
          <h4>Aliveness Dimensions</h4>
          <div className="vs-radar-wrap">
            <GenericRadar
              dimensions={RADAR_DIMENSIONS}
              scores={scores}
              maxLevel={5}
              size={260}
              showLabels={true}
              animate={true}
            />
          </div>

          <div className="vs-dimension-list">
            {RADAR_DIMENSIONS.map(d => {
              const score = scores[d.id] || 0
              const insight = insights[d.id] || (insightEntries && insightEntries[d.id]) || ''
              return (
                <div key={d.id} className="vs-dimension-row" style={{ flexWrap: 'wrap' }}>
                  <span className="vs-dimension-name">{d.emoji} {d.name}</span>
                  <div className="vs-dimension-score-bar">
                    <div
                      className="vs-dimension-score-fill"
                      style={{ width: `${(score / 5) * 100}%` }}
                    />
                  </div>
                  <span className="vs-dimension-score-num">{score}/5</span>
                  {insight && (
                    <span className="vs-dimension-insight">{insight}</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {lowestDim && scores[lowestDim.id] && (
        <div className="vs-results-card">
          <h4>Hardest hit</h4>
          <p style={{ fontSize: '0.95rem', margin: 0, lineHeight: 1.6, color: 'var(--vs-muted)' }}>
            Your <strong style={{ color: 'var(--vs-text)' }}>{lowestDim.name}</strong> channel
            (scored {scores[lowestDim.id]}/5) is where suppression hit hardest.
            {insights[lowestDim.id] && ` ${insights[lowestDim.id]}`}
          </p>
        </div>
      )}

      <button className="vs-btn-primary" onClick={onContinue} style={{ marginTop: 8 }}>
        See the full picture
      </button>
    </div>
  )
}

function CategoryReveal({ results, onContinue }) {
  if (!results) return null
  const hasCategory = results.categoryName && results.categoryStatement

  return (
    <div className="vs-results">
      <div className="vs-results-header">
        <div className="vs-results-label">{hasCategory ? 'Your Category' : 'Your Essence'}</div>
        {hasCategory && <h2 className="vs-gold-text">{results.categoryName}</h2>}
      </div>

      {results.connectionThread && (
        <p style={{ color: 'var(--vs-muted)', fontSize: '0.95rem', textAlign: 'center', margin: '0 0 20px', lineHeight: 1.6, fontStyle: 'italic' }}>
          {results.connectionThread}
        </p>
      )}

      {results.categoryStatement && (
        <div className="vs-results-card">
          <p style={{ fontSize: '1rem', lineHeight: 1.7, margin: 0, color: 'var(--vs-text)' }}>
            {results.categoryStatement}
          </p>
        </div>
      )}

      <button className="vs-btn-primary" onClick={onContinue} style={{ marginTop: 16 }}>
        {hasCategory ? 'See your dares' : 'See your dares for this week'}
      </button>
    </div>
  )
}

function NudgeCards({ nudges, categoryName, onContinue }) {
  return (
    <div className="vs-results">
      <div className="vs-results-header">
        {categoryName && <div className="vs-results-label">{categoryName}</div>}
        <h2>Three dares for this week</h2>
      </div>
      <p style={{ color: 'var(--vs-muted)', fontSize: '0.9rem', textAlign: 'center', margin: '0 0 16px' }}>
        Small actions that honour your essence. Pick at least one.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {(nudges || []).map((nudge, i) => (
          <div key={i} className="vs-results-card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <span style={{ color: 'var(--vs-gold)', fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
            <span style={{ color: 'var(--vs-text)', lineHeight: 1.5 }}>{nudge}</span>
          </div>
        ))}
      </div>

      <button className="vs-btn-primary" onClick={onContinue} style={{ marginTop: 20 }}>
        Continue
      </button>
    </div>
  )
}

// Avatar generation screen
function AvatarScreen({ stage4Results, onSkip }) {
  const [photo, setPhoto] = useState(null)
  const [preview, setPreview] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [generatedUrl, setGeneratedUrl] = useState(null)
  const [error, setError] = useState(null)
  const [loadingText, setLoadingText] = useState('Generating...')
  const fileInputRef = useRef(null)

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhoto(file)
    setPreview(URL.createObjectURL(file))
    setError(null)
    setGeneratedUrl(null)
  }

  const handleGenerate = async () => {
    if (!photo || !stage4Results?.primaryArchetype) return
    setGenerating(true)
    setError(null)

    const labels = ['Reading your essence...', 'Designing your character...', 'Adding the magic...', 'Almost there...']
    let i = 0
    const interval = setInterval(() => { i = (i + 1) % labels.length; setLoadingText(labels[i]) }, 3000)

    try {
      const base64 = await new Promise((resolve) => {
        const img = new Image()
        img.onload = () => {
          let w = img.width, h = img.height
          const MAX = 1024
          if (w > MAX || h > MAX) {
            const ratio = MAX / Math.max(w, h)
            w = Math.round(w * ratio)
            h = Math.round(h * ratio)
          }
          const canvas = document.createElement('canvas')
          canvas.width = w; canvas.height = h
          canvas.getContext('2d').drawImage(img, 0, 0, w, h)
          resolve(canvas.toDataURL('image/jpeg', 0.85).split(',')[1])
        }
        img.src = URL.createObjectURL(photo)
      })

      const primaryResult = stage4Results.primaryArchetype
      const primaryFull = getArchetype(primaryResult?.id) || primaryResult
      const prompt = `Transform this person into a high-quality 3D animated movie character. Use ONLY their face and facial features as reference for likeness. Create a completely new heroic scene around them based on their archetype essence.

Their essence: "${primaryFull.name}" - ${primaryFull.poetic_line || primaryFull.essence}
Their superpower: ${primaryFull.superpower || ''}
Their vision: ${primaryFull.poetic_vision || ''}

Create a dynamic pose and scene background that embodies this essence. The character should be in action or in their element, not just standing. Use warm cinematic lighting with purple and gold tones. Big expressive animated eyes. Heroic but approachable. Modern 3D animated feature film quality. Square composition.`

      const { supabase: sb } = await import('../lib/supabaseClient')
      const { data, error: genErr } = await sb.functions.invoke('generate-avatar-gemini', {
        body: { photo_base64: base64, photo_mime: 'image/jpeg', prompt },
      })

      clearInterval(interval)
      if (genErr || data?.error) {
        setError(data?.message || 'Generation failed. Try again.')
        setGenerating(false)
        return
      }
      setGeneratedUrl(data.url)
      setGenerating(false)
    } catch (err) {
      clearInterval(interval)
      console.warn('Avatar error:', err)
      setError('Something went wrong. Try again.')
      setGenerating(false)
    }
  }

  return (
    <div className="vs-avatar-screen">
      <div className="vs-avatar-inner">
        <h2 className="vs-avatar-title">Create Your Avatar</h2>
        <p className="vs-avatar-desc">Upload a selfie and we will transform you into your essence archetype.</p>

        {generatedUrl ? (
          <div className="vs-avatar-result">
            <img src={generatedUrl} alt="Your essence avatar" className="vs-avatar-image" />
            <button className="vs-btn-primary" onClick={onSkip} style={{ marginTop: 20 }}>Done</button>
          </div>
        ) : preview ? (
          <div className="vs-avatar-preview-wrap">
            <img src={preview} alt="Your selfie" className="vs-avatar-preview" />
            <div className="vs-avatar-actions">
              <button className="vs-btn-primary" onClick={handleGenerate} disabled={generating}>
                {generating ? loadingText : 'Generate my avatar'}
              </button>
              <button className="vs-btn-ghost" onClick={() => { setPhoto(null); setPreview(null) }} disabled={generating}>
                Choose different photo
              </button>
            </div>
            {error && <div className="vs-error-msg">{error}</div>}
          </div>
        ) : (
          <div className="vs-avatar-upload">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="user"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <button className="vs-btn-primary" onClick={() => fileInputRef.current?.click()}>
              Take a selfie or upload photo
            </button>
            <button className="vs-btn-ghost" onClick={onSkip} style={{ marginTop: 12 }}>
              Skip for now
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// Final results page
function FinalResults({ stage1, stage2, stage3, stage4, selectedExpression, confirmedPrediction, onRestart, onCreateAvatar }) {
  const [emailSent, setEmailSent] = useState(false)
  const [email, setEmail] = useState('')
  const [emailSubmitting, setEmailSubmitting] = useState(false)

  const themes = stage1?.themes || stage1?.essenceThemes || []
  const lowestDim = (() => {
    const scores = {}
    if (stage3?.dimensions) {
      Object.entries(stage3.dimensions).forEach(([k, v]) => {
        scores[k] = typeof v === 'object' ? (v.score || 0) : v
      })
    } else {
      RADAR_DIMENSIONS.forEach(d => {
        const v = stage3?.[d.id]
        if (v !== undefined) scores[d.id] = typeof v === 'object' ? (v.score || 0) : v
      })
      if (Object.keys(scores).length === 0 && stage3?.scores) {
        Object.entries(stage3.scores).forEach(([k, v]) => {
          scores[k] = typeof v === 'object' ? (v.score || 0) : v
        })
      }
    }
    return RADAR_DIMENSIONS.reduce((acc, d) => {
      return (scores[d.id] || 0) < (scores[acc?.id] || 6) ? d : acc
    }, RADAR_DIMENSIONS[0])
  })()

  const radarScores = (() => {
    const s = {}
    if (stage3?.dimensions) {
      Object.entries(stage3.dimensions).forEach(([k, v]) => {
        s[k] = typeof v === 'object' ? (v.score || 0) : v
      })
    } else {
      RADAR_DIMENSIONS.forEach(d => {
        const v = stage3?.[d.id]
        if (v !== undefined) s[d.id] = typeof v === 'object' ? (v.score || 0) : v
      })
      if (Object.keys(s).length === 0 && stage3?.scores) {
        Object.entries(stage3.scores).forEach(([k, v]) => {
          s[k] = typeof v === 'object' ? (v.score || 0) : v
        })
      }
    }
    return s
  })()

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim() || emailSubmitting) return
    setEmailSubmitting(true)
    try {
      // Update existing session row with real email + final results
      const { supabase } = await import('../lib/supabaseClient')
      const sessionId = getSessionId()
      await supabase.from('public_leads').upsert({
        id: sessionId,
        email: email.trim(),
        source_flow: 'voice_stems',
        flow_results: { stage1, stage2, stage3, stage4, _sessionId: sessionId },
      }, { onConflict: 'id' })
    } catch {
      // Supabase insert failure is non-fatal
    }
    sessionStorage.setItem('publicFlowEmail', email.trim())
    setEmailSent(true)
    setEmailSubmitting(false)
  }

  const thread = stage2?.thread || stage2?.fullThread
  const rule = stage2?.rule || stage2?.protectiveRule || ''
  const rawSourceDesc = stage2?.sourceEvent || stage2?.source || ''
  const sourceDesc = typeof rawSourceDesc === 'string' ? rawSourceDesc
    : typeof rawSourceDesc === 'object' ? [rawSourceDesc.what, rawSourceDesc.who ? `(${rawSourceDesc.who})` : '', rawSourceDesc.approximateAge ? `around age ${rawSourceDesc.approximateAge}` : ''].filter(Boolean).join(' ')
    : ''

  return (
    <div className="vs-final">
      <div className="vs-final-label">Your Full Picture</div>
      <h1>The Thread</h1>
      <p className="vs-final-intro">
        Four stages. 35 sentences. Here is what came through.
      </p>

      {/* Stage 4: Essence Archetype */}
      {stage4 && (
        <div className="vs-final-section">
          <div className="vs-final-label">YOUR ESSENCE</div>
          <h3 className="vs-gold-text">{stage4.primaryArchetype?.name}</h3>
          {stage4.primaryArchetype?.essence && (
            <p className="vs-final-text" style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 12 }}>{stage4.primaryArchetype.essence}</p>
          )}
          <p className="vs-final-text">{stage4.essenceBlend}</p>
        </div>
      )}

      {/* Stage 1: Essence */}
      <div className="vs-final-section">
        <span className="vs-final-section-label">Stage 1 — Your Essence</span>
        <h3>Who you were as a kid</h3>
        {themes.length > 0 && (
          <div className="vs-theme-tags" style={{ marginBottom: 10 }}>
            {themes.map((t, i) => (
              <span key={i} className="vs-theme-tag">
                {typeof t === 'string' ? t : t.label || t.name || String(t)}
              </span>
            ))}
          </div>
        )}
        {selectedExpression && (
          <p>Most charged: <strong style={{ color: 'var(--vs-text)' }}>{selectedExpression}</strong></p>
        )}
        {stage1?.summary && <p>{stage1.summary}</p>}
      </div>

      {/* Stage 2: Prediction */}
      <div className="vs-final-section">
        <span className="vs-final-section-label">Stage 2 — The Prediction</span>
        <h3>What got shut down</h3>
        {confirmedPrediction && (
          <p>Fear: <strong style={{ color: 'var(--vs-text)' }}>{confirmedPrediction}</strong></p>
        )}
        {sourceDesc && <p>Source: {sourceDesc}</p>}
        {rule && <p>Rule: &ldquo;{rule}&rdquo;</p>}
      </div>

      {/* Stage 3: Cost */}
      <div className="vs-final-section">
        <span className="vs-final-section-label">Stage 3 — The Cost</span>
        <h3>Where suppression hit hardest</h3>
        {Object.keys(radarScores).length > 0 && (
          <div className="vs-radar-wrap" style={{ marginBottom: 12 }}>
            <GenericRadar
              dimensions={RADAR_DIMENSIONS}
              scores={radarScores}
              maxLevel={5}
              size={240}
              showLabels={true}
              animate={true}
            />
          </div>
        )}
        {lowestDim && radarScores[lowestDim.id] && (
          <p>
            Your <strong style={{ color: 'var(--vs-text)' }}>{lowestDim.name}</strong> channel
            scored {radarScores[lowestDim.id]}/5. This is where it hits hardest.
          </p>
        )}
      </div>

      {/* Full thread narrative */}
      {(thread || (selectedExpression && confirmedPrediction)) && (
        <div className="vs-thread-full">
          <span className="vs-thread-full-label">The Full Thread</span>
          <p>
            {thread
              ? (typeof thread === 'string' ? thread : JSON.stringify(thread))
              : `You loved ${selectedExpression}. You learned that ${confirmedPrediction || 'expressing it was dangerous'}. ${sourceDesc ? `That belief started when ${sourceDesc}.` : ''} ${rule ? `You made a rule: "${rule}".` : ''} The cost shows up in every dimension of your life now.`
            }
          </p>
        </div>
      )}

      {/* Email capture */}
      <div className="vs-email-section">
        <h3>Save your results</h3>
        <p>Get a copy of your thread sent to you, plus what to do next.</p>
        {emailSent ? (
          <div className="vs-email-sent">Done. Check your inbox.</div>
        ) : (
          <form className="vs-email-form" onSubmit={handleEmailSubmit}>
            <input
              className="vs-email-input"
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <button
              className="vs-btn-primary"
              type="submit"
              disabled={emailSubmitting}
            >
              {emailSubmitting ? 'Saving...' : 'Send my results'}
            </button>
          </form>
        )}
      </div>

      {onCreateAvatar && (
        <button className="vs-btn-primary" onClick={onCreateAvatar} style={{ marginTop: 20 }}>
          Create your avatar
        </button>
      )}

      <button className="vs-restart-btn" onClick={onRestart}>
        Start again
      </button>
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────────────────────

function EssenceReveal({ results, blendResult, essenceName, onEssenceNameChange, onContinue }) {
  if (!results) return null
  const primary = results.primaryArchetype || {}
  const secondary = results.secondaryArchetype || {}
  const primaryFull = getArchetype(primary.id) || primary
  const secondaryFull = getArchetype(secondary.id) || secondary
  const blend = blendResult?.blended_essence || results.essenceBlend || ''
  const reveal = results.mirrorReveal || ''

  return (
    <div className="vs-essence-reveal">
      <div className="vs-essence-reveal-inner">
        <div className="vs-essence-badge">Your Essence</div>
        <h1 className="vs-essence-name">{essenceName || primary.name || 'Your True Self'}</h1>
        {blend && <p className="vs-essence-tagline">{blend}</p>}

        {reveal && (
          <div className="vs-essence-mirror-card">
            <p className="vs-essence-mirror">{reveal}</p>
          </div>
        )}

        {(primary.name || secondary.name) && (
          <div className="vs-essence-blend-card">
            {primary.name && (
              <div className="vs-archetype-row">
                <span className="vs-archetype-label">Primary</span>
                <span className="vs-archetype-name">{primary.name}</span>
                <p className="vs-archetype-desc">{primary.essence || primaryFull.poetic_line}</p>
              </div>
            )}
            {secondary.name && (
              <div className="vs-archetype-row">
                <span className="vs-archetype-label">Secondary</span>
                <span className="vs-archetype-name vs-gold-text">{secondary.name}</span>
                <p className="vs-archetype-desc">{secondary.essence || secondaryFull.poetic_line}</p>
              </div>
            )}
          </div>
        )}

        <div className="vs-essence-naming">
          <label className="vs-essence-naming-label">Name your essence</label>
          <input
            className="vs-essence-name-input"
            type="text"
            value={essenceName}
            onChange={(e) => onEssenceNameChange(e.target.value)}
            placeholder="Your essence name"
            maxLength={40}
          />
          <p className="vs-essence-naming-hint">This becomes your identity. Edit it to make it yours.</p>
        </div>

        <button className="vs-cta vs-cta-gold" onClick={onContinue} disabled={!essenceName.trim()}>
          This is me
        </button>
      </div>
    </div>
  )
}


/**
 * Flow screen enum:
 * 'landing'
 * 'countdown'       — 3-2-1 before each stem
 * 'stem'            — recording active
 * 'transition'      — brief "got it" between stems
 * 'processing'      — AI processing screen
 * 'selection_1'     — pick essence theme (after stage 1)
 * 'selection_2'     — confirm prediction (after stage 2 layer 2)
 * 'results_1'       — stage 1 results
 * 'results_2'       — stage 2 full thread
 * 'results_3'       — stage 3 radar
 * 'final_results'
 */

export default function VoiceStemFlow({ mode = 'workshop' }) {
  const isOnboarding = mode === 'onboarding'
  const { user } = useAuth()

  // ── Top-level screen state ──────────────────────────────────────────────
  const [screen, setScreen] = useState('landing')
  const [participantName, setParticipantName] = useState('')
  const [participantEmail, setParticipantEmail] = useState('')

  // ── Current position in the flow ───────────────────────────────────────
  // Which stage/layer/stemIndex we're on
  // Encoded as: { stageIndex: 0|1|2, layerIndex: null|0|1, stemIndex: 0..n }
  const [position, setPosition] = useState({ stageIndex: 0, layerIndex: null, stemIndex: 0 })

  // ── Context carried between stages ────────────────────────────────────
  const [selectedExpression, setSelectedExpression] = useState(null) // from selection_1
  const [confirmedPrediction, setConfirmedPrediction] = useState(null) // from selection_2

  // ── Transcripts accumulated per stage/layer ─────────────────────────
  // Map of stemId → transcript
  const transcriptsRef = useRef({})
  // Active in-flight transcription promises
  const pendingTranscriptionsRef = useRef([])

  // ── Stage results from AI ───────────────────────────────────────────
  const [stage1Results, setStage1Results] = useState(null)
  const [stage2Results, setStage2Results] = useState(null)
  const [stage3Results, setStage3Results] = useState(null)
  const [stage4Results, setStage4Results] = useState(null)
  const [stage5Results, setStage5Results] = useState(null)
  const [stage6Results, setStage6Results] = useState(null)
  const [blendResult, setBlendResult] = useState(null)
  const [essenceName, setEssenceName] = useState('')
  const [categoryResults, setCategoryResults] = useState(null)

  // ── Stage 5 results ref (used by handleSignupComplete) ─────────────
  const stage5ResultsRef = useRef(null)

  // ── Paused state ────────────────────────────────────────────────
  const [paused, setPaused] = useState(false)

  // ── Countdown state ────────────────────────────────────────────────
  const [countdownNum, setCountdownNum] = useState(3)
  const countdownRef = useRef(null)

  // ── Recording timer ───────────────────────────────────────────────
  const [stemSeconds, setStemSeconds] = useState(MAX_STEM_SECONDS)
  const stemTimerRef = useRef(null)

  // ── Processing stage label ────────────────────────────────────────
  const [processingStageKey, setProcessingStageKey] = useState(1)

  // ── Position ref (always-current, used by advanceStem from setTimeout) ──
  const positionRef = useRef(position)
  positionRef.current = position

  // ── Error state ───────────────────────────────────────────────────
  const [flowError, setFlowError] = useState(null)

  // ── Audio recorder ────────────────────────────────────────────────
  const { start, stop, audioBlob, error: recError, permissionGranted, requestPermission, isInApp } =
    useAudioRecorder({ onSilenceStop: () => handleStemDone() })

  // ── Computed: current stems list ─────────────────────────────────
  const context = { selectedExpression, confirmedPrediction }
  const currentStems = getStemsForStage(position.stageIndex, position.layerIndex, context)
  const currentStem = currentStems[position.stemIndex] || null

  // ── Progress percent for progress bar ────────────────────────────
  const totalStems = 39 // 6 + 13 + 10 + 6 + 4(category)
  const stemsCompleted = (() => {
    if (position.stageIndex === 0) return position.stemIndex
    if (position.stageIndex === 1) {
      const layer1done = 6
      if (position.layerIndex === null || position.layerIndex === 0) return layer1done + position.stemIndex
      return layer1done + 7 + position.stemIndex
    }
    if (position.stageIndex === 2) return 6 + 13 + position.stemIndex
    if (position.stageIndex === 3) return 6 + 13 + 10 + position.stemIndex
    return 6 + 13 + 10 + 6 + position.stemIndex // stageIndex === 4 (category)
  })()
  const progressPercent = Math.round((stemsCompleted / totalStems) * 100)

  // ── Progress label ────────────────────────────────────────────────
  const stageLabel = (() => {
    const total = 5
    if (position.stageIndex === 0) return `Stage 1 of ${total}  ·  Stem ${position.stemIndex + 1} of ${currentStems.length}`
    if (position.stageIndex === 1) {
      const layer = position.layerIndex === 0 ? 'Layer 2' : 'Layer 3'
      return `Stage 2 of ${total} (${layer})  ·  Stem ${position.stemIndex + 1} of ${currentStems.length}`
    }
    if (position.stageIndex === 2) return `Stage 3 of ${total}  ·  Stem ${position.stemIndex + 1} of ${currentStems.length}`
    if (position.stageIndex === 3) return `Stage 4 of ${total}  ·  Stem ${position.stemIndex + 1} of ${currentStems.length}`
    return `Your Category  ·  Stem ${position.stemIndex + 1} of ${currentStems.length}`
  })()

  // ── Restore from localStorage / skip to stage on mount ───────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const skipTo = params.get('skip')
    const resumeStage = params.get('resume')

    const saved = loadSession()

    // Always restore saved state if it exists
    if (saved) {
      if (saved.selectedExpression) setSelectedExpression(saved.selectedExpression)
      if (saved.confirmedPrediction) setConfirmedPrediction(saved.confirmedPrediction)
      if (saved.stage1Results) setStage1Results(saved.stage1Results)
      if (saved.stage2Results) setStage2Results(saved.stage2Results)
      if (saved.stage3Results) setStage3Results(saved.stage3Results)
      if (saved.stage4Results) setStage4Results(saved.stage4Results)
      if (saved.stage5Results) { setStage5Results(saved.stage5Results); stage5ResultsRef.current = saved.stage5Results }
      if (saved.stage6Results) setStage6Results(saved.stage6Results)
      if (saved.blendResult) setBlendResult(saved.blendResult)
      if (saved.essenceName) setEssenceName(saved.essenceName)
      if (saved.categoryResults) setCategoryResults(saved.categoryResults)
    }

    // ?skip=N jumps directly to that stage's recording
    if (skipTo) {
      const n = parseInt(skipTo, 10)
      if (n === 5) {
        setTimeout(() => setScreen('experience_intro'), 100)
        return
      }
      if (n === 6) {
        const s = loadSession()
        if (s?.stage6Results) {
          // Stage 6 already done — go to signup gate
          setTimeout(() => setScreen('signup_gate'), 100)
        } else if (s?.stage5Results) {
          // Stage 5 done — go to paid filter
          setStage5Results(s.stage5Results)
          stage5ResultsRef.current = s.stage5Results
          setTimeout(() => setScreen('paid_intro'), 100)
        } else {
          setTimeout(() => setScreen('experience_intro'), 100)
        }
        return
      }
      const stageIdx = n - 1
      setTimeout(() => beginStage({ stageIndex: stageIdx }), 100)
      return
    }

    if (!saved) return

    // ?resume=N requires saved data from prior stages
    if (resumeStage) {
      setTimeout(() => {
        if (resumeStage === '2' && saved.stage1Results) {
          beginStage({ stageIndex: 1, layerIndex: 0 })
        } else if (resumeStage === 'selection_2' && saved.stage2Results) {
          setScreen('selection_2')
        } else if (resumeStage === 'results_1' && saved.stage1Results) {
          setScreen('results_1')
        } else if (resumeStage === 'results_2' && saved.stage2Results) {
          setScreen('results_2')
        } else if (resumeStage === '3' && saved.stage2Results) {
          beginStage({ stageIndex: 2 })
        } else if (resumeStage === 'results_3' && saved.stage3Results) {
          setScreen('results_3')
        } else if (resumeStage === '4' && saved.stage3Results) {
          beginStage({ stageIndex: 3 })
        }
      }, 100)
    } else if (saved.completed) {
      setScreen('final_results')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Cleanup timers on unmount ─────────────────────────────────────
  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current)
      if (stemTimerRef.current) clearInterval(stemTimerRef.current)
    }
  }, [])

  // ── Watch for audioBlob from recorder ────────────────────────────
  // When recording stops, kick off transcription immediately
  const currentStemIdRef = useRef(null)
  useEffect(() => {
    if (!audioBlob || !currentStemIdRef.current) return
    const stemId = currentStemIdRef.current
    currentStemIdRef.current = null

    // Kick off transcription immediately — it runs in the background
    const promise = transcribeAudio(audioBlob)
      .then(result => {
        const transcript = result?.transcript || ''
        transcriptsRef.current[stemId] = transcript
      })
      .catch(err => {
        console.warn('Transcription failed for', stemId, err)
        // Store empty string on failure — processStage can handle it
        transcriptsRef.current[stemId] = ''
      })

    pendingTranscriptionsRef.current.push(promise)
  }, [audioBlob])

  // ── Start a countdown then begin recording ─────────────────────
  const startCountdownThenRecord = useCallback((stemId) => {
    // Clear any existing timers first (prevents stacking on resume/rapid calls)
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null }
    if (stemTimerRef.current) { clearInterval(stemTimerRef.current); stemTimerRef.current = null }

    setCountdownNum(3)
    setScreen('countdown')

    const maxSecs = stemId.startsWith('sc_') ? MAX_CATEGORY_SECONDS : MAX_STEM_SECONDS

    let count = 3
    countdownRef.current = setInterval(() => {
      count -= 1
      if (count <= 0) {
        clearInterval(countdownRef.current)
        countdownRef.current = null
        currentStemIdRef.current = stemId
        setStemSeconds(maxSecs)
        setScreen('stem')
        start()

        // visible countdown (30s or 60s depending on stem type)
        let secs = maxSecs
        stemTimerRef.current = setInterval(() => {
          secs -= 1
          setStemSeconds(secs)
          if (secs <= 0) {
            clearInterval(stemTimerRef.current)
            stemTimerRef.current = null
            handleStemDone()
          }
        }, 1000)
      } else {
        setCountdownNum(count)
      }
    }, 1000)
  }, [start]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handle stem done (timer end, silence, or manual Done) ─────
  const handleStemDone = useCallback(() => {
    if (stemTimerRef.current) {
      clearInterval(stemTimerRef.current)
      stemTimerRef.current = null
    }
    stop()
    setScreen('transition')

    // After 1 second, advance to next stem or move to processing
    setTimeout(() => {
      advanceStem()
    }, 1000)
  }, [stop]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Advance to next stem in the current stage/layer ───────────
  const advanceStem = useCallback(() => {
    const pos = positionRef.current
    const stems = getStemsForStage(pos.stageIndex, pos.layerIndex, { selectedExpression, confirmedPrediction })
    const nextIndex = pos.stemIndex + 1

    if (nextIndex < stems.length) {
      setPosition({ ...pos, stemIndex: nextIndex })
      startCountdownThenRecord(stems[nextIndex].id)
    } else {
      triggerProcessing(pos.stageIndex, pos.layerIndex)
    }
  }, [selectedExpression, confirmedPrediction, startCountdownThenRecord]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Trigger AI processing for a stage/layer ───────────────────
  const triggerProcessing = useCallback(async (stageIndex, layerIndex) => {
    setScreen('processing')
    setFlowError(null)

    if (stageIndex === 0) setProcessingStageKey(1)
    else if (stageIndex === 1 && layerIndex === 0) setProcessingStageKey('2a')
    else if (stageIndex === 1 && layerIndex === 1) setProcessingStageKey('2b')
    else if (stageIndex === 2) setProcessingStageKey(3)
    else if (stageIndex === 3) setProcessingStageKey(4)
    else if (stageIndex === 4) setProcessingStageKey(7)

    // Wait for all in-flight transcriptions to complete
    const pending = [...pendingTranscriptionsRef.current]
    pendingTranscriptionsRef.current = []
    await Promise.allSettled(pending)

    // Build transcript array for this stage/layer
    const stems = getStemsForStage(stageIndex, layerIndex, { selectedExpression, confirmedPrediction })
    const transcripts = stems.map(stem => ({
      stemId: stem.id,
      stemText: stem.text,
      transcript: transcriptsRef.current[stem.id] || '',
    }))

    // Save transcripts immediately BEFORE AI processing (survives processing failures)
    const stageKey = stageIndex === 0 ? 'stage1Transcripts'
      : stageIndex === 1 ? 'stage2Transcripts'
      : stageIndex === 2 ? 'stage3Transcripts'
      : stageIndex === 3 ? 'stage4Transcripts'
      : 'stage5Transcripts'
    saveSession({ [stageKey]: transcriptsRef.current })

    try {
      if (stageIndex === 0) {
        // Stage 1 — cluster essence themes
        const results = await processStage(1, transcripts, {})
        setStage1Results(results)
        // Save to localStorage
        // Auto-select the energy as the expression (no manual selection needed)
        // Use essenceSummary (broader context) for Stage 2 stems if available
        const energy = results?.energy || 'your essence'
        const expression = results?.essenceSummary || energy
        setSelectedExpression(expression)
        saveSession({ stage1Transcripts: transcriptsRef.current, stage1Results: results, selectedExpression: expression })
        setScreen('results_1')

      } else if (stageIndex === 1 && layerIndex === 0) {
        // Stage 2 layer 2 — extract prediction
        const results = await processStage(2, transcripts, { selectedExpression })
        setStage2Results(results)
        saveSession({ stage2Transcripts: transcriptsRef.current, stage2Results: results })
        const predictions = results?.predictions || results?.dominantPredictions || []
        const singlePrediction = results?.dominantPrediction || results?.prediction
        if (predictions.length > 0) {
          setScreen('selection_2')
        } else if (singlePrediction) {
          // Single prediction returned — auto-confirm and move to layer 3
          setConfirmedPrediction(singlePrediction)
          beginStage({ stageIndex: 1, layerIndex: 1 })
        } else {
          // Fallback
          setScreen('selection_2')
        }

      } else if (stageIndex === 1 && layerIndex === 1) {
        // Stage 2 layer 3 — extract source
        // Merge layer 2 transcripts with layer 3 for final processing
        const layer2Stems = getStemsForStage(1, 0, { selectedExpression, confirmedPrediction })
        const layer2Transcripts = layer2Stems.map(stem => ({
          stemId: stem.id,
          stemText: stem.text,
          transcript: transcriptsRef.current[stem.id] || '',
        }))
        const allLayer2And3 = [...layer2Transcripts, ...transcripts]
        const results = await processStage(2, allLayer2And3, { selectedExpression, confirmedPrediction })
        setStage2Results(results)
        saveSession({
          stage1Results: stage1Results,
          stage2Transcripts: transcriptsRef.current,
          stage2Results: results,
        })
        setScreen('results_2')

      } else if (stageIndex === 2) {
        // Stage 3 — dimension scoring
        const results = await processStage(3, transcripts, { selectedExpression, confirmedPrediction })
        setStage3Results(results)
        const s2Results = stage2Results
        saveSession({
          stage1Results,
          stage2Results: s2Results,
          stage3Transcripts: transcriptsRef.current,
          stage3Results: results,
        })
        setScreen('results_3')
      } else if (stageIndex === 3) {
        // Stage 4 — Essence archetype
        const lowestDim = stage3Results?.dimensions
          ? Object.entries(stage3Results.dimensions).reduce((low, [k, v]) =>
              (v?.score || 5) < (low.score || 5) ? { key: k, score: v?.score } : low, { key: '', score: 5 }
            ).key
          : ''
        const results = await processStage(4, transcripts, {
          selectedExpression,
          confirmedPrediction,
          stage1Mirror: stage1Results?.mirror || '',
          woundScene: stage2Results?.woundScene || '',
          nsLabel: stage2Results?.nsLabel || '',
          lowestDimension: lowestDim,
        })
        setStage4Results(results)
        saveSession({
          stage4Results: results,
          completed: true,
        })
        // Call essence-mirror-blend to get custom name before showing reveal
        const primaryData = getArchetype(results.primaryArchetype?.id)
        const secondaryData = getArchetype(results.secondaryArchetype?.id)
        if (primaryData && secondaryData) {
          try {
            const { data: blendData } = await supabase.functions.invoke('essence-mirror-blend', {
              body: {
                primary: {
                  name: primaryData.name,
                  poetic_line: primaryData.poetic_line,
                  superpower: primaryData.superpower,
                  essence_wound: primaryData.essence_wound,
                  poetic_vision: primaryData.poetic_vision,
                  energetic_transmission: primaryData.energetic_transmission,
                  north_star: primaryData.north_star,
                  vision_in_action: primaryData.vision_in_action,
                },
                secondary: {
                  name: secondaryData.name,
                  poetic_line: secondaryData.poetic_line,
                  superpower: secondaryData.superpower,
                  essence_wound: secondaryData.essence_wound,
                  poetic_vision: secondaryData.poetic_vision,
                  energetic_transmission: secondaryData.energetic_transmission,
                  north_star: secondaryData.north_star,
                  vision_in_action: secondaryData.vision_in_action,
                },
              },
            })
            if (blendData?.blended_name) {
              setBlendResult(blendData)
              setEssenceName(blendData.blended_name.replace(/^The\s+/i, ''))
              saveSession({ blendResult: blendData, essenceName: blendData.blended_name.replace(/^The\s+/i, '') })
            } else {
              setEssenceName(primaryData.name)
            }
          } catch (blendErr) {
            console.warn('Blend API error:', blendErr)
            setEssenceName(primaryData.name)
          }
        } else {
          setEssenceName(results.primaryArchetype?.name || 'Your True Self')
        }
        setScreen('essence_reveal')
      } else if (stageIndex === 4) {
        // Category synthesis — send all prior data + category transcripts
        const results = await processStage(7, transcripts, {
          stage1Energy: stage1Results?.energy || '',
          stage1Summary: stage1Results?.essenceSummary || stage1Results?.energy || '',
          confirmedPrediction: confirmedPrediction || '',
          rule: stage2Results?.rule || stage2Results?.protectiveRule || '',
          protectivePattern: stage2Results?.protectivePattern || '',
          woundStage: stage2Results?.woundStage || '',
          woundScene: stage2Results?.woundScene || '',
          nsLabel: stage2Results?.nsLabel || '',
          lowestDimension: stage3Results?.lowestDimension || '',
          primaryArchetype: stage4Results?.primaryArchetype?.name || '',
          secondaryArchetype: stage4Results?.secondaryArchetype?.name || '',
          essenceBlend: stage4Results?.essenceBlend || '',
        })
        setCategoryResults(results)
        saveSession({ categoryResults: results })
        setScreen('category_reveal')
      }
    } catch (err) {
      console.error('processStage error:', err)
      setFlowError('Something went wrong analysing your responses. Tap to retry.')
    }
  }, [selectedExpression, confirmedPrediction, stage1Results, stage2Results, stage3Results, stage4Results]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Begin a new stage/layer ────────────────────────────────────
  const beginStage = useCallback(({ stageIndex, layerIndex = null }) => {
    const stems = getStemsForStage(stageIndex, layerIndex, { selectedExpression, confirmedPrediction })
    if (!stems.length) return
    setPosition({ stageIndex, layerIndex, stemIndex: 0 })
    startCountdownThenRecord(stems[0].id)
  }, [selectedExpression, confirmedPrediction, startCountdownThenRecord])

  // ── Permission + start flow ───────────────────────────────────
  const handleStart = async () => {
    if (!permissionGranted) {
      const ok = await requestPermission()
      if (!ok) return
    }
    saveSession({ name: participantName.trim(), email: participantEmail.trim().toLowerCase() })
    beginStage({ stageIndex: 0, layerIndex: null })
  }

  // ── Restart ────────────────────────────────────────────────────
  const handleRestart = () => {
    clearSession()
    transcriptsRef.current = {}
    pendingTranscriptionsRef.current = []
    setStage1Results(null)
    setStage2Results(null)
    setStage3Results(null)
    setStage4Results(null)
    setStage5Results(null)
    setStage6Results(null)
    setSelectedExpression(null)
    setConfirmedPrediction(null)
    setCategoryResults(null)
    setPosition({ stageIndex: 0, layerIndex: null, stemIndex: 0 })
    setFlowError(null)
    stage5ResultsRef.current = null
    setScreen('landing')
  }

  // ── Selection bridge handler ───────────────────────────────────
  const handleSelection2 = (option) => {
    const label = typeof option === 'string' ? option : option.label || option.text || String(option)
    setConfirmedPrediction(label)
    saveSession({ confirmedPrediction: label })
    // Start layer 3
    setTimeout(() => beginStage({ stageIndex: 1, layerIndex: 1 }), 400)
  }

  // ── Error retry ────────────────────────────────────────────────
  const handleRetryProcessing = () => {
    setFlowError(null)
    triggerProcessing(position.stageIndex, position.layerIndex)
  }

  // ── Pause / Resume / Start Over ──────────────────────────────
  const handlePause = useCallback(() => {
    if (stemTimerRef.current) { clearInterval(stemTimerRef.current); stemTimerRef.current = null }
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null }
    currentStemIdRef.current = null // prevent partial blob from being transcribed
    stop()
    setPaused(true)
  }, [stop])

  const handleResume = useCallback(() => {
    setPaused(false)
    if (currentStem) {
      startCountdownThenRecord(currentStem.id)
    }
  }, [currentStem, startCountdownThenRecord])

  const handleStartOver = () => {
    setPaused(false)
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null }
    if (stemTimerRef.current) { clearInterval(stemTimerRef.current); stemTimerRef.current = null }
    stop()
    setScreen('landing')
  }

  // ── Save essence profile to DB (any mode, if authenticated) ──

  const saveEssenceProfile = useCallback(async (finalName) => {
    if (!user?.id) return
    const s4 = stage4Results
    if (!s4?.primaryArchetype?.id) return
    const primaryData = getArchetype(s4.primaryArchetype.id)
    const secondaryData = getArchetype(s4.secondaryArchetype?.id)

    // essence_profiles upsert
    supabase.from('essence_profiles').upsert({
      user_id: user.id,
      primary_archetype: s4.primaryArchetype.id,
      secondary_archetype: s4.secondaryArchetype?.id || null,
      blended_name: finalName,
      blended_narrative: blendResult?.blended_essence || null,
      blended_superpower: blendResult?.blended_superpower || null,
      blended_wound: blendResult?.blended_wound || null,
      question_responses: {
        source: 'voice_stems',
        stage1: stage1Results ? { expression: selectedExpression } : null,
        stage2: stage2Results ? { prediction: confirmedPrediction } : null,
      },
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' }).then(({ error }) => {
      if (error) console.error('essence_profiles upsert error:', error)
    })

    // lead_flow_profiles insert (latest row wins on read side)
    const displayName = user.user_metadata?.display_name || user.user_metadata?.name || null
    supabase.from('lead_flow_profiles').insert({
      user_id: user.id,
      email: user.email,
      user_name: displayName,
      essence_archetype: primaryData?.name || s4.primaryArchetype.name,
      custom_essence_name: finalName,
      custom_essence_fields: {
        tagline: blendResult?.blended_essence || primaryData?.essence,
        essence: blendResult?.blended_essence || primaryData?.poetic_line,
        superpower: blendResult?.blended_superpower || primaryData?.superpower,
        wound: blendResult?.blended_wound || primaryData?.essence_wound,
        vision: blendResult?.blended_vision || primaryData?.poetic_vision,
        north_star: primaryData?.north_star,
        energetic_transmission: primaryData?.energetic_transmission,
        recognition_pattern: primaryData?.recognition_pattern,
        vision_in_action: primaryData?.vision_in_action,
        inner_child: primaryData?.inner_child_desire,
        characters: primaryData?.characters?.join(', '),
        secondary_archetype: secondaryData?.name || null,
      },
    }).then(({ error }) => {
      if (error) console.error('lead_flow_profiles insert error:', error)
    })
  }, [user, stage4Results, blendResult, stage1Results, stage2Results, selectedExpression, confirmedPrediction])

  // ── Signup + Dome Ratings Bridge ──────────────────────────────

  const handleSignupComplete = useCallback(async (authedUser) => {
    if (!authedUser?.id) return

    // Build dome ratings from stage 5+6 results
    const s5 = stage5ResultsRef.current
    const s6 = stage6Results
    if (!s5) {
      setScreen('download_app')
      return
    }

    const rows = []
    const now = new Date().toISOString()
    // Stage 6 path activities = fun + wants to get paid
    ;(s6?.path || []).forEach(a => {
      rows.push({ user_id: authedUser.id, node_id: a.id, ns_state: 'fun', want_paid: true, updated_at: now })
    })
    // Stage 6 passion activities = fun + doesn't want to get paid
    ;(s6?.hobby || []).forEach(a => {
      rows.push({ user_id: authedUser.id, node_id: a.id, ns_state: 'fun', want_paid: false, updated_at: now })
    })
    // Fun activities not in stage 6 results (skipped paid filter or zero batches)
    const s6Ids = new Set([...(s6?.path || []).map(a => a.id), ...(s6?.hobby || []).map(a => a.id)])
    ;(s5.fun || []).forEach(a => {
      if (!s6Ids.has(a.id)) {
        rows.push({ user_id: authedUser.id, node_id: a.id, ns_state: 'fun', want_paid: false, updated_at: now })
      }
    })
    // Not fun = bored
    ;(s5.notFun || []).forEach(a => {
      rows.push({ user_id: authedUser.id, node_id: a.id, ns_state: 'bored', want_paid: false, updated_at: now })
    })

    if (rows.length > 0) {
      const { error } = await supabase
        .from('experience_dome_ratings')
        .upsert(rows, { onConflict: 'user_id,node_id' })
      if (error) {
        console.error('Failed to save dome ratings:', error)
      }
    }

    setScreen('download_app')
  }, [stage6Results]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="vs">
      <div className="vs-container">

        {/* LANDING */}
        {screen === 'landing' && (
          <div className="vs-landing">
            <div className="vs-landing-label">Essence Journey</div>
            <h1>Find Your Thread</h1>
            <p className="vs-landing-desc">
              {isOnboarding
                ? "Speak fast. Don't think. First thing that comes. 7 stages, about 35 minutes."
                : "You'll complete sentences out loud. Speak fast. Don't think. First thing that comes. 39 stems, 5 stages, about 25 minutes."
              }
            </p>

            {isInApp && (
              <div className="vs-inapp-warning">
                Open this in Safari or Chrome. In-app browsers don&apos;t support microphone recording.
              </div>
            )}

            <div className="vs-landing-stages">
              {[
                { n: 1, label: 'Living from Essence', desc: '6 stems — who you were as a kid' },
                { n: 2, label: 'Essence Suppressed', desc: '13 stems — what got shut down and why' },
                { n: 3, label: 'Consequences', desc: '10 stems — the cost of suppression now' },
                { n: 4, label: 'The Search', desc: '6 stems — who you are underneath it all' },
                { n: 5, label: 'Your Category', desc: '4 stems — the problem you were made to solve' },
                ...(isOnboarding ? [
                  { n: 6, label: 'The Experience Game', desc: '105 activities — what lights you up' },
                  { n: 7, label: 'The Paid Filter', desc: 'your fun activities — path or hobby' },
                ] : []),
              ].map(s => (
                <div key={s.n} className="vs-stage-pill">
                  <div className="vs-stage-pill-num">{s.n}</div>
                  <div className="vs-stage-pill-info">
                    <strong>{s.label}</strong>
                    <span>{s.desc}</span>
                  </div>
                </div>
              ))}
            </div>

            {!isOnboarding && (
              <div className="vs-landing-form">
                <input
                  type="text"
                  placeholder="Your name"
                  value={participantName}
                  onChange={(e) => setParticipantName(e.target.value)}
                  className="vs-input"
                />
                <input
                  type="email"
                  placeholder="Your email"
                  value={participantEmail}
                  onChange={(e) => setParticipantEmail(e.target.value)}
                  className="vs-input"
                />
              </div>
            )}

            {recError && <div className="vs-error-msg">{recError}</div>}

            <button
              className="vs-btn-primary"
              onClick={handleStart}
              disabled={isInApp || (!isOnboarding && (!participantName.trim() || !participantEmail.trim()))}
            >
              {permissionGranted ? 'Begin' : 'Allow microphone and begin'}
            </button>
          </div>
        )}

        {/* PAUSED OVERLAY */}
        {paused && (
          <div className="vs-stem-screen">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 16, padding: 24 }}>
              <h2 style={{ color: 'var(--vs-text)', margin: 0 }}>Paused</h2>
              <p style={{ color: 'var(--vs-muted)', margin: 0, textAlign: 'center' }}>
                Take your time. When you are ready, pick up where you left off.
              </p>
              <button className="vs-btn-primary" onClick={handleResume} style={{ marginTop: 12 }}>
                Resume
              </button>
              <button className="vs-btn-ghost" onClick={handleStartOver}>
                Start over
              </button>
            </div>
          </div>
        )}

        {/* COUNTDOWN */}
        {screen === 'countdown' && !paused && currentStem && (
          <div className="vs-stem-screen">
            <ProgressBar label={stageLabel} percent={progressPercent} />
            <CountdownOverlay count={countdownNum} stemText={currentStem.text} />
            <button
              className="vs-btn-ghost"
              onClick={handlePause}
              style={{ position: 'absolute', top: 16, right: 16, fontSize: '0.85rem' }}
            >
              Pause
            </button>
          </div>
        )}

        {/* STEM (recording active) */}
        {screen === 'stem' && !paused && currentStem && (
          <div className="vs-stem-screen">
            <ProgressBar label={stageLabel} percent={progressPercent} />
            <div className="vs-stem-text">{currentStem.text}</div>
            <RecordingZone
              secondsLeft={stemSeconds}
              onDone={handleStemDone}
            />
            <button
              className="vs-btn-ghost"
              onClick={handlePause}
              style={{ position: 'absolute', top: 16, right: 16, fontSize: '0.85rem' }}
            >
              Pause
            </button>
          </div>
        )}

        {/* TRANSITION (brief "got it") */}
        {screen === 'transition' && !paused && (
          <div className="vs-stem-screen">
            <div className="vs-transition">
              <div className="vs-got-it">Got it.</div>
              <div className="vs-transcribing-label">Transcribing...</div>
            </div>
          </div>
        )}

        {/* PROCESSING */}
        {screen === 'processing' && !flowError && (
          <ProcessingScreen stage={processingStageKey} />
        )}

        {/* PROCESSING ERROR (stages 1-4 only) */}
        {screen === 'processing' && flowError && (
          <div className="vs-processing">
            <div className="vs-error-msg" style={{ maxWidth: 360 }}>{flowError}</div>
            <button className="vs-btn-primary" onClick={handleRetryProcessing} style={{ marginTop: 16 }}>
              Retry
            </button>
          </div>
        )}


        {/* SELECTION 1 — pick essence theme */}
        {screen === 'selection_1' && stage1Results && (
          <SelectionBridge
            type="theme"
            options={
              (stage1Results.patterns || []).map(p => p.label) ||
              (stage1Results.themes || stage1Results.essenceThemes || []).map(t => t.label || t)
            }
            prompt="Which of these feels most alive right now?"
            onSelect={(selected) => {
              setSelectedExpression(selected)
              saveSession({ selectedExpression: selected })
              beginStage({ stageIndex: 1, layerIndex: 0 })
            }}
          />
        )}

        {/* RESULTS 1 — stage 1 summary */}
        {screen === 'results_1' && stage1Results && (
          <Stage1Results
            results={stage1Results}
            onContinue={() => beginStage({ stageIndex: 1, layerIndex: 0 })}
          />
        )}

        {/* SELECTION 2 — confirm prediction */}
        {screen === 'selection_2' && stage2Results && (
          <SelectionBridge
            type="prediction"
            options={
              stage2Results.predictions ||
              stage2Results.dominantPredictions ||
              (stage2Results.dominantPrediction ? [stage2Results.dominantPrediction] : ['I will be judged', 'I will fail', 'I will be rejected'])
            }
            onSelect={handleSelection2}
          />
        )}

        {/* RESULTS 2 — full thread */}
        {screen === 'results_2' && stage2Results && (
          <Stage2Results
            results={stage2Results}
            selectedExpression={selectedExpression}
            confirmedPrediction={confirmedPrediction}
            onContinue={() => beginStage({ stageIndex: 2, layerIndex: null })}
          />
        )}

        {/* RESULTS 3 — radar */}
        {screen === 'results_3' && stage3Results && (
          <Stage3Results
            results={stage3Results}
            onContinue={() => beginStage({ stageIndex: 3 })}
          />
        )}

        {/* ESSENCE REVEAL */}
        {screen === 'essence_reveal' && stage4Results && (
          <EssenceReveal
            results={stage4Results}
            blendResult={blendResult}
            essenceName={essenceName}
            onEssenceNameChange={(name) => {
              setEssenceName(name)
              saveSession({ essenceName: name })
            }}
            onContinue={() => {
              saveEssenceProfile(essenceName)
              setScreen('avatar')
            }}
          />
        )}

        {/* ── EXPERIENCE GAME (Stage 5) ─────────────────────────── */}

        {/* EXPERIENCE INTRO */}
        {screen === 'experience_intro' && (
          <div className="vs-exp-intro">
            <div className="vs-results-card">
              <div className="vs-results-label">Stage 5</div>
              <h2 className="vs-results-title">The Experience Game</h2>
              <p className="vs-exp-intro-desc">
                Activities will appear one at a time. For each one, say <strong>&quot;fun&quot;</strong> or <strong>&quot;not fun&quot;</strong> (or yes/no). Go fast. Trust your gut.
              </p>
              <p className="vs-exp-intro-sub">
                {EXPERIENCE_ACTIVITIES.length} activities. About 4 minutes.
              </p>
            </div>
            <div className="vs-bottom-action">
              <DoubleConfirmButton
                onConfirm={() => setScreen('exp_live')}
                label="Start the game"
                confirmLabel="Ready? Tap to begin"
              />
            </div>
          </div>
        )}

        {/* EXPERIENCE GAME LIVE — one at a time */}
        {screen === 'exp_live' && (
          <ExperienceGameLive
            activities={EXPERIENCE_ACTIVITIES}
            onComplete={(results) => {
              setStage5Results(results)
              stage5ResultsRef.current = results
              saveSession({ stage5Results: results })
              setScreen('experience_results')
            }}
          />
        )}

        {/* EXPERIENCE RESULTS */}
        {screen === 'experience_results' && stage5Results && (
          <div className="vs-results">
            <div className="vs-results-header">
              <div className="vs-results-label">Stage 5 Complete</div>
              <h2>Your Experiences</h2>
            </div>
            <div className="vs-results-card">
              <h4>Fun ({(stage5Results.fun || []).length})</h4>
              <div className="vs-exp-result-list">
                {(stage5Results.fun || []).map(a => (
                  <span key={a.id} className="vs-exp-tag vs-exp-tag-fun">{a.label}</span>
                ))}
              </div>
            </div>
            {(stage5Results.uncertain || []).length > 0 && (
              <div className="vs-results-card">
                <h4>Uncertain ({stage5Results.uncertain.length})</h4>
                <div className="vs-exp-result-list">
                  {stage5Results.uncertain.map(a => (
                    <span key={a.id} className="vs-exp-tag vs-exp-tag-uncertain">{a.label}</span>
                  ))}
                </div>
              </div>
            )}
            <DoubleConfirmButton
              onConfirm={() => setScreen('paid_intro')}
              label="Continue"
              confirmLabel="Ready? Tap to continue"
            />
          </div>
        )}

        {/* ── PAID FILTER (Stage 6) ──────────────────────────────── */}

        {/* PAID INTRO */}
        {screen === 'paid_intro' && (
          <div className="vs-exp-intro">
            <div className="vs-results-card">
              <div className="vs-results-label">Stage 6</div>
              <h2 className="vs-results-title">The Paid Filter</h2>
              <p className="vs-exp-intro-desc">
                For each activity you said was fun, we will ask: <strong>would you want to get paid for this?</strong>
              </p>
              <p className="vs-exp-intro-desc" style={{ marginTop: 12 }}>
                Say <strong>&quot;yes&quot;</strong> or <strong>&quot;no&quot;</strong> (or tap the buttons). No wrong answers.
              </p>
              <p className="vs-exp-intro-sub">
                {(stage5Results?.fun || []).length} activities. About {Math.ceil((stage5Results?.fun || []).length * 2 / 60)} minutes.
              </p>
            </div>
            <div className="vs-bottom-action">
              <DoubleConfirmButton
                onConfirm={() => setScreen('paid_live')}
                label="Start"
                confirmLabel="Ready? Tap to begin"
              />
            </div>
          </div>
        )}

        {/* PAID GAME LIVE */}
        {screen === 'paid_live' && (
          <ExperienceGameLive
            activities={stage5Results?.fun || []}
            mode="paid"
            onComplete={(results) => {
              const path = (results.fun || [])       // yes = would get paid
              const hobby = (results.notFun || [])    // no = just a hobby
              const s6 = { path, hobby }
              setStage6Results(s6)
              saveSession({ stage6Results: s6 })
              setScreen('signup_gate')
            }}
          />
        )}

        {/* SIGNUP GATE (after Stage 6, before download) */}
        {screen === 'signup_gate' && (
          <SignupGate
            prefillEmail={(() => { try { const s = JSON.parse(localStorage.getItem(STORAGE_KEY)); return s?.email || '' } catch { return '' } })()}
            onComplete={handleSignupComplete}
          />
        )}

        {/* DOWNLOAD APP (after signup, user picks up in-app) */}
        {screen === 'download_app' && (
          <DownloadApp
            userEmail={user?.email}
            essenceArchetype={stage4Results?.primaryArchetype?.name}
            pathActivities={stage6Results?.path}
          />
        )}

        {/* CATEGORY INTRO */}
        {screen === 'category_intro' && (
          <div className="vs-exp-intro">
            <div className="vs-results-card">
              <div className="vs-results-label">Stage 5</div>
              <h2 className="vs-results-title">Your Category</h2>
              <p className="vs-exp-intro-desc">
                You just met yourself. Now let&apos;s find out what you&apos;re here to do.
              </p>
              <p className="vs-exp-intro-desc" style={{ marginTop: 12 }}>
                4 stems. Take your time on these. There&apos;s no wrong answer.
              </p>
            </div>
            <div className="vs-bottom-action">
              <DoubleConfirmButton
                onConfirm={() => beginStage({ stageIndex: 4 })}
                label="Start"
                confirmLabel="Ready? Tap to begin"
              />
            </div>
          </div>
        )}

        {/* CATEGORY REVEAL */}
        {screen === 'category_reveal' && categoryResults && (
          <CategoryReveal
            results={categoryResults}
            onContinue={() => setScreen('nudges')}
          />
        )}

        {/* NUDGE DARES */}
        {screen === 'nudges' && categoryResults && (
          <NudgeCards
            nudges={categoryResults.nudgeSuggestions}
            categoryName={categoryResults.categoryName}
            onContinue={() => setScreen(isOnboarding ? 'experience_intro' : 'final_results')}
          />
        )}

        {/* FINAL RESULTS */}
        {screen === 'final_results' && (
          <FinalResults
            stage1={stage1Results}
            stage2={stage2Results}
            stage3={stage3Results}
            stage4={stage4Results}
            selectedExpression={selectedExpression}
            confirmedPrediction={confirmedPrediction}
            onRestart={handleRestart}
            onCreateAvatar={() => setScreen('avatar')}
          />
        )}

        {/* AVATAR GENERATION */}
        {screen === 'avatar' && (
          <AvatarScreen
            stage4Results={stage4Results}
            onSkip={() => setScreen('category_intro')}
          />
        )}

      </div>
    </div>
  )
}
