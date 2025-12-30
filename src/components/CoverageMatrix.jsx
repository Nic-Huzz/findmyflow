/**
 * CoverageMatrix.jsx
 *
 * Visual matrix showing skills vs problems coverage.
 * Displays which skills can solve which problems based on tag overlap.
 *
 * Features:
 * - Skills as columns, Problems as rows
 * - Color-coded cells based on compatibility score
 * - Click cell to see match details
 * - Responsive design for mobile
 */

import { useState, useMemo } from 'react'
import './CoverageMatrix.css'

function CoverageMatrix({ skillsClusters, problemsClusters, personaClusters }) {
  const [selectedCell, setSelectedCell] = useState(null)
  const [showPersona, setShowPersona] = useState(false)

  // Extract all tags from a cluster's items
  const extractTags = (cluster) => {
    if (!cluster?.items || !Array.isArray(cluster.items)) return {}

    const allTags = {}
    cluster.items.forEach(item => {
      if (item?.tags) {
        Object.entries(item.tags).forEach(([tagType, tagValues]) => {
          if (!allTags[tagType]) allTags[tagType] = new Set()
          if (Array.isArray(tagValues)) {
            tagValues.forEach(v => allTags[tagType].add(v.toLowerCase()))
          }
        })
      }
    })

    // Convert sets to arrays
    return Object.fromEntries(
      Object.entries(allTags).map(([k, v]) => [k, [...v]])
    )
  }

  // Calculate similarity score between two clusters based on tag overlap
  const calculateSimilarity = (cluster1, cluster2) => {
    const tags1 = extractTags(cluster1)
    const tags2 = extractTags(cluster2)

    if (Object.keys(tags1).length === 0 || Object.keys(tags2).length === 0) {
      return { score: 0, matches: [], total1: 0, total2: 0 }
    }

    const matches = []
    let totalWeight = 0
    let matchWeight = 0

    // Weight different tag types
    const tagWeights = {
      domain_topic: 2.0,
      value: 1.5,
      skill_verb: 1.0,
      problem_theme: 1.5,
      persona_hint: 1.0,
      context: 0.8,
      emotion: 0.5
    }

    // Compare all tag types
    const allTagTypes = new Set([...Object.keys(tags1), ...Object.keys(tags2)])

    allTagTypes.forEach(tagType => {
      const weight = tagWeights[tagType] || 0.5
      const set1 = new Set(tags1[tagType] || [])
      const set2 = new Set(tags2[tagType] || [])

      const intersection = [...set1].filter(x => set2.has(x))
      const union = new Set([...set1, ...set2])

      if (intersection.length > 0) {
        matches.push({
          tagType,
          matches: intersection,
          weight
        })
        matchWeight += intersection.length * weight
      }
      totalWeight += union.size * weight
    })

    const score = totalWeight > 0 ? matchWeight / totalWeight : 0

    return {
      score: Math.min(score * 2, 1), // Scale up and cap at 1
      matches,
      total1: Object.values(tags1).flat().length,
      total2: Object.values(tags2).flat().length
    }
  }

  // Build the coverage matrix data
  const matrixData = useMemo(() => {
    if (!skillsClusters?.length || !problemsClusters?.length) return null

    const matrix = problemsClusters.map(problem => ({
      problem,
      cells: skillsClusters.map(skill => {
        const similarity = calculateSimilarity(skill, problem)
        return {
          skill,
          problem,
          ...similarity
        }
      })
    }))

    // Calculate summary stats
    const allScores = matrix.flatMap(row => row.cells.map(c => c.score))
    const avgScore = allScores.reduce((a, b) => a + b, 0) / allScores.length
    const highCoverage = allScores.filter(s => s >= 0.4).length
    const lowCoverage = allScores.filter(s => s < 0.2).length

    return { matrix, avgScore, highCoverage, lowCoverage, total: allScores.length }
  }, [skillsClusters, problemsClusters])

  // Get color class based on score
  const getScoreClass = (score) => {
    if (score >= 0.6) return 'high'
    if (score >= 0.4) return 'medium'
    if (score >= 0.2) return 'low'
    return 'none'
  }

  // Format tag type for display
  const formatTagType = (type) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  if (!matrixData || skillsClusters.length === 0 || problemsClusters.length === 0) {
    return (
      <div className="coverage-matrix-empty">
        <p>Complete Flow Finder Skills and Problems flows to see your coverage matrix.</p>
      </div>
    )
  }

  return (
    <div className="coverage-matrix">
      {/* Header with stats */}
      <div className="matrix-header">
        <h3>Problem-Solution Coverage Matrix</h3>
        <p className="matrix-subtitle">
          See how your skills align with problems you can solve
        </p>
        <div className="matrix-stats">
          <div className="stat">
            <span className="stat-value">{matrixData.highCoverage}</span>
            <span className="stat-label">Strong Matches</span>
          </div>
          <div className="stat">
            <span className="stat-value">{Math.round(matrixData.avgScore * 100)}%</span>
            <span className="stat-label">Avg Coverage</span>
          </div>
          <div className="stat">
            <span className="stat-value">{matrixData.lowCoverage}</span>
            <span className="stat-label">Gaps</span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="matrix-legend">
        <div className="legend-item">
          <span className="legend-dot high"></span>
          <span>Strong (60%+)</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot medium"></span>
          <span>Good (40-60%)</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot low"></span>
          <span>Weak (20-40%)</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot none"></span>
          <span>Gap (&lt;20%)</span>
        </div>
      </div>

      {/* Matrix Grid */}
      <div className="matrix-scroll-container">
        <table className="matrix-table">
          <thead>
            <tr>
              <th className="corner-cell">Problems / Skills</th>
              {skillsClusters.map((skill, idx) => (
                <th key={skill.id || idx} className="skill-header">
                  <div className="header-content" title={skill.cluster_label}>
                    {skill.cluster_label?.length > 20
                      ? skill.cluster_label.substring(0, 17) + '...'
                      : skill.cluster_label}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrixData.matrix.map((row, rowIdx) => (
              <tr key={row.problem.id || rowIdx}>
                <td className="problem-header">
                  <div className="header-content" title={row.problem.cluster_label}>
                    {row.problem.cluster_label?.length > 25
                      ? row.problem.cluster_label.substring(0, 22) + '...'
                      : row.problem.cluster_label}
                  </div>
                </td>
                {row.cells.map((cell, colIdx) => (
                  <td
                    key={colIdx}
                    className={`matrix-cell ${getScoreClass(cell.score)} ${
                      selectedCell?.skill.id === cell.skill.id &&
                      selectedCell?.problem.id === cell.problem.id ? 'selected' : ''
                    }`}
                    onClick={() => setSelectedCell(cell)}
                    title={`${Math.round(cell.score * 100)}% match`}
                  >
                    <span className="cell-score">{Math.round(cell.score * 100)}</span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Selected Cell Details */}
      {selectedCell && (
        <div className="cell-details">
          <button className="close-details" onClick={() => setSelectedCell(null)}>×</button>
          <h4>Match Details</h4>
          <div className="detail-pair">
            <div className="detail-item skill">
              <strong>Skill:</strong> {selectedCell.skill.cluster_label}
            </div>
            <div className="detail-item problem">
              <strong>Problem:</strong> {selectedCell.problem.cluster_label}
            </div>
          </div>
          <div className="match-score">
            <span className={`score-badge ${getScoreClass(selectedCell.score)}`}>
              {Math.round(selectedCell.score * 100)}% Match
            </span>
          </div>
          {selectedCell.matches.length > 0 ? (
            <div className="matches-list">
              <strong>Matching Tags:</strong>
              {selectedCell.matches.map((match, idx) => (
                <div key={idx} className="match-item">
                  <span className="match-type">{formatTagType(match.tagType)}:</span>
                  <span className="match-values">{match.matches.join(', ')}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-matches">No overlapping tags found. This may be a gap opportunity.</p>
          )}
        </div>
      )}

      {/* Persona toggle (future enhancement) */}
      {personaClusters?.length > 0 && (
        <div className="persona-toggle">
          <button
            className={`toggle-btn ${showPersona ? 'active' : ''}`}
            onClick={() => setShowPersona(!showPersona)}
          >
            {showPersona ? 'Hide' : 'Show'} Persona Fit
          </button>
        </div>
      )}
    </div>
  )
}

export default CoverageMatrix
