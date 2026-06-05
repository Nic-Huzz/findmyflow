/**
 * ExperiencePipeline.jsx — 5-node Growth Line for a specific experience
 *
 * Centered horizontal pipeline with readiness rings.
 * Click a node → expands PipelineNodeDetail below.
 * Works on mobile, web, and desktop.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useExperiencePipeline from '../../hooks/useExperiencePipeline'
import PipelineNodeDetail from './PipelineNodeDetail'
import MetricInputSheet from './MetricInputSheet'
import { hapticLight } from '../../lib/haptics'
import './pipeline.css'

export default function ExperiencePipeline({ experienceId, onBack }) {
  const { nodes, checklists, wahoos, experience, userId, loading, isModuleComplete, refresh } = useExperiencePipeline(experienceId)
  const [selectedKey, setSelectedKey] = useState(null)
  const [metricSheetNode, setMetricSheetNode] = useState(null)
  const navigate = useNavigate()

  if (loading) {
    return <div className="pl-loading">Loading pipeline...</div>
  }

  if (!experience) {
    return <div className="pl-loading">Experience not found</div>
  }

  const selectedNode = nodes.find(n => n.key === selectedKey)
  const daysUntil = experience.experience_date
    ? Math.ceil((new Date(experience.experience_date) - new Date()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div className="pl-container">
      {/* Top bar */}
      <div className="pl-topbar">
        <button className="pl-back" onClick={onBack}>←</button>
        <div className="pl-event-name">{experience.name}</div>
        <div className="pl-event-badge">
          {experience.status === 'upcoming' && daysUntil !== null
            ? (daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil} days`)
            : experience.status}
        </div>
      </div>

      {/* Mini conversion funnel */}
      {(() => {
        const attract = nodes.find(n => n.key === 'attract')
        const capture = nodes.find(n => n.key === 'capture')
        const convert = nodes.find(n => n.key === 'convert')
        const deliver = nodes.find(n => n.key === 'deliver')
        const a = Number(attract?.value) || 0
        const ca = Number(capture?.value) || 0
        const co = Number(convert?.value) || 0
        const d = deliver?.value && !isNaN(deliver.value) ? Number(deliver.value) : 0
        const hasData = a > 0 || ca > 0 || co > 0 || d > 0
        if (!hasData) return null
        const pct = (from, to) => from > 0 ? `${Math.round(to / from * 100)}%` : '—'
        return (
          <div className="pl-funnel">
            <div className="pl-funnel-step">
              <div className="pl-funnel-val">{a}</div>
              <div className="pl-funnel-label">reached</div>
            </div>
            <div className="pl-funnel-arrow">{pct(a, ca)}</div>
            <div className="pl-funnel-step">
              <div className="pl-funnel-val">{ca}</div>
              <div className="pl-funnel-label">clicked</div>
            </div>
            <div className="pl-funnel-arrow">{pct(ca, co)}</div>
            <div className="pl-funnel-step">
              <div className="pl-funnel-val">{co}</div>
              <div className="pl-funnel-label">bought</div>
            </div>
            {d > 0 && (
              <>
                <div className="pl-funnel-arrow">{pct(co, d)}</div>
                <div className="pl-funnel-step">
                  <div className="pl-funnel-val">{d}</div>
                  <div className="pl-funnel-label">showed up</div>
                </div>
              </>
            )}
          </div>
        )
      })()}

      {/* Pipeline nodes */}
      <div className="pl-track">
        {nodes.map((node, i) => {
          const circumference = 2 * Math.PI * 17
          const offset = circumference * (1 - node.readinessPercent / 100)

          return (
            <div key={node.key} style={{ display: 'flex', alignItems: 'center' }}>
              <div
                className={`pl-node${selectedKey === node.key ? ' selected' : ''}`}
                onClick={() => {
                  setSelectedKey(prev => prev === node.key ? null : node.key)
                  hapticLight()
                }}
              >
                <div className={`pl-ring ${node.status}`}>
                  {node.status === 'good' ? '✅' : node.status === 'warn' ? '⚠️' : node.status === 'bad' ? '❌' : '○'}
                  <svg viewBox="0 0 40 40">
                    <circle className="pl-ring-bg" cx="20" cy="20" r="17" />
                    <circle
                      className={`pl-ring-fill ${node.status}`}
                      cx="20" cy="20" r="17"
                      strokeDasharray={circumference}
                      strokeDashoffset={offset}
                    />
                  </svg>
                </div>
                <div className="pl-node-label">{node.label}</div>
                <div className="pl-node-value">{node.value}</div>
                <div className="pl-node-sub">{node.sublabel}</div>
              </div>
              {i < nodes.length - 1 && <div className="pl-arrow">→</div>}
            </div>
          )
        })}
      </div>

      {/* Expanded node detail */}
      {selectedNode && (
        <>
          <PipelineNodeDetail
            node={selectedNode}
            experience={experience}
            userId={userId}
            checklists={checklists}
            wahoos={wahoos}
            isModuleComplete={isModuleComplete}
            navigate={navigate}
            onUpdate={() => setMetricSheetNode(selectedNode.key)}
          />
        </>
      )}

      {/* Metric input bottom sheet */}
      {metricSheetNode && (
        <MetricInputSheet
          node={metricSheetNode}
          experienceId={experienceId}
          userId={userId}
          onSaved={refresh}
          onClose={() => setMetricSheetNode(null)}
        />
      )}
    </div>
  )
}
