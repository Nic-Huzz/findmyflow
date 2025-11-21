import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import {
  isNotificationSupported,
  getNotificationPermission,
  initializeNotifications
} from '../lib/notifications'
import './NotificationPrompt.css'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

/**
 * Small banner/prompt component that encourages users to enable notifications
 * Can be added to Challenge page or as a persistent banner
 */
function NotificationPrompt({ onDismiss }) {
  const { user } = useAuth()
  const [show, setShow] = useState(false)
  const [permission, setPermission] = useState('default')

  useEffect(() => {
    checkIfShouldShow()
  }, [user])

  const checkIfShouldShow = async () => {
    // Don't show if not supported
    if (!isNotificationSupported()) {
      setShow(false)
      return
    }

    // Check permission
    const currentPermission = getNotificationPermission()
    setPermission(currentPermission)

    // Show prompt if permission not yet granted
    // And user hasn't dismissed it this session
    const dismissed = sessionStorage.getItem('notificationPromptDismissed')
    if (currentPermission === 'default' && !dismissed) {
      setShow(true)
    }
  }

  const handleDismiss = () => {
    setShow(false)
    sessionStorage.setItem('notificationPromptDismissed', 'true')
    if (onDismiss) onDismiss()
  }

  const handleQuickEnable = async () => {
    if (user && VAPID_PUBLIC_KEY) {
      try {
        await initializeNotifications(user.id, VAPID_PUBLIC_KEY)
        setShow(false)
      } catch (error) {
        console.error('Error enabling notifications:', error)
      }
    }
  }

  if (!show) return null

  return (
    <div className="notification-prompt">
      <div className="notification-prompt-content">
        <span className="notification-prompt-icon">🔔</span>
        <div className="notification-prompt-text">
          <strong>Stay on track with notifications</strong>
          <p>Get reminders for daily quests and leaderboard updates</p>
        </div>
      </div>
      <div className="notification-prompt-actions">
        <Link to="/settings/notifications" className="notification-prompt-btn primary">
          Enable Notifications
        </Link>
        <button onClick={handleDismiss} className="notification-prompt-btn secondary">
          Not Now
        </button>
      </div>
      <button className="notification-prompt-close" onClick={handleDismiss}>
        ×
      </button>
    </div>
  )
}

export default NotificationPrompt
