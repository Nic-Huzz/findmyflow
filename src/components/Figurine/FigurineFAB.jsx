import { useState, useEffect } from 'react'
import { useFigurine } from '../../hooks/useFigurine'
import FigurineChat from './FigurineChat'
import './FigurineFAB.css'

export default function FigurineFAB({ activeChat, setActiveChat }) {
  const {
    loading, isUnlocked, isMirrorMode, avatarUrl, profile,
    messages, isStreaming, sendMessage, clearMessages,
    canChat, conversationsRemaining, intelligencePhase, phaseName,
  } = useFigurine()

  // Listen for Zarlo opening so we can close Figurine
  useEffect(() => {
    const handler = (e) => {
      if (e.detail === 'zarlo' && activeChat === 'figurine') {
        setActiveChat(null)
      }
    }
    window.addEventListener('activeChatChanged', handler)
    return () => window.removeEventListener('activeChatChanged', handler)
  }, [activeChat, setActiveChat])

  if (loading || !isUnlocked) return null

  const isOpen = activeChat === 'figurine'

  const handleToggle = () => {
    if (isOpen) {
      setActiveChat(null)
      window.dispatchEvent(new CustomEvent('activeChatChanged', { detail: null }))
    } else {
      setActiveChat('figurine')
      window.dispatchEvent(new CustomEvent('activeChatChanged', { detail: 'figurine' }))
      if (messages.length === 0 && !isMirrorMode) {
        // Could add a greeting message here
      }
    }
  }

  return (
    <div className="figurine-fab-container">
      {isOpen && !isMirrorMode && (
        <FigurineChat
          avatarUrl={avatarUrl}
          archetypeName={profile?.custom_essence_name || profile?.essence_archetype}
          messages={messages}
          isStreaming={isStreaming}
          onSend={sendMessage}
          onClose={() => { setActiveChat(null); window.dispatchEvent(new CustomEvent('activeChatChanged', { detail: null })) }}
          canChat={canChat}
          conversationsRemaining={conversationsRemaining}
          intelligencePhase={intelligencePhase}
          phaseName={phaseName}
        />
      )}

      <button
        className={`figurine-fab ${isOpen ? 'open' : ''}`}
        onClick={handleToggle}
        aria-label={isOpen ? 'Close Mentor' : 'Talk to Mentor'}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="figurine-fab-img" />
        ) : (
          <span className="figurine-fab-icon">🪞</span>
        )}
      </button>
    </div>
  )
}
