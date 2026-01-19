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
import { getValidationObstaclesForOfferBuilder } from '../lib/validationObstacles'
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
  SUMMARY: 'summary',
  SUCCESS: 'success'
}

const STAGE_GROUPS = [
  { id: 'welcome', label: 'Welcome', stages: [STAGES.TIME_CHECK, STAGES.WELCOME, STAGES.PERSONA_SELECT] },
  { id: 'review', label: 'Review', stages: [STAGES.REVIEW_ANSWERS] },
  { id: 'niche', label: 'Niche', stages: [STAGES.Q6, STAGES.Q7] },
  { id: 'solutions', label: 'Solutions', stages: [STAGES.Q8] },
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


  // Persona selector state
  const [personaProfiles, setPersonaProfiles] = useState([])
  const [selectedProfile, setSelectedProfile] = useState(null)

  // Flow Finder skill clusters (for Q8 suggestions)
  const [skillClusters, setSkillClusters] = useState([])

  // AI-powered skill recommendations (from Haiku edge function)
  const [aiRecommendations, setAiRecommendations] = useState(null)
  const [recommendationsLoading, setRecommendationsLoading] = useState(false)

  // Validation survey data (obstacles and solution preferences)
  const [validationData, setValidationData] = useState(null)

  // Auto-save state
  const [showResumePrompt, setShowResumePrompt] = useState(false)
  const [savedProgressData, setSavedProgressData] = useState(null)
  const { saveProgress, loadProgress, clearProgress } = useAutoSave('offer-builder', user?.id)

  // All flow stages in order (after review)
  const flowStages = [
    STAGES.Q6,
    STAGES.Q7,
    STAGES.Q8
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

  // Load validation survey data (obstacles and solution preferences)
  useEffect(() => {
    if (user) {
      loadValidationData()
    }
  }, [user])

  // Load Flow Finder skill clusters for Q8 suggestions
  useEffect(() => {
    if (user) {
      loadSkillClusters()
    }
  }, [user])

  const loadSkillClusters = async () => {
    try {
      const { data: clusters, error } = await supabase
        .from('nikigai_clusters')
        .select('*')
        .eq('user_id', user.id)
        .eq('cluster_type', 'skills')
        .eq('cluster_stage', 'final')
        .order('created_at', { ascending: false })

      if (error) throw error
      console.log('Loaded skill clusters:', clusters)
      setSkillClusters(clusters || [])
    } catch (err) {
      console.error('Error loading skill clusters:', err)
      setSkillClusters([])
    }
  }

  // Fetch AI recommendations from Haiku edge function
  const fetchAIRecommendations = async (clusters, problemText = '') => {
    if (!user || !clusters?.length || recommendationsLoading) return

    setRecommendationsLoading(true)
    try {
      const response = await supabase.functions.invoke('skill-recommendations', {
        body: {
          userId: user.id,
          problemText: problemText, // Pass the selected problem for targeted recommendations
          skillClusters: clusters.map(c => ({
            id: c.id,
            cluster_label: c.cluster_label,
            items: c.items,
            proficiency: c.proficiency
          }))
        }
      })

      if (response.error) throw response.error
      console.log('AI Recommendations:', response.data)
      setAiRecommendations(response.data)
    } catch (err) {
      console.error('Error fetching AI recommendations:', err)
      // Fall back to rule-based recommendations (already implemented in getDeliveryFormatSuggestions)
      setAiRecommendations(null)
    } finally {
      setRecommendationsLoading(false)
    }
  }

  // Get delivery format suggestions based on skill cluster
  // Uses AI recommendations if available, otherwise falls back to rule-based logic
  const getDeliveryFormatSuggestions = (cluster) => {
    // Check if we have AI recommendation for this skill
    if (aiRecommendations?.recommendations) {
      const aiRec = aiRecommendations.recommendations.find(r => r.skillId === cluster.id)
      if (aiRec) {
        const suggestions = []
        const icons = { service: '💼', productized: '📦', product: '🛍️' }

        // Primary recommendation
        if (aiRec.primaryFormat) {
          suggestions.push({
            category: aiRec.primaryFormat.category,
            type: aiRec.primaryFormat.type,
            icon: icons[aiRec.primaryFormat.category] || '📦',
            label: aiRec.primaryFormat.label,
            reason: aiRec.reasoning || `AI-recommended based on your profile`,
            isAI: true
          })
        }

        // Secondary recommendation
        if (aiRec.secondaryFormat) {
          suggestions.push({
            category: aiRec.secondaryFormat.category,
            type: aiRec.secondaryFormat.type,
            icon: icons[aiRec.secondaryFormat.category] || '📦',
            label: aiRec.secondaryFormat.label,
            reason: 'Alternative option',
            isAI: true
          })
        }

        if (suggestions.length > 0) return suggestions
      }
    }

    // Fall back to rule-based logic
    const label = cluster?.cluster_label?.toLowerCase() || ''
    const proficiency = cluster?.proficiency || 'establishing'

    // Map skill archetypes to delivery formats
    const suggestions = []

    // Guide-type skills → Service (Facilitating, Coaching, Nurturing, Connecting)
    if (label.includes('facilitat') || label.includes('coach') || label.includes('nurtur') || label.includes('connect') || label.includes('influenc')) {
      suggestions.push({
        category: 'service',
        type: proficiency === 'mastering' ? 'custom_service' : 'packaged_service',
        icon: '💼',
        label: proficiency === 'mastering' ? 'Custom Service' : 'Packaged Service',
        reason: `Your ${cluster.cluster_label} skills shine in personal delivery`
      })
      suggestions.push({
        category: 'productized',
        type: 'live_group',
        icon: '📦',
        label: 'Live Cohort',
        reason: 'Scale your guidance to groups'
      })
    }

    // Maker-type skills → Products (Building, Creating, Designing, Expressing)
    if (label.includes('build') || label.includes('creat') || label.includes('design') || label.includes('express')) {
      suggestions.push({
        category: 'product',
        type: 'digital_product',
        icon: '🛍️',
        label: 'Digital Product',
        reason: `Turn your ${cluster.cluster_label} output into templates/tools`
      })
      if (proficiency === 'mastering') {
        suggestions.push({
          category: 'productized',
          type: 'automated_group',
          icon: '📦',
          label: 'Self-Paced Course',
          reason: 'Teach your mastered process'
        })
      }
    }

    // Analyst-type skills → Service/Productized (Researching, Analyzing, Strategizing, Organizing)
    if (label.includes('research') || label.includes('learn') || label.includes('analyz') || label.includes('strateg') || label.includes('organiz')) {
      suggestions.push({
        category: 'service',
        type: 'packaged_service',
        icon: '💼',
        label: 'Packaged Service',
        reason: `Deliver your ${cluster.cluster_label} as a structured engagement`
      })
      suggestions.push({
        category: 'product',
        type: 'digital_product',
        icon: '🛍️',
        label: 'Templates/Frameworks',
        reason: 'Package your analytical process'
      })
    }

    // Communicator-type skills → Productized/Products (Expressing, Communicating)
    if (label.includes('communicat') || label.includes('writing') || label.includes('speaking')) {
      suggestions.push({
        category: 'productized',
        type: 'automated_group',
        icon: '📦',
        label: 'Online Course',
        reason: 'Teach your communication methods'
      })
      suggestions.push({
        category: 'product',
        type: 'digital_product',
        icon: '🛍️',
        label: 'Content Templates',
        reason: 'Package your communication frameworks'
      })
    }

    // If no specific match, provide generic suggestions based on proficiency
    if (suggestions.length === 0) {
      if (proficiency === 'mastering') {
        suggestions.push({
          category: 'service',
          type: 'custom_service',
          icon: '💼',
          label: 'Premium Service',
          reason: `Leverage your mastery in ${cluster.cluster_label}`
        })
      } else {
        suggestions.push({
          category: 'productized',
          type: 'live_group',
          icon: '📦',
          label: 'Group Program',
          reason: `Share your ${cluster.cluster_label} journey with others`
        })
      }
    }

    return suggestions.slice(0, 2) // Return top 2 suggestions
  }

  // Pre-fill solution from skill suggestion
  const prefillSolutionFromSkill = (cluster, suggestion) => {
    setCurrentSolution(prev => ({
      ...prev,
      solutionCategory: suggestion.category,
      solutionType: suggestion.type
      // Don't prefill description - let user think about what the solution needs to do
    }))
    // Close the skills panel after selection
    setSkillsPanelOpen(false)
  }

  // Skills panel collapsed state - default OPEN since it's contextually relevant
  const [skillsPanelOpen, setSkillsPanelOpen] = useState(true)

  // Handle skills panel toggle - fetch AI recommendations on first open
  const handleSkillsPanelToggle = () => {
    const willOpen = !skillsPanelOpen
    setSkillsPanelOpen(willOpen)

    // Fetch AI recommendations when opening (if not already loaded)
    // Pass the selected problem for more targeted recommendations
    if (willOpen && skillClusters.length > 0 && !aiRecommendations && !recommendationsLoading) {
      fetchAIRecommendations(skillClusters, currentSolution.problemText)
    }
  }

  const loadValidationData = async () => {
    try {
      const data = await getValidationObstaclesForOfferBuilder(user.id)
      setValidationData(data)
    } catch (err) {
      console.error('Error loading validation data:', err)
      setValidationData(null)
    }
  }

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
      selectedProfile
    }
    saveProgress(progressData)
  }, [stage, answers, nicheLayers, sectionInputs, problemSolutions, selectedProfile, user, saveProgress])

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

    const newAnswers = {
      ...answers,
      [questionId]: {
        type: 'problem_solutions',
        solutions: problemSolutions
      }
    }
    setAnswers(newAnswers)
    // Go straight to summary (tier assignment happens in Grand Slam Matrix)
    setStage(STAGES.SUMMARY)
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

      // Prepare responses (solutions without tier assignment - that happens in Grand Slam Matrix)
      const fullResponses = {
        ...answers
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

      // Helper to add validation obstacle to appropriate section
      const addValidationObstacle = (text, type) => {
        // Map validation type to section
        let sectionId = 'vehicle_problems'
        if (type === 'internal_belief') sectionId = 'internal_beliefs'
        else if (type === 'emotional_indicator') sectionId = 'external_beliefs'
        else if (type === 'inverse_need') sectionId = 'external_beliefs'

        const currentSection = sectionInputs[sectionId] || ['', '', '']
        // Find first empty slot or add new
        const emptyIndex = currentSection.findIndex(v => !v.trim())
        if (emptyIndex !== -1) {
          updateSectionInput(sectionId, emptyIndex, text)
        } else if (currentSection.length < 8) {
          // Add new slot with the value
          setSectionInputs(prev => ({
            ...prev,
            [sectionId]: [...prev[sectionId], text]
          }))
        }
      }

      // Check if an obstacle is already in the sections
      const isObstacleAdded = (text) => {
        return Object.values(sectionInputs).some(section =>
          section.some(v => v.trim().toLowerCase() === text.trim().toLowerCase())
        )
      }

      return (
        <div className="offer-builder-flow">
          <ProgressDots stageGroups={STAGE_GROUPS} currentStage={stage} />
          <div className="question-container multi-section-container">
            <div className="question-number">{getCurrentQuestionDisplay()}</div>
            <h2 className="question-text">{question.question}</h2>
            {question.subtext && <p className="question-subtext">{question.subtext}</p>}

            {/* Validation Survey Obstacles Panel */}
            {validationData?.hasValidationData && validationData?.obstacles?.length > 0 && (
              <div className="validation-objections-panel">
                <div className="objections-panel-header">
                  <span className="panel-icon">📊</span>
                  <span>REAL OBSTACLES FROM VALIDATION SURVEYS ({validationData.totalResponses} responses)</span>
                </div>
                <div className="objections-panel-content">
                  {/* Direct obstacles */}
                  {validationData.byType?.directObstacles?.length > 0 && (
                    <div className="validation-section">
                      <p className="section-label">🎯 Direct reasons they gave:</p>
                      <div className="objections-list">
                        {validationData.byType.directObstacles.slice(0, 5).map((item, i) => (
                          <button
                            key={`direct-${i}`}
                            type="button"
                            className={`objection-chip direct ${isObstacleAdded(item.text) ? 'added' : ''}`}
                            onClick={() => addValidationObstacle(item.text, item.type)}
                            disabled={isObstacleAdded(item.text)}
                          >
                            {isObstacleAdded(item.text) ? '✓ ' : '+ '}
                            {item.text}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Internal beliefs */}
                  {validationData.byType?.internalBeliefs?.length > 0 && (
                    <div className="validation-section">
                      <p className="section-label">🧠 Internal stories they tell themselves:</p>
                      <div className="objections-list">
                        {validationData.byType.internalBeliefs.slice(0, 3).map((item, i) => (
                          <button
                            key={`belief-${i}`}
                            type="button"
                            className={`objection-chip belief ${isObstacleAdded(item.text) ? 'added' : ''}`}
                            onClick={() => addValidationObstacle(item.text, item.type)}
                            disabled={isObstacleAdded(item.text)}
                          >
                            {isObstacleAdded(item.text) ? '✓ ' : '+ '}
                            "{item.text}"
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Emotional indicators */}
                  {validationData.byType?.emotionalIndicators?.length > 0 && (
                    <div className="validation-section">
                      <p className="section-label">💭 Emotional barriers detected:</p>
                      <div className="objections-list">
                        {validationData.byType.emotionalIndicators.slice(0, 3).map((item, i) => (
                          <button
                            key={`emotion-${i}`}
                            type="button"
                            className={`objection-chip emotion ${isObstacleAdded(item.text) ? 'added' : ''}`}
                            onClick={() => addValidationObstacle(item.text, item.type)}
                            disabled={isObstacleAdded(item.text)}
                          >
                            {isObstacleAdded(item.text) ? '✓ ' : '+ '}
                            {item.text}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="objections-tip">
                    💡 These are real responses from your validation surveys - click to add!
                  </p>
                </div>
              </div>
            )}

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

            {/* Unified Customer Intelligence Box */}
            {(() => {
              // Use real data if available, otherwise show dummy data for testing
              const hasRealData = validationData?.hasValidationData
              const hasRealPrefs = validationData?.solutionPreferences?.hasPreferences

              const displayData = hasRealData ? {
                totalResponses: validationData.totalResponses,
                dreamOutcome: validationData.insights?.dreamOutcomes?.[0]?.text,
                painLevel: validationData.insights?.painLevel?.average,
                budget: validationData.insights?.budgets?.aggregated?.[0]?.text,
                hellYesFactors: validationData.insights?.hellYesFactors?.slice(0, 3).map(f => f.text)
              } : {
                // DUMMY DATA FOR TESTING - Remove when done
                totalResponses: 12,
                dreamOutcome: "Finally feel confident showing up online and attracting dream clients",
                painLevel: 7.5,
                budget: "$500 - $2,000",
                hellYesFactors: ["Proven step-by-step system", "Personal feedback & support", "Results within 30 days"]
              }

              const prefsData = hasRealPrefs ? validationData.solutionPreferences : {
                // DUMMY DATA FOR TESTING
                hasPreferences: true,
                recommendedVersion: 'productized',
                breakdown: { service: 3, productized: 7, product: 2 },
                totalVotes: 12,
                specificTypes: {
                  service: [],
                  productized: [{ text: 'Live cohort', count: 4 }, { text: 'Self-paced course', count: 3 }],
                  product: []
                }
              }

              const hasDreamOutcome = displayData.dreamOutcome
              const hasPainLevel = displayData.painLevel
              const hasBudget = displayData.budget
              const hasHellYes = displayData.hellYesFactors?.length > 0
              const hasSolutionPref = prefsData?.hasPreferences

              // Only show if we have some data
              if (!hasDreamOutcome && !hasPainLevel && !hasBudget && !hasHellYes && !hasSolutionPref) return null

              const prefIcons = { service: '💼', productized: '📦', product: '🛍️' }
              const prefLabels = { service: 'Service', productized: 'Productized', product: 'Product' }

              return (
                <div className="customer-intelligence-box">
                  {/* Header */}
                  <div className="ci-header">
                    <div className="ci-header-left">
                      <span className="ci-icon">🧠</span>
                      <span className="ci-title">CUSTOMER INTELLIGENCE</span>
                    </div>
                    <span className="ci-count">
                      {(hasRealData || hasRealPrefs) ? `${displayData.totalResponses} responses` : 'demo data'}
                    </span>
                  </div>

                  {/* Dream Outcome - Hero */}
                  {hasDreamOutcome && (
                    <div className="ci-dream">
                      <span className="ci-label">🎯 What they want</span>
                      <p className="ci-dream-text">"{displayData.dreamOutcome}"</p>
                    </div>
                  )}

                  {/* Stats Row */}
                  <div className="ci-stats-row">
                    {hasPainLevel && (
                      <div className="ci-stat">
                        <span className="ci-stat-label">🔥 Pain</span>
                        <span className={`ci-stat-value ${displayData.painLevel >= 7 ? 'high' : displayData.painLevel >= 4 ? 'medium' : 'low'}`}>
                          {displayData.painLevel}/10
                        </span>
                      </div>
                    )}
                    {hasBudget && (
                      <div className="ci-stat">
                        <span className="ci-stat-label">💰 Budget</span>
                        <span className="ci-stat-value">{displayData.budget}</span>
                      </div>
                    )}
                    {hasSolutionPref && (
                      <div className="ci-stat winner">
                        <span className="ci-stat-label">👑 Winner</span>
                        <span className="ci-stat-value gold">
                          {prefIcons[prefsData.recommendedVersion]} {prefLabels[prefsData.recommendedVersion]}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Solution Preference Bars */}
                  {hasSolutionPref && (
                    <div className="ci-bars">
                      {['service', 'productized', 'product'].map(version => {
                        const count = prefsData.breakdown[version] || 0
                        const pct = prefsData.totalVotes > 0 ? Math.round((count / prefsData.totalVotes) * 100) : 0
                        const isWinner = version === prefsData.recommendedVersion
                        return (
                          <div key={version} className={`ci-bar ${isWinner ? 'winner' : ''}`}>
                            <div className="ci-bar-info">
                              <span className="ci-bar-label">{prefIcons[version]} {prefLabels[version]}</span>
                              <span className="ci-bar-pct">{pct}%</span>
                            </div>
                            <div className="ci-bar-track">
                              <div className="ci-bar-fill" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Bottom: Hell Yes + Specific Types */}
                  {(hasHellYes || (hasSolutionPref && prefsData.specificTypes[prefsData.recommendedVersion]?.length > 0)) && (
                    <div className="ci-bottom">
                      {hasHellYes && (
                        <div className="ci-section">
                          <span className="ci-label">✨ They'll say YES if</span>
                          <div className="ci-chips">
                            {displayData.hellYesFactors.map((factor, i) => (
                              <span key={i} className="ci-chip purple">{factor}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {hasSolutionPref && prefsData.specificTypes[prefsData.recommendedVersion]?.length > 0 && (
                        <div className="ci-section">
                          <span className="ci-label">📋 They specifically want</span>
                          <div className="ci-chips">
                            {prefsData.specificTypes[prefsData.recommendedVersion].slice(0, 3).map((type, i) => (
                              <span key={i} className="ci-chip gold">
                                {type.text}{type.count > 1 && <span className="ci-chip-count"> ×{type.count}</span>}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })()}

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
              <div className="form-header">
                <h4>{problemSolutions.length === 0 ? 'Add a Solution' : 'Add Another Solution'}</h4>
                <div className="progress-row">
                  <span className={`progress-item ${problemSolutions.length >= targetSolutions ? 'achieved' : ''}`}>
                    {problemSolutions.length >= targetSolutions ? '✓' : '○'} {problemSolutions.length}/{targetSolutions}
                  </span>
                  <span className="progress-divider">•</span>
                  <span className={`progress-item ${problemsCovered >= totalProblems ? 'achieved' : ''}`}>
                    {problemsCovered >= totalProblems ? '✓' : '○'} {problemsCovered}/{totalProblems} problems
                  </span>
                </div>
              </div>

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
                    // Reset AI recommendations when problem changes (will refetch with new problem)
                    setAiRecommendations(null)
                    setSkillsPanelOpen(false)
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
                      onClick={() => {
                        setCurrentSolution(prev => ({
                          ...prev,
                          alreadyDelivers: false,
                          existingProductId: null,
                          solutionCategory: '',
                          solutionType: '',
                          description: ''
                        }))
                        // Auto-fetch AI recommendations when "No, this is new" is clicked
                        if (skillClusters.length > 0 && !aiRecommendations && !recommendationsLoading) {
                          fetchAIRecommendations(skillClusters, currentSolution.problemText)
                        }
                      }}
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

              {/* Flow Finder Skills Panel - Show when "No, this is new" is selected */}
              {currentSolution.alreadyDelivers === false && skillClusters.length > 0 && (
                <div className={`skills-suggestions-panel ${skillsPanelOpen ? 'open' : 'collapsed'}`}>
                  <div className="skills-panel-header-row">
                    <button
                      type="button"
                      className="skills-panel-toggle"
                      onClick={handleSkillsPanelToggle}
                    >
                      <div className="skills-panel-header">
                        <span className="panel-icon">💡</span>
                        <span>SUGGESTIONS FROM YOUR SKILLS</span>
                      </div>
                      <span className="toggle-arrow">{skillsPanelOpen ? '▲' : '▼'}</span>
                    </button>
                    {skillsPanelOpen && (
                      <button
                        type="button"
                        className="skip-suggestions-btn"
                        onClick={() => setSkillsPanelOpen(false)}
                      >
                        Skip
                      </button>
                    )}
                  </div>

                  {skillsPanelOpen && (
                    <>
                      {/* Show AI context if available */}
                      {aiRecommendations?.context && (
                        <div className="ai-context-info">
                          <span className="ai-badge">AI-Powered</span>
                          <span className="context-item">
                            Your level: <strong>{aiRecommendations.context.wealthLadder?.replace(/_/g, ' ') || 'Unknown'}</strong>
                          </span>
                        </div>
                      )}

                      {/* Loading state */}
                      {recommendationsLoading && (
                        <div className="recommendations-loading">
                          <div className="typing-indicator small">
                            <span></span><span></span><span></span>
                          </div>
                          <span className="loading-text">Analyzing your profile...</span>
                        </div>
                      )}

                      {/* Show top 3 skills, sorted by relevance if available */}
                      <div className="skills-suggestions-list">
                        {skillClusters.slice(0, 3).map((cluster, idx) => {
                          const suggestions = getDeliveryFormatSuggestions(cluster)
                          if (suggestions.length === 0) return null

                          // Get relevance score for this skill (from AI recommendations)
                          const aiRec = aiRecommendations?.recommendations?.find(r => r.skillId === cluster.id)
                          const relevanceScore = aiRec?.relevanceScore || 0
                          const isHighlyRelevant = relevanceScore >= 7

                          return (
                            <div key={idx} className={`skill-suggestion-card ${isHighlyRelevant ? 'high-relevance' : ''}`}>
                              <div className="skill-header">
                                <strong>{cluster.cluster_label}</strong>
                                {relevanceScore > 0 && (
                                  <span className={`relevance-indicator ${isHighlyRelevant ? 'high' : relevanceScore >= 5 ? 'medium' : 'low'}`}>
                                    {isHighlyRelevant ? '●●●' : relevanceScore >= 5 ? '●●○' : '●○○'}
                                  </span>
                                )}
                              </div>

                              {/* Equal-sized suggestion buttons */}
                              <div className="delivery-suggestions">
                                {suggestions.map((suggestion, i) => (
                                  <button
                                    key={i}
                                    type="button"
                                    className={`use-suggestion-btn ${suggestion.isAI && isHighlyRelevant ? 'ai-powered' : ''}`}
                                    onClick={() => prefillSolutionFromSkill(cluster, suggestion)}
                                  >
                                    <span className="suggestion-icon">{suggestion.icon}</span>
                                    <span className="suggestion-label">
                                      {suggestion.label}
                                      {suggestion.isAI && i === 0 && isHighlyRelevant && (
                                        <span className="recommended-tag">Recommended</span>
                                      )}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      {/* Show more link if there are more skills */}
                      {skillClusters.length > 3 && (
                        <p className="more-skills-hint">
                          + {skillClusters.length - 3} more skills available
                        </p>
                      )}
                    </>
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
                  <label>
                    {currentSolution.existingProductId
                      ? 'Confirm or edit the description'
                      : currentSolution.problemText
                        ? `To solve "${currentSolution.problemText.length > 40 ? currentSolution.problemText.substring(0, 40) + '...' : currentSolution.problemText}", what does the solution need to do?`
                        : 'What does the solution need to do?'
                    }
                  </label>
                  <textarea
                    className="solution-input"
                    placeholder="e.g. Help them see their blind spots, give them a proven framework, hold them accountable..."
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
                  <label>What makes your solution better than competitors? (optional)</label>
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
            <h3>Your Solutions ({problemSolutions.length})</h3>
            <p className="summary-subtext" style={{ marginBottom: '16px', color: 'rgba(255,255,255,0.6)' }}>
              These solutions will be assigned to offer tiers in the Grand Slam Matrix
            </p>
            <div className="solutions-summary">
              {problemSolutions.map((sol, index) => (
                <div key={index} className="stack-solution">
                  <div className="solution-format-badge">
                    {sol.solutionCategory === 'service' && '💼'}
                    {sol.solutionCategory === 'productized' && '📦'}
                    {sol.solutionCategory === 'product' && '🛍️'}
                    <span className="sol-type">{SOLUTION_LABELS[sol.solutionType]}</span>
                  </div>
                  <p className="solution-problem-ref" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                    Solves: {sol.problemText}
                  </p>
                  <p>{sol.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="summary-callout">
            <p><strong>Next step:</strong> Complete the Money Model flows, then use the Grand Slam Matrix to assign these solutions to your offer tiers (Core, Upsell, Downsell, etc.)</p>
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

    return (
      <div className="offer-builder-flow">
        <div className="success-container">
          <div className="success-icon">✓</div>
          <h2>Solutions Captured, {userName}!</h2>
          <p style={{ marginBottom: '8px' }}>You've captured {problemSolutions.length} solution{problemSolutions.length !== 1 ? 's' : ''}. Next, define your offer strategies.</p>
          <p style={{ color: '#fbbf24', fontWeight: '600', fontSize: '18px' }}>+25 points earned!</p>

          <div className="next-steps-container">
            <h3>Next Steps</h3>
            <p className="next-steps-intro">Complete Money Models, then build your Grand Slam:</p>

            <div className="next-flow-cards">
              <button
                className="next-flow-card"
                onClick={() => navigate('/attraction-offer')}
              >
                <span className="flow-icon">🎯</span>
                <div className="flow-info">
                  <h4>Money Model Flows</h4>
                  <p>Define strategies for each offer tier</p>
                </div>
                <span className="flow-arrow">→</span>
              </button>

              <button
                className="next-flow-card"
                onClick={() => navigate('/grand-slam-matrix')}
              >
                <span className="flow-icon">🏆</span>
                <div className="flow-info">
                  <h4>Grand Slam Matrix</h4>
                  <p>Assign solutions to offer tiers</p>
                </div>
                <span className="flow-arrow">→</span>
              </button>
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
