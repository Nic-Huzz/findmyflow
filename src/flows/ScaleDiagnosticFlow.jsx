/**
 * ScaleDiagnosticFlow.jsx — /create/scale-diagnostic
 * "Phase 3: Can your rule break scale?"
 *
 * 6-screen diagnostic: Intro → Gate (Body + Culture) → Identity → Access → Results → Save
 * Tests whether an experience creator's rule break has the conditions for scale.
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabaseClient'
import { hapticLight, hapticSuccess } from '../lib/haptics'
import './ScaleDiagnosticFlow.css'

const STEPS = {
  INTRO: 'intro',
  GATE: 'gate',
  IDENTITY: 'identity',
  ACCESS: 'access',
  RESULTS: 'results',
  SAVE: 'save',
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

export default function ScaleDiagnosticFlow() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStepRaw] = useState(STEPS.INTRO)

  const setStep = (next) => {
    setStepRaw(next)
    setError(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Scores
  const [scoreBody, setScoreBody] = useState(0)
  const [scoreCulture, setScoreCulture] = useState(0)
  const [scoreIdentity, setScoreIdentity] = useState(0)
  const [scoreAccess, setScoreAccess] = useState(0)

  // Context from RemarkableFlow
  const [projectName, setProjectName] = useState('')
  const [ruleBreak, setRuleBreak] = useState('')

  // State
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [existingRecord, setExistingRecord] = useState(null)

  // Fetch existing data
  useEffect(() => {
    if (!user) { setLoading(false); return }
    ;(async () => {
      try {
        const [
          { data: angleData },
          { data: diagData },
        ] = await Promise.all([
          supabase
            .from('remarkable_angles')
            .select('project_name, ai_rule_statement')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1),
          supabase
            .from('scale_diagnostics')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1),
        ])

        // Pull context from RemarkableFlow
        const angle = angleData?.[0]
        if (angle) {
          if (angle.project_name) setProjectName(angle.project_name)
          if (angle.ai_rule_statement) setRuleBreak(angle.ai_rule_statement)
        }

        // Pre-fill for returning users
        const existing = diagData?.[0]
        if (existing) {
          setExistingRecord(existing)
          if (existing.score_body) setScoreBody(existing.score_body)
          if (existing.score_culture) setScoreCulture(existing.score_culture)
          if (existing.score_identity) setScoreIdentity(existing.score_identity)
          if (existing.score_access) setScoreAccess(existing.score_access)
          // Also pull project_name from diagnostic if it has one
          if (existing.project_name && !angle?.project_name) setProjectName(existing.project_name)
        }
      } catch (err) {
        console.warn('ScaleDiagnosticFlow data load failed:', err.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [user])

  // Auto-save on step change
  useEffect(() => {
    if (step !== STEPS.INTRO && step !== STEPS.RESULTS && step !== STEPS.SAVE && user) {
      autoSave()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  const gatePassed = scoreBody >= 4 && scoreCulture >= 4

  const autoSave = () => {
    if (!user) return
    const fields = {
      score_body: scoreBody || null,
      score_culture: scoreCulture || null,
      score_identity: scoreIdentity || null,
      score_access: scoreAccess || null,
      gate_passed: scoreBody >= 4 && scoreCulture >= 4,
      project_name: projectName || null,
    }

    if (existingRecord?.id) {
      supabase.from('scale_diagnostics').update(fields).eq('id', existingRecord.id)
        .then(({ error: err }) => { if (err) console.error('Auto-save update failed:', err.message) })
    } else {
      supabase.from('scale_diagnostics').insert({ ...fields, user_id: user.id }).select('id').single()
        .then(({ data: row, error: err }) => {
          if (err) console.error('Auto-save insert failed:', err.message)
          else if (row?.id) setExistingRecord(row)
        })
    }
  }

  // Final save
  const save = async () => {
    if (!user || saving) return
    setSaving(true)
    try {
      const fields = {
        score_body: scoreBody,
        score_culture: scoreCulture,
        score_identity: scoreIdentity,
        score_access: scoreAccess,
        gate_passed: gatePassed,
        project_name: projectName || null,
      }

      if (existingRecord?.id) {
        const { error: updateErr } = await supabase.from('scale_diagnostics').update(fields).eq('id', existingRecord.id)
        if (updateErr) throw updateErr
      } else {
        const { data: row, error: insertErr } = await supabase.from('scale_diagnostics').insert({ ...fields, user_id: user.id }).select('id').single()
        if (insertErr) throw insertErr
        if (row?.id) setExistingRecord(row)
      }

      hapticSuccess()
      navigate('/create')
    } catch (err) {
      console.error('Save error:', err)
      setError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // Helper: find weakest quadrant
  const getWeakest = () => {
    const scores = [
      { key: 'body', score: scoreBody },
      { key: 'identity', score: scoreIdentity },
      { key: 'culture', score: scoreCulture },
      { key: 'access', score: scoreAccess },
    ]
    return scores.reduce((min, s) => s.score < min.score ? s : min, scores[0])
  }

  // Helper: get bar color based on score
  const getBarColor = (score) => {
    if (score >= 4) return 'sdf-bar-green'
    if (score >= 3) return 'sdf-bar-amber'
    return 'sdf-bar-red'
  }

  // Helper: get low-scoring gate questions
  const getLowGateQuestions = () => {
    const low = []
    if (scoreBody < 4) low.push('body')
    if (scoreCulture < 4) low.push('culture')
    return low
  }

  // Helper: get all gaps (scores < 4)
  const getAllGaps = () => {
    const gaps = []
    if (scoreBody < 4) gaps.push('body')
    if (scoreIdentity < 4) gaps.push('identity')
    if (scoreCulture < 4) gaps.push('culture')
    if (scoreAccess < 4) gaps.push('access')
    return gaps
  }

  if (loading) {
    return (
      <div className="sdf">
        <div className="sdf-center">
          <div className="sdf-spinner" />
        </div>
      </div>
    )
  }

  // ── SCREEN 1: INTRO ──
  if (step === STEPS.INTRO) {
    return (
      <div className="sdf">
        <div className="sdf-container sdf-screen">
          <div className="sdf-intro">
            <div className="sdf-intro-content">
              <div className="sdf-badge">Scale Score</div>

              {ruleBreak && (
                <div className="sdf-context-card">
                  {projectName && <strong>{projectName}: </strong>}
                  "{ruleBreak}"
                </div>
              )}

              <h1>Can your rule break <span className="sdf-gold">scale</span>?</h1>
              <p>We tested 32 products. The ones that scaled all shared two things. Let's see if yours does.</p>
            </div>

            <button className="sdf-cta" onClick={() => { hapticLight(); setStep(STEPS.GATE) }}>
              Let's find out
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── SCREEN 2: THE GATE ──
  if (step === STEPS.GATE) {
    const bothSelected = scoreBody > 0 && scoreCulture > 0

    return (
      <div className="sdf">
        <div className="sdf-container sdf-screen">
          <div className="sdf-step-badge">The Gate</div>
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
              onClick={() => { hapticLight(); setStep(STEPS.IDENTITY) }}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── SCREEN 3: IDENTITY ──
  if (step === STEPS.IDENTITY) {
    return (
      <div className="sdf">
        <div className="sdf-container sdf-screen">
          <div className="sdf-step-badge">Diagnose · 1 of 2</div>
          <h2 className="sdf-heading">Would someone describe themselves <span className="sdf-gold">differently</span> after doing this regularly?</h2>
          <p className="sdf-prompt">Would they say "I'm someone who..."?</p>

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

          <div className="sdf-nav">
            <button className="sdf-back" onClick={() => setStep(STEPS.GATE)}>Back</button>
            <button
              className="sdf-cta"
              disabled={scoreIdentity === 0}
              onClick={() => { hapticLight(); setStep(STEPS.ACCESS) }}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── SCREEN 4: ACCESS ──
  if (step === STEPS.ACCESS) {
    return (
      <div className="sdf">
        <div className="sdf-container sdf-screen">
          <div className="sdf-step-badge">Diagnose · 2 of 2</div>
          <h2 className="sdf-heading">Could someone start <span className="sdf-gold">today</span> with zero preparation, equipment, or expertise?</h2>

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

          <div className="sdf-nav">
            <button className="sdf-back" onClick={() => setStep(STEPS.IDENTITY)}>Back</button>
            <button
              className="sdf-cta"
              disabled={scoreAccess === 0}
              onClick={() => { hapticLight(); setStep(STEPS.RESULTS) }}
            >
              See my results
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── SCREEN 5: RESULTS ──
  if (step === STEPS.RESULTS) {
    const weakest = getWeakest()
    const lowGate = getLowGateQuestions()
    const allGaps = getAllGaps()

    const scoreItems = [
      { key: 'body', label: 'Body', score: scoreBody },
      { key: 'culture', label: 'Culture', score: scoreCulture },
      { key: 'identity', label: 'Identity', score: scoreIdentity },
      { key: 'access', label: 'Access', score: scoreAccess },
    ]

    return (
      <div className="sdf">
        <div className="sdf-container sdf-screen">
          <div className="sdf-badge">Your Diagnostic</div>

          {/* Context */}
          {(projectName || ruleBreak) && (
            <div className="sdf-context-card">
              {projectName && <strong>{projectName}</strong>}
              {projectName && ruleBreak && ': '}
              {ruleBreak && `"${ruleBreak}"`}
            </div>
          )}

          {/* Headline */}
          {gatePassed ? (
            <h2 className="sdf-result-headline sdf-result-headline-gold">
              Your rule break has scale conditions.
            </h2>
          ) : (
            <h2 className="sdf-result-headline sdf-result-headline-neutral">
              Your rule break has a growth ceiling.
            </h2>
          )}

          {/* Gate failure explanation */}
          {!gatePassed && lowGate.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              {lowGate.includes('body') && (
                <div className="sdf-gap-card">
                  <div className="sdf-gap-label">Body scored {scoreBody}/5</div>
                  <p className="sdf-gap-text">Phase 3 products that don't affect the body rarely scale beyond a niche. How can you add a physical or somatic element?</p>
                </div>
              )}
              {lowGate.includes('culture') && (
                <div className="sdf-gap-card">
                  <div className="sdf-gap-label">Culture scored {scoreCulture}/5</div>
                  <p className="sdf-gap-text">If people won't talk about it, it can't spread. You need the content and community play to normalise this.</p>
                </div>
              )}
            </div>
          )}

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

          {/* Accelerator or gap recommendation */}
          {gatePassed ? (
            <div className="sdf-accelerator-card">
              <div className="sdf-accelerator-label">Your growth accelerator: {QUADRANT_NAMES[weakest.key]}</div>
              <p className="sdf-accelerator-text">{RECOMMENDATIONS[weakest.key]}</p>
            </div>
          ) : (
            allGaps.length > 0 && (
              <div>
                {allGaps.map(gap => (
                  <div key={gap} className="sdf-gap-card">
                    <div className="sdf-gap-label">Strengthen: {QUADRANT_NAMES[gap]}</div>
                    <p className="sdf-gap-text">{RECOMMENDATIONS[gap]}</p>
                  </div>
                ))}
              </div>
            )
          )}

          {error && <div className="sdf-error">{error}</div>}

          <div className="sdf-nav">
            <button className="sdf-back" onClick={() => setStep(STEPS.ACCESS)}>Back</button>
            <button
              className="sdf-cta"
              disabled={saving}
              onClick={save}
            >
              {saving ? 'Saving...' : 'Save and finish'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
