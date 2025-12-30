/**
 * ZarloQuickReplies - Button options for user responses
 */

function ZarloQuickReplies({ options, onSelect, disabled = false }) {
  if (!options || options.length === 0) return null

  return (
    <div className="zarlo-quick-replies">
      {options.map((option) => (
        <button
          key={option.id}
          className="zarlo-quick-reply"
          onClick={() => onSelect(option)}
          disabled={disabled}
        >
          {option.icon && <span className="zarlo-quick-reply-icon">{option.icon}</span>}
          <span className="zarlo-quick-reply-label">{option.label}</span>
        </button>
      ))}
    </div>
  )
}

export default ZarloQuickReplies
