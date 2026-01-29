/**
 * PreActionModal - Resistance capture BEFORE starting action milestones
 *
 * Shows before completing specific milestones to capture:
 * - How they feel about starting
 * - Where resistance shows up (visibility layer)
 * - How resistance sounds (protective voice)
 * - Essence message to support them
 *
 * Part of the Action Loop system.
 */

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../lib/supabaseClient'
import './PreActionModal.css'

// Milestones that trigger PRE-ACTION
export const PRE_ACTION_MILESTONE_IDS = [
  'milestone_sales_copy_created'
]

// Contextual info based on milestone type
const MILESTONE_CONTEXT = {
  milestone_sales_copy_created: {
    title: 'Sales Page Copy',
    action: 'writing your sales copy',
    nextStep: 'Create compelling copy that converts'
  }
}

// Visibility layers (WHERE resistance shows up)
const VISIBILITY_LAYERS = [
  { id: 'screen', icon: '📱', label: 'Screen', description: 'Putting myself out there where people can see and judge me' },
  { id: 'live', icon: '⚡', label: 'Live', description: 'Doing something in real-time where I can\'t edit or take it back' },
  { id: 'vulnerable', icon: '💗', label: 'Vulnerable', description: 'Showing something unfinished or admitting I need help' },
  { id: 'money', icon: '💰', label: 'Money', description: 'Asking someone to pay me or stating my price' },
  { id: 'authority', icon: '👑', label: 'Authority', description: 'Claiming expertise or positioning myself as someone to follow' }
]

// Protective voices (HOW resistance sounds)
const PROTECTIVE_VOICES = [
  { id: 'perfectionist', icon: '🎭', label: 'Perfectionist', description: 'It needs to be perfect before I can share it' },
  { id: 'people_pleaser', icon: '🤝', label: 'People Pleaser', description: 'I don\'t want to bother or burden anyone' },
  { id: 'controller', icon: '🎛️', label: 'Controller', description: 'I can\'t control how they\'ll respond' },
  { id: 'performer', icon: '🎪', label: 'Performer', description: 'I need to have more figured out first' },
  { id: 'ghost', icon: '👻', label: 'Ghost', description: 'I\'d rather stay quiet than risk rejection' }
]

// Essence messages based on voice + layer
const getEssenceMessage = (voice, layer) => {
  const messages = {
    'perfectionist_screen': 'Your Perfectionist wants the copy perfect before anyone sees it. But real feedback shapes better copy than endless editing.',
    'perfectionist_money': 'Your Perfectionist wants the pricing language just right. But clarity beats perfection every time.',
    'perfectionist_authority': 'Your Perfectionist wants more credentials before claiming expertise. But your experience is already valuable.',
    'perfectionist_vulnerable': 'Your Perfectionist doesn\'t want to show unfinished work. But done is better than perfect.',
    'perfectionist_live': 'Your Perfectionist fears typos or mistakes. But you can always edit later.',
    'people_pleaser_screen': 'Your People Pleaser worries about being "salesy." But helping people find solutions is generous.',
    'people_pleaser_money': 'Your People Pleaser feels uncomfortable stating prices. But clear pricing respects everyone\'s time.',
    'people_pleaser_authority': 'Your People Pleaser worries about seeming arrogant. But sharing expertise is service.',
    'people_pleaser_vulnerable': 'Your People Pleaser doesn\'t want to impose. But people are looking for what you offer.',
    'people_pleaser_live': 'Your People Pleaser fears disappointing someone. But you can\'t help everyone.',
    'controller_screen': 'Your Controller can\'t predict how people will respond. But every response teaches you something.',
    'controller_money': 'Your Controller fears rejection. But every "no" brings clarity.',
    'controller_authority': 'Your Controller wants guaranteed results. But authority is built through action.',
    'controller_vulnerable': 'Your Controller wants certainty first. But writing creates clarity.',
    'controller_live': 'Your Controller wants to script every outcome. But real insights come from real responses.',
    'performer_screen': 'Your Performer wants a bigger audience first. But great copy works at any scale.',
    'performer_money': 'Your Performer wants more success stories. But you start with one.',
    'performer_authority': 'Your Performer needs more validation. But validation comes from shipping.',
    'performer_vulnerable': 'Your Performer feels unqualified. But writing builds confidence.',
    'performer_live': 'Your Performer wants to prove expertise first. But writing IS proving expertise.',
    'ghost_screen': 'Your Ghost wants to stay invisible. But your offer deserves to be seen.',
    'ghost_money': 'Your Ghost avoids asking for money. But fair exchange is claiming your worth.',
    'ghost_authority': 'Your Ghost shrinks from claiming expertise. But quiet authority is still authority.',
    'ghost_vulnerable': 'Your Ghost says it\'s safer to stay hidden. But connection requires visibility.',
    'ghost_live': 'Your Ghost prefers the safety of silence. But your voice matters.'
  }
  const key = `${voice}_${layer}`
  return messages[key] || 'Your protective pattern is trying to keep you safe. But you don\'t need protection from helping people.'
}

function PreActionModal({ quest, userId, onProceed, onCancel }) {
  const [step, setStep] = useState('feeling') // feeling | layer | voice | essence
  const [feeling, setFeeling] = useState(null)
  const [visibilityLayer, setVisibilityLayer] = useState(null)
  const [protectiveVoice, setProtectiveVoice] = useState(null)

  const context = MILESTONE_CONTEXT[quest.id] || {
    title: quest.name,
    action: 'completing this task',
    nextStep: 'Complete the task'
  }

  const handleFeelingSelect = (selectedFeeling) => {
    setFeeling(selectedFeeling)
    if (selectedFeeling === 'excited' || selectedFeeling === 'ready') {
      // Skip 2D capture for positive feelings
      handleSaveAndProceed(selectedFeeling, null, null)
    } else {
      setStep('layer')
    }
  }

  const handleLayerSelect = (layer) => {
    setVisibilityLayer(layer)
    setStep('voice')
  }

  const handleVoiceSelect = (voice) => {
    setProtectiveVoice(voice)
    setStep('essence')

    // Save to database
    if (userId) {
      supabase.from('pre_action_captures').insert({
        user_id: userId,
        action_type: `milestone_${quest.id}`,
        flow_type: 'milestone',
        feeling: feeling,
        visibility_layer: visibilityLayer,
        protective_voice: voice
      }).then(({ error }) => {
        if (error) console.warn('PRE-ACTION save failed:', error)
      })
    }
  }

  const handleSaveAndProceed = async (f = feeling, l = visibilityLayer, v = protectiveVoice) => {
    if (userId && f) {
      await supabase.from('pre_action_captures').insert({
        user_id: userId,
        action_type: `milestone_${quest.id}`,
        flow_type: 'milestone',
        feeling: f,
        visibility_layer: l,
        protective_voice: v
      })
    }
    onProceed?.()
  }

  return createPortal(
    <div className="pre-action-overlay">
      <div className="pre-action-modal">
        <div className="pre-action-modal-header">
          <span className="pre-action-modal-icon">🎯</span>
          <h2>{context.title}</h2>
          <p className="pre-action-modal-subtitle">Before you start...</p>
        </div>

        <div className="pre-action-modal-content">
          {step === 'feeling' && (
            <div className="pre-action-modal-step">
              <h3>How do you feel about {context.action}?</h3>
              <div className="pre-action-modal-options">
                <button className="pre-action-modal-option positive" onClick={() => handleFeelingSelect('excited')}>
                  <span className="option-icon">🔥</span>
                  <span className="option-label">Excited</span>
                  <span className="option-desc">Let's do this!</span>
                </button>
                <button className="pre-action-modal-option positive" onClick={() => handleFeelingSelect('ready')}>
                  <span className="option-icon">✅</span>
                  <span className="option-label">Ready</span>
                  <span className="option-desc">Feeling prepared</span>
                </button>
                <button className="pre-action-modal-option negative" onClick={() => handleFeelingSelect('nervous')}>
                  <span className="option-icon">😰</span>
                  <span className="option-label">Nervous</span>
                  <span className="option-desc">A bit anxious</span>
                </button>
                <button className="pre-action-modal-option negative" onClick={() => handleFeelingSelect('resistant')}>
                  <span className="option-icon">🛑</span>
                  <span className="option-label">Resistant</span>
                  <span className="option-desc">Feeling blocked</span>
                </button>
              </div>
              <button className="pre-action-modal-skip" onClick={onCancel}>
                Cancel
              </button>
            </div>
          )}

          {step === 'layer' && (
            <div className="pre-action-modal-step">
              <h3>What specifically feels hard?</h3>
              <p className="pre-action-modal-hint">Select where the resistance shows up...</p>
              <div className="pre-action-modal-layers">
                {VISIBILITY_LAYERS.map(layer => (
                  <button key={layer.id} className="pre-action-modal-layer" onClick={() => handleLayerSelect(layer.id)}>
                    <span className="layer-icon">{layer.icon}</span>
                    <div className="layer-text">
                      <span className="layer-label">{layer.label}</span>
                      <span className="layer-desc">{layer.description}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 'voice' && (
            <div className="pre-action-modal-step">
              <h3>What's the voice saying?</h3>
              <p className="pre-action-modal-hint">Choose the one that sounds most familiar...</p>
              <div className="pre-action-modal-voices">
                {PROTECTIVE_VOICES.map(voice => (
                  <button key={voice.id} className="pre-action-modal-voice" onClick={() => handleVoiceSelect(voice.id)}>
                    <span className="voice-icon">{voice.icon}</span>
                    <div className="voice-text">
                      <span className="voice-label">{voice.label}</span>
                      <span className="voice-desc">{voice.description}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 'essence' && (
            <div className="pre-action-modal-step essence-step">
              <div className="essence-badge">
                <span>{PROTECTIVE_VOICES.find(v => v.id === protectiveVoice)?.icon}</span>
                <span>×</span>
                <span>{VISIBILITY_LAYERS.find(l => l.id === visibilityLayer)?.icon}</span>
              </div>
              <div className="essence-message">
                <p>{getEssenceMessage(protectiveVoice, visibilityLayer)}</p>
              </div>
              <div className="essence-affirmation">
                <p><strong>Your essence knows:</strong> You have something valuable to share. Start imperfectly.</p>
              </div>
              <button className="pre-action-modal-proceed" onClick={() => handleSaveAndProceed()}>
                I'm Ready to Start
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

export default PreActionModal
