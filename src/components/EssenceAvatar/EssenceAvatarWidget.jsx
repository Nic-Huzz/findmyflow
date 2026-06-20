/**
 * EssenceAvatarWidget - Floating figurine that replaces ZarloWidget
 *
 * Three states:
 * - Idle (56px): figurine visible, state-reactive glow/breathing
 * - Speaking (80px + bubble): pattern detected, widget grows with speech bubble
 * - Panel open: full conversation interface
 *
 * Position: fixed bottom-right, matches Zarlo's exact positioning.
 */

import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useEssenceAvatar } from '../../hooks/useEssenceAvatar'
import EssenceAvatarPanel from './EssenceAvatarPanel'
import './EssenceAvatar.css'

export default function EssenceAvatarWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [bubbleDismissed, setBubbleDismissed] = useState(false)
  const location = useLocation()

  const {
    loading,
    isUnlocked,
    widgetImageUrl,
    figurineUrl,
    currentState,
    archetypeName,
    messages,
    isStreaming,
    intelligencePercent,
    intelligencePhase,
    phaseName,
    nextHint,
    sendMessage,
    clearMessages,
    initConversation,
    hasSomethingToSay,
    speakingMessage,
  } = useEssenceAvatar()

  // Close panel on navigation
  useEffect(() => {
    setIsOpen(false)
  }, [location.pathname])

  // Auto-dismiss speech bubble after 8 seconds
  useEffect(() => {
    if (hasSomethingToSay && !bubbleDismissed) {
      const timer = setTimeout(() => setBubbleDismissed(true), 8000)
      return () => clearTimeout(timer)
    }
  }, [hasSomethingToSay, bubbleDismissed])

  // Reset bubble dismissed when new message arrives
  useEffect(() => {
    if (hasSomethingToSay) setBubbleDismissed(false)
  }, [speakingMessage])

  // Don't render if loading, not unlocked, or no image
  if (loading || !isUnlocked || !widgetImageUrl) return null

  const handleOpen = () => {
    setIsOpen(true)
    setBubbleDismissed(true)
    initConversation()
  }

  const handleClose = () => {
    setIsOpen(false)
    clearMessages()
  }

  // Determine widget state
  const showBubble = hasSomethingToSay && !bubbleDismissed && !isOpen
  const widgetState = showBubble ? 'speaking' : 'idle'

  // NS state CSS class
  const nsClass = currentState ? `ns-${currentState.replace(/ /g, '-')}` : ''

  // Validation page check (needs higher positioning)
  const isValidationPage = location.pathname.startsWith('/v/')

  return (
    <div className={`essence-avatar-container ${isValidationPage ? 'validation-page' : ''}`}>
      {/* Conversation panel */}
      {isOpen && (
        <EssenceAvatarPanel
          figurineUrl={figurineUrl}
          archetypeName={archetypeName}
          phaseName={phaseName}
          intelligencePercent={intelligencePercent}
          nextHint={nextHint}
          messages={messages}
          isStreaming={isStreaming}
          onSend={sendMessage}
          onClose={handleClose}
        />
      )}

      {/* Speech bubble */}
      {showBubble && (
        <div className="avatar-speech-bubble">
          {speakingMessage}
        </div>
      )}

      {/* Floating figurine */}
      {!isOpen && (
        <div
          className={`avatar-figurine ${widgetState} ${nsClass}`}
          onClick={handleOpen}
          role="button"
          tabIndex={0}
          aria-label="Talk to your Essence Avatar"
          onKeyDown={(e) => e.key === 'Enter' && handleOpen()}
        >
          <img src={widgetImageUrl} alt="Essence Avatar" />
        </div>
      )}
    </div>
  )
}
