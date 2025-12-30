/**
 * LeadMagnetSelectionFlow - Lead Magnet Selection (+30 pts)
 *
 * Follows OfferBuilderFlow to finalize lead magnet details.
 * Loads solutions categorized as 'lead_magnet' from the Offer Builder.
 *
 * For each lead magnet solution, asks 3 questions:
 * 1. Where is your prospect in their journey?
 * 2. What's the #1 barrier stopping them?
 * 3. What would convince them you can help?
 *
 * Then recommends a lead magnet type:
 * - Reveal the Problem (quiz, assessment, calculator)
 * - Free Trial (free session, sample, demo)
 * - Free Step 1 (template, guide, mini-course)
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import { completeFlowQuest } from '../lib/questCompletion'
import { BackButton, ProgressDots } from '../components/MoneyModelShared'
import './LeadMagnetSelectionFlow.css'

const STAGES = {
  LOADING: 'loading',
  WELCOME: 'welcome',
  QUESTIONS: 'questions',
  RECOMMENDATION: 'recommendation',
  SUCCESS: 'success'
}

const STAGE_GROUPS = [
  { id: 'welcome', label: 'Welcome', stages: [STAGES.WELCOME] },
  { id: 'questions', label: 'Questions', stages: [STAGES.QUESTIONS] },
  { id: 'select', label: 'Select', stages: [STAGES.RECOMMENDATION] },
  { id: 'complete', label: 'Complete', stages: [STAGES.SUCCESS] }
]

// Solution type labels
const SOLUTION_LABELS = {
  one_to_one: '1:1 Service',
  one_to_many: '1:Many Service',
  tech_digital: 'Tech/Digital',
  physical_product: 'Physical Product'
}

// Lead Magnet types with detailed info and category-based suggestions
const LEAD_MAGNET_TYPES = {
  reveal_problem: {
    name: 'Reveal the Problem',
    icon: '🔍',
    shortDesc: 'Quiz, assessment, calculator, audit',
    description: 'Help them realize they have a problem they didn\'t know about',
    examples: 'Quiz, assessment, calculator, audit',
    bestFor: ['unaware', 'confused'],
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
    suggestionsByType: {
      one_to_one: [
        '"Are You Ready?" Assessment - 10 questions to reveal gaps in their approach',
        'Free Audit - Review their current situation and identify 3 blind spots',
        'Scorecard - Rate themselves on key areas, reveal where they\'re falling behind'
      ],
      group_program: [
        'Community Fit Quiz - Help them discover if group learning is right for them',
        'Readiness Assessment - Reveal what stage they\'re at and what they need',
        'Gap Analysis Tool - Show them what\'s missing from their current approach'
      ],
      digital_product: [
        'Self-Assessment Quiz - Diagnose their problem and recommend your solution',
        'Calculator Tool - Help them quantify their problem (cost, time, impact)',
        'Audit Checklist - Walk through key areas, reveal what needs attention'
      ],
      tech_digital: [
        'ROI Calculator - Show them the hidden costs of not using your solution',
        'Tech Stack Audit - Reveal inefficiencies in their current setup',
        'Compatibility Quiz - Help them discover if your tool fits their needs'
      ],
      physical_product: [
        'Product Finder Quiz - Help them discover which product fits their needs',
        'Problem Diagnosis Tool - Reveal the root cause of their issue',
        'Comparison Calculator - Show how your solution stacks up'
      ]
    }
  },
  free_trial: {
    name: 'Free Trial',
    icon: '🎯',
    shortDesc: 'Free session, sample, demo, trial period',
    description: 'Let them experience your solution before buying',
    examples: 'Free session, sample, demo, trial period',
    bestFor: ['comparison', 'skeptical'],
    whyItWorks: 'Your prospects are skeptical or comparing options. By letting them experience your solution first-hand, you eliminate risk and prove your value before they commit.',
    whenToUse: [
      'Prospects are comparing multiple solutions',
      'They\'re skeptical and need proof',
      'Your solution is best experienced, not explained'
    ],
    actionSteps: [
      'Define what "free" means (time-limited, feature-limited, etc.)',
      'Create a wow moment in the trial experience',
      'Build a clear upgrade path from trial to paid'
    ],
    suggestionsByType: {
      one_to_one: [
        'Free Discovery Call - 15-30 min session to experience your approach',
        'Mini Session - Solve one small problem to demonstrate your value',
        'Strategy Audit - Free review with actionable recommendations'
      ],
      group_program: [
        'Free Workshop - Live session covering one key topic from your program',
        'Guest Pass - Invite them to sit in on one community call',
        'Challenge Week - 5-7 days of content to experience your teaching style'
      ],
      digital_product: [
        'Free Module - Give access to the first section of your course',
        'Sample Content - Key templates or resources from your product',
        '7-Day Trial - Full access for a limited time'
      ],
      tech_digital: [
        'Free Tier - Limited features, unlimited time',
        '14-Day Trial - Full access, then convert to paid',
        'Demo Account - Pre-populated with sample data to explore'
      ],
      physical_product: [
        'Free Sample - Send a small version or trial size',
        'Try Before You Buy - Use it for 30 days, return if not satisfied',
        'Starter Kit - Entry-level version at no cost'
      ]
    }
  },
  free_step_1: {
    name: 'Free Step 1',
    icon: '🪜',
    shortDesc: 'Template, guide, mini-course, checklist',
    description: 'Give them the first step of your process for free',
    examples: 'Template, guide, mini-course, checklist',
    bestFor: ['aware', 'overwhelmed'],
    whyItWorks: 'Your prospects know they have a problem but feel overwhelmed. By giving them a quick win with Step 1, you build trust and show them your full solution is the natural next step.',
    whenToUse: [
      'Prospects are aware but overwhelmed',
      'They want a quick win to build momentum',
      'Your solution has clear, sequential steps'
    ],
    actionSteps: [
      'Identify the first step of your process',
      'Package it as a standalone deliverable',
      'Make Step 2+ the natural paid continuation'
    ],
    suggestionsByType: {
      one_to_one: [
        'Quick-Start Guide - The first steps they can take on their own',
        'Self-Assessment Template - Framework to clarify their situation',
        'Action Plan Template - Map out their next moves'
      ],
      group_program: [
        'Foundations Mini-Course - 3-5 lessons covering the basics',
        'Getting Started Guide - Everything they need before joining',
        'Pre-Work Workbook - Prepare them for the full program'
      ],
      digital_product: [
        'Chapter 1 / Module 1 - First section of your product',
        'Starter Template Pack - Core templates to get going',
        'Quick-Win Checklist - Immediate actions for fast results'
      ],
      tech_digital: [
        'Setup Guide - Get started with basic configuration',
        'Quick-Start Tutorial - Master the essentials in 15 minutes',
        'Starter Templates - Pre-built configs to skip the learning curve'
      ],
      physical_product: [
        'Getting Started Guide - How to use your product effectively',
        'Quick Results Protocol - Fastest way to see benefits',
        'Setup Checklist - Everything they need to get going'
      ]
    }
  }
}

// Questions to ask per solution
const LM_QUESTIONS = [
  {
    id: 'journey',
    question: 'Where is your prospect in their journey?',
    subtext: 'Understanding their awareness level helps choose the right lead magnet',
    options: [
      { value: 'unaware', label: 'Unaware', description: 'Don\'t know they have a problem' },
      { value: 'aware', label: 'Problem-Aware', description: 'Know the problem, not the solution' },
      { value: 'comparison', label: 'Comparing Options', description: 'Looking at different solutions' },
      { value: 'ready', label: 'Ready to Buy', description: 'Just need the right offer' }
    ]
  },
  {
    id: 'barrier',
    question: 'What\'s the #1 barrier stopping them?',
    subtext: 'The lead magnet should address this directly',
    options: [
      { value: 'confused', label: 'Confused', description: 'Don\'t know what they need' },
      { value: 'skeptical', label: 'Skeptical', description: 'Don\'t believe it will work' },
      { value: 'overwhelmed', label: 'Overwhelmed', description: 'Too many options or steps' },
      { value: 'unsure_fit', label: 'Unsure of Fit', description: 'Don\'t know if it\'s right for them' }
    ]
  },
  {
    id: 'conviction',
    question: 'What would convince them you can help?',
    subtext: 'This determines how to structure your lead magnet',
    options: [
      { value: 'quick_win', label: 'A Quick Win', description: 'Show results fast' },
      { value: 'personalized', label: 'Personalized Insight', description: 'Make it about them' },
      { value: 'proof', label: 'Proof It Works', description: 'Show evidence and results' },
      { value: 'first_step', label: 'The First Step', description: 'Make it easy to start' }
    ]
  }
]

function LeadMagnetSelectionFlow() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [stage, setStage] = useState(STAGES.LOADING)
  const [leadMagnetSolutions, setLeadMagnetSolutions] = useState([])
  const [currentSolutionIndex, setCurrentSolutionIndex] = useState(0)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState({}) // { solutionId: { journey: '', barrier: '', conviction: '' } }
  const [selectedTypes, setSelectedTypes] = useState({}) // { solutionId: 'reveal_problem' | 'free_trial' | 'free_step_1' }
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [aiIdeas, setAiIdeas] = useState({}) // { solutionId: { loading: bool, ideas: [], error: string } }
  const [nicheLayers, setNicheLayers] = useState(null) // From offer builder for context

  // Load lead magnet solutions from the most recent offer builder assessment
  useEffect(() => {
    if (user) {
      loadLeadMagnetSolutions()
    }
  }, [user])

  const loadLeadMagnetSolutions = async () => {
    try {
      const { data: assessment, error } = await supabase
        .from('offer_builder_assessments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) throw error

      // No assessment found - user needs to complete Offer Builder first
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

        // Filter to only lead magnet solutions
        // Categories use "solution_X" keys while solutions array uses numeric indices
        // Each solution has solutionType field (one_to_one, tech_digital, etc.)
        const lmSolutions = Object.entries(solutions)
          .filter(([id]) => categories[`solution_${id}`] === 'lead_magnet')
          .map(([id, data]) => ({
            id: `solution_${id}`,
            ...data,
            // Use solutionType for the label, not the numeric id
            label: SOLUTION_LABELS[data.solutionType] || data.solutionType
          }))

        setLeadMagnetSolutions(lmSolutions)

        // Initialize answers for each solution
        const initialAnswers = {}
        lmSolutions.forEach(sol => {
          initialAnswers[sol.id] = { journey: null, barrier: null, conviction: null }
        })
        setAnswers(initialAnswers)

        if (lmSolutions.length === 0) {
          setError('No lead magnets found. Complete the Offer Builder first.')
        }
      }

      setStage(STAGES.WELCOME)
    } catch (err) {
      console.error('Error loading solutions:', err)
      setError('Failed to load solutions. Complete the Offer Builder first.')
      setStage(STAGES.WELCOME)
    }
  }

  // Get recommendation based on answers
  const getRecommendation = (solutionId) => {
    const ans = answers[solutionId]
    if (!ans) return 'free_step_1'

    // Score each type based on answers
    const scores = { reveal_problem: 0, free_trial: 0, free_step_1: 0 }

    // Journey-based scoring
    if (ans.journey === 'unaware') scores.reveal_problem += 3
    if (ans.journey === 'aware') scores.free_step_1 += 2
    if (ans.journey === 'comparison') scores.free_trial += 3
    if (ans.journey === 'ready') scores.free_trial += 2

    // Barrier-based scoring
    if (ans.barrier === 'confused') scores.reveal_problem += 2
    if (ans.barrier === 'skeptical') scores.free_trial += 3
    if (ans.barrier === 'overwhelmed') scores.free_step_1 += 3
    if (ans.barrier === 'unsure_fit') scores.reveal_problem += 2

    // Conviction-based scoring
    if (ans.conviction === 'quick_win') scores.free_step_1 += 2
    if (ans.conviction === 'personalized') scores.reveal_problem += 3
    if (ans.conviction === 'proof') scores.free_trial += 3
    if (ans.conviction === 'first_step') scores.free_step_1 += 3

    // Return highest scored
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1])
    return sorted[0][0]
  }

  // Handle option selection
  const handleOptionSelect = (option) => {
    const currentSolution = leadMagnetSolutions[currentSolutionIndex]
    const currentQuestion = LM_QUESTIONS[currentQuestionIndex]

    setAnswers(prev => ({
      ...prev,
      [currentSolution.id]: {
        ...prev[currentSolution.id],
        [currentQuestion.id]: option.value
      }
    }))

    // Move to next question or next solution
    if (currentQuestionIndex < LM_QUESTIONS.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    } else if (currentSolutionIndex < leadMagnetSolutions.length - 1) {
      // Move to next solution
      setCurrentSolutionIndex(prev => prev + 1)
      setCurrentQuestionIndex(0)
    } else {
      // All done - calculate recommendations and go to selection
      const recs = {}
      leadMagnetSolutions.forEach(sol => {
        recs[sol.id] = getRecommendation(sol.id)
      })
      setSelectedTypes(recs)
      setStage(STAGES.RECOMMENDATION)
    }
  }

  // Go back in questions
  const goBackInQuestions = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    } else if (currentSolutionIndex > 0) {
      setCurrentSolutionIndex(prev => prev - 1)
      setCurrentQuestionIndex(LM_QUESTIONS.length - 1)
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
      // Update the offer_builder_assessment with lead magnet types
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
        await supabase
          .from('offer_builder_assessments')
          .update({
            responses: {
              ...assessment.responses,
              lead_magnet_selections: {
                answers,
                types: selectedTypes
              }
            },
            updated_at: new Date().toISOString()
          })
          .eq('id', assessment.id)
      }

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

  // Generate AI personalized ideas for a solution
  const generateAiIdeas = async (solution) => {
    const solutionId = solution.id
    const leadMagnetType = selectedTypes[solutionId]

    if (!leadMagnetType) return

    // Set loading state for this solution
    setAiIdeas(prev => ({
      ...prev,
      [solutionId]: { loading: true, ideas: [], error: null }
    }))

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/lead-magnet-ideas`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            solutionType: solution.solutionType,
            solutionDescription: solution.description,
            leadMagnetType: leadMagnetType,
            problemText: solution.problemText,
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
        [solutionId]: { loading: false, ideas: data.ideas || [], error: null }
      }))
    } catch (err) {
      console.error('AI ideas error:', err)
      setAiIdeas(prev => ({
        ...prev,
        [solutionId]: { loading: false, ideas: [], error: err.message }
      }))
    }
  }

  // ============ RENDER ============

  // Loading state
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
                <p><strong>Let's finalize your lead magnets.</strong></p>
                <p>You have {leadMagnetSolutions.length} solution{leadMagnetSolutions.length !== 1 ? 's' : ''} marked as lead magnets.</p>
                <p>For each one, I'll ask 3 quick questions to recommend the best lead magnet type.</p>

                <div className="solutions-preview">
                  {leadMagnetSolutions.map((sol, idx) => (
                    <div key={sol.id} className="solution-preview-card">
                      <span className="preview-number">{idx + 1}</span>
                      <div className="preview-content">
                        <h4>{sol.label}</h4>
                        <p>{sol.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  className="primary-button glow-button"
                  onClick={() => setStage(STAGES.QUESTIONS)}
                  style={{ marginTop: '24px' }}
                >
                  Start Selection
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
    const currentSolution = leadMagnetSolutions[currentSolutionIndex]
    const currentQuestion = LM_QUESTIONS[currentQuestionIndex]
    const totalQuestions = leadMagnetSolutions.length * LM_QUESTIONS.length
    const currentProgress = (currentSolutionIndex * LM_QUESTIONS.length) + currentQuestionIndex + 1

    return (
      <div className="lm-selection-flow">
        <ProgressDots stageGroups={STAGE_GROUPS} currentStage={stage} />
        <div className="question-container">
          <div className="solution-context">
            <span className="solution-badge">{currentSolution.label}</span>
            <p className="solution-desc">{currentSolution.description}</p>
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

  // RECOMMENDATION STAGE
  if (stage === STAGES.RECOMMENDATION) {
    return (
      <div className="lm-selection-flow">
        <ProgressDots stageGroups={STAGE_GROUPS} currentStage={stage} />
        <div className="recommendation-container">
          <h2 className="question-text">Your Lead Magnet Types</h2>
          <p className="question-subtext">
            Based on your answers, here are my recommendations
          </p>

          <div className="recommendations-list">
            {leadMagnetSolutions.map((solution) => {
              const recommended = getRecommendation(solution.id)
              const selected = selectedTypes[solution.id] || recommended
              const selectedType = LEAD_MAGNET_TYPES[selected]

              return (
                <div key={solution.id} className="recommendation-card">
                  <div className="rec-card-header">
                    <h3>{solution.description || solution.label}</h3>
                  </div>

                  <div className="lm-type-options">
                    {Object.entries(LEAD_MAGNET_TYPES).map(([typeId, type]) => (
                      <button
                        key={typeId}
                        className={`lm-type-option ${selected === typeId ? 'selected' : ''} ${typeId === recommended ? 'recommended' : ''}`}
                        onClick={() => setSelectedTypes(prev => ({ ...prev, [solution.id]: typeId }))}
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
                  {selectedType && (
                    <div className="lm-type-details">
                      <div className="lm-why-section">
                        <h4>Why This Works</h4>
                        <p>{selectedType.whyItWorks}</p>
                      </div>

                      <div className="lm-when-section">
                        <h4>Best When</h4>
                        <ul>
                          {selectedType.whenToUse.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="lm-action-section">
                        <h4>Action Steps</h4>
                        <ol>
                          {selectedType.actionSteps.map((step, i) => (
                            <li key={i}>{step}</li>
                          ))}
                        </ol>
                      </div>

                      {/* Category-based suggestions */}
                      {solution.solutionType && selectedType.suggestionsByType?.[solution.solutionType] && (
                        <div className="lm-suggestions-section">
                          <h4>💡 Ideas for Your {solution.label}</h4>
                          <ul className="suggestion-list">
                            {selectedType.suggestionsByType[solution.solutionType].map((suggestion, i) => (
                              <li key={i}>{suggestion}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* AI personalization section */}
                      <div className="lm-ai-section">
                        {aiIdeas[solution.id]?.loading ? (
                          <div className="ai-loading">
                            <div className="typing-indicator">
                              <span></span><span></span><span></span>
                            </div>
                            <p>Generating personalized ideas...</p>
                          </div>
                        ) : aiIdeas[solution.id]?.ideas?.length > 0 ? (
                          <div className="ai-ideas-results">
                            <h4>✨ Personalized Ideas</h4>
                            <div className="ai-ideas-list">
                              {aiIdeas[solution.id].ideas.map((idea, i) => (
                                <div key={i} className="ai-idea-card">
                                  <div className="idea-header">
                                    <span className="idea-format">{idea.format}</span>
                                    <h5>{idea.title}</h5>
                                  </div>
                                  <p className="idea-description">{idea.description}</p>
                                  <p className="idea-hook">"{idea.hook}"</p>
                                </div>
                              ))}
                            </div>
                            <button
                              className="ai-refresh-button"
                              onClick={() => generateAiIdeas(solution)}
                            >
                              🔄 Generate New Ideas
                            </button>
                          </div>
                        ) : (
                          <>
                            {aiIdeas[solution.id]?.error && (
                              <p className="ai-error">{aiIdeas[solution.id].error}</p>
                            )}
                            <button
                              className="ai-ideas-button"
                              onClick={() => generateAiIdeas(solution)}
                            >
                              ✨ Get Personalized Ideas
                            </button>
                            <p className="ai-hint">Get AI-generated suggestions tailored to your specific offer</p>
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
            disabled={isLoading || Object.keys(selectedTypes).length !== leadMagnetSolutions.length}
            style={{ marginTop: '24px' }}
          >
            {isLoading ? 'Saving...' : 'Save & Complete (+30 pts)'}
          </button>

          <BackButton onClick={() => {
            setCurrentSolutionIndex(leadMagnetSolutions.length - 1)
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

    return (
      <div className="lm-selection-flow">
        <div className="success-container">
          <div className="success-icon">🎁</div>
          <h2>Lead Magnets Selected, {userName}!</h2>
          <p>You've defined your lead magnet strategy for {leadMagnetSolutions.length} solution{leadMagnetSolutions.length !== 1 ? 's' : ''}.</p>
          <p style={{ color: '#fbbf24', fontWeight: '600', fontSize: '18px' }}>+30 points earned!</p>

          <div className="summary-cards">
            {leadMagnetSolutions.map((sol) => (
              <div key={sol.id} className="summary-card">
                <span className="summary-icon">{LEAD_MAGNET_TYPES[selectedTypes[sol.id]]?.icon}</span>
                <div>
                  <h4>{sol.label}</h4>
                  <p>{LEAD_MAGNET_TYPES[selectedTypes[sol.id]]?.name}</p>
                </div>
              </div>
            ))}
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

export default LeadMagnetSelectionFlow
