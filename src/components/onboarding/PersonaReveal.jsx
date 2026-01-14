/**
 * PersonaReveal.jsx
 *
 * Animated persona reveal component for Onboarding V2
 * Shows the derived persona with visual feedback and next step guidance
 *
 * Created: Jan 2026
 */

import { useState, useEffect } from 'react'
import { getPersonaDisplay, getWealthLadderDisplay, getEmphasisConfig } from '../../lib/onboardingV2'
import './PersonaReveal.css'

function PersonaReveal({
  persona,
  wealthLadder,
  emphasis,
  onContinue,
  showWealthLadder = true,
  showEmphasis = false,
  animationDelay = 300
}) {
  const [isVisible, setIsVisible] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  const personaData = getPersonaDisplay(persona)
  const ladderData = getWealthLadderDisplay(wealthLadder)
  const emphasisData = emphasis ? getEmphasisConfig(emphasis) : null

  // Animate in on mount
  useEffect(() => {
    const timer1 = setTimeout(() => setIsVisible(true), animationDelay)
    const timer2 = setTimeout(() => setShowDetails(true), animationDelay + 400)
    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
    }
  }, [animationDelay])

  return (
    <div className={`persona-reveal ${isVisible ? 'visible' : ''}`}>
      {/* Content wrapper */}
      <div className="reveal-content">
        {/* Persona Badge */}
        <div
          className={`persona-badge ${isVisible ? 'animate-in' : ''}`}
          style={{ backgroundColor: personaData.color }}
        >
          <span className="persona-icon">{personaData.icon}</span>
          <span className="persona-name">{personaData.name}</span>
        </div>

        {/* Tagline */}
        <h2 className={`persona-tagline ${showDetails ? 'fade-in' : ''}`}>
          {personaData.tagline}
        </h2>

        {/* Description */}
        <p className={`persona-description ${showDetails ? 'fade-in' : ''}`}>
          {personaData.description}
        </p>

        {/* Wealth Ladder Position */}
        {showWealthLadder && (
          <div className={`wealth-ladder-indicator ${showDetails ? 'fade-in' : ''}`}>
            <div className="ladder-label">Your position on the Business Ladder</div>
            <div className="ladder-visual">
              {['pre_ladder', 'service', 'productized', 'products'].map((rung, index) => {
                const isActive = rung === wealthLadder
                const isPast = getWealthLadderDisplay(rung).position < ladderData.position
                return (
                  <div
                    key={rung}
                    className={`ladder-rung ${isActive ? 'active' : ''} ${isPast ? 'past' : ''}`}
                  >
                    <div
                      className="rung-dot"
                      style={{
                        backgroundColor: isActive ? ladderData.color : isPast ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)'
                      }}
                    />
                    <span className="rung-label">{getWealthLadderDisplay(rung).shortLabel}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Emphasis Focus (optional) */}
        {showEmphasis && emphasisData && (
          <div className={`emphasis-indicator ${showDetails ? 'fade-in' : ''}`}>
            <div className="emphasis-label">Your Focus</div>
            <div
              className="emphasis-badge"
              style={{ borderColor: emphasisData.color }}
            >
              {emphasisData.label}
            </div>
            <p className="emphasis-description">{emphasisData.description}</p>
          </div>
        )}

        {/* Next Step */}
        <div className={`next-step ${showDetails ? 'fade-in' : ''}`}>
          <div className="next-step-label">{personaData.nextStepLabel}</div>
          <p className="next-step-description">{personaData.nextStepDescription}</p>
        </div>
      </div>

      {/* Continue Button - pinned at bottom */}
      <div className="button-container">
        <button
          className={`continue-button ${showDetails ? 'fade-in' : ''}`}
          onClick={onContinue}
        >
          Continue
        </button>
      </div>
    </div>
  )
}

export default PersonaReveal
