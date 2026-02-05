import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { useCodex } from '../hooks/useCodex'
import './Codex.css'

/**
 * Get unlock hint text based on entry unlock conditions
 */
function getUnlockHint(entry) {
  const { unlockTrigger, unlockValue } = entry

  switch (unlockTrigger) {
    case 'voice_identified':
      if (unlockValue === true) return 'Identify your Protective Voice to unlock'
      return `Identify ${unlockValue} as your voice to unlock`
    case 'voice_faced':
      return `Complete 3+ challenges facing ${unlockValue} to unlock`
    case 'onboarding_complete':
      return 'Complete onboarding to unlock'
    case 'flow_finder_complete':
      return 'Complete the Flow Finder to unlock'
    case 'compass_checkin':
      return 'Do a Flow Compass check-in to unlock'
    case 'playground_count':
      return `Complete ${unlockValue} Playground challenges to unlock`
    case 'playground_layer':
      return `Complete a ${unlockValue} layer challenge to unlock`
    case 'stage_reached':
      return `Reach Stage ${unlockValue} to unlock`
    case 'days_active':
      return `Be active for ${unlockValue}+ days to unlock`
    default:
      return 'Continue your journey to unlock'
  }
}

/**
 * CodexEntryCard - Card component for entry grid display
 */
function CodexEntryCard({ entry, onClick }) {
  const { id, title, subtitle, icon, isUnlocked } = entry

  const handleKeyDown = (e) => {
    if (isUnlocked && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      onClick()
    }
  }

  return (
    <div
      className={`codex-card ${!isUnlocked ? 'locked' : ''}`}
      onClick={isUnlocked ? onClick : undefined}
      onKeyDown={isUnlocked ? handleKeyDown : undefined}
      role={isUnlocked ? 'button' : undefined}
      tabIndex={isUnlocked ? 0 : undefined}
    >
      {!isUnlocked && <span className="lock-icon">🔒</span>}

      <div className="card-content">
        <div className="card-icon">{icon}</div>
        <div className="card-text">
          <h3 className="card-title">{title}</h3>
          {subtitle && <p className="card-subtitle">{subtitle}</p>}
        </div>
        {isUnlocked && <span className="card-arrow">→</span>}
      </div>

      {!isUnlocked && (
        <p className="lock-hint">{getUnlockHint(entry)}</p>
      )}
    </div>
  )
}

/**
 * Codex - Main page with category tabs and entry grid
 */
function Codex() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    categories,
    progress,
    totalProgress,
    loading,
    error,
    getEntriesByCategory,
  } = useCodex(user?.id)

  // Get ordered categories
  const orderedCategories = useMemo(() => {
    return Object.values(categories).sort((a, b) => a.order - b.order)
  }, [categories])

  // Default to first category
  const [activeCategory, setActiveCategory] = useState(orderedCategories[0]?.id || 'voiceArchives')

  // Get current category data
  const currentCategory = categories[activeCategory]
  const categoryEntries = getEntriesByCategory(activeCategory)
  const categoryProgress = progress[activeCategory]

  if (loading) {
    return (
      <div className="codex-page">
        <div className="codex-loading">
          <div className="codex-loading-spinner" />
          <p>Loading your Guidebook...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="codex-page">
        <div className="codex-error">
          <p>Something went wrong loading the Guidebook.</p>
          <button onClick={() => window.location.reload()}>Try Again</button>
        </div>
      </div>
    )
  }

  return (
    <div className="codex-page">
      {/* Header */}
      <div className="codex-header">
        <div className="header-left">
          <button className="back-button" onClick={() => navigate('/hero-profile')}>
            ←
          </button>
          <h1 className="header-title">Guidebook</h1>
        </div>
        <div className="header-progress">
          {totalProgress.unlocked}/{totalProgress.total} Unlocked
        </div>
      </div>

      {/* Category Tabs */}
      <div className="codex-tabs">
        {orderedCategories.map(category => {
          const catProgress = progress[category.id]
          return (
            <button
              key={category.id}
              className={`codex-tab ${activeCategory === category.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(category.id)}
            >
              <span className="tab-icon">{category.icon}</span>
              <span className="tab-name">{category.name}</span>
              <span className="tab-count">
                {catProgress?.unlocked}/{catProgress?.total}
              </span>
            </button>
          )
        })}
      </div>

      {/* Category Header */}
      {currentCategory && (
        <div className="category-header">
          <h2 className="category-title">{currentCategory.name}</h2>
          <p className="category-description">{currentCategory.description}</p>
        </div>
      )}

      {/* Entry Grid */}
      <div className="codex-grid">
        {categoryEntries.length === 0 ? (
          <div className="codex-empty">
            <span className="empty-icon">📜</span>
            <p className="empty-text">No entries in this category yet.</p>
          </div>
        ) : (
          categoryEntries.map(entry => (
            <CodexEntryCard
              key={entry.id}
              entry={entry}
              onClick={() => navigate(`/guidebook/${entry.id}`)}
            />
          ))
        )}
      </div>
    </div>
  )
}

export default Codex
