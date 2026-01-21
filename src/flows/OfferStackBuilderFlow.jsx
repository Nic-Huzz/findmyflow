/**
 * OfferStackBuilderFlow.jsx - Offer Stack Builder
 *
 * Stage 2 (Product Creation) flow for packaging your offer with:
 * - Lead Magnet selection
 * - Bonuses
 * - Guarantee
 * - Scarcity/Urgency
 * - Naming
 * - Summary visualization
 *
 * This flow takes the product evaluated in Grand Slam Offer and packages it
 * into an irresistible offer stack.
 *
 * Created: January 2026
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import { completeFlowQuest } from '../lib/questCompletion'
import { useAutoSave } from '../hooks/useAutoSave'
import { BackButton, ProgressDots } from '../components/MoneyModelShared'
import './OfferStackBuilderFlow.css'

const STAGES = {
  LOADING: 'loading',
  WELCOME: 'welcome',
  LEAD_MAGNET_INTRO: 'lead_magnet_intro',
  LEAD_MAGNET_QUESTIONS: 'lead_magnet_questions',
  LEAD_MAGNET_SELECT: 'lead_magnet_select',
  BONUSES_INTRO: 'bonuses_intro',
  BONUSES: 'bonuses',
  GUARANTEE: 'guarantee',
  SCARCITY: 'scarcity',
  NAMING: 'naming',
  SUMMARY: 'summary',
  SUCCESS: 'success'
}

const STAGE_ORDER = [
  STAGES.WELCOME,
  STAGES.LEAD_MAGNET_INTRO,
  STAGES.LEAD_MAGNET_QUESTIONS,
  STAGES.LEAD_MAGNET_SELECT,
  STAGES.BONUSES_INTRO,
  STAGES.BONUSES,
  STAGES.GUARANTEE,
  STAGES.SCARCITY,
  STAGES.NAMING,
  STAGES.SUMMARY
]

// Lead Magnet types
const LEAD_MAGNET_TYPES = {
  reveal_problem: {
    name: 'Reveal the Problem',
    icon: '🔍',
    shortDesc: 'Quiz, assessment, calculator, audit',
    description: 'Help them realize they have a problem they didn\'t know about',
    examples: ['Assessment', 'Quiz', 'Scorecard', 'Calculator', 'Free Audit']
  },
  free_trial: {
    name: 'Free Trial',
    icon: '🎁',
    shortDesc: 'Free session, sample, demo access',
    description: 'Let them experience your solution before buying',
    examples: ['Free Session', 'Sample', 'Demo Access', 'Trial Period']
  },
  free_step_1: {
    name: 'Free Step 1',
    icon: '📋',
    shortDesc: 'Template, guide, checklist, mini-course',
    description: 'Give them the first step of your process for free',
    examples: ['Template', 'Checklist', 'Guide', 'Mini-Course', 'Workbook']
  }
}

// Lead Magnet questions
const LM_QUESTIONS = [
  {
    id: 'journey',
    question: 'Where is your ideal customer in their journey?',
    options: [
      { value: 'unaware', label: 'Unaware', description: 'They don\'t know they have a problem yet' },
      { value: 'aware', label: 'Problem-Aware', description: 'They know the problem, seeking solutions' },
      { value: 'comparison', label: 'Comparing Options', description: 'They\'re looking at different solutions' },
      { value: 'ready', label: 'Ready to Buy', description: 'They just need the right offer' }
    ]
  },
  {
    id: 'barrier',
    question: 'What\'s their #1 barrier to buying?',
    options: [
      { value: 'confused', label: 'Confused', description: 'They don\'t know what they need' },
      { value: 'skeptical', label: 'Skeptical', description: 'They don\'t believe it will work' },
      { value: 'overwhelmed', label: 'Overwhelmed', description: 'Too many options or steps' },
      { value: 'unsure_fit', label: 'Unsure of Fit', description: 'They don\'t know if it\'s right for them' }
    ]
  },
  {
    id: 'conviction',
    question: 'What would convince them you\'re the right choice?',
    options: [
      { value: 'quick_win', label: 'A Quick Win', description: 'Show results fast' },
      { value: 'personalized', label: 'Personalized Insight', description: 'Make it about them' },
      { value: 'proof', label: 'Proof It Works', description: 'Show evidence and results' },
      { value: 'first_step', label: 'The First Step', description: 'Make it easy to start' }
    ]
  }
]

// Guarantee types
const GUARANTEE_TYPES = [
  { id: 'unconditional', name: 'Unconditional', description: 'Full refund, no questions asked', icon: '✅', example: '30-day money-back guarantee' },
  { id: 'conditional', name: 'Conditional', description: 'Refund if they follow the process', icon: '📋', example: 'If you do X, Y, Z and don\'t get results, we\'ll refund you' },
  { id: 'anti_guarantee', name: 'Anti-Guarantee', description: 'No refunds - creates commitment', icon: '🔒', example: 'All sales final - for serious buyers only' },
  { id: 'results', name: 'Results-Based', description: 'Guarantee specific outcomes', icon: '🎯', example: 'Get X result or your money back' },
  { id: 'extended', name: 'Extended Period', description: 'Longer than usual refund window', icon: '📅', example: '90-day or 1-year guarantee' }
]

// Scarcity/Urgency types
const SCARCITY_TYPES = [
  { id: 'limited_time', name: 'Limited Time', description: 'Deadline for the offer', icon: '⏰', example: 'Ends Friday at midnight' },
  { id: 'limited_spots', name: 'Limited Spots', description: 'Cap on number of customers', icon: '👥', example: 'Only 20 spots available' },
  { id: 'bonus_expires', name: 'Bonus Expires', description: 'Extra value disappears', icon: '🎁', example: 'Free bonus only for first 50' },
  { id: 'price_increase', name: 'Price Increase', description: 'Price goes up soon', icon: '💰', example: 'Price doubles next month' },
  { id: 'seasonal', name: 'Seasonal', description: 'Only available certain times', icon: '📆', example: 'Only open twice per year' }
]

function OfferStackBuilderFlow() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()

  const [stage, setStage] = useState(STAGES.LOADING)
  const [grandSlamData, setGrandSlamData] = useState(null)
  const [offerBuilderData, setOfferBuilderData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState(null)

  // Lead Magnet state
  const [lmQuestionIndex, setLmQuestionIndex] = useState(0)
  const [lmAnswers, setLmAnswers] = useState({})
  const [selectedLeadMagnet, setSelectedLeadMagnet] = useState(null)
  const [leadMagnetIdea, setLeadMagnetIdea] = useState('')

  // Bonuses state
  const [bonuses, setBonuses] = useState([])
  const [newBonus, setNewBonus] = useState({ name: '', value: '' })

  // Guarantee state
  const [selectedGuarantee, setSelectedGuarantee] = useState(null)
  const [guaranteeDetails, setGuaranteeDetails] = useState('')

  // Scarcity state
  const [selectedScarcity, setSelectedScarcity] = useState([])
  const [scarcityDetails, setScarcityDetails] = useState({})

  // Naming state
  const [offerName, setOfferName] = useState('')
  const [tagline, setTagline] = useState('')

  // Auto-save
  const [showResumePrompt, setShowResumePrompt] = useState(false)
  const [savedProgressData, setSavedProgressData] = useState(null)
  const { saveProgress, loadProgress, clearProgress } = useAutoSave('offer-stack-builder', user?.id)

  // Load existing data
  useEffect(() => {
    if (user) {
      loadExistingData()
    }
  }, [user])

  // Check for saved progress
  useEffect(() => {
    if (user && !isLoading) {
      const saved = loadProgress()
      if (saved && saved.stage && saved.stage !== STAGES.LOADING && saved.stage !== STAGES.SUCCESS) {
        setSavedProgressData(saved)
        setShowResumePrompt(true)
      }
    }
  }, [user, isLoading, loadProgress])

  // Auto-save on state changes
  useEffect(() => {
    if (!user || stage === STAGES.LOADING || stage === STAGES.SUCCESS) return
    const progressData = {
      stage,
      lmAnswers,
      selectedLeadMagnet,
      leadMagnetIdea,
      bonuses,
      selectedGuarantee,
      guaranteeDetails,
      selectedScarcity,
      scarcityDetails,
      offerName,
      tagline
    }
    saveProgress(progressData)
  }, [stage, lmAnswers, selectedLeadMagnet, leadMagnetIdea, bonuses, selectedGuarantee, guaranteeDetails, selectedScarcity, scarcityDetails, offerName, tagline, user, saveProgress])

  const loadExistingData = async () => {
    try {
      // Load Grand Slam Offer data
      const { data: grandSlam, error: gsError } = await supabase
        .from('grand_slam_offers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (gsError && gsError.code !== 'PGRST116') {
        console.log('No Grand Slam data found')
      }

      // Load Offer Builder data for context
      const { data: offerData, error: offerError } = await supabase
        .from('offer_builder_assessments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (offerError && offerError.code !== 'PGRST116') {
        console.log('No Offer Builder data found')
      }

      setGrandSlamData(grandSlam || null)
      setOfferBuilderData(offerData || null)
      setStage(STAGES.WELCOME)
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Failed to load your data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResumeProgress = useCallback(() => {
    if (savedProgressData) {
      setStage(savedProgressData.stage)
      if (savedProgressData.lmAnswers) setLmAnswers(savedProgressData.lmAnswers)
      if (savedProgressData.selectedLeadMagnet) setSelectedLeadMagnet(savedProgressData.selectedLeadMagnet)
      if (savedProgressData.leadMagnetIdea) setLeadMagnetIdea(savedProgressData.leadMagnetIdea)
      if (savedProgressData.bonuses) setBonuses(savedProgressData.bonuses)
      if (savedProgressData.selectedGuarantee) setSelectedGuarantee(savedProgressData.selectedGuarantee)
      if (savedProgressData.guaranteeDetails) setGuaranteeDetails(savedProgressData.guaranteeDetails)
      if (savedProgressData.selectedScarcity) setSelectedScarcity(savedProgressData.selectedScarcity)
      if (savedProgressData.scarcityDetails) setScarcityDetails(savedProgressData.scarcityDetails)
      if (savedProgressData.offerName) setOfferName(savedProgressData.offerName)
      if (savedProgressData.tagline) setTagline(savedProgressData.tagline)
    }
    setShowResumePrompt(false)
  }, [savedProgressData])

  const handleStartFresh = useCallback(() => {
    clearProgress()
    setShowResumePrompt(false)
    setSavedProgressData(null)
  }, [clearProgress])

  // Navigation
  const goBack = () => {
    const currentIndex = STAGE_ORDER.indexOf(stage)
    if (currentIndex > 0) {
      setStage(STAGE_ORDER[currentIndex - 1])
    }
  }

  const goNext = () => {
    const currentIndex = STAGE_ORDER.indexOf(stage)
    if (currentIndex < STAGE_ORDER.length - 1) {
      setStage(STAGE_ORDER[currentIndex + 1])
    }
  }

  // Get current step number (for progress)
  const getCurrentStep = () => {
    const index = STAGE_ORDER.indexOf(stage)
    return index >= 0 ? index : 0
  }

  // Lead Magnet recommendation logic
  const getLeadMagnetRecommendation = () => {
    const scores = { reveal_problem: 0, free_trial: 0, free_step_1: 0 }

    if (lmAnswers.journey === 'unaware') scores.reveal_problem += 3
    if (lmAnswers.journey === 'aware') scores.free_step_1 += 2
    if (lmAnswers.journey === 'comparison') scores.free_trial += 3
    if (lmAnswers.journey === 'ready') scores.free_trial += 2

    if (lmAnswers.barrier === 'confused') scores.reveal_problem += 2
    if (lmAnswers.barrier === 'skeptical') scores.free_trial += 3
    if (lmAnswers.barrier === 'overwhelmed') scores.free_step_1 += 3
    if (lmAnswers.barrier === 'unsure_fit') scores.reveal_problem += 2

    if (lmAnswers.conviction === 'quick_win') scores.free_step_1 += 2
    if (lmAnswers.conviction === 'personalized') scores.reveal_problem += 3
    if (lmAnswers.conviction === 'proof') scores.free_trial += 3
    if (lmAnswers.conviction === 'first_step') scores.free_step_1 += 3

    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1])
    return sorted[0][0]
  }

  // Handle LM question answer
  const handleLmAnswer = (option) => {
    const currentQuestion = LM_QUESTIONS[lmQuestionIndex]
    setLmAnswers(prev => ({ ...prev, [currentQuestion.id]: option.value }))

    if (lmQuestionIndex < LM_QUESTIONS.length - 1) {
      setLmQuestionIndex(prev => prev + 1)
    } else {
      // All questions answered - get recommendation
      const recommended = getLeadMagnetRecommendation()
      setSelectedLeadMagnet(recommended)
      setStage(STAGES.LEAD_MAGNET_SELECT)
    }
  }

  // Bonus handlers
  const addBonus = () => {
    if (newBonus.name.trim() && bonuses.length < 5) {
      setBonuses(prev => [...prev, { ...newBonus, id: Date.now() }])
      setNewBonus({ name: '', value: '' })
    }
  }

  const removeBonus = (id) => {
    setBonuses(prev => prev.filter(b => b.id !== id))
  }

  const updateBonusValue = (id, value) => {
    setBonuses(prev => prev.map(b =>
      b.id === id ? { ...b, value: value.replace(/[^0-9]/g, '') } : b
    ))
  }

  // Scarcity handlers
  const toggleScarcity = (id) => {
    setSelectedScarcity(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  // Calculate total bonus value
  const getTotalBonusValue = () => {
    return bonuses.reduce((sum, b) => sum + (parseInt(b.value) || 0), 0)
  }

  // Save and complete
  const handleComplete = async () => {
    setIsSaving(true)
    try {
      const offerStack = {
        leadMagnet: {
          type: selectedLeadMagnet,
          details: LEAD_MAGNET_TYPES[selectedLeadMagnet],
          idea: leadMagnetIdea,
          answers: lmAnswers
        },
        bonuses: bonuses,
        totalBonusValue: getTotalBonusValue(),
        guarantee: {
          type: selectedGuarantee,
          details: guaranteeDetails
        },
        scarcity: {
          types: selectedScarcity,
          details: scarcityDetails
        },
        naming: {
          name: offerName,
          tagline: tagline
        }
      }

      // Save to database
      const { error: saveError } = await supabase
        .from('offer_stack_builds')
        .upsert({
          user_id: user.id,
          grand_slam_offer_id: grandSlamData?.id,
          offer_builder_id: offerBuilderData?.id,
          lead_magnet_type: selectedLeadMagnet,
          lead_magnet_idea: leadMagnetIdea,
          bonuses: bonuses,
          guarantee_type: selectedGuarantee,
          guarantee_details: guaranteeDetails,
          scarcity_types: selectedScarcity,
          scarcity_details: scarcityDetails,
          offer_name: offerName,
          tagline: tagline,
          full_stack: offerStack,
          status: 'completed',
          completed_at: new Date().toISOString()
        }, { onConflict: 'user_id' })

      if (saveError) throw saveError

      // Complete quest
      await completeFlowQuest(user.id, 'flow_offer_stack_builder', null, {
        offerName: offerName,
        leadMagnetType: selectedLeadMagnet,
        bonusCount: bonuses.length
      })

      clearProgress()
      setStage(STAGES.SUCCESS)
    } catch (err) {
      console.error('Error saving:', err)
      setError('Failed to save. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  // Loading state
  if (stage === STAGES.LOADING) {
    return (
      <div className="offer-stack-flow flow-base">
        <div className="loading-state">
          <div className="spinner"></div>
        </div>
      </div>
    )
  }

  // Resume prompt
  if (showResumePrompt && savedProgressData) {
    return (
      <div className="offer-stack-flow flow-base">
        <div className="welcome-container">
          <div className="resume-prompt">
            <div className="time-icon">⏱️</div>
            <h2 className="resume-title">Welcome back!</h2>
            <p className="resume-info">You have progress saved from a previous session.</p>
            <div className="resume-actions">
              <button className="primary-button" onClick={handleResumeProgress}>
                Continue Where I Left Off
              </button>
              <button className="secondary-button" onClick={handleStartFresh}>
                Start Fresh
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="offer-stack-flow flow-base">
      {/* Progress indicator */}
      {stage !== STAGES.WELCOME && stage !== STAGES.SUCCESS && stage !== STAGES.BONUSES && (
        <div className="progress-container">
          <BackButton onClick={goBack} />
          <ProgressDots current={getCurrentStep()} total={STAGE_ORDER.length - 1} />
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="error-banner">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* WELCOME */}
      {stage === STAGES.WELCOME && (
        <div className="welcome-container">
          <div className="welcome-content">
            <div className="time-icon">📦</div>
            <h1 className="welcome-greeting">Offer Stack Builder</h1>
            <div className="welcome-message">
              <p>
                Now let's package your offer into something
                <strong> irresistible</strong>.
              </p>
              <p>We'll add:</p>
              <div className="stack-preview">
                <div className="stack-item">🎁 Lead Magnet - Free value upfront</div>
                <div className="stack-item">✨ Bonuses - Extra value that tips the scales</div>
                <div className="stack-item">🛡️ Guarantee - Remove their risk</div>
                <div className="stack-item">⏰ Scarcity - Reason to act now</div>
                <div className="stack-item">📝 Naming - Make it memorable</div>
              </div>
              <p className="time-estimate">⏱️ Takes about 10-15 minutes</p>
            </div>
          </div>
          {!grandSlamData || grandSlamData.status !== 'completed' ? (
            <button className="primary-button" onClick={() => navigate('/offer-builder-v2')}>
              Complete Grand Slam Evaluation First
            </button>
          ) : (
            <button className="primary-button glow-button" onClick={() => setStage(STAGES.LEAD_MAGNET_INTRO)}>
              Build My Offer Stack →
            </button>
          )}
        </div>
      )}

      {/* LEAD MAGNET INTRO */}
      {stage === STAGES.LEAD_MAGNET_INTRO && (
        <div className="question-container">
          <div className="section-header">
            <span className="section-icon">🎁</span>
            <h2>Lead Magnet</h2>
          </div>
          <div className="intro-content">
            <p className="intro-main">A lead magnet is a <strong>complete solution to a narrow problem</strong>.</p>
            <p className="intro-sub">It's the free thing you give away before your paid thing so you get more people to buy.</p>

            <div className="lm-types-preview">
              {Object.entries(LEAD_MAGNET_TYPES).map(([typeId, type]) => (
                <div key={typeId} className="lm-preview-card">
                  <span className="preview-icon">{type.icon}</span>
                  <div className="preview-content">
                    <h4>{type.name}</h4>
                    <p>{type.shortDesc}</p>
                  </div>
                </div>
              ))}
            </div>

            <p className="intro-next">I'll ask 3 questions to recommend the best type for your audience.</p>
          </div>
          <button className="primary-button" onClick={() => setStage(STAGES.LEAD_MAGNET_QUESTIONS)}>
            Start Questions →
          </button>
          <button className="go-back-link" onClick={goBack}>
            ← Go Back
          </button>
        </div>
      )}

      {/* LEAD MAGNET QUESTIONS */}
      {stage === STAGES.LEAD_MAGNET_QUESTIONS && (
        <div className="question-container">
          <div className="question-header">
            <span className="question-number">Question {lmQuestionIndex + 1} of {LM_QUESTIONS.length}</span>
            <h2 className="question-text">{LM_QUESTIONS[lmQuestionIndex].question}</h2>
          </div>

          <div className="options-list">
            {LM_QUESTIONS[lmQuestionIndex].options.map((option) => (
              <button
                key={option.value}
                className={`option-card ${lmAnswers[LM_QUESTIONS[lmQuestionIndex].id] === option.value ? 'selected' : ''}`}
                onClick={() => handleLmAnswer(option)}
              >
                <div className="option-label">{option.label}</div>
                <div className="option-description">{option.description}</div>
              </button>
            ))}
          </div>

          {lmQuestionIndex > 0 ? (
            <button className="go-back-link" onClick={() => setLmQuestionIndex(prev => prev - 1)}>
              ← Previous Question
            </button>
          ) : (
            <button className="go-back-link" onClick={goBack}>
              ← Go Back
            </button>
          )}
        </div>
      )}

      {/* LEAD MAGNET SELECT */}
      {stage === STAGES.LEAD_MAGNET_SELECT && (
        <div className="question-container">
          <div className="section-header">
            <span className="section-icon">🎁</span>
            <h2>Your Lead Magnet Type</h2>
          </div>

          <div className="lm-type-options">
            {Object.entries(LEAD_MAGNET_TYPES).map(([typeId, type]) => (
              <button
                key={typeId}
                className={`lm-type-option ${selectedLeadMagnet === typeId ? 'selected' : ''} ${typeId === getLeadMagnetRecommendation() ? 'recommended' : ''}`}
                onClick={() => setSelectedLeadMagnet(typeId)}
              >
                <span className="lm-opt-icon">{type.icon}</span>
                <div className="lm-opt-content">
                  <span className="lm-opt-name">{type.name}</span>
                  <span className="lm-opt-examples">{type.shortDesc}</span>
                </div>
                {typeId === getLeadMagnetRecommendation() && (
                  <span className="rec-badge">Recommended</span>
                )}
              </button>
            ))}
          </div>

          {selectedLeadMagnet && (
            <div className="lm-idea-input">
              <label>Describe your lead magnet idea:</label>
              <textarea
                value={leadMagnetIdea}
                onChange={(e) => setLeadMagnetIdea(e.target.value)}
                placeholder={`e.g., "${LEAD_MAGNET_TYPES[selectedLeadMagnet]?.examples[0]}" that helps them...`}
                rows={3}
              />
            </div>
          )}

          <button
            className="primary-button"
            onClick={goNext}
            disabled={!selectedLeadMagnet}
          >
            Continue to Bonuses →
          </button>
          <button className="go-back-link" onClick={goBack}>
            ← Go Back
          </button>
        </div>
      )}

      {/* BONUSES INTRO */}
      {stage === STAGES.BONUSES_INTRO && (
        <div className="explainer-container">
          <div className="explainer-content">
            <div className="explainer-icon">✨</div>
            <h2>The Power of Bonuses</h2>

            <div className="explainer-card">
              <div className="card-header">
                <span className="card-icon">🎯</span>
                <h3>What Are Bonuses?</h3>
              </div>
              <p>
                Bonuses are <strong>extra value</strong> you add to your offer that make saying "yes" a no-brainer.
                They address specific concerns and increase the perceived value of your offer.
              </p>
            </div>

            <div className="explainer-card">
              <div className="card-header">
                <span className="card-icon">💡</span>
                <h3>Why Bonuses Work</h3>
              </div>
              <ul className="explainer-list">
                <li><strong>Remove objections</strong> - Address "what if it doesn't work for me?"</li>
                <li><strong>Increase value</strong> - Make your offer feel worth 10x the price</li>
                <li><strong>Speed up results</strong> - Help them get faster wins</li>
                <li><strong>Reduce effort</strong> - Make it easier to succeed</li>
              </ul>
            </div>

            <div className="explainer-card highlight">
              <div className="card-header">
                <span className="card-icon">🏆</span>
                <h3>The Best Bonuses...</h3>
              </div>
              <ul className="explainer-list">
                <li>Solve a <strong>related problem</strong> they'll face</li>
                <li>Are things they'd <strong>pay for separately</strong></li>
                <li>Have a <strong>clear perceived value</strong></li>
                <li>Make your core offer <strong>work better</strong></li>
              </ul>
            </div>

            <div className="explainer-tip">
              <span className="tip-icon">💰</span>
              <p>
                <strong>Pro Tip:</strong> The total perceived value of your bonuses should be
                <strong> 2-3x the price</strong> of your core offer.
              </p>
            </div>
          </div>

          <button className="primary-button" onClick={goNext}>
            Choose My Bonuses →
          </button>
          <button className="go-back-link" onClick={goBack}>
            ← Go Back
          </button>
        </div>
      )}

      {/* BONUSES */}
      {stage === STAGES.BONUSES && (
        <div className="question-container">
          <div className="section-header">
            <span className="section-icon">✨</span>
            <h2>Stack Your Bonuses</h2>
          </div>
          <p className="question-subtext">
            Bonuses increase the perceived value. Select from your Product Builder solutions or add your own.
          </p>

          {/* Product Builder Solutions */}
          {offerBuilderData?.responses?.q8_solutions?.solutions?.length > 0 && (
            <div className="product-builder-solutions">
              <p className="solutions-header">📦 Your Product Builder Solutions:</p>
              <div className="solutions-list">
                {offerBuilderData.responses.q8_solutions.solutions.map((sol, index) => {
                  const solutionId = `pb_solution_${index}`
                  const isSelected = bonuses.some(b => b.id === solutionId)
                  const chosenProductId = grandSlamData?.chosen_product_id
                  const isMainProduct = chosenProductId === `solution_${index}`

                  // Skip if this is the main product (shouldn't be a bonus)
                  if (isMainProduct) return null

                  return (
                    <button
                      key={solutionId}
                      type="button"
                      className={`solution-option ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        if (isSelected) {
                          removeBonus(solutionId)
                        } else if (bonuses.length < 5) {
                          setBonuses(prev => [...prev, {
                            id: solutionId,
                            name: sol.description?.substring(0, 50) || `Solution ${index + 1}`,
                            value: '',
                            fromProductBuilder: true,
                            solutionType: sol.solutionType,
                            problemText: sol.problemText
                          }])
                        }
                      }}
                      disabled={!isSelected && bonuses.length >= 5}
                    >
                      <span className={`solution-checkbox ${isSelected ? 'checked' : ''}`}>
                        {isSelected && <span className="checkmark">✓</span>}
                      </span>
                      <div className="solution-content">
                        <span className="solution-name">{sol.description?.substring(0, 50) || `Solution ${index + 1}`}</span>
                        {sol.solutionType && (
                          <span className="solution-type">
                            {sol.solutionType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
                          </span>
                        )}
                        {sol.problemText && (
                          <span className="solution-problem">Solves: {sol.problemText.substring(0, 40)}...</span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Custom Bonus Input */}
          <div className="custom-bonus-section">
            <p className="custom-header">➕ Add Custom Bonus:</p>
            <div className="bonus-input-row">
              <input
                type="text"
                placeholder="Bonus name (e.g., Quick-Start Guide)"
                value={newBonus.name}
                onChange={(e) => setNewBonus(prev => ({ ...prev, name: e.target.value }))}
              />
              <input
                type="text"
                placeholder="Value ($)"
                value={newBonus.value}
                onChange={(e) => setNewBonus(prev => ({ ...prev, value: e.target.value.replace(/[^0-9]/g, '') }))}
                style={{ width: '100px' }}
              />
              <button
                type="button"
                onClick={addBonus}
                disabled={!newBonus.name.trim() || bonuses.length >= 5}
                className="add-btn"
              >
                + Add
              </button>
            </div>
          </div>

          {/* Selected Bonuses List */}
          <div className="selected-bonuses">
            <p className="selected-header">✅ Selected Bonuses ({bonuses.length}/5):</p>
            <div className="bonuses-list">
              {bonuses.length === 0 ? (
                <p className="empty-state">No bonuses selected yet</p>
              ) : (
                bonuses.map((bonus) => (
                  <div key={bonus.id} className={`bonus-item ${bonus.fromProductBuilder ? 'from-pb' : ''}`}>
                    <span className="bonus-name">{bonus.name}</span>
                    {bonus.fromProductBuilder && <span className="pb-badge">From Product Builder</span>}
                    <div className="bonus-value-input">
                      <span className="dollar-sign">$</span>
                      <input
                        type="text"
                        placeholder="Value"
                        value={bonus.value || ''}
                        onChange={(e) => updateBonusValue(bonus.id, e.target.value)}
                      />
                    </div>
                    <button type="button" className="remove-bonus-btn" onClick={() => removeBonus(bonus.id)}>×</button>
                  </div>
                ))
              )}
            </div>
          </div>

          {bonuses.length > 0 && getTotalBonusValue() > 0 && (
            <div className="bonus-total">
              Total Bonus Value: <strong>${getTotalBonusValue()}</strong>
            </div>
          )}

          <button className="primary-button" onClick={goNext}>
            Continue to Guarantee →
          </button>
          <button className="go-back-link" onClick={goBack}>
            ← Go Back
          </button>
        </div>
      )}

      {/* GUARANTEE */}
      {stage === STAGES.GUARANTEE && (
        <div className="question-container">
          <div className="section-header">
            <span className="section-icon">🛡️</span>
            <h2>Risk Reversal</h2>
          </div>
          <p className="question-subtext">
            A strong guarantee removes their fear. What risk can you take on?
          </p>

          <div className="guarantee-options">
            {GUARANTEE_TYPES.map((guarantee) => (
              <button
                key={guarantee.id}
                className={`guarantee-option ${selectedGuarantee === guarantee.id ? 'selected' : ''}`}
                onClick={() => setSelectedGuarantee(guarantee.id)}
              >
                <span className="guarantee-icon">{guarantee.icon}</span>
                <div className="guarantee-content">
                  <span className="guarantee-name">{guarantee.name}</span>
                  <span className="guarantee-desc">{guarantee.description}</span>
                  <span className="guarantee-example">"{guarantee.example}"</span>
                </div>
              </button>
            ))}
          </div>

          {selectedGuarantee && (
            <div className="guarantee-details-input">
              <label>Customize your guarantee:</label>
              <textarea
                value={guaranteeDetails}
                onChange={(e) => setGuaranteeDetails(e.target.value)}
                placeholder="Describe the specifics of your guarantee..."
                rows={2}
              />
            </div>
          )}

          <button
            className="primary-button"
            onClick={goNext}
            disabled={!selectedGuarantee}
          >
            Continue to Scarcity →
          </button>
          <button className="go-back-link" onClick={goBack}>
            ← Go Back
          </button>
        </div>
      )}

      {/* SCARCITY */}
      {stage === STAGES.SCARCITY && (
        <div className="question-container">
          <div className="section-header">
            <span className="section-icon">⏰</span>
            <h2>Urgency & Scarcity</h2>
          </div>
          <p className="question-subtext">
            Give them a reason to act NOW. Select all that apply.
          </p>

          <div className="scarcity-options">
            {SCARCITY_TYPES.map((scarcity) => (
              <button
                key={scarcity.id}
                className={`scarcity-option ${selectedScarcity.includes(scarcity.id) ? 'selected' : ''}`}
                onClick={() => toggleScarcity(scarcity.id)}
              >
                <span className="scarcity-checkbox">
                  {selectedScarcity.includes(scarcity.id) ? '☑️' : '☐'}
                </span>
                <span className="scarcity-icon">{scarcity.icon}</span>
                <div className="scarcity-content">
                  <span className="scarcity-name">{scarcity.name}</span>
                  <span className="scarcity-desc">{scarcity.description}</span>
                </div>
              </button>
            ))}
          </div>

          {selectedScarcity.length > 0 && (
            <div className="scarcity-details-input">
              <label>Describe your scarcity/urgency:</label>
              <textarea
                value={scarcityDetails.custom || ''}
                onChange={(e) => setScarcityDetails(prev => ({ ...prev, custom: e.target.value }))}
                placeholder="e.g., Only available until Friday, limited to first 20 buyers..."
                rows={2}
              />
            </div>
          )}

          <div className="selection-status">
            {selectedScarcity.length} scarcity element(s) selected
          </div>

          <button className="primary-button" onClick={goNext}>
            Continue to Naming →
          </button>
          <button className="go-back-link" onClick={goBack}>
            ← Go Back
          </button>
        </div>
      )}

      {/* NAMING */}
      {stage === STAGES.NAMING && (
        <div className="question-container">
          <div className="section-header">
            <span className="section-icon">📝</span>
            <h2>Name Your Offer</h2>
          </div>
          <p className="question-subtext">
            A great name is memorable and communicates the outcome.
          </p>

          <div className="naming-inputs">
            <div className="input-group">
              <label>Offer Name:</label>
              <input
                type="text"
                value={offerName}
                onChange={(e) => setOfferName(e.target.value)}
                placeholder="e.g., The 90-Day Launch System"
              />
            </div>

            <div className="input-group">
              <label>Tagline (optional):</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g., From idea to income in 90 days"
              />
            </div>
          </div>

          <div className="naming-tips">
            <p className="tips-header">💡 Naming formulas:</p>
            <div className="tip-examples">
              <div className="tip-example">"The [Timeframe] [Outcome] System"</div>
              <div className="tip-example">"[Number] Steps to [Desired Result]"</div>
              <div className="tip-example">"The [Unique Method] Method"</div>
              <div className="tip-example">"[Outcome] Accelerator/Blueprint"</div>
            </div>
          </div>

          <button
            className="primary-button"
            onClick={goNext}
            disabled={!offerName.trim()}
          >
            See My Complete Offer Stack →
          </button>
          <button className="go-back-link" onClick={goBack}>
            ← Go Back
          </button>
        </div>
      )}

      {/* SUMMARY */}
      {stage === STAGES.SUMMARY && (
        <div className="summary-container">
          <div className="summary-header">
            <h2>Your Complete Offer Stack</h2>
          </div>

          <div className="offer-stack-display">
            {/* Offer Name */}
            <div className="stack-section offer-name-section">
              <h3 className="offer-display-name">{offerName}</h3>
              {tagline && <p className="offer-tagline">{tagline}</p>}
            </div>

            {/* Lead Magnet */}
            <div className="stack-section">
              <div className="section-label">
                <span className="label-icon">🎁</span>
                <span>Lead Magnet</span>
              </div>
              <div className="section-content">
                <strong>{LEAD_MAGNET_TYPES[selectedLeadMagnet]?.name}</strong>
                {leadMagnetIdea && <p>{leadMagnetIdea}</p>}
              </div>
            </div>

            {/* Bonuses */}
            {bonuses.length > 0 && (
              <div className="stack-section">
                <div className="section-label">
                  <span className="label-icon">✨</span>
                  <span>Bonuses (${getTotalBonusValue()} value)</span>
                </div>
                <div className="section-content bonuses-display">
                  {bonuses.map((bonus, i) => (
                    <div key={i} className="bonus-display-item">
                      <span>+ {bonus.name}</span>
                      {bonus.value && <span className="bonus-val">${bonus.value}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Guarantee */}
            <div className="stack-section">
              <div className="section-label">
                <span className="label-icon">🛡️</span>
                <span>Guarantee</span>
              </div>
              <div className="section-content">
                <strong>{GUARANTEE_TYPES.find(g => g.id === selectedGuarantee)?.name}</strong>
                {guaranteeDetails && <p>{guaranteeDetails}</p>}
              </div>
            </div>

            {/* Scarcity */}
            {selectedScarcity.length > 0 && (
              <div className="stack-section">
                <div className="section-label">
                  <span className="label-icon">⏰</span>
                  <span>Urgency/Scarcity</span>
                </div>
                <div className="section-content">
                  <div className="scarcity-tags">
                    {selectedScarcity.map(id => {
                      const scarcity = SCARCITY_TYPES.find(s => s.id === id)
                      return (
                        <span key={id} className="scarcity-tag">
                          {scarcity?.icon} {scarcity?.name}
                        </span>
                      )
                    })}
                  </div>
                  {scarcityDetails.custom && <p>{scarcityDetails.custom}</p>}
                </div>
              </div>
            )}
          </div>

          <button
            className="primary-button"
            onClick={handleComplete}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Complete & Save Offer Stack →'}
          </button>
          <button className="go-back-link" onClick={goBack}>
            ← Go Back
          </button>
        </div>
      )}

      {/* SUCCESS */}
      {stage === STAGES.SUCCESS && (
        <div className="success-container">
          <div className="success-icon">✓</div>
          <h2>Offer Stack Complete!</h2>
          <p className="success-offer-name">"{offerName}"</p>
          <p className="success-message">
            Your offer is now packaged and ready to present to the world.
          </p>
          <div className="success-stats">
            <div className="stat">
              <span className="stat-icon">🎁</span>
              <span>{LEAD_MAGNET_TYPES[selectedLeadMagnet]?.name}</span>
            </div>
            <div className="stat">
              <span className="stat-icon">✨</span>
              <span>{bonuses.length} Bonuses (${getTotalBonusValue()} value)</span>
            </div>
            <div className="stat">
              <span className="stat-icon">🛡️</span>
              <span>{GUARANTEE_TYPES.find(g => g.id === selectedGuarantee)?.name}</span>
            </div>
          </div>
          <button
            className="primary-button"
            onClick={() => navigate('/7-day-challenge')}
          >
            Back to Challenge
          </button>
        </div>
      )}
    </div>
  )
}

export default OfferStackBuilderFlow
