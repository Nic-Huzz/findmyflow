import React, { useMemo, useId } from 'react'
import {
  TRUNK_X, TRUNK_Y, CAREER_X,
  STATES, STATE_META,
  stateY, stateColor, currentY, currentColor,
  computeOffsets, computeCone, isInCone,
  branchPath, subBranchPaths, getThemeOpacities,
} from './lifePaths'
import './LifePathMap.css'

export default function LifePathMap({
  careers = [],
  safety = 0,
  walkProgress = 0,
  theme = 'dark',
  pulseActive = false,
  showZoneLabels = true,
  onCareerClick,
  highlightId,
  trunkY: trunkYProp,
}) {
  const trunkY = trunkYProp ?? TRUNK_Y
  const uid = useId().replace(/:/g, '')
  const T = useMemo(() => getThemeOpacities(theme), [theme])
  const cone = useMemo(() => computeCone(careers, safety), [careers, safety])
  const offsets = useMemo(() => computeOffsets(careers, cone.centerY), [careers, cone.centerY])
  const coneEndX = CAREER_X + 60

  // Sort: parked underneath, in-cone on top
  const sorted = useMemo(() => {
    return [...careers].sort((a, b) => {
      if (!a.predictedState || !b.predictedState) return 0
      const aY = stateY(a.predictedState) + (offsets[a.id] || 0)
      const bY = stateY(b.predictedState) + (offsets[b.id] || 0)
      return (isInCone(aY, cone) ? 1 : 0) - (isInCone(bY, cone) ? 1 : 0)
    })
  }, [careers, offsets, cone])

  // Auto-compute punchline visibility
  const showPunchline = useMemo(() => {
    const hasOutsideVibe = careers.some(c => {
      if (!c.predictedState) return false
      const y = stateY(c.predictedState) + (offsets[c.id] || 0)
      return !isInCone(y, cone) && c.predictedState === 'vibe'
    })
    const hasRealisticLow = careers.some(
      c => c.realistic && (c.predictedState === 'shutdown' || c.predictedState === 'anxious')
    )
    return hasOutsideVibe && hasRealisticLow
  }, [careers, offsets, cone])

  const coneMidX = TRUNK_X + (coneEndX - TRUNK_X) * 0.4
  const coneMidY = (trunkY + cone.centerY) / 2

  return (
    <div className="lpm-wrap" data-punchline={showPunchline ? 'true' : 'false'} data-theme={theme}>
      <div className="lpm-rotate-prompt">
        <span className="lpm-rotate-icon">📱</span>
        <span className="lpm-rotate-text">Turn your phone sideways for the full picture</span>
      </div>
      <svg viewBox="-10 0 860 600" preserveAspectRatio="xMidYMid meet" overflow="visible">
        <defs>
          {/* Hand-drawn wobble */}
          <filter id={`${uid}wobble`} x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="turbulence" baseFrequency="0.015" numOctaves="3" seed="3" result="turb" />
            <feDisplacementMap in="SourceGraphic" in2="turb" scale="2.5" />
          </filter>

          {/* Glow for lit dots */}
          <filter id={`${uid}glow`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Soft cone edge */}
          <filter id={`${uid}coneBlur`} x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="10" />
          </filter>

          {/* Drift arrow */}
          <marker id={`${uid}arrow`} viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#a78bfa" opacity="0.7" />
          </marker>

          {/* Trunk glow */}
          <radialGradient id={`${uid}trunkGlow`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#E9A23B" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#E9A23B" stopOpacity="0" />
          </radialGradient>

          {/* Cone gradient */}
          <linearGradient id={`${uid}coneGrad`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#E9A23B" stopOpacity={T.conePeak} />
            <stop offset="50%" stopColor="#E9A23B" stopOpacity={T.coneMid} />
            <stop offset="85%" stopColor="#E9A23B" stopOpacity={T.coneTail} />
            <stop offset="100%" stopColor="#E9A23B" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* ── 1. State bands ── */}
        {STATES.map(s => {
          const m = STATE_META[s]
          return (
            <g key={s}>
              <rect x={TRUNK_X} y={m.y - 45} width={CAREER_X - TRUNK_X + 120} height={90} rx="4"
                    fill={m.color} opacity={T.bandFill} />
              <line x1={TRUNK_X} y1={m.y} x2={CAREER_X + 120} y2={m.y}
                    stroke={m.color} strokeWidth={T.guideWidth} opacity={T.guideLine}
                    strokeDasharray="4,8" />
              <text x={TRUNK_X - 8} y={m.y - 10} textAnchor="end" fill={m.color}
                    fontSize="11" fontWeight="700" opacity={T.stateLabel} letterSpacing="1">
                {m.label.toUpperCase()}
              </text>
              <text x={TRUNK_X - 8} y={m.y + 5} textAnchor="end" fill={m.color}
                    fontSize="9" opacity={T.feltLabel}>
                {m.felt}
              </text>
            </g>
          )
        })}

        {/* ── 2. Cone of light (only when realistic careers are tagged) ── */}
        {!cone.empty && (
          <>
            <path
              d={`M ${TRUNK_X} ${trunkY} L ${coneEndX} ${cone.topY} L ${coneEndX} ${cone.botY} Z`}

              fill={`url(#${uid}coneGrad)`}
              filter={`url(#${uid}coneBlur)`}
            />
            <line x1={TRUNK_X} y1={trunkY} x2={coneEndX} y2={cone.topY}
                  stroke="#E9A23B" strokeWidth={T.coneEdgeW} opacity={T.coneEdge} />
            <line x1={TRUNK_X} y1={trunkY} x2={coneEndX} y2={cone.botY}
                  stroke="#E9A23B" strokeWidth={T.coneEdgeW} opacity={T.coneEdge} />

            {/* Zone labels */}
            {showZoneLabels && (
              <>
                <text x={coneMidX} y={coneMidY} textAnchor="middle" fill={T.zoneSafe}
                      fontSize="11" fontWeight="600" fontStyle="italic">
                  what feels safe
                </text>
                {cone.topY > 60 && (
                  <text x={TRUNK_X + (coneEndX - TRUNK_X) * 0.5} y={Math.max(cone.topY - 30, 50)}
                        textAnchor="middle" fill={T.zoneDark}
                        fontSize="11" fontWeight="600" fontStyle="italic">
                    what doesn't feel safe yet
                  </text>
                )}
              </>
            )}
          </>
        )}

        {/* ── 3. Career branches ── */}
        {sorted.map((career) => {
          const hasState = !!career.predictedState
          const offset = offsets[career.id] || 0
          const baseY = hasState ? stateY(career.predictedState) + offset : trunkY
          const cy = hasState ? currentY(career, walkProgress) + offset : trunkY
          const isCurrent = !!career.isCurrent
          const color = isCurrent ? '#E9A23B' : hasState ? currentColor(career, walkProgress) : '#6b7280'
          const inCone = hasState ? isInCone(baseY, cone) : false
          const opacity = isCurrent ? 0.2 : inCone ? T.litBranch : T.parkedBranch
          const strokeW = isCurrent ? 1.5 : inCone ? 2.8 : T.parkedStroke
          const hasDrift = hasState && career.livedState && career.livedState !== career.predictedState && walkProgress > 0
          const isHighlighted = highlightId === career.id
          const idx = careers.indexOf(career)

          // Fly-in: SVG <g> starts at trunk, animateTransform moves to final position
          // Use SVG animateTransform for correct viewBox-space animation
          const flyFromX = TRUNK_X - CAREER_X
          const flyFromY = trunkY - cy

          return (
            <g key={career.id}
               onClick={onCareerClick ? () => onCareerClick(career.id) : undefined}
               cursor={onCareerClick ? 'pointer' : undefined}>

              {/* SVG fly-in animation */}
              {career.animateIn && (
                <animateTransform
                  attributeName="transform" type="translate"
                  from={`${flyFromX} ${flyFromY}`} to="0 0"
                  dur="0.6s" fill="freeze"
                  calcMode="spline" keySplines="0.2 0.8 0.3 1"
                  keyTimes="0;1"
                />
              )}

              {/* Ghost line (drift) */}
              {hasDrift && (
                <>
                  <path d={branchPath(CAREER_X, stateY(career.predictedState) + offset, trunkY)} fill="none"
                        stroke={stateColor(career.predictedState)}
                        strokeWidth="1.5" strokeDasharray="5,4"
                        opacity={inCone ? T.ghostLit : T.ghostParked}
                        filter={`url(#${uid}wobble)`} />
                  <circle cx={CAREER_X} cy={stateY(career.predictedState) + offset} r="3"
                          fill={stateColor(career.predictedState)}
                          opacity={inCone ? T.ghostLit : T.ghostParked} />
                  {walkProgress > 0.15 && (
                    <line x1={CAREER_X + 14} y1={stateY(career.predictedState) + offset}
                          x2={CAREER_X + 14} y2={cy}
                          stroke="#a78bfa" strokeWidth="1.5"
                          opacity={Math.min(walkProgress * 0.6, 0.5).toFixed(2)}
                          markerEnd={`url(#${uid}arrow)`} />
                  )}
                </>
              )}

              {/* Main branch */}
              <path d={branchPath(CAREER_X, cy, trunkY)} fill="none" stroke={color}
                    strokeWidth={strokeW} opacity={opacity.toFixed(2)}
                    strokeLinecap="round"
                    filter={isCurrent ? undefined : `url(#${uid}wobble)`} />

              {/* Sub-branches */}
              {subBranchPaths(CAREER_X, cy, idx, trunkY).map((d, i) => (
                <path key={i} d={d} fill="none" stroke={color}
                      strokeWidth="1.2" opacity={(opacity * 0.4).toFixed(2)}
                      strokeLinecap="round" />
              ))}

              {/* Endpoint dot */}
              {inCone ? (
                <>
                  <circle cx={CAREER_X} cy={cy} r="14" fill={color} opacity="0.1" />
                  <circle cx={CAREER_X} cy={cy} r="7" fill={color} opacity="0.9"
                          filter={`url(#${uid}glow)`} />
                </>
              ) : (
                <circle cx={CAREER_X} cy={cy} r={T.parkedDotR} fill={color} opacity={T.parkedDot} />
              )}

              {/* Highlight ring (tagging focus) */}
              {isHighlighted && (
                <circle cx={CAREER_X} cy={cy} r="18" fill="none"
                        stroke="#a78bfa" strokeWidth="2"
                        className="lpm-highlight-ring" />
              )}

              {/* Label */}
              <text x={CAREER_X + 16} y={cy + 4} fill={color}
                    fontSize={inCone ? 12 : 11}
                    fontWeight={inCone ? '600' : T.parkedWeight}
                    opacity={inCone ? 0.9 : T.parkedLabel}>
                {career.emoji ? `${career.emoji} ` : ''}{career.label}
              </text>

              {/* Drift label */}
              {hasDrift && walkProgress > 0.5 && inCone && (
                <text x={CAREER_X + 16} y={cy + 18} fill="#a78bfa" fontSize="9" opacity="0.6">
                  {STATE_META[career.predictedState].label} → {STATE_META[career.livedState].label}
                  {' '}{stateY(career.livedState) < stateY(career.predictedState) ? '↑' : '↓'}
                </text>
              )}
            </g>
          )
        })}

        {/* ── 4. Trunk marker ── */}
        <circle cx={TRUNK_X} cy={trunkY} r="36" fill={`url(#${uid}trunkGlow)`} />
        <circle cx={TRUNK_X} cy={trunkY} r="10" fill="#E9A23B" filter={`url(#${uid}glow)`} />
        <circle cx={TRUNK_X} cy={trunkY} r="5" fill="#fff" opacity="0.8" />
        {/* Current career label or "you" */}
        {(() => {
          const cur = careers.find(c => c.isCurrent)
          if (cur) return (
            <>
              <text x={TRUNK_X + 18} y={trunkY - 6} fill="#E9A23B"
                    fontSize="12" fontWeight="600" opacity="0.9">
                {cur.label}
              </text>
              <text x={TRUNK_X + 18} y={trunkY + 10} fill="#E9A23B"
                    fontSize="9" fontWeight="400" opacity="0.5">
                TODAY
              </text>
            </>
          )
          return (
            <>
              <text x={TRUNK_X} y={trunkY - 18} textAnchor="middle" fill={T.youColor}
                    fontSize="10" fontWeight="500" opacity={T.youLabel}>
                you
              </text>
              <text x={TRUNK_X} y={trunkY + 24} textAnchor="middle" fill="#E9A23B"
                    fontSize="10" fontWeight="700" letterSpacing="2" opacity="0.6">
                TODAY
              </text>
            </>
          )
        })()}

        {/* Trunk pulse (wahoo) */}
        {pulseActive && (
          <>
            <circle cx={TRUNK_X} cy={trunkY} r="6" fill="#E9A23B"
                    className="lpm-pulse-flash" />
            <circle cx={TRUNK_X} cy={trunkY} r="6" fill="none"
                    stroke="#E9A23B" className="lpm-pulse-ring" />
          </>
        )}

        {/* ── 5. Future label ── */}
        <text x={CAREER_X + 100} y={580} textAnchor="end" fill={T.future}
              fontSize="10" letterSpacing="2" fontWeight="600">
          THE FUTURE →
        </text>
      </svg>
    </div>
  )
}
