/**
 * ZarloWidget - Floating button that opens/closes the Zarlo chat
 *
 * Position: Bottom right corner (above mobile nav if present)
 * Shows notification dot when Zarlo has something important
 */

import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import ZarloChat from './ZarloChat'
import './Zarlo.css'

// Routes where Zarlo should NOT appear
const HIDDEN_ROUTES = [
  // All routes now have Zarlo enabled
]

function ZarloWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [hasNotification, setHasNotification] = useState(false)
  const location = useLocation()

  // Get current challenge tab from URL if on challenge page
  const getChallengeTab = () => {
    if (location.pathname !== '/7-day-challenge') return null
    const params = new URLSearchParams(location.search)
    return params.get('tab') || 'quests'
  }

  // Check if we should hide Zarlo on this route
  const shouldHide = HIDDEN_ROUTES.some(route =>
    location.pathname.startsWith(route)
  )

  // Close Zarlo when navigating
  useEffect(() => {
    setIsOpen(false)
  }, [location.pathname])

  if (shouldHide) return null

  const handleToggle = () => {
    setIsOpen(prev => !prev)
    if (hasNotification) {
      setHasNotification(false)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
  }

  // Check if on validation page (needs higher positioning)
  const isValidationPage = location.pathname.startsWith('/v/')

  return (
    <div className={`zarlo-widget-container ${isValidationPage ? 'validation-page' : ''}`}>
      {/* Chat panel */}
      {isOpen && (
        <div className="zarlo-chat-wrapper">
          <ZarloChat
            onClose={handleClose}
            challengeTab={getChallengeTab()}
          />
        </div>
      )}

      {/* Floating button */}
      <button
        className={`zarlo-fab ${isOpen ? 'open' : ''}`}
        onClick={handleToggle}
        aria-label={isOpen ? 'Close Zarlo' : 'Open Zarlo'}
      >
        {isOpen ? (
          <span className="zarlo-fab-icon">×</span>
        ) : (
          <>
            <span className="zarlo-fab-icon">🌞</span>
            {hasNotification && <span className="zarlo-fab-notification" />}
          </>
        )}
      </button>
    </div>
  )
}

export default ZarloWidget
