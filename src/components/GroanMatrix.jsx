/**
 * GroanMatrix.jsx
 * Full matrix view of courage challenges
 *
 * Matrix structure:
 * - Rows: Skills, Problems, or Personas (from Flow Finder)
 * - Columns: 5 visibility layers (Screen, Live, Money, Vulnerable, Authority)
 *
 * Features:
 * - Toggle between source types (tabs)
 * - Click cell to view/generate challenge
 * - Visual indicators for essence zones, completed, in-progress
 * - Stats bar showing overall progress
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import {
  GROAN_VISIBILITY_LAYERS,
  GROAN_SOURCE_TYPES,
  getVisibilityLayer
} from '../lib/stageConfig'
import {
  fetchFlowFinderData,
  getMatrixCellChallenges,
  hasCompletedFlowFinder,
  getGroanStats
} from '../lib/crm'
import './GroanMatrix.css'

const SOURCE_TABS = [
  { id: 'skill', label: 'Skills', icon: '🎯' },
  { id: 'problem', label: 'Problems', icon: '🔧' },
  { id: 'persona', label: 'Personas', icon: '👥' },
  { id: 'skill_x_problem', label: 'Skill × Problem', icon: '⚡' }
]

function GroanMatrix({
  userId,
  onCellClick,
  onGenerateChallenge,
  compact = false,
  layerLockStatus = {},
  flowFinderComplete: flowFinderCompleteProp
}) {
  const navigate = useNavigate()
  const [activeSourceType, setActiveSourceType] = useState('skill')
  const [flowFinderData, setFlowFinderData] = useState(null)
  const [challenges, setChallenges] = useState({})
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingCell, setLoadingCell] = useState(null)
  const [flowFinderCompleteInternal, setFlowFinderCompleteInternal] = useState(true)
  const [selectedPersona, setSelectedPersona] = useState(null) // For Skill × Problem tab

  // Use parent's check when available, fall back to internal check.
  // When rendered from Challenge.jsx, the prop is always final (Challenge shows
  // a skeleton loader until all checks complete, so GroanMatrix only mounts after).
  const flowFinderComplete = flowFinderCompleteProp ?? flowFinderCompleteInternal

  // Fetch initial data
  useEffect(() => {
    if (!userId) return
    loadData()
  }, [userId])

  const loadData = async () => {
    setLoading(true)

    // If parent already confirmed Flow Finder is complete, skip the redundant check.
    // Otherwise (standalone usage, e.g. /groan-matrix route), verify ourselves.
    if (flowFinderCompleteProp == null) {
      const { completed } = await hasCompletedFlowFinder(userId)
      setFlowFinderCompleteInternal(completed)

      if (!completed) {
        setLoading(false)
        return
      }
    } else if (!flowFinderCompleteProp) {
      // Parent confirmed not complete — show empty state
      setLoading(false)
      return
    }

    // Fetch all three data sources in parallel (they're independent)
    const [ffResult, statsResult, challengesResult] = await Promise.all([
      fetchFlowFinderData(userId),
      getGroanStats(userId),
      supabase.from('groan_challenges').select('*').eq('user_id', userId)
    ])

    const { data: ffData } = ffResult
    setFlowFinderData(ffData)

    const { data: statsData } = statsResult
    setStats(statsData)

    const { data: allChallenges } = challengesResult

    // Organize challenges by source+layer key
    // Also organize skill × problem challenges separately
    const challengeMap = {}
    ;(allChallenges || []).forEach(c => {
      // Standard matrix key (source × visibility layer)
      const key = `${c.source_type}_${c.source_id}_${c.visibility_layer}`
      if (!challengeMap[key]) {
        challengeMap[key] = []
      }
      challengeMap[key].push(c)

      // Skill × Problem matrix key (if applicable)
      if (c.skill_cluster_id && c.problem_cluster_id) {
        const spKey = `skill_x_problem_${c.skill_cluster_id}_${c.problem_cluster_id}${c.persona_cluster_id ? `_${c.persona_cluster_id}` : ''}`
        if (!challengeMap[spKey]) {
          challengeMap[spKey] = []
        }
        challengeMap[spKey].push(c)
      }
    })
    setChallenges(challengeMap)

    setLoading(false)
  }

  // Get current source items based on active tab
  const getCurrentSourceItems = () => {
    if (!flowFinderData) return []

    switch (activeSourceType) {
      case 'skill':
        return flowFinderData.skills || []
      case 'problem':
        return flowFinderData.problems || []
      case 'persona':
        return flowFinderData.personas || []
      default:
        return []
    }
  }

  // Get challenges for a specific cell
  const getCellChallenges = (sourceId, layerId) => {
    const key = `${activeSourceType}_${sourceId}_${layerId}`
    return challenges[key] || []
  }

  // Get the most recent/active challenge for a cell
  const getCellActiveChallenge = (sourceId, layerId) => {
    const cellChallenges = getCellChallenges(sourceId, layerId)
    if (cellChallenges.length === 0) return null

    // Prioritize: active (in progress with accepted_at) > active (new) > completed
    // Note: DB uses 'active' for both generated and accepted states
    const inProgress = cellChallenges.find(c => c.status === 'active' && c.accepted_at)
    if (inProgress) return inProgress

    const ready = cellChallenges.find(c => c.status === 'active' && !c.accepted_at)
    if (ready) return ready

    // Return most recently completed
    const completed = cellChallenges
      .filter(c => c.status === 'completed')
      .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))
    return completed[0] || null
  }

  // Get challenges for a Skill × Problem cell
  const getSkillProblemCellChallenges = (skillId, problemId) => {
    const key = `skill_x_problem_${skillId}_${problemId}${selectedPersona ? `_${selectedPersona}` : ''}`
    return challenges[key] || []
  }

  // Get the active challenge for a Skill × Problem cell
  const getSkillProblemActiveChallenge = (skillId, problemId) => {
    const cellChallenges = getSkillProblemCellChallenges(skillId, problemId)
    if (cellChallenges.length === 0) return null

    // Same prioritization as regular cells
    const inProgress = cellChallenges.find(c => c.status === 'active' && c.accepted_at)
    if (inProgress) return inProgress

    const ready = cellChallenges.find(c => c.status === 'active' && !c.accepted_at)
    if (ready) return ready

    const completed = cellChallenges
      .filter(c => c.status === 'completed')
      .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))
    return completed[0] || null
  }

  // Handle cell click
  const handleCellClick = (sourceItem, layer) => {
    const challenge = getCellActiveChallenge(sourceItem.id, layer.id)

    if (onCellClick) {
      onCellClick({
        sourceType: activeSourceType,
        sourceItem,
        layer,
        challenge,
        cellChallenges: getCellChallenges(sourceItem.id, layer.id)
      })
    }
  }

  // Handle generate click
  const handleGenerateClick = async (e, sourceItem, layer) => {
    e.stopPropagation()

    if (onGenerateChallenge) {
      setLoadingCell(`${sourceItem.id}_${layer.id}`)

      await onGenerateChallenge({
        sourceType: activeSourceType,
        sourceId: sourceItem.id,
        sourceLabel: sourceItem.cluster_label,
        sourceInsight: sourceItem.insight,
        visibilityLayer: layer.id
      })

      // Refresh challenges
      await loadData()
      setLoadingCell(null)
    }
  }

  // Handle Skill × Problem cell click
  const handleSkillProblemCellClick = (skill, problem) => {
    const challenge = getSkillProblemActiveChallenge(skill.id, problem.id)
    const persona = selectedPersona
      ? (flowFinderData?.personas || []).find(p => p.id === selectedPersona)
      : null

    if (onCellClick) {
      onCellClick({
        sourceType: 'skill_x_problem',
        skill,
        problem,
        persona,
        challenge,
        cellChallenges: getSkillProblemCellChallenges(skill.id, problem.id)
      })
    }
  }

  // Handle Skill × Problem generate click
  const handleSkillProblemGenerateClick = async (e, skill, problem) => {
    e.stopPropagation()

    if (onGenerateChallenge) {
      const cellKey = `sp_${skill.id}_${problem.id}`
      setLoadingCell(cellKey)

      const persona = selectedPersona
        ? (flowFinderData?.personas || []).find(p => p.id === selectedPersona)
        : null

      await onGenerateChallenge({
        sourceType: 'skill_x_problem',
        skillId: skill.id,
        skillLabel: skill.cluster_label,
        skillInsight: skill.insight,
        problemId: problem.id,
        problemLabel: problem.cluster_label,
        problemInsight: problem.insight,
        personaId: persona?.id || null,
        personaLabel: persona?.cluster_label || null,
        personaInsight: persona?.insight || null
      })

      // Refresh challenges
      await loadData()
      setLoadingCell(null)
    }
  }

  // Render empty state (Flow Finder not complete)
  if (!loading && !flowFinderComplete) {
    return (
      <div className="groan-matrix">
        <div className="groan-matrix-empty">
          <div className="groan-matrix-empty-icon">🧭</div>
          <h3 className="groan-matrix-empty-title">Find Your Flow First</h3>
          <p className="groan-matrix-empty-text">
            To unlock personalized courage challenges, you need to discover your
            unique skills, problems, and personas through the Mind Space.
          </p>
          <button
            className="groan-matrix-empty-cta"
            onClick={() => navigate('/mind-space')}
          >
            Start Mind Space
          </button>
        </div>
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="groan-matrix">
        <div className="groan-cell-loading" style={{ padding: '3rem' }}>
          <div className="groan-loading-spinner" />
          <div className="groan-loading-text">Loading matrix...</div>
        </div>
      </div>
    )
  }

  const sourceItems = getCurrentSourceItems()

  return (
    <div className="groan-matrix">
      {/* Header */}
      <div className="groan-matrix-header">
        <div className="groan-matrix-title-row">
          <h2 className="groan-matrix-title">Play-list Matrix</h2>
          <a href="/play-list-explainer" className="groan-matrix-explainer-btn">Explainer</a>
        </div>

        <div className="groan-matrix-controls">
          {/* Source type tabs */}
          <div className="groan-source-tabs">
            {SOURCE_TABS.map(tab => (
              <button
                key={tab.id}
                className={`groan-source-tab ${activeSourceType === tab.id ? 'active' : ''}`}
                onClick={() => setActiveSourceType(tab.id)}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Persona dropdown for Skill × Problem tab */}
      {activeSourceType === 'skill_x_problem' && flowFinderData?.personas?.length > 0 && (
        <div className="groan-persona-filter">
          <label className="groan-filter-label">Filter by Persona:</label>
          <select
            className="groan-filter-select"
            value={selectedPersona || ''}
            onChange={(e) => setSelectedPersona(e.target.value || null)}
          >
            <option value="">All Personas</option>
            {flowFinderData.personas.map(persona => (
              <option key={persona.id} value={persona.id}>
                {persona.cluster_label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Stats bar */}
      {stats && !compact && (
        <div className="groan-stats-bar">
          <div className="groan-stat">
            <div className="groan-stat-value">{stats.completed}</div>
            <div className="groan-stat-label">Completed</div>
          </div>
          <div className="groan-stat">
            <div className="groan-stat-value">{stats.byEssenceZone?.essence?.completed || 0}</div>
            <div className="groan-stat-label">
              Essence Zones
              <span className="groan-essence-info" title="Challenges where both scary AND excitement scores are 7+. These are closest to your true calling — what terrifies and excites you most.">ⓘ</span>
            </div>
          </div>
        </div>
      )}

      {/* Matrix grid - Standard view (Skills/Problems/Personas × Visibility Layers) */}
      {activeSourceType !== 'skill_x_problem' && (
        <div className="groan-matrix-grid">
          {/* Header row with visibility layers */}
          <div className="groan-matrix-header-row">
            <div className="groan-header-cell corner" />
            {GROAN_VISIBILITY_LAYERS.map(layer => {
              const isLocked = layerLockStatus[layer.id]?.locked
              return (
                <div
                  key={layer.id}
                  className={`groan-header-cell ${isLocked ? 'locked' : ''}`}
                  style={{ '--layer-color': layer.color }}
                >
                  <span className="groan-layer-icon">{isLocked ? '🔒' : layer.icon}</span>
                  <span className="groan-layer-label">{layer.label}</span>
                  {!compact && (
                    <span className="groan-layer-fear">
                      {isLocked ? layerLockStatus[layer.id].message : layer.fear}
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          {/* Data rows */}
          {sourceItems.length === 0 ? (
            <div className="groan-matrix-empty" style={{ gridColumn: '1 / -1' }}>
              <div className="groan-matrix-empty-icon">🧭</div>
              <h3 className="groan-matrix-empty-title">Find Your Flow</h3>
              <p className="groan-matrix-empty-text">
                No {activeSourceType}s found. Complete the Mind Space to unlock personalized challenges.
              </p>
              <button
                className="groan-matrix-empty-cta"
                onClick={() => navigate('/mind-space')}
              >
                Start Mind Space
              </button>
            </div>
          ) : (
            sourceItems.map(sourceItem => (
              <div key={sourceItem.id} className="groan-matrix-row">
                {/* Row label */}
                <div className="groan-row-label">
                  <span className="groan-row-label-text" title={sourceItem.cluster_label}>
                    {sourceItem.cluster_label}
                  </span>
                </div>

                {/* Cells for each visibility layer */}
                {GROAN_VISIBILITY_LAYERS.map(layer => {
                  const isLocked = layerLockStatus[layer.id]?.locked
                  const challenge = getCellActiveChallenge(sourceItem.id, layer.id)
                  const isLoading = loadingCell === `${sourceItem.id}_${layer.id}`
                  const isEssenceZone = challenge?.essence_zone === 'essence'

                  if (isLocked) {
                    return (
                      <div
                        key={layer.id}
                        className="groan-matrix-cell locked"
                        style={{ '--layer-color': layer.color }}
                      >
                        <div className="groan-cell-locked">
                          <span className="groan-cell-locked-icon">🔒</span>
                        </div>
                      </div>
                    )
                  }

                  return (
                    <div
                      key={layer.id}
                      className={`groan-matrix-cell ${
                        challenge ? 'has-challenge' : ''
                      } ${
                        challenge?.status === 'completed' ? 'completed' : ''
                      } ${
                        (challenge?.status === 'active' && challenge?.accepted_at) ? 'in-progress' : ''
                      } ${
                        isEssenceZone ? 'essence-zone' : ''
                      }`}
                      style={{ '--layer-color': layer.color }}
                      onClick={() => handleCellClick(sourceItem, layer)}
                    >
                      {isLoading ? (
                        <div className="groan-cell-loading">
                          <div className="groan-loading-spinner" />
                          <span className="groan-loading-text">Generating...</span>
                        </div>
                      ) : challenge ? (
                        <div className="groan-cell-challenge">
                          {isEssenceZone && (
                            <span className="groan-essence-badge">ESSENCE</span>
                          )}
                          <div className="groan-cell-title">{challenge.title}</div>
                          <div className="groan-cell-status">
                            {challenge.status === 'completed' && (
                              <>
                                <span className="groan-cell-status-icon">✓</span>
                                Done
                              </>
                            )}
                            {challenge.status === 'active' && challenge.accepted_at && (
                              <>
                                <span className="groan-cell-status-icon">⏳</span>
                                In Progress
                              </>
                            )}
                            {challenge.status === 'active' && !challenge.accepted_at && (
                              <>
                                <span className="groan-cell-status-icon">👀</span>
                                View
                              </>
                            )}
                          </div>
                          {!compact && challenge.scary_score && challenge.wahoo_score && (
                            <div className="groan-cell-scores">
                              <span className="groan-score scary">
                                😰 {challenge.scary_score}
                              </span>
                              <span className="groan-score wahoo">
                                🎉 {challenge.wahoo_score}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="groan-cell-empty">
                          {onCellClick ? (
                            <button
                              className="groan-generate-btn"
                              onClick={(e) => {
                                e.stopPropagation()
                                onCellClick({
                                  sourceType: activeSourceType,
                                  sourceId: sourceItem.id,
                                  sourceLabel: sourceItem.cluster_label,
                                  sourceInsight: sourceItem.insight,
                                  visibilityLayer: layer.id,
                                  layer,
                                  challenge: null
                                })
                              }}
                            >
                              + Select
                            </button>
                          ) : (
                            <>
                              <span className="groan-cell-empty-icon">+</span>
                              <span className="groan-cell-empty-text">Tap to explore</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))
          )}
        </div>
      )}

      {/* Matrix grid - Skill × Problem view */}
      {activeSourceType === 'skill_x_problem' && (
        <div className="groan-matrix-grid groan-skill-problem-grid">
          {/* Header row with problems as columns */}
          <div
            className="groan-matrix-header-row groan-sp-header"
            style={{
              gridTemplateColumns: `180px repeat(${(flowFinderData?.problems || []).length}, 1fr)`
            }}
          >
            <div className="groan-header-cell corner">
              <span className="groan-corner-label">Skills ↓ Problems →</span>
            </div>
            {(flowFinderData?.problems || []).map(problem => (
              <div
                key={problem.id}
                className="groan-header-cell groan-problem-header"
              >
                <span className="groan-layer-icon">🔧</span>
                <span className="groan-layer-label" title={problem.cluster_label}>
                  {problem.cluster_label}
                </span>
              </div>
            ))}
          </div>

          {/* Data rows - skills */}
          {(!flowFinderData?.skills?.length || !flowFinderData?.problems?.length) ? (
            <div className="groan-matrix-empty" style={{ gridColumn: '1 / -1' }}>
              <div className="groan-matrix-empty-icon">⚡</div>
              <h3 className="groan-matrix-empty-title">Complete Skills & Problems Flows</h3>
              <p className="groan-matrix-empty-text">
                The Skill × Problem matrix requires both Skills and Problems from Flow Finder.
                {!flowFinderData?.skills?.length && ' Complete the Skills flow.'}
                {!flowFinderData?.problems?.length && ' Complete the Problems flow.'}
              </p>
              <button
                className="groan-matrix-empty-cta"
                onClick={() => navigate(
                  !flowFinderData?.skills?.length ? '/nikigai/skills' : '/nikigai/problems'
                )}
              >
                Start {!flowFinderData?.skills?.length ? 'Skills' : 'Problems'} Flow
              </button>
            </div>
          ) : (
            (flowFinderData?.skills || []).map(skill => (
              <div
                key={skill.id}
                className="groan-matrix-row groan-sp-row"
                style={{
                  gridTemplateColumns: `180px repeat(${flowFinderData.problems.length}, 1fr)`
                }}
              >
                {/* Row label - skill */}
                <div className="groan-row-label">
                  <span className="groan-row-label-text" title={skill.cluster_label}>
                    🎯 {skill.cluster_label}
                  </span>
                </div>

                {/* Cells for each problem */}
                {flowFinderData.problems.map(problem => {
                  const challenge = getSkillProblemActiveChallenge(skill.id, problem.id)
                  const cellKey = `sp_${skill.id}_${problem.id}`
                  const isLoading = loadingCell === cellKey
                  const isEssenceZone = challenge?.essence_zone === 'essence'

                  return (
                    <div
                      key={problem.id}
                      className={`groan-matrix-cell groan-sp-cell ${
                        challenge ? 'has-challenge' : ''
                      } ${
                        challenge?.status === 'completed' ? 'completed' : ''
                      } ${
                        (challenge?.status === 'active' && challenge?.accepted_at) ? 'in-progress' : ''
                      } ${
                        isEssenceZone ? 'essence-zone' : ''
                      }`}
                      onClick={() => handleSkillProblemCellClick(skill, problem)}
                    >
                      {isLoading ? (
                        <div className="groan-cell-loading">
                          <div className="groan-loading-spinner" />
                          <span className="groan-loading-text">Generating...</span>
                        </div>
                      ) : challenge ? (
                        <div className="groan-cell-challenge">
                          {isEssenceZone && (
                            <span className="groan-essence-badge">ESSENCE</span>
                          )}
                          <div className="groan-cell-title">{challenge.title}</div>
                          <div className="groan-cell-status">
                            {challenge.status === 'completed' && (
                              <>
                                <span className="groan-cell-status-icon">✓</span>
                                Done
                              </>
                            )}
                            {challenge.status === 'active' && challenge.accepted_at && (
                              <>
                                <span className="groan-cell-status-icon">⏳</span>
                                In Progress
                              </>
                            )}
                            {challenge.status === 'active' && !challenge.accepted_at && (
                              <>
                                <span className="groan-cell-status-icon">👀</span>
                                View
                              </>
                            )}
                          </div>
                          {!compact && challenge.scary_score && challenge.wahoo_score && (
                            <div className="groan-cell-scores">
                              <span className="groan-score scary">
                                😰 {challenge.scary_score}
                              </span>
                              <span className="groan-score wahoo">
                                🎉 {challenge.wahoo_score}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="groan-cell-empty">
                          {onCellClick ? (
                            <button
                              className="groan-generate-btn"
                              onClick={(e) => {
                                e.stopPropagation()
                                const persona = selectedPersona
                                  ? (flowFinderData?.personas || []).find(p => p.id === selectedPersona)
                                  : null
                                onCellClick({
                                  sourceType: 'skill_x_problem',
                                  skill,
                                  problem,
                                  persona,
                                  skillId: skill.id,
                                  skillLabel: skill.cluster_label,
                                  skillInsight: skill.insight || '',
                                  problemId: problem.id,
                                  problemLabel: problem.cluster_label,
                                  problemInsight: problem.insight || '',
                                  personaId: persona?.id || null,
                                  personaLabel: persona?.cluster_label || null,
                                  personaInsight: persona?.insight || null,
                                  challenge: null
                                })
                              }}
                            >
                              + Select
                            </button>
                          ) : (
                            <>
                              <span className="groan-cell-empty-icon">+</span>
                              <span className="groan-cell-empty-text">Tap to explore</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))
          )}
        </div>
      )}

      {/* Mobile layout - card-based view for standard tabs */}
      {activeSourceType !== 'skill_x_problem' && (
        <div className="groan-matrix-mobile">
          {sourceItems.length === 0 ? (
            <div className="groan-matrix-empty">
              <div className="groan-matrix-empty-icon">🧭</div>
              <h3 className="groan-matrix-empty-title">Find Your Flow</h3>
              <p className="groan-matrix-empty-text">
                No {activeSourceType}s found. Complete the Mind Space to unlock personalized challenges.
              </p>
              <button
                className="groan-matrix-empty-cta"
                onClick={() => navigate('/mind-space')}
              >
                Start Mind Space
              </button>
            </div>
          ) : (
            GROAN_VISIBILITY_LAYERS.map(layer => {
              const isLocked = layerLockStatus[layer.id]?.locked
              return (
              <div key={layer.id} className={`groan-mobile-section ${isLocked ? 'locked' : ''}`}>
                <div className="groan-mobile-layer-header">
                  <span className="groan-mobile-layer-icon">{isLocked ? '🔒' : layer.icon}</span>
                  <div className="groan-mobile-layer-info">
                    <div className="groan-mobile-layer-label">{layer.label}</div>
                    <div className="groan-mobile-layer-fear">
                      {isLocked ? layerLockStatus[layer.id].message : layer.fear}
                    </div>
                  </div>
                </div>
                {isLocked ? (
                  <div className="groan-mobile-locked-message">
                    <span className="groan-cell-locked-icon">🔒</span>
                    <span>{layerLockStatus[layer.id].message}</span>
                  </div>
                ) : (
                <div className="groan-mobile-cards">
                  {sourceItems.map(sourceItem => {
                    const challenge = getCellActiveChallenge(sourceItem.id, layer.id)
                    const isLoading = loadingCell === `${sourceItem.id}_${layer.id}`

                    return (
                      <div
                        key={sourceItem.id}
                        className={`groan-mobile-card ${
                          challenge?.status === 'completed' ? 'completed' : ''
                        } ${
                          (challenge?.status === 'active' && challenge?.accepted_at) ? 'in-progress' : ''
                        }`}
                        onClick={() => handleCellClick(sourceItem, layer)}
                      >
                        <div className="groan-mobile-card-source">
                          <div className="groan-mobile-card-source-label">
                            {sourceItem.cluster_label}
                          </div>
                          {challenge && (
                            <div className="groan-mobile-card-challenge">
                              {challenge.title}
                            </div>
                          )}
                        </div>
                        {isLoading ? (
                          <div className="groan-loading-spinner" />
                        ) : challenge ? (
                          <div className={`groan-mobile-card-status ${challenge.status}`}>
                            {challenge.status === 'completed' && '✓ Done'}
                            {challenge.status === 'active' && challenge.accepted_at && '⏳ Active'}
                            {challenge.status === 'active' && !challenge.accepted_at && '👀 View'}
                          </div>
                        ) : (
                          onCellClick ? (
                            <button
                              className="groan-mobile-generate"
                              onClick={(e) => {
                                e.stopPropagation()
                                onCellClick({
                                  sourceType: activeSourceType,
                                  sourceId: sourceItem.id,
                                  sourceLabel: sourceItem.cluster_label,
                                  sourceInsight: sourceItem.insight,
                                  visibilityLayer: layer.id,
                                  layer,
                                  challenge: null
                                })
                              }}
                            >
                              + Select
                            </button>
                          ) : (
                            <span className="groan-mobile-card-status">+</span>
                          )
                        )}
                      </div>
                    )
                  })}
                </div>
                )}
              </div>
              )
            })
          )}
        </div>
      )}

      {/* Mobile layout - Skill × Problem view */}
      {activeSourceType === 'skill_x_problem' && (
        <div className="groan-matrix-mobile groan-sp-mobile">
          {(!flowFinderData?.skills?.length || !flowFinderData?.problems?.length) ? (
            <div className="groan-matrix-empty">
              <div className="groan-matrix-empty-icon">⚡</div>
              <h3 className="groan-matrix-empty-title">Complete Skills & Problems Flows</h3>
              <p className="groan-matrix-empty-text">
                The Skill × Problem matrix requires both Skills and Problems from Flow Finder.
              </p>
              <button
                className="groan-matrix-empty-cta"
                onClick={() => navigate(
                  !flowFinderData?.skills?.length ? '/nikigai/skills' : '/nikigai/problems'
                )}
              >
                Start {!flowFinderData?.skills?.length ? 'Skills' : 'Problems'} Flow
              </button>
            </div>
          ) : (
            (flowFinderData?.skills || []).map(skill => (
              <div key={skill.id} className="groan-mobile-section">
                <div className="groan-mobile-layer-header groan-sp-skill-header">
                  <span className="groan-mobile-layer-icon">🎯</span>
                  <div className="groan-mobile-layer-info">
                    <div className="groan-mobile-layer-label">{skill.cluster_label}</div>
                    <div className="groan-mobile-layer-fear">Your Skill</div>
                  </div>
                </div>
                <div className="groan-mobile-cards">
                  {flowFinderData.problems.map(problem => {
                    const challenge = getSkillProblemActiveChallenge(skill.id, problem.id)
                    const cellKey = `sp_${skill.id}_${problem.id}`
                    const isLoading = loadingCell === cellKey

                    return (
                      <div
                        key={problem.id}
                        className={`groan-mobile-card ${
                          challenge?.status === 'completed' ? 'completed' : ''
                        } ${
                          (challenge?.status === 'active' && challenge?.accepted_at) ? 'in-progress' : ''
                        }`}
                        onClick={() => handleSkillProblemCellClick(skill, problem)}
                      >
                        <div className="groan-mobile-card-source">
                          <div className="groan-mobile-card-source-label">
                            🔧 {problem.cluster_label}
                          </div>
                          {challenge && (
                            <div className="groan-mobile-card-challenge">
                              {challenge.title}
                            </div>
                          )}
                        </div>
                        {isLoading ? (
                          <div className="groan-loading-spinner" />
                        ) : challenge ? (
                          <div className={`groan-mobile-card-status ${challenge.status}`}>
                            {challenge.status === 'completed' && '✓ Done'}
                            {challenge.status === 'active' && challenge.accepted_at && '⏳ Active'}
                            {challenge.status === 'active' && !challenge.accepted_at && '👀 View'}
                          </div>
                        ) : (
                          onCellClick ? (
                            <button
                              className="groan-mobile-generate"
                              onClick={(e) => {
                                e.stopPropagation()
                                const persona = selectedPersona
                                  ? (flowFinderData?.personas || []).find(p => p.id === selectedPersona)
                                  : null
                                onCellClick({
                                  sourceType: 'skill_x_problem',
                                  skill,
                                  problem,
                                  persona,
                                  skillId: skill.id,
                                  skillLabel: skill.cluster_label,
                                  skillInsight: skill.insight || '',
                                  problemId: problem.id,
                                  problemLabel: problem.cluster_label,
                                  problemInsight: problem.insight || '',
                                  personaId: persona?.id || null,
                                  personaLabel: persona?.cluster_label || null,
                                  personaInsight: persona?.insight || null,
                                  challenge: null
                                })
                              }}
                            >
                              + Select
                            </button>
                          ) : (
                            <span className="groan-mobile-card-status">+</span>
                          )
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default GroanMatrix
