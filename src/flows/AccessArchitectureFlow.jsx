/**
 * AccessArchitectureFlow.jsx — /create/access-architecture
 * "Phase 4: How do you make it easy to choose?"
 *
 * 4-screen flow: Intro → Access Audit (5 barriers) → Score + Gaps → Design On-Ramp
 * Pre-fills from remarkable_angles, scale_diagnostics, narrative_builders.
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabaseClient'
import { hapticLight, hapticSuccess } from '../lib/haptics'
import './AccessArchitectureFlow.css'

const STEPS = {
  INTRO: 'intro',
  AUDIT: 'audit',
  RESULTS: 'results',
  ONRAMP: 'onramp',
}

const BARRIER_LABELS = {
  price: 'Price',
  time: 'Time',
  friction: 'Friction',
  cognitive: 'Decisions',
  identity: 'Identity',
}

const RECOMMENDATIONS = {
  price: 'The first experience should cost nothing. Create a free version, a free challenge, or a "pay what you can" option.',
  time: 'Create a 5-minute version. The cold shower challenge. The 3-breath exercise. The one-question journal. Give them a taste, not the full meal.',
  friction: 'Every extra step you add is a person who drops off. Remove anything they need before they can start. No equipment. No signup. No preparation.',
  cognitive: 'Give them one button, not a menu. "Start here" instead of "choose from 12 options." The fewer decisions, the more people begin.',
  identity: 'This isn\'t about making it easier to find you. It\'s about making it feel normal to try. Go back to Remarkable Reach and work on your tribal language and cosign.',
}

const PRICE_OPTIONS = [
  { value: 5, label: 'Free' },
  { value: 4, label: 'Under $20' },
  { value: 3, label: '$20-100' },
  { value: 2, label: '$100-500' },
  { value: 1, label: '$500+' },
]

const TIME_OPTIONS = [
  { value: 5, label: 'Under 5 minutes' },
  { value: 4, label: '5-30 minutes' },
  { value: 3, label: '30-90 minutes' },
  { value: 2, label: 'Half day' },
  { value: 1, label: 'Full day+' },
]

const FRICTION_OPTIONS = [
  { value: 5, label: 'Nothing. Just show up or download' },
  { value: 4, label: 'Basic equipment' },
  { value: 3, label: 'Specific location' },
  { value: 2, label: 'Training or certification' },
  { value: 1, label: 'Multiple prerequisites' },
]

const COGNITIVE_OPTIONS = [
  { value: 5, label: 'Zero. One button' },
  { value: 4, label: 'Choose a time' },
  { value: 3, label: 'Choose a time + location' },
  { value: 2, label: 'Research options + choose + prepare' },
  { value: 1, label: 'Complex multi-step process' },
]

const IDENTITY_OPTIONS = [
  { value: 5, label: 'No. They\'d happily tell anyone' },
  { value: 4, label: 'Maybe a little. Depends who' },
  { value: 3, label: 'They\'d tell close friends but not coworkers' },
  { value: 2, label: 'Yes. Most people would think it\'s strange' },
  { value: 1, label: 'Definitely. There\'s real stigma around this' },
]

const PRICE_HINT = { threshold: 4, text: 'Can someone try it for free? If not, that\'s the first barrier to fix.' }
const TIME_HINT = { threshold: 4, text: 'Can you make a version that takes 5 minutes or less? Give them a taste, not the full meal.' }
const FRICTION_HINT = { threshold: 4, text: 'Every extra thing they need before starting is another person who won\'t bother.' }
const COGNITIVE_HINT = { threshold: 4, text: 'Too many choices stops people from starting. Can you make it one click?' }
const IDENTITY_HINT = { threshold: 4, text: 'People feel weird doing this. That\'s not a marketing problem. Go back to Remarkable Reach.' }

const ONRAMP_EXAMPLES = [
  { text: 'Do 3 breaths with me right now', category: 'breathwork' },
  { text: 'Show up Saturday 6am. We give you headphones. Dance or just watch. Free.', category: 'silent disco' },
  { text: 'Skip breakfast tomorrow', category: 'fasting' },
  { text: 'Show up Saturday 9am. Walk if you want. It\'s free.', category: 'parkrun' },
  { text: 'Light a candle tonight instead of turning on the overhead light', category: 'circadian' },
  { text: 'Download the app and tap check in', category: 'Find My Flow' },
]

export default function AccessArchitectureFlow() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStepRaw] = useState(STEPS.INTRO)

  const setStep = (next) => {
    setStepRaw(next)
    setError(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Context
  const [projectName, setProjectName] = useState('')
  const [ruleBreak, setRuleBreak] = useState('')
  const [gatePassed, setGatePassed] = useState(null)
  const [narrativeFirstStep, setNarrativeFirstStep] = useState('')

  // Scores
  const [priceScore, setPriceScore] = useState(0)
  const [timeScore, setTimeScore] = useState(0)
  const [frictionScore, setFrictionScore] = useState(0)
  const [cognitiveScore, setCognitiveScore] = useState(0)
  const [identityScore, setIdentityScore] = useState(0)

  // On-ramp
  const [designedFirstStep, setDesignedFirstStep] = useState('')

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
          { data: narrativeData },
          { data: aaData },
        ] = await Promise.all([
          supabase
            .from('remarkable_angles')
            .select('project_name, ai_rule_statement')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1),
          supabase
            .from('scale_diagnostics')
            .select('score_access, score_culture, gate_passed')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1),
          supabase
            .from('narrative_builders')
            .select('first_step_type, first_step_desc')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1),
          supabase
            .from('access_architectures')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1),
        ])

        // Context from RemarkableFlow
        const angle = angleData?.[0]
        if (angle) {
          if (angle.project_name) setProjectName(angle.project_name)
          if (angle.ai_rule_statement) setRuleBreak(angle.ai_rule_statement)
        }

        // Scale Score context
        const diag = diagData?.[0]
        if (diag) {
          setGatePassed(diag.gate_passed)
        }

        // Remarkable Reach first step (pre-fill on-ramp)
        const narrative = narrativeData?.[0]
        if (narrative?.first_step_desc) {
          setNarrativeFirstStep(narrative.first_step_desc)
        }

        // Pre-fill for returning users
        const existing = aaData?.[0]
        if (existing) {
          setExistingRecord(existing)
          if (existing.price_score) setPriceScore(existing.price_score)
          if (existing.time_score) setTimeScore(existing.time_score)
          if (existing.friction_score) setFrictionScore(existing.friction_score)
          if (existing.cognitive_score) setCognitiveScore(existing.cognitive_score)
          if (existing.identity_score) setIdentityScore(existing.identity_score)
          if (existing.designed_first_step) setDesignedFirstStep(existing.designed_first_step)
          if (existing.project_name && !angle?.project_name) setProjectName(existing.project_name)
        }
      } catch (err) {
        console.warn('AccessArchitectureFlow data load failed:', err.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [user])

  // Auto-save on step change
  useEffect(() => {
    if (step !== STEPS.INTRO && step !== STEPS.ONRAMP && user) {
      autoSave()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  const getWeakest = () => {
    const scores = [
      { key: 'price', score: priceScore },
      { key: 'time', score: timeScore },
      { key: 'friction', score: frictionScore },
      { key: 'cognitive', score: cognitiveScore },
      { key: 'identity', score: identityScore },
    ]
    return scores.reduce((min, s) => s.score < min.score ? s : min, scores[0])
  }

  const getBarColor = (score) => {
    if (score >= 4) return 'aaf-bar-green'
    if (score >= 3) return 'aaf-bar-amber'
    return 'aaf-bar-red'
  }

  const getGaps = () => {
    const gaps = []
    if (priceScore && priceScore < 4) gaps.push('price')
    if (timeScore && timeScore < 4) gaps.push('time')
    if (frictionScore && frictionScore < 4) gaps.push('friction')
    if (cognitiveScore && cognitiveScore < 4) gaps.push('cognitive')
    if (identityScore && identityScore < 4) gaps.push('identity')
    return gaps
  }

  const autoSave = () => {
    if (!user) return
    const weakest = getWeakest()
    const fields = {
      project_name: projectName || null,
      price_score: priceScore || null,
      time_score: timeScore || null,
      friction_score: frictionScore || null,
      cognitive_score: cognitiveScore || null,
      identity_score: identityScore || null,
      weakest_barrier: weakest.score > 0 ? weakest.key : null,
    }

    if (existingRecord?.id) {
      supabase.from('access_architectures').update(fields).eq('id', existingRecord.id)
        .then(({ error: err }) => { if (err) console.error('Auto-save update failed:', err.message) })
    } else {
      supabase.from('access_architectures').upsert({ ...fields, user_id: user.id }, { onConflict: 'user_id' }).select('id').single()
        .then(({ data: row, error: err }) => {
          if (err) console.error('Auto-save upsert failed:', err.message)
          else if (row?.id) setExistingRecord(row)
        })
    }
  }

  // Final save
  const save = async () => {
    if (!user || saving) return
    setSaving(true)
    try {
      const weakest = getWeakest()
      const fields = {
        project_name: projectName || null,
        price_score: priceScore,
        time_score: timeScore,
        friction_score: frictionScore,
        cognitive_score: cognitiveScore,
        identity_score: identityScore,
        weakest_barrier: weakest.score < 4 ? weakest.key : null,
        designed_first_step: designedFirstStep || null,
      }

      if (existingRecord?.id) {
        const { error: updateErr } = await supabase.from('access_architectures').update(fields).eq('id', existingRecord.id)
        if (updateErr) throw updateErr
      } else {
        const { data: row, error: insertErr } = await supabase.from('access_architectures').insert({ ...fields, user_id: user.id }).select('id').single()
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

  if (loading) {
    return (
      <div className="aaf">
        <div className="aaf-center">
          <div className="aaf-spinner" />
        </div>
      </div>
    )
  }

  // ── SCREEN 1: INTRO ──
  if (step === STEPS.INTRO) {
    return (
      <div className="aaf">
        <div className="aaf-container aaf-screen">
          <div className="aaf-intro">
            <div className="aaf-intro-content">
              <div className="aaf-badge">Remarkable Growth</div>

              {ruleBreak && (
                <div className="aaf-context-card">
                  {projectName && <strong>{projectName}: </strong>}
                  "{ruleBreak}"
                </div>
              )}

              <h1>Make it impossible <span className="aaf-gold">not to try</span></h1>
              <p>Every barrier you remove means more people try it. The easier it is to start, the faster your experience spreads.</p>

              {gatePassed === false && (
                <div className="aaf-context-card" style={{ borderColor: 'rgba(233,162,59,0.3)', background: 'rgba(233,162,59,0.06)' }}>
                  Your Scale Score found a ceiling. Reducing barriers here can help.
                </div>
              )}
            </div>

            <button className="aaf-cta" onClick={() => { hapticLight(); setStep(STEPS.AUDIT) }}>
              Audit my growth barriers
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── SCREEN 2: ACCESS AUDIT (5 questions) ──
  if (step === STEPS.AUDIT) {
    const allSelected = priceScore > 0 && timeScore > 0 && frictionScore > 0 && cognitiveScore > 0 && identityScore > 0

    return (
      <div className="aaf">
        <div className="aaf-container aaf-screen">
          <div className="aaf-step-badge">Growth Audit</div>
          <h2 className="aaf-heading">5 barriers between someone and <span className="aaf-gold">your experience</span></h2>

          {/* Price */}
          <div className="aaf-question-section">
            <div className="aaf-question-label">What does it cost to try for the first time?</div>
            <div className="aaf-option-list">
              {PRICE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  className={`aaf-option-btn ${priceScore === opt.value ? 'aaf-option-selected' : ''}`}
                  onClick={() => { hapticLight(); setPriceScore(opt.value) }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {priceScore > 0 && priceScore < PRICE_HINT.threshold && (
              <div className="aaf-question-hint">{PRICE_HINT.text}</div>
            )}
          </div>

          {/* Time */}
          <div className="aaf-question-section">
            <div className="aaf-question-label">How long does someone need to commit?</div>
            <div className="aaf-option-list">
              {TIME_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  className={`aaf-option-btn ${timeScore === opt.value ? 'aaf-option-selected' : ''}`}
                  onClick={() => { hapticLight(); setTimeScore(opt.value) }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {timeScore > 0 && timeScore < TIME_HINT.threshold && (
              <div className="aaf-question-hint">{TIME_HINT.text}</div>
            )}
          </div>

          {/* Friction */}
          <div className="aaf-question-section">
            <div className="aaf-question-label">What does someone need BEFORE they can start?</div>
            <div className="aaf-option-list">
              {FRICTION_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  className={`aaf-option-btn ${frictionScore === opt.value ? 'aaf-option-selected' : ''}`}
                  onClick={() => { hapticLight(); setFrictionScore(opt.value) }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {frictionScore > 0 && frictionScore < FRICTION_HINT.threshold && (
              <div className="aaf-question-hint">{FRICTION_HINT.text}</div>
            )}
          </div>

          {/* Cognitive load */}
          <div className="aaf-question-section">
            <div className="aaf-question-label">How many decisions does someone need to make to begin?</div>
            <div className="aaf-option-list">
              {COGNITIVE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  className={`aaf-option-btn ${cognitiveScore === opt.value ? 'aaf-option-selected' : ''}`}
                  onClick={() => { hapticLight(); setCognitiveScore(opt.value) }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {cognitiveScore > 0 && cognitiveScore < COGNITIVE_HINT.threshold && (
              <div className="aaf-question-hint">{COGNITIVE_HINT.text}</div>
            )}
          </div>

          {/* Identity */}
          <div className="aaf-question-section">
            <div className="aaf-question-label">Would someone feel weird telling their friends they tried this?</div>
            <div className="aaf-option-list">
              {IDENTITY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  className={`aaf-option-btn ${identityScore === opt.value ? 'aaf-option-selected' : ''}`}
                  onClick={() => { hapticLight(); setIdentityScore(opt.value) }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {identityScore > 0 && identityScore < IDENTITY_HINT.threshold && (
              <div className="aaf-question-hint">{IDENTITY_HINT.text}</div>
            )}
          </div>

          <div className="aaf-nav">
            <button className="aaf-back" onClick={() => setStep(STEPS.INTRO)}>Back</button>
            <button
              className="aaf-cta"
              disabled={!allSelected}
              onClick={() => { hapticLight(); setStep(STEPS.RESULTS) }}
            >
              See my score
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── SCREEN 3: RESULTS ──
  if (step === STEPS.RESULTS) {
    const weakest = getWeakest()
    const gaps = getGaps()

    const scoreItems = [
      { key: 'price', label: 'Price', score: priceScore },
      { key: 'time', label: 'Time', score: timeScore },
      { key: 'friction', label: 'Friction', score: frictionScore },
      { key: 'cognitive', label: 'Cognitive Load', score: cognitiveScore },
      { key: 'identity', label: 'Identity', score: identityScore },
    ]

    return (
      <div className="aaf">
        <div className="aaf-container aaf-screen">
          <div className="aaf-badge">Your Growth Score</div>

          {(projectName || ruleBreak) && (
            <div className="aaf-context-card">
              {projectName && <strong>{projectName}</strong>}
              {projectName && ruleBreak && ': '}
              {ruleBreak && `"${ruleBreak}"`}
            </div>
          )}

          <h2 className="aaf-result-headline">
            {gaps.length === 0
              ? 'Low friction. Your growth potential is strong.'
              : `${gaps.length} barrier${gaps.length > 1 ? 's' : ''} between someone and your experience.`
            }
          </h2>

          {/* Score bars with inline recommendations */}
          <div className="aaf-results-section">
            {scoreItems.map(item => (
              <div
                key={item.key}
                className={`aaf-score-bar ${item.key === weakest.key ? 'aaf-score-bar-weakest' : ''}`}
              >
                <div className="aaf-score-bar-header">
                  <span className="aaf-score-bar-label">{item.label}</span>
                  <span className="aaf-score-bar-value">{item.score}/5</span>
                </div>
                <div className="aaf-score-bar-track">
                  <div
                    className={`aaf-score-bar-fill ${getBarColor(item.score)}`}
                    style={{ width: `${(item.score / 5) * 100}%` }}
                  />
                </div>
                {gaps.includes(item.key) && (
                  <p className="aaf-score-bar-rec">{RECOMMENDATIONS[item.key]}</p>
                )}
              </div>
            ))}
          </div>

          <div className="aaf-nav">
            <button className="aaf-back" onClick={() => setStep(STEPS.AUDIT)}>Back</button>
            <button
              className="aaf-cta"
              onClick={() => { hapticLight(); setStep(STEPS.ONRAMP) }}
            >
              Design my on-ramp
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── SCREEN 4: DESIGN ON-RAMP ──
  if (step === STEPS.ONRAMP) {
    return (
      <div className="aaf">
        <div className="aaf-container aaf-screen">
          <div className="aaf-step-badge">Your On-Ramp</div>
          <h2 className="aaf-heading">Design a first step that passes <span className="aaf-gold">all 5 tests</span></h2>
          <p className="aaf-prompt">If someone exhausted on the couch could do it, you've nailed it.</p>

          {narrativeFirstStep && (
            <div className="aaf-context-card">
              From your Remarkable Reach: "{narrativeFirstStep}"
            </div>
          )}

          {/* 5 barrier criteria from their audit */}
          <div className="aaf-criteria-list">
            <div className={`aaf-criteria-item ${priceScore >= 4 ? 'aaf-criteria-pass' : 'aaf-criteria-fail'}`}>
              <span className="aaf-criteria-icon">{priceScore >= 4 ? '✓' : '✗'}</span>
              <span className="aaf-criteria-text">Free or under $20</span>
            </div>
            <div className={`aaf-criteria-item ${timeScore >= 4 ? 'aaf-criteria-pass' : 'aaf-criteria-fail'}`}>
              <span className="aaf-criteria-icon">{timeScore >= 4 ? '✓' : '✗'}</span>
              <span className="aaf-criteria-text">Under 5 minutes</span>
            </div>
            <div className={`aaf-criteria-item ${frictionScore >= 4 ? 'aaf-criteria-pass' : 'aaf-criteria-fail'}`}>
              <span className="aaf-criteria-icon">{frictionScore >= 4 ? '✓' : '✗'}</span>
              <span className="aaf-criteria-text">Nothing to prepare or bring</span>
            </div>
            <div className={`aaf-criteria-item ${cognitiveScore >= 4 ? 'aaf-criteria-pass' : 'aaf-criteria-fail'}`}>
              <span className="aaf-criteria-icon">{cognitiveScore >= 4 ? '✓' : '✗'}</span>
              <span className="aaf-criteria-text">One step to start, no choices</span>
            </div>
            <div className={`aaf-criteria-item ${identityScore >= 4 ? 'aaf-criteria-pass' : 'aaf-criteria-fail'}`}>
              <span className="aaf-criteria-icon">{identityScore >= 4 ? '✓' : '✗'}</span>
              <span className="aaf-criteria-text">Wouldn't feel weird telling a friend</span>
            </div>
          </div>

          <div className="aaf-onramp-section">
            <div className="aaf-input-label">Describe an on-ramp that passes all 5.</div>
            <textarea
              className="aaf-input"
              placeholder="Describe the simplest way someone can experience your work..."
              value={designedFirstStep}
              onChange={e => setDesignedFirstStep(e.target.value)}
              rows={3}
            />
          </div>

          <div className="aaf-examples">
            <div className="aaf-examples-label">Examples that pass all 5</div>
            {ONRAMP_EXAMPLES.map((ex, i) => (
              <div key={i} className="aaf-example">
                <span className="aaf-example-text">"{ex.text}"</span>
                <span className="aaf-example-cat">{ex.category}</span>
              </div>
            ))}
          </div>

          {error && <div className="aaf-error">{error}</div>}

          <div className="aaf-nav">
            <button className="aaf-back" onClick={() => setStep(STEPS.RESULTS)}>Back</button>
            <button
              className="aaf-cta"
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
