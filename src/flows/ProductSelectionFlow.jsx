/**
 * ProductSelectionFlow - Product Selection (+30 pts)
 *
 * Follows OfferBuilderFlow to finalize core product details.
 * Loads solutions categorized as 'core_product' from the Offer Builder.
 *
 * Uses Hormozi's Value Equation for each product:
 * Value = (Dream Outcome × Perceived Likelihood) / (Time Delay × Effort)
 *
 * For each core product solution, asks 3 questions:
 * 1. Dream Outcome - How big is the transformation?
 * 2. Time Delay - How long until they see results?
 * 3. Perceived Likelihood - How can you prove it works?
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import { completeFlowQuest } from '../lib/questCompletion'
import { BackButton, ProgressDots } from '../components/MoneyModelShared'
import './ProductSelectionFlow.css'

const STAGES = {
  LOADING: 'loading',
  WELCOME: 'welcome',
  QUESTIONS: 'questions',
  SUMMARY: 'summary',
  SUCCESS: 'success'
}

const STAGE_GROUPS = [
  { id: 'welcome', label: 'Welcome', stages: [STAGES.WELCOME] },
  { id: 'questions', label: 'Value Equation', stages: [STAGES.QUESTIONS] },
  { id: 'summary', label: 'Summary', stages: [STAGES.SUMMARY] },
  { id: 'complete', label: 'Complete', stages: [STAGES.SUCCESS] }
]

// Solution type labels
const SOLUTION_LABELS = {
  one_to_one: '1:1 Service',
  one_to_many: '1:Many Service',
  group_program: 'Group Program',
  digital_product: 'Digital Product',
  tech_digital: 'Tech/Digital',
  physical_product: 'Physical Product'
}

// Value level insights - detailed info for each score range
const VALUE_LEVEL_INSIGHTS = {
  exceptional: {
    label: 'Exceptional',
    color: '#10B981',
    icon: '🚀',
    summary: 'This product has massive value potential. Prioritize building this.',
    whyItWorks: 'You have the holy grail: a life-changing transformation that happens quickly with strong proof. This combination commands premium pricing.',
    nextSteps: [
      'Price at a premium - this value deserves it',
      'Build social proof aggressively (case studies, testimonials)',
      'Consider a waitlist to build demand'
    ]
  },
  strong: {
    label: 'Strong',
    color: '#fbbf24',
    icon: '💪',
    summary: 'Solid value proposition. A few tweaks could make it exceptional.',
    whyItWorks: 'You have good fundamentals in place. Small improvements to weaker areas will significantly increase perceived value.',
    nextSteps: [
      'Identify your weakest dimension and focus there',
      'Add quick wins to reduce perceived time delay',
      'Stack bonuses to increase dream outcome perception'
    ]
  },
  moderate: {
    label: 'Moderate',
    color: '#f59e0b',
    icon: '⚡',
    summary: 'There\'s potential here, but needs strategic improvements.',
    whyItWorks: 'The foundation exists but customers may hesitate. Focus on proof and reducing friction.',
    nextSteps: [
      'Create a smaller, faster "quick win" version first',
      'Gather testimonials before scaling',
      'Consider a guarantee to reduce perceived risk'
    ]
  },
  needsWork: {
    label: 'Needs Work',
    color: '#ff6b6b',
    icon: '🔧',
    summary: 'This product needs significant repositioning or simplification.',
    whyItWorks: 'The value equation is currently weighted against you. Don\'t launch until you\'ve improved key dimensions.',
    nextSteps: [
      'Narrow the outcome to something more specific and achievable',
      'Find a way to deliver faster results',
      'Build proof with beta testers before charging'
    ]
  }
}

// Dimension-specific improvement tips
const DIMENSION_IMPROVEMENTS = {
  dream_outcome: {
    life_changing: {
      status: 'excellent',
      tip: 'You\'re promising massive transformation - make sure your marketing matches this promise.',
      improve: null
    },
    significant: {
      status: 'good',
      tip: 'Strong outcome. Consider stacking bonuses to push toward "life-changing" perception.',
      improve: 'Add elements that touch multiple life areas (health, wealth, relationships, happiness)'
    },
    moderate: {
      status: 'okay',
      tip: 'Meaningful but not exciting. Who gets the BIGGEST win from this?',
      improve: 'Niche down to an audience where this IS life-changing'
    },
    incremental: {
      status: 'weak',
      tip: 'Small improvements are hard to sell. How can you 10x the outcome?',
      improve: 'Bundle multiple small wins into a bigger transformation story'
    }
  },
  time_delay: {
    immediate: {
      status: 'excellent',
      tip: 'Instant results are incredibly valuable - lead with this in marketing.',
      improve: null
    },
    days: {
      status: 'good',
      tip: 'Fast enough for most buyers. Emphasize "quick wins" they\'ll see immediately.',
      improve: 'Add a Day 1 quick win bonus'
    },
    weeks: {
      status: 'okay',
      tip: 'Set expectations clearly. Break the journey into milestone celebrations.',
      improve: 'Create visible progress markers so they feel momentum'
    },
    months: {
      status: 'weak',
      tip: 'Long timelines create doubt. Can you deliver a faster partial result?',
      improve: 'Split into Phase 1 (quick win) + Phase 2 (full transformation)'
    }
  },
  perceived_likelihood: {
    case_studies: {
      status: 'excellent',
      tip: 'Numbers don\'t lie. Feature case studies prominently in your sales process.',
      improve: null
    },
    demonstration: {
      status: 'good',
      tip: 'Seeing is believing. Make your demo the centerpiece of your sales.',
      improve: 'Record demos and create before/after comparisons'
    },
    testimonials: {
      status: 'okay',
      tip: 'Social proof helps, but specificity matters more than quantity.',
      improve: 'Ask for testimonials with specific numbers/outcomes'
    },
    guarantee: {
      status: 'okay',
      tip: 'Guarantees reduce risk but don\'t prove value. Pair with other proof.',
      improve: 'Combine guarantee with testimonials or demo'
    }
  }
}

// Category-based offer enhancement suggestions
const OFFER_ENHANCEMENTS = {
  one_to_one: {
    bonuses: [
      'VIP messaging access between sessions',
      'Personalized action plan document',
      'Recording of each session for review',
      'Emergency "hotline" for urgent questions'
    ],
    guarantees: [
      'If you don\'t see [specific result] in [timeframe], I\'ll work with you until you do',
      'Full refund if you complete the program and don\'t get [outcome]',
      'Double your investment back if [measurable result] doesn\'t happen'
    ],
    pricingStrategies: [
      'Premium positioning ($2K-10K+) - fewer clients, bigger transformations',
      'Productized service - fixed scope, fixed price, clear deliverable',
      'Results-based pricing - charge based on outcome value'
    ],
    deliveryTweaks: [
      'Add async video feedback between sessions',
      'Create a private client portal with resources',
      'Include done-for-you templates/tools'
    ]
  },
  group_program: {
    bonuses: [
      'Private community access (lifetime or extended)',
      '1:1 hot seat or Q&A session',
      'Implementation workshop recordings',
      'Guest expert sessions'
    ],
    guarantees: [
      'Complete the program or get next cohort free',
      'Show your work - refund if you don\'t see results',
      'Upgrade to 1:1 at a discount if group isn\'t right fit'
    ],
    pricingStrategies: [
      'Cohort-based with limited spots (creates urgency)',
      'Tiered access (Basic, Premium, VIP)',
      'Payment plans with "pay in full" bonus'
    ],
    deliveryTweaks: [
      'Add accountability partners/pods',
      'Weekly implementation challenges with prizes',
      'Office hours between main sessions'
    ]
  },
  digital_product: {
    bonuses: [
      'Templates and swipe files',
      'Bonus mini-course on related topic',
      'Private podcast/audio version',
      'Quarterly updates included'
    ],
    guarantees: [
      '30-day no questions asked refund',
      'Double your money back if you don\'t [outcome]',
      'Keep the bonuses even if you refund'
    ],
    pricingStrategies: [
      'Anchor to value of outcome, not content length',
      'Bundle with coaching call for premium tier',
      'Early bird + fast action bonuses'
    ],
    deliveryTweaks: [
      'Drip content to prevent overwhelm',
      'Add progress tracking/gamification',
      'Include implementation checklists'
    ]
  },
  tech_digital: {
    bonuses: [
      'White-glove onboarding/setup',
      'Priority support queue',
      'Early access to new features',
      'API access or integrations'
    ],
    guarantees: [
      '14-day free trial, no credit card',
      'Cancel anytime, no questions',
      'Migration assistance from competitor'
    ],
    pricingStrategies: [
      'Freemium with clear upgrade path',
      'Usage-based pricing (scales with success)',
      'Annual discount (improves retention)'
    ],
    deliveryTweaks: [
      'In-app onboarding wizard',
      'Tooltips and contextual help',
      'Template library to reduce time-to-value'
    ]
  },
  physical_product: {
    bonuses: [
      'Digital companion guide/course',
      'Extended warranty or guarantee',
      'Exclusive colorway or limited edition',
      'Bundle with complementary product'
    ],
    guarantees: [
      'Free returns within 30 days',
      'Lifetime replacement warranty',
      'Try before you buy program'
    ],
    pricingStrategies: [
      'Premium positioning with story/craft emphasis',
      'Subscribe & save discount',
      'Bundle discounts for multiple items'
    ],
    deliveryTweaks: [
      'Unboxing experience that delights',
      'Quick start guide included',
      'QR code to video tutorial'
    ]
  }
}

// Value Equation questions per product
const VALUE_QUESTIONS = [
  {
    id: 'dream_outcome',
    question: 'How big is the transformation?',
    subtext: 'The bigger the dream outcome, the more valuable the offer',
    options: [
      { value: 'life_changing', label: 'Life-Changing', description: 'Completely transforms their situation', score: 10 },
      { value: 'significant', label: 'Significant', description: 'Major improvement to their life/business', score: 7 },
      { value: 'moderate', label: 'Moderate', description: 'Meaningful improvement in one area', score: 5 },
      { value: 'incremental', label: 'Incremental', description: 'Small but noticeable improvement', score: 3 }
    ]
  },
  {
    id: 'time_delay',
    question: 'How long until they see results?',
    subtext: 'Faster results = more valuable (lower time delay)',
    options: [
      { value: 'immediate', label: 'Immediate', description: 'Same day or within hours', score: 10 },
      { value: 'days', label: 'Days', description: 'Within the first week', score: 8 },
      { value: 'weeks', label: 'Weeks', description: '2-4 weeks to see results', score: 5 },
      { value: 'months', label: 'Months', description: '1-3 months for transformation', score: 3 }
    ]
  },
  {
    id: 'perceived_likelihood',
    question: 'How can you prove it works?',
    subtext: 'The more proof, the higher the perceived likelihood of success',
    options: [
      { value: 'case_studies', label: 'Case Studies', description: 'Detailed success stories with numbers', score: 10 },
      { value: 'testimonials', label: 'Testimonials', description: 'Happy customer quotes and reviews', score: 7 },
      { value: 'demonstration', label: 'Demonstration', description: 'Show the process/results live', score: 8 },
      { value: 'guarantee', label: 'Guarantee', description: 'Money-back or results guarantee', score: 6 }
    ]
  }
]

function ProductSelectionFlow() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [stage, setStage] = useState(STAGES.LOADING)
  const [coreProducts, setCoreProducts] = useState([])
  const [currentProductIndex, setCurrentProductIndex] = useState(0)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState({}) // { solutionId: { dream_outcome: '', time_delay: '', perceived_likelihood: '' } }
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [expandedProduct, setExpandedProduct] = useState(null) // Track which product card is expanded
  const [aiIdeas, setAiIdeas] = useState({}) // { productId: { loading, ideas, error } }
  const [nicheLayers, setNicheLayers] = useState(null) // From offer builder for AI context

  // Load core product solutions from the most recent offer builder assessment
  useEffect(() => {
    if (user) {
      loadCoreProducts()
    }
  }, [user])

  const loadCoreProducts = async () => {
    try {
      const { data: assessment, error } = await supabase
        .from('offer_builder_assessments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) throw error

      if (!assessment) {
        setError('No offer data found. Complete the Offer Builder first.')
        setStage(STAGES.WELCOME)
        return
      }

      if (assessment?.responses?.q8_solutions?.solutions) {
        // Get solutions and their categories
        const solutions = assessment.responses.q8_solutions.solutions
        const categories = assessment.responses.solution_categories || {}

        // Store niche layers for AI context
        if (assessment.responses.q1_niche?.layers) {
          setNicheLayers(assessment.responses.q1_niche.layers)
        }

        // Filter to only core product solutions
        // Categories use "solution_X" keys while solutions array uses numeric indices
        const products = Object.entries(solutions)
          .filter(([id]) => categories[`solution_${id}`] === 'core_product')
          .map(([id, data]) => ({
            id: `solution_${id}`,
            ...data,
            // Use solutionType for the label, not the numeric id
            label: SOLUTION_LABELS[data.solutionType] || data.solutionType
          }))

        setCoreProducts(products)

        // Initialize answers for each product
        const initialAnswers = {}
        products.forEach(prod => {
          initialAnswers[prod.id] = { dream_outcome: null, time_delay: null, perceived_likelihood: null }
        })
        setAnswers(initialAnswers)

        if (products.length === 0) {
          setError('No core products found. Complete the Offer Builder first.')
        }
      }

      setStage(STAGES.WELCOME)
    } catch (err) {
      console.error('Error loading products:', err)
      setError('Failed to load products. Complete the Offer Builder first.')
      setStage(STAGES.WELCOME)
    }
  }

  // Calculate value score for a product
  const calculateValueScore = (productId) => {
    const ans = answers[productId]
    if (!ans) return 0

    const dreamOutcome = VALUE_QUESTIONS[0].options.find(o => o.value === ans.dream_outcome)?.score || 0
    const timeDelay = VALUE_QUESTIONS[1].options.find(o => o.value === ans.time_delay)?.score || 0
    const likelihood = VALUE_QUESTIONS[2].options.find(o => o.value === ans.perceived_likelihood)?.score || 0

    // Simplified value equation: (Dream × Likelihood) / Time
    // Higher is better
    const value = (dreamOutcome * likelihood) / (11 - timeDelay) // Invert time so higher = better
    return Math.round(value * 10)
  }

  // Get value level with full insights
  const getValueLevel = (score) => {
    if (score >= 80) return { ...VALUE_LEVEL_INSIGHTS.exceptional, key: 'exceptional' }
    if (score >= 60) return { ...VALUE_LEVEL_INSIGHTS.strong, key: 'strong' }
    if (score >= 40) return { ...VALUE_LEVEL_INSIGHTS.moderate, key: 'moderate' }
    return { ...VALUE_LEVEL_INSIGHTS.needsWork, key: 'needsWork' }
  }

  // Get the recommended "Build First" product
  const getBuildFirstRecommendation = () => {
    if (coreProducts.length <= 1) return null

    // Score each product on multiple factors
    const scoredProducts = coreProducts.map(product => {
      const valueScore = calculateValueScore(product.id)
      const ans = answers[product.id]

      // Complexity/effort score (inverse - lower complexity = higher score)
      // 1:1 is lowest effort, physical product is highest
      const effortScores = {
        one_to_one: 10,
        digital_product: 8,
        group_program: 6,
        tech_digital: 4,
        physical_product: 3
      }
      const effortScore = effortScores[product.solutionType] || 5

      // Time to market score (based on time_delay - faster = can ship faster)
      const timeScores = { immediate: 10, days: 8, weeks: 5, months: 3 }
      const timeScore = timeScores[ans?.time_delay] || 5

      // Combined score weighted toward value but considering practicality
      const combinedScore = (valueScore * 0.5) + (effortScore * 10 * 0.3) + (timeScore * 10 * 0.2)

      return {
        ...product,
        valueScore,
        effortScore,
        timeScore,
        combinedScore,
        valueLevel: getValueLevel(valueScore)
      }
    })

    // Sort by combined score
    scoredProducts.sort((a, b) => b.combinedScore - a.combinedScore)

    const recommended = scoredProducts[0]
    const others = scoredProducts.slice(1)

    // Generate reasoning
    let reason = ''
    if (recommended.valueScore >= 80) {
      reason = 'Highest value potential with strong market appeal'
    } else if (recommended.effortScore >= 8 && recommended.valueScore >= 40) {
      reason = 'Good value-to-effort ratio - you can ship this faster'
    } else if (recommended.timeScore >= 8) {
      reason = 'Quick results will help you validate and build momentum'
    } else {
      reason = 'Best overall balance of value, effort, and speed'
    }

    return { recommended, others, reason }
  }

  // Generate AI positioning ideas for a product
  const generateAiIdeas = async (product) => {
    const productId = product.id

    setAiIdeas(prev => ({
      ...prev,
      [productId]: { loading: true, ideas: null, error: null }
    }))

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/product-positioning`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            solutionType: product.solutionType,
            solutionDescription: product.description,
            problemText: product.problemText,
            valueAnswers: answers[product.id],
            valueScore: calculateValueScore(product.id),
            niche: nicheLayers?.layer4 || nicheLayers?.layer3 || null
          })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate ideas')
      }

      setAiIdeas(prev => ({
        ...prev,
        [productId]: { loading: false, ideas: data, error: null }
      }))
    } catch (err) {
      console.error('AI ideas error:', err)
      setAiIdeas(prev => ({
        ...prev,
        [productId]: { loading: false, ideas: null, error: err.message }
      }))
    }
  }

  // Handle option selection
  const handleOptionSelect = (option) => {
    const currentProduct = coreProducts[currentProductIndex]
    const currentQuestion = VALUE_QUESTIONS[currentQuestionIndex]

    setAnswers(prev => ({
      ...prev,
      [currentProduct.id]: {
        ...prev[currentProduct.id],
        [currentQuestion.id]: option.value
      }
    }))

    // Move to next question or next product
    if (currentQuestionIndex < VALUE_QUESTIONS.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    } else if (currentProductIndex < coreProducts.length - 1) {
      // Move to next product
      setCurrentProductIndex(prev => prev + 1)
      setCurrentQuestionIndex(0)
    } else {
      // All done - go to summary
      setStage(STAGES.SUMMARY)
    }
  }

  // Go back in questions
  const goBackInQuestions = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    } else if (currentProductIndex > 0) {
      setCurrentProductIndex(prev => prev - 1)
      setCurrentQuestionIndex(VALUE_QUESTIONS.length - 1)
    } else {
      setStage(STAGES.WELCOME)
    }
  }

  // Save results
  const handleSaveResults = async () => {
    if (isLoading || !user) return

    setIsLoading(true)
    setError(null)

    try {
      // Update the offer_builder_assessment with product value scores
      const { data: assessment } = await supabase
        .from('offer_builder_assessments')
        .select('id, responses')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!assessment) {
        throw new Error('No offer data found')
      }

      if (assessment) {
        // Calculate scores for each product
        const productScores = {}
        coreProducts.forEach(prod => {
          productScores[prod.id] = {
            answers: answers[prod.id],
            valueScore: calculateValueScore(prod.id)
          }
        })

        await supabase
          .from('offer_builder_assessments')
          .update({
            responses: {
              ...assessment.responses,
              product_selections: productScores
            },
            updated_at: new Date().toISOString()
          })
          .eq('id', assessment.id)
      }

      // Complete challenge quest
      try {
        await completeFlowQuest({
          userId: user.id,
          flowId: 'product_selection',
          pointsEarned: 30
        })
      } catch (questError) {
        console.warn('Quest completion failed:', questError)
      }

      setStage(STAGES.SUCCESS)
    } catch (err) {
      setError('Failed to save. Please try again.')
      console.error('Save error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // ============ RENDER ============

  // Loading state
  if (stage === STAGES.LOADING) {
    return (
      <div className="product-selection-flow">
        <div className="loading-state">
          <div className="typing-indicator">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>
    )
  }

  // WELCOME STAGE
  if (stage === STAGES.WELCOME) {
    return (
      <div className="product-selection-flow">
        <ProgressDots stageGroups={STAGE_GROUPS} currentStage={stage} />
        <div className="welcome-container">
          <h1 className="welcome-greeting">Product Selection</h1>
          <div className="welcome-message">
            {error ? (
              <>
                <p>{error}</p>
                <button
                  className="primary-button"
                  onClick={() => navigate('/offer-builder')}
                  style={{ marginTop: '24px' }}
                >
                  Go to Offer Builder
                </button>
              </>
            ) : (
              <>
                <p><strong>Let's maximize your product value.</strong></p>
                <p>You have {coreProducts.length} core product{coreProducts.length !== 1 ? 's' : ''} to evaluate.</p>
                <p>For each one, I'll ask 3 questions based on Hormozi's Value Equation.</p>

                <div className="value-equation-preview">
                  <h4>The Value Equation</h4>
                  <div className="equation">
                    <span className="numerator">Dream Outcome × Perceived Likelihood</span>
                    <span className="divider">÷</span>
                    <span className="denominator">Time Delay × Effort</span>
                  </div>
                </div>

                <div className="products-preview">
                  {coreProducts.map((prod, idx) => (
                    <div key={prod.id} className="product-preview-card">
                      <span className="preview-number">{idx + 1}</span>
                      <div className="preview-content">
                        <h4>{prod.label}</h4>
                        <p>{prod.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  className="primary-button glow-button"
                  onClick={() => setStage(STAGES.QUESTIONS)}
                  style={{ marginTop: '24px' }}
                >
                  Evaluate Products
                </button>
              </>
            )}
          </div>
          <button
            className="secondary-button"
            onClick={() => navigate(-1)}
            style={{ marginTop: '12px' }}
          >
            Back
          </button>
        </div>
      </div>
    )
  }

  // QUESTIONS STAGE
  if (stage === STAGES.QUESTIONS) {
    const currentProduct = coreProducts[currentProductIndex]
    const currentQuestion = VALUE_QUESTIONS[currentQuestionIndex]
    const totalQuestions = coreProducts.length * VALUE_QUESTIONS.length
    const currentProgress = (currentProductIndex * VALUE_QUESTIONS.length) + currentQuestionIndex + 1

    return (
      <div className="product-selection-flow">
        <ProgressDots stageGroups={STAGE_GROUPS} currentStage={stage} />
        <div className="question-container">
          <div className="product-context">
            <span className="product-badge">{currentProduct.label}</span>
            <p className="product-desc">{currentProduct.description}</p>
          </div>

          <div className="question-progress">
            Question {currentProgress} of {totalQuestions}
          </div>

          <h2 className="question-text">{currentQuestion.question}</h2>
          <p className="question-subtext">{currentQuestion.subtext}</p>

          <div className="options-list">
            {currentQuestion.options.map((option) => (
              <button
                key={option.value}
                className="option-card"
                onClick={() => handleOptionSelect(option)}
              >
                <div className="option-label">{option.label}</div>
                <div className="option-description">{option.description}</div>
              </button>
            ))}
          </div>

          <BackButton onClick={goBackInQuestions} />
        </div>
      </div>
    )
  }

  // SUMMARY STAGE
  if (stage === STAGES.SUMMARY) {
    const buildFirstRec = getBuildFirstRecommendation()

    return (
      <div className="product-selection-flow">
        <ProgressDots stageGroups={STAGE_GROUPS} currentStage={stage} />
        <div className="summary-container">
          <h2 className="question-text">Your Product Strategy</h2>
          <p className="question-subtext">
            Based on Hormozi's Value Equation
          </p>

          {/* BUILD FIRST RECOMMENDATION - Only show if multiple products */}
          {buildFirstRec && (
            <div className="build-first-section">
              <div className="build-first-header">
                <span className="build-first-badge">🎯 BUILD FIRST</span>
                <h3>{buildFirstRec.recommended.description || buildFirstRec.recommended.label}</h3>
              </div>
              <p className="build-first-reason">{buildFirstRec.reason}</p>
              <div className="build-first-score">
                <span className="score-value" style={{ color: buildFirstRec.recommended.valueLevel.color }}>
                  {buildFirstRec.recommended.valueLevel.icon} {buildFirstRec.recommended.valueScore} pts
                </span>
                <span className="score-label">{buildFirstRec.recommended.valueLevel.label} Value</span>
              </div>
            </div>
          )}

          {/* COMPARISON VIEW - Only show if multiple products */}
          {coreProducts.length > 1 && (
            <div className="comparison-section">
              <h4>📊 Product Comparison</h4>
              <div className="comparison-table">
                <div className="comparison-header">
                  <span>Product</span>
                  <span>Value</span>
                  <span>Speed</span>
                  <span>Effort</span>
                </div>
                {coreProducts.map(product => {
                  const score = calculateValueScore(product.id)
                  const level = getValueLevel(score)
                  const ans = answers[product.id]
                  const isRecommended = buildFirstRec?.recommended.id === product.id

                  return (
                    <div key={product.id} className={`comparison-row ${isRecommended ? 'recommended' : ''}`}>
                      <span className="comparison-product">
                        {isRecommended && <span className="rec-star">★</span>}
                        {product.label}
                      </span>
                      <span className="comparison-value" style={{ color: level.color }}>{score}</span>
                      <span className="comparison-speed">
                        {ans?.time_delay === 'immediate' && '⚡'}
                        {ans?.time_delay === 'days' && '🏃'}
                        {ans?.time_delay === 'weeks' && '🚶'}
                        {ans?.time_delay === 'months' && '🐢'}
                      </span>
                      <span className="comparison-effort">
                        {product.solutionType === 'one_to_one' && '💚'}
                        {product.solutionType === 'digital_product' && '💚'}
                        {product.solutionType === 'group_program' && '💛'}
                        {product.solutionType === 'tech_digital' && '🧡'}
                        {product.solutionType === 'physical_product' && '❤️'}
                      </span>
                    </div>
                  )
                })}
              </div>
              <p className="comparison-legend">
                Speed: ⚡ Immediate → 🐢 Months | Effort: 💚 Low → ❤️ High
              </p>
            </div>
          )}

          {/* PRODUCT CARDS WITH DETAILED INSIGHTS */}
          <div className="scores-list">
            {coreProducts.map((product) => {
              const score = calculateValueScore(product.id)
              const level = getValueLevel(score)
              const ans = answers[product.id]
              const isExpanded = expandedProduct === product.id
              const enhancements = OFFER_ENHANCEMENTS[product.solutionType] || OFFER_ENHANCEMENTS.digital_product
              const aiData = aiIdeas[product.id]

              return (
                <div key={product.id} className={`score-card ${isExpanded ? 'expanded' : ''}`}>
                  <div
                    className="score-header clickable"
                    onClick={() => setExpandedProduct(isExpanded ? null : product.id)}
                  >
                    <div className="header-left">
                      <span className="level-icon">{level.icon}</span>
                      <div>
                        <h3>{product.label}</h3>
                        <p className="score-description">{product.description}</p>
                      </div>
                    </div>
                    <div className="header-right">
                      <div className="score-badge" style={{ backgroundColor: `${level.color}20`, color: level.color }}>
                        {score} - {level.label}
                      </div>
                      <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
                    </div>
                  </div>

                  {/* ALWAYS VISIBLE: Score breakdown */}
                  <div className="score-breakdown">
                    {['dream_outcome', 'time_delay', 'perceived_likelihood'].map((dim, idx) => {
                      const dimData = DIMENSION_IMPROVEMENTS[dim]?.[ans[dim]]
                      const question = VALUE_QUESTIONS[idx]
                      const selectedOption = question.options.find(o => o.value === ans[dim])

                      return (
                        <div key={dim} className={`breakdown-item ${dimData?.status || ''}`}>
                          <span className="breakdown-label">{question.question.replace('?', ':')}</span>
                          <span className="breakdown-value">{selectedOption?.label}</span>
                          {dimData && (
                            <span className={`status-indicator ${dimData.status}`}>
                              {dimData.status === 'excellent' && '✓'}
                              {dimData.status === 'good' && '○'}
                              {dimData.status === 'okay' && '△'}
                              {dimData.status === 'weak' && '!'}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* EXPANDED CONTENT */}
                  {isExpanded && (
                    <div className="expanded-content">
                      {/* Value Level Insights */}
                      <div className="insight-section">
                        <h4>💡 What This Score Means</h4>
                        <p className="insight-summary">{level.summary}</p>
                        <p className="insight-why">{level.whyItWorks}</p>
                        <div className="next-steps">
                          <h5>Recommended Next Steps:</h5>
                          <ol>
                            {level.nextSteps.map((step, i) => (
                              <li key={i}>{step}</li>
                            ))}
                          </ol>
                        </div>
                      </div>

                      {/* Dimension-specific Tips */}
                      <div className="dimension-tips-section">
                        <h4>🎯 Dimension Analysis</h4>
                        {['dream_outcome', 'time_delay', 'perceived_likelihood'].map((dim, idx) => {
                          const dimData = DIMENSION_IMPROVEMENTS[dim]?.[ans[dim]]
                          if (!dimData) return null

                          return (
                            <div key={dim} className={`dimension-tip ${dimData.status}`}>
                              <span className="dim-label">{VALUE_QUESTIONS[idx].question.replace('?', '')}</span>
                              <p className="dim-tip">{dimData.tip}</p>
                              {dimData.improve && (
                                <p className="dim-improve">
                                  <strong>To improve:</strong> {dimData.improve}
                                </p>
                              )}
                            </div>
                          )
                        })}
                      </div>

                      {/* Category-based Offer Enhancements */}
                      <div className="enhancements-section">
                        <h4>🚀 Offer Enhancement Ideas</h4>

                        <div className="enhancement-category">
                          <h5>💎 Bonus Ideas</h5>
                          <ul>
                            {enhancements.bonuses.slice(0, 3).map((bonus, i) => (
                              <li key={i}>{bonus}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="enhancement-category">
                          <h5>🛡️ Guarantee Options</h5>
                          <ul>
                            {enhancements.guarantees.slice(0, 2).map((g, i) => (
                              <li key={i}>{g}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="enhancement-category">
                          <h5>💰 Pricing Strategies</h5>
                          <ul>
                            {enhancements.pricingStrategies.slice(0, 2).map((p, i) => (
                              <li key={i}>{p}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="enhancement-category">
                          <h5>⚡ Delivery Tweaks</h5>
                          <ul>
                            {enhancements.deliveryTweaks.slice(0, 2).map((d, i) => (
                              <li key={i}>{d}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* AI Positioning Section */}
                      <div className="ai-section">
                        {aiData?.loading ? (
                          <div className="ai-loading">
                            <div className="typing-indicator">
                              <span></span><span></span><span></span>
                            </div>
                            <p>Generating personalized positioning...</p>
                          </div>
                        ) : aiData?.ideas ? (
                          <div className="ai-results">
                            <h4>✨ AI-Generated Positioning</h4>

                            {aiData.ideas.positioningStatements && (
                              <div className="ai-positioning">
                                <h5>Positioning Statements</h5>
                                {aiData.ideas.positioningStatements.map((stmt, i) => (
                                  <p key={i} className="positioning-stmt">"{stmt}"</p>
                                ))}
                              </div>
                            )}

                            {aiData.ideas.bonusIdeas && (
                              <div className="ai-bonuses">
                                <h5>Custom Bonus Ideas</h5>
                                <ul>
                                  {aiData.ideas.bonusIdeas.map((b, i) => (
                                    <li key={i}>{b}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {aiData.ideas.mvpSuggestion && (
                              <div className="ai-mvp">
                                <h5>7-Day MVP</h5>
                                <p>{aiData.ideas.mvpSuggestion}</p>
                              </div>
                            )}

                            {aiData.ideas.objectionHandlers && (
                              <div className="ai-objections">
                                <h5>Objection Handlers</h5>
                                <ul>
                                  {aiData.ideas.objectionHandlers.map((obj, i) => (
                                    <li key={i}><strong>{obj.objection}:</strong> {obj.response}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            <button
                              className="ai-refresh-btn"
                              onClick={() => generateAiIdeas(product)}
                            >
                              🔄 Regenerate
                            </button>
                          </div>
                        ) : (
                          <>
                            {aiData?.error && (
                              <p className="ai-error">{aiData.error}</p>
                            )}
                            <button
                              className="ai-generate-btn"
                              onClick={() => generateAiIdeas(product)}
                            >
                              ✨ Get AI Positioning & Ideas
                            </button>
                            <p className="ai-hint">Generate personalized positioning statements, bonus ideas, and MVP suggestions</p>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {error && <p className="error-message">{error}</p>}

          <button
            className="primary-button"
            onClick={handleSaveResults}
            disabled={isLoading}
            style={{ marginTop: '24px' }}
          >
            {isLoading ? 'Saving...' : 'Save & Complete (+30 pts)'}
          </button>

          <BackButton onClick={() => {
            setCurrentProductIndex(coreProducts.length - 1)
            setCurrentQuestionIndex(VALUE_QUESTIONS.length - 1)
            setStage(STAGES.QUESTIONS)
          }} />
        </div>
      </div>
    )
  }

  // SUCCESS STAGE
  if (stage === STAGES.SUCCESS) {
    const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'there'
    const avgScore = Math.round(
      coreProducts.reduce((sum, p) => sum + calculateValueScore(p.id), 0) / coreProducts.length
    )
    const avgLevel = getValueLevel(avgScore)

    return (
      <div className="product-selection-flow">
        <div className="success-container">
          <div className="success-icon">💰</div>
          <h2>Products Evaluated, {userName}!</h2>
          <p>You've scored {coreProducts.length} core product{coreProducts.length !== 1 ? 's' : ''} using the Value Equation.</p>
          <p style={{ color: '#fbbf24', fontWeight: '600', fontSize: '18px' }}>+30 points earned!</p>

          <div className="avg-score-display">
            <span className="avg-label">Average Value Score</span>
            <span className="avg-score" style={{ color: avgLevel.color }}>{avgScore}</span>
            <span className="avg-level" style={{ color: avgLevel.color }}>{avgLevel.label}</span>
          </div>

          <button
            className="primary-button"
            onClick={() => navigate('/7-day-challenge')}
            style={{ marginTop: '24px' }}
          >
            Back to Challenge
          </button>
        </div>
      </div>
    )
  }

  return null
}

export default ProductSelectionFlow
