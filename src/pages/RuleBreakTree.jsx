import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import * as d3 from 'd3'
import { PRIMALS, PRIMAL_INDUSTRIES, INDUSTRIES, bridges, industryNodes, branchLinks, mergeLinks, PILL_CONFIG } from '../lib/ruleBreakTreeData'
import './RuleBreakTree.css'

const PRIMAL_R = 70
const BRIDGE_R = 120
const MIN_YEAR = 1400
const MAX_YEAR = 2025
const DECADE_YEARS = [1500, 1800, 1880, 1920, 1960, 2000]
const STAR_COUNT = 120
const SPEEDS = [1, 2, 5]

export default function RuleBreakTree() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const svgRef = useRef(null)
  const containerRef = useRef(null)
  const zoomRef = useRef(null)
  const gRef = useRef(null)
  const animFrameRef = useRef(null)
  const lastTickRef = useRef(null)

  // All branch ids
  const allBranches = useMemo(() => {
    const set = new Set()
    Object.keys(INDUSTRIES).forEach(k => set.add(k))
    return set
  }, [])

  // Dimensions state (triggers re-render on resize)
  const [dimensions, setDimensions] = useState({ w: 800, h: 600 })

  useEffect(() => {
    function measure() {
      const el = containerRef.current
      if (el) setDimensions({ w: el.clientWidth, h: el.clientHeight })
    }
    measure()
    // Use ResizeObserver for responsive updates
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver(() => measure())
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // State
  const [selectedNode, setSelectedNode] = useState(null)
  const [activeFilters, setActiveFilters] = useState(() => {
    const branchParam = new URLSearchParams(window.location.search).get('branch')
    const branches = new Set(Object.keys(INDUSTRIES))
    if (branchParam && branches.has(branchParam)) {
      return new Set([branchParam])
    }
    return branches
  })
  const [animationYear, setAnimationYear] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speedIdx, setSpeedIdx] = useState(0)

  // ═══════════════════════════════════════════
  //  LAYOUT COMPUTATION (useMemo)
  // ═══════════════════════════════════════════
  const { nodeMap, stars, cx, cy, maxR, yearScale } = useMemo(() => {
    const W = dimensions.w
    const H = dimensions.h
    const cx = W / 2
    const cy = H / 2
    const maxR = Math.min(W, H) * 0.44

    const yearScale = d3.scaleLinear()
      .domain([1400, 1850, 2030])
      .range([BRIDGE_R + 35, BRIDGE_R + 75, maxR])

    const map = {}

    // Origin
    map['origin'] = { id: 'origin', x: cx, y: cy, type: 'origin', label: 'Human\nExperience' }

    // Primals
    PRIMALS.forEach(p => {
      const x = cx + Math.cos(p.angle) * PRIMAL_R
      const y = cy + Math.sin(p.angle) * PRIMAL_R
      map[p.id] = { ...p, x, y, nodeType: 'primal' }
    })

    // Bridges
    bridges.forEach(b => {
      const primal = PRIMALS.find(p => p.id === b.primal)
      const angle = primal.angle
      const x = cx + Math.cos(angle) * BRIDGE_R
      const y = cy + Math.sin(angle) * BRIDGE_R
      map[b.id] = { ...b, x, y, angle, nodeType: 'bridge' }
    })

    // Industry nodes: compute ideal position, then resolve overlaps with D3 force
    const simNodes = []
    industryNodes.forEach(n => {
      const ind = INDUSTRIES[n.branch]
      if (!ind) return
      const siblings = industryNodes.filter(m => m.branch === n.branch)
      const idx = siblings.indexOf(n)
      const spread = Math.min(0.08, 1.0 / Math.max(siblings.length - 1, 1))
      const totalSpread = (siblings.length - 1) * spread
      const angle = ind.baseAngle - totalSpread / 2 + idx * spread
      const r = yearScale(n.year)
      const tx = cx + Math.cos(angle) * r
      const ty = cy + Math.sin(angle) * r
      const entry = { ...n, x: tx, y: ty, targetX: tx, targetY: ty, industry: n.branch, nodeType: 'industry' }
      map[n.id] = entry
      simNodes.push(entry)
    })

    // Force simulation: forceX/forceY toward ideal positions, forceCollide to prevent overlap
    if (simNodes.length > 0) {
      const simulation = d3.forceSimulation(simNodes)
        .force('collide', d3.forceCollide(22).strength(0.8).iterations(3))
        .force('x', d3.forceX(d => d.targetX).strength(0.4))
        .force('y', d3.forceY(d => d.targetY).strength(0.4))
        .stop()

      for (let i = 0; i < 300; i++) simulation.tick()

      simNodes.forEach(n => {
        map[n.id].x = n.x
        map[n.id].y = n.y
      })
    }

    // Star field (deterministic seed via index, not random, to avoid re-roll on resize)
    const starData = []
    for (let i = 0; i < STAR_COUNT; i++) {
      // Use a simple hash of i for pseudo-random but stable positions
      const h1 = Math.sin(i * 127.1 + 311.7) * 0.5 + 0.5
      const h2 = Math.sin(i * 269.5 + 183.3) * 0.5 + 0.5
      const h3 = Math.sin(i * 419.2 + 71.9) * 0.5 + 0.5
      const h4 = Math.sin(i * 613.7 + 543.1) * 0.5 + 0.5
      starData.push({
        cx: cx + (h1 - 0.5) * W * 1.5,
        cy: cy + (h2 - 0.5) * H * 1.5,
        r: h3 * 1 + 0.2,
        opacity: h4 * 0.10 + 0.02,
      })
    }

    return { nodeMap: map, stars: starData, cx, cy, maxR, yearScale }
  }, [dimensions])

  // ═══════════════════════════════════════════
  //  URL PARAMS (initial node selection)
  // ═══════════════════════════════════════════
  useEffect(() => {
    const nodeParam = searchParams.get('node')
    if (nodeParam && nodeMap[nodeParam]) {
      setSelectedNode(nodeMap[nodeParam])
    }
  }, [searchParams, nodeMap])

  // ═══════════════════════════════════════════
  //  ZOOM SETUP
  // ═══════════════════════════════════════════
  useEffect(() => {
    if (!svgRef.current) return
    const svg = d3.select(svgRef.current)
    const zoom = d3.zoom()
      .scaleExtent([0.3, 10])
      .on('zoom', (e) => {
        d3.select(gRef.current).attr('transform', e.transform)
      })
    svg.call(zoom)
    zoomRef.current = zoom
  }, [])

  // ═══════════════════════════════════════════
  //  TIMELINE ANIMATION
  // ═══════════════════════════════════════════
  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
        animFrameRef.current = null
      }
      lastTickRef.current = null
      return
    }

    const speed = SPEEDS[speedIdx]
    const yearsPerSecond = 30 * speed

    function tick(timestamp) {
      if (!lastTickRef.current) lastTickRef.current = timestamp
      const elapsed = (timestamp - lastTickRef.current) / 1000
      lastTickRef.current = timestamp

      setAnimationYear(prev => {
        const current = prev ?? MIN_YEAR
        const next = current + elapsed * yearsPerSecond
        if (next >= MAX_YEAR) {
          setIsPlaying(false)
          return MAX_YEAR
        }
        return next
      })

      animFrameRef.current = requestAnimationFrame(tick)
    }

    animFrameRef.current = requestAnimationFrame(tick)

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
        animFrameRef.current = null
      }
    }
  }, [isPlaying, speedIdx])

  // ═══════════════════════════════════════════
  //  CALLBACKS
  // ═══════════════════════════════════════════
  const handleZoomIn = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return
    d3.select(svgRef.current).transition().duration(300).call(zoomRef.current.scaleBy, 1.6)
  }, [])

  const handleZoomOut = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return
    d3.select(svgRef.current).transition().duration(300).call(zoomRef.current.scaleBy, 0.625)
  }, [])

  const handleZoomReset = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return
    d3.select(svgRef.current).transition().duration(500).call(zoomRef.current.transform, d3.zoomIdentity)
  }, [])

  const handleNodeClick = useCallback((node) => {
    setSelectedNode(prev => prev?.id === node.id ? null : node)
  }, [])

  const toggleFilter = useCallback((branchId) => {
    setActiveFilters(prev => {
      const next = new Set(prev)
      if (next.has(branchId)) next.delete(branchId)
      else next.add(branchId)
      return next
    })
  }, [])

  const toggleAll = useCallback(() => {
    setActiveFilters(prev => {
      if (prev.size === allBranches.size) return new Set()
      return new Set(allBranches)
    })
  }, [allBranches])

  const handlePlayPause = useCallback(() => {
    if (!isPlaying && animationYear === null) {
      setAnimationYear(MIN_YEAR)
    }
    setIsPlaying(p => !p)
  }, [isPlaying, animationYear])

  const handleSliderChange = useCallback((e) => {
    setAnimationYear(Number(e.target.value))
    setIsPlaying(false)
  }, [])

  const handleSpeedCycle = useCallback(() => {
    setSpeedIdx(prev => (prev + 1) % SPEEDS.length)
  }, [])

  const handleResetTimeline = useCallback(() => {
    setAnimationYear(null)
    setIsPlaying(false)
  }, [])

  // ═══════════════════════════════════════════
  //  VISIBILITY HELPERS
  // ═══════════════════════════════════════════
  const isBranchVisible = useCallback((branch) => {
    return activeFilters.has(branch)
  }, [activeFilters])

  const isPrimalVisible = useCallback((primalId) => {
    const children = PRIMAL_INDUSTRIES[primalId] || []
    if (children.length === 0) return activeFilters.has(primalId)
    return children.some(ci => activeFilters.has(ci))
  }, [activeFilters])

  const isMergeVisible = useCallback((ml) => {
    const fromNode = nodeMap[ml.from]
    const toNode = nodeMap[ml.to]
    const fb = fromNode?.branch || fromNode?.industry
    const tb = toNode?.branch || toNode?.industry
    return activeFilters.has(fb) && activeFilters.has(tb)
  }, [activeFilters, nodeMap])

  const isNodeInTimeline = useCallback((node) => {
    if (animationYear === null) return true
    if (node.year) return node.year <= animationYear
    return true
  }, [animationYear])

  const isLinkInTimeline = useCallback((sId, tId) => {
    if (animationYear === null) return true
    const s = nodeMap[sId]
    const t = nodeMap[tId]
    const sVis = s?.year ? s.year <= animationYear : true
    const tVis = t?.year ? t.year <= animationYear : true
    return sVis && tVis
  }, [animationYear, nodeMap])

  const isMergeInTimeline = useCallback((ml) => {
    if (animationYear === null) return true
    const s = nodeMap[ml.from]
    const t = nodeMap[ml.to]
    const sVis = s?.year ? s.year <= animationYear : true
    const tVis = t?.year ? t.year <= animationYear : true
    return sVis && tVis
  }, [animationYear, nodeMap])

  // ═══════════════════════════════════════════
  //  BRANCH PATH (for detail panel)
  // ═══════════════════════════════════════════
  const branchPath = useMemo(() => {
    if (!selectedNode?.branch && !selectedNode?.industry) return []
    const branch = selectedNode.branch || selectedNode.industry
    // Build adjacency for this branch
    const linkMap = {}
    branchLinks.forEach(([s, t]) => {
      const sNode = nodeMap[s]
      const tNode = nodeMap[t]
      if (!sNode || !tNode) return
      const tb = tNode.branch || tNode.industry
      if (tb === branch || (sNode.nodeType === 'bridge' && tNode.branch === branch)) {
        if (!linkMap[s]) linkMap[s] = []
        linkMap[s].push(t)
      }
    })

    // Walk from bridge root
    const bridge = bridges.find(b => b.branch === branch)
    if (!bridge) return []

    const chain = [bridge.id]
    let current = bridge.id
    while (linkMap[current] && linkMap[current].length > 0) {
      const next = linkMap[current].find(n => {
        const node = nodeMap[n]
        return node && (node.branch === branch || node.industry === branch)
      })
      if (!next || chain.includes(next)) break
      chain.push(next)
      current = next
    }

    return chain.map(id => nodeMap[id]).filter(Boolean)
  }, [selectedNode, nodeMap])

  // ═══════════════════════════════════════════
  //  RENDER HELPERS
  // ═══════════════════════════════════════════
  function getTimelineClass(visible) {
    if (animationYear === null) return ''
    return visible ? 'timeline-visible' : 'timeline-hidden'
  }

  function getHiddenClass(visible) {
    return visible ? '' : 'hidden'
  }

  function branchLinkPath(s, t) {
    const mx = (s.x + t.x) / 2
    const my = (s.y + t.y) / 2
    const dx = t.x - s.x
    const dy = t.y - s.y
    return `M${s.x},${s.y} Q${mx + dy * 0.05},${my - dx * 0.05} ${t.x},${t.y}`
  }

  function mergeLinkPath(s, t) {
    const mx = (s.x + t.x) / 2
    const my = (s.y + t.y) / 2
    const cpx = mx + (cx - mx) * 0.35
    const cpy = my + (cy - my) * 0.35
    return `M${s.x},${s.y} Q${cpx},${cpy} ${t.x},${t.y}`
  }

  function mergeLabelPos(s, t) {
    const mx = (s.x + t.x) / 2
    const my = (s.y + t.y) / 2
    const cpx = mx + (cx - mx) * 0.35
    const cpy = my + (cy - my) * 0.35
    return { x: (s.x + 2 * cpx + t.x) / 4, y: (s.y + 2 * cpy + t.y) / 4 }
  }

  // ═══════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════
  return (
    <div className="rule-break-tree">
      {/* Header */}
      <div className="rbt-header">
        <button className="rbt-back-btn" onClick={() => navigate(-1)}>Back</button>
        <h1>Rule Break Tree</h1>
        <p>From hunter-gatherer to AI. Each fork is a broken assumption. Where branches merge, new industries are born.</p>
      </div>

      {/* Filters */}
      <div className="rbt-filters">
        <button
          className={`filter-pill filter-all ${activeFilters.size === allBranches.size ? 'active' : ''}`}
          onClick={toggleAll}
        >
          All
        </button>
        {PILL_CONFIG.map(cfg => (
          <button
            key={cfg.id}
            className={`filter-pill ${activeFilters.has(cfg.id) ? 'active' : ''}`}
            style={{
              borderColor: cfg.color,
              background: activeFilters.has(cfg.id) ? cfg.color + '25' : 'transparent',
            }}
            onClick={() => toggleFilter(cfg.id)}
          >
            {cfg.label}
          </button>
        ))}
      </div>

      {/* Tree */}
      <div className="rbt-tree-container" ref={containerRef}>
        <svg ref={svgRef}>
          <g ref={gRef}>
            {/* Stars */}
            {stars.map((s, i) => (
              <circle key={`star-${i}`} cx={s.cx} cy={s.cy} r={s.r}
                fill={`rgba(255,255,255,${s.opacity})`} />
            ))}

            {/* Origin glow */}
            <circle className="origin-glow" cx={cx} cy={cy} r={32} fill="rgba(94,23,235,0.08)" />
            <circle className="origin-glow" cx={cx} cy={cy} r={50} fill="rgba(233,162,59,0.03)"
              style={{ animationDelay: '-2s' }} />

            {/* Primal ring */}
            <circle className="primal-ring" cx={cx} cy={cy} r={PRIMAL_R} />

            {/* Decade rings */}
            {DECADE_YEARS.map(yr => {
              const r = yearScale(yr)
              return (
                <g key={`decade-${yr}`}>
                  <circle className="decade-ring" cx={cx} cy={cy} r={r} />
                  <text className="decade-label" x={cx} y={cy - r + 12}>{yr}</text>
                </g>
              )
            })}

            {/* Origin -> primal lines */}
            {PRIMALS.map(p => {
              const pn = nodeMap[p.id]
              if (!pn) return null
              return (
                <line key={`op-${p.id}`} className={`branch-line ${getHiddenClass(isPrimalVisible(p.id))}`}
                  x1={cx} y1={cy} x2={pn.x} y2={pn.y}
                  stroke={p.color} opacity={0.25} />
              )
            })}

            {/* Primal -> bridge lines */}
            {bridges.map(b => {
              const pn = nodeMap[b.primal]
              const bn = nodeMap[b.id]
              if (!pn || !bn) return null
              return (
                <line key={`pb-${b.id}`} className={`branch-line ${getHiddenClass(isPrimalVisible(b.primal))}`}
                  x1={pn.x} y1={pn.y} x2={bn.x} y2={bn.y}
                  stroke={b.color} opacity={0.25} />
              )
            })}

            {/* Branch links */}
            {branchLinks.map(([sId, tId], i) => {
              const s = nodeMap[sId]
              const t = nodeMap[tId]
              if (!s || !t) return null
              const branch = t.branch || t.industry
              const col = INDUSTRIES[branch]?.color || '#888'
              return (
                <path key={`bl-${i}`}
                  className={`branch-line ${getHiddenClass(isBranchVisible(branch))} ${getTimelineClass(isLinkInTimeline(sId, tId))}`}
                  d={branchLinkPath(s, t)}
                  stroke={col} opacity={0.45} />
              )
            })}

            {/* Merge lines + labels */}
            {mergeLinks.map((ml, i) => {
              const s = nodeMap[ml.from]
              const t = nodeMap[ml.to]
              if (!s || !t) return null
              const vis = isMergeVisible(ml) && isMergeInTimeline(ml)
              const path = mergeLinkPath(s, t)
              const lp = mergeLabelPos(s, t)
              const lines = ml.label.split('\n')
              const lh = 10
              const bgH = lines.length * lh + 5
              return (
                <g key={`merge-${i}`} className={getHiddenClass(vis)}>
                  <path className="merge-line" d={path} stroke="#E9A23B" />
                  <rect className="merge-label-bg"
                    x={lp.x - 46} y={lp.y - bgH / 2} width={92} height={bgH} rx={3} />
                  {lines.map((line, li) => (
                    <text key={li} className="merge-label-text"
                      x={lp.x} y={lp.y - bgH / 2 + 9 + li * lh}>
                      {line}
                    </text>
                  ))}
                </g>
              )
            })}

            {/* Industry labels at outer edge */}
            {Object.entries(INDUSTRIES).map(([key, ind]) => (
              <text key={`il-${key}`} className={`industry-label ${getHiddenClass(isBranchVisible(key))}`}
                x={cx + Math.cos(ind.baseAngle) * (maxR + 28)}
                y={cy + Math.sin(ind.baseAngle) * (maxR + 28)}
                fill={ind.color}>
                {ind.label}
              </text>
            ))}

            {/* Origin node */}
            <g className="node-group" transform={`translate(${cx},${cy})`}
              onClick={() => handleNodeClick(nodeMap['origin'])}>
              <circle className="origin-pulse" r={22} fill="rgba(255,255,255,0.08)" />
              <circle r={16} fill="#0d0a1a" stroke="rgba(255,255,255,0.5)" strokeWidth={2} />
              <circle r={5} fill="rgba(255,255,255,0.85)" />
              {['Human', 'Experience'].map((l, i) => (
                <text key={i} className="node-label" y={28 + i * 12}>{l}</text>
              ))}
            </g>

            {/* Primal nodes */}
            {PRIMALS.map(p => {
              const pn = nodeMap[p.id]
              if (!pn) return null
              const lx = Math.cos(p.angle) * 22
              const ly = Math.sin(p.angle) * 22
              return (
                <g key={p.id}
                  className={`node-group ${getHiddenClass(isPrimalVisible(p.id))} ${selectedNode?.id === p.id ? 'selected' : ''}`}
                  transform={`translate(${pn.x},${pn.y})`}
                  onClick={() => handleNodeClick(pn)}>
                  <circle className="node-glow" r={16} fill={p.color} />
                  <circle className="node-circle" r={10} fill="#0d0a1a" stroke={p.color} strokeWidth={2} />
                  <circle r={3.5} fill={p.color} opacity={0.6} />
                  <text className="primal-label" x={lx} y={ly + 4} fill={p.color} opacity={0.8}>
                    {p.label}
                  </text>
                </g>
              )
            })}

            {/* Bridge nodes */}
            {bridges.map(b => {
              const bn = nodeMap[b.id]
              if (!bn) return null
              return (
                <g key={b.id}
                  className={`node-group ${getHiddenClass(isPrimalVisible(b.primal))} ${selectedNode?.id === b.id ? 'selected' : ''}`}
                  transform={`translate(${bn.x},${bn.y})`}
                  onClick={() => handleNodeClick(bn)}>
                  <circle className="node-glow" r={14} fill={b.color} />
                  <circle className="node-circle" r={7} fill="#0d0a1a" stroke={b.color} strokeWidth={1.5} opacity={0.6} />
                  {b.label.split('\n').map((l, i) => (
                    <text key={i} className="bridge-label" y={16 + i * 11}>{l}</text>
                  ))}
                </g>
              )
            })}

            {/* Industry nodes */}
            {industryNodes.map(n => {
              const nn = nodeMap[n.id]
              if (!nn) return null
              const ind = INDUSTRIES[n.branch]
              if (!ind) return null
              const isMerge = n.type === 'merge'
              const isPrediction = n.type === 'prediction'
              const r = isMerge ? 8 : isPrediction ? 7 : 6
              const nodeColor = isMerge ? '#E9A23B' : ind.color
              return (
                <g key={n.id}
                  className={`node-group ${isPrediction ? 'prediction-node' : ''} ${getHiddenClass(isBranchVisible(n.branch))} ${getTimelineClass(isNodeInTimeline(nn))} ${selectedNode?.id === n.id ? 'selected' : ''}`}
                  transform={`translate(${nn.x},${nn.y})`}
                  onClick={() => handleNodeClick(nn)}>
                  <circle className="node-glow" r={r + 10} fill={nodeColor} />
                  <circle className={`node-circle ${isPrediction ? 'prediction-circle' : ''}`} r={r} fill="#0d0a1a"
                    stroke={nodeColor}
                    strokeDasharray={isPrediction ? '3 2' : 'none'}
                    opacity={isPrediction ? 0.7 : 1} />
                  {isMerge && <circle r={3} fill="#E9A23B" />}
                  {isPrediction && <circle r={2.5} fill={ind.color} opacity={0.5} />}
                  <text className="node-year" y={-(r + 4)}>
                    {isPrediction ? `${n.confidence === 'high' ? n.year - 1 : n.year - 2}–${n.confidence === 'high' ? n.year + 1 : n.year + 2}` : n.year}
                  </text>
                  {n.label.split('\n').map((l, i) => (
                    <text key={i} className="node-label" y={r + 13 + i * 11}>{l}</text>
                  ))}
                </g>
              )
            })}
          </g>
        </svg>

        {/* Zoom controls */}
        <div className="rbt-zoom-controls">
          <button className="zoom-btn" onClick={handleZoomIn}>+</button>
          <button className="zoom-btn" onClick={handleZoomOut}>&minus;</button>
          <button className="zoom-btn" onClick={handleZoomReset}>&#9673;</button>
        </div>

        {/* Legend */}
        <div className="rbt-legend">
          <div className="legend-item">
            <div className="legend-dot" style={{ background: 'rgba(255,255,255,0.5)' }} />
            Primal
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: '#7c3aed' }} />
            Rule break
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: '#E9A23B' }} />
            Industry merge
          </div>
          <div className="legend-item">
            <div className="legend-dash" />
            Merge line
          </div>
        </div>

        {/* Formula badge */}
        <div className="rbt-formula">
          <strong>Rule Break Probability</strong> = Assumption Age &times; Adjacent Breaks &times; Capability Unlock &times; Pain Intensity &times; Two-Worlds Proximity
        </div>

        {/* CTA → RemarkableFlow */}
        <div className="rbt-cta" onClick={() => navigate('/create/remarkable')}>
          <div className="rbt-cta-text">Every branch started with one person breaking one rule.</div>
          <div className="rbt-cta-button">Find yours &rarr;</div>
        </div>

        {/* Timeline controls */}
        <div className="rbt-timeline">
          <button className="rbt-timeline-btn" onClick={handlePlayPause}>
            {isPlaying ? '\u23F8' : '\u25B6'}
          </button>
          <input
            type="range"
            className="rbt-timeline-slider"
            min={MIN_YEAR}
            max={MAX_YEAR}
            step={1}
            value={animationYear ?? MAX_YEAR}
            onChange={handleSliderChange}
          />
          <span className="rbt-timeline-year">
            {animationYear !== null ? Math.round(animationYear) : 'All'}
          </span>
          <button className="rbt-timeline-speed" onClick={handleSpeedCycle}>
            {SPEEDS[speedIdx]}x
          </button>
          {animationYear !== null && (
            <button className="rbt-timeline-btn" onClick={handleResetTimeline} title="Show all">
              &#10005;
            </button>
          )}
        </div>

        {/* Detail panel */}
        <div className={`rbt-detail-panel ${selectedNode ? 'open' : ''}`}>
          {selectedNode && (
            <>
              <button className="rbt-detail-close" onClick={() => setSelectedNode(null)}>
                &#10005;
              </button>

              {selectedNode.who && (
                <div className="rbt-detail-who"
                  style={{ color: selectedNode.type === 'merge' ? '#E9A23B' : (INDUSTRIES[selectedNode.branch]?.color || '#fff') }}>
                  {selectedNode.who}
                </div>
              )}
              {selectedNode.year && (
                <div className="rbt-detail-year">
                  {selectedNode.type === 'prediction'
                    ? `${selectedNode.confidence === 'high' ? selectedNode.year - 1 : selectedNode.year - 2}–${selectedNode.confidence === 'high' ? selectedNode.year + 1 : selectedNode.year + 2} (${selectedNode.confidence} confidence)`
                    : selectedNode.year}
                </div>
              )}

              <div className="rbt-detail-name">
                {(selectedNode.label || '').replace(/\n/g, ' ')}
              </div>

              {selectedNode.desc && (
                <div className="rbt-detail-section">
                  <div className="rbt-detail-desc">{selectedNode.desc}</div>
                </div>
              )}

              {selectedNode.assumption && (
                <div className="rbt-detail-section">
                  <div className="rbt-detail-section-label">The Rule</div>
                  <div className="rbt-detail-rule">{selectedNode.assumption}</div>
                </div>
              )}

              {selectedNode.ruleBreak && (
                <div className="rbt-detail-section">
                  <div className="rbt-detail-section-label">The Break</div>
                  <div className="rbt-detail-break">{selectedNode.ruleBreak}</div>
                </div>
              )}

              {selectedNode.mergeWith && (
                <div className="rbt-detail-merge">
                  Merge: {selectedNode.branch} x {selectedNode.mergeWith}
                </div>
              )}

              {branchPath.length > 0 && (
                <div className="rbt-detail-section">
                  <div className="rbt-detail-section-label">Branch Path</div>
                  <div className="rbt-detail-path">
                    {[...branchPath].reverse().map((node, i) => {
                      const isCurrent = node.id === selectedNode.id
                      const col = node.type === 'merge' ? '#E9A23B' : (INDUSTRIES[node.branch]?.color || node.color || '#888')
                      return (
                        <React.Fragment key={node.id}>
                          {i > 0 && <div className="rbt-path-arrow">&uarr;</div>}
                          <div
                            className={`rbt-path-node ${isCurrent ? 'current' : ''}`}
                            onClick={() => handleNodeClick(node)}
                          >
                            <div className="rbt-path-dot" style={{ background: col }} />
                            <span>{(node.label || '').replace(/\n/g, ' ')}</span>
                            {node.year && <span className="rbt-path-year">{node.year}</span>}
                          </div>
                        </React.Fragment>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
