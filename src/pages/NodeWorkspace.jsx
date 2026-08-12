/**
 * NodeWorkspace.jsx — Full-page workspace for a pipeline node
 *
 * Navigated to via /create/experience/:id/:nodeKey
 * Replaces the accordion expansion for experiences with checklist_version === 'nodes'.
 * Phase 1: Capture node fully implemented, others show placeholders.
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import useExperiencePipeline from '../hooks/useExperiencePipeline'
import { NODE_MODULES, NODE_META } from '../lib/pipelineConfig'
import { getNodeNudge } from '../lib/pipelineNudges'
import MetricInputSheet from '../components/pipeline/MetricInputSheet'
import { hapticLight } from '../lib/haptics'
import '../components/pipeline/pipeline.css'
import './NodeWorkspace.css'

const VALID_NODES = ['attract', 'capture', 'convert', 'deliver', 'grow']

export default function NodeWorkspace() {
  const { id, nodeKey } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const userId = user?.id
  const {
    nodes, checklists, wahoos, experience, loading, isModuleComplete, refresh
  } = useExperiencePipeline(id)
  const [metricSheetOpen, setMetricSheetOpen] = useState(false)

  // Redirect on invalid nodeKey or missing experience (via useEffect to avoid render-time navigate)
  const shouldRedirect = !VALID_NODES.includes(nodeKey) || (!loading && !experience)
  useEffect(() => {
    if (shouldRedirect) navigate(`/create/experience/${id}`, { replace: true })
  }, [shouldRedirect, id, navigate])

  if (shouldRedirect || loading) {
    return <div className="nw-page"><div className="nw-loading">Loading workspace...</div></div>
  }

  const node = nodes.find(n => n.key === nodeKey)
  const meta = NODE_META[nodeKey]

  function renderNodeContent() {
    return <NodeContent
      node={node}
      experience={experience}
      userId={userId}
      experienceId={id}
      isModuleComplete={isModuleComplete}
      wahoos={wahoos}
      checklists={checklists}
      navigate={navigate}
      nodeKey={nodeKey}
      onLogActivity={() => { hapticLight(); setMetricSheetOpen(true) }}
    />
  }

  return (
    <div className="nw-page">
      {/* Back button */}
      <button className="nw-back" onClick={() => { hapticLight(); navigate(`/create/experience/${id}`) }}>
        ← {experience?.name || 'Back'}
      </button>

      {/* Node header showing metric */}
      <div className="nw-header">
        <span className="nw-node-icon">{meta?.icon}</span>
        <div>
          <div className="nw-node-label">{meta?.label}</div>
          <div className="nw-node-value">
            {node?.value ?? '—'} <span>{meta?.sublabel}</span>
          </div>
        </div>
      </div>

      {/* Node content */}
      <div className="nw-content">
        {renderNodeContent()}
      </div>

      {/* MetricInputSheet overlay */}
      {metricSheetOpen && (
        <MetricInputSheet
          node={nodeKey}
          experienceId={id}
          userId={userId}
          onSaved={() => { refresh(); setMetricSheetOpen(false) }}
          onClose={() => setMetricSheetOpen(false)}
        />
      )}
    </div>
  )
}

/**
 * NodeContent — Generic workspace for any pipeline node.
 * Shows nudge, log activity button, and module cards from pipelineConfig.
 */
function NodeContent({ node, experience, userId, experienceId, isModuleComplete, wahoos, checklists, navigate, nodeKey, onLogActivity }) {
  const nudge = node ? getNodeNudge(node, experience, isModuleComplete, wahoos, checklists) : null
  const modules = (NODE_MODULES[nodeKey] || []).filter(m => !m.certification)

  return (
    <>
      {/* Nudge card */}
      {nudge && (
        <div className="nw-nudge">
          <div className="nw-nudge-text">{nudge.text}</div>
          {nudge.cta && (
            <button
              className="nw-nudge-cta"
              onClick={() => {
                hapticLight()
                if (nudge.route) navigate(nudge.route)
              }}
            >
              {nudge.cta} →
            </button>
          )}
        </div>
      )}

      {/* Log Activity button */}
      <button className="nw-log-btn" onClick={onLogActivity}>
        + Log Activity
      </button>

      {/* Modules section */}
      {modules.length > 0 && (
        <>
          <div className="nw-section-title">Modules</div>
          {modules.map(mod => {
            const done = isModuleComplete(mod.key)
            return (
              <div
                key={mod.key}
                className="pl-item"
                onClick={() => {
                  hapticLight()
                  const returnTo = `/create/experience/${experienceId}/${nodeKey}`
                  const sep = mod.route.includes('?') ? '&' : '?'
                  navigate(`${mod.route}${sep}experienceId=${experienceId}&returnTo=${returnTo}`)
                }}
              >
                <div className={`pl-ico ${done ? 'done' : 'todo'}`}>{mod.icon}</div>
                <div className="pl-txt">
                  <div className="pl-nm">{mod.name}</div>
                  <div className="pl-ds">{mod.desc}</div>
                </div>
                <div className={`pl-bg ${done ? 'done' : 'todo'}`}>
                  {done ? 'Done ✓' : 'Start'}
                </div>
              </div>
            )
          })}
        </>
      )}
    </>
  )
}
