// ── Life Path States: Constants & Geometry Helpers ──

export const TRUNK_X = 60
export const TRUNK_Y = 300 // default, can be overridden by trunkY prop
export const CAREER_X = 680 // All career endpoints at this X (v1: equal distance)

export const STATES = ['vibe', 'peace', 'anxious', 'shutdown']

export const STUCK_REASONS = [
  { id: 'too_busy', label: 'Too busy', emoji: '⏰' },
  { id: 'need_money', label: 'Need more money', emoji: '💰' },
  { id: 'need_learn', label: 'Need to learn more', emoji: '📚' },
  { id: 'scared', label: 'Scared of failing', emoji: '😰' },
  { id: 'waiting', label: 'Waiting for the right time', emoji: '⏳' },
  { id: 'dont_know', label: "Don't know where to start", emoji: '🤷' },
]

export const STATE_META = {
  vibe:     { y: 80,  color: '#E9A23B', label: 'Vibe Rise',     emoji: '🔥', felt: 'alive, lit up' },
  peace:    { y: 210, color: '#10b981', label: 'Fun',            emoji: '😌', felt: 'fun, settled' },
  anxious:  { y: 380, color: '#ef4444', label: 'Stressful',       emoji: '😰', felt: 'stressed, tight' },
  shutdown: { y: 520, color: '#6b7280', label: 'Bored',           emoji: '😶', felt: 'bored, flat' },
}

export function stateY(s) { return STATE_META[s]?.y ?? TRUNK_Y }
export function stateColor(s) { return STATE_META[s]?.color ?? '#6b7280' }

export function lerp(a, b, t) {
  return a + (b - a) * Math.max(0, Math.min(1, t))
}

export function currentY(career, walkProgress) {
  const py = stateY(career.predictedState)
  if (!career.livedState || career.livedState === career.predictedState) return py
  return lerp(py, stateY(career.livedState), walkProgress)
}

export function currentColor(career, walkProgress) {
  if (!career.livedState || walkProgress < 0.5) return stateColor(career.predictedState)
  return stateColor(career.livedState)
}

// Stagger careers sharing a state band so labels don't overlap.
// Cone-aware: realistic careers offset toward cone center, parked away from it.
// This lets the cone edge capture "I'd say it" careers while missing "I'd hesitate" ones in the same band.
export function computeOffsets(careers, coneCenterY) {
  const groups = {}
  careers.forEach(c => {
    if (!c.predictedState) return
    const s = c.predictedState
    if (!groups[s]) groups[s] = []
    groups[s].push(c)
  })
  const offsets = {}
  const center = coneCenterY ?? TRUNK_Y

  Object.entries(groups).forEach(([s, groupCareers]) => {
    if (groupCareers.length <= 1) {
      groupCareers.forEach(c => { offsets[c.id] = 0 })
      return
    }

    const bandY = STATE_META[s].y
    const isAboveCenter = bandY < center

    // Sort: realistic first (they get positions toward cone center)
    const sorted = [...groupCareers].sort((a, b) => {
      const aR = a.realistic === true ? 0 : 1
      const bR = b.realistic === true ? 0 : 1
      return aR - bR
    })

    const spacing = 24
    const total = (sorted.length - 1) * spacing
    sorted.forEach((c, i) => {
      const rawOffset = i * spacing - total / 2
      // If band is above cone center: flip offset so realistic (index 0) gets positive offset (closer to center)
      // If band is below cone center: keep offset so realistic (index 0) gets negative offset (closer to center)
      offsets[c.id] = isAboveCenter ? -rawOffset : rawOffset
    })
  })
  return offsets
}

// Cone of safety: triangle from trunk, covering the realistic careers' state range
export function computeCone(careers, safety) {
  const realistic = careers.filter(c => c.realistic && c.predictedState)
  if (realistic.length === 0) return { centerY: TRUNK_Y, topY: TRUNK_Y, botY: TRUNK_Y, empty: true }

  const ys = realistic.map(c => stateY(c.predictedState))
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const centerY = (minY + maxY) / 2
  const minSpread = (maxY - minY) / 2 + 40

  const allYs = STATES.map(s => STATE_META[s].y)
  const globalMin = Math.min(...allYs) - 30
  const globalMax = Math.max(...allYs) + 30
  const maxSpread = Math.max(Math.abs(globalMax - centerY), Math.abs(globalMin - centerY))

  const spread = lerp(minSpread, maxSpread, safety)

  return {
    centerY,
    topY: centerY - spread,
    botY: centerY + spread,
  }
}

export function isInCone(careerY, cone) {
  return careerY >= cone.topY && careerY <= cone.botY
}

// Cubic bezier branch from trunk to endpoint
export function branchPath(endX, endY, trunkY = TRUNK_Y) {
  const dx = endX - TRUNK_X
  return `M ${TRUNK_X} ${trunkY} C ${TRUNK_X + dx * 0.35} ${trunkY}, ${TRUNK_X + dx * 0.65} ${endY}, ${endX} ${endY}`
}

// Decorative sub-branches (deterministic from index)
export function subBranchPaths(endX, endY, index, trunkY = TRUNK_Y) {
  const paths = []
  const count = 2 + (index % 2)
  for (let i = 0; i < count; i++) {
    const frac = 0.55 + i * 0.18
    const sx = TRUNK_X + (endX - TRUNK_X) * frac
    const sy = trunkY + (endY - trunkY) * frac
    const seed = (index * 7 + i * 13) % 17
    const angle = ((seed / 17) - 0.5) * 1.2
    const len = 18 + (seed % 12)
    const bx = sx + len * Math.cos(angle)
    const by = sy + len * Math.sin(angle) + (endY < TRUNK_Y ? -8 : 8)
    paths.push(`M ${sx.toFixed(1)} ${sy.toFixed(1)} Q ${((sx + bx) / 2).toFixed(1)} ${(by - 4).toFixed(1)}, ${bx.toFixed(1)} ${by.toFixed(1)}`)
  }
  return paths
}

// Theme-aware opacity values
export function getThemeOpacities(theme) {
  const isLight = theme === 'light'
  return {
    bandFill:     isLight ? 0.15  : 0.025,
    guideLine:    isLight ? 0.35  : 0.1,
    guideWidth:   isLight ? 1.5   : 0.5,
    stateLabel:   isLight ? 0.9   : 0.5,
    feltLabel:    isLight ? 0.65  : 0.3,
    parkedBranch: isLight ? 0.3   : 0.28,
    parkedDot:    isLight ? 0.35  : 0.35,
    parkedDotR:   isLight ? 5     : 5,
    parkedLabel:  isLight ? 0.45  : 0.4,
    parkedWeight: isLight ? '500' : '400',
    parkedStroke: isLight ? 1.5   : 1.8,
    litBranch:    isLight ? 0.9   : 0.85,
    coneEdge:     isLight ? 0.45  : 0.12,
    coneEdgeW:    isLight ? 1.5   : 0.5,
    conePeak:     isLight ? 0.22  : 0.18,
    coneMid:      isLight ? 0.14  : 0.12,
    coneTail:     isLight ? 0.06  : 0.05,
    zoneSafe:     isLight ? 'rgba(160,100,10,0.55)' : 'rgba(233,162,59,0.35)',
    zoneDark:     isLight ? 'rgba(80,60,140,0.5)'   : 'rgba(167,139,250,0.25)',
    future:       isLight ? '#aaa' : '#333',
    youLabel:     isLight ? 0.5   : 0.35,
    youColor:     isLight ? '#333' : '#fff',
    ghostLit:     isLight ? 0.35  : 0.2,
    ghostParked:  isLight ? 0.15  : 0.06,
  }
}
