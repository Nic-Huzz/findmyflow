/**
 * EssenceAvatarPanel - Conversation interface for the Essence Avatar
 *
 * Shows: figurine header, intelligence progress bar, streaming messages, input.
 * Opened when user taps the floating widget.
 */

import { useState, useRef, useEffect } from 'react'

export default function EssenceAvatarPanel({
  figurineUrl,
  archetypeName,
  phaseName,
  intelligencePercent,
  nextHint,
  messages,
  isStreaming,
  onSend,
  onClose,
}) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef(null)

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = (e) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || isStreaming) return
    setInput('')
    onSend(text)
  }

  return (
    <div className="avatar-panel-wrapper">
      <div className="avatar-panel">
        {/* Header */}
        <div className="avatar-panel-header">
          <div className="avatar-panel-thumb">
            {figurineUrl && <img src={figurineUrl} alt="Essence Avatar" />}
          </div>
          <div className="avatar-panel-identity">
            <div className="avatar-panel-name">{archetypeName}</div>
            <div className="avatar-panel-label">Essence Avatar</div>
          </div>
          <button className="avatar-panel-close" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>

        {/* Intelligence bar */}
        <div className="avatar-intelligence">
          <div className="avatar-intelligence-label">
            <span className="avatar-intelligence-title">Intelligence: {phaseName}</span>
            <span className="avatar-intelligence-percent">{intelligencePercent}%</span>
          </div>
          <div className="avatar-intelligence-bar">
            <div
              className="avatar-intelligence-fill"
              style={{ width: `${intelligencePercent}%` }}
            />
          </div>
          {nextHint && (
            <div className="avatar-intelligence-hint">{nextHint}</div>
          )}
        </div>

        {/* Messages */}
        <div className="avatar-messages">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={
                msg.role === 'assistant'
                  ? `avatar-msg-assistant${i === messages.length - 1 && isStreaming ? ' streaming' : ''}`
                  : 'avatar-msg-user'
              }
            >
              {msg.content}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form className="avatar-input-row" onSubmit={handleSubmit}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Talk to your Essence Avatar..."
            disabled={isStreaming}
            autoFocus
          />
          <button
            type="submit"
            className="avatar-input-send"
            disabled={!input.trim() || isStreaming}
            aria-label="Send"
          >
            &uarr;
          </button>
        </form>
      </div>
    </div>
  )
}
