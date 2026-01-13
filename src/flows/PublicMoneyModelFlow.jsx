/**
 * PublicMoneyModelFlow - Public version of Money Model flows (no auth required)
 *
 * Used as lead magnets - captures email before showing results.
 */

import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { BackButton, ProgressDots } from '../components/MoneyModelShared'
import { FlowFeedback } from '../components/FlowFeedback'
import PublicEmailGate from '../components/PublicEmailGate'
import PublicFlowCTA from '../components/PublicFlowCTA'
import DownloadResultsButton from '../components/DownloadResultsButton'
import { STAGES, MONEY_MODEL_CONFIGS } from './moneyModelConfigs'
import { generateMoneyModelPdf, downloadResultsPdf } from '../lib/pdfGenerator'
import { extractMoneyModelTokens } from '../lib/emailPersonalization'
import {
  trackFlowStarted,
  trackFlowProgress50,
  trackFlowCompleted,
  trackEmailCaptured
} from '../lib/pixelTracking'

// Map URL params to config keys
const FLOW_TYPE_MAP = {
  'attraction': 'attractionOffer',
  'upsell': 'upsell',
  'downsell': 'downsell',
  'continuity': 'continuity',
  'leads': 'leadsStrategy',
  'lead-magnet': 'leadMagnet'
}

export default function PublicMoneyModelFlow() {
  const { flowType } = useParams()
  const configKey = FLOW_TYPE_MAP[flowType] || 'attractionOffer'
  const config = MONEY_MODEL_CONFIGS[configKey]

  // Session management (no auth)
  const [sessionToken] = useState(() => {
    const existing = sessionStorage.getItem('publicFlowSession')
    if (existing) return existing
    const token = crypto.randomUUID()
    sessionStorage.setItem('publicFlowSession', token)
    return token
  })

  // Core state
  const [stage, setStage] = useState(STAGES.TIME_CHECK)
  const [questionsData, setQuestionsData] = useState(null)
  const [offersData, setOffersData] = useState(null)
  const [answers, setAnswers] = useState({})
  const [recommendedOffer, setRecommendedOffer] = useState(null)
  const [allOfferScores, setAllOfferScores] = useState([])
  const [error, setError] = useState(null)
  const [showAllOptions, setShowAllOptions] = useState(false)

  // Email gate state
  const [email, setEmail] = useState(null)
  const [showEmailGate, setShowEmailGate] = useState(false)

  // Question stages array
  const questionStages = [
    STAGES.Q1, STAGES.Q2, STAGES.Q3, STAGES.Q4, STAGES.Q5,
    STAGES.Q6, STAGES.Q7, STAGES.Q8, STAGES.Q9, STAGES.Q10
  ]

  // Load questions and offers JSON
  useEffect(() => {
    const loadData = async () => {
      try {
        const [questionsRes, offersRes] = await Promise.all([
          fetch(config.questionsPath),
          fetch(config.offersPath)
        ])

        if (!questionsRes.ok || !offersRes.ok) {
          throw new Error('Failed to load assessment data')
        }

        const questionsJson = await questionsRes.json()
        const offersJson = await offersRes.json()

        setQuestionsData(questionsJson)
        setOffersData(Array.isArray(offersJson) ? offersJson : offersJson.offers)
      } catch (err) {
        setError(`Failed to load assessment: ${err.message}`)
      }
    }
    loadData()
  }, [config.questionsPath, config.offersPath])

  // Calculate offer scores from answers
  const calculateOfferScores = (userAnswers) => {
    if (!offersData) return []

    const scores = offersData.map(offer => {
      let totalScore = 0
      const maxPossibleScore = offer.max_possible_score || 30

      Object.entries(userAnswers).forEach(([questionId, answer]) => {
        const normalizedQuestionId = questionId.replace(/^q(\d+)/, 'Q$1')
        const weights = offer.scoring_weights?.[normalizedQuestionId]
        if (weights && weights[answer.value] !== undefined) {
          totalScore += weights[answer.value]
        }
      })

      let isDisqualified = false
      let disqualificationReasons = []
      const disqualifiers = offer.hard_disqualifiers || offer.eligibility_rules?.hard_disqualifiers || []
      if (disqualifiers.length > 0) {
        disqualifiers.forEach(rule => {
          const fieldName = rule.field.toLowerCase()
          const matchingKey = Object.keys(userAnswers).find(key =>
            key.endsWith('_' + fieldName)
          )
          const fieldAnswer = matchingKey ? userAnswers[matchingKey] : null
          if (fieldAnswer && rule.disallowed.includes(fieldAnswer.value)) {
            isDisqualified = true
            disqualificationReasons.push(rule.reason || `Disqualified due to ${rule.field}`)
          }
        })
      }

      const confidence = totalScore / maxPossibleScore

      return {
        offer,
        totalScore,
        maxPossibleScore,
        confidence,
        isDisqualified,
        disqualificationReasons
      }
    })

    return scores.sort((a, b) => {
      if (a.isDisqualified && !b.isDisqualified) return 1
      if (!a.isDisqualified && b.isDisqualified) return -1
      return b.totalScore - a.totalScore
    })
  }

  // Handle option selection
  const handleOptionSelect = (questionId, option) => {
    const newAnswers = {
      ...answers,
      [questionId]: { value: option.value, label: option.label }
    }
    setAnswers(newAnswers)

    const currentIndex = questionStages.indexOf(stage)

    // Track progress at 50% (Q5)
    if (currentIndex === 4) {
      trackFlowProgress50(config.flowType)
    }

    if (currentIndex < questionStages.length - 1) {
      setStage(questionStages[currentIndex + 1])
    } else {
      // Questions complete - show email gate before results
      setShowEmailGate(true)
    }
  }

  // Handle email submission - calculate and show results
  const handleEmailSubmit = async (submittedEmail) => {
    setEmail(submittedEmail)
    setShowEmailGate(false)
    setStage(STAGES.CALCULATING)

    // Track email capture
    trackEmailCaptured(config.flowType)

    // Calculate scores
    setTimeout(async () => {
      const scores = calculateOfferScores(answers)
      setAllOfferScores(scores)
      const topOffer = scores.find(s => !s.isDisqualified) || scores[0]
      setRecommendedOffer(topOffer)

      // Extract personalization tokens
      const personalizationTokens = extractMoneyModelTokens(
        submittedEmail,
        config.flowType,
        answers,
        topOffer
      )

      // Save to database
      try {
        // Save assessment
        await supabase.from('public_offer_assessments').insert({
          session_token: sessionToken,
          flow_type: config.flowType,
          respondent_email: submittedEmail,
          responses: answers,
          recommended_offer_id: topOffer?.offer?.id,
          recommended_offer_name: topOffer?.offer?.name,
          confidence_score: topOffer?.confidence,
          total_score: topOffer?.totalScore,
          all_offer_scores: scores.map(s => ({
            id: s.offer.id,
            name: s.offer.name,
            score: s.totalScore,
            confidence: s.confidence,
            disqualified: s.isDisqualified
          }))
        })

        // Update public_leads with personalization tokens
        await supabase.from('public_leads').upsert({
          email: submittedEmail,
          source_flow: config.flowType,
          personalization_tokens: personalizationTokens,
          flow_results: {
            recommended_offer: topOffer?.offer?.name,
            confidence: topOffer?.confidence
          }
        }, {
          onConflict: 'email',
          ignoreDuplicates: false
        })

        // Enroll in email sequence
        await supabase.functions.invoke('enroll-email-sequence', {
          body: {
            email: submittedEmail,
            sequence_type: 'money_model',
            personalization_tokens: personalizationTokens
          }
        })
      } catch (err) {
        console.error('Error saving assessment:', err)
      }

      // Track flow completion
      trackFlowCompleted(config.flowType, {
        recommended_offer: topOffer?.offer?.name,
        confidence: topOffer?.confidence
      })

      setStage(STAGES.REVEAL)
    }, 1500)
  }

  // Go back handler
  const goBack = (fromStage) => {
    const currentIndex = questionStages.indexOf(fromStage)
    if (currentIndex === 0) {
      setStage(STAGES.WELCOME)
    } else if (currentIndex > 0) {
      setStage(questionStages[currentIndex - 1])
    }
  }

  // Get question by stage
  const getQuestionByStage = () => {
    if (!questionsData?.questions) return null
    const index = questionStages.indexOf(stage)
    return index >= 0 ? questionsData.questions[index] : null
  }

  // ============ RENDER ============

  // Loading state
  if (!questionsData || !offersData) {
    return (
      <div className={config.cssClass}>
        <div className="loading-state">
          {error ? (
            <div style={{ color: 'white', textAlign: 'center', padding: '20px' }}>
              <h2>Error Loading Assessment</h2>
              <p>{error}</p>
            </div>
          ) : (
            <div className="typing-indicator">
              <span></span><span></span><span></span>
            </div>
          )}
        </div>
      </div>
    )
  }

  // EMAIL GATE - shown after questions complete
  if (showEmailGate) {
    return (
      <div className={config.cssClass}>
        <ProgressDots stageGroups={config.stageGroups} currentStage={STAGES.REVEAL} />
        <PublicEmailGate
          flowType={config.flowType}
          onEmailSubmit={handleEmailSubmit}
          title="Your results are ready!"
          subtitle="Enter your email to see your personalized offer recommendation"
        />
      </div>
    )
  }

  // TIME CHECK STAGE
  if (stage === STAGES.TIME_CHECK) {
    return (
      <div className={config.cssClass}>
        <ProgressDots stageGroups={config.stageGroups} currentStage={stage} />
        <div className="welcome-container">
          <h1 className="welcome-greeting">{config.title}</h1>
          <div className="welcome-message animated-text" style={{ textAlign: 'center' }}>
            <p><span className="time-icon">⏱️</span></p>
            <p><strong>This takes about {config.timeEstimate || '3 minutes'}</strong></p>
            <p style={{ color: 'rgba(255,255,255,0.7)' }}>{config.timeCheckMessage || "10 quick questions to find your best strategy."}</p>
            <p>Find a quiet moment where you can think clearly.</p>
          </div>
          <button
            className="primary-button glow-button"
            onClick={() => {
              trackFlowStarted(config.flowType)
              setStage(STAGES.WELCOME)
            }}
          >
            I've Got Time, Let's Go
          </button>
        </div>
      </div>
    )
  }

  // WELCOME STAGE
  if (stage === STAGES.WELCOME) {
    return (
      <div className={config.cssClass}>
        <ProgressDots stageGroups={config.stageGroups} currentStage={stage} />
        <div className="welcome-container">
          <div className="welcome-content">
            <h1 className="welcome-greeting">{config.title}</h1>
            <div className="welcome-message animated-text">
              <p>This assessment will help you discover the best {config.name.toLowerCase()} strategy for your business.</p>
              <p>Answer honestly based on where your business is today.</p>
            </div>
          </div>
          <button className="primary-button" onClick={() => setStage(STAGES.Q1)}>
            Let's Find Your Offer
          </button>
          <BackButton onClick={() => setStage(STAGES.TIME_CHECK)} />
          <p className="attribution-text">These strategies are based on Alex Hormozi's free 100m money model course. Find more of his epic acquisition content on IG: 'Hormozi', Podcast: 'The Game with Alex Hormozi', Youtube: AlexHormozi and website: Acquisition.com</p>
        </div>
      </div>
    )
  }

  // QUESTION STAGES (Q1-Q10)
  if (questionStages.includes(stage)) {
    const question = getQuestionByStage()
    if (!question) return null

    const currentQuestionNumber = questionStages.indexOf(stage) + 1

    return (
      <div className={config.cssClass}>
        <ProgressDots stageGroups={config.stageGroups} currentStage={stage} />
        <div className="question-container">
          <div className="question-number">Question {currentQuestionNumber} of 10</div>
          <h2 className="question-text">{question.question}</h2>
          {question.subtext && <p className="question-subtext">{question.subtext}</p>}
          <div className="options-list">
            {question.options.map((option, index) => (
              <button
                key={index}
                className="option-card"
                onClick={() => handleOptionSelect(question.id, option)}
              >
                <div className="option-label">{option.label}</div>
                {option.description && <div className="option-description">{option.description}</div>}
              </button>
            ))}
          </div>
          <BackButton onClick={() => goBack(stage)} />
        </div>
      </div>
    )
  }

  // CALCULATING STAGE
  if (stage === STAGES.CALCULATING) {
    return (
      <div className={config.cssClass}>
        <ProgressDots stageGroups={config.stageGroups} currentStage={stage} />
        <div className="calculating-container">
          <h2 className="calculating-title">{config.calculatingTitle}</h2>
          <div className="calculating-steps">
            {config.calculatingSteps?.map((step, index) => (
              <div key={index} className="calculating-step active">{step}</div>
            ))}
          </div>
          <div className="typing-indicator">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>
    )
  }

  // REVEAL STAGE (Results)
  if (stage === STAGES.REVEAL && recommendedOffer) {
    const offer = recommendedOffer.offer
    const confidencePercent = Math.round(recommendedOffer.confidence * 100)
    const confidenceLabel = confidencePercent >= 70 ? 'Excellent Fit' :
                           confidencePercent >= 55 ? 'Strong Fit' : 'Good Fit'

    const nonDisqualifiedOffers = allOfferScores.filter(s => !s.isDisqualified)
    const currentRank = nonDisqualifiedOffers.findIndex(s => s.offer.name === recommendedOffer.offer.name)
    const getBadgeText = (rank) => {
      if (rank === 0) return 'Your Best Match'
      if (rank === 1) return '2nd Weighted Option'
      if (rank === 2) return '3rd Weighted Option'
      return `${rank + 1}th Weighted Option`
    }

    // Prepare flow results for CTA
    const flowResults = {
      recommended_offer: offer.name,
      confidence: confidencePercent,
      flow_type: config.flowType
    }

    return (
      <div className={config.cssClass}>
        <ProgressDots stageGroups={config.stageGroups} currentStage={stage} />
        <div className="reveal-container">
          <div className={`reveal-badge ${currentRank > 0 ? 'secondary' : ''}`}>{getBadgeText(currentRank)}</div>
          <h1 className="reveal-offer-name">{offer.name}</h1>
          <div className="confidence-display">
            <div className="confidence-bar">
              <div className="confidence-fill" style={{ width: `${confidencePercent}%` }} />
            </div>
            <div className="confidence-text">{confidencePercent}% Match - {confidenceLabel}</div>
          </div>
          <p className="reveal-description">{offer.description}</p>

          {offer.funnel_template?.offer_structure && (
            <div className="funnel-preview">
              <h3 className="preview-heading">Your Funnel Structure:</h3>
              <div className="funnel-steps">
                {offer.funnel_template.offer_structure.map((step, index) => (
                  <div key={index} className="funnel-step">
                    <span className="step-number">{index + 1}</span>
                    <span className="step-text">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {allOfferScores.length > 1 && (
            <div className="alternative-offers">
              <h3 className="preview-heading">Strategy Scores:</h3>
              <div className="offer-scores-list">
                {(showAllOptions ? nonDisqualifiedOffers : nonDisqualifiedOffers.slice(0, 3)).map((score, index) => (
                  <div key={index} className="score-item">
                    <div className="score-item-content">
                      <span className="score-name">{score.offer.name}</span>
                      <span className="score-value">{Math.round(score.confidence * 100)}%</span>
                    </div>
                    <button
                      className="select-option-btn"
                      onClick={() => setRecommendedOffer(score)}
                    >
                      Show This Option
                    </button>
                  </div>
                ))}
              </div>
              {nonDisqualifiedOffers.length > 3 && (
                <button
                  className="see-all-options-btn"
                  onClick={() => setShowAllOptions(!showAllOptions)}
                >
                  {showAllOptions ? 'Show Less' : `See All ${nonDisqualifiedOffers.length} Options`}
                </button>
              )}
            </div>
          )}

          {/* Download Results Button */}
          <DownloadResultsButton
            label="Download Your Results"
            onDownload={() => {
              const pdfContent = generateMoneyModelPdf({
                offerName: offer.name,
                confidence: confidencePercent,
                flowType: config.name,
                funnelSteps: offer.funnel_template?.offer_structure,
                allScores: nonDisqualifiedOffers.map(s => ({
                  name: s.offer.name,
                  confidence: Math.round(s.confidence * 100)
                }))
              })
              downloadResultsPdf(pdfContent, `${config.name} Results - Find My Flow`)
            }}
          />

          {/* Feedback Form */}
          <FlowFeedback
            flowType={config.flowType}
            sessionToken={sessionToken}
          />

          {/* CTA Section */}
          <PublicFlowCTA
            email={email}
            flowType={config.flowType}
            flowResults={flowResults}
          />
        </div>
      </div>
    )
  }

  return null
}
