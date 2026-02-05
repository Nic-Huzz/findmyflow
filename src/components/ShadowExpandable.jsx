import React, { useState } from 'react'
import './ShadowExpandable.css'

/**
 * Inline expandable section for protective voice (shadow) details
 * Shows name + summary collapsed, full details when expanded
 */
function ShadowExpandable({ protectiveVoice }) {
  const [expanded, setExpanded] = useState(false)

  if (!protectiveVoice) {
    return null
  }

  const {
    name,
    icon,
    lie,
    origin,
    howItProtects,
    kryptonite,
    affirmation
  } = protectiveVoice

  return (
    <div className={`shadow-expandable ${expanded ? 'expanded' : ''}`}>
      {/* Collapsed Header */}
      <button
        className="shadow-header"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <div className="shadow-header-left">
          <span className="shadow-icon">{icon}</span>
          <div className="shadow-header-text">
            <span className="shadow-name">{name}</span>
            <span className="shadow-lie">"{lie}"</span>
          </div>
        </div>
        <span className={`shadow-chevron ${expanded ? 'rotated' : ''}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="shadow-content">
          <div className="shadow-section">
            <div className="shadow-section-label">Origin</div>
            <p>{origin}</p>
          </div>

          <div className="shadow-section">
            <div className="shadow-section-label">How It Protects You</div>
            <p>{howItProtects}</p>
          </div>

          <div className="shadow-section">
            <div className="shadow-section-label">Kryptonite</div>
            <p>{kryptonite}</p>
          </div>

          <div className="shadow-affirmation">
            <div className="affirmation-label">Affirmation</div>
            <p className="affirmation-text">"{affirmation}"</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default ShadowExpandable
