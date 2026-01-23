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
  { id: 'persona', label: 'Personas', icon: '👥' }
]

function GroanMatrix({
  userId,
  onCellClick,
  onGenerateChallenge,
  compact = false
}) {
  const navigate = useNavigate()
  const [activeSourceType, setActiveSourceType] = useState('skill')
  const [flowFinderData, setFlowFinderData] = useState(null)
  const [challenges, setChallenges] = useState({})
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingCell, setLoadingCell] = useState(null)
  const [flowFinderComplete, setFlowFinderComplete] = useState(true)

  // Fetch initial data
  useEffect(() => {
    if (!userId) return
    loadData()
  }, [userId])

  const loadData = async () => {
    setLoading(true)

    // Check if Flow Finder is complete
    const { completed, missing } = await hasCompletedFlowFinder(userId)
    setFlowFinderComplete(completed)

    if (!completed) {
      setLoading(false)
      return
    }

    // Fetch Flow Finder data
    const { data: ffData } = await fetchFlowFinderData(userId)
    setFlowFinderData(ffData)

    // Fetch stats
    const { data: statsData } = await getGroanStats(userId)
    setStats(statsData)

    // Fetch all challenges for this user to populate the matrix
    const { data: allChallenges } = await supabase
      .from('groan_challenges')
      .select('*')
      .eq('user_id', userId)

    // Organize challenges by source+layer key
    const challengeMap = {}
    ;(allChallenges || []).forEach(c => {
      const key = `${c.source_type}_${c.source_id}_${c.visibility_layer}`
      if (!challengeMap[key]) {
        challengeMap[key] = []
      }
      challengeMap[key].push(c)
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

    // Prioritize: accepted > generated > completed
    const accepted = cellChallenges.find(c => c.status === 'accepted')
    if (accepted) return accepted

    const generated = cellChallenges.find(c => c.status === 'generated')
    if (generated) return generated

    // Return most recently completed
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

  // Render empty state (Flow Finder not complete)
  if (!loading && !flowFinderComplete) {
    return (
      <div className="groan-matrix">
        <div className="groan-matrix-empty">
          <div className="groan-matrix-empty-icon">🧭</div>
          <h3 className="groan-matrix-empty-title">Complete Flow Finder First</h3>
          <p className="groan-matrix-empty-text">
            To unlock personalized courage challenges, you need to discover your
            unique skills, problems, and personas through Flow Finder.
          </p>
          <button
            className="groan-matrix-empty-cta"
            onClick={() => navigate('/nikigai/skills')}
          >
            Start Flow Finder
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
        <h2 className="groan-matrix-title">
          Courage Matrix
        </h2>

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

      {/* Stats bar */}
      {stats && !compact && (
        <div className="groan-stats-bar">
          <div className="groan-stat">
            <div className="groan-stat-value">{stats.completed}</div>
            <div className="groan-stat-label">Completed</div>
          </div>
          <div className="groan-stat">
            <div className="groan-stat-value">{stats.inProgress}</div>
            <div className="groan-stat-label">In Progress</div>
          </div>
          <div className="groan-stat">
            <div className="groan-stat-value">{stats.completionRate}%</div>
            <div className="groan-stat-label">Completion Rate</div>
          </div>
          <div className="groan-stat">
            <div className="groan-stat-value">{stats.byEssenceZone?.essence?.completed || 0}</div>
            <div className="groan-stat-label">Essence Zones</div>
          </div>
        </div>
      )}

      {/* Matrix grid */}
      <div className="groan-matrix-grid">
        {/* Header row with visibility layers */}
        <div className="groan-matrix-header-row">
          <div className="groan-header-cell corner" />
          {GROAN_VISIBILITY_LAYERS.map(layer => (
            <div
              key={layer.id}
              className="groan-header-cell"
              style={{ '--layer-color': layer.color }}
            >
              <span className="groan-layer-icon">{layer.icon}</span>
              <span className="groan-layer-label">{layer.label}</span>
              {!compact && (
                <span className="groan-layer-fear">{layer.fear}</span>
              )}
            </div>
          ))}
        </div>

        {/* Data rows */}
        {sourceItems.length === 0 ? (
          <div className="groan-matrix-empty" style={{ gridColumn: '1 / -1' }}>
            <p className="groan-matrix-empty-text">
              No {activeSourceType}s found. Complete the {activeSourceType === 'skill' ? 'Skills' : activeSourceType === 'problem' ? 'Problems' : 'Persona'} flow in Flow Finder.
            </p>
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
                const challenge = getCellActiveChallenge(sourceItem.id, layer.id)
                const isLoading = loadingCell === `${sourceItem.id}_${layer.id}`
                const isEssenceZone = challenge?.essence_zone === 'essence'

                return (
                  <div
                    key={layer.id}
                    className={`groan-matrix-cell ${
                      challenge ? 'has-challenge' : ''
                    } ${
                      challenge?.status === 'completed' ? 'completed' : ''
                    } ${
                      challenge?.status === 'accepted' ? 'in-progress' : ''
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
                          {challenge.status === 'accepted' && (
                            <>
                              <span className="groan-cell-status-icon">⏳</span>
                              In Progress
                            </>
                          )}
                          {challenge.status === 'generated' && (
                            <>
                              <span className="groan-cell-status-icon">✨</span>
                              Ready
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
                        {onGenerateChallenge ? (
                          <button
                            className="groan-generate-btn"
                            onClick={(e) => handleGenerateClick(e, sourceItem, layer)}
                          >
                            + Generate
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
    </div>
  )
}

export default GroanMatrix
