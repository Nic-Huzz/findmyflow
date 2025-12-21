/**
 * MoneyModelFlowBase - Shared base component for Money Model flows
 *
 * Phase 3 of Money Model consolidation.
 * This component handles the common logic for all 6 Money Model assessment flows.
 */

import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import { completeFlowQuest } from '../lib/questCompletion'
import { BackButton, ProgressDots } from '../components/MoneyModelShared'
import { STAGES } from './moneyModelConfigs'

/**
 * MoneyModelFlowBase component
 * @param {Object} config - Flow configuration from moneyModelConfigs.js
 * @param {React.ReactNode} welcomeContent - Custom welcome message content
 * @param {string} cssImport - CSS class for the flow (passed from wrapper)
 */
function MoneyModelFlowBase({ config, welcomeContent }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()

  // Core state
  const [stage, setStage] = useState(STAGES.WELCOME)
  const [questionsData, setQuestionsData] = useState(null)
  const [offersData, setOffersData] = useState(null)
  const [answers, setAnswers] = useState({})
  const [recommendedOffer, setRecommendedOffer] = useState(null)
  const [allOfferScores, setAllOfferScores] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showAllOptions, setShowAllOptions] = useState(false)
  const [viewingResults, setViewingResults] = useState(false)

  // Question stages array
  const questionStages = [
    STAGES.Q1, STAGES.Q2, STAGES.Q3, STAGES.Q4, STAGES.Q5,
    STAGES.Q6, STAGES.Q7, STAGES.Q8, STAGES.Q9, STAGES.Q10
  ]

  // Go back handler
  const goBack = (fromStage) => {
    const currentIndex = questionStages.indexOf(fromStage)
    if (currentIndex === 0) {
      setStage(STAGES.WELCOME)
    } else if (currentIndex > 0) {
      setStage(questionStages[currentIndex - 1])
    }
  }

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
        // Handle both formats: top-level array or { offers: [...] }
        setOffersData(Array.isArray(offersJson) ? offersJson : offersJson.offers)
      } catch (err) {
        setError(`Failed to load assessment: ${err.message}`)
      }
    }
    loadData()
  }, [config.questionsPath, config.offersPath])

  // Check for ?results=true to show saved results directly (if supported)
  useEffect(() => {
    if (!config.hasViewingResults) return

    const loadSavedResults = async () => {
      if (searchParams.get('results') !== 'true' || !user || !offersData) return

      try {
        const { data: assessment, error } = await supabase
          .from(config.dbTable)
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (error || !assessment) {
          console.log('No saved results found')
          return
        }

        const savedScores = assessment.all_offer_scores || []
        const reconstructedScores = savedScores.map(saved => {
          const offer = offersData.find(o => o.id === saved.id || o.name === saved.name)
          return {
            offer: offer || { id: saved.id, name: saved.name },
            totalScore: saved.score,
            confidence: saved.confidence,
            isDisqualified: saved.disqualified
          }
        })

        if (reconstructedScores.length > 0) {
          setAllOfferScores(reconstructedScores)
          const topOffer = reconstructedScores.find(s => !s.isDisqualified) || reconstructedScores[0]
          setRecommendedOffer(topOffer)
          setViewingResults(true)
          setStage(STAGES.REVEAL)
        }
      } catch (err) {
        console.error('Error loading saved results:', err)
      }
    }

    loadSavedResults()
  }, [searchParams, user, offersData, config.hasViewingResults, config.dbTable])

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

    if (currentIndex < questionStages.length - 1) {
      setStage(questionStages[currentIndex + 1])
    } else {
      setStage(STAGES.CALCULATING)

      setTimeout(() => {
        const scores = calculateOfferScores(newAnswers)
        setAllOfferScores(scores)
        const topOffer = scores.find(s => !s.isDisqualified) || scores[0]
        setRecommendedOffer(topOffer)
        setStage(STAGES.REVEAL)
      }, 1500)
    }
  }

  // Handle saving results
  const handleSaveResults = async () => {
    if (isLoading || !user) return

    setIsLoading(true)
    setError(null)

    try {
      const sessionId = crypto.randomUUID()
      await supabase.from(config.dbTable).insert([{
        session_id: sessionId,
        user_id: user.id,
        user_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        email: user.email,
        responses: answers,
        recommended_offer_id: recommendedOffer?.offer?.id,
        recommended_offer_name: recommendedOffer?.offer?.name,
        confidence_score: recommendedOffer?.confidence,
        total_score: recommendedOffer?.totalScore,
        all_offer_scores: allOfferScores.map(s => ({
          id: s.offer.id,
          name: s.offer.name,
          score: s.totalScore,
          confidence: s.confidence,
          disqualified: s.isDisqualified
        }))
      }])

      // Track flow completion
      try {
        await supabase.from('flow_sessions').insert({
          user_id: user.id,
          flow_type: config.flowType,
          flow_version: config.flowVersion,
          status: 'completed',
          last_step_id: 'complete'
        })
      } catch (trackingError) {
        console.warn('Flow tracking failed:', trackingError)
      }

      // Complete challenge quest
      try {
        const questId = typeof config.getQuestId === 'function'
          ? config.getQuestId(user?.user_metadata?.persona)
          : config.questId

        await completeFlowQuest({
          userId: user.id,
          flowId: questId,
          pointsEarned: config.pointsEarned
        })
      } catch (questError) {
        console.warn('Quest completion failed:', questError)
      }

      // Handle milestone creation (for LeadMagnet)
      if (config.createsMilestone) {
        try {
          const { data: stageProgress } = await supabase
            .from('user_stage_progress')
            .select('current_stage, persona')
            .eq('user_id', user.id)
            .single()

          await supabase.from('milestone_completions').insert({
            user_id: user.id,
            milestone_id: config.milestoneId,
            stage: stageProgress?.current_stage || 'validation',
            persona: stageProgress?.persona || 'vibe_seeker',
            evidence_text: `Completed ${config.name} flow: ${recommendedOffer?.offer?.name}`
          })
        } catch (milestoneError) {
          console.warn('Milestone creation failed:', milestoneError)
        }
      }

      setStage(STAGES.SUCCESS)

      // Handle auto-navigation (for LeadMagnet)
      if (config.autoNavigateOnSuccess) {
        setTimeout(() => {
          navigate(config.autoNavigatePath)
        }, config.autoNavigateDelay)
      }
    } catch (err) {
      setError('Failed to save results. Please try again.')
      console.error('Save error:', err)
    } finally {
      setIsLoading(false)
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

  // WELCOME STAGE
  if (stage === STAGES.WELCOME) {
    return (
      <div className={config.cssClass}>
        <ProgressDots stageGroups={config.stageGroups} currentStage={stage} />
        <div className="welcome-container">
          <div className="welcome-content">
            <h1 className="welcome-greeting">{config.title}</h1>
            <div className="welcome-message">
              {welcomeContent}
            </div>
          </div>
          <button className="primary-button" onClick={() => setStage(STAGES.Q1)}>
            Let's Find Your Offer
          </button>
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
          {config.hasBackButton && <BackButton onClick={() => goBack(stage)} />}
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
            {config.calculatingSteps.map((step, index) => (
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

  // REVEAL STAGE
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

          {offer.funnel_template?.metrics && (
            <div className="metrics-preview">
              <h3 className="preview-heading">Key Metrics to Track:</h3>
              <div className="metrics-grid">
                {offer.funnel_template.metrics.map((metric, index) => (
                  <div key={index} className="metric-card">{metric}</div>
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

          {allOfferScores.some(s => s.isDisqualified) && (
            <div className="disqualified-offers">
              <h3 className="preview-heading disqualified-heading">Disqualified Strategies:</h3>
              <div className="disqualified-list">
                {allOfferScores.filter(s => s.isDisqualified).map((score, index) => (
                  <div key={index} className="disqualified-item">
                    <div className="disqualified-header">
                      <span className="disqualified-name">{score.offer.name}</span>
                      <span className="disqualified-score">{Math.round(score.confidence * 100)}% match</span>
                    </div>
                    <div className="disqualified-reasons">
                      {score.disqualificationReasons?.map((reason, rIndex) => (
                        <p key={rIndex} className="disqualified-reason">⚠️ {reason}</p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {viewingResults ? (
            <button
              className="primary-button"
              onClick={() => navigate('/7-day-challenge')}
              style={{ marginTop: '24px' }}
            >
              ← Back to 7-Day Challenge
            </button>
          ) : (
            <>
              <button
                className="primary-button"
                onClick={handleSaveResults}
                disabled={isLoading}
                style={{ marginTop: '24px' }}
              >
                {isLoading ? 'Saving...' : `Save & Complete Quest (+${config.pointsEarned} pts)`}
              </button>
              <p style={{ marginTop: '12px', fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)' }}>
                Saves your results and completes this challenge quest
              </p>
            </>
          )}
        </div>
      </div>
    )
  }

  // SUCCESS STAGE
  if (stage === STAGES.SUCCESS) {
    const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'there'
    return (
      <div className={config.cssClass}>
        <div className="success-container">
          <div className="success-icon">✓</div>
          <h2>Quest Complete, {userName}!</h2>
          <p style={{ marginBottom: '8px' }}>Your <strong>{recommendedOffer?.offer?.name}</strong> strategy is ready.</p>
          <p style={{ color: '#fbbf24', fontWeight: '600', fontSize: '18px' }}>+{config.pointsEarned} points earned!</p>
          {!config.autoNavigateOnSuccess && (
            <button
              className="primary-button"
              onClick={() => navigate('/7-day-challenge')}
              style={{ marginTop: '24px' }}
            >
              Return to 7-Day Challenge
            </button>
          )}
        </div>
      </div>
    )
  }

  return null
}

export default MoneyModelFlowBase
