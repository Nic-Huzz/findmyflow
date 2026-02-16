import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import PublicEmailGate from '../components/PublicEmailGate'
import EarthquakeResults from './EarthquakeResults'
import {
  QUESTIONS, HOOK_COPY, computeResults,
} from './earthquakeQuizConfig'
import './EarthquakeQuiz.css'

/**
 * EarthquakeQuiz — Free lead magnet quiz at /try/earthquake
 * No auth required. Email gate before results.
 *
 * Flow: Hook → Q1 → Q2 → ... → Q9 → Email Gate → Calculating → Results
 *
 * Matches Money Model flow UX: one question per page, click-to-advance
 * for single-select, Next button for multi-select and text inputs.
 */

// Build stage order: hook, q1-q9, email_gate, calculating, results
const QUESTION_STAGES = QUESTIONS.map(q => q.id)
const STAGE_ORDER = ['hook', ...QUESTION_STAGES, 'email_gate', 'calculating', 'results']
const STORAGE_KEY = 'earthquake_quiz_progress'

function loadProgress() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return null
    return JSON.parse(saved)
  } catch { return null }
}

function saveProgress(stage, answers) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ stage, answers }))
  } catch { /* quota exceeded — ignore */ }
}

function clearProgress() {
  try { localStorage.removeItem(STORAGE_KEY) } catch {}
}

export default function EarthquakeQuiz() {
  const saved = useRef(loadProgress())
  const [stage, setStage] = useState(() => saved.current?.stage || 'hook')
  const [answers, setAnswers] = useState(() => saved.current?.answers || {})
  const [results, setResults] = useState(null)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [utmParams, setUtmParams] = useState({})
  const [calcStep, setCalcStep] = useState(0)
  const containerRef = useRef(null)

  // Save progress on stage/answer changes (skip transient stages)
  useEffect(() => {
    if (['calculating', 'results'].includes(stage)) return
    saveProgress(stage, answers)
  }, [stage, answers])

  // Extract UTM params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setUtmParams({
      utm_source: params.get('utm_source') || null,
      utm_medium: params.get('utm_medium') || null,
      utm_campaign: params.get('utm_campaign') || null,
      referrer: document.referrer || null,
    })
  }, [])

  // Scroll to top on stage change
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo?.({ top: 0, behavior: 'smooth' })
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [stage])

  // ── Calculating animation ──
  useEffect(() => {
    if (stage !== 'calculating') return
    const steps = [0, 1, 2, 3]
    let i = 0
    const interval = setInterval(() => {
      i++
      if (i < steps.length) {
        setCalcStep(i)
      } else {
        clearInterval(interval)
        setStage('results')
      }
    }, 600)
    return () => clearInterval(interval)
  }, [stage])

  // ── Helpers ──

  const currentQuestion = QUESTIONS.find(q => q.id === stage) || null
  const currentQuestionIndex = QUESTIONS.findIndex(q => q.id === stage)

  const goNext = () => {
    const idx = STAGE_ORDER.indexOf(stage)
    if (idx < STAGE_ORDER.length - 1) {
      setStage(STAGE_ORDER[idx + 1])
    }
  }

  const goBack = () => {
    const idx = STAGE_ORDER.indexOf(stage)
    if (idx > 0) {
      setStage(STAGE_ORDER[idx - 1])
    }
  }

  // Single-select: click an option → store answer → auto-advance
  const handleSingleSelect = (questionId, optionId) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionId }))
    // Auto-advance after brief delay for visual feedback
    setTimeout(() => {
      const idx = STAGE_ORDER.indexOf(questionId)
      if (idx < STAGE_ORDER.length - 1) {
        setStage(STAGE_ORDER[idx + 1])
      }
    }, 150)
  }

  const toggleMultiAnswer = (questionId, optionId) => {
    setAnswers(prev => {
      const current = prev[questionId] || []
      const next = current.includes(optionId)
        ? current.filter(id => id !== optionId)
        : [...current, optionId]
      return { ...prev, [questionId]: next }
    })
  }

  // ── Email Submit → Compute + Save ──

  const handleEmailSubmit = async (submittedEmail, submittedName) => {
    setEmail(submittedEmail)
    setName(submittedName)

    // Compute results
    const computed = computeResults(answers)
    setResults(computed)

    // Move to calculating animation
    setCalcStep(0)
    setStage('calculating')

    // Save to DB (fire-and-forget pattern)
    try {
      // Guard: required NOT NULL fields
      if (!answers.q1_stage || !answers.q8_course_count) {
        console.error('Missing required quiz answers:', { q1: answers.q1_stage, q8: answers.q8_course_count })
        return
      }

      // 1. Insert earthquake_quiz_leads
      await supabase.from('earthquake_quiz_leads').insert({
        email: submittedEmail,
        name: submittedName || null,
        q1_stage: answers.q1_stage,
        q2_first_reaction: answers.q2_first_reaction || [],
        q3_behavioral: answers.q3_behavioral || [],
        q4_real_reason: answers.q4_real_reason || [],
        q5_chest_tightens: answers.q5_chest_tightens || [],
        q6_tried_so_far: answers.q6_tried_so_far || [],
        q7_resonates: answers.q7_resonates || [],
        q8_course_count: answers.q8_course_count,
        q9_emotional_state: answers.q9_emotional_state || null,
        primary_voice: computed.primaryVoice,
        voice_scores: computed.voiceScores,
        awakening_stage: computed.awakeningStage,
        primary_block: computed.primaryBlock,
        language_level: computed.languageLevel,
        ...utmParams,
      })

      // 2. Upsert public_leads
      await supabase.from('public_leads').upsert({
        email: submittedEmail,
        name: submittedName || null,
        source_flow: 'earthquake_quiz',
        flow_results: {
          primary_voice: computed.primaryVoice,
          awakening_stage: computed.awakeningStage,
          primary_block: computed.primaryBlock,
          emotional_state: computed.emotionalState,
        },
      }, {
        onConflict: 'email',
        ignoreDuplicates: false,
      })

      // Clear saved progress after successful DB write
      clearProgress()

      // 3. Notify lead capture (fire-and-forget)
      supabase.functions.invoke('notify-lead-capture', {
        body: {
          email: submittedEmail,
          name: submittedName,
          source: 'Earthquake Quiz',
          meta: {
            primary_voice: computed.primaryVoice,
            awakening_stage: computed.awakeningStage,
            primary_block: computed.primaryBlock,
          },
        },
      }).catch(() => {})
    } catch (err) {
      console.error('Error saving quiz data:', err)
    }
  }

  // ── Retake ──

  const handleRetake = () => {
    clearProgress()
    setAnswers({})
    setResults(null)
    setEmail('')
    setName('')
    setStage('hook')
  }

  // ── Progress dots (9 question dots) ──

  const getDotState = (dotIndex) => {
    if (currentQuestionIndex < 0) return '' // not on a question stage
    if (dotIndex < currentQuestionIndex) return 'completed'
    if (dotIndex === currentQuestionIndex) return 'active'
    return ''
  }

  const renderProgressDots = () => {
    if (currentQuestionIndex < 0) return null
    return (
      <div className="quiz-progress-dots">
        {QUESTIONS.map((_, i) => (
          <div key={i} className={`quiz-dot ${getDotState(i)}`} />
        ))}
      </div>
    )
  }

  // ── Render Question ──

  const renderQuestion = (q) => {
    const qIndex = QUESTIONS.indexOf(q)

    return (
      <div className="quiz-inner" key={q.id}>
        {renderProgressDots()}
        <div className="question-container">
          <div className="question-number">Question {qIndex + 1} of 9</div>
          <h2 className="question-text">{q.question}</h2>

          {q.type === 'single' && (
            <div className="options-list">
              {q.options.map(opt => (
                <button
                  key={opt.id}
                  className={`option-card ${opt.icon ? 'has-icon' : ''} ${answers[q.id] === opt.id ? 'selected' : ''}`}
                  onClick={() => handleSingleSelect(q.id, opt.id)}
                >
                  {opt.icon ? (
                    <>
                      <span className="option-icon">{opt.icon}</span>
                      <span className="option-text">
                        <span className="option-label">{opt.label}</span>
                        {opt.description && <span className="option-desc">{opt.description}</span>}
                      </span>
                    </>
                  ) : opt.label}
                </button>
              ))}
            </div>
          )}

          {q.type === 'multi' && (
            <>
              <div className="multi-label">Select all that apply</div>
              <div className="options-list">
                {q.options.map(opt => {
                  const selected = (answers[q.id] || []).includes(opt.id)
                  return (
                    <button
                      key={opt.id}
                      className={`option-card ${selected ? 'selected' : ''}`}
                      onClick={() => toggleMultiAnswer(q.id, opt.id)}
                    >
                      <span className="multi-check" />
                      {opt.label}
                    </button>
                  )
                })}
              </div>
              <div className="quiz-nav flow-base">
                <button
                  className="primary-button"
                  disabled={!(answers[q.id] || []).length}
                  onClick={goNext}
                >
                  Next
                </button>
              </div>
            </>
          )}

          <button className="go-back-link" onClick={goBack}>
            &larr; Go Back
          </button>
        </div>
      </div>
    )
  }

  // ── Render Stages ──

  return (
    <div className="earthquake-quiz flow-base" ref={containerRef}>
      {/* HOOK */}
      {stage === 'hook' && (
        <div className="quiz-inner">
          <div className="hook-screen">
            <h1 className="hook-title">{HOOK_COPY.title}</h1>
            <div className="hook-lines">
              {HOOK_COPY.lines.map((line, i) =>
                line === '' ? <span key={i} className="line-break" /> : <span key={i}>{line === 'And you still feel stuck.' ? <strong>{line}</strong> : line}<br /></span>
              )}
            </div>
            <p className="hook-tagline">{HOOK_COPY.tagline}</p>
            <p className="hook-tagline"><strong>{HOOK_COPY.taglineBold}</strong></p>
            <p className="hook-meta">{HOOK_COPY.meta}</p>
            <button className="primary-button glow-button" onClick={goNext}>
              {HOOK_COPY.cta}
            </button>
          </div>
        </div>
      )}

      {/* QUESTIONS — one per page */}
      {currentQuestion && renderQuestion(currentQuestion)}

      {/* EMAIL GATE */}
      {stage === 'email_gate' && (
        <div className="quiz-inner">
          <PublicEmailGate
            flowType="earthquake_quiz"
            onEmailSubmit={handleEmailSubmit}
            title="Your results are ready."
            subtitle="We found your loudest Protective Voice and what's actually blocking you. Enter your details to unlock your full report."
          />
          <button className="go-back-link" onClick={goBack}>
            &larr; Go Back
          </button>
        </div>
      )}

      {/* CALCULATING */}
      {stage === 'calculating' && (
        <div className="quiz-inner">
          <div className="calculating-screen">
            <div className="typing-indicator">
              <span /><span /><span />
            </div>
            <div className="calculating-steps">
              {['Reading your responses...', 'Identifying your Protective Voice...', 'Mapping your awakening stage...', 'Generating your report...'].map((text, i) => (
                <div key={i} className={`calc-step ${calcStep >= i ? (calcStep > i ? 'done' : 'active') : ''}`}>
                  {text}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* RESULTS */}
      {stage === 'results' && results && (
        <div className="quiz-inner">
          <EarthquakeResults
            results={results}
            answers={answers}
            email={email}
            onRetake={handleRetake}
          />
        </div>
      )}
    </div>
  )
}
