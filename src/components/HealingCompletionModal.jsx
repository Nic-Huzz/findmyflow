import RecogniseQuestInput from './RecogniseQuestInput'
import RewireQuestInput from './RewireQuestInput'
import ReconnectQuestInput from './ReconnectQuestInput'
import ReleaseQuestInput from './ReleaseQuestInput'
import './GroanCompletionModal.css'

export default function HealingCompletionModal({ quest, onComplete, onClose }) {
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
    return null
  }

  return (
    <div className="gcm-overlay" onClick={onClose}>
      <div className="gcm-modal gcm-modal-wide" onClick={(e) => e.stopPropagation()}>
        <button className="gcm-close" onClick={onClose}>&times;</button>
        <h2 className="gcm-title">{quest.name}</h2>
        <div className="gcm-quest-input">
          {renderInput()}
        </div>
      </div>
    </div>
  )
}
