import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import RecogniseQuestInput from './RecogniseQuestInput'
import RewireQuestInput from './RewireQuestInput'
import ReconnectQuestInput from './ReconnectQuestInput'
import ReleaseQuestInput from './ReleaseQuestInput'
import NervousSystemCheckin from './NervousSystemCheckin'
import './GroanCompletionModal.css'

export default function HealingCompletionModal({ quest, userId, onComplete, onClose }) {
  const [phase, setPhase] = useState('before_checkin') // 'before_checkin' | 'after_checkin' | 'quest_input'
  const [textInput, setTextInput] = useState('')

  // Nervous system state
  const [beforeState, setBeforeState] = useState(null)
  const [afterState, setAfterState] = useState(null)
  const [beforeArchetype, setBeforeArchetype] = useState(null)
  const [afterArchetype, setAfterArchetype] = useState(null)


  const handleQuestDone = (q, data) => {
    onComplete(q, data)
    onClose()
  }

  const handleAfterComplete = async () => {
    // Insert nervous system check-in
    if (userId && beforeState) {
      try {
        await supabase.from('nervous_system_checkins').insert({
          user_id: userId,
          before_state: beforeState,
          after_state: afterState,
          protective_archetype: beforeArchetype || afterArchetype,
          checkin_type: 'healing',
          source_quest_id: quest.id || null,
        })
      } catch (e) {
        console.warn('NS check-in insert error:', e)
      }
    }
    setPhase('quest_input')
  }

  // Quest IDs that have multi-step handlers in their QuestInput components
  const MULTI_STEP_QUEST_IDS = [
    'recognise_protective_observe', 'recognise_essence_observe',
    'recognise_negative_frequency', 'recognise_positive_frequency',
    'recognise_trigger_pattern', 'recognise_body_listen',
  ]

  const renderInput = () => {
    const type = quest.type?.toLowerCase()
    const hasMultiStepHandler = MULTI_STEP_QUEST_IDS.includes(quest.id) || quest.voiceType

    if (type === 'recognise' && hasMultiStepHandler) {
      return <RecogniseQuestInput quest={quest} onComplete={handleQuestDone} />
    }
    if (type === 'rewire') {
      return <RewireQuestInput quest={quest} onComplete={handleQuestDone} />
    }
    if (type === 'reconnect') {
      return <ReconnectQuestInput quest={quest} onComplete={handleQuestDone} />
    }
    if (type === 'release') {
      return <ReleaseQuestInput quest={quest} onComplete={handleQuestDone} />
    }

    // Fallback for simple input types (checkbox, text, referral)
    if (quest.inputType === 'checkbox') {
      return (
        <button
          className="gcm-gold-btn"
          onClick={() => handleQuestDone(quest, 'completed')}
        >
          Mark Complete
        </button>
      )
    }

    // Text / referral input
    return (
      <div className="gcm-simple-input">
        <textarea
          className="gcm-textarea"
          placeholder={quest.placeholder || 'Your response...'}
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          rows={3}
        />
        <button
          className="gcm-gold-btn"
          disabled={!textInput.trim()}
          onClick={() => handleQuestDone(quest, textInput)}
        >
          Complete
        </button>
      </div>
    )
  }

  return (
    <div className="gcm-overlay" onClick={onClose}>
      <div className="gcm-modal gcm-modal-wide" onClick={(e) => e.stopPropagation()}>
        <button className="gcm-close" onClick={onClose}>&times;</button>

        {phase === 'before_checkin' && (
          <>
            <h2 className="gcm-title">{quest.name}</h2>
            {quest.description && <p className="gcm-desc">{quest.description}</p>}
            <NervousSystemCheckin
              mode="before"
              beforeState={beforeState}
              onBeforeChange={setBeforeState}
              protectiveArchetype={beforeArchetype}
              onArchetypeChange={setBeforeArchetype}
              onComplete={() => setPhase('after_checkin')}
            />
          </>
        )}

        {phase === 'quest_input' && (
          <>
            <h2 className="gcm-title">{quest.name}</h2>
            {quest.description && <p className="gcm-desc">{quest.description}</p>}
            <div className="gcm-quest-input">
              {renderInput()}
            </div>
          </>
        )}

        {phase === 'after_checkin' && (
          <>
            <h2 className="gcm-title">How are you feeling now?</h2>
            <NervousSystemCheckin
              mode="after"
              afterState={afterState}
              onAfterChange={setAfterState}
              protectiveArchetype={afterArchetype}
              onArchetypeChange={setAfterArchetype}
              onComplete={handleAfterComplete}
            />
          </>
        )}
      </div>
    </div>
  )
}
