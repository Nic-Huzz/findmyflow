/**
 * BranchInsightCard — Shows branch chart, gap insight, and frontier card
 * from the Phase 3 × Spiral Dynamics matrix.
 *
 * Usage:
 *   <BranchInsightCard />
 *
 * Requires: useBranchScoring hook data + spiralDynamicsMatrix.json
 * Shows nothing if no branch data exists yet.
 */

import { useState, useEffect } from 'react'
import { useBranchScoring } from '../hooks/useBranchScoring'
import './BranchInsightCard.css'

// Branch metadata (colors + labels)
const BRANCH_META = {
  movement: { label: 'Movement', color: '#7c3aed', industry: 'Transport' },
  nourishment: { label: 'Nourishment', color: '#22c55e', industry: 'Food' },
  tools: { label: 'Tools', color: '#0ea5e9', industry: 'Technology' },
  status: { label: 'Status', color: '#e879f9', industry: 'Fashion & Identity' },
  bonds: { label: 'Bonds', color: '#f472b6', industry: 'Communication' },
  shelter: { label: 'Shelter', color: '#38bdf8', industry: 'Property' },
  story: { label: 'Story', color: '#fb923c', industry: 'Media' },
  play: { label: 'Play', color: '#06b6d4', industry: 'Games & Recreation' },
  fire: { label: 'Fire', color: '#f59e0b', industry: 'Energy' },
  healing: { label: 'Healing', color: '#a78bfa', industry: 'Medicine & Wellness' },
  rest: { label: 'Rest', color: '#6366f1', industry: 'Rest & Consciousness' },
  threat: { label: 'Threat', color: '#ef4444', industry: 'Security' },
}

export default function BranchInsightCard() {
  const { loading, primary, secondary, scores, gap, confidence, branchSpread, rarity } = useBranchScoring()
  const [matrixData, setMatrixData] = useState(null)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    fetch('/data/spiralDynamicsMatrix.json')
      .then(r => r.json())
      .then(setMatrixData)
      .catch(() => {})
  }, [])

  if (loading || !primary || !scores || scores.length === 0) return null

  const maxScore = primary.score
  const visibleScores = scores.filter(s => s.score > 0).slice(0, 5)
  const primaryMeta = BRANCH_META[primary.branch]
  const secondaryMeta = secondary ? BRANCH_META[secondary.branch] : null

  // Find the frontier cell for the primary branch
  const frontierCell = matrixData ? findFrontierCell(matrixData, primary.branch) : null
  const emergingCell = matrixData ? findEmergingCell(matrixData, primary.branch) : null

  return (
    <div className="branch-insight">
      {/* Branch Chart */}
      <div className="branch-insight-header">
        <h3 className="branch-insight-title">Your Branches</h3>
        <div className="branch-insight-confidence">
          {confidence}% clarity
        </div>
      </div>

      <div className="branch-insight-chart">
        {visibleScores.map(({ branch, score }) => {
          const meta = BRANCH_META[branch]
          if (!meta) return null
          const pct = Math.round((score / maxScore) * 100)
          return (
            <div key={branch} className="branch-bar-row">
              <div className="branch-bar-label" style={{ color: meta.color }}>
                {meta.label}
              </div>
              <div className="branch-bar-track">
                <div
                  className="branch-bar-fill"
                  style={{ width: `${pct}%`, background: meta.color }}
                />
              </div>
              <div className="branch-bar-count">{score}</div>
            </div>
          )
        })}
      </div>

      {/* Gap Insight */}
      {gap && (
        <div className="branch-gap">
          <div className="branch-gap-icon">&#x2194;</div>
          <p className="branch-gap-text">{gap.insight}</p>
        </div>
      )}

      {/* Frontier Card */}
      {frontierCell && (
        <button
          type="button"
          className="branch-frontier"
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
        >
          <div className="branch-frontier-header">
            <span className="branch-frontier-badge">Frontier</span>
            <span className="branch-frontier-branch" style={{ color: primaryMeta.color }}>
              {primaryMeta.label}
            </span>
          </div>

          {!expanded ? (
            <p className="branch-frontier-assumption">
              "{frontierCell.assumption}"
            </p>
          ) : (
            <div className="branch-frontier-expanded">
              <div className="branch-frontier-section">
                <div className="branch-frontier-label">The dominant assumption</div>
                <p>"{frontierCell.assumption}"</p>
              </div>
              {frontierCell.problem && (
                <div className="branch-frontier-section">
                  <div className="branch-frontier-label">Current problem</div>
                  <p>{frontierCell.problem}</p>
                </div>
              )}
              {frontierCell.prediction && (
                <div className="branch-frontier-section">
                  <div className="branch-frontier-label" style={{ color: '#E9A23B' }}>The next rule break</div>
                  <p style={{ color: 'rgba(0,0,0,0.8)' }}>{frontierCell.prediction}</p>
                </div>
              )}
              {emergingCell && (
                <div className="branch-frontier-section">
                  <div className="branch-frontier-label" style={{ color: '#5e17eb' }}>Emerging (Yellow)</div>
                  <p>{emergingCell.assumption}</p>
                  {emergingCell.phase3 && (
                    <p className="branch-frontier-phase3">Loop-back: {emergingCell.phase3}</p>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="branch-frontier-tap">
            {expanded ? 'Collapse' : 'Tap to explore your frontier'}
          </div>
        </button>
      )}

      {/* Rarity */}
      {rarity && (
        <div className="branch-monopoly">
          <div className="branch-monopoly-row">
            <span className="branch-monopoly-label">Rarity</span>
            <span className="branch-monopoly-value">
              {rarity.matchCount} of {rarity.totalProfiles} share your combination
            </span>
          </div>
        </div>
      )}

      {/* Polymath signal */}
      {branchSpread >= 4 && (
        <div className="branch-polymath">
          Your curiosities span {branchSpread} branches. Cross-domain pattern recognition is a Yellow-level signal.
        </div>
      )}
    </div>
  )
}

function findFrontierCell(matrix, branchId) {
  if (!matrix?.cells) return null
  const sdLevels = ['purple', 'red', 'blue', 'orange', 'green', 'yellow']
  for (const sd of sdLevels) {
    const cell = matrix.cells[`${branchId}-${sd}`]
    if (cell?.status === 'frontier') return cell
  }
  return null
}

function findEmergingCell(matrix, branchId) {
  if (!matrix?.cells) return null
  const sdLevels = ['purple', 'red', 'blue', 'orange', 'green', 'yellow']
  for (const sd of sdLevels) {
    const cell = matrix.cells[`${branchId}-${sd}`]
    if (cell?.status === 'emerging') return cell
  }
  return null
}
