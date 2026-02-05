import React, { useRef, useEffect } from 'react'
import './ArchetypeBrowseCarousel.css'

/**
 * Horizontal scrollable carousel showing all 12 archetype versions for a field
 * Used in the Browse tab of EditEssenceFieldModal
 */
function ArchetypeBrowseCarousel({
  field, // 'essence' | 'superpower' | 'vision' | 'north_star'
  archetypes, // Array of all 12 archetype objects
  selectedArchetype, // Currently selected archetype name (or null)
  currentArchetype, // User's actual archetype name (for highlighting)
  onSelect, // (archetypeName) => void
  fieldKey // The key to get from archetype: 'poetic_line', 'superpower', 'poetic_vision', 'north_star'
}) {
  const scrollRef = useRef(null)
  const selectedRef = useRef(null)

  // Scroll to selected card on mount or when selection changes
  useEffect(() => {
    if (selectedRef.current && scrollRef.current) {
      selectedRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      })
    }
  }, [selectedArchetype])

  return (
    <div className="archetype-carousel-container">
      <div className="archetype-carousel" ref={scrollRef}>
        {archetypes.map((archetype) => {
          const isSelected = selectedArchetype === archetype.name
          const isCurrent = currentArchetype === archetype.name
          const value = archetype[fieldKey] || ''

          return (
            <div
              key={archetype.name}
              ref={isSelected ? selectedRef : null}
              className={`archetype-carousel-card ${isSelected ? 'selected' : ''} ${isCurrent ? 'current' : ''}`}
              onClick={() => onSelect(archetype.name)}
            >
              <div className="carousel-card-header">
                <span className="carousel-card-name">{archetype.name}</span>
                {isCurrent && <span className="carousel-card-badge">Your Type</span>}
              </div>
              <p className="carousel-card-value">{value}</p>
              {isSelected && (
                <div className="carousel-card-check">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              )}
            </div>
          )
        })}
      </div>
      <div className="carousel-scroll-hint">
        <span>← Scroll to see all archetypes →</span>
      </div>
    </div>
  )
}

export default ArchetypeBrowseCarousel
