/**
 * Step1A_BucketSelection - Choose Wealth/Health/Love bucket
 *
 * Features:
 * - AI suggestion based on validation data (if available)
 * - 3 large clickable cards with examples
 * - Auto-advance on selection
 */

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabaseClient'

const BUCKETS = {
  wealth: {
    id: 'wealth',
    emoji: '💰',
    title: 'WEALTH',
    subtitle: '"I want to make more money"',
    examples: [
      'Financial freedom',
      'Passive income',
      'Location independence',
      'Never worry about bills',
      'Quit my job',
      'Build wealth'
    ],
    commonFor: 'Entrepreneurs, creators, freelancers, side-hustlers'
  },
  health: {
    id: 'health',
    emoji: '❤️',
    title: 'HEALTH',
    subtitle: '"I want to feel better"',
    examples: [
      'More energy',
      'Look confident',
      'Better appearance',
      'Eliminate pain',
      'Peak performance',
      'Vitality'
    ],
    commonFor: 'Fitness, wellness, nutrition, biohacking'
  },
  love: {
    id: 'love',
    emoji: '💕',
    title: 'LOVE',
    subtitle: '"I want to love my life"',
    examples: [
      'Wake up excited for the day',
      'Feel deeply connected',
      'Love myself unconditionally',
      'Find my purpose',
      'Experience real joy',
      'Feel truly alive'
    ],
    commonFor: 'Self-love, purpose, passion, connection, fulfillment'
  }
}

function Step1A_BucketSelection({ contextData, onSelect, setIsLoading, setError }) {
  const [aiSuggestion, setAiSuggestion] = useState(null)
  const [showAllCards, setShowAllCards] = useState(false)
  const [selectedBucket, setSelectedBucket] = useState(null)

  // Get AI suggestion if we have context data
  useEffect(() => {
    const getSuggestion = async () => {
      // Only suggest if we have meaningful data
      const hasData = contextData.skills?.length > 0 ||
                     contextData.problems?.length > 0 ||
                     contextData.persona ||
                     contextData.validationData ||
                     contextData.offerBuilderData // V1 data available

      if (!hasData) {
        setShowAllCards(true)
        return
      }

      setIsLoading(true)

      try {
        // Extract V1 foundation data for better bucket suggestion
        const v1Data = contextData.offerBuilderData
        const v1Context = v1Data ? {
          problemArea: v1Data.problem_area,
          niche: v1Data.niche_layers,
          problemReasons: v1Data.problem_reasons,
          coreProduct: v1Data.solutions?.find(s => s.category === 'core_product')
        } : null

        const { data, error } = await supabase.functions.invoke('offer-builder-ai', {
          body: {
            action: 'suggest_bucket',
            context: {
              skills: contextData.skills,
              problems: contextData.problems,
              persona: contextData.persona,
              validationData: contextData.validationData,
              // V1 Offer Builder foundation data
              offerBuilderV1: v1Context
            }
          }
        })

        if (error) throw error

        if (data?.bucket && data?.confidence > 0.8) {
          setAiSuggestion({
            bucket: data.bucket,
            confidence: data.confidence,
            reasoning: data.reasoning
          })
        } else {
          setShowAllCards(true)
        }
      } catch (err) {
        console.error('Error getting bucket suggestion:', err)
        setShowAllCards(true)
      } finally {
        setIsLoading(false)
      }
    }

    getSuggestion()
  }, [contextData, setIsLoading])

  // Handle bucket selection
  const handleSelect = (bucketId, fromSuggestion = false) => {
    setSelectedBucket(bucketId)

    // Small delay for visual feedback
    setTimeout(() => {
      onSelect(
        bucketId,
        fromSuggestion ? aiSuggestion?.confidence : null,
        fromSuggestion
      )
    }, 300)
  }

  // Handle rejecting AI suggestion
  const handleRejectSuggestion = () => {
    setAiSuggestion(null)
    setShowAllCards(true)
  }

  // Show AI suggestion view
  if (aiSuggestion && !showAllCards) {
    const bucket = BUCKETS[aiSuggestion.bucket]

    return (
      <div className="bucket-selection">
        <div className="question-header">
          <span className="step-label">Step 1 of 8</span>
          <h2>What does your customer ultimately want?</h2>
        </div>

        <div className="ai-suggestion">
          <div className="suggestion-header">
            <span className="suggestion-icon">💡</span>
            <span className="suggestion-label">SUGGESTED BUCKET</span>
          </div>

          <p className="suggestion-text">
            Based on your Find My Flow results, we think your offer is in the{' '}
            <strong>{bucket.title} {bucket.emoji}</strong> bucket.
          </p>

          <div className="suggestion-reasoning">
            <strong>Why:</strong> {aiSuggestion.reasoning}
          </div>

          <p className="suggestion-question">Is this correct?</p>

          <div className="suggestion-buttons">
            <button
              className="primary-button"
              onClick={() => handleSelect(aiSuggestion.bucket, true)}
            >
              ✅ Yes, that's right
            </button>
            <button
              className="secondary-button"
              onClick={handleRejectSuggestion}
            >
              No, let me choose
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Check if we have Vibe Rise data to display
  const hasFlowData = contextData.skills?.length > 0 || contextData.problems?.length > 0

  // Check if we have V1 Offer Builder data
  const hasV1Data = contextData.offerBuilderData?.problem_area || contextData.offerBuilderData?.niche_layers

  // Show all bucket cards
  return (
    <div className="bucket-selection">
      <div className="question-header">
        <span className="step-label">Step 1 of 8</span>
        <h2>What does your customer ultimately want?</h2>
        <p className="question-subtitle">
          Every transformation falls into one of three buckets.
          Everything you'll build flows from this choice.
        </p>
      </div>

      {/* Vibe Rise Context Panel */}
      {hasFlowData && (
        <div className="findmyflow-context">
          <div className="context-header">
            <span className="context-icon">🧭</span>
            <span>FROM YOUR FINDMYFLOW</span>
          </div>
          <div className="context-content">
            {contextData.skills?.length > 0 && (
              <div className="context-section">
                <strong>Your skills:</strong>
                <div className="context-tags">
                  {contextData.skills.slice(0, 5).map((skill, i) => (
                    <span key={i} className="context-tag skill-tag">
                      {typeof skill === 'string' ? skill : skill.name || skill.title}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {contextData.problems?.length > 0 && (
              <div className="context-section">
                <strong>Problems you solve:</strong>
                <div className="context-tags">
                  {contextData.problems.slice(0, 5).map((problem, i) => (
                    <span key={i} className="context-tag problem-tag">
                      {typeof problem === 'string' ? problem : problem.name || problem.title}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {contextData.persona && (
              <div className="context-section">
                <strong>Ideal customer:</strong>
                <span className="context-persona">
                  {contextData.persona.name || contextData.persona.description || 'Defined in Find My Flow'}
                </span>
              </div>
            )}
            <p className="context-tip">
              💡 Use these insights to pick the bucket that aligns with your transformation.
            </p>
          </div>
        </div>
      )}

      {/* V1 Offer Builder Context Panel */}
      {hasV1Data && (
        <div className="v1-offer-context">
          <div className="context-header">
            <span className="context-icon">📦</span>
            <span>FROM YOUR OFFER FOUNDATION</span>
          </div>
          <div className="context-content">
            {contextData.offerBuilderData.problem_area && (
              <div className="context-section">
                <strong>Problem area:</strong>
                <span className="context-value">
                  "{contextData.offerBuilderData.problem_area}"
                </span>
              </div>
            )}
            {contextData.offerBuilderData.niche_layers?.what && (
              <div className="context-section">
                <strong>What you do:</strong>
                <span className="context-value">
                  "{contextData.offerBuilderData.niche_layers.what}"
                </span>
              </div>
            )}
            {contextData.offerBuilderData.niche_layers?.who && (
              <div className="context-section">
                <strong>Who you serve:</strong>
                <span className="context-value">
                  "{contextData.offerBuilderData.niche_layers.who}"
                </span>
              </div>
            )}
            <p className="context-tip">
              💡 Your foundation helps us suggest the right bucket for your Grand Slam Offer.
            </p>
          </div>
        </div>
      )}

      <div className="bucket-cards">
        {Object.values(BUCKETS).map(bucket => (
          <button
            key={bucket.id}
            className={`bucket-card ${selectedBucket === bucket.id ? 'selected' : ''}`}
            onClick={() => handleSelect(bucket.id)}
            disabled={selectedBucket !== null}
          >
            <div className="bucket-emoji">{bucket.emoji}</div>
            <div className="bucket-title">{bucket.title}</div>
            <div className="bucket-subtitle">{bucket.subtitle}</div>

            <div className="bucket-examples">
              <strong>Examples:</strong>
              <ul>
                {bucket.examples.map((example, i) => (
                  <li key={i}>{example}</li>
                ))}
              </ul>
            </div>

            <div className="bucket-common">
              Most common for: {bucket.commonFor}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

export default Step1A_BucketSelection
