/**
 * AppBuildChallenge.jsx — Challenge viewer for Build Your App flow
 *
 * Recursive renderer for deeply nested challenge content:
 * steps → substeps → prompts → info boxes → checkboxes.
 *
 * Route: /create/build-app/challenge/:number
 */

import { useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getChallenge } from '../../data/appBuildChallenges'
import useAppBuildData from '../../hooks/useAppBuildData'
import './AppBuildChallenge.css'

// ─── Inline markdown: render **bold** spans ───────────────────────

function renderMarkdown(text) {
  if (!text) return null
  const parts = text.split(/(\*\*[^*]+\*\*)/)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    return part
  })
}

// ─── Copy-to-clipboard prompt block ───────────────────────────────

function PromptBlock({ prompt }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(prompt.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const ta = document.createElement('textarea')
      ta.value = prompt.content
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [prompt.content])

  return (
    <div className="prompt-block">
      <div className="prompt-header">
        <span className="prompt-instruction">{prompt.instruction}</span>
        <button
          className={`copy-btn${copied ? ' copied' : ''}`}
          onClick={handleCopy}
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <div className="prompt-content">{prompt.content}</div>
    </div>
  )
}

// ─── Info box ─────────────────────────────────────────────────────

function InfoBox({ info }) {
  // Split on newlines so multi-line info content renders with line breaks
  const lines = (info.content || '').split('\n')
  return (
    <div className="info-box">
      <h4>{info.title}</h4>
      <div className="info-box-content">
        {lines.map((line, i) => (
          <p key={i}>{renderMarkdown(line)}</p>
        ))}
      </div>
    </div>
  )
}

// ─── Substep renderer ─────────────────────────────────────────────

function Substep({ substep }) {
  return (
    <div className="substep">
      <h4 className="substep-title">{substep.id}. {substep.title}</h4>

      {substep.content && (
        <p className="substep-content">{renderMarkdown(substep.content)}</p>
      )}

      {substep.items?.length > 0 && (
        <ul className="substep-items">
          {substep.items.map((item, i) => (
            <li key={i}>{renderMarkdown(item)}</li>
          ))}
        </ul>
      )}

      {substep.prompt && <PromptBlock prompt={substep.prompt} />}
      {substep.info_box && <InfoBox info={substep.info_box} />}

      {substep.follow_up && (
        <p className="follow-up">{substep.follow_up}</p>
      )}
    </div>
  )
}

// ─── Step accordion item ──────────────────────────────────────────

function StepItem({ step }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="step-item">
      <div className="step-header" onClick={() => setOpen(v => !v)}>
        <div className="step-number">{step.step}</div>
        <div className="step-meta">
          <div className="step-title">{step.title}</div>
          <div className="step-duration">{step.duration}</div>
        </div>
        <span className={`step-chevron${open ? ' open' : ''}`}>▼</span>
      </div>

      <div className={`step-body${open ? ' expanded' : ''}`}>
        {step.content && (
          <p className="step-content">{renderMarkdown(step.content)}</p>
        )}

        {step.substeps?.map(sub => (
          <Substep key={sub.id} substep={sub} />
        ))}

        {step.prompt && <PromptBlock prompt={step.prompt} />}
      </div>
    </div>
  )
}

// ─── Feedback form (Challenge 5) ──────────────────────────────────

function FeedbackForm({ challenge, onSave }) {
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)

  function updateAnswer(id, value) {
    setAnswers(prev => ({ ...prev, [id]: value }))
  }

  async function handleSubmit() {
    if (onSave) await onSave(answers)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="feedback-intro">
        <h2>{challenge.completion?.title || 'Thank You!'}</h2>
        <p>{challenge.completion?.content || 'Your feedback has been saved.'}</p>
      </div>
    )
  }

  return (
    <>
      {challenge.intro && (
        <div className="feedback-intro">
          <h2>{challenge.intro.title}</h2>
          <p>{challenge.intro.content}</p>
        </div>
      )}

      <div className="feedback-form">
        {challenge.feedback_questions.map(q => (
          <div key={q.id} className="feedback-field">
            <label htmlFor={`feedback-${q.id}`}>
              {q.label}
              {q.required && <span className="required-star">*</span>}
            </label>
            {q.type === 'textarea' ? (
              <textarea
                id={`feedback-${q.id}`}
                placeholder={q.placeholder}
                value={answers[q.id] || ''}
                onChange={e => updateAnswer(q.id, e.target.value)}
              />
            ) : (
              <input
                id={`feedback-${q.id}`}
                type={q.type === 'url' ? 'url' : 'text'}
                placeholder={q.placeholder}
                value={answers[q.id] || ''}
                onChange={e => updateAnswer(q.id, e.target.value)}
              />
            )}
          </div>
        ))}
        <button className="feedback-submit" onClick={handleSubmit}>
          Submit Feedback
        </button>
      </div>
    </>
  )
}

// ─── Main component ───────────────────────────────────────────────

export default function AppBuildChallenge() {
  const { number } = useParams()
  const navigate = useNavigate()
  const challengeNumber = parseInt(number, 10)
  const challenge = getChallenge(challengeNumber)
  const { loading, isChecked, toggleCheckbox, getProgress, isUnlocked, saveFeedback } = useAppBuildData()

  if (loading) {
    return (
      <div className="app-build-challenge">
        <div className="loading-state">Loading challenge...</div>
      </div>
    )
  }

  if (!challenge) {
    return (
      <div className="app-build-challenge">
        <div className="not-found">
          <h2>Challenge not found</h2>
          <p>This challenge doesn't exist yet.</p>
        </div>
      </div>
    )
  }

  const progressPercent = getProgress(challengeNumber)
  const unlocked = isUnlocked(challengeNumber)

  return (
    <div className="app-build-challenge">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="challenge-header">
        <button className="back-btn" onClick={() => navigate('/create/build-app')}>
          ← Back
        </button>

        <div className="challenge-title-row">
          <span className="challenge-emoji">{challenge.emoji}</span>
          <h1 className="challenge-title">{challenge.title}</h1>
          <span className="duration-badge">{challenge.duration}</span>
        </div>

        <div className="progress-bar-container">
          <div className="progress-label">{progressPercent}% complete</div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      </div>

      {/* ── Objective ──────────────────────────────────────── */}
      <div className="objective-section">
        <p>{challenge.objective}</p>
      </div>

      {/* ── LEGO Parallel ──────────────────────────────────── */}
      {challenge.lego_parallel && (
        <div className="card lego-card">
          <div className="card-icon">🧱</div>
          <h3>{challenge.lego_parallel.title}</h3>
          <p>{challenge.lego_parallel.description}</p>
        </div>
      )}

      {/* ── Learning Outcomes ──────────────────────────────── */}
      {challenge.learning_outcomes?.length > 0 && (
        <>
          <h2 className="section-heading">What you'll learn</h2>
          <ul className="outcomes-list">
            {challenge.learning_outcomes.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </>
      )}

      {/* ── Tools ──────────────────────────────────────────── */}
      {challenge.tools?.length > 0 && (
        <>
          <h2 className="section-heading">Tools needed</h2>
          <div className="tools-row">
            {challenge.tools.map((tool, i) => (
              <div key={i} className="tool-pill">
                <span className="tool-name">{tool.name}</span>
                <span className="tool-desc">{tool.description}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Outcomes / Deliverables ────────────────────────── */}
      {challenge.outcomes?.length > 0 && (
        <>
          <h2 className="section-heading">What you'll have</h2>
          <ul className="deliverables-list">
            {challenge.outcomes.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </>
      )}

      {/* ── Feedback Form (Challenge 5) or Steps ──────────── */}
      {challenge.is_feedback ? (
        <FeedbackForm challenge={challenge} onSave={(data) => saveFeedback(challengeNumber, data)} />
      ) : (
        challenge.steps?.length > 0 && (
          <div className="steps-section">
            <h2 className="section-heading">Steps</h2>
            {challenge.steps.map(step => (
              <StepItem key={step.step} step={step} />
            ))}
          </div>
        )
      )}

      {/* ── Checkboxes ─────────────────────────────────────── */}
      {challenge.checkboxes?.length > 0 && (
        <div className="checkboxes-section">
          <h2 className="section-heading">Completion checklist</h2>
          {challenge.checkboxes.map(cb => {
            const checked = isChecked(challengeNumber, cb.id)
            return (
              <div
                key={cb.id}
                className={`checkbox-item${checked ? ' done' : ''}`}
                onClick={() => toggleCheckbox(challengeNumber, cb.id)}
              >
                <div className={`checkbox-box${checked ? ' checked' : ''}`}>
                  <span className="check-icon">✓</span>
                </div>
                <span className="checkbox-label">{cb.label}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
