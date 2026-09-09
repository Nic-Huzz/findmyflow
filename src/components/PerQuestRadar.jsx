/**
 * PerQuestRadar — Swipeable per-quest radar cards for Progress tab.
 *
 * Each card shows 3 layers for one quest:
 *   1. Starting point (purple dashed) — current_dimensions from path definition
 *   2. Actual progress (purple filled) — max dimension levels from completed challenges
 *   3. Aspiration (gold dashed) — dream_dimensions
 *
 * Gap highlighting: top 2 dimensions with biggest aspiration-actual gap get pulse rings.
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { DOME_DIMENSIONS, getNumericTier } from '../data/domeDimensions'
import { supabase } from '../lib/supabaseClient'
import './PerQuestRadar.css'
import './DomeOfSafety.css'

const LABEL_OFFSET = 24
const RING_COUNT = 5

function polarToXY(cx, cy, angle, radius) {
  const rad = (angle - 90) * (Math.PI / 180)
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) }
}

function buildPolygon(cx, cy, maxRadius, values, maxLevels, angleStep) {
  return DOME_DIMENSIONS.map((dim, i) => {
    const raw = Number(values[dim.id]) || 0
    // Numeric dimensions (people, money) may store raw values — convert to tier
    const level = dim.type === 'numeric' && raw > dim.maxLevel ? getNumericTier(dim.id, raw) : raw
    const max = Number(maxLevels[dim.id] || dim.maxLevel) || 1
    const ratio = max > 0 ? Math.min(level / max, 1) : 0
    return polarToXY(cx, cy, i * angleStep, Math.max(ratio * maxRadius, 0))
  }).map(p => `${p.x},${p.y}`).join(' ')
}

const FUEL_CHANNELS = [
  { id: 'choice', emoji: '🔓', name: 'Choice' },
  { id: 'connection', emoji: '🤝', name: 'Connection' },
  { id: 'mastery', emoji: '📈', name: 'Mastery' },
  { id: 'meaning', emoji: '✨', name: 'Meaning' },
]

function QuestRadarCard({ quest, actualProgress, fuel }) {
  const navigate = useNavigate()
  const size = 310
  const cx = size / 2
  const cy = size / 2
  const maxRadius = (size / 2) - LABEL_OFFSET - 45
  const angleStep = 360 / DOME_DIMENSIONS.length

  const maxLevels = {}
  DOME_DIMENSIONS.forEach(dim => { maxLevels[dim.id] = dim.maxLevel })

  const start = quest.current_dimensions || {}
  const dream = quest.dream_dimensions || {}
  const rawActual = actualProgress || {}

  // "Now" = max of start and challenge progress per dimension
  // (you can't go below where you started)
  const actual = {}
  DOME_DIMENSIONS.forEach(dim => {
    const s = start[dim.id] || 0
    const a = rawActual[dim.id] || 0
    if (s > 0 || a > 0) actual[dim.id] = Math.max(s, a)
  })

  const hasDefinition = Object.keys(start).length > 0 || Object.keys(dream).length > 0
  const hasActual = Object.keys(actual).length > 0

  // Calculate gaps — aspiration minus actual
  const gaps = DOME_DIMENSIONS
    .map(dim => ({
      dim,
      gap: (dream[dim.id] || 0) - (actual[dim.id] || start[dim.id] || 0),
    }))
    .filter(g => g.gap > 0)
    .sort((a, b) => b.gap - a.gap)
    .slice(0, 2)

  const topGap = gaps[0]
  const gapDimIds = new Set(gaps.map(g => g.dim.id))

  // Build polygons
  const startPolygon = Object.keys(start).length > 0
    ? buildPolygon(cx, cy, maxRadius, start, maxLevels, angleStep) : null
  const actualPolygon = hasActual
    ? buildPolygon(cx, cy, maxRadius, actual, maxLevels, angleStep) : null
  const dreamPolygon = Object.keys(dream).length > 0
    ? buildPolygon(cx, cy, maxRadius, dream, maxLevels, angleStep) : null

  // Rings + spokes
  const rings = Array.from({ length: RING_COUNT }, (_, i) => {
    const r = maxRadius * ((i + 1) / RING_COUNT)
    return DOME_DIMENSIONS.map((_, j) => polarToXY(cx, cy, j * angleStep, r))
      .map(p => `${p.x},${p.y}`).join(' ')
  })
  const spokes = DOME_DIMENSIONS.map((_, i) => {
    const end = polarToXY(cx, cy, i * angleStep, maxRadius)
    return { x1: cx, y1: cy, x2: end.x, y2: end.y }
  })

  // Labels
  const labels = DOME_DIMENSIONS.map((dim, i) => {
    const pos = polarToXY(cx, cy, i * angleStep, maxRadius + LABEL_OFFSET)
    return { ...pos, icon: dim.icon, label: dim.label, isGap: gapDimIds.has(dim.id) }
  })

  // Gap pulse ring positions
  const gapRings = gaps.map(g => {
    const i = DOME_DIMENSIONS.findIndex(d => d.id === g.dim.id)
    const dreamLevel = dream[g.dim.id] || 0
    const ratio = Math.min(dreamLevel / maxLevels[g.dim.id], 1)
    return polarToXY(cx, cy, i * angleStep, ratio * maxRadius)
  })

  const courageCount = quest._courageCount || 0

  if (!hasDefinition) {
    return (
      <div className="pqr-card-inner">
        <div className="pqr-header">
          <div className="pqr-dot" style={{ background: quest.color || '#5e17eb' }} />
          <div className="pqr-name">{quest.label}</div>
        </div>
        <div className="pqr-empty">
          Define this path to see your radar.
          <br />
          <button className="pqr-define-btn" onClick={() => navigate(`/path-definition/${quest.id}`)}>
            Define this path →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="pqr-card-inner">
      <div className="pqr-header">
        <div className="pqr-dot" style={{ background: quest.color || '#5e17eb' }} />
        <div className="pqr-name">{quest.label}</div>
        {courageCount > 0 && <div className="pqr-badge">{courageCount} courage</div>}
      </div>

      <div className="pqr-radar">
        <svg viewBox={`0 0 ${size} ${size}`} style={{ width: size, height: size }}>
          {/* Rings */}
          {rings.map((pts, i) => (
            <polygon key={i} points={pts} className={`dos-ring ${i === RING_COUNT - 1 ? 'dos-ring-outer' : ''}`} />
          ))}

          {/* Spokes */}
          {spokes.map((s, i) => (
            <line key={i} {...s} className="dos-spoke" />
          ))}

          {/* Layer 1: Start (purple dashed, faint) — only when actual progress exists to compare */}
          {startPolygon && hasActual && (
            <polygon points={startPolygon} className="pqr-start-fill" />
          )}

          {/* Layer 3: Dream (gold dashed) */}
          {dreamPolygon && (
            <polygon points={dreamPolygon}
              fill="rgba(233,162,59,0.04)"
              stroke="#E9A23B"
              strokeWidth={1.5}
              strokeDasharray="6 4"
            />
          )}

          {/* Layer 2: Actual progress (purple filled) */}
          {actualPolygon && (
            <polygon points={actualPolygon} className="dos-dome-fill" />
          )}

          {/* If no actual progress yet, use start polygon as the filled layer */}
          {!hasActual && startPolygon && (
            <polygon points={startPolygon} className="dos-dome-fill" />
          )}

          {/* Gap pulse rings */}
          {gapRings.map((pos, i) => (
            <circle key={i} cx={pos.x} cy={pos.y} r={5} className="pqr-gap-ring" />
          ))}

          {/* Labels */}
          {labels.map((l, i) => (
            <g key={i}>
              <text x={l.x} y={l.y - 5} className="dos-label-icon" textAnchor="middle" dominantBaseline="auto">
                {l.icon}
              </text>
              <text x={l.x} y={l.y + 9}
                className="dos-label-name"
                textAnchor="middle"
                dominantBaseline="auto"
                fill={l.isGap ? '#E9A23B' : '#6c757d'}
              >
                {l.label}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div className="pqr-legend">
        <span className="pqr-legend-item"><span className="pqr-legend-line pqr-legend-start" /> Start</span>
        <span className="pqr-legend-item"><span className="pqr-legend-line pqr-legend-actual" /> Now</span>
        <span className="pqr-legend-item"><span className="pqr-legend-line pqr-legend-dream" /> Dream</span>
      </div>

      {topGap && (
        <div className="pqr-gap">
          <span className="pqr-gap-icon">{topGap.dim.icon}</span>
          Biggest growth area: {topGap.dim.label}
        </div>
      )}

      {/* Life fuel bars */}
      {fuel && fuel.weeks > 0 && (
        <div className="pqr-fuel">
          <div className="pqr-fuel-title">Life Fuel</div>
          {FUEL_CHANNELS.map(ch => (
            <div key={ch.id} className="pqr-fuel-row">
              <span className="pqr-fuel-label">{ch.emoji} {ch.name}</span>
              <div className="pqr-fuel-track">
                <div className="pqr-fuel-fill" style={{ width: `${fuel[ch.id]}%` }} />
              </div>
              <span className="pqr-fuel-pct">{fuel[ch.id]}%</span>
            </div>
          ))}
          <div className="pqr-fuel-weeks">{fuel.weeks} week{fuel.weeks !== 1 ? 's' : ''}</div>
          {(() => {
            const strong = FUEL_CHANNELS.filter(ch => fuel[ch.id] >= 75)
            const weak = FUEL_CHANNELS.filter(ch => fuel[ch.id] < 50)
            if (strong.length === 4) return <div className="pqr-fuel-insight">All four fuels are active on this path.</div>
            if (weak.length > 0) return <div className="pqr-fuel-insight">This path is missing {weak.map(ch => `${ch.emoji} ${ch.name}`).join(' and ')}.</div>
            return null
          })()}
        </div>
      )}
    </div>
  )
}

export default function PerQuestRadar({ userId }) {
  const [quests, setQuests] = useState([])
  const [progress, setProgress] = useState({}) // { questId: { dimId: maxLevel } }
  const [fuelData, setFuelData] = useState({}) // { questId: { choice: %, connection: %, mastery: %, meaning: %, weeks: n } }
  const [loading, setLoading] = useState(true)
  const [activeIdx, setActiveIdx] = useState(0)
  const stripRef = useRef(null)

  // Load active quests with dimensions
  useEffect(() => {
    if (!userId) return
    setLoading(true)

    supabase
      .from('quests')
      .select('id, label, color, status, current_dimensions, dream_dimensions, predicted_state')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .then(async ({ data: questData }) => {
        if (!questData?.length) { setLoading(false); return }

        // Get courage challenge counts per quest
        const questIds = questData.map(q => q.id)
        const { data: taskData } = await supabase
          .from('quest_tasks')
          .select('quest_id, groan_challenge_id')
          .in('quest_id', questIds)
          .eq('is_courage_challenge', true)

        const counts = {}
        taskData?.forEach(t => { counts[t.quest_id] = (counts[t.quest_id] || 0) + 1 })

        // Get completed challenge dimension values per quest
        const groanIds = (taskData || []).filter(t => t.groan_challenge_id).map(t => t.groan_challenge_id)
        const questByGroan = {}
        taskData?.forEach(t => { if (t.groan_challenge_id) questByGroan[t.groan_challenge_id] = t.quest_id })

        const progressMap = {}
        if (groanIds.length > 0) {
          const { data: groanData } = await supabase
            .from('groan_challenges')
            .select('id, dimension_values')
            .in('id', groanIds)
            .eq('status', 'completed')

          groanData?.forEach(g => {
            if (!g.dimension_values) return
            const qId = questByGroan[g.id]
            if (!qId) return
            if (!progressMap[qId]) progressMap[qId] = {}
            for (const [dimId, rawVal] of Object.entries(g.dimension_values)) {
              const dim = DOME_DIMENSIONS.find(d => d.id === dimId)
              const val = dim?.type === 'numeric' && rawVal > dim.maxLevel ? getNumericTier(dimId, rawVal) : rawVal
              progressMap[qId][dimId] = Math.max(progressMap[qId][dimId] || 0, val)
            }
          })
        }

        // Load fuel review data
        const { data: fuelRows } = await supabase
          .from('path_fuel_reviews')
          .select('quest_id, choice, connection, mastery, meaning')
          .eq('user_id', userId)
          .in('quest_id', questIds)

        const fuelMap = {}
        if (fuelRows?.length) {
          const byQuest = {}
          fuelRows.forEach(r => {
            if (!byQuest[r.quest_id]) byQuest[r.quest_id] = []
            byQuest[r.quest_id].push(r)
          })
          for (const [qId, rows] of Object.entries(byQuest)) {
            const weeks = rows.length
            fuelMap[qId] = {
              choice: Math.round(rows.filter(r => r.choice === true).length / weeks * 100),
              connection: Math.round(rows.filter(r => r.connection === true).length / weeks * 100),
              mastery: Math.round(rows.filter(r => r.mastery === true).length / weeks * 100),
              meaning: Math.round(rows.filter(r => r.meaning === true).length / weeks * 100),
              weeks,
            }
          }
        }

        setQuests(questData.map(q => ({ ...q, _courageCount: counts[q.id] || 0 })))
        setProgress(progressMap)
        setFuelData(fuelMap)
        setLoading(false)
      })
  }, [userId])

  // Intersection observer for active dot
  useEffect(() => {
    const strip = stripRef.current
    if (!strip || quests.length <= 1) return

    const cards = strip.querySelectorAll('.pqr-card')
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const idx = Array.from(cards).indexOf(entry.target)
            if (idx >= 0) setActiveIdx(idx)
          }
        })
      },
      { root: strip, threshold: 0.6 }
    )

    cards.forEach(card => observer.observe(card))
    return () => observer.disconnect()
  }, [quests])

  const scrollTo = useCallback((idx) => {
    const strip = stripRef.current
    if (!strip) return
    strip.scrollTo({ left: idx * strip.clientWidth, behavior: 'smooth' })
  }, [])

  if (loading) return null
  if (quests.length === 0) return null

  return (
    <div className="pqr-wrapper">
      <div className="pqr-strip" ref={stripRef}>
        {quests.map(quest => (
          <div key={quest.id} className="pqr-card">
            <QuestRadarCard quest={quest} actualProgress={progress[quest.id]} fuel={fuelData[quest.id]} />
          </div>
        ))}
      </div>

      {quests.length > 1 && (
        <div className="pqr-dots">
          {quests.map((_, i) => (
            <button
              key={i}
              className={`pqr-dot-nav ${i === activeIdx ? 'active' : ''}`}
              onClick={() => scrollTo(i)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
