/**
 * ProjectSwitcher.jsx
 * Dropdown to switch between user's projects in the CRM Command Center
 */
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import './ProjectSwitcher.css'

export default function ProjectSwitcher({ userId, currentProject, onProjectChange }) {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const dropdownRef = useRef(null)

  useEffect(() => {
    if (userId) {
      loadProjects()
    }
  }, [userId])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function loadProjects() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('user_projects')
        .select('id, name, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading projects:', error)
        return
      }

      setProjects(data || [])

      // If no current project is selected but we have projects, select the first one
      if (!currentProject && data && data.length > 0) {
        onProjectChange(data[0])
      }
    } catch (err) {
      console.error('Error loading projects:', err)
    } finally {
      setLoading(false)
    }
  }

  function handleSelectProject(project) {
    onProjectChange(project)
    setIsOpen(false)
  }

  function handleCreateProject() {
    setIsOpen(false)
    // Navigate to project creation flow
    navigate('/offer-builder-v2')
  }

  if (loading) {
    return (
      <div className="project-switcher loading">
        <span className="project-icon">...</span>
      </div>
    )
  }

  // If no projects, show a simplified create button
  if (projects.length === 0) {
    return (
      <div className="project-switcher no-projects">
        <button className="create-first-btn" onClick={handleCreateProject}>
          + Create Your First Offer
        </button>
      </div>
    )
  }

  return (
    <div className="project-switcher" ref={dropdownRef}>
      <button
        className="current-project"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="project-icon">&#128193;</span>
        <span className="project-name">
          {currentProject?.name || 'Select Project'}
        </span>
        <span className={`dropdown-arrow ${isOpen ? 'open' : ''}`}>&#9660;</span>
      </button>

      {isOpen && (
        <div className="project-dropdown" role="listbox">
          {projects.map(project => (
            <button
              key={project.id}
              className={`project-option ${project.id === currentProject?.id ? 'active' : ''}`}
              onClick={() => handleSelectProject(project)}
              role="option"
              aria-selected={project.id === currentProject?.id}
            >
              <span className="option-name">{project.name}</span>
              {project.id === currentProject?.id && (
                <span className="checkmark">&#10003;</span>
              )}
            </button>
          ))}
          <hr className="dropdown-divider" />
          <button className="new-project-btn" onClick={handleCreateProject}>
            + Create New Offer
          </button>
        </div>
      )}
    </div>
  )
}
