import React, { useMemo } from 'react'
import { PRIMALS, INDUSTRIES, industryNodes } from '../lib/ruleBreakTreeData'
import { isCoreNode, VIRTUAL_EXPERIENCE_NODES } from '../lib/experienceDomeConfig'
import './DomeRadar.css'

const PRIMAL_COLOR_MAP = Object.fromEntries(PRIMALS.map(p => [p.id, p.color]))
PRIMAL_COLOR_MAP['fire'] = '#ea580c'

// Override primal assignment for nodes whose tree branch doesn't match their experiential primal
const PRIMAL_OVERRIDES = {
  'sub-safety-1400b': 'movement',  // Martial arts: physical discipline, not "threat"
  'sub-safety-1993': 'movement',   // BJJ/MMA: combat sport, not "threat"
  'sub-craft-1880': 'story',       // Art class: creative expression, not "status"
}

const NS_GLOW = {
  vibe_rise: 1.0,
  fun: 0.6,
  pressure: 0.8,
  bored: 0,
}

// NS state → distance from center (0 = center, 1 = edge)
// Vibe Rise = closest (safe zone), Unrated = furthest (unknown)
const NS_RADIUS = {
  vibe_rise: 0.15,
  fun: 0.4,
  pressure: 0.7,
  bored: 0.9,
}

/**
 * MiniDome — simplified version of the Rule Break Tree dome viz.
 * Shows 58 core experience nodes in a radial layout, grouped by primal.
 * Nodes light up when checked/rated.
 */
export default function DomeRadar({ checked = {}, ratings = {}, size = 280, showLabels = true, onClose }) {
  const layout = useMemo(() => {
    const cx = size / 2
    const cy = size / 2
    const labelR = size * 0.42        // primal label ring
    const maxNodeR = size * 0.36      // furthest node distance (unrated/bored)
    const minNodeR = size * 0.08      // closest node distance (vibe rise)

    // Get core nodes grouped by primal
    const primalNodes = {}
    PRIMALS.forEach(p => { primalNodes[p.id] = [] })

    industryNodes.forEach(n => {
      if (!isCoreNode(n.id)) return
      const ind = INDUSTRIES[n.branch]
      if (!ind) return
      const primalId = PRIMAL_OVERRIDES[n.id] || ind.primal
      if (primalNodes[primalId]) {
        primalNodes[primalId].push(n)
      }
    })

    // Add virtual experience nodes
    VIRTUAL_EXPERIENCE_NODES.forEach(v => {
      if (primalNodes[v.primal]) {
        primalNodes[v.primal].push({ id: v.id, label: v.label, branch: v.branch })
      }
    })

    const step = (2 * Math.PI) / PRIMALS.length
    const nodes = []
    const primalLabels = []

    PRIMALS.forEach((primal, pi) => {
      const baseAngle = -Math.PI / 2 + pi * step
      const color = PRIMAL_COLOR_MAP[primal.id] || primal.color
      const pNodes = primalNodes[primal.id]

      // Primal label position
      const lx = cx + Math.cos(baseAngle) * labelR
      const ly = cy + Math.sin(baseAngle) * labelR
      primalLabels.push({ id: primal.id, label: primal.label, x: lx, y: ly, color, angle: baseAngle })

      // Spread nodes within this primal's angular sector
      const sectorWidth = step * 0.75
      const startA = baseAngle - sectorWidth / 2
      const nodeCount = pNodes.length

      pNodes.forEach((n, ni) => {
        const angleOffset = nodeCount > 1
          ? startA + (ni / (nodeCount - 1)) * sectorWidth
          : baseAngle

        // NS-state based radius: Vibe Rise = closest, unrated = edge
        const nsState = ratings[n.id]
        const isChecked = !!checked[n.id]
        let radiusT
        if (nsState && NS_RADIUS[nsState] !== undefined) {
          // Rated — position by NS state
          radiusT = NS_RADIUS[nsState]
        } else if (isChecked) {
          // Checked but not rated — mid-range
          radiusT = 0.55
        } else {
          // Unrated/unchecked — outer edge
          radiusT = 0.95
        }
        // Add slight jitter so same-state nodes don't overlap perfectly
        const jitter = nodeCount > 1 ? (ni % 3 - 1) * 0.06 : 0
        const r = minNodeR + (radiusT + jitter) * (maxNodeR - minNodeR)

        const x = cx + Math.cos(angleOffset) * r
        const y = cy + Math.sin(angleOffset) * r

        nodes.push({
          id: n.id,
          x,
          y,
          color,
          primalId: primal.id,
        })
      })
    })

    // NS state zone bands (inner → outer): Vibe Rise, Fun, Stressful, Bored
    const bands = [
      { innerR: 0, outerR: minNodeR + (NS_RADIUS.vibe_rise + 0.12) * (maxNodeR - minNodeR), color: '#E9A23B' },
      { innerR: minNodeR + (NS_RADIUS.vibe_rise + 0.12) * (maxNodeR - minNodeR), outerR: minNodeR + (NS_RADIUS.fun + 0.15) * (maxNodeR - minNodeR), color: '#10b981' },
      { innerR: minNodeR + (NS_RADIUS.fun + 0.15) * (maxNodeR - minNodeR), outerR: minNodeR + (NS_RADIUS.pressure + 0.1) * (maxNodeR - minNodeR), color: '#ef4444' },
      { innerR: minNodeR + (NS_RADIUS.pressure + 0.1) * (maxNodeR - minNodeR), outerR: maxNodeR, color: '#6b7280' },
    ]

    return { cx, cy, minNodeR, maxNodeR, labelR, nodes, primalLabels, bands }
  }, [size, ratings, checked])

  const totalChecked = layout.nodes.filter(n => checked[n.id]).length

  return (
    <div className={`dome-mini ${onClose ? 'dome-mini-popup' : ''}`} style={{ fontSize: size * 0.08 }}>
      <svg width={size} height={size} viewBox={`${-size * 0.12} ${-size * 0.06} ${size * 1.24} ${size * 1.12}`}>
        {/* NS state zone bands — coloured rings from center out */}
        {layout.bands.map((band, i) => {
          const bandWidth = band.outerR - band.innerR
          const midR = band.innerR + bandWidth / 2
          return (
            <circle key={i} cx={layout.cx} cy={layout.cy} r={midR}
              fill="none" stroke={band.color} strokeWidth={bandWidth}
              opacity={0.06} />
          )
        })}

        {/* Sector lines (subtle) */}
        {layout.primalLabels.map(p => (
          <line
            key={`line-${p.id}`}
            x1={layout.cx}
            y1={layout.cy}
            x2={layout.cx + Math.cos(p.angle) * layout.maxNodeR}
            y2={layout.cy + Math.sin(p.angle) * layout.maxNodeR}
            stroke="rgba(0,0,0,0.03)"
            strokeWidth={0.5}
          />
        ))}

        {/* Nodes */}
        {layout.nodes.map(n => {
          const isChecked = !!checked[n.id]
          const nsState = ratings[n.id]
          const glowLevel = nsState ? (NS_GLOW[nsState] || 0) : (isChecked ? 0.5 : 0)
          const isDark = !isChecked
          const nodeR = size * 0.018

          return (
            <g key={n.id}>
              {/* Glow */}
              {glowLevel > 0 && (
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={nodeR + size * 0.025}
                  fill={n.color}
                  opacity={glowLevel * 0.35}
                  className={nsState === 'pressure' ? 'dome-mini-pulse' : ''}
                />
              )}
              {/* Node circle */}
              <circle
                cx={n.x}
                cy={n.y}
                r={nodeR}
                fill={isDark ? '#e0e0dc' : n.color}
                stroke={isDark ? '#d0d0cc' : n.color}
                strokeWidth={isDark ? 1 : 1.5}
                opacity={isDark ? 0.7 : 1}
                style={{ transition: 'all 0.4s ease' }}
              />
              {/* Inner bright fill for lit nodes */}
              {isChecked && (
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={nodeR * 0.5}
                  fill={nsState === 'vibe_rise' ? '#E9A23B' : n.color}
                  opacity={glowLevel > 0.5 ? 0.9 : 0.6}
                  style={{ transition: 'all 0.4s ease' }}
                />
              )}
            </g>
          )
        })}

        {/* Primal labels */}
        {showLabels && layout.primalLabels.map(p => {
          const isRight = p.x > layout.cx + 2
          const isLeft = p.x < layout.cx - 2
          const hasChecked = layout.nodes.some(n => n.primalId === p.id && checked[n.id])
          return (
            <text
              key={`label-${p.id}`}
              x={p.x}
              y={p.y}
              textAnchor={isRight ? 'start' : isLeft ? 'end' : 'middle'}
              dominantBaseline="central"
              fontSize={size * 0.038}
              fontWeight="600"
              fill={hasChecked ? p.color : '#ccc'}
              style={{ transition: 'fill 0.4s ease' }}
            >
              {p.label}
            </text>
          )
        })}
      </svg>

      {/* Stat below dome (not overlapping) */}
      <div className="dome-mini-stat" style={{ fontSize: size * 0.06 }}>
        <span className="dome-mini-num">{totalChecked}</span>
        <span className="dome-mini-label">{'\u00A0'}experienced</span>
      </div>

      {onClose && (
        <button className="dome-mini-close" onClick={onClose}>
          Continue →
        </button>
      )}
    </div>
  )
}
