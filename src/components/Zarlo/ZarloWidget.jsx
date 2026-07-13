/**
 * ZarloWidget - Floating button that opens/closes the Zarlo chat
 *
 * Position: Bottom right corner (above mobile nav if present)
 * Shows notification dot when Zarlo has something important
 */

import { useState, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import ZarloChat from './ZarloChat'
import './Zarlo.css'

// Routes where Zarlo should NOT appear
const HIDDEN_ROUTES = [
  // All routes now have Zarlo enabled
]

function cap(str) {
  return str?.charAt(0).toUpperCase() + str?.slice(1).replace(/_/g, ' ')
}

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

  const [proactiveMessage, setProactiveMessage] = useState(null)

  // Close Zarlo when navigating
  useEffect(() => {
    setIsOpen(false)
  }, [location.pathname])

  // Proactive voice pattern detection (Sprint 1C — check on mount)
  const checkVoicePatterns = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: voiceData } = await supabase
        .from('healing_intentions')
        .select('protective_voice')
        .eq('user_id', user.id)
        .not('protective_voice', 'is', null)

      if (!voiceData?.length) return

      const counts = {}
      voiceData.forEach(row => {
        if (row.protective_voice) {
          counts[row.protective_voice] = (counts[row.protective_voice] || 0) + 1
        }
      })

      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
      if (!sorted.length) return

      const [voiceName, count] = sorted[0]

      const voiceLabel = voiceName.charAt(0).toUpperCase() + voiceName.slice(1).replace(/_/g, ' ')

      // Check each threshold independently (3, 4, 5) so user sees each message once
      if (count >= 5 && !localStorage.getItem(`zarlo_voice_${voiceName}_5`)) {
        setProactiveMessage(
          `The ${voiceLabel}. Five times. It's been in every healing flow. You're ready to see the root.`
        )
        setHasNotification(true)
        localStorage.setItem(`zarlo_voice_${voiceName}_5`, 'true')
      } else if (count === 4 && !localStorage.getItem(`zarlo_voice_${voiceName}_4`)) {
        setProactiveMessage(
          `Four times the ${voiceLabel} has blocked you. There's something underneath it.`
        )
        setHasNotification(true)
        localStorage.setItem(`zarlo_voice_${voiceName}_4`, 'true')
      } else if (count === 3 && !localStorage.getItem(`zarlo_voice_${voiceName}_3`)) {
        setProactiveMessage(
          `The ${voiceLabel} keeps showing up. That's three times now.`
        )
        setHasNotification(true)
        localStorage.setItem(`zarlo_voice_${voiceName}_3`, 'true')
      }
    } catch (e) {
      // Silent fail — proactive features should never break the app
    }
  }, [])

  // Brief-based proactive insights (Sprint 3D — replaces Sprint 1C as primary, keeps it as fallback)
  const checkProactiveInsights = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const today = new Date().toISOString().slice(0, 10)
      if (localStorage.getItem(`zarlo_proactive_${today}`)) return

      const { data: briefRow } = await supabase
        .from('zarlo_briefs')
        .select('brief')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!briefRow?.brief) {
        checkVoicePatterns() // Sprint 1C fallback
        return
      }

      const brief = briefRow.brief
      let message = null

      // 1. Voice readiness (1 away from Stage 7)
      if (brief.thresholds?.voice_count_to_graduate === 1) {
        const voice = brief.patterns?.dominant_voice
        if (voice && !localStorage.getItem(`zarlo_readiness_${voice.name}`)) {
          message = `One more pattern and something becomes clear. The ${cap(voice.name)} is almost fully visible.`
          localStorage.setItem(`zarlo_readiness_${voice.name}`, 'true')
        }
      }

      // 2. Streak milestone approaching
      if (!message && brief.thresholds?.streak_milestone_approaching) {
        const milestone = brief.thresholds.streak_milestone_approaching.replace('_', '-')
        const key = `zarlo_streak_${milestone}`
        if (!localStorage.getItem(key)) {
          message = `You're close to a ${milestone} streak. That's not luck. That's you showing up.`
          localStorage.setItem(key, 'true')
        }
      }

      if (message) {
        setProactiveMessage(message)
        setHasNotification(true)
        localStorage.setItem(`zarlo_proactive_${today}`, 'true')
      }
    } catch (e) { /* silent */ }
  }, [checkVoicePatterns])

  useEffect(() => {
    checkProactiveInsights()
  }, [checkProactiveInsights])

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

      {/* Proactive message bubble */}
      {proactiveMessage && !isOpen && (
        <div className="zarlo-proactive-bubble" onClick={() => {
          setProactiveMessage(null)
          setHasNotification(false)
          handleToggle()
        }}>
          <p className="zarlo-proactive-text">{proactiveMessage}</p>
          <button className="zarlo-proactive-dismiss" onClick={(e) => {
            e.stopPropagation()
            setProactiveMessage(null)
            setHasNotification(false)
          }}>&times;</button>
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
