import { useState } from 'react'

export default function FollowUpQuestions({ stuckPoint, founderName, onComplete, onBack }) {
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState([])
  const [openText, setOpenText] = useState('')
  const [showTextBox, setShowTextBox] = useState(false)

  const questions = stuckPoint.followUpQuestions
  const isLastQuestion = currentQ >= questions.length

  const handleSelect = (optionIdx) => {
    const newAnswers = [...answers, optionIdx]
    setAnswers(newAnswers)

    if (currentQ + 1 >= questions.length) {
      setCurrentQ(questions.length)
    } else {
      setCurrentQ((prev) => prev + 1)
    }
  }

  // Open text screen (after all MCQs)
  if (isLastQuestion) {
    return (
      <>
        <div className="pp-progress-bar">
          <div className="pp-progress-bar-fill" style={{ width: '100%' }} />
        </div>

        <div className="pp-fade-in-up" style={{ textAlign: 'center', marginBottom: 28 }}>
          <h2>Anything else {founderName} should know?</h2>
          <p className="pp-subtitle">
            Share more context about your situation. This helps personalise your profile. (Optional)
          </p>
        </div>

        {!showTextBox ? (
          <div className="pp-fade-in-up pp-stagger-2" style={{ textAlign: 'center', marginBottom: 32 }}>
            <button
              className="pp-btn-ghost"
              onClick={() => setShowTextBox(true)}
              style={{ width: 'auto', padding: '12px 24px' }}
            >
              + Add context
            </button>
          </div>
        ) : (
          <div className="pp-fade-in-up" style={{ marginBottom: 24 }}>
            <textarea
              className="pp-textarea"
              rows={4}
              value={openText}
              onChange={(e) => setOpenText(e.target.value)}
              placeholder={`E.g. "I've been building for 6 months and can't seem to get traction..."`}
              autoFocus
            />
          </div>
        )}

        <button className="pp-btn-gold" onClick={() => onComplete(answers, openText)}>
          Show me what {founderName} would do
        </button>

        <div style={{ marginTop: 16 }}>
          <button
            className="pp-back-link"
            onClick={() => {
              setAnswers((prev) => prev.slice(0, -1))
              setCurrentQ(questions.length - 1)
            }}
          >
            ← Back
          </button>
        </div>
      </>
    )
  }

  const q = questions[currentQ]
  const progressPercent = ((currentQ + 1) / (questions.length + 1)) * 100

  return (
    <>
      <div className="pp-progress-bar">
        <div className="pp-progress-bar-fill" style={{ width: `${progressPercent}%` }} />
      </div>

      <div className="pp-fade-in-up" style={{ marginBottom: 4 }}>
        <div className="pp-followup-label">
          {stuckPoint.name} · Question {currentQ + 1} of {questions.length}
        </div>
        <h2>{q.question.replace('{founderName}', founderName || 'your founder')}</h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {q.options.map((option, i) => (
          <div
            key={i}
            className={`pp-selectable-card pp-fade-in-up pp-stagger-${i + 1}`}
            onClick={() => handleSelect(i)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), handleSelect(i))}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <span className="pp-option-letter">{String.fromCharCode(65 + i)}</span>
              <span className="pp-option-text">{option}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16 }}>
        <button
          className="pp-back-link"
          onClick={() => {
            if (currentQ === 0) {
              onBack()
            } else {
              setAnswers((prev) => prev.slice(0, -1))
              setCurrentQ((prev) => prev - 1)
            }
          }}
        >
          ← Back
        </button>
      </div>
    </>
  )
}
