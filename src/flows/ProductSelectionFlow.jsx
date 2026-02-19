/**
 * ProductSelectionFlow - Product Selection (+9 pts)
 *
 * Follows OfferBuilderFlow to define product details using the Value Equation.
 * Loads all solutions from the Offer Builder.
 *
 * For each solution, asks 5 questions:
 * 1a. How does this solve the problem? (mechanism)
 * 1b. What features will you include? (feature → benefit pairs)
 * 2. Dream Outcome - How big is the transformation?
 * 3. Time Delay - How long until they see results?
 * 4. Perceived Likelihood - How can you prove it works?
 *
 * Uses Hormozi's Value Equation:
 * Value = (Dream Outcome × Perceived Likelihood) / (Time Delay × Effort)
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import { completeFlowQuest } from '../lib/questCompletion'
import { useProjectId } from '../hooks/useProjectId'
import { trackFlowCompletion } from '../lib/flowTracking'
import { useAutoSave } from '../hooks/useAutoSave'
import { BackButton, ProgressDots } from '../components/MoneyModelShared'
import FlowFeedback from '../components/FlowFeedback/FlowFeedback'
import './ProductSelectionFlow.css'

const STAGES = {
  LOADING: 'loading',
  WELCOME: 'welcome',
  MECHANISM: 'mechanism',      // 1a: How does this solve the problem?
  FEATURES: 'features',        // 1b: Feature → Benefit pairs
  QUESTIONS: 'questions',      // Value Equation questions
  PRODUCT_TRANSITION: 'product_transition', // Transition between products
  SUMMARY: 'summary',
  SUCCESS: 'success'
}

const STAGE_GROUPS = [
  { id: 'welcome', label: 'Welcome', stages: [STAGES.WELCOME] },
  { id: 'define', label: 'Define', stages: [STAGES.MECHANISM, STAGES.FEATURES] },
  { id: 'value', label: 'Value', stages: [STAGES.QUESTIONS] },
  { id: 'summary', label: 'Summary', stages: [STAGES.SUMMARY] },
  { id: 'complete', label: 'Complete', stages: [STAGES.SUCCESS] }
]

// Solution type labels - matches OfferBuilderFlow
const SOLUTION_LABELS = {
  // Services
  one_to_one: '1:1 Service',
  one_to_many: '1:Many Service',
  custom_service: 'Custom Service',
  packaged_service: 'Packaged Service',
  hybrid_service: 'Hybrid Service',
  // Productized
  group_program: 'Group Program',
  automated_group: 'Self-Paced Course',
  live_group: 'Live Cohort',
  managed_service: 'Done-For-You',
  membership: 'Membership',
  // Products
  digital_product: 'Digital Product',
  tech_digital: 'Tech/Digital',
  software: 'Software/SaaS',
  physical_product: 'Physical Product',
  content: 'Content',
  content_podcast: 'Podcast',
  content_newsletter: 'Newsletter',
  content_youtube: 'YouTube Channel',
  mixed_products: 'Mixed Products'
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
    subtext: 'Select all that apply — the more proof, the higher the perceived likelihood of success',
    multiSelect: true,
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
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const { projectId } = useProjectId()
  const showResults = searchParams.get('results') === 'true'

  const [stage, setStage] = useState(STAGES.LOADING)
  const [coreProducts, setCoreProducts] = useState([])
  const [currentProductIndex, setCurrentProductIndex] = useState(0)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState({}) // { solutionId: { dream_outcome: '', time_delay: '', perceived_likelihood: '' } }
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [expandedProduct, setExpandedProduct] = useState(null) // Track which product card is expanded

  // New: Product specification state
  // { solutionId: { mechanism: '', featureBenefits: [{ feature: '', benefit: '' }] } }
  const [productSpecs, setProductSpecs] = useState({})
  const [currentMechanism, setCurrentMechanism] = useState('')
  const [currentFeatureBenefits, setCurrentFeatureBenefits] = useState([
    { feature: '', benefit: '' }
  ])

  // Auto-save state
  const [showResumePrompt, setShowResumePrompt] = useState(false)
  const [savedProgressData, setSavedProgressData] = useState(null)
  const { saveProgress, loadProgress, clearProgress } = useAutoSave('product-selection', user?.id)

  // Existing products from products table (for looking up names)
  const [existingProducts, setExistingProducts] = useState([])
  const [existingProductsLoaded, setExistingProductsLoaded] = useState(false)

  // Load existing products first, then solutions (grouping depends on product names)
  useEffect(() => {
    if (user) {
      loadExistingProducts()
    }
  }, [user])

  // Load products for name lookup
  const loadExistingProducts = async () => {
    try {
      const { data: products, error } = await supabase
        .from('products')
        .select('id, name')
        .eq('user_id', user.id)
      if (!error && products) {
        setExistingProducts(products)
      }
    } catch (err) {
      console.error('Error loading existing products:', err)
    } finally {
      setExistingProductsLoaded(true)
    }
  }

  // Load solutions after existing products are available (for grouping by name)
  useEffect(() => {
    if (user && existingProductsLoaded) {
      loadProducts()
    }
  }, [user, existingProductsLoaded])

  // Note: Removed auto-register useEffect that was causing duplicate quest completions
  // Quest completion now only happens once when flow is completed

  // Check for saved progress after products load
  useEffect(() => {
    if (user && coreProducts.length > 0 && stage === STAGES.WELCOME) {
      const saved = loadProgress()
      if (saved && saved.stage && saved.stage !== STAGES.LOADING && saved.stage !== STAGES.SUCCESS && saved.stage !== STAGES.WELCOME) {
        setSavedProgressData(saved)
        setShowResumePrompt(true)
      }
    }
  }, [user, coreProducts, stage, loadProgress])

  // Auto-save on state changes
  useEffect(() => {
    if (!user || stage === STAGES.LOADING || stage === STAGES.SUCCESS || stage === STAGES.WELCOME) return
    if (coreProducts.length === 0) return

    const progressData = {
      stage,
      currentProductIndex,
      currentQuestionIndex,
      answers,
      productSpecs,
      currentMechanism,
      currentFeatureBenefits
    }
    saveProgress(progressData)
  }, [stage, currentProductIndex, currentQuestionIndex, answers, productSpecs, currentMechanism, currentFeatureBenefits, user, coreProducts, saveProgress])

  // Handle resume progress
  const handleResumeProgress = useCallback(() => {
    if (savedProgressData) {
      setStage(savedProgressData.stage)
      if (savedProgressData.currentProductIndex !== undefined) setCurrentProductIndex(savedProgressData.currentProductIndex)
      if (savedProgressData.currentQuestionIndex !== undefined) setCurrentQuestionIndex(savedProgressData.currentQuestionIndex)
      if (savedProgressData.answers) setAnswers(savedProgressData.answers)
      if (savedProgressData.productSpecs) setProductSpecs(savedProgressData.productSpecs)
      if (savedProgressData.currentMechanism) setCurrentMechanism(savedProgressData.currentMechanism)
      if (savedProgressData.currentFeatureBenefits) setCurrentFeatureBenefits(savedProgressData.currentFeatureBenefits)
    }
    setShowResumePrompt(false)
  }, [savedProgressData])

  // Handle start fresh
  const handleStartFresh = useCallback(() => {
    clearProgress()
    setShowResumePrompt(false)
    setSavedProgressData(null)
  }, [clearProgress])

  const loadProducts = async () => {
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
        // Get all solutions from Offer Builder
        const solutions = assessment.responses.q8_solutions.solutions
        const solutionsArray = Array.isArray(solutions) ? solutions : Object.values(solutions)
        const validSolutions = solutionsArray
          .filter(data => data && data.description)
          .map((data, idx) => ({
            id: `solution_${idx}`,
            ...data,
            label: SOLUTION_LABELS[data.solutionType] || data.solutionType || 'Product'
          }))

        // Group solutions by existingProductId
        const grouped = {}
        const standalone = []

        validSolutions.forEach(sol => {
          if (sol.existingProductId) {
            if (!grouped[sol.existingProductId]) {
              grouped[sol.existingProductId] = []
            }
            grouped[sol.existingProductId].push(sol)
          } else {
            standalone.push(sol)
          }
        })

        // Build product list: grouped products + standalone solutions
        const products = []

        // Add grouped products (2+ solutions sharing an existingProductId)
        Object.entries(grouped).forEach(([productId, groupSolutions]) => {
          if (groupSolutions.length >= 2) {
            // Find product name from existing products
            const existingProduct = existingProducts.find(p => p.id === productId)
            const firstSol = groupSolutions[0]
            products.push({
              id: `group_${productId}`,
              type: 'group',
              existingProductId: productId,
              name: existingProduct?.name || firstSol.name || 'Product',
              solutionType: firstSol.solutionType,
              label: SOLUTION_LABELS[firstSol.solutionType] || firstSol.solutionType || 'Product',
              description: `${groupSolutions.length} solutions grouped together`,
              solutions: groupSolutions,
              // Collect all unique problem texts for context
              problemTexts: [...new Set(groupSolutions.map(s => s.problemText).filter(Boolean))]
            })
          } else {
            // Single solution with an existingProductId — treat as standalone
            standalone.push(groupSolutions[0])
          }
        })

        // Add standalone solutions
        standalone.forEach(sol => {
          products.push({
            ...sol,
            type: 'standalone'
          })
        })

        setCoreProducts(products)

        // Check if we have existing product_selections data (for View Results)
        const existingSelections = assessment.responses?.product_selections
        if (showResults && existingSelections && Object.keys(existingSelections).length > 0) {
          const loadedAnswers = {}
          const loadedSpecs = {}
          products.forEach(prod => {
            const savedData = existingSelections[prod.id]
            if (savedData) {
              loadedAnswers[prod.id] = savedData.answers || { dream_outcome: null, time_delay: null, perceived_likelihood: null }
              loadedSpecs[prod.id] = {
                mechanism: savedData.mechanism || '',
                featureBenefits: savedData.featureBenefits || []
              }
            } else {
              loadedAnswers[prod.id] = { dream_outcome: null, time_delay: null, perceived_likelihood: null }
              loadedSpecs[prod.id] = { mechanism: '', featureBenefits: [] }
            }
          })
          setAnswers(loadedAnswers)
          setProductSpecs(loadedSpecs)
          setStage(STAGES.SUMMARY)
          return
        }

        // Initialize answers and specs for each product
        const initialAnswers = {}
        const initialSpecs = {}
        products.forEach(prod => {
          initialAnswers[prod.id] = { dream_outcome: null, time_delay: null, perceived_likelihood: null }
          // For groups, auto-fill features from solution descriptions
          if (prod.type === 'group') {
            initialSpecs[prod.id] = {
              mechanism: '',
              featureBenefits: prod.solutions.map(sol => ({
                feature: sol.description || '',
                benefit: sol.problemText ? `Overcomes: ${sol.problemText}` : ''
              }))
            }
          } else {
            initialSpecs[prod.id] = { mechanism: '', featureBenefits: [] }
          }
        })
        setAnswers(initialAnswers)
        setProductSpecs(initialSpecs)

        if (products.length === 0) {
          setError('No products found. Complete the Offer Builder first.')
        }
      } else {
        setError('No products found. Complete the Offer Builder first.')
      }

      setStage(STAGES.WELCOME)
    } catch (err) {
      console.error('Error loading products:', err)
      setError('Failed to load products. Complete the Offer Builder first.')
      setStage(STAGES.WELCOME)
    }
  }

  // Get display label for a product (includes existing product name or new product name)
  const getProductDisplayLabel = (product) => {
    // For grouped products, show product name with feature count
    if (product.type === 'group') {
      const name = product.name || 'Product'
      return name
    }

    const baseLabel = SOLUTION_LABELS[product.solutionType] || product.solutionType || 'Product'
    // For existing products, use the linked product's name
    if (product.existingProductId) {
      const existingProduct = existingProducts.find(p => p.id === product.existingProductId)
      if (existingProduct?.name) {
        return `${baseLabel}: ${existingProduct.name}`
      }
    }
    // For new products, use the name they gave it
    if (product.name?.trim()) {
      return `${baseLabel}: ${product.name}`
    }
    return baseLabel
  }

  // Calculate value score for a product (0-100 scale)
  // Weighted average: Dream (40%) + Likelihood (35%) + Time (25%)
  const calculateValueScore = (productId) => {
    const ans = answers[productId]
    if (!ans) return 0

    const dreamOutcome = VALUE_QUESTIONS[0].options.find(o => o.value === ans.dream_outcome)?.score || 0
    const timeDelay = VALUE_QUESTIONS[1].options.find(o => o.value === ans.time_delay)?.score || 0

    // perceived_likelihood is now multi-select (array) - take highest score among selections
    let likelihood = 0
    if (Array.isArray(ans.perceived_likelihood)) {
      const scores = ans.perceived_likelihood.map(v =>
        VALUE_QUESTIONS[2].options.find(o => o.value === v)?.score || 0
      )
      likelihood = scores.length > 0 ? Math.max(...scores) : 0
    } else {
      // Backwards compatibility for single value
      likelihood = VALUE_QUESTIONS[2].options.find(o => o.value === ans.perceived_likelihood)?.score || 0
    }

    // Weighted average formula (0-100 scale)
    // Dream outcome: 40% weight, Likelihood: 35% weight, Time: 25% weight
    const score = (dreamOutcome * 4) + (likelihood * 3.5) + (timeDelay * 2.5)
    return Math.round(score)
  }

  // Get value level with full insights (adjusted for 0-100 scale)
  // Score range is ~41-100, so thresholds adjusted accordingly
  const getValueLevel = (score) => {
    if (score >= 90) return { ...VALUE_LEVEL_INSIGHTS.exceptional, key: 'exceptional' }
    if (score >= 75) return { ...VALUE_LEVEL_INSIGHTS.strong, key: 'strong' }
    if (score >= 55) return { ...VALUE_LEVEL_INSIGHTS.moderate, key: 'moderate' }
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

  // Handle mechanism submission (1a)
  const handleMechanismSubmit = () => {
    if (!currentMechanism.trim()) return

    const currentProduct = coreProducts[currentProductIndex]
    setProductSpecs(prev => ({
      ...prev,
      [currentProduct.id]: {
        ...prev[currentProduct.id],
        mechanism: currentMechanism.trim()
      }
    }))

    // Move to features stage — preserve auto-filled features for groups
    const existingFeatures = productSpecs[currentProduct.id]?.featureBenefits
    if (!existingFeatures || existingFeatures.length === 0) {
      setCurrentFeatureBenefits([{ feature: '', benefit: '' }])
    }
    // If currentFeatureBenefits already has content (from init or previous edit), keep it
    setStage(STAGES.FEATURES)
  }

  // Handle feature-benefit updates
  const updateFeatureBenefit = (index, field, value) => {
    setCurrentFeatureBenefits(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const addFeatureBenefitRow = () => {
    setCurrentFeatureBenefits(prev => [...prev, { feature: '', benefit: '' }])
  }

  const removeFeatureBenefitRow = (index) => {
    if (currentFeatureBenefits.length <= 1) return
    setCurrentFeatureBenefits(prev => prev.filter((_, i) => i !== index))
  }

  // Handle features submission (1b)
  const handleFeaturesSubmit = () => {
    const validFeatures = currentFeatureBenefits.filter(
      fb => fb.feature.trim() && fb.benefit.trim()
    )
    if (validFeatures.length === 0) return

    const currentProduct = coreProducts[currentProductIndex]
    setProductSpecs(prev => ({
      ...prev,
      [currentProduct.id]: {
        ...prev[currentProduct.id],
        featureBenefits: validFeatures
      }
    }))

    // Move to Value Equation questions
    setCurrentQuestionIndex(0)
    setStage(STAGES.QUESTIONS)
  }

  // Handle option selection (Value Equation questions)
  const handleOptionSelect = (option) => {
    const currentProduct = coreProducts[currentProductIndex]
    const currentQuestion = VALUE_QUESTIONS[currentQuestionIndex]

    // Multi-select: toggle selection
    if (currentQuestion.multiSelect) {
      setAnswers(prev => {
        const currentSelections = prev[currentProduct.id]?.[currentQuestion.id] || []
        const isSelected = currentSelections.includes(option.value)
        const newSelections = isSelected
          ? currentSelections.filter(v => v !== option.value)
          : [...currentSelections, option.value]

        return {
          ...prev,
          [currentProduct.id]: {
            ...prev[currentProduct.id],
            [currentQuestion.id]: newSelections
          }
        }
      })
      return // Don't auto-advance for multi-select
    }

    // Single select: save and advance
    setAnswers(prev => ({
      ...prev,
      [currentProduct.id]: {
        ...prev[currentProduct.id],
        [currentQuestion.id]: option.value
      }
    }))

    advanceToNextQuestion()
  }

  // Advance to next question or product
  const advanceToNextQuestion = () => {
    if (currentQuestionIndex < VALUE_QUESTIONS.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    } else if (currentProductIndex < coreProducts.length - 1) {
      // Show transition screen before moving to next product
      setStage(STAGES.PRODUCT_TRANSITION)
    } else {
      // All done - go to summary
      setStage(STAGES.SUMMARY)
    }
  }

  // Start next product from transition screen
  const startNextProduct = () => {
    const nextIndex = currentProductIndex + 1
    setCurrentProductIndex(nextIndex)
    setCurrentQuestionIndex(0)
    const nextProduct = coreProducts[nextIndex]
    // Pre-fill mechanism: use saved spec, or description for standalone products
    setCurrentMechanism(
      productSpecs[nextProduct?.id]?.mechanism ||
      (nextProduct?.type === 'group' ? '' : (nextProduct?.description || ''))
    )
    // Pre-fill features: use saved spec (groups have auto-filled features from init)
    const existingFeatures = productSpecs[nextProduct?.id]?.featureBenefits
    setCurrentFeatureBenefits(
      existingFeatures?.length > 0
        ? existingFeatures
        : [{ feature: '', benefit: '' }]
    )
    setStage(STAGES.MECHANISM)
  }

  // Go back in flow
  const goBackInQuestions = () => {
    if (stage === STAGES.QUESTIONS) {
      if (currentQuestionIndex > 0) {
        setCurrentQuestionIndex(prev => prev - 1)
      } else {
        // Go back to features
        setStage(STAGES.FEATURES)
      }
    } else if (stage === STAGES.FEATURES) {
      setStage(STAGES.MECHANISM)
    } else if (stage === STAGES.MECHANISM) {
      if (currentProductIndex > 0) {
        // Go to previous product's last question
        setCurrentProductIndex(prev => prev - 1)
        setCurrentQuestionIndex(VALUE_QUESTIONS.length - 1)
        const prevProduct = coreProducts[currentProductIndex - 1]
        setCurrentMechanism(productSpecs[prevProduct?.id]?.mechanism || '')
        setCurrentFeatureBenefits(
          productSpecs[prevProduct?.id]?.featureBenefits?.length > 0
            ? productSpecs[prevProduct.id].featureBenefits
            : [{ feature: '', benefit: '' }]
        )
        setStage(STAGES.QUESTIONS)
      } else {
        setStage(STAGES.WELCOME)
      }
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
        // Calculate scores for each product (including specs)
        const productScores = {}
        coreProducts.forEach(prod => {
          productScores[prod.id] = {
            // Product specification
            mechanism: productSpecs[prod.id]?.mechanism || '',
            featureBenefits: productSpecs[prod.id]?.featureBenefits || [],
            // Value equation answers
            answers: answers[prod.id],
            valueScore: calculateValueScore(prod.id),
            // Track grouped solutions for traceability
            ...(prod.type === 'group' ? {
              groupedSolutionIds: prod.solutions.map(s => s.id),
              existingProductId: prod.existingProductId
            } : {})
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

      // Track flow completion
      try {
        await trackFlowCompletion({
          userId: user.id,
          projectId,
          flowType: 'product_selection'
        })
      } catch (trackingError) {
        console.warn('Flow tracking failed:', trackingError)
      }

      // Complete challenge quest
      try {
        await completeFlowQuest({
          userId: user.id,
          flowId: 'product_selection',
          pointsEarned: 9
        })
      } catch (questError) {
        console.warn('Quest completion failed:', questError)
      }

      clearProgress()
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

  // Resume prompt
  if (showResumePrompt && savedProgressData) {
    const stageLabel = savedProgressData.stage?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    return (
      <div className="product-selection-flow">
        <ProgressDots stageGroups={STAGE_GROUPS} currentStage={STAGES.WELCOME} />
        <div className="welcome-container">
          <h1 className="welcome-greeting">Welcome Back!</h1>
          <div className="resume-prompt">
            <p className="resume-icon">💾</p>
            <p><strong>You have saved progress</strong></p>
            <p className="resume-stage">
              You were on: <strong>{stageLabel}</strong>
            </p>
            {savedProgressData.currentProductIndex !== undefined && coreProducts.length > 0 && (
              <p className="resume-detail">
                Product {savedProgressData.currentProductIndex + 1} of {coreProducts.length}
              </p>
            )}
          </div>
          <button className="primary-button glow-button" onClick={handleResumeProgress}>
            Continue Where I Left Off
          </button>
          <button className="secondary-button" onClick={handleStartFresh} style={{ marginTop: '12px' }}>
            Start Fresh
          </button>
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
                <p>You have {coreProducts.length} product{coreProducts.length !== 1 ? 's' : ''} to define.</p>
                <p>For each one, we'll define how it works and assess its value.</p>

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
                        <h4>{getProductDisplayLabel(prod)}</h4>
                        {prod.type === 'group' ? (
                          <>
                            <p className="group-feature-count">{prod.solutions.length} features from Offer Builder</p>
                            <ul className="group-solution-list">
                              {prod.solutions.map((sol, i) => (
                                <li key={i}>{sol.name || sol.description?.substring(0, 60) || sol.label}</li>
                              ))}
                            </ul>
                          </>
                        ) : (
                          <p>{prod.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  className="primary-button glow-button"
                  onClick={() => {
                    const firstProduct = coreProducts[0]
                    // Pre-fill mechanism with description (standalone) or empty (group)
                    setCurrentMechanism(firstProduct?.type === 'group' ? '' : (firstProduct?.description || ''))
                    // Pre-fill features from initialSpecs (groups have auto-filled features)
                    const existingFeatures = productSpecs[firstProduct?.id]?.featureBenefits
                    setCurrentFeatureBenefits(
                      existingFeatures?.length > 0
                        ? existingFeatures
                        : [{ feature: '', benefit: '' }]
                    )
                    setStage(STAGES.MECHANISM)
                  }}
                  style={{ marginTop: '24px' }}
                >
                  Define Products
                </button>
              </>
            )}
          </div>
          <button
            className="secondary-button"
            onClick={() => navigate('/7-day-challenge')}
            style={{ marginTop: '12px' }}
          >
            Back
          </button>
        </div>
      </div>
    )
  }

  // MECHANISM STAGE (1a)
  if (stage === STAGES.MECHANISM) {
    const currentProduct = coreProducts[currentProductIndex]
    const isValid = currentMechanism.trim().length >= 20

    return (
      <div className="product-selection-flow">
        <ProgressDots stageGroups={STAGE_GROUPS} currentStage={stage} />
        <div className="question-container mechanism-container">
          <div className="product-context">
            <span className="product-badge">Product {currentProductIndex + 1} of {coreProducts.length}</span>
            <h3 className="product-name">{getProductDisplayLabel(currentProduct)}</h3>
            {currentProduct.type === 'group' ? (
              <div className="product-problem">
                <span>Solving:</span>
                <ul className="problem-list">
                  {currentProduct.problemTexts?.map((text, i) => (
                    <li key={i}>{text}</li>
                  ))}
                </ul>
              </div>
            ) : (
              currentProduct.problemText && <p className="product-problem">Solving: {currentProduct.problemText}</p>
            )}
          </div>

          <div className="question-content">
            <h2 className="question-text">
              {currentProduct.type === 'group'
                ? `How does ${getProductDisplayLabel(currentProduct)} solve their problems?`
                : 'How does this solve their problem?'}
            </h2>
            <p className="question-subtext">
              Explain the approach or mechanism — what makes this solution work for them?
            </p>

            <textarea
              className="mechanism-input"
              placeholder="E.g., &quot;Through weekly accountability sessions and a proven 8-step framework, they get consistent feedback and structure to stay on track, even when motivation drops...&quot;"
              value={currentMechanism}
              onChange={(e) => setCurrentMechanism(e.target.value)}
              rows={5}
            />
            <div className="char-hint">
              {currentMechanism.length} characters {currentMechanism.length < 20 && '(minimum 20)'}
            </div>
          </div>

          <button
            className="primary-button"
            onClick={handleMechanismSubmit}
            disabled={!isValid}
            style={{ marginTop: '24px' }}
          >
            Continue
          </button>
          <BackButton onClick={goBackInQuestions} />
        </div>
      </div>
    )
  }

  // FEATURES STAGE (1b)
  if (stage === STAGES.FEATURES) {
    const currentProduct = coreProducts[currentProductIndex]
    const validCount = currentFeatureBenefits.filter(
      fb => fb.feature.trim() && fb.benefit.trim()
    ).length
    const isValid = validCount >= 2

    return (
      <div className="product-selection-flow">
        <ProgressDots stageGroups={STAGE_GROUPS} currentStage={stage} />
        <div className="question-container features-container">
          <div className="product-context">
            <span className="product-badge">Product {currentProductIndex + 1} of {coreProducts.length}</span>
            <h3 className="product-name">{getProductDisplayLabel(currentProduct)}</h3>
          </div>

          <div className="question-content">
            <h2 className="question-text">What will you include?</h2>
            <p className="question-subtext">
              {currentProduct.type === 'group'
                ? `We've pre-filled ${currentProduct.solutions.length} features from your Offer Builder solutions. Edit, add, or remove as needed.`
                : 'List each feature and the specific benefit it provides to solve their problem.'}
            </p>

            <div className="feature-benefit-table">
              <div className="table-header">
                <span className="header-feature">Feature</span>
                <span className="header-arrow">→</span>
                <span className="header-benefit">Benefit</span>
              </div>

              {currentFeatureBenefits.map((fb, index) => (
                <div key={index} className="feature-benefit-row">
                  <div className="input-with-label">
                    <label className="input-label">Feature</label>
                    <input
                      type="text"
                      className="feature-input"
                      placeholder="e.g., Weekly group call"
                      value={fb.feature}
                      onChange={(e) => updateFeatureBenefit(index, 'feature', e.target.value)}
                    />
                  </div>
                  <span className="row-arrow">→</span>
                  <div className="input-with-label">
                    <label className="input-label">Benefit</label>
                    <input
                      type="text"
                      className="benefit-input"
                      placeholder="e.g., Stay accountable and get unstuck"
                      value={fb.benefit}
                      onChange={(e) => updateFeatureBenefit(index, 'benefit', e.target.value)}
                    />
                  </div>
                  {currentFeatureBenefits.length > 1 && (
                    <button
                      type="button"
                      className="remove-row-btn"
                      onClick={() => removeFeatureBenefitRow(index)}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                className="add-row-btn"
                onClick={addFeatureBenefitRow}
              >
                + Add another feature
              </button>
            </div>

            <div className="feature-count">
              {validCount} feature{validCount !== 1 ? 's' : ''} added
              {validCount < 2 && ' (minimum 2)'}
            </div>
          </div>

          <button
            className="primary-button"
            onClick={handleFeaturesSubmit}
            disabled={!isValid}
            style={{ marginTop: '24px' }}
          >
            Continue to Value Assessment
          </button>
          <BackButton onClick={goBackInQuestions} />
        </div>
      </div>
    )
  }

  // QUESTIONS STAGE (Value Equation)
  if (stage === STAGES.QUESTIONS) {
    const currentProduct = coreProducts[currentProductIndex]
    const currentQuestion = VALUE_QUESTIONS[currentQuestionIndex]
    const totalQuestions = coreProducts.length * VALUE_QUESTIONS.length
    const currentProgress = (currentProductIndex * VALUE_QUESTIONS.length) + currentQuestionIndex + 1

    // Get current selections for multi-select
    const currentSelections = currentQuestion.multiSelect
      ? (answers[currentProduct.id]?.[currentQuestion.id] || [])
      : null

    return (
      <div className="product-selection-flow">
        <ProgressDots stageGroups={STAGE_GROUPS} currentStage={stage} />
        <div className="question-container">
          <div className="product-context">
            <span className="product-badge">{getProductDisplayLabel(currentProduct)}</span>
            {currentProduct.type === 'group' ? (
              currentProduct.problemTexts?.length > 0 && (
                <p className="product-problem">Solving: {currentProduct.problemTexts.join(', ')}</p>
              )
            ) : (
              currentProduct.problemText && (
                <p className="product-problem">Solving: {currentProduct.problemText}</p>
              )
            )}
          </div>

          <div className="question-progress">
            Question {currentProgress} of {totalQuestions}
          </div>

          <h2 className="question-text">{currentQuestion.question}</h2>
          <p className="question-subtext">{currentQuestion.subtext}</p>

          <div className="options-list">
            {currentQuestion.options.map((option) => {
              const isSelected = currentQuestion.multiSelect && currentSelections.includes(option.value)
              return (
                <button
                  key={option.value}
                  className={`option-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleOptionSelect(option)}
                >
                  {currentQuestion.multiSelect && (
                    <span className="option-checkbox">{isSelected ? '✓' : ''}</span>
                  )}
                  <div className="option-content">
                    <div className="option-label">{option.label}</div>
                    <div className="option-description">{option.description}</div>
                  </div>
                </button>
              )
            })}
          </div>

          {currentQuestion.multiSelect && (
            <button
              className="primary-button"
              onClick={advanceToNextQuestion}
              disabled={currentSelections.length === 0}
              style={{ marginTop: '24px' }}
            >
              Continue
            </button>
          )}

          <BackButton onClick={goBackInQuestions} />
        </div>
      </div>
    )
  }

  // PRODUCT TRANSITION STAGE
  if (stage === STAGES.PRODUCT_TRANSITION) {
    const completedProduct = coreProducts[currentProductIndex]
    const nextProduct = coreProducts[currentProductIndex + 1]
    const completedScore = calculateValueScore(completedProduct.id)
    const completedLevel = getValueLevel(completedScore)

    return (
      <div className="product-selection-flow">
        <ProgressDots stageGroups={STAGE_GROUPS} currentStage={stage} />
        <div className="transition-container">
          <div className="transition-completed">
            <span className="completed-icon">✓</span>
            <h3>Product {currentProductIndex + 1} Complete!</h3>
            <div className="completed-product-card">
              <span className="product-badge">{getProductDisplayLabel(completedProduct)}</span>
              <div className="completed-score">
                <span className="score-value" style={{ color: completedLevel.color }}>{completedScore}</span>
                <span className="score-label">Value Score</span>
              </div>
            </div>
          </div>

          <div className="transition-divider">
            <span className="divider-line"></span>
            <span className="divider-text">Up Next</span>
            <span className="divider-line"></span>
          </div>

          <div className="transition-next">
            <div className="next-product-card">
              <span className="next-badge">Product {currentProductIndex + 2} of {coreProducts.length}</span>
              <h2 className="next-product-name">{getProductDisplayLabel(nextProduct)}</h2>
              {nextProduct.type === 'group' ? (
                <p className="next-product-problem">
                  {nextProduct.solutions.length} features to define
                </p>
              ) : (
                nextProduct.problemText && (
                  <p className="next-product-problem">Solving: {nextProduct.problemText}</p>
                )
              )}
            </div>
          </div>

          <button
            className="primary-button glow-button"
            onClick={startNextProduct}
          >
            Define {getProductDisplayLabel(nextProduct)}
          </button>
          <BackButton onClick={() => {
            setCurrentQuestionIndex(VALUE_QUESTIONS.length - 1)
            setStage(STAGES.QUESTIONS)
          }} />
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
                <h3>{getProductDisplayLabel(buildFirstRec.recommended)}</h3>
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
                        {getProductDisplayLabel(product)}
                      </span>
                      <span className="comparison-value" style={{ color: level.color }}>{score}</span>
                      <span className="comparison-speed">
                        {ans?.time_delay === 'immediate' && '⚡'}
                        {ans?.time_delay === 'days' && '🏃'}
                        {ans?.time_delay === 'weeks' && '🚶'}
                        {ans?.time_delay === 'months' && '🐢'}
                      </span>
                    </div>
                  )
                })}
              </div>
              <p className="comparison-legend">
                Speed: ⚡ Immediate → 🐢 Months
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

              return (
                <div key={product.id} className={`score-card ${isExpanded ? 'expanded' : ''}`}>
                  <div className="score-header">
                    <div className="header-left">
                      <span className="level-icon">{level.icon}</span>
                      <div>
                        <h3>{getProductDisplayLabel(product)}</h3>
                        <p className="score-description">
                          {product.type === 'group'
                            ? `${product.solutions.length} features grouped from Offer Builder`
                            : product.description}
                        </p>
                      </div>
                    </div>
                    <div className="header-right">
                      <div className="score-badge" style={{ backgroundColor: `${level.color}20`, color: level.color }}>
                        {score} - {level.label}
                      </div>
                    </div>
                  </div>

                  {/* PRODUCT SPECIFICATION - How it solves & what's included */}
                  {productSpecs[product.id]?.mechanism && (
                    <div className="product-spec-section">
                      <div className="spec-mechanism">
                        <h5>How it solves their problem:</h5>
                        <p>{productSpecs[product.id].mechanism}</p>
                      </div>
                      {productSpecs[product.id]?.featureBenefits?.length > 0 && (
                        <div className="spec-features">
                          <h5>What's included:</h5>
                          <ul className="feature-benefit-list">
                            {productSpecs[product.id].featureBenefits.map((fb, i) => (
                              <li key={i}>
                                <span className="fb-feature">{fb.feature}</span>
                                <span className="fb-arrow">→</span>
                                <span className="fb-benefit">{fb.benefit}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ALWAYS VISIBLE: Score breakdown */}
                  <div className="score-breakdown">
                    {['dream_outcome', 'time_delay', 'perceived_likelihood'].map((dim, idx) => {
                      const question = VALUE_QUESTIONS[idx]
                      const answerValue = ans[dim]

                      // Handle multi-select (array) for perceived_likelihood
                      let displayLabel = ''
                      let dimData = null
                      if (Array.isArray(answerValue)) {
                        const labels = answerValue.map(v =>
                          question.options.find(o => o.value === v)?.label
                        ).filter(Boolean)
                        displayLabel = labels.join(', ')
                        // Use first selection for status indicator
                        dimData = DIMENSION_IMPROVEMENTS[dim]?.[answerValue[0]]
                      } else {
                        const selectedOption = question.options.find(o => o.value === answerValue)
                        displayLabel = selectedOption?.label || ''
                        dimData = DIMENSION_IMPROVEMENTS[dim]?.[answerValue]
                      }

                      return (
                        <div key={dim} className={`breakdown-item ${dimData?.status || ''}`}>
                          <span className="breakdown-label">{question.question.replace('?', ':')}</span>
                          <span className="breakdown-value">{displayLabel}</span>
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

                  {/* Learn more toggle */}
                  <button
                    className="learn-more-btn"
                    onClick={() => setExpandedProduct(isExpanded ? null : product.id)}
                  >
                    <span>{isExpanded ? 'Hide details' : 'Learn more'}</span>
                    <span className="learn-more-icon">{isExpanded ? '▲' : '▼'}</span>
                  </button>

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
                          const answerValue = ans[dim]
                          // For multi-select, use first selection for tips
                          const lookupValue = Array.isArray(answerValue) ? answerValue[0] : answerValue
                          const dimData = DIMENSION_IMPROVEMENTS[dim]?.[lookupValue]
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
            {isLoading ? 'Saving...' : 'Save & Complete (+9 pts)'}
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
          <h2>Products Defined, {userName}!</h2>
          <p>You've defined {coreProducts.length} product{coreProducts.length !== 1 ? 's' : ''} with mechanisms and features.</p>
          <p style={{ color: '#fbbf24', fontWeight: '600', fontSize: '18px' }}>+9 points earned!</p>

          <div className="avg-score-display">
            <span className="avg-label">Average Value Score</span>
            <span className="avg-score" style={{ color: avgLevel.color }}>{avgScore}</span>
            <span className="avg-level" style={{ color: avgLevel.color }}>{avgLevel.label}</span>
          </div>

          <FlowFeedback flowType="product_selection" userId={user?.id} />
        </div>

        <div className="success-footer">
          <button
            className="primary-button"
            onClick={() => navigate('/7-day-challenge')}
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
