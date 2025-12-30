/**
 * RewireQuestInput - Multi-step input component for Rewire quests
 *
 * Handles 6 Rewire quest types with step-by-step slider UI
 */

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import './RewireQuestInput.css'

// Rewire quest IDs
const REWIRE_QUEST_IDS = [
  'rewire_behavior_change',       // Embody Your Essence
  'rewire_protective_to_essence', // Protective to Essence Shift
  'rewire_dopamine_diet',         // Dopamine Diet Change
  'rewire_future_successful_you', // Future Successful You
  'rewire_hell_yea',              // Make It A Hell Yea
  'reconnect_groan_wheel'         // Essence Voice Groan
]

// Protective voices
const PROTECTIVE_VOICES = [
  { id: 'People Pleaser', label: 'People Pleaser', icon: '😊' },
  { id: 'Performer', label: 'Performer', icon: '🎭' },
  { id: 'Controller', label: 'Controller', icon: '🎯' },
  { id: 'Perfectionist', label: 'Perfectionist', icon: '✨' },
  { id: 'Ghost', label: 'Ghost', icon: '👻' }
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
  { id: 'worthiness', label: 'Not Enough', icon: '🎭', description: 'Who am I to do this?' },
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

function RewireQuestInput({ quest, onComplete }) {
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [userArchetypes, setUserArchetypes] = useState({ protective: null, essence: null })
  const [showOtherVoices, setShowOtherVoices] = useState(false)

  // State for different quest types
  const [formData, setFormData] = useState({
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
    hellYeaType: null, // 'organic' or 'transformed'
    eventDescription: '',
    whatMadeItHellYea: '',

    // Essence Voice Groan
    fears: [],
    action: '',
    intensity: null
  })

  // Get total steps based on quest type
  const getTotalSteps = () => {
    switch (quest.id) {
      case 'rewire_behavior_change': return 4 // Autopilot → Shift → Outcome → Summary
      case 'rewire_protective_to_essence': return 4 // Voice+Message → Response → Outcome → Summary
      case 'rewire_dopamine_diet': return 4 // FastFood → Nutritious → Outcome → Summary
      case 'rewire_future_successful_you': return 3 // Action → Outcome → Summary
      case 'rewire_hell_yea': return 4 // Type → Event → WhatMadeIt → Summary
      case 'reconnect_groan_wheel': return 4 // Fears+Layer → Action → Intensity/Outcome → Summary
      default: return 3
    }
  }

  const totalSteps = getTotalSteps()

  // Fetch user's archetypes
  useEffect(() => {
    const fetchArchetypes = async () => {
      if (!user?.email) return

      const { data } = await supabase
        .from('lead_flow_profiles')
        .select('protective_archetype, essence_archetype')
        .ilike('email', user.email)
        .order('created_at', { ascending: false })
        .limit(1)

      if (data && data.length > 0) {
        setUserArchetypes({
          protective: data[0].protective_archetype,
          essence: data[0].essence_archetype
        })
        if (data[0].protective_archetype) {
          setFormData(prev => ({ ...prev, protectiveVoice: data[0].protective_archetype }))
        }
      }
    }

    fetchArchetypes()
  }, [user])

  const canContinue = () => {
    switch (quest.id) {
      case 'rewire_behavior_change':
        switch (step) {
          case 1: return formData.autopilotMoment.trim().length >= 10
          case 2: return formData.consciousShift.trim().length >= 10
          case 3: return formData.outcome !== null
          case 4: return true
          default: return false
        }

      case 'rewire_protective_to_essence':
        switch (step) {
          case 1: return formData.protectiveVoice !== null && formData.protectiveMessage.trim().length >= 10
          case 2: return formData.essenceResponse.trim().length >= 10
          case 3: return formData.outcome !== null
          case 4: return true
          default: return false
        }

      case 'rewire_dopamine_diet':
        switch (step) {
          case 1: return formData.fastFoodJoy !== null
          case 2: return formData.nutritiousJoy !== null
          case 3: return formData.outcome !== null
          case 4: return true
          default: return false
        }

      case 'rewire_future_successful_you':
        switch (step) {
          case 1: return formData.whatYouWerentGoingToDo.trim().length >= 10
          case 2: return formData.outcome !== null
          case 3: return true
          default: return false
        }

      case 'rewire_hell_yea':
        switch (step) {
          case 1: return formData.hellYeaType !== null
          case 2: return formData.eventDescription.trim().length >= 10
          case 3: return formData.whatMadeItHellYea.trim().length >= 10
          case 4: return true
          default: return false
        }

      case 'reconnect_groan_wheel':
        switch (step) {
          case 1: return formData.vulnerabilityLayer !== null && formData.fears.length > 0
          case 2: return formData.action.trim().length >= 10
          case 3: return formData.intensity !== null && formData.outcome !== null
          case 4: return true
          default: return false
        }

      default: return false
    }
  }

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleSubmit = () => {
    setLoading(true)

    let structuredData = {}

    switch (quest.id) {
      case 'rewire_behavior_change':
        structuredData = {
          quest_type: 'embody_essence',
          autopilot_moment: formData.autopilotMoment,
          conscious_shift: formData.consciousShift,
          outcome: formData.outcome
        }
        break

      case 'rewire_protective_to_essence':
        structuredData = {
          quest_type: 'protective_to_essence',
          protective_voice: formData.protectiveVoice,
          protective_message: formData.protectiveMessage,
          essence_response: formData.essenceResponse,
          outcome: formData.outcome
        }
        break

      case 'rewire_dopamine_diet':
        structuredData = {
          quest_type: 'dopamine_diet',
          fast_food_joy: formData.fastFoodJoy,
          nutritious_joy: formData.nutritiousJoy,
          comparison_note: formData.comparisonNote,
          outcome: formData.outcome
        }
        break

      case 'rewire_future_successful_you':
        structuredData = {
          quest_type: 'future_successful_you',
          what_you_werent_going_to_do: formData.whatYouWerentGoingToDo,
          outcome: formData.outcome
        }
        break

      case 'rewire_hell_yea':
        structuredData = {
          quest_type: 'hell_yea',
          type: formData.hellYeaType,
          event_description: formData.eventDescription,
          what_made_it_hell_yea: formData.whatMadeItHellYea
        }
        break

      case 'reconnect_groan_wheel':
        structuredData = {
          quest_type: 'essence_voice_groan',
          vulnerability_layer: formData.vulnerabilityLayer,
          fears: formData.fears,
          action: formData.action,
          intensity: formData.intensity,
          outcome: formData.outcome
        }
        break
    }

    onComplete(quest, structuredData)
    setLoading(false)
  }

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
        <div className="step-progress">
          <span className="progress-text">Step {step} of {totalSteps}</span>
        </div>

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
            <button className="nav-btn complete" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Saving...' : `Complete Quest (+${quest.points} pts)`}
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
        <div className="step-progress">
          <span className="progress-text">Step {step} of {totalSteps}</span>
        </div>

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
            <button className="nav-btn complete" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Saving...' : `Complete Quest (+${quest.points} pts)`}
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
        <div className="step-progress">
          <span className="progress-text">Step {step} of {totalSteps}</span>
        </div>

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
            <button className="nav-btn complete" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Saving...' : `Complete Quest (+${quest.points} pts)`}
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
        <div className="step-progress">
          <span className="progress-text">Step {step} of {totalSteps}</span>
        </div>

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
            <button className="nav-btn complete" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Saving...' : `Complete Quest (+${quest.points} pts)`}
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
        <div className="step-progress">
          <span className="progress-text">Step {step} of {totalSteps}</span>
        </div>

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
            <button className="nav-btn complete" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Saving...' : `Complete Quest (+${quest.points} pts)`}
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
        <div className="step-progress">
          <span className="progress-text">Step {step} of {totalSteps}</span>
        </div>

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
                  onClick={() => {
                    const newFears = formData.fears.includes(fear.id)
                      ? formData.fears.filter(f => f !== fear.id)
                      : [...formData.fears, fear.id]
                    setFormData({ ...formData, fears: newFears })
                  }}
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
            <button className="nav-btn complete" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Saving...' : `Complete Quest (+${quest.points} pts)`}
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
