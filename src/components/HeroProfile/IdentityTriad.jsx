import React from 'react'

/**
 * IdentityTriad - Detailed Gift/Cause/Tribe identity cards
 *
 * Shows expanded cards with:
 * - Icon and label (Gift/Cause/Tribe)
 * - Aspirational title
 * - Display name
 * - Tagline
 */
function IdentityTriad({ skill, problem, persona }) {
  return (
    <div className="identity-triad-detail">
      <h3 className="triad-detail-title">Project Identity</h3>

      <div className="triad-detail-cards">
        {/* Gift (Skill) */}
        <TriadDetailCard
          icon="🎯"
          label="Gift"
          segment={skill}
          emptyText="Complete Flow Finder Skills to discover your gift"
        />

        {/* Cause (Problem) */}
        <TriadDetailCard
          icon="🌍"
          label="Cause"
          segment={problem}
          emptyText="Complete Flow Finder Problems to discover your cause"
        />

        {/* Tribe (Persona) */}
        <TriadDetailCard
          icon="👥"
          label="Tribe"
          segment={persona}
          emptyText="Complete Flow Finder Persona to discover your tribe"
        />
      </div>
    </div>
  )
}

function TriadDetailCard({ icon, label, segment, emptyText }) {
  if (!segment) {
    return (
      <div className="triad-detail-card triad-detail-card--empty">
        <div className="triad-detail-header">
          <span className="triad-detail-icon">{icon}</span>
          <span className="triad-detail-label">{label}</span>
        </div>
        <p className="triad-detail-empty">{emptyText}</p>
      </div>
    )
  }

  return (
    <div
      className="triad-detail-card"
      style={{ borderColor: `${segment.color}33` }}
    >
      <div className="triad-detail-header">
        <span className="triad-detail-icon">{icon}</span>
        <span className="triad-detail-label">{label}</span>
      </div>
      <h4 className="triad-detail-name" style={{ color: segment.color }}>
        {segment.aspirationalTitle}
      </h4>
      <p className="triad-detail-display">{segment.displayName}</p>
      {segment.tagline && (
        <p className="triad-detail-tagline">{segment.tagline}</p>
      )}
    </div>
  )
}

export default IdentityTriad
