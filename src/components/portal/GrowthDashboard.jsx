/**
 * GrowthDashboard.jsx — Growth Line pipeline (computed from existing FMF data)
 *
 * Each node's headline and status are auto-computed from content_history,
 * crm_contacts, sales_deals, experiences, experience_attendees, etc.
 * No manual data entry needed — the Growth Line reflects real business state.
 */

import { useNavigate } from 'react-router-dom'
import { PortalProvider, usePortal } from '../../context/PortalContext'
import { hapticLight, hapticSuccess } from '../../lib/haptics'

// Maps growth node keys to CRM/app routes for task navigation
const NODE_ROUTES = {
  awareness: '/crm/content-create',
  contact: '/crm/contacts',
  outreach: '/crm/warm-outreach',
  conversation: '/crm/email',
  qualified: '/crm/sales',
  meeting_booked: '/crm/sales',
  close: '/create/experience/new',
  onboard: '/crm/tools/systems',
  deliver: '/create',
  support: '/crm/warm-outreach',
  retain: '/create',
}

const STATUS_ICONS = {
  good: '✅',
  warn: '⚠️',
  bad: '❌',
}

const STATUS_LABELS = {
  good: 'On track',
  warn: 'Needs attention',
  bad: 'Blocked',
}

export default function GrowthDashboard({ runInTerminal }) {
  return (
    <PortalProvider>
      <GrowthDashboardInner runInTerminal={runInTerminal} />
    </PortalProvider>
  )
}

function GrowthDashboardInner({ runInTerminal }) {
  const {
    nodes, tasks, loading,
    selectedNode, selectedNodeKey, nodeTasks,
    selectNode, completeTask, reopenTask,
  } = usePortal()

  const navigate = useNavigate()

  if (loading) {
    return <div className="portal-empty"><div className="portal-empty-desc">Loading pipeline...</div></div>
  }

  if (nodes.length === 0) {
    return (
      <div className="portal-empty">
        <div className="portal-empty-title">Pipeline loading</div>
        <div className="portal-empty-desc">
          Start using the app — post content, add contacts, create experiences — and your pipeline will populate automatically.
        </div>
      </div>
    )
  }

  return (
    <div className="growth-dashboard">
      {/* Growth Line Pipeline */}
      <div className="growth-pipeline">
        <div className="pipeline-track">
          {nodes.map((node, i) => (
            <div key={node.key} style={{ display: 'flex', alignItems: 'center' }}>
              <div
                className={`pipeline-node${selectedNodeKey === node.key ? ' selected' : ''}`}
                onClick={() => { selectNode(node.key); hapticLight() }}
              >
                <div className={`pipeline-node-status ${node.status}`}>
                  {STATUS_ICONS[node.status] || '●'}
                </div>
                <div className="pipeline-node-label">{node.label}</div>
                <div className="pipeline-node-value">{node.headline_value}</div>
              </div>
              {i < nodes.length - 1 && <div className="pipeline-arrow">→</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Selected node detail */}
      {selectedNode && (
        <NodeDetail
          node={selectedNode}
          tasks={nodeTasks}
          onComplete={completeTask}
          onReopen={reopenTask}
          navigate={navigate}
          runInTerminal={runInTerminal}
        />
      )}
    </div>
  )
}

function NodeDetail({ node, tasks, onComplete, onReopen, navigate, runInTerminal }) {
  const openTasks = tasks.filter(t => t.status === 'open')
  const completedTasks = tasks.filter(t => t.status === 'completed')

  return (
    <div className="node-detail">
      <div className="node-detail-header">
        <div className="node-detail-title">{node.label}</div>
        <span className={`node-detail-status ${node.status}`}>
          {STATUS_LABELS[node.status] || node.status}
        </span>
      </div>

      {/* Headline metric */}
      <div className="node-detail-metrics">
        <div className="node-metric">
          <div className="node-metric-value">{node.headline_value}</div>
          <div className="node-metric-label">{node.headline_label}</div>
        </div>
      </div>

      {/* CRM link */}
      {NODE_ROUTES[node.key] && (
        <button
          className="task-action-btn"
          style={{ marginBottom: 12 }}
          onClick={() => navigate(NODE_ROUTES[node.key])}
        >
          Open {node.label} tools →
        </button>
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
              runInTerminal={runInTerminal}
              nodeKey={node.key}
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
              <div className="task-check done" onClick={() => onReopen(task.id)}>✓</div>
              <div className="task-info">
                <div className="task-title" style={{ textDecoration: 'line-through' }}>{task.title}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tasks.length === 0 && (
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', padding: '8px 0' }}>
          No tasks for {node.label} yet.
        </div>
      )}
    </div>
  )
}

function TaskCard({ task, onComplete, navigate, runInTerminal, nodeKey }) {
  const handleAction = () => {
    if (runInTerminal && task.message) {
      runInTerminal(task.message)
    } else if (NODE_ROUTES[nodeKey]) {
      navigate(NODE_ROUTES[nodeKey])
    } else if (task.message) {
      navigator.clipboard.writeText(task.message)
      hapticSuccess()
    }
  }

  const actionLabel = runInTerminal ? 'Run' : (NODE_ROUTES[nodeKey] ? 'Go' : 'Copy')

  return (
    <div className="task-card">
      <div className="task-check" onClick={() => { onComplete(task.id); hapticSuccess() }} />
      <div className="task-info">
        <div className="task-title">{task.title}</div>
        {task.message && <div className="task-message">{task.message}</div>}
      </div>
      {task.priority && (
        <span className={`task-priority ${task.priority}`}>
          {task.priority === 'today' ? 'Today' : task.priority === 'this_week' ? 'This week' : 'Later'}
        </span>
      )}
      <button className="task-action-btn" onClick={handleAction}>{actionLabel}</button>
    </div>
  )
}
