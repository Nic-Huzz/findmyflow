/**
 * GroanCompletionFlow.jsx
 * Multi-step challenge completion modal
 *
 * Steps:
 * 1. Emotional check-in (scary/wahoo scores after)
 * 2. Reflection text
 * 3. Proof collection (optional)
 * 4. Contract evidence (if linked to NS belief)
 * 5. Success celebration
 */

import { useState, useRef } from 'react'
import { calculateEssenceZone } from '../lib/stageConfig'
import {
  completeGroanChallenge,
  addGroanProof,
  uploadProofScreenshot,
  addContractEvidence
} from '../lib/crm'
import './GroanCompletionFlow.css'

const REFLECTION_PROMPTS = [
  'What surprised me...',
  'I learned that...',
  'It felt...',
  'Next time I would...',
  'The hardest part was...'
]

function GroanCompletionFlow({
  challenge,
  userId,
  onComplete,
  onClose,
  linkedContract = null // { id, belief_text }
}) {
  const [step, setStep] = useState(1)
  const [scaryScoreAfter, setScaryScoreAfter] = useState(challenge?.scary_score || 5)
  const [wahooScoreAfter, setWahooScoreAfter] = useState(challenge?.wahoo_score || 5)
  const [reflectionText, setReflectionText] = useState('')
  const [proofType, setProofType] = useState(null)
  const [proofValue, setProofValue] = useState('')
  const [proofFile, setProofFile] = useState(null)
  const [proofPreview, setProofPreview] = useState(null)
  const [contractEvidence, setContractEvidence] = useState('')
  const [saving, setSaving] = useState(false)
  const [completed, setCompleted] = useState(false)

  const fileInputRef = useRef(null)

  const totalSteps = linkedContract ? 4 : 3

  // Calculate essence zone from after scores
  const essenceZoneAfter = calculateEssenceZone(scaryScoreAfter, wahooScoreAfter)
  const wasEssenceZone = challenge?.essence_zone === 'essence'
  const isNowEssenceZone = essenceZoneAfter.zone === 'essence'

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setProofFile(file)
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => setProofPreview(e.target.result)
      reader.readAsDataURL(file)
    }
  }

  // Handle reflection prompt click
  const handlePromptClick = (prompt) => {
    setReflectionText(prev => prev ? `${prev}\n${prompt}` : prompt)
  }

  // Submit completion
  const handleSubmit = async () => {
    setSaving(true)

    try {
      // 1. Complete the challenge
      await completeGroanChallenge(challenge.id, {
        reflectionText,
        scaryScoreAfter,
        wahooScoreAfter
      })

      // 2. Add proof if provided
      if (proofType === 'screenshot' && proofFile) {
        await uploadProofScreenshot(challenge.id, userId, proofFile)
      } else if (proofType === 'link' && proofValue) {
        await addGroanProof({
          challengeId: challenge.id,
          userId,
          proofType: 'link',
          proofUrl: proofValue
        })
      } else if (proofType === 'text' && proofValue) {
        await addGroanProof({
          challengeId: challenge.id,
          userId,
          proofType: 'text',
          proofText: proofValue
        })
      }

      // 3. Add contract evidence if provided
      if (linkedContract && contractEvidence) {
        await addContractEvidence({
          challengeId: challenge.id,
          userId,
          contractId: linkedContract.id,
          beliefText: linkedContract.belief_text,
          evidenceText: contractEvidence
        })
      }

      setCompleted(true)
      setStep(totalSteps + 1) // Go to success screen

      if (onComplete) {
        onComplete({
          challengeId: challenge.id,
          scaryScoreAfter,
          wahooScoreAfter,
          reflectionText,
          hasProof: !!proofType,
          hasContractEvidence: !!contractEvidence
        })
      }
    } catch (error) {
      console.error('Error completing challenge:', error)
    } finally {
      setSaving(false)
    }
  }

  // Render step content
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <>
            <div className="groan-completion-section">
              <div className="groan-completion-section-title">
                <span>😰</span> How scary was it actually?
              </div>
              <div className="groan-emotional-checkin">
                <div className="groan-score-input">
                  <label>Fear Level</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={scaryScoreAfter}
                    onChange={(e) => setScaryScoreAfter(Number(e.target.value))}
                    className="groan-score-slider scary"
                  />
                  <div className="groan-score-display">
                    <span className={`groan-score-current scary`}>
                      {scaryScoreAfter}/10
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      Before: {challenge?.scary_score || '?'}
                    </span>
                  </div>
                </div>
                <div className="groan-score-input">
                  <label>Excitement Level</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={wahooScoreAfter}
                    onChange={(e) => setWahooScoreAfter(Number(e.target.value))}
                    className="groan-score-slider wahoo"
                  />
                  <div className="groan-score-display">
                    <span className={`groan-score-current wahoo`}>
                      {wahooScoreAfter}/10
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      Before: {challenge?.wahoo_score || '?'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Essence zone insight */}
            {isNowEssenceZone && (
              <div className="groan-completion-insight">
                <div className="groan-completion-insight-icon">✨</div>
                <p className="groan-completion-insight-text">
                  High fear + high excitement = <strong>Essence Zone</strong>.
                  This is who you really are trying to emerge. The fear is just
                  old trauma around expressing your authentic self.
                </p>
              </div>
            )}
          </>
        )

      case 2:
        return (
          <div className="groan-completion-section">
            <div className="groan-completion-section-title">
              <span>💭</span> Reflect on the experience
            </div>
            <textarea
              className="groan-reflection-textarea"
              value={reflectionText}
              onChange={(e) => setReflectionText(e.target.value)}
              placeholder="What happened? How did it feel? What did you learn?"
            />
            <div className="groan-reflection-prompts">
              {REFLECTION_PROMPTS.map(prompt => (
                <span
                  key={prompt}
                  className="groan-reflection-prompt"
                  onClick={() => handlePromptClick(prompt)}
                >
                  {prompt}
                </span>
              ))}
            </div>
          </div>
        )

      case 3:
        return (
          <div className="groan-completion-section">
            <div className="groan-completion-section-title">
              <span>📸</span> Add proof (optional)
            </div>
            <div className="groan-proof-options">
              <div
                className={`groan-proof-option ${proofType === 'screenshot' ? 'active' : ''}`}
                onClick={() => setProofType('screenshot')}
              >
                <span className="groan-proof-option-icon">📷</span>
                <span className="groan-proof-option-label">Screenshot</span>
              </div>
              <div
                className={`groan-proof-option ${proofType === 'link' ? 'active' : ''}`}
                onClick={() => setProofType('link')}
              >
                <span className="groan-proof-option-icon">🔗</span>
                <span className="groan-proof-option-label">Link</span>
              </div>
              <div
                className={`groan-proof-option ${proofType === 'text' ? 'active' : ''}`}
                onClick={() => setProofType('text')}
              >
                <span className="groan-proof-option-icon">📝</span>
                <span className="groan-proof-option-label">Note</span>
              </div>
            </div>

            {proofType && (
              <div className="groan-proof-input">
                {proofType === 'screenshot' && (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="groan-proof-file-input"
                    />
                    <label
                      className="groan-proof-file-label"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {proofPreview ? (
                        <img
                          src={proofPreview}
                          alt="Preview"
                          className="groan-proof-preview"
                        />
                      ) : (
                        <>
                          <span style={{ fontSize: '2rem' }}>📤</span>
                          <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                            Tap to upload screenshot
                          </span>
                        </>
                      )}
                    </label>
                  </>
                )}
                {proofType === 'link' && (
                  <input
                    type="url"
                    className="groan-proof-link-input"
                    value={proofValue}
                    onChange={(e) => setProofValue(e.target.value)}
                    placeholder="https://..."
                  />
                )}
                {proofType === 'text' && (
                  <textarea
                    className="groan-proof-text-input"
                    value={proofValue}
                    onChange={(e) => setProofValue(e.target.value)}
                    placeholder="Describe what happened..."
                    style={{ minHeight: '80px' }}
                  />
                )}
              </div>
            )}
          </div>
        )

      case 4:
        if (!linkedContract) return null
        return (
          <div className="groan-completion-section">
            <div className="groan-contract-section">
              <div className="groan-contract-label">NS Contract / Limiting Belief</div>
              <p className="groan-contract-belief">"{linkedContract.belief_text}"</p>

              <div className="groan-completion-section-title" style={{ marginTop: '1rem' }}>
                <span>💡</span> How did this challenge disprove that belief?
              </div>
              <textarea
                className="groan-contract-evidence-input"
                value={contractEvidence}
                onChange={(e) => setContractEvidence(e.target.value)}
                placeholder="What evidence does this experience provide that the belief isn't true?"
              />
            </div>
          </div>
        )

      default:
        // Success screen
        return (
          <div className="groan-completion-success">
            <div className="groan-completion-success-icon">🎉</div>
            <h3 className="groan-completion-success-title">Challenge Completed!</h3>
            <p className="groan-completion-success-message">
              You pushed past your comfort zone. That takes real courage.
            </p>

            <div className="groan-completion-success-stats">
              <div className="groan-completion-success-stat">
                <div className="groan-completion-success-stat-value">
                  {scaryScoreAfter < challenge?.scary_score ? '↓' : scaryScoreAfter > challenge?.scary_score ? '↑' : '='} {scaryScoreAfter}
                </div>
                <div className="groan-completion-success-stat-label">Fear After</div>
              </div>
              <div className="groan-completion-success-stat">
                <div className="groan-completion-success-stat-value">
                  {wahooScoreAfter > challenge?.wahoo_score ? '↑' : wahooScoreAfter < challenge?.wahoo_score ? '↓' : '='} {wahooScoreAfter}
                </div>
                <div className="groan-completion-success-stat-label">Excitement After</div>
              </div>
            </div>

            {isNowEssenceZone && (
              <div className="groan-completion-insight" style={{ textAlign: 'left' }}>
                <p className="groan-completion-insight-text">
                  <strong>Essence Zone confirmed!</strong> This high fear + high excitement
                  combination shows this is deeply connected to who you really are.
                </p>
              </div>
            )}
          </div>
        )
    }
  }

  // Render navigation
  const renderNavigation = () => {
    if (completed) {
      return (
        <div className="groan-completion-nav">
          <button
            className="groan-completion-nav-btn next"
            onClick={onClose}
          >
            Done
          </button>
        </div>
      )
    }

    const isLastStep = step === totalSteps

    return (
      <div className="groan-completion-nav">
        {step > 1 && (
          <button
            className="groan-completion-nav-btn back"
            onClick={() => setStep(step - 1)}
          >
            Back
          </button>
        )}
        {isLastStep ? (
          <button
            className="groan-completion-nav-btn complete"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Complete Challenge'}
          </button>
        ) : (
          <button
            className="groan-completion-nav-btn next"
            onClick={() => setStep(step + 1)}
          >
            Next
          </button>
        )}
      </div>
    )
  }

  if (!challenge) return null

  return (
    <div className="groan-completion-overlay" onClick={onClose}>
      <div
        className="groan-completion-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="groan-completion-header">
          <div className="groan-completion-icon">
            {completed ? '🎉' : '💪'}
          </div>
          <h2 className="groan-completion-title">
            {completed ? 'You Did It!' : 'Complete Challenge'}
          </h2>
          <p className="groan-completion-subtitle">
            {completed ? challenge.title : `Let's capture your experience`}
          </p>
        </div>

        {/* Step indicator */}
        {!completed && (
          <div className="groan-completion-steps">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`groan-completion-step ${
                  i + 1 === step ? 'active' : ''
                } ${i + 1 < step ? 'completed' : ''}`}
              />
            ))}
          </div>
        )}

        <div className="groan-completion-body">
          {renderStepContent()}
          {renderNavigation()}
        </div>
      </div>
    </div>
  )
}

export default GroanCompletionFlow
