/**
 * QuestPathMap — Life path progress visualization.
 *
 * Swipeable slides:
 *   Slide 0: All paths overview with global cone
 *   Slides 1-N: Individual quest focus with milestones + action cards
 *
 * Three line states:
 *   Coloured + solid = courage challenge done AND feels safe
 *   Grey + solid = courage challenge done but not safe yet
 *   Dashed + ghost = not done yet
 *
 * CSS prefix: qpm-
 */

import { useState, useEffect, useRef, useMemo, useId, useCallback } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { createGroanChallenge, acceptGroanChallenge } from '../../lib/crm/groanChallengeService'
import { getWeekStartLocal } from '../../lib/dateUtils'
import HealingFlowModal from '../HealingFlowModal'
import {
  TRUNK_X, CAREER_X, stateY, STATE_META, STATES,
  branchPath, computeCone, isInCone,
} from '../LifePathMap/lifePaths'
import './QuestPathMap.css'

// ── Horizontal layout constants (used by FocusSVG per-quest detail) ──
const VB_W = 400
const VB_H = 480
const TX = 40    // trunk X (horizontal)
const CX = 370   // career endpoint X (horizontal)
const SCALE_Y = VB_H / 600

function scaledY(state) {
  return stateY(state) * SCALE_Y
}

// ── Vertical overview constants (Y=time, X=state) ──
const OV_W = 420   // overview viewBox width
const OV_H = 800   // overview viewBox height (taller for more dot visibility)
const OV_BOTTOM = OV_H - 100 // Y for earliest (bottom, room for rotated labels)
const OV_TOP_PAD = 50        // room at top for NOW
const OV_TOP = OV_TOP_PAD     // Y for most recent (top)

// State zone X ranges (left=uninterested, right=vibe rise)
const STATE_ZONES = {
  shutdown: { center: 65,  left: 25,  right: 105 },
  anxious:  { center: 160, left: 115, right: 205 },
  peace:    { center: 255, left: 215, right: 305 },
  vibe:     { center: 355, left: 315, right: 405 },
}

function stateX(s) { return STATE_ZONES[s]?.center ?? 255 }

// State gradient colours (for the safe portion of the line)
const SAFE_COLOURS = {
  shutdown: '#ef4444',    // red
  anxious:  '#f59e0b',    // yellow
  peace:    '#10b981',    // green
  vibe:     '#c084fc',    // purple/pink
}

export default function QuestPathMap({
  quests,
  questTasks,
  trunkState,
  safety,
  careers,
  userId,
  onUpdate,
  onClose,
}) {
  const uid = useId().replace(/:/g, '')
  const slidesRef = useRef(null)
  const [activeSlide, setActiveSlide] = useState(0)
  const [healingIntentions, setHealingIntentions] = useState({})
  const [crossPollination, setCrossPollination] = useState([])
  const [heroAvatarUrl, setHeroAvatarUrl] = useState(null)
  const lightMode = true

  const activeQuests = useMemo(() =>
    quests.filter(q => q.status === 'active' && q.label !== 'Healing Work'),
    [quests]
  )

  // Load healing intentions for all quest tasks
  // Stable dep: join task IDs into a string so it only re-fetches when tasks change
  const allTaskIdKey = useMemo(() =>
    activeQuests.flatMap(q => (questTasks[q.id] || []).map(t => t.id)).join(','),
    [activeQuests, questTasks]
  )
  useEffect(() => {
    const ids = allTaskIdKey.split(',').filter(Boolean)
    if (!ids.length) return
    supabase
      .from('healing_intentions')
      .select('quest_task_id, pattern, healing_stage, outcome')
      .in('quest_task_id', ids)
      .then(({ data }) => {
        if (data) {
          const byTask = {}
          data.forEach(h => { byTask[h.quest_task_id] = h })
          setHealingIntentions(byTask)
        }
      })
  }, [allTaskIdKey])

  // Load cross-pollination signals
  useEffect(() => {
    if (!userId) return
    supabase.from('quest_cross_pollination')
      .select('source_quest_id, target_quest_id, created_at')
      .eq('user_id', userId)
      .then(({ data }) => { if (data) setCrossPollination(data) })
  }, [userId])

  // Load hero avatar
  useEffect(() => {
    if (!userId) return
    supabase.from('user_stage_progress')
      .select('hero_avatar_url')
      .eq('user_id', userId)
      .not('hero_avatar_url', 'is', null)
      .limit(1)
      .maybeSingle()
      .then(({ data }) => { if (data?.hero_avatar_url) setHeroAvatarUrl(data.hero_avatar_url) })
  }, [userId])

  // Scroll sync for dot indicators
  const handleScroll = useCallback(() => {
    if (!slidesRef.current) return
    const idx = Math.round(slidesRef.current.scrollLeft / slidesRef.current.offsetWidth)
    setActiveSlide(idx)
  }, [])

  // Hide bottom toolbar
  useEffect(() => {
    document.body.classList.add('modal-active')
    return () => document.body.classList.remove('modal-active')
  }, [])

  const trunkS = trunkState || 'anxious'
  const trunkYPos = scaledY(trunkS)

  // Compute global cone
  const cone = useMemo(() => {
    if (!careers?.length) return { centerY: trunkYPos, topY: 0, botY: VB_H, empty: true }
    const mapped = careers.filter(c => c.predictedState).map(c => ({
      predictedState: c.predictedState,
      realistic: true,
    }))
    const raw = computeCone(mapped, safety || 0)
    // Scale cone Y values to our viewBox
    return {
      ...raw,
      centerY: raw.centerY * SCALE_Y,
      topY: raw.topY * SCALE_Y,
      botY: raw.botY * SCALE_Y,
    }
  }, [careers, safety, trunkYPos])

  return (
    <div className="qpm-overlay">
      <button className="qpm-close" onClick={onClose}>&times;</button>
      {/* Dot indicators */}
      <div className="qpm-dots">
        {['all', ...activeQuests.map(q => q.predicted_state || 'anxious')].map((s, i) => (
          <div
            key={i}
            className={`qpm-dot ${activeSlide === i ? 'active' : ''}`}
            style={{
              background: activeSlide === i
                ? (i === 0 ? '#5e17eb' : SAFE_COLOURS[s] || '#5e17eb')
                : `${SAFE_COLOURS[s] || '#5e17eb'}40`,
            }}
          />
        ))}
      </div>

      {/* Slides */}
      <div className="qpm-slides" ref={slidesRef} onScroll={handleScroll}>

        {/* ── Slide 0: All paths overview ── */}
        <div className="qpm-slide">
          <div className="qpm-slide-title">Your Life Paths</div>
          <OverviewSVG
            uid={uid}
            quests={activeQuests}
            questTasks={questTasks}
            trunkState={trunkS}
            light={lightMode}
            crossPollination={crossPollination}
            heroAvatarUrl={heroAvatarUrl}
          />
        </div>

        {/* ── Slides 1-N: Individual quest focus ── */}
        {activeQuests.map(quest => (
          <div key={quest.id} className="qpm-slide">
            <div className="qpm-slide-title" style={{ color: `${SAFE_COLOURS[quest.predicted_state] || '#c084fc'}80` }}>
              {quest.label}
            </div>
            <div className="qpm-state-journey">
              <span style={{ color: `${SAFE_COLOURS[trunkS]}99` }}>
                {STATE_META[trunkS]?.emoji} {STATE_META[trunkS]?.label}
              </span>
              <span className="qpm-arrow">→</span>
              <span style={{ color: `${SAFE_COLOURS[quest.predicted_state] || '#c084fc'}99` }}>
                {STATE_META[quest.predicted_state]?.emoji} {STATE_META[quest.predicted_state]?.label}
              </span>
            </div>
            <FocusSVG
              uid={`${uid}f${quest.id}`}
              quest={quest}
              tasks={questTasks[quest.id] || []}
              healingIntentions={healingIntentions}
              trunkState={trunkS}
              trunkY={trunkYPos}
              cone={cone}
              light={lightMode}
            />
            <FocusFooter
              quest={quest}
              tasks={questTasks[quest.id] || []}
              healingIntentions={healingIntentions}
              trunkState={trunkS}
              userId={userId}
              onUpdate={onUpdate}
            />
          </div>
        ))}
      </div>

      <div className="qpm-swipe-hint">← swipe →</div>
    </div>
  )
}


// ─── Overview SVG (vertical: Y=time, X=state) ────────────────────────────────

function OverviewSVG({ uid, quests, questTasks, trunkState, light, crossPollination, heroAvatarUrl }) {
  // Compute global date range across all tasks
  const dateRange = useMemo(() => {
    const allDates = quests.flatMap(q =>
      (questTasks[q.id] || []).filter(t => t.created_at).map(t => new Date(t.created_at).getTime())
    )
    if (!allDates.length) return { minDate: Date.now() - 86400000, maxDate: Date.now() }
    return { minDate: Math.min(...allDates), maxDate: Math.max(...allDates) }
  }, [quests, questTasks])

  // Compute lane offsets: quests sharing a predicted_state get spread horizontally
  const laneOffsets = useMemo(() => {
    const groups = {}
    quests.forEach(q => {
      const s = q.predicted_state || 'peace'
      if (!groups[s]) groups[s] = []
      groups[s].push(q.id)
    })
    const offsets = {}
    Object.entries(groups).forEach(([s, ids]) => {
      const zone = STATE_ZONES[s]
      if (!zone) return
      const spacing = Math.min(25, (zone.right - zone.left) / Math.max(ids.length, 1))
      const total = (ids.length - 1) * spacing
      ids.forEach((id, i) => { offsets[id] = zone.center + (i * spacing - total / 2) })
    })
    return offsets
  }, [quests])

  // Compute merge info from cross-pollination signals
  // source line stops at mergeY, curves into target line which thickens
  const mergeInfo = useMemo(() => {
    const seen = {}
    const merges = [] // { sourceId, targetId, mergeY }
    const stopAtY = {} // questId → Y where it stops (merged into another)
    const thickenAtY = {} // questId → Y where it gets thicker (received a merge)

    crossPollination.forEach(cp => {
      const key = [cp.source_quest_id, cp.target_quest_id].sort().join(':')
      if (seen[key]) return
      seen[key] = true

      const signalDate = new Date(cp.created_at).getTime()
      const { minDate, maxDate } = dateRange
      const timeSpan = maxDate - minDate || 1
      const t = (signalDate - minDate) / timeSpan
      const mergeY = OV_BOTTOM - t * (OV_BOTTOM - OV_TOP)

      // Source merges INTO target
      const sourceId = cp.source_quest_id
      const targetId = cp.target_quest_id

      merges.push({ sourceId, targetId, mergeY, key })

      // Source line stops at mergeY (it merged away)
      if (!stopAtY[sourceId] || mergeY < stopAtY[sourceId]) {
        stopAtY[sourceId] = mergeY
      }
      // Target line thickens from mergeY upward
      if (!thickenAtY[targetId] || mergeY > thickenAtY[targetId]) {
        thickenAtY[targetId] = mergeY
      }
    })

    return { merges, stopAtY, thickenAtY }
  }, [crossPollination, dateRange])

  return (
    <div className="qpm-canvas qpm-canvas-vertical">
      <svg viewBox={`0 0 ${OV_W} ${OV_H}`} preserveAspectRatio="xMidYMid meet">
        <rect width={OV_W} height={OV_H} fill="#f5f5f0" rx="16" />

        <defs>
          <filter id={`${uid}glow`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <radialGradient id={`${uid}avGlow`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#E9A23B" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#E9A23B" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* State zone columns */}
        {STATES.map(s => {
          const zone = STATE_ZONES[s]
          if (!zone) return null
          return (
            <g key={s}>
              <rect x={zone.left} y={OV_TOP - 10} width={zone.right - zone.left} height={OV_BOTTOM - OV_TOP + 20}
                rx="6" fill={SAFE_COLOURS[s]} opacity="0.04" />
              <text x={zone.center} y={OV_TOP - 18} fill={SAFE_COLOURS[s]} opacity="0.6"
                fontSize="9" fontWeight="800" textAnchor="middle" letterSpacing="1">
                {STATE_META[s].label.toUpperCase()}
              </text>
            </g>
          )
        })}

        {/* Zone dividers */}
        <line x1="110" y1={OV_TOP - 10} x2="110" y2={OV_BOTTOM + 10} stroke="rgba(0,0,0,0.03)" />
        <line x1="210" y1={OV_TOP - 10} x2="210" y2={OV_BOTTOM + 10} stroke="rgba(0,0,0,0.03)" />
        <line x1="310" y1={OV_TOP - 10} x2="310" y2={OV_BOTTOM + 10} stroke="rgba(0,0,0,0.03)" />

        {/* Quest paths (vertical lines) */}
        {quests.map(quest => (
          <VerticalQuestLine
            key={quest.id}
            uid={uid}
            quest={quest}
            tasks={questTasks[quest.id] || []}
            laneX={laneOffsets[quest.id] || stateX(quest.predicted_state || 'peace')}
            dateRange={dateRange}
            stopAtY={mergeInfo.stopAtY[quest.id]}
            thickenAtY={mergeInfo.thickenAtY[quest.id]}
            heroAvatarUrl={heroAvatarUrl}
          />
        ))}

        {/* Merge curves: source line curves INTO target line */}
        {mergeInfo.merges.map(({ sourceId, targetId, mergeY, key }) => {
          const xSource = laneOffsets[sourceId]
          const xTarget = laneOffsets[targetId]
          if (xSource == null || xTarget == null) return null
          const sourceQuest = quests.find(q => q.id === sourceId)
          const sourceColour = SAFE_COLOURS[sourceQuest?.predicted_state] || '#5e17eb'
          return (
            <g key={key}>
              {/* Curve from source lane to target lane at mergeY */}
              <path d={`M ${xSource} ${mergeY + 40} C ${xSource} ${mergeY + 15}, ${xTarget} ${mergeY + 15}, ${xTarget} ${mergeY}`}
                fill="none" stroke={sourceColour} strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
              {/* Merge node on target line */}
              <circle cx={xTarget} cy={mergeY} r="5" fill="#5e17eb" opacity="0.35" />
              <circle cx={xTarget} cy={mergeY} r="3" fill="#5e17eb" opacity="0.55" />
            </g>
          )
        })}

        {/* NOW marker at top */}
        <text x={OV_W - 20} y={OV_TOP - 5} fill="rgba(0,0,0,0.2)"
          fontSize="8" fontWeight="600" textAnchor="end">NOW ↑</text>
      </svg>
    </div>
  )
}


// ─── Vertical quest line (single path in overview) ────────────────────────────

function VerticalQuestLine({ uid, quest, tasks, laneX, dateRange, stopAtY, thickenAtY, heroAvatarUrl }) {
  const destColour = SAFE_COLOURS[quest.predicted_state] || '#c084fc'
  const n = tasks.length

  // No tasks — just show label
  if (n === 0) {
    return (
      <text x={laneX} y={OV_BOTTOM + 16} fill={destColour} opacity="0.4"
        fontSize="11" fontWeight="800" textAnchor="end"
        transform={`rotate(-45, ${laneX}, ${OV_BOTTOM + 16})`}>
        {quest.label?.slice(0, 22)}
      </text>
    )
  }

  // Map tasks to Y positions based on created_at dates
  const { minDate, maxDate } = dateRange
  const timeSpan = maxDate - minDate || 1

  const taskPoints = useMemo(() =>
    tasks
      .filter(t => t.created_at)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      .map(task => {
        const t = (new Date(task.created_at) - minDate) / timeSpan
        const y = OV_BOTTOM - t * (OV_BOTTOM - OV_TOP)
        return { x: laneX, y, task }
      }),
    [tasks, laneX, minDate, maxDate, timeSpan]
  )

  // Find the most recent completed task for the character marker
  const lastDone = [...taskPoints].reverse().find(p => p.task.done)

  // Line boundaries
  const firstY = taskPoints.length > 0 ? taskPoints[0].y : OV_BOTTOM
  const lastY = taskPoints.length > 0 ? taskPoints[taskPoints.length - 1].y : OV_TOP
  // If this quest merges into another, stop the line at stopAtY
  const topY = stopAtY != null ? Math.max(stopAtY, lastY) : lastY

  return (
    <g>
      {/* Main line (below thicken point or full if no thicken) */}
      {thickenAtY != null ? (
        <>
          {/* Thin portion: firstY → thickenAtY */}
          <line x1={laneX} y1={firstY} x2={laneX} y2={thickenAtY}
            stroke={destColour} strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
          {/* Thick portion: thickenAtY → topY (received a merge) */}
          <line x1={laneX} y1={thickenAtY} x2={laneX} y2={topY}
            stroke={destColour} strokeWidth="5" strokeLinecap="round" opacity="0.65" />
          <line x1={laneX} y1={thickenAtY} x2={laneX} y2={topY}
            stroke={destColour} strokeWidth="12" strokeLinecap="round" opacity="0.05"
            filter={`url(#${uid}glow)`} />
        </>
      ) : (
        <>
          <line x1={laneX} y1={firstY} x2={laneX} y2={topY}
            stroke={destColour} strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
          <line x1={laneX} y1={firstY} x2={laneX} y2={topY}
            stroke={destColour} strokeWidth="7" strokeLinecap="round" opacity="0.05"
            filter={`url(#${uid}glow)`} />
        </>
      )}

      {/* Task dots (only show below stopAtY if quest merged away) */}
      {taskPoints
        .filter(({ y }) => stopAtY == null || y >= stopAtY)
        .map(({ x, y, task }) => (
        <circle key={task.id} cx={x} cy={y} r={task.done ? 3 : 2}
          fill={task.done ? destColour : 'none'}
          stroke={task.done ? 'none' : `${destColour}40`}
          strokeWidth={task.done ? 0 : 1}
          opacity={task.done ? 0.7 : 1} />
      ))}

      {/* Character marker — don't show if quest merged away */}
      {lastDone && stopAtY == null && (
        <g>
          {/* Ring */}
          <circle cx={lastDone.x} cy={lastDone.y} r="12" fill={destColour} opacity="0.15" />
          <circle cx={lastDone.x} cy={lastDone.y} r="10" fill="#f5f5f0" />
          {/* Avatar image clipped to circle */}
          {heroAvatarUrl ? (
            <>
              <defs>
                <clipPath id={`${uid}clip-${quest.id}`}>
                  <circle cx={lastDone.x} cy={lastDone.y} r="9" />
                </clipPath>
              </defs>
              <image
                href={heroAvatarUrl}
                x={lastDone.x - 9} y={lastDone.y - 9}
                width="18" height="18"
                clipPath={`url(#${uid}clip-${quest.id})`}
                preserveAspectRatio="xMidYMid slice"
              />
            </>
          ) : (
            <circle cx={lastDone.x} cy={lastDone.y} r="9" fill={destColour} opacity="0.8" />
          )}
          {/* Border ring */}
          <circle cx={lastDone.x} cy={lastDone.y} r="10" fill="none"
            stroke={destColour} strokeWidth="1.5" opacity="0.6" />
          {/* Pulse */}
          <circle cx={lastDone.x} cy={lastDone.y} r="12" fill="none"
            stroke={destColour} strokeWidth="1" opacity="0.1">
            <animate attributeName="r" values="12;20;12" dur="2.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.1;0;0.1" dur="2.5s" repeatCount="indefinite" />
          </circle>
        </g>
      )}

      {/* Quest label at bottom (rotated) */}
      <text x={laneX} y={OV_BOTTOM + 16} fill={destColour} opacity="0.9"
        fontSize="11" fontWeight="800" textAnchor="end"
        transform={`rotate(-45, ${laneX}, ${OV_BOTTOM + 16})`}>
        {quest.label?.slice(0, 22)}
      </text>
    </g>
  )
}


// ─── Focus SVG (single quest) ─────────────────────────────────────────────────

function FocusSVG({ uid, quest, tasks, healingIntentions, trunkState, trunkY, cone, light }) {
  return (
    <div className="qpm-canvas qpm-canvas-focus">
      <svg viewBox={`0 0 ${VB_W} 380`} preserveAspectRatio="xMidYMid meet">
        <rect width={VB_W} height="380" fill={light ? '#f5f5f0' : '#0a0a14'} rx="16" />
        <defs>
          <filter id={`${uid}glow`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <linearGradient id={`${uid}sg`} x1="0" y1="1" x2="0.8" y2="0">
            <stop offset="0%" stopColor={SAFE_COLOURS[trunkState] || '#10b981'} />
            <stop offset="100%" stopColor={SAFE_COLOURS[quest.predicted_state] || '#c084fc'} />
          </linearGradient>
          <linearGradient id={`${uid}sgg`} x1="0" y1="1" x2="0.8" y2="0">
            <stop offset="0%" stopColor={SAFE_COLOURS[trunkState] || '#10b981'} stopOpacity={light ? 0.3 : 0.06} />
            <stop offset="100%" stopColor={SAFE_COLOURS[quest.predicted_state] || '#c084fc'} stopOpacity={light ? 0.3 : 0.06} />
          </linearGradient>
          <radialGradient id={`${uid}ftg`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={SAFE_COLOURS[trunkState]} stopOpacity="0.25" />
            <stop offset="100%" stopColor={SAFE_COLOURS[trunkState]} stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`${uid}fcg`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity={light ? 0.22 : 0.05} />
            <stop offset="60%" stopColor="#f59e0b" stopOpacity={light ? 0.1 : 0.015} />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Cone (subtle) */}
        {!cone.empty && (
          <path d={`M ${TX} ${trunkY * (380 / VB_H)} L ${CX + 10} ${cone.topY * (380 / VB_H)} L ${CX + 10} ${cone.botY * (380 / VB_H)} Z`}
            fill={`url(#${uid}fcg)`} />
        )}

        <QuestPath
          uid={uid}
          quest={quest}
          tasks={tasks}
          healingIntentions={healingIntentions}
          trunkState={trunkState}
          trunkY={trunkY * (380 / VB_H)}
          cone={{ ...cone, topY: cone.topY * (380 / VB_H), botY: cone.botY * (380 / VB_H), centerY: cone.centerY * (380 / VB_H) }}
          viewH={380}
          showLabels
          light={light}
        />

        {/* Trunk */}
        <circle cx={TX} cy={trunkY * (380 / VB_H)} r="20" fill={`url(#${uid}ftg)`} />
        <circle cx={TX} cy={trunkY * (380 / VB_H)} r="5" fill={SAFE_COLOURS[trunkState]} opacity="0.85" />
        <circle cx={TX} cy={trunkY * (380 / VB_H)} r="2.5" fill={light ? '#333' : '#fff'} opacity="0.5" />
        <text x={TX} y={trunkY * (380 / VB_H) + 18} fill={light ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.3)'}
          fontSize="8" textAnchor="middle" fontWeight="600">YOU</text>
      </svg>
    </div>
  )
}


// ─── Shared: single quest path rendering ──────────────────────────────────────

function QuestPath({ uid, quest, tasks, healingIntentions = {}, trunkState, trunkY, cone, viewH, mini, showLabels, light, destOffset = 0 }) {
  const pathRef = useRef(null)
  const [points, setPoints] = useState(null)
  const h = viewH || VB_H
  const destY = scaledY(quest.predicted_state || 'anxious') * (h / VB_H) + destOffset
  const destColour = SAFE_COLOURS[quest.predicted_state] || '#c084fc'

  const dx = CX - TX
  const pathD = `M ${TX} ${trunkY} C ${TX + dx * 0.35} ${trunkY}, ${TX + dx * 0.65} ${destY}, ${CX} ${destY}`

  const doneTasks = useMemo(() => tasks.filter(t => t.done), [tasks])
  const safeTasks = useMemo(() => tasks.filter(t => t.safety_status === 'safe'), [tasks])
  const n = tasks.length
  const doneFrac = n > 0 ? doneTasks.length / n : 0
  const safeFrac = n > 0 ? safeTasks.length / n : 0

  useEffect(() => {
    if (!pathRef.current || !n) return
    const path = pathRef.current
    const totalLen = path.getTotalLength()
    const pts = tasks.map((task, i) => {
      const frac = n > 1 ? i / (n - 1) : 0.5
      const pt = path.getPointAtLength(frac * totalLen)
      return { x: pt.x, y: pt.y, task }
    })
    const doneLen = doneFrac * totalLen
    const safeLen = safeFrac * totalLen
    const charPt = n > 0 ? path.getPointAtLength(doneLen) : null
    setPoints({ pts, charPt, totalLen, doneLen, safeLen })
  }, [pathD, n, doneFrac, safeFrac])

  return (
    <g>
      {/* Hidden reference path (stroke="transparent" + positive width required for Safari/iOS getPointAtLength) */}
      <path ref={pathRef} d={pathD} fill="none" stroke="transparent" strokeWidth="1" />

      {/* Ghost (full path) */}
      <path d={pathD} fill="none" stroke={light ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.04)'}
        strokeWidth={mini ? 1.5 : 2.5} strokeDasharray="5,12" strokeLinecap="round" />

      {/* Done but not safe (grey solid) */}
      {points && points.doneLen > 0 && (
        <path d={pathD} fill="none" stroke={light ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.13)'}
          strokeWidth={mini ? 2 : 3} strokeLinecap="round"
          strokeDasharray={`${points.doneLen} ${points.totalLen}`} />
      )}

      {/* Safe (coloured gradient) */}
      {points && points.safeLen > 0 && (
        <>
          <path d={pathD} fill="none" stroke={mini ? destColour : `url(#${uid}sg)`}
            strokeWidth={mini ? 2.5 : 3.5} strokeLinecap="round"
            strokeDasharray={`${points.safeLen} ${points.totalLen}`}>
            <animate attributeName="strokeOpacity" values="0.85;1;0.85" dur="4s" repeatCount="indefinite" />
          </path>
          {/* Glow */}
          <path d={pathD} fill="none" stroke={mini ? destColour : `url(#${uid}sgg)`}
            strokeWidth={mini ? 6 : 12} strokeLinecap="round"
            strokeDasharray={`${points.safeLen} ${points.totalLen}`}
            opacity="0.5" filter={`url(#${uid}glow)`} />
        </>
      )}

      {/* Healing blocks (active fears — 💚 pill) */}
      {points?.pts.map(({ x, y, task }) => {
        const hi = healingIntentions?.[task.id]
        if (!hi) return null
        // Healed block (outcome recorded — green dashed circle + strikethrough)
        if (hi.outcome) {
          return (
            <g key={`heal-${task.id}`}>
              <circle cx={x} cy={y} r={mini ? 5 : 8} fill={light ? 'rgba(16,185,129,0.08)' : 'rgba(16,185,129,0.05)'}
                stroke="#10b981" strokeWidth="1" strokeDasharray="3,2" opacity="0.5" />
              {showLabels && (
                <text x={x} y={y - 12} fill={light ? 'rgba(16,185,129,0.4)' : 'rgba(16,185,129,0.3)'}
                  fontSize="7" textAnchor="middle" textDecoration="line-through">
                  {hi.pattern?.slice(0, 18) || 'healed'}
                </text>
              )}
            </g>
          )
        }
        // Active healing block (fear blocking path)
        return (
          <g key={`heal-${task.id}`}>
            <rect x={x - 14} y={y - 9} width="28" height="18" rx="9"
              fill={light ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.06)'}
              stroke={light ? 'rgba(239,68,68,0.25)' : 'rgba(239,68,68,0.18)'} strokeWidth="1" />
            <text x={x} y={y + 4} fill={light ? 'rgba(239,68,68,0.7)' : 'rgba(239,68,68,0.5)'}
              fontSize="10" textAnchor="middle">💚</text>
            {showLabels && (
              <text x={x} y={y - 14} fill={light ? 'rgba(239,68,68,0.5)' : 'rgba(239,68,68,0.35)'}
                fontSize="7" textAnchor="middle">{hi.pattern?.slice(0, 18) || 'fear'}</text>
            )}
          </g>
        )
      })}

      {/* Milestone dots */}
      {points?.pts.map(({ x, y, task }, i) => {
        const hi = healingIntentions?.[task.id]
        if (hi) return null // rendered as healing block instead

        // Courage challenge — done + safe (⚡ with coloured dot)
        if (task.done && task.is_courage_challenge && task.safety_status === 'safe') {
          return (
            <g key={`m-${task.id}`}>
              <circle cx={x} cy={y} r={mini ? 3.5 : 5} fill={destColour} opacity="0.8" />
              {!mini && <text x={x + 8} y={y + 3} fill={destColour} fontSize="8" opacity="0.7">⚡</text>}
              {showLabels && (
                <text x={x} y={y - 10} fill={light ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.35)'} fontSize="8"
                  textAnchor="middle">{task.text?.slice(0, 20)}</text>
              )}
            </g>
          )
        }
        // Courage challenge — done + not safe (⚡ with grey dot)
        if (task.done && task.is_courage_challenge && task.safety_status === 'not_safe') {
          return (
            <g key={`m-${task.id}`}>
              <circle cx={x} cy={y} r={mini ? 3 : 4.5} fill={light ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.15)'} />
              {!mini && <text x={x + 7} y={y + 3} fill={light ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.2)'} fontSize="8">⚡</text>}
              {showLabels && (
                <text x={x} y={y - 10} fill={light ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.2)'} fontSize="8"
                  textAnchor="middle">{task.text?.slice(0, 20)}</text>
              )}
            </g>
          )
        }
        // Regular completed task (not courage)
        if (task.done) {
          return (
            <g key={`m-${task.id}`}>
              <circle cx={x} cy={y} r={mini ? 2 : 3.5} fill={destColour} opacity="0.4" />
              {showLabels && (
                <text x={x} y={y - 10} fill={light ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.25)'} fontSize="8"
                  textAnchor="middle">{task.text?.slice(0, 20)}</text>
              )}
            </g>
          )
        }
        // Future task (empty circle)
        return (
          <g key={`m-${task.id}`}>
            <circle cx={x} cy={y} r={mini ? 2 : 3} fill="none"
              stroke={light ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.08)'} strokeWidth="1.5" />
            {showLabels && (
              <text x={x} y={y + (y < trunkY ? 16 : -8)} fill={light ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.1)'}
                fontSize="7" textAnchor="middle">{task.text?.slice(0, 18)}</text>
            )}
          </g>
        )
      })}

      {/* Character marker */}
      {points?.charPt && doneFrac > 0 && (
        <g>
          <circle cx={points.charPt.x} cy={points.charPt.y} r={mini ? 3.5 : 5} fill={light ? '#1a1a2e' : '#fff'} opacity="0.9" />
          <circle cx={points.charPt.x} cy={points.charPt.y} r={mini ? 7 : 10}
            fill="none" stroke={light ? '#1a1a2e' : '#fff'} strokeWidth="1.5" opacity={light ? 0.15 : 0.1}>
            <animate attributeName="r" values={mini ? '7;12;7' : '10;18;10'} dur="2.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.1;0;0.1" dur="2.5s" repeatCount="indefinite" />
          </circle>
        </g>
      )}

      {/* Destination label */}
      <text x={CX} y={destY - (mini ? 10 : 14)} fill={`${destColour}${light ? (doneFrac > 0.5 ? 'cc' : '90') : (doneFrac > 0.5 ? '60' : '30')}`}
        fontSize={mini ? 9 : 10} fontWeight="700" textAnchor="middle">
        {mini ? quest.label?.slice(0, 16) : STATE_META[quest.predicted_state]?.emoji}
      </text>
      {!mini && (
        <circle cx={CX} cy={destY} r="5" fill={`${destColour}${light ? '40' : '15'}`}
          stroke={`${destColour}30`} strokeWidth="1" />
      )}
    </g>
  )
}


// ─── Focus slide footer ───────────────────────────────────────────────────────

function FocusFooter({ quest, tasks, healingIntentions, trunkState, userId, onUpdate }) {
  const [taskInput, setTaskInput] = useState('')
  const [saving, setSaving] = useState(false)
  const savingRef = useRef(false)
  const [healingPrompt, setHealingPrompt] = useState(null) // { taskId, text }
  const [healingStep, setHealingStep] = useState('ask') // 'ask' | 'when'
  const [healingTaskId, setHealingTaskId] = useState(null)
  const [healingTaskText, setHealingTaskText] = useState('')
  const n = tasks.length
  const doneTasks = tasks.filter(t => t.done)
  const courageTasks = tasks.filter(t => t.is_courage_challenge)
  const safeTasks = courageTasks.filter(t => t.safety_status === 'safe')
  const unsafeTasks = courageTasks.filter(t => t.safety_status === 'not_safe')
  const donePct = n > 0 ? Math.round((doneTasks.length / n) * 100) : 0
  const safePct = n > 0 ? Math.round((safeTasks.length / n) * 100) : 0

  const nextCourage = tasks.find(t => !t.done && t.is_courage_challenge)
  const nextTask = tasks.find(t => !t.done)
  const activeHealing = Object.values(healingIntentions).find(h =>
    tasks.some(t => t.id === h.quest_task_id) && !h.outcome && h.healing_stage
  )
  const destColour = SAFE_COLOURS[quest.predicted_state] || '#c084fc'

  return (
    <>
    <div className="qpm-footer">
      {/* Dual progress bar */}
      {n > 0 && (
        <>
          <div className="qpm-progress-row">
            <div className="qpm-progress-bg">
              <div className="qpm-progress-done" style={{ width: `${donePct}%` }} />
              <div className="qpm-progress-safe" style={{
                width: `${safePct}%`,
                background: `linear-gradient(90deg, ${SAFE_COLOURS[trunkState] || '#10b981'}, ${SAFE_COLOURS[quest.predicted_state] || '#c084fc'})`,
              }} />
            </div>
          </div>
          <div className="qpm-progress-labels">
            <span style={{ color: 'rgba(16,185,129,0.5)' }}>{safePct}% safe</span>
            <span>{donePct}% done</span>
          </div>
        </>
      )}

      {/* All incomplete tasks grouped by type */}
      {tasks.filter(t => !t.done).map(t => {
        const hi = healingIntentions[t.id]
        const hasActiveHealing = hi && !hi.outcome && hi.healing_stage

        // Healing card
        if (hasActiveHealing) {
          return (
            <div key={t.id} className="qpm-action" style={{ borderColor: 'rgba(239,68,68,0.15)', background: 'rgba(239,68,68,0.05)' }}>
              <span className="qpm-action-icon">💚</span>
              <div className="qpm-action-body">
                <div className="qpm-action-label" style={{ color: 'rgba(239,68,68,0.5)' }}>Fear blocking your path</div>
                <div className="qpm-action-text">{t.text}</div>
                {hi.pattern && <div className="qpm-action-sub">{hi.pattern}</div>}
              </div>
              <span className="qpm-action-arrow">›</span>
            </div>
          )
        }

        // Courage card
        if (t.is_courage_challenge) {
          return (
            <div key={t.id} className="qpm-action" style={{ borderColor: `${destColour}20`, background: `${destColour}08` }}>
              <span className="qpm-action-icon">⚡</span>
              <div className="qpm-action-body">
                <div className="qpm-action-label" style={{ color: `${destColour}80` }}>Courage step</div>
                <div className="qpm-action-text">{t.text}</div>
              </div>
              <span className="qpm-action-arrow">›</span>
            </div>
          )
        }

        // Regular to-do card
        return (
          <div key={t.id} className="qpm-action" style={{ borderColor: 'rgba(0,0,0,0.06)', background: 'rgba(0,0,0,0.02)' }}>
            <span className="qpm-action-icon" style={{ opacity: 0.4 }}>○</span>
            <div className="qpm-action-body">
              <div className="qpm-action-label" style={{ color: 'rgba(0,0,0,0.3)' }}>To do</div>
              <div className="qpm-action-text">{t.text}</div>
            </div>
            <span className="qpm-action-arrow">›</span>
          </div>
        )
      })}

      {/* Expand safety prompt */}
      {unsafeTasks.length > 0 && (
        <div className="qpm-action" style={{ borderColor: 'rgba(16,185,129,0.15)', background: 'rgba(16,185,129,0.05)' }}>
          <span className="qpm-action-icon">🔓</span>
          <div className="qpm-action-body">
            <div className="qpm-action-label" style={{ color: 'rgba(16,185,129,0.5)' }}>Expand your safety</div>
            <div className="qpm-action-text">{unsafeTasks.length} task{unsafeTasks.length > 1 ? 's' : ''} done but don't feel safe yet</div>
            <div className="qpm-action-sub">Complete healing flows to light them up</div>
          </div>
          <span className="qpm-action-arrow">›</span>
        </div>
      )}

      {/* Add courage step input */}
      <div className="qpm-add-row">
        <input
          className="qpm-add-input"
          type="text"
          value={taskInput}
          onChange={e => setTaskInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addCourageStep()}
          placeholder={n === 0 ? "What's the smallest step you could take?" : "Add a courage step..."}
        />
        <button className="qpm-add-btn" onClick={addCourageStep}
          disabled={!taskInput.trim() || saving}>
          {saving ? '...' : '⚡ Add'}
        </button>
      </div>

      {/* Healing prompt after adding a courage step */}
      {healingPrompt && healingStep === 'ask' && (
        <div className="qpm-healing-prompt">
          <div className="qpm-healing-prompt-text">Want to explore what makes this scary?</div>
          <div className="qpm-healing-prompt-actions">
            <button className="qpm-healing-yes" onClick={() => setHealingStep('when')}>Yes, dig in 💚</button>
            <button className="qpm-healing-no" onClick={() => { setHealingPrompt(null); setHealingStep('ask') }}>No, just do it ⚡</button>
          </div>
        </div>
      )}
      {healingPrompt && healingStep === 'when' && (
        <div className="qpm-healing-prompt">
          <div className="qpm-healing-prompt-text">Deep dive now?</div>
          <div className="qpm-healing-prompt-actions">
            <button className="qpm-healing-yes" onClick={async () => {
              try {
                await supabase.from('healing_intentions').upsert({
                  quest_task_id: healingPrompt.taskId,
                  user_id: userId,
                  healing_stage: 'in_progress',
                  updated_at: new Date().toISOString(),
                }, { onConflict: 'quest_task_id' })
              } catch (e) { /* non-blocking */ }
              setHealingTaskId(healingPrompt.taskId)
              setHealingTaskText(healingPrompt.text)
              setHealingPrompt(null); setHealingStep('ask')
            }}>Now 💚</button>
            <button className="qpm-healing-later" onClick={async () => {
              try {
                await supabase.from('healing_intentions').upsert({
                  quest_task_id: healingPrompt.taskId,
                  user_id: userId,
                  healing_stage: 'in_progress',
                  updated_at: new Date().toISOString(),
                }, { onConflict: 'quest_task_id' })
              } catch (e) { /* non-blocking */ }
              setHealingPrompt(null); setHealingStep('ask')
              onUpdate?.()
            }}>Later</button>
          </div>
          <div className="qpm-healing-hint">You can always continue from the Healing tab</div>
        </div>
      )}
    </div>

    {healingTaskId && (
      <HealingFlowModal
        taskText={healingTaskText}
        userId={userId}
        questTaskId={healingTaskId}
        onComplete={() => { setHealingTaskId(null); setHealingTaskText(''); onUpdate?.() }}
        onClose={() => { setHealingTaskId(null); setHealingTaskText('') }}
      />
    )}
    </>
  )

  async function addCourageStep() {
    if (!taskInput.trim() || savingRef.current || !userId) return
    savingRef.current = true
    setSaving(true)
    try {
      const { data: dbRecord } = await createGroanChallenge({
        userId,
        title: taskInput.trim(),
        description: `Life path: ${quest.label}`,
        visibilityLayer: 'screen',
        sourceType: 'life_path',
        sourceLabel: quest.label,
        scaryScore: 5,
        wahooScore: 5,
        wahooCategory: null,
      })
      if (dbRecord) {
        await acceptGroanChallenge(dbRecord.id)
        await supabase.from('priority_weekly_picks').upsert({
          user_id: userId,
          week_start_date: getWeekStartLocal(),
          pick_type: 'groan',
          reference_id: dbRecord.id,
          display_name: taskInput.trim(),
        }, { onConflict: 'user_id,week_start_date,pick_type,reference_id', ignoreDuplicates: true })

        const { data: insertedTask } = await supabase.from('quest_tasks').insert({
          quest_id: quest.id,
          user_id: userId,
          text: taskInput.trim(),
          is_courage_challenge: true,
          groan_challenge_id: dbRecord.id,
          sort_order: tasks.length,
        }).select('id').single()

        // Award 2 RP for adding a task
        try {
          await supabase.from('quest_completions').insert({
            user_id: userId,
            quest_id: `quest_created_${Date.now()}`,
            quest_category: 'Quests',
            quest_type: 'Practice',
            points_earned: 2,
            challenge_day: 0,
            project_id: null,
          })
        } catch (e) { /* non-blocking */ }

        const savedText = taskInput.trim()
        setTaskInput('')

        // Show healing prompt
        if (insertedTask?.id) {
          setHealingPrompt({ taskId: insertedTask.id, text: savedText })
        }

        onUpdate?.()
      }
    } catch (e) { console.error('Add courage step error:', e) }
    savingRef.current = false
    setSaving(false)
  }
}
