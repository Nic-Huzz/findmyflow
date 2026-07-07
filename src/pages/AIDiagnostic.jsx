/**
 * AIDiagnostic.jsx — /try/ai-diagnostic
 *
 * Public lead magnet. Step-by-step diagnostic that tells you exactly what
 * AI can and can't do for YOUR business, which tools to use, and how much
 * stays manual.
 *
 * Flow: Intro → Business Model → Pain → Drill Down → Preferences → Email → Results
 */
import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { hapticLight, hapticSuccess } from '../lib/haptics'
import {
  BUSINESS_MODELS, PAIN_POINTS, DRILL_DOWN,
  BUDGET_OPTIONS, PLATFORM_OPTIONS, AUTOMATION_OPTIONS,
  CAPABILITIES, buildBrowseLink, getMatchingCapabilities,
} from '../data/aiDiagnosticData'
import './AIDiagnostic.css'

const STEPS = {
  INTRO: 'intro',
  BUSINESS: 'business',
  PAIN: 'pain',
  DRILL: 'drill',
  PREFS: 'prefs',
  EMAIL: 'email',
  RESULTS: 'results',
}

const STEP_ORDER = [STEPS.INTRO, STEPS.BUSINESS, STEPS.PAIN, STEPS.DRILL, STEPS.PREFS, STEPS.EMAIL, STEPS.RESULTS]

export default function AIDiagnostic() {
  const [step, setStepRaw] = useState(STEPS.INTRO)
  const setStep = (next) => { setStepRaw(next); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  // User selections
  const [businessModel, setBusinessModel] = useState(null)
  const [pain, setPain] = useState(null)
  const [drillSelections, setDrillSelections] = useState([])
  const [budget, setBudget] = useState('under200')
  const [platform, setPlatform] = useState('desktop')
  const [automation, setAutomation] = useState('all')

  // Email
  const [email, setEmail] = useState('')
  const [emailSaving, setEmailSaving] = useState(false)
  const [emailError, setEmailError] = useState(null)

  // Results
  const [results, setResults] = useState([])

  const stepIndex = STEP_ORDER.indexOf(step)

  function goBack() {
    const prev = STEP_ORDER[stepIndex - 1]
    if (prev) setStep(prev)
  }

  function toggleDrill(key) {
    hapticLight()
    setDrillSelections(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
  }

  function generateResults() {
    const caps = getMatchingCapabilities(drillSelections, automation)
    // Sort: highest automation level first, then alphabetical
    caps.sort((a, b) => b.level - a.level || a.title.localeCompare(b.title))
    setResults(caps)
  }

  async function handleEmailSubmit() {
    if (!email || !email.includes('@')) {
      setEmailError('Please enter a valid email')
      return
    }
    setEmailSaving(true)
    setEmailError(null)

    try {
      const { error } = await supabase.from('lead_captures').insert({
        email,
        source: 'ai-diagnostic',
        metadata: {
          business_model: businessModel,
          pain: pain,
          drill_selections: drillSelections,
          budget,
          platform,
          automation,
          capabilities_count: results.length,
        },
      })
      if (error) {
        console.warn('Lead capture failed:', error.message)
        // Still show results even if capture fails — don't block the user
      }
      hapticSuccess()
      setStep(STEPS.RESULTS)
    } catch (err) {
      // Network error — still show results
      console.warn('Lead capture error:', err)
      hapticSuccess()
      setStep(STEPS.RESULTS)
    } finally {
      setEmailSaving(false)
    }
  }

  function getScoreSummary() {
    const green = results.filter(c => c.level >= 4).length
    const yellow = results.filter(c => c.level >= 2 && c.level < 4).length
    const setup = results.filter(c => c.level === 1).length
    const red = results.filter(c => c.level === 0).length
    return { green, yellow, setup, red, total: results.length }
  }

  function getTopActions() {
    // Pick top 3 highest-impact, highest-automation capabilities
    return results
      .filter(c => c.level >= 4)
      .slice(0, 3)
  }

  // ═══════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════

  return (
    <div className="ai-diag">
      <div className="diag-container">

        {/* Progress bar */}
        {step !== STEPS.INTRO && (
          <div className="diag-progress">
            {STEP_ORDER.slice(1).map((s, i) => (
              <div
                key={s}
                className={`diag-progress-step ${stepIndex > i + 1 ? 'done' : ''} ${stepIndex === i + 1 ? 'active' : ''}`}
              />
            ))}
          </div>
        )}

        {/* Back button */}
        {step !== STEPS.INTRO && step !== STEPS.RESULTS && (
          <button className="back-btn" onClick={goBack}>&larr; Back</button>
        )}

        {/* ── INTRO ── */}
        {step === STEPS.INTRO && (
          <>
            <div className="diag-header">
              <h1>What can AI actually do for your business?</h1>
              <p>
                Not a list of 10,000 tools. Not a maturity score.
                Just honest answers about what's possible, what it costs,
                and what you still do yourself.
              </p>
            </div>

            <div className="intro-features">
              <div className="intro-feature">
                <div className="feat-icon">{'\u{1F3AF}'}</div>
                <div className="feat-text">
                  <h3>Personalised to your business</h3>
                  <p>Tell us what you do and where you're stuck. Get answers specific to you.</p>
                </div>
              </div>
              <div className="intro-feature">
                <div className="feat-icon">{'\u{1F6E0}\uFE0F'}</div>
                <div className="feat-text">
                  <h3>Specific tools, not vague advice</h3>
                  <p>For each capability, see the exact tool, what it costs, and how long to set up.</p>
                </div>
              </div>
              <div className="intro-feature">
                <div className="feat-icon">{'\u2705'}</div>
                <div className="feat-text">
                  <h3>Honest about what AI can't do</h3>
                  <p>We tell you when something needs a human. No hype, no overselling.</p>
                </div>
              </div>
              <div className="intro-feature">
                <div className="feat-icon">{'\u{1F4CA}'}</div>
                <div className="feat-text">
                  <h3>Your AI Possibility Score</h3>
                  <p>See how much of your work can be automated, assisted, or stays manual.</p>
                </div>
              </div>
            </div>

            <div className="fixed-bottom">
              <button className="cta-button primary" onClick={() => setStep(STEPS.BUSINESS)}>
                Start the diagnostic (2 min)
              </button>
            </div>
          </>
        )}

        {/* ── BUSINESS MODEL ── */}
        {step === STEPS.BUSINESS && (
          <>
            <p className="step-label">Step 1 of 4</p>
            <h2 className="step-question">What do you do?</h2>
            <div className="option-grid">
              {BUSINESS_MODELS.map(m => (
                <div
                  key={m.key}
                  className={`option-card ${businessModel === m.key ? 'selected' : ''}`}
                  onClick={() => {
                    hapticLight()
                    setBusinessModel(m.key)
                  }}
                >
                  <div className="option-icon">{m.icon}</div>
                  <div className="option-text">
                    <h3>{m.label}</h3>
                    <p>{m.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="fixed-bottom">
              <button
                className="cta-button primary"
                disabled={!businessModel}
                onClick={() => setStep(STEPS.PAIN)}
              >
                Next
              </button>
            </div>
          </>
        )}

        {/* ── PAIN POINT ── */}
        {step === STEPS.PAIN && (
          <>
            <p className="step-label">Step 2 of 4</p>
            <h2 className="step-question">What's the one thing that, if solved, would change everything?</h2>
            <div className="option-grid">
              {PAIN_POINTS.map(p => (
                <div
                  key={p.key}
                  className={`option-card ${pain === p.key ? 'selected' : ''}`}
                  onClick={() => {
                    hapticLight()
                    setPain(p.key)
                    setDrillSelections([]) // reset drill when pain changes
                  }}
                >
                  <div className="option-text">
                    <h3>{p.label}</h3>
                    <p>"{p.quote}"</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="fixed-bottom">
              <button
                className="cta-button primary"
                disabled={!pain}
                onClick={() => setStep(STEPS.DRILL)}
              >
                Next
              </button>
            </div>
          </>
        )}

        {/* ── DRILL DOWN ── */}
        {step === STEPS.DRILL && pain && (
          <>
            <p className="step-label">Step 3 of 4</p>
            <h2 className="step-question">Which of these apply to you?</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: -16, marginBottom: 20 }}>
              Select all that apply. More selections = more detailed report.
            </p>
            <div className="option-grid">
              {DRILL_DOWN[pain]?.map(d => (
                <div
                  key={d.key}
                  className={`checkbox-card ${drillSelections.includes(d.key) ? 'checked' : ''}`}
                  onClick={() => toggleDrill(d.key)}
                >
                  <div className="checkbox-indicator">
                    {drillSelections.includes(d.key) ? '\u2713' : ''}
                  </div>
                  <span className="checkbox-label">{d.label}</span>
                </div>
              ))}
            </div>
            <div className="fixed-bottom">
              <button
                className="cta-button primary"
                disabled={drillSelections.length === 0}
                onClick={() => setStep(STEPS.PREFS)}
              >
                Next ({drillSelections.length} selected)
              </button>
            </div>
          </>
        )}

        {/* ── PREFERENCES ── */}
        {step === STEPS.PREFS && (
          <>
            <p className="step-label">Step 4 of 4</p>
            <h2 className="step-question">A few preferences to filter your results</h2>

            <div className="pref-section">
              <h3>What's your budget for tools?</h3>
              <div className="chip-grid">
                {BUDGET_OPTIONS.map(b => (
                  <div
                    key={b.key}
                    className={`chip ${budget === b.key ? 'selected' : ''}`}
                    onClick={() => { hapticLight(); setBudget(b.key) }}
                  >
                    {b.label}
                  </div>
                ))}
              </div>
            </div>

            <div className="pref-section">
              <h3>Where do you work?</h3>
              <div className="chip-grid">
                {PLATFORM_OPTIONS.map(p => (
                  <div
                    key={p.key}
                    className={`chip ${platform === p.key ? 'selected' : ''}`}
                    onClick={() => { hapticLight(); setPlatform(p.key) }}
                  >
                    {p.label}
                  </div>
                ))}
              </div>
            </div>

            <div className="pref-section">
              <h3>How much do you want AI to handle?</h3>
              <div className="chip-grid">
                {AUTOMATION_OPTIONS.map(a => (
                  <div
                    key={a.key}
                    className={`chip ${automation === a.key ? 'selected' : ''}`}
                    onClick={() => { hapticLight(); setAutomation(a.key) }}
                  >
                    {a.label}
                  </div>
                ))}
              </div>
            </div>

            <div className="fixed-bottom">
              <button
                className="cta-button primary"
                onClick={() => {
                  generateResults()
                  setStep(STEPS.EMAIL)
                }}
              >
                See my results
              </button>
            </div>
          </>
        )}

        {/* ── EMAIL GATE ── */}
        {step === STEPS.EMAIL && (
          <div className="email-section">
            <h2>Your report is ready</h2>
            <p>
              We found <strong>{results.length} capabilities</strong> AI can help with
              based on your answers. Enter your email to see the full report
              with specific tools, pricing, and setup guides.
            </p>

            {/* Preview score */}
            {(() => {
              const s = getScoreSummary()
              return (
                <div className="score-summary" style={{ marginBottom: 24, textAlign: 'left' }}>
                  <h2 style={{ textAlign: 'center' }}>Your AI Possibility Score</h2>
                  {s.green > 0 && (
                    <div className="score-row">
                      <span className="score-icon">{'\u{1F7E2}'}</span>
                      <span className="score-label">Can be fully automated</span>
                      <span className="score-count">{s.green}</span>
                    </div>
                  )}
                  {s.yellow > 0 && (
                    <div className="score-row">
                      <span className="score-icon">{'\u{1F7E1}'}</span>
                      <span className="score-label">AI assists, you execute</span>
                      <span className="score-count">{s.yellow}</span>
                    </div>
                  )}
                  {s.setup > 0 && (
                    <div className="score-row">
                      <span className="score-icon">{'\u2699\uFE0F'}</span>
                      <span className="score-label">One-time setup</span>
                      <span className="score-count">{s.setup}</span>
                    </div>
                  )}
                  {s.red > 0 && (
                    <div className="score-row">
                      <span className="score-icon">{'\u{1F534}'}</span>
                      <span className="score-label">Human only</span>
                      <span className="score-count">{s.red}</span>
                    </div>
                  )}
                </div>
              )
            })()}

            <input
              className="email-input"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleEmailSubmit()}
            />
            {emailError && <p className="email-error">{emailError}</p>}

            <div className="fixed-bottom">
              <button
                className="cta-button primary"
                disabled={emailSaving}
                onClick={handleEmailSubmit}
              >
                {emailSaving ? 'Loading...' : 'Get my full report'}
              </button>
              <button
                className="cta-button secondary"
                onClick={() => setStep(STEPS.RESULTS)}
              >
                Skip, just show me
              </button>
            </div>
          </div>
        )}

        {/* ── RESULTS ── */}
        {step === STEPS.RESULTS && (
          <>
            <div className="diag-header">
              <h1>Your AI Possibility Report</h1>
              <p>
                {BUSINESS_MODELS.find(m => m.key === businessModel)?.label} ·{' '}
                {PAIN_POINTS.find(p => p.key === pain)?.label}
              </p>
            </div>

            {/* Score summary */}
            {(() => {
              const s = getScoreSummary()
              return (
                <div className="score-summary">
                  <h2>Your AI Possibility Score</h2>
                  {s.green > 0 && (
                    <div className="score-row">
                      <span className="score-icon">{'\u{1F7E2}'}</span>
                      <span className="score-label">Fully automated (AI runs it, you review)</span>
                      <span className="score-count">{s.green}</span>
                    </div>
                  )}
                  {s.yellow > 0 && (
                    <div className="score-row">
                      <span className="score-icon">{'\u{1F7E1}'}</span>
                      <span className="score-label">AI assists, you execute</span>
                      <span className="score-count">{s.yellow}</span>
                    </div>
                  )}
                  {s.setup > 0 && (
                    <div className="score-row">
                      <span className="score-icon">{'\u2699\uFE0F'}</span>
                      <span className="score-label">One-time setup</span>
                      <span className="score-count">{s.setup}</span>
                    </div>
                  )}
                  {s.red > 0 && (
                    <div className="score-row">
                      <span className="score-icon">{'\u{1F534}'}</span>
                      <span className="score-label">Human only (no AI shortcut)</span>
                      <span className="score-count">{s.red}</span>
                    </div>
                  )}
                </div>
              )
            })()}

            {/* Top 3 actions */}
            {getTopActions().length > 0 && (
              <>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 16px' }}>Your next 3 moves</h2>
                {getTopActions().map((cap, i) => (
                  <div key={cap.id} className="action-card">
                    <div className="action-number">#{i + 1}</div>
                    <div className="action-title">{cap.title}</div>
                    <div className="action-meta">
                      <span>{cap.bestTool}</span>
                      <span>{cap.setup} setup</span>
                      <span>{cap.cost}</span>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* All capability cards */}
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: '32px 0 16px' }}>
              Full report ({results.length} capabilities)
            </h2>
            {results.length === 0 && (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'rgba(255,255,255,0.5)' }}>
                <p>No capabilities matched your current filters.</p>
                <button className="cta-button secondary" onClick={() => { setAutomation('all'); generateResults(); }}>
                  Show all automation levels
                </button>
              </div>
            )}
            <div className="cap-cards">
              {results.map(cap => {
                const browseUrl = buildBrowseLink(cap.taaftSlug, budget, platform)
                return (
                  <div key={cap.id} className="cap-card">
                    <div className="cap-card-header">
                      <span className={`cap-level-badge ${cap.levelIcon}`}>
                        {cap.levelLabel}
                      </span>
                      <span className="cap-card-title">{cap.title}</span>
                    </div>
                    <div className="cap-card-body">
                      <span className="cap-label">Can AI do this?</span>
                      <span className="cap-value">{cap.canAI}</span>

                      <span className="cap-label">Best tool</span>
                      <span className="cap-value">{cap.bestTool}</span>

                      <span className="cap-label">Alternatives</span>
                      <span className="cap-value">{cap.altTools}</span>

                      <span className="cap-label">What you still do</span>
                      <span className="cap-value">{cap.youDo}</span>

                      <span className="cap-label">Setup time</span>
                      <span className="cap-value">{cap.setup}</span>

                      <span className="cap-label">Monthly cost</span>
                      <span className="cap-value">{cap.cost}</span>
                    </div>
                    {browseUrl && (
                      <a
                        className="browse-link"
                        href={browseUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Browse more AI tools for this &rarr;
                      </a>
                    )}
                  </div>
                )
              })}
            </div>

            {/* CTA at bottom */}
            <div style={{ textAlign: 'center', marginTop: 40 }}>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginBottom: 16 }}>
                Want help setting any of these up?
              </p>
              <a
                href="https://create.nichuzz.com"
                className="cta-button primary"
                style={{ display: 'inline-block', textDecoration: 'none', padding: '14px 32px', borderRadius: 14, background: 'linear-gradient(135deg, #5e17eb, #7c3aed)', color: '#fff', fontWeight: 700 }}
              >
                Try the Creator Portal
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
