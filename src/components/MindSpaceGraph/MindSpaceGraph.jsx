/**
 * MindSpaceGraph.jsx
 *
 * Force-directed graph visualization for Mind Space extraction data.
 * Shows skills, problems, personas, themes, and curiosity gaps as connected nodes.
 *
 * Features:
 * - Shrunk preview mode (static) with expand button
 * - Fullscreen interactive mode with zoom/pan/drag
 * - Node detail panel on click
 * - Entrance animation
 */

import React, { useEffect, useRef, useState, useCallback } from 'react'
import * as d3 from 'd3'
import NodeDetailPanel from './NodeDetailPanel'
import './MindSpaceGraph.css'

// Color palette
const COLORS = {
  skills: '#f97316',      // Orange
  problems: '#a855f7',    // Purple
  personas: '#22c55e',    // Green
  themes: '#94a3b8',      // Gray
  curiosityGaps: '#fbbf24', // Amber (dashed)
  northStar: '#fbbf24',   // Gold
  background: '#1a1a2e',
  text: '#f1f5f9',
  textMuted: '#94a3b8',
  link: '#475569',
  linkHighlight: '#818cf8'
}

// User level weights for sizing
const LEVEL_WEIGHTS = {
  // Skills
  emerging: 1,
  establishing: 1.3,
  mastering: 1.6,
  learning: 1,
  practicing: 1.3,
  // Problems
  exploring: 1,
  pursuing: 1.3,
  proven: 1.6,
  // Personas
  awakening: 1,
  struggling: 1.3,
  ready: 1.6
}

// Frequency weights
const FREQUENCY_WEIGHTS = {
  Low: 1,
  Medium: 1.25,
  High: 1.5
}

export default function MindSpaceGraph({ data }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedNode, setSelectedNode] = useState(null)
  const [graphData, setGraphData] = useState({ nodes: [], links: [] })

  // Build graph data from input
  const buildGraphData = useCallback((width, height) => {
    if (!data) return { nodes: [], links: [] }

    const nodes = []
    const links = []
    const nodeMap = new Map()

    // Helper to calculate node size
    const calcSize = (item, isStarred) => {
      const baseSize = 12
      const levelWeight = LEVEL_WEIGHTS[item.userLevel] || 1
      const freqWeight = FREQUENCY_WEIGHTS[item.frequency] || 1
      const starBonus = isStarred ? 1.4 : 1
      return baseSize * levelWeight * freqWeight * starBonus
    }

    // Add Skills
    data.skills?.forEach((skill, idx) => {
      const isStarred = data.starredSkills?.includes(idx)
      const node = {
        id: `skill-${idx}`,
        type: 'skills',
        label: 'SKILLS',
        name: skill.name,
        evidence: skill.evidence,
        frequency: skill.frequency,
        category: skill.category,
        mappedTo: skill.mappedTo,
        userLevel: skill.userLevel,
        isStarred,
        size: calcSize(skill, isStarred),
        color: COLORS.skills
      }
      nodes.push(node)
      nodeMap.set(skill.name.toLowerCase(), node)
    })

    // Add Problems
    data.problems?.forEach((problem, idx) => {
      const isStarred = data.starredProblems?.includes(idx)
      const node = {
        id: `problem-${idx}`,
        type: 'problems',
        label: 'PROBLEMS',
        name: problem.name,
        evidence: problem.evidence,
        frequency: problem.frequency,
        emotionalCharge: problem.emotionalCharge,
        mappedTo: problem.mappedTo,
        userLevel: problem.userLevel,
        isStarred,
        size: calcSize(problem, isStarred),
        color: COLORS.problems
      }
      nodes.push(node)
      nodeMap.set(problem.name.toLowerCase(), node)
    })

    // Add Personas
    data.personas?.forEach((persona, idx) => {
      const isStarred = data.starredPersonas?.includes(idx)
      const node = {
        id: `persona-${idx}`,
        type: 'personas',
        label: 'PERSONAS',
        name: persona.name,
        evidence: persona.evidence,
        frequency: persona.frequency,
        connection: persona.connection,
        mappedTo: persona.mappedTo,
        userLevel: persona.userLevel,
        isStarred,
        size: calcSize(persona, isStarred),
        color: COLORS.personas
      }
      nodes.push(node)
      nodeMap.set(persona.name.toLowerCase(), node)
    })

    // Add Themes (smaller connector nodes)
    data.themes?.forEach((theme, idx) => {
      const node = {
        id: `theme-${idx}`,
        type: 'themes',
        label: 'THEMES',
        name: theme.name,
        connects: theme.connects,
        size: 8,
        color: COLORS.themes
      }
      nodes.push(node)
      nodeMap.set(theme.name.toLowerCase(), node)

      // Create links from theme to connected items
      if (theme.connects) {
        const connectTerms = theme.connects.toLowerCase().split(/[,&]+/).map(s => s.trim())
        connectTerms.forEach(term => {
          nodeMap.forEach((targetNode, key) => {
            if (key.includes(term) || term.includes(key.split(' ')[0])) {
              links.push({
                source: node.id,
                target: targetNode.id,
                type: 'theme-connection'
              })
            }
          })
        })
      }
    })

    // Add Curiosity Gaps (dashed outline)
    data.curiosityGaps?.forEach((gap, idx) => {
      const node = {
        id: `gap-${idx}`,
        type: 'curiosityGaps',
        label: 'CURIOSITY GAP',
        name: gap.name,
        evidence: gap.evidence,
        suggestedConnection: gap.suggestedConnection,
        size: 10,
        color: COLORS.curiosityGaps,
        dashed: true
      }
      nodes.push(node)
      nodeMap.set(gap.name.toLowerCase(), node)

      // Link to suggested connections
      if (gap.suggestedConnection) {
        const suggestTerms = gap.suggestedConnection.toLowerCase().split(/[,+&]+/).map(s => s.trim())
        suggestTerms.forEach(term => {
          nodeMap.forEach((targetNode, key) => {
            if (key.includes(term) || term.includes(key.split(' ')[0])) {
              links.push({
                source: node.id,
                target: targetNode.id,
                type: 'gap-suggestion',
                dashed: true
              })
            }
          })
        })
      }
    })

    // Add North Star as central node
    if (data.northStar) {
      const node = {
        id: 'north-star',
        type: 'northStar',
        label: 'NORTH STAR',
        name: 'North Star',
        description: data.northStar,
        size: 20,
        color: COLORS.northStar,
        fx: width / 2,
        fy: height / 2
      }
      nodes.push(node)

      // Connect north star to all starred items
      nodes.forEach(n => {
        if (n.isStarred) {
          links.push({
            source: 'north-star',
            target: n.id,
            type: 'north-star-connection'
          })
        }
      })
    }

    return { nodes, links, nodeMap }
  }, [data])

  // Find connected nodes for a given node
  const getConnectedNodes = useCallback((node) => {
    if (!graphData.links || !graphData.nodes) return []

    const connectedIds = new Set()
    graphData.links.forEach(link => {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source
      const targetId = typeof link.target === 'object' ? link.target.id : link.target

      if (sourceId === node.id) connectedIds.add(targetId)
      if (targetId === node.id) connectedIds.add(sourceId)
    })

    return graphData.nodes.filter(n => connectedIds.has(n.id))
  }, [graphData])

  // Handle node selection from detail panel
  const handleSelectNode = useCallback((node) => {
    setSelectedNode(node)
  }, [])

  return (
    <div className="mind-space-graph-wrapper">
      {/* Shrunk Preview */}
      <div
        className="mind-space-preview"
        onClick={() => setIsExpanded(true)}
      >
        <PreviewGraph data={data} buildGraphData={buildGraphData} />
        <div className="preview-overlay">
          <span className="preview-text">Click to explore your Mind Space</span>
        </div>
      </div>

      <button
        className="expand-button"
        onClick={() => setIsExpanded(true)}
      >
        Explore Your Mind Space →
      </button>

      {/* Fullscreen Expanded View */}
      {isExpanded && (
        <div className="mind-space-fullscreen">
          <button
            className="close-button"
            onClick={() => {
              setIsExpanded(false)
              setSelectedNode(null)
            }}
            aria-label="Close"
          >
            ×
          </button>

          {/* North Star Banner */}
          {data?.northStar && (
            <div className="north-star-banner">
              <span className="north-star-icon">⭐</span>
              <span className="north-star-label">North Star: </span>
              <span className="north-star-text">
                {data.northStar.length > 150
                  ? data.northStar.slice(0, 150) + '...'
                  : data.northStar}
              </span>
            </div>
          )}

          <FullGraph
            data={data}
            buildGraphData={buildGraphData}
            selectedNode={selectedNode}
            onNodeClick={setSelectedNode}
            setGraphData={setGraphData}
          />

          {/* Legend */}
          <div className="graph-legend">
            <div className="legend-title">Legend</div>
            <div className="legend-items">
              <LegendItem color={COLORS.skills} label="Skills" />
              <LegendItem color={COLORS.problems} label="Problems" />
              <LegendItem color={COLORS.personas} label="Personas" />
              <LegendItem color={COLORS.themes} label="Themes" />
              <LegendItem color={COLORS.curiosityGaps} label="Curiosity Gaps" dashed />
              <LegendItem color={COLORS.northStar} label="North Star" star />
            </div>
          </div>

          {/* Instructions */}
          <div className="graph-instructions">
            <div>Scroll to zoom • Drag to pan</div>
            <div>Click nodes to explore</div>
          </div>

          {/* Node Detail Panel */}
          {selectedNode && (
            <NodeDetailPanel
              node={selectedNode}
              connectedNodes={getConnectedNodes(selectedNode)}
              onClose={() => setSelectedNode(null)}
              onSelectNode={handleSelectNode}
            />
          )}
        </div>
      )}
    </div>
  )
}

// Static preview graph (no interactions)
function PreviewGraph({ data, buildGraphData }) {
  const svgRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || !data) return

    const container = containerRef.current
    const width = container.clientWidth
    const height = container.clientHeight

    const { nodes, links } = buildGraphData(width, height)
    if (nodes.length === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const g = svg.append('g').attr('class', 'graph-container')

    // Create simulation but run it to completion immediately
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(50).strength(0.5))
      .force('charge', d3.forceManyBody().strength(-100))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => d.size + 5))
      .stop()

    // Run simulation
    for (let i = 0; i < 150; i++) simulation.tick()

    // Draw links
    g.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', COLORS.link)
      .attr('stroke-opacity', 0.3)
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', d => d.dashed ? '3 3' : null)
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y)

    // Draw nodes
    g.append('g')
      .attr('class', 'nodes')
      .selectAll('circle')
      .data(nodes)
      .enter()
      .append('circle')
      .attr('r', d => d.size * 0.8)
      .attr('fill', d => d.color)
      .attr('fill-opacity', d => d.type === 'curiosityGaps' ? 0.3 : 0.7)
      .attr('stroke', d => d.dashed ? d.color : 'rgba(255,255,255,0.1)')
      .attr('stroke-width', d => d.dashed ? 1.5 : 0.5)
      .attr('stroke-dasharray', d => d.dashed ? '2 2' : null)
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)

    // Starred indicators
    g.append('g')
      .attr('class', 'stars')
      .selectAll('circle')
      .data(nodes.filter(n => n.isStarred))
      .enter()
      .append('circle')
      .attr('r', d => d.size * 0.3)
      .attr('fill', '#fbbf24')
      .attr('fill-opacity', 0.8)
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)

  }, [data, buildGraphData])

  return (
    <div ref={containerRef} className="preview-container">
      <svg ref={svgRef} width="100%" height="100%" />
    </div>
  )
}

// Full interactive graph
function FullGraph({ data, buildGraphData, selectedNode, onNodeClick, setGraphData }) {
  const svgRef = useRef(null)
  const containerRef = useRef(null)
  const simulationRef = useRef(null)

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || !data) return

    const container = containerRef.current
    const width = container.clientWidth
    const height = container.clientHeight

    const { nodes, links } = buildGraphData(width, height)
    if (nodes.length === 0) return

    // Store graph data for connected nodes lookup
    setGraphData({ nodes, links })

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const g = svg.append('g').attr('class', 'graph-container')

    // Add zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform)
      })
    svg.call(zoom)

    // Initialize nodes at center for animation
    nodes.forEach(node => {
      if (node.type !== 'northStar') {
        node.x = width / 2 + (Math.random() - 0.5) * 50
        node.y = height / 2 + (Math.random() - 0.5) * 50
      }
    })

    // Create force simulation
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(80).strength(0.5))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => d.size + 10))
      .alpha(1)
      .alphaDecay(0.02)

    simulationRef.current = simulation

    // Draw links
    const link = g.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', COLORS.link)
      .attr('stroke-opacity', 0.4)
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', d => d.dashed ? '4 4' : null)

    // Draw nodes
    const node = g.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended))

    // Node circles
    node.append('circle')
      .attr('r', d => d.size)
      .attr('fill', d => d.color)
      .attr('fill-opacity', d => d.type === 'curiosityGaps' ? 0.3 : 0.85)
      .attr('stroke', d => d.dashed ? d.color : 'rgba(255,255,255,0.2)')
      .attr('stroke-width', d => d.dashed ? 2 : 1)
      .attr('stroke-dasharray', d => d.dashed ? '3 3' : null)

    // Starred indicator
    node.filter(d => d.isStarred)
      .append('circle')
      .attr('r', d => d.size * 0.4)
      .attr('fill', '#fbbf24')
      .attr('fill-opacity', 0.8)

    // Node labels
    node.append('text')
      .attr('dy', d => d.size + 14)
      .attr('text-anchor', 'middle')
      .attr('fill', COLORS.text)
      .attr('font-size', '10px')
      .attr('font-family', 'system-ui, sans-serif')
      .attr('pointer-events', 'none')
      .text(d => {
        const maxLen = 18
        return d.name.length > maxLen ? d.name.slice(0, maxLen) + '...' : d.name
      })

    // Hover effects
    node
      .on('mouseenter', function(event, d) {
        link.attr('stroke', l => {
          const sourceId = typeof l.source === 'object' ? l.source.id : l.source
          const targetId = typeof l.target === 'object' ? l.target.id : l.target
          return sourceId === d.id || targetId === d.id
            ? COLORS.linkHighlight
            : COLORS.link
        }).attr('stroke-opacity', l => {
          const sourceId = typeof l.source === 'object' ? l.source.id : l.source
          const targetId = typeof l.target === 'object' ? l.target.id : l.target
          return sourceId === d.id || targetId === d.id ? 0.8 : 0.2
        })

        node.select('circle')
          .attr('fill-opacity', n => {
            if (n.id === d.id) return 1
            const isConnected = links.some(l => {
              const sourceId = typeof l.source === 'object' ? l.source.id : l.source
              const targetId = typeof l.target === 'object' ? l.target.id : l.target
              return (sourceId === d.id && targetId === n.id) ||
                     (targetId === d.id && sourceId === n.id)
            })
            return isConnected ? 0.9 : 0.3
          })
      })
      .on('mouseleave', function() {
        link.attr('stroke', COLORS.link).attr('stroke-opacity', 0.4)
        node.select('circle').attr('fill-opacity', d => d.type === 'curiosityGaps' ? 0.3 : 0.85)
      })
      .on('click', function(event, d) {
        event.stopPropagation()
        onNodeClick(d)
      })

    // Click background to deselect
    svg.on('click', () => {
      onNodeClick(null)
    })

    // Simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y)

      node.attr('transform', d => `translate(${d.x},${d.y})`)
    })

    // Drag functions
    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart()
      d.fx = d.x
      d.fy = d.y
    }

    function dragged(event, d) {
      d.fx = event.x
      d.fy = event.y
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0)
      if (d.type !== 'northStar') {
        d.fx = null
        d.fy = null
      }
    }

    return () => {
      simulation.stop()
    }
  }, [data, buildGraphData, onNodeClick, setGraphData])

  return (
    <div ref={containerRef} className="full-graph-container">
      <svg ref={svgRef} width="100%" height="100%" />
    </div>
  )
}

// Legend item component
function LegendItem({ color, label, dashed, star }) {
  return (
    <div className="legend-item">
      <div
        className={`legend-dot ${dashed ? 'dashed' : ''}`}
        style={{
          background: dashed ? 'transparent' : color,
          borderColor: color
        }}
      >
        {star && <span className="legend-star">★</span>}
      </div>
      <span className="legend-label">{label}</span>
    </div>
  )
}
