import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from './lib/supabaseClient'
import { useAuth } from './auth/AuthProvider'
import './ContinuityFlow.css'

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
  NAME_CAPTURE: 'name_capture',
  EMAIL_CAPTURE: 'email_capture',
  CODE_VERIFY: 'code_verify',
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
  { id: 'profile', label: 'Profile', stages: [STAGES.NAME_CAPTURE, STAGES.EMAIL_CAPTURE, STAGES.CODE_VERIFY] },
  { id: 'complete', label: 'Complete', stages: [STAGES.SUCCESS] }
]

function ContinuityFlow() {
  const navigate = useNavigate()
  const { user, signInWithCode, verifyCode } = useAuth()

  const [stage, setStage] = useState(STAGES.WELCOME)
  const [questionsData, setQuestionsData] = useState(null)
  const [offersData, setOffersData] = useState(null)
  const [answers, setAnswers] = useState({})
  const [recommendedOffer, setRecommendedOffer] = useState(null)
  const [allOfferScores, setAllOfferScores] = useState([])
  const [userName, setUserName] = useState('')
  const [email, setEmail] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Load questions and offers JSON
  useEffect(() => {
    const loadData = async () => {
      try {
        const [questionsRes, offersRes] = await Promise.all([
          fetch('/continuity-questions.json'),
          fetch('/Money Model/Continuity/offers.json')
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

  // If user is already authenticated, redirect to dashboard
  useEffect(() => {
    if (user) {
      navigate('/me')
    }
  }, [user, navigate])

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

    const scores = offersData.map(offer => {
      let totalScore = 0
      const maxPossibleScore = offer.max_possible_score || 30

      // Calculate weighted score for each question
      Object.entries(userAnswers).forEach(([questionId, answer]) => {
        const weights = offer.scoring_weights?.[questionId]
        if (weights && weights[answer.value] !== undefined) {
          totalScore += weights[answer.value]
        }
      })

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

  // Handle name submission
  const handleNameSubmit = (e) => {
    e.preventDefault()
    if (userName.trim()) {
      setStage(STAGES.EMAIL_CAPTURE)
    }
  }

  // Handle email submission (send code)
  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    if (!email || isLoading) return

    setIsLoading(true)
    setError(null)

    try {
      const result = await signInWithCode(email.toLowerCase())
      if (result.success) {
        setStage(STAGES.CODE_VERIFY)
      } else {
        setError(result.message || 'Failed to send verification code')
      }
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle code verification
  const handleCodeVerify = async (e) => {
    e.preventDefault()
    if (!verificationCode || isLoading) return

    setIsLoading(true)
    setError(null)

    try {
      // Save profile data first
      const sessionId = crypto.randomUUID()
      await supabase.from('continuity_assessments').insert([{
        session_id: sessionId,
        user_name: userName,
        email: email.toLowerCase(),
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

      // Verify the code
      const result = await verifyCode(email.toLowerCase(), verificationCode)
      if (result.success) {
        setStage(STAGES.SUCCESS)
        setTimeout(() => navigate('/me'), 2000)
      } else {
        setError(result.message || 'Invalid verification code')
      }
    } catch (err) {
      setError('Verification failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Validate email format
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

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
      <div className="continuity-flow">
        <div className="loading-state">
          <div className="typing-indicator">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>
    )
  }

  // Render progress indicators
  const renderProgress = () => {
    const currentGroupIndex = getCurrentGroupIndex()
    const groupProgress = getGroupProgress()

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
        {/* Section progress bar */}
        <div className="section-progress">
          <div className="section-progress-fill" style={{ width: `${groupProgress}%` }} />
        </div>
      </div>
    )
  }

  // ============ RENDER STAGES ============

  // WELCOME STAGE
  if (stage === STAGES.WELCOME) {
    return (
      <div className="continuity-flow">
        {renderProgress()}
        <div className="welcome-container">
          <div className="welcome-content">
            <h1 className="welcome-greeting">Find Your Perfect Continuity Model</h1>
            <div className="welcome-message">
              <p><strong>Ready to build predictable, recurring revenue?</strong></p>
              <p>Continuity offers provide ongoing value that customers make ongoing payments for—until they cancel.</p>
              <p>They boost profit from every customer and give you one last thing to sell.</p>
              <p>But not all continuity models work for every business...</p>
              <p>Some work best with high-value bonuses. Others use commitment discounts. Some waive setup fees. Others downsell upsells.</p>
              <p>The wrong model? Customers cancel fast and you waste time building the wrong thing.</p>
              <p>The right model? Predictable revenue, higher lifetime value, and a more valuable business.</p>
              <p className="welcome-cta-text">Answer 10 quick questions and I'll recommend the perfect continuity model for your business.</p>
            </div>
          </div>
          <button className="primary-button" onClick={() => setStage(STAGES.Q1)}>
            Let's Find Your Model
          </button>
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
      <div className="continuity-flow">
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
      <div className="continuity-flow">
        {renderProgress()}
        <div className="calculating-container">
          <h2 className="calculating-title">Analyzing Your Business...</h2>
          <div className="calculating-steps">
            <div className="calculating-step active">✓ Evaluating your revenue model</div>
            <div className="calculating-step active">✓ Checking margins & retention</div>
            <div className="calculating-step active">✓ Scoring 6 continuity models</div>
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
      <div className="continuity-flow">
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
            <h3 className="preview-heading">Your Offer Structure:</h3>
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
              <h3 className="preview-heading">Other Models Scored:</h3>
              <div className="offer-scores-list">
                {allOfferScores.slice(0, 3).map((score, index) => (
                  <div key={index} className="score-item">
                    <span className="score-name">{score.offer.name}</span>
                    <span className="score-value">{Math.round(score.confidence * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="next-step-text">
            Save your results to get your complete implementation guide, pricing strategies, and churn reduction tactics.
          </p>

          <button className="primary-button" onClick={() => setStage(STAGES.NAME_CAPTURE)}>
            Get My Complete Guide
          </button>
        </div>
      </div>
    )
  }

  // NAME CAPTURE
  if (stage === STAGES.NAME_CAPTURE) {
    return (
      <div className="continuity-flow">
        {renderProgress()}
        <div className="capture-container">
          <h2 className="capture-title">Almost there!</h2>
          <p className="capture-subtitle">What should I call you?</p>
          <form onSubmit={handleNameSubmit} className="capture-form">
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Your name"
              className="capture-input"
              autoFocus
            />
            <button
              type="submit"
              className="primary-button"
              disabled={!userName.trim()}
            >
              Continue
            </button>
          </form>
        </div>
      </div>
    )
  }

  // EMAIL CAPTURE
  if (stage === STAGES.EMAIL_CAPTURE) {
    return (
      <div className="continuity-flow">
        {renderProgress()}
        <div className="capture-container">
          <h2 className="capture-title">Perfect, {userName}!</h2>
          <p className="capture-subtitle">
            Enter your email to access your complete {recommendedOffer?.offer?.name} implementation guide and pricing strategies.
          </p>
          <form onSubmit={handleEmailSubmit} className="capture-form">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="capture-input"
              disabled={isLoading}
              autoFocus
            />
            <button
              type="submit"
              className="primary-button"
              disabled={isLoading || !validateEmail(email)}
            >
              {isLoading ? 'Sending...' : 'Send Verification Code'}
            </button>
          </form>
          {error && <p className="error-message">{error}</p>}
        </div>
      </div>
    )
  }

  // CODE VERIFICATION
  if (stage === STAGES.CODE_VERIFY) {
    return (
      <div className="continuity-flow">
        {renderProgress()}
        <div className="capture-container">
          <h2 className="capture-title">Check Your Email</h2>
          <p className="capture-subtitle">
            I've sent a verification code to <strong>{email}</strong>
          </p>
          <form onSubmit={handleCodeVerify} className="capture-form">
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit code"
              className="capture-input code-input"
              maxLength={6}
              disabled={isLoading}
              autoFocus
            />
            <button
              type="submit"
              className="primary-button"
              disabled={isLoading || verificationCode.length < 6}
            >
              {isLoading ? 'Verifying...' : 'Verify Code'}
            </button>
          </form>
          {error && <p className="error-message">{error}</p>}
          <button
            className="text-button"
            onClick={() => {
              setError(null)
              setStage(STAGES.EMAIL_CAPTURE)
            }}
          >
            Use a different email
          </button>
        </div>
      </div>
    )
  }

  // SUCCESS
  if (stage === STAGES.SUCCESS) {
    return (
      <div className="continuity-flow">
        <div className="success-container">
          <div className="success-icon">✓</div>
          <h2>Success, {userName}!</h2>
          <p>Your {recommendedOffer?.offer?.name} guide is ready...</p>
          <div className="typing-indicator">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>
    )
  }

  return null
}

export default ContinuityFlow
