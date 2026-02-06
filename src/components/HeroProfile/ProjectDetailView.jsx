import React from 'react'
import { useNavigate, Link } from 'react-router-dom'
import HeroStoryNarrative from './HeroStoryNarrative'
import IdentityTriad from './IdentityTriad'
import BusinessJourneyTracker from './BusinessJourneyTracker'

/**
 * ProjectDetailView - Full project view with journey progress and Play-List
 *
 * Shows:
 * - Back button to hero profile
 * - Project name and XP
 * - "Your Story" narrative
 * - Identity Triad (Gift/Cause/Tribe)
 * - Business Journey tracker (8 stages)
 * - Play-List progress (5 visibility layers)
 * - Active Play-List items (groan challenges)
 */
function ProjectDetailView({ archetypes, project, groanChallenges, visibilityProgress }) {
  const navigate = useNavigate()

  if (!project) {
    return (
      <div className="project-detail">
        <div className="detail-not-found">
          <p>Project not found</p>
          <button onClick={() => navigate('/hero-profile')}>Back to Profile</button>
        </div>
      </div>
    )
  }

  // Filter active (non-completed) challenges for display
  const activeChallenges = groanChallenges.filter(
    c => c.status === 'active' || c.status === 'accepted'
  )

  return (
    <div className="project-detail">
      {/* Header */}
      <div className="detail-header">
        <button className="back-button" onClick={() => navigate('/hero-profile')}>
          ← Back to Profile
        </button>
        <span className="detail-xp">⚡ {(project.xp || 0).toLocaleString()} XP</span>
      </div>

      <h2 className="detail-project-name">{project.name}</h2>

      {/* Identity Triad */}
      <IdentityTriad
        skill={project.skill}
        problem={project.problem}
        persona={project.persona}
      />

      {/* Your Story */}
      <HeroStoryNarrative
        archetypes={archetypes}
        project={project}
      />

      {/* Business Journey */}
      <BusinessJourneyTracker currentStage={project.stage} />

      {/* Active Play-List Items */}
      {activeChallenges.length > 0 ? (
        <div className="active-playlist">
          <h3 className="active-playlist-title">Active Play-List Items</h3>
          <div className="active-playlist-items">
            {activeChallenges.map(challenge => (
              <div key={challenge.id} className="playlist-item">
                <span className="playlist-checkbox">☐</span>
                <div className="playlist-item-content">
                  <span className="playlist-item-title">{challenge.title}</span>
                  <div className="playlist-item-meta">
                    <span className="playlist-item-layer">
                      {challenge.visibility_layer?.toUpperCase()}
                    </span>
                    {challenge.xp_reward && (
                      <span className="playlist-item-xp">+{challenge.xp_reward} XP</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="active-playlist">
          <h3 className="active-playlist-title">Active Play-List Items</h3>
          <p className="playlist-empty-text">
            No active challenges yet. Generate courage challenges in the{' '}
            <Link to="/7-day-challenge?tab=groans" className="hero-profile-link">
              Groan Matrix →
            </Link>{' '}
            to start your Play-List.
          </p>
        </div>
      )}
    </div>
  )
}

export default ProjectDetailView
