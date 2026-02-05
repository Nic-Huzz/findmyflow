import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { useHeroProfile } from '../../hooks/useHeroProfile'
import { useJourneyMap } from '../../hooks/useJourneyMap'
import { useCodex } from '../../hooks/useCodex'
import HeroIdentityCard from './HeroIdentityCard'
import JourneyMap from './JourneyMap'
import ProjectExpressionCard, { CreateExpressionCard } from './ProjectExpressionCard'
import ProjectDetailView from './ProjectDetailView'
import PlayListProgress from './PlayListProgress'
import EssenceVsProtectiveTracker from './EssenceVsProtectiveTracker'
import './HeroProfile.css'
import './JourneyMap.css'

/**
 * CodexPreviewCard - Shows Codex progress and links to full Codex
 */
function CodexPreviewCard({ totalProgress, onClick }) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick()
    }
  }

  return (
    <div className="codex-preview-card" onClick={onClick} onKeyDown={handleKeyDown} role="button" tabIndex={0}>
      <div className="codex-preview-header">
        <span className="codex-preview-icon">📖</span>
        <div className="codex-preview-title-group">
          <h3 className="codex-preview-title">Guidebook</h3>
          <p className="codex-preview-subtitle">Wisdom that unlocks as you grow</p>
        </div>
        <span className="codex-preview-arrow">→</span>
      </div>
      <div className="codex-preview-progress">
        <div className="codex-preview-bar">
          <div
            className="codex-preview-fill"
            style={{ width: `${totalProgress.percentage}%` }}
          />
        </div>
        <span className="codex-preview-count">
          {totalProgress.unlocked}/{totalProgress.total} Unlocked
        </span>
      </div>
    </div>
  )
}

/**
 * HeroCommandCenter - Main dashboard and project detail view
 *
 * Routes:
 * - /hero-profile → Main dashboard (identity card + all projects)
 * - /hero-profile/:projectId → Project detail view
 */
function HeroCommandCenter() {
  const navigate = useNavigate()
  const { projectId } = useParams()
  const { user } = useAuth()
  const {
    archetypes,
    projects,
    totalXP,
    projectDetail,
    groanChallenges,
    visibilityProgress,
    voiceTracker,
    loading,
    error,
    refresh,
  } = useHeroProfile(user?.id, user?.email, projectId || null)

  // Journey map data
  const {
    moments,
    addMoment,
    deleteMoment,
  } = useJourneyMap(user?.id)

  // Codex data
  const { totalProgress: codexProgress } = useCodex(user?.id)

  // Calculate journey progress flags from archetypes and projects
  const hasFlowFinder = projects.some(p => p.stage >= 1) || archetypes?.essenceArchetype
  const hasVoice = !!archetypes?.protectiveVoice
  const currentStage = projects.reduce((max, p) => Math.max(max, p.stage || 0), 0)

  if (loading) {
    return (
      <div className="hero-profile">
        <div className="hero-loading">
          <div className="hero-loading-spinner" />
          <p>Loading your hero profile...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="hero-profile">
        <div className="hero-error">
          <p>Something went wrong loading your profile.</p>
          <button onClick={() => window.location.reload()}>Try Again</button>
        </div>
      </div>
    )
  }

  // If projectId is in the URL, show the detail view
  if (projectId) {
    return (
      <div className="hero-profile">
        <ProjectDetailView
          archetypes={archetypes}
          project={projectDetail}
          groanChallenges={groanChallenges}
          visibilityProgress={visibilityProgress}
        />
      </div>
    )
  }

  // Main dashboard view
  return (
    <div className="hero-profile">
      {/* Header */}
      <div className="hero-profile-header">
        <div className="header-left">
          <h1 className="header-title">Hero Command Center</h1>
        </div>
        <div className="header-xp">
          ⚡ {totalXP.toLocaleString()} XP
        </div>
      </div>

      {/* Hero Identity Card */}
      <HeroIdentityCard
        archetypes={archetypes}
        userId={user?.id}
        userEmail={user?.email}
        projects={projects}
        onLearnMore={() => navigate('/archetypes')}
        onViewEssence={() => navigate('/archetypes/essence')}
        onViewProtective={() => navigate('/archetypes/protective')}
        onRefresh={refresh}
      />

      {/* Journey Map */}
      <JourneyMap
        currentStage={currentStage}
        hasFlowFinder={hasFlowFinder}
        hasVoice={hasVoice}
        moments={moments}
        onAddMoment={addMoment}
        onDeleteMoment={deleteMoment}
      />

      {/* Essence vs Protective Voice Tracker */}
      <EssenceVsProtectiveTracker
        voiceTracker={voiceTracker}
        archetypes={archetypes}
      />

      {/* Play-List (Visibility Mastery) - User-level, not project-specific */}
      <PlayListProgress
        visibilityProgress={visibilityProgress}
        groanChallenges={groanChallenges}
      />

      {/* Guidebook Preview */}
      {codexProgress && (
        <CodexPreviewCard
          totalProgress={codexProgress}
          onClick={() => navigate('/guidebook')}
        />
      )}

      {/* Projects Section */}
      <div className="projects-section">
        <div className="projects-header">
          <h2 className="projects-title">Your Expressions</h2>
          <span className="projects-count">
            Total: {projects.length} {projects.length === 1 ? 'Project' : 'Projects'}
          </span>
        </div>

        {/* Project Cards */}
        <div className="projects-list">
          {projects.map(project => (
            <ProjectExpressionCard
              key={project.id}
              project={project}
              visibilityProgress={visibilityProgress}
            />
          ))}

          {/* Create New Expression */}
          <CreateExpressionCard
            onClick={() => navigate('/nikigai/skills')}
            isFirst={projects.length === 0}
          />
        </div>
      </div>
    </div>
  )
}

export default HeroCommandCenter
