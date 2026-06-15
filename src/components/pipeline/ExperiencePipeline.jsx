/**
 * ExperiencePipeline.jsx — Vertical funnel for a specific experience
 *
 * 5 nodes stacked vertically: Attract → Capture → Convert → Deliver → Grow
 * Each node is a tappable row. Tapping expands PipelineNodeDetail below it.
 * Conversion funnel shows above when data exists.
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

  // Conversion funnel data
  const attract = nodes.find(n => n.key === 'attract')
  const capture = nodes.find(n => n.key === 'capture')
  const convert = nodes.find(n => n.key === 'convert')
  const deliver = nodes.find(n => n.key === 'deliver')
  const a = Number(attract?.value) || 0
  const ca = Number(capture?.value) || 0
  const co = Number(convert?.value) || 0
  const d = deliver?.value && !isNaN(deliver.value) ? Number(deliver.value) : 0
  const hasData = a > 0 || ca > 0 || co > 0 || d > 0
  const pct = (from, to) => from > 0 ? `${Math.round(to / from * 100)}%` : null

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

      {/* Mini conversion funnel (horizontal, only when data exists) */}
      {hasData && (
        <div className="pl-funnel">
          <div className="pl-funnel-step">
            <div className="pl-funnel-val">{a}</div>
            <div className="pl-funnel-label">reached</div>
          </div>
          {pct(a, ca) && <div className="pl-funnel-arrow">{pct(a, ca)}</div>}
          <div className="pl-funnel-step">
            <div className="pl-funnel-val">{ca}</div>
            <div className="pl-funnel-label">clicked</div>
          </div>
          {pct(ca, co) && <div className="pl-funnel-arrow">{pct(ca, co)}</div>}
          <div className="pl-funnel-step">
            <div className="pl-funnel-val">{co}</div>
            <div className="pl-funnel-label">bought</div>
          </div>
          {d > 0 && (
            <>
              {pct(co, d) && <div className="pl-funnel-arrow">{pct(co, d)}</div>}
              <div className="pl-funnel-step">
                <div className="pl-funnel-val">{d}</div>
                <div className="pl-funnel-label">showed up</div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Vertical funnel nodes */}
      <div className="pl-funnel-track">
        {nodes.map((node, i) => {
          const circumference = 2 * Math.PI * 17
          const offset = circumference * (1 - node.readinessPercent / 100)
          const isSelected = selectedKey === node.key
          const conversionRate = i > 0 ? (() => {
            const prev = nodes[i - 1]
            const prevVal = Number(prev?.value) || 0
            const curVal = Number(node.value) || 0
            return prevVal > 0 ? `${Math.round(curVal / prevVal * 100)}%` : null
          })() : null

          return (
            <div key={node.key}>
              {/* Connector line + conversion rate between nodes */}
              {i > 0 && (
                <div className="pl-connector">
                  <div className="pl-connector-line" />
                  {conversionRate && <span className="pl-connector-rate">{conversionRate}</span>}
                </div>
              )}

              {/* Node row */}
              <div
                className={`pl-vnode${isSelected ? ' selected' : ''}`}
                onClick={() => {
                  setSelectedKey(prev => prev === node.key ? null : node.key)
                  hapticLight()
                }}
              >
                <div className={`pl-ring ${node.status}`}>
                  <span className="pl-ring-icon">{node.status === 'good' ? '✅' : node.status === 'warn' ? '⚠️' : node.status === 'bad' ? '❌' : '○'}</span>
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

                <div className="pl-vnode-info">
                  <div className="pl-vnode-label">{node.label}</div>
                  <div className="pl-vnode-meta">
                    <span className="pl-vnode-value">{node.value}</span>
                    <span className="pl-vnode-sub">{node.sublabel}</span>
                  </div>
                </div>

                <div className="pl-vnode-right">
                  <div className={`pl-pill ${node.status}`}>{node.readinessPercent}%</div>
                  <span className={`pl-vnode-chevron${isSelected ? ' open' : ''}`}>›</span>
                </div>
              </div>

              {/* Expanded detail (accordion) */}
              {isSelected && selectedNode && (
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
              )}
            </div>
          )
        })}
      </div>

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
