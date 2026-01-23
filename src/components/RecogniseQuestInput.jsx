/**
 * RecogniseQuestInput - Multi-step input component for Recognise quests
 *
 * Handles 5 quest types with step-by-step slider UI:
 * - recognise_protective_observe (Protective Voice)
 * - recognise_essence_observe (Essence Voice)
 * - recognise_negative_frequency (Negative Frequency)
 * - recognise_positive_frequency (Positive Frequency)
 * - recognise_trigger_pattern (Trigger Pattern)
 *
 * Refactored to use shared useSteppedForm hook and StepProgress component.
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import essenceProfiles from '../data/essenceProfiles'
import { useSteppedForm } from '../hooks/useSteppedForm'
import { StepProgress } from './QuestInputShared'
import './RecogniseQuestInput.css'

// Protective voice options
const PROTECTIVE_VOICES = [
  { id: 'People Pleaser', label: 'People Pleaser', icon: '😊' },
  { id: 'Performer', label: 'Performer', icon: '🎭' },
  { id: 'Controller', label: 'Controller', icon: '🎯' },
  { id: 'Perfectionist', label: 'Perfectionist', icon: '✨' },
  { id: 'Ghost', label: 'Ghost', icon: '👻' }
]

// Vulnerability trifecta (fears)
const FEAR_TRIFECTA = [
  { id: 'judgment', label: 'Judged', icon: '👁️', description: 'What will they think?' },
  { id: 'worthiness', label: 'Not Enough', icon: '🎭', description: 'Who am I to do this?' },
  { id: 'failure', label: 'Might Fail', icon: '💥', description: 'What if it doesn\'t work?' }
]

// Vulnerability layers
const VULNERABILITY_LAYERS = [
  { id: 1, label: 'Screen', icon: '📱', fullLabel: 'Screen Shield', description: 'Posting content online where strangers can see and judge you' },
  { id: 2, label: 'Live', icon: '⚡', fullLabel: 'Live Wire', description: 'Speaking, presenting, or performing live without the safety of editing' },
  { id: 3, label: 'Tribe', icon: '👥', fullLabel: 'Tribe Test', description: 'Expressing your true identity to people whose opinion matters to you' },
  { id: 4, label: 'Money', icon: '💰', fullLabel: 'Money Edge', description: 'Asking for money, raising prices, or making financial asks' },
  { id: 5, label: 'Heart', icon: '💗', fullLabel: 'Heart Open', description: 'Sharing deep emotions, fears, or vulnerabilities with others' }
]

// Negative frequency emotions
const NEGATIVE_FREQUENCIES = [
  { id: 'fear', label: 'Fear', icon: '😰', description: 'What if something bad happens?' },
  { id: 'anger', label: 'Anger', icon: '😤', description: 'This isn\'t fair / They\'re wrong' },
  { id: 'shame', label: 'Shame', icon: '😔', description: 'I\'m not good enough' },
  { id: 'guilt', label: 'Guilt', icon: '😞', description: 'I shouldn\'t have / I did something wrong' },
  { id: 'apathy', label: 'Apathy', icon: '😶', description: 'What\'s the point?' },
  { id: 'grief', label: 'Grief', icon: '😢', description: 'I\'ve lost something / This hurts' }
]

// Positive frequency emotions
const POSITIVE_FREQUENCIES = [
  { id: 'love', label: 'Love', icon: '💚', description: 'I genuinely care about this/them' },
  { id: 'courage', label: 'Courage', icon: '🦁', description: 'I\'ll do it even though it\'s scary' },
  { id: 'acceptance', label: 'Acceptance', icon: '😌', description: 'It is what it is, I can work with this' },
  { id: 'gratitude', label: 'Gratitude', icon: '🙏', description: 'I\'m thankful for this moment' },
  { id: 'joy', label: 'Joy', icon: '✨', description: 'This lights me up' },
  { id: 'peace', label: 'Peace', icon: '🕊️', description: 'I\'m calm and centered' }
]

// Areas of life
const AREAS_OF_LIFE = [
  { id: 'work', label: 'Work', icon: '💼' },
  { id: 'relationship', label: 'Relationship', icon: '💕' },
  { id: 'self', label: 'Self', icon: '🪞' },
  { id: 'money', label: 'Money', icon: '💰' },
  { id: 'health', label: 'Health', icon: '🏥' },
  { id: 'family', label: 'Family', icon: '👨‍👩‍👧' }
]

// Business areas where protective/essence voices show up
const BUSINESS_AREAS = [
  { id: 'pricing', label: 'Pricing', icon: '💰', description: 'Setting prices, asking for money' },
  { id: 'visibility_marketing', label: 'Visibility', icon: '📣', description: 'Posting, promoting, being seen' },
  { id: 'sales', label: 'Sales', icon: '🤝', description: 'Pitching, closing deals' },
  { id: 'content_creation', label: 'Content', icon: '✍️', description: 'Creating & sharing expertise' },
  { id: 'client_delivery', label: 'Delivery', icon: '🎯', description: 'Client work, boundaries' },
  { id: 'networking', label: 'Networking', icon: '🌐', description: 'Meeting people, partnerships' }
]

// Trigger types for Trigger Pattern quest
const TRIGGER_TYPES = [
  { id: 'person', label: 'Person', icon: '👤', description: 'Someone triggered a reaction' },
  { id: 'situation', label: 'Situation', icon: '⚡', description: 'A circumstance or event' },
  { id: 'thought', label: 'Thought', icon: '💭', description: 'A thought pattern or belief' },
  { id: 'memory', label: 'Memory', icon: '📸', description: 'A past experience resurfacing' },
  { id: 'environment', label: 'Environment', icon: '🏠', description: 'A place or setting' },
  { id: 'body', label: 'Body', icon: '🫀', description: 'Physical sensation or state' }
]

// Step configurations for each quest type
const STEP_CONFIGS = {
  recognise_protective_observe: { totalSteps: 4, stepTitles: ['Voice & Area', 'Fears & Layer', 'Situation', 'Review'] },
  recognise_essence_observe: { totalSteps: 3, stepTitles: ['Business Area', 'Situation', 'Review'] },
  recognise_negative_frequency: { totalSteps: 3, stepTitles: ['Frequency', 'Details', 'Review'] },
  recognise_positive_frequency: { totalSteps: 3, stepTitles: ['Frequency', 'Details', 'Review'] },
  recognise_trigger_pattern: { totalSteps: 3, stepTitles: ['Trigger Type', 'Details', 'Review'] },
  // Stage-specific voice quests (simplified flows)
  voice_essence: { totalSteps: 2, stepTitles: ['Reflect', 'Review'] },
  voice_protective: { totalSteps: 3, stepTitles: ['Fears', 'Situation', 'Review'] }
}

// Helper to get config key for voice quests
const getConfigKey = (quest) => {
  if (quest.voiceType === 'essence') return 'voice_essence'
  if (quest.voiceType === 'protective') return 'voice_protective'
  return quest.id
}

// Initial form data
const INITIAL_FORM_DATA = {
  // Protective Voice fields
  protective_voice: '',
  fears_triggered: [],
  vulnerability_layer: null,
  intensity: 3,
  situation: '',
  protecting_from: '',
  business_area: null,
  // Essence Voice fields
  expression_type: '',
  alignment: 3,
  // Frequency fields
  frequency: '',
  area_of_life: null,
  frequency_intensity: null,
  // Trigger Pattern fields
  trigger_type: ''
}

function RecogniseQuestInput({ quest, onComplete }) {
  const { user } = useAuth()
  const [userArchetypes, setUserArchetypes] = useState({
    essence: null,
    protective: null
  })
  const [showOtherVoices, setShowOtherVoices] = useState(false)

  // Use voice-specific config or quest.id config
  const configKey = getConfigKey(quest)
  const config = STEP_CONFIGS[configKey] || { totalSteps: 3, stepTitles: ['Input', 'Details', 'Review'] }

  // Check if this is a stage-specific voice quest
  const isVoiceQuest = quest.voiceType === 'essence' || quest.voiceType === 'protective'

  // Validation function
  const validateStep = useCallback((currentStep, data) => {
    // Stage-specific essence voice quest
    if (quest.voiceType === 'essence') {
      switch (currentStep) {
        case 1: return data.situation.trim().length >= 10 && data.alignment !== null
        case 2: return true
        default: return false
      }
    }
    // Stage-specific protective voice quest
    if (quest.voiceType === 'protective') {
      switch (currentStep) {
        case 1: return data.fears_triggered.length > 0
        case 2: return data.situation.trim().length >= 10 && data.intensity !== null
        case 3: return true
        default: return false
      }
    }
    // Original quest types
    if (quest.id === 'recognise_protective_observe') {
      switch (currentStep) {
        case 1: return data.protective_voice && data.business_area !== null
        case 2: return data.fears_triggered.length > 0
        case 3: return data.situation.trim().length >= 10
        case 4: return true
        default: return false
      }
    } else if (quest.id === 'recognise_essence_observe') {
      switch (currentStep) {
        case 1: return data.business_area !== null
        case 2: return data.situation.trim().length >= 10 && data.alignment !== null
        case 3: return true
        default: return false
      }
    } else if (quest.id === 'recognise_negative_frequency' || quest.id === 'recognise_positive_frequency') {
      switch (currentStep) {
        case 1: return data.frequency
        case 2: return data.area_of_life && data.frequency_intensity && data.situation.trim().length >= 10
        case 3: return true
        default: return false
      }
    } else if (quest.id === 'recognise_trigger_pattern') {
      switch (currentStep) {
        case 1: return data.trigger_type
        case 2: return data.area_of_life && data.frequency_intensity && data.situation.trim().length >= 10
        case 3: return true
        default: return false
      }
    }
    return false
  }, [quest.id, quest.voiceType])

  // Build response data for submission
  const buildResponseData = useCallback((data) => {
    // Stage-specific essence voice quest
    if (quest.voiceType === 'essence') {
      return {
        quest_type: 'voice_essence',
        stage: quest.stage_required,
        essence_archetype: quest.archetypeName || userArchetypes.essence,
        alignment: data.alignment,
        situation: data.situation,
        stage_action: quest.stageAction
      }
    }
    // Stage-specific protective voice quest
    if (quest.voiceType === 'protective') {
      return {
        quest_type: 'voice_protective',
        stage: quest.stage_required,
        protective_archetype: quest.archetypeName || userArchetypes.protective,
        fears_triggered: data.fears_triggered,
        intensity: data.intensity,
        situation: data.situation,
        stage_block: quest.stageBlock
      }
    }
    // Original quest types
    if (quest.id === 'recognise_protective_observe') {
      return {
        protective_voice: data.protective_voice,
        fears_triggered: data.fears_triggered,
        vulnerability_layer: data.vulnerability_layer,
        intensity: data.intensity,
        business_area: data.business_area,
        situation: data.situation
      }
    } else if (quest.id === 'recognise_essence_observe') {
      return {
        essence_archetype: userArchetypes.essence,
        expression_type: data.expression_type,
        alignment: data.alignment,
        business_area: data.business_area,
        situation: data.situation
      }
    } else if (quest.id === 'recognise_negative_frequency' || quest.id === 'recognise_positive_frequency') {
      return {
        frequency: data.frequency,
        area_of_life: data.area_of_life,
        intensity: data.frequency_intensity,
        situation: data.situation
      }
    } else if (quest.id === 'recognise_trigger_pattern') {
      return {
        trigger_type: data.trigger_type,
        area_of_life: data.area_of_life,
        intensity: data.frequency_intensity,
        situation: data.situation
      }
    }
    return data
  }, [quest.id, quest.voiceType, quest.stage_required, quest.archetypeName, quest.stageAction, quest.stageBlock, userArchetypes.essence, userArchetypes.protective])

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
    toggleArrayItem
  } = useSteppedForm({
    totalSteps: config.totalSteps,
    initialData: INITIAL_FORM_DATA,
    validateStep,
    onSubmit: async (data) => {
      const responseData = buildResponseData(data)
      await onComplete(quest, JSON.stringify(responseData))
    }
  })

  // Fetch user archetypes on mount
  useEffect(() => {
    const fetchArchetypes = async () => {
      if (!user?.email) return

      const { data, error } = await supabase
        .from('lead_flow_profiles')
        .select('essence_archetype, protective_archetype')
        .ilike('email', user.email)
        .order('created_at', { ascending: false })
        .limit(1)

      if (data && data.length > 0 && !error) {
        setUserArchetypes({
          essence: data[0].essence_archetype,
          protective: data[0].protective_archetype
        })
        if (data[0].protective_archetype) {
          setFormData(prev => ({ ...prev, protective_voice: data[0].protective_archetype }))
        }
      }
    }

    fetchArchetypes()
  }, [user])

  // Handle fear toggle using hook's toggleArrayItem
  const handleFearToggle = (fearId) => {
    toggleArrayItem('fears_triggered', fearId)
  }

  // Submit handler
  const handleSubmit = async () => {
    const responseData = buildResponseData(formData)
    await onComplete(quest, JSON.stringify(responseData))
  }

  // Helper getters
  const getVoice = (id) => PROTECTIVE_VOICES.find(v => v.id === id)
  const getFear = (id) => FEAR_TRIFECTA.find(f => f.id === id)
  const getLayer = (id) => VULNERABILITY_LAYERS.find(l => l.id === id)
  const getArea = (id) => BUSINESS_AREAS.find(a => a.id === id)
  const getLifeArea = (id) => AREAS_OF_LIFE.find(a => a.id === id)
  const getFrequency = (id, isPositive) => (isPositive ? POSITIVE_FREQUENCIES : NEGATIVE_FREQUENCIES).find(f => f.id === id)
  const getTrigger = (id) => TRIGGER_TYPES.find(t => t.id === id)

  const userVoice = PROTECTIVE_VOICES.find(v => v.id === userArchetypes.protective)
  const otherVoices = PROTECTIVE_VOICES.filter(v => v.id !== userArchetypes.protective)
  const userEssenceProfile = essenceProfiles.essence_archetypes?.find(p => p.name === userArchetypes.essence)

  // ============ PROTECTIVE VOICE QUEST ============
  if (quest.id === 'recognise_protective_observe') {
    return (
      <div className="recognise-input stepped">
        <StepProgress
          currentStep={step}
          totalSteps={totalSteps}
          stepTitle={config.stepTitles[step - 1]}
        />

        {/* Step 1: Voice + Business Area */}
        {step === 1 && (
          <div className="step-content">
            <div className="step-header">
              <span className="step-icon">🛡️</span>
              <h4>Which voice showed up?</h4>
            </div>
            <p className="step-description">Which protective voice tried to hold you back?</p>
            <div className="voice-selector">
              {userVoice && (
                <button
                  type="button"
                  className={`voice-option primary ${formData.protective_voice === userVoice.id ? 'selected' : ''}`}
                  onClick={() => {
                    setFormData(prev => ({ ...prev, protective_voice: userVoice.id }))
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
                    className={`voice-option ${formData.protective_voice === voice.id ? 'selected' : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, protective_voice: voice.id }))}
                  >
                    <span className="voice-icon">{voice.icon}</span>
                    <span className="voice-label">{voice.label}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="step-subsection">
              <div className="step-header">
                <span className="step-icon">💼</span>
                <h4>Which business area?</h4>
              </div>
              <div className="business-area-grid">
                {BUSINESS_AREAS.map(area => (
                  <button
                    key={area.id}
                    type="button"
                    className={`area-option ${formData.business_area === area.id ? 'selected' : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, business_area: area.id }))}
                    title={area.description}
                  >
                    <span className="area-icon">{area.icon}</span>
                    <span className="area-label">{area.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Fears + Vulnerability Layer */}
        {step === 2 && (
          <div className="step-content">
            <div className="step-header">
              <span className="step-icon">💭</span>
              <h4>What fear did it trigger?</h4>
            </div>
            <p className="step-description">Select all that apply</p>
            <div className="fear-grid">
              {FEAR_TRIFECTA.map(fear => (
                <button
                  key={fear.id}
                  type="button"
                  className={`fear-option ${formData.fears_triggered.includes(fear.id) ? 'selected' : ''}`}
                  onClick={() => handleFearToggle(fear.id)}
                >
                  <span className="fear-icon">{fear.icon}</span>
                  <span className="fear-label">{fear.label}</span>
                </button>
              ))}
            </div>

            <div className="step-subsection">
              <div className="step-header">
                <span className="step-icon">🎯</span>
                <h4>What layer were you in?</h4>
              </div>
              <p className="step-description">(optional)</p>
              <div className="layer-grid">
                {VULNERABILITY_LAYERS.map(layer => (
                  <button
                    key={layer.id}
                    type="button"
                    className={`layer-option ${formData.vulnerability_layer === layer.id ? 'selected' : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, vulnerability_layer: layer.id }))}
                    title={layer.fullLabel}
                  >
                    <span className="layer-icon">{layer.icon}</span>
                    <span className="layer-label">{layer.label}</span>
                  </button>
                ))}
              </div>
              {formData.vulnerability_layer && (
                <div className="layer-description">
                  {VULNERABILITY_LAYERS.find(l => l.id === formData.vulnerability_layer)?.description}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Situation + Intensity */}
        {step === 3 && (
          <div className="step-content">
            <div className="step-header">
              <span className="step-icon">📝</span>
              <h4>What happened?</h4>
            </div>
            <p className="step-description">Describe the situation where this voice showed up</p>
            <textarea
              className="recognise-textarea"
              placeholder="Describe the situation..."
              value={formData.situation}
              onChange={(e) => setFormData(prev => ({ ...prev, situation: e.target.value }))}
              rows={4}
            />
            <p className={`char-hint ${formData.situation.trim().length >= 10 ? 'met' : ''}`}>
              {formData.situation.trim().length}/10 characters minimum
            </p>

            <div className="step-subsection">
              <label className="recognise-label">How intense was it?</label>
              <div className="intensity-slider">
                <span className="intensity-end">😌</span>
                <div className="intensity-buttons">
                  {[1, 2, 3, 4, 5].map(level => (
                    <button
                      key={level}
                      type="button"
                      className={`intensity-btn ${formData.intensity === level ? 'selected' : ''}`}
                      onClick={() => setFormData(prev => ({ ...prev, intensity: level }))}
                    >
                      {level}
                    </button>
                  ))}
                </div>
                <span className="intensity-end">😰</span>
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
                <span className="summary-label">Voice:</span>
                <span className="summary-value">{getVoice(formData.protective_voice)?.icon} {getVoice(formData.protective_voice)?.label}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Fear(s):</span>
                <span className="summary-value">
                  {formData.fears_triggered.map(f => getFear(f)).filter(Boolean).map(f => `${f.icon} ${f.label}`).join(', ')}
                </span>
              </div>
              {formData.vulnerability_layer && (
                <div className="summary-item">
                  <span className="summary-label">Layer:</span>
                  <span className="summary-value">{getLayer(formData.vulnerability_layer)?.icon} {getLayer(formData.vulnerability_layer)?.label}</span>
                </div>
              )}
              <div className="summary-item">
                <span className="summary-label">Area:</span>
                <span className="summary-value">{getArea(formData.business_area)?.icon} {getArea(formData.business_area)?.label}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Intensity:</span>
                <span className="summary-value">{formData.intensity}/5</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Situation:</span>
                <span className="summary-value">{formData.situation}</span>
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

  // ============ ESSENCE VOICE QUEST ============
  if (quest.id === 'recognise_essence_observe') {
    return (
      <div className="recognise-input stepped">
        <StepProgress
          currentStep={step}
          totalSteps={totalSteps}
          stepTitle={config.stepTitles[step - 1]}
        />

        {/* Step 1: Essence Display + Business Area */}
        {step === 1 && (
          <div className="step-content">
            {userArchetypes.essence && (
              <div className="essence-display">
                <div className="essence-archetype-name">{userArchetypes.essence}</div>
                {userEssenceProfile?.superpower && (
                  <div className="essence-one-liner">{userEssenceProfile.superpower}</div>
                )}
              </div>
            )}
            <div className="step-header">
              <span className="step-icon">💼</span>
              <h4>Which business area?</h4>
            </div>
            <div className="business-area-grid">
              {BUSINESS_AREAS.map(area => (
                <button
                  key={area.id}
                  type="button"
                  className={`area-option ${formData.business_area === area.id ? 'selected' : ''}`}
                  onClick={() => setFormData(prev => ({ ...prev, business_area: area.id }))}
                  title={area.description}
                >
                  <span className="area-icon">{area.icon}</span>
                  <span className="area-label">{area.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Situation + Alignment */}
        {step === 2 && (
          <div className="step-content">
            <div className="step-header">
              <span className="step-icon">📝</span>
              <h4>What were you doing?</h4>
            </div>
            <p className="step-description">Describe how your essence voice showed up</p>
            <textarea
              className="recognise-textarea"
              placeholder="Describe what you were doing..."
              value={formData.situation}
              onChange={(e) => setFormData(prev => ({ ...prev, situation: e.target.value }))}
              rows={4}
            />
            <p className={`char-hint ${formData.situation.trim().length >= 10 ? 'met' : ''}`}>
              {formData.situation.trim().length}/10 characters minimum
            </p>

            <div className="step-subsection">
              <div className="step-header">
                <span className="step-icon">✨</span>
                <h4>How aligned did you feel?</h4>
              </div>
              <div className="intensity-slider">
                <span className="intensity-end">😐</span>
                <div className="intensity-buttons">
                  {[1, 2, 3, 4, 5].map(level => (
                    <button
                      key={level}
                      type="button"
                      className={`intensity-btn ${formData.alignment === level ? 'selected' : ''}`}
                      onClick={() => setFormData(prev => ({ ...prev, alignment: level }))}
                    >
                      {level}
                    </button>
                  ))}
                </div>
                <span className="intensity-end">✨</span>
              </div>
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
              {userArchetypes.essence && (
                <div className="summary-item">
                  <span className="summary-label">Essence:</span>
                  <span className="summary-value">{userArchetypes.essence}</span>
                </div>
              )}
              <div className="summary-item">
                <span className="summary-label">Area:</span>
                <span className="summary-value">{getArea(formData.business_area)?.icon} {getArea(formData.business_area)?.label}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Situation:</span>
                <span className="summary-value">{formData.situation}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Alignment:</span>
                <span className="summary-value">{formData.alignment}/5</span>
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

  // ============ NEGATIVE FREQUENCY QUEST ============
  if (quest.id === 'recognise_negative_frequency') {
    return (
      <div className="recognise-input stepped">
        <StepProgress
          currentStep={step}
          totalSteps={totalSteps}
          stepTitle={config.stepTitles[step - 1]}
        />

        {/* Step 1: Frequency selector */}
        {step === 1 && (
          <div className="step-content">
            <div className="step-header">
              <span className="step-icon">📉</span>
              <h4>I showed up from a place of...</h4>
            </div>
            <div className="frequency-list">
              {NEGATIVE_FREQUENCIES.map(freq => (
                <button
                  key={freq.id}
                  type="button"
                  className={`frequency-option ${formData.frequency === freq.id ? 'selected' : ''}`}
                  onClick={() => setFormData(prev => ({ ...prev, frequency: freq.id }))}
                >
                  <span className="frequency-icon">{freq.icon}</span>
                  <div className="frequency-content">
                    <span className="frequency-label">{freq.label}</span>
                    <span className="frequency-desc">{freq.description}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Area + Intensity + Situation */}
        {step === 2 && (
          <div className="step-content">
            <div className="step-header">
              <span className="step-icon">🎯</span>
              <h4>What area of life?</h4>
            </div>
            <div className="area-of-life-grid">
              {AREAS_OF_LIFE.map(area => (
                <button
                  key={area.id}
                  type="button"
                  className={`area-option ${formData.area_of_life === area.id ? 'selected' : ''}`}
                  onClick={() => setFormData(prev => ({ ...prev, area_of_life: area.id }))}
                >
                  <span className="area-icon">{area.icon}</span>
                  <span className="area-label">{area.label}</span>
                </button>
              ))}
            </div>

            <div className="step-subsection">
              <label className="recognise-label">How intense was it?</label>
              <div className="intensity-slider">
                <span className="intensity-end">😌</span>
                <div className="intensity-buttons">
                  {[1, 2, 3, 4, 5].map(level => (
                    <button
                      key={level}
                      type="button"
                      className={`intensity-btn ${formData.frequency_intensity === level ? 'selected' : ''}`}
                      onClick={() => setFormData(prev => ({ ...prev, frequency_intensity: level }))}
                    >
                      {level}
                    </button>
                  ))}
                </div>
                <span className="intensity-end">😰</span>
              </div>
            </div>

            <div className="step-subsection">
              <div className="step-header">
                <span className="step-icon">📝</span>
                <h4>What was the situation?</h4>
              </div>
              <textarea
                className="recognise-textarea"
                placeholder="Describe what happened..."
                value={formData.situation}
                onChange={(e) => setFormData(prev => ({ ...prev, situation: e.target.value }))}
                rows={3}
              />
              <p className={`char-hint ${formData.situation.trim().length >= 10 ? 'met' : ''}`}>
                {formData.situation.trim().length}/10 characters minimum
              </p>
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
                <span className="summary-label">Frequency:</span>
                <span className="summary-value">{getFrequency(formData.frequency, false)?.icon} {getFrequency(formData.frequency, false)?.label}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Area:</span>
                <span className="summary-value">{getLifeArea(formData.area_of_life)?.icon} {getLifeArea(formData.area_of_life)?.label}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Intensity:</span>
                <span className="summary-value">{formData.frequency_intensity}/5</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Situation:</span>
                <span className="summary-value">{formData.situation}</span>
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

  // ============ POSITIVE FREQUENCY QUEST ============
  if (quest.id === 'recognise_positive_frequency') {
    return (
      <div className="recognise-input stepped">
        <StepProgress
          currentStep={step}
          totalSteps={totalSteps}
          stepTitle={config.stepTitles[step - 1]}
        />

        {/* Step 1: Frequency selector */}
        {step === 1 && (
          <div className="step-content">
            <div className="step-header">
              <span className="step-icon">✨</span>
              <h4>I showed up from a place of...</h4>
            </div>
            <div className="frequency-list">
              {POSITIVE_FREQUENCIES.map(freq => (
                <button
                  key={freq.id}
                  type="button"
                  className={`frequency-option positive ${formData.frequency === freq.id ? 'selected' : ''}`}
                  onClick={() => setFormData(prev => ({ ...prev, frequency: freq.id }))}
                >
                  <span className="frequency-icon">{freq.icon}</span>
                  <div className="frequency-content">
                    <span className="frequency-label">{freq.label}</span>
                    <span className="frequency-desc">{freq.description}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Area + Intensity + Situation */}
        {step === 2 && (
          <div className="step-content">
            <div className="step-header">
              <span className="step-icon">🎯</span>
              <h4>What area of life?</h4>
            </div>
            <div className="area-of-life-grid">
              {AREAS_OF_LIFE.map(area => (
                <button
                  key={area.id}
                  type="button"
                  className={`area-option ${formData.area_of_life === area.id ? 'selected' : ''}`}
                  onClick={() => setFormData(prev => ({ ...prev, area_of_life: area.id }))}
                >
                  <span className="area-icon">{area.icon}</span>
                  <span className="area-label">{area.label}</span>
                </button>
              ))}
            </div>

            <div className="step-subsection">
              <label className="recognise-label">How strong was this feeling?</label>
              <div className="intensity-slider">
                <span className="intensity-end">😌</span>
                <div className="intensity-buttons">
                  {[1, 2, 3, 4, 5].map(level => (
                    <button
                      key={level}
                      type="button"
                      className={`intensity-btn positive ${formData.frequency_intensity === level ? 'selected' : ''}`}
                      onClick={() => setFormData(prev => ({ ...prev, frequency_intensity: level }))}
                    >
                      {level}
                    </button>
                  ))}
                </div>
                <span className="intensity-end">✨</span>
              </div>
            </div>

            <div className="step-subsection">
              <div className="step-header">
                <span className="step-icon">📝</span>
                <h4>What was the situation?</h4>
              </div>
              <textarea
                className="recognise-textarea"
                placeholder="Describe what happened..."
                value={formData.situation}
                onChange={(e) => setFormData(prev => ({ ...prev, situation: e.target.value }))}
                rows={3}
              />
              <p className={`char-hint ${formData.situation.trim().length >= 10 ? 'met' : ''}`}>
                {formData.situation.trim().length}/10 characters minimum
              </p>
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
                <span className="summary-label">Frequency:</span>
                <span className="summary-value">{getFrequency(formData.frequency, true)?.icon} {getFrequency(formData.frequency, true)?.label}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Area:</span>
                <span className="summary-value">{getLifeArea(formData.area_of_life)?.icon} {getLifeArea(formData.area_of_life)?.label}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Intensity:</span>
                <span className="summary-value">{formData.frequency_intensity}/5</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Situation:</span>
                <span className="summary-value">{formData.situation}</span>
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

  // ============ TRIGGER PATTERN QUEST ============
  if (quest.id === 'recognise_trigger_pattern') {
    return (
      <div className="recognise-input stepped">
        <StepProgress
          currentStep={step}
          totalSteps={totalSteps}
          stepTitle={config.stepTitles[step - 1]}
        />

        {/* Step 1: Trigger Type */}
        {step === 1 && (
          <div className="step-content">
            <div className="step-header">
              <span className="step-icon">⚡</span>
              <h4>What triggered you?</h4>
            </div>
            <div className="frequency-list">
              {TRIGGER_TYPES.map(trigger => (
                <button
                  key={trigger.id}
                  type="button"
                  className={`frequency-option ${formData.trigger_type === trigger.id ? 'selected' : ''}`}
                  onClick={() => setFormData(prev => ({ ...prev, trigger_type: trigger.id }))}
                >
                  <span className="frequency-icon">{trigger.icon}</span>
                  <div className="frequency-content">
                    <span className="frequency-label">{trigger.label}</span>
                    <span className="frequency-desc">{trigger.description}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Area + Intensity + Situation */}
        {step === 2 && (
          <div className="step-content">
            <div className="step-header">
              <span className="step-icon">🎯</span>
              <h4>What area of life?</h4>
            </div>
            <div className="area-of-life-grid">
              {AREAS_OF_LIFE.map(area => (
                <button
                  key={area.id}
                  type="button"
                  className={`area-option ${formData.area_of_life === area.id ? 'selected' : ''}`}
                  onClick={() => setFormData(prev => ({ ...prev, area_of_life: area.id }))}
                >
                  <span className="area-icon">{area.icon}</span>
                  <span className="area-label">{area.label}</span>
                </button>
              ))}
            </div>

            <div className="step-subsection">
              <label className="recognise-label">How intense was the reaction?</label>
              <div className="intensity-slider">
                <span className="intensity-end">😌</span>
                <div className="intensity-buttons">
                  {[1, 2, 3, 4, 5].map(level => (
                    <button
                      key={level}
                      type="button"
                      className={`intensity-btn ${formData.frequency_intensity === level ? 'selected' : ''}`}
                      onClick={() => setFormData(prev => ({ ...prev, frequency_intensity: level }))}
                    >
                      {level}
                    </button>
                  ))}
                </div>
                <span className="intensity-end">😰</span>
              </div>
            </div>

            <div className="step-subsection">
              <div className="step-header">
                <span className="step-icon">📝</span>
                <h4>Describe the trigger pattern</h4>
              </div>
              <textarea
                className="recognise-textarea"
                placeholder="What happened? What pattern do you notice?"
                value={formData.situation}
                onChange={(e) => setFormData(prev => ({ ...prev, situation: e.target.value }))}
                rows={3}
              />
              <p className={`char-hint ${formData.situation.trim().length >= 10 ? 'met' : ''}`}>
                {formData.situation.trim().length}/10 characters minimum
              </p>
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
                <span className="summary-label">Trigger:</span>
                <span className="summary-value">{getTrigger(formData.trigger_type)?.icon} {getTrigger(formData.trigger_type)?.label}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Area:</span>
                <span className="summary-value">{getLifeArea(formData.area_of_life)?.icon} {getLifeArea(formData.area_of_life)?.label}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Intensity:</span>
                <span className="summary-value">{formData.frequency_intensity}/5</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Pattern:</span>
                <span className="summary-value">{formData.situation}</span>
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

  // ============ STAGE-SPECIFIC ESSENCE VOICE QUEST ============
  if (quest.voiceType === 'essence') {
    return (
      <div className="recognise-input stepped voice-quest">
        <StepProgress
          currentStep={step}
          totalSteps={totalSteps}
          stepTitle={config.stepTitles[step - 1]}
        />

        {/* Step 1: Reflect on Essence showing up */}
        {step === 1 && (
          <div className="step-content">
            <div className="stage-context-card">
              <span className="stage-icon">{quest.icon}</span>
              <span className="stage-name">Stage {quest.stage_required}</span>
            </div>
            <div className="voice-archetype-card essence">
              <span className="archetype-icon">✨</span>
              <span className="archetype-name">{quest.archetypeName}</span>
            </div>
            <div className="step-header">
              <h4>{quest.description}</h4>
            </div>
            <textarea
              className="recognise-textarea"
              placeholder="Describe how your essence showed up today..."
              value={formData.situation}
              onChange={(e) => setFormData(prev => ({ ...prev, situation: e.target.value }))}
              rows={4}
            />
            <p className={`char-hint ${formData.situation.trim().length >= 10 ? 'met' : ''}`}>
              {formData.situation.trim().length}/10 characters minimum
            </p>

            <div className="step-subsection">
              <label className="recognise-label">How aligned did you feel?</label>
              <div className="intensity-slider">
                <span className="intensity-end">😐</span>
                <div className="intensity-buttons">
                  {[1, 2, 3, 4, 5].map(level => (
                    <button
                      key={level}
                      type="button"
                      className={`intensity-btn ${formData.alignment === level ? 'selected' : ''}`}
                      onClick={() => setFormData(prev => ({ ...prev, alignment: level }))}
                    >
                      {level}
                    </button>
                  ))}
                </div>
                <span className="intensity-end">✨</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Summary */}
        {step === 2 && (
          <div className="step-content">
            <div className="step-header">
              <span className="step-icon">✅</span>
              <h4>Review your reflection</h4>
            </div>
            <div className="selection-summary">
              <div className="summary-item">
                <span className="summary-label">Essence:</span>
                <span className="summary-value">✨ {quest.archetypeName}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Alignment:</span>
                <span className="summary-value">{formData.alignment}/5</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Reflection:</span>
                <span className="summary-value">{formData.situation}</span>
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

  // ============ STAGE-SPECIFIC PROTECTIVE VOICE QUEST ============
  if (quest.voiceType === 'protective') {
    return (
      <div className="recognise-input stepped voice-quest">
        <StepProgress
          currentStep={step}
          totalSteps={totalSteps}
          stepTitle={config.stepTitles[step - 1]}
        />

        {/* Step 1: Select Fears */}
        {step === 1 && (
          <div className="step-content">
            <div className="stage-context-card">
              <span className="stage-icon">{quest.icon}</span>
              <span className="stage-name">Stage {quest.stage_required}</span>
            </div>
            <div className="voice-archetype-card protective">
              <span className="archetype-icon">🛡️</span>
              <span className="archetype-name">{quest.archetypeName}</span>
            </div>
            <div className="step-header">
              <h4>{quest.description}</h4>
            </div>
            <p className="step-description">Which fears came up?</p>
            <div className="fear-trifecta">
              {FEAR_TRIFECTA.map(fear => (
                <button
                  key={fear.id}
                  type="button"
                  className={`fear-btn ${formData.fears_triggered.includes(fear.id) ? 'selected' : ''}`}
                  onClick={() => handleFearToggle(fear.id)}
                >
                  <span className="fear-icon">{fear.icon}</span>
                  <span className="fear-label">{fear.label}</span>
                  <span className="fear-desc">{fear.description}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Describe situation */}
        {step === 2 && (
          <div className="step-content">
            <div className="step-header">
              <span className="step-icon">📝</span>
              <h4>Describe the situation</h4>
            </div>
            <textarea
              className="recognise-textarea"
              placeholder="What happened? How did your protective voice show up?"
              value={formData.situation}
              onChange={(e) => setFormData(prev => ({ ...prev, situation: e.target.value }))}
              rows={4}
            />
            <p className={`char-hint ${formData.situation.trim().length >= 10 ? 'met' : ''}`}>
              {formData.situation.trim().length}/10 characters minimum
            </p>

            <div className="step-subsection">
              <label className="recognise-label">How intense was it?</label>
              <div className="intensity-slider">
                <span className="intensity-end">😌</span>
                <div className="intensity-buttons">
                  {[1, 2, 3, 4, 5].map(level => (
                    <button
                      key={level}
                      type="button"
                      className={`intensity-btn ${formData.intensity === level ? 'selected' : ''}`}
                      onClick={() => setFormData(prev => ({ ...prev, intensity: level }))}
                    >
                      {level}
                    </button>
                  ))}
                </div>
                <span className="intensity-end">😰</span>
              </div>
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
                <span className="summary-label">Voice:</span>
                <span className="summary-value">🛡️ {quest.archetypeName}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Fears:</span>
                <span className="summary-value">
                  {formData.fears_triggered.map(id => getFear(id)?.label).join(', ')}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Intensity:</span>
                <span className="summary-value">{formData.intensity}/5</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Situation:</span>
                <span className="summary-value">{formData.situation}</span>
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

  return null
}

export default RecogniseQuestInput
