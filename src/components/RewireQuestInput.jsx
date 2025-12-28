/**
 * RewireQuestInput - Enhanced input component for Rewire quests
 *
 * Handles 6 Rewire quest types with structured data capture for AI co-founder
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
  const [loading, setLoading] = useState(false)
  const [userArchetypes, setUserArchetypes] = useState({ protective: null, essence: null })

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
    showOtherVoices: false,

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

  // Fetch user's archetypes
  useEffect(() => {
    const fetchArchetypes = async () => {
      if (!user?.email) return

      // Use email with ilike for case-insensitive matching (same as Profile.jsx)
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
        // Set default protective voice to user's archetype
        if (data[0].protective_archetype) {
          setFormData(prev => ({ ...prev, protectiveVoice: data[0].protective_archetype }))
        }
      }
    }

    fetchArchetypes()
  }, [user])

  const handleSubmit = () => {
    setLoading(true)

    // Build structured data based on quest type
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

  const isValid = () => {
    switch (quest.id) {
      case 'rewire_behavior_change':
        return formData.autopilotMoment.trim() && formData.consciousShift.trim() && formData.outcome

      case 'rewire_protective_to_essence':
        return formData.protectiveVoice && formData.protectiveMessage.trim() &&
               formData.essenceResponse.trim() && formData.outcome

      case 'rewire_dopamine_diet':
        return formData.fastFoodJoy && formData.nutritiousJoy && formData.outcome

      case 'rewire_future_successful_you':
        return formData.whatYouWerentGoingToDo.trim() && formData.outcome

      case 'rewire_hell_yea':
        return formData.hellYeaType && formData.eventDescription.trim() && formData.whatMadeItHellYea.trim()

      case 'reconnect_groan_wheel':
        return formData.vulnerabilityLayer && formData.fears.length > 0 &&
               formData.action.trim() && formData.intensity && formData.outcome

      default:
        return false
    }
  }

  // Render different forms based on quest type
  const renderForm = () => {
    switch (quest.id) {
      case 'rewire_behavior_change':
        return renderEmbodyEssence()
      case 'rewire_protective_to_essence':
        return renderProtectiveToEssence()
      case 'rewire_dopamine_diet':
        return renderDopamineDiet()
      case 'rewire_future_successful_you':
        return renderFutureSuccessfulYou()
      case 'rewire_hell_yea':
        return renderHellYea()
      case 'reconnect_groan_wheel':
        return renderEssenceVoiceGroan()
      default:
        return null
    }
  }

  // Embody Your Essence
  const renderEmbodyEssence = () => (
    <>
      <div className="rewire-section">
        <label className="rewire-label">The auto-pilot moment</label>
        <textarea
          className="rewire-textarea"
          placeholder="What were you doing on auto-pilot?"
          value={formData.autopilotMoment}
          onChange={(e) => setFormData({ ...formData, autopilotMoment: e.target.value })}
          rows={2}
        />
      </div>

      <div className="rewire-section">
        <label className="rewire-label">How you consciously shifted</label>
        <textarea
          className="rewire-textarea"
          placeholder="What did your essence voice guide you to do instead?"
          value={formData.consciousShift}
          onChange={(e) => setFormData({ ...formData, consciousShift: e.target.value })}
          rows={2}
        />
      </div>

      {renderOutcomeSelector()}
    </>
  )

  // Protective to Essence Shift
  const renderProtectiveToEssence = () => {
    const userVoice = PROTECTIVE_VOICES.find(v => v.id === userArchetypes.protective)
    const otherVoices = PROTECTIVE_VOICES.filter(v => v.id !== userArchetypes.protective)

    return (
      <>
        <div className="rewire-section">
          <label className="rewire-label">Which voice showed up?</label>
          <div className="voice-selector">
            {userVoice && (
              <button
                type="button"
                className={`voice-option primary ${formData.protectiveVoice === userVoice.id ? 'selected' : ''}`}
                onClick={() => setFormData({ ...formData, protectiveVoice: userVoice.id, showOtherVoices: false })}
              >
                <span className="voice-icon">{userVoice.icon}</span>
                <span className="voice-label">{userVoice.label}</span>
              </button>
            )}
            <button
              type="button"
              className={`voice-option other-btn ${formData.showOtherVoices ? 'active' : ''}`}
              onClick={() => setFormData({ ...formData, showOtherVoices: !formData.showOtherVoices })}
            >
              Other
            </button>
          </div>

          {formData.showOtherVoices && (
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
        </div>

        <div className="rewire-section">
          <label className="rewire-label">What was the protective voice saying?</label>
          <textarea
            className="rewire-textarea"
            placeholder="What story or fear was it telling you?"
            value={formData.protectiveMessage}
            onChange={(e) => setFormData({ ...formData, protectiveMessage: e.target.value })}
            rows={2}
          />
        </div>

        <div className="rewire-section">
          <label className="rewire-label">How did you respond from essence?</label>
          <textarea
            className="rewire-textarea"
            placeholder="How did you shift and show up differently?"
            value={formData.essenceResponse}
            onChange={(e) => setFormData({ ...formData, essenceResponse: e.target.value })}
            rows={2}
          />
        </div>

        {renderOutcomeSelector()}
      </>
    )
  }

  // Dopamine Diet Change
  const renderDopamineDiet = () => (
    <>
      <div className="rewire-section">
        <label className="rewire-label">🍟 Fast-food joy you avoided</label>
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

      <div className="rewire-section">
        <label className="rewire-label">🥗 Nutritious joy you chose</label>
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
      </div>

      <div className="rewire-section">
        <label className="rewire-label">Any notes on how it compared?</label>
        <textarea
          className="rewire-textarea"
          placeholder="Optional: How did the nutritious joy compare?"
          value={formData.comparisonNote}
          onChange={(e) => setFormData({ ...formData, comparisonNote: e.target.value })}
          rows={2}
        />
      </div>

      {renderOutcomeSelector()}
    </>
  )

  // Future Successful You
  const renderFutureSuccessfulYou = () => (
    <>
      <div className="rewire-section">
        <label className="rewire-label">What weren't you going to do?</label>
        <textarea
          className="rewire-textarea"
          placeholder="What did future successful you do that present you resisted?"
          value={formData.whatYouWerentGoingToDo}
          onChange={(e) => setFormData({ ...formData, whatYouWerentGoingToDo: e.target.value })}
          rows={3}
        />
      </div>

      {renderOutcomeSelector()}
    </>
  )

  // Make It A Hell Yea
  const renderHellYea = () => (
    <>
      <div className="rewire-section">
        <label className="rewire-label">How did this "Hell Yea" arrive?</label>
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

      <div className="rewire-section">
        <label className="rewire-label">What was the event?</label>
        <textarea
          className="rewire-textarea"
          placeholder="Describe the event or opportunity"
          value={formData.eventDescription}
          onChange={(e) => setFormData({ ...formData, eventDescription: e.target.value })}
          rows={2}
        />
      </div>

      <div className="rewire-section">
        <label className="rewire-label">What made it a "Hell Yea"?</label>
        <textarea
          className="rewire-textarea"
          placeholder="What specifically made this exciting?"
          value={formData.whatMadeItHellYea}
          onChange={(e) => setFormData({ ...formData, whatMadeItHellYea: e.target.value })}
          rows={2}
        />
      </div>
    </>
  )

  // Essence Voice Groan
  const renderEssenceVoiceGroan = () => (
    <>
      <div className="rewire-section">
        <label className="rewire-label">Which vulnerability layer?</label>
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

      <div className="rewire-section">
        <label className="rewire-label">Which fears were present?</label>
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
      </div>

      <div className="rewire-section">
        <label className="rewire-label">What action did you take?</label>
        <textarea
          className="rewire-textarea"
          placeholder="What did your essence voice guide you to do?"
          value={formData.action}
          onChange={(e) => setFormData({ ...formData, action: e.target.value })}
          rows={2}
        />
      </div>

      <div className="rewire-section">
        <label className="rewire-label">How intense was the groan? (1-5)</label>
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
      </div>

      {renderOutcomeSelector()}
    </>
  )

  // Shared outcome selector
  const renderOutcomeSelector = () => (
    <div className="rewire-section">
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
  )

  return (
    <div className="rewire-input">
      {renderForm()}

      <button
        className="rewire-submit-btn"
        onClick={handleSubmit}
        disabled={!isValid() || loading}
      >
        {loading ? 'Saving...' : 'Complete Quest'}
      </button>
    </div>
  )
}

export { REWIRE_QUEST_IDS }
export default RewireQuestInput
