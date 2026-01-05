/**
 * Step1B_DreamOutcome - Define the customer's dream outcome
 *
 * Features:
 * - Bucket-specific prompts with good/bad examples
 * - Validation data insights panel (if available)
 * - AI validation with 5-criteria scoring
 * - Score threshold of 40/50 to proceed (can continue anyway)
 */

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabaseClient'

// Bucket-specific prompts
const BUCKET_PROMPTS = {
  wealth: {
    title: 'WEALTH 💰',
    focus: 'their financial transformation',
    dreamType: 'WEALTH dream they fantasize about',
    thinkAbout: 'Financial freedom, passive income, location independence',
    examples: {
      bad: [
        { text: 'Make more money', reason: 'too vague' },
        { text: 'Start a business', reason: 'that\'s a vehicle, not outcome' },
        { text: 'Passive income', reason: 'too generic' }
      ],
      good: [
        { text: 'Never stress about bills again', reason: 'emotional outcome' },
        { text: 'Fire my boss and travel the world', reason: 'freedom visualized' },
        { text: '$10K/month from my laptop in Bali', reason: 'specific dream' }
      ]
    }
  },
  health: {
    title: 'HEALTH ❤️',
    focus: 'their physical transformation',
    dreamType: 'HEALTH dream they fantasize about',
    thinkAbout: 'Energy, confidence, appearance, vitality',
    examples: {
      bad: [
        { text: 'Lose weight', reason: 'too generic' },
        { text: 'Get fit', reason: 'vague' },
        { text: 'Six pack abs', reason: 'just appearance' }
      ],
      good: [
        { text: 'Walk into any room feeling confident', reason: 'emotional outcome' },
        { text: 'Play with my kids without getting winded', reason: 'life impact' },
        { text: 'Feel 25 again at 45', reason: 'vitality transformation' }
      ]
    }
  },
  relationships: {
    title: 'RELATIONSHIPS 💕',
    focus: 'their connection transformation',
    dreamType: 'RELATIONSHIP dream they fantasize about',
    thinkAbout: 'Romance, family, friendships, belonging',
    examples: {
      bad: [
        { text: 'Find a girlfriend', reason: 'transaction' },
        { text: 'Better communication', reason: 'skill, not outcome' },
        { text: 'Make friends', reason: 'vague' }
      ],
      good: [
        { text: 'Never eat dinner alone again', reason: 'belonging' },
        { text: 'My kids actually want to talk to me', reason: 'relationship quality' },
        { text: 'Walk into parties and feel wanted', reason: 'social confidence' }
      ]
    }
  }
}

function Step1B_DreamOutcome({ bucket, contextData, onComplete, setIsLoading, setError }) {
  const [dreamOutcome, setDreamOutcome] = useState('')
  const [validation, setValidation] = useState(null)
  const [isValidating, setIsValidating] = useState(false)
  const [aiExample, setAiExample] = useState(null)

  const prompt = BUCKET_PROMPTS[bucket]
  const hasValidationData = contextData.validationData &&
    (contextData.validationData.mainPainPoint ||
     contextData.validationData.desiredOutcome)

  // Generate AI example based on validation data
  useEffect(() => {
    const generateExample = async () => {
      if (!hasValidationData) return

      try {
        const { data, error } = await supabase.functions.invoke('offer-builder-ai', {
          body: {
            action: 'generate_dream_example',
            context: {
              bucket,
              validationData: contextData.validationData
            }
          }
        })

        if (!error && data?.example) {
          setAiExample(data.example)
        }
      } catch (err) {
        console.error('Error generating example:', err)
      }
    }

    generateExample()
  }, [bucket, contextData.validationData, hasValidationData])

  // Validate the dream outcome
  const handleValidate = async () => {
    if (dreamOutcome.trim().length < 20) {
      setError('Please write at least 20 characters to describe the dream outcome.')
      return
    }

    setIsValidating(true)
    setValidation(null)

    try {
      const { data, error } = await supabase.functions.invoke('offer-builder-ai', {
        body: {
          action: 'validate_dream_outcome',
          context: {
            bucket,
            dreamOutcome: dreamOutcome.trim(),
            persona: contextData.persona,
            validationData: contextData.validationData
          }
        }
      })

      if (error) throw error

      setValidation(data)

      // If approved (score >= 40), auto-advance after showing success
      if (data.approved) {
        setTimeout(() => {
          onComplete(dreamOutcome.trim(), Math.round(data.total_score / 5))
        }, 2000)
      }
    } catch (err) {
      console.error('Error validating dream outcome:', err)
      setError('Validation failed. You can continue anyway or try again.')
    } finally {
      setIsValidating(false)
    }
  }

  // Continue anyway (even with low score)
  const handleContinueAnyway = () => {
    onComplete(
      dreamOutcome.trim(),
      validation ? Math.round(validation.total_score / 5) : 5
    )
  }

  return (
    <div className="dream-outcome-step">
      <div className="question-header">
        <span className="step-label">Step 1 of 8 (continued)</span>
        <h2>What's {prompt.focus}?</h2>
      </div>

      <div className="bucket-confirmation">
        Perfect! You're in the <strong>{prompt.title}</strong> bucket.
      </div>

      <p className="question-prompt">
        Now let's get specific. What's the <strong>{prompt.dreamType}</strong>?
      </p>

      <p className="think-about">
        Think: {prompt.thinkAbout}
      </p>

      {/* Examples panel */}
      <div className="examples-panel">
        <div className="examples-column bad">
          <h4>❌ Bad Examples</h4>
          {prompt.examples.bad.map((ex, i) => (
            <div key={i} className="example">
              <span className="example-text">"{ex.text}"</span>
              <span className="example-reason">({ex.reason})</span>
            </div>
          ))}
        </div>
        <div className="examples-column good">
          <h4>✅ Good Examples</h4>
          {prompt.examples.good.map((ex, i) => (
            <div key={i} className="example">
              <span className="example-text">"{ex.text}"</span>
              <span className="example-reason">({ex.reason})</span>
            </div>
          ))}
        </div>
      </div>

      {/* Validation data insights */}
      {hasValidationData && (
        <div className="validation-insights">
          <div className="insights-header">
            <span className="insights-icon">💡</span>
            <span>INSIGHTS FROM YOUR VALIDATION SURVEY</span>
          </div>
          <div className="insights-content">
            {contextData.validationData.mainPainPoint && (
              <p>
                <strong>Main pain:</strong><br />
                "{contextData.validationData.mainPainPoint}"
              </p>
            )}
            {contextData.validationData.desiredOutcome && (
              <p>
                <strong>They want:</strong><br />
                "{contextData.validationData.desiredOutcome}"
              </p>
            )}
            {contextData.validationData.languageUsed && (
              <p>
                <strong>Language they use:</strong><br />
                {Array.isArray(contextData.validationData.languageUsed)
                  ? contextData.validationData.languageUsed.slice(0, 3).map((word, i) => (
                      <span key={i} className="language-tag">{word}</span>
                    ))
                  : contextData.validationData.languageUsed
                }
              </p>
            )}
            <p className="insights-tip">
              💡 <strong>TIP:</strong> Try using THEIR words in your dream outcome for better resonance.
            </p>
            {aiExample && (
              <p className="ai-example">
                <strong>Example based on your data:</strong><br />
                "{aiExample}"
              </p>
            )}
          </div>
        </div>
      )}

      {/* Dream outcome input */}
      <div className="dream-input-group">
        <label htmlFor="dreamOutcome">What's THEIR {bucket} dream?</label>
        <textarea
          id="dreamOutcome"
          value={dreamOutcome}
          onChange={(e) => setDreamOutcome(e.target.value)}
          placeholder={`Describe their dream outcome in the ${bucket} bucket...`}
          rows={4}
          maxLength={500}
          disabled={isValidating}
        />
        <div className="char-count">
          {dreamOutcome.length}/500 characters (min 20)
        </div>
      </div>

      {/* Validation feedback */}
      {validation && (
        <div className={`validation-feedback ${validation.approved ? 'approved' : 'needs-work'}`}>
          {validation.approved ? (
            <>
              <div className="feedback-header success">
                <span className="feedback-icon">✅</span>
                <span>Strong Dream Outcome!</span>
              </div>
              <div className="feedback-score">
                Your score: {validation.total_score}/50
              </div>
              <div className="feedback-breakdown">
                <div className="score-item">✓ Emotional: {validation.emotional_score}/10</div>
                <div className="score-item">✓ Specific: {validation.specific_score}/10</div>
                <div className="score-item">✓ Aspirational: {validation.aspirational_score}/10</div>
                <div className="score-item">✓ Bucket Alignment: {validation.bucket_alignment_score}/10</div>
                <div className="score-item">✓ Language Match: {validation.language_match_score}/10</div>
              </div>
              <p className="feedback-message">Moving to next step...</p>
            </>
          ) : (
            <>
              <div className="feedback-header warning">
                <span className="feedback-icon">⚠️</span>
                <span>Let's strengthen this outcome</span>
              </div>
              <div className="feedback-score">
                Your score: {validation.total_score}/50
              </div>
              <div className="feedback-breakdown">
                <div className={`score-item ${validation.emotional_score >= 7 ? 'pass' : 'warn'}`}>
                  {validation.emotional_score >= 7 ? '✓' : '⚠️'} Emotional: {validation.emotional_score}/10
                </div>
                <div className={`score-item ${validation.specific_score >= 7 ? 'pass' : 'warn'}`}>
                  {validation.specific_score >= 7 ? '✓' : '⚠️'} Specific: {validation.specific_score}/10
                </div>
                <div className={`score-item ${validation.aspirational_score >= 7 ? 'pass' : 'warn'}`}>
                  {validation.aspirational_score >= 7 ? '✓' : '⚠️'} Aspirational: {validation.aspirational_score}/10
                </div>
                <div className={`score-item ${validation.bucket_alignment_score >= 7 ? 'pass' : 'warn'}`}>
                  {validation.bucket_alignment_score >= 7 ? '✓' : '⚠️'} Bucket Alignment: {validation.bucket_alignment_score}/10
                </div>
                <div className={`score-item ${validation.language_match_score >= 7 ? 'pass' : 'warn'}`}>
                  {validation.language_match_score >= 7 ? '✓' : '⚠️'} Language Match: {validation.language_match_score}/10
                </div>
              </div>
              {validation.feedback && (
                <div className="feedback-detail">
                  {validation.feedback}
                </div>
              )}
              <div className="feedback-actions">
                <button
                  className="secondary-button"
                  onClick={() => setValidation(null)}
                >
                  Revise Answer
                </button>
                <button
                  className="primary-button"
                  onClick={handleContinueAnyway}
                >
                  Continue Anyway
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Submit button */}
      {!validation && (
        <button
          className="primary-button"
          onClick={handleValidate}
          disabled={dreamOutcome.trim().length < 20 || isValidating}
        >
          {isValidating ? (
            <>
              <span className="spinner-inline"></span>
              Validating...
            </>
          ) : (
            'Continue →'
          )}
        </button>
      )}
    </div>
  )
}

export default Step1B_DreamOutcome
