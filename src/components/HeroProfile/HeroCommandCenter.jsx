import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { useHeroProfile } from '../../hooks/useHeroProfile'
import HeroIdentityCard from './HeroIdentityCard'
import ProjectExpressionCard, { CreateExpressionCard } from './ProjectExpressionCard'
import ProjectDetailView from './ProjectDetailView'
import PlayListProgress from './PlayListProgress'
import EssenceVsProtectiveTracker from './EssenceVsProtectiveTracker'
import './HeroProfile.css'

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
          <button className="back-button" onClick={() => navigate('/me')}>
            ←
          </button>
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
