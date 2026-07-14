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
import BackdatePanel from './BackdatePanel'
import QuestTaskSheet from './QuestTaskSheet'
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

// ── Vertical overview constants (Y=depth L0-L4, X=state) ──
const OV_W = 420
const OV_H = 600
const OV_TOP = 60
const OV_BOTTOM = OV_H - 80

// Depth level Y positions (L0=bottom, L4=top)
const DEPTH_LEVELS = [
  { id: 'education',   label: 'L0 Learning',    short: 'L0' },
  { id: 'testing',     label: 'L1 Testing',     short: 'L1' },
  { id: 'practising',  label: 'L2 Practising',  short: 'L2' },
  { id: 'charging',    label: 'L3 Charging',    short: 'L3' },
  { id: 'teaching',    label: 'L4 Teaching',     short: 'L4' },
]
const DEPTH_ORDER = { education: 0, testing: 1, practising: 2, charging: 3, teaching: 4 }
function depthY(d) {
  const idx = DEPTH_ORDER[d] ?? 0
  return OV_BOTTOM - (idx / 4) * (OV_BOTTOM - OV_TOP)
}

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
  const [sheetTask, setSheetTask] = useState(null)
  const [sheetData, setSheetData] = useState(null)
  const lightMode = true

  const activeQuests = useMemo(() =>
    quests.filter(q => q.label !== 'Healing Work'),
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

  // Tap handler for ⚡/💚 icons
  const handleDotTap = useCallback(async (task) => {
    setSheetTask(task)
    setSheetData(null)
    if (task.groan_challenge_id) {
      try {
        const { data } = await supabase.from('quest_completions')
          .select('reflection_text')
          .eq('quest_id', `play_list_challenge_${task.groan_challenge_id}`)
          .maybeSingle()
        if (data?.reflection_text) {
          setSheetData(JSON.parse(data.reflection_text))
        }
      } catch (e) { /* non-blocking */ }
    }
  }, [])

  const trunkS = trunkState || 'anxious'

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
            healingIntentions={healingIntentions}
            trunkState={trunkS}
            light={lightMode}
            crossPollination={crossPollination}
            heroAvatarUrl={heroAvatarUrl}
            onDotTap={handleDotTap}
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

      {/* Bottom sheet for task details */}
      {sheetTask && (
        <QuestTaskSheet
          task={sheetTask}
          quest={activeQuests.find(q => (questTasks[q.id] || []).some(t => t.id === sheetTask.id))}
          completionData={sheetData}
          healingIntention={healingIntentions[sheetTask.id]}
          crossPollination={crossPollination
            .filter(cp => sheetTask.groan_challenge_id && cp.groan_challenge_id === sheetTask.groan_challenge_id)
            .map(cp => {
              const targetQuest = activeQuests.find(q => q.id === cp.target_quest_id)
              const sourceQuest = activeQuests.find(q => q.id === cp.source_quest_id)
              return { questLabel: targetQuest?.label || sourceQuest?.label || 'Another path' }
            })}
          onClose={() => { setSheetTask(null); setSheetData(null) }}
        />
      )}
    </div>
  )
}


// ─── Overview SVG (vertical: Y=time, X=state) ────────────────────────────────

function OverviewSVG({ uid, quests, questTasks, healingIntentions, trunkState, light, crossPollination, heroAvatarUrl, onDotTap }) {
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

  return (
    <div className="qpm-canvas qpm-canvas-vertical">
      <svg viewBox={`0 0 ${OV_W} ${OV_H}`} preserveAspectRatio="xMidYMid meet">
        <rect width={OV_W} height={OV_H} fill="#f5f5f0" rx="16" />

        <defs>
          <filter id={`${uid}glow`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* State zone columns (X axis) */}
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

        {/* Column dividers */}
        <line x1="110" y1={OV_TOP - 10} x2="110" y2={OV_BOTTOM + 10} stroke="rgba(0,0,0,0.03)" />
        <line x1="210" y1={OV_TOP - 10} x2="210" y2={OV_BOTTOM + 10} stroke="rgba(0,0,0,0.03)" />
        <line x1="310" y1={OV_TOP - 10} x2="310" y2={OV_BOTTOM + 10} stroke="rgba(0,0,0,0.03)" />

        {/* Depth level rows (Y axis) */}
        {DEPTH_LEVELS.map((d, i) => {
          const y = depthY(d.id)
          return (
            <g key={d.id}>
              <line x1="25" y1={y} x2={OV_W - 15} y2={y} stroke="rgba(0,0,0,0.04)" strokeDasharray="4 4" />
              <text x="18" y={y + 4} fill="rgba(0,0,0,0.2)"
                fontSize="8" fontWeight="700" textAnchor="end">
                {d.short}
              </text>
            </g>
          )
        })}

        {/* Quest dots at (state, depth) */}
        {quests.map(quest => {
          const x = laneOffsets[quest.id] || stateX(quest.predicted_state || 'peace')
          const y = depthY(quest.depth_level || 'education')
          const colour = SAFE_COLOURS[quest.predicted_state] || '#c084fc'
          const isClosed = quest.status === 'closed'
          const tasks = questTasks[quest.id] || []
          const doneCount = tasks.filter(t => t.done).length

          return (
            <g key={quest.id} opacity={isClosed ? 0.4 : 1}>
              {/* Glow */}
              <circle cx={x} cy={y} r="14" fill={colour} opacity="0.08"
                filter={`url(#${uid}glow)`} />
              {/* Dot */}
              <circle cx={x} cy={y} r="7" fill={colour} opacity={isClosed ? 0.5 : 0.85} />
              {doneCount > 0 && (
                <text x={x} y={y + 3} fill="white" fontSize="7" fontWeight="800" textAnchor="middle">
                  {doneCount}
                </text>
              )}
              {/* Label */}
              <text x={x} y={OV_BOTTOM + 16} fill={colour} opacity={isClosed ? 0.3 : 0.5}
                fontSize="10" fontWeight="700" textAnchor="end"
                transform={`rotate(-45, ${x}, ${OV_BOTTOM + 16})`}>
                {quest.label?.slice(0, 22)}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}


// ─── Focus SVG (single quest, vertical) ───────────────────────────────────────

function FocusSVG({ uid, quest, tasks, healingIntentions }) {
  const destColour = SAFE_COLOURS[quest.predicted_state] || '#c084fc'
  const n = tasks.length
  const FH = 500
  const FW = 320
  const FTop = 30
  const FBottom = FH - 30
  const centerX = FW / 2

  const getDate = (t) => t.backdated_date || t.created_at

  const sortedTasks = useMemo(() =>
    [...tasks].filter(t => getDate(t)).sort((a, b) => new Date(getDate(a)) - new Date(getDate(b))),
    [tasks]
  )

  const taskPoints = useMemo(() =>
    sortedTasks.map((task, i) => {
      const frac = sortedTasks.length > 1 ? i / (sortedTasks.length - 1) : 0.5
      const y = FBottom - frac * (FBottom - FTop)
      return { x: centerX, y, task }
    }),
    [sortedTasks, centerX]
  )

  const firstY = taskPoints.length > 0 ? taskPoints[0].y : FBottom
  const lastY = taskPoints.length > 0 ? taskPoints[taskPoints.length - 1].y : FTop

  if (n === 0) return null

  return (
    <div className="qpm-canvas qpm-canvas-focus">
      <svg viewBox={`0 0 ${FW} ${FH}`} preserveAspectRatio="xMidYMid meet">
        <rect width={FW} height={FH} fill="#f5f5f0" rx="16" />

        <defs>
          <filter id={`${uid}fglow`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Vertical line */}
        <line x1={centerX} y1={firstY} x2={centerX} y2={lastY}
          stroke={destColour} strokeWidth="3" strokeLinecap="round" opacity="0.5" />
        <line x1={centerX} y1={firstY} x2={centerX} y2={lastY}
          stroke={destColour} strokeWidth="8" strokeLinecap="round" opacity="0.04"
          filter={`url(#${uid}fglow)`} />

        {/* Task dots with labels */}
        {taskPoints.map(({ x, y, task }, i) => {
          const hi = healingIntentions?.[task.id]
          const hasHealing = hi && !hi.outcome && hi.healing_stage
          const isHealed = hi && hi.outcome
          const isCourage = task.is_courage_challenge
          const labelSide = i % 2 === 0 ? 'left' : 'right'
          const labelX = labelSide === 'left' ? x - 16 : x + 16
          const anchor = labelSide === 'left' ? 'end' : 'start'

          return (
            <g key={task.id}>
              {/* Healing block */}
              {hasHealing && (
                <>
                  <rect x={x - 12} y={y - 8} width="24" height="16" rx="8"
                    fill="rgba(239,68,68,0.08)" stroke="rgba(239,68,68,0.25)" strokeWidth="1" />
                  <text x={x} y={y + 4} fill="rgba(239,68,68,0.6)" fontSize="9" textAnchor="middle">💚</text>
                </>
              )}
              {/* Healed block */}
              {isHealed && (
                <circle cx={x} cy={y} r="6" fill="rgba(16,185,129,0.06)"
                  stroke="#10b981" strokeWidth="1" strokeDasharray="3,2" opacity="0.5" />
              )}
              {/* Dot */}
              {!hasHealing && (
                <circle cx={x} cy={y} r={task.done ? 4 : 2.5}
                  fill={task.done ? destColour : 'none'}
                  stroke={task.done ? 'none' : `${destColour}40`}
                  strokeWidth={task.done ? 0 : 1}
                  opacity={task.done ? 0.7 : 1} />
              )}
              {/* Courage badge */}
              {isCourage && task.done && !hasHealing && (
                <text x={x + 7} y={y + 3} fill={destColour} fontSize="7" opacity="0.6">⚡</text>
              )}
              {/* Label */}
              <text x={labelX} y={y + 4} fill="rgba(0,0,0,0.5)" fontSize="8"
                fontWeight={task.done ? '600' : '400'} textAnchor={anchor}
                opacity={task.done ? 0.7 : 0.4}>
                {task.text?.slice(0, 25)}
              </text>
            </g>
          )
        })}

        {/* NOW label at top */}
        <text x={centerX} y={FTop - 10} fill="rgba(0,0,0,0.2)"
          fontSize="8" fontWeight="600" textAnchor="middle">NOW ↑</text>
      </svg>
    </div>
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
      {/* Progress bar archived — tasks are infinite, % done is misleading */}

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

    {/* Backdate panel — last item */}
    <BackdatePanel
      quest={quest}
      existingTasks={tasks}
      userId={userId}
      onSaved={onUpdate}
    />

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
