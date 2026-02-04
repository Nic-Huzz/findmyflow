/**
 * NodeDetailPanel.jsx
 *
 * Detail panel that appears when a node is clicked in the Mind Space graph.
 * Shows node information and connected nodes as clickable tags.
 */

import React from 'react'

// Color palette matching main graph
const COLORS = {
  skills: '#f97316',
  problems: '#a855f7',
  personas: '#22c55e',
  themes: '#94a3b8',
  curiosityGaps: '#fbbf24',
  northStar: '#fbbf24'
}

// Level display names
const LEVEL_LABELS = {
  // Skills
  learning: 'Learning',
  practicing: 'Practicing',
  mastering: 'Mastering',
  emerging: 'Emerging',
  establishing: 'Establishing',
  // Problems
  exploring: 'Exploring',
  pursuing: 'Pursuing',
  proven: 'Proven',
  // Personas
  awakening: 'Awakening',
  struggling: 'Struggling',
  ready: 'Ready'
}

export default function NodeDetailPanel({ node, connectedNodes, onClose, onSelectNode }) {
  if (!node) return null

  const typeColor = COLORS[node.type] || COLORS.themes

  return (
    <div className="node-detail-panel">
      {/* Close button */}
      <button className="panel-close" onClick={onClose} aria-label="Close">
        ×
      </button>

      {/* Header */}
      <h2 className="panel-title">{node.name}</h2>

      {/* Badges */}
      <div className="panel-badges">
        <span
          className="badge type-badge"
          style={{ backgroundColor: `${typeColor}30`, color: typeColor }}
        >
          {node.label || node.type.toUpperCase()}
        </span>

        {node.userLevel && LEVEL_LABELS[node.userLevel] && (
          <span className="badge level-badge">
            {LEVEL_LABELS[node.userLevel]}
          </span>
        )}

        {node.frequency && (
          <span className={`badge frequency-badge frequency-${node.frequency.toLowerCase()}`}>
            {node.frequency}
          </span>
        )}

        {node.isStarred && (
          <span className="badge starred-badge">★ Starred</span>
        )}
      </div>

      {/* Description / Evidence */}
      {(node.evidence || node.description) && (
        <p className="panel-description">
          {node.evidence || node.description}
        </p>
      )}

      {/* Connection (for personas) */}
      {node.connection && (
        <div className="panel-connection">
          <span className="connection-label">Connection: </span>
          {node.connection}
        </div>
      )}

      {/* Suggested Connection (for curiosity gaps) */}
      {node.suggestedConnection && (
        <div className="panel-connection">
          <span className="connection-label">Suggested: </span>
          {node.suggestedConnection}
        </div>
      )}

      {/* Connects (for themes) */}
      {node.connects && (
        <div className="panel-connection">
          <span className="connection-label">Connects: </span>
          {node.connects}
        </div>
      )}

      {/* Category (for skills) */}
      {node.category && (
        <div className="panel-meta">
          <span className="meta-label">Category: </span>
          {node.category}
        </div>
      )}

      {/* Emotional Charge (for problems) */}
      {node.emotionalCharge && (
        <div className="panel-meta">
          <span className="meta-label">Emotional Charge: </span>
          <span className={`charge-value charge-${node.emotionalCharge.toLowerCase()}`}>
            {node.emotionalCharge}
          </span>
        </div>
      )}

      {/* Connected Nodes */}
      {connectedNodes && connectedNodes.length > 0 && (
        <div className="panel-connected">
          <h3 className="connected-title">Connected To</h3>
          <div className="connected-tags">
            {connectedNodes.map(connectedNode => (
              <button
                key={connectedNode.id}
                className="connected-tag"
                style={{
                  borderColor: COLORS[connectedNode.type] || COLORS.themes,
                  color: COLORS[connectedNode.type] || COLORS.themes
                }}
                onClick={() => onSelectNode(connectedNode)}
              >
                {connectedNode.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
