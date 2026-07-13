import { useState, useRef, useEffect } from 'react'
import './FigurineChat.css'

/**
 * FigurineChat — mentoring conversation with the Figurine.
 * Opens from Journey tab "Talk to your mentor" or Figurine FAB.
 * Light theme. Messages + text input.
 *
 * Props:
 *  - avatarUrl: string
 *  - archetypeName: string
 *  - messages: array of { role, content }
 *  - isStreaming: boolean
 *  - onSend: (text) => void
 *  - onClose: () => void
 *  - canChat: boolean (false if rate limited or mirror mode)
 *  - conversationsRemaining: number
 *  - intelligencePhase: number (0-3)
 *  - phaseName: string
 */
export default function FigurineChat({
  avatarUrl, archetypeName, messages, isStreaming, onSend, onClose,
  canChat, conversationsRemaining, intelligencePhase, phaseName
}) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!input.trim() || isStreaming || !canChat) return
    onSend(input.trim())
    setInput('')
  }

  return (
    <div className="fc-overlay" onClick={onClose}>
      <div className="fc-panel" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="fc-header">
          {avatarUrl && <img src={avatarUrl} alt="" className="fc-header-avatar" />}
          <div className="fc-header-info">
            <span className="fc-header-name">{archetypeName || 'Your Mentor'}</span>
            <span className="fc-header-phase">{phaseName} · {conversationsRemaining} left today</span>
          </div>
          <button className="fc-close" onClick={onClose}>&times;</button>
        </div>

        {/* Messages */}
        <div className="fc-messages">
          {messages.length === 0 && (
            <div className="fc-empty">
              <p>Ask me anything about your journey.</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`fc-msg fc-msg-${msg.role}`}>
              {msg.role === 'assistant' && avatarUrl && (
                <img src={avatarUrl} alt="" className="fc-msg-avatar" />
              )}
              <div className="fc-msg-bubble">
                {msg.content || (isStreaming && i === messages.length - 1 ? '...' : '')}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        {canChat ? (
          <form className="fc-input-row" onSubmit={handleSubmit}>
            <input
              className="fc-input"
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask your mentor..."
              disabled={isStreaming}
            />
            <button className="fc-send" type="submit" disabled={!input.trim() || isStreaming}>
              →
            </button>
          </form>
        ) : (
          <div className="fc-locked">
            {conversationsRemaining <= 0
              ? "You've used all 3 conversations today. Come back tomorrow."
              : "Complete more wahoos and check-ins to unlock mentoring."
            }
          </div>
        )}
      </div>
    </div>
  )
}
