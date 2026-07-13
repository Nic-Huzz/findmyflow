import { useState, useEffect } from 'react'
import './FigurineOverlay.css'

/**
 * FigurineOverlay — one-way coaching moment from the Figurine mentor.
 * Shows avatar image + message. User acknowledges. No conversation.
 * Like Celeste's Theo: appears, says something important, leaves.
 *
 * Props:
 *  - avatarUrl: string (hero avatar image)
 *  - message: string (Figurine's coaching copy)
 *  - emoji: string (stage-specific icon)
 *  - onDismiss: () => void
 *  - autoDismiss: number (ms, default 10000)
 */
export default function FigurineOverlay({ avatarUrl, message, emoji, onDismiss, autoDismiss = 10000 }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setTimeout(() => setVisible(true), 100)
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onDismiss, 300)
    }, autoDismiss)
    return () => clearTimeout(timer)
  }, [autoDismiss, onDismiss])

  const handleDismiss = () => {
    setVisible(false)
    setTimeout(onDismiss, 300)
  }

  return (
    <div className={`fo-overlay ${visible ? 'fo-visible' : ''}`}>
      <div className="fo-card" onClick={e => e.stopPropagation()}>
        {avatarUrl && (
          <div className="fo-avatar-container">
            <img src={avatarUrl} alt="" className="fo-avatar" draggable="false" />
            {emoji && <span className="fo-emoji-badge">{emoji}</span>}
          </div>
        )}
        {!avatarUrl && emoji && <span className="fo-emoji-standalone">{emoji}</span>}
        <p className="fo-message">{message}</p>
        <button className="fo-dismiss" onClick={handleDismiss}>Continue</button>
      </div>
    </div>
  )
}
