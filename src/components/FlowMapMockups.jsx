/**
 * FlowMapMockups.jsx
 *
 * 8 different style options for the FlowMap visualization.
 * View at: /flow-mockups
 *
 * Option A: River Path (Current) - Horizontal flowing river
 * Option B: Compass Wheel - Circular wheel with segments
 * Option C: Grid Calendar - Calendar-style grid view
 * Option D: Flowing River - Organic river with color changes
 * Option E: Aerial River - Bird's eye horizontal path (CHOSEN)
 * Option F: Neon Trail - Minimal glowing line
 * Option G: Terrain Map - Topographic style
 * Option H: Vertical River - Bottom-to-top mobile optimized
 */

import { useState } from 'react'
import './FlowMapMockups.css'

// Sample data for mockups
const SAMPLE_ENTRIES = [
  { id: 1, direction: 'north', date: 'Dec 15' },
  { id: 2, direction: 'north', date: 'Dec 16' },
  { id: 3, direction: 'east', date: 'Dec 17' },
  { id: 4, direction: 'south', date: 'Dec 18' },
  { id: 5, direction: 'north', date: 'Dec 19' },
  { id: 6, direction: 'west', date: 'Dec 20' },
  { id: 7, direction: 'north', date: 'Dec 21' },
]

const DIRECTION_CONFIG = {
  north: { color: '#10b981', icon: '→', label: 'Flow', desc: 'Ease + Excited' },      // Green - Keep going!
  east: { color: '#3b82f6', icon: '↓', label: 'Redirect', desc: 'Resistance + Excited' }, // Blue - Pivot needed
  south: { color: '#ef4444', icon: '●', label: 'Rest', desc: 'Resistance + Tired' },   // Red - Stop & recover
  west: { color: '#fbbf24', icon: '↑', label: 'Honour', desc: 'Ease + Tired' }         // Yellow - New opportunity
}

// ═══════════════════════════════════════════════════════════════════════════
// OPTION A: RIVER PATH (Current Style)
// Horizontal flowing path with connected nodes
// ═══════════════════════════════════════════════════════════════════════════
function OptionA_RiverPath() {
  return (
    <div className="mockup-option">
      <h3>Option A: River Path</h3>
      <p className="mockup-desc">Horizontal flowing river with connected nodes. Current style.</p>

      <div className="river-mockup">
        {/* Stats */}
        <div className="river-stats-mock">
          {Object.entries(DIRECTION_CONFIG).map(([dir, cfg]) => (
            <div key={dir} className="stat-mock" style={{ color: cfg.color }}>
              {cfg.icon} {SAMPLE_ENTRIES.filter(e => e.direction === dir).length}
            </div>
          ))}
        </div>

        {/* River Path */}
        <div className="river-path-mock">
          {SAMPLE_ENTRIES.map((entry, i) => {
            const cfg = DIRECTION_CONFIG[entry.direction]
            return (
              <div key={entry.id} className="river-node-mock-wrapper">
                {i > 0 && <div className="river-line-mock" />}
                <div
                  className="river-node-mock"
                  style={{ background: cfg.color }}
                >
                  {cfg.icon}
                </div>
                <span className="river-date-mock">{entry.date}</span>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="river-legend-mock">
          {Object.entries(DIRECTION_CONFIG).map(([dir, cfg]) => (
            <div key={dir} className="legend-mock-item">
              <span className="legend-dot-mock" style={{ background: cfg.color }} />
              {cfg.desc}
            </div>
          ))}
        </div>
      </div>

      <div className="pros-cons">
        <div className="pros">
          <strong>Pros:</strong>
          <ul>
            <li>Shows chronological journey</li>
            <li>Easy to see recent trend</li>
            <li>Scrollable for long history</li>
          </ul>
        </div>
        <div className="cons">
          <strong>Cons:</strong>
          <ul>
            <li>Takes horizontal space</li>
            <li>Hard to see overall balance</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// OPTION B: COMPASS WHEEL
// Circular wheel showing balance of directions
// ═══════════════════════════════════════════════════════════════════════════
function OptionB_CompassWheel() {
  const counts = {
    north: SAMPLE_ENTRIES.filter(e => e.direction === 'north').length,
    east: SAMPLE_ENTRIES.filter(e => e.direction === 'east').length,
    south: SAMPLE_ENTRIES.filter(e => e.direction === 'south').length,
    west: SAMPLE_ENTRIES.filter(e => e.direction === 'west').length,
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0)

  return (
    <div className="mockup-option">
      <h3>Option B: Compass Wheel</h3>
      <p className="mockup-desc">Circular wheel showing balance and distribution of flow states.</p>

      <div className="compass-mockup">
        <div className="compass-wheel">
          {/* Center */}
          <div className="compass-center">
            <span className="compass-total">{total}</span>
            <span className="compass-label">entries</span>
          </div>

          {/* Quadrants */}
          <div className="compass-quadrant north" style={{ '--fill': `${(counts.north / total) * 100}%` }}>
            <div className="quadrant-fill" style={{ background: DIRECTION_CONFIG.north.color }} />
            <div className="quadrant-content">
              <span className="quadrant-icon">↑</span>
              <span className="quadrant-count">{counts.north}</span>
              <span className="quadrant-label">Flow</span>
            </div>
          </div>

          <div className="compass-quadrant east" style={{ '--fill': `${(counts.east / total) * 100}%` }}>
            <div className="quadrant-fill" style={{ background: DIRECTION_CONFIG.east.color }} />
            <div className="quadrant-content">
              <span className="quadrant-icon">→</span>
              <span className="quadrant-count">{counts.east}</span>
              <span className="quadrant-label">Growth</span>
            </div>
          </div>

          <div className="compass-quadrant south" style={{ '--fill': `${(counts.south / total) * 100}%` }}>
            <div className="quadrant-fill" style={{ background: DIRECTION_CONFIG.south.color }} />
            <div className="quadrant-content">
              <span className="quadrant-icon">↓</span>
              <span className="quadrant-count">{counts.south}</span>
              <span className="quadrant-label">Drain</span>
            </div>
          </div>

          <div className="compass-quadrant west" style={{ '--fill': `${(counts.west / total) * 100}%` }}>
            <div className="quadrant-fill" style={{ background: DIRECTION_CONFIG.west.color }} />
            <div className="quadrant-content">
              <span className="quadrant-icon">←</span>
              <span className="quadrant-count">{counts.west}</span>
              <span className="quadrant-label">Block</span>
            </div>
          </div>
        </div>

        {/* Recent entries below */}
        <div className="compass-recent">
          <span className="recent-label">Recent:</span>
          {SAMPLE_ENTRIES.slice(-5).map(entry => (
            <span
              key={entry.id}
              className="recent-dot"
              style={{ background: DIRECTION_CONFIG[entry.direction].color }}
            />
          ))}
        </div>
      </div>

      <div className="pros-cons">
        <div className="pros">
          <strong>Pros:</strong>
          <ul>
            <li>Shows overall balance at a glance</li>
            <li>Compact and visual</li>
            <li>Matches compass metaphor</li>
          </ul>
        </div>
        <div className="cons">
          <strong>Cons:</strong>
          <ul>
            <li>Loses chronological order</li>
            <li>Complex to implement well</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// OPTION C: GRID CALENDAR
// Calendar-style grid showing entries by day
// ═══════════════════════════════════════════════════════════════════════════
function OptionC_GridCalendar() {
  // Create a week grid with sample data
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const entries = [
    { day: 0, direction: 'north' },
    { day: 1, direction: 'north' },
    { day: 2, direction: 'east' },
    { day: 3, direction: 'south' },
    { day: 4, direction: 'north' },
    { day: 5, direction: 'west' },
    { day: 6, direction: 'north' },
  ]

  return (
    <div className="mockup-option">
      <h3>Option C: Grid Calendar</h3>
      <p className="mockup-desc">Calendar-style grid showing your flow state for each day.</p>

      <div className="calendar-mockup">
        {/* Week Header */}
        <div className="calendar-header">
          {weekDays.map(day => (
            <div key={day} className="calendar-day-label">{day}</div>
          ))}
        </div>

        {/* Week Grid */}
        <div className="calendar-grid">
          {entries.map((entry, i) => {
            const cfg = DIRECTION_CONFIG[entry.direction]
            return (
              <div
                key={i}
                className="calendar-cell"
                style={{ background: cfg.color }}
              >
                <span className="cell-icon">{cfg.icon}</span>
                <span className="cell-label">{cfg.label}</span>
              </div>
            )
          })}
        </div>

        {/* Stats Summary */}
        <div className="calendar-summary">
          <div className="summary-item flow">
            <span className="summary-bar" style={{ width: '57%', background: '#fbbf24' }} />
            <span className="summary-text">57% Flow</span>
          </div>
          <div className="summary-item other">
            <span className="summary-bar" style={{ width: '43%', background: '#6b7280' }} />
            <span className="summary-text">43% Other</span>
          </div>
        </div>

        {/* Legend */}
        <div className="calendar-legend">
          {Object.entries(DIRECTION_CONFIG).map(([dir, cfg]) => (
            <div key={dir} className="legend-mock-item">
              <span className="legend-dot-mock" style={{ background: cfg.color }} />
              {cfg.label}
            </div>
          ))}
        </div>
      </div>

      <div className="pros-cons">
        <div className="pros">
          <strong>Pros:</strong>
          <ul>
            <li>Familiar calendar format</li>
            <li>Easy to spot patterns</li>
            <li>Shows streaks clearly</li>
          </ul>
        </div>
        <div className="cons">
          <strong>Cons:</strong>
          <ul>
            <li>Empty days look sparse</li>
            <li>Limited to week/month view</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// OPTION D: FLOWING RIVER
// Organic river that changes color based on flow direction
// ═══════════════════════════════════════════════════════════════════════════
function OptionD_FlowingRiver() {
  // Build gradient stops from entries
  const entries = SAMPLE_ENTRIES
  const gradientStops = entries.map((entry, i) => {
    const cfg = DIRECTION_CONFIG[entry.direction]
    const position = (i / (entries.length - 1)) * 100
    return `${cfg.color} ${position}%`
  }).join(', ')

  return (
    <div className="mockup-option">
      <h3>Option D: Flowing River</h3>
      <p className="mockup-desc">An organic, flowing river where the water color reflects your flow state.</p>

      <div className="flowing-river-mockup">
        {/* River Container */}
        <div className="river-scene">
          {/* Animated water background */}
          <div className="river-water" style={{ background: `linear-gradient(90deg, ${gradientStops})` }}>
            {/* Wave overlays for organic feel */}
            <div className="wave wave-1" />
            <div className="wave wave-2" />
            <div className="wave wave-3" />
          </div>

          {/* River banks */}
          <div className="river-bank bank-top" />
          <div className="river-bank bank-bottom" />

          {/* Flow markers (subtle dots along river) */}
          <div className="flow-markers">
            {entries.map((entry, i) => {
              const cfg = DIRECTION_CONFIG[entry.direction]
              const leftPos = (i / (entries.length - 1)) * 100
              return (
                <div
                  key={entry.id}
                  className="flow-marker"
                  style={{
                    left: `${leftPos}%`,
                    '--marker-color': cfg.color
                  }}
                >
                  <span className="marker-icon">{cfg.icon}</span>
                  <span className="marker-date">{entry.date}</span>
                </div>
              )
            })}
          </div>

          {/* Direction indicator at end */}
          <div className="river-end">
            <span className="end-arrow">→</span>
            <span className="end-label">Now</span>
          </div>
        </div>

        {/* Current state callout */}
        <div className="current-flow-state">
          <span
            className="state-indicator"
            style={{ background: DIRECTION_CONFIG[entries[entries.length - 1].direction].color }}
          />
          <span className="state-text">
            Currently in <strong>{DIRECTION_CONFIG[entries[entries.length - 1].direction].label}</strong>
          </span>
        </div>

        {/* Legend */}
        <div className="river-color-legend">
          {Object.entries(DIRECTION_CONFIG).map(([dir, cfg]) => (
            <div key={dir} className="color-legend-item">
              <span className="color-swatch" style={{ background: cfg.color }} />
              <span className="color-name">{cfg.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="pros-cons">
        <div className="pros">
          <strong>Pros:</strong>
          <ul>
            <li>Visually striking and unique</li>
            <li>Intuitive "flow" metaphor</li>
            <li>Shows transitions beautifully</li>
            <li>Matches brand language</li>
          </ul>
        </div>
        <div className="cons">
          <strong>Cons:</strong>
          <ul>
            <li>Less precise data reading</li>
            <li>May need animation for full effect</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// OPTION E: AERIAL RIVER (Bird's Eye View)
// River that actually curves based on direction - like viewing from above
// ═══════════════════════════════════════════════════════════════════════════
function OptionE_AerialRiver() {
  const entries = SAMPLE_ENTRIES

  // Calculate path points based on directions
  // Start from left, flow towards right
  // North = forward (right) - Flow towards goals
  // West = up - Going against current
  // East = down - Exploring new paths
  // South = stuck spot (minimal forward movement)
  const startX = 30
  const startY = 100
  const forwardStep = 40  // How much we move right each entry
  const curveAmount = 35  // How much we curve up/down

  let pathPoints = [{ x: startX, y: startY }]
  let currentX = startX
  let currentY = startY

  // Direction affects vertical position while always moving forward (right)
  const directionEffects = {
    north: { forward: forwardStep, vertical: 0 },           // Straight ahead - Flow
    west: { forward: forwardStep * 0.7, vertical: -curveAmount },  // Curve up - Block
    east: { forward: forwardStep * 0.7, vertical: curveAmount },   // Curve down - Growth
    south: { forward: forwardStep * 0.3, vertical: 0 }      // Minimal forward - Drain (stuck)
  }

  entries.forEach((entry) => {
    const effect = directionEffects[entry.direction]
    currentX += effect.forward
    currentY += effect.vertical
    pathPoints.push({
      x: currentX,
      y: currentY,
      direction: entry.direction,
      date: entry.date,
      id: entry.id,
      isStuck: entry.direction === 'south'  // Mark south as stuck point
    })
  })

  // Calculate viewBox to fit all points
  const minX = Math.min(...pathPoints.map(p => p.x)) - 30
  const maxX = Math.max(...pathPoints.map(p => p.x)) + 30
  const minY = Math.min(...pathPoints.map(p => p.y)) - 30
  const maxY = Math.max(...pathPoints.map(p => p.y)) + 30
  const width = maxX - minX
  const height = maxY - minY

  // Build smooth SVG path with curves
  const buildPath = () => {
    if (pathPoints.length < 2) return ''

    let d = `M ${pathPoints[0].x} ${pathPoints[0].y}`

    for (let i = 1; i < pathPoints.length; i++) {
      const prev = pathPoints[i - 1]
      const curr = pathPoints[i]

      // Use quadratic curve for smooth corners
      const midX = (prev.x + curr.x) / 2
      const midY = (prev.y + curr.y) / 2

      if (i === 1) {
        d += ` L ${midX} ${midY}`
      } else {
        d += ` Q ${prev.x} ${prev.y} ${midX} ${midY}`
      }

      if (i === pathPoints.length - 1) {
        d += ` L ${curr.x} ${curr.y}`
      }
    }

    return d
  }

  // Build gradient stops for the path
  const gradientId = 'aerialRiverGradient'

  return (
    <div className="mockup-option">
      <h3>Option E: Aerial River</h3>
      <p className="mockup-desc">Bird's-eye view of your flow journey. The river curves in the direction you flowed.</p>

      <div className="aerial-river-mockup">
        <svg
          viewBox={`${minX} ${minY} ${width} ${height}`}
          className="aerial-river-svg"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Gradient definition */}
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              {entries.map((entry, i) => (
                <stop
                  key={entry.id}
                  offset={`${(i / (entries.length - 1)) * 100}%`}
                  stopColor={DIRECTION_CONFIG[entry.direction].color}
                />
              ))}
            </linearGradient>

            {/* Glow filter */}
            <filter id="riverGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* River shadow/glow */}
          <path
            d={buildPath()}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="28"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Main river path */}
          <path
            d={buildPath()}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth="20"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#riverGlow)"
          />

          {/* River highlight (animated) */}
          <path
            d={buildPath()}
            fill="none"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="river-highlight"
          />

          {/* Direction markers at each point */}
          {pathPoints.slice(1).map((point, i) => {
            const cfg = DIRECTION_CONFIG[point.direction]
            const isStuck = point.direction === 'south'

            return (
              <g key={point.id} className={`aerial-marker ${isStuck ? 'stuck' : ''}`}>
                {isStuck ? (
                  // South = Stuck spot - pulsing red warning
                  <>
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r="16"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="2"
                      className="stuck-pulse"
                    />
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r="10"
                      fill="#ef4444"
                    />
                    <text
                      x={point.x}
                      y={point.y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="white"
                      fontSize="12"
                      fontWeight="bold"
                    >
                      ●
                    </text>
                  </>
                ) : (
                  // Normal direction marker
                  <>
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r="12"
                      fill={cfg.color}
                      stroke="white"
                      strokeWidth="2"
                    />
                    <text
                      x={point.x}
                      y={point.y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="white"
                      fontSize="10"
                      fontWeight="bold"
                    >
                      {point.direction === 'north' ? '→' :
                       point.direction === 'west' ? '↑' :
                       point.direction === 'east' ? '↓' : cfg.icon}
                    </text>
                  </>
                )}
              </g>
            )
          })}

          {/* Start indicator */}
          <circle
            cx={pathPoints[0].x}
            cy={pathPoints[0].y}
            r="8"
            fill="#5e17eb"
            stroke="white"
            strokeWidth="2"
          />
          <text
            x={pathPoints[0].x}
            y={pathPoints[0].y - 18}
            textAnchor="middle"
            fill="rgba(255,255,255,0.6)"
            fontSize="8"
          >
            Start
          </text>

          {/* End indicator (pulsing) */}
          <circle
            cx={pathPoints[pathPoints.length - 1].x}
            cy={pathPoints[pathPoints.length - 1].y}
            r="16"
            fill="none"
            stroke={DIRECTION_CONFIG[entries[entries.length - 1].direction].color}
            strokeWidth="2"
            className="end-pulse"
          />
        </svg>

        {/* Journey summary */}
        <div className="aerial-summary">
          <span className="journey-label">Your 7-day journey:</span>
          <div className="journey-directions">
            {entries.map((entry, i) => {
              const cfg = DIRECTION_CONFIG[entry.direction]
              const icon = entry.direction === 'north' ? '→' :
                          entry.direction === 'west' ? '↑' :
                          entry.direction === 'east' ? '↓' : '●'
              return (
                <span
                  key={entry.id}
                  className={`journey-step ${entry.direction === 'south' ? 'stuck' : ''}`}
                  style={{ color: cfg.color }}
                >
                  {icon}
                </span>
              )
            })}
          </div>
        </div>

        {/* River flow legend */}
        <div className="aerial-legend">
          <div className="legend-row">
            <div className="legend-item-aerial">
              <span className="legend-arrow" style={{ color: DIRECTION_CONFIG.north.color }}>→</span>
              <span className="legend-text">Flow <span className="legend-sub">(Ease + Excited)</span></span>
            </div>
            <div className="legend-item-aerial">
              <span className="legend-arrow" style={{ color: DIRECTION_CONFIG.east.color }}>↓</span>
              <span className="legend-text">Redirect <span className="legend-sub">(Resistance + Excited)</span></span>
            </div>
          </div>
          <div className="legend-row">
            <div className="legend-item-aerial">
              <span className="legend-arrow" style={{ color: DIRECTION_CONFIG.west.color }}>↑</span>
              <span className="legend-text">Honour <span className="legend-sub">(Ease + Tired)</span></span>
            </div>
            <div className="legend-item-aerial">
              <span className="legend-dot-stuck" />
              <span className="legend-text">Rest <span className="legend-sub">(Resistance + Tired)</span></span>
            </div>
          </div>
        </div>
      </div>

      <div className="pros-cons">
        <div className="pros">
          <strong>Pros:</strong>
          <ul>
            <li>Most intuitive - direction = actual direction</li>
            <li>Beautiful bird's-eye view aesthetic</li>
            <li>Shows journey as a real path</li>
            <li>Unique and memorable</li>
          </ul>
        </div>
        <div className="cons">
          <strong>Cons:</strong>
          <ul>
            <li>Can get complex with many entries</li>
            <li>May need scroll/zoom for long journeys</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// OPTION F: NEON TRAIL
// Minimal glowing neon line - sleek and modern
// ═══════════════════════════════════════════════════════════════════════════
function OptionF_NeonTrail() {
  const entries = SAMPLE_ENTRIES
  const startX = 20
  const startY = 80
  const forwardStep = 45
  const curveAmount = 30

  let pathPoints = [{ x: startX, y: startY }]
  let currentX = startX
  let currentY = startY

  const directionEffects = {
    north: { forward: forwardStep, vertical: 0 },
    west: { forward: forwardStep * 0.7, vertical: -curveAmount },
    east: { forward: forwardStep * 0.7, vertical: curveAmount },
    south: { forward: forwardStep * 0.3, vertical: 0 }
  }

  entries.forEach((entry) => {
    const effect = directionEffects[entry.direction]
    currentX += effect.forward
    currentY += effect.vertical
    pathPoints.push({
      x: currentX,
      y: currentY,
      direction: entry.direction,
      id: entry.id
    })
  })

  const minX = Math.min(...pathPoints.map(p => p.x)) - 20
  const maxX = Math.max(...pathPoints.map(p => p.x)) + 20
  const minY = Math.min(...pathPoints.map(p => p.y)) - 20
  const maxY = Math.max(...pathPoints.map(p => p.y)) + 20

  // Build cubic bezier path for extra smoothness
  const buildSmoothPath = () => {
    if (pathPoints.length < 2) return ''
    let d = `M ${pathPoints[0].x} ${pathPoints[0].y}`

    for (let i = 1; i < pathPoints.length; i++) {
      const prev = pathPoints[i - 1]
      const curr = pathPoints[i]
      const cpX = (prev.x + curr.x) / 2
      d += ` Q ${prev.x + (curr.x - prev.x) * 0.5} ${prev.y} ${cpX} ${(prev.y + curr.y) / 2}`
    }
    const last = pathPoints[pathPoints.length - 1]
    d += ` L ${last.x} ${last.y}`
    return d
  }

  return (
    <div className="mockup-option">
      <h3>Option F: Neon Trail</h3>
      <p className="mockup-desc">Minimal glowing neon line. Clean, modern, and sleek.</p>

      <div className="neon-trail-mockup">
        <svg viewBox={`${minX} ${minY} ${maxX - minX} ${maxY - minY}`} className="neon-svg">
          <defs>
            {/* Gradient along path */}
            <linearGradient id="neonGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              {entries.map((entry, i) => (
                <stop
                  key={entry.id}
                  offset={`${(i / (entries.length - 1)) * 100}%`}
                  stopColor={DIRECTION_CONFIG[entry.direction].color}
                />
              ))}
            </linearGradient>

            {/* Glow filters */}
            <filter id="neonGlow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="4" result="blur1" />
              <feGaussianBlur stdDeviation="8" result="blur2" />
              <feMerge>
                <feMergeNode in="blur2" />
                <feMergeNode in="blur1" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Outer glow */}
          <path
            d={buildSmoothPath()}
            fill="none"
            stroke="url(#neonGradient)"
            strokeWidth="12"
            strokeLinecap="round"
            opacity="0.3"
          />

          {/* Main neon line */}
          <path
            d={buildSmoothPath()}
            fill="none"
            stroke="url(#neonGradient)"
            strokeWidth="4"
            strokeLinecap="round"
            filter="url(#neonGlow)"
          />

          {/* Core bright line */}
          <path
            d={buildSmoothPath()}
            fill="none"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.8"
          />

          {/* Animated particle */}
          <circle r="4" fill="white" className="neon-particle">
            <animateMotion dur="3s" repeatCount="indefinite" path={buildSmoothPath()} />
          </circle>

          {/* South stuck indicators only */}
          {pathPoints.slice(1).filter(p => p.direction === 'south').map((point) => (
            <g key={point.id}>
              <circle cx={point.x} cy={point.y} r="8" fill="#ef4444" className="neon-stuck" />
              <circle cx={point.x} cy={point.y} r="12" fill="none" stroke="#ef4444" strokeWidth="2" className="neon-stuck-ring" />
            </g>
          ))}

          {/* End point */}
          <circle
            cx={pathPoints[pathPoints.length - 1].x}
            cy={pathPoints[pathPoints.length - 1].y}
            r="6"
            fill={DIRECTION_CONFIG[entries[entries.length - 1].direction].color}
            className="neon-end"
          />
        </svg>

        {/* Minimal legend */}
        <div className="neon-legend">
          <span style={{ color: DIRECTION_CONFIG.north.color }}>● Flow</span>
          <span style={{ color: DIRECTION_CONFIG.east.color }}>● Growth</span>
          <span style={{ color: DIRECTION_CONFIG.west.color }}>● Block</span>
          <span style={{ color: DIRECTION_CONFIG.south.color }}>● Drain</span>
        </div>
      </div>

      <div className="pros-cons">
        <div className="pros">
          <strong>Pros:</strong>
          <ul>
            <li>Very clean and minimal</li>
            <li>Modern aesthetic</li>
            <li>Animated particle shows direction</li>
            <li>Less visual noise</li>
          </ul>
        </div>
        <div className="cons">
          <strong>Cons:</strong>
          <ul>
            <li>Less detail at each point</li>
            <li>Harder to see individual days</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// OPTION G: TERRAIN MAP
// Topographic style with contour lines and landscape feel
// ═══════════════════════════════════════════════════════════════════════════
function OptionG_TerrainMap() {
  const entries = SAMPLE_ENTRIES
  const startX = 30
  const startY = 90
  const forwardStep = 42
  const curveAmount = 32

  let pathPoints = [{ x: startX, y: startY }]
  let currentX = startX
  let currentY = startY

  const directionEffects = {
    north: { forward: forwardStep, vertical: 0 },
    west: { forward: forwardStep * 0.7, vertical: -curveAmount },
    east: { forward: forwardStep * 0.7, vertical: curveAmount },
    south: { forward: forwardStep * 0.3, vertical: 0 }
  }

  entries.forEach((entry) => {
    const effect = directionEffects[entry.direction]
    currentX += effect.forward
    currentY += effect.vertical
    pathPoints.push({
      x: currentX,
      y: currentY,
      direction: entry.direction,
      date: entry.date,
      id: entry.id
    })
  })

  const minX = Math.min(...pathPoints.map(p => p.x)) - 40
  const maxX = Math.max(...pathPoints.map(p => p.x)) + 40
  const minY = Math.min(...pathPoints.map(p => p.y)) - 40
  const maxY = Math.max(...pathPoints.map(p => p.y)) + 40

  const buildPath = () => {
    if (pathPoints.length < 2) return ''
    let d = `M ${pathPoints[0].x} ${pathPoints[0].y}`
    for (let i = 1; i < pathPoints.length; i++) {
      const prev = pathPoints[i - 1]
      const curr = pathPoints[i]
      const midX = (prev.x + curr.x) / 2
      const midY = (prev.y + curr.y) / 2
      if (i === 1) {
        d += ` L ${midX} ${midY}`
      } else {
        d += ` Q ${prev.x} ${prev.y} ${midX} ${midY}`
      }
      if (i === pathPoints.length - 1) {
        d += ` L ${curr.x} ${curr.y}`
      }
    }
    return d
  }

  return (
    <div className="mockup-option">
      <h3>Option G: Terrain Map</h3>
      <p className="mockup-desc">Topographic style with contour lines. Shows the landscape of your journey.</p>

      <div className="terrain-mockup">
        <svg viewBox={`${minX} ${minY} ${maxX - minX} ${maxY - minY}`} className="terrain-svg">
          <defs>
            <linearGradient id="terrainGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              {entries.map((entry, i) => (
                <stop
                  key={entry.id}
                  offset={`${(i / (entries.length - 1)) * 100}%`}
                  stopColor={DIRECTION_CONFIG[entry.direction].color}
                />
              ))}
            </linearGradient>

            {/* Texture pattern */}
            <pattern id="terrainPattern" width="4" height="4" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="0.5" fill="rgba(255,255,255,0.1)" />
            </pattern>
          </defs>

          {/* Contour lines (outer rings) */}
          {[40, 32, 24, 16].map((offset, i) => (
            <path
              key={i}
              d={buildPath()}
              fill="none"
              stroke={`rgba(255,255,255,${0.03 + i * 0.02})`}
              strokeWidth={offset}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}

          {/* Main river channel */}
          <path
            d={buildPath()}
            fill="none"
            stroke="url(#terrainGradient)"
            strokeWidth="14"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* River texture overlay */}
          <path
            d={buildPath()}
            fill="none"
            stroke="url(#terrainPattern)"
            strokeWidth="14"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Center flow line */}
          <path
            d={buildPath()}
            fill="none"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="8 4"
            className="terrain-flow"
          />

          {/* Waypoint markers */}
          {pathPoints.slice(1).map((point, i) => {
            const cfg = DIRECTION_CONFIG[point.direction]
            const isStuck = point.direction === 'south'

            return (
              <g key={point.id}>
                {/* Contour rings around waypoint */}
                <circle cx={point.x} cy={point.y} r="18" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                <circle cx={point.x} cy={point.y} r="14" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />

                {/* Waypoint */}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="10"
                  fill={isStuck ? '#1a1a2e' : cfg.color}
                  stroke={cfg.color}
                  strokeWidth="2"
                />

                {isStuck && (
                  <text x={point.x} y={point.y + 1} textAnchor="middle" dominantBaseline="middle" fill="#ef4444" fontSize="12" fontWeight="bold">!</text>
                )}

                {/* Day label */}
                <text
                  x={point.x}
                  y={point.y + 24}
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.5)"
                  fontSize="7"
                >
                  Day {i + 1}
                </text>
              </g>
            )
          })}

          {/* Start flag */}
          <g>
            <line x1={pathPoints[0].x} y1={pathPoints[0].y} x2={pathPoints[0].x} y2={pathPoints[0].y - 20} stroke="white" strokeWidth="2" />
            <polygon points={`${pathPoints[0].x},${pathPoints[0].y - 20} ${pathPoints[0].x + 12},${pathPoints[0].y - 15} ${pathPoints[0].x},${pathPoints[0].y - 10}`} fill="#5e17eb" />
          </g>

          {/* End marker */}
          <circle
            cx={pathPoints[pathPoints.length - 1].x}
            cy={pathPoints[pathPoints.length - 1].y}
            r="14"
            fill="none"
            stroke={DIRECTION_CONFIG[entries[entries.length - 1].direction].color}
            strokeWidth="3"
            className="terrain-end-pulse"
          />
        </svg>

        {/* Terrain legend */}
        <div className="terrain-legend">
          <div className="terrain-legend-title">Elevation Key</div>
          <div className="terrain-legend-items">
            <div className="terrain-legend-item">
              <div className="elevation-bar" style={{ background: DIRECTION_CONFIG.north.color }} />
              <span>Flow (steady)</span>
            </div>
            <div className="terrain-legend-item">
              <div className="elevation-bar high" style={{ background: DIRECTION_CONFIG.west.color }} />
              <span>Block (uphill)</span>
            </div>
            <div className="terrain-legend-item">
              <div className="elevation-bar low" style={{ background: DIRECTION_CONFIG.east.color }} />
              <span>Growth (downhill)</span>
            </div>
            <div className="terrain-legend-item">
              <div className="elevation-bar stuck" />
              <span>Drain (stuck)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="pros-cons">
        <div className="pros">
          <strong>Pros:</strong>
          <ul>
            <li>Rich, detailed visual</li>
            <li>Topographic metaphor is intuitive</li>
            <li>Shows "elevation" of journey</li>
            <li>Day labels for clarity</li>
          </ul>
        </div>
        <div className="cons">
          <strong>Cons:</strong>
          <ul>
            <li>More visually complex</li>
            <li>Takes more vertical space</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// OPTION H: VERTICAL AERIAL RIVER (Bottom to Top)
// Same as Option E but vertical - optimized for mobile scrolling
// ═══════════════════════════════════════════════════════════════════════════
function OptionH_VerticalRiver() {
  const entries = SAMPLE_ENTRIES

  // Calculate path points based on directions
  // Start from bottom, flow upward
  // North = upward (flow towards goals)
  // West = curve left
  // East = curve right
  // South = stuck spot (minimal upward movement)
  const startX = 150  // Center of container
  const startY = 300  // Start near bottom
  const upwardStep = 40  // How much we move up each entry
  const curveAmount = 35  // How much we curve left/right

  let pathPoints = [{ x: startX, y: startY }]
  let currentX = startX
  let currentY = startY

  // Direction affects horizontal position while always moving upward
  const directionEffects = {
    north: { horizontal: 0, upward: upwardStep },            // Straight up - Flow
    west: { horizontal: -curveAmount, upward: upwardStep * 0.7 },  // Curve left - Honour
    east: { horizontal: curveAmount, upward: upwardStep * 0.7 },   // Curve right - Redirect
    south: { horizontal: 0, upward: upwardStep * 0.3 }        // Minimal upward - Rest (stuck)
  }

  entries.forEach((entry) => {
    const effect = directionEffects[entry.direction]
    currentX += effect.horizontal
    currentY -= effect.upward  // Subtract because Y decreases going up in SVG
    pathPoints.push({
      x: currentX,
      y: currentY,
      direction: entry.direction,
      date: entry.date,
      id: entry.id,
      isStuck: entry.direction === 'south'
    })
  })

  // Calculate viewBox to fit all points
  const minX = Math.min(...pathPoints.map(p => p.x)) - 50
  const maxX = Math.max(...pathPoints.map(p => p.x)) + 50
  const minY = Math.min(...pathPoints.map(p => p.y)) - 40
  const maxY = Math.max(...pathPoints.map(p => p.y)) + 40
  const width = maxX - minX
  const height = maxY - minY

  // Build smooth SVG path with curves
  const buildPath = () => {
    if (pathPoints.length < 2) return ''

    let d = `M ${pathPoints[0].x} ${pathPoints[0].y}`

    for (let i = 1; i < pathPoints.length; i++) {
      const prev = pathPoints[i - 1]
      const curr = pathPoints[i]

      // Use quadratic curve for smooth corners
      const midX = (prev.x + curr.x) / 2
      const midY = (prev.y + curr.y) / 2

      if (i === 1) {
        d += ` L ${midX} ${midY}`
      } else {
        d += ` Q ${prev.x} ${prev.y} ${midX} ${midY}`
      }

      if (i === pathPoints.length - 1) {
        d += ` L ${curr.x} ${curr.y}`
      }
    }

    return d
  }

  // Build gradient stops for the path (vertical gradient)
  const gradientId = 'verticalRiverGradient'

  return (
    <div className="mockup-option">
      <h3>Option H: Vertical River (Mobile)</h3>
      <p className="mockup-desc">Bottom-to-top flow optimized for mobile. Scroll up through your journey.</p>

      <div className="vertical-river-mockup">
        <svg
          viewBox={`${minX} ${minY} ${width} ${height}`}
          className="vertical-river-svg"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Gradient definition - vertical */}
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="100%" x2="0%" y2="0%">
              {entries.map((entry, i) => (
                <stop
                  key={entry.id}
                  offset={`${(i / (entries.length - 1)) * 100}%`}
                  stopColor={DIRECTION_CONFIG[entry.direction].color}
                />
              ))}
            </linearGradient>

            {/* Glow filter */}
            <filter id="verticalRiverGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* River shadow/glow */}
          <path
            d={buildPath()}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="28"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Main river path */}
          <path
            d={buildPath()}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth="20"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#verticalRiverGlow)"
          />

          {/* River highlight (animated) */}
          <path
            d={buildPath()}
            fill="none"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="river-highlight"
          />

          {/* Direction markers at each point */}
          {pathPoints.slice(1).map((point) => {
            const cfg = DIRECTION_CONFIG[point.direction]
            const isStuck = point.direction === 'south'

            // Direction icons for vertical layout
            const dirIcon = point.direction === 'north' ? '↑' :
                           point.direction === 'west' ? '←' :
                           point.direction === 'east' ? '→' : '●'

            return (
              <g key={point.id} className={`aerial-marker ${isStuck ? 'stuck' : ''}`}>
                {isStuck ? (
                  // South = Stuck spot - pulsing red warning
                  <>
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r="16"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="2"
                      className="stuck-pulse"
                    />
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r="10"
                      fill="#ef4444"
                    />
                    <text
                      x={point.x}
                      y={point.y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="white"
                      fontSize="12"
                      fontWeight="bold"
                    >
                      ●
                    </text>
                  </>
                ) : (
                  // Normal direction marker
                  <>
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r="12"
                      fill={cfg.color}
                      stroke="white"
                      strokeWidth="2"
                    />
                    <text
                      x={point.x}
                      y={point.y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="white"
                      fontSize="10"
                      fontWeight="bold"
                    >
                      {dirIcon}
                    </text>
                  </>
                )}

                {/* Date label on side */}
                <text
                  x={point.x + 22}
                  y={point.y}
                  textAnchor="start"
                  dominantBaseline="central"
                  fill="rgba(255,255,255,0.6)"
                  fontSize="8"
                >
                  {point.date}
                </text>
              </g>
            )
          })}

          {/* Start indicator (bottom) */}
          <circle
            cx={pathPoints[0].x}
            cy={pathPoints[0].y}
            r="8"
            fill="#5e17eb"
            stroke="white"
            strokeWidth="2"
          />
          <text
            x={pathPoints[0].x}
            y={pathPoints[0].y + 20}
            textAnchor="middle"
            fill="rgba(255,255,255,0.6)"
            fontSize="8"
          >
            Start
          </text>

          {/* End indicator (top - pulsing) */}
          <circle
            cx={pathPoints[pathPoints.length - 1].x}
            cy={pathPoints[pathPoints.length - 1].y}
            r="16"
            fill="none"
            stroke={DIRECTION_CONFIG[entries[entries.length - 1].direction].color}
            strokeWidth="2"
            className="end-pulse"
          />
          <text
            x={pathPoints[pathPoints.length - 1].x}
            y={pathPoints[pathPoints.length - 1].y - 24}
            textAnchor="middle"
            fill="rgba(255,255,255,0.8)"
            fontSize="9"
            fontWeight="bold"
          >
            Now
          </text>
        </svg>

        {/* Journey summary */}
        <div className="vertical-summary">
          <span className="journey-label">Your 7-day journey:</span>
          <div className="journey-directions vertical">
            {entries.map((entry) => {
              const cfg = DIRECTION_CONFIG[entry.direction]
              const icon = entry.direction === 'north' ? '↑' :
                          entry.direction === 'west' ? '←' :
                          entry.direction === 'east' ? '→' : '●'
              return (
                <span
                  key={entry.id}
                  className={`journey-step ${entry.direction === 'south' ? 'stuck' : ''}`}
                  style={{ color: cfg.color }}
                >
                  {icon}
                </span>
              )
            })}
          </div>
        </div>

        {/* Vertical-optimized legend */}
        <div className="vertical-legend">
          <div className="legend-row">
            <div className="legend-item-aerial">
              <span className="legend-arrow" style={{ color: DIRECTION_CONFIG.north.color }}>↑</span>
              <span className="legend-text">Flow</span>
            </div>
            <div className="legend-item-aerial">
              <span className="legend-arrow" style={{ color: DIRECTION_CONFIG.east.color }}>→</span>
              <span className="legend-text">Redirect</span>
            </div>
          </div>
          <div className="legend-row">
            <div className="legend-item-aerial">
              <span className="legend-arrow" style={{ color: DIRECTION_CONFIG.west.color }}>←</span>
              <span className="legend-text">Honour</span>
            </div>
            <div className="legend-item-aerial">
              <span className="legend-dot-stuck" />
              <span className="legend-text">Rest</span>
            </div>
          </div>
        </div>
      </div>

      <div className="pros-cons">
        <div className="pros">
          <strong>Pros:</strong>
          <ul>
            <li>Optimized for mobile scrolling</li>
            <li>Natural "climbing up" metaphor</li>
            <li>Progress feels like growth</li>
            <li>Fits portrait orientation better</li>
          </ul>
        </div>
        <div className="cons">
          <strong>Cons:</strong>
          <ul>
            <li>Takes more vertical space</li>
            <li>Less intuitive on desktop</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN MOCKUP VIEWER
// ═══════════════════════════════════════════════════════════════════════════
export default function FlowMapMockups() {
  const [selected, setSelected] = useState(null)

  return (
    <div className="mockups-container">
      <div className="mockups-header">
        <h1>FlowMap Style Options</h1>
        <p>Choose your preferred visualization style for the home screen</p>
      </div>

      <div className="mockups-grid">
        <OptionE_AerialRiver />
        <OptionH_VerticalRiver />
        <OptionF_NeonTrail />
        <OptionG_TerrainMap />
        <OptionD_FlowingRiver />
        <OptionA_RiverPath />
        <OptionB_CompassWheel />
        <OptionC_GridCalendar />
      </div>

      <div className="mockups-footer">
        <p>Click on your preferred option to select it</p>
      </div>
    </div>
  )
}
