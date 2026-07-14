import { useEffect, useState } from 'react'
import './Zarlo.css'

/**
 * ZarloProactiveBubble — small floating observation from Zarlo.
 * Appears after key actions (wahoo, check-in, healing flow).
 * Auto-dismisses after 8 seconds. Tap to open full Zarlo chat.
 *
 * Props:
 *  - message: string (the observation text)
 *  - onTap: () => void (open Zarlo chat)
 *  - onDismiss: () => void (clear the bubble)
 */
export default function ZarloProactiveBubble({ message, onTap, onDismiss }) {
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    const exitTimer = setTimeout(() => setExiting(true), 7500)
    const dismissTimer = setTimeout(() => onDismiss?.(), 8000)
    return () => {
      clearTimeout(exitTimer)
      clearTimeout(dismissTimer)
    }
  }, [onDismiss])

  if (!message) return null

  return (
    <div
      className={`zarlo-proactive ${exiting ? 'zarlo-proactive-exit' : ''}`}
      onClick={() => { onTap?.(); onDismiss?.() }}
    >
      <span className="zarlo-proactive-avatar">🌞</span>
      <span className="zarlo-proactive-text">{message}</span>
    </div>
  )
}
