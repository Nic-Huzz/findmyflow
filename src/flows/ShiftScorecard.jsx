/**
 * ShiftScorecard.jsx — /shift-scorecard
 * Public lead magnet: 7-question audit for facilitators to evaluate
 * whether their experiences create lasting subconscious shifts.
 * No auth required. Email capture optional.
 */
import { useState, useCallback, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import './ShiftScorecard.css'

const QUESTIONS = [
  {
    id: 'activation',
    condition: 'Reactivation',
    conditionNumber: 1,
    question: 'Does your experience activate the target emotional pattern in the BODY, not just the mind?',
    yes: 'Participants feel sensation, tension, or emotion physically. Their nervous system is firing, not just their thoughts.',
    no: 'You\'re discussing the pattern intellectually, sharing stories about it, or using cognitive reframes without felt experience.',
  },
  {
    id: 'specificity',
    condition: 'Reactivation',
    conditionNumber: 1,
    question: 'Do participants connect the activation to a specific implicit belief their body holds?',
    yes: 'They can feel or articulate what their body "knows" will happen. ("If I\'m seen, I\'ll be rejected.")',
    no: 'The experience creates general emotional arousal without specificity about what\'s being activated.',
  },
  {
    id: 'mismatch',
    condition: 'Mismatch',
    conditionNumber: 2,
    question: 'While the old pattern is activated, does the participant have a FELT experience that contradicts what their body predicted?',
    yes: 'Their body expected danger and received safety. Expected rejection and received witnessing. And they FELT it, not just understood it.',
    no: 'You\'re providing counter-evidence verbally, the pattern has subsided before the contradicting experience arrives, or the mismatch is cognitive only.',
  },
  {
    id: 'embodied',
    condition: 'Mismatch',
    conditionNumber: 2,
    question: 'Does the mismatch come from lived or embodied experience rather than the facilitator\'s words?',
    yes: 'The participant\'s own body provides the evidence: a physical action, a group response, or their own memory of a time the prediction failed.',
    no: 'The facilitator tells them the contradicting truth, or they affirm something they don\'t yet feel.',
  },
  {
    id: 'discharge',
    condition: 'Repetition',
    conditionNumber: 3,
    question: 'Is there somatic discharge during or immediately after the mismatch?',
    yes: 'Shaking, movement, breath, sound, crying, laughter. The body is physically completing something.',
    no: 'The experience ends with insight or intention but the body hasn\'t moved or released.',
  },
  {
    id: 'window',
    condition: 'Repetition',
    conditionNumber: 3,
    question: 'Is there a structured repetition protocol within ~5 hours after the session?',
    yes: 'Participants have a specific practice, challenge, or action to repeat the mismatch experience before sleep that night.',
    no: 'Participants leave with inspiration or a journaling prompt but no embodied repetition of the new learning.',
  },
  {
    id: 'behavioral',
    condition: 'Repetition',
    conditionNumber: 3,
    question: 'Is there a behavioural change protocol for the days and weeks following?',
    yes: 'Graduated real-world challenges that test the new encoding under increasing stakes, with tracking.',
    no: 'The experience is standalone. Follow-up is optional or limited to a WhatsApp group.',
  },
]

const SCORE_BANDS = [
  { min: 7, max: 7, label: 'Full Reconsolidation Design', color: '#10b981', message: 'Your experience meets the conditions for lasting subconscious change. Focus on calibration, scaling, and measuring outcomes.' },
  { min: 5, max: 6, label: 'Strong Foundation', color: '#E9A23B', message: 'You\'re likely creating real shifts for some participants. The missing pieces are limiting how many people change and whether it lasts.' },
  { min: 3, max: 4, label: 'Counteractive Change', color: '#f97316', message: 'Powerful experiences, but the shifts likely require ongoing maintenance rather than permanent rewiring. The pattern returns under stress. Most workshops land here.' },
  { min: 1, max: 2, label: 'Activation Without Rewiring', color: '#ef4444', message: 'Your experience moves people emotionally but is unlikely to produce lasting subconscious change.' },
  { min: 0, max: 0, label: 'Inspirational, Not Transformational', color: '#94a3b8', message: 'You\'re running an intellectual or inspirational experience. Nothing wrong with that, but it won\'t rewire anyone.' },
]

const GAP_PATTERNS = [
  {
    id: 'activation_no_mismatch',
    label: 'Activation Without Mismatch',
    check: (a) => (a.activation || a.specificity) && !a.mismatch && !a.embodied,
    description: 'You get people emotional but don\'t contradict the prediction. Cathartic release without rewiring. Feels powerful. Doesn\'t last.',
    common: 'Breathwork, ecstatic dance, emotional workshops',
  },
  {
    id: 'mismatch_no_activation',
    label: 'Mismatch Without Activation',
    check: (a) => !a.activation && !a.specificity && (a.mismatch || a.embodied),
    description: 'Beautiful contradicting experience, but the old pattern wasn\'t online when it happened. New learning stored alongside old encoding, not replacing it.',
    common: 'Positive affirmation work, inspirational talks, most coaching',
  },
  {
    id: 'no_repetition',
    label: 'No Repetition System',
    check: (a) => (a.activation || a.specificity || a.mismatch || a.embodied) && !a.window && !a.behavioral,
    description: 'The shift happens in the room. Then fades. The reconsolidation window closes without reinforcement.',
    common: 'Tony Robbins events, weekend intensives, retreat highs',
  },
  {
    id: 'cognitive_only',
    label: 'Cognitive Only',
    check: (a) => !a.activation && !a.specificity && !a.discharge && !a.mismatch && !a.embodied,
    description: 'The experience stays in the head. Without body activation and discharge, the nervous system encoding doesn\'t update.',
    common: 'NLP, CBT-style coaching, talk-based workshops',
  },
]

export default function ShiftScorecard() {
  const [stage, setStage] = useState('intro')
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState({})
  const [animating, setAnimating] = useState(false)
  const [email, setEmail] = useState('')
  const [emailSubmitted, setEmailSubmitted] = useState(false)
  const [emailSaving, setEmailSaving] = useState(false)

  // Calculate score
  const score = Object.values(answers).filter(Boolean).length
  const band = SCORE_BANDS.find(b => score >= b.min && score <= b.max) || SCORE_BANDS[SCORE_BANDS.length - 1]

  // Find matching gap patterns
  const gaps = GAP_PATTERNS.filter(g => g.check(answers))

  // Condition breakdown
  const conditionScores = [
    { name: 'Reactivation', num: 1, score: [answers.activation, answers.specificity].filter(Boolean).length, max: 2 },
    { name: 'Mismatch', num: 2, score: [answers.mismatch, answers.embodied].filter(Boolean).length, max: 2 },
    { name: 'Repetition', num: 3, score: [answers.discharge, answers.window, answers.behavioral].filter(Boolean).length, max: 3 },
  ]

  const handleAnswer = useCallback((value) => {
    if (animating) return
    setAnimating(true)

    const q = QUESTIONS[currentQ]
    const newAnswers = { ...answers, [q.id]: value }
    setAnswers(newAnswers)

    setTimeout(() => {
      if (currentQ < QUESTIONS.length - 1) {
        setCurrentQ(prev => prev + 1)
      } else {
        setStage('results')
      }
      setAnimating(false)
    }, 300)
  }, [currentQ, answers, animating])

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim() || emailSaving) return

    setEmailSaving(true)
    try {
      const { error } = await supabase.from('shift_scorecard_leads').insert({
        email: email.trim(),
        score,
        answers,
        gaps: gaps.map(g => g.id),
      })
      if (error) console.warn('Email save failed:', error)
      setEmailSubmitted(true)
    } catch (err) {
      console.warn('Email save failed:', err)
      setEmailSubmitted(true)
    } finally {
      setEmailSaving(false)
    }
  }

  const restart = () => {
    setStage('intro')
    setCurrentQ(0)
    setAnswers({})
    setEmailSubmitted(false)
    setEmail('')
  }

  // ===== INTRO =====
  if (stage === 'intro') {
    return (
      <div className="ss-container">
        <div className="ss-content ss-intro">
          <div className="ss-badge">Free Diagnostic</div>
          <h1 className="ss-headline">
            Does Your Experience Create{' '}
            <span className="ss-gold">Lasting Change?</span>
          </h1>
          <p className="ss-subheadline">
            Most workshops, retreats, and sessions feel powerful in the room but don't travel home with participants. This 2-minute scorecard tells you why.
          </p>

          <div className="ss-info-card">
            <div className="ss-info-row">
              <span className="ss-info-icon">🧠</span>
              <span>Based on memory reconsolidation research (Nader, 2000; Ecker et al., 2012)</span>
            </div>
            <div className="ss-info-row">
              <span className="ss-info-icon">⏱️</span>
              <span>7 questions, 2 minutes</span>
            </div>
            <div className="ss-info-row">
              <span className="ss-info-icon">🎯</span>
              <span>Specific gap analysis with your score</span>
            </div>
          </div>

          <div className="ss-science-block">
            <p className="ss-science-label">The Science</p>
            <p className="ss-science-text">
              Lasting subconscious change requires 3 specific neurological conditions to be met simultaneously. Most healing modalities meet 1 or 2 accidentally. Almost none meet all 3 by design.
            </p>
            <div className="ss-conditions">
              <div className="ss-condition-pill">
                <span className="ss-condition-num">1</span> Reactivation
              </div>
              <div className="ss-condition-pill">
                <span className="ss-condition-num">2</span> Mismatch
              </div>
              <div className="ss-condition-pill">
                <span className="ss-condition-num">3</span> Repetition
              </div>
            </div>
          </div>

          <button className="ss-cta" onClick={() => setStage('questions')}>
            Score My Experience
          </button>
          <p className="ss-disclaimer">No account needed. No data stored without your permission.</p>
        </div>
      </div>
    )
  }

  // ===== QUESTIONS =====
  if (stage === 'questions') {
    const q = QUESTIONS[currentQ]
    const progress = ((currentQ + 1) / QUESTIONS.length) * 100

    return (
      <div className="ss-container">
        <div className="ss-content">
          {/* Progress */}
          <div className="ss-progress-bar">
            <div className="ss-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="ss-progress-text">
            <span className="ss-condition-tag">Condition {q.conditionNumber}: {q.condition}</span>
            <span>{currentQ + 1} of {QUESTIONS.length}</span>
          </div>

          {/* Question */}
          <div className={`ss-question-card ${animating ? 'ss-exit' : 'ss-enter'}`}>
            <h2 className="ss-question">{q.question}</h2>

            <div className="ss-answer-buttons">
              <button className="ss-answer ss-answer-yes" onClick={() => handleAnswer(true)}>
                <span className="ss-answer-icon">✓</span>
                <div className="ss-answer-content">
                  <span className="ss-answer-label">Yes</span>
                  <span className="ss-answer-desc">{q.yes}</span>
                </div>
              </button>

              <button className="ss-answer ss-answer-no" onClick={() => handleAnswer(false)}>
                <span className="ss-answer-icon">✗</span>
                <div className="ss-answer-content">
                  <span className="ss-answer-label">No</span>
                  <span className="ss-answer-desc">{q.no}</span>
                </div>
              </button>
            </div>
          </div>

          {currentQ > 0 && (
            <button
              className="ss-back"
              onClick={() => { setAnimating(false); setCurrentQ(prev => prev - 1) }}
            >
              ← Previous question
            </button>
          )}
        </div>
      </div>
    )
  }

  // ===== RESULTS =====
  if (stage === 'results') {
    return (
      <div className="ss-container">
        <div className="ss-content ss-results">
          {/* Score Hero */}
          <div className="ss-score-hero">
            <div className="ss-score-circle" style={{ borderColor: band.color }}>
              <span className="ss-score-number">{score}</span>
              <span className="ss-score-of">/7</span>
            </div>
            <h2 className="ss-score-label" style={{ color: band.color }}>{band.label}</h2>
            <p className="ss-score-message">{band.message}</p>
          </div>

          {/* Condition Breakdown */}
          <div className="ss-breakdown">
            <h3 className="ss-section-title">The 3 Conditions</h3>
            {conditionScores.map(c => (
              <div key={c.num} className="ss-condition-row">
                <div className="ss-condition-header">
                  <span className="ss-condition-name">
                    <span className="ss-condition-num">{c.num}</span> {c.name}
                  </span>
                  <span className="ss-condition-score">
                    {c.score}/{c.max}
                  </span>
                </div>
                <div className="ss-condition-bar">
                  <div
                    className="ss-condition-fill"
                    style={{
                      width: `${(c.score / c.max) * 100}%`,
                      background: c.score === c.max ? '#10b981' : c.score > 0 ? '#E9A23B' : '#ef4444'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Gap Analysis */}
          {gaps.length > 0 && (
            <div className="ss-gaps">
              <h3 className="ss-section-title">Your Gap Pattern</h3>
              {gaps.map(gap => (
                <div key={gap.id} className="ss-gap-card">
                  <h4 className="ss-gap-name">{gap.label}</h4>
                  <p className="ss-gap-desc">{gap.description}</p>
                  <p className="ss-gap-common">Common in: {gap.common}</p>
                </div>
              ))}
            </div>
          )}

          {/* The Fix */}
          <div className="ss-fix-block">
            <h3 className="ss-section-title">What This Means</h3>
            <p className="ss-fix-text">
              {score < 5
                ? 'Your participants aren\'t broken. Your container is incomplete. The neuroscience of lasting change is specific. The 3 conditions aren\'t optional. They\'re the mechanism.'
                : 'You\'re ahead of most facilitators. The remaining gaps are where participants fall through the cracks. Closing them turns "some people shift" into "most people shift."'
              }
            </p>
            <p className="ss-fix-text" style={{ marginTop: '12px' }}>
              <strong>Shift Architecture</strong> is the framework for designing experiences that meet all 3 conditions intentionally, not accidentally. Whatever your modality, the arc is the same.
            </p>
          </div>

          {/* CTA Block */}
          <div className="ss-email-block">
            <h3 className="ss-email-title">Want to close these gaps?</h3>
            <p className="ss-email-subtitle">
              FindMyFlow helps experience creators design workshops, retreats, and sessions that create lasting shifts. The Shift Architecture framework is built in.
            </p>
            <a
              href="/"
              className="ss-cta"
              style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}
            >
              Scale Your Impact and Income
            </a>
          </div>

          {/* Email Capture */}
          <div className="ss-email-block" style={{ background: 'rgba(0, 0, 0, 0.15)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            {!emailSubmitted ? (
              <>
                <h3 className="ss-email-title" style={{ fontSize: '1rem' }}>Or get notified when Shift Architecture certification opens</h3>
                <form className="ss-email-form" onSubmit={handleEmailSubmit}>
                  <input
                    type="email"
                    className="ss-email-input"
                    placeholder="Your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <button
                    type="submit"
                    className="ss-cta ss-cta-small"
                    disabled={emailSaving}
                  >
                    {emailSaving ? 'Joining...' : 'Join Waitlist'}
                  </button>
                </form>
              </>
            ) : (
              <div className="ss-email-success">
                <span className="ss-email-check">✓</span>
                <p>You're on the list. We'll reach out when certification opens.</p>
              </div>
            )}
          </div>

          {/* Restart */}
          <button className="ss-restart" onClick={restart}>
            Retake the Scorecard
          </button>

          <p className="ss-attribution">
            Created by Huzz Hurrell. Based on memory reconsolidation research (Nader, 2000; Ecker et al., 2012; Lane et al., 2015).
          </p>
        </div>
      </div>
    )
  }

  return null
}
