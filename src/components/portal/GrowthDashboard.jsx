/**
 * GrowthDashboard.jsx — Growth Line + Grind Line dashboard
 *
 * Shows the revenue pipeline as a horizontal track of nodes,
 * with an expanded detail panel and tasks below.
 * Grind Line loops shown as cards underneath.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PortalProvider, usePortal } from '../../context/PortalContext'
import { hapticLight, hapticSuccess } from '../../lib/haptics'

// Maps growth node keys to CRM/app routes for task navigation
const NODE_ROUTES = {
  awareness: '/crm/content-create',
  to_contact: '/crm/contacts',
  reached_out: '/crm/warm-outreach',
  in_conversation: '/crm/email',
  qualified: '/crm/sales',
  meeting_booked: '/crm/sales',
  close: '/create/experience/new',
  onboard: '/create',
  deliver: '/create',
  support: '/crm/warm-outreach',
  retain: '/create',
}

const STATUS_ICONS = {
  good: '✅',
  warn: '⚠️',
  bad: '❌',
  working: '🔄',
}

const STATUS_LABELS = {
  good: 'On track',
  warn: 'Needs attention',
  bad: 'Blocked',
  working: 'In progress',
}

export default function GrowthDashboard() {
  return (
    <PortalProvider>
      <GrowthDashboardInner />
    </PortalProvider>
  )
}

function GrowthDashboardInner() {
  const {
    clients, currentClient, currentClientId, setCurrentClientId,
    growthNodes, grindLoops, tasks, loading,
    selectedNode, selectedLoop, selectedNodeId, selectedLoopId,
    selectNode, selectLoop, nodeTasks, loopTasks,
    completeTask, reopenTask, createClient,
  } = usePortal()

  const navigate = useNavigate()
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')

  if (loading) {
    return <div className="portal-empty"><div className="portal-empty-desc">Loading...</div></div>
  }

  // No clients yet — show create prompt
  if (clients.length === 0) {
    return (
      <div className="portal-empty">
        <div className="portal-empty-title">No clients yet</div>
        <div className="portal-empty-desc">
          Create your first client to start tracking their growth pipeline and operational loops.
        </div>
        {creating ? (
          <form onSubmit={async (e) => {
            e.preventDefault()
            if (newName.trim()) {
              await createClient(newName.trim())
              setNewName('')
              setCreating(false)
            }
          }} style={{ display: 'flex', gap: 8 }}>
            <input
              autoFocus
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Client name..."
              style={{
                padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 13,
              }}
            />
            <button type="submit" className="portal-empty-btn">Create</button>
          </form>
        ) : (
          <button className="portal-empty-btn" onClick={() => setCreating(true)}>
            + Add First Client
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="growth-dashboard">
      {/* Client selector */}
      {clients.length > 1 && (
        <div className="client-selector">
          <select
            value={currentClientId || ''}
            onChange={e => setCurrentClientId(e.target.value)}
          >
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      )}

      {currentClient && (
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: -8 }}>
          {currentClient.name} {currentClient.industry ? `· ${currentClient.industry}` : ''}
        </div>
      )}

      {/* Growth Line */}
      {growthNodes.length > 0 && (
        <div className="growth-pipeline">
          <div className="pipeline-track">
            {growthNodes.map((node, i) => (
              <div key={node.id} style={{ display: 'flex', alignItems: 'center' }}>
                <div
                  className={`pipeline-node${selectedNodeId === node.id ? ' selected' : ''}`}
                  onClick={() => { selectNode(node.id); hapticLight() }}
                >
                  <div className={`pipeline-node-status ${node.status}`}>
                    {STATUS_ICONS[node.status] || '●'}
                  </div>
                  <div className="pipeline-node-label">{node.label}</div>
                  {node.headline_value && (
                    <div className="pipeline-node-value">{node.headline_value}</div>
                  )}
                </div>
                {i < growthNodes.length - 1 && (
                  <div className="pipeline-arrow">→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {growthNodes.length === 0 && (
        <div className="portal-empty" style={{ minHeight: 120 }}>
          <div className="portal-empty-desc">
            No pipeline nodes yet. Add growth nodes to track your client's revenue pipeline.
          </div>
        </div>
      )}

      {/* Selected node detail */}
      {selectedNode && (
        <NodeDetail
          node={selectedNode}
          tasks={nodeTasks}
          onComplete={completeTask}
          onReopen={reopenTask}
          navigate={navigate}
        />
      )}

      {/* Grind Line */}
      {grindLoops.length > 0 && (
        <div>
          <div className="grind-section-title">
            <span>⚙️</span> Grind Line
          </div>
          <div className="grind-loops">
            {grindLoops.map(loop => (
              <div
                key={loop.id}
                className={`grind-card${selectedLoopId === loop.id ? ' selected' : ''}`}
                onClick={() => { selectLoop(loop.id); hapticLight() }}
              >
                <div className="grind-card-header">
                  <span className="grind-card-icon">{loop.icon || '⚙️'}</span>
                  <span className="grind-card-name">{loop.name}</span>
                </div>
                <div className="grind-card-meta">
                  <span className="grind-card-hours">
                    {loop.hours_per_week ? `${loop.hours_per_week}h/wk` : ''}
                  </span>
                  <span className={`grind-card-status ${loop.status}`}>
                    {loop.status === 'good' ? 'Automated' : loop.status === 'warn' ? 'Mostly manual' : 'Broken'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected loop detail */}
      {selectedLoop && (
        <NodeDetail
          node={selectedLoop}
          tasks={loopTasks}
          onComplete={completeTask}
          onReopen={reopenTask}
          navigate={navigate}
          isLoop
        />
      )}
    </div>
  )
}

function NodeDetail({ node, tasks, onComplete, onReopen, navigate, isLoop = false }) {
  const openTasks = tasks.filter(t => t.status === 'open')
  const completedTasks = tasks.filter(t => t.status === 'completed')
  const isDesktop = typeof window !== 'undefined' && window.electronAPI?.isElectron

  const metrics = Array.isArray(node.metrics) ? node.metrics : []

  return (
    <div className="node-detail">
      <div className="node-detail-header">
        <div className="node-detail-title">
          {isLoop && node.icon ? `${node.icon} ` : ''}{node.label || node.name}
        </div>
        <span className={`node-detail-status ${node.status}`}>
          {STATUS_LABELS[node.status] || node.status}
        </span>
      </div>

      {/* Metrics */}
      {metrics.length > 0 && (
        <div className="node-detail-metrics">
          {metrics.map((m, i) => (
            <div key={i} className="node-metric">
              <div className="node-metric-value">{m.value}</div>
              <div className="node-metric-label">{m.label}</div>
            </div>
          ))}
        </div>
      )}

      {node.headline_value && metrics.length === 0 && (
        <div className="node-detail-metrics">
          <div className="node-metric">
            <div className="node-metric-value">{node.headline_value}</div>
            <div className="node-metric-label">{node.headline_label || ''}</div>
          </div>
        </div>
      )}

      {/* Open tasks */}
      {openTasks.length > 0 && (
        <div>
          <div className="node-tasks-title">Tasks ({openTasks.length})</div>
          {openTasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onComplete={onComplete}
              navigate={navigate}
              isDesktop={isDesktop}
              nodeKey={node.node_key || node.loop_key}
            />
          ))}
        </div>
      )}

      {/* Completed tasks */}
      {completedTasks.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div className="node-tasks-title" style={{ opacity: 0.5 }}>
            Completed ({completedTasks.length})
          </div>
          {completedTasks.map(task => (
            <div key={task.id} className="task-card completed">
              <div
                className="task-check done"
                onClick={() => onReopen(task.id)}
              >
                ✓
              </div>
              <div className="task-info">
                <div className="task-title" style={{ textDecoration: 'line-through' }}>{task.title}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tasks.length === 0 && (
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', padding: '8px 0' }}>
          No tasks yet for this {isLoop ? 'loop' : 'node'}.
        </div>
      )}
    </div>
  )
}

function TaskCard({ task, onComplete, navigate, isDesktop, nodeKey }) {
  const handleAction = () => {
    if (isDesktop && window.electronAPI?.runInTerminal && task.message) {
      window.electronAPI.runInTerminal(task.message)
    } else if (NODE_ROUTES[nodeKey]) {
      navigate(NODE_ROUTES[nodeKey])
    } else if (task.message) {
      navigator.clipboard.writeText(task.message)
      hapticSuccess()
    }
  }

  const actionLabel = isDesktop ? 'Run' : (NODE_ROUTES[nodeKey] ? 'Go' : 'Copy')

  return (
    <div className="task-card">
      <div
        className="task-check"
        onClick={() => { onComplete(task.id); hapticSuccess() }}
      />
      <div className="task-info">
        <div className="task-title">{task.title}</div>
        {task.message && <div className="task-message">{task.message}</div>}
      </div>
      {task.priority && (
        <span className={`task-priority ${task.priority}`}>
          {task.priority === 'today' ? 'Today' : task.priority === 'this_week' ? 'This week' : 'Later'}
        </span>
      )}
      <button className="task-action-btn" onClick={handleAction}>
        {actionLabel}
      </button>
    </div>
  )
}
