import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import { completeFlowQuest } from '../lib/questCompletion'
import { useProjectId } from '../hooks/useProjectId'
import { trackFlowCompletion } from '../lib/flowTracking'
import WheelPicker from '../components/onboarding/QuickCapture/WheelPicker'
import {
  PERSONA_SEGMENTS,
  PROBLEM_SEGMENTS,
  JOURNEY_STAGES,
  PROBLEMS_PROFICIENCY_RINGS
} from '../lib/wheelTaxonomy'
import FlowFeedback from '../components/FlowFeedback/FlowFeedback'
import './PersonaSelectionFlow.css'

// Flow stages
const STAGES = {
  WELCOME: 'welcome',
  SELECTOR: 'selector',
  CUSTOM_INPUT: 'custom_input',
  QUESTIONS: 'questions',
  SUCCESS: 'success',
  PRE_ACTION: 'pre_action'
}

// Visibility layers for 2D pattern recognition
const VISIBILITY_LAYERS = [
  { id: 'screen', icon: '📱', label: 'Screen', description: 'Putting myself out there where people can see and judge me' },
  { id: 'live', icon: '⚡', label: 'Live', description: 'Doing something in real-time where I can\'t edit or take it back' },
  { id: 'vulnerable', icon: '💗', label: 'Vulnerable', description: 'Showing something unfinished or admitting I need help' },
  { id: 'money', icon: '💰', label: 'Money', description: 'Asking someone to pay me or stating my price' },
  { id: 'authority', icon: '👑', label: 'Authority', description: 'Claiming expertise or positioning myself as someone to follow' }
]

// Protective voices for 2D pattern recognition
const PROTECTIVE_VOICES = [
  { id: 'perfectionist', icon: '🎭', label: 'Perfectionist', description: 'My idea isn\'t ready for feedback yet' },
  { id: 'people_pleaser', icon: '🤝', label: 'People Pleaser', description: 'I don\'t want to bother anyone' },
  { id: 'controller', icon: '🎛️', label: 'Controller', description: 'I can\'t control what they\'ll say' },
  { id: 'performer', icon: '🎪', label: 'Performer', description: 'I need to have more figured out first' },
  { id: 'ghost', icon: '👻', label: 'Ghost', description: 'I\'d rather stay quiet than risk rejection' }
]

// Contextual essence messages based on voice + layer
const getEssenceMessage = (voice, layer) => {
  const messages = {
    'perfectionist_screen': 'Your Perfectionist wants the idea to be polished before sharing. But validation IS the polish — real feedback shapes better ideas than isolation ever could.',
    'perfectionist_vulnerable': 'Your Perfectionist doesn\'t want to show unfinished work. But asking for feedback isn\'t weakness — it\'s wisdom.',
    'perfectionist_live': 'Your Perfectionist fears making mistakes in real-time. But conversations aren\'t performances — they\'re discoveries.',
    'people_pleaser_screen': 'Your People Pleaser worries about being "annoying." But asking for feedback is an invitation, not a burden.',
    'people_pleaser_vulnerable': 'Your People Pleaser doesn\'t want to impose. But most people feel honored to be asked for their perspective.',
    'people_pleaser_live': 'Your People Pleaser fears disappointing someone in the moment. But genuine curiosity is always welcome.',
    'controller_screen': 'Your Controller can\'t predict the response. But the unknown holds possibility, not just danger.',
    'controller_vulnerable': 'Your Controller wants certainty before sharing. But validation IS how you gain certainty.',
    'controller_live': 'Your Controller fears conversations you can\'t script. But the best insights come from unscripted moments.',
    'performer_screen': 'Your Performer wants more credentials first. But you already know enough to ask good questions.',
    'performer_vulnerable': 'Your Performer feels unqualified to ask. But curiosity doesn\'t require a resume.',
    'performer_live': 'Your Performer wants to prove expertise first. But listening IS the expertise here.',
    'ghost_screen': 'Your Ghost wants to stay invisible. But your idea deserves to be seen — and so do you.',
    'ghost_vulnerable': 'Your Ghost says it\'s safer to stay hidden. But connection is what you\'re actually seeking.',
    'ghost_live': 'Your Ghost prefers the safety of silence. But your voice matters, even in small conversations.'
  }

  const key = `${voice}_${layer}`
  return messages[key] || 'Your protective pattern is trying to keep you safe. But you don\'t need protection from genuine connection.'
}

function PersonaSelectionFlow() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { projectId } = useProjectId()

  const [stage, setStage] = useState(STAGES.WELCOME)
  const [nikigaiPersonas, setNikigaiPersonas] = useState([])
  const [nikigaiProblems, setNikigaiProblems] = useState([])
  const [currentPersonaIndex, setCurrentPersonaIndex] = useState(0)
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0)
  const [selectedCombinations, setSelectedCombinations] = useState([])
  const [currentComboIndex, setCurrentComboIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [allProfiles, setAllProfiles] = useState([])
  const [selectedProfileId, setSelectedProfileId] = useState(null)
  const [showGuideModal, setShowGuideModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // PRE-ACTION state for resistance capture
  const [preActionFeeling, setPreActionFeeling] = useState(null)
  const [visibilityLayer, setVisibilityLayer] = useState(null)
  const [protectiveVoice, setProtectiveVoice] = useState(null)
  const [preActionStep, setPreActionStep] = useState('feeling') // feeling | layer | voice | essence

  // Scroll to top on stage/step changes
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [stage, preActionStep])

  // Load Nikigai clusters on mount
  useEffect(() => {
    if (user) {
      loadNikigaiClusters()
    }
  }, [user])

  const loadNikigaiClusters = async () => {
    try {
      const { data: clusters, error } = await supabase
        .from('nikigai_clusters')
        .select('*')
        .eq('user_id', user.id)
        .eq('cluster_stage', 'final')
        .eq('archived', false)

      if (error) throw error

      const personas = clusters
        .filter(c => c.cluster_type === 'persona')
        .map(c => c.cluster_label || c.cluster_name || c.cluster_content || c.insight)

      const problems = clusters
        .filter(c => c.cluster_type === 'problems')
        .map(c => c.cluster_label || c.cluster_name || c.cluster_content || c.insight)

      setNikigaiPersonas(personas)
      setNikigaiProblems(problems)
    } catch (err) {
      console.error('Error loading Nikigai clusters:', err)
      setNikigaiPersonas([])
      setNikigaiProblems([])
    }
  }

  const hasNikigaiData = nikigaiPersonas.length > 0 && nikigaiProblems.length > 0

  // Navigation functions for persona/problem sliders
  const previousPersona = () => {
    if (currentPersonaIndex > 0) {
      setCurrentPersonaIndex(currentPersonaIndex - 1)
    }
  }

  const nextPersona = () => {
    if (currentPersonaIndex < nikigaiPersonas.length - 1) {
      setCurrentPersonaIndex(currentPersonaIndex + 1)
    }
  }

  const previousProblem = () => {
    if (currentProblemIndex > 0) {
      setCurrentProblemIndex(currentProblemIndex - 1)
    }
  }

  const nextProblem = () => {
    if (currentProblemIndex < nikigaiProblems.length - 1) {
      setCurrentProblemIndex(currentProblemIndex + 1)
    }
  }

  // Add current combination
  const addCurrentCombo = () => {
    if (selectedCombinations.length >= 3) {
      alert('You can only select up to 3 combinations')
      return
    }

    const combo = {
      persona: nikigaiPersonas[currentPersonaIndex],
      problem: nikigaiProblems[currentProblemIndex]
    }

    // Check if already added
    if (selectedCombinations.some(c => c.persona === combo.persona && c.problem === combo.problem)) {
      alert('This combination is already selected')
      return
    }

    setSelectedCombinations([...selectedCombinations, combo])
  }

  // Add custom combination
  const addCustomCombo = (persona, problem) => {
    if (selectedCombinations.length >= 3) {
      alert('You can only select up to 3 combinations')
      return
    }

    if (!persona || !problem) {
      alert('Please fill in both persona and problem')
      return
    }

    setSelectedCombinations([...selectedCombinations, { persona, problem, custom: true }])
    setStage(STAGES.SELECTOR)
  }

  // Remove combination
  const removeCombo = (index) => {
    setSelectedCombinations(selectedCombinations.filter((_, i) => i !== index))
  }

  // Start answering questions
  const startQuestions = () => {
    if (selectedCombinations.length === 0) {
      alert('Please select at least one persona + problem combination')
      return
    }
    setCurrentComboIndex(0)
    setAnswers({})
    setStage(STAGES.QUESTIONS)
  }

  // Handle option selection in questions
  const handleOptionSelect = (questionId, value) => {
    const comboKey = `combo_${currentComboIndex}`
    const newAnswers = {
      ...answers,
      [comboKey]: {
        ...answers[comboKey],
        [questionId]: value
      }
    }
    setAnswers(newAnswers)
  }

  // Complete current profile and move to next
  const completeCurrentProfile = () => {
    const comboKey = `combo_${currentComboIndex}`
    const currentAnswers = answers[comboKey] || {}

    // Validate all questions answered
    const requiredQuestions = ['pain_level', 'problem_area', 'income_level', 'financial_sunk_cost', 'time_sunk_cost', 'emotion', 'easy_to_target']
    const allAnswered = requiredQuestions.every(q => currentAnswers[q])

    if (!allAnswered) {
      alert('Please answer all questions before continuing')
      return
    }

    const profile = {
      id: currentComboIndex + 1,
      persona: selectedCombinations[currentComboIndex].persona,
      problem: selectedCombinations[currentComboIndex].problem,
      answers: currentAnswers
    }

    const updatedProfiles = [...allProfiles]
    updatedProfiles[currentComboIndex] = profile
    setAllProfiles(updatedProfiles)

    // Move to next combination or success
    if (currentComboIndex < selectedCombinations.length - 1) {
      setCurrentComboIndex(currentComboIndex + 1)
    } else {
      setSelectedProfileId(1) // Default to first profile
      setStage(STAGES.SUCCESS)
    }
  }

  // Save results and transition to PRE-ACTION
  const saveResults = async () => {
    if (!user || !selectedProfileId) return

    setIsLoading(true)
    setError(null)

    try {
      const selectedProfile = allProfiles.find(p => p.id === selectedProfileId)

      // Save to database
      const { error: insertError } = await supabase.from('persona_profiles').insert({
        user_id: user.id,
        persona: selectedProfile.persona,
        problem: selectedProfile.problem,
        pain_level: selectedProfile.answers.pain_level,
        problem_area: selectedProfile.answers.problem_area,
        income_level: selectedProfile.answers.income_level,
        financial_sunk_cost: selectedProfile.answers.financial_sunk_cost,
        time_sunk_cost: selectedProfile.answers.time_sunk_cost,
        emotion: selectedProfile.answers.emotion,
        easy_to_target: selectedProfile.answers.easy_to_target,
        all_profiles: allProfiles,
        selected_profile_id: selectedProfileId
      })

      if (insertError) {
        console.error('Error saving persona profile:', insertError)
        throw insertError
      }

      // Track flow completion
      try {
        await trackFlowCompletion({
          userId: user.id,
          projectId,
          flowType: 'persona_selection'
        })
      } catch (trackingError) {
        console.warn('Flow tracking failed:', trackingError)
      }

      // Complete quest
      try {
        await completeFlowQuest({
          userId: user.id,
          flowId: 'persona_selection',
          pointsEarned: 3
        })
      } catch (questError) {
        console.warn('Quest completion failed:', questError)
      }

      // Transition to PRE-ACTION instead of navigating away
      setStage(STAGES.PRE_ACTION)
      setPreActionStep('feeling')
    } catch (err) {
      setError('Failed to save results. Please try again.')
      console.error('Save error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Save PRE-ACTION pattern data and navigate to validation
  const completePreAction = async () => {
    try {
      // Save resistance pattern data if user experienced resistance
      if (preActionFeeling && preActionFeeling !== 'excited') {
        await supabase.from('flow_sessions').insert({
          user_id: user.id,
          flow_type: 'pre_action_resistance',
          flow_version: 'v1',
          status: 'completed',
          last_step_id: 'pre_action_complete',
          step_data: {
            stage: 1,
            source: 'persona_selection_flow',
            action_type: 'validate_idea',
            pre_feeling: preActionFeeling,
            visibility_layer: visibilityLayer,
            protective_voice: protectiveVoice,
            timestamp: new Date().toISOString()
          }
        })
      }
    } catch (err) {
      console.warn('Pre-action tracking failed:', err)
    }

    navigate('/validation-flows')
  }

  // Handle feeling selection
  const handleFeelingSelect = (feeling) => {
    setPreActionFeeling(feeling)
    if (feeling === 'excited') {
      // Skip to validation directly
      completePreAction()
    } else {
      // Show 2D capture
      setPreActionStep('layer')
    }
  }

  // Handle layer selection
  const handleLayerSelect = (layer) => {
    setVisibilityLayer(layer)
    setPreActionStep('voice')
  }

  // Handle voice selection
  const handleVoiceSelect = (voice) => {
    setProtectiveVoice(voice)
    setPreActionStep('essence')
  }

  // Get desirability color class
  const getDesirabilityClass = (questionId, value) => {
    switch (questionId) {
      case 'pain_level':
        if (value >= 9) return 'desirability-red'
        if (value >= 7) return 'desirability-orange'
        if (value >= 4) return 'desirability-yellow'
        return 'desirability-white'

      case 'problem_area':
        if (value === 'increasing_wealth') return 'desirability-red'
        if (value === 'improving_health') return 'desirability-yellow'
        return 'desirability-white'

      case 'income_level':
        if (value === '$250k+') return 'desirability-red'
        if (value === '$100k–$250k') return 'desirability-orange'
        if (value === '$50k–$100k') return 'desirability-yellow'
        return 'desirability-white'

      case 'financial_sunk_cost':
        if (value === 'None - haven\'t tried anything' || value === 'Minimal ($0-$500)') return 'desirability-red'
        if (value === 'Moderate ($500-$5k)') return 'desirability-yellow'
        return 'desirability-white'

      case 'time_sunk_cost':
        if (value === 'None - haven\'t tried anything') return 'desirability-red'
        if (value === 'Minimal (less than 1 month)') return 'desirability-orange'
        if (value === 'Moderate (1-6 months)') return 'desirability-yellow'
        return 'desirability-white'

      case 'emotion':
        if (value === 'None of the above') return 'desirability-white'
        return 'desirability-orange'

      case 'easy_to_target':
        if (value === 'I\'m confident I could connect with 10+ people') return 'desirability-red'
        if (value === 'Few people come to mind') return 'desirability-yellow'
        if (value === 'Don\'t know anyone off the top of my head') return 'desirability-white'
        return 'desirability-white'

      default:
        return ''
    }
  }

  // Format value for display
  const formatValue = (questionId, value) => {
    if (questionId === 'problem_area') {
      if (value === 'increasing_wealth') return 'Increasing their wealth'
      if (value === 'improving_health') return 'Improving their health'
      if (value === 'loving_life') return 'Loving their life more'
    }
    return value
  }

  // Render stages
  if (stage === STAGES.WELCOME) {
    return (
      <div className="persona-selection-flow">
        <div className="progress-container">
          <div className="progress-dots">
            <div className="progress-dot active"></div>
            <div className="progress-dot"></div>
            <div className="progress-dot"></div>
            <div className="progress-dot"></div>
          </div>
        </div>

        <div className="container welcome-container">
          <div className="welcome-content">
            <h1 className="welcome-greeting">Define Your Ideal Customer</h1>
            <div className="welcome-message">
              <p><strong>Before you build your offer, you need to know exactly who it's for.</strong></p>
              <p>The best offers aren't built for "everyone"—they're laser-focused on a specific person with a specific problem at a specific moment in time.</p>
              <p>You'll select 1-3 persona + problem combinations from your Flow Finder clusters, then answer 7 questions for each to build a complete customer profile.</p>
            </div>
          </div>
          <div className="welcome-bottom">
            <button className="primary-button" onClick={() => setStage(STAGES.SELECTOR)}>
              Start Persona Selection
            </button>
            <p className="attribution-text">
              This framework is based on Alex Hormozi's $100M Offers book and methodology. Find more of his epic acquisition content on IG: 'Hormozi', Podcast: 'The Game with Alex Hormozi', Youtube: AlexHormozi and website: Acquisition.com
            </p>
          </div>
        </div>
      </div>
    )
  }

  // SELECTOR Stage
  if (stage === STAGES.SELECTOR) {
    return (
      <div className="persona-selection-flow">
        <div className="progress-container">
          <div className="progress-dots">
            <div className="progress-dot completed"></div>
            <div className="progress-dot active"></div>
            <div className="progress-dot"></div>
            <div className="progress-dot"></div>
          </div>
        </div>

        <div className="container">
          <h1 className="page-title">Select Your Persona + Problem Combinations</h1>
          <p className="page-subtitle">Choose 1-3 combinations to evaluate (you can add custom ones too)</p>

          {/* Combinations Slider */}
          {hasNikigaiData ? (
            <div className="combinations-slider">
              <div className="combination-card">
                <div className="slider-section">
                  <h3 className="slider-label">Who they are:</h3>
                  <div className="slider-controls">
                    <button
                      className="slider-arrow"
                      onClick={previousPersona}
                      disabled={currentPersonaIndex === 0}
                    >
                      ‹
                    </button>
                    <div className="slider-content">
                      <p className="slider-text">{nikigaiPersonas[currentPersonaIndex]}</p>
                      <p className="slider-counter">{currentPersonaIndex + 1} of {nikigaiPersonas.length}</p>
                    </div>
                    <button
                      className="slider-arrow"
                      onClick={nextPersona}
                      disabled={currentPersonaIndex === nikigaiPersonas.length - 1}
                    >
                      ›
                    </button>
                  </div>
                </div>

                <div className="slider-section">
                  <h3 className="slider-label">What they're struggling with:</h3>
                  <div className="slider-controls">
                    <button
                      className="slider-arrow"
                      onClick={previousProblem}
                      disabled={currentProblemIndex === 0}
                    >
                      ‹
                    </button>
                    <div className="slider-content">
                      <p className="slider-text">{nikigaiProblems[currentProblemIndex]}</p>
                      <p className="slider-counter">{currentProblemIndex + 1} of {nikigaiProblems.length}</p>
                    </div>
                    <button
                      className="slider-arrow"
                      onClick={nextProblem}
                      disabled={currentProblemIndex === nikigaiProblems.length - 1}
                    >
                      ›
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <button className="action-btn action-btn-primary" onClick={addCurrentCombo}>
                    + Add This Combination
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="combinations-slider no-nikigai">
              <div className="combination-card">
                <div className="no-nikigai-content">
                  <div className="no-nikigai-icon">🧭</div>
                  <h3 className="no-nikigai-title">Find Your Flow First</h3>
                  <p className="no-nikigai-text">
                    You haven't completed the Mind Space yet. Complete it to discover your unique persona and problem clusters.
                  </p>
                  <button
                    className="action-btn action-btn-primary"
                    onClick={() => navigate('/mind-space')}
                  >
                    Start Mind Space
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Selected Combinations */}
          {selectedCombinations.length > 0 && (
            <div className="selected-combinations">
              <h3 className="selected-heading">Selected Combinations ({selectedCombinations.length}/3):</h3>
              {selectedCombinations.map((combo, index) => (
                <div key={index} className="selected-combo-item">
                  <div className="selected-combo-content">
                    <p><strong>Persona:</strong> {combo.persona}</p>
                    <p><strong>Problem:</strong> {combo.problem}</p>
                    {combo.custom && <span className="custom-badge">Custom</span>}
                  </div>
                  <button className="remove-btn" onClick={() => removeCombo(index)}>Remove</button>
                </div>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="selector-actions">
            <button
              className="action-btn action-btn-secondary"
              onClick={() => setStage(STAGES.CUSTOM_INPUT)}
            >
              + Add Custom Combination
            </button>
            <button
              className="action-btn action-btn-primary"
              onClick={startQuestions}
              disabled={selectedCombinations.length === 0}
            >
              Continue to Questions
            </button>
            <button
              className="action-btn action-btn-back"
              onClick={() => navigate(-1)}
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  // CUSTOM_INPUT Stage
  if (stage === STAGES.CUSTOM_INPUT) {
    return <CustomInputStage
      setStage={setStage}
      addCustomCombo={addCustomCombo}
      STAGES={STAGES}
    />
  }

  // QUESTIONS Stage
  if (stage === STAGES.QUESTIONS) {
    const currentCombo = selectedCombinations[currentComboIndex]
    const comboKey = `combo_${currentComboIndex}`
    const currentAnswers = answers[comboKey] || {}

    return (
      <div className="persona-selection-flow">
        <div className="progress-container">
          <div className="progress-dots">
            <div className="progress-dot completed"></div>
            <div className="progress-dot completed"></div>
            <div className="progress-dot active"></div>
            <div className="progress-dot"></div>
          </div>
        </div>

        <div className="container">
          <h1 className="page-title">Build Your Customer Persona</h1>
          <p className="page-subtitle">
            Profile {currentComboIndex + 1} of {selectedCombinations.length}: Answer all 7 questions
          </p>

          {/* Current Combination Display */}
          <div className="current-combo-display">
            <p><strong>Persona:</strong> {currentCombo.persona}</p>
            <p><strong>Problem:</strong> {currentCombo.problem}</p>
          </div>

          {/* Question 1: Pain Level */}
          <div className="question-block">
            <div className="question-label">Question 1 of 7</div>
            <h3 className="question-text">How much pain is your target customer experiencing?</h3>
            <p className="question-subtext">Rate out of 10 — don't choose 7</p>
            <div className="horizontal-options compact">
              {[1, 2, 3, 4, 5, 6, 8, 9, 10].map(num => (
                <button
                  key={num}
                  className={`horizontal-option ${currentAnswers.pain_level === num ? 'selected' : ''}`}
                  onClick={() => handleOptionSelect('pain_level', num)}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Question 2: Problem Area */}
          <div className="question-block">
            <div className="question-label">Question 2 of 7</div>
            <h3 className="question-text">Does their problem relate to...</h3>
            <div className="horizontal-options">
              {[
                { value: 'improving_health', label: 'Improving their health' },
                { value: 'increasing_wealth', label: 'Increasing their wealth' },
                { value: 'loving_life', label: 'Loving their life more' }
              ].map(option => (
                <button
                  key={option.value}
                  className={`horizontal-option ${currentAnswers.problem_area === option.value ? 'selected' : ''}`}
                  onClick={() => handleOptionSelect('problem_area', option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Question 3: Income Level */}
          <div className="question-block">
            <div className="question-label">Question 3 of 7</div>
            <h3 className="question-text">How much do they earn?</h3>
            <div className="horizontal-options">
              {['$0–$25k', '$25k–$50k', '$50k–$100k', '$100k–$250k', '$250k+'].map(income => (
                <button
                  key={income}
                  className={`horizontal-option ${currentAnswers.income_level === income ? 'selected' : ''}`}
                  onClick={() => handleOptionSelect('income_level', income)}
                >
                  {income}
                </button>
              ))}
            </div>
          </div>

          {/* Question 4: Financial Sunk Cost */}
          <div className="question-block">
            <div className="question-label">Question 4 of 7</div>
            <h3 className="question-text">How large of a financial sunk cost do they have in their existing solution?</h3>
            <div className="horizontal-options">
              {[
                "None - haven't tried anything",
                'Minimal ($0-$500)',
                'Moderate ($500-$5k)',
                'Significant ($5k-$50k)',
                'Substantial ($50k+)'
              ].map(cost => (
                <button
                  key={cost}
                  className={`horizontal-option ${currentAnswers.financial_sunk_cost === cost ? 'selected' : ''}`}
                  onClick={() => handleOptionSelect('financial_sunk_cost', cost)}
                >
                  {cost}
                </button>
              ))}
            </div>
          </div>

          {/* Question 5: Time Sunk Cost */}
          <div className="question-block">
            <div className="question-label">Question 5 of 7</div>
            <h3 className="question-text">How large of a time sunk cost do they have in their existing solution?</h3>
            <div className="horizontal-options">
              {[
                "None - haven't tried anything",
                'Minimal (less than 1 month)',
                'Moderate (1-6 months)',
                'Significant (6 months-2 years)',
                'Substantial (2+ years)'
              ].map(time => (
                <button
                  key={time}
                  className={`horizontal-option ${currentAnswers.time_sunk_cost === time ? 'selected' : ''}`}
                  onClick={() => handleOptionSelect('time_sunk_cost', time)}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>

          {/* Question 6: Emotion */}
          <div className="question-block">
            <div className="question-label">Question 6 of 7</div>
            <h3 className="question-text">What emotion are they feeling?</h3>
            <div className="horizontal-options">
              {[
                'Shame',
                'Embarrassment',
                'Fear',
                'Frustration',
                'Overwhelm',
                'Anxiety',
                'Sadness',
                'Anger',
                'None of the above'
              ].map(emotion => (
                <button
                  key={emotion}
                  className={`horizontal-option ${currentAnswers.emotion === emotion ? 'selected' : ''}`}
                  onClick={() => handleOptionSelect('emotion', emotion)}
                >
                  {emotion}
                </button>
              ))}
            </div>
          </div>

          {/* Question 7: Easy to Target */}
          <div className="question-block">
            <div className="question-label">Question 7 of 7</div>
            <h3 className="question-text">Are they easy to target?</h3>
            <div className="horizontal-options">
              {[
                'Don\'t know anyone off the top of my head',
                'Few people come to mind',
                'I\'m confident I could connect with 10+ people'
              ].map(option => (
                <button
                  key={option}
                  className={`horizontal-option ${currentAnswers.easy_to_target === option ? 'selected' : ''}`}
                  onClick={() => handleOptionSelect('easy_to_target', option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <button
            className="primary-button"
            onClick={completeCurrentProfile}
          >
            {currentComboIndex < selectedCombinations.length - 1
              ? 'Save & Continue to Next Profile'
              : 'Complete All Profiles'}
          </button>
        </div>
      </div>
    )
  }

  // SUCCESS Stage
  if (stage === STAGES.SUCCESS) {
    return (
      <div className="persona-selection-flow">
        <div className="progress-container">
          <div className="progress-dots">
            <div className="progress-dot completed"></div>
            <div className="progress-dot completed"></div>
            <div className="progress-dot completed"></div>
            <div className="progress-dot active"></div>
          </div>
        </div>

        <div className="container">
          <h1 className="page-title">✓ Persona Profiles Complete!</h1>
          <div className="success-intro">
            <p className="success-text">
              You've defined {allProfiles.length} ideal customer persona{allProfiles.length > 1 ? 's' : ''}, now choose one:
            </p>
            <button
              className="guide-button"
              onClick={() => setShowGuideModal(true)}
            >
              📊 Guide on which persona to pick
            </button>
          </div>

          {/* Profile Cards */}
          <div className="persona-profiles">
            {allProfiles.map((profile) => (
              <div
                key={profile.id}
                className={`persona-profile-card ${selectedProfileId === profile.id ? 'selected-profile' : ''}`}
              >
                <h3 className="profile-number">Profile #{profile.id}</h3>
                <p className="profile-detail"><strong>Persona:</strong> {profile.persona}</p>
                <p className="profile-detail"><strong>Problem:</strong> {profile.problem}</p>
                <p className="profile-detail">
                  • Pain Level: <span className={getDesirabilityClass('pain_level', profile.answers.pain_level)}>
                    {profile.answers.pain_level}/10
                  </span> {profile.answers.pain_level >= 8 ? '(High urgency)' : ''}
                </p>
                <p className="profile-detail">
                  • Problem Relates To: <span className={getDesirabilityClass('problem_area', profile.answers.problem_area)}>
                    {formatValue('problem_area', profile.answers.problem_area)}
                  </span>
                </p>
                <p className="profile-detail">
                  • Income Level: <span className={getDesirabilityClass('income_level', profile.answers.income_level)}>
                    {profile.answers.income_level}
                  </span> annually
                </p>
                <p className="profile-detail">
                  • Financial Sunk Cost: <span className={getDesirabilityClass('financial_sunk_cost', profile.answers.financial_sunk_cost)}>
                    {profile.answers.financial_sunk_cost}
                  </span>
                </p>
                <p className="profile-detail">
                  • Time Sunk Cost: <span className={getDesirabilityClass('time_sunk_cost', profile.answers.time_sunk_cost)}>
                    {profile.answers.time_sunk_cost}
                  </span>
                </p>
                <p className="profile-detail">
                  • Current Emotion: <span className={getDesirabilityClass('emotion', profile.answers.emotion)}>
                    {profile.answers.emotion}
                  </span>
                </p>
                <p className="profile-detail">
                  • Easy to Target: <span className={getDesirabilityClass('easy_to_target', profile.answers.easy_to_target)}>
                    {profile.answers.easy_to_target}
                  </span>
                </p>

                <div className="profile-actions">
                  <button
                    className="profile-action-btn edit-btn"
                    onClick={() => {
                      setCurrentComboIndex(profile.id - 1)
                      setStage(STAGES.QUESTIONS)
                    }}
                  >
                    Edit Profile
                  </button>
                  <button
                    className={`profile-action-btn select-btn ${selectedProfileId === profile.id ? 'selected' : ''}`}
                    onClick={() => setSelectedProfileId(profile.id)}
                  >
                    {selectedProfileId === profile.id ? '✓ Selected' : 'Select'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {error && <p className="error-message">{error}</p>}

          <FlowFeedback flowType="persona_selection" userId={user?.id} />

          <button
            className="primary-button"
            onClick={saveResults}
            disabled={!selectedProfileId || isLoading}
            style={{ marginTop: '24px' }}
          >
            {isLoading ? 'Saving...' : 'Save Results'}
          </button>
        </div>

        {/* Guide Modal */}
        {showGuideModal && (
          <div className="modal-overlay" onClick={() => setShowGuideModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setShowGuideModal(false)}>×</button>
              <h2 className="modal-title">📊 Guide: Choosing the Best Persona</h2>

              <div className="guide-section">
                <h4>How to Read the Color Coding</h4>
                <p>Each answer is color-coded to help you identify the most desirable customer persona for your offer. The colors represent:</p>
                <p className="color-legend">
                  <span className="color-example desirability-white">White</span> = Least desirable<br />
                  <span className="color-example desirability-yellow">Yellow</span> = Moderately desirable<br />
                  <span className="color-example desirability-orange">Orange</span> = Very desirable<br />
                  <span className="color-example desirability-red">Red</span> = Most desirable
                </p>
              </div>

              <div className="guide-section">
                <h4>What Makes a Persona Desirable?</h4>
                <p><strong>High Pain Level (Red = 9-10):</strong> Customers experiencing extreme pain are more motivated to buy and less price-sensitive.</p>
                <p><strong>Wealth-Related Problems (Red):</strong> People solving wealth problems typically have higher budgets and urgency.</p>
                <p><strong>Higher Income (Red = $250k+):</strong> Greater purchasing power and ability to invest in premium solutions.</p>
                <p><strong>Low Sunk Costs (Red):</strong> Haven't invested heavily in failed solutions, so they're more open to new approaches and less skeptical.</p>
                <p><strong>Strong Emotions (Orange):</strong> Awareness of emotional state indicates readiness for change. "None of the above" (white) suggests lack of urgency.</p>
                <p><strong>Easy to Target (Red):</strong> Being able to connect with 10+ people means you have clear access to this market, making customer acquisition easier and cheaper.</p>
              </div>

              <div className="guide-section">
                <h4>How to Choose</h4>
                <p>Look for profiles with more red and orange highlighting. The most desirable persona typically has:</p>
                <ul>
                  <li>High pain level (8-10)</li>
                  <li>Wealth-related problem</li>
                  <li>Higher income level</li>
                  <li>Minimal existing investment (financial and time)</li>
                  <li>Strong emotional awareness</li>
                  <li>Easy to target (you can connect with 10+ people)</li>
                </ul>
                <p>This combination indicates a customer who is desperately seeking a solution, has the means to pay, isn't jaded from previous failures, and is accessible to you.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // PRE_ACTION Stage - Validation prompt with resistance capture
  if (stage === STAGES.PRE_ACTION) {
    const selectedProfile = allProfiles.find(p => p.id === selectedProfileId)

    return (
      <div className="persona-selection-flow pre-action-stage">
        <div className="progress-container">
          <div className="progress-dots">
            <div className="progress-dot completed"></div>
            <div className="progress-dot completed"></div>
            <div className="progress-dot completed"></div>
            <div className="progress-dot completed"></div>
          </div>
        </div>

        <div className="container">
          {/* Confirmation Header */}
          <div className="pre-action-header">
            <h1 className="page-title">✓ Persona Profile Selected!</h1>
            <div className="selected-combo-display">
              <p className="combo-label">Your validated combo:</p>
              <div className="combo-card">
                <span className="combo-persona">{selectedProfile?.persona}</span>
                <span className="combo-divider">×</span>
                <span className="combo-problem">{selectedProfile?.problem}</span>
              </div>
            </div>
          </div>

          <div className="pre-action-divider"></div>

          {/* Next Step Context */}
          {preActionStep === 'feeling' && (
            <div className="pre-action-content animate-fade-in">
              <div className="next-step-intro">
                <h2 className="next-step-title">📋 Your Next Step: Validate With Real People</h2>
                <p className="next-step-description">
                  Before you build anything, you need to confirm this persona + problem resonates with actual potential customers.
                </p>
                <p className="next-step-detail">
                  You'll send a short survey to 3-5 people who fit this profile and ask if this problem is real for them.
                </p>
              </div>

              <div className="pre-action-divider"></div>

              <div className="feeling-check">
                <h3 className="feeling-question">How do you feel about reaching out to validate this?</h3>
                <div className="feeling-options">
                  <button
                    className="feeling-option"
                    onClick={() => handleFeelingSelect('excited')}
                  >
                    <span className="feeling-emoji">😊</span>
                    <span className="feeling-label">Excited</span>
                  </button>
                  <button
                    className="feeling-option"
                    onClick={() => handleFeelingSelect('nervous')}
                  >
                    <span className="feeling-emoji">😰</span>
                    <span className="feeling-label">Nervous</span>
                  </button>
                  <button
                    className="feeling-option"
                    onClick={() => handleFeelingSelect('resistant')}
                  >
                    <span className="feeling-emoji">😤</span>
                    <span className="feeling-label">Resistant</span>
                  </button>
                  <button
                    className="feeling-option"
                    onClick={() => handleFeelingSelect('numb')}
                  >
                    <span className="feeling-emoji">😶</span>
                    <span className="feeling-label">Numb</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Visibility Layer Selection (WHERE) */}
          {preActionStep === 'layer' && (
            <div className="pre-action-content animate-fade-in">
              <div className="resistance-capture">
                <h3 className="resistance-question">Where does this resistance show up?</h3>
                <p className="resistance-subtext">What type of action triggers the feeling?</p>
                <div className="layer-options">
                  {VISIBILITY_LAYERS.map(layer => (
                    <button
                      key={layer.id}
                      className="layer-option"
                      onClick={() => handleLayerSelect(layer.id)}
                    >
                      <span className="layer-icon">{layer.icon}</span>
                      <span className="layer-label">{layer.label}</span>
                      <span className="layer-description">{layer.description}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Protective Voice Selection (HOW) */}
          {preActionStep === 'voice' && (
            <div className="pre-action-content animate-fade-in">
              <div className="resistance-capture">
                <h3 className="resistance-question">Which voice is speaking?</h3>
                <div className="voice-options">
                  {PROTECTIVE_VOICES.map(voice => (
                    <button
                      key={voice.id}
                      className="voice-option"
                      onClick={() => handleVoiceSelect(voice.id)}
                    >
                      <span className="voice-icon">{voice.icon}</span>
                      <span className="voice-label">{voice.label}</span>
                      <span className="voice-description">"{voice.description}"</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Essence Reminder */}
          {preActionStep === 'essence' && (
            <div className="pre-action-content animate-fade-in">
              <div className="essence-reminder">
                <div className="essence-icon">💫</div>
                <h3 className="essence-title">Your essence knows you can do this.</h3>

                <div className="pattern-noticed">
                  <span className="pattern-label">You noticed:</span>
                  <span className="pattern-combo">
                    {PROTECTIVE_VOICES.find(v => v.id === protectiveVoice)?.icon}{' '}
                    {PROTECTIVE_VOICES.find(v => v.id === protectiveVoice)?.label}
                    {' × '}
                    {VISIBILITY_LAYERS.find(l => l.id === visibilityLayer)?.icon}{' '}
                    {VISIBILITY_LAYERS.find(l => l.id === visibilityLayer)?.label}
                  </span>
                </div>

                <p className="essence-message">
                  {getEssenceMessage(protectiveVoice, visibilityLayer)}
                </p>

                <button
                  className="primary-button gold-cta"
                  onClick={completePreAction}
                >
                  Start Validating →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return null
}

// Custom Input Stage Component - Uses Wheel Taxonomy instead of free text
function CustomInputStage({ setStage, addCustomCombo, STAGES }) {
  const [selectedPersona, setSelectedPersona] = useState([])
  const [selectedProblem, setSelectedProblem] = useState([])

  // Format selected items into readable strings
  const formatPersonaString = () => {
    if (selectedPersona.length === 0) return null
    const segment = PERSONA_SEGMENTS.find(s => s.id === selectedPersona[0].id)
    const ring = JOURNEY_STAGES.find(r => r.id === selectedPersona[0].ring)
    if (!segment) return null
    // e.g., "Seekers who are Awakening - lost, direction, purpose"
    return `${segment.displayName} (${ring?.label || 'any stage'}) - ${segment.tagline.toLowerCase()}`
  }

  const formatProblemString = () => {
    if (selectedProblem.length === 0) return null
    const segment = PROBLEM_SEGMENTS.find(s => s.id === selectedProblem[0].id)
    const ring = PROBLEMS_PROFICIENCY_RINGS.find(r => r.id === selectedProblem[0].ring)
    if (!segment) return null
    // e.g., "Physical Vitality (Proven) - helping bodies thrive"
    return `${segment.displayName} (${ring?.label || 'any level'}) - ${segment.tagline.toLowerCase()}`
  }

  const canAdd = selectedPersona.length > 0 && selectedProblem.length > 0

  const handleAddCombo = () => {
    const personaStr = formatPersonaString()
    const problemStr = formatProblemString()
    if (personaStr && problemStr) {
      addCustomCombo(personaStr, problemStr)
      setSelectedPersona([])
      setSelectedProblem([])
    }
  }

  return (
    <div className="persona-selection-flow">
      <div className="progress-container">
        <div className="progress-dots">
          <div className="progress-dot completed"></div>
          <div className="progress-dot active"></div>
          <div className="progress-dot"></div>
          <div className="progress-dot"></div>
        </div>
      </div>

      <div className="container">
        <h1 className="page-title">Add Custom Combination</h1>
        <p className="page-subtitle">Select a persona type and problem domain from the wheel taxonomy</p>

        <div className="custom-input-form wheel-picker-form">
          <div className="wheel-picker-section">
            <WheelPicker
              type="personas"
              max={1}
              selected={selectedPersona}
              onSelect={setSelectedPersona}
            />
          </div>

          <div className="wheel-picker-section">
            <WheelPicker
              type="problems"
              max={1}
              selected={selectedProblem}
              onSelect={setSelectedProblem}
            />
          </div>

          {/* Preview of selection */}
          {canAdd && (
            <div className="selection-preview">
              <h4 className="preview-heading">Your Combination:</h4>
              <div className="preview-item">
                <span className="preview-label">Persona:</span>
                <span className="preview-value">{formatPersonaString()}</span>
              </div>
              <div className="preview-item">
                <span className="preview-label">Problem:</span>
                <span className="preview-value">{formatProblemString()}</span>
              </div>
            </div>
          )}

          <div className="custom-input-actions">
            <button
              className="action-btn action-btn-secondary"
              onClick={() => setStage(STAGES.SELECTOR)}
            >
              Cancel
            </button>
            <button
              className="action-btn action-btn-primary"
              onClick={handleAddCombo}
              disabled={!canAdd}
            >
              Add Combination
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PersonaSelectionFlow
