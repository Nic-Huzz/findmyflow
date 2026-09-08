/**
 * DomeOfSafety.jsx — 8-spoke radar chart showing NS comfort zone.
 *
 * Inner dome (purple fill): integrated capacity (Vibe Rise / Fun after_state).
 * Edge ring (gold dashed): growth zone (Stressed after_state).
 *
 * Props:
 *   domeEdges   — { dimId: level } integrated capacity
 *   edgeZone    — { dimId: level } growth zone
 *   gapMetrics  — { averageGap, totalCourageScore }
 *   mini        — boolean, compact mode for Quests tab (no labels)
 *   size        — number, SVG viewport size (default 280)
 *
 * CSS prefix: dos-
 */

import { DOME_DIMENSIONS } from '../data/domeDimensions'
import './DomeOfSafety.css'

const LABEL_OFFSET = 24

function polarToXY(cx, cy, angle, radius) {
  const rad = (angle - 90) * (Math.PI / 180)
  return {
    x: cx + radius * Math.cos(rad),
    y: cy + radius * Math.sin(rad),
  }
}

function buildPolygon(cx, cy, maxRadius, values, maxLevels, angleStep) {
  return DOME_DIMENSIONS.map((dim, i) => {
    const level = values[dim.id] || 0
    const max = maxLevels[dim.id] || dim.maxLevel
    const ratio = max > 0 ? Math.min(level / max, 1) : 0
    const radius = Math.max(ratio * maxRadius, 0)
    return polarToXY(cx, cy, i * angleStep, radius)
  }).map(p => `${p.x},${p.y}`).join(' ')
}

export default function DomeOfSafety({ domeEdges = {}, edgeZone = {}, gapMetrics = {}, mini = false, size: propSize }) {
  const size = propSize || (mini ? 120 : 280)
  const cx = size / 2
  const cy = size / 2
  const labelSpace = mini ? 6 : LABEL_OFFSET + 10
  const maxRadius = (size / 2) - labelSpace
  const angleStep = 360 / DOME_DIMENSIONS.length
  const ringCount = 5

  const hasData = Object.keys(domeEdges).length > 0 || Object.keys(edgeZone).length > 0

  // Max level per dimension (for normalization)
  const maxLevels = {}
  DOME_DIMENSIONS.forEach(dim => { maxLevels[dim.id] = dim.maxLevel })

  // Merge edge zone: use max of dome edge and edge zone for the outer ring
  const mergedEdge = {}
  DOME_DIMENSIONS.forEach(dim => {
    const dome = domeEdges[dim.id] || 0
    const edge = edgeZone[dim.id] || 0
    if (edge > dome) mergedEdge[dim.id] = edge
  })

  const domePolygon = buildPolygon(cx, cy, maxRadius, domeEdges, maxLevels, angleStep)
  const edgePolygon = Object.keys(mergedEdge).length > 0
    ? buildPolygon(cx, cy, maxRadius, { ...domeEdges, ...mergedEdge }, maxLevels, angleStep)
    : null

  // Concentric rings
  const rings = Array.from({ length: ringCount }, (_, i) => {
    const r = maxRadius * ((i + 1) / ringCount)
    return DOME_DIMENSIONS.map((_, j) => polarToXY(cx, cy, j * angleStep, r))
      .map(p => `${p.x},${p.y}`).join(' ')
  })

  // Spoke lines
  const spokes = DOME_DIMENSIONS.map((_, i) => {
    const end = polarToXY(cx, cy, i * angleStep, maxRadius)
    return { x1: cx, y1: cy, x2: end.x, y2: end.y }
  })

  // Labels (full mode only)
  const labels = !mini ? DOME_DIMENSIONS.map((dim, i) => {
    const pos = polarToXY(cx, cy, i * angleStep, maxRadius + LABEL_OFFSET)
    const level = domeEdges[dim.id] || 0
    return { ...pos, icon: dim.icon, label: dim.label, level }
  }) : []

  // Key triggers re-animation when dome data changes (sorted for stability)
  const domeKey = Object.entries(domeEdges).sort().map(([k, v]) => `${k}:${v}`).join(',')

  return (
    <div className={`dos-container ${mini ? 'dos-mini' : ''}`}>
      <svg key={domeKey} viewBox={`0 0 ${size} ${size}`} className="dos-svg" style={{ width: size, height: size }}>
        {/* Background rings */}
        {rings.map((pts, i) => (
          <polygon key={i} points={pts} className={`dos-ring ${i === ringCount - 1 ? 'dos-ring-outer' : ''}`} />
        ))}

        {/* Spokes */}
        {spokes.map((s, i) => (
          <line key={i} {...s} className="dos-spoke" />
        ))}

        {/* Edge ring (gold dashed) — growth zone */}
        {edgePolygon && (
          <polygon points={edgePolygon} className="dos-edge-fill" />
        )}

        {/* Inner dome (purple) — integrated capacity */}
        {hasData && (
          <polygon points={domePolygon} className="dos-dome-fill" />
        )}

        {/* Dome vertices */}
        {!mini && DOME_DIMENSIONS.map((dim, i) => {
          const level = domeEdges[dim.id]
          if (!level) return null
          const ratio = Math.min(level / maxLevels[dim.id], 1)
          const p = polarToXY(cx, cy, i * angleStep, ratio * maxRadius)
          return <circle key={dim.id} cx={p.x} cy={p.y} r={3.5} className="dos-vertex" />
        })}

        {/* Labels */}
        {labels.map((l, i) => (
          <g key={i}>
            <text x={l.x} y={l.y - 5} className="dos-label-icon" textAnchor="middle" dominantBaseline="auto">
              {l.icon}
            </text>
            <text x={l.x} y={l.y + 9} className="dos-label-name" textAnchor="middle" dominantBaseline="auto">
              {l.label}
            </text>
          </g>
        ))}
      </svg>

      {/* Legend (full mode) */}
      {!mini && hasData && (
        <div className="dos-legend">
          <span className="dos-legend-item"><span className="dos-legend-dot dos-legend-safe" />Safe</span>
          {Object.keys(mergedEdge).length > 0 && (
            <span className="dos-legend-item"><span className="dos-legend-dot dos-legend-growing" />Growing</span>
          )}
        </div>
      )}

      {/* Stats (full mode) */}
      {!mini && hasData && gapMetrics && (
        <div className="dos-stats">
          <div className="dos-stat">
            <span className="dos-stat-value">{gapMetrics.totalCourageScore?.toFixed(1) || '0'}</span>
            <span className="dos-stat-label">Courage Score</span>
          </div>
          {gapMetrics.averageGap != null && (
            <div className="dos-stat">
              <span className="dos-stat-value">{gapMetrics.averageGap.toFixed(1)}</span>
              <span className="dos-stat-label">Avg Gap</span>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!mini && !hasData && (
        <div className="dos-empty">
          Complete a courage challenge with dimensions to see your dome grow.
        </div>
      )}
    </div>
  )
}
