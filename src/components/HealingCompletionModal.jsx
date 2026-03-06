import { useState } from 'react'
import RecogniseQuestInput from './RecogniseQuestInput'
import RewireQuestInput from './RewireQuestInput'
import ReconnectQuestInput from './ReconnectQuestInput'
import ReleaseQuestInput from './ReleaseQuestInput'
import './GroanCompletionModal.css'

export default function HealingCompletionModal({ quest, onComplete, onClose }) {
  const [textInput, setTextInput] = useState('')

  const handleComplete = (q, data) => {
    onComplete(q, data)
    onClose()
  }

  const renderInput = () => {
    const type = quest.type?.toLowerCase()
    if (type === 'recognise') {
      return <RecogniseQuestInput quest={quest} onComplete={handleComplete} />
    }
    if (type === 'rewire') {
      return <RewireQuestInput quest={quest} onComplete={handleComplete} />
    }
    if (type === 'reconnect') {
      return <ReconnectQuestInput quest={quest} onComplete={handleComplete} />
    }
    if (type === 'release') {
      return <ReleaseQuestInput quest={quest} onComplete={handleComplete} />
    }

    // Fallback for simple input types (checkbox, text, referral)
    if (quest.inputType === 'checkbox') {
      return (
        <button
          className="gcm-gold-btn"
          onClick={() => handleComplete(quest, 'completed')}
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
          onClick={() => handleComplete(quest, textInput)}
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
        <h2 className="gcm-title">{quest.name}</h2>
        {quest.description && (
          <p className="gcm-desc">{quest.description}</p>
        )}
        <div className="gcm-quest-input">
          {renderInput()}
        </div>
      </div>
    </div>
  )
}
