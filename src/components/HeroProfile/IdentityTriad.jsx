import React from 'react'
import { Link } from 'react-router-dom'

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
          emptyText="Complete"
          emptyLinkText="Flow Finder Skills"
          emptyLinkTo="/nikigai/skills"
          emptyTextAfter="to discover your gift"
        />

        {/* Cause (Problem) */}
        <TriadDetailCard
          icon="🌍"
          label="Cause"
          segment={problem}
          emptyText="Complete"
          emptyLinkText="Flow Finder Problems"
          emptyLinkTo="/nikigai/problems"
          emptyTextAfter="to discover your cause"
        />

        {/* Tribe (Persona) */}
        <TriadDetailCard
          icon="👥"
          label="Tribe"
          segment={persona}
          emptyText="Complete"
          emptyLinkText="Flow Finder Persona"
          emptyLinkTo="/nikigai/persona"
          emptyTextAfter="to discover your tribe"
        />
      </div>
    </div>
  )
}

function TriadDetailCard({ icon, label, segment, emptyText, emptyLinkText, emptyLinkTo, emptyTextAfter }) {
  if (!segment) {
    return (
      <div className="triad-detail-card triad-detail-card--empty">
        <div className="triad-detail-header">
          <span className="triad-detail-icon">{icon}</span>
          <span className="triad-detail-label">{label}</span>
        </div>
        <p className="triad-detail-empty">
          {emptyText}{' '}
          <Link to={emptyLinkTo} className="hero-profile-link">
            {emptyLinkText} →
          </Link>{' '}
          {emptyTextAfter}
        </p>
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
