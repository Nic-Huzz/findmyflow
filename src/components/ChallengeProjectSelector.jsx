/**
 * ChallengeProjectSelector.jsx
 *
 * Allows users to select which project to focus on for their 7-day challenge.
 * Once selected, the project is locked for the duration of the challenge.
 *
 * Features:
 * - Shows all active projects with their current stage
 * - Highlights primary project
 * - Shows project points and progress
 * - Inline "Add New Project" via MultiProductCapture
 *
 * Created: Dec 2024
 * Part of project-based refactor (see docs/2024-12-20-major-refactor-plan.md)
 */

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import { STAGE_CONFIG } from '../lib/stageConfig'
import { createProjectFromProductCapture } from '../lib/projectCreation'
import MultiProductCapture from './onboarding/QuickCapture/MultiProductCapture'
import './ChallengeProjectSelector.css'

function ChallengeProjectSelector({ onSelect, currentProjectId }) {
  const { user } = useAuth()

  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState(currentProjectId || null)
  const [showAddProject, setShowAddProject] = useState(false)
  const [saving, setSaving] = useState(false)

  // Add body class to hide bottom toolbar when project selector is shown
  useEffect(() => {
    document.body.classList.add('project-selector-active')
    return () => {
      document.body.classList.remove('project-selector-active')
    }
  }, [])

  // Sync selectedId with currentProjectId when it changes
  useEffect(() => {
    if (currentProjectId) {
      setSelectedId(currentProjectId)
    }
  }, [currentProjectId])

  // Load projects on mount and whenever the selector is shown
  useEffect(() => {
    if (user?.id) {
      loadProjects()
    }
  }, [user])

  const loadProjects = async () => {
    try {
      // Load projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('user_projects')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: false })

      if (projectsError) throw projectsError

      // Load challenge progress for all projects to get accurate points
      const projectIds = (projectsData || []).map(p => p.id)
      let challengeData = null

      if (projectIds.length > 0) {
        const { data, error: challengeError } = await supabase
          .from('challenge_progress')
          .select('project_id, total_points, status')
          .eq('user_id', user.id)
          .in('project_id', projectIds)
          .order('challenge_start_date', { ascending: false })

        if (challengeError) {
          console.error('Error loading challenge progress:', challengeError)
        }
        challengeData = data
      }

      // Deduplicate challenge progress: keep first (most recent) per project
      const progressByProject = new Map()
      ;(challengeData || []).forEach(c => {
        if (!progressByProject.has(c.project_id)) {
          progressByProject.set(c.project_id, c)
        }
      })

      // Merge challenge points into projects
      const projectsWithPoints = (projectsData || []).map(project => {
        const challengeProgress = progressByProject.get(project.id)
        return {
          ...project,
          challenge_points: challengeProgress?.total_points || 0,
          has_active_challenge: challengeProgress?.status === 'active'
        }
      })

      setProjects(projectsWithPoints)

      // Auto-select primary or first project if none selected
      if (!selectedId && projectsWithPoints.length > 0) {
        const primary = projectsWithPoints.find(p => p.is_primary)
        setSelectedId(primary?.id || projectsWithPoints[0].id)
      }

      // Auto-confirm if there's exactly one project (skip selector entirely)
      if (projectsWithPoints.length === 1 && onSelect) {
        onSelect(projectsWithPoints[0])
        return
      }
    } catch (err) {
      console.error('Error loading projects:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (projectId) => {
    setSelectedId(projectId)
  }

  const handleConfirm = () => {
    const selectedProject = projects.find(p => p.id === selectedId)
    if (selectedProject && onSelect) {
      onSelect(selectedProject)
    }
  }

  const handleNewProductsCreated = async (completedProducts) => {
    if (!completedProducts || completedProducts.length === 0) {
      setShowAddProject(false)
      return
    }
    setSaving(true)
    try {
      let firstNewProjectId = null
      for (const product of completedProducts) {
        const result = await createProjectFromProductCapture(user.id, product, 'challenge_add_project')
        if (result.success && !firstNewProjectId) {
          firstNewProjectId = result.projectId
        }
      }
      // Refresh project list, auto-select the new project
      await loadProjects()
      if (firstNewProjectId) setSelectedId(firstNewProjectId)
    } catch (err) {
      console.error('Error creating project from product capture:', err)
    } finally {
      setShowAddProject(false)
      setSaving(false)
    }
  }

  const getStageInfo = (stageNumber) => {
    return STAGE_CONFIG[stageNumber] || { name: `Stage ${stageNumber}`, icon: '📍', color: '#5e17eb' }
  }

  if (loading) {
    return (
      <div className="project-selector loading">
        <div className="loading-spinner" />
        <p>Loading your projects...</p>
      </div>
    )
  }

  if (projects.length === 0 && !showAddProject) {
    return (
      <div className="project-selector empty">
        <div className="empty-state">
          <span className="empty-icon">📁</span>
          <h3>No Projects Yet</h3>
          <p>Complete the Mind Space to create a project and start your 7-day challenge.</p>
          <button
            className="primary-button"
            onClick={() => { window.location.href = '/mind-space' }}
          >
            Start Mind Space
          </button>
        </div>
      </div>
    )
  }

  if (showAddProject) {
    return (
      <div className="project-selector add-project-mode">
        <div className="selector-header">
          <h2>Add a New Project</h2>
          <p>Tell us about your product or service</p>
        </div>
        {saving ? (
          <div className="saving-state">
            <div className="loading-spinner" />
            <p>Creating your project...</p>
          </div>
        ) : (
          <MultiProductCapture
            userId={user.id}
            wealthLadder={null}
            storageKeyPrefix="challenge_add_project"
            onComplete={handleNewProductsCreated}
            onBack={() => {
              localStorage.removeItem(`challenge_add_project_${user.id}`)
              setShowAddProject(false)
            }}
          />
        )}
      </div>
    )
  }

  return (
    <div className="project-selector">
      <div className="selector-header">
        <h2>Select The Focus For This Challenge</h2>
        <p>This project will be the focus for this 7-day challenge</p>
      </div>

      <div className="projects-list">
        {projects.map(project => {
          const stageInfo = getStageInfo(project.current_stage)
          const isSelected = selectedId === project.id

          return (
            <div
              key={project.id}
              className={`project-card ${isSelected ? 'selected' : ''} ${project.is_primary ? 'primary' : ''}`}
              onClick={() => handleSelect(project.id)}
            >
              {project.is_primary && (
                <span className="primary-badge">Primary</span>
              )}

              <div className="project-info">
                <h3>{project.name}</h3>
                {project.description && (
                  <p className="project-description">{project.description.replace(/_/g, ' ')}</p>
                )}
              </div>

              <div className="project-meta">
                <div className="stage-badge">
                  <span className="stage-icon">{stageInfo.icon}</span>
                  <span className="stage-name">{stageInfo.name}</span>
                </div>

                <div className="points-badge">
                  <span className="points-value">{project.challenge_points || 0}</span>
                  <span className="points-label">XP</span>
                </div>
              </div>

              <div className="selection-indicator">
                {isSelected ? '✓' : '○'}
              </div>
            </div>
          )
        })}
      </div>

      <div className="selector-actions">
        <button
          className="primary-button"
          onClick={handleConfirm}
          disabled={!selectedId}
        >
          Continue Challenge with This Project
        </button>

        <button
          className="secondary-button"
          onClick={() => setShowAddProject(true)}
        >
          + Create New Project
        </button>
      </div>
    </div>
  )
}

export default ChallengeProjectSelector
