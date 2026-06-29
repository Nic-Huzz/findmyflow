/**
 * FacilitatorScore.jsx — /try/facilitator-score
 * Public lead magnet: "Facilitator Capacity Score"
 *
 * 5-screen flow: Intro → Gate (Body + Culture) → Identity + Access → Email Capture → Results
 * No auth required. Email captured to lead_captures table.
 */
import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { hapticLight, hapticSuccess } from '../lib/haptics'
import '../flows/ScaleDiagnosticFlow.css'

const STEPS = {
  INTRO: 'intro',
  GATE: 'gate',
  DIAGNOSE: 'diagnose',
  EMAIL: 'email',
  RESULTS: 'results',
}

const QUADRANT_NAMES = {
  body: 'Body',
  culture: 'Culture',
  identity: 'Identity',
  access: 'Access',
}

const RECOMMENDATIONS = {
  body: 'Add a body-based element. Even 5 minutes of breathwork, movement, or sensory experience transforms your product from informational to somatic.',
  identity: 'Create identity language. What do your people call themselves? Give them a word that separates "before" and "after".',
  culture: 'Build the content and community that normalises this practice. 10 pieces of content showing real people doing it. A community where it\'s the default, not the exception.',
  access: 'Reduce friction. Free tier. No equipment. 5-minute entry point. The first experience should cost nothing and require nothing.',
}

const BODY_OPTIONS = [
  { value: 1, label: 'Not at all. It\'s purely informational' },
  { value: 2, label: 'Slightly. Some relaxation or energy' },
  { value: 3, label: 'Moderately. Noticeable physical shift' },
  { value: 4, label: 'Strongly. Real physiological change' },
  { value: 5, label: 'Intensely. They feel it in their bones' },
]

const CULTURE_OPTIONS = [
  { value: 1, label: 'No. They\'d feel weird admitting it' },
  { value: 2, label: 'Maybe. If asked directly' },
  { value: 3, label: 'Probably. It might come up' },
  { value: 4, label: 'Yes. They\'d mention it casually' },
  { value: 5, label: 'Absolutely. They can\'t shut up about it' },
]

const IDENTITY_OPTIONS = [
  { value: 1, label: 'No. It\'s just a transaction' },
  { value: 2, label: 'Slightly. They might think about it' },
  { value: 3, label: 'Somewhat. It becomes part of their story' },
  { value: 4, label: 'Yes. It shifts how they see themselves' },
  { value: 5, label: 'Completely. It becomes central to their identity' },
]

const ACCESS_OPTIONS = [
  { value: 1, label: 'No. Requires training, equipment, and money' },
  { value: 2, label: 'Difficult. Significant barriers to entry' },
  { value: 3, label: 'Moderate. Some setup needed' },
  { value: 4, label: 'Easy. Minimal friction' },
  { value: 5, label: 'Instant. Download, show up, or just begin' },
]

export default function FacilitatorScore() {
  const [step, setStepRaw] = useState(STEPS.INTRO)

  const setStep = (next) => {
    setStepRaw(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Scores
  const [scoreBody, setScoreBody] = useState(0)
  const [scoreCulture, setScoreCulture] = useState(0)
  const [scoreIdentity, setScoreIdentity] = useState(0)
  const [scoreAccess, setScoreAccess] = useState(0)

  // Email capture
  const [email, setEmail] = useState('')
  const [emailSaving, setEmailSaving] = useState(false)
  const [emailError, setEmailError] = useState(null)

  // Share feedback
  const [copied, setCopied] = useState(false)

  // Computed
  const totalScore = Math.round((scoreBody * scoreCulture * scoreIdentity * scoreAccess) / 625 * 100)

  const getScoreColor = (score) => {
    if (score >= 75) return '#34d399'
    if (score >= 50) return '#fbbf24'
    return '#f87171'
  }

  const getVerdict = (score) => {
    if (score >= 75) return 'Your experience has scale conditions'
    if (score >= 50) return 'You have a growth ceiling'
    return 'Your experience has a structural gap'
  }

  const getWeakest = () => {
    const scores = [
      { key: 'body', score: scoreBody },
      { key: 'identity', score: scoreIdentity },
      { key: 'culture', score: scoreCulture },
      { key: 'access', score: scoreAccess },
    ]
    return scores.reduce((min, s) => s.score < min.score ? s : min, scores[0])
  }

  const getBarColor = (score) => {
    if (score >= 4) return 'sdf-bar-green'
    if (score >= 3) return 'sdf-bar-amber'
    return 'sdf-bar-red'
  }

  // Email submit
  const handleEmailSubmit = async () => {
    if (!email || !email.includes('@')) {
      setEmailError('Please enter a valid email address.')
      return
    }

    setEmailSaving(true)
    setEmailError(null)

    try {
      const { error } = await supabase.from('lead_captures').insert({
        email,
        source: 'facilitator-score',
        scores: {
          body: scoreBody,
          culture: scoreCulture,
          identity: scoreIdentity,
          access: scoreAccess,
          total: totalScore,
        },
      })

      if (error) {
        console.warn('Lead capture save failed:', error.message)
        // Don't block — show results anyway
      }
    } catch (err) {
      console.warn('Lead capture error:', err.message)
    }

    setEmailSaving(false)
    hapticSuccess()
    setStep(STEPS.RESULTS)
  }

  const handleSkipEmail = () => {
    setStep(STEPS.RESULTS)
  }

  // Share
  const handleShare = async () => {
    const url = `${window.location.origin}/try/facilitator-score`
    const text = `My Facilitator Capacity Score: ${totalScore}/100. Body: ${scoreBody}/5, Culture: ${scoreCulture}/5, Identity: ${scoreIdentity}/5, Access: ${scoreAccess}/5. Take yours at ${url}`

    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      hapticSuccess()
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      hapticSuccess()
      setTimeout(() => setCopied(false), 2500)
    }
  }

  // ── SCREEN 1: INTRO ──
  if (step === STEPS.INTRO) {
    return (
      <div className="sdf">
        <div className="sdf-container sdf-screen">
          <div className="sdf-intro">
            <div className="sdf-intro-content">
              <div className="sdf-badge">Lead Magnet</div>

              <h1>Facilitator <span className="sdf-gold">Capacity</span> Score</h1>
              <p>Can your experience scale? 4 questions. 2 minutes.</p>
            </div>

            <button className="sdf-cta" onClick={() => { hapticLight(); setStep(STEPS.GATE) }}>
              Score my experience
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── SCREEN 2: THE GATE (Body + Culture) ──
  if (step === STEPS.GATE) {
    const bothSelected = scoreBody > 0 && scoreCulture > 0

    return (
      <div className="sdf">
        <div className="sdf-container sdf-screen">
          <div className="sdf-step-badge">1 of 2</div>
          <h2 className="sdf-heading">The two conditions for <span className="sdf-gold">scale</span></h2>

          {/* Question A: Body */}
          <div className="sdf-question-section">
            <div className="sdf-question-label">Does your experience directly change how someone's body FEELS?</div>
            <div className="sdf-option-list">
              {BODY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  className={`sdf-option-btn ${scoreBody === opt.value ? 'sdf-option-selected' : ''}`}
                  onClick={() => { hapticLight(); setScoreBody(opt.value) }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Question B: Culture */}
          <div className="sdf-question-section">
            <div className="sdf-question-label">Would someone who does this tell their friends unprompted?</div>
            <div className="sdf-option-list">
              {CULTURE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  className={`sdf-option-btn ${scoreCulture === opt.value ? 'sdf-option-selected' : ''}`}
                  onClick={() => { hapticLight(); setScoreCulture(opt.value) }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Gate status */}
          {bothSelected && (
            <div className={`sdf-gate-status ${scoreBody >= 4 && scoreCulture >= 4 ? 'sdf-gate-passed' : 'sdf-gate-blocked'}`}>
              {scoreBody >= 4 && scoreCulture >= 4
                ? 'Scale conditions met \u2713'
                : 'Growth ceiling detected'
              }
            </div>
          )}

          <div className="sdf-nav">
            <button className="sdf-back" onClick={() => setStep(STEPS.INTRO)}>Back</button>
            <button
              className="sdf-cta"
              disabled={!bothSelected}
              onClick={() => { hapticLight(); setStep(STEPS.DIAGNOSE) }}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── SCREEN 3: IDENTITY + ACCESS (combined) ──
  if (step === STEPS.DIAGNOSE) {
    const bothSelected = scoreIdentity > 0 && scoreAccess > 0

    return (
      <div className="sdf">
        <div className="sdf-container sdf-screen">
          <div className="sdf-step-badge">2 of 2</div>

          {/* Identity */}
          <div className="sdf-question-section">
            <div className="sdf-question-label">Would someone describe themselves <span className="sdf-gold">differently</span> after doing this regularly?</div>
            <div className="sdf-option-list">
              {IDENTITY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  className={`sdf-option-btn ${scoreIdentity === opt.value ? 'sdf-option-selected' : ''}`}
                  onClick={() => { hapticLight(); setScoreIdentity(opt.value) }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Access */}
          <div className="sdf-question-section">
            <div className="sdf-question-label">Could someone start <span className="sdf-gold">today</span> with zero preparation, equipment, or expertise?</div>
            <div className="sdf-option-list">
              {ACCESS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  className={`sdf-option-btn ${scoreAccess === opt.value ? 'sdf-option-selected' : ''}`}
                  onClick={() => { hapticLight(); setScoreAccess(opt.value) }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="sdf-nav">
            <button className="sdf-back" onClick={() => setStep(STEPS.GATE)}>Back</button>
            <button
              className="sdf-cta"
              disabled={!bothSelected}
              onClick={() => { hapticLight(); setStep(STEPS.EMAIL) }}
            >
              See my score
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── SCREEN 4: EMAIL CAPTURE ──
  if (step === STEPS.EMAIL) {
    return (
      <div className="sdf">
        <div className="sdf-container sdf-screen">
          <div className="sdf-intro">
            <div className="sdf-intro-content">
              <div className="sdf-badge">Almost there</div>

              <h1>Where should we send your <span className="sdf-gold">full report</span>?</h1>

              <div style={{ width: '100%', maxWidth: 380, marginTop: '0.5rem' }}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailError(null) }}
                  placeholder="your@email.com"
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '0.9rem 1.1rem',
                    background: 'rgba(255,255,255,0.08)',
                    border: `2px solid ${emailError ? '#f87171' : 'rgba(255,255,255,0.2)'}`,
                    borderRadius: 14,
                    color: 'white',
                    fontSize: '1rem',
                    fontFamily: 'inherit',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => { if (!emailError) e.target.style.borderColor = '#E9A23B' }}
                  onBlur={(e) => { if (!emailError) e.target.style.borderColor = 'rgba(255,255,255,0.2)' }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleEmailSubmit() }}
                />

                {emailError && (
                  <div className="sdf-error" style={{ marginTop: '0.5rem' }}>{emailError}</div>
                )}

                <p style={{
                  fontSize: '0.78rem',
                  color: 'rgba(255,255,255,0.4)',
                  lineHeight: 1.5,
                  marginTop: '0.75rem',
                  textAlign: 'center',
                }}>
                  We'll send your detailed breakdown + one recommendation to fix your biggest gap.
                </p>
              </div>
            </div>

            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button
                className="sdf-cta"
                style={{ width: '100%' }}
                disabled={emailSaving}
                onClick={handleEmailSubmit}
              >
                {emailSaving ? 'Sending...' : 'Get my score'}
              </button>

              <button
                className="sdf-back"
                style={{ width: '100%', textAlign: 'center' }}
                onClick={handleSkipEmail}
              >
                Skip, just show me
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── SCREEN 5: RESULTS ──
  if (step === STEPS.RESULTS) {
    const weakest = getWeakest()

    const scoreItems = [
      { key: 'body', label: 'Body', score: scoreBody },
      { key: 'culture', label: 'Culture', score: scoreCulture },
      { key: 'identity', label: 'Identity', score: scoreIdentity },
      { key: 'access', label: 'Access', score: scoreAccess },
    ]

    return (
      <div className="sdf">
        <div className="sdf-container sdf-screen">

          {/* Big score number */}
          <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
            <div className="sdf-badge">Facilitator Capacity Score</div>

            <div style={{
              fontSize: '4.5rem',
              fontWeight: 900,
              lineHeight: 1,
              color: getScoreColor(totalScore),
              marginBottom: '0.25rem',
            }}>
              {totalScore}
            </div>

            <div style={{
              fontSize: '1rem',
              color: 'rgba(255,255,255,0.5)',
              fontWeight: 600,
              marginBottom: '0.75rem',
            }}>
              out of 100
            </div>

            <div style={{
              fontSize: '1.15rem',
              fontWeight: 800,
              lineHeight: 1.3,
              marginBottom: '1.25rem',
              color: getScoreColor(totalScore),
            }}>
              {getVerdict(totalScore)}
            </div>
          </div>

          {/* Score bars */}
          <div className="sdf-results-section">
            {scoreItems.map(item => (
              <div
                key={item.key}
                className={`sdf-score-bar ${item.key === weakest.key ? 'sdf-score-bar-weakest' : ''}`}
              >
                <div className="sdf-score-bar-header">
                  <span className="sdf-score-bar-label">{item.label}</span>
                  <span className="sdf-score-bar-value">{item.score}/5</span>
                </div>
                <div className="sdf-score-bar-track">
                  <div
                    className={`sdf-score-bar-fill ${getBarColor(item.score)}`}
                    style={{ width: `${(item.score / 5) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Weakest quadrant recommendation */}
          <div className="sdf-accelerator-card">
            <div className="sdf-accelerator-label">Your biggest gap: {QUADRANT_NAMES[weakest.key]}</div>
            <p className="sdf-accelerator-text">{RECOMMENDATIONS[weakest.key]}</p>
          </div>

          {/* CTAs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '1.25rem' }}>
            <a
              href="/create"
              className="sdf-cta"
              style={{
                display: 'block',
                textAlign: 'center',
                textDecoration: 'none',
                width: '100%',
                boxSizing: 'border-box',
              }}
            >
              Book a Capacity Call — $200
            </a>

            <button
              className="sdf-cta"
              onClick={handleShare}
              style={{
                background: 'rgba(255,255,255,0.08)',
                color: 'white',
                boxShadow: 'none',
                border: '2px solid rgba(255,255,255,0.2)',
                width: '100%',
              }}
            >
              {copied ? 'Copied!' : 'Share my score'}
            </button>

            <a
              href="/log-in"
              style={{
                display: 'block',
                textAlign: 'center',
                fontSize: '0.82rem',
                color: 'rgba(255,255,255,0.45)',
                textDecoration: 'underline',
                marginTop: '0.25rem',
              }}
            >
              Create a free account to save your results
            </a>
          </div>

        </div>
      </div>
    )
  }

  return null
}
