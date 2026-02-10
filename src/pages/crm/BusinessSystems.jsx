/**
 * Business Systems - Flywheel Setup Checklist
 * Guided checklist showing users what business systems to build
 */
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { ECOSYSTEM_PHASES } from '../../lib/crm/ecosystemConfig'
import { getEcosystemProgress, toggleSystemItem } from '../../lib/crm/ecosystemService'
import PullToRefresh from '../../components/crm/PullToRefresh'
import { hapticLight, hapticMedium } from '../../lib/haptics'
import './BusinessSystems.css'

export default function BusinessSystems() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [activePhase, setActivePhase] = useState('foundation')
  const [progressMap, setProgressMap] = useState({})

  const loadProgress = useCallback(async () => {
    if (!user?.id) return
    const data = await getEcosystemProgress(user.id)
    setProgressMap(data)
    setLoading(false)
  }, [user?.id])

  useEffect(() => {
    if (user?.id) loadProgress()
  }, [user?.id, loadProgress])

  const handleToggle = async (phase, itemId) => {
    const key = `${phase}:${itemId}`
    const current = progressMap[key]?.completed || false
    const newCompleted = !current

    // Optimistic update
    setProgressMap(prev => ({
      ...prev,
      [key]: { ...prev[key], completed: newCompleted, auto: false },
    }))

    hapticMedium()
    await toggleSystemItem(user.id, phase, itemId, newCompleted)
  }

  const getPhaseProgress = (phase) => {
    const completed = phase.items.filter(item => {
      const key = `${phase.id}:${item.id}`
      return progressMap[key]?.completed
    }).length
    return {
      completed,
      total: phase.items.length,
      percent: phase.items.length > 0
        ? Math.round((completed / phase.items.length) * 100)
        : 0,
    }
  }

  // Compute overall stats across all phases
  const overallStats = useMemo(() => {
    let totalCompleted = 0
    let totalItems = 0
    let phasesComplete = 0
    ECOSYSTEM_PHASES.forEach(phase => {
      const prog = getPhaseProgress(phase)
      totalCompleted += prog.completed
      totalItems += prog.total
      if (prog.percent === 100) phasesComplete++
    })
    const overallPercent = totalItems > 0 ? Math.round((totalCompleted / totalItems) * 100) : 0
    return { totalCompleted, totalItems, overallPercent, phasesComplete }
  }, [progressMap])

  if (loading) {
    return (
      <div className="biz-systems-page">
        <div className="tower-toolbar">
          <button className="tower-toolbar-back" onClick={() => navigate('/crm/tools')}>←</button>
          <h2 className="tower-toolbar-title">Business Systems</h2>
        </div>
        <div className="biz-loading">
          <div className="biz-spinner"></div>
          <p>Loading systems...</p>
        </div>
      </div>
    )
  }

  const currentPhase = ECOSYSTEM_PHASES.find(p => p.id === activePhase) || ECOSYSTEM_PHASES[0]
  const currentProgress = getPhaseProgress(currentPhase)

  return (
    <PullToRefresh onRefresh={loadProgress}>
      <div className="biz-systems-page">
        {/* Toolbar */}
        <div className="tower-toolbar">
          <button className="tower-toolbar-back" onClick={() => navigate('/crm/tools')}>
            ←
          </button>
          <h2 className="tower-toolbar-title">Business Systems</h2>
        </div>

        {/* Dark Hero Stats Card */}
        <div className="biz-hero">
          <div className="biz-hero-stats">
            <div className="biz-hero-stat">
              <span className="biz-hero-value gold">{overallStats.overallPercent}%</span>
              <span className="biz-hero-label">Complete</span>
            </div>
            <div className="biz-hero-divider"></div>
            <div className="biz-hero-stat">
              <span className="biz-hero-value">{overallStats.totalCompleted}/{overallStats.totalItems}</span>
              <span className="biz-hero-label">Systems</span>
            </div>
            <div className="biz-hero-divider"></div>
            <div className="biz-hero-stat">
              <span className="biz-hero-value">{overallStats.phasesComplete}/{ECOSYSTEM_PHASES.length}</span>
              <span className="biz-hero-label">Phases</span>
            </div>
          </div>
        </div>

        {/* Phase Tabs */}
        <div className="biz-phase-tabs">
          {ECOSYSTEM_PHASES.map(phase => {
            const prog = getPhaseProgress(phase)
            return (
              <button
                key={phase.id}
                className={`biz-phase-tab ${activePhase === phase.id ? 'active' : ''}`}
                onClick={() => { setActivePhase(phase.id); hapticLight() }}
              >
                <span className="biz-phase-tab-icon">{phase.icon}</span>
                <span className="biz-phase-tab-label">{phase.name}</span>
                <span className="biz-phase-tab-pct">{prog.percent}%</span>
              </button>
            )
          })}
        </div>

        {/* Phase Content */}
        <div className="biz-phase-content">
          <p className="biz-phase-desc">{currentPhase.description}</p>

          {/* Progress bar */}
          <div className="biz-progress-wrap">
            <div className="biz-progress-bar">
              <div
                className="biz-progress-fill"
                style={{ width: `${currentProgress.percent}%` }}
              />
            </div>
            <span className="biz-progress-label">
              {currentProgress.completed}/{currentProgress.total} complete
            </span>
          </div>

          {/* Checklist */}
          <div className="biz-checklist">
            {currentPhase.items.map(item => {
              const key = `${currentPhase.id}:${item.id}`
              const state = progressMap[key] || {}
              const isCompleted = state.completed || false
              const isAuto = state.auto || false

              return (
                <div key={item.id} className={`biz-check-item ${isCompleted ? 'completed' : ''}`}>
                  <button
                    className={`biz-checkbox ${isCompleted ? 'checked' : ''}`}
                    onClick={() => handleToggle(currentPhase.id, item.id)}
                    aria-label={isCompleted ? 'Mark incomplete' : 'Mark complete'}
                  >
                    {isCompleted ? '✓' : ''}
                  </button>
                  <span className="biz-check-label">{item.label}</span>
                  {isAuto && isCompleted && (
                    <span className="biz-auto-badge">Auto</span>
                  )}
                  {item.link && (
                    <button
                      className="biz-check-link"
                      onClick={(e) => {
                        e.stopPropagation()
                        hapticLight()
                        navigate(item.link)
                      }}
                    >
                      Build →
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </PullToRefresh>
  )
}
