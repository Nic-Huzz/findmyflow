/**
 * FlowMapRiver.jsx
 *
 * Visualizes Flow Compass entries as a vertical aerial river path.
 * Flows from bottom (start) to top (now) - optimized for mobile.
 * Each entry is a node on the river, color-coded by direction (N/E/S/W).
 *
 * Direction Effects (vertical flow):
 * - North (Flow): Straight up - Ease + Excited
 * - East (Redirect): Curves right - Resistance + Excited
 * - South (Rest): Stuck spot - Resistance + Tired
 * - West (Honour): Curves left - Ease + Tired
 *
 * Created: Dec 2024
 * Updated to vertical aerial design (Option H)
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import { getStageShortName } from '../lib/stageConfig'
import './FlowMapRiver.css'

const DIRECTION_CONFIG = {
  north: {
    color: '#10b981',  // Green
    label: 'Flow',
    icon: '↑',
    description: 'Ease + Excited'
  },
  east: {
    color: '#3b82f6',  // Blue
    label: 'Redirect',
    icon: '→',
    description: 'Resistance + Excited'
  },
  south: {
    color: '#ef4444',  // Red
    label: 'Rest',
    icon: '●',
    description: 'Resistance + Tired'
  },
  west: {
    color: '#fbbf24',  // Yellow
    label: 'Honour',
    icon: '←',
    description: 'Ease + Tired'
  }
}

function FlowMapRiver({ projectId, limit = 20, onViewAll, projects = [], selectedProjectId, onProjectSelect }) {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedEntry, setSelectedEntry] = useState(null)

  useEffect(() => {
    if (user?.id && projectId) {
      fetchEntries()
    }
  }, [user, projectId])

  const fetchEntries = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('flow_entries')
        .select('id, direction, logged_at, activity_description, reasoning')
        .eq('user_id', user.id)
        .eq('project_id', projectId)
        .order('logged_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      setEntries(data || [])
    } catch (err) {
      console.error('Error fetching flow entries:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  if (loading) {
    return (
      <div className="flow-map-river loading">
        <div className="river-loading-indicator" />
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="flow-map-river empty">
        <div className="empty-river">
          <span className="empty-icon">🧭</span>
          <p className="empty-text"><span>Complete</span><strong>'Map Your Journey'</strong><span>Below</span></p>
          <span className="empty-arrow">↓</span>
        </div>
      </div>
    )
  }

  // Reverse entries for display (oldest first, flowing up to newest)
  const displayEntries = [...entries].reverse()

  // Calculate path points based on directions
  // Start from bottom, flow upward
  const centerX = 150
  const startY = 50 + (displayEntries.length * 40) // Dynamic based on entries
  const upwardStep = 40
  const curveAmount = 35

  let pathPoints = [{ x: centerX, y: startY }]
  let currentX = centerX
  let currentY = startY

  // Direction affects horizontal position while always moving upward
  const directionEffects = {
    north: { horizontal: 0, upward: upwardStep },
    west: { horizontal: -curveAmount, upward: upwardStep * 0.7 },
    east: { horizontal: curveAmount, upward: upwardStep * 0.7 },
    south: { horizontal: 0, upward: upwardStep * 0.3 }
  }

  displayEntries.forEach((entry) => {
    const effect = directionEffects[entry.direction] || directionEffects.north
    currentX += effect.horizontal
    currentY -= effect.upward
    pathPoints.push({
      x: currentX,
      y: currentY,
      direction: entry.direction,
      date: formatDate(entry.logged_at),
      id: entry.id,
      description: entry.activity_description,
      isStuck: entry.direction === 'south'
    })
  })

  // Calculate viewBox to fit all points
  const minX = Math.min(...pathPoints.map(p => p.x)) - 60
  const maxX = Math.max(...pathPoints.map(p => p.x)) + 60
  const minY = Math.min(...pathPoints.map(p => p.y)) - 50
  const maxY = Math.max(...pathPoints.map(p => p.y)) + 40
  const svgWidth = maxX - minX
  const svgHeight = maxY - minY

  // Build smooth SVG path with curves
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

  const gradientId = 'flowRiverGradient'
  const glowFilterId = 'flowRiverGlow'

  return (
    <div className="flow-map-river">
      {/* Entry Popup */}
      {selectedEntry && (
        <div className="entry-popup" onClick={() => setSelectedEntry(null)}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <div className="popup-header">
              <span
                className="popup-direction"
                style={{ color: DIRECTION_CONFIG[selectedEntry.direction]?.color }}
              >
                {DIRECTION_CONFIG[selectedEntry.direction]?.icon} {DIRECTION_CONFIG[selectedEntry.direction]?.label}
              </span>
              <span className="popup-date">{selectedEntry.date}</span>
            </div>
            <p className="popup-description">
              {selectedEntry.description || 'No description'}
            </p>
            <button className="popup-close" onClick={() => setSelectedEntry(null)}>✕</button>
          </div>
        </div>
      )}

      {/* Vertical River SVG */}
      <div className="river-svg-container">
        <svg
          viewBox={`${minX} ${minY} ${svgWidth} ${svgHeight}`}
          className="river-svg"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Vertical gradient */}
            <linearGradient id={gradientId} x1="0%" y1="100%" x2="0%" y2="0%">
              {displayEntries.map((entry, i) => (
                <stop
                  key={entry.id}
                  offset={`${(i / (displayEntries.length - 1)) * 100}%`}
                  stopColor={DIRECTION_CONFIG[entry.direction]?.color || '#10b981'}
                />
              ))}
            </linearGradient>

            {/* Glow filter */}
            <filter id={glowFilterId} x="-50%" y="-50%" width="200%" height="200%">
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
            filter={`url(#${glowFilterId})`}
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
          {pathPoints.slice(1).map((point, index) => {
            const cfg = DIRECTION_CONFIG[point.direction] || DIRECTION_CONFIG.north
            const isStuck = point.direction === 'south'
            const isLast = index === pathPoints.length - 2
            const isSelected = selectedEntry?.id === point.id

            return (
              <g
                key={point.id}
                className={`river-marker ${isStuck ? 'stuck' : ''} ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelectedEntry(selectedEntry?.id === point.id ? null : point)}
                style={{ cursor: 'pointer' }}
              >
                {isStuck ? (
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
                  <>
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r={isSelected ? 16 : 12}
                      fill={cfg.color}
                      stroke="white"
                      strokeWidth={isSelected ? 3 : 2}
                      className={isSelected ? 'selected-pulse' : ''}
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
                      {cfg.icon}
                    </text>
                  </>
                )}

                {/* Date label on side (show every 3rd or last) */}
                {(index % 3 === 0 || isLast) && (
                  <text
                    x={point.x + 22}
                    y={point.y}
                    textAnchor="start"
                    dominantBaseline="central"
                    fill="rgba(255,255,255,0.6)"
                    fontSize="9"
                  >
                    {point.date}
                  </text>
                )}
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
            y={pathPoints[0].y + 18}
            textAnchor="middle"
            fill="rgba(255,255,255,0.6)"
            fontSize="9"
          >
            Start
          </text>

          {/* End indicator (top - pulsing) */}
          <circle
            cx={pathPoints[pathPoints.length - 1].x}
            cy={pathPoints[pathPoints.length - 1].y}
            r="16"
            fill="none"
            stroke={DIRECTION_CONFIG[displayEntries[displayEntries.length - 1]?.direction]?.color || '#10b981'}
            strokeWidth="2"
            className="end-pulse"
          />
          <text
            x={pathPoints[pathPoints.length - 1].x}
            y={pathPoints[pathPoints.length - 1].y - 24}
            textAnchor="middle"
            fill="rgba(255,255,255,0.8)"
            fontSize="10"
            fontWeight="bold"
          >
            Now
          </text>
        </svg>
      </div>

      {/* Legend */}
      <div className="river-legend">
        <div className="legend-row">
          <div className="legend-item">
            <span className="legend-icon" style={{ color: DIRECTION_CONFIG.north.color }}>↑</span>
            <span className="legend-text">Flow</span>
          </div>
          <div className="legend-item">
            <span className="legend-icon" style={{ color: DIRECTION_CONFIG.east.color }}>→</span>
            <span className="legend-text">Redirect</span>
          </div>
        </div>
        <div className="legend-row">
          <div className="legend-item">
            <span className="legend-icon" style={{ color: DIRECTION_CONFIG.west.color }}>←</span>
            <span className="legend-text">Honour</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot-stuck" />
            <span className="legend-text">Rest</span>
          </div>
        </div>
      </div>

      {/* Project Selector */}
      {projects.length > 0 && (
        <div className="river-projects">
          <div className="river-projects-label">Your Projects</div>
          <div className="river-projects-list">
            {projects.map(project => (
              <button
                key={project.id}
                className={`river-project-chip ${project.id === selectedProjectId ? 'selected' : ''}`}
                onClick={() => onProjectSelect && onProjectSelect(project)}
              >
                <span className="project-chip-name">{project.name}</span>
                <span className="project-chip-stage">{getStageShortName(project.current_stage ?? 1)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* View All Button */}
      <button
        className="view-all-button"
        onClick={() => onViewAll ? onViewAll() : navigate('/flow-compass')}
      >
        View Flow Compass
      </button>
    </div>
  )
}

export default FlowMapRiver
