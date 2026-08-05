import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import * as d3 from 'd3'
import { PRIMALS, PRIMAL_INDUSTRIES, INDUSTRIES, bridges, industryNodes, branchLinks, mergeLinks, PILL_CONFIG } from '../lib/ruleBreakTreeData'
import { isExperiential, isCoreNode, getExperienceLabel, NS_COLORS } from '../lib/experienceDomeConfig'
import { HUZZ_DOME_STATES, getHuzzDomeStats } from '../lib/huzzDomeData'

// Lookup: primal ID → primal color (for dome mode)
// Fire overridden to deeper amber-red so it's distinct from Story's orange
const PRIMAL_COLOR_MAP = Object.fromEntries(PRIMALS.map(p => [p.id, p.color]))
PRIMAL_COLOR_MAP['fire'] = '#ea580c'
import './RuleBreakTree.css'

const PRIMAL_R = 70
const BRIDGE_R = 120
const MIN_YEAR = 1100
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
  const [layer, setLayer] = useState(() => {
    const layerParam = new URLSearchParams(window.location.search).get('layer')
    return ['innovation', 'experience', 'dome'].includes(layerParam) ? layerParam : 'innovation'
  })
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [domeDetail, setDomeDetail] = useState('core') // 'core' | 'expanded'
  const [zoomScale, setZoomScale] = useState(1)
  const [hoveredNode, setHoveredNode] = useState(null)

  // NS states for experience layer — starts with Huzz's data (will be replaced by Supabase hook)
  const [domeStates, setDomeStates] = useState(() => ({ ...HUZZ_DOME_STATES }))

  // ═══════════════════════════════════════════
  //  LAYOUT COMPUTATION (useMemo)
  // ═══════════════════════════════════════════
  const { nodeMap, stars, cx, cy, maxR, yearScale } = useMemo(() => {
    const W = dimensions.w
    const H = dimensions.h
    const cx = W / 2
    const cy = H / 2
    const maxR = Math.min(W, H) * (layer === 'experience' ? 0.58 : 0.44) // dome uses 0.44 (same as innovation)

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
    const isExpanded = layer === 'experience'
    const isDomeLayout = layer === 'dome'
    const collideR = isExpanded ? 30 : isDomeLayout ? 18 : 22
    const forceStrength = isDomeLayout ? 0.7 : isExpanded ? 0.3 : 0.4
    if (simNodes.length > 0) {
      const simulation = d3.forceSimulation(simNodes)
        .force('collide', d3.forceCollide(collideR).strength(0.8).iterations(3))
        .force('x', d3.forceX(d => d.targetX).strength(forceStrength))
        .force('y', d3.forceY(d => d.targetY).strength(forceStrength))
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
  }, [dimensions, layer])

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
        setZoomScale(e.transform.k)
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

  const handleDomeRate = useCallback((nodeId, state) => {
    setDomeStates(prev => {
      if (!state) {
        const next = { ...prev }
        delete next[nodeId]
        return next
      }
      return { ...prev, [nodeId]: state }
    })
    // TODO: save to Supabase
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
        <h1>{layer === 'dome' ? 'Experience Dome' : layer === 'experience' ? 'Experience Map' : 'Rule Break Tree'}</h1>
        <p>{layer === 'dome'
          ? 'Your snowflake. Bright = love it. Dim = tried it. Dark = unexplored. Zoom to reveal.'
          : layer === 'experience'
          ? 'Your dome of safety. Bright = safe. Amber = growing. Dark = unexplored.'
          : 'From hunter-gatherer to AI. Each fork is a broken assumption. Where branches merge, new industries are born.'}</p>
        <div className="rbt-layer-toggle">
          <button
            className={`rbt-layer-btn ${layer === 'innovation' ? 'active' : ''}`}
            onClick={() => setLayer('innovation')}
          >Innovation</button>
          <button
            className={`rbt-layer-btn ${layer === 'experience' ? 'active' : ''}`}
            onClick={() => setLayer('experience')}
          >Experience</button>
          <button
            className={`rbt-layer-btn ${layer === 'dome' ? 'active' : ''}`}
            onClick={() => setLayer('dome')}
          >Dome</button>
        </div>
        {layer === 'experience' && (
          <div className="rbt-dome-detail-toggle">
            <button
              className={`rbt-dome-detail-btn ${domeDetail === 'core' ? 'active' : ''}`}
              onClick={() => setDomeDetail('core')}
            >Core</button>
            <button
              className={`rbt-dome-detail-btn ${domeDetail === 'expanded' ? 'active' : ''}`}
              onClick={() => setDomeDetail('expanded')}
            >All experiences</button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className={`rbt-filters ${filtersExpanded ? 'expanded' : ''}`}>
        <button
          className={`filter-pill filter-all ${activeFilters.size === allBranches.size ? 'active' : ''}`}
          onClick={toggleAll}
        >
          All
        </button>
        {PILL_CONFIG.filter(cfg => filtersExpanded || !cfg.subBranch).map(cfg => (
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
        <button
          className="filter-pill filter-more"
          onClick={() => setFiltersExpanded(p => !p)}
        >
          {filtersExpanded ? 'Less' : `+${PILL_CONFIG.filter(c => c.subBranch).length} more`}
        </button>
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
                  {layer === 'innovation' && (
                    <text className="decade-label" x={cx} y={cy - r + 12}>{yr}</text>
                  )}
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
                  stroke={p.color} opacity={layer !== 'innovation' ? 0.1 : 0.25} />
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
                  stroke={b.color} opacity={layer !== 'innovation' ? 0.1 : 0.25} />
              )
            })}

            {/* Branch links */}
            {branchLinks.map(([sId, tId], i) => {
              const s = nodeMap[sId]
              const t = nodeMap[tId]
              if (!s || !t) return null

              // Dome: hide links to pruned nodes
              if (layer === 'dome') {
                if (!sId.startsWith('b-') && !isExperiential(sId)) return null
                if (!tId.startsWith('b-') && !isExperiential(tId)) return null
              }
              // Experience mode: filter by visibility level
              if (layer === 'experience') {
                if (domeDetail === 'core') {
                  // Core mode uses spoke lines instead
                  return null
                }
                const sVisible = sId.startsWith('b-') || isExperiential(sId)
                const tVisible = tId.startsWith('b-') || isExperiential(tId)
                if (!sVisible || !tVisible) return null
              }

              const branch = t.branch || t.industry
              const col = INDUSTRIES[branch]?.color || '#888'
              const linkOpacity = layer === 'dome' ? 0.06 : layer === 'experience' ? 0.2 : 0.45
              return (
                <path key={`bl-${i}`}
                  className={`branch-line ${getHiddenClass(isBranchVisible(branch))} ${getTimelineClass(isLinkInTimeline(sId, tId))}`}
                  d={branchLinkPath(s, t)}
                  stroke={col} opacity={linkOpacity} />
              )
            })}

            {/* Core dome spokes — direct bridge-to-node lines in experience/core mode */}
            {layer === 'experience' && domeDetail === 'core' && industryNodes
              .filter(n => isCoreNode(n.id))
              .map(n => {
                const nn = nodeMap[n.id]
                const ind = INDUSTRIES[n.branch]
                if (!nn || !ind) return null
                const bridge = bridges.find(b => b.primal === ind.primal)
                if (!bridge) return null
                const bn = nodeMap[bridge.id]
                if (!bn) return null
                return (
                  <path key={`spoke-${n.id}`}
                    className={`branch-line ${getHiddenClass(isBranchVisible(n.branch))}`}
                    d={branchLinkPath(bn, nn)}
                    stroke={ind.color} opacity={0.25} />
                )
              })
            }

            {/* Merge lines + labels */}
            {mergeLinks.map((ml, i) => {
              const s = nodeMap[ml.from]
              const t = nodeMap[ml.to]
              if (!s || !t) return null
              // Hide in experience/core mode
              if (layer === 'experience' && domeDetail === 'core') return null
              // In dome + experience modes, hide unless hovered or selected
              if (layer === 'dome' || layer === 'experience') {
                if (!isExperiential(ml.from) || !isExperiential(ml.to)) return null
                const activeId = hoveredNode?.id || selectedNode?.id
                if (!activeId || (ml.from !== activeId && ml.to !== activeId)) return null
              }
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
            {layer === 'innovation' && Object.entries(INDUSTRIES).map(([key, ind]) => (
              <text key={`il-${key}`} className={`industry-label ${getHiddenClass(isBranchVisible(key))}`}
                x={cx + Math.cos(ind.baseAngle) * (maxR + 28)}
                y={cy + Math.sin(ind.baseAngle) * (maxR + 28)}
                fill={ind.color}>
                {ind.label}
              </text>
            ))}

            {/* Origin node */}
            <g className={`node-group ${layer !== 'innovation' ? 'dome-structural' : ''}`}
              transform={`translate(${cx},${cy})`}
              onClick={() => handleNodeClick(nodeMap['origin'])}>
              <circle className="origin-pulse" r={22} fill="rgba(255,255,255,0.08)" />
              {(() => { const dim = layer !== 'innovation'; return (<>
              <circle r={dim ? 10 : 16} fill="#0d0a1a" stroke="rgba(255,255,255,0.5)"
                strokeWidth={dim ? 1 : 2} opacity={dim ? 0.3 : 1} />
              <circle r={dim ? 3 : 5} fill="rgba(255,255,255,0.85)" opacity={dim ? 0.3 : 1} />
              {['Human', 'Experience'].map((l, i) => (
                <text key={i} className="node-label" y={(dim ? 18 : 28) + i * 12}
                  opacity={dim ? 0.2 : undefined}>{l}</text>
              ))}
              </>)})()}
            </g>

            {/* Primal nodes */}
            {PRIMALS.map(p => {
              const pn = nodeMap[p.id]
              if (!pn) return null
              const dim = layer !== 'innovation'
              const lx = Math.cos(p.angle) * 22
              const ly = Math.sin(p.angle) * 22
              return (
                <g key={p.id}
                  className={`node-group ${dim ? 'dome-structural' : ''} ${getHiddenClass(isPrimalVisible(p.id))} ${selectedNode?.id === p.id ? 'selected' : ''}`}
                  transform={`translate(${pn.x},${pn.y})`}
                  onClick={() => handleNodeClick(pn)}>
                  <circle className="node-glow" r={16} fill={p.color} />
                  <circle className="node-circle" r={dim ? 6 : 10} fill="#0d0a1a" stroke={p.color}
                    strokeWidth={dim ? 1 : 2} opacity={dim ? 0.3 : 1} />
                  <circle r={dim ? 2 : 3.5} fill={p.color} opacity={dim ? 0.2 : 0.6} />
                  <text className="primal-label" x={lx} y={ly + 4} fill={p.color} opacity={dim ? 0.25 : 0.8}>
                    {p.label}
                  </text>
                </g>
              )
            })}

            {/* Bridge nodes */}
            {bridges.map(b => {
              const bn = nodeMap[b.id]
              if (!bn) return null
              const dim = layer !== 'innovation'
              return (
                <g key={b.id}
                  className={`node-group ${dim ? 'dome-structural' : ''} ${getHiddenClass(isPrimalVisible(b.primal))} ${selectedNode?.id === b.id ? 'selected' : ''}`}
                  transform={`translate(${bn.x},${bn.y})`}
                  onClick={() => handleNodeClick(bn)}>
                  <circle className="node-glow" r={14} fill={b.color} />
                  <circle className="node-circle" r={dim ? 4 : 7} fill="#0d0a1a" stroke={b.color}
                    strokeWidth={dim ? 1 : 1.5} opacity={dim ? 0.25 : 0.6} />
                  {b.label.split('\n').map((l, i) => (
                    <text key={i} className="bridge-label" y={(dim ? 10 : 16) + i * 11}
                      opacity={dim ? 0.15 : undefined}>{l}</text>
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
              const isExp = layer === 'experience'
              const isDome = layer === 'dome'
              const isOverlay = isExp || isDome
              const nodeIsExp = isExperiential(n.id)

              // In experience/dome mode, hide non-experiential nodes
              if (isOverlay && !nodeIsExp) return null
              // In experience/core mode, only show core representative nodes
              if (isExp && domeDetail === 'core' && !isCoreNode(n.id)) return null

              const nsState = isOverlay ? domeStates[n.id] : null
              const nsConf = nsState ? NS_COLORS[nsState] : null

              // No NS data or bored = dark/hidden
              const isDark = isOverlay && (!nsState || nsState === 'bored')

              // Dome: tiny nodes. Experience: medium. Innovation: standard.
              const r = isDome ? 4 : isExp ? 7 : (isMerge ? 8 : isPrediction ? 7 : 6)
              const primalColor = PRIMAL_COLOR_MAP[ind.primal] || ind.color
              const baseColor = isMerge && !isOverlay ? '#E9A23B' : (isDome ? primalColor : ind.color)
              const nodeColor = nsConf?.color || baseColor

              // Glow intensity based on NS state
              const glowR = isDome ? 10 : isExp ? 14 : 10
              const glowOpacity = isOverlay
                ? (nsConf ? nsConf.glow * (isDome ? 0.4 : 0.5) : (isDome ? 0.01 : 0.03))
                : 0

              const displayLabel = isOverlay
                ? getExperienceLabel(n.id, n.label)
                : n.label

              // Dome: hide labels unless zoomed in or selected
              const showLabel = isDome ? (zoomScale > 2.5 || selectedNode?.id === n.id) : true

              return (
                <g key={n.id}
                  className={`node-group ${isPrediction && !isOverlay ? 'prediction-node' : ''} ${nsConf?.pulse ? 'dome-pulse' : ''} ${isDark ? 'dome-dark' : ''} ${isDome ? 'dome-node' : ''} ${getHiddenClass(isBranchVisible(n.branch))} ${getTimelineClass(isNodeInTimeline(nn))} ${selectedNode?.id === n.id ? 'selected' : ''}`}
                  transform={`translate(${nn.x},${nn.y})`}
                  onClick={() => handleNodeClick(nn)}
                  onMouseEnter={isOverlay ? () => setHoveredNode(nn) : undefined}
                  onMouseLeave={isOverlay ? () => setHoveredNode(null) : undefined}>
                  {/* Glow */}
                  <circle className={isOverlay && nsConf ? 'dome-glow' : 'node-glow'}
                    r={r + glowR}
                    fill={nodeColor}
                    opacity={glowOpacity} />
                  <circle className={`node-circle ${isPrediction && !isOverlay ? 'prediction-circle' : ''}`}
                    r={r}
                    fill={isDark ? '#0d0a1a' : (isOverlay && nsConf ? 'rgba(12,10,22,0.6)' : '#0d0a1a')}
                    stroke={nodeColor}
                    strokeWidth={isDome ? (nsConf ? 1.5 : 0.5) : (isExp && nsConf ? 2.5 : 2)}
                    strokeDasharray={isPrediction && !isOverlay ? '3 2' : (isDark ? '2 3' : 'none')}
                    opacity={isDark ? (isDome ? 0.25 : 0.2) : (isPrediction && !isOverlay ? 0.7 : 1)} />
                  {/* Inner fill for lit nodes */}
                  {isOverlay && nsConf && (
                    <circle r={r * (isDome ? 0.6 : 0.5)} fill={nodeColor} opacity={nsConf.glow * (isDome ? 0.9 : 0.7)} />
                  )}
                  {isMerge && !isOverlay && <circle r={3} fill="#E9A23B" />}
                  {isPrediction && !isOverlay && <circle r={2.5} fill={ind.color} opacity={0.5} />}
                  {!isOverlay && (
                    <text className="node-year" y={-(r + 4)}>
                      {isPrediction ? `${n.confidence === 'high' ? n.year - 1 : n.year - 2}–${n.confidence === 'high' ? n.year + 1 : n.year + 2}` : n.year}
                    </text>
                  )}
                  {showLabel && displayLabel.split('\n').map((l, i) => (
                    <text key={i} className={`node-label ${isDark ? 'dome-dark-label' : ''} ${isDome ? 'dome-zoom-label' : ''}`}
                      y={r + (isDome ? 8 : 13) + i * (isDome ? 9 : 11)}
                      fontSize={isDome ? 7 : undefined}
                      opacity={isDark ? 0.15 : (isDome ? 0.7 : undefined)}>
                      {l}
                    </text>
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
          {layer === 'experience' || layer === 'dome' ? (
            <>
              <div className="legend-item">
                <div className="legend-dot dome-legend-vr" />
                Love it
              </div>
              <div className="legend-item">
                <div className="legend-dot dome-legend-fun" />
                It's fun
              </div>
              <div className="legend-item">
                <div className="legend-dot dome-legend-pressure" />
                Stresses me
              </div>
              <div className="legend-item">
                <div className="legend-dot dome-legend-dark" />
                Unexplored
              </div>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>

        {/* Formula badge — innovation only */}
        {layer === 'innovation' && (
          <div className="rbt-formula">
            <strong>Rule Break Probability</strong> = Assumption Age &times; Adjacent Breaks &times; Capability Unlock &times; Pain Intensity &times; Two-Worlds Proximity
          </div>
        )}

        {/* Dome stats — experience + dome */}
        {(layer === 'experience' || layer === 'dome') && (() => {
          const allExpIds = industryNodes
            .filter(n => isExperiential(n.id) && (layer === 'dome' || domeDetail === 'expanded' || isCoreNode(n.id)))
            .map(n => n.id)
          const safe = allExpIds.filter(id => domeStates[id] === 'vibe_rise' || domeStates[id] === 'fun').length
          const growing = allExpIds.filter(id => domeStates[id] === 'pressure' || domeStates[id] === 'growth_edge').length
          const unexplored = allExpIds.filter(id => !domeStates[id] || domeStates[id] === 'bored').length
          return (
            <div className="rbt-dome-stats">
              <div className="dome-stats-demo-tag">Huzz's dome</div>
              <div className="dome-stat">
                <span className="dome-stat-num">{safe}</span>
                <span className="dome-stat-label">safe</span>
              </div>
              <div className="dome-stat">
                <span className="dome-stat-num">{growing}</span>
                <span className="dome-stat-label">growing</span>
              </div>
              <div className="dome-stat">
                <span className="dome-stat-num">{unexplored}</span>
                <span className="dome-stat-label">unexplored</span>
              </div>
            </div>
          )
        })()}

        {/* CTA → RemarkableFlow (innovation only) */}
        {layer === 'innovation' && (
          <div className="rbt-cta" onClick={() => navigate('/create/remarkable')}>
            <div className="rbt-cta-text">Every branch started with one person breaking one rule.</div>
            <div className="rbt-cta-button">Find yours &rarr;</div>
          </div>
        )}

        {/* Timeline controls (innovation only) */}
        {layer === 'innovation' && <div className="rbt-timeline">
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
        </div>}

        {/* Detail panel */}
        <div className={`rbt-detail-panel ${selectedNode ? 'open' : ''}`}>
          {selectedNode && (
            <>
              <button className="rbt-detail-close" onClick={() => setSelectedNode(null)}>
                &#10005;
              </button>

              {(layer === 'experience' || layer === 'dome') ? (
                <>
                  <div className="rbt-detail-name">
                    {getExperienceLabel(selectedNode.id, selectedNode.label)}
                  </div>
                  <div className="rbt-detail-section">
                    <div className="rbt-detail-section-label">How does this feel?</div>
                    <div className="rbt-dome-rate-picker">
                      {[
                        { key: 'vibe_rise', label: 'Love it', icon: '✦' },
                        { key: 'fun', label: "It's fun", icon: '○' },
                        { key: 'growth_edge', label: 'Growth edge', icon: '↗' },
                        { key: 'pressure', label: 'Stresses me', icon: '◇' },
                        { key: 'bored', label: 'Bored', icon: '—' },
                      ].map(opt => (
                        <button
                          key={opt.key}
                          className={`rbt-dome-rate-btn ${domeStates[selectedNode.id] === opt.key ? 'active' : ''}`}
                          onClick={() => handleDomeRate(
                            selectedNode.id,
                            domeStates[selectedNode.id] === opt.key ? null : opt.key
                          )}
                        >
                          <span className="rbt-dome-rate-icon">{opt.icon}</span>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {selectedNode.branch && (
                    <div className="rbt-detail-section">
                      <div className="rbt-detail-section-label">Branch</div>
                      <div className="rbt-detail-desc" style={{ color: INDUSTRIES[selectedNode.branch]?.color }}>
                        {INDUSTRIES[selectedNode.branch]?.label || selectedNode.branch}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
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
                </>
              )}

              {branchPath.length > 0 && (
                <div className="rbt-detail-section">
                  <div className="rbt-detail-section-label">Branch Path</div>
                  <div className="rbt-detail-path">
                    {[...branchPath].reverse()
                      .filter(node => {
                        if (layer === 'innovation') return true
                        if (node.nodeType === 'bridge') return true
                        if (!isExperiential(node.id)) return false
                        if (layer === 'experience' && domeDetail === 'core' && !isCoreNode(node.id)) return false
                        return true
                      })
                      .map((node, i) => {
                      const isCurrent = node.id === selectedNode.id
                      const col = node.type === 'merge' ? '#E9A23B' : (INDUSTRIES[node.branch]?.color || node.color || '#888')
                      const isOvr = layer !== 'innovation'
                      const label = isOvr
                        ? getExperienceLabel(node.id, node.label)
                        : (node.label || '').replace(/\n/g, ' ')
                      return (
                        <React.Fragment key={node.id}>
                          {i > 0 && <div className="rbt-path-arrow">&uarr;</div>}
                          <div
                            className={`rbt-path-node ${isCurrent ? 'current' : ''}`}
                            onClick={() => handleNodeClick(node)}
                          >
                            <div className="rbt-path-dot" style={{ background: col }} />
                            <span>{label}</span>
                            {node.year && layer === 'innovation' && <span className="rbt-path-year">{node.year}</span>}
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
