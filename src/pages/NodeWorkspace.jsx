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
import InstagramPostSelector from '../components/pipeline/InstagramPostSelector'
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
    nodes, checklists, wahoos, rawMetrics, experience, loading, isModuleComplete, refresh
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
      rawMetrics={rawMetrics}
      navigate={navigate}
      nodeKey={nodeKey}
      onLogActivity={() => { hapticLight(); setMetricSheetOpen(true) }}
      refresh={refresh}
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
            {node?.value ?? '--'} <span>{meta?.sublabel}</span>
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
 * Shows nudge, log activity button, channel breakdown (attract),
 * Instagram tagging (attract), and module cards from pipelineConfig.
 */
function NodeContent({ node, experience, userId, experienceId, isModuleComplete, wahoos, checklists, rawMetrics, navigate, nodeKey, onLogActivity, refresh }) {
  const nudge = node ? getNodeNudge(node, experience, isModuleComplete, wahoos, checklists) : null
  const modules = (NODE_MODULES[nodeKey] || []).filter(m => !m.certification)
  const [showPostSelector, setShowPostSelector] = useState(false)

  // Channel breakdown for attract node
  const channelBreakdown = nodeKey === 'attract' ? buildChannelBreakdown(rawMetrics) : null

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

      {/* Channel breakdown (Attract only) */}
      {channelBreakdown && channelBreakdown.length > 0 && (
        <>
          <div className="nw-section-title">Performance by Channel</div>
          <div className="nw-channel-list">
            {channelBreakdown.map(ch => (
              <div key={ch.label} className="nw-channel-row">
                <div className="nw-channel-label">{ch.label}</div>
                <div className="nw-channel-stats">
                  {ch.stats.map(s => (
                    <span key={s.label} className="nw-channel-stat">
                      <strong>{s.value}</strong> {s.label}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Instagram tagging (Attract only) */}
      {nodeKey === 'attract' && (
        <>
          {node?.igPosts?.length > 0 && (
            <>
              <div className="nw-section-title">Tagged Posts ({node.igPosts.length})</div>
              {node.igPosts.map(post => (
                <div key={post.id} className="pl-item" style={{ cursor: 'default' }}>
                  <div className="pl-ico" style={{ fontSize: 14 }}>
                    {post.media_type === 'VIDEO' ? '🎬' : '📷'}
                  </div>
                  <div className="pl-txt">
                    <div className="pl-nm">{(post.reach || 0).toLocaleString()} reach</div>
                    <div className="pl-ds">{post.like_count || 0} likes · {post.comments_count || 0} comments</div>
                  </div>
                  {post.permalink && (
                    <a href={post.permalink} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 11, color: '#5e17eb', textDecoration: 'none' }}>↗</a>
                  )}
                </div>
              ))}
            </>
          )}
          <button
            className="nw-ig-tag-btn"
            onClick={() => { hapticLight(); setShowPostSelector(true) }}
          >
            📸 Tag Instagram Posts
          </button>
          {showPostSelector && (
            <InstagramPostSelector
              experienceId={experienceId}
              experienceName={experience?.name}
              onClose={() => setShowPostSelector(false)}
              onSave={() => { refresh(); setShowPostSelector(false) }}
            />
          )}
        </>
      )}

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

// Channel display labels
const CHANNEL_LABELS = {
  instagram: 'Instagram', tiktok: 'TikTok', youtube: 'YouTube', other_content: 'Other Content',
  personal_dms: 'Personal DMs', group_chats: 'Group Chats',
  posters: 'Posters', flyers: 'Flyer Handout', dms_personal: 'Personal DMs (Cold)',
  dms_group: 'Group Chat (Cold)', event_platform: 'Event Platform',
  meta: 'Meta (FB / IG)', google: 'Google Ads', tiktok_ads: 'TikTok Ads', other_ads: 'Other Ads',
}

// Metric display labels
const METRIC_LABELS = {
  posts: 'posts', reach: 'reach', dms_sent: 'sent', replies: 'replies',
  messages_sent: 'sent', spend: 'spend', clicks: 'clicks',
}

function buildChannelBreakdown(metrics) {
  const attractMetrics = (metrics || []).filter(m => m.node === 'attract' && m.channel)
  if (attractMetrics.length === 0) return []

  // Group by method + channel
  const groups = {}
  for (const m of attractMetrics) {
    const key = `${m.method}:${m.channel}`
    if (!groups[key]) groups[key] = { method: m.method, channel: m.channel, metrics: {} }
    groups[key].metrics[m.metric_key] = (groups[key].metrics[m.metric_key] || 0) + Number(m.metric_value || 0)
  }

  return Object.values(groups).map(g => ({
    label: CHANNEL_LABELS[g.channel] || g.channel,
    stats: Object.entries(g.metrics)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => ({ label: METRIC_LABELS[k] || k, value: v.toLocaleString() })),
  }))
}
