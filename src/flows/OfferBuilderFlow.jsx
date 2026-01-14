/**
 * OfferBuilderFlow - $100M Offer Builder (+25 pts)
 *
 * Stage 2 (Product Creation) flow for categorizing solutions using
 * Alex Hormozi's $100M Offers framework.
 *
 * Flow:
 * 1. Time Check → Welcome → Persona Select
 * 2. Review Answers (pre-filled from validation)
 * 3. Q6 (Niche 4-Layer) → Q7 (Reasons) → Q8 (Solutions)
 * 4. Lead Magnet Education → Bonus Education → Categorize Solutions
 * 5. Summary → Success (nudges to Product Selection & Lead Magnet Selection)
 *
 * Solution Types: 1:1 Service, 1:Many Service, Tech/Digital, Physical Product
 * Categories: Core Product, Lead Magnet, Bonus, Skip
 *
 * Related Flows:
 * - ProductSelectionFlow (+30 pts): Finalize core products with Value Equation
 * - LeadMagnetSelectionFlow (+30 pts): Finalize lead magnets with type selection
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import { completeFlowQuest } from '../lib/questCompletion'
import { useAutoSave } from '../hooks/useAutoSave'
import { BackButton, ProgressDots } from '../components/MoneyModelShared'
import './OfferBuilderFlow.css'

const STAGES = {
  TIME_CHECK: 'time_check',
  WELCOME: 'welcome',
  PERSONA_SELECT: 'persona_select',
  REVIEW_ANSWERS: 'review_answers',
  Q6: 'q6',
  Q7: 'q7',
  Q8: 'q8',
  LM_EDUCATION: 'lm_education',
  BONUS_EDUCATION: 'bonus_education',
  CATEGORIZATION: 'categorization',
  SUMMARY: 'summary',
  SUCCESS: 'success'
}

const STAGE_GROUPS = [
  { id: 'welcome', label: 'Welcome', stages: [STAGES.TIME_CHECK, STAGES.WELCOME, STAGES.PERSONA_SELECT] },
  { id: 'review', label: 'Review', stages: [STAGES.REVIEW_ANSWERS] },
  { id: 'niche', label: 'Niche', stages: [STAGES.Q6, STAGES.Q7] },
  { id: 'solutions', label: 'Solutions', stages: [STAGES.Q8] },
  { id: 'categorize', label: 'Categorize', stages: [STAGES.LM_EDUCATION, STAGES.BONUS_EDUCATION, STAGES.CATEGORIZATION] },
  { id: 'complete', label: 'Complete', stages: [STAGES.SUMMARY, STAGES.SUCCESS] }
]

// Solution categories (Part 1 of delivery selection)
const SOLUTION_CATEGORIES = [
  {
    id: 'service',
    label: 'Service',
    description: 'I do the work myself',
    icon: '💼'
  },
  {
    id: 'productized',
    label: 'Productized',
    description: 'Packaged programs or courses',
    icon: '📦'
  },
  {
    id: 'product',
    label: 'Product',
    description: 'Something they buy from me',
    icon: '🛍️'
  }
]

// Solution types by category (Part 2 of delivery selection)
// Matches validation question follow-ups from persona-assessment.json
const SOLUTION_TYPES_BY_CATEGORY = {
  service: [
    {
      id: 'custom_service',
      label: 'Custom for each client',
      description: 'Every engagement is different based on their needs',
      icon: '🎯'
    },
    {
      id: 'packaged_service',
      label: 'Same package every time',
      description: 'Standardized deliverables and process',
      icon: '📋'
    },
    {
      id: 'hybrid_service',
      label: 'Mix of both',
      description: 'Some custom, some packaged',
      icon: '🔀'
    }
  ],
  productized: [
    {
      id: 'automated_group',
      label: 'Self-paced course',
      description: 'People go through on their own time',
      icon: '🎬'
    },
    {
      id: 'live_group',
      label: 'Live cohort or coaching',
      description: 'You facilitate live sessions',
      icon: '👥'
    },
    {
      id: 'managed_service',
      label: 'Done-for-you packages',
      description: 'Team delivers standardized work',
      icon: '⚙️'
    },
    {
      id: 'membership',
      label: 'Membership or community',
      description: 'Ongoing access to content/community',
      icon: '🏠'
    }
  ],
  product: [
    {
      id: 'digital_product',
      label: 'Digital products',
      description: 'Templates, ebooks, downloads',
      icon: '📄'
    },
    {
      id: 'software',
      label: 'Software / SaaS',
      description: 'Apps, platforms, tools',
      icon: '💻'
    },
    {
      id: 'physical_product',
      label: 'Physical products',
      description: 'Merchandise, equipment, goods',
      icon: '📦'
    },
    {
      id: 'mixed_products',
      label: 'Mix of different types',
      description: 'Multiple product types',
      icon: '🔀'
    }
  ]
}

// Flat map for labels
const SOLUTION_LABELS = {
  custom_service: 'Custom Service',
  packaged_service: 'Packaged Service',
  hybrid_service: 'Hybrid Service',
  automated_group: 'Self-Paced Course',
  live_group: 'Live Cohort',
  managed_service: 'Done-For-You',
  membership: 'Membership',
  digital_product: 'Digital Product',
  software: 'Software/SaaS',
  physical_product: 'Physical Product',
  mixed_products: 'Mixed Products'
}

// Lead Magnet types for education
const LEAD_MAGNET_TYPES = {
  reveal_problem: {
    name: 'Reveal the Problem',
    icon: '🔍',
    description: 'Help them realize they have a problem they didn\'t know about (quiz, assessment, calculator)',
    bestFor: ['tech_digital', 'one_to_many']
  },
  free_trial: {
    name: 'Free Trial',
    icon: '🎯',
    description: 'Let them experience your solution before buying (free session, sample, demo)',
    bestFor: ['one_to_one', 'one_to_many', 'tech_digital']
  },
  free_step_1: {
    name: 'Free Step 1',
    icon: '🪜',
    description: 'Give them the first step of your process for free (template, guide, mini-course)',
    bestFor: ['one_to_many', 'tech_digital', 'physical_product']
  }
}

// Map validation profile fields to our question IDs
const mapProfileToAnswers = (profile) => {
  if (!profile) return {}

  const answers = profile.answers || {}

  return {
    q1_pain_level: {
      value: String(answers.pain_level || profile.pain_level || ''),
      label: String(answers.pain_level || profile.pain_level || '')
    },
    q2_problem_area: {
      value: answers.problem_area || profile.problem_area || '',
      label: mapProblemAreaLabel(answers.problem_area || profile.problem_area)
    },
    q3_spending_capacity: {
      value: answers.income_level || profile.income_level || '',
      label: answers.income_level || profile.income_level || ''
    },
    q4_sunk_cost: {
      value: answers.financial_sunk_cost || profile.financial_sunk_cost || '',
      label: answers.financial_sunk_cost || profile.financial_sunk_cost || ''
    },
    q5_emotion: {
      value: answers.emotion || profile.emotion || '',
      label: answers.emotion || profile.emotion || ''
    },
    // Store persona and problem for context
    selected_persona: profile.persona || '',
    selected_problem: profile.problem || ''
  }
}

const mapProblemAreaLabel = (value) => {
  const mapping = {
    'improving_health': 'More Health',
    'making_money': 'More Wealth',
    'loving_life': 'More Love',
    'health': 'More Health',
    'wealth': 'More Wealth',
    'love': 'More Love',
    'relationships': 'More Love' // Legacy support
  }
  return mapping[value] || value || ''
}

function OfferBuilderFlow() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [stage, setStage] = useState(STAGES.TIME_CHECK)
  const [questionsData, setQuestionsData] = useState(null)
  const [answers, setAnswers] = useState({})
  const [currentTextInput, setCurrentTextInput] = useState('')
  const [currentMultiSelect, setCurrentMultiSelect] = useState([])
  const [currentMultiSelectText, setCurrentMultiSelectText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Niche layers state (for Q6 - 4 layers)
  const [nicheLayers, setNicheLayers] = useState({
    layer1: '',
    layer2: '',
    layer3: '',
    layer4: ''
  })

  // Multi-section inputs state (for Q7 reasons - Hormozi's 3 obstacle types)
  const [sectionInputs, setSectionInputs] = useState({
    vehicle_problems: ['', '', ''],
    internal_beliefs: ['', '', ''],
    external_beliefs: ['', '', '']
  })

  // Problem-based solutions state (for Q8)
  // Each solution links to a specific problem from Q7
  const [problemSolutions, setProblemSolutions] = useState([])
  // Current solution being edited
  const [currentSolution, setCurrentSolution] = useState({
    problemId: '',
    problemText: '',
    solutionCategory: '',  // service, productized, or product
    solutionType: '',
    description: '',
    differentiators: [],
    alreadyDelivers: null,  // null = not answered, true = yes, false = no
    existingProductId: null
  })

  // Existing products from Quick Capture / wealth ladder
  const [existingProducts, setExistingProducts] = useState([])

  // Solution categorization state (Core Product / Lead Magnet / Bonus / Skip)
  const [solutionCategories, setSolutionCategories] = useState({})

  // Selected lead magnet type
  const [selectedLeadMagnetType, setSelectedLeadMagnetType] = useState(null)

  // Persona selector state
  const [personaProfiles, setPersonaProfiles] = useState([])
  const [selectedProfile, setSelectedProfile] = useState(null)

  // Auto-save state
  const [showResumePrompt, setShowResumePrompt] = useState(false)
  const [savedProgressData, setSavedProgressData] = useState(null)
  const { saveProgress, loadProgress, clearProgress } = useAutoSave('offer-builder', user?.id)

  // All flow stages in order (after review)
  const flowStages = [
    STAGES.Q6,
    STAGES.Q7,
    STAGES.Q8,
    STAGES.LM_EDUCATION,
    STAGES.BONUS_EDUCATION,
    STAGES.CATEGORIZATION
  ]

  // Question stages only (for question number display)
  const questionStages = [STAGES.Q6, STAGES.Q7, STAGES.Q8]

  // Load questions JSON
  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch('/100m-offer-builder-questions.json')
        if (!res.ok) throw new Error('Failed to load questions')
        const data = await res.json()
        setQuestionsData(data)
      } catch (err) {
        setError(`Failed to load: ${err.message}`)
      }
    }
    loadData()
  }, [])

  // Load user's persona profiles from validation flow
  useEffect(() => {
    if (user) {
      loadPersonaProfiles()
    }
  }, [user])

  // Load existing products from Quick Capture / wealth ladder
  useEffect(() => {
    if (user) {
      loadExistingProducts()
    }
  }, [user])

  const loadExistingProducts = async () => {
    try {
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setExistingProducts(products || [])
    } catch (err) {
      console.error('Error loading existing products:', err)
      setExistingProducts([])
    }
  }

  // Check for saved progress on mount
  useEffect(() => {
    if (user) {
      const saved = loadProgress()
      if (saved && saved.stage && saved.stage !== STAGES.TIME_CHECK && saved.stage !== STAGES.SUCCESS) {
        setSavedProgressData(saved)
        setShowResumePrompt(true)
      }
    }
  }, [user, loadProgress])

  // Auto-save progress on state changes (only after passing time check)
  useEffect(() => {
    if (!user || stage === STAGES.TIME_CHECK || stage === STAGES.SUCCESS) return

    const progressData = {
      stage,
      answers,
      nicheLayers,
      sectionInputs,
      problemSolutions,
      solutionCategories,
      selectedProfile
    }
    saveProgress(progressData)
  }, [stage, answers, nicheLayers, sectionInputs, problemSolutions, solutionCategories, selectedProfile, user, saveProgress])

  // Resume saved progress
  const handleResumeProgress = useCallback(() => {
    if (savedProgressData) {
      setStage(savedProgressData.stage)
      if (savedProgressData.answers) setAnswers(savedProgressData.answers)
      if (savedProgressData.nicheLayers) setNicheLayers(savedProgressData.nicheLayers)
      if (savedProgressData.sectionInputs) {
        // Migrate old section format to new Hormozi format if needed
        const oldData = savedProgressData.sectionInputs
        const migratedSections = {
          vehicle_problems: oldData.vehicle_problems || oldData.motivation_gaps || ['', '', ''],
          internal_beliefs: oldData.internal_beliefs || ['', '', ''],
          external_beliefs: oldData.external_beliefs || oldData.external_blockers || ['', '', '']
        }
        setSectionInputs(migratedSections)
      }
      if (savedProgressData.problemSolutions) setProblemSolutions(savedProgressData.problemSolutions)
      if (savedProgressData.solutionCategories) setSolutionCategories(savedProgressData.solutionCategories)
      if (savedProgressData.selectedProfile) setSelectedProfile(savedProgressData.selectedProfile)
    }
    setShowResumePrompt(false)
  }, [savedProgressData])

  // Start fresh (clear saved progress)
  const handleStartFresh = useCallback(() => {
    clearProgress()
    setShowResumePrompt(false)
    setSavedProgressData(null)
  }, [clearProgress])

  const loadPersonaProfiles = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from('persona_profiles')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)

      if (error) throw error

      if (profiles && profiles.length > 0 && profiles[0].all_profiles) {
        // Extract all profiles from the most recent persona_profiles record
        const allProfiles = profiles[0].all_profiles.map((p, idx) => ({
          ...p,
          displayId: idx + 1
        }))
        setPersonaProfiles(allProfiles)
      }
    } catch (err) {
      console.error('Error loading persona profiles:', err)
      setPersonaProfiles([])
    }
  }

  // Get question by stage (Q6 = index 5 in questions array)
  const getQuestionByStage = () => {
    if (!questionsData?.questions) return null
    const stageIndex = questionStages.indexOf(stage)
    // Q6 is index 5 in the original questions array
    return stageIndex >= 0 ? questionsData.questions[stageIndex + 5] : null
  }

  // Get current question number for display (Q6 = Question 1 of 5)
  const getCurrentQuestionDisplay = () => {
    const stageIndex = questionStages.indexOf(stage)
    return stageIndex >= 0 ? `Question ${stageIndex + 1} of 5` : ''
  }

  // Go back handler
  const goBack = (fromStage) => {
    const currentIndex = flowStages.indexOf(fromStage)
    if (currentIndex === 0) {
      setStage(STAGES.REVIEW_ANSWERS)
    } else if (currentIndex > 0) {
      setStage(flowStages[currentIndex - 1])
    }
  }

  // Advance to next stage
  const advanceToNext = () => {
    const currentIndex = flowStages.indexOf(stage)
    if (currentIndex < flowStages.length - 1) {
      setStage(flowStages[currentIndex + 1])
      setCurrentTextInput('')
      setCurrentMultiSelect([])
      setCurrentMultiSelectText('')
    } else {
      setStage(STAGES.SUMMARY)
    }
  }

  // Get all problems from Q7 as dropdown options
  const getAllProblems = () => {
    const problems = []
    Object.entries(sectionInputs).forEach(([sectionId, values]) => {
      const sectionLabel = sectionId === 'vehicle_problems' ? 'Vehicle Problem'
        : sectionId === 'internal_beliefs' ? 'Internal Belief'
        : 'External Belief'
      values.forEach((value, index) => {
        if (value.trim()) {
          problems.push({
            id: `${sectionId}_${index}`,
            sectionId,
            text: value.trim(),
            label: `${sectionLabel}: "${value.trim().substring(0, 40)}${value.trim().length > 40 ? '...' : ''}"`
          })
        }
      })
    })
    return problems
  }

  // Get solutions that have content (for categorization/recommendation)
  const getFilledSolutions = () => {
    return problemSolutions.filter(sol => sol.description.trim().length > 0)
      .map((sol, index) => ({ ...sol, id: `solution_${index}` }))
  }

  // Get solutions by category
  const getSolutionsByCategory = (category) => {
    return problemSolutions.filter((sol, index) => {
      const solId = `solution_${index}`
      return solutionCategories[solId] === category && sol.description.trim()
    }).map((sol, index) => ({ ...sol, id: `solution_${index}` }))
  }

  // Get recommended lead magnet type based on categorized solutions
  const getLeadMagnetRecommendation = () => {
    const leadMagnetSolutions = getSolutionsByCategory('lead_magnet')
    if (leadMagnetSolutions.length === 0) return null

    // Score each lead magnet type based on solution types
    const scores = { reveal_problem: 0, free_trial: 0, free_step_1: 0 }
    leadMagnetSolutions.forEach(sol => {
      if (sol.solutionType === 'tech_digital') scores.reveal_problem += 2
      if (sol.solutionType === 'one_to_one') scores.free_trial += 2
      if (sol.solutionType === 'one_to_many') scores.free_step_1 += 2
      if (sol.solutionType === 'physical_product') scores.free_step_1 += 1
    })

    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1])
    return sorted[0][0]
  }

  // Check if categorization is valid (all filled solutions must be categorized)
  const isCategorizationValid = () => {
    const filledSolutions = getFilledSolutions()
    return filledSolutions.length > 0 && filledSolutions.every(sol => solutionCategories[sol.id] !== null)
  }

  // Check if at least one lead magnet is selected
  const hasLeadMagnet = () => {
    return Object.values(solutionCategories).includes('lead_magnet')
  }

  // Handle niche layers submission
  const handleNicheLayersSubmit = (questionId) => {
    // At least layer 4 should be filled (the most specific)
    if (!nicheLayers.layer4.trim()) return

    const newAnswers = {
      ...answers,
      [questionId]: {
        type: 'niche_layers',
        layers: nicheLayers,
        // Combine for display
        value: nicheLayers.layer4.trim()
      }
    }
    setAnswers(newAnswers)
    advanceToNext()
  }

  // Check if niche layers are valid
  const areNicheLayersValid = () => {
    return nicheLayers.layer4.trim().length > 0
  }

  // Add current solution to list
  const addSolutionToList = () => {
    if (!currentSolution.problemId || !currentSolution.description.trim() || !currentSolution.solutionType) return

    setProblemSolutions(prev => [...prev, { ...currentSolution }])
    // Reset current solution
    setCurrentSolution({
      problemId: '',
      problemText: '',
      solutionCategory: '',
      solutionType: '',
      description: '',
      differentiators: [],
      alreadyDelivers: null,
      existingProductId: null
    })
  }

  // Handle selecting an existing product
  const handleExistingProductSelect = (productId) => {
    if (productId === 'new') {
      setCurrentSolution(prev => ({
        ...prev,
        existingProductId: null,
        solutionType: '',
        description: ''
      }))
    } else {
      const product = existingProducts.find(p => p.id === productId)
      if (product) {
        setCurrentSolution(prev => ({
          ...prev,
          existingProductId: productId,
          solutionType: product.product_type || '',
          description: product.name + (product.description ? ` - ${product.description}` : '')
        }))
      }
    }
  }

  // Remove a solution from the list
  const removeSolution = (index) => {
    setProblemSolutions(prev => prev.filter((_, i) => i !== index))
  }

  // Handle problem solutions submission
  const handleProblemSolutionsSubmit = (questionId) => {
    if (problemSolutions.length === 0) return

    // Initialize categorization for all solutions
    const initialCategories = {}
    problemSolutions.forEach((_, index) => {
      initialCategories[`solution_${index}`] = null
    })
    setSolutionCategories(initialCategories)

    const newAnswers = {
      ...answers,
      [questionId]: {
        type: 'problem_solutions',
        solutions: problemSolutions
      }
    }
    setAnswers(newAnswers)
    advanceToNext()
  }

  // Toggle differentiator for current solution
  const toggleCurrentSolutionDifferentiator = (value) => {
    setCurrentSolution(prev => ({
      ...prev,
      differentiators: prev.differentiators.includes(value)
        ? prev.differentiators.filter(d => d !== value)
        : [...prev.differentiators, value]
    }))
  }

  // Handle single choice selection
  const handleOptionSelect = (questionId, option) => {
    const newAnswers = {
      ...answers,
      [questionId]: { value: option.value, label: option.label }
    }
    setAnswers(newAnswers)
    advanceToNext()
  }

  // Handle text area submission
  const handleTextSubmit = (questionId, minLength) => {
    if (currentTextInput.trim().length < (minLength || 0)) {
      return
    }
    const newAnswers = {
      ...answers,
      [questionId]: { value: currentTextInput.trim(), type: 'text' }
    }
    setAnswers(newAnswers)
    advanceToNext()
  }

  // Handle multi-select submission
  const handleMultiSelectSubmit = (questionId, minSelections) => {
    if (currentMultiSelect.length < (minSelections || 1)) {
      return
    }
    const newAnswers = {
      ...answers,
      [questionId]: {
        selections: currentMultiSelect,
        explanation: currentMultiSelectText.trim(),
        type: 'multi_select'
      }
    }
    setAnswers(newAnswers)
    advanceToNext()
  }

  // Toggle multi-select option
  const toggleMultiSelectOption = (value) => {
    setCurrentMultiSelect(prev =>
      prev.includes(value)
        ? prev.filter(v => v !== value)
        : [...prev, value]
    )
  }

  // Update a section input value
  const updateSectionInput = (sectionId, index, value) => {
    setSectionInputs(prev => {
      const currentArray = prev[sectionId] || ['', '', '']
      const newArray = [...currentArray]
      newArray[index] = value
      return { ...prev, [sectionId]: newArray }
    })
  }

  // Add a new input to a section
  const addSectionInput = (sectionId) => {
    setSectionInputs(prev => ({
      ...prev,
      [sectionId]: [...(prev[sectionId] || ['', '', '']), '']
    }))
  }

  // Check if section has minimum filled inputs
  const sectionHasMinInputs = (sectionId, minCount = 3) => {
    const section = sectionInputs[sectionId]
    if (!section || !Array.isArray(section)) return false
    return section.filter(v => v.trim().length > 0).length >= minCount
  }

  // Check if all sections meet requirements
  const allSectionsValid = (sections) => {
    return sections.every(section => sectionHasMinInputs(section.id, section.minInputs || 3))
  }

  // Handle multi-section submit
  const handleMultiSectionSubmit = (questionId, sections) => {
    if (!allSectionsValid(sections)) return

    const newAnswers = {
      ...answers,
      [questionId]: {
        type: 'multi_section',
        sections: Object.entries(sectionInputs).reduce((acc, [key, values]) => {
          acc[key] = values.filter(v => v.trim().length > 0)
          return acc
        }, {})
      }
    }
    setAnswers(newAnswers)
    advanceToNext()
  }

  // Handle persona selection
  const handlePersonaSelect = (profile) => {
    setSelectedProfile(profile)
    // Pre-fill answers from the profile
    const prefilled = mapProfileToAnswers(profile)
    setAnswers(prefilled)
  }

  // Update a review answer
  const updateReviewAnswer = (key, value, label) => {
    setAnswers(prev => ({
      ...prev,
      [key]: { value, label: label || value }
    }))
  }

  // Save results
  const handleSaveResults = async () => {
    if (isLoading || !user) return

    setIsLoading(true)
    setError(null)

    try {
      const sessionId = crypto.randomUUID()

      // DEBUG: Log auth state before save
      console.log('=== OFFER BUILDER SAVE DEBUG ===')
      console.log('user.id from React state:', user.id)
      console.log('user.email:', user.email)

      // Check current Supabase auth state
      const { data: authData, error: authError } = await supabase.auth.getUser()
      console.log('supabase.auth.getUser() result:', {
        userId: authData?.user?.id,
        email: authData?.user?.email,
        error: authError
      })
      console.log('IDs match:', user.id === authData?.user?.id)

      // Prepare responses with solution categories
      const fullResponses = {
        ...answers,
        solution_categories: solutionCategories
      }

      console.log('Attempting insert to offer_builder_assessments...')

      // Save to offer_builder_assessments table
      const { data: insertData, error: saveError } = await supabase.from('offer_builder_assessments').insert([{
        session_id: sessionId,
        user_id: user.id,
        user_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        email: user.email,
        responses: fullResponses,
        pain_level: answers.q1_pain_level?.value,
        problem_area: answers.q2_problem_area?.value,
        niche_definition: answers.q6_niche_layers?.value
      }]).select()

      console.log('Insert result:', { data: insertData, error: saveError })

      if (saveError) {
        console.error('❌ Failed to save offer builder assessment:', saveError)
        console.error('Error details:', JSON.stringify(saveError, null, 2))
        throw saveError
      }

      console.log('✅ Assessment saved successfully!')

      // Track flow completion
      try {
        await supabase.from('flow_sessions').insert({
          user_id: user.id,
          flow_type: '100m_offer',
          flow_version: 'offer-builder-v2',
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
          flowId: '100m_offer',
          pointsEarned: 25
        })
      } catch (questError) {
        console.warn('Quest completion failed:', questError)
      }

      // Create milestone
      try {
        const { data: projectData } = await supabase
          .from('user_projects')
          .select('id, current_stage')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        await supabase.from('milestone_completions').insert({
          user_id: user.id,
          project_id: projectData?.id,
          milestone_id: 'offer_categorized',
          stage: projectData?.current_stage || 2,
          evidence_text: `Categorized ${Object.values(solutionCategories).filter(c => c !== 'skip' && c !== null).length} solutions into offer stack`
        })
      } catch (milestoneError) {
        console.warn('Milestone creation failed:', milestoneError)
      }

      // Clear auto-saved progress on completion
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
  if (!questionsData) {
    return (
      <div className="offer-builder-flow">
        <div className="loading-state">
          {error ? (
            <div style={{ color: 'white', textAlign: 'center', padding: '20px' }}>
              <h2>Error Loading</h2>
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

  // TIME CHECK STAGE
  if (stage === STAGES.TIME_CHECK) {
    // Show resume prompt if there's saved progress
    if (showResumePrompt && savedProgressData) {
      const savedDate = new Date(savedProgressData.savedAt)
      const timeAgo = Math.round((Date.now() - savedProgressData.savedAt) / (1000 * 60 * 60))

      return (
        <div className="offer-builder-flow">
          <ProgressDots stageGroups={STAGE_GROUPS} currentStage={stage} />
          <div className="welcome-container">
            <h1 className="welcome-greeting">Welcome Back!</h1>
            <div className="resume-prompt">
              <p className="resume-icon">💾</p>
              <p><strong>You have saved progress</strong></p>
              <p className="resume-time">
                Saved {timeAgo < 1 ? 'less than an hour' : timeAgo === 1 ? '1 hour' : `${timeAgo} hours`} ago
              </p>
              <p className="resume-stage">
                You were on: <strong>{savedProgressData.stage?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</strong>
              </p>
            </div>
            <button
              className="primary-button glow-button"
              onClick={handleResumeProgress}
            >
              Continue Where I Left Off
            </button>
            <button
              className="secondary-button"
              onClick={handleStartFresh}
              style={{ marginTop: '12px' }}
            >
              Start Fresh
            </button>
          </div>
        </div>
      )
    }

    return (
      <div className="offer-builder-flow">
        <ProgressDots stageGroups={STAGE_GROUPS} currentStage={stage} />
        <div className="welcome-container">
          <h1 className="welcome-greeting">Offer Builder</h1>
          <div className="welcome-message animated-text" style={{ textAlign: 'center' }}>
            <p><span className="time-icon">⏱️</span></p>
            <p><strong>This flow takes about 5-8 minutes</strong></p>
            <p style={{ color: 'rgba(255,255,255,0.7)' }}>Design an offer so good people feel silly saying no.</p>
            <p>We'll use your validation insights to get you started.</p>
          </div>
          <button
            className="primary-button glow-button"
            onClick={() => setStage(STAGES.WELCOME)}
          >
            I'm Ready to Build
          </button>
          <button
            className="secondary-button"
            onClick={() => navigate(-1)}
            style={{ marginTop: '12px' }}
          >
            Come Back Later
          </button>
        </div>
      </div>
    )
  }

  // WELCOME STAGE
  if (stage === STAGES.WELCOME) {
    return (
      <div className="offer-builder-flow">
        <ProgressDots stageGroups={STAGE_GROUPS} currentStage={stage} />
        <div className="welcome-container">
          <div className="welcome-content">
            <h1 className="welcome-greeting">Offer Builder</h1>
            <div className="welcome-message animated-text">
              <p><strong>Ready to create an offer so good people feel silly saying no?</strong></p>
              <p>Great offers aren't built on hope—they're engineered from deep customer understanding.</p>
              <p>We'll start with the persona you validated, let you refine based on feedback, then build out your niche, solution, and MVP.</p>
              <p className="welcome-cta-text">Let's turn validation into a real offer.</p>
            </div>
          </div>
          <button className="primary-button" onClick={() => setStage(STAGES.PERSONA_SELECT)}>
            Start Building
          </button>
          <p className="attribution-text">Based on Alex Hormozi's $100M Offers framework</p>
        </div>
      </div>
    )
  }

  // PERSONA SELECT STAGE
  if (stage === STAGES.PERSONA_SELECT) {
    return (
      <div className="offer-builder-flow">
        <ProgressDots stageGroups={STAGE_GROUPS} currentStage={stage} />
        <div className="persona-selector-container">
          <div className="persona-selector-content">
            <h2 className="question-text">Who are you building this offer for?</h2>
            <p className="question-subtext">
              Select the persona you validated to pre-fill your answers
            </p>

            {personaProfiles.length > 0 ? (
              <div className="persona-cards">
                {personaProfiles.map((profile) => (
                  <button
                    key={profile.id || profile.displayId}
                    className={`persona-card ${selectedProfile?.id === profile.id || selectedProfile?.displayId === profile.displayId ? 'selected' : ''}`}
                    onClick={() => handlePersonaSelect(profile)}
                  >
                    <div className="persona-card-label">{profile.persona}</div>
                    <div className="persona-card-problem">{profile.problem}</div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="no-personas-message">
                <p>You haven't validated any personas yet.</p>
                <p>Complete the Persona Selection flow first to get pre-filled answers, or continue to build from scratch.</p>
              </div>
            )}
          </div>

          <div className="persona-selector-actions">
            {personaProfiles.length > 0 ? (
              <>
                <button
                  className="primary-button"
                  onClick={() => setStage(STAGES.REVIEW_ANSWERS)}
                  disabled={!selectedProfile}
                >
                  Continue with Selected Persona
                </button>
                <button
                  className="create-new-button"
                  onClick={() => {
                    setSelectedProfile(null)
                    setAnswers({})
                    setStage(STAGES.REVIEW_ANSWERS)
                  }}
                >
                  Create New Persona
                </button>
              </>
            ) : (
              <>
                <button
                  className="primary-button"
                  onClick={() => setStage(STAGES.REVIEW_ANSWERS)}
                >
                  Build From Scratch
                </button>
                <button
                  className="secondary-button"
                  onClick={() => navigate('/persona-selection')}
                >
                  Go to Persona Selection
                </button>
              </>
            )}
            <BackButton onClick={() => setStage(STAGES.WELCOME)} />
          </div>
        </div>
      </div>
    )
  }

  // REVIEW ANSWERS STAGE
  if (stage === STAGES.REVIEW_ANSWERS) {
    return (
      <div className="offer-builder-flow">
        <ProgressDots stageGroups={STAGE_GROUPS} currentStage={stage} />
        <div className="review-container">
          <h2 className="question-text">Review Your Target Customer</h2>
          <p className="question-subtext">
            Update any answers based on feedback from your validation
          </p>

          {selectedProfile && (
            <div className="review-persona-header">
              <strong>{answers.selected_persona}</strong>
              <span>{answers.selected_problem}</span>
            </div>
          )}

          <div className="review-fields">
            {/* Pain Level */}
            <div className="review-field">
              <label>Pain Level (1-10)</label>
              <select
                value={answers.q1_pain_level?.value || ''}
                onChange={(e) => updateReviewAnswer('q1_pain_level', e.target.value, e.target.value)}
              >
                <option value="">Select...</option>
                {[1,2,3,4,5,6,8,9,10].map(n => (
                  <option key={n} value={n}>{n}{n === 1 ? ' - Minimal' : n === 5 ? ' - Moderate' : n === 10 ? ' - Extreme' : ''}</option>
                ))}
              </select>
            </div>

            {/* Problem Area */}
            <div className="review-field">
              <label>Problem Area</label>
              <select
                value={answers.q2_problem_area?.value || ''}
                onChange={(e) => updateReviewAnswer('q2_problem_area', e.target.value, mapProblemAreaLabel(e.target.value))}
              >
                <option value="">Select...</option>
                <option value="health">More Health</option>
                <option value="wealth">More Wealth</option>
                <option value="love">More Love</option>
              </select>
            </div>

            {/* Earning Capacity */}
            <div className="review-field">
              <label>Earning Capacity</label>
              <select
                value={answers.q3_spending_capacity?.value || ''}
                onChange={(e) => updateReviewAnswer('q3_spending_capacity', e.target.value)}
              >
                <option value="">Select...</option>
                <option value="$0–$25k">$0–$25k</option>
                <option value="$25k–$50k">$25k–$50k</option>
                <option value="$50k–$100k">$50k–$100k</option>
                <option value="$100k–$250k">$100k–$250k</option>
                <option value="$250k+">$250k+</option>
              </select>
            </div>

            {/* Sunk Cost */}
            <div className="review-field">
              <label>Sunk Cost in Existing Solutions</label>
              <select
                value={answers.q4_sunk_cost?.value || ''}
                onChange={(e) => updateReviewAnswer('q4_sunk_cost', e.target.value)}
              >
                <option value="">Select...</option>
                <option value="None - haven't tried anything">None - haven't tried anything</option>
                <option value="Minimal ($0-$500)">Minimal ($0-$500)</option>
                <option value="Moderate ($500-$5k)">Moderate ($500-$5k)</option>
                <option value="Significant ($5k-$50k)">Significant ($5k-$50k)</option>
                <option value="Substantial ($50k+)">Substantial ($50k+)</option>
              </select>
            </div>

            {/* Emotion */}
            <div className="review-field">
              <label>Primary Emotion</label>
              <select
                value={answers.q5_emotion?.value || ''}
                onChange={(e) => updateReviewAnswer('q5_emotion', e.target.value)}
              >
                <option value="">Select...</option>
                <option value="frustrated">Frustrated</option>
                <option value="desperate">Desperate</option>
                <option value="hopeful">Hopeful</option>
                <option value="skeptical">Skeptical</option>
                <option value="overwhelmed">Overwhelmed</option>
                <option value="motivated">Motivated</option>
                <option value="confused">Confused</option>
              </select>
            </div>
          </div>

          <button
            className="primary-button"
            onClick={() => setStage(STAGES.Q6)}
            style={{ marginTop: '24px' }}
          >
            Continue to Niche Definition
          </button>
          <BackButton onClick={() => setStage(STAGES.PERSONA_SELECT)} />
        </div>
      </div>
    )
  }

  // QUESTION STAGES (Q6-Q10)
  if (questionStages.includes(stage)) {
    const question = getQuestionByStage()
    if (!question) return null

    const hasDescriptions = question.options?.some(o => o.description)

    // SINGLE CHOICE QUESTION
    if (question.type === 'single_choice') {
      return (
        <div className="offer-builder-flow">
          <ProgressDots stageGroups={STAGE_GROUPS} currentStage={stage} />
          <div className="question-container">
            <div className="question-number">{getCurrentQuestionDisplay()}</div>
            <h2 className="question-text">{question.question}</h2>
            {question.subtext && <p className="question-subtext">{question.subtext}</p>}
            <div className="options-list">
              {question.options.map((option, index) => (
                <button
                  key={index}
                  className={`option-card ${!hasDescriptions ? 'compact' : ''}`}
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

    // TEXT AREA QUESTION
    if (question.type === 'text_area') {
      const isValid = currentTextInput.trim().length >= (question.minLength || 0)
      return (
        <div className="offer-builder-flow">
          <ProgressDots stageGroups={STAGE_GROUPS} currentStage={stage} />
          <div className="question-container">
            <div className="question-number">{getCurrentQuestionDisplay()}</div>
            <h2 className="question-text">{question.question}</h2>
            {question.subtext && (
              <p className="question-subtext" style={{ whiteSpace: 'pre-line' }}>
                {question.subtext}
              </p>
            )}
            <div className="text-input-container">
              <textarea
                className="text-area-input"
                placeholder={question.placeholder}
                value={currentTextInput}
                onChange={(e) => setCurrentTextInput(e.target.value)}
                rows={8}
              />
              <div className="char-count">
                {currentTextInput.length} characters
                {question.minLength && ` (min ${question.minLength})`}
              </div>
            </div>
            <button
              className="primary-button"
              onClick={() => handleTextSubmit(question.id, question.minLength)}
              disabled={!isValid}
              style={{ marginTop: '24px' }}
            >
              Continue
            </button>
            <BackButton onClick={() => goBack(stage)} />
          </div>
        </div>
      )
    }

    // NICHE 4-LAYERS QUESTION (for Q6 - progressive niche definition)
    if (question.type === 'niche_4_layers') {
      const isValid = areNicheLayersValid()
      return (
        <div className="offer-builder-flow">
          <ProgressDots stageGroups={STAGE_GROUPS} currentStage={stage} />
          <div className="question-container niche-layers-container">
            <div className="question-number">{getCurrentQuestionDisplay()}</div>
            <h2 className="question-text">{question.question}</h2>
            {question.subtext && <p className="question-subtext">{question.subtext}</p>}

            <div className="niche-layers-wrapper">
              {question.layers.map((layer, index) => (
                <div key={layer.id} className={`niche-layer ${nicheLayers[layer.id] ? 'filled' : ''}`}>
                  <div className="layer-header">
                    <span className="layer-number">{index + 1}</span>
                    <div className="layer-label-group">
                      <label className="layer-label">{layer.label}</label>
                      <span className="layer-hint">{layer.hint}</span>
                    </div>
                  </div>
                  <input
                    type="text"
                    className="niche-layer-input"
                    placeholder={layer.placeholder}
                    value={nicheLayers[layer.id]}
                    onChange={(e) => setNicheLayers(prev => ({
                      ...prev,
                      [layer.id]: e.target.value
                    }))}
                  />
                  {index < question.layers.length - 1 && (
                    <div className="layer-connector">↓</div>
                  )}
                </div>
              ))}
            </div>

            <div className="niche-preview">
              <h4>Your Niche Definition</h4>
              <p>{nicheLayers.layer4 || nicheLayers.layer3 || nicheLayers.layer2 || nicheLayers.layer1 || 'Fill in the layers above...'}</p>
            </div>

            <button
              className="primary-button"
              onClick={() => handleNicheLayersSubmit(question.id)}
              disabled={!isValid}
              style={{ marginTop: '24px' }}
            >
              Continue
            </button>
            <BackButton onClick={() => goBack(stage)} />
          </div>
        </div>
      )
    }

    // MULTI-SELECT WITH TEXT QUESTION
    if (question.type === 'multi_select_with_text') {
      const isValid = currentMultiSelect.length >= (question.minSelections || 1)
      return (
        <div className="offer-builder-flow">
          <ProgressDots stageGroups={STAGE_GROUPS} currentStage={stage} />
          <div className="question-container">
            <div className="question-number">{getCurrentQuestionDisplay()}</div>
            <h2 className="question-text">{question.question}</h2>
            {question.subtext && <p className="question-subtext">{question.subtext}</p>}

            <div className="multi-select-options">
              {question.options.map((option, index) => (
                <label key={index} className={`checkbox-option ${currentMultiSelect.includes(option.value) ? 'selected' : ''}`}>
                  <input
                    type="checkbox"
                    checked={currentMultiSelect.includes(option.value)}
                    onChange={() => toggleMultiSelectOption(option.value)}
                  />
                  <div className="checkbox-content">
                    <span className="checkbox-label">{option.label}</span>
                    {option.description && <span className="checkbox-description">{option.description}</span>}
                  </div>
                </label>
              ))}
            </div>

            {currentMultiSelect.length > 0 && (
              <div className="text-input-container" style={{ marginTop: '24px' }}>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', marginBottom: '12px' }}>
                  {question.textPrompt}
                </p>
                <textarea
                  className="text-area-input"
                  placeholder={question.placeholder}
                  value={currentMultiSelectText}
                  onChange={(e) => setCurrentMultiSelectText(e.target.value)}
                  rows={5}
                />
              </div>
            )}

            <button
              className="primary-button"
              onClick={() => handleMultiSelectSubmit(question.id, question.minSelections)}
              disabled={!isValid}
              style={{ marginTop: '24px' }}
            >
              Continue
            </button>
            <BackButton onClick={() => goBack(stage)} />
          </div>
        </div>
      )
    }

    // MULTI-SECTION INPUTS QUESTION (for Q7 reasons)
    if (question.type === 'multi_section_inputs') {
      const isValid = allSectionsValid(question.sections)
      return (
        <div className="offer-builder-flow">
          <ProgressDots stageGroups={STAGE_GROUPS} currentStage={stage} />
          <div className="question-container multi-section-container">
            <div className="question-number">{getCurrentQuestionDisplay()}</div>
            <h2 className="question-text">{question.question}</h2>
            {question.subtext && <p className="question-subtext">{question.subtext}</p>}

            <div className="sections-wrapper">
              {question.sections.map((section) => (
                <div key={section.id} className="reason-section">
                  <div className="section-header">
                    <h3 className="section-title">{section.title}</h3>
                    <p className="section-description">{section.description}</p>
                  </div>

                  <div className="section-inputs">
                    {(sectionInputs[section.id] || ['', '', '']).map((value, index) => (
                      <div key={index} className="reason-input-row">
                        <span className="input-number">{index + 1}</span>
                        <input
                          type="text"
                          className="reason-input"
                          placeholder={section.placeholders?.[index] || section.placeholder || ''}
                          value={value}
                          onChange={(e) => updateSectionInput(section.id, index, e.target.value)}
                        />
                      </div>
                    ))}

                    <button
                      type="button"
                      className="add-input-button"
                      onClick={() => addSectionInput(section.id)}
                    >
                      + Add another
                    </button>
                  </div>

                  <div className="section-status">
                    {sectionHasMinInputs(section.id, section.minInputs) ? (
                      <span className="status-valid">✓ {(sectionInputs[section.id] || []).filter(v => v.trim()).length} reasons added</span>
                    ) : (
                      <span className="status-invalid">Add at least {section.minInputs} reasons</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              className="primary-button"
              onClick={() => handleMultiSectionSubmit(question.id, question.sections)}
              disabled={!isValid}
              style={{ marginTop: '24px' }}
            >
              Continue
            </button>
            <BackButton onClick={() => goBack(stage)} />
          </div>
        </div>
      )
    }

    // PROBLEM-SOLUTIONS QUESTION (for Q8 - link solutions to problems)
    if (question.type === 'problem_solutions') {
      const allProblems = getAllProblems()
      const isValid = problemSolutions.length > 0
      const canAddSolution = currentSolution.problemId && currentSolution.description.trim() && currentSolution.solutionType

      // Calculate coverage - how many unique problems have at least one solution
      const coveredProblemIds = new Set(problemSolutions.map(s => s.problemId))
      const problemsCovered = coveredProblemIds.size
      const totalProblems = allProblems.length
      const targetSolutions = 5

      return (
        <div className="offer-builder-flow">
          <ProgressDots stageGroups={STAGE_GROUPS} currentStage={stage} />
          <div className="question-container problem-solutions-container">
            <div className="question-number">{getCurrentQuestionDisplay()}</div>
            <h2 className="question-text">{question.question}</h2>
            {question.subtext && <p className="question-subtext">{question.subtext}</p>}

            {/* Goals tracker */}
            <div className="solutions-goals">
              <div className={`goal-item ${problemSolutions.length >= targetSolutions ? 'achieved' : ''}`}>
                <span className="goal-icon">{problemSolutions.length >= targetSolutions ? '✓' : '○'}</span>
                <span className="goal-text">
                  {problemSolutions.length}/{targetSolutions} solutions
                  {problemSolutions.length < targetSolutions && ' (aim for 5)'}
                </span>
              </div>
              <div className={`goal-item ${problemsCovered >= totalProblems ? 'achieved' : ''}`}>
                <span className="goal-icon">{problemsCovered >= totalProblems ? '✓' : '○'}</span>
                <span className="goal-text">
                  {problemsCovered}/{totalProblems} problems covered
                  {problemsCovered < totalProblems && ' (best to cover all)'}
                </span>
              </div>
            </div>

            {/* Added solutions list */}
            {problemSolutions.length > 0 && (
              <div className="added-solutions-list">
                <h4>Your Solutions ({problemSolutions.length})</h4>
                {problemSolutions.map((sol, index) => (
                  <div key={index} className="added-solution-card">
                    <div className="solution-card-content">
                      <span className="solution-type-badge">{SOLUTION_LABELS[sol.solutionType]}</span>
                      <p className="solution-problem-ref">For: {sol.problemText}</p>
                      <p className="solution-desc">{sol.description}</p>
                      {sol.differentiators.length > 0 && (
                        <div className="solution-diffs">
                          {sol.differentiators.map(d => (
                            <span key={d} className="mini-chip">{d}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      className="remove-solution-btn"
                      onClick={() => removeSolution(index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new solution form */}
            <div className="add-solution-form">
              <h4>{problemSolutions.length === 0 ? 'Add a Solution' : 'Add Another Solution'}</h4>

              {/* Problem dropdown */}
              <div className="form-field">
                <label>Which problem does this solve?</label>
                <select
                  value={currentSolution.problemId}
                  onChange={(e) => {
                    const problem = allProblems.find(p => p.id === e.target.value)
                    setCurrentSolution(prev => ({
                      ...prev,
                      problemId: e.target.value,
                      problemText: problem?.text || '',
                      alreadyDelivers: null,
                      existingProductId: null,
                      solutionCategory: '',
                      solutionType: '',
                      description: ''
                    }))
                  }}
                >
                  <option value="">Select a problem...</option>
                  {allProblems.map(problem => (
                    <option key={problem.id} value={problem.id}>
                      {problem.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* "Do you already deliver this?" question */}
              {currentSolution.problemId && (
                <div className="form-field">
                  <label>Do you already deliver this solution?</label>
                  <div className="yes-no-options">
                    <button
                      type="button"
                      className={`yes-no-btn ${currentSolution.alreadyDelivers === true ? 'selected' : ''}`}
                      onClick={() => setCurrentSolution(prev => ({
                        ...prev,
                        alreadyDelivers: true,
                        existingProductId: null,
                        solutionCategory: '',
                        solutionType: '',
                        description: ''
                      }))}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      className={`yes-no-btn ${currentSolution.alreadyDelivers === false ? 'selected' : ''}`}
                      onClick={() => setCurrentSolution(prev => ({
                        ...prev,
                        alreadyDelivers: false,
                        existingProductId: null,
                        solutionCategory: '',
                        solutionType: '',
                        description: ''
                      }))}
                    >
                      No, this is new
                    </button>
                  </div>
                </div>
              )}

              {/* If YES - show existing products dropdown */}
              {currentSolution.alreadyDelivers === true && (
                <div className="form-field">
                  <label>Select your existing product</label>
                  {existingProducts.length > 0 ? (
                    <select
                      value={currentSolution.existingProductId || ''}
                      onChange={(e) => handleExistingProductSelect(e.target.value)}
                    >
                      <option value="">Select a product...</option>
                      {existingProducts.map(product => (
                        <option key={product.id} value={product.id}>
                          {product.name} {product.money_model_tier ? `(${product.money_model_tier})` : ''}
                        </option>
                      ))}
                      <option value="new">+ Add as new product</option>
                    </select>
                  ) : (
                    <div className="no-products-message">
                      <p>No existing products found.</p>
                      <button
                        type="button"
                        className="secondary-button small"
                        onClick={() => setCurrentSolution(prev => ({
                          ...prev,
                          alreadyDelivers: false
                        }))}
                      >
                        Add as new
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Solution category selector (Part 1) - show if NO or if YES with new product */}
              {(currentSolution.alreadyDelivers === false ||
                (currentSolution.alreadyDelivers === true && currentSolution.existingProductId === null && existingProducts.length > 0)) && (
                <div className="form-field">
                  <label>What type of offering is this?</label>
                  <div className="solution-category-options">
                    {SOLUTION_CATEGORIES.map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        className={`solution-category-btn ${currentSolution.solutionCategory === cat.id ? 'selected' : ''}`}
                        onClick={() => setCurrentSolution(prev => ({
                          ...prev,
                          solutionCategory: cat.id,
                          solutionType: '' // Reset type when category changes
                        }))}
                      >
                        <span className="cat-icon">{cat.icon}</span>
                        <span className="cat-label">{cat.label}</span>
                        <span className="cat-desc">{cat.description}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Solution type selector (Part 2) - show after category selected */}
              {currentSolution.solutionCategory && (
                <div className="form-field">
                  <label>How do you deliver this?</label>
                  <div className="solution-type-options">
                    {SOLUTION_TYPES_BY_CATEGORY[currentSolution.solutionCategory]?.map(type => (
                      <button
                        key={type.id}
                        type="button"
                        className={`solution-type-btn ${currentSolution.solutionType === type.id ? 'selected' : ''}`}
                        onClick={() => setCurrentSolution(prev => ({
                          ...prev,
                          solutionType: type.id
                        }))}
                      >
                        <span className="type-icon">{type.icon}</span>
                        <span className="type-label">{type.label}</span>
                        <span className="type-desc">{type.description}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Solution description - show if type selected (for new) or product selected (for existing) */}
              {(currentSolution.solutionType || currentSolution.existingProductId) && (
                <div className="form-field">
                  <label>{currentSolution.existingProductId ? 'Confirm or edit the description' : 'Describe your solution'}</label>
                  <textarea
                    className="solution-input"
                    placeholder="What will you offer? How does it solve their problem?"
                    value={currentSolution.description}
                    onChange={(e) => setCurrentSolution(prev => ({
                      ...prev,
                      description: e.target.value
                    }))}
                    rows={3}
                  />
                </div>
              )}

              {/* Differentiators */}
              {currentSolution.description.trim() && (
                <div className="form-field">
                  <label>What makes it better? (optional)</label>
                  <div className="differentiator-chips">
                    {question.differentiators.map(diff => (
                      <button
                        key={diff.value}
                        type="button"
                        className={`diff-chip-button ${currentSolution.differentiators.includes(diff.value) ? 'selected' : ''}`}
                        onClick={() => toggleCurrentSolutionDifferentiator(diff.value)}
                      >
                        {diff.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Add button */}
              <button
                type="button"
                className="add-solution-btn"
                onClick={addSolutionToList}
                disabled={!canAddSolution}
              >
                + Add Solution
              </button>
            </div>

            <button
              className="primary-button"
              onClick={() => handleProblemSolutionsSubmit(question.id)}
              disabled={!isValid}
              style={{ marginTop: '24px' }}
            >
              Continue ({problemSolutions.length} solution{problemSolutions.length !== 1 ? 's' : ''})
            </button>
            <BackButton onClick={() => goBack(stage)} />
          </div>
        </div>
      )
    }
  }

  // LEAD MAGNET EDUCATION STAGE
  if (stage === STAGES.LM_EDUCATION) {
    return (
      <div className="offer-builder-flow">
        <ProgressDots stageGroups={STAGE_GROUPS} currentStage={stage} />
        <div className="education-container">
          <h1 className="welcome-greeting">Lead Magnets</h1>
          <div className="education-content">
            <p className="education-intro">
              <strong>After your attraction offer hooks them, what free value can you give in exchange for their email?</strong>
            </p>
            <p>
              A <strong>lead magnet</strong> is the value exchange — something free that proves you can help, given to people who express interest in your attraction offer.
            </p>

            <div className="lm-types-grid">
              {Object.entries(LEAD_MAGNET_TYPES).map(([id, type]) => (
                <div key={id} className="lm-type-card">
                  <span className="lm-type-icon">{type.icon}</span>
                  <h3>{type.name}</h3>
                  <p>{type.description}</p>
                </div>
              ))}
            </div>

            <div className="education-callout">
              <p><strong>The Funnel Flow:</strong></p>
              <ul>
                <li><strong>Attraction Offer</strong> — The hook that grabs attention</li>
                <li><strong>Lead Magnet</strong> — Free value they get for expressing interest</li>
                <li><strong>Nurture</strong> — Build trust over time</li>
                <li><strong>Core Product</strong> — What they pay for</li>
              </ul>
            </div>

            <div className="education-callout">
              <p><strong>Next:</strong> You'll categorize each solution as either:</p>
              <ul>
                <li><strong>Core Product</strong> — What they pay for</li>
                <li><strong>Lead Magnet</strong> — Free value for expressing interest</li>
                <li><strong>Bonus</strong> — Added value with core purchase</li>
                <li><strong>Skip</strong> — Not pursuing this one</li>
              </ul>
            </div>
          </div>

          <button
            className="primary-button"
            onClick={() => advanceToNext()}
            style={{ marginTop: '24px' }}
          >
            Continue
          </button>
          <BackButton onClick={() => goBack(stage)} />
        </div>
      </div>
    )
  }

  // BONUS EDUCATION STAGE
  if (stage === STAGES.BONUS_EDUCATION) {
    return (
      <div className="offer-builder-flow">
        <ProgressDots stageGroups={STAGE_GROUPS} currentStage={stage} />
        <div className="education-container">
          <h1 className="welcome-greeting">Bonuses</h1>
          <div className="education-content">
            <p className="education-intro">
              <strong>Bonuses increase perceived value without increasing your workload.</strong>
            </p>
            <p>
              They're "value stacks" that make your offer feel like a no-brainer. The best bonuses solve secondary problems or remove friction.
            </p>

            <div className="bonus-types-grid">
              <div className="bonus-type-card">
                <span className="bonus-type-icon">📋</span>
                <h3>Templates & Checklists</h3>
                <p>Pre-built tools that save them time and reduce friction</p>
              </div>
              <div className="bonus-type-card">
                <span className="bonus-type-icon">👥</span>
                <h3>Community Access</h3>
                <p>Connection with peers on the same journey</p>
              </div>
              <div className="bonus-type-card">
                <span className="bonus-type-icon">📞</span>
                <h3>1:1 Call</h3>
                <p>Personal support or strategy session as a bonus</p>
              </div>
              <div className="bonus-type-card">
                <span className="bonus-type-icon">🎁</span>
                <h3>Extra Resources</h3>
                <p>Recordings, guides, or tools that complement the core</p>
              </div>
            </div>

            <div className="education-callout">
              <p><strong>Pro tip:</strong> Bonuses work best when they address objections or fears:</p>
              <ul>
                <li>"What if I get stuck?" → Add support calls</li>
                <li>"What if it doesn't work for me?" → Add done-for-you templates</li>
                <li>"What if I feel alone?" → Add community access</li>
              </ul>
            </div>
          </div>

          <button
            className="primary-button"
            onClick={() => advanceToNext()}
            style={{ marginTop: '24px' }}
          >
            Categorize My Solutions
          </button>
          <BackButton onClick={() => goBack(stage)} />
        </div>
      </div>
    )
  }

  // SOLUTION CATEGORIZATION STAGE
  if (stage === STAGES.CATEGORIZATION) {
    const filledSolutions = getFilledSolutions()

    return (
      <div className="offer-builder-flow">
        <ProgressDots stageGroups={STAGE_GROUPS} currentStage={stage} />
        <div className="categorization-container">
          <h2 className="question-text">Categorize Your Solutions</h2>
          <p className="question-subtext">
            Assign each solution to its role in your offer stack
          </p>

          <div className="categorization-cards">
            {filledSolutions.map((solution) => (
              <div key={solution.id} className="categorization-card">
                <div className="cat-card-header">
                  <span className="solution-type-badge">{SOLUTION_LABELS[solution.solutionType]}</span>
                  <p className="solution-problem-ref">Solves: {solution.problemText}</p>
                  <p className="cat-card-description">{solution.description}</p>
                  {solution.differentiators?.length > 0 && (
                    <div className="cat-card-diffs">
                      {solution.differentiators.map(d => (
                        <span key={d} className="mini-chip">{d}</span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="cat-options">
                  {[
                    { value: 'core_product', label: 'Core Product', icon: '💰', hint: 'What they pay for' },
                    { value: 'lead_magnet', label: 'Lead Magnet', icon: '🎁', hint: 'Free for expressing interest' },
                    { value: 'bonus', label: 'Bonus', icon: '✨', hint: 'Added value with purchase' },
                    { value: 'skip', label: 'Skip', icon: '⏭️', hint: 'Not pursuing' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      className={`cat-option-btn ${solutionCategories[solution.id] === option.value ? 'selected' : ''}`}
                      onClick={() => setSolutionCategories(prev => ({
                        ...prev,
                        [solution.id]: option.value
                      }))}
                    >
                      <span className="cat-icon">{option.icon}</span>
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {!hasLeadMagnet() && isCategorizationValid() && (
            <p className="warning-text">
              Tip: Consider making at least one solution a Lead Magnet — something free you can give people who express interest in your attraction offer
            </p>
          )}

          <button
            className="primary-button"
            onClick={() => advanceToNext()}
            disabled={!isCategorizationValid()}
            style={{ marginTop: '24px' }}
          >
            Continue
          </button>

          <button
            className="add-more-solutions-btn"
            onClick={() => setStage(STAGES.Q8)}
          >
            + Add More Solutions
          </button>

          <BackButton onClick={() => goBack(stage)} />
        </div>
      </div>
    )
  }

  // SUMMARY STAGE
  if (stage === STAGES.SUMMARY) {
    return (
      <div className="offer-builder-flow">
        <ProgressDots stageGroups={STAGE_GROUPS} currentStage={stage} />
        <div className="summary-container">
          <h1 className="welcome-greeting">Your Offer Summary</h1>

          {answers.selected_persona && (
            <div className="summary-section highlight">
              <h3>Building For</h3>
              <p className="summary-text"><strong>{answers.selected_persona}</strong></p>
              <p className="summary-text" style={{ color: 'rgba(255,255,255,0.7)' }}>{answers.selected_problem}</p>
            </div>
          )}

          <div className="summary-section">
            <h3>Target Customer</h3>
            <div className="summary-item">
              <span className="summary-label">Pain Level:</span>
              <span className="summary-value">{answers.q1_pain_level?.label || 'Not set'}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Problem Area:</span>
              <span className="summary-value">{answers.q2_problem_area?.label || 'Not set'}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Budget:</span>
              <span className="summary-value">{answers.q3_spending_capacity?.label || 'Not set'}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Sunk Cost:</span>
              <span className="summary-value">{answers.q4_sunk_cost?.label || 'Not set'}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Emotion:</span>
              <span className="summary-value">{answers.q5_emotion?.label || 'Not set'}</span>
            </div>
          </div>

          <div className="summary-section">
            <h3>Your Niche (4 Layers)</h3>
            <p className="summary-text">{answers.q6_niche_layers?.value || 'Not defined'}</p>
          </div>

          <div className="summary-section">
            <h3>Why They Haven't Solved It</h3>
            {answers.q7_excuses?.sections ? (
              <div className="reasons-summary">
                <div className="reason-category">
                  <h4>Vehicle Problems</h4>
                  <ul>
                    {answers.q7_excuses.sections.vehicle_problems?.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
                <div className="reason-category">
                  <h4>Internal Beliefs</h4>
                  <ul>
                    {answers.q7_excuses.sections.internal_beliefs?.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
                <div className="reason-category">
                  <h4>External Beliefs</h4>
                  <ul>
                    {answers.q7_excuses.sections.external_beliefs?.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <p className="summary-text">{answers.q7_excuses?.value || 'Not defined'}</p>
            )}
          </div>

          <div className="summary-section">
            <h3>Your Offer Stack</h3>
            <div className="offer-stack-summary">
              {/* Core Products */}
              {getSolutionsByCategory('core_product').length > 0 && (
                <div className="stack-category">
                  <h4>💰 Core Product</h4>
                  {getSolutionsByCategory('core_product').map((sol) => (
                    <div key={sol.id} className="stack-solution">
                      <span className="sol-type">{SOLUTION_LABELS[sol.solutionType]}</span>
                      <p>{sol.description}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Lead Magnets */}
              {getSolutionsByCategory('lead_magnet').length > 0 && (
                <div className="stack-category">
                  <h4>🎁 Lead Magnet</h4>
                  {getSolutionsByCategory('lead_magnet').map((sol) => (
                    <div key={sol.id} className="stack-solution">
                      <span className="sol-type">{SOLUTION_LABELS[sol.solutionType]}</span>
                      <p>{sol.description}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Bonuses */}
              {getSolutionsByCategory('bonus').length > 0 && (
                <div className="stack-category">
                  <h4>✨ Bonuses</h4>
                  {getSolutionsByCategory('bonus').map((sol) => (
                    <div key={sol.id} className="stack-solution">
                      <span className="sol-type">{SOLUTION_LABELS[sol.solutionType]}</span>
                      <p>{sol.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="summary-callout">
            <p><strong>Next steps:</strong> Complete the Product Selection and Lead Magnet Selection flows to finalize your offer details.</p>
          </div>

          {error && <p className="error-message">{error}</p>}

          <button
            className="primary-button"
            onClick={handleSaveResults}
            disabled={isLoading}
            style={{ marginTop: '24px' }}
          >
            {isLoading ? 'Saving...' : 'Save & Complete Quest (+25 pts)'}
          </button>
          <p style={{ marginTop: '12px', fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)' }}>
            Saves your offer and completes this challenge quest
          </p>
        </div>
      </div>
    )
  }

  // SUCCESS STAGE
  if (stage === STAGES.SUCCESS) {
    const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'there'
    const hasProducts = getSolutionsByCategory('core_product').length > 0
    const hasLeadMagnets = getSolutionsByCategory('lead_magnet').length > 0

    return (
      <div className="offer-builder-flow">
        <div className="success-container">
          <div className="success-icon">✓</div>
          <h2>Offer Categorized, {userName}!</h2>
          <p style={{ marginBottom: '8px' }}>You've mapped out your offer stack. Now let's finalize the details.</p>
          <p style={{ color: '#fbbf24', fontWeight: '600', fontSize: '18px' }}>+25 points earned!</p>

          <div className="next-steps-container">
            <h3>Next Steps</h3>
            <p className="next-steps-intro">Complete these flows to finalize your offer:</p>

            <div className="next-flow-cards">
              {hasProducts && (
                <button
                  className="next-flow-card"
                  onClick={() => navigate('/product-selection')}
                >
                  <span className="flow-icon">💰</span>
                  <div className="flow-info">
                    <h4>Product Selection</h4>
                    <p>Define your core product details (+30 pts)</p>
                  </div>
                  <span className="flow-arrow">→</span>
                </button>
              )}

              {hasLeadMagnets && (
                <button
                  className="next-flow-card"
                  onClick={() => navigate('/lead-magnet-selection')}
                >
                  <span className="flow-icon">🎁</span>
                  <div className="flow-info">
                    <h4>Lead Magnet Selection</h4>
                    <p>Choose your lead magnet strategy (+30 pts)</p>
                  </div>
                  <span className="flow-arrow">→</span>
                </button>
              )}
            </div>
          </div>

          <button
            className="secondary-button"
            onClick={() => navigate('/7-day-challenge')}
            style={{ marginTop: '16px' }}
          >
            Back to Challenge
          </button>
        </div>
      </div>
    )
  }

  return null
}

export default OfferBuilderFlow
