import { useState } from 'react'

const QUICK_REACTIONS = [
  { id: 'too_formal', label: 'too formal', defaultCategory: 'tone' },
  { id: 'not_my_voice', label: 'not my voice', defaultCategory: 'tone' },
  { id: 'love_this', label: 'love this', defaultCategory: 'brand' },
  { id: 'needs_groan', label: 'needs groan', defaultCategory: 'structure' },
  { id: 'add_story', label: 'add story', defaultCategory: 'structure' },
  { id: 'wrong_word', label: 'wrong word', defaultCategory: 'word_choice' },
]

const CATEGORIES = ['tone', 'word_choice', 'structure', 'content', 'brand']

export default function CommentPopover({ position, selectedText, onSave, onCancel, onMouseEnter, onMouseLeave }) {
  // Lock selection on touch devices too (onMouseEnter doesn't fire on mobile)
  const handleTouchStart = () => onMouseEnter?.()

  const [quickReaction, setQuickReaction] = useState(null)
  const [category, setCategory] = useState(null)
  const [comment, setComment] = useState('')

  const handleQuickReaction = (reaction) => {
    setQuickReaction(reaction.id === quickReaction ? null : reaction.id)
    if (!category) setCategory(reaction.defaultCategory)
  }

  const handleSave = () => {
    if (!category) return
    onSave({
      highlightedText: selectedText,
      comment: comment.trim() || null,
      quickReaction,
      category,
    })
  }

  const canSave = category !== null

  return (
    <div
      className="cr-popover"
      style={{ top: position.top, left: position.left }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onTouchStart={handleTouchStart}
    >
      <div className="cr-popover-selected">"{selectedText.length > 60 ? selectedText.slice(0, 60) + '...' : selectedText}"</div>

      <div className="cr-popover-section">
        <div className="cr-popover-label">Quick reaction</div>
        <div className="cr-popover-chips">
          {QUICK_REACTIONS.map(r => (
            <button
              key={r.id}
              className={`cr-chip ${quickReaction === r.id ? 'cr-chip--active' : ''}`}
              onClick={() => handleQuickReaction(r)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="cr-popover-section">
        <div className="cr-popover-label">Category</div>
        <div className="cr-popover-chips">
          {CATEGORIES.map(c => (
            <button
              key={c}
              className={`cr-chip cr-chip--cat ${category === c ? 'cr-chip--active' : ''}`}
              onClick={() => setCategory(c)}
            >
              {c.replaceAll('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="cr-popover-section">
        <input
          type="text"
          className="cr-popover-input"
          placeholder="Add a note (optional)"
          value={comment}
          onChange={e => setComment(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && canSave) handleSave() }}
        />
      </div>

      <div className="cr-popover-actions">
        <button className="cr-btn cr-btn--save" onClick={handleSave} disabled={!canSave}>
          Save
        </button>
        <button className="cr-btn cr-btn--cancel" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  )
}
