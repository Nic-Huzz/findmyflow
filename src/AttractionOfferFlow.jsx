import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from './lib/supabaseClient'
import { useAuth } from './auth/AuthProvider'
import { completeFlowQuest } from './lib/questCompletion'
import './AttractionOfferFlow.css'

// Flow stages
const STAGES = {
  WELCOME: 'welcome',
  Q1: 'q1',
  Q2: 'q2',
  Q3: 'q3',
  Q4: 'q4',
  Q5: 'q5',
  Q6: 'q6',
  Q7: 'q7',
  Q8: 'q8',
  Q9: 'q9',
  Q10: 'q10',
  CALCULATING: 'calculating',
  REVEAL: 'reveal',
  SUCCESS: 'success'
}

// Stage groupings for progress dots
const STAGE_GROUPS = [
  { id: 'welcome', label: 'Welcome', stages: [STAGES.WELCOME] },
  { id: 'business', label: 'Business', stages: [STAGES.Q1, STAGES.Q2, STAGES.Q3] },
  { id: 'operations', label: 'Operations', stages: [STAGES.Q4, STAGES.Q5] },
  { id: 'market', label: 'Market', stages: [STAGES.Q6, STAGES.Q7] },
  { id: 'goals', label: 'Goals', stages: [STAGES.Q8, STAGES.Q9, STAGES.Q10] },
  { id: 'results', label: 'Results', stages: [STAGES.CALCULATING, STAGES.REVEAL] },
  { id: 'complete', label: 'Complete', stages: [STAGES.SUCCESS] }
]

function AttractionOfferFlow() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [stage, setStage] = useState(STAGES.WELCOME)
  const [questionsData, setQuestionsData] = useState(null)
  const [offersData, setOffersData] = useState(null)
  const [answers, setAnswers] = useState({})
  const [recommendedOffer, setRecommendedOffer] = useState(null)
  const [allOfferScores, setAllOfferScores] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showAllOptions, setShowAllOptions] = useState(false)

  // Load questions and offers JSON
  useEffect(() => {
    const loadData = async () => {
      try {
        const [questionsRes, offersRes] = await Promise.all([
          fetch('/attraction-offer-questions.json'),
          fetch('/Money Model/Attraction/offers.json')
        ])

        if (!questionsRes.ok || !offersRes.ok) {
          throw new Error('Failed to load assessment data')
        }

        const questionsJson = await questionsRes.json()
        const offersJson = await offersRes.json()

        setQuestionsData(questionsJson)
        setOffersData(offersJson)
      } catch (err) {
        setError(`Failed to load assessment: ${err.message}`)
      }
    }
    loadData()
  }, [])

  // Money-Model challenge - accessible to authenticated Movement Makers
  // No redirect needed

  // Calculate current stage group for progress
  const getCurrentGroupIndex = () => {
    for (let i = 0; i < STAGE_GROUPS.length; i++) {
      if (STAGE_GROUPS[i].stages.includes(stage)) {
        return i
      }
    }
    return 0
  }

  // Calculate progress within current group
  const getGroupProgress = () => {
    const groupIndex = getCurrentGroupIndex()
    const group = STAGE_GROUPS[groupIndex]
    const stageIndex = group.stages.indexOf(stage)
    return ((stageIndex + 1) / group.stages.length) * 100
  }

  // Calculate offer scores from answers
  const calculateOfferScores = (userAnswers) => {
    if (!offersData) return []

    console.log('🔍 Calculating scores with answers:', userAnswers)
    console.log('📊 Offers data:', offersData)

    const scores = offersData.map(offer => {
      let totalScore = 0
      const maxPossibleScore = offer.max_possible_score || 30

      console.log(`\n📝 Scoring offer: ${offer.name}`)
      console.log('Scoring weights:', offer.scoring_weights)
      console.log('Scoring weights keys:', Object.keys(offer.scoring_weights || {}))

      // Calculate weighted score for each question
      Object.entries(userAnswers).forEach(([questionId, answer]) => {
        // Normalize questionId: q1_business_model -> Q1_business_model
        const normalizedQuestionId = questionId.replace(/^q(\d+)/, 'Q$1')
        const weights = offer.scoring_weights?.[normalizedQuestionId]
        console.log(`  Question ${questionId} (normalized: ${normalizedQuestionId}):`, {
          answer: answer.value,
          weights,
          foundWeight: weights?.[answer.value],
          hasWeights: !!weights
        })
        if (weights && weights[answer.value] !== undefined) {
          totalScore += weights[answer.value]
          console.log(`    ✅ Added ${weights[answer.value]} points`)
        } else {
          console.log(`    ❌ No weight found`)
        }
      })

      console.log(`  Final totalScore: ${totalScore}/${maxPossibleScore}`)

      // Check hard disqualifiers
      let isDisqualified = false
      if (offer.eligibility_rules?.hard_disqualifiers) {
        offer.eligibility_rules.hard_disqualifiers.forEach(rule => {
          const fieldAnswer = userAnswers[`q${rule.field.match(/\d+/)?.[0] || ''}_${rule.field}`]
          if (fieldAnswer && rule.disallowed.includes(fieldAnswer.value)) {
            isDisqualified = true
          }
        })
      }

      const confidence = totalScore / maxPossibleScore

      return {
        offer,
        totalScore,
        maxPossibleScore,
        confidence,
        isDisqualified
      }
    })

    // Sort by score (disqualified offers go to bottom)
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

    // Determine next stage
    const questionStages = [
      STAGES.Q1, STAGES.Q2, STAGES.Q3, STAGES.Q4, STAGES.Q5,
      STAGES.Q6, STAGES.Q7, STAGES.Q8, STAGES.Q9, STAGES.Q10
    ]
    const currentIndex = questionStages.indexOf(stage)

    if (currentIndex < questionStages.length - 1) {
      // Move to next question
      setStage(questionStages[currentIndex + 1])
    } else {
      // All questions answered - calculate results
      setStage(STAGES.CALCULATING)

      // Simulate calculation delay for better UX
      setTimeout(() => {
        const scores = calculateOfferScores(newAnswers)
        setAllOfferScores(scores)
        const topOffer = scores.find(s => !s.isDisqualified) || scores[0]
        setRecommendedOffer(topOffer)
        setStage(STAGES.REVEAL)
      }, 1500)
    }
  }

  // Handle saving results (for authenticated users)
  const handleSaveResults = async () => {
    if (isLoading || !user) return

    setIsLoading(true)
    setError(null)

    try {
      // Save assessment results
      const sessionId = crypto.randomUUID()
      await supabase.from('attraction_offer_assessments').insert([{
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

      // Track flow completion for graduation requirements
      // This flow is for Movement Makers (Ideation stage) - saves as 'attraction_offer'
      try {
        await supabase.from('flow_sessions').insert({
          user_id: user.id,
          flow_type: 'attraction_offer',
          flow_version: 'attraction-offer-v1',
          status: 'completed',
          last_step_id: 'complete'
        })
      } catch (trackingError) {
        console.warn('Flow tracking failed:', trackingError)
      }

      // Complete challenge quest
      try {
        await completeFlowQuest({
          userId: user.id,
          flowId: 'flow_attraction_offer',
          pointsEarned: 35
        })
      } catch (questError) {
        console.warn('Quest completion failed:', questError)
      }

      setStage(STAGES.SUCCESS)
      setTimeout(() => navigate('/7-day-challenge'), 2000)
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
    const questionStages = [
      STAGES.Q1, STAGES.Q2, STAGES.Q3, STAGES.Q4, STAGES.Q5,
      STAGES.Q6, STAGES.Q7, STAGES.Q8, STAGES.Q9, STAGES.Q10
    ]
    const index = questionStages.indexOf(stage)
    return index >= 0 ? questionsData.questions[index] : null
  }

  // Loading state
  if (!questionsData || !offersData) {
    return (
      <div className="attraction-offer-flow">
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

  // Render progress indicators
  const renderProgress = () => {
    const currentGroupIndex = getCurrentGroupIndex()

    return (
      <div className="progress-container">
        {/* Main progress dots */}
        <div className="progress-dots">
          {STAGE_GROUPS.map((group, index) => (
            <div
              key={group.id}
              className={`progress-dot ${index < currentGroupIndex ? 'completed' : ''} ${index === currentGroupIndex ? 'active' : ''}`}
            />
          ))}
        </div>
      </div>
    )
  }

  // ============ RENDER STAGES ============

  // WELCOME STAGE
  if (stage === STAGES.WELCOME) {
    return (
      <div className="attraction-offer-flow">
        {renderProgress()}
        <div className="welcome-container">
          <div className="welcome-content">
            <h1 className="welcome-greeting">Find Your Perfect Attraction Offer</h1>
            <div className="welcome-message">
              <p><strong>Ready to attract the right leads and build your business?</strong></p>
              <p>Every successful business needs a compelling front-end offer that draws in qualified leads and creates momentum.</p>
              <p>But not all attraction offers are created equal...</p>
              <p>Some work best for high-volume lead generation. Others build trust and authority. Some generate testimonials. Others fill programs.</p>
              <p>The wrong offer? You'll burn cash on ads that don't convert.</p>
              <p>The right offer? You'll attract quality leads that turn into paying customers and advocates.</p>
              <p className="welcome-cta-text">Answer 10 quick questions and I'll recommend the perfect attraction offer for your business model.</p>
            </div>
          </div>
          <button className="primary-button" onClick={() => setStage(STAGES.Q1)}>
            Let's Find Your Offer
          </button>
          <p className="attribution-text">These strategies are based on Alex Hormozi's free 100m offer course. Find more of his epic acquisition content on IG: 'Hormozi', Podcast: 'The Game with Alex Hormozi', Youtube: AlexHormozi and website: Acquisition.com</p>
        </div>
      </div>
    )
  }

  // QUESTION STAGES (Q1-Q10)
  const questionStages = [
    STAGES.Q1, STAGES.Q2, STAGES.Q3, STAGES.Q4, STAGES.Q5,
    STAGES.Q6, STAGES.Q7, STAGES.Q8, STAGES.Q9, STAGES.Q10
  ]

  if (questionStages.includes(stage)) {
    const question = getQuestionByStage()
    if (!question) return null

    const currentQuestionNumber = questionStages.indexOf(stage) + 1

    return (
      <div className="attraction-offer-flow">
        {renderProgress()}
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
        </div>
      </div>
    )
  }

  // CALCULATING STAGE
  if (stage === STAGES.CALCULATING) {
    return (
      <div className="attraction-offer-flow">
        {renderProgress()}
        <div className="calculating-container">
          <h2 className="calculating-title">Analyzing Your Business...</h2>
          <div className="calculating-steps">
            <div className="calculating-step active">✓ Evaluating your business model</div>
            <div className="calculating-step active">✓ Checking margin & capacity</div>
            <div className="calculating-step active">✓ Scoring 6 attraction offers</div>
            <div className="calculating-step active">✓ Finding your best match</div>
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

    return (
      <div className="attraction-offer-flow">
        {renderProgress()}
        <div className="reveal-container">
          <div className="reveal-badge">Your Best Match</div>
          <h1 className="reveal-offer-name">{offer.name}</h1>
          <div className="confidence-display">
            <div className="confidence-bar">
              <div className="confidence-fill" style={{ width: `${confidencePercent}%` }} />
            </div>
            <div className="confidence-text">{confidencePercent}% Match - {confidenceLabel}</div>
          </div>
          <p className="reveal-description">{offer.description}</p>

          <div className="funnel-preview">
            <h3 className="preview-heading">Your Funnel Structure:</h3>
            <div className="funnel-steps">
              {offer.funnel_template?.offer_structure?.map((step, index) => (
                <div key={index} className="funnel-step">
                  <span className="step-number">{index + 1}</span>
                  <span className="step-text">{step}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="metrics-preview">
            <h3 className="preview-heading">Key Metrics to Track:</h3>
            <div className="metrics-grid">
              {offer.funnel_template?.metrics?.map((metric, index) => (
                <div key={index} className="metric-card">{metric}</div>
              ))}
            </div>
          </div>

          {allOfferScores.length > 1 && (
            <div className="alternative-offers">
              <h3 className="preview-heading">Strategy Scores:</h3>
              <div className="offer-scores-list">
                {(showAllOptions ? allOfferScores : allOfferScores.slice(0, 3)).map((score, index) => (
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
              {allOfferScores.length > 3 && (
                <button
                  className="see-all-options-btn"
                  onClick={() => setShowAllOptions(!showAllOptions)}
                >
                  {showAllOptions ? 'Show Less' : `See All ${allOfferScores.length} Options`}
                </button>
              )}
            </div>
          )}

          <button
            className="primary-button"
            onClick={handleSaveResults}
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Results'}
          </button>
        </div>
      </div>
    )
  }


  // SUCCESS
  if (stage === STAGES.SUCCESS) {
    const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'there'
    return (
      <div className="attraction-offer-flow">
        <div className="success-container">
          <div className="success-icon">✓</div>
          <h2>Success, {userName}!</h2>
          <p>Your {recommendedOffer?.offer?.name} funnel is ready...</p>
          <div className="typing-indicator">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>
    )
  }

  return null
}

export default AttractionOfferFlow
