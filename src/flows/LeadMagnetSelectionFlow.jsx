/**
 * LeadMagnetSelectionFlow - Lead Magnet Selection (+30 pts)
 *
 * Helps users choose ONE lead magnet type for their entire offer.
 *
 * Flow:
 * 1. Welcome - Explain we're choosing ONE lead magnet
 * 2. Questions - 3 questions about their target customer
 * 3. Recommendation - Show recommended type, let them choose
 * 4. Success - Confirmation
 *
 * Lead Magnet Types:
 * - Reveal the Problem (quiz, assessment, calculator)
 * - Free Trial (free session, sample, demo)
 * - Free Step 1 (template, guide, mini-course)
 */

import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import { completeFlowQuest } from '../lib/questCompletion'
import { BackButton, ProgressDots } from '../components/MoneyModelShared'
import './LeadMagnetSelectionFlow.css'

const STAGES = {
  LOADING: 'loading',
  WELCOME: 'welcome',
  EDUCATION_1: 'education_1',
  EDUCATION_2: 'education_2',
  EDUCATION_3: 'education_3',
  QUESTIONS: 'questions',
  RECOMMENDATION: 'recommendation',
  SUCCESS: 'success'
}

const STAGE_GROUPS = [
  { id: 'welcome', label: 'Welcome', stages: [STAGES.WELCOME] },
  { id: 'learn', label: 'Learn', stages: [STAGES.EDUCATION_1, STAGES.EDUCATION_2, STAGES.EDUCATION_3] },
  { id: 'questions', label: 'Questions', stages: [STAGES.QUESTIONS] },
  { id: 'select', label: 'Select', stages: [STAGES.RECOMMENDATION] },
  { id: 'complete', label: 'Complete', stages: [STAGES.SUCCESS] }
]

// Education slides content
const EDUCATION_SLIDES = [
  {
    stage: 'education_1',
    title: 'What\'s a Lead Magnet?',
    icon: '🎁',
    mainText: 'A lead magnet is a complete solution to a narrow problem.',
    subText: 'It\'s the free thing you give away before your paid thing so you get more people to buy.',
    visual: 'gift', // For potential future illustration
    highlight: 'Think of it as "The Perfect Gift" for your future customers.'
  },
  {
    stage: 'education_2',
    title: 'Why Use a Lead Magnet?',
    icon: '📈',
    funnelSteps: [
      { label: 'Many People', sublabel: 'Low Trust', icon: '👥' },
      { label: 'Lead Magnet', sublabel: 'FREE "Mini Offer"', icon: '🎁' },
      { label: 'Fewer People', sublabel: 'High Trust', icon: '🤝' },
      { label: 'Core Offer', sublabel: 'Paid', icon: '💰' },
      { label: 'Sales', sublabel: 'Customers', icon: '✅' }
    ],
    highlight: 'A lead magnet builds trust BEFORE you ask for the sale.'
  },
  {
    stage: 'education_3',
    title: 'The Perfect Lead Magnet',
    icon: '✨',
    formula: [
      'Complete solution to a narrow problem',
      '+',
      'Reveals the next problem your core offer solves'
    ],
    highlight: 'Next, I\'ll ask 3 questions to recommend the best type for YOUR audience.'
  }
]

// Lead Magnet types with detailed info
const LEAD_MAGNET_TYPES = {
  reveal_problem: {
    name: 'Reveal the Problem',
    icon: '🔍',
    shortDesc: 'Quiz, assessment, calculator, audit',
    description: 'Help them realize they have a problem they didn\'t know about',
    whyItWorks: 'Your prospects don\'t yet know they have a problem. By creating a diagnostic tool, you help them discover their pain points - and position yourself as the expert who can solve them.',
    whenToUse: [
      'Prospects are unaware they have a problem',
      'They\'re confused about their situation',
      'They need personalized insights to take action'
    ],
    actionSteps: [
      'Create 5-10 diagnostic questions',
      'Build a scoring system that reveals their problem',
      'Show personalized results with your solution'
    ],
    examples: [
      '"Are You Ready?" Assessment - reveals gaps in their approach',
      'Free Audit - review their situation and identify blind spots',
      'Scorecard - rate themselves on key areas',
      'Calculator - quantify their problem (cost, time, impact)'
    ]
  },
  free_trial: {
    name: 'Free Trial',
    icon: '🎁',
    shortDesc: 'Free session, sample, demo access',
    description: 'Let them experience your solution before buying',
    whyItWorks: 'When prospects are skeptical, the best way to convince them is to let them try. A free trial removes risk and builds trust through direct experience.',
    whenToUse: [
      'They\'re comparing options',
      'They\'re skeptical if it will work for them',
      'They need proof before committing',
      'They\'re ready to buy but need final validation'
    ],
    actionSteps: [
      'Define what "free" looks like (time-limited, feature-limited, etc.)',
      'Create an onboarding sequence that delivers a quick win',
      'Build in a natural upgrade path'
    ],
    examples: [
      'Free Strategy Session - give them a real taste of working with you',
      'Sample Chapter/Module - preview your course content',
      'Demo Access - let them use a limited version',
      'Trial Period - full access for limited time'
    ]
  },
  free_step_1: {
    name: 'Free Step 1',
    icon: '📋',
    shortDesc: 'Template, guide, checklist, mini-course',
    description: 'Give them the first step of your process for free',
    whyItWorks: 'When prospects are overwhelmed, they need someone to simplify. Give them Step 1 of your proven process - they\'ll want you to guide them through the rest.',
    whenToUse: [
      'They know the problem but feel overwhelmed',
      'They need a quick win to build confidence',
      'They want to start but don\'t know how',
      'They need the first step made easy'
    ],
    actionSteps: [
      'Document the first step of your process',
      'Create a template or guide they can use immediately',
      'Show them what Step 2-5 looks like (your paid offer)'
    ],
    examples: [
      'Quick-Start Template - the first tool they need',
      'Step-by-Step Guide - exactly how to begin',
      'Checklist - ensure they don\'t miss anything',
      'Mini-Course - teach them the foundation'
    ]
  }
}

// Questions about their target customer
const LM_QUESTIONS = [
  {
    id: 'journey',
    question: 'Where is your ideal customer in their journey?',
    subtext: 'Understanding their awareness level helps choose the right lead magnet',
    options: [
      { value: 'unaware', label: 'Unaware', description: 'They don\'t know they have a problem yet' },
      { value: 'aware', label: 'Problem-Aware', description: 'They know the problem, seeking solutions' },
      { value: 'comparison', label: 'Comparing Options', description: 'They\'re looking at different solutions' },
      { value: 'ready', label: 'Ready to Buy', description: 'They just need the right offer' }
    ]
  },
  {
    id: 'barrier',
    question: 'What\'s the #1 barrier stopping them from buying?',
    subtext: 'Your lead magnet should address this directly',
    options: [
      { value: 'confused', label: 'Confused', description: 'They don\'t know what they need' },
      { value: 'skeptical', label: 'Skeptical', description: 'They don\'t believe it will work for them' },
      { value: 'overwhelmed', label: 'Overwhelmed', description: 'Too many options or steps' },
      { value: 'unsure_fit', label: 'Unsure of Fit', description: 'They don\'t know if it\'s right for them' }
    ]
  },
  {
    id: 'conviction',
    question: 'What would convince them you\'re the right choice?',
    subtext: 'This determines how to structure your lead magnet',
    options: [
      { value: 'quick_win', label: 'A Quick Win', description: 'Show results fast' },
      { value: 'personalized', label: 'Personalized Insight', description: 'Make it about them specifically' },
      { value: 'proof', label: 'Proof It Works', description: 'Show evidence and real results' },
      { value: 'first_step', label: 'The First Step', description: 'Make it easy to start' }
    ]
  }
]

function LeadMagnetSelectionFlow() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const showResults = searchParams.get('results') === 'true'

  const [stage, setStage] = useState(STAGES.LOADING)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState({ journey: null, barrier: null, conviction: null })
  const [selectedType, setSelectedType] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [nicheLayers, setNicheLayers] = useState(null)
  const [aiIdeas, setAiIdeas] = useState({ loading: false, ideas: [], error: null })

  // Load context from offer builder
  useEffect(() => {
    if (user) {
      loadOfferContext()
    }
  }, [user])

  const loadOfferContext = async () => {
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

      // Store niche layers for AI context
      if (assessment.responses?.q6_niche_layers?.layers) {
        setNicheLayers(assessment.responses.q6_niche_layers.layers)
      }

      // Check for View Results mode - load existing selection
      if (showResults && assessment.responses?.lead_magnet_selection) {
        const saved = assessment.responses.lead_magnet_selection
        if (saved.answers) setAnswers(saved.answers)
        if (saved.selectedType) setSelectedType(saved.selectedType)
        setStage(STAGES.RECOMMENDATION)
        return
      }

      // Check for existing selection (resume)
      if (assessment.responses?.lead_magnet_selection?.selectedType) {
        const saved = assessment.responses.lead_magnet_selection
        setAnswers(saved.answers || { journey: null, barrier: null, conviction: null })
        setSelectedType(saved.selectedType)
      }

      setStage(STAGES.WELCOME)
    } catch (err) {
      console.error('Error loading context:', err)
      setError('Failed to load data. Complete the Offer Builder first.')
      setStage(STAGES.WELCOME)
    }
  }

  // Get recommendation based on answers
  const getRecommendation = () => {
    if (!answers.journey || !answers.barrier || !answers.conviction) return 'free_step_1'

    const scores = { reveal_problem: 0, free_trial: 0, free_step_1: 0 }

    // Journey-based scoring
    if (answers.journey === 'unaware') scores.reveal_problem += 3
    if (answers.journey === 'aware') scores.free_step_1 += 2
    if (answers.journey === 'comparison') scores.free_trial += 3
    if (answers.journey === 'ready') scores.free_trial += 2

    // Barrier-based scoring
    if (answers.barrier === 'confused') scores.reveal_problem += 2
    if (answers.barrier === 'skeptical') scores.free_trial += 3
    if (answers.barrier === 'overwhelmed') scores.free_step_1 += 3
    if (answers.barrier === 'unsure_fit') scores.reveal_problem += 2

    // Conviction-based scoring
    if (answers.conviction === 'quick_win') scores.free_step_1 += 2
    if (answers.conviction === 'personalized') scores.reveal_problem += 3
    if (answers.conviction === 'proof') scores.free_trial += 3
    if (answers.conviction === 'first_step') scores.free_step_1 += 3

    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1])
    return sorted[0][0]
  }

  // Handle option selection
  const handleOptionSelect = (option) => {
    const currentQuestion = LM_QUESTIONS[currentQuestionIndex]

    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: option.value
    }))

    if (currentQuestionIndex < LM_QUESTIONS.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    } else {
      // All questions answered - get recommendation
      const recommended = getRecommendation()
      setSelectedType(recommended)
      setStage(STAGES.RECOMMENDATION)
    }
  }

  // Go back in questions
  const goBackInQuestions = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    } else {
      setStage(STAGES.EDUCATION_3)
    }
  }

  // Save results
  const handleSaveResults = async () => {
    if (isLoading || !user || !selectedType) return

    setIsLoading(true)
    setError(null)

    try {
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

      await supabase
        .from('offer_builder_assessments')
        .update({
          responses: {
            ...assessment.responses,
            lead_magnet_selection: {
              answers,
              selectedType,
              typeDetails: LEAD_MAGNET_TYPES[selectedType]
            }
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', assessment.id)

      // Complete challenge quest
      try {
        await completeFlowQuest({
          userId: user.id,
          flowId: 'lead_magnet_selection',
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

  // Generate AI personalized ideas
  const generateAiIdeas = async () => {
    if (!selectedType) return

    setAiIdeas({ loading: true, ideas: [], error: null })

    try {
      // Load offer builder data for more context
      const { data: assessment } = await supabase
        .from('offer_builder_assessments')
        .select('responses')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      // Get solution and problem context from offer builder
      const solutions = assessment?.responses?.q8_solutions?.solutions || []
      const firstSolution = solutions[0] || {}
      const problemText = assessment?.responses?.q7_obstacles?.sections?.flat()?.join(', ') || ''

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/lead-magnet-ideas`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            solutionType: firstSolution.type || 'digital_product',
            solutionDescription: firstSolution.description || '',
            leadMagnetType: selectedType,
            problemText: problemText,
            niche: nicheLayers?.layer4 || nicheLayers?.layer3 || null
          })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate ideas')
      }

      setAiIdeas({ loading: false, ideas: data.ideas || [], error: null })
    } catch (err) {
      console.error('AI ideas error:', err)
      setAiIdeas({ loading: false, ideas: [], error: err.message })
    }
  }

  // ============ RENDER ============

  if (stage === STAGES.LOADING) {
    return (
      <div className="lm-selection-flow">
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
      <div className="lm-selection-flow">
        <ProgressDots stageGroups={STAGE_GROUPS} currentStage={stage} />
        <div className="welcome-container">
          <h1 className="welcome-greeting">Lead Magnet Selection</h1>
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
                <p><strong>Let's choose your ONE lead magnet.</strong></p>
                <p>The best businesses have ONE killer lead magnet that attracts the right people and positions them as the solution.</p>
                <p>I'll ask 3 quick questions about your ideal customer, then recommend the perfect lead magnet type for your offer.</p>

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

                <button
                  className="primary-button glow-button"
                  onClick={() => setStage(STAGES.EDUCATION_1)}
                  style={{ marginTop: '24px' }}
                >
                  Learn About Lead Magnets
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

  // EDUCATION STAGES
  if (stage === STAGES.EDUCATION_1 || stage === STAGES.EDUCATION_2 || stage === STAGES.EDUCATION_3) {
    const slideIndex = stage === STAGES.EDUCATION_1 ? 0 : stage === STAGES.EDUCATION_2 ? 1 : 2
    const slide = EDUCATION_SLIDES[slideIndex]
    const nextStage = stage === STAGES.EDUCATION_1 ? STAGES.EDUCATION_2
      : stage === STAGES.EDUCATION_2 ? STAGES.EDUCATION_3
      : STAGES.QUESTIONS
    const prevStage = stage === STAGES.EDUCATION_1 ? STAGES.WELCOME
      : stage === STAGES.EDUCATION_2 ? STAGES.EDUCATION_1
      : STAGES.EDUCATION_2

    return (
      <div className="lm-selection-flow">
        <ProgressDots stageGroups={STAGE_GROUPS} currentStage={stage} />
        <div className="education-container">
          <div className="edu-icon">{slide.icon}</div>
          <h2 className="edu-title">{slide.title}</h2>

          {/* Slide 1: Definition style */}
          {slide.mainText && (
            <div className="edu-definition">
              <p className="edu-main-text">{slide.mainText}</p>
              {slide.subText && <p className="edu-sub-text">{slide.subText}</p>}
            </div>
          )}

          {/* Slide 2: Funnel visualization */}
          {slide.funnelSteps && (
            <div className="edu-funnel">
              {slide.funnelSteps.map((step, i) => (
                <div key={i} className="funnel-step">
                  <span className="funnel-icon">{step.icon}</span>
                  <span className="funnel-label">{step.label}</span>
                  <span className="funnel-sublabel">{step.sublabel}</span>
                  {i < slide.funnelSteps.length - 1 && <span className="funnel-arrow">→</span>}
                </div>
              ))}
            </div>
          )}

          {/* Slide 3: Formula style */}
          {slide.formula && (
            <div className="edu-formula">
              {slide.formula.map((line, i) => (
                <p key={i} className={line === '+' ? 'formula-plus' : 'formula-line'}>{line}</p>
              ))}
            </div>
          )}

          {slide.highlight && (
            <div className="edu-highlight">
              <p>{slide.highlight}</p>
            </div>
          )}

          <button
            className="primary-button"
            onClick={() => setStage(nextStage)}
          >
            {stage === STAGES.EDUCATION_3 ? 'Start Questions' : 'Continue'}
          </button>
          <button
            className="go-back-link"
            onClick={() => setStage(prevStage)}
          >
            ← Go Back
          </button>
        </div>
      </div>
    )
  }

  // QUESTIONS STAGE
  if (stage === STAGES.QUESTIONS) {
    const currentQuestion = LM_QUESTIONS[currentQuestionIndex]

    return (
      <div className="lm-selection-flow">
        <ProgressDots stageGroups={STAGE_GROUPS} currentStage={stage} />
        <div className="question-container">
          <div className="question-progress">
            Question {currentQuestionIndex + 1} of {LM_QUESTIONS.length}
          </div>

          <h2 className="question-text">{currentQuestion.question}</h2>
          <p className="question-subtext">{currentQuestion.subtext}</p>

          <div className="options-list">
            {currentQuestion.options.map((option) => (
              <button
                key={option.value}
                className={`option-card ${answers[currentQuestion.id] === option.value ? 'selected' : ''}`}
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

  // RECOMMENDATION STAGE
  if (stage === STAGES.RECOMMENDATION) {
    const recommended = getRecommendation()
    const currentType = LEAD_MAGNET_TYPES[selectedType]

    return (
      <div className="lm-selection-flow">
        <ProgressDots stageGroups={STAGE_GROUPS} currentStage={stage} />
        <div className="recommendation-container">
          <h2 className="question-text">Your Lead Magnet Type</h2>
          <p className="question-subtext">
            Based on your answers, here's my recommendation
          </p>

          <div className="lm-type-options">
            {Object.entries(LEAD_MAGNET_TYPES).map(([typeId, type]) => (
              <button
                key={typeId}
                className={`lm-type-option ${selectedType === typeId ? 'selected' : ''} ${typeId === recommended ? 'recommended' : ''}`}
                onClick={() => setSelectedType(typeId)}
              >
                <span className="lm-opt-icon">{type.icon}</span>
                <div className="lm-opt-content">
                  <span className="lm-opt-name">{type.name}</span>
                  <span className="lm-opt-examples">{type.shortDesc}</span>
                </div>
                {typeId === recommended && <span className="rec-badge">Recommended</span>}
              </button>
            ))}
          </div>

          {/* Detailed info for selected type */}
          {currentType && (
            <div className="lm-details-grid">
              {/* Why + When row */}
              <div className="lm-detail-card lm-why-card">
                <div className="detail-card-icon">💡</div>
                <div className="detail-card-content">
                  <h4>Why This Works</h4>
                  <p>{currentType.whyItWorks}</p>
                </div>
              </div>

              <div className="lm-detail-card lm-when-card">
                <div className="detail-card-icon">🎯</div>
                <div className="detail-card-content">
                  <h4>Best When</h4>
                  <ul>
                    {currentType.whenToUse.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Steps - full width */}
              <div className="lm-detail-card lm-action-card">
                <div className="detail-card-icon">⚡</div>
                <div className="detail-card-content">
                  <h4>Action Steps</h4>
                  <div className="action-steps-row">
                    {currentType.actionSteps.map((step, i) => (
                      <div key={i} className="action-step">
                        <span className="step-number">{i + 1}</span>
                        <span className="step-text">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Examples - pill tags */}
              <div className="lm-detail-card lm-examples-card">
                <div className="detail-card-icon">📝</div>
                <div className="detail-card-content">
                  <h4>Examples</h4>
                  <div className="examples-list">
                    {currentType.examples.map((example, i) => (
                      <div key={i} className="example-item">{example}</div>
                    ))}
                  </div>
                </div>
              </div>

              {/* AI personalization */}
              <div className="lm-detail-card lm-ai-card">
                {aiIdeas.loading ? (
                  <div className="ai-loading">
                    <div className="typing-indicator">
                      <span></span><span></span><span></span>
                    </div>
                    <p>Generating personalized ideas...</p>
                  </div>
                ) : aiIdeas.ideas?.length > 0 ? (
                  <div className="ai-ideas-results">
                    <h4>✨ Personalized Ideas</h4>
                    <div className="ai-ideas-list">
                      {aiIdeas.ideas.map((idea, i) => (
                        <div key={i} className="ai-idea-card">
                          {idea.format && <span className="idea-format">{idea.format}</span>}
                          <h5>{idea.title}</h5>
                          {idea.description && <p className="idea-description">{idea.description}</p>}
                          {idea.hook && <p className="idea-hook">"{idea.hook}"</p>}
                        </div>
                      ))}
                    </div>
                    <button className="ai-refresh-button" onClick={generateAiIdeas}>
                      🔄 Generate New Ideas
                    </button>
                  </div>
                ) : (
                  <button className="ai-ideas-button" onClick={generateAiIdeas}>
                    <span className="ai-btn-icon">✨</span>
                    <span className="ai-btn-text">
                      <strong>Get Personalized Ideas</strong>
                      <small>AI suggestions for your niche</small>
                    </span>
                  </button>
                )}
                {aiIdeas.error && <p className="ai-error">{aiIdeas.error}</p>}
              </div>
            </div>
          )}

          {error && <p className="error-message">{error}</p>}

          <button
            className="primary-button"
            onClick={handleSaveResults}
            disabled={isLoading || !selectedType}
            style={{ marginTop: '24px' }}
          >
            {isLoading ? 'Saving...' : 'Save & Complete (+30 pts)'}
          </button>

          <BackButton onClick={() => {
            setCurrentQuestionIndex(LM_QUESTIONS.length - 1)
            setStage(STAGES.QUESTIONS)
          }} />
        </div>
      </div>
    )
  }

  // SUCCESS STAGE
  if (stage === STAGES.SUCCESS) {
    const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'there'
    const finalType = LEAD_MAGNET_TYPES[selectedType]

    return (
      <div className="lm-selection-flow">
        <div className="success-container">
          <div className="success-icon">{finalType?.icon || '🎁'}</div>
          <h2>Lead Magnet Selected, {userName}!</h2>
          <p>You've chosen your lead magnet strategy.</p>
          <p style={{ color: '#fbbf24', fontWeight: '600', fontSize: '18px' }}>+30 points earned!</p>

          <div className="summary-card-single">
            <span className="summary-icon">{finalType?.icon}</span>
            <div>
              <h4>{finalType?.name}</h4>
              <p>{finalType?.shortDesc}</p>
            </div>
          </div>

          <p className="next-step-hint">
            Next: In Money Models, you'll decide how to position this lead magnet as your Attraction Offer.
          </p>
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

export default LeadMagnetSelectionFlow
