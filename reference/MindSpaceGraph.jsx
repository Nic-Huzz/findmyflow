/**
 * MindSpaceGraph.jsx
 * 
 * Force-directed graph visualization for FindMyFlow nikigai responses.
 * Visualizes skills, problems, personas, themes, and curiosity gaps.
 * 
 * Usage:
 *   import MindSpaceGraph from './MindSpaceGraph';
 *   <MindSpaceGraph data={responseData} width={800} height={600} onNodeClick={(node) => {}} />
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';

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
};

// User level weights for sizing
const LEVEL_WEIGHTS = {
  // Skills
  emerging: 1,
  establishing: 1.3,
  mastering: 1.6,
  // Problems
  exploring: 1,
  pursuing: 1.3,
  proven: 1.6,
  // Personas
  awakening: 1,
  struggling: 1.3,
  ready: 1.6
};

// Frequency weights
const FREQUENCY_WEIGHTS = {
  Low: 1,
  Medium: 1.25,
  High: 1.5
};

export default function MindSpaceGraph({ 
  data, 
  width = 800, 
  height = 600,
  onNodeClick 
}) {
  const svgRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const simulationRef = useRef(null);
  
  // Transform raw data into graph nodes and links
  const buildGraphData = useCallback(() => {
    if (!data) return { nodes: [], links: [] };
    
    const nodes = [];
    const links = [];
    const nodeMap = new Map();
    
    // Helper to calculate node size
    const calcSize = (item, type, isStarred) => {
      const baseSize = 12;
      const levelWeight = LEVEL_WEIGHTS[item.userLevel] || 1;
      const freqWeight = FREQUENCY_WEIGHTS[item.frequency] || 1;
      const starBonus = isStarred ? 1.4 : 1;
      return baseSize * levelWeight * freqWeight * starBonus;
    };
    
    // Add Skills
    data.skills?.forEach((skill, idx) => {
      const isStarred = data.starredSkills?.includes(idx);
      const node = {
        id: `skill-${idx}`,
        type: 'skills',
        name: skill.name,
        evidence: skill.evidence,
        frequency: skill.frequency,
        category: skill.category,
        mappedTo: skill.mappedTo,
        userLevel: skill.userLevel,
        isStarred,
        size: calcSize(skill, 'skills', isStarred),
        color: COLORS.skills
      };
      nodes.push(node);
      nodeMap.set(skill.name.toLowerCase(), node);
    });
    
    // Add Problems
    data.problems?.forEach((problem, idx) => {
      const isStarred = data.starredProblems?.includes(idx);
      const node = {
        id: `problem-${idx}`,
        type: 'problems',
        name: problem.name,
        evidence: problem.evidence,
        frequency: problem.frequency,
        emotionalCharge: problem.emotionalCharge,
        mappedTo: problem.mappedTo,
        userLevel: problem.userLevel,
        isStarred,
        size: calcSize(problem, 'problems', isStarred),
        color: COLORS.problems
      };
      nodes.push(node);
      nodeMap.set(problem.name.toLowerCase(), node);
    });
    
    // Add Personas
    data.personas?.forEach((persona, idx) => {
      const isStarred = data.starredPersonas?.includes(idx);
      const node = {
        id: `persona-${idx}`,
        type: 'personas',
        name: persona.name,
        evidence: persona.evidence,
        frequency: persona.frequency,
        connection: persona.connection,
        mappedTo: persona.mappedTo,
        userLevel: persona.userLevel,
        isStarred,
        size: calcSize(persona, 'personas', isStarred),
        color: COLORS.personas
      };
      nodes.push(node);
      nodeMap.set(persona.name.toLowerCase(), node);
    });
    
    // Add Themes (smaller connector nodes)
    data.themes?.forEach((theme, idx) => {
      const node = {
        id: `theme-${idx}`,
        type: 'themes',
        name: theme.name,
        connects: theme.connects,
        size: 8,
        color: COLORS.themes
      };
      nodes.push(node);
      nodeMap.set(theme.name.toLowerCase(), node);
      
      // Create links from theme to connected items
      if (theme.connects) {
        const connectTerms = theme.connects.toLowerCase().split(/[,&]+/).map(s => s.trim());
        connectTerms.forEach(term => {
          // Try to find matching nodes
          nodeMap.forEach((targetNode, key) => {
            if (key.includes(term) || term.includes(key.split(' ')[0])) {
              links.push({
                source: node.id,
                target: targetNode.id,
                type: 'theme-connection'
              });
            }
          });
        });
      }
    });
    
    // Add Curiosity Gaps (dashed outline)
    data.curiosityGaps?.forEach((gap, idx) => {
      const node = {
        id: `gap-${idx}`,
        type: 'curiosityGaps',
        name: gap.name,
        evidence: gap.evidence,
        suggestedConnection: gap.suggestedConnection,
        size: 10,
        color: COLORS.curiosityGaps,
        dashed: true
      };
      nodes.push(node);
      nodeMap.set(gap.name.toLowerCase(), node);
      
      // Link to suggested connections
      if (gap.suggestedConnection) {
        const suggestTerms = gap.suggestedConnection.toLowerCase().split(/[,+&]+/).map(s => s.trim());
        suggestTerms.forEach(term => {
          nodeMap.forEach((targetNode, key) => {
            if (key.includes(term) || term.includes(key.split(' ')[0])) {
              links.push({
                source: node.id,
                target: targetNode.id,
                type: 'gap-suggestion',
                dashed: true
              });
            }
          });
        });
      }
    });
    
    // Add North Star as central node (optional)
    if (data.northStar) {
      const node = {
        id: 'north-star',
        type: 'northStar',
        name: 'North Star',
        description: data.northStar,
        size: 20,
        color: COLORS.northStar,
        fx: width / 2, // Fixed position at center
        fy: height / 2
      };
      nodes.push(node);
      
      // Connect north star to all starred items
      nodes.forEach(n => {
        if (n.isStarred) {
          links.push({
            source: 'north-star',
            target: n.id,
            type: 'north-star-connection'
          });
        }
      });
    }
    
    return { nodes, links };
  }, [data, width, height]);
  
  // D3 Force Simulation
  useEffect(() => {
    if (!svgRef.current || !data) return;
    
    const { nodes, links } = buildGraphData();
    if (nodes.length === 0) return;
    
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    
    // Create container group for zoom
    const g = svg.append('g').attr('class', 'graph-container');
    
    // Add zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });
    svg.call(zoom);
    
    // Create force simulation
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(80).strength(0.5))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => d.size + 10));
    
    simulationRef.current = simulation;
    
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
      .attr('stroke-dasharray', d => d.dashed ? '4 4' : null);
    
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
        .on('end', dragended));
    
    // Node circles
    node.append('circle')
      .attr('r', d => d.size)
      .attr('fill', d => d.color)
      .attr('fill-opacity', d => d.type === 'curiosityGaps' ? 0.3 : 0.85)
      .attr('stroke', d => d.dashed ? d.color : 'rgba(255,255,255,0.2)')
      .attr('stroke-width', d => d.dashed ? 2 : 1)
      .attr('stroke-dasharray', d => d.dashed ? '3 3' : null);
    
    // Starred indicator (inner glow)
    node.filter(d => d.isStarred)
      .append('circle')
      .attr('r', d => d.size * 0.4)
      .attr('fill', '#fbbf24')
      .attr('fill-opacity', 0.8);
    
    // Node labels
    node.append('text')
      .attr('dy', d => d.size + 14)
      .attr('text-anchor', 'middle')
      .attr('fill', COLORS.text)
      .attr('font-size', '10px')
      .attr('font-family', 'system-ui, sans-serif')
      .attr('pointer-events', 'none')
      .text(d => {
        const maxLen = 20;
        return d.name.length > maxLen ? d.name.slice(0, maxLen) + '...' : d.name;
      });
    
    // Hover and click handlers
    node
      .on('mouseenter', function(event, d) {
        setHoveredNode(d);
        
        // Highlight connected links
        link.attr('stroke', l => 
          l.source.id === d.id || l.target.id === d.id 
            ? COLORS.linkHighlight 
            : COLORS.link
        ).attr('stroke-opacity', l =>
          l.source.id === d.id || l.target.id === d.id ? 0.8 : 0.2
        );
        
        // Highlight connected nodes
        node.select('circle')
          .attr('fill-opacity', n => {
            if (n.id === d.id) return 1;
            const isConnected = links.some(l => 
              (l.source.id === d.id && l.target.id === n.id) ||
              (l.target.id === d.id && l.source.id === n.id)
            );
            return isConnected ? 0.9 : 0.3;
          });
      })
      .on('mouseleave', function() {
        setHoveredNode(null);
        link.attr('stroke', COLORS.link).attr('stroke-opacity', 0.4);
        node.select('circle').attr('fill-opacity', d => d.type === 'curiosityGaps' ? 0.3 : 0.85);
      })
      .on('click', function(event, d) {
        event.stopPropagation();
        setSelectedNode(d);
        if (onNodeClick) onNodeClick(d);
      });
    
    // Click on background to deselect
    svg.on('click', () => {
      setSelectedNode(null);
    });
    
    // Simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);
      
      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });
    
    // Drag functions
    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    
    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }
    
    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      // Keep north star fixed
      if (d.type !== 'northStar') {
        d.fx = null;
        d.fy = null;
      }
    }
    
    return () => {
      simulation.stop();
    };
  }, [data, width, height, buildGraphData, onNodeClick]);
  
  return (
    <div 
      style={{ 
        position: 'relative', 
        width, 
        height, 
        background: COLORS.background,
        borderRadius: '12px',
        overflow: 'hidden',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      {/* SVG Canvas */}
      <svg 
        ref={svgRef} 
        width={width} 
        height={height}
        style={{ display: 'block' }}
      />
      
      {/* Legend */}
      <div style={{
        position: 'absolute',
        bottom: 16,
        left: 16,
        background: 'rgba(0,0,0,0.6)',
        padding: '12px 16px',
        borderRadius: '8px',
        fontSize: '11px',
        color: COLORS.text
      }}>
        <div style={{ fontWeight: 600, marginBottom: 8, fontSize: '12px' }}>Legend</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <LegendItem color={COLORS.skills} label="Skills" />
          <LegendItem color={COLORS.problems} label="Problems" />
          <LegendItem color={COLORS.personas} label="Personas" />
          <LegendItem color={COLORS.themes} label="Themes" />
          <LegendItem color={COLORS.curiosityGaps} label="Curiosity Gaps" dashed />
          <LegendItem color={COLORS.northStar} label="North Star" star />
        </div>
      </div>
      
      {/* Tooltip / Details Panel */}
      {hoveredNode && (
        <div style={{
          position: 'absolute',
          top: 16,
          right: 16,
          width: 280,
          background: 'rgba(0,0,0,0.85)',
          padding: '16px',
          borderRadius: '10px',
          border: `1px solid ${hoveredNode.color}40`,
          color: COLORS.text
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 8, 
            marginBottom: 8 
          }}>
            <div style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: hoveredNode.color,
              border: hoveredNode.isStarred ? '2px solid #fbbf24' : 'none'
            }} />
            <span style={{ 
              fontSize: '14px', 
              fontWeight: 600,
              flex: 1
            }}>
              {hoveredNode.name}
            </span>
            {hoveredNode.isStarred && (
              <span style={{ color: '#fbbf24' }}>★</span>
            )}
          </div>
          
          <div style={{ 
            fontSize: '10px', 
            textTransform: 'uppercase', 
            color: hoveredNode.color,
            marginBottom: 8
          }}>
            {hoveredNode.type.replace(/([A-Z])/g, ' $1').trim()}
            {hoveredNode.userLevel && ` · ${hoveredNode.userLevel}`}
            {hoveredNode.frequency && ` · ${hoveredNode.frequency}`}
          </div>
          
          {hoveredNode.evidence && (
            <div style={{ fontSize: '12px', color: COLORS.textMuted, marginBottom: 8 }}>
              "{hoveredNode.evidence}"
            </div>
          )}
          
          {hoveredNode.description && (
            <div style={{ fontSize: '12px', color: COLORS.textMuted, lineHeight: 1.5 }}>
              {hoveredNode.description}
            </div>
          )}
          
          {hoveredNode.connects && (
            <div style={{ fontSize: '11px', color: COLORS.textMuted, marginTop: 8 }}>
              <span style={{ color: COLORS.text }}>Connects: </span>
              {hoveredNode.connects}
            </div>
          )}
          
          {hoveredNode.suggestedConnection && (
            <div style={{ fontSize: '11px', color: COLORS.textMuted, marginTop: 8 }}>
              <span style={{ color: COLORS.text }}>Suggested: </span>
              {hoveredNode.suggestedConnection}
            </div>
          )}
          
          {hoveredNode.connection && (
            <div style={{ fontSize: '11px', color: COLORS.textMuted, marginTop: 8, fontStyle: 'italic' }}>
              {hoveredNode.connection}
            </div>
          )}
        </div>
      )}
      
      {/* North Star Banner (if exists) */}
      {data?.northStar && (
        <div style={{
          position: 'absolute',
          top: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(251, 191, 36, 0.15)',
          border: '1px solid rgba(251, 191, 36, 0.3)',
          padding: '10px 20px',
          borderRadius: '20px',
          maxWidth: '70%',
          textAlign: 'center',
          fontSize: '12px',
          color: '#fbbf24',
          lineHeight: 1.5
        }}>
          <span style={{ fontWeight: 600 }}>⭐ North Star: </span>
          <span style={{ color: COLORS.text }}>
            {data.northStar.length > 150 
              ? data.northStar.slice(0, 150) + '...' 
              : data.northStar}
          </span>
        </div>
      )}
      
      {/* Instructions */}
      <div style={{
        position: 'absolute',
        bottom: 16,
        right: 16,
        fontSize: '10px',
        color: COLORS.textMuted,
        textAlign: 'right'
      }}>
        <div>Scroll to zoom • Drag to pan</div>
        <div>Click nodes to explore</div>
      </div>
    </div>
  );
}

// Legend item component
function LegendItem({ color, label, dashed, star }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        width: 10,
        height: 10,
        borderRadius: '50%',
        background: dashed ? 'transparent' : color,
        border: dashed ? `2px dashed ${color}` : 'none',
        position: 'relative'
      }}>
        {star && (
          <span style={{ 
            position: 'absolute', 
            top: -2, 
            left: -1, 
            fontSize: '10px',
            color 
          }}>★</span>
        )}
      </div>
      <span style={{ color: 'rgba(255,255,255,0.7)' }}>{label}</span>
    </div>
  );
}

// Export helper to transform raw extraction to expected format
export function parseExtractionToGraphData(extractionText) {
  const data = {
    skills: [],
    problems: [],
    personas: [],
    themes: [],
    curiosityGaps: [],
    northStar: '',
    starredSkills: [],
    starredProblems: [],
    starredPersonas: []
  };
  
  const sections = extractionText.split(/##\s+/);
  
  sections.forEach(section => {
    const lines = section.trim().split('\n');
    const sectionTitle = lines[0]?.toUpperCase() || '';
    
    if (sectionTitle.includes('SKILL')) {
      let currentItem = null;
      lines.slice(1).forEach(line => {
        const skillMatch = line.match(/SKILL:\s*(.+)/i);
        const evidenceMatch = line.match(/EVIDENCE:\s*(.+)/i);
        const frequencyMatch = line.match(/FREQUENCY:\s*(.+)/i);
        const categoryMatch = line.match(/CATEGORY:\s*(.+)/i);
        
        if (skillMatch) {
          if (currentItem) data.skills.push(currentItem);
          currentItem = { name: skillMatch[1].trim(), userLevel: 'establishing' };
        }
        if (currentItem && evidenceMatch) currentItem.evidence = evidenceMatch[1].trim().replace(/"/g, '');
        if (currentItem && frequencyMatch) currentItem.frequency = frequencyMatch[1].trim();
        if (currentItem && categoryMatch) currentItem.category = categoryMatch[1].trim();
      });
      if (currentItem) data.skills.push(currentItem);
    }
    
    if (sectionTitle.includes('PROBLEM')) {
      let currentItem = null;
      lines.slice(1).forEach(line => {
        const problemMatch = line.match(/PROBLEM:\s*(.+)/i);
        const evidenceMatch = line.match(/EVIDENCE:\s*(.+)/i);
        const frequencyMatch = line.match(/FREQUENCY:\s*(.+)/i);
        const chargeMatch = line.match(/EMOTIONAL_CHARGE:\s*(.+)/i);
        
        if (problemMatch) {
          if (currentItem) data.problems.push(currentItem);
          currentItem = { name: problemMatch[1].trim(), userLevel: 'pursuing' };
        }
        if (currentItem && evidenceMatch) currentItem.evidence = evidenceMatch[1].trim().replace(/"/g, '');
        if (currentItem && frequencyMatch) currentItem.frequency = frequencyMatch[1].trim();
        if (currentItem && chargeMatch) currentItem.emotionalCharge = chargeMatch[1].trim();
      });
      if (currentItem) data.problems.push(currentItem);
    }
    
    if (sectionTitle.includes('PERSONA')) {
      let currentItem = null;
      lines.slice(1).forEach(line => {
        const personaMatch = line.match(/PERSONA:\s*(.+)/i);
        const evidenceMatch = line.match(/EVIDENCE:\s*(.+)/i);
        const frequencyMatch = line.match(/FREQUENCY:\s*(.+)/i);
        const connectionMatch = line.match(/CONNECTION:\s*(.+)/i);
        
        if (personaMatch) {
          if (currentItem) data.personas.push(currentItem);
          currentItem = { name: personaMatch[1].trim(), userLevel: 'ready' };
        }
        if (currentItem && evidenceMatch) currentItem.evidence = evidenceMatch[1].trim().replace(/"/g, '');
        if (currentItem && frequencyMatch) currentItem.frequency = frequencyMatch[1].trim();
        if (currentItem && connectionMatch) currentItem.connection = connectionMatch[1].trim();
      });
      if (currentItem) data.personas.push(currentItem);
    }
    
    if (sectionTitle.includes('RECURRING') || sectionTitle.includes('THEME')) {
      let currentItem = null;
      lines.slice(1).forEach(line => {
        const themeMatch = line.match(/THEME:\s*(.+)/i);
        const connectsMatch = line.match(/CONNECTS:\s*(.+)/i);
        
        if (themeMatch) {
          if (currentItem) data.themes.push(currentItem);
          currentItem = { name: themeMatch[1].trim() };
        }
        if (currentItem && connectsMatch) currentItem.connects = connectsMatch[1].trim();
      });
      if (currentItem) data.themes.push(currentItem);
    }
    
    if (sectionTitle.includes('CURIOSITY') || sectionTitle.includes('GAP')) {
      let currentItem = null;
      lines.slice(1).forEach(line => {
        const gapMatch = line.match(/GAP:\s*(.+)/i);
        const evidenceMatch = line.match(/EVIDENCE:\s*(.+)/i);
        const suggestedMatch = line.match(/SUGGESTED_CONNECTION:\s*(.+)/i);
        
        if (gapMatch) {
          if (currentItem) data.curiosityGaps.push(currentItem);
          currentItem = { name: gapMatch[1].trim() };
        }
        if (currentItem && evidenceMatch) currentItem.evidence = evidenceMatch[1].trim();
        if (currentItem && suggestedMatch) currentItem.suggestedConnection = suggestedMatch[1].trim();
      });
      if (currentItem) data.curiosityGaps.push(currentItem);
    }
    
    if (sectionTitle.includes('NORTH STAR')) {
      const hypothesis = lines.slice(1).join(' ').trim();
      const match = hypothesis.match(/"([^"]+)"/);
      data.northStar = match ? match[1] : hypothesis;
    }
  });
  
  // Auto-star high frequency items
  data.skills.forEach((s, i) => { if (s.frequency === 'High') data.starredSkills.push(i); });
  data.problems.forEach((p, i) => { if (p.frequency === 'High' && p.emotionalCharge === 'High') data.starredProblems.push(i); });
  data.personas.forEach((p, i) => { if (p.frequency === 'High') data.starredPersonas.push(i); });
  
  return data;
}
