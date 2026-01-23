// src/components/CoachNudge.jsx
// Context-aware coaching nudge component

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { checkForNudges, getNudgeActionHandler } from '../lib/nudgeEngine'
import { dismissNudge, actOnNudge, markNudgeShown } from '../lib/executeHelpers'
import './CoachNudge.css'

export default function CoachNudge({ userId, isFirstLoginToday = false, onAction }) {
  const [nudge, setNudge] = useState(null)
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (!userId) return

    // Check for nudges on mount
    checkForNudges(userId, isFirstLoginToday).then(result => {
      if (result) {
        setNudge(result)
        // Mark as shown
        markNudgeShown(result.id)
        // Animate in after a short delay
        setTimeout(() => setVisible(true), 500)
      }
    })
  }, [userId, isFirstLoginToday])

  if (!nudge || dismissed) return null

  const handler = getNudgeActionHandler(nudge.action_type, nudge.action_data)

  async function handleDismiss() {
    setVisible(false)
    await dismissNudge(nudge.id)
    setTimeout(() => setDismissed(true), 300)
  }

  async function handleAction() {
    setVisible(false)
    await actOnNudge(nudge.id)

    // Handle navigation or callback
    if (handler.route) {
      navigate(handler.route)
    }

    if (handler.callback && onAction) {
      onAction(handler.callback, handler.data)
    }

    setTimeout(() => setDismissed(true), 300)
  }

  return (
    <div className={`coach-nudge ${visible ? 'visible' : ''}`}>
      <div className="nudge-avatar" aria-hidden="true">
        🧭
      </div>
      <div className="nudge-content">
        <p className="nudge-message">{nudge.message}</p>
        <div className="nudge-actions">
          <button
            className="nudge-btn primary"
            onClick={handleAction}
          >
            {handler.label}
          </button>
          <button
            className="nudge-btn dismiss"
            onClick={handleDismiss}
          >
            Not now
          </button>
        </div>
      </div>
      <button
        className="nudge-close"
        onClick={handleDismiss}
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  )
}
