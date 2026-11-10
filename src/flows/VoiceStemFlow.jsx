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
import './VoiceStemFlow.css'

const STORAGE_KEY = 'voice_stems_session'
const MAX_STEM_SECONDS = 30
const EXP_BATCH_SIZE = 10
const EXP_RECORD_SECONDS = 30

// Split activities into batches of 10 for recording
const EXP_BATCHES = []
for (let i = 0; i < EXPERIENCE_ACTIVITIES.length; i += EXP_BATCH_SIZE) {
  EXP_BATCHES.push(EXPERIENCE_ACTIVITIES.slice(i, i + EXP_BATCH_SIZE))
}

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
    const { supabase } = await import('../lib/supabaseClient')
    const sessionId = getSessionId()
    const placeholderEmail = `anon-${sessionId.slice(0, 8)}@voice-stems.local`
    await supabase.from('public_leads').upsert({
      id: sessionId,
      email: data.email || placeholderEmail,
      source_flow: 'voice_stems',
      flow_results: { ...data, _sessionId: sessionId },
    }, { onConflict: 'id' })
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

      {hasPaths ? (
        <p className="vs-signup-desc">
          You said you'd love to get paid for <strong>{pathLabels.join(', ')}</strong>.
          Open the app to discover the paths that combine them.
        </p>
      ) : (
        <p className="vs-signup-desc">
          Your results are saved. Open the app to find your path.
        </p>
      )}

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
    // Brief delay so user sees selection before advancing
    setTimeout(() => onSelect(opt), 300)
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

      const primary = stage4Results.primaryArchetype
      const prompt = `Transform this person into a high-quality 3D animated movie character. Use ONLY their face and facial features as reference for likeness. Create a completely new heroic scene around them based on their archetype essence.

Their essence: "${primary.name}" - ${primary.essence}

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

function EssenceReveal({ results, onContinue }) {
  if (!results) return null
  const primary = results.primaryArchetype || {}
  const secondary = results.secondaryArchetype || {}
  const blend = results.essenceBlend || ''
  const reveal = results.mirrorReveal || ''

  return (
    <div className="vs-essence-reveal">
      <div className="vs-essence-reveal-inner">
        <div className="vs-essence-badge">Your Essence</div>
        <h1 className="vs-essence-name">{primary.name || 'Your True Self'}</h1>
        {primary.essence && <p className="vs-essence-tagline">{primary.essence}</p>}
        {secondary.name && (
          <p className="vs-essence-secondary">with shades of <span className="vs-gold-text">{secondary.name}</span></p>
        )}

        <div className="vs-essence-blend-card">
          <p className="vs-essence-blend">{blend}</p>
        </div>

        <div className="vs-essence-mirror-card">
          <p className="vs-essence-mirror">{reveal}</p>
        </div>

        <button className="vs-cta vs-cta-gold" onClick={onContinue}>
          See your full journey
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

  // ── Experience game batch tracking ─────────────────────────────────
  const expBatchRef = useRef(0)
  const paidBatchRef = useRef(0)
  const paidBatchesRef = useRef([]) // computed from stage5Results.fun
  const stage5ResultsRef = useRef(null) // avoids stale closure in processPaidFilter

  // ── Countdown state ────────────────────────────────────────────────
  const [countdownNum, setCountdownNum] = useState(3)
  const countdownRef = useRef(null)

  // ── Recording timer ───────────────────────────────────────────────
  const [stemSeconds, setStemSeconds] = useState(MAX_STEM_SECONDS)
  const stemTimerRef = useRef(null)

  // ── Processing stage label ────────────────────────────────────────
  const [processingStageKey, setProcessingStageKey] = useState(1)

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
  const totalStems = 35 // 6 + 13 + 10 + 6
  const stemsCompleted = (() => {
    if (position.stageIndex === 0) return position.stemIndex
    if (position.stageIndex === 1) {
      const layer1done = 6
      if (position.layerIndex === null || position.layerIndex === 0) return layer1done + position.stemIndex
      return layer1done + 7 + position.stemIndex
    }
    if (position.stageIndex === 2) return 6 + 13 + position.stemIndex
    return 6 + 13 + 10 + position.stemIndex // stageIndex === 3
  })()
  const progressPercent = Math.round((stemsCompleted / totalStems) * 100)

  // ── Progress label ────────────────────────────────────────────────
  const stageLabel = (() => {
    if (position.stageIndex === 0) return `Stage 1 of 4  ·  Stem ${position.stemIndex + 1} of ${currentStems.length}`
    if (position.stageIndex === 1) {
      const layer = position.layerIndex === 0 ? 'Layer 2' : 'Layer 3'
      return `Stage 2 of 4 (${layer})  ·  Stem ${position.stemIndex + 1} of ${currentStems.length}`
    }
    if (position.stageIndex === 2) return `Stage 3 of 4  ·  Stem ${position.stemIndex + 1} of ${currentStems.length}`
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
    }

    // ?skip=N jumps directly to that stage's recording
    if (skipTo) {
      const n = parseInt(skipTo, 10)
      if (n === 5) {
        setTimeout(() => setScreen('experience_intro'), 100)
        return
      }
      if (n === 6) {
        // Need stage 5 results to run paid filter; show intro as fallback
        setTimeout(() => setScreen('experience_intro'), 100)
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
        if (resumeStage === '3' && saved.stage2Results) {
          beginStage({ stageIndex: 2 })
        } else if (resumeStage === '4' && saved.stage3Results) {
          beginStage({ stageIndex: 3 })
        } else if (resumeStage === 'results_2' && saved.stage2Results) {
          setScreen('results_2')
        } else if (resumeStage === 'results_3' && saved.stage3Results) {
          setScreen('results_3')
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

    let count = 3
    countdownRef.current = setInterval(() => {
      count -= 1
      if (count <= 0) {
        clearInterval(countdownRef.current)
        countdownRef.current = null
        currentStemIdRef.current = stemId
        setStemSeconds(MAX_STEM_SECONDS)
        setScreen('stem')
        start()

        // 30-second visible countdown
        let secs = MAX_STEM_SECONDS
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
    setPosition(prev => {
      const nextIndex = prev.stemIndex + 1
      const stems = getStemsForStage(prev.stageIndex, prev.layerIndex, { selectedExpression, confirmedPrediction })

      if (nextIndex < stems.length) {
        // More stems in this group
        const nextStem = stems[nextIndex]
        startCountdownThenRecord(nextStem.id)
        return { ...prev, stemIndex: nextIndex }
      } else {
        // All stems in this group done — go to processing
        triggerProcessing(prev.stageIndex, prev.layerIndex)
        return prev
      }
    })
  }, [selectedExpression, confirmedPrediction, startCountdownThenRecord]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Trigger AI processing for a stage/layer ───────────────────
  const triggerProcessing = useCallback(async (stageIndex, layerIndex) => {
    setScreen('processing')
    setFlowError(null)

    if (stageIndex === 0) setProcessingStageKey(1)
    else if (stageIndex === 1 && layerIndex === 0) setProcessingStageKey('2a')
    else if (stageIndex === 1 && layerIndex === 1) setProcessingStageKey('2b')
    else if (stageIndex === 2) setProcessingStageKey(3)
    else setProcessingStageKey(4)

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
      : 'stage4Transcripts'
    saveSession({ [stageKey]: transcriptsRef.current })

    try {
      if (stageIndex === 0) {
        // Stage 1 — cluster essence themes
        const results = await processStage(1, transcripts, {})
        setStage1Results(results)
        // Save to localStorage
        // Auto-select the energy as the expression (no manual selection needed)
        const energy = results?.energy || 'your essence'
        setSelectedExpression(energy)
        saveSession({ stage1Transcripts: transcriptsRef.current, stage1Results: results, selectedExpression: energy })
        setScreen('results_1')

      } else if (stageIndex === 1 && layerIndex === 0) {
        // Stage 2 layer 2 — extract prediction
        const results = await processStage(2, transcripts, { selectedExpression })
        // Temporarily store partial results for prediction selection
        setStage2Results(results)
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
        setScreen('essence_reveal')
      }
    } catch (err) {
      console.error('processStage error:', err)
      setFlowError('Something went wrong analysing your responses. Tap to retry.')
    }
  }, [selectedExpression, confirmedPrediction, stage1Results, stage2Results, stage3Results]) // eslint-disable-line react-hooks/exhaustive-deps

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
    setPosition({ stageIndex: 0, layerIndex: null, stemIndex: 0 })
    setFlowError(null)
    expBatchRef.current = 0
    paidBatchRef.current = 0
    paidBatchesRef.current = []
    stage5ResultsRef.current = null
    setScreen('landing')
  }

  // ── Selection bridge handler ───────────────────────────────────
  const handleSelection2 = (option) => {
    const label = typeof option === 'string' ? option : option.label || option.text || String(option)
    setConfirmedPrediction(label)
    // Start layer 3
    setTimeout(() => beginStage({ stageIndex: 1, layerIndex: 1 }), 400)
  }

  // ── Error retry ────────────────────────────────────────────────
  const handleRetryProcessing = () => {
    setFlowError(null)
    triggerProcessing(position.stageIndex, position.layerIndex)
  }

  // ── Experience Game (Stage 5) ─────────────────────────────────

  const startExpBatch = useCallback((batchIdx) => {
    expBatchRef.current = batchIdx
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null }
    if (stemTimerRef.current) { clearInterval(stemTimerRef.current); stemTimerRef.current = null }

    setCountdownNum(3)
    setScreen('exp_countdown')

    let count = 3
    countdownRef.current = setInterval(() => {
      count -= 1
      if (count <= 0) {
        clearInterval(countdownRef.current)
        countdownRef.current = null
        currentStemIdRef.current = `exp_batch_${batchIdx}`
        setStemSeconds(EXP_RECORD_SECONDS)
        setScreen('exp_recording')
        start()

        let secs = EXP_RECORD_SECONDS
        stemTimerRef.current = setInterval(() => {
          secs -= 1
          setStemSeconds(secs)
          if (secs <= 0) {
            clearInterval(stemTimerRef.current)
            stemTimerRef.current = null
            handleExpBatchDone()
          }
        }, 1000)
      } else {
        setCountdownNum(count)
      }
    }, 1000)
  }, [start]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleExpBatchDone = useCallback(() => {
    if (stemTimerRef.current) { clearInterval(stemTimerRef.current); stemTimerRef.current = null }
    stop()
    setScreen('exp_transition')

    setTimeout(() => {
      const nextBatch = expBatchRef.current + 1
      if (nextBatch < EXP_BATCHES.length) {
        startExpBatch(nextBatch)
      } else {
        processExperienceGame()
      }
    }, 1000)
  }, [stop]) // eslint-disable-line react-hooks/exhaustive-deps

  const processExperienceGame = useCallback(async () => {
    setScreen('processing')
    setProcessingStageKey(5)
    setFlowError(null)

    const pending = [...pendingTranscriptionsRef.current]
    pendingTranscriptionsRef.current = []
    await Promise.allSettled(pending)

    const transcripts = EXP_BATCHES.map((batch, i) => ({
      stemId: `exp_batch_${i}`,
      stemText: `Round ${i + 1}: ${batch.map(a => a.label).join(', ')}`,
      transcript: transcriptsRef.current[`exp_batch_${i}`] || '',
    }))

    saveSession({ stage5Transcripts: transcripts })

    try {
      const results = await processStage(5, transcripts, { activities: EXPERIENCE_ACTIVITIES })
      setStage5Results(results)
      stage5ResultsRef.current = results
      saveSession({ stage5Results: results })
      setScreen('experience_results')
    } catch (err) {
      console.error('Stage 5 error:', err)
      setFlowError('Something went wrong mapping your experiences. Tap to retry.')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const retryExpProcessing = () => {
    setFlowError(null)
    processExperienceGame()
  }

  // ── Paid Filter (Stage 6) ─────────────────────────────────────

  const startPaidFilter = useCallback(() => {
    const funList = stage5Results?.fun || []
    const batches = []
    for (let i = 0; i < funList.length; i += EXP_BATCH_SIZE) {
      batches.push(funList.slice(i, i + EXP_BATCH_SIZE))
    }
    paidBatchesRef.current = batches
    if (batches.length === 0) {
      // No fun activities, skip to signup gate
      setScreen('signup_gate')
      return
    }
    startPaidBatch(0)
  }, [stage5Results]) // eslint-disable-line react-hooks/exhaustive-deps

  const startPaidBatch = useCallback((batchIdx) => {
    paidBatchRef.current = batchIdx
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null }
    if (stemTimerRef.current) { clearInterval(stemTimerRef.current); stemTimerRef.current = null }

    setCountdownNum(3)
    setScreen('paid_countdown')

    let count = 3
    countdownRef.current = setInterval(() => {
      count -= 1
      if (count <= 0) {
        clearInterval(countdownRef.current)
        countdownRef.current = null
        currentStemIdRef.current = `paid_batch_${batchIdx}`
        setStemSeconds(EXP_RECORD_SECONDS)
        setScreen('paid_recording')
        start()

        let secs = EXP_RECORD_SECONDS
        stemTimerRef.current = setInterval(() => {
          secs -= 1
          setStemSeconds(secs)
          if (secs <= 0) {
            clearInterval(stemTimerRef.current)
            stemTimerRef.current = null
            handlePaidBatchDone()
          }
        }, 1000)
      } else {
        setCountdownNum(count)
      }
    }, 1000)
  }, [start]) // eslint-disable-line react-hooks/exhaustive-deps

  const handlePaidBatchDone = useCallback(() => {
    if (stemTimerRef.current) { clearInterval(stemTimerRef.current); stemTimerRef.current = null }
    stop()
    setScreen('paid_transition')

    setTimeout(() => {
      const nextBatch = paidBatchRef.current + 1
      if (nextBatch < paidBatchesRef.current.length) {
        startPaidBatch(nextBatch)
      } else {
        processPaidFilter()
      }
    }, 1000)
  }, [stop]) // eslint-disable-line react-hooks/exhaustive-deps

  const processPaidFilter = useCallback(async () => {
    setScreen('processing')
    setProcessingStageKey(6)
    setFlowError(null)

    const pending = [...pendingTranscriptionsRef.current]
    pendingTranscriptionsRef.current = []
    await Promise.allSettled(pending)

    const funList = stage5ResultsRef.current?.fun || []
    const transcripts = paidBatchesRef.current.map((batch, i) => ({
      stemId: `paid_batch_${i}`,
      stemText: batch.map(a => a.label).join(', '),
      transcript: transcriptsRef.current[`paid_batch_${i}`] || '',
    }))

    saveSession({ stage6Transcripts: transcripts })

    try {
      const results = await processStage(6, transcripts, { funActivities: funList })
      setStage6Results(results)
      saveSession({ stage6Results: results })
      setScreen('signup_gate')
    } catch (err) {
      console.error('Stage 6 error:', err)
      setFlowError('Something went wrong. Tap to retry.')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const retryPaidProcessing = () => {
    setFlowError(null)
    processPaidFilter()
  }

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
    ;(s6?.passion || []).forEach(a => {
      rows.push({ user_id: authedUser.id, node_id: a.id, ns_state: 'fun', want_paid: false, updated_at: now })
    })
    // Fun activities not in stage 6 results (skipped paid filter or zero batches)
    const s6Ids = new Set([...(s6?.path || []).map(a => a.id), ...(s6?.passion || []).map(a => a.id)])
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
              You&apos;ll complete sentences out loud. Speak fast. Don&apos;t think.
              First thing that comes. 35 stems, 4 stages, about 20 minutes.
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

            {recError && <div className="vs-error-msg">{recError}</div>}

            <button
              className="vs-btn-primary"
              onClick={handleStart}
              disabled={isInApp}
            >
              {permissionGranted ? 'Begin — Speak first, think later' : 'Allow microphone and begin'}
            </button>
          </div>
        )}

        {/* COUNTDOWN */}
        {screen === 'countdown' && currentStem && (
          <div className="vs-stem-screen">
            <ProgressBar label={stageLabel} percent={progressPercent} />
            <CountdownOverlay count={countdownNum} stemText={currentStem.text} />
          </div>
        )}

        {/* STEM (recording active) */}
        {screen === 'stem' && currentStem && (
          <div className="vs-stem-screen">
            <ProgressBar label={stageLabel} percent={progressPercent} />
            <div className="vs-stem-text">{currentStem.text}</div>
            <RecordingZone
              secondsLeft={stemSeconds}
              onDone={handleStemDone}
            />
          </div>
        )}

        {/* TRANSITION (brief "got it") */}
        {screen === 'transition' && (
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
        {screen === 'processing' && flowError && processingStageKey !== 5 && processingStageKey !== 6 && (
          <div className="vs-processing">
            <div className="vs-error-msg" style={{ maxWidth: 360 }}>{flowError}</div>
            <button className="vs-btn-primary" onClick={handleRetryProcessing} style={{ marginTop: 16 }}>
              Retry
            </button>
          </div>
        )}

        {/* PROCESSING ERROR (stage 5) */}
        {screen === 'processing' && flowError && processingStageKey === 5 && (
          <div className="vs-processing">
            <div className="vs-error-msg" style={{ maxWidth: 360 }}>{flowError}</div>
            <button className="vs-btn-primary" onClick={retryExpProcessing} style={{ marginTop: 16 }}>Retry</button>
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
            onContinue={() => setScreen(isOnboarding ? 'experience_intro' : 'avatar')}
          />
        )}

        {/* ── EXPERIENCE GAME (Stage 5) ─────────────────────────── */}

        {/* EXPERIENCE INTRO */}
        {screen === 'experience_intro' && (
          <div className="vs-exp-intro">
            <div className="vs-results-label">Stage 5</div>
            <h2>The Experience Game</h2>
            <p className="vs-exp-intro-desc">
              You will see activities, 10 at a time. For each one, say <strong>&quot;fun&quot;</strong> or <strong>&quot;not fun&quot;</strong>. Go fast. Trust your gut.
            </p>
            <p className="vs-exp-intro-sub">
              {EXPERIENCE_ACTIVITIES.length} activities. {EXP_BATCHES.length} rounds. About 2 minutes.
            </p>
            <DoubleConfirmButton
              onConfirm={() => startExpBatch(0)}
              label="Start the game"
              confirmLabel="Ready? Tap to begin"
            />
          </div>
        )}

        {/* EXP COUNTDOWN */}
        {screen === 'exp_countdown' && (
          <div className="vs-stem-screen">
            <ProgressBar
              label={`Experience Game  ·  Round ${expBatchRef.current + 1} of ${EXP_BATCHES.length}`}
              percent={Math.round((expBatchRef.current / EXP_BATCHES.length) * 100)}
            />
            <div className="vs-exp-batch-list">
              {(EXP_BATCHES[expBatchRef.current] || []).map((a, i) => (
                <div key={a.id} className="vs-exp-batch-item">
                  <span className="vs-exp-batch-num">{i + 1}.</span>
                  <span>{a.label}</span>
                </div>
              ))}
            </div>
            <div className="vs-countdown-overlay vs-countdown-overlay-bottom">
              <div className="vs-countdown-num" key={countdownNum}>{countdownNum}</div>
              <div className="vs-countdown-label">Say &quot;fun&quot; or &quot;not fun&quot; for each...</div>
            </div>
          </div>
        )}

        {/* EXP RECORDING */}
        {screen === 'exp_recording' && (
          <div className="vs-stem-screen">
            <ProgressBar
              label={`Experience Game  ·  Round ${expBatchRef.current + 1} of ${EXP_BATCHES.length}`}
              percent={Math.round(((expBatchRef.current + 0.5) / EXP_BATCHES.length) * 100)}
            />
            <div className="vs-exp-batch-list">
              {(EXP_BATCHES[expBatchRef.current] || []).map((a, i) => (
                <div key={a.id} className="vs-exp-batch-item">
                  <span className="vs-exp-batch-num">{i + 1}.</span>
                  <span>{a.label}</span>
                </div>
              ))}
            </div>
            <RecordingZone secondsLeft={stemSeconds} onDone={handleExpBatchDone} />
          </div>
        )}

        {/* EXP TRANSITION */}
        {screen === 'exp_transition' && (
          <div className="vs-stem-screen">
            <div className="vs-transition">
              <div className="vs-got-it">Got it.</div>
              <div className="vs-transcribing-label">Transcribing...</div>
            </div>
          </div>
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
            <p style={{ fontSize: '0.9rem', color: 'var(--vs-muted)', marginTop: 12 }}>
              Now, for each &quot;fun&quot; activity, we will ask: could you get paid for it?
            </p>
            <DoubleConfirmButton
              onConfirm={startPaidFilter}
              label="Continue to paid filter"
              confirmLabel="Ready? Tap to begin"
            />
          </div>
        )}

        {/* ── PAID FILTER (Stage 6) ──────────────────────────────── */}

        {/* PAID COUNTDOWN */}
        {screen === 'paid_countdown' && (
          <div className="vs-stem-screen">
            <ProgressBar
              label={`Paid Filter  ·  Round ${paidBatchRef.current + 1} of ${paidBatchesRef.current.length}`}
              percent={Math.round((paidBatchRef.current / Math.max(paidBatchesRef.current.length, 1)) * 100)}
            />
            <div className="vs-exp-batch-list">
              {(paidBatchesRef.current[paidBatchRef.current] || []).map((a, i) => (
                <div key={a.id} className="vs-exp-batch-item">
                  <span className="vs-exp-batch-num">{i + 1}.</span>
                  <span>{a.label}</span>
                </div>
              ))}
            </div>
            <div className="vs-countdown-overlay vs-countdown-overlay-bottom">
              <div className="vs-countdown-num" key={countdownNum}>{countdownNum}</div>
              <div className="vs-countdown-label">Say &quot;yes&quot; (could get paid) or &quot;no&quot; (just passion)...</div>
            </div>
          </div>
        )}

        {/* PAID RECORDING */}
        {screen === 'paid_recording' && (
          <div className="vs-stem-screen">
            <ProgressBar
              label={`Paid Filter  ·  Round ${paidBatchRef.current + 1} of ${paidBatchesRef.current.length}`}
              percent={Math.round(((paidBatchRef.current + 0.5) / Math.max(paidBatchesRef.current.length, 1)) * 100)}
            />
            <div className="vs-exp-batch-list">
              {(paidBatchesRef.current[paidBatchRef.current] || []).map((a, i) => (
                <div key={a.id} className="vs-exp-batch-item">
                  <span className="vs-exp-batch-num">{i + 1}.</span>
                  <span>{a.label}</span>
                </div>
              ))}
            </div>
            <RecordingZone secondsLeft={stemSeconds} onDone={handlePaidBatchDone} />
          </div>
        )}

        {/* PAID TRANSITION */}
        {screen === 'paid_transition' && (
          <div className="vs-stem-screen">
            <div className="vs-transition">
              <div className="vs-got-it">Got it.</div>
              <div className="vs-transcribing-label">Transcribing...</div>
            </div>
          </div>
        )}

        {/* PROCESSING ERROR (stage 6) */}
        {screen === 'processing' && flowError && processingStageKey === 6 && (
          <div className="vs-processing">
            <div className="vs-error-msg" style={{ maxWidth: 360 }}>{flowError}</div>
            <button className="vs-btn-primary" onClick={retryPaidProcessing} style={{ marginTop: 16 }}>Retry</button>
          </div>
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
            onSkip={() => setScreen('final_results')}
          />
        )}

      </div>
    </div>
  )
}
