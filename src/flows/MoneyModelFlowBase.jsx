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
import { showErrorWithSupport } from '../lib/errorSupport'
import { completeFlowQuest } from '../lib/questCompletion'
import { BackButton, ProgressDots, ChecklistDisplay } from '../components/MoneyModelShared'
import { STAGES } from './moneyModelConfigs'
import { useAutoSave } from '../hooks/useAutoSave'
import { useProjectId } from '../hooks/useProjectId'
import { trackFlowCompletion } from '../lib/flowTracking'
import { FlowFeedback } from '../components/FlowFeedback'
import { cacheBustUrl } from '../lib/fetchJson'
import '../styles/flow-base.css'

// Visibility layers for 2D pattern recognition (WHERE the resistance shows up)
const VISIBILITY_LAYERS = [
  { id: 'screen', icon: '📱', label: 'Screen', description: 'Putting myself out there where people can see and judge me' },
  { id: 'live', icon: '⚡', label: 'Live', description: 'Doing something in real-time where I can\'t edit or take it back' },
  { id: 'vulnerable', icon: '💗', label: 'Vulnerable', description: 'Showing something unfinished or admitting I need help' },
  { id: 'money', icon: '💰', label: 'Money', description: 'Asking someone to pay me or stating my price' },
  { id: 'authority', icon: '👑', label: 'Authority', description: 'Claiming expertise or positioning myself as someone to follow' }
]

// Protective voices for 2D pattern recognition (HOW the resistance sounds)
const PROTECTIVE_VOICES = [
  { id: 'perfectionist', icon: '🎭', label: 'Perfectionist', description: 'It needs to be perfect before I can share it' },
  { id: 'people_pleaser', icon: '🤝', label: 'People Pleaser', description: 'I don\'t want to bother or burden anyone' },
  { id: 'controller', icon: '🎛️', label: 'Controller', description: 'I can\'t control how they\'ll respond' },
  { id: 'performer', icon: '🎪', label: 'Performer', description: 'I need to have more figured out first' },
  { id: 'ghost', icon: '👻', label: 'Ghost', description: 'I\'d rather stay quiet than risk rejection' }
]

// Contextual essence messages based on voice + layer + action context
const getEssenceMessage = (voice, layer, actionType) => {
  const messages = {
    // Perfectionist patterns
    'perfectionist_screen': 'Your Perfectionist wants the offer to be flawless before sharing. But real feedback from real people shapes better offers than endless polishing.',
    'perfectionist_live': 'Your Perfectionist fears making mistakes in real-time. But offers evolve through iteration, not isolation.',
    'perfectionist_vulnerable': 'Your Perfectionist doesn\'t want to show unfinished work. But testing ideas early prevents building the wrong thing.',
    'perfectionist_money': 'Your Perfectionist wants the pricing to be perfect. But the market tells you the right price — your guess can\'t.',
    'perfectionist_authority': 'Your Perfectionist wants more credentials first. But you already know enough to create value.',
    // People Pleaser patterns
    'people_pleaser_screen': 'Your People Pleaser worries about being "salesy." But your offer helps people — sharing it is generous.',
    'people_pleaser_live': 'Your People Pleaser fears disappointing someone. But authentic offers attract the right people.',
    'people_pleaser_vulnerable': 'Your People Pleaser doesn\'t want to impose. But most people appreciate being asked what they need.',
    'people_pleaser_money': 'Your People Pleaser feels uncomfortable asking for money. But fair exchange benefits everyone.',
    'people_pleaser_authority': 'Your People Pleaser worries about seeming arrogant. But sharing expertise is service, not ego.',
    // Controller patterns
    'controller_screen': 'Your Controller can\'t predict the response. But the unknown holds opportunity, not just risk.',
    'controller_live': 'Your Controller wants to script every outcome. But the best insights come from unscripted moments.',
    'controller_vulnerable': 'Your Controller wants certainty first. But action creates the certainty you\'re seeking.',
    'controller_money': 'Your Controller fears rejection. But every "no" brings you closer to the right "yes."',
    'controller_authority': 'Your Controller wants guaranteed results. But real authority is built through taking action.',
    // Performer patterns
    'performer_screen': 'Your Performer wants a bigger following first. But every audience starts with one person.',
    'performer_live': 'Your Performer wants to prove expertise first. But doing the work IS how you build expertise.',
    'performer_vulnerable': 'Your Performer feels unqualified. But action builds the confidence you\'re waiting for.',
    'performer_money': 'Your Performer wants more success stories first. But you have to start somewhere.',
    'performer_authority': 'Your Performer needs more validation. But the validation comes from taking action.',
    // Ghost patterns
    'ghost_screen': 'Your Ghost wants to stay invisible. But your offer deserves to be seen — and so do you.',
    'ghost_live': 'Your Ghost prefers the safety of silence. But your voice matters, even in small conversations.',
    'ghost_vulnerable': 'Your Ghost says it\'s safer to stay hidden. But connection is what you\'re actually seeking.',
    'ghost_money': 'Your Ghost avoids attention. But asking for fair exchange is claiming your worth.',
    'ghost_authority': 'Your Ghost shrinks from the spotlight. But quiet authority is still authority.'
  }

  const key = `${voice}_${layer}`
  return messages[key] || 'Your protective pattern is trying to keep you safe. But you don\'t need protection from creating value.'
}

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
  const { projectId } = useProjectId()

  // Core state - start with TIME_CHECK before welcome
  const [stage, setStage] = useState(STAGES.TIME_CHECK)
  const [questionsData, setQuestionsData] = useState(null)
  const [offersData, setOffersData] = useState(null)
  const [answers, setAnswers] = useState({})
  const [recommendedOffer, setRecommendedOffer] = useState(null)
  const [allOfferScores, setAllOfferScores] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showAllOptions, setShowAllOptions] = useState(false)
  const [viewingResults, setViewingResults] = useState(false)

  // Auto-save state
  const [showResumePrompt, setShowResumePrompt] = useState(false)
  const [savedProgressData, setSavedProgressData] = useState(null)
  const { saveProgress, loadProgress, clearProgress } = useAutoSave(config.flowType, user?.id)

  // PRE-ACTION state
  const [preActionFeeling, setPreActionFeeling] = useState(null)
  const [visibilityLayer, setVisibilityLayer] = useState(null)
  const [protectiveVoice, setProtectiveVoice] = useState(null)
  const [preActionStep, setPreActionStep] = useState('feeling') // feeling | layer | voice | essence

  // Check if this flow has PRE-ACTION configured
  const hasPreAction = !!config.preActionConfig

  // PRE-ACTION handlers (shown AFTER save, before navigating away)
  const handleFeelingSelect = (feeling) => {
    setPreActionFeeling(feeling)
    if (feeling === 'excited' || feeling === 'ready') {
      // Skip 2D capture for positive feelings, go straight to success
      setStage(STAGES.SUCCESS)
    } else {
      // Show 2D capture for resistant feelings
      setPreActionStep('layer')
    }
  }

  const handleLayerSelect = (layer) => {
    setVisibilityLayer(layer)
    setPreActionStep('voice')
  }

  const handleVoiceSelect = (voice) => {
    setProtectiveVoice(voice)
    setPreActionStep('essence')

    // Save PRE-ACTION data to database
    if (user && config.preActionConfig) {
      supabase.from('pre_action_captures').insert({
        user_id: user.id,
        action_type: config.preActionConfig.actionType,
        flow_type: config.flowType,
        feeling: preActionFeeling,
        visibility_layer: visibilityLayer,
        protective_voice: voice
      }).then(({ error }) => {
        if (error) console.warn('PRE-ACTION save failed:', error)
      })
    }
  }

  const handleEssenceComplete = () => {
    setStage(STAGES.SUCCESS)
  }

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
          fetch(cacheBustUrl(config.questionsPath)),
          fetch(cacheBustUrl(config.offersPath))
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

  // Check for saved progress on mount (auto-save)
  useEffect(() => {
    if (user) {
      const saved = loadProgress()
      if (saved && saved.stage && saved.stage !== STAGES.TIME_CHECK && saved.stage !== STAGES.SUCCESS) {
        setSavedProgressData(saved)
        setShowResumePrompt(true)
      }
    }
  }, [user, loadProgress])

  // Note: Removed auto-register useEffect that was causing duplicate quest completions
  // Quest completion now only happens once when flow is completed via handleSave

  // Auto-save progress on state changes
  useEffect(() => {
    if (!user || stage === STAGES.TIME_CHECK || stage === STAGES.SUCCESS || stage === STAGES.CALCULATING) return
    const progressData = { stage, answers }
    saveProgress(progressData)
  }, [stage, answers, user, saveProgress])

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

  // Handle resuming saved progress (auto-save)
  const handleResumeProgress = () => {
    if (savedProgressData) {
      setStage(savedProgressData.stage)
      setAnswers(savedProgressData.answers || {})
    }
    setShowResumePrompt(false)
    setSavedProgressData(null)
  }

  // Handle starting fresh (auto-save)
  const handleStartFresh = () => {
    clearProgress()
    setShowResumePrompt(false)
    setSavedProgressData(null)
    setStage(STAGES.WELCOME)
  }

  // Handle saving results
  const handleSaveResults = async () => {
    if (isLoading || !user) return

    setIsLoading(true)
    setError(null)

    try {
      const sessionId = crypto.randomUUID()

      // Use configurable column names if provided, otherwise use defaults
      const columns = config.dbColumns || {
        recommendedId: 'recommended_offer_id',
        recommendedName: 'recommended_offer_name',
        allScores: 'all_offer_scores'
      }

      const insertData = {
        session_id: sessionId,
        user_id: user.id,
        user_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        email: user.email,
        responses: answers,
        [columns.recommendedId]: recommendedOffer?.offer?.id,
        [columns.recommendedName]: recommendedOffer?.offer?.name,
        confidence_score: recommendedOffer?.confidence,
        total_score: recommendedOffer?.totalScore,
        [columns.allScores]: allOfferScores.map(s => ({
          id: s.offer.id,
          name: s.offer.name,
          score: s.totalScore,
          confidence: s.confidence,
          disqualified: s.isDisqualified
        }))
      }

      const { error: insertError } = await supabase.from(config.dbTable).insert([insertData])

      if (insertError) {
        console.error('Error saving assessment:', insertError)
        const retry = await showErrorWithSupport({
          error: insertError,
          component: config.flowType || 'MoneyModelFlow',
          action: 'save_assessment',
          userId: user?.id,
          userEmail: user?.email,
          metadata: { flowType: config.flowType, dbTable: config.dbTable },
          title: 'Unable to save your assessment',
          retryLabel: 'Retry',
          canRetry: true
        })
        if (retry) {
          return handleSubmit()
        }
        return
      }

      // Track flow completion
      try {
        await trackFlowCompletion({
          userId: user.id,
          projectId,
          flowType: config.flowType,
          flowVersion: config.flowVersion
        })
      } catch (trackingError) {
        console.warn('Flow tracking failed:', trackingError)
      }

      // Complete challenge quest
      try {
        // Use challengeFlowId (matches JSON flow_id) or fall back to questId for backwards compatibility
        const flowId = config.challengeFlowId || config.questId || (
          typeof config.getQuestId === 'function'
            ? config.getQuestId(user?.user_metadata?.persona)
            : null
        )

        if (flowId) {
          await completeFlowQuest({
            userId: user.id,
            flowId: flowId,
            pointsEarned: config.pointsEarned
          })
        }
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
            project_id: projectId || null,
            milestone_id: config.milestoneId,
            stage: stageProgress?.current_stage ?? 1,
            evidence_text: `Completed ${config.name} flow: ${recommendedOffer?.offer?.name}`
          })
        } catch (milestoneError) {
          console.warn('Milestone creation failed:', milestoneError)
        }
      }

      // Clear auto-saved progress on success
      clearProgress()

      // If flow has PRE-ACTION configured, show it before success
      if (hasPreAction) {
        setPreActionStep('feeling')
        setStage(STAGES.PRE_ACTION)
      } else {
        setStage(STAGES.SUCCESS)

        // Handle auto-navigation (for LeadMagnet)
        if (config.autoNavigateOnSuccess) {
          setTimeout(() => {
            navigate(config.autoNavigatePath)
          }, config.autoNavigateDelay)
        }
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
      <div className={`${config.cssClass} flow-base`}>
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
      <div className={`${config.cssClass} flow-base`}>
        <ProgressDots stageGroups={config.stageGroups} currentStage={stage} />
        <div className="welcome-container">
          <div className="welcome-content">
            <h1 className="welcome-greeting">{config.title}</h1>
            <div className="welcome-message animated-text">
              {welcomeContent}
            </div>
          </div>
          <button className="primary-button" onClick={() => setStage(STAGES.Q1)}>
            Let's Find Your Offer
          </button>
          <button
            className="go-back-link"
            onClick={() => navigate('/7-day-challenge')}
          >
            ← Go Back
          </button>
          <p className="attribution-text">These strategies are based on Alex Hormozi's free 100m money model course. Find more of his epic acquisition content on IG: 'Hormozi', Podcast: 'The Game with Alex Hormozi', Youtube: AlexHormozi and website: Acquisition.com</p>
        </div>
      </div>
    )
  }

  // TIME CHECK STAGE (first screen, before welcome)
  if (stage === STAGES.TIME_CHECK) {
    // Helper to get readable stage name
    const getStageDisplayName = (stageKey) => {
      const stageNames = {
        'welcome': 'Welcome',
        'q1': 'Question 1', 'q2': 'Question 2', 'q3': 'Question 3',
        'q4': 'Question 4', 'q5': 'Question 5', 'q6': 'Question 6',
        'q7': 'Question 7', 'q8': 'Question 8', 'q9': 'Question 9',
        'q10': 'Question 10', 'reveal': 'Results'
      }
      return stageNames[stageKey] || stageKey
    }

    // Helper to get time since last save
    const getTimeSinceSave = () => {
      if (!savedProgressData?.savedAt) return null
      const minutesAgo = Math.floor((Date.now() - savedProgressData.savedAt) / 60000)
      if (minutesAgo < 1) return 'just now'
      if (minutesAgo < 60) return `${minutesAgo} minute${minutesAgo === 1 ? '' : 's'} ago`
      const hoursAgo = Math.floor(minutesAgo / 60)
      return `${hoursAgo} hour${hoursAgo === 1 ? '' : 's'} ago`
    }

    return (
      <div className={`${config.cssClass} flow-base`}>
        <ProgressDots stageGroups={config.stageGroups} currentStage={stage} />
        <div className="welcome-container">
          <h1 className="welcome-greeting">{config.title}</h1>

          {/* Resume Prompt - shown if saved progress exists */}
          {showResumePrompt && savedProgressData && (
            <div className="resume-prompt">
              <p className="resume-title">Welcome back!</p>
              <p className="resume-info">
                You have saved progress at <strong>{getStageDisplayName(savedProgressData.stage)}</strong>
                <br />
                <span className="resume-time">Last saved {getTimeSinceSave()}</span>
              </p>
              <div className="resume-actions">
                <button className="primary-button" onClick={handleResumeProgress}>
                  Continue Where I Left Off
                </button>
                <button className="secondary-button" onClick={handleStartFresh}>
                  Start Fresh
                </button>
              </div>
            </div>
          )}

          {/* Normal time check content - shown if no resume prompt */}
          {!showResumePrompt && (
            <>
              <div className="welcome-message animated-text" style={{ textAlign: 'center' }}>
                <p><span className="time-icon">⏱️</span></p>
                <p><strong>This flow takes about {config.timeEstimate || '3 minutes'}</strong></p>
                <p style={{ color: 'rgba(255,255,255,0.7)' }}>{config.timeCheckMessage || "10 quick questions to find your best strategy."}</p>
                <p>Find a quiet moment where you can think clearly.</p>
              </div>
              <button
                className="primary-button glow-button"
                onClick={() => setStage(STAGES.WELCOME)}
              >
                I've Got Time, Let's Go
              </button>
              <button
                className="secondary-button"
                onClick={() => navigate('/7-day-challenge')}
              >
                Come Back Later
              </button>
            </>
          )}
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
      <div className={`${config.cssClass} flow-base`}>
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
      <div className={`${config.cssClass} flow-base`}>
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
      <div className={`${config.cssClass} flow-base`}>
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

          {/* Implementation Checklist - Tier 1 Sales Tower */}
          <ChecklistDisplay
            flowType={config.flowType}
            offerId={offer.id}
            offerName={offer.name}
          />

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
      <div className={`${config.cssClass} flow-base`}>
        <div className="success-container">
          <div className="success-icon">✓</div>
          <h2>Quest Complete, {userName}!</h2>
          <p style={{ marginBottom: '8px' }}>Your <strong>{recommendedOffer?.offer?.name}</strong> strategy is ready.</p>
          <p style={{ color: '#fbbf24', fontWeight: '600', fontSize: '18px' }}>+{config.pointsEarned} points earned!</p>

          <FlowFeedback
            flowType={config.flowType}
            userId={user?.id}
          />

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

  // PRE_ACTION STAGE - Shown after save, captures resistance before navigating away
  if (stage === STAGES.PRE_ACTION && hasPreAction) {
    return (
      <div className={`${config.cssClass} flow-base`}>
        <ProgressDots stageGroups={config.stageGroups} currentStage={stage} />
        <div className="welcome-container">
          {/* Confirmation Header */}
          <div className="pre-action-header" style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div className="success-icon" style={{ fontSize: '48px', marginBottom: '16px' }}>✓</div>
            <h1 className="welcome-greeting">Your {config.name} Strategy is Ready!</h1>
            <div style={{
              background: 'rgba(233, 162, 59, 0.15)',
              border: '1px solid rgba(233, 162, 59, 0.3)',
              borderRadius: '12px',
              padding: '16px 24px',
              marginTop: '16px',
              display: 'inline-block'
            }}>
              <span style={{ color: '#E9A23B', fontWeight: '600', fontSize: '18px' }}>
                {recommendedOffer?.offer?.name}
              </span>
            </div>
          </div>

          <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.1)', margin: '24px 0' }}></div>

          {/* Feeling Check Step */}
          {preActionStep === 'feeling' && (
            <div className="pre-action-content" style={{ animation: 'fadeIn 0.3s ease' }}>
              {/* Next Step Context */}
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <h2 style={{ fontSize: '20px', marginBottom: '12px', color: 'white' }}>
                  Your Next Step: Create This {config.name}
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.6' }}>
                  {config.preActionConfig?.description || `Now that you have your strategy, it's time to bring it to life and start attracting your ideal customers.`}
                </p>
              </div>

              <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.1)', margin: '24px 0' }}></div>

              {/* Feeling Question */}
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ fontSize: '18px', marginBottom: '20px', color: 'white' }}>
                  {config.preActionConfig?.question || 'How do you feel about creating this offer?'}
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '12px',
                  maxWidth: '400px',
                  margin: '0 auto'
                }}>
                  <button
                    className="option-btn"
                    onClick={() => handleFeelingSelect('excited')}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      padding: '16px',
                      gap: '8px'
                    }}
                  >
                    <span style={{ fontSize: '24px' }}>🚀</span>
                    <span>Excited</span>
                  </button>
                  <button
                    className="option-btn"
                    onClick={() => handleFeelingSelect('ready')}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      padding: '16px',
                      gap: '8px'
                    }}
                  >
                    <span style={{ fontSize: '24px' }}>😌</span>
                    <span>Ready</span>
                  </button>
                  <button
                    className="option-btn"
                    onClick={() => handleFeelingSelect('nervous')}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      padding: '16px',
                      gap: '8px'
                    }}
                  >
                    <span style={{ fontSize: '24px' }}>🤔</span>
                    <span>Nervous</span>
                  </button>
                  <button
                    className="option-btn"
                    onClick={() => handleFeelingSelect('resistant')}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      padding: '16px',
                      gap: '8px'
                    }}
                  >
                    <span style={{ fontSize: '24px' }}>😬</span>
                    <span>Resistant</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Visibility Layer Selection (WHERE does resistance show up) */}
          {preActionStep === 'layer' && (
            <div className="pre-action-content" style={{ animation: 'fadeIn 0.3s ease' }}>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '20px', marginBottom: '8px', color: 'white' }}>
                  Where does this resistance show up?
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>
                  What type of action triggers this feeling?
                </p>
              </div>
              <div className="options-list" style={{ maxWidth: '500px', margin: '0 auto' }}>
                {VISIBILITY_LAYERS.map(layer => (
                  <button
                    key={layer.id}
                    className="option-card"
                    onClick={() => handleLayerSelect(layer.id)}
                    style={{ textAlign: 'left' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '24px' }}>{layer.icon}</span>
                      <div>
                        <div className="option-label">{layer.label}</div>
                        <div className="option-description" style={{ fontSize: '13px', opacity: 0.7 }}>
                          {layer.description}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Protective Voice Selection (HOW does resistance sound) */}
          {preActionStep === 'voice' && (
            <div className="pre-action-content" style={{ animation: 'fadeIn 0.3s ease' }}>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '20px', marginBottom: '8px', color: 'white' }}>
                  Which voice is speaking?
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>
                  What does the resistance sound like?
                </p>
              </div>
              <div className="options-list" style={{ maxWidth: '500px', margin: '0 auto' }}>
                {PROTECTIVE_VOICES.map(voice => (
                  <button
                    key={voice.id}
                    className="option-card"
                    onClick={() => handleVoiceSelect(voice.id)}
                    style={{ textAlign: 'left' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '24px' }}>{voice.icon}</span>
                      <div>
                        <div className="option-label">{voice.label}</div>
                        <div className="option-description" style={{ fontSize: '13px', opacity: 0.7, fontStyle: 'italic' }}>
                          "{voice.description}"
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Essence Message - Final step before success */}
          {preActionStep === 'essence' && (
            <div className="pre-action-content" style={{ animation: 'fadeIn 0.3s ease', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>💫</div>
              <h3 style={{ fontSize: '22px', marginBottom: '20px', color: 'white' }}>
                Your essence knows you can do this.
              </h3>

              {/* Pattern Display */}
              <div style={{
                background: 'rgba(94, 23, 235, 0.2)',
                border: '1px solid rgba(94, 23, 235, 0.3)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '24px'
              }}>
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', display: 'block', marginBottom: '8px' }}>
                  You noticed:
                </span>
                <span style={{ color: 'white', fontWeight: '500' }}>
                  {PROTECTIVE_VOICES.find(v => v.id === protectiveVoice)?.icon}{' '}
                  {PROTECTIVE_VOICES.find(v => v.id === protectiveVoice)?.label}
                  {' × '}
                  {VISIBILITY_LAYERS.find(l => l.id === visibilityLayer)?.icon}{' '}
                  {VISIBILITY_LAYERS.find(l => l.id === visibilityLayer)?.label}
                </span>
              </div>

              {/* Essence Message */}
              <p style={{
                color: 'rgba(255,255,255,0.85)',
                lineHeight: '1.7',
                fontSize: '16px',
                maxWidth: '450px',
                margin: '0 auto 32px'
              }}>
                {getEssenceMessage(protectiveVoice, visibilityLayer, config.preActionConfig?.actionType)}
              </p>

              <button
                className="primary-button"
                onClick={handleEssenceComplete}
                style={{
                  background: 'linear-gradient(135deg, #E9A23B 0%, #f0b956 100%)',
                  color: '#1a1a2e'
                }}
              >
                Continue to Complete →
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return null
}

export default MoneyModelFlowBase
