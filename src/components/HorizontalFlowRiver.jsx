/**
 * HorizontalFlowRiver.jsx
 *
 * Horizontal river visualization of timeline entries (left→right).
 * Supports compass entries (direction-colored) and milestone entries (quest/groan).
 *
 * Entry types:
 * - compass: Flow direction nodes (N/E/S/W)
 * - quest: Quest completion milestones (⚡)
 * - groan: Groan challenge milestones (🦁)
 */

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import './HorizontalFlowRiver.css'

const DIRECTION_CONFIG = {
  north: { color: '#10b981', label: 'Flow', icon: '→', desc: 'Ease + Excited' },
  east:  { color: '#3b82f6', label: 'Redirect', icon: '↑', desc: 'Resistance + Excited' },
  south: { color: '#ef4444', label: 'Rest', icon: '●', desc: 'Resistance + Tired' },
  west:  { color: '#fbbf24', label: 'Honour', icon: '↓', desc: 'Ease + Tired' },
}

const MILESTONE_CONFIG = {
  quest: { color: '#5e17eb', icon: '⚡', label: 'Quest Complete' },
  groan: { color: '#E9A23B', icon: '🦁', label: 'Courage Challenge' },
}

function HorizontalFlowRiver({ projectId, limit = 30, entries: externalEntries }) {
  const { user } = useAuth()
  const scrollRef = useRef(null)

  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(!externalEntries)
  const [selectedEntry, setSelectedEntry] = useState(null)

  useEffect(() => {
    if (externalEntries) {
      setEntries(externalEntries)
      setLoading(false)
      return
    }
    if (user?.id && projectId) fetchEntries()
  }, [user, projectId, externalEntries])

  // Auto-scroll to right end when entries load
  useEffect(() => {
    if (entries.length > 0 && scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({ left: scrollRef.current.scrollWidth, behavior: 'smooth' })
      }, 400)
    }
  }, [entries])

  const fetchEntries = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('flow_entries')
        .select('id, direction, logged_at, activity_description, reasoning')
        .eq('user_id', user.id)
        .eq('project_id', projectId)
        .order('logged_at', { ascending: true })
        .limit(limit)
      if (error) throw error
      setEntries((data || []).map(e => ({ ...e, type: 'compass', date: e.logged_at })))
    } catch (err) {
      console.error('Error fetching flow entries:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  if (loading) {
    return (
      <div className="h-flow-river loading">
        <div className="river-loading-indicator" />
      </div>
    )
  }

  if (entries.length === 0) return null

  // Build path + nodes
  const nodeSpacing = 70
  const startX = 40
  const centerY = 110
  const svgWidth = Math.max(900, startX + entries.length * nodeSpacing + 60)

  const points = entries.map((entry, i) => {
    const x = startX + (i + 1) * nodeSpacing
    const entryType = entry.type || 'compass'
    const dir = entry.direction || 'north'

    // Deterministic offset from entry id + index
    const hash = (String(entry.id || i).split('').reduce((a, c) => a + c.charCodeAt(0), 0) + i * 7) % 100
    const offset = hash / 100

    let y = centerY
    if (entryType === 'compass') {
      if (dir === 'north') y = centerY - 30 - offset * 20
      else if (dir === 'east') y = centerY - 10 + offset * 20
      else if (dir === 'south') y = centerY + 30 + offset * 10
      else if (dir === 'west') y = centerY + 10 + offset * 15
    } else {
      // Milestones sit near center with slight variation
      y = centerY - 15 + offset * 30
    }

    return { x, y: Math.max(30, Math.min(190, y)), entry, dir, entryType }
  })

  // Build SVG path through all points
  const allPoints = [{ x: startX, y: centerY }, ...points]
  let pathD = `M ${allPoints[0].x},${allPoints[0].y}`
  for (let i = 1; i < allPoints.length; i++) {
    const prev = allPoints[i - 1]
    const curr = allPoints[i]
    const cpx = (prev.x + curr.x) / 2
    pathD += ` Q ${cpx},${prev.y} ${curr.x},${curr.y}`
  }

  // Build gradient stops
  const gradientStops = [{ offset: '0%', color: '#5e17eb' }]
  entries.forEach((entry, i) => {
    const pct = Math.round(((i + 1) / entries.length) * 100)
    let color
    if (entry.type === 'quest') color = MILESTONE_CONFIG.quest.color
    else if (entry.type === 'groan') color = MILESTONE_CONFIG.groan.color
    else color = (DIRECTION_CONFIG[entry.direction] || DIRECTION_CONFIG.north).color
    gradientStops.push({ offset: `${pct}%`, color })
  })

  const isLast = (i) => i === points.length - 1

  return (
    <div className="h-flow-river">
      <div className="flow-path-scroll" ref={scrollRef}>
        <div className="flow-path-container" style={{ minWidth: svgWidth }}>
          <svg className="flow-path-svg" viewBox={`0 0 ${svgWidth} 220`} preserveAspectRatio="xMidYMid meet">
            <defs>
              <linearGradient id="hfrRiverGrad" x1="0" y1="0" x2="1" y2="0">
                {gradientStops.map((s, i) => (
                  <stop key={i} offset={s.offset} stopColor={s.color} />
                ))}
              </linearGradient>
              <filter id="hfrGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            {/* River glow */}
            <path className="fp-river-glow" stroke="#adb5bd" d={pathD} />
            {/* River */}
            <path className="fp-river" stroke="url(#hfrRiverGrad)" d={pathD} />
            {/* Highlight */}
            <path className="fp-river-highlight" d={pathD} />

            {/* Start node */}
            <g className="fp-node" onClick={() => {}}>
              <circle cx={startX} cy={centerY} r="10" fill="#5e17eb" stroke="white" strokeWidth="2" />
              <text x={startX} y={centerY} textAnchor="middle" dominantBaseline="central" fill="white" fontSize="9" fontWeight="800">🚩</text>
              <text x={startX} y={centerY + 24} textAnchor="middle" className="fp-date">Start</text>
            </g>

            {/* Entry nodes */}
            {points.map((pt, i) => {
              const isCurrent = isLast(i)
              const isMilestone = pt.entryType === 'quest' || pt.entryType === 'groan'

              if (isMilestone) {
                const mc = MILESTONE_CONFIG[pt.entryType]
                return (
                  <g key={`${pt.entryType}-${pt.entry.id}`} className="fp-node" onClick={() => setSelectedEntry(pt.entry)}>
                    <circle cx={pt.x} cy={pt.y} r="22" fill="transparent" />
                    <circle cx={pt.x} cy={pt.y} r="21" className="fp-hover-ring" />

                    {/* Dashed outer ring */}
                    <circle
                      cx={pt.x} cy={pt.y} r="20"
                      className="fp-milestone-outer"
                      stroke={mc.color}
                    />

                    {isCurrent && (
                      <>
                        <circle cx={pt.x} cy={pt.y} r="24" fill={mc.color} opacity="0.1" className="fp-now-glow" />
                        <circle cx={pt.x} cy={pt.y} r="22" fill="none" stroke={mc.color} strokeWidth="2" className="fp-now-pulse" />
                      </>
                    )}

                    <circle
                      cx={pt.x} cy={pt.y}
                      r={14}
                      fill={mc.color}
                      stroke={isCurrent ? '#E9A23B' : 'white'}
                      strokeWidth={isCurrent ? 3 : 2}
                    />
                    <text x={pt.x} y={pt.y} textAnchor="middle" dominantBaseline="central" className="fp-arrow" fontSize="14">
                      {mc.icon}
                    </text>
                    <text x={pt.x} y={pt.y - 26} textAnchor="middle" className="fp-ms-label" fill={mc.color}>
                      {pt.entryType === 'quest' ? 'Quest' : 'Groan'}
                    </text>
                    <text x={pt.x} y={pt.y + 24} textAnchor="middle" className="fp-date">
                      {formatDate(pt.entry.date)}
                    </text>
                    {isCurrent && (
                      <text x={pt.x} y={pt.y + 36} textAnchor="middle" className="fp-ms-sublabel" fill="#E9A23B">Now</text>
                    )}
                  </g>
                )
              }

              // Compass node
              const dc = DIRECTION_CONFIG[pt.dir] || DIRECTION_CONFIG.north
              return (
                <g key={pt.entry.id} className="fp-node" onClick={() => setSelectedEntry(pt.entry)}>
                  <circle cx={pt.x} cy={pt.y} r="18" fill="transparent" />
                  <circle cx={pt.x} cy={pt.y} r="17" className="fp-hover-ring" />

                  {pt.dir === 'south' && (
                    <circle cx={pt.x} cy={pt.y} r="12" fill="none" stroke={dc.color} strokeWidth="2" className="fp-stuck-pulse" />
                  )}

                  {isCurrent && (
                    <>
                      <circle cx={pt.x} cy={pt.y} r="20" fill="#E9A23B" opacity="0.1" className="fp-now-glow" />
                      <circle cx={pt.x} cy={pt.y} r="18" fill="none" stroke="#E9A23B" strokeWidth="2" className="fp-now-pulse" />
                    </>
                  )}

                  <circle
                    cx={pt.x} cy={pt.y}
                    r={isCurrent ? 14 : 11}
                    fill={dc.color}
                    stroke={isCurrent ? '#E9A23B' : 'white'}
                    strokeWidth={isCurrent ? 3 : 2}
                  />
                  <text x={pt.x} y={pt.y} textAnchor="middle" dominantBaseline="central" className="fp-arrow" fontSize={pt.dir === 'south' ? 12 : 10}>
                    {dc.icon}
                  </text>
                  <text x={pt.x} y={pt.y + 24} textAnchor="middle" className="fp-date">
                    {formatDate(pt.entry.date || pt.entry.logged_at)}
                  </text>
                  {pt.dir === 'south' && !isCurrent && (
                    <text x={pt.x} y={pt.y + 36} textAnchor="middle" className="fp-ms-sublabel" fill={dc.color}>Rest day</text>
                  )}
                  {isCurrent && (
                    <text x={pt.x} y={pt.y - 24} textAnchor="middle" className="fp-ms-label" fill="#E9A23B">Now</text>
                  )}
                </g>
              )
            })}
          </svg>
        </div>
      </div>

      {/* Popup overlay */}
      <div
        className={`fp-popup-overlay ${selectedEntry ? 'active' : ''}`}
        onClick={() => setSelectedEntry(null)}
      >
        <div className="fp-popup" onClick={(e) => e.stopPropagation()}>
          <div className="fp-popup-handle" />
          {selectedEntry && (() => {
            const entryType = selectedEntry.type || 'compass'

            if (entryType === 'quest' || entryType === 'groan') {
              const mc = MILESTONE_CONFIG[entryType]
              return (
                <>
                  <div className="fp-popup-header">
                    <div className="fp-popup-icon fp-popup-icon-dashed" style={{ background: mc.color, color: 'white', borderColor: mc.color }}>
                      {mc.icon}
                    </div>
                    <div>
                      <div className="fp-popup-title">{mc.label}</div>
                      <div className="fp-popup-subtitle">{formatDate(selectedEntry.date)}</div>
                    </div>
                  </div>
                  {selectedEntry.quest_name && (
                    <div className="fp-popup-body"><strong>{selectedEntry.quest_name}</strong></div>
                  )}
                  {selectedEntry.title && (
                    <div className="fp-popup-body"><strong>{selectedEntry.title}</strong></div>
                  )}
                  {(selectedEntry.quest_description || selectedEntry.description) && (
                    <div className="fp-popup-body">{selectedEntry.quest_description || selectedEntry.description}</div>
                  )}
                  <div className="fp-popup-meta">
                    {entryType === 'quest' && selectedEntry.points && (
                      <span className="fp-popup-tag" style={{ background: `${mc.color}15`, color: mc.color }}>
                        +{selectedEntry.points} XP
                      </span>
                    )}
                    {entryType === 'groan' && selectedEntry.essence_zone && (
                      <span className="fp-popup-tag" style={{ background: `${mc.color}15`, color: mc.color }}>
                        {selectedEntry.essence_zone}
                      </span>
                    )}
                    {entryType === 'groan' && selectedEntry.visibility_layer && (
                      <span className="fp-popup-tag" style={{ background: '#f0f0f0', color: '#6c757d' }}>
                        {selectedEntry.visibility_layer}
                      </span>
                    )}
                  </div>
                </>
              )
            }

            // Compass entry popup
            const dc = DIRECTION_CONFIG[selectedEntry.direction] || DIRECTION_CONFIG.north
            return (
              <>
                <div className="fp-popup-header">
                  <div className="fp-popup-icon" style={{ background: dc.color, color: 'white' }}>
                    {dc.icon}
                  </div>
                  <div>
                    <div className="fp-popup-title">{dc.label} Day</div>
                    <div className="fp-popup-subtitle">{formatDate(selectedEntry.date || selectedEntry.logged_at)}</div>
                  </div>
                </div>
                <div className="fp-popup-direction" style={{ background: `${dc.color}15`, color: dc.color }}>
                  <span style={{ fontWeight: 900 }}>{dc.icon}</span> {dc.label} — {dc.desc}
                </div>
                {selectedEntry.activity_description && (
                  <div className="fp-popup-body">{selectedEntry.activity_description}</div>
                )}
                {selectedEntry.reasoning && (
                  <div className="fp-popup-feeling">
                    <div className="fp-popup-feeling-label">How you were feeling</div>
                    <div className="fp-popup-feeling-text">"{selectedEntry.reasoning}"</div>
                  </div>
                )}
              </>
            )
          })()}
        </div>
      </div>
    </div>
  )
}

export default HorizontalFlowRiver
