import React, { useState, useEffect, useRef } from 'react'
import EditEssenceModal from './EditEssenceModal'
import ShareableArchetypeCard from './ShareableArchetypeCard'

const TOOLTIP_KEY = 'findmyflow_edit_essence_tooltip_seen'

/**
 * HeroIdentityCard - Displays the user's essence archetype and protective voice
 */
function HeroIdentityCard({ archetypes, userId, userEmail, projects, onLearnMore, onViewEssence, onViewProtective, onRefresh }) {
  const [imageError, setImageError] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showShareCard, setShowShareCard] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const tooltipTimerRef = useRef(null)

  // Show tooltip once for discoverability
  useEffect(() => {
    if (!archetypes || !userId) return
    const seen = localStorage.getItem(TOOLTIP_KEY)
    if (!seen) {
      tooltipTimerRef.current = setTimeout(() => setShowTooltip(true), 1200)
      return () => clearTimeout(tooltipTimerRef.current)
    }
  }, [archetypes, userId])

  const dismissTooltip = () => {
    setShowTooltip(false)
    localStorage.setItem(TOOLTIP_KEY, '1')
  }

  if (!archetypes) {
    return (
      <div className="hero-identity-card hero-identity-card--empty">
        <div className="identity-empty-state">
          <span className="identity-empty-icon">🧬</span>
          <h3>Your Hero Identity Awaits</h3>
          <p>
            Take the archetype quiz to discover your essence superpower
            and the protective voice that holds you back.
          </p>
          <div className="empty-state-steps">
            <div className="empty-step">
              <span className="step-number">1</span>
              <span className="step-text">Answer a few questions about your natural energy</span>
            </div>
            <div className="empty-step">
              <span className="step-number">2</span>
              <span className="step-text">Discover your essence archetype and superpower</span>
            </div>
            <div className="empty-step">
              <span className="step-number">3</span>
              <span className="step-text">Meet your protective voice (the shadow that limits you)</span>
            </div>
          </div>
          <button className="discover-button" onClick={onLearnMore}>
            Discover Your Archetype
          </button>
        </div>
      </div>
    )
  }

  const { essence, protective } = archetypes

  // Image comes from useHeroProfile utility (custom or default)
  const imagePath = essence?.image || null
  const showImage = imagePath && !imageError

  // Build original (default) image path for reset comparison
  const originalImage = essence?.originalName
    ? `/images/archetypes/lead-magnet-essence/${essence.originalName.toLowerCase().replace(/\s+/g, '-')}.webp`
    : null


  return (
    <div className="hero-identity-card">
      {/* Avatar and Title Section */}
      <div className="identity-header" onClick={onViewEssence} style={{ cursor: onViewEssence ? 'pointer' : 'default' }}>
        <div className="identity-avatar-ring">
          <div className="identity-avatar">
            {showImage && (
              <img
                src={imagePath}
                alt={essence.name}
                onError={() => setImageError(true)}
              />
            )}
            {!showImage && (
              <div className="avatar-fallback">
                {essence.name?.charAt(0) || '?'}
              </div>
            )}
          </div>
        </div>

        <div className="identity-titles">
          <h2 className="essence-name">{essence.name || 'Unknown Archetype'}</h2>
          {onViewEssence && (
            <span className="essence-view-link">View full profile →</span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {userId && (
        <div className="identity-action-buttons">
          <button
            className="edit-essence-icon"
            onClick={(e) => {
              e.stopPropagation()
              dismissTooltip()
              setShowEditModal(true)
            }}
            title="Customize archetype name and photo"
          >
            ✏️
          </button>
          <button
            className="share-essence-icon"
            onClick={(e) => { e.stopPropagation(); setShowShareCard(true) }}
            title="Share your archetype card"
          >
            ↗
          </button>

          {/* First-time tooltip */}
          {showTooltip && (
            <div className="edit-tooltip" onClick={dismissTooltip}>
              <span>Make it yours — tap to customize</span>
              <span className="edit-tooltip-arrow" />
            </div>
          )}
        </div>
      )}

      {/* Poetic Line */}
      {essence.poeticLine && (
        <p className="identity-tagline">{essence.poeticLine}</p>
      )}

      {/* Superpower and Shadow Cards */}
      <div className="identity-cards">
        {/* Superpower Card */}
        <div className="identity-mini-card superpower-card" onClick={onViewEssence} style={{ cursor: onViewEssence ? 'pointer' : 'default' }}>
          <div className="mini-card-header">
            <span className="mini-card-icon">⚡</span>
            <span className="mini-card-label">Superpower</span>
          </div>
          <p className="mini-card-content">
            {essence.superpower || 'Your unique gift to the world'}
          </p>
          {onViewEssence && <span className="mini-card-link">Learn more →</span>}
        </div>

        {/* Shadow Card */}
        <div className="identity-mini-card shadow-card" onClick={onViewProtective} style={{ cursor: onViewProtective ? 'pointer' : 'default' }}>
          <div className="mini-card-header">
            <span className="mini-card-icon">🛡️</span>
            <span className="mini-card-label">Shadow</span>
          </div>
          <h4 className="shadow-name">{protective?.name || 'Unknown'}</h4>
          <p className="mini-card-content">
            {protective?.coreNarrative ? `"${protective.coreNarrative}"` : 'Your protective voice'}
          </p>
          {onViewProtective && <span className="mini-card-link">Learn more →</span>}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <EditEssenceModal
          userId={userId}
          userEmail={userEmail}
          currentName={essence.name}
          originalName={essence.originalName || essence.name}
          currentImage={imagePath}
          originalImage={originalImage}
          currentTagline={essence.tagline}
          originalTagline={essence.poeticLine}
          group={essence.group}
          superpower={essence.superpower}
          poeticLine={essence.poeticLine}
          poeticVision={essence.poeticVision}
          onClose={() => setShowEditModal(false)}
          onSaved={() => {
            setImageError(false)
            if (onRefresh) onRefresh()
          }}
        />
      )}

      {/* Shareable Card */}
      {showShareCard && (
        <ShareableArchetypeCard
          essence={essence}
          protective={protective}
          imagePath={imagePath}
          onClose={() => setShowShareCard(false)}
        />
      )}
    </div>
  )
}

export default HeroIdentityCard
