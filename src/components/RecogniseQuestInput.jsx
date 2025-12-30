/**
 * RecogniseQuestInput - Enhanced input component for Recognise quests
 *
 * Handles 4 quest types:
 * - recognise_protective_observe (Protective Voice)
 * - recognise_essence_observe (Essence Voice)
 * - recognise_negative_frequency (Negative Frequency)
 * - recognise_positive_frequency (Positive Frequency)
 */

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import essenceProfiles from '../data/essenceProfiles'
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

function RecogniseQuestInput({ quest, onComplete }) {
  const { user } = useAuth()
  const [userArchetypes, setUserArchetypes] = useState({
    essence: null,
    protective: null
  })
  const [showOtherVoices, setShowOtherVoices] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    // Protective Voice fields
    protective_voice: '',
    fears_triggered: [],
    vulnerability_layer: null,
    intensity: 3,
    situation: '',
    protecting_from: '',
    business_area: null, // Which business area the voice showed up in

    // Essence Voice fields
    expression_type: '',
    alignment: 3,

    // Frequency fields
    frequency: '',
    area_of_life: null,
    frequency_intensity: null,

    // Trigger Pattern fields
    trigger_type: ''
  })

  // Fetch user archetypes on mount
  useEffect(() => {
    const fetchArchetypes = async () => {
      if (!user?.email) return

      // Use email with ilike for case-insensitive matching (same as Profile.jsx)
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
        // Pre-select user's protective voice
        if (data[0].protective_archetype) {
          setFormData(prev => ({ ...prev, protective_voice: data[0].protective_archetype }))
        }
      }
    }

    fetchArchetypes()
  }, [user])

  const handleFearToggle = (fearId) => {
    setFormData(prev => ({
      ...prev,
      fears_triggered: prev.fears_triggered.includes(fearId)
        ? prev.fears_triggered.filter(f => f !== fearId)
        : [...prev.fears_triggered, fearId]
    }))
  }

  const handleSubmit = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)

    try {
      let responseData = {}

      if (quest.id === 'recognise_protective_observe') {
        responseData = {
          protective_voice: formData.protective_voice,
          fears_triggered: formData.fears_triggered,
          vulnerability_layer: formData.vulnerability_layer,
          intensity: formData.intensity,
          business_area: formData.business_area,
          situation: formData.situation
        }
      } else if (quest.id === 'recognise_essence_observe') {
        responseData = {
          essence_archetype: userArchetypes.essence,
          expression_type: formData.expression_type,
          alignment: formData.alignment,
          business_area: formData.business_area,
          situation: formData.situation
        }
      } else if (quest.id === 'recognise_negative_frequency') {
        responseData = {
          frequency: formData.frequency,
          area_of_life: formData.area_of_life,
          intensity: formData.frequency_intensity,
          situation: formData.situation
        }
      } else if (quest.id === 'recognise_positive_frequency') {
        responseData = {
          frequency: formData.frequency,
          area_of_life: formData.area_of_life,
          intensity: formData.frequency_intensity,
          situation: formData.situation
        }
      } else if (quest.id === 'recognise_trigger_pattern') {
        responseData = {
          trigger_type: formData.trigger_type,
          area_of_life: formData.area_of_life,
          intensity: formData.frequency_intensity,
          situation: formData.situation
        }
      }

      await onComplete(quest, JSON.stringify(responseData))
    } catch (error) {
      console.error('Error completing quest:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid = () => {
    if (quest.id === 'recognise_protective_observe') {
      return formData.protective_voice && formData.fears_triggered.length > 0 && formData.situation.trim()
    } else if (quest.id === 'recognise_essence_observe') {
      return formData.expression_type && formData.situation.trim()
    } else if (quest.id === 'recognise_negative_frequency' || quest.id === 'recognise_positive_frequency') {
      return formData.frequency && formData.area_of_life && formData.frequency_intensity && formData.situation.trim()
    } else if (quest.id === 'recognise_trigger_pattern') {
      return formData.trigger_type && formData.area_of_life && formData.frequency_intensity && formData.situation.trim()
    }
    return false
  }

  // Get the other protective voices (not the user's default)
  const otherVoices = PROTECTIVE_VOICES.filter(v => v.id !== userArchetypes.protective)
  const userVoice = PROTECTIVE_VOICES.find(v => v.id === userArchetypes.protective)

  // Render Protective Voice quest
  if (quest.id === 'recognise_protective_observe') {
    return (
      <div className="recognise-input">
        {/* Protective Voice Selector */}
        <div className="recognise-section">
          <label className="recognise-label">Which voice showed up?</label>
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
                  onClick={() => {
                    setFormData(prev => ({ ...prev, protective_voice: voice.id }))
                  }}
                >
                  <span className="voice-icon">{voice.icon}</span>
                  <span className="voice-label">{voice.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Fear Trifecta */}
        <div className="recognise-section">
          <label className="recognise-label">What fear did it trigger? (select all)</label>
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
        </div>

        {/* Vulnerability Layer */}
        <div className="recognise-section">
          <label className="recognise-label">What layer were you in?</label>
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

        {/* Business Area */}
        <div className="recognise-section">
          <label className="recognise-label">Which business area?</label>
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

        {/* Intensity Slider */}
        <div className="recognise-section">
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

        {/* Situation */}
        <div className="recognise-section">
          <label className="recognise-label">What happened?</label>
          <textarea
            className="recognise-textarea"
            placeholder="Describe the situation..."
            value={formData.situation}
            onChange={(e) => setFormData(prev => ({ ...prev, situation: e.target.value }))}
            rows={3}
          />
        </div>

        <button
          className="recognise-submit-btn"
          onClick={handleSubmit}
          disabled={!isFormValid() || isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Complete Quest'}
        </button>
      </div>
    )
  }

  // Render Essence Voice quest
  if (quest.id === 'recognise_essence_observe') {
    const essenceExpressions = [
      { id: 'created', label: 'Created', icon: '🎨' },
      { id: 'connected', label: 'Connected', icon: '🤝' },
      { id: 'led', label: 'Led', icon: '🎯' },
      { id: 'taught', label: 'Taught', icon: '💡' },
      { id: 'inspired', label: 'Inspired', icon: '🔥' },
      { id: 'grew', label: 'Grew', icon: '🌱' }
    ]

    // Find the user's essence profile to get the one-liner
    const userEssenceProfile = essenceProfiles.essence_archetypes?.find(
      p => p.name === userArchetypes.essence
    )

    return (
      <div className="recognise-input">
        {/* Essence Archetype Display */}
        {userArchetypes.essence && (
          <div className="recognise-section essence-display">
            <div className="essence-archetype-name">{userArchetypes.essence}</div>
            {userEssenceProfile?.superpower && (
              <div className="essence-one-liner">{userEssenceProfile.superpower}</div>
            )}
          </div>
        )}

        {/* Business Area */}
        <div className="recognise-section">
          <label className="recognise-label">Which business area?</label>
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

        {/* Situation */}
        <div className="recognise-section">
          <label className="recognise-label">What were you doing?</label>
          <textarea
            className="recognise-textarea"
            placeholder="Describe what you were doing..."
            value={formData.situation}
            onChange={(e) => setFormData(prev => ({ ...prev, situation: e.target.value }))}
            rows={3}
          />
        </div>

        {/* Alignment Slider */}
        <div className="recognise-section">
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

        <button
          className="recognise-submit-btn"
          onClick={handleSubmit}
          disabled={!isFormValid() || isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Complete Quest'}
        </button>
      </div>
    )
  }

  // Render Negative Frequency quest
  if (quest.id === 'recognise_negative_frequency') {
    return (
      <div className="recognise-input">
        {/* Frequency Selector */}
        <div className="recognise-section">
          <label className="recognise-label">I showed up from a place of...</label>
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

        {/* Area of Life */}
        <div className="recognise-section">
          <label className="recognise-label">What area of life?</label>
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
        </div>

        {/* Intensity */}
        <div className="recognise-section">
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

        {/* Situation */}
        <div className="recognise-section">
          <label className="recognise-label">What was the situation?</label>
          <textarea
            className="recognise-textarea"
            placeholder="Describe what happened..."
            value={formData.situation}
            onChange={(e) => setFormData(prev => ({ ...prev, situation: e.target.value }))}
            rows={3}
          />
        </div>

        <button
          className="recognise-submit-btn"
          onClick={handleSubmit}
          disabled={!isFormValid() || isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Complete Quest'}
        </button>
      </div>
    )
  }

  // Render Positive Frequency quest
  if (quest.id === 'recognise_positive_frequency') {
    return (
      <div className="recognise-input">
        {/* Frequency Selector */}
        <div className="recognise-section">
          <label className="recognise-label">I showed up from a place of...</label>
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

        {/* Area of Life */}
        <div className="recognise-section">
          <label className="recognise-label">What area of life?</label>
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
        </div>

        {/* Intensity */}
        <div className="recognise-section">
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

        {/* Situation */}
        <div className="recognise-section">
          <label className="recognise-label">What was the situation?</label>
          <textarea
            className="recognise-textarea"
            placeholder="Describe what happened..."
            value={formData.situation}
            onChange={(e) => setFormData(prev => ({ ...prev, situation: e.target.value }))}
            rows={3}
          />
        </div>

        <button
          className="recognise-submit-btn"
          onClick={handleSubmit}
          disabled={!isFormValid() || isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Complete Quest'}
        </button>
      </div>
    )
  }

  // Render Trigger Pattern quest
  if (quest.id === 'recognise_trigger_pattern') {
    return (
      <div className="recognise-input">
        {/* Trigger Type Selector */}
        <div className="recognise-section">
          <label className="recognise-label">What triggered you?</label>
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

        {/* Area of Life */}
        <div className="recognise-section">
          <label className="recognise-label">What area of life?</label>
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
        </div>

        {/* Intensity */}
        <div className="recognise-section">
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

        {/* Pattern Description */}
        <div className="recognise-section">
          <label className="recognise-label">Describe the trigger pattern</label>
          <textarea
            className="recognise-textarea"
            placeholder="What happened? What pattern do you notice?"
            value={formData.situation}
            onChange={(e) => setFormData(prev => ({ ...prev, situation: e.target.value }))}
            rows={3}
          />
        </div>

        <button
          className="recognise-submit-btn"
          onClick={handleSubmit}
          disabled={!isFormValid() || isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Complete Quest'}
        </button>
      </div>
    )
  }

  return null
}

export default RecogniseQuestInput
