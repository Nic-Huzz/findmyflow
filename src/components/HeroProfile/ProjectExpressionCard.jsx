import React from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * Stage names for the 8-stage journey
 */
const STAGE_NAMES = {
  1: 'Discovery',
  2: 'Validation',
  3: 'Offer',
  4: 'Audience',
  5: 'Content',
  6: 'Campaign',
  7: 'Launch',
  8: 'Scale',
}

/**
 * Stage-themed icons — evolves as the project grows
 */
const STAGE_ICONS = {
  0: '🌱',
  1: '🌱',
  2: '🔍',
  3: '🔥',
  4: '🎯',
  5: '✍️',
  6: '🚀',
  7: '🏆',
  8: '👑',
}

/**
 * ProjectExpressionCard - Displays a project with its identity triad
 *
 * Shows:
 * - Project name and XP
 * - Gift (skill), Cause (problem), Tribe (persona) tiles
 * - Business stage progress bar
 * - Visibility progress bar (optional)
 * - View Project link
 */
function ProjectExpressionCard({ project, visibilityProgress, onClick }) {
  const navigate = useNavigate()

  if (!project) return null

  const { id, name, stage, xp, skill, problem, persona } = project

  // Calculate stage progress percentage (8 stages)
  const stagePercentage = Math.round((stage / 8) * 100)

  // Calculate overall visibility progress
  const visibilityPercentage = visibilityProgress
    ? Math.round(
        Object.values(visibilityProgress).reduce((sum, v) => sum + v.percentage, 0) / 5
      )
    : 0

  const handleClick = () => {
    if (onClick) {
      onClick(project)
    } else {
      navigate(`/hero-profile/${id}`)
    }
  }

  return (
    <div className="project-expression-card" onClick={handleClick}>
      {/* Header */}
      <div className="project-header">
        <div className="project-icon">{STAGE_ICONS[stage] || '🌱'}</div>
        <h3 className="project-name">{name}</h3>
        <span className="project-xp">⚡ {xp.toLocaleString()} XP</span>
      </div>

      {/* Identity Triad: Gift / Cause / Tribe */}
      <div className="identity-triad">
        {/* Gift (Skill) */}
        <div className="triad-tile">
          <div className="triad-header">
            <span className="triad-icon">🎯</span>
            <span className="triad-label">Gift</span>
          </div>
          <span className="triad-title" style={{ color: skill?.color }}>
            {skill?.aspirationalTitle || 'Not set'}
          </span>
        </div>

        {/* Cause (Problem) */}
        <div className="triad-tile">
          <div className="triad-header">
            <span className="triad-icon">🌍</span>
            <span className="triad-label">Cause</span>
          </div>
          <span className="triad-title" style={{ color: problem?.color }}>
            {problem?.aspirationalTitle || 'Not set'}
          </span>
        </div>

        {/* Tribe (Persona) */}
        <div className="triad-tile">
          <div className="triad-header">
            <span className="triad-icon">👥</span>
            <span className="triad-label">Tribe</span>
          </div>
          <span className="triad-title" style={{ color: persona?.color }}>
            {persona?.aspirationalTitle || 'Not set'}
          </span>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="project-progress">
        {/* Business Stage Progress */}
        <div className="progress-row">
          <span className="progress-label">
            Business: Stage {stage} ({STAGE_NAMES[stage] || 'Unknown'})
          </span>
          <div className="progress-bar">
            <div
              className="progress-fill progress-fill--stage"
              style={{ width: `${stagePercentage}%` }}
            />
          </div>
          <span className="progress-value">{stagePercentage}%</span>
        </div>

        {/* Visibility Progress */}
        {visibilityProgress && Object.keys(visibilityProgress).length > 0 && (
          <div className="progress-row">
            <span className="progress-label">Visibility: {getVisibilityStage(visibilityProgress)}</span>
            <div className="progress-bar">
              <div
                className="progress-fill progress-fill--visibility"
                style={{ width: `${visibilityPercentage}%` }}
              />
            </div>
            <span className="progress-value">{visibilityPercentage}%</span>
          </div>
        )}
      </div>

      {/* View Project Link */}
      <div className="project-footer">
        <span className="view-link">View Project →</span>
      </div>
    </div>
  )
}

/**
 * Get the current visibility stage name based on progress
 */
function getVisibilityStage(progress) {
  // Find the highest layer with any completions
  const layers = ['authority', 'vulnerable', 'money', 'live', 'screen']
  for (const layer of layers) {
    if (progress[layer]?.completed > 0) {
      return `${progress[layer].label} Stage`
    }
  }
  return 'Getting Started'
}

/**
 * CreateExpressionCard - Placeholder card for creating a new project
 * @param {boolean} isFirst - If true, show more guidance (first project)
 */
export function CreateExpressionCard({ onClick, isFirst = false }) {
  if (isFirst) {
    return (
      <div className="project-expression-card create-expression-card create-expression-card--first" onClick={onClick}>
        <div className="create-first-content">
          <span className="create-first-icon">🧭</span>
          <h3 className="create-first-title">Start Your First Expression</h3>
          <p className="create-first-description">
            An Expression is a project where you apply your unique gifts
            to a problem you care about, for people who need you.
          </p>
          <div className="create-first-steps">
            <span className="create-first-step">Discover your Gift (skills)</span>
            <span className="create-first-arrow">→</span>
            <span className="create-first-step">Find your Cause (problems)</span>
            <span className="create-first-arrow">→</span>
            <span className="create-first-step">Meet your Tribe (persona)</span>
          </div>
          <span className="create-first-cta">Begin Flow Finder →</span>
        </div>
      </div>
    )
  }

  return (
    <div className="project-expression-card create-expression-card" onClick={onClick}>
      <div className="create-content">
        <span className="create-icon">+</span>
        <span className="create-text">Create New Expression</span>
      </div>
    </div>
  )
}

export default ProjectExpressionCard
