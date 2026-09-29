/**
 * DomeGrowthOverlay — Celebrates dome growth after courage challenge completion.
 * Uses requestAnimationFrame to animate SVG polygon points (CSS can't transition SVG points).
 */
import { useEffect, useRef, useState, useCallback } from 'react'
import { DOME_DIMENSIONS } from '../data/domeDimensions'
import './DomeGrowthOverlay.css'

const INTEGRATED = new Set(['vibe_rise', 'ventral'])
const ANIM_MS = 800

function easeOut(t) { return 1 - Math.pow(1 - t, 3) }

export default function DomeGrowthOverlay({ dimensionValues, wahooClassification, afterState, rpAwarded, onDismiss }) {
  const polyRef = useRef(null)
  const [exiting, setExiting] = useState(false)
  const dismissed = useRef(false)

  const isIntegrated = INTEGRATED.has(afterState)
  const cx = 120, cy = 120, maxR = 90
  const angleStep = (2 * Math.PI) / DOME_DIMENSIONS.length

  const getPoint = useCallback((dimIndex, level) => {
    const angle = (dimIndex * angleStep) - Math.PI / 2
    const r = (level / 5) * maxR
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)]
  }, [angleStep])

  const buildPoints = useCallback((progress) => {
    return DOME_DIMENSIONS.map((d, i) => {
      const target = dimensionValues?.[d.id] ?? 0
      const current = target * progress
      return getPoint(i, current)
    }).map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  }, [dimensionValues, getPoint])

  // Animate polygon points from 0 to target over ANIM_MS
  useEffect(() => {
    if (!polyRef.current || !dimensionValues) return
    const start = performance.now()

    function tick(now) {
      const elapsed = now - start
      const t = Math.min(elapsed / ANIM_MS, 1)
      const progress = easeOut(t)
      if (polyRef.current) {
        polyRef.current.setAttribute('points', buildPoints(progress))
      }
      if (t < 1) requestAnimationFrame(tick)
    }

    // Start from zero
    polyRef.current.setAttribute('points', buildPoints(0))
    requestAnimationFrame(tick)
  }, [buildPoints, dimensionValues])

  // Auto-dismiss after 2.5s
  useEffect(() => {
    const timer = setTimeout(() => dismiss(), 2500)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function dismiss() {
    if (dismissed.current) return
    dismissed.current = true
    setExiting(true)
    setTimeout(() => onDismiss?.(), 300)
  }

  if (!dimensionValues) {
    return (
      <div className={`dgo-overlay ${exiting ? 'dgo-exit' : ''}`} onClick={dismiss}>
        <div className="dgo-rp-only">
          <span className="dgo-rp-badge">+{rpAwarded} RP</span>
        </div>
      </div>
    )
  }

  const dims = DOME_DIMENSIONS.filter(d => dimensionValues[d.id] != null)

  return (
    <div className={`dgo-overlay ${exiting ? 'dgo-exit' : ''}`} onClick={dismiss}>
      <div className="dgo-content" onClick={e => e.stopPropagation()}>
        <div className="dgo-title">
          {isIntegrated ? 'Your comfort zone grew' : 'You pushed your edge'}
        </div>
        <svg className="dgo-radar" viewBox="0 0 240 240" width="200" height="200">
          {[1, 2, 3, 4, 5].map(ring => (
            <circle key={ring} cx={cx} cy={cy} r={(ring / 5) * maxR}
              fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
          ))}
          {DOME_DIMENSIONS.map((d, i) => {
            const [x2, y2] = getPoint(i, 5)
            return <line key={d.id} x1={cx} y1={cy} x2={x2} y2={y2} stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
          })}
          <polygon
            ref={polyRef}
            points={buildPoints(0)}
            fill={isIntegrated ? 'rgba(94,23,235,0.15)' : 'rgba(233,162,59,0.15)'}
            stroke={isIntegrated ? '#5e17eb' : '#E9A23B'}
            strokeWidth="2"
            strokeDasharray={isIntegrated ? 'none' : '6 4'}
          />
          {DOME_DIMENSIONS.map((d, i) => {
            const [lx, ly] = getPoint(i, 6.2)
            const grew = dimensionValues[d.id] != null
            return (
              <text
                key={d.id}
                x={lx}
                y={ly}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="10"
                fill={grew ? (isIntegrated ? '#5e17eb' : '#E9A23B') : '#9ca3af'}
                fontWeight={grew ? '600' : '400'}
              >
                {d.icon}
              </text>
            )
          })}
        </svg>
        <div className="dgo-chips">
          {dims.map(d => (
            <span
              key={d.id}
              className="dgo-chip"
              style={{ color: isIntegrated ? '#5e17eb' : '#E9A23B' }}
            >
              {d.icon} {d.shortLabel || d.label} {String.fromCharCode(8594)} {dimensionValues[d.id]}
            </span>
          ))}
        </div>
        <span className="dgo-rp-badge">+{rpAwarded} RP</span>
      </div>
    </div>
  )
}
