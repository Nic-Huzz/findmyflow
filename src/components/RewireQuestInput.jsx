/**
 * RewireQuestInput - Multi-step input component for Rewire quests
 *
 * Handles 6 Rewire quest types with step-by-step slider UI
 *
 * Refactored to use shared useSteppedForm hook and StepProgress component.
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import { useSteppedForm } from '../hooks/useSteppedForm'
import { StepProgress } from './QuestInputShared'
import { getEssenceDisplayName } from '../lib/essencePreferences'
import { getWeekStartLocal } from '../lib/dateUtils'
import './RewireQuestInput.css'

// Rewire quest IDs
const REWIRE_QUEST_IDS = [
  'rewire_behavior_change',       // Embody Your Essence (archived)
  'rewire_protective_to_essence', // Protective to Essence Shift (archived)
  'rewire_dopamine_diet',         // Dopamine Diet Change (archived)
  'rewire_future_successful_you', // Future Successful You (archived)
  'rewire_hell_yea',              // Make It A Hell Yea (archived)
  'reconnect_groan_wheel',        // Essence Voice Groan
  'rewire_weekly_focus'           // Weekly Focus (intention + daily tracking)
]

// Weekly Focus categories
const FOCUS_CATEGORIES = [
  { id: 'boundary', label: 'Boundary', icon: '🛡️', description: 'Protecting a value', prompt: 'What boundary are you protecting this week? With who or what?' },
  { id: 'behaviour_swap', label: 'Behaviour Swap', icon: '🔄', description: 'Replacing a habit', prompt: 'What are you swapping? From what to what?' },
  { id: 'future_self', label: 'Future Self', icon: '🔮', description: 'Practising who you\'re becoming', prompt: 'What\'s one thing your future self does daily?' },
  { id: 'belief', label: 'Belief', icon: '🧠', description: 'Watching for a pattern', prompt: 'What belief are you watching for this week?' },
  { id: 'expression', label: 'Expression', icon: '🎨', description: 'Creating or speaking truth', prompt: 'What are you creating or expressing this week?' },
]

// Protective voices
const PROTECTIVE_VOICES = [
  { id: 'Controller', label: 'Controller', icon: '🎮' },
  { id: 'Ghost', label: 'Ghost', icon: '👻' },
  { id: 'Perfectionist', label: 'Perfectionist', icon: '🎭' },
  { id: 'Auto-Pilot', label: 'Auto-Pilot', icon: '🛋️' },
  { id: 'People Pleaser', label: 'People Pleaser', icon: '🪞' }
]

// Vulnerability layers
const VULNERABILITY_LAYERS = [
  { id: 1, label: 'Screen', icon: '📱', fullLabel: 'Screen Shield', description: 'Posting content online where strangers can see and judge you' },
  { id: 2, label: 'Live', icon: '⚡', fullLabel: 'Live Wire', description: 'Speaking, presenting, or performing live without the safety of editing' },
  { id: 3, label: 'Tribe', icon: '👥', fullLabel: 'Tribe Test', description: 'Expressing your true identity to people whose opinion matters to you' },
  { id: 4, label: 'Money', icon: '💰', fullLabel: 'Money Edge', description: 'Asking for money, raising prices, or making financial asks' },
  { id: 5, label: 'Heart', icon: '💗', fullLabel: 'Heart Open', description: 'Sharing deep emotions, fears, or vulnerabilities with others' }
]

// Fear trifecta
const FEAR_TRIFECTA = [
  { id: 'judgment', label: 'Judged', icon: '👁️', description: 'What will they think?' },
  { id: 'not_good_enough', label: 'Not Enough', icon: '🎭', description: 'Who am I to do this?' },
  { id: 'failure', label: 'Might Fail', icon: '💥', description: 'What if it doesn\'t work?' }
]

// Fast-food joy options (dopamine hits)
const FAST_FOOD_JOY = [
  { id: 'scrolling', label: 'Scrolling', icon: '📱' },
  { id: 'alcohol', label: 'Alcohol', icon: '🍺' },
  { id: 'tv_streaming', label: 'TV/Streaming', icon: '📺' },
  { id: 'gaming', label: 'Gaming', icon: '🎮' },
  { id: 'junk_food', label: 'Junk Food', icon: '🍟' },
  { id: 'shopping', label: 'Shopping', icon: '🛒' }
]

// Nutritious joy options
const NUTRITIOUS_JOY = [
  { id: 'purposeful_work', label: 'Purposeful Work', icon: '💼' },
  { id: 'exercise', label: 'Exercise', icon: '🏃' },
  { id: 'learning', label: 'Learning', icon: '📚' },
  { id: 'conversation', label: 'Deep Conversation', icon: '💬' },
  { id: 'creative', label: 'Creative Activity', icon: '🎨' },
  { id: 'nature', label: 'Nature Time', icon: '🌿' }
]

// Outcome feelings
const OUTCOME_FEELINGS = [
  { id: 'better', label: 'Better Than Expected', icon: '🌟' },
  { id: 'expected', label: 'As Expected', icon: '✅' },
  { id: 'harder', label: 'Harder Than Expected', icon: '😤' }
]

// Step configurations for each quest type
const STEP_CONFIGS = {
  rewire_behavior_change: { totalSteps: 4, stepTitles: ['Autopilot', 'Shift', 'Outcome', 'Review'] },
  rewire_protective_to_essence: { totalSteps: 4, stepTitles: ['Voice', 'Response', 'Outcome', 'Review'] },
  rewire_dopamine_diet: { totalSteps: 4, stepTitles: ['Avoided', 'Chose', 'Outcome', 'Review'] },
  rewire_future_successful_you: { totalSteps: 3, stepTitles: ['Action', 'Outcome', 'Review'] },
  rewire_hell_yea: { totalSteps: 4, stepTitles: ['Type', 'Event', 'What Made It', 'Review'] },
  reconnect_groan_wheel: { totalSteps: 4, stepTitles: ['Fears & Layer', 'Action', 'Intensity', 'Review'] },
  rewire_weekly_focus: { totalSteps: 3, stepTitles: ['Category', 'Your Intention', 'Confirm'] }
}

// Initial form data
const INITIAL_REWIRE_FORM_DATA = {
  // Common
  situation: '',
  outcome: null,
  // Embody Your Essence
  autopilotMoment: '',
  consciousShift: '',
  // Protective to Essence
  protectiveVoice: null,
  protectiveMessage: '',
  essenceResponse: '',
  // Dopamine Diet
  fastFoodJoy: null,
  nutritiousJoy: null,
  comparisonNote: '',
  // Future Successful You
  whatYouWerentGoingToDo: '',
  vulnerabilityLayer: null,
  // Make It A Hell Yea
  hellYeaType: null,
  eventDescription: '',
  whatMadeItHellYea: '',
  // Essence Voice Groan
  fears: [],
  action: '',
  intensity: null,
  // Weekly Focus
  focusCategory: null,
  focusIntention: '',
  focusDailyReflection: ''
}

function RewireQuestInput({ quest, onComplete }) {
  const { user } = useAuth()
  const [userArchetypes, setUserArchetypes] = useState({ protective: null, essence: null })
  const [showOtherVoices, setShowOtherVoices] = useState(false)

  // Weekly Focus: load this week's intention (if already set)
  const [weeklyFocus, setWeeklyFocus] = useState(null)
  const [focusLoading, setFocusLoading] = useState(quest.id === 'rewire_weekly_focus')

  useEffect(() => {
    if (quest.id !== 'rewire_weekly_focus' || !user?.id) return
    const loadFocus = async () => {
      try {
        const weekStart = getWeekStartLocal()
        const { data } = await supabase
          .from('quest_completions')
          .select('response_data, completed_at')
          .eq('user_id', user.id)
          .eq('quest_id', 'rewire_weekly_focus')
          .gte('completed_at', weekStart)
          .order('completed_at', { ascending: true })
          .limit(1)

        if (data?.[0]?.response_data?.quest_type === 'weekly_focus_setup') {
          setWeeklyFocus(data[0].response_data)
        }
      } catch (e) {
        // Degrade to setup mode on error
      } finally {
        setFocusLoading(false)
      }
    }
    loadFocus()
  }, [quest.id, user?.id])

  const config = STEP_CONFIGS[quest.id] || { totalSteps: 3, stepTitles: ['Input', 'Details', 'Review'] }

  // Validation function
  const validateStep = useCallback((currentStep, data) => {
    switch (quest.id) {
      case 'rewire_behavior_change':
        switch (currentStep) {
          case 1: return data.autopilotMoment.trim().length >= 10
          case 2: return data.consciousShift.trim().length >= 10
          case 3: return data.outcome !== null
          case 4: return true
          default: return false
        }
      case 'rewire_protective_to_essence':
        switch (currentStep) {
          case 1: return data.protectiveVoice !== null && data.protectiveMessage.trim().length >= 10
          case 2: return data.essenceResponse.trim().length >= 10
          case 3: return data.outcome !== null
          case 4: return true
          default: return false
        }
      case 'rewire_dopamine_diet':
        switch (currentStep) {
          case 1: return data.fastFoodJoy !== null
          case 2: return data.nutritiousJoy !== null
          case 3: return data.outcome !== null
          case 4: return true
          default: return false
        }
      case 'rewire_future_successful_you':
        switch (currentStep) {
          case 1: return data.whatYouWerentGoingToDo.trim().length >= 10
          case 2: return data.outcome !== null
          case 3: return true
          default: return false
        }
      case 'rewire_hell_yea':
        switch (currentStep) {
          case 1: return data.hellYeaType !== null
          case 2: return data.eventDescription.trim().length >= 10
          case 3: return data.whatMadeItHellYea.trim().length >= 10
          case 4: return true
          default: return false
        }
      case 'reconnect_groan_wheel':
        switch (currentStep) {
          case 1: return data.vulnerabilityLayer !== null && data.fears.length > 0
          case 2: return data.action.trim().length >= 10
          case 3: return data.intensity !== null && data.outcome !== null
          case 4: return true
          default: return false
        }
      case 'rewire_weekly_focus':
        switch (currentStep) {
          case 1: return data.focusCategory !== null
          case 2: return data.focusIntention.trim().length >= 10
          case 3: return true
          default: return false
        }
      default: return false
    }
  }, [quest.id])

  // Build structured data for submission
  const buildStructuredData = useCallback((data) => {
    switch (quest.id) {
      case 'rewire_behavior_change':
        return {
          quest_type: 'embody_essence',
          autopilot_moment: data.autopilotMoment,
          conscious_shift: data.consciousShift,
          outcome: data.outcome
        }
      case 'rewire_protective_to_essence':
        return {
          quest_type: 'protective_to_essence',
          protective_voice: data.protectiveVoice,
          protective_message: data.protectiveMessage,
          essence_response: data.essenceResponse,
          outcome: data.outcome
        }
      case 'rewire_dopamine_diet':
        return {
          quest_type: 'dopamine_diet',
          fast_food_joy: data.fastFoodJoy,
          nutritious_joy: data.nutritiousJoy,
          comparison_note: data.comparisonNote,
          outcome: data.outcome
        }
      case 'rewire_future_successful_you':
        return {
          quest_type: 'future_successful_you',
          what_you_werent_going_to_do: data.whatYouWerentGoingToDo,
          outcome: data.outcome
        }
      case 'rewire_hell_yea':
        return {
          quest_type: 'hell_yea',
          type: data.hellYeaType,
          event_description: data.eventDescription,
          what_made_it_hell_yea: data.whatMadeItHellYea
        }
      case 'reconnect_groan_wheel':
        return {
          quest_type: 'essence_voice_groan',
          vulnerability_layer: data.vulnerabilityLayer,
          fears: data.fears,
          action: data.action,
          intensity: data.intensity,
          outcome: data.outcome
        }
      case 'rewire_weekly_focus':
        // Daily mode saves differently from setup mode
        if (weeklyFocus) {
          return {
            quest_type: 'weekly_focus_daily',
            focus_category: weeklyFocus.focus_category,
            intention: weeklyFocus.intention,
            honoured: true,
            reflection: data.focusDailyReflection || ''
          }
        }
        return {
          quest_type: 'weekly_focus_setup',
          focus_category: data.focusCategory,
          intention: data.focusIntention
        }
      default:
        return data
    }
  }, [quest.id, weeklyFocus])

  const {
    step,
    formData,
    setFormData,
    isSubmitting,
    isReviewStep,
    totalSteps,
    canContinue,
    handleNext,
    handleBack,
    handleSubmit,
    toggleArrayItem
  } = useSteppedForm({
    totalSteps: config.totalSteps,
    initialData: INITIAL_REWIRE_FORM_DATA,
    validateStep,
    onSubmit: (data) => onComplete(quest, buildStructuredData(data))
  })

  // Fetch user's archetypes
  useEffect(() => {
    const fetchArchetypes = async () => {
      if (!user?.email) return

      const { data } = await supabase
        .from('lead_flow_profiles')
        .select('protective_archetype, essence_archetype, custom_essence_name')
        .ilike('email', user.email)
        .order('created_at', { ascending: false })
        .limit(1)

      if (data && data.length > 0) {
        setUserArchetypes({
          protective: data[0].protective_archetype,
          essence: getEssenceDisplayName(data[0])
        })
        if (data[0].protective_archetype) {
          setFormData(prev => ({ ...prev, protectiveVoice: data[0].protective_archetype }))
        }
      }
    }

    fetchArchetypes()
  }, [user])

  // Helper getters
  const getVoice = (id) => PROTECTIVE_VOICES.find(v => v.id === id)
  const getLayer = (id) => VULNERABILITY_LAYERS.find(l => l.id === id)
  const getFear = (id) => FEAR_TRIFECTA.find(f => f.id === id)
  const getFastFood = (id) => FAST_FOOD_JOY.find(f => f.id === id)
  const getNutritious = (id) => NUTRITIOUS_JOY.find(n => n.id === id)
  const getOutcome = (id) => OUTCOME_FEELINGS.find(o => o.id === id)

  const userVoice = PROTECTIVE_VOICES.find(v => v.id === userArchetypes.protective)
  const otherVoices = PROTECTIVE_VOICES.filter(v => v.id !== userArchetypes.protective)

  // ============ EMBODY YOUR ESSENCE ============
  if (quest.id === 'rewire_behavior_change') {
    return (
      <div className="rewire-input stepped">
        <StepProgress
          currentStep={step}
          totalSteps={totalSteps}
          stepTitle={config.stepTitles[step - 1]}
        />

        {/* Step 1: Autopilot moment */}
        {step === 1 && (
          <div className="step-content">
            <div className="step-header">
              <span className="step-icon">🤖</span>
              <h4>The auto-pilot moment</h4>
            </div>
            <p className="step-description">What were you doing on auto-pilot?</p>
            <textarea
              className="rewire-textarea"
              placeholder="What were you doing on auto-pilot?"
              value={formData.autopilotMoment}
              onChange={(e) => setFormData({ ...formData, autopilotMoment: e.target.value })}
              rows={4}
            />
            <p className={`char-hint ${formData.autopilotMoment.trim().length >= 10 ? 'met' : ''}`}>
              {formData.autopilotMoment.trim().length}/10 characters minimum
            </p>
          </div>
        )}

        {/* Step 2: Conscious shift */}
        {step === 2 && (
          <div className="step-content">
            <div className="step-header">
              <span className="step-icon">✨</span>
              <h4>How you consciously shifted</h4>
            </div>
            <p className="step-description">What did your essence voice guide you to do instead?</p>
            <textarea
              className="rewire-textarea"
              placeholder="What did your essence voice guide you to do instead?"
              value={formData.consciousShift}
              onChange={(e) => setFormData({ ...formData, consciousShift: e.target.value })}
              rows={4}
            />
            <p className={`char-hint ${formData.consciousShift.trim().length >= 10 ? 'met' : ''}`}>
              {formData.consciousShift.trim().length}/10 characters minimum
            </p>
          </div>
        )}

        {/* Step 3: Outcome */}
        {step === 3 && (
          <div className="step-content">
            <div className="step-header">
              <span className="step-icon">🎯</span>
              <h4>How did it go?</h4>
            </div>
            <div className="outcome-selector">
              {OUTCOME_FEELINGS.map(outcome => (
                <button
                  key={outcome.id}
                  type="button"
                  className={`outcome-option ${formData.outcome === outcome.id ? 'selected' : ''}`}
                  onClick={() => setFormData({ ...formData, outcome: outcome.id })}
                >
                  <span className="outcome-icon">{outcome.icon}</span>
                  <span className="outcome-label">{outcome.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Summary */}
        {step === 4 && (
          <div className="step-content">
            <div className="step-header">
              <span className="step-icon">✅</span>
              <h4>Review your reflection</h4>
            </div>
            <div className="selection-summary">
              <div className="summary-item">
                <span className="summary-label">Autopilot:</span>
                <span className="summary-value">{formData.autopilotMoment}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Shift:</span>
                <span className="summary-value">{formData.consciousShift}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Outcome:</span>
                <span className="summary-value">{getOutcome(formData.outcome)?.icon} {getOutcome(formData.outcome)?.label}</span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="step-navigation">
          {step > 1 && (
            <button className="nav-btn back" onClick={handleBack}>← Back</button>
          )}
          {step < totalSteps ? (
            <button className="nav-btn next" onClick={handleNext} disabled={!canContinue()}>
              Continue →
            </button>
          ) : (
            <button className="nav-btn complete" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : `Complete Quest (+${quest.points} pts)`}
            </button>
          )}
        </div>
      </div>
    )
  }

  // ============ PROTECTIVE TO ESSENCE SHIFT ============
  if (quest.id === 'rewire_protective_to_essence') {
    return (
      <div className="rewire-input stepped">
        <StepProgress
          currentStep={step}
          totalSteps={totalSteps}
          stepTitle={config.stepTitles[step - 1]}
        />

        {/* Step 1: Voice selector + Protective message */}
        {step === 1 && (
          <div className="step-content">
            <div className="step-header">
              <span className="step-icon">🛡️</span>
              <h4>Which voice showed up?</h4>
            </div>
            <div className="voice-selector">
              {userVoice && (
                <button
                  type="button"
                  className={`voice-option primary ${formData.protectiveVoice === userVoice.id ? 'selected' : ''}`}
                  onClick={() => {
                    setFormData({ ...formData, protectiveVoice: userVoice.id })
                    setShowOtherVoices(false)
                  }}
                >
                  <span className="voice-icon">{userVoice.icon}</span>
                  <span className="voice-label">{userVoice.label}</span>
                </button>
              )}
              <button
                type="button"
                className={`voice-option other-btn ${showOtherVoices ? 'active' : ''}`}
                onClick={() => setShowOtherVoices(!showOtherVoices)}
              >
                Other ▼
              </button>
            </div>
            {showOtherVoices && (
              <div className="other-voices-grid">
                {otherVoices.map(voice => (
                  <button
                    key={voice.id}
                    type="button"
                    className={`voice-option ${formData.protectiveVoice === voice.id ? 'selected' : ''}`}
                    onClick={() => setFormData({ ...formData, protectiveVoice: voice.id })}
                  >
                    <span className="voice-icon">{voice.icon}</span>
                    <span className="voice-label">{voice.label}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="step-subsection">
              <div className="step-header">
                <span className="step-icon">💬</span>
                <h4>What was the protective voice saying?</h4>
              </div>
              <p className="step-description">What story or fear was it telling you?</p>
              <textarea
                className="rewire-textarea"
                placeholder="What story or fear was it telling you?"
                value={formData.protectiveMessage}
                onChange={(e) => setFormData({ ...formData, protectiveMessage: e.target.value })}
                rows={3}
              />
              <p className={`char-hint ${formData.protectiveMessage.trim().length >= 10 ? 'met' : ''}`}>
                {formData.protectiveMessage.trim().length}/10 characters minimum
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Essence response */}
        {step === 2 && (
          <div className="step-content">
            <div className="step-header">
              <span className="step-icon">✨</span>
              <h4>How did you respond from essence?</h4>
            </div>
            <p className="step-description">How did you shift and show up differently?</p>
            <textarea
              className="rewire-textarea"
              placeholder="How did you shift and show up differently?"
              value={formData.essenceResponse}
              onChange={(e) => setFormData({ ...formData, essenceResponse: e.target.value })}
              rows={4}
            />
            <p className={`char-hint ${formData.essenceResponse.trim().length >= 10 ? 'met' : ''}`}>
              {formData.essenceResponse.trim().length}/10 characters minimum
            </p>
          </div>
        )}

        {/* Step 3: Outcome */}
        {step === 3 && (
          <div className="step-content">
            <div className="step-header">
              <span className="step-icon">🎯</span>
              <h4>How did it go?</h4>
            </div>
            <div className="outcome-selector">
              {OUTCOME_FEELINGS.map(outcome => (
                <button
                  key={outcome.id}
                  type="button"
                  className={`outcome-option ${formData.outcome === outcome.id ? 'selected' : ''}`}
                  onClick={() => setFormData({ ...formData, outcome: outcome.id })}
                >
                  <span className="outcome-icon">{outcome.icon}</span>
                  <span className="outcome-label">{outcome.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Summary */}
        {step === 4 && (
          <div className="step-content">
            <div className="step-header">
              <span className="step-icon">✅</span>
              <h4>Review your reflection</h4>
            </div>
            <div className="selection-summary">
              <div className="summary-item">
                <span className="summary-label">Voice:</span>
                <span className="summary-value">{getVoice(formData.protectiveVoice)?.icon} {getVoice(formData.protectiveVoice)?.label}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Message:</span>
                <span className="summary-value">{formData.protectiveMessage}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Response:</span>
                <span className="summary-value">{formData.essenceResponse}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Outcome:</span>
                <span className="summary-value">{getOutcome(formData.outcome)?.icon} {getOutcome(formData.outcome)?.label}</span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="step-navigation">
          {step > 1 && (
            <button className="nav-btn back" onClick={handleBack}>← Back</button>
          )}
          {step < totalSteps ? (
            <button className="nav-btn next" onClick={handleNext} disabled={!canContinue()}>
              Continue →
            </button>
          ) : (
            <button className="nav-btn complete" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : `Complete Quest (+${quest.points} pts)`}
            </button>
          )}
        </div>
      </div>
    )
  }

  // ============ DOPAMINE DIET CHANGE ============
  if (quest.id === 'rewire_dopamine_diet') {
    return (
      <div className="rewire-input stepped">
        <StepProgress
          currentStep={step}
          totalSteps={totalSteps}
          stepTitle={config.stepTitles[step - 1]}
        />

        {/* Step 1: Fast-food joy */}
        {step === 1 && (
          <div className="step-content">
            <div className="step-header">
              <span className="step-icon">🍟</span>
              <h4>Fast-food joy you avoided</h4>
            </div>
            <p className="step-description">What quick dopamine hit did you resist?</p>
            <div className="joy-grid">
              {FAST_FOOD_JOY.map(joy => (
                <button
                  key={joy.id}
                  type="button"
                  className={`joy-option fast-food ${formData.fastFoodJoy === joy.id ? 'selected' : ''}`}
                  onClick={() => setFormData({ ...formData, fastFoodJoy: joy.id })}
                >
                  <span className="joy-icon">{joy.icon}</span>
                  <span className="joy-label">{joy.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Nutritious joy */}
        {step === 2 && (
          <div className="step-content">
            <div className="step-header">
              <span className="step-icon">🥗</span>
              <h4>Nutritious joy you chose</h4>
            </div>
            <p className="step-description">What nourishing activity did you do instead?</p>
            <div className="joy-grid">
              {NUTRITIOUS_JOY.map(joy => (
                <button
                  key={joy.id}
                  type="button"
                  className={`joy-option nutritious ${formData.nutritiousJoy === joy.id ? 'selected' : ''}`}
                  onClick={() => setFormData({ ...formData, nutritiousJoy: joy.id })}
                >
                  <span className="joy-icon">{joy.icon}</span>
                  <span className="joy-label">{joy.label}</span>
                </button>
              ))}
            </div>
            <div className="step-subsection">
              <label className="rewire-label">Any notes on how it compared? (optional)</label>
              <textarea
                className="rewire-textarea"
                placeholder="How did the nutritious joy compare?"
                value={formData.comparisonNote}
                onChange={(e) => setFormData({ ...formData, comparisonNote: e.target.value })}
                rows={2}
              />
            </div>
          </div>
        )}

        {/* Step 3: Outcome */}
        {step === 3 && (
          <div className="step-content">
            <div className="step-header">
              <span className="step-icon">🎯</span>
              <h4>How did it go?</h4>
            </div>
            <div className="outcome-selector">
              {OUTCOME_FEELINGS.map(outcome => (
                <button
                  key={outcome.id}
                  type="button"
                  className={`outcome-option ${formData.outcome === outcome.id ? 'selected' : ''}`}
                  onClick={() => setFormData({ ...formData, outcome: outcome.id })}
                >
                  <span className="outcome-icon">{outcome.icon}</span>
                  <span className="outcome-label">{outcome.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Summary */}
        {step === 4 && (
          <div className="step-content">
            <div className="step-header">
              <span className="step-icon">✅</span>
              <h4>Review your reflection</h4>
            </div>
            <div className="selection-summary">
              <div className="summary-item">
                <span className="summary-label">Avoided:</span>
                <span className="summary-value">{getFastFood(formData.fastFoodJoy)?.icon} {getFastFood(formData.fastFoodJoy)?.label}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Chose:</span>
                <span className="summary-value">{getNutritious(formData.nutritiousJoy)?.icon} {getNutritious(formData.nutritiousJoy)?.label}</span>
              </div>
              {formData.comparisonNote && (
                <div className="summary-item">
                  <span className="summary-label">Notes:</span>
                  <span className="summary-value">{formData.comparisonNote}</span>
                </div>
              )}
              <div className="summary-item">
                <span className="summary-label">Outcome:</span>
                <span className="summary-value">{getOutcome(formData.outcome)?.icon} {getOutcome(formData.outcome)?.label}</span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="step-navigation">
          {step > 1 && (
            <button className="nav-btn back" onClick={handleBack}>← Back</button>
          )}
          {step < totalSteps ? (
            <button className="nav-btn next" onClick={handleNext} disabled={!canContinue()}>
              Continue →
            </button>
          ) : (
            <button className="nav-btn complete" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : `Complete Quest (+${quest.points} pts)`}
            </button>
          )}
        </div>
      </div>
    )
  }

  // ============ FUTURE SUCCESSFUL YOU ============
  if (quest.id === 'rewire_future_successful_you') {
    return (
      <div className="rewire-input stepped">
        <StepProgress
          currentStep={step}
          totalSteps={totalSteps}
          stepTitle={config.stepTitles[step - 1]}
        />

        {/* Step 1: What you weren't going to do */}
        {step === 1 && (
          <div className="step-content">
            <div className="step-header">
              <span className="step-icon">🚀</span>
              <h4>What weren't you going to do?</h4>
            </div>
            <p className="step-description">What did future successful you do that present you resisted?</p>
            <textarea
              className="rewire-textarea"
              placeholder="What did future successful you do that present you resisted?"
              value={formData.whatYouWerentGoingToDo}
              onChange={(e) => setFormData({ ...formData, whatYouWerentGoingToDo: e.target.value })}
              rows={4}
            />
            <p className={`char-hint ${formData.whatYouWerentGoingToDo.trim().length >= 10 ? 'met' : ''}`}>
              {formData.whatYouWerentGoingToDo.trim().length}/10 characters minimum
            </p>
          </div>
        )}

        {/* Step 2: Outcome */}
        {step === 2 && (
          <div className="step-content">
            <div className="step-header">
              <span className="step-icon">🎯</span>
              <h4>How did it go?</h4>
            </div>
            <div className="outcome-selector">
              {OUTCOME_FEELINGS.map(outcome => (
                <button
                  key={outcome.id}
                  type="button"
                  className={`outcome-option ${formData.outcome === outcome.id ? 'selected' : ''}`}
                  onClick={() => setFormData({ ...formData, outcome: outcome.id })}
                >
                  <span className="outcome-icon">{outcome.icon}</span>
                  <span className="outcome-label">{outcome.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Summary */}
        {step === 3 && (
          <div className="step-content">
            <div className="step-header">
              <span className="step-icon">✅</span>
              <h4>Review your reflection</h4>
            </div>
            <div className="selection-summary">
              <div className="summary-item">
                <span className="summary-label">Action:</span>
                <span className="summary-value">{formData.whatYouWerentGoingToDo}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Outcome:</span>
                <span className="summary-value">{getOutcome(formData.outcome)?.icon} {getOutcome(formData.outcome)?.label}</span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="step-navigation">
          {step > 1 && (
            <button className="nav-btn back" onClick={handleBack}>← Back</button>
          )}
          {step < totalSteps ? (
            <button className="nav-btn next" onClick={handleNext} disabled={!canContinue()}>
              Continue →
            </button>
          ) : (
            <button className="nav-btn complete" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : `Complete Quest (+${quest.points} pts)`}
            </button>
          )}
        </div>
      </div>
    )
  }

  // ============ MAKE IT A HELL YEA ============
  if (quest.id === 'rewire_hell_yea') {
    return (
      <div className="rewire-input stepped">
        <StepProgress
          currentStep={step}
          totalSteps={totalSteps}
          stepTitle={config.stepTitles[step - 1]}
        />

        {/* Step 1: Hell Yea type */}
        {step === 1 && (
          <div className="step-content">
            <div className="step-header">
              <span className="step-icon">🔥</span>
              <h4>How did this "Hell Yea" arrive?</h4>
            </div>
            <div className="hell-yea-type-selector">
              <button
                type="button"
                className={`hell-yea-option ${formData.hellYeaType === 'organic' ? 'selected' : ''}`}
                onClick={() => setFormData({ ...formData, hellYeaType: 'organic' })}
              >
                <span className="hell-yea-icon">🌊</span>
                <span className="hell-yea-label">Organic</span>
                <span className="hell-yea-desc">It flowed into my life</span>
              </button>
              <button
                type="button"
                className={`hell-yea-option ${formData.hellYeaType === 'transformed' ? 'selected' : ''}`}
                onClick={() => setFormData({ ...formData, hellYeaType: 'transformed' })}
              >
                <span className="hell-yea-icon">✨</span>
                <span className="hell-yea-label">Transformed</span>
                <span className="hell-yea-desc">I changed it into one</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Event description */}
        {step === 2 && (
          <div className="step-content">
            <div className="step-header">
              <span className="step-icon">📝</span>
              <h4>What was the event?</h4>
            </div>
            <p className="step-description">Describe the event or opportunity</p>
            <textarea
              className="rewire-textarea"
              placeholder="Describe the event or opportunity"
              value={formData.eventDescription}
              onChange={(e) => setFormData({ ...formData, eventDescription: e.target.value })}
              rows={4}
            />
            <p className={`char-hint ${formData.eventDescription.trim().length >= 10 ? 'met' : ''}`}>
              {formData.eventDescription.trim().length}/10 characters minimum
            </p>
          </div>
        )}

        {/* Step 3: What made it hell yea */}
        {step === 3 && (
          <div className="step-content">
            <div className="step-header">
              <span className="step-icon">⭐</span>
              <h4>What made it a "Hell Yea"?</h4>
            </div>
            <p className="step-description">What specifically made this exciting?</p>
            <textarea
              className="rewire-textarea"
              placeholder="What specifically made this exciting?"
              value={formData.whatMadeItHellYea}
              onChange={(e) => setFormData({ ...formData, whatMadeItHellYea: e.target.value })}
              rows={4}
            />
            <p className={`char-hint ${formData.whatMadeItHellYea.trim().length >= 10 ? 'met' : ''}`}>
              {formData.whatMadeItHellYea.trim().length}/10 characters minimum
            </p>
          </div>
        )}

        {/* Step 4: Summary */}
        {step === 4 && (
          <div className="step-content">
            <div className="step-header">
              <span className="step-icon">✅</span>
              <h4>Review your reflection</h4>
            </div>
            <div className="selection-summary">
              <div className="summary-item">
                <span className="summary-label">Type:</span>
                <span className="summary-value">{formData.hellYeaType === 'organic' ? '🌊 Organic' : '✨ Transformed'}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Event:</span>
                <span className="summary-value">{formData.eventDescription}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">What made it:</span>
                <span className="summary-value">{formData.whatMadeItHellYea}</span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="step-navigation">
          {step > 1 && (
            <button className="nav-btn back" onClick={handleBack}>← Back</button>
          )}
          {step < totalSteps ? (
            <button className="nav-btn next" onClick={handleNext} disabled={!canContinue()}>
              Continue →
            </button>
          ) : (
            <button className="nav-btn complete" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : `Complete Quest (+${quest.points} pts)`}
            </button>
          )}
        </div>
      </div>
    )
  }

  // ============ ESSENCE VOICE GROAN ============
  if (quest.id === 'reconnect_groan_wheel') {
    return (
      <div className="rewire-input stepped">
        <StepProgress
          currentStep={step}
          totalSteps={totalSteps}
          stepTitle={config.stepTitles[step - 1]}
        />

        {/* Step 1: Fears + Vulnerability layer */}
        {step === 1 && (
          <div className="step-content">
            <div className="step-header">
              <span className="step-icon">💭</span>
              <h4>Which fears were present?</h4>
            </div>
            <p className="step-description">Select all that apply</p>
            <div className="fear-grid">
              {FEAR_TRIFECTA.map(fear => (
                <button
                  key={fear.id}
                  type="button"
                  className={`fear-option ${formData.fears.includes(fear.id) ? 'selected' : ''}`}
                  onClick={() => toggleArrayItem('fears', fear.id)}
                >
                  <span className="fear-icon">{fear.icon}</span>
                  <span className="fear-label">{fear.label}</span>
                </button>
              ))}
            </div>

            <div className="step-subsection">
              <div className="step-header">
                <span className="step-icon">🎯</span>
                <h4>Which vulnerability layer?</h4>
              </div>
              <div className="layer-grid">
                {VULNERABILITY_LAYERS.map(layer => (
                  <button
                    key={layer.id}
                    type="button"
                    className={`layer-option ${formData.vulnerabilityLayer === layer.id ? 'selected' : ''}`}
                    onClick={() => setFormData({ ...formData, vulnerabilityLayer: layer.id })}
                  >
                    <span className="layer-icon">{layer.icon}</span>
                    <span className="layer-label">{layer.label}</span>
                  </button>
                ))}
              </div>
              {formData.vulnerabilityLayer && (
                <div className="layer-description">
                  {VULNERABILITY_LAYERS.find(l => l.id === formData.vulnerabilityLayer)?.description}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Action */}
        {step === 2 && (
          <div className="step-content">
            <div className="step-header">
              <span className="step-icon">⚡</span>
              <h4>What action did you take?</h4>
            </div>
            <p className="step-description">What did your essence voice guide you to do?</p>
            <textarea
              className="rewire-textarea"
              placeholder="What did your essence voice guide you to do?"
              value={formData.action}
              onChange={(e) => setFormData({ ...formData, action: e.target.value })}
              rows={4}
            />
            <p className={`char-hint ${formData.action.trim().length >= 10 ? 'met' : ''}`}>
              {formData.action.trim().length}/10 characters minimum
            </p>
          </div>
        )}

        {/* Step 3: Intensity + Outcome */}
        {step === 3 && (
          <div className="step-content">
            <div className="step-header">
              <span className="step-icon">📊</span>
              <h4>How intense was the groan?</h4>
            </div>
            <div className="intensity-slider">
              <span className="intensity-end">😌</span>
              <div className="intensity-buttons">
                {[1, 2, 3, 4, 5].map(level => (
                  <button
                    key={level}
                    type="button"
                    className={`intensity-btn ${formData.intensity === level ? 'selected' : ''}`}
                    onClick={() => setFormData({ ...formData, intensity: level })}
                  >
                    {level}
                  </button>
                ))}
              </div>
              <span className="intensity-end">😰</span>
            </div>

            <div className="step-subsection">
              <label className="rewire-label">How did it go?</label>
              <div className="outcome-selector">
                {OUTCOME_FEELINGS.map(outcome => (
                  <button
                    key={outcome.id}
                    type="button"
                    className={`outcome-option ${formData.outcome === outcome.id ? 'selected' : ''}`}
                    onClick={() => setFormData({ ...formData, outcome: outcome.id })}
                  >
                    <span className="outcome-icon">{outcome.icon}</span>
                    <span className="outcome-label">{outcome.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Summary */}
        {step === 4 && (
          <div className="step-content">
            <div className="step-header">
              <span className="step-icon">✅</span>
              <h4>Review your reflection</h4>
            </div>
            <div className="selection-summary">
              <div className="summary-item">
                <span className="summary-label">Layer:</span>
                <span className="summary-value">{getLayer(formData.vulnerabilityLayer)?.icon} {getLayer(formData.vulnerabilityLayer)?.label}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Fears:</span>
                <span className="summary-value">
                  {formData.fears.map(f => getFear(f)).filter(Boolean).map(f => `${f.icon} ${f.label}`).join(', ')}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Action:</span>
                <span className="summary-value">{formData.action}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Intensity:</span>
                <span className="summary-value">{formData.intensity}/5</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Outcome:</span>
                <span className="summary-value">{getOutcome(formData.outcome)?.icon} {getOutcome(formData.outcome)?.label}</span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="step-navigation">
          {step > 1 && (
            <button className="nav-btn back" onClick={handleBack}>← Back</button>
          )}
          {step < totalSteps ? (
            <button className="nav-btn next" onClick={handleNext} disabled={!canContinue()}>
              Continue →
            </button>
          ) : (
            <button className="nav-btn complete" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : `Complete Quest (+${quest.points} pts)`}
            </button>
          )}
        </div>
      </div>
    )
  }

  // ============ WEEKLY FOCUS QUEST ============
  if (quest.id === 'rewire_weekly_focus') {
    if (focusLoading) {
      return <div className="rewire-input"><p style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem 0' }}>Loading your focus...</p></div>
    }

    // DAILY MODE: intention already set this week
    if (weeklyFocus) {
      const category = FOCUS_CATEGORIES.find(c => c.id === weeklyFocus.focus_category)
      return (
        <div className="rewire-input weekly-focus">
          <div className="focus-daily-card">
            <div className="focus-daily-label">This week's focus</div>
            <div className="focus-daily-intention">{weeklyFocus.intention}</div>
            {category && (
              <div className="focus-daily-category">
                <span>{category.icon}</span>
                <span>{category.label}</span>
              </div>
            )}
          </div>

          <div className="step-subsection">
            <label className="rewire-label">Did you honour this today?</label>
            <textarea
              className="rewire-textarea"
              placeholder="What happened? (optional)"
              value={formData.focusDailyReflection}
              onChange={(e) => setFormData({ ...formData, focusDailyReflection: e.target.value })}
              rows={2}
            />
          </div>

          <div className="step-navigation">
            <button type="button" className="nav-btn complete" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : `Yes, I honoured it (+${quest.points} pts)`}
            </button>
          </div>
        </div>
      )
    }

    // SETUP MODE: no intention set this week
    return (
      <div className="rewire-input stepped weekly-focus">
        <StepProgress
          currentStep={step}
          totalSteps={totalSteps}
          stepTitle={config.stepTitles[step - 1]}
        />

        {/* Step 1: Pick category */}
        {step === 1 && (
          <div className="step-content">
            <div className="step-header">
              <span className="step-icon">🎯</span>
              <h4>What are you working on this week?</h4>
            </div>
            <div className="focus-categories">
              {FOCUS_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  className={`focus-category-btn ${formData.focusCategory === cat.id ? 'selected' : ''}`}
                  onClick={() => setFormData({ ...formData, focusCategory: cat.id })}
                >
                  <span className="focus-category-icon">{cat.icon}</span>
                  <div className="focus-category-text">
                    <span className="focus-category-label">{cat.label}</span>
                    <span className="focus-category-desc">{cat.description}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Get specific */}
        {step === 2 && (
          <div className="step-content">
            <div className="step-header">
              <span className="step-icon">{FOCUS_CATEGORIES.find(c => c.id === formData.focusCategory)?.icon}</span>
              <h4>Get specific</h4>
            </div>
            <p className="step-description">
              {FOCUS_CATEGORIES.find(c => c.id === formData.focusCategory)?.prompt}
            </p>
            <textarea
              className="rewire-textarea"
              placeholder="Be specific — vague intentions get ignored"
              value={formData.focusIntention}
              onChange={(e) => setFormData({ ...formData, focusIntention: e.target.value })}
              rows={3}
            />
            <p className={`char-hint ${formData.focusIntention.trim().length >= 10 ? 'met' : ''}`}>
              {formData.focusIntention.trim().length}/10 characters minimum
            </p>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && (
          <div className="step-content">
            <div className="step-header">
              <span className="step-icon">✅</span>
              <h4>Your focus for this week</h4>
            </div>
            <div className="focus-daily-card">
              <div className="focus-daily-category">
                <span>{FOCUS_CATEGORIES.find(c => c.id === formData.focusCategory)?.icon}</span>
                <span>{FOCUS_CATEGORIES.find(c => c.id === formData.focusCategory)?.label}</span>
              </div>
              <div className="focus-daily-intention" style={{ marginTop: '0.5rem' }}>
                {formData.focusIntention}
              </div>
            </div>
            <p className="step-description" style={{ marginTop: '1rem', fontSize: '0.8125rem', color: '#6b7280' }}>
              You'll see this each day. Track whether you honoured it.
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className="step-navigation">
          {step > 1 && (
            <button type="button" className="nav-btn back" onClick={handleBack}>← Back</button>
          )}
          {step < totalSteps ? (
            <button type="button" className="nav-btn next" onClick={handleNext} disabled={!canContinue()}>
              Continue →
            </button>
          ) : (
            <button type="button" className="nav-btn complete" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : `Set Focus (+${quest.points} pts)`}
            </button>
          )}
        </div>
      </div>
    )
  }

  return null
}

export { REWIRE_QUEST_IDS }
export default RewireQuestInput
